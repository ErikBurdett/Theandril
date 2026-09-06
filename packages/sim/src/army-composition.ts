import { DOCTRINES, UNITS } from '@theandril/content';
import type { Army, ArmyFormation, ArmyView, CommandResult, DomainEvent, GameState } from './types';
import { indexes, updateSight } from './visibility';
import { armyHasCharacterMission, characterCompositionObjection, observeArmyCharacters, transferArmyCharacters } from './characters';

export const MAX_ARMY_FORMATIONS = 12;
const units = new Map(UNITS.map(unit => [unit.id, unit]));
const byId = (a: { id: string }, b: { id: string }) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
export const armyStrength = (army: Army): number => army.formations.reduce((sum, item) => sum + item.strength, 0);
export const armyMaxStrength = (army: Army): number => army.formations.reduce((sum, item) => sum + (units.get(item.unitId)?.strength ?? 0), 0);
export const armyMorale = (army: Army): number => Math.min(...army.formations.map(item => item.morale));
export const armyFatigue = (army: Army): number => Math.max(...army.formations.map(item => item.fatigue));
export const armyMovement = (army: Army, doctrineId: string | null = null): number => Math.min(...army.formations.map(item => units.get(item.unitId)?.movement ?? 0)) + (DOCTRINES.find(item => item.id === doctrineId)?.effects.movement ?? 0);
export const armySight = (army: Army): number => Math.max(0, ...army.formations.map(item => units.get(item.unitId)?.sight ?? 0));
export const armyUpkeep = (army: Army): number => army.formations.reduce((sum, item) => sum + (units.get(item.unitId)?.upkeep ?? 0), 0);
export const armyCanFound = (army: Army): boolean => army.formations.some(item => units.get(item.unitId)?.canFound);
export const armyCanAttack = (army: Army): boolean => army.formations.some(item => units.has(item.unitId) && !units.get(item.unitId)?.canFound);
export function armyUnitId(army: Army): string {
  const ordered = [...army.formations].sort(byId);
  return (ordered.find(item => !units.get(item.unitId)?.canFound) ?? ordered[0])?.unitId ?? '';
}
export function getArmyView(state: GameState, army: Army): ArmyView {
  const blocker = armyHasCharacterMission(state, army.id) ? 'Cancel the active character mission before moving or reorganizing this army.' : null;
  return { ...army, ...observeArmyCharacters(state, army.id), movementBlocker: blocker, reorganizationBlocker: blocker, formations: army.formations.map(item => ({ ...item })), unitId: armyUnitId(army), displayUnitId: armyUnitId(army),
    strength: armyStrength(army), maxStrength: armyMaxStrength(army), morale: armyMorale(army), fatigue: armyFatigue(army),
    maxMovement: armyMovement(army, state.progression[army.factionId]?.doctrineId ?? null), sight: armySight(army), upkeep: armyUpkeep(army), canFound: armyCanFound(army), canAttack: armyCanAttack(army) };
}

/** A new singleton shares its creation serial; migration never consumes nextId. */
export function createArmyFormation(armyId: string, unitId: string): ArmyFormation {
  const unit = units.get(unitId);
  if (!unit) throw new Error('Unknown formation definition');
  return { id: `formation.${armyId.slice(5)}`, unitId, strength: unit.strength, morale: unit.morale, fatigue: 0 };
}
const fail = (error: string): CommandResult => ({ ok: false, error, events: [] });
function objection(state: GameState, factionId: string, army: Army | undefined): string | null {
  if (!army || army.factionId !== factionId) return 'You do not control that army.';
  if (state.battle || state.pendingCapture) return 'Resolve the pending battle or capture before reorganizing armies.';
  if (armyHasCharacterMission(state, army.id)) return 'Cancel the active character mission before reorganizing this army.';
  if (Object.values(state.sieges).some(siege => siege.armyId === army.id)) return 'Lift this army’s siege before reorganizing its formations.';
  return null;
}
function sight(state: GameState, army: Army, delta: 1 | -1): void { updateSight(state, army.factionId, army.cell, armySight(army), delta); }
const changed = (state: GameState, army: Army, events: DomainEvent[]): void => {
  army.formations.sort(byId);
  army.movement = Math.min(army.movement, armyMovement(army, state.progression[army.factionId]?.doctrineId ?? null));
  sight(state, army, 1);
  const route = state.routes[army.id];
  const reason = 'Army composition changed; review the shared travel order.';
  if (route && (route.status !== 'paused' || route.pauseReason !== reason)) {
    route.status = 'paused'; route.pauseReason = reason;
    events.push({ turn: state.turn, factionId: army.factionId, type: 'movement_paused', cell: army.cell, message: `${army.name} paused its travel: ${reason}` });
  }
};

export function transferArmyFormations(state: GameState, factionId: string, sourceArmyId: string, targetArmyId: string, formationIds?: string[]): CommandResult {
  const source = state.armies[sourceArmyId]; const target = state.armies[targetArmyId];
  const error = objection(state, factionId, source) ?? objection(state, factionId, target);
  if (error || !source || !target) return fail(error ?? 'Unknown army.');
  if (source.id === target.id) return fail('Choose two different armies.');
  if (source.cell !== target.cell) return fail('Armies must share a hex to transfer formations.');
  const ids = new Set(formationIds ?? source.formations.map(item => item.id));
  if (!ids.size || formationIds && ids.size !== formationIds.length || [...ids].some(id => !source.formations.some(item => item.id === id))) return fail('Choose distinct formations belonging to the source army.');
  if (target.formations.length + ids.size > MAX_ARMY_FORMATIONS) return fail('An army can contain at most twelve formations.');
  const characterError = characterCompositionObjection(state, source.id, target.id, ids.size === source.formations.length);
  if (characterError) return fail(characterError);
  const events: DomainEvent[] = [];
  sight(state, source, -1); sight(state, target, -1);
  target.formations.push(...source.formations.filter(item => ids.has(item.id)));
  source.formations = source.formations.filter(item => !ids.has(item.id));
  target.movement = Math.min(target.movement, source.movement);
  changed(state, target, events);
  if (source.formations.length) changed(state, source, events);
  else { transferArmyCharacters(state, source.id, target.id, events); indexes(state).armies.get(source.cell)?.delete(source.id); delete state.armies[source.id]; delete state.routes[source.id]; }
  events.push({ turn: state.turn, factionId, type: 'formations_transferred', cell: target.cell, message: `${source.name} transferred ${ids.size} formation${ids.size === 1 ? '' : 's'} to ${target.name}.` });
  return { ok: true, events };
}

export function splitArmyFormations(state: GameState, factionId: string, armyId: string, formationIds: string[], name?: string): CommandResult {
  const source = state.armies[armyId]; const error = objection(state, factionId, source);
  if (error || !source) return fail(error ?? 'Unknown army.');
  const ids = new Set(formationIds);
  if (!ids.size || ids.size !== formationIds.length || ids.size >= source.formations.length || [...ids].some(id => !source.formations.some(item => item.id === id))) return fail('Split a distinct, nonempty selection while leaving at least one formation in the original army.');
  const id = `army.${state.nextId}`;
  const detached: Army = { id, factionId, name: name ?? `${source.name} detachment`.slice(0, 80).trim(), cell: source.cell, movement: source.movement, formations: source.formations.filter(item => ids.has(item.id)) };
  const events: DomainEvent[] = [];
  sight(state, source, -1);
  source.formations = source.formations.filter(item => !ids.has(item.id));
  state.nextId++; state.armies[id] = detached;
  const occupants = indexes(state).armies.get(source.cell) ?? new Set<string>(); occupants.add(id); indexes(state).armies.set(source.cell, occupants);
  changed(state, source, events); changed(state, detached, events);
  events.push({ turn: state.turn, factionId, type: 'army_split', cell: source.cell, message: `${source.name} detached ${ids.size} formation${ids.size === 1 ? '' : 's'} as ${detached.name}.` });
  return { ok: true, events };
}
