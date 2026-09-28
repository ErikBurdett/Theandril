import { applyCommand, createArmyFormation, deserializeGame, serializeGame, type GameCommand } from '@theandril/sim';
import { navalCampaign, NAVAL_FIXTURE as N } from './naval-fixture';
import { refreshAuthoredSight } from './authored-land';

/** Explicit authored harbor, overseas force and depleted convoy, not earned
 * expansion. Both original hearths were founded by ordinary commands in the
 * naval fixture; research, embarkation and the approach use ordinary commands.
 * No supply offer, acceptance, payment, replenishment or recovery is injected. */
export function supplyAccessCampaign({ approach = true, harbor = true } = {}) {
  let state = navalCampaign({ enemyFleet: false });
  if (harbor && !state.settlements[N.islandId]!.buildings.includes('building.harbor')) state.settlements[N.islandId]!.buildings.push('building.harbor');
  if (!harbor) state.settlements[N.islandId]!.buildings = state.settlements[N.islandId]!.buildings.filter(id => id !== 'building.harbor');
  const fieldId = `army.${state.nextId++}`;
  state.armies[fieldId] = { id: fieldId, factionId: state.turnOwnerId, name: 'Overseas field force', cell: N.landingCell, movement: 3,
    formations: Array.from({ length: 3 }, (_, i) => createArmyFormation(i ? `army.${state.nextId++}` : fieldId, 'unit.guard')) };
  refreshAuthoredSight(state);
  state = deserializeGame(serializeGame(state));
  const buyerId = state.turnOwnerId, providerId = state.factions[1]!.id;
  const issue = (command: GameCommand) => { const result = applyCommand(state, command); if (!result.ok) throw new Error(result.error); };
  if (approach) {
    issue({ type: 'research', factionId: buyerId, technologyId: 'technology.ocean_navigation' });
    issue({ type: 'embarkArmy', factionId: buyerId, armyId: N.cargoId, fleetId: N.fleetId });
    issue({ type: 'queueMovement', factionId: buyerId, armyId: N.fleetId, target: N.voyageCell });
    for (let step = 0; state.routes[N.fleetId] && step < 8; step++) issue({ type: 'endTurn', factionId: buyerId });
    if (state.routes[N.fleetId]) throw new Error('Supply fixture convoy did not complete its real approach.');
    state.armies[N.fleetId]!.provisions = 0;
    state = deserializeGame(serializeGame(state));
  }
  return { state, buyerId, providerId, fieldId, sourceId: N.islandId, fleetId: N.fleetId, cargoId: N.cargoId,
    proposal: { type: 'proposeSupplyAccess' as const, factionId: buyerId, targetFactionId: providerId, settlementId: N.islandId, feeCoin: 20, termTurns: 10 } };
}
