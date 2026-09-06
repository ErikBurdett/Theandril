/** Read-only gameplay diagnostic. AI receives observations only; geometry metrics never feed its plans. */
import { performance } from 'node:perf_hooks';
import { planTurn } from '@theandril/ai';
import { UNITS, type CampaignPace } from '@theandril/content';
import { MAP_DIMENSIONS, RECOMMENDED_FACTION_COUNTS, hexDistance, isPassable, neighbors, type MapSize, type World } from '@theandril/mapgen';
import { applyCommand, createGame, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand, type GameState, type Observation } from '@theandril/sim';

interface Case { seed: number; size: MapSize; factions: number; pace: CampaignPace; turns: number }
const numeric = (value: string | undefined, fallback: number, min: number, max: number): number => {
  const number = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(number) || number < min || number > max) throw new Error(`Expected integer ${min}–${max}, received ${value}`);
  return number;
};
const args = new Map(process.argv.slice(2).map(arg => { const match = /^--([a-z-]+)=(.+)$/.exec(arg); if (!match) throw new Error('Use --name=value arguments.'); return [match[1]!, match[2]!] as const; }));
for (const name of args.keys()) if (!['seed', 'size', 'factions', 'pace', 'turns', 'max-ms', 'geometry-only'].includes(name)) throw new Error('Unknown argument: ' + name);
const seed = numeric(args.get('seed'), 748291, 0, 0xffff_ffff), turns = numeric(args.get('turns'), 600, 1, 1200);
const maxMs = numeric(args.get('max-ms'), 60_000, 1000, 120_000);
const pace = args.get('pace') ?? 'long';
if (!['short', 'standard', 'long', 'epic'].includes(pace)) throw new Error('Unknown pace');
const requestedSize = args.get('size');
if (requestedSize && !Object.hasOwn(MAP_DIMENSIONS, requestedSize)) throw new Error('Unknown size');
const sizes = requestedSize ? [requestedSize as MapSize] : ['standard', 'huge'] as const;
const cases: Case[] = sizes.flatMap(size => {
  const counts = args.get('factions')?.split(',').map(value => numeric(value, 4, 1, 48)) ?? (size === 'standard' ? [4, RECOMMENDED_FACTION_COUNTS[size]] : [RECOMMENDED_FACTION_COUNTS[size]]);
  return [...new Set(counts)].map(factions => ({ seed, size, factions, pace: pace as CampaignPace, turns }));
});
if (cases.length > 6) throw new Error('Diagnostic is limited to six cases per invocation.');
if (args.has('geometry-only') && args.get('geometry-only') !== 'true') throw new Error('--geometry-only=true is the supported flag.');
const unitById = new Map(UNITS.map(unit => [unit.id, unit]));
const stats = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return { min: sorted[0] ?? null, median: sorted.length ? sorted[Math.floor(sorted.length / 2)]! : null, max: sorted.at(-1) ?? null };
};

/** Dial queue for fixed physical costs1/2: O(cells+edges) per start, no gameplay path-query budget. */
function travelCosts(world: World, origin: number): { distance: Int32Array; reachable: number } {
  const distance = new Int32Array(world.terrain.length).fill(-1), buckets: number[][] = [[origin], [], []], heads = [0, 0, 0];
  distance[origin] = 0;
  let current = 0, pending = 1, reachable = 0;
  while (pending > 0) {
    const slot = current % 3, bucket = buckets[slot]!;
    if (heads[slot]! >= bucket.length) { buckets[slot] = []; heads[slot] = 0; current++; continue; }
    const cell = bucket[heads[slot]!]!; heads[slot] = heads[slot]! + 1; pending--;
    if (distance[cell] !== current) continue;
    reachable++;
    for (const next of neighbors(cell, world.width, world.height)) {
      const terrain = world.terrain[next]!;
      if (!isPassable(terrain)) continue;
      const nextCost = current + (terrain === 2 || terrain === 3 ? 2 : 1);
      if (distance[next] !== -1 && distance[next]! <= nextCost) continue;
      distance[next] = nextCost; buckets[nextCost % 3]!.push(next); pending++;
    }
  }
  return { distance, reachable };
}
function geography(world: World) {
  const nearestHex: number[] = [], nearestCost: number[] = [], pairs: { a: number; b: number; hexes: number; cost: number | null }[] = [];
  let reachableCells = 0, disconnectedPairs = 0;
  for (const [index, start] of world.starts.entries()) {
    const travel = travelCosts(world, start); reachableCells = Math.max(reachableCells, travel.reachable);
    const otherStarts = world.starts.filter((_, other) => other !== index);
    if (otherStarts.length) {
      nearestHex.push(Math.min(...otherStarts.map(other => hexDistance(start, other, world.width))));
      const costs = otherStarts.map(other => travel.distance[other]!).filter(cost => cost >= 0);
      if (costs.length) nearestCost.push(Math.min(...costs));
    }
    for (let other = index + 1; other < world.starts.length; other++) {
      const target = world.starts[other]!, cost = travel.distance[target]!;
      if (cost < 0) disconnectedPairs++;
      pairs.push({ a: index, b: other, hexes: hexDistance(start, target, world.width), cost: cost < 0 ? null : cost });
    }
  }
  return { cells: world.terrain.length, passableCells: world.terrain.filter(isPassable).length, reachableStartComponentCells: reachableCells,
    connectedStartPairs: pairs.length - disconnectedPairs, disconnectedPairs, nearestHex: stats(nearestHex), nearestTerrainCost: stats(nearestCost),
    directScoutMovement5LowerBoundTurns: stats(nearestCost.map(cost => Math.ceil(cost / 5))),
    startCells: world.starts, pairs: pairs.length <= 12 ? pairs : undefined,
    note: 'Omniscient static audit only, not AI input. Costs are physical1/2, no foreign blockers; cost/5 is an optimistic travel lower bound, not a contact forecast.' };
}
function sightDisk(origin: number, width: number, height: number, radius: number): Set<number> {
  const seen = new Set([origin]); let frontier = [origin];
  for (let step = 0; step < radius; step++) { const next: number[] = []; for (const cell of frontier) for (const neighbor of neighbors(cell, width, height)) if (!seen.has(neighbor)) { seen.add(neighbor); next.push(neighbor); } frontier = next; }
  return seen;
}
function initialExplorationScore(view: Observation) {
  const known = new Set(view.cells.map(cell => cell.cell));
  return view.armies.filter(army => army.factionId === view.factionId).map(army => {
    const choices = neighbors(army.cell, view.width, view.height).filter(cell => view.cells.some(known => known.cell === cell && isPassable(known.terrain)));
    return { unitId: army.unitId, movement: army.movement, sight: unitById.get(army.unitId)!.sight,
      currentHeuristicUnexploredMax: Math.max(0, ...choices.map(cell => neighbors(cell, view.width, view.height).filter(next => !known.has(next)).length)),
      actualPotentialNewSightMax: Math.max(0, ...choices.map(cell => [...sightDisk(cell, view.width, view.height, unitById.get(army.unitId)!.sight)].filter(next => !known.has(next)).length)) };
  });
}
function campaign(settings: Case, state: GameState, deadline: number) {
  let mirror: GameState | undefined, commands = 0, rejected = 0, firstWar: number | null = null, firstBattle: number | null = null;
  const commandTypes: Record<string, number> = {}, rejections: { turn: number; command: GameCommand; error?: string }[] = [];
  const firstContact: Record<string, number | null> = Object.fromEntries(state.factions.map(faction => [faction.id, null]));
  const contacts = new Map(state.factions.map(faction => [faction.id, new Set<string>()]));
  const firstStarts = new Map(state.factions.map((faction, index) => [faction.id, state.world.starts[index]!]));
  const scouts = new Map(Object.values(state.armies).filter(army => army.formations.some(formation => formation.unitId === 'unit.scout')).map(army => [army.id, { origin: army.cell, maxDisplacement: 0, visited: new Set([army.cell]) }]));
  const explorationScore = initialExplorationScore(getObservation(state, state.turnOwnerId));
  const snapshots: object[] = [];
  const movement = { available: 0, unused: 0, armyRounds: 0, movedArmyRounds: 0 };
  let maxLocalHeuristic = 0, heuristicSamples = 0, mirroredCommands = 0;
  const observe = (view: Observation) => {
    for (const entity of [...view.armies, ...view.settlements]) if (entity.factionId !== view.factionId) {
      contacts.get(view.factionId)!.add(entity.factionId);
      firstContact[view.factionId] ??= view.turn;
    }
    const known = new Set(view.cells.map(cell => cell.cell));
    for (const army of view.armies.filter(army => army.factionId === view.factionId)) for (const cell of neighbors(army.cell, view.width, view.height)) {
      const score = neighbors(cell, view.width, view.height).filter(next => !known.has(next)).length;
      maxLocalHeuristic = Math.max(maxLocalHeuristic, score); heuristicSamples++;
    }
  };
  const issue = (command: GameCommand) => {
    const result = applyCommand(state, command); commands++; commandTypes[command.type] = (commandTypes[command.type] ?? 0) + 1;
    if (mirror) { const repeated = applyCommand(mirror, command); mirroredCommands++; if (JSON.stringify(repeated) !== JSON.stringify(result)) throw new Error('Resumed command result differs'); }
    if (!result.ok) { rejected++; if (rejections.length < 8) rejections.push({ turn: state.turn, command, error: result.error }); }
    for (const event of result.events) { if (event.type === 'war_declared') firstWar ??= event.turn; if (event.type === 'battle_started') firstBattle ??= event.turn; }
    for (const [id, scout] of scouts) { const army = state.armies[id]; if (army) { scout.visited.add(army.cell); scout.maxDisplacement = Math.max(scout.maxDisplacement, hexDistance(scout.origin, army.cell, state.world.width)); } }
  };
  const settle = () => {
    for (let attempt = 0; state.battle || state.pendingCapture; attempt++) {
      if (attempt >= 4) throw new Error('Decision resolution failed to finish');
      if (state.battle) issue({ type: 'autoResolveBattle', factionId: [state.battle.attackerFactionId, state.battle.defenderFactionId].includes(state.turnOwnerId) ? state.turnOwnerId : state.battle.attackerFactionId });
      else if (state.pendingCapture) { const choice = planTurn(getObservation(state, state.pendingCapture.factionId))[0]; if (!choice || choice.type !== 'resolveCapture') throw new Error('AI did not choose capture outcome'); issue(choice); }
    }
  };
  const snapshot = () => ({ turn: state.turn, settlements: Object.keys(state.settlements).length, armies: Object.keys(state.armies).length,
    formations: Object.values(state.armies).reduce((sum, army) => sum + army.formations.length, 0),
    factionsWithContact: Object.values(firstContact).filter(turn => turn !== null).length,
    exploredByFaction: state.factions.map(faction => state.explored[faction.id]!.size),
    townsByFaction: state.factions.map(faction => Object.values(state.settlements).filter(town => town.factionId === faction.id).length) });
  snapshots.push(snapshot());
  while (!state.victory && state.turn <= settings.turns && performance.now() < deadline) {
    for (const faction of state.factions) {
      const view = getObservation(state, faction.id); observe(view);
      const before = new Map(view.armies.filter(army => army.factionId === faction.id).map(army => [army.id, { movement: army.movement, cell: army.cell }]));
      for (const command of planTurn(view)) { if (state.victory) break; issue(command); settle(); }
      observe(getObservation(state, faction.id));
      for (const [id, initial] of before) { const army = state.armies[id]; if (!army) continue; movement.available += initial.movement; movement.unused += army.movement; movement.armyRounds++; if (initial.cell !== army.cell) movement.movedArmyRounds++; }
    }
    if (!state.victory) issue({ type: 'endTurn', factionId: state.turnOwnerId });
    for (const faction of state.factions) observe(getObservation(state, faction.id));
    if (state.turn === 26) { mirror = deserializeGame(serializeGame(state)); if (stateHash(mirror) !== stateHash(state)) throw new Error('Midpoint restore differs'); }
    if (state.turn % 50 === 1 || state.victory) snapshots.push(snapshot());
  }
  const finalHash = stateHash(state);
  if (stateHash(deserializeGame(serializeGame(state))) !== finalHash) throw new Error('Final save roundtrip differs');
  if (mirror && stateHash(mirror) !== finalHash) throw new Error('Resumed command replay differs');
  return { completedRounds: state.turn - 1, stopReason: state.victory ? 'victory' : state.turn > settings.turns ? 'turn-limit' : 'wall-time-budget', victory: state.victory,
    firstContact, firstWar, firstBattle, contactsByFaction: Object.fromEntries([...contacts].map(([id, seen]) => [id, [...seen].sort()])),
    commands, commandTypes, rejected, rejections, movement, initialExplorationScore: explorationScore,
    sampledLocalHeuristic: { samples: heuristicSamples, max: maxLocalHeuristic },
    scoutExploration: [...scouts].map(([id, scout]) => ({ id, maxDisplacement: scout.maxDisplacement, uniqueVisited: scout.visited.size })),
    settlementRadiusFromOriginalStart: stats(Object.values(state.settlements).map(town => hexDistance(town.cell, firstStarts.get(town.factionId)!, state.world.width))),
    snapshots, final: snapshot(), finalHash, saveRoundtrip: true, resumedFromTurn: mirror ? 26 : null, mirroredCommands,
    note: 'Matches one planTurn per faction per watch round; no altered proposals, full reveal, artificial encounters, or victory deferral. Contacts sampled at faction decision boundaries and every round end. Wall time excludes browser rendering, archival history and autosaves.' };
}

for (const settings of cases) {
  const started = performance.now(), state = createGame({ seed: settings.seed, size: settings.size, factionCount: settings.factions, pace: settings.pace });
  const geometryStarted = performance.now(), geometry = geography(state.world), geometryMs = performance.now() - geometryStarted;
  const outcome = args.get('geometry-only') === 'true' ? null : campaign(settings, state, performance.now() + maxMs);
  console.log(JSON.stringify({ settings, generatorVersion: state.world.generatorVersion, geometry, geometryMs, outcome, totalMs: performance.now() - started }));
}
