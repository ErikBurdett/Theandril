/** Rule-17 development runner, adapted from the immutable audit harness. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { appendFileSync, mkdirSync, readFileSync, writeFileSync, createReadStream, copyFileSync, existsSync } from 'node:fs';
import { cpus, platform, release } from 'node:os';
import { resolve, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createInterface } from 'node:readline';
import { gzipSync } from 'node:zlib';
import { aiObservationOptions, planTurnWithReasons } from '@theandril/ai';
import { CONTENT_HASH, TECHNOLOGIES, UNITS } from '@theandril/content';
import { GENERATOR_VERSION } from '@theandril/mapgen';
import { applyCommand, createGame, deserializeGame, getObservation, serializeGame, stateHash, SAVE_VERSION, type GameCommand, type GameState, type Observation, type NewGameOptions } from '@theandril/sim';

const args = Object.fromEntries(process.argv.slice(2).map(arg => { const m = /^--([\w-]+)=(.+)$/.exec(arg); assert.ok(m, 'Use --name=value'); return [m[1], m[2]]; }));
const name = args.name; assert.ok(name && /^[\w-]+$/.test(name));
const strategy = args.strategy ?? 'D'; assert.ok(['B', 'C', 'D'].includes(strategy));
const settings: NewGameOptions = { seed: Number(args.seed ?? 74), size: (args.size ?? 'tiny') as NewGameOptions['size'], factionCount: Number(args.factions ?? 4), pace: (args.pace ?? 'standard') as NewGameOptions['pace'], generatorVersion: 7, rosterVersion: 4, rulesVersion: 17 };
const maxRounds = Number(args.rounds ?? 300), maxMs = Number(args['max-ms'] ?? 600000), midpointRound = Number(args.midpoint ?? 100);
assert.ok(Number.isInteger(maxRounds) && maxRounds >= 1 && maxRounds <= 2000);
assert.equal(Number(SAVE_VERSION), 17); assert.equal(Number(GENERATOR_VERSION), 7);
const out = resolve('docs/development/campaigns', name); mkdirSync(out, { recursive: true });
const tracePath = resolve(out, 'commands.jsonl'); writeFileSync(tracePath, '', { flag: 'wx' });
const sha = (s: string | Uint8Array) => createHash('sha256').update(s).digest('hex');
const startedAt = new Date().toISOString(), start = performance.now();
const sourceRoots = ['packages/sim/src', 'packages/ai/src', 'packages/content/src', 'packages/mapgen/src'];
const sourcePaths = [...new Set([
  ...execFileSync('git', ['ls-files', ...sourceRoots], { encoding: 'utf8' }).trim().split('\n'),
  ...execFileSync('git', ['ls-files', '--others', '--exclude-standard', ...sourceRoots], { encoding: 'utf8' }).trim().split('\n'),
])].filter(path => /\.(ts|json)$/.test(path) && !path.includes('.test.') && !path.includes('/fixtures/')).sort();
const sourceHashes = Object.fromEntries(sourcePaths.map(path => {
  const target = resolve(out, 'source', path); mkdirSync(dirname(target), { recursive: true });
  const bytes = readFileSync(path); copyFileSync(path, target); return [path, sha(bytes)];
}));
writeFileSync(resolve(out, 'source-manifest.json'), JSON.stringify(sourceHashes, null, 2) + '\n');
const game = createGame(settings), initial = serializeGame(game), initialHash = stateHash(game);
writeFileSync(resolve(out, 'initial.json.gz'), gzipSync(initial));
assert.equal(serializeGame(deserializeGame(initial)), initial);
const custom = strategy === 'D' ? null : await import('../hermes-analysis/campaigns/strategies.js');
const count: Record<string, number> = {}, events: Record<string, number> = {}, paidQueues: Record<string, number> = {};
const refusals: unknown[] = [], battleIds = new Set<string>(), captures: unknown[] = [], battles: unknown[] = [];
const contacts = new Map(game.factions.map(f => [f.id, new Set<string>()]));
const firstContacts: Record<string, number> = {}, contactPairs = new Set<string>();
const firstResearchSaturation: Record<string, number> = {};
const positions = new Map<string, number[]>(), movement = new Map<string, { orders: number; moved: number; twoStepReturns: number; noChangeOrders: number }>();
let sequence = 0, rounds = 0, mirror: GameState | undefined, mirroredCommands = 0, abortReason: string | null = null;
let midpoint: unknown = null;
const verificationErrors: unknown[] = [];
const checkpoints: unknown[] = [], roundTimes: number[] = [];
const traceDigest = createHash('sha256');
function writeJson(file: string, data: unknown) { writeFileSync(resolve(out, file), JSON.stringify(data, null, 2) + '\n'); }
function observe(view: Observation) {
  for (const entity of [...view.armies, ...view.settlements]) if (entity.factionId !== view.factionId) {
    if (!contacts.get(view.factionId)!.has(entity.factionId)) {
      appendFileSync(resolve(out, 'contacts.jsonl'), JSON.stringify({ turn: view.turn, observer: view.factionId, encountered: entity.factionId, entityId: entity.id, cell: entity.cell }) + '\n');
      contacts.get(view.factionId)!.add(entity.factionId); firstContacts[view.factionId] ??= view.turn;
      contactPairs.add([view.factionId, entity.factionId].sort().join('|'));
    }
  }
}
function plan(factionId: string) {
  const view = getObservation(game, factionId, aiObservationOptions(game.turn)); observe(view);
  const controlled = strategy !== 'D' && factionId === game.turnOwnerId;
  const planned = controlled ? custom!.planStrategy(view, strategy as 'B' | 'C') : planTurnWithReasons(view);
  assert.ok(planned.commands.length <= 128);
  if ([1, 30, 60, 100, 200, 300, 500, 800, 1000].includes(game.turn)) {
    const repeated = controlled ? custom!.planStrategy(structuredClone(view), strategy as 'B' | 'C') : planTurnWithReasons(structuredClone(view));
    assert.deepEqual(repeated, planned);
  }
  appendFileSync(resolve(out, 'plans.jsonl'), JSON.stringify({ turn: game.turn, factionId, policy: controlled ? strategy : 'D', ...planned }) + '\n');
  return planned.commands;
}
function submit(command: GameCommand) {
  const turn = game.turn, cell = 'armyId' in command ? game.armies[command.armyId]?.cell : undefined;
  const result = applyCommand(game, command);
  const record = { sequence: ++sequence, turn, command, result }; const line = JSON.stringify(record) + '\n';
  appendFileSync(tracePath, line); traceDigest.update(line);
  count[command.type] = (count[command.type] ?? 0) + 1;
  if (!result.ok) refusals.push(record);
  if (mirror) { assert.deepEqual(applyCommand(mirror, command), result, 'Midpoint save continuation differs'); mirroredCommands++; }
  for (const event of result.events) {
    events[event.type] = (events[event.type] ?? 0) + 1;
    if (event.type !== 'turn_started' && event.type !== 'turn_ended') appendFileSync(resolve(out, 'events.jsonl'), JSON.stringify({ sequence, event }) + '\n');
  }
  if (result.ok && ['attack', 'assault', 'battleOrder', 'autoResolveBattle', 'resolveCapture'].includes(command.type)) {
    const snapshot = serializeGame(game);
    try { assert.equal(serializeGame(deserializeGame(snapshot)), snapshot); }
    catch (error) {
      writeFileSync(resolve(out, `failed-boundary-${sequence}.json.gz`), gzipSync(snapshot));
      throw new Error(`Accepted ${command.type} at sequence ${sequence} cannot round-trip: ${String(error)}`);
    }
  }
  if (result.ok && command.type === 'queue') paidQueues[command.itemId] = (paidQueues[command.itemId] ?? 0) + 1;
  if (result.ok && command.type === 'resolveCapture') {
    const capture = { sequence, turn, command, events: result.events, settlementAfter: game.settlements[command.settlementId] ?? null };
    captures.push(capture); appendFileSync(resolve(out, 'captures.jsonl'), JSON.stringify(capture) + '\n');
  }
  if (result.events.some(e => e.type === 'battle_finished')) for (const report of game.battleReports) if (!battleIds.has(report.id)) {
    battleIds.add(report.id);
    const summary = { id: report.id, turn: report.turn, domain: report.domain, settlementId: report.settlementId, attackerFactionId: report.attackerFactionId, defenderFactionId: report.defenderFactionId, result: report.combat.result, initialStrengths: report.initialStrengths, aftermath: report.aftermath, usedAbilities: report.usedAbilities, characterAftermath: report.characterAftermath };
    battles.push(summary); appendFileSync(resolve(out, 'battles.jsonl'), JSON.stringify({ sequence, ...report }) + '\n');
  }
  if (result.ok && ['move', 'moveTo', 'queueMovement'].includes(command.type) && 'armyId' in command) {
    const m = movement.get(command.armyId) ?? { orders: 0, moved: 0, twoStepReturns: 0, noChangeOrders: 0 }; m.orders++;
    const after = game.armies[command.armyId]?.cell;
    if (cell !== after) m.moved++; else m.noChangeOrders++;
    movement.set(command.armyId, m);
  }
}
function settle() {
  for (let i = 0; game.battle || game.pendingCapture; i++) {
    assert.ok(i < 4, 'Decision resolution bound exceeded');
    const b = game.battle;
    const id = b ? [b.attackerFactionId, b.defenderFactionId].includes(game.turnOwnerId) ? game.turnOwnerId : b.attackerFactionId : game.pendingCapture!.factionId;
    const commands = plan(id); assert.equal(commands.length, 1);
    assert.ok(['autoResolveBattle', 'resolveCapture'].includes(commands[0]!.type)); submit(commands[0]!);
  }
}
function snapshot(full = false) {
  const towns = Object.values(game.settlements), armies = Object.values(game.armies), formations = armies.flatMap(a => a.formations);
  const factions = game.factions.map(f => {
    const ownTowns = towns.filter(t => t.factionId === f.id), ownArmies = armies.filter(a => a.factionId === f.id), progress = game.progression[f.id]!;
    const view = getObservation(game, f.id, { landDetails: 'none' }); observe(view);
    if (progress.technologies.length === TECHNOLOGIES.length) firstResearchSaturation[f.id] ??= game.turn;
    return { id: f.id, definitionId: f.definitionId, treasury: f.treasury, knowledge: f.knowledge, settlements: ownTowns.length, population: ownTowns.reduce((n, t) => n + t.population, 0), maxPopulation: Math.max(0, ...ownTowns.map(t => t.population)), armies: ownArmies.length, formations: ownArmies.reduce((n, a) => n + a.formations.length, 0), technologies: progress.technologies, institution: progress.institutionId, doctrine: progress.doctrineId, arcaneResearch: game.arcaneResearch[f.id], resources: view.resources, economy: view.growth?.economy, contacts: [...contacts.get(f.id)!].sort(), firstContactTurn: firstContacts[f.id] ?? null, exploredCells: game.explored[f.id]?.size, characters: Object.values(game.characters).filter(c => c.factionId === f.id).map(c => ({ id: c.id, definitionId: c.definitionId, dead: c.dead, woundedTurns: c.woundedTurns, location: c.location, experience: c.experience, skills: c.learnedSkillIds, aptitudes: c.aptitudes })), claimed: Object.entries(game.land.settlements).filter(([id]) => game.settlements[id]?.factionId === f.id).reduce((n, [, l]) => n + l.claimed.length, 0), worked: Object.entries(game.land.settlements).filter(([id]) => game.settlements[id]?.factionId === f.id).reduce((n, [, l]) => n + l.worked.length, 0) };
  });
  const data = { turn: game.turn, completedRounds: rounds, hash: full ? stateHash(game) : undefined, settlements: towns.length, population: towns.reduce((n, t) => n + t.population, 0), armies: armies.length, formations: formations.length, hulls: formations.filter(f => UNITS.find(u => u.id === f.unitId)?.movementDomain === 'naval').length, wars: game.wars, uniqueBattles: battleIds.size, captures: captures.length, factionsWithContact: [...contacts.values()].filter(c => c.size).length, contactPairs: contactPairs.size, projects: game.projects, victory: game.victory, factions };
  appendFileSync(resolve(out, 'metrics.jsonl'), JSON.stringify(data) + '\n');
  const trajectory = armies.map(a => {
    const history = positions.get(a.id) ?? []; const prev = history.at(-1), two = history.at(-2);
    if (two === a.cell && prev !== a.cell) { const m = movement.get(a.id) ?? { orders: 0, moved: 0, twoStepReturns: 0, noChangeOrders: 0 }; m.twoStepReturns++; movement.set(a.id, m); }
    history.push(a.cell); positions.set(a.id, history.slice(-2));
    return { id: a.id, factionId: a.factionId, cell: a.cell, movement: a.movement, formations: a.formations.length, strength: a.formations.reduce((n, f) => n + f.strength, 0), carrierId: game.transports[a.id] ?? null };
  });
  appendFileSync(resolve(out, 'positions.jsonl'), JSON.stringify({ turn: game.turn, armies: trajectory }) + '\n');
  if (full) {
    checkpoints.push(data); const saved = serializeGame(game);
    writeFileSync(resolve(out, `turn-${game.turn}.json.gz`), gzipSync(saved));
    console.log(JSON.stringify({ checkpoint: game.turn, rounds, hash: data.hash, towns: data.settlements, battles: data.uniqueBattles, captures: data.captures, contact: data.factionsWithContact, victory: game.victory, elapsedMs: Math.round(performance.now() - start) }));
  }
  return data;
}
snapshot(true);
try {
  while (rounds < maxRounds && !game.victory) {
    if (performance.now() - start > maxMs) { abortReason = `Campaign wall-time budget ${maxMs}ms reached at complete round ${rounds}`; break; }
    const t = performance.now();
    for (const faction of game.factions) {
      if (game.victory) break;
      for (const command of plan(faction.id)) { if (game.victory) break; submit(command); settle(); }
    }
    if (!game.victory) { submit({ type: 'endTurn', factionId: game.turnOwnerId }); settle(); rounds++; }
    roundTimes.push(performance.now() - t);
    if (rounds === midpointRound) {
      const saved = serializeGame(game);
      midpoint = { turn: game.turn, completedRounds: rounds, commandSequence: sequence, hash: stateHash(game), saveSha256: sha(saved), bytes: Buffer.byteLength(saved) };
      writeFileSync(resolve(out, 'midpoint.json.gz'), gzipSync(saved));
      try { mirror = deserializeGame(saved); assert.equal(serializeGame(mirror), saved); }
      catch (error) { verificationErrors.push({ stage: 'midpoint-load', turn: game.turn, error: String(error) }); console.error(`Midpoint load FAILED (recorded; continuing original canonical state): ${error}`); }
    }
    snapshot([30, 60, 100, 200, 300, 500, 800, 1000, 1200, 1400].includes(game.turn) || Boolean(game.victory));
  }
} catch (error) { abortReason = error instanceof Error ? error.stack ?? error.message : String(error); console.error(abortReason); }
const campaignMs = performance.now() - start, final = snapshot(true), saved = serializeGame(game), finalHash = stateHash(game);
writeFileSync(resolve(out, 'final.json.gz'), gzipSync(saved));
writeJson('refusals.json', refusals); writeJson('battle-summary.json', battles); writeJson('capture-summary.json', captures);
let verification: Record<string, unknown> = { initialSaveExact: true, midpoint, mirroredCommands, errors: verificationErrors };
try {
  const restore = deserializeGame(saved); assert.equal(stateHash(restore), finalHash); assert.equal(serializeGame(restore), saved);
  if (mirror) { assert.equal(stateHash(mirror), finalHash); assert.equal(serializeGame(mirror), saved); }
  verification.finalSaveExact = true; verification.midpointFinalExact = Boolean(mirror);
} catch (error) { verification.finalSaveExact = false; verificationErrors.push({ stage: 'final-load', turn: game.turn, error: String(error) }); }
try {
  const replayStart = performance.now(), replay = deserializeGame(initial); let replayed = 0, immutableRefusals = 0;
  for await (const line of createInterface({ input: createReadStream(tracePath), crlfDelay: Infinity })) {
    const r = JSON.parse(line); const before = !r.result.ok ? stateHash(replay) : null;
    assert.deepEqual(applyCommand(replay, r.command), r.result, `Replay differs at command ${r.sequence}`);
    if (before) { assert.equal(stateHash(replay), before, `Rejected command ${r.sequence} mutated state`); immutableRefusals++; } replayed++;
  }
  assert.equal(stateHash(replay), finalHash); assert.equal(serializeGame(replay), saved);
  verification = { ...verification, replayedCommands: replayed, replayExact: true, replayHash: stateHash(replay), immutableRefusals, replayMs: performance.now() - replayStart };
} catch (error) { verification.replayExact = false; verificationErrors.push({ stage: 'replay', error: String(error) }); }
writeFileSync(resolve(out, 'commands.jsonl.gz'), gzipSync(readFileSync(tracePath)));
const sorted = [...roundTimes].sort((a, b) => a - b);
const sourceChangesDuringRun = sourcePaths.filter(path => !existsSync(path) || sha(readFileSync(path)) !== sourceHashes[path]);
const summary = { sourceChangesDuringRun, sourceManifestSha256: sha(JSON.stringify(sourceHashes)), acceptedBattleBoundaryRoundTrips: !abortReason, name, strategy, settings, controlledFactionId: strategy === 'D' ? null : game.turnOwnerId, setup: 'Generated rules17/schema17/generator7/roster4 on the modified engine. Separate from historical audit scenarios. B/C only control turn-owner seat; all opponents are ordinary production AI. No grants, terrain edits, fog reveals, hidden input, or disabled project rules. Diagnostic canonical observations never enter policies.', schema: SAVE_VERSION, contentHash: CONTENT_HASH, generator: GENERATOR_VERSION, startedAt, finishedAt: new Date().toISOString(), harnessSha256: sha(readFileSync(new URL(import.meta.url))), strategySha256: custom ? sha(readFileSync(new URL('../hermes-analysis/campaigns/strategies.ts', import.meta.url))) : null, baseline: 'b0a4cd86cdb30cd9e2d3a1f0c8a78da38f7987cd', environment: { node: process.version, cpu: cpus()[0]?.model, logicalCpus: cpus().length, os: `${platform()} ${release()}`, finalRssBytes: process.memoryUsage().rss }, rounds, finalTurn: game.turn, maxRounds, abortReason, victory: game.victory, initialHash, finalHash, initialSaveSha256: sha(initial), finalSaveSha256: sha(saved), commandResultSha256: traceDigest.digest('hex'), commandCount: sequence, commandTypes: count, rawEventCounts: events, uniqueBattleCount: battleIds.size, captureDecisionCount: captures.length, paidQueues, refusalCount: refusals.length, firstContacts, firstResearchSaturation, movement: Object.fromEntries(movement), checkpoints, final, verification, timing: { campaignMs, totalMs: performance.now() - start, rounds: roundTimes.length, meanRoundMs: roundTimes.reduce((n, x) => n + x, 0) / Math.max(1, roundTimes.length), p95RoundMs: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * .95))] ?? 0, maxRoundMs: sorted.at(-1) ?? 0, note: 'Exploratory concurrent timings include disk trace, per-turn diagnostics, snapshot compression and midpoint mirror. Not isolated performance certification.' } };
writeJson('summary.json', summary); console.log(JSON.stringify({ name, finalTurn: game.turn, rounds, finalHash, victory: game.victory, commands: sequence, uniqueBattles: battleIds.size, captures: captures.length, refusals: refusals.length, verification, abortReason, campaignMs }));
if (abortReason || verificationErrors.length || sourceChangesDuringRun.length) process.exitCode = 1;
