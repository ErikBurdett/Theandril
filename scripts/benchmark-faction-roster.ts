import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cpus, platform, release, totalmem } from 'node:os';
import { performance } from 'node:perf_hooks';
import { gunzipSync } from 'node:zlib';
import { CONTENT_HASH, FACTIONS, FACTION_RECRUITMENT_WEIGHTS, FACTION_ROSTERS } from '@theandril/content';
import { planTurn } from '@theandril/ai';
import { applyCommand, createGame, deserializeGame, getObservation, SAVE_VERSION, serializeGame, serializeGameForVersion, stateHash, stateHashForVersion, type CommandResult, type GameCommand, type GameState, type Observation } from '@theandril/sim';
import capturedPack from '../packages/chronicle/src/fixtures/v9-archives.json';

const EXPECTED_CONTENT = '4c2fed32';
assert.equal(Number(SAVE_VERSION), 10, 'Do not silently compare a new schema against this roster workload.');
assert.equal(CONTENT_HASH, EXPECTED_CONTENT, 'Review and reseal the workload before measuring changed content.');
assert.equal(FACTIONS.length, 12); assert.deepEqual(FACTION_ROSTERS[3], FACTIONS.map(faction => faction.id));
assert.ok(process.argv.slice(2).every(argument => argument === '--smoke'), 'Only --smoke is supported.');
const smoke = process.argv.includes('--smoke'), samples = smoke ? 2 : 20, warmups = smoke ? 0 : 4;
const startedAt = new Date().toISOString(), started = performance.now();
const sha256 = (text: string) => createHash('sha256').update(text).digest('hex');
const bytes = (value: unknown) => Buffer.byteLength(JSON.stringify(value));
const landCommands = new Set(['claimCell', 'setWorkedTiles', 'improveTile', 'terraformTile', 'cancelLandWork', 'setCapital']);
function timed<T>(operation: () => T) { const before = performance.now(), result = operation(); return { result, ms: performance.now() - before }; }
function distribution(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return { samples: sorted.length, meanMs: sorted.length ? sorted.reduce((sum, value) => sum + value, 0) / sorted.length : null,
    medianMs: sorted[Math.floor(sorted.length / 2)] ?? null, p95Ms: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * .95))] ?? null, maxMs: sorted.at(-1) ?? null };
}
function measure<T>(operation: () => T) {
  const durations: number[] = []; let result: T | undefined, first = '';
  for (let sample = -warmups; sample < samples; sample++) {
    const measured = timed(operation); result = measured.result;
    // Deterministic equality checks are outside every reported timed interval.
    const text = JSON.stringify(result);
    if (sample === -warmups) first = text; else assert.equal(text, first, 'Repeated public read/planning output changed.');
    if (sample >= 0) durations.push(measured.ms);
  }
  return { result: result!, timing: distribution(durations) };
}
function strictRestore(game: GameState) {
  const saved = serializeGame(game), header = JSON.parse(saved) as { version: number; contentHash: string };
  assert.equal(header.version, 10); assert.equal(header.contentHash, EXPECTED_CONTENT);
  const restored = deserializeGame(saved);
  assert.equal(stateHash(restored), stateHash(game)); assert.equal(serializeGame(restored), saved);
  return restored;
}
function issue(game: GameState, command: GameCommand): CommandResult {
  const result = applyCommand(game, command);
  assert.ok(result.ok, `Turn ${game.turn}: ${JSON.stringify(command)}: ${result.error}`);
  return result;
}
function physicalSeal(game: GameState) {
  const world = game.world, digest = createHash('sha256');
  digest.update(JSON.stringify({ seed: world.seed, width: world.width, height: world.height, generatorVersion: world.generatorVersion }));
  for (const array of [world.terrain, world.biome, world.fertility, world.waterDepth]) digest.update(array);
  return digest.digest('hex');
}
function counts(game: GameState) {
  const armies = Object.values(game.armies), land = Object.values(game.land.settlements);
  return { turn: game.turn, cells: game.world.terrain.length, seats: game.factions.length, distinctCultures: new Set(game.factions.map(faction => faction.definitionId)).size,
    armies: armies.length, formations: armies.reduce((sum, army) => sum + army.formations.length, 0), settlements: Object.keys(game.settlements).length,
    characters: Object.keys(game.characters).length, claimed: land.reduce((sum, town) => sum + town.claimed.length, 0), worked: land.reduce((sum, town) => sum + town.worked.length, 0),
    improvements: land.reduce((sum, town) => sum + Object.keys(town.improvements).length, 0), cultivatedCells: Object.keys(game.land.biomes).length,
    pendingLandWorks: land.filter(town => town.work).length, retainedBattleReports: game.battleReports.length };
}
function observedCounts(view: Observation) {
  return { permittedCells: view.cells.length, knownSeats: view.factions.length, ownArmies: view.armies.filter(army => army.factionId === view.factionId).length,
    observedArmies: view.armies.length, ownSettlements: view.settlements.filter(town => town.factionId === view.factionId).length, observedSettlements: view.settlements.length,
    productionOptions: view.productionOptions.length, canQueue: view.productionOptions.filter(option => option.canQueue).length, readBytes: bytes(view) };
}

/** Compare with actual pre-change evidence, never a newly invented historical golden. */
function historicalOrigins() {
  assert.equal(capturedPack.encoding, 'gzip-base64');
  const captured = JSON.parse(gunzipSync(Buffer.from(capturedPack.payload, 'base64')).toString('utf8')) as {
    saveVersion: number; contentHash: string; provenance: string;
    sixOrigin: { save: string; hash: string }; eightOrigin: { save: string; hash: string };
  };
  assert.equal(captured.saveVersion, 9); assert.equal(captured.contentHash, '9418e598');
  return ([
    ['sixOrigin', 20260905, 6, 'faction.reedbound_council', '1754cd12', '9c4b384c770a8c58c58e7fd88875fafaa14270d6ce2b081337efe55de225f1a6'],
    ['eightOrigin', 74, 8, 'faction.sepulchral_synod', '58aa6b37', '4068929b80330f93c410d6076a0e739c8e768156f576a72c2cff03113b0f36eb'],
  ] as const).map(([name, seed, factionCount, factionDefinitionId, oldHash, oldSha256]) => {
    const previous = captured[name], restored = deserializeGame(previous.save);
    assert.equal(sha256(previous.save), oldSha256); assert.equal(previous.hash, oldHash);
    assert.equal(restored.rosterVersion, 2); assert.equal(stateHashForVersion(restored, 9), oldHash);
    const regenerated = createGame({ seed, size: 'tiny', pace: 'short', factionCount, factionDefinitionId, generatorVersion: 4, rosterVersion: 2 });
    assert.equal(serializeGameForVersion(regenerated, 9), previous.save);
    assert.equal(physicalSeal(restored), physicalSeal(regenerated));
    assert.deepEqual(restored.world.starts, regenerated.world.starts);
    return { name, seed, seats: factionCount, distinctCultures: new Set(restored.factions.map(faction => faction.definitionId)).size,
      rosterVersion: 2, generatorVersion: 4, oldSaveVersion: 9, oldContentHash: '9418e598', oldHash, oldSaveSha256: oldSha256,
      modernHash: stateHash(restored), physicalSha256: physicalSeal(restored), provenance: captured.provenance,
      note: 'Exact initial saved bytes regenerated from frozen roster2 and compared with genuine pre-change schema9 evidence. No timing or modern AI-equivalence claim.' };
  });
}

function generatedCampaign() {
  const rounds = smoke ? 8 : 100;
  const creation = timed(() => createGame({ seed: 748291, size: 'tiny', factionCount: 12, pace: 'epic', rosterVersion: 3 }));
  const game = creation.result, initial = serializeGame(game), initialCounts = counts(game);
  assert.equal(initialCounts.distinctCultures, 12); strictRestore(game);
  const history: { command: GameCommand; result: CommandResult }[] = [];
  const commandTypes: Record<string, number> = {}, eventTypes: Record<string, number> = {};
  const recruitment: Record<string, Record<string, number>> = Object.fromEntries(FACTIONS.map(faction => [faction.id, {}]));
  const landOrdersByCulture: Record<string, number> = {}, firstVisibleContactTurn: Record<string, number> = {}, contacts = new Set<string>();
  const observationMs: number[] = [], planningMs: number[] = [], commandMs: number[] = [], endTurnMs: number[] = [], roundsMs: number[] = [];
  let mirror: GameState | undefined, midpoint: { turn: number; hash: string; saveBytes: number } | undefined;
  let mirroredCommands = 0, rejectedCommands = 0, roundObservationMs = 0, roundPlanningMs = 0, roundCommandMs = 0;
  function plan(factionId: string) {
    const observed = timed(() => getObservation(game, factionId)), planned = timed(() => planTurn(observed.result));
    roundObservationMs += observed.ms; roundPlanningMs += planned.ms;
    const view = observed.result;
    for (const entity of [...view.armies, ...view.settlements]) if (entity.factionId !== factionId) {
      contacts.add([factionId, entity.factionId].sort().join('|'));
      firstVisibleContactTurn[factionId] ??= game.turn;
    }
    assert.deepEqual(planTurn(getObservation(game, factionId)), planned.result);
    if (mirror) assert.deepEqual(planTurn(getObservation(mirror, factionId)), planned.result, 'Midpoint-restored AI plan differs.');
    return planned.result;
  }
  function submit(command: GameCommand) {
    const applied = timed(() => applyCommand(game, command));
    if (command.type !== 'endTurn') roundCommandMs += applied.ms;
    commandTypes[command.type] = (commandTypes[command.type] ?? 0) + 1;
    if (!applied.result.ok) rejectedCommands++;
    assert.ok(applied.result.ok, `${JSON.stringify(command)}: ${applied.result.error}; rejected=${rejectedCommands}`);
    if (mirror) { assert.deepEqual(issue(mirror, command), applied.result); mirroredCommands++; }
    for (const event of applied.result.events) eventTypes[event.type] = (eventTypes[event.type] ?? 0) + 1;
    const culture = game.factions.find(faction => faction.id === command.factionId)!.definitionId;
    if (command.type === 'queue' && command.itemId.startsWith('unit.')) recruitment[culture]![command.itemId] = (recruitment[culture]![command.itemId] ?? 0) + 1;
    if (landCommands.has(command.type)) landOrdersByCulture[culture] = (landOrdersByCulture[culture] ?? 0) + 1;
    history.push({ command: structuredClone(command), result: structuredClone(applied.result) });
    return applied.ms;
  }
  function settle() {
    for (let decision = 0; game.battle || game.pendingCapture; decision++) {
      assert.ok(decision < 5, 'Battle/capture decisions exceeded the bounded public resolution loop.');
      const battle = game.battle;
      const controller = battle ? [battle.attackerFactionId, battle.defenderFactionId].includes(game.turnOwnerId) ? game.turnOwnerId : battle.attackerFactionId : game.pendingCapture!.factionId;
      const commands = plan(controller);
      assert.equal(commands.length, 1); assert.ok(commands[0]!.type === 'autoResolveBattle' || commands[0]!.type === 'resolveCapture');
      submit(commands[0]!);
    }
  }
  for (let round = 0; round < rounds; round++) {
    assert.ok(!game.victory, 'True victory ended this workload early; do not suppress it or relabel fewer turns as 100.');
    roundObservationMs = 0; roundPlanningMs = 0; roundCommandMs = 0;
    for (const faction of game.factions) for (const command of plan(faction.id)) { submit(command); settle(); }
    const ended = submit({ type: 'endTurn', factionId: game.turnOwnerId }); settle();
    observationMs.push(roundObservationMs); planningMs.push(roundPlanningMs); commandMs.push(roundCommandMs); endTurnMs.push(ended);
    roundsMs.push(roundObservationMs + roundPlanningMs + roundCommandMs + ended);
    if (mirror) assert.equal(stateHash(mirror), stateHash(game));
    if (round === rounds / 2 - 1) {
      midpoint = { turn: game.turn, hash: stateHash(game), saveBytes: Buffer.byteLength(serializeGame(game)) };
      mirror = strictRestore(game);
    }
  }
  assert.ok(midpoint); assert.ok(mirror); assert.equal(stateHash(mirror), stateHash(game));
  const replay = deserializeGame(initial), digest = createHash('sha256');
  for (const record of history) { assert.deepEqual(issue(replay, record.command), record.result); digest.update(JSON.stringify(record)); }
  assert.equal(stateHash(replay), stateHash(game)); assert.equal(serializeGame(replay), serializeGame(game));
  const saved = timed(() => serializeGame(game)), loaded = timed(() => deserializeGame(saved.result));
  assert.equal(stateHash(loaded.result), stateHash(game));
  if (!smoke) {
    assert.ok(Object.values(recruitment).every(orders => Object.keys(orders).length > 0), 'Each culture must issue at least one genuine recruitment order.');
    assert.ok(contacts.size > 0); assert.ok((commandTypes.improveTile ?? 0) > 0); assert.ok((commandTypes.autoResolveBattle ?? 0) > 0);
  }
  return { seed: 748291, size: 'tiny', pace: 'epic', synthetic: false, rounds, initial: initialCounts, final: counts(game), generationMs: creation.ms,
    commandCount: history.length, rejectedCommands, commandTypes, eventTypes, recruitmentOrdersByCulture: recruitment, landOrdersByCulture,
    visibleEntityContactPairs: contacts.size, firstVisibleContactTurn, playerFirstVisibleContactTurn: firstVisibleContactTurn[game.turnOwnerId] ?? null,
    allFactionObservation: distribution(observationMs), allFactionPlanning: distribution(planningMs), submittedCommands: distribution(commandMs), endTurn: distribution(endTurnMs),
    fullRoundWithoutVerification: distribution(roundsMs), midpoint, mirroredCommands, replayedCommands: history.length, commandResultSha256: digest.digest('hex'),
    finalHash: stateHash(game), saveBytes: Buffer.byteLength(saved.result), saveMs: saved.ms, loadMs: loaded.ms, playerRead: observedCounts(getObservation(game, game.turnOwnerId)), victory: game.victory,
    note: 'Generated geography and earned play only. One filtered plan per faction/round plus bounded observed battle/capture decisions; no fake grants, terminal-project deferral or difficulty/pacing override. Recruitment counts are paid queue orders, not completed troops. Contacts require another realm’s permitted army/town entity. Timings exclude duplicate-plan checks, mirror/replay, history copies and seals; this 100-round campaign is not a victory-duration or browser/worker benchmark.' };
}

function scaleOrigins() {
  return (['huge', 'legendary'] as const).flatMap(size => [12, 24].map(seats => {
    const options = { seed: 20260905, size, factionCount: seats, pace: 'epic' as const, rosterVersion: 3 as const };
    const generation = timed(() => createGame(options)), game = generation.result, origin = serializeGame(game), initialCounts = counts(game);
    assert.equal(initialCounts.distinctCultures, 12);
    const repeated = createGame(options); assert.equal(serializeGame(repeated), origin);
    const oldRoster = createGame({ ...options, rosterVersion: 2 });
    assert.equal(physicalSeal(game), physicalSeal(oldRoster), 'Roster changed immutable generated physical geography.');
    const originHash = stateHash(game), initialRead = getObservation(game, game.turnOwnerId, { landDetails: 'none' });
    strictRestore(game);
    // Earn each first town through the real founding command. No treasury,
    // infrastructure, formations, visibility or production eligibility is authored.
    for (const faction of game.factions) {
      const caravan = getObservation(game, faction.id).armies.find(army => army.factionId === faction.id && army.canFound);
      assert.ok(caravan); issue(game, { type: 'found', factionId: faction.id, armyId: caravan.id, name: faction.name + ' Witness' });
    }
    const readySave = serializeGame(game), readyHash = stateHash(game), validation = strictRestore(game);
    const production = game.factions.map(faction => {
      const read = measure(() => getObservation(game, faction.id)), view = read.result, observedBefore = JSON.stringify(view);
      const planning = measure(() => planTurn(view));
      assert.equal(JSON.stringify(view), observedBefore);
      assert.ok(planning.result.some(command => command.type === 'queue'), 'Prepared first-town view must produce a real production proposal.');
      // Apply a fresh observation plan on the separate canonical validation copy.
      // Previous cultures' orders may change facts; this is not a stale-plan oracle.
      for (const command of planTurn(getObservation(validation, faction.id))) issue(validation, command);
      return { factionId: faction.id, definitionId: faction.definitionId, ...observedCounts(view), observation: read.timing, planning: planning.timing,
        proposalTypes: planning.result.map(command => command.type), productionItems: planning.result.flatMap(command => command.type === 'queue' ? [command.itemId] : []) };
    });
    assert.equal(stateHash(game), readyHash); assert.equal(serializeGame(game), readySave);
    strictRestore(validation);
    return { size, seats, distinctCultures: 12, rosterVersion: 3, generatorVersion: game.world.generatorVersion, initial: initialCounts,
      originGenerationMs: generation.ms, originGenerationSamples: 1, repeatedOriginIdentical: true, originHash, originSaveBytes: Buffer.byteLength(origin), originRead: observedCounts(initialRead),
      physicalGeographySha256: physicalSeal(game), oldRoster2PhysicalGeographyIdentical: true,
      generatedSeatBindings: game.factions.map(faction => ({ id: faction.id, definitionId: faction.definitionId })),
      firstTownState: counts(game), firstTownHash: readyHash, firstTownSaveBytes: Buffer.byteLength(readySave), production,
      note: '24 seats reuse twelve distinct cultures, not twenty-four authored identities. Single cold generation sample plus untimed exact regeneration. Planning/read samples use real founded, otherwise unmodified first-town states and filtered full observations; actual queue proposals are separately validated. This is origin/young production cost, not a mature empire, end-turn, worker transfer or rendering measurement.' };
  }));
}

const historical = historicalOrigins(), campaign = generatedCampaign(), origins = scaleOrigins();
console.log(JSON.stringify({ schema: 10, contentHash: CONTENT_HASH, rosterVersion: 3, smoke, startedAt, endedAt: new Date().toISOString(), totalWallMs: performance.now() - started,
  environment: { node: process.version, os: `${platform()} ${release()}`, cpu: cpus()[0]?.model, logicalCpus: cpus().length, memoryBytes: totalmem(), finalHeapBytes: process.memoryUsage().heapUsed, finalRssBytes: process.memoryUsage().rss },
  warmups, samples, recruitmentWeights: FACTION_RECRUITMENT_WEIGHTS, historical, campaign, origins,
  timingScope: 'Run in an explicitly reserved host window. Total wall time includes verification; labeled operation distributions do not. No renderer, browser, chronicle materialization or incremental-storage performance is measured. --smoke uses eight campaign rounds/two samples and is never a full-workload result.' }, null, 2));
