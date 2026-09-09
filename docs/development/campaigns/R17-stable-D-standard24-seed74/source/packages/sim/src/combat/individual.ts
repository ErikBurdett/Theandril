import { SeededRandom } from '@theandril/mapgen';
import type { BattleFormation, BattleOrder, BattleState } from './index';
import type { BattleFactObserver, BattleSceneSoldier } from './presentation';

export const isHull = (unitId: string): boolean => ['unit.transport', 'unit.coastal_warship', 'unit.ocean_warship'].includes(unitId);
export const soldierId = (formationId: string, slot: number): string => `${formationId}.soldier.${slot}`;
const active = (unit: BattleFormation) => unit.strength > 0 && unit.morale > 0;
const mounted = (unit: BattleFormation) => unit.unitId === 'unit.cavalry' || unit.unitId === 'unit.lancer';
const pike = (unit: BattleFormation) => unit.unitId === 'unit.spearman' || unit.unitId === 'unit.halberdier';
const missile = (unit: BattleFormation) => unit.range > 0 && !pike(unit);

/** Stable surviving identities, detached from renderer allocation and frame time. */
export function initializeIndividuals(formation: BattleFormation): void {
  if (!isHull(formation.unitId)) formation.members = Array.from({ length: formation.strength }, (_, slot) => slot);
  formation.cohesion = 100;
  formation.position = { forward: 0, lateral: 0 };
}
/** Spell and pursuit losses remove actual surviving identities as well. The
 * ordinary attack path chooses its victims individually and needs no repair. */
export function reconcileIndividualLosses(formation: BattleFormation): string[] {
  if (!formation.members) return isHull(formation.unitId) && formation.position && !formation.strength ? [soldierId(formation.id, 0)] : [];
  const lost = formation.members.splice(formation.strength);
  return lost.map(slot => soldierId(formation.id, slot));
}
export function sceneSoldiers(formations: readonly BattleFormation[]): BattleSceneSoldier[] {
  return formations.flatMap(formation => {
    const slots = formation.members ?? (isHull(formation.unitId) && formation.position && formation.strength ? [0] : []);
    const columns = Math.min(10, Math.max(1, Math.ceil(Math.sqrt(formation.maxStrength))));
    const rows = Math.ceil(formation.maxStrength / columns);
    return slots.map(slot => ({ id: soldierId(formation.id, slot), formationId: formation.id, slot,
      x: isHull(formation.unitId) ? 0 : ((slot % columns) - (columns - 1) / 2) / columns,
      y: isHull(formation.unitId) ? 0 : (Math.floor(slot / columns) - (rows - 1) / 2) / Math.max(1, rows), alive: true }));
  });
}

/** Orders move the real tactical line and change its cohesion. These positions
 * remain canonical when the user skips, pauses or changes animation speed. */
export function advanceIndividualLines(state: BattleState, orders: { attacker: BattleOrder; defender: BattleOrder }, observe?: BattleFactObserver): void {
  for (const side of ['attacker', 'defender'] as const) for (const unit of state[side]) {
    if (!active(unit) || !unit.position) continue;
    const order = orders[side], before = { ...unit.position }, cohesionBefore = unit.cohesion ?? 100;
    const advance = order === 'brace' ? 0 : mounted(unit) ? 2 : 1;
    unit.position.forward = Math.min(4, unit.position.forward + advance);
    unit.position.lateral = order === 'flank' ? (unit.column < 2 ? -1 : 1) : 0;
    unit.cohesion = Math.max(0, Math.min(100, (unit.cohesion ?? 100) + (order === 'brace' ? 8 : order === 'flank' ? -8 : -2)));
    if (observe && (before.forward !== unit.position.forward || before.lateral !== unit.position.lateral)) observe({
      round: state.round, type: 'move', sourceId: unit.id, sourceKind: 'formation', targetIds: [unit.id], abilityId: null, attackKind: null, changes: [{ formationId: unit.id, strengthDelta: 0, moraleDelta: 0, fatigueDelta: 0, wardDelta: 0, cohesionDelta: unit.cohesion - cohesionBefore }], winner: null, reason: null,
      movement: { formationId: unit.id, before, after: { ...unit.position } },
    });
  }
}

export function individualAttack(state: BattleState, unit: BattleFormation, target: BattleFormation, order: BattleOrder, opponentOrder: BattleOrder, friends: readonly BattleFormation[], enemies: readonly BattleFormation[], rng: SeededRandom): {
  damage: number; sourceSoldierIds: string[]; targetSoldierIds: string[]; killedSoldierIds: string[]; detail: string;
} {
  const sourceSoldierIds: string[] = [], targetSoldierIds: string[] = [], killedSoldierIds: string[] = [];
  const supporting = enemies.filter(ally => ally.id !== target.id && active(ally) && Math.abs(ally.column - target.column) <= 1 && ally.row <= target.row);
  const flank = order === 'flank' && supporting.length === 0;
  const pikeScreen = supporting.some(pike) || pike(target);
  const terrainArmor = state.terrain >= 3 ? 3 : state.terrain === 2 ? 2 : 0;
  const armor = (unit.unitId === 'unit.arbalester' ? Math.floor(target.armor / 2) : target.armor) + terrainArmor + (opponentOrder === 'brace' ? 5 : 0) + Math.floor((target.cohesion ?? 100) / 30);
  const charge = mounted(unit) && state.round <= 2 && order !== 'brace' ? (pikeScreen ? -8 : 8) : 0;
  const support = Math.min(3, friends.filter(ally => ally.id !== unit.id && active(ally) && Math.abs(ally.column - unit.column) === 1 && ally.row === unit.row).length);
  const power = unit.attack - armor - Math.floor(unit.fatigue / 10) + charge + (flank ? 7 : 0) + support + (pike(unit) && mounted(target) ? 9 : 0);
  const chance = Math.max(6, Math.min(70, 18 + power * 2 + Math.floor((unit.cohesion ?? 100) / 25) - (order === 'brace' ? 8 : 0)));
  if (!unit.members || !target.members) {
    const raw = Math.min(target.strength, Math.max(1, Math.floor(unit.strength * Math.max(3, power + rng.nextInt(5)) / 120)));
    const absorbed = Math.min(target.ward ?? 0, raw); target.ward = (target.ward ?? 0) - absorbed;
    const damage = raw - absorbed; target.strength -= damage;
    sourceSoldierIds.push(soldierId(unit.id, 0)); targetSoldierIds.push(soldierId(target.id, 0));
    if (!target.strength) killedSoldierIds.push(soldierId(target.id, 0));
    return { damage, sourceSoldierIds, targetSoldierIds, killedSoldierIds, detail: 'hull fire' };
  }
  const frontage = Math.min(unit.members.length, missile(unit) ? unit.members.length : mounted(unit) ? 20 : 16);
  const actors = unit.members.slice(0, frontage);
  // A volley has a finite firing line, and each soldier can be targeted once
  // in that activation. Victim selection and every attempt use the saved RNG.
  const available = [...target.members];
  for (const actor of actors) {
    if (!available.length) break;
    const index = rng.nextInt(available.length), victim = available.splice(index, 1)[0]!;
    sourceSoldierIds.push(soldierId(unit.id, actor)); targetSoldierIds.push(soldierId(target.id, victim));
    if (rng.nextInt(100) >= chance) continue;
    if (target.ward) { target.ward--; continue; }
    killedSoldierIds.push(soldierId(target.id, victim));
    target.members.splice(target.members.indexOf(victim), 1);
  }
  target.strength = target.members.length;
  target.cohesion = Math.max(0, (target.cohesion ?? 100) - Math.ceil(killedSoldierIds.length * 40 / target.maxStrength) - (flank ? 5 : 0));
  return { damage: killedSoldierIds.length, sourceSoldierIds, targetSoldierIds, killedSoldierIds, detail: flank ? 'unprotected flank' : charge < 0 ? 'pike screen' : charge > 0 ? 'mounted charge' : missile(unit) ? 'individual volley' : 'fighting frontage' };
}
