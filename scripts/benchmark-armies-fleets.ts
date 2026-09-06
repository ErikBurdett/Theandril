import { cpus, platform, release } from 'node:os';
import { performance } from 'node:perf_hooks';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHARACTER_DEFINITIONS, CHARACTER_SKILLS, CONTENT_HASH, UNITS, checksum } from '@theandril/content';
import { applyCommand, armyCommandCapacity, armyMovement, createArmyFormation, createGame, deserializeGame, getMovementQuery, getObservation, MAX_PATH_NODES, SAVE_VERSION, serializeGame, stateHash, type GameCommand, type GameState } from '@theandril/sim';
import { autoResolveBattle, chooseBattleOrder, createBattle, resolveBattleRound, type BattleFormation } from '../packages/sim/src/combat';
import { matureCampaign } from '../packages/test-fixtures/src/index';
import { navalCampaign, NAVAL_FIXTURE as N } from '../packages/test-fixtures/src/naval-fixture';

const WARMUPS = 7, SAMPLES = 20;
const byId = (a: { id: string }, b: { id: string }) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
function requireValue(condition: unknown, message: string): asserts condition { if (!condition) throw new Error('Armies/fleets benchmark: ' + message); }
function issue(game: GameState, command: GameCommand) { const result = applyCommand(game, command); requireValue(result.ok, JSON.stringify(command) + ': ' + result.error); return result; }
function distribution(samples: number[]) {
  const sorted = [...samples].sort((a, b) => a - b);
  return { samples: sorted.length, medianMs: sorted[Math.floor(sorted.length / 2)] ?? null, p95Ms: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] ?? null, maxMs: sorted.at(-1) ?? null, meanMs: sorted.length ? sorted.reduce((sum, value) => sum + value, 0) / sorted.length : null };
}
function measured<T>(operation: () => T): { result: T; ms: number } { const started = performance.now(), result = operation(); return { result, ms: performance.now() - started }; }

function kernel(smoke: boolean) {
  const units = ['unit.colonist', 'unit.scout', 'unit.guard'].map(id => UNITS.find(unit => unit.id === id)!);
  const roster = (prefix: string, count: number): BattleFormation[] => Array.from({ length: count }, (_, index) => {
    const unit = units[index % units.length]!;
    return { id: `${prefix}.${index}`, unitId: unit.id, strength: unit.strength, maxStrength: unit.strength, morale: unit.morale, fatigue: 0, row: Math.floor(index / 5), column: index % 5, attack: unit.attack, armor: unit.armor, initiative: unit.initiative, range: unit.range };
  });
  const samples = smoke ? 8 : 200;
  return [12, 20].map(count => {
    const timing: number[] = [], rounds: number[] = [], hashes: string[] = [];
    for (let iteration = 0; iteration < WARMUPS + samples; iteration++) {
      const input = { seed: 42 + iteration, terrain: 3, attacker: roster('formation.a', count), defender: roster('formation.b', count) };
      const timed = measured(() => autoResolveBattle(createBattle(input, 8), 8));
      requireValue(timed.result.result, 'kernel did not terminate');
      let manual = createBattle(input, 8);
      while (!manual.result) manual = resolveBattleRound(manual, { attacker: chooseBattleOrder(manual, 'attacker'), defender: chooseBattleOrder(manual, 'defender') }, 8);
      requireValue(JSON.stringify(manual) === JSON.stringify(timed.result), 'manual/autoresolve mismatch');
      if (count === 12) requireValue(JSON.stringify(autoResolveBattle(createBattle(input, 7), 7)) === JSON.stringify(timed.result), 'historical twelve-formation rules changed');
      if (iteration >= WARMUPS) { timing.push(timed.ms); rounds.push(timed.result.round); hashes.push(checksum(JSON.stringify(timed.result))); }
    }
    return { formationsPerSide: count, deploymentRanks: count === 12 ? 3 : 4, samples, warmups: WARMUPS, createAndAutoResolve: distribution(timing), minRounds: Math.min(...rounds), maxRounds: Math.max(...rounds), outcomeSeal: checksum(JSON.stringify(hashes)), historical12Parity: count === 12 ? true : null, manualParity: true,
      note: 'Same repeated original three-unit roster and hills terrain at both sizes, preserving the existing kernel workload. These are supplied tactical stats, not recruited campaign forces. Timings include validated battle creation and exact kernel autoresolve; separate manual and historical comparisons are excluded.' };
  });
}

function stableReadMeasurements(game: GameState, armyId: string, target: number, samples: number) {
  const before = stateHash(game), observation: number[] = [], coldQuery: number[] = [], warmQuery: number[] = [], save: number[] = [], load: number[] = [];
  let viewBytes = 0, saveBytes = 0, expandedNodes = 0, reachableCells = 0;
  let expectedView = '', expectedQuery = '', expectedSave = '';
  for (let sample = 0; sample < WARMUPS + samples; sample++) {
    const observed = measured(() => getObservation(game, game.turnOwnerId));
    const cold = measured(() => getMovementQuery(observed.result, armyId, target));
    const warm = measured(() => getMovementQuery(observed.result, armyId, target));
    const saved = measured(() => serializeGame(game));
    const loaded = measured(() => deserializeGame(saved.result));
    const viewText = JSON.stringify(observed.result), queryText = JSON.stringify(cold.result);
    requireValue(JSON.stringify(warm.result) === queryText, 'fresh and cached movement queries differ');
    requireValue(cold.result.expandedNodes <= MAX_PATH_NODES, 'movement query exceeded its budget');
    requireValue(stateHash(loaded.result) === before, 'read/serialization roundtrip changed state');
    if (sample) requireValue(viewText === expectedView && queryText === expectedQuery && saved.result === expectedSave, 'unchanged read/serialization output differs');
    expectedView = viewText; expectedQuery = queryText; expectedSave = saved.result;
    viewBytes = Buffer.byteLength(viewText); saveBytes = Buffer.byteLength(saved.result); expandedNodes = cold.result.expandedNodes; reachableCells = cold.result.reachable.length;
    if (sample >= WARMUPS) { observation.push(observed.ms); coldQuery.push(cold.ms); warmQuery.push(warm.ms); save.push(saved.ms); load.push(loaded.ms); }
  }
  requireValue(stateHash(game) === before, 'observational benchmark mutated campaign');
  return { samples, warmups: WARMUPS, fullObservation: distribution(observation), freshObservationQuery: distribution(coldQuery), cachedObservationQuery: distribution(warmQuery), serialize: distribution(save), deserialize: distribution(load), observationBytes: viewBytes, saveBytes, expandedNodes, reachableCells, canonicalHash: before,
    note: 'Read model construction and fresh/cached movement-query timing are separate. Every save/load is full strict canonical validation. JSON comparisons and state-hash checks are outside timings. World indexes are already built; fresh means a newly allocated observation, not cold world generation.' };
}

function loadedFleet(smoke: boolean) {
  const game = navalCampaign({ enemyFleet: false }), factionId = game.turnOwnerId;
  const landingApproach = N.landingCell - 1;
  issue(game, { type: 'assignCharacter', factionId, characterId: N.marshalId, armyId: N.fleetId });
  issue(game, { type: 'research', factionId, technologyId: 'technology.ocean_navigation' });
  const cargo = game.armies[N.cargoId]!, initialCargo = JSON.stringify(cargo.formations);
  issue(game, { type: 'embarkArmy', factionId, armyId: N.cargoId, fleetId: N.fleetId });
  requireValue(game.transports[N.cargoId] === N.fleetId && cargo.cell === game.armies[N.fleetId]!.cell && cargo.movement === 0, 'real embarkation did not preserve cargo');
  const reads = stableReadMeasurements(game, N.fleetId, landingApproach, smoke ? 3 : SAMPLES);
  const queued = measured(() => issue(game, { type: 'queueMovement', factionId, armyId: N.fleetId, target: landingApproach }));
  requireValue(game.routes[N.fleetId], 'voyage did not retain its beyond-budget queue');
  const saved = serializeGame(game), mirror = deserializeGame(saved), turnTimes: number[] = [], travelTimes: number[] = [];
  let commands = 0;
  while (game.routes[N.fleetId] && commands < 10) {
    let phaseStart = 0, travelMs = 0;
    const command: GameCommand = { type: 'endTurn', factionId }, start = performance.now();
    const result = applyCommand(game, command, (phase, edge) => { if (phase === 'travel') { if (edge === 'start') phaseStart = performance.now(); else travelMs += performance.now() - phaseStart; } });
    turnTimes.push(performance.now() - start); travelTimes.push(travelMs); commands++;
    requireValue(result.ok && JSON.stringify(issue(mirror, command)) === JSON.stringify(result), 'loaded voyage result mirror differs');
    requireValue(stateHash(game) === stateHash(mirror) && cargo.cell === game.armies[N.fleetId]!.cell && JSON.stringify(cargo.formations) === initialCargo, 'loaded voyage lost cargo or diverged');
  }
  requireValue(!game.routes[N.fleetId] && game.armies[N.fleetId]!.cell === landingApproach, 'queued voyage did not finish');
  if (game.armies[N.fleetId]!.movement < 1) { const end: GameCommand = { type: 'endTurn', factionId }; requireValue(JSON.stringify(issue(game, end)) === JSON.stringify(issue(mirror, end)), 'landing movement refresh differs'); }
  const unload: GameCommand = { type: 'disembarkArmy', factionId, armyId: N.cargoId, target: N.landingCell };
  requireValue(JSON.stringify(issue(game, unload)) === JSON.stringify(issue(mirror, unload)), 'disembarkation result differs');
  requireValue(!game.transports[N.cargoId] && cargo.cell === N.landingCell && JSON.stringify(cargo.formations) === initialCargo, 'unloading lost or duplicated cargo formations');
  requireValue(stateHash(game) === stateHash(mirror) && stateHash(deserializeGame(serializeGame(game))) === stateHash(game), 'final loaded voyage save differs');
  return { synthetic: true, cells: game.world.terrain.length, factions: game.factions.length, hulls: game.armies[N.fleetId]!.formations.length, cargoArmies: 1, cargoFormations: cargo.formations.length, cargoFormationIds: cargo.formations.map(item => item.id), cargoConserved: true, reads, queueMovementMs: queued.ms, activeVoyageTurns: commands, fullEndTurn: distribution(turnTimes), activeTravelPhase: distribution(travelTimes), midpointSaveBytes: Buffer.byteLength(saved), finalHash: stateHash(game),
    note: 'Authored archipelago/funded harbor/hulls, not generated AI sailing. Marshal appointment comes from the validated fixture; Harbor boarding, Ocean navigation payment, cargo embarkation, queued voyage and unloading use real commands. The short active voyage is a functional timing sample, not a twenty-sample stable latency distribution. No combat, AI, archive or browser costs are included.' };
}

function tinyMature(): GameState {
  const game = createGame({ seed: 20260905, size: 'tiny', factionCount: 2 });
  for (const faction of game.factions) {
    const caravan = Object.values(game.armies).find(army => army.factionId === faction.id && army.formations.some(item => item.unitId === 'unit.colonist'))!;
    issue(game, { type: 'found', factionId: faction.id, armyId: caravan.id, name: faction.name + ' Hold' }); faction.treasury = 100_000;
    for (let index = 0; index < 4; index++) { const id = `army.${game.nextId++}`; game.armies[id] = { id, factionId: faction.id, name: 'Smoke formation column', cell: caravan.cell, movement: 3, formations: [createArmyFormation(id, 'unit.guard')] }; }
  }
  return deserializeGame(serializeGame(game));
}

function scale(smoke: boolean) {
  return (smoke ? ['tiny'] as const : ['huge', 'legendary'] as const).map(size => {
    let game = size === 'tiny' ? tinyMature() : matureCampaign(size);
    const officersPerFaction = smoke ? 4 : 32, mixedUnitIds = ['unit.guard', 'unit.spearman', 'unit.heavy_infantry', 'unit.cavalry', 'unit.scout'];
    const skillIds = ['skill.decisive', 'skill.muster_rolls', 'skill.field_orders'];
    const veteranExperience = skillIds.reduce((sum, id) => sum + CHARACTER_SKILLS.find(skill => skill.id === id)!.experienceCost, 0);
    let setupCommands = 0, appointed = 0, authoredVeterans = 0;
    for (const faction of game.factions) {
      const town = Object.values(game.settlements).find(town => town.factionId === faction.id)!;
      const armies = Object.values(game.armies).filter(army => army.factionId === faction.id && army.cell === town.cell && army.formations[0]?.unitId === 'unit.guard').sort(byId).slice(0, officersPerFaction);
      requireValue(armies.length === officersPerFaction, 'insufficient co-located mature columns');
      const beforeCoin = faction.treasury;
      for (const [index, army] of armies.entries()) {
        const characterId = `character.${game.nextId}`;
        issue(game, { type: 'recruitCharacter', factionId: faction.id, settlementId: town.id, definitionId: 'character.marshal' });
        issue(game, { type: 'assignCharacter', factionId: faction.id, characterId, armyId: army.id }); setupCommands += 2; appointed++;
        const capacity = index % 2 ? 20 : 16;
        if (capacity === 20) {
          game.characters[characterId]!.experience = veteranExperience; authoredVeterans++;
          for (const skillId of skillIds) { issue(game, { type: 'promoteCharacter', factionId: faction.id, characterId, skillId }); setupCommands++; }
          requireValue(game.characters[characterId]!.experience === 0, 'training did not consume exact authored XP');
        }
        while (army.formations.length < capacity) army.formations.push(createArmyFormation(`army.${game.nextId++}`, mixedUnitIds[army.formations.length % mixedUnitIds.length]!));
        army.formations.sort(byId); army.movement = Math.min(army.movement, armyMovement(army));
        requireValue(armyCommandCapacity(game, army) === capacity, 'capacity does not follow attached marshal training');
      }
      requireValue(beforeCoin - faction.treasury === officersPerFaction * CHARACTER_DEFINITIONS.find(item => item.id === 'character.marshal')!.coinCost, 'appointments did not pay their exact cost');
    }
    game = deserializeGame(serializeGame(game));
    const commanded = Object.values(game.armies).filter(army => army.formations.length > 12), selected = commanded.find(army => army.factionId === game.turnOwnerId)!;
    const rosterSeal = checksum(JSON.stringify(Object.values(game.armies).sort(byId).map(army => [army.id, army.formations])));
    const reads = stableReadMeasurements(game, selected.id, selected.cell, smoke ? 3 : SAMPLES);
    const mirror = deserializeGame(serializeGame(game)), fullTurn: number[] = [], phases: Record<string, number[]> = {};
    const turns = WARMUPS + (smoke ? 3 : SAMPLES);
    for (let turn = 0; turn < turns; turn++) {
      const starts: Record<string, number> = {}, current: Record<string, number> = {};
      const command: GameCommand = { type: 'endTurn', factionId: game.turnOwnerId }, start = performance.now();
      const result = applyCommand(game, command, (phase, edge) => { if (edge === 'start') starts[phase] = performance.now(); else current[phase] = performance.now() - starts[phase]!; });
      const duration = performance.now() - start;
      requireValue(result.ok && JSON.stringify(issue(mirror, command)) === JSON.stringify(result), 'idle turn result/events differ');
      requireValue(stateHash(game) === stateHash(mirror), 'idle turn hash differs');
      if (turn >= WARMUPS) { fullTurn.push(duration); for (const [phase, ms] of Object.entries(current)) (phases[phase] ??= []).push(ms); }
    }
    requireValue(checksum(JSON.stringify(Object.values(game.armies).sort(byId).map(army => [army.id, army.formations]))) === rosterSeal, 'idle workload changed formations');
    requireValue(stateHash(deserializeGame(serializeGame(game))) === stateHash(game), 'mature final save differs');
    return { size, synthetic: true, cells: game.world.terrain.length, factions: game.factions.length, armies: Object.keys(game.armies).length, formations: Object.values(game.armies).reduce((sum, army) => sum + army.formations.length, 0), marshalLedArmies: commanded.length,
      sixteenFormationArmies: commanded.filter(army => army.formations.length === 16).length, twentyFormationArmies: commanded.filter(army => army.formations.length === 20).length, paidAppointments: appointed, authoredVeterans, authoredExperienceEach: veteranExperience, setupCommands,
      reads, idleTurnSamples: fullTurn.length, unmeasuredWarmupTurns: WARMUPS, mirroredTurns: turns, fullEndTurn: distribution(fullTurn), phases: Object.fromEntries(Object.entries(phases).map(([phase, samples]) => [phase, distribution(samples)])), finalHash: stateHash(game), rosterSeal,
      note: `Synthetic mature 1500/4000 containers and one town per faction (10 containers in Tiny smoke). ${officersPerFaction} real paid marshal appointments per faction; half receive explicitly authored veteran XP, spent through actual prerequisite commands. Added mixed formations are authored setup, not recruitment or earned military growth. Every initial/final state crosses strict save validation. Idle endTurns have real economy/upkeep/character/movement processing, no AI plans, missions, travel, battles, archive or browser. Seven initial turns excluded from latency distributions; independent mirror/hash checks are outside timings. No 100-turn campaign soak.` };
  });
}

export function benchmarkArmiesFleets(options: { smoke?: boolean; section?: 'all' | 'kernel' | 'fleet' | 'scale' } = {}) {
  const smoke = options.smoke ?? false, section = options.section ?? 'all';
  return { capturedAt: new Date().toISOString(), runtime: process.version, cpu: cpus()[0]?.model, os: platform() + ' ' + release(), saveVersion: SAVE_VERSION, contentHash: CONTENT_HASH, smoke,
    kernel: section === 'all' || section === 'kernel' ? kernel(smoke) : [], loadedFleet: section === 'all' || section === 'fleet' ? loadedFleet(smoke) : null, scale: section === 'all' || section === 'scale' ? scale(smoke) : [],
    scope: 'Sequential offline canonical/kernel benchmark. Setup, validation comparisons and separately executed mirrors excluded from timers unless explicitly stated; no browser, archive, AI campaign, network, rendering or GPU timings.' };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2); requireValue(args.every(arg => arg === '--smoke' || /^--section=(all|kernel|fleet|scale)$/.test(arg)), 'arguments: --smoke and --section=all|kernel|fleet|scale');
  const section = args.find(arg => arg.startsWith('--section='))?.slice(10) as 'all' | 'kernel' | 'fleet' | 'scale' | undefined;
  console.log(JSON.stringify(benchmarkArmiesFleets({ smoke: args.includes('--smoke'), section }), null, 2));
}
