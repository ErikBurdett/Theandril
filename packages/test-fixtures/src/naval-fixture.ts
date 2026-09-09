import { deriveWaterDepth } from '@theandril/mapgen';
import { applyCommand, createArmyFormation, createGame, deserializeGame, serializeGame, type GameCommand, type GameState } from '@theandril/sim';

export const NAVAL_FIXTURE = {
  homeId: 'settlement.5', homeName: 'Charter Quay', homeCell: 780,
  islandId: 'settlement.6', islandName: 'Reedwatch Quay', islandCell: 789,
  fleetId: 'army.2', fleetName: 'Lantern ferry', fleetCell: 781,
  cargoId: 'army.9', cargoName: 'Island hearth expedition',
  coastalId: 'army.11', coastalName: 'Shorewatch squadron', coastalCell: 829,
  enemyFleetId: 'army.4', enemyFleetName: 'Reedbound tideguard', enemyFleetCell: 788,
  marshalId: 'character.12', shallowCell: 782, deepCell: 783,
  voyageCell: 786, landingWaterCell: 836, landingCell: 837,
} as const;

function command(state: GameState, input: GameCommand): void {
  const result = applyCommand(state, input);
  if (!result.ok) throw new Error(`Naval fixture ${input.type}: ${result.error}`);
}

/** Authored archipelago and funded harbor, not a generated-world or earned-economy benchmark.
 * Armies, hulls and infrastructure are explicit setup; no combat/transport outcome is injected.
 * Both sides know the authored geography, while live entities still use normal current sight.
 */
export function navalCampaign({ enemyFleet = true }: { enemyFleet?: boolean } = {}): GameState {
  let state = createGame({ seed: 20260905, size: 'tiny', factionCount: 2, pace: 'short', generatorVersion: 4 });
  const world = state.world;
  state.resources.deposits = {}; // This fixture replaces the entire physical geography with resource-free authored land/water.
  world.terrain.fill(0); world.biome.fill(0); world.fertility.fill(0);
  for (let y = 8; y <= 24; y++) for (let x = 5; x <= 12; x++) {
    const cell = y * world.width + x; world.terrain[cell] = 1; world.biome[cell] = 1; world.fertility[cell] = 65;
  }
  for (let y = 8; y <= 24; y++) for (let x = 21; x <= 30; x++) {
    const cell = y * world.width + x; world.terrain[cell] = 1; world.biome[cell] = 1; world.fertility[cell] = 65;
  }
  world.waterDepth = deriveWaterDepth(world.width, world.height, world.terrain);
  world.starts = [NAVAL_FIXTURE.homeCell, NAVAL_FIXTURE.islandCell];
  state.armies['army.1']!.cell = NAVAL_FIXTURE.homeCell;
  state.armies['army.2']!.cell = NAVAL_FIXTURE.homeCell;
  state.armies['army.3']!.cell = NAVAL_FIXTURE.islandCell;
  state.armies['army.4']!.cell = NAVAL_FIXTURE.islandCell;
  for (const faction of state.factions) {
    faction.treasury = 2000; faction.knowledge = 500;
    state.explored[faction.id] = new Set(Array.from({ length: world.width * world.height }, (_, cell) => cell));
    state.progression[faction.id]!.technologies = ['technology.coastal_navigation'];
  }
  state = deserializeGame(serializeGame(state));
  command(state, { type: 'found', factionId: state.turnOwnerId, armyId: 'army.1', name: NAVAL_FIXTURE.homeName });
  command(state, { type: 'found', factionId: state.factions[1]!.id, armyId: 'army.3', name: NAVAL_FIXTURE.islandName });
  const home = state.settlements[NAVAL_FIXTURE.homeId]!;
  home.buildings = ['building.harbor', 'building.workshop']; home.population = 8;
  state.settlements[NAVAL_FIXTURE.islandId]!.buildings = ['building.harbor'];
  const nextFormation = (unitId: string) => createArmyFormation(`army.${state.nextId++}`, unitId);
  Object.assign(state.armies[NAVAL_FIXTURE.fleetId]!, { name: NAVAL_FIXTURE.fleetName, cell: NAVAL_FIXTURE.fleetCell, movement: 4,
    formations: [createArmyFormation(NAVAL_FIXTURE.fleetId, 'unit.transport'), nextFormation('unit.transport'), nextFormation('unit.transport')] });
  Object.assign(state.armies[NAVAL_FIXTURE.enemyFleetId]!, { name: NAVAL_FIXTURE.enemyFleetName, cell: NAVAL_FIXTURE.enemyFleetCell, movement: 4,
    formations: [createArmyFormation(NAVAL_FIXTURE.enemyFleetId, 'unit.coastal_warship')] });
  const cargoId = `army.${state.nextId++}`;
  state.armies[cargoId] = { id: cargoId, factionId: state.turnOwnerId, name: NAVAL_FIXTURE.cargoName, cell: NAVAL_FIXTURE.homeCell, movement: 3,
    formations: [createArmyFormation(cargoId, 'unit.colonist'), nextFormation('unit.guard')] };
  const coastalId = `army.${state.nextId++}`;
  state.armies[coastalId] = { id: coastalId, factionId: state.turnOwnerId, name: NAVAL_FIXTURE.coastalName, cell: NAVAL_FIXTURE.coastalCell, movement: 4,
    formations: [createArmyFormation(coastalId, 'unit.coastal_warship')] };
  for (const army of Object.values(state.armies)) army.formations.sort((a, b) => a.id < b.id ? -1 : 1);
  if (!enemyFleet) delete state.armies[NAVAL_FIXTURE.enemyFleetId];
  state = deserializeGame(serializeGame(state));
  command(state, { type: 'recruitCharacter', factionId: state.turnOwnerId, settlementId: home.id, definitionId: 'character.marshal' });
  if (!state.armies[NAVAL_FIXTURE.cargoId] || !state.armies[NAVAL_FIXTURE.coastalId] || !state.characters[NAVAL_FIXTURE.marshalId]) throw new Error('Naval fixture stable IDs changed.');
  return deserializeGame(serializeGame(state));
}
