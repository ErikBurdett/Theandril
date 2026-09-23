import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { cpus, platform, release } from 'node:os';
import { dirname, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { CONTENT_HASH, UNITS, checksum } from '@theandril/content';
import { deriveWaterDepth, neighbors, TERRAIN } from '@theandril/mapgen';
import { applyCommand, createArmyFormation, createGame, deserializeGame, getObservation, SAVE_VERSION, serializeGame, stateHash, type DomainEvent, type GameCommand, type GameState } from '@theandril/sim';
import { aiObservationOptions, planTurnWithReasons } from '../packages/ai/src/index';
import { MAX_NAVAL_FLEETS, MAX_NAVAL_ROUTE_QUERIES, planNaval } from '../packages/ai/src/naval';
import { withRules } from '../packages/sim/src/rules';
import { advanceSupply, observeSupply, suppliedCells } from '../packages/sim/src/supply';
import { rebaseAuthoredLand } from '../packages/test-fixtures/src/authored-land';

const WARMUPS = 3, SAMPLES = 12;
function distribution(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return { samples: sorted.length, medianMs: sorted[Math.floor(sorted.length / 2)]!, p95Ms: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * .95))]!, maxMs: sorted.at(-1)! };
}
function time<T>(run: () => T) { const start = performance.now(), result = run(); return { result, ms: performance.now() - start }; }

/** Deliberately authored throughput workload. No claim of earned empire growth. */
function fixture(size: 'huge' | 'legendary', smoke: boolean): GameState {
  const state = createGame({ seed: 20260923, size, factionCount: 1, generatorVersion: 4, pace: 'epic' });
  const factionId = state.turnOwnerId, width = state.world.width;
  const hearths = smoke ? 8 : size === 'huge' ? 128 : 256;
  state.resources.deposits = {}; state.armies = {}; state.settlements = {}; state.transports = {};
  state.world.terrain.fill(TERRAIN.water); state.world.biome.fill(0); state.world.fertility.fill(0); state.world.hydrology.fill(0);
  state.factions[0]!.treasury = 1_000_000; state.factions[0]!.knowledge = 0;
  state.progression[factionId]!.technologies = ['technology.coastal_navigation', 'technology.ocean_navigation'];
  for (let index = 0; index < hearths; index++) {
    const cell = (24 + Math.floor(index / 16) * 24) * width + 24 + index % 16 * 28;
    // A small island with its town on the eastern coastal edge.
    const land = new Set([cell, cell - 1, cell - 2, ...neighbors(cell - 2, width, state.world.height)]);
    for (const tile of land) { state.world.terrain[tile] = TERRAIN.plains; state.world.biome[tile] = 1; state.world.fertility[tile] = 65; }
    if (!index) state.world.starts[0] = cell;
    const townId = `settlement.${state.nextId++}`;
    state.settlements[townId] = { id: townId, factionId, name: `Authored quay ${index}`, cell, population: 8, food: 0,
      buildings: ['building.harbor', 'building.workshop'], queue: [], founderFactionId: factionId, devastation: 0, occupationTurns: 0 };
    if (index % 2) continue;
    const fleetId = `army.${state.nextId++}`, cargoId = `army.${state.nextId++}`;
    const formation = (unitId: string) => createArmyFormation(`army.${state.nextId++}`, unitId);
    state.armies[fleetId] = { id: fleetId, factionId, name: `Authored fleet ${index}`, cell: cell + 7, movement: 5,
      provisions: [8, 3, 0][Math.floor(index / 2) % 3]!, formations: [formation('unit.transport'), formation('unit.transport'), formation('unit.ocean_warship')].sort((a, b) => a.id < b.id ? -1 : 1) };
    state.armies[cargoId] = { id: cargoId, factionId, name: `Authored passengers ${index}`, cell: cell + 7, movement: 0,
      formations: Array.from({ length: 4 }, () => formation('unit.guard')).sort((a, b) => a.id < b.id ? -1 : 1) };
    state.transports[cargoId] = fleetId;
  }
  state.world.waterDepth = deriveWaterDepth(width, state.world.height, state.world.terrain);
  // Complete chart exercises large observed geography; live visibility remains
  // the ordinary sight of authored towns/fleets, including carried-army exclusion.
  state.explored[factionId] = new Set(Array.from({ length: state.world.terrain.length }, (_, cell) => cell));
  rebaseAuthoredLand(state);
  return deserializeGame(serializeGame(state));
}

function measure(size: 'huge' | 'legendary', smoke: boolean) {
  const game = fixture(size, smoke), samples = smoke ? 3 : SAMPLES, before = stateHash(game);
  const metrics: Record<string, number[]> = {};
  const record = (name: string, value: number, iteration: number) => { if (iteration >= WARMUPS) (metrics[name] ??= []).push(value); };
  const originalProvisions = new Map(Object.values(game.armies).filter(army => army.provisions !== undefined).map(army => [army.id, army.provisions!]));
  const fullStrength = new Map(UNITS.map(unit => [unit.id, unit.strength]));
  const restore = () => { for (const army of Object.values(game.armies)) { if (originalProvisions.has(army.id)) army.provisions = originalProvisions.get(army.id)!; for (const formation of army.formations) formation.strength = fullStrength.get(formation.unitId)!; } };
  const seals = new Map<string, string>();
  let observedCells = 0, suppliedWater = 0, modernReturnOrders = 0, exhaustedForces = 0;
  const verify = (name: string, value: unknown) => {
    const seal = checksum(JSON.stringify(value));
    if (seals.has(name)) assert.equal(seal, seals.get(name), `${name} changed between identical samples`);
    else seals.set(name, seal);
  };
  for (let iteration = 0; iteration < WARMUPS + samples; iteration++) {
    const reach = time(() => suppliedCells(game, game.turnOwnerId));
    record('supplyReach', reach.ms, iteration);
    suppliedWater = [...reach.result.keys()].filter(cell => game.world.terrain[cell] === TERRAIN.water).length;
    for (const version of iteration % 2 ? [31, 30] as const : [30, 31] as const) {
      const read = time(() => withRules(game, version, () => observeSupply(game, game.turnOwnerId, reach.result)));
      record(`supplyObservationRules${version}`, read.ms, iteration); verify(`supplyObservationRules${version}`, read.result);
      restore();
      const events: DomainEvent[] = [];
      const advanced = time(() => withRules(game, version, () => advanceSupply(game, events)));
      record(`advanceSupplyRules${version}`, advanced.ms, iteration);
      if (version === 31) exhaustedForces = advanced.result.size;
      verify(`advanceSupplyRules${version}`, { starving: [...advanced.result], events, armies: Object.values(game.armies).map(army => [army.id, army.provisions, army.formations.map(formation => formation.strength)]) });
      restore();
    }
    const observed = time(() => getObservation(game, game.turnOwnerId, { landDetails: 'none', developmentCandidates: false }));
    record('aiScopedObservation', observed.ms, iteration); observedCells = observed.result.cells.length;
    const legacyView = { ...observed.result, supply: observed.result.supply.map(item => ({ armyId: item.armyId, supplied: true, sourceSettlementId: null, reason: 'A fleet carries its own stores.' })) };
    for (const version of iteration % 2 ? [31, 30] as const : [30, 31] as const) {
      const view = version === 31 ? observed.result : legacyView;
      const planned = time(() => planNaval(view, 0));
      record(`navalPlan${version === 31 ? 'ProvisionAware' : 'NoProvisionPolicy'}`, planned.ms, iteration);
      verify(`navalPlanRules${version}`, { ...planned.result, heldArmyIds: [...planned.result.heldArmyIds], queuedSettlementIds: [...planned.result.queuedSettlementIds] });
      if (version === 31) modernReturnOrders = planned.result.reasons.filter(reason => reason.includes('return through charted water to harbor supply')).length;
      assert.ok(planned.result.commands.length <= 128);
    }
  }
  assert.equal(stateHash(game), before, 'Reads or benchmark reset changed the authored input');
  assert.equal(stateHash(deserializeGame(serializeGame(game))), before, 'Final strict save roundtrip differs');
  assert.ok(exhaustedForces > 0 && modernReturnOrders > 0, 'Fixture must exercise cargo attrition and AI return planning');
  return { size, synthetic: true, cells: game.world.terrain.length, observedCells, factions: game.factions.length,
    hearths: Object.keys(game.settlements).length, loadedFleets: Object.keys(game.transports).length,
    hullFormations: Object.keys(game.transports).length * 3, cargoFormations: Object.keys(game.transports).length * 4,
    suppliedWater, provisionLevels: [8, 3, 0], exhaustedForces, modernReturnOrders,
    configuredMaximumFleetsPlanned: MAX_NAVAL_FLEETS, configuredMaximumRouteQueries: MAX_NAVAL_ROUTE_QUERIES,
    warmups: WARMUPS, timings: Object.fromEntries(Object.entries(metrics).map(([name, values]) => [name, distribution(values)])),
    canonicalHash: before, deterministicOutputSeals: Object.fromEntries(seals), strictSaveRoundtrip: true };
}

/** Fixed existing overseas regression seed; diagnostics never inform proposals. */
function generatedBehavior() {
  const game = createGame({ seed: 20260905, size: 'small', factionCount: 4, layout: 'islands', pace: 'epic' });
  const fleetIds = new Set<string>(), transported = new Set<string>(), landed = new Set<string>();
  const counts = { commands: 0, refused: 0, returnOrders: 0, refillHolds: 0, resupplyEvents: 0, emptyStoreEvents: 0,
    fleetAttritionTurns: 0, cargoAttritionTurns: 0, lostHullStrength: 0, lostPassengerStrength: 0,
    embarkations: 0, landings: 0, transportedFoundings: 0, harborOrders: 0, mirroredCommands: 0 };
  let mirror: GameState | undefined;
  const issue = (command: GameCommand) => {
    // Attribute actual end-turn losses to fleets/cargo that entered the turn
    // empty outside canonical supply; ordinary land losses are a separate rule.
    const reach = command.type === 'endTurn' ? new Map(game.factions.map(faction => [faction.id, suppliedCells(game, faction.id)])) : null;
    const empty = reach ? Object.values(game.armies).filter(army => army.provisions === 0 && !reach.get(army.factionId)!.has(army.cell)) : [];
    const emptyIds = new Set(empty.map(army => army.id));
    const atRisk = new Map(Object.values(game.armies).filter(army => emptyIds.has(army.id) || emptyIds.has(game.transports[army.id] ?? ''))
      .map(army => [army.id, { cargo: Boolean(game.transports[army.id]), strength: army.formations.reduce((sum, formation) => sum + formation.strength, 0) }]));
    const result = applyCommand(game, command); counts.commands++;
    if (!result.ok) counts.refused++;
    assert.ok(result.ok, `Turn ${game.turn} ${JSON.stringify(command)}: ${result.error}`);
    if (mirror) { assert.deepEqual(applyCommand(mirror, command), result); counts.mirroredCommands++; }
    for (const [id, before] of atRisk) {
      const army = game.armies[id]; if (!army) continue;
      const lost = before.strength - army.formations.reduce((sum, formation) => sum + formation.strength, 0);
      if (lost > 0 && before.cargo) { counts.cargoAttritionTurns++; counts.lostPassengerStrength += lost; }
      else if (lost > 0) { counts.fleetAttritionTurns++; counts.lostHullStrength += lost; }
    }
    for (const event of result.events) {
      if (event.type === 'fleet_resupplied') counts.resupplyEvents++;
      if (event.type === 'fleet_stores_empty') counts.emptyStoreEvents++;
    }
    if (command.type === 'queue' && command.itemId === 'building.harbor') counts.harborOrders++;
    if (command.type === 'embarkArmy') { counts.embarkations++; transported.add(command.armyId); }
    if (command.type === 'disembarkArmy') { counts.landings++; landed.add(command.armyId); }
    if (command.type === 'found' && transported.has(command.armyId)) counts.transportedFoundings++;
  };
  for (let round = 0; round < 100 && !game.victory; round++) {
    for (const faction of game.factions) {
      if (game.victory) break;
      const view = getObservation(game, faction.id, aiObservationOptions(game.turn)), plan = planTurnWithReasons(view);
      for (const fleet of view.armies.filter(army => army.factionId === faction.id && army.domain === 'naval')) fleetIds.add(fleet.id);
      counts.returnOrders += plan.reasons.filter(reason => reason.includes('return through charted water to harbor supply')).length;
      counts.refillHolds += plan.reasons.filter(reason => reason.includes('holds within harbor supply to refill')).length;
      for (const command of plan.commands) {
        if (game.victory) break;
        issue(command);
        for (let decisions = 0; game.battle || game.pendingCapture; decisions++) {
          assert.ok(decisions < 4);
          if (game.battle) issue({ type: 'autoResolveBattle', factionId: game.battle.attackerFactionId });
          else {
            const next = planTurnWithReasons(getObservation(game, game.pendingCapture!.factionId, aiObservationOptions(game.turn))).commands[0];
            assert.equal(next?.type, 'resolveCapture'); issue(next!);
          }
        }
      }
    }
    if (!game.victory) issue({ type: 'endTurn', factionId: game.turnOwnerId });
    if (game.turn === 26) mirror = deserializeGame(serializeGame(game));
  }
  const hash = stateHash(game);
  assert.ok(mirror); assert.equal(stateHash(mirror), hash); assert.equal(stateHash(deserializeGame(serializeGame(game))), hash);
  return { seed: 20260905, size: 'small', layout: 'islands', factions: 4, pace: 'epic', limit: 100, completedTurn: game.turn,
    noGrants: true, uniqueFleetContainersObserved: fleetIds.size, distinctTransportedArmies: transported.size, distinctLandedArmies: landed.size,
    counts, savedMirrorHash: hash, exactSavedMirror: true,
    note: 'One unchanged generated overseas regression input, continued for 100 rounds. Every realm uses its ordinary observed plan; no injected ships, money, harbors, map knowledge or altered proposals. Return counts use accepted planning reasons; losses compare actual strength before/after end turns for empty carriers outside supply. This records continuing logistical failures as well as successful operations; it is not a pacing or huge-map certification.' };
}

export function benchmarkFleetSupply(smoke = false) {
  return { capturedAt: new Date().toISOString(), runtime: process.version, cpu: cpus()[0]?.model, os: `${platform()} ${release()}`,
    saveVersion: SAVE_VERSION, contentHash: CONTENT_HASH, smoke,
    workloads: (smoke ? ['huge'] as const : ['huge', 'legendary'] as const).map(size => measure(size, smoke)), generatedCampaign: smoke ? null : generatedBehavior(),
    scope: 'Authored, resource-free island grids at generator4 Huge/Legendary dimensions, one realm, fully charted geography, normal entity sight and the hearth/fleet counts listed per workload. These are synthetic stress workloads, not earned campaigns or a release soak. A separate generated Small campaign records actual fleet outcomes.',
    timing: 'Simulation supply reach, supplied read models, supply turn resolution, AI-scoped observation and naval proposal generation are measured separately. Rules30/31 supply functions use identical authored inputs in an explicit rule context; the no-provision AI comparison omits only the modern supply contract. Each planning sample has a fresh observation. Comparison order alternates. Setup, reset, output equality, hashes and strict save validation are outside timing. No GPU, browser, full economic turn, network or archive costs.',
    limits: 'Fleet and route-query values are configured production caps, not instrumented per-sample query counts. Timings include JavaScript GC and are local machine evidence; many independent realms and contested supply lines are outside this one-realm stress fixture.' };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), output = args.find(arg => arg.startsWith('--output='))?.slice(9);
  assert.ok(args.every(arg => arg === '--smoke' || arg.startsWith('--output=')), 'Arguments: --smoke, --output=<path>');
  const result = benchmarkFleetSupply(args.includes('--smoke')), json = JSON.stringify(result, null, 2) + '\n';
  if (output) { mkdirSync(dirname(output), { recursive: true }); writeFileSync(output, json); }
  console.log(json);
}
