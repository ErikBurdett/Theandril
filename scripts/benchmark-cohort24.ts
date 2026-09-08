/** One earned current-roster campaign; diagnostic geometry never enters AI input. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { cpus, platform, release, totalmem } from 'node:os';
import { dirname, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { aiObservationOptions, planTurn } from '@theandril/ai';
import { CONTENT_HASH, FACTIONS, FACTION_ROSTERS } from '@theandril/content';
import { GENERATOR_VERSION, neighbors, WATER_DEPTH } from '@theandril/mapgen';
import { applyCommand, createGame, deserializeGame, getObservation, SAVE_VERSION, serializeGame, stateHash, type CommandResult, type GameCommand, type GameState, type Observation } from '@theandril/sim';

assert.ok(process.argv.slice(2).every(argument => argument === '--output'), 'Only --output is supported.');
assert.equal(Number(SAVE_VERSION), 13); assert.equal(Number(GENERATOR_VERSION), 7);
assert.equal(CONTENT_HASH, '07a58d4f'); assert.equal(FACTIONS.length, 24);
assert.equal(FACTION_ROSTERS[4].length, 24);
const startedAt = new Date().toISOString(), overallStart = performance.now();
const sha = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex');
const settings = { seed: 74, size: 'standard', factionCount: 24, pace: 'standard', generatorVersion: 7, rosterVersion: 4, layout: 'continents' } as const;
const game = createGame(settings), initialSave = serializeGame(game), initialHash = stateHash(game);
assert.equal(new Set(game.factions.map(faction => faction.definitionId)).size, 24);
assert.equal(serializeGame(deserializeGame(initialSave)), initialSave);

/** Physical non-water components include mountain barriers: this classifies actual
 * ocean separation, not passable routes, and is used only to label outcomes. */
const components = new Int32Array(game.world.terrain.length);
let componentCount = 0;
for (let cell = 0; cell < components.length; cell++) if (game.world.terrain[cell] !== 0 && !components[cell]) {
  const id = ++componentCount, queue = [cell]; components[cell] = id;
  for (let cursor = 0; cursor < queue.length; cursor++) for (const next of neighbors(queue[cursor]!, game.world.width, game.world.height)) {
    if (game.world.terrain[next] !== 0 && !components[next]) { components[next] = id; queue.push(next); }
  }
}
const homelands = new Map(game.factions.map(faction => {
  const founder = Object.values(game.armies).find(army => army.factionId === faction.id && army.formations.some(formation => formation.unitId === 'unit.colonist'));
  assert.ok(founder); return [faction.id, components[founder.cell]!] as const;
}));
const contacts = new Map(game.factions.map(faction => [faction.id, new Set<string>()]));
const firstContact: Record<string, number> = {}, pairs = new Set<string>();
const commandTypes: Record<string, number> = {}, eventTypes: Record<string, number> = {};
const paidQueues: Record<string, number> = {};
const records: { command: GameCommand; result: CommandResult }[] = [];
const refusals: { turn: number; command: GameCommand; error: string | undefined }[] = [];
const transported = new Set<string>(), deepPassengers = new Set<string>();
const landings: { turn: number; factionId: string; armyId: string; cell: number; landmass: number; differentHomeland: boolean; deepVoyage: boolean }[] = [];
const colonies: { turn: number; factionId: string; armyId: string; cell: number; landmass: number; deepVoyage: boolean }[] = [];
let mirror: GameState | undefined, mirroredCommands = 0, rounds = 0;
let midpoint: { turn: number; hash: string; saveBytes: number } | null = null;
let abortReason: string | null = null;
const roundsMs: number[] = [], snapshots: ReturnType<typeof snapshot>[] = [];
const campaignStart = performance.now();

function observe(view: Observation) {
  for (const entity of [...view.armies, ...view.settlements]) if (entity.factionId !== view.factionId) {
    contacts.get(view.factionId)!.add(entity.factionId);
    firstContact[view.factionId] ??= view.turn;
    pairs.add([view.factionId, entity.factionId].sort().join('|'));
  }
}
function plan(factionId: string) {
  const view = getObservation(game, factionId, aiObservationOptions(game.turn)); observe(view);
  const commands = planTurn(view); assert.ok(commands.length <= 128);
  if (game.turn === 1 || game.turn === 61) assert.deepEqual(planTurn(view), commands, 'Repeated public plan changed.');
  return commands;
}
function submit(command: GameCommand) {
  const beforeCell = 'armyId' in command ? game.armies[command.armyId]?.cell : undefined;
  const result = applyCommand(game, command);
  records.push({ command: structuredClone(command), result: structuredClone(result) });
  commandTypes[command.type] = (commandTypes[command.type] ?? 0) + 1;
  if (!result.ok) refusals.push({ turn: game.turn, command, error: result.error });
  if (mirror) { assert.deepEqual(applyCommand(mirror, command), result, 'Restored continuation result differs.'); mirroredCommands++; }
  assert.ok(result.ok, `Turn ${game.turn}: ${JSON.stringify(command)}: ${result.error}`);
  for (const event of result.events) eventTypes[event.type] = (eventTypes[event.type] ?? 0) + 1;
  if (command.type === 'queue') paidQueues[command.itemId] = (paidQueues[command.itemId] ?? 0) + 1;
  if (command.type === 'embarkArmy') transported.add(command.armyId);
  for (const [armyId, fleetId] of Object.entries(game.transports)) {
    const fleet = game.armies[fleetId];
    if (fleet && game.world.waterDepth[fleet.cell] === WATER_DEPTH.deep) deepPassengers.add(armyId);
  }
  if (command.type === 'disembarkArmy') landings.push({ turn: game.turn, factionId: command.factionId, armyId: command.armyId,
    cell: command.target, landmass: components[command.target]!, differentHomeland: components[command.target] !== homelands.get(command.factionId), deepVoyage: deepPassengers.has(command.armyId) });
  if (command.type === 'found' && beforeCell !== undefined && transported.has(command.armyId) && components[beforeCell] !== homelands.get(command.factionId)) {
    colonies.push({ turn: game.turn, factionId: command.factionId, armyId: command.armyId, cell: beforeCell, landmass: components[beforeCell]!, deepVoyage: deepPassengers.has(command.armyId) });
  }
}
function settle() {
  for (let decision = 0; game.battle || game.pendingCapture; decision++) {
    assert.ok(decision < 4, 'Public battle/capture resolution exceeded four decisions.');
    const battle = game.battle;
    const controller = battle ? [battle.attackerFactionId, battle.defenderFactionId].includes(game.turnOwnerId) ? game.turnOwnerId : battle.attackerFactionId : game.pendingCapture!.factionId;
    const commands = plan(controller);
    assert.equal(commands.length, 1);
    assert.ok(commands[0]!.type === 'autoResolveBattle' || commands[0]!.type === 'resolveCapture');
    submit(commands[0]!);
  }
}
function snapshot() {
  for (const faction of game.factions) observe(getObservation(game, faction.id, { landDetails: 'none' }));
  const armies = Object.values(game.armies), towns = Object.values(game.settlements), formations = armies.flatMap(army => army.formations);
  const hulls = Object.fromEntries(['unit.transport', 'unit.coastal_warship', 'unit.ocean_warship'].map(id => [id, formations.filter(formation => formation.unitId === id).length]));
  return { completedRounds: rounds, turn: game.turn, factionsWithContact: contacts.size ? [...contacts.values()].filter(set => set.size).length : 0,
    contactPairs: pairs.size, settlements: towns.length, armies: armies.length, formations: formations.length, hullFormations: hulls,
    battlesStarted: eventTypes.battle_started ?? 0, battlesFinished: eventTypes.battle_finished ?? 0, landings: landings.length,
    overseasLandings: landings.filter(landing => landing.differentHomeland).length, overseasColonies: colonies.length,
    hash: stateHash(game), factions: game.factions.map(faction => ({ id: faction.id, definitionId: faction.definitionId,
      settlements: towns.filter(town => town.factionId === faction.id).length, treasury: faction.treasury,
      contacts: [...contacts.get(faction.id)!].sort(), firstContactTurn: firstContact[faction.id] ?? null })) };
}
snapshots.push(snapshot());
try {
  let limit = 60;
  while (rounds < limit && !game.victory) {
    const start = performance.now();
    for (const faction of game.factions) {
      if (game.victory) break;
      for (const command of plan(faction.id)) { if (game.victory) break; submit(command); settle(); }
    }
    if (!game.victory) { submit({ type: 'endTurn', factionId: game.turnOwnerId }); settle(); rounds++; }
    roundsMs.push(performance.now() - start);
    if (rounds === 30) { const saved = serializeGame(game); mirror = deserializeGame(saved); assert.equal(serializeGame(mirror), saved); midpoint = { turn: game.turn, hash: stateHash(game), saveBytes: Buffer.byteLength(saved) }; }
    if (rounds === 60 || rounds === 100) { snapshots.push(snapshot()); console.error(`Checkpoint ${rounds} rounds: ${snapshots.at(-1)!.factionsWithContact}/24 contact, ${snapshots.at(-1)!.settlements} towns.`); }
    // The user-authorized extension is optional; reserve time for exact replay.
    if (rounds === 60 && performance.now() - campaignStart < 30_000) limit = 100;
    if (rounds >= 60 && performance.now() - campaignStart >= 60_000) break;
  }
} catch (error) { abortReason = error instanceof Error ? error.message : String(error); }
const campaignMs = performance.now() - campaignStart;
const final = snapshot(), saved = serializeGame(game), finalHash = stateHash(game);
const loadStart = performance.now(), restored = deserializeGame(saved), loadMs = performance.now() - loadStart;
assert.equal(serializeGame(restored), saved); assert.equal(stateHash(restored), finalHash);
if (mirror) assert.equal(serializeGame(mirror), saved);
const replay = deserializeGame(initialSave), replayStart = performance.now(), digest = createHash('sha256');
for (const record of records) { assert.deepEqual(applyCommand(replay, record.command), record.result); digest.update(JSON.stringify(record)); }
const replayMs = performance.now() - replayStart;
assert.equal(serializeGame(replay), saved); assert.equal(stateHash(replay), finalHash);
const sorted = [...roundsMs].sort((a, b) => a - b);
const output = { schema: SAVE_VERSION, contentHash: CONTENT_HASH, generatorVersion: GENERATOR_VERSION, rosterVersion: 4, settings,
  startedAt, finishedAt: new Date().toISOString(), scriptSha256: sha(await readFile(fileURLToPath(import.meta.url))),
  environment: { node: process.version, cpu: cpus()[0]?.model, logicalCpus: cpus().length, os: `${platform()} ${release()}`, memoryBytes: totalmem(), finalRssBytes: process.memoryUsage().rss },
  completedRounds: rounds, finalTurn: game.turn, abortReason, victory: game.victory, initialHash, finalHash,
  commandCount: records.length, commandTypes, eventTypes, paidQueueOrders: paidQueues, commandRefusals: refusals,
  snapshots, final, landings, overseasColonies: colonies, physicalLandmassCount: componentCount,
  verification: { initialSaveExact: true, finalSaveExact: true, finalLoadedHash: stateHash(restored), fullReplayExact: true, replayHash: stateHash(replay),
    replayedCommands: records.length, commandResultSha256: digest.digest('hex'), midpoint, mirroredCommands,
    initialSaveBytes: Buffer.byteLength(initialSave), finalSaveBytes: Buffer.byteLength(saved), initialSaveSha256: sha(initialSave), finalSaveSha256: sha(saved) },
  timing: { campaignMs, replayMs, finalLoadMs: loadMs, overallMs: performance.now() - overallStart,
    roundMeanMs: roundsMs.reduce((a, b) => a + b, 0) / Math.max(1, roundsMs.length), roundP95Ms: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * .95))] ?? null },
  scope: 'One unmodified generated Standard24 seed74 campaign; ordinary AI-scoped observations, paid commands, one plan per seat/round and bounded public battle/capture replans. No grants/reveals/project suppression. Contacts mean a permitted foreign army/town was observed at a planning or reported checkpoint boundary, not omniscient registry presence. Physical-component labels are diagnostic-only; transported founders on another component count as overseas colonies. Hull counts are surviving formations, queues are paid orders not completions. Exact plain command/result replay from the initial save is verified; no chronicle archive export, storage or browser performance claim. Campaign timings include history copies, checkpoint reads and midpoint-mirror command execution; replay is separate. The reserved CPU window is a single observational run, not evidence of all-faction balance or 1.0 release.' };
if (process.argv.includes('--output')) {
  const path = resolve(dirname(fileURLToPath(import.meta.url)), '../docs/performance/0034-cohort24-campaign.json');
  await mkdir(dirname(path), { recursive: true }); await writeFile(path, JSON.stringify(output, null, 2) + '\n', { flag: 'wx' });
}
console.log(JSON.stringify(output, null, 2));
if (abortReason || refusals.length || rounds < 60) process.exitCode = 1;
