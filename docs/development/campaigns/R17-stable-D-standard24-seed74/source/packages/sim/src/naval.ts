import { BUILDINGS, TECHNOLOGIES, UNITS, unitsForRules } from '@theandril/content';
import { isPassable, neighbors, TERRAIN, WATER_DEPTH } from '@theandril/mapgen';
import type { Army, CommandResult, DomainEvent, GameState, Settlement } from './types';
import { armySight } from './army-composition';
import { armyHasCharacterMission, removeArmyCharacters } from './characters';
import { indexes, updateSight } from './visibility';
import { rulesVersion } from './rules';

export interface TransportAftermath { armyId: string; name: string; lostFormationIds: string[]; outcome: 'damaged' | 'lost' }
export interface TransportSnapshot { armyId: string; fleetId: string; factionId: string; name: string; formationIds: string[] }
export interface ProductionOption {
  settlementId: string; itemId: string; kind: 'building' | 'land' | 'naval'; canQueue: boolean; blocker: string | null;
  /** Naval quotes only: currently legal, visible berth. Not reserved; completion rechecks it. */
  launchCell?: number | null;
}
export interface NavalArmyView {
  domain: 'land' | 'naval'; carrierId: string | null;
  cargo: { armyId: string; name: string; formations: number }[];
  transportCapacity: number; transportUsed: number; canEnterDeepWater: boolean;
  embarkOptions: { fleetId: string; label: string; availableCapacity: number; canEmbark: boolean; blocker: string | null }[];
  disembarkOptions: { cell: number; canDisembark: boolean; blocker: string | null }[];
  transportOptionsTruncated: boolean;
}
const units = new Map(UNITS.map(item => [item.id, item]));
const buildings = new Map(BUILDINGS.map(item => [item.id, item]));
const fail = (error: string): CommandResult => ({ ok: false, error, events: [] });
const order = (a: { id: string }, b: { id: string }) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
const cargoIndexes = new WeakMap<GameState, Map<string, Set<string>>>();
export function rebuildTransportIndexes(state: GameState): void {
  const index = new Map<string, Set<string>>();
  for (const [armyId, fleetId] of Object.entries(state.transports)) { const cargo = index.get(fleetId) ?? new Set<string>(); cargo.add(armyId); index.set(fleetId, cargo); }
  cargoIndexes.set(state, index);
}
function cargoIndex(state: GameState): Map<string, Set<string>> { if (!cargoIndexes.has(state)) rebuildTransportIndexes(state); return cargoIndexes.get(state)!; }
export const armyDomain = (army: Army): 'land' | 'naval' => units.get(army.formations[0]?.unitId ?? '')?.movementDomain === 'naval' ? 'naval' : 'land';
export const fleetCargo = (state: GameState, fleetId: string): Army[] => [...(cargoIndex(state).get(fleetId) ?? [])].map(id => state.armies[id]).filter((army): army is Army => Boolean(army)).sort(order);
export const fleetTransportCapacity = (fleet: Army): number => fleet.formations.reduce((sum, formation) => sum + (units.get(formation.unitId)?.naval?.transportCapacity ?? 0), 0);
export const fleetTransportUsed = (state: GameState, fleetId: string): number => fleetCargo(state, fleetId).reduce((sum, army) => sum + army.formations.length, 0);
export function snapshotFleetCargo(state: GameState, fleets: Army[]): TransportSnapshot[] {
  return fleets.flatMap(fleet => fleetCargo(state, fleet.id).map(army => ({ armyId: army.id, fleetId: fleet.id, factionId: army.factionId, name: army.name, formationIds: army.formations.map(item => item.id) }))).sort((a, b) => a.armyId < b.armyId ? -1 : 1);
}
export const carriedArmyBlocker = (state: GameState, armyId: string): string | null => state.transports[armyId] ? 'This army is aboard a transport. Disembark before issuing independent orders.' : null;
export function armyTransportBlocker(state: GameState, armyId: string): string | null {
  return carriedArmyBlocker(state, armyId) ?? (cargoIndex(state).get(armyId)?.size ? 'Disembark all carried armies before reorganizing this fleet.' : null);
}
export function fleetCanEnterDeepWater(state: GameState, army: Army): boolean {
  return armyDomain(army) === 'naval' && army.formations.every(formation => units.get(formation.unitId)?.naval?.oceanCapable)
    && Boolean(state.progression[army.factionId]?.technologies.includes('technology.ocean_navigation'));
}
/** Shared travel-domain rule; callers supply only geography they may know. */
export function travelTerrainBlocker(domain: 'land' | 'naval', canEnterDeepWater: boolean, terrain: number, depth: number): string | null {
  if (domain === 'land') return isPassable(terrain) ? null : 'Water and mountains are impassable to these armies. Use a transport fleet to cross water.';
  if (terrain !== TERRAIN.water) return 'Fleets travel on water. Disembark their passengers onto an adjacent shore.';
  if (depth === WATER_DEPTH.deep && !canEnterDeepWater) return 'Deep ocean requires Ocean navigation and an ocean-capable hull in every fleet formation.';
  return depth === WATER_DEPTH.shallow || depth === WATER_DEPTH.deep ? null : 'This hex has no navigable water.';
}
export function armyTerrainBlocker(state: GameState, army: Army, cell: number): string | null {
  if (rulesVersion(state) < 8) return isPassable(state.world.terrain[cell] ?? 0) ? null : 'Water and mountains are impassable to these armies.';
  return travelTerrainBlocker(armyDomain(army), fleetCanEnterDeepWater(state, army), state.world.terrain[cell] ?? 0, state.world.waterDepth[cell] ?? 0);
}
function decisionBlocker(state: GameState): string | null { return state.victory ? 'This campaign has ended in victory.' : state.battle || state.pendingCapture ? 'Resolve the pending battle or capture first.' : null; }
function operationBlocker(state: GameState, army: Army): string | null {
  if (armyHasCharacterMission(state, army.id)) return 'Cancel the army’s stationary mission before transport.';
  if (Object.values(state.sieges).some(siege => siege.armyId === army.id)) return 'Lift this army’s siege before transport.';
  return null;
}
export function embarkObjection(state: GameState, factionId: string, armyId: string, fleetId: string): string | null {
  const decision = decisionBlocker(state); if (decision) return decision;
  const army = state.armies[armyId], fleet = state.armies[fleetId];
  if (!army || !fleet || army.factionId !== factionId || fleet.factionId !== factionId) return 'Choose an army and transport fleet you control.';
  if (armyId === fleetId || armyDomain(army) !== 'land' || armyDomain(fleet) !== 'naval') return 'Only a land army can board a naval transport fleet.';
  if (state.transports[armyId] || state.transports[fleetId]) return 'An embarked army cannot board another carrier.';
  if (!isPassable(state.world.terrain[army.cell] ?? 0) || state.world.terrain[fleet.cell] !== TERRAIN.water || !neighbors(army.cell, state.world.width, state.world.height).includes(fleet.cell)) return 'The army must stand on a shore adjacent to the fleet.';
  const operation = operationBlocker(state, army) ?? operationBlocker(state, fleet); if (operation) return operation;
  if (army.movement < 1 || fleet.movement < 1) return 'Both army and fleet need movement remaining to embark. Embarking spends the army’s movement and one fleet movement.';
  if (army.formations.length + fleetTransportUsed(state, fleet.id) > fleetTransportCapacity(fleet)) return 'The fleet does not have enough free transport spaces for every formation.';
  return null;
}
export function disembarkObjection(state: GameState, factionId: string, armyId: string, target: number): string | null {
  const decision = decisionBlocker(state); if (decision) return decision;
  const army = state.armies[armyId], fleet = state.armies[state.transports[armyId] ?? ''];
  if (!army || !fleet || army.factionId !== factionId || fleet.factionId !== factionId) return 'Choose one of your embarked armies.';
  if (!Number.isInteger(target) || !neighbors(fleet.cell, state.world.width, state.world.height).includes(target)) return 'Choose a shore adjacent to the transport fleet.';
  const index = indexes(state);
  if (!index.visible.get(factionId)?.has(target)) return 'The landing shore must be currently visible.';
  if (!isPassable(state.world.terrain[target] ?? 0)) return 'Passengers can disembark only onto passable land.';
  if (fleet.movement < 1) return 'The fleet needs one movement remaining to disembark passengers.';
  if ([...(index.armies.get(target) ?? [])].some(id => state.armies[id]?.factionId !== factionId)) return 'Another faction occupies the landing shore. Naval transport cannot bypass a defending army.';
  const town = state.settlements[index.settlements.get(target) ?? ''];
  if (town && town.factionId !== factionId) return 'A foreign settlement must be captured by a land army; passengers cannot disembark inside it.';
  if (town && state.sieges[town.id]) return 'The landing settlement is under blockade.';
  return operationBlocker(state, fleet);
}
export function embarkArmy(state: GameState, factionId: string, armyId: string, fleetId: string): CommandResult {
  const objection = embarkObjection(state, factionId, armyId, fleetId); if (objection) return fail(objection);
  const army = state.armies[armyId]!, fleet = state.armies[fleetId]!, index = indexes(state);
  updateSight(state, factionId, army.cell, armySight(army), -1); index.armies.get(army.cell)?.delete(armyId);
  state.transports[armyId] = fleetId; const cargo = cargoIndex(state).get(fleetId) ?? new Set<string>(); cargo.add(armyId); cargoIndex(state).set(fleetId, cargo);
  army.cell = fleet.cell; army.movement = 0; fleet.movement--;
  delete state.routes[armyId];
  return { ok: true, events: [{ turn: state.turn, factionId, cell: fleet.cell, type: 'army_embarked', message: `${army.name} embarked ${army.formations.length} formations aboard ${fleet.name}. Lost transport formations can drown passengers; a sunk fleet loses all cargo.` }] };
}
export function disembarkArmy(state: GameState, factionId: string, armyId: string, target: number): CommandResult {
  const objection = disembarkObjection(state, factionId, armyId, target); if (objection) return fail(objection);
  const army = state.armies[armyId]!, fleetId = state.transports[armyId]!, fleet = state.armies[fleetId]!, index = indexes(state);
  delete state.transports[armyId]; cargoIndex(state).get(fleetId)?.delete(armyId);
  army.cell = target; army.movement = 0; fleet.movement--;
  const occupants = index.armies.get(target) ?? new Set<string>(); occupants.add(armyId); index.armies.set(target, occupants);
  updateSight(state, factionId, target, armySight(army), 1);
  return { ok: true, events: [{ turn: state.turn, factionId, cell: target, type: 'army_disembarked', message: `${army.name} disembarked from ${fleet.name}. Its formations and characters may receive fresh movement next turn.` }] };
}
/** Carried formations never contribute a second sight source or occupancy layer. */
export function moveFleetCargo(state: GameState, fleetId: string): void { const fleet = state.armies[fleetId]; if (fleet) for (const army of fleetCargo(state, fleetId)) { army.cell = fleet.cell; army.movement = 0; } }
/** Resolve losses after actual ship casualties; stable highest IDs are lost first. */
export function reconcileFleetCargo(state: GameState, fleetId: string, events: DomainEvent[]): TransportAftermath[] {
  const fleet = state.armies[fleetId], cargo = fleetCargo(state, fleetId);
  let excess = Math.max(0, cargo.reduce((sum, army) => sum + army.formations.length, 0) - (fleet ? fleetTransportCapacity(fleet) : 0));
  const aftermath: TransportAftermath[] = [];
  for (const army of [...cargo].reverse()) {
    if (fleet) army.cell = fleet.cell;
    army.movement = 0;
    if (!excess) continue;
    const lost = [...army.formations].sort(order).reverse().slice(0, excess), lostIds = new Set(lost.map(item => item.id));
    excess -= lost.length; army.formations = army.formations.filter(item => !lostIds.has(item.id));
    const outcome = army.formations.length ? 'damaged' : 'lost';
    aftermath.push({ armyId: army.id, name: army.name, lostFormationIds: [...lostIds], outcome });
    events.push({ turn: state.turn, factionId: army.factionId, cell: army.cell, type: 'transport_losses', message: `${army.name} lost ${lost.length} carried formation${lost.length === 1 ? '' : 's'} after transport capacity was destroyed${outcome === 'lost' ? '; the entire army was lost at sea' : ''}.` });
    if (outcome === 'lost') { removeArmyCharacters(state, army.id, events); delete state.transports[army.id]; cargoIndex(state).get(fleetId)?.delete(army.id); delete state.routes[army.id]; delete state.armies[army.id]; }
  }
  return aftermath;
}
export function getNavalArmyView(state: GameState, army: Army): NavalArmyView {
  const domain = armyDomain(army), carrierId = state.transports[army.id] ?? null;
  const candidates: Army[] = [];
  if (domain === 'land' && !carrierId) for (const cell of neighbors(army.cell, state.world.width, state.world.height)) for (const id of indexes(state).armies.get(cell) ?? []) {
    const other = state.armies[id]; if (other?.factionId === army.factionId && armyDomain(other) === 'naval' && fleetTransportCapacity(other)) candidates.push(other);
  }
  candidates.sort(order);
  return { domain, carrierId, cargo: fleetCargo(state, army.id).map(item => ({ armyId: item.id, name: item.name, formations: item.formations.length })),
    transportCapacity: fleetTransportCapacity(army), transportUsed: fleetTransportUsed(state, army.id), canEnterDeepWater: fleetCanEnterDeepWater(state, army),
    embarkOptions: candidates.slice(0, 24).map(fleet => { const blocker = embarkObjection(state, army.factionId, army.id, fleet.id); return { fleetId: fleet.id, label: fleet.name, availableCapacity: fleetTransportCapacity(fleet) - fleetTransportUsed(state, fleet.id), canEmbark: !blocker, blocker }; }),
    disembarkOptions: carrierId ? neighbors(army.cell, state.world.width, state.world.height).filter(cell => state.explored[army.factionId]?.has(cell) && isPassable(state.world.terrain[cell] ?? 0)).map(cell => { const blocker = disembarkObjection(state, army.factionId, army.id, cell); return { cell, canDisembark: !blocker, blocker }; }) : [],
    transportOptionsTruncated: candidates.length > 24 };
}
export function productionRequirementBlocker(state: GameState, town: Settlement, itemId: string): string | null {
  const definition = buildings.get(itemId) ?? units.get(itemId); if (!definition) return 'Unknown construction or recruitment item.';
  if ((units.get(itemId)?.introducedInRules ?? 4) > rulesVersion(state)) return 'Unknown construction or recruitment item.';
  if (rulesVersion(state) < 8) return itemId === 'building.harbor' || units.get(itemId)?.movementDomain === 'naval' ? 'Unknown construction or recruitment item.' : null;
  const technologies = state.progression[town.factionId]?.technologies ?? [];
  const missing = definition.requiredTechnologies?.find(id => !technologies.includes(id));
  if (missing) return `Research ${TECHNOLOGIES.find(item => item.id === missing)?.name ?? missing} first.`;
  const unit = units.get(itemId);
  const missingBuilding = unit?.requiredBuildings?.find(id => !town.buildings.includes(id));
  if (missingBuilding) return `Build ${buildings.get(missingBuilding)?.name ?? missingBuilding} first.`;
  if ((buildings.get(itemId)?.coastalOnly || unit?.movementDomain === 'naval') && !neighbors(town.cell, state.world.width, state.world.height).some(cell => state.world.terrain[cell] === TERRAIN.water)) return 'This construction requires a coastal settlement.';
  if (unit?.movementDomain === 'naval' && (town.occupationTurns || state.sieges[town.id])) return 'Naval recruitment requires a recovered harbor free of siege.';
  if (unit?.movementDomain === 'naval' && navalLaunchCell(state, town, itemId) === null) return 'No permitted adjacent water hex is clear for launching this fleet.';
  return null;
}
export function navalLaunchCell(state: GameState, town: Settlement, unitId: string): number | null {
  const unit = units.get(unitId); if (unit?.movementDomain !== 'naval') return town.cell;
  const ocean = Boolean(unit.naval?.oceanCapable && state.progression[town.factionId]?.technologies.includes('technology.ocean_navigation'));
  const index = indexes(state);
  return neighbors(town.cell, state.world.width, state.world.height).sort((a, b) => a - b).find(cell => !travelTerrainBlocker('naval', ocean, state.world.terrain[cell] ?? 0, state.world.waterDepth[cell] ?? 0)
    && ![...(index.armies.get(cell) ?? [])].some(id => state.armies[id]?.factionId !== town.factionId)) ?? null;
}
export function observeProductionOptions(state: GameState, factionId: string): ProductionOption[] {
  const treasury = state.factions.find(item => item.id === factionId)?.treasury ?? 0;
  return Object.values(state.settlements).filter(town => town.factionId === factionId).sort(order).flatMap(town => [...BUILDINGS, ...unitsForRules(rulesVersion(state))].map(item => {
    const building = buildings.get(item.id);
    const blocker = decisionBlocker(state) ?? productionRequirementBlocker(state, town, item.id)
      ?? (town.queue.length >= 5 ? 'The production queue is full (five items).' : null)
      ?? (building && (town.buildings.includes(item.id) || town.queue.some(order => order.itemId === item.id)) ? 'That building is already built or queued.' : null)
      ?? (treasury < item.coinCost ? 'Not enough coin to fund that order.' : null);
    const naval = !building && units.get(item.id)?.movementDomain === 'naval';
    const launch = naval && !blocker ? navalLaunchCell(state, town, item.id) : null;
    return { settlementId: town.id, itemId: item.id, kind: building ? 'building' as const : naval ? 'naval' as const : 'land' as const, canQueue: !blocker, blocker,
      ...(naval ? { launchCell: launch !== null && indexes(state).visible.get(factionId)?.has(launch) ? launch : null } : {}) };
  }));
}
export function validateTransports(state: GameState): void {
  for (const [armyId, fleetId] of Object.entries(state.transports)) {
    const army = state.armies[armyId], fleet = state.armies[fleetId];
    if (!army || !fleet || armyId === fleetId || army.factionId !== fleet.factionId || armyDomain(army) !== 'land' || armyDomain(fleet) !== 'naval' || state.transports[fleetId]
      || army.cell !== fleet.cell || army.movement !== 0 || state.routes[armyId] || armyHasCharacterMission(state, armyId)) throw new Error('Invalid save: inconsistent army transport binding.');
  }
  rebuildTransportIndexes(state);
  for (const fleetId of cargoIndex(state).keys()) if (fleetTransportUsed(state, fleetId) > fleetTransportCapacity(state.armies[fleetId]!)) throw new Error('Invalid save: transport capacity exceeded.');
}
