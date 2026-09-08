import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { pathToFileURL } from 'node:url';
import { CONTENT_HASH } from '../packages/content/src/index';
import { GENERATOR_VERSION, MAP_DIMENSIONS, neighbors, WATER_DEPTH, type GeneratorVersion, type MapSize } from '../packages/mapgen/src/index';
import { applyCommand, createGame, deserializeGame, getObservation, SAVE_VERSION, serializeGame, stateHash, type GameCommand, type GameState, type NewGameOptions } from '../packages/sim/src/index';
import { aiObservationOptions, planTurnWithReasons } from '../packages/ai/src/index';

export interface OverseasOptions { seed: number; size: MapSize; factionCount: number; layout: NonNullable<NewGameOptions['layout']>; limit: number; requireDeep?: boolean; generatorVersion?: GeneratorVersion }
function distribution(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return { samples: sorted.length, medianMs: sorted[Math.floor(sorted.length / 2)] ?? 0, p95Ms: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * .95))] ?? 0, maxMs: sorted.at(-1) ?? 0 };
}

/** Evidence-only geography classification. Never supplied to a planner or used to choose orders. */
function landmasses(game: GameState): Int32Array {
  const { world } = game, result = new Int32Array(world.terrain.length);
  let nextId = 0;
  for (let cell = 0; cell < result.length; cell++) if (world.terrain[cell] !== 0 && !result[cell]) {
    const id = ++nextId, queue = [cell]; result[cell] = id;
    for (let cursor = 0; cursor < queue.length; cursor++) for (const adjacent of neighbors(queue[cursor]!, world.width, world.height)) {
      if (world.terrain[adjacent] !== 0 && !result[adjacent]) { result[adjacent] = id; queue.push(adjacent); }
    }
  }
  return result;
}

/** No setup mutations or grants: generation, all seats' actual plans, exact accepted results,
 * loaded-journey checkpoint, and complete command replay from the unmodified generated save. */
export function runOverseasCampaign(options: OverseasOptions) {
  const started = performance.now();
  const { seed, size, factionCount, layout } = options;
  const generatorVersion = options.generatorVersion ?? GENERATOR_VERSION;
  assert.ok(generatorVersion >= 5 && generatorVersion <= GENERATOR_VERSION, 'Overseas layouts require an available generator version >=5.');
  const game = createGame({ seed, size, factionCount, layout, pace: 'epic', generatorVersion });
  const initial = serializeGame(game), components = landmasses(game);
  const homeland = new Map(game.factions.map((faction, index) => [faction.id, components[game.world.starts[index]!]!]));
  const records: { command: GameCommand; result: ReturnType<typeof applyCommand> }[] = [];
  const counts: Record<string, number> = {}, first: Record<string, number> = {}, planMs: number[] = [], roundMs: number[] = [];
  const transported = new Set<string>(), deepPassengers = new Set<string>();
  const landings: { turn: number; factionId: string; armyId: string; cell: number; landmass: number; deepVoyage: boolean }[] = [];
  const colonies: { turn: number; factionId: string; armyId: string; cell: number; landmass: number; originLandmass: number; deepVoyage: boolean }[] = [];
  let mirror: GameState | undefined, mirrored = 0;
  const submit = (command: GameCommand) => {
    const cell = 'armyId' in command ? game.armies[command.armyId]?.cell : undefined;
    const result = applyCommand(game, command);
    assert.ok(result.ok, `Turn ${game.turn}: ${JSON.stringify(command)}: ${result.error}`);
    records.push({ command: structuredClone(command), result: structuredClone(result) });
    counts[command.type] = (counts[command.type] ?? 0) + 1;
    const stage = command.type === 'research' ? command.technologyId : command.type === 'queue' ? command.itemId : command.type;
    first[stage] ??= game.turn;
    if (mirror) { assert.deepEqual(applyCommand(mirror, command), result); mirrored++; }
    if (command.type === 'embarkArmy') transported.add(command.armyId);
    for (const [armyId, fleetId] of Object.entries(game.transports)) if (game.world.waterDepth[game.armies[fleetId]!.cell] === WATER_DEPTH.deep) deepPassengers.add(armyId);
    if (command.type === 'disembarkArmy') landings.push({ turn: game.turn, factionId: command.factionId, armyId: command.armyId, cell: command.target, landmass: components[command.target]!, deepVoyage: deepPassengers.has(command.armyId) });
    if (command.type === 'found' && cell !== undefined && transported.has(command.armyId) && components[cell] !== homeland.get(command.factionId)) {
      colonies.push({ turn: game.turn, factionId: command.factionId, armyId: command.armyId, cell, landmass: components[cell]!, originLandmass: homeland.get(command.factionId)!, deepVoyage: deepPassengers.has(command.armyId) });
    }
    if (!mirror && Object.keys(game.transports).length) mirror = deserializeGame(serializeGame(game));
  };
  const objectiveMet = () => colonies.some(colony => options.requireDeep === false || colony.deepVoyage);
  for (let round = 0; round < options.limit && !game.victory && !objectiveMet(); round++) {
    const start = performance.now();
    for (const faction of game.factions) {
      const planStart = performance.now();
      const view = getObservation(game, faction.id, aiObservationOptions(game.turn)), plan = planTurnWithReasons(view);
      planMs.push(performance.now() - planStart);
      assert.ok(plan.commands.length <= 128);
      for (const command of plan.commands) {
        if (game.victory) break;
        submit(command);
        for (let decision = 0; game.battle || game.pendingCapture; decision++) {
          assert.ok(decision < 4, 'Pending battle/capture did not terminate');
          if (game.battle) submit({ type: 'autoResolveBattle', factionId: [game.battle.attackerFactionId, game.battle.defenderFactionId].includes(game.turnOwnerId) ? game.turnOwnerId : game.battle.attackerFactionId });
          else { const next = planTurnWithReasons(getObservation(game, game.pendingCapture!.factionId, aiObservationOptions(game.turn))).commands[0]; assert.equal(next?.type, 'resolveCapture'); submit(next!); }
        }
      }
    }
    if (!game.victory) submit({ type: 'endTurn', factionId: game.turnOwnerId });
    roundMs.push(performance.now() - start);
  }
  const saved = serializeGame(game), hash = stateHash(game), replay = deserializeGame(initial);
  const replayStart = performance.now();
  for (const record of records) assert.deepEqual(applyCommand(replay, record.command), record.result);
  const replayMs = performance.now() - replayStart;
  assert.equal(serializeGame(replay), saved);
  assert.equal(serializeGame(deserializeGame(saved)), saved);
  if (mirror) assert.equal(serializeGame(mirror), saved);
  return { schema: SAVE_VERSION, contentHash: CONTENT_HASH, ...options, generatorVersion: game.world.generatorVersion, turn: game.turn, hash,
    noGrants: true, initialSaveBytes: Buffer.byteLength(initial), finalSaveBytes: Buffer.byteLength(saved),
    commands: records.length, rejected: 0, counts, first, landings, colonies, mirroredCommands: mirrored, fullReplayCommands: records.length,
    exactReplay: true, exactSave: true, planningIncludes: 'permitted AI-scoped observation plus proposal generation', planning: distribution(planMs),
    roundIncludes: 'all factions, commands, result recording and saved mirror; excludes final full replay', rounds: distribution(roundMs), replayMs, totalMs: performance.now() - started };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = new Map(process.argv.slice(2).map(argument => { const [key, value] = argument.replace(/^--/, '').split('='); return [key, value]; }));
  const size = args.get('size') ?? 'tiny', layout = args.get('layout') ?? 'islands';
  assert.ok(size in MAP_DIMENSIONS); assert.ok(['continents', 'islands', 'archipelago'].includes(layout));
  const generatorVersion = Number(args.get('generator') ?? GENERATOR_VERSION);
  assert.ok(Number.isInteger(generatorVersion) && generatorVersion >= 5 && generatorVersion <= GENERATOR_VERSION);
  const options: OverseasOptions = { seed: Number(args.get('seed') ?? 20260905), size: size as MapSize, factionCount: Number(args.get('factions') ?? 4), layout: layout as OverseasOptions['layout'], limit: Number(args.get('limit') ?? 180), requireDeep: args.get('require-deep') !== 'false', generatorVersion: generatorVersion as GeneratorVersion };
  assert.ok(Number.isInteger(options.limit) && options.limit > 0 && options.limit <= 400);
  const result = runOverseasCampaign(options);
  console.log(JSON.stringify(result, null, 2));
  assert.ok(result.colonies.some(colony => options.requireDeep === false || colony.deepVoyage), 'No earned colony across the requested water depth within the fixed campaign bound.');
}
