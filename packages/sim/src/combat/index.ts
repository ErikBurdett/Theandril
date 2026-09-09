import { initializeIndividuals, reconcileIndividualLosses, advanceIndividualLines, individualAttack, isHull } from './individual';
import { z } from 'zod';
import { SeededRandom } from '@theandril/mapgen';
import type { BattleFact, BattleFactObserver, BattleStatChange } from './presentation';

export const MAX_BATTLE_ROUNDS = 12;
const MAX_LOG = 256;
const bounded = (max: number) => z.number().int().min(0).max(max);
const identifier = z.string().min(1).max(80).regex(/^[a-z][a-z0-9_.-]*$/);
const orderSchema = z.enum(['advance', 'brace', 'flank', 'withdraw']);
export type BattleOrder = z.infer<typeof orderSchema>;
type Side = 'attacker' | 'defender';

const formationSchema = z.object({
  id: identifier, unitId: identifier,
  strength: bounded(10_000), maxStrength: z.number().int().min(1).max(10_000),
  morale: bounded(100), fatigue: bounded(100), row: bounded(3), column: bounded(4),
  attack: bounded(100), armor: bounded(100), initiative: bounded(100), range: bounded(4),
}).strict().refine(unit => unit.strength <= unit.maxStrength, 'Strength exceeds formation capacity.');
const abilityFormationSchema = formationSchema.safeExtend({ ward: bounded(16).optional() });
const individualFormationSchema = abilityFormationSchema.safeExtend({
  members: z.array(bounded(9999)).max(10000).optional(), cohesion: bounded(100).optional(),
  position: z.object({ forward: bounded(4), lateral: z.number().int().min(-1).max(1) }).strict().optional(),
}).superRefine((unit, context) => {
  if (unit.members && (unit.members.length !== unit.strength || unit.members.some((slot, index) => slot >= unit.maxStrength || index > 0 && slot <= unit.members![index - 1]!))) context.addIssue({ code: 'custom', message: 'Individual identities disagree with surviving formation strength.' });
  if (unit.position && (unit.cohesion === undefined || !isHull(unit.unitId) && !unit.members) || unit.members && !unit.position) context.addIssue({ code: 'custom', message: 'Incomplete individual battle state.' });
});
export type BattleFormation = z.infer<typeof individualFormationSchema>;
const formations = z.array(formationSchema).min(1).max(20);
const inputSchema = z.object({ seed: bounded(0xffffffff), terrain: bounded(4), attacker: formations, defender: formations }).strict();
const legacyInputSchema = inputSchema.extend({ attacker: formations.max(12), defender: formations.max(12) }).superRefine((input, context) => {
  if ([...input.attacker, ...input.defender].some(formation => formation.row > 2)) context.addIssue({ code: 'custom', message: 'Historical battles have only three ranks.' });
});
export type BattleInput = z.infer<typeof inputSchema>;

/** rngState is canonical: saves resume the combat stream independently of the campaign. */
export const schema13BattleStateSchema = inputSchema.extend({
  rngState: bounded(0xffffffff), round: bounded(MAX_BATTLE_ROUNDS),
  result: z.object({ winner: z.enum(['attacker', 'defender', 'draw']), reason: z.string().min(1).max(120) }).strict().optional(),
  log: z.array(z.string().max(240)).max(MAX_LOG),
}).superRefine((state, context) => {
  const ids = new Set<string>();
  for (const side of ['attacker', 'defender'] as const) {
    const slots = new Set<number>();
    for (const formation of state[side]) {
      const slot = formation.row * 5 + formation.column;
      if (ids.has(formation.id)) context.addIssue({ code: 'custom', message: 'Formation IDs must be unique.' });
      if (slots.has(slot)) context.addIssue({ code: 'custom', message: 'Formation deployment slots must be unique per side.' });
      ids.add(formation.id); slots.add(slot);
    }
  }
  if (state.round === MAX_BATTLE_ROUNDS && !state.result) {
    context.addIssue({ code: 'custom', message: 'A battle at its round limit requires a result.' });
  }
});
export const schema15BattleStateSchema = schema13BattleStateSchema.safeExtend({ attacker: z.array(abilityFormationSchema).min(1).max(20), defender: z.array(abilityFormationSchema).min(1).max(20) });
export const battleStateSchema = schema15BattleStateSchema.safeExtend({ attacker: z.array(individualFormationSchema).min(1).max(20), defender: z.array(individualFormationSchema).min(1).max(20) });
export type BattleState = z.infer<typeof battleStateSchema>;
export const legacyBattleStateSchema = schema13BattleStateSchema.superRefine((state, context) => {
  if (state.attacker.length > 12 || state.defender.length > 12 || [...state.attacker, ...state.defender].some(formation => formation.row > 2)) context.addIssue({ code: 'custom', message: 'Historical battles support at most twelve formations and three ranks per side.' });
});

const byId = (a: BattleFormation, b: BattleFormation): number => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
const active = (formation: BattleFormation): boolean => formation.strength > 0 && formation.morale > 0;
const other = (side: Side): Side => side === 'attacker' ? 'defender' : 'attacker';
const totalStrength = (formations: BattleFormation[]): number => formations.reduce((sum, unit) => sum + unit.strength, 0);
const append = (state: BattleState, message: string): void => {
  state.log.push(message);
  if (state.log.length > MAX_LOG) state.log.splice(0, state.log.length - MAX_LOG);
};

export function createBattle(input: BattleInput, version = 8): BattleState {
  const checked = (version < 8 ? legacyInputSchema : inputSchema).parse(input);
  if ([...checked.attacker, ...checked.defender].some(unit => !active(unit))) {
    throw new Error('Starting formations must have positive strength and morale.');
  }
  const state = battleStateSchema.parse({ ...checked, rngState: checked.seed, round: 0, log: [] });
  if (version >= 9) for (const formation of [...state.attacker, ...state.defender]) formation.ward = 0;
  if (version >= 10) for (const formation of [...state.attacker, ...state.defender]) initializeIndividuals(formation);
  state.attacker.sort(byId); state.defender.sort(byId);
  return state;
}

/** A defeated force retains survivors. The campaign integration chooses their retreat hex. */
export interface BattleRoundHooks { observe?: BattleFactObserver; beforeRound?: (state: BattleState) => void }
const fact = (round: number, type: BattleFact['type'], values: Partial<BattleFact> = {}): BattleFact => ({ round, type, sourceId: null, sourceKind: null, targetIds: [], abilityId: null, attackKind: null, changes: [], winner: null, reason: null, ...values });
export function battleStatChange(before: BattleFormation, after: BattleFormation): BattleStatChange {
  return { ...(after.cohesion !== undefined ? { cohesionDelta: after.cohesion - (before.cohesion ?? after.cohesion) } : {}), formationId: after.id, strengthDelta: after.strength - before.strength, moraleDelta: after.morale - before.morale, fatigueDelta: after.fatigue - before.fatigue, wardDelta: (after.ward ?? 0) - (before.ward ?? 0) };
}
function finish(state: BattleState, winner: Side | 'draw', reason: string, rng: SeededRandom, rout = false, observe?: BattleFactObserver): void {
  state.result = { winner, reason };
  if (winner !== 'draw') {
    const pursuers = state[winner].filter(active);
    const defeated = state[other(winner)].filter(unit => unit.strength > 0);
    const fastest = Math.max(0, ...pursuers.map(unit => unit.initiative));
    const capacity = Math.floor(totalStrength(pursuers) / Math.max(1, defeated.length * 4));
    const cover = state.terrain === 2 ? 5 : state.terrain >= 3 ? 2 : 0;
    for (const unit of defeated) {
      const before = observe ? { ...unit } : undefined;
      const rate = Math.max(0, (rout ? 12 : 6) + Math.floor(Math.max(0, fastest - unit.initiative) / 4) + Math.floor(unit.fatigue / 10) - cover + rng.nextInt(3));
      const incoming = Math.min(unit.strength, capacity, Math.floor(unit.strength * rate / 100));
      const absorbed = Math.min(unit.ward ?? 0, incoming), lost = incoming - absorbed;
      if (unit.ward !== undefined) unit.ward -= absorbed;
      unit.strength -= lost;
      const killedSoldierIds = reconcileIndividualLosses(unit);
      unit.fatigue = Math.min(100, unit.fatigue + 10);
      append(state, `${unit.id} lost ${lost} strength during pursuit.`);
      if (observe && before) observe(fact(state.round, 'pursuit', { ...(unit.position ? { killedSoldierIds } : {}), targetIds: [unit.id], changes: [battleStatChange(before, unit)] }));
    }
  }
  state.rngState = rng.state;
  append(state, `${winner}: ${reason}.`);
  observe?.(fact(state.round, 'result', { winner, reason }));
}

function checkRout(state: BattleState, rng: SeededRandom, observe?: BattleFactObserver): boolean {
  const attacking = state.attacker.some(active);
  const defending = state.defender.some(active);
  if (attacking && defending) return false;
  const winner = attacking ? 'attacker' : defending ? 'defender' : 'draw';
  const routed = winner !== 'draw' && state[other(winner)].some(unit => unit.strength > 0);
  finish(state, winner, routed ? 'morale rout' : 'formations destroyed', rng, routed, observe);
  return true;
}

/** A manual ability can end the engagement without inventing another round.
 * This is the same casualty/rout/pursuit path used by ordinary round resolution. */
export function settleBattleTerminal(input: BattleState, observe?: BattleFactObserver): BattleState {
  const state = battleStateSchema.parse(input);
  if (!state.result) checkRout(state, new SeededRandom(state.rngState), observe);
  return state;
}

function targetFor(state: BattleState, side: Side, actor: BattleFormation, order: BattleOrder): BattleFormation | undefined {
  const friends = state[side].filter(active);
  const targets = state[other(side)].filter(active);
  const front = Math.min(...friends.map(unit => unit.row));
  const enemyFront = Math.min(...targets.map(unit => unit.row));
  let selected: BattleFormation | undefined;
  let best = -Infinity;
  for (const target of targets) {
    // Ranks stay as deployment data; advancing progressively closes the engagement gap.
    const approach = actor.position ? actor.position.forward + (target.position?.forward ?? 0) - 3 : order === 'advance' ? Math.min(2, state.round - 1) : order === 'flank' ? 1 : 0;
    const separation = Math.max(1, actor.row - front + target.row - enemyFront + 1 + Math.floor(Math.abs(actor.column - target.column) / 2) - approach);
    if (separation > actor.range + 1) continue;
    const edge = target.column === 0 || target.column === 4;
    const score = order === 'flank'
      ? (edge ? 30 : 0) + target.row * 10 - target.armor
      : -target.row * 20 - Math.abs(actor.column - target.column) * 3 - target.morale;
    if (score > best) { selected = target; best = score; }
  }
  return selected;
}

/** Validates and clones input, then resolves one shared tactical/autoresolve round. */
export function resolveBattleRound(input: BattleState, orders: { attacker: BattleOrder; defender: BattleOrder }, version = 8, hooks: BattleRoundHooks = {}): BattleState {
  const state: BattleState = (version < 8 ? legacyBattleStateSchema : version < 9 ? schema13BattleStateSchema : version < 10 ? schema15BattleStateSchema : battleStateSchema).parse(input);
  const checked = z.object({ attacker: orderSchema, defender: orderSchema }).strict().parse(orders);
  state.attacker.sort(byId); state.defender.sort(byId);
  if (state.result) return state;
  state.round++;
  const observe = hooks.observe;
  const rng = new SeededRandom(state.rngState);
  append(state, `Round ${state.round}: attacker ${checked.attacker}, defender ${checked.defender}.`);
  observe?.(fact(state.round, 'round', { reason: `attacker ${checked.attacker}; defender ${checked.defender}` }));
  if (version >= 9) hooks.beforeRound?.(state);
  if (checkRout(state, rng, observe)) return state;
  if (checked.attacker === 'withdraw' || checked.defender === 'withdraw') {
    const winner = checked.attacker === checked.defender ? 'draw' : checked.attacker === 'withdraw' ? 'defender' : 'attacker';
    finish(state, winner, winner === 'draw' ? 'mutual withdrawal' : 'ordered withdrawal', rng, false, observe);
    return state;
  }
  if (version >= 10) advanceIndividualLines(state, checked, observe);
  const sequence = (['attacker', 'defender'] as const).flatMap(side => state[side].map(unit => ({ side, unit })))
    .sort((a, b) => (b.unit.initiative - Math.floor(b.unit.fatigue / 10)) - (a.unit.initiative - Math.floor(a.unit.fatigue / 10)) || byId(a.unit, b.unit));
  for (const { side, unit } of sequence) {
    if (!active(unit)) continue;
    const order = checked[side];
    const target = targetFor(state, side, unit, order);
    if (!target) {
      const before = observe ? { ...unit } : undefined;
      unit.fatigue = Math.max(0, unit.fatigue - (order === 'brace' ? 8 : 2));
      if (observe && before) observe(fact(state.round, 'rest', { sourceId: unit.id, sourceKind: 'formation', targetIds: [unit.id], changes: [battleStatChange(before, unit)] }));
      continue;
    }
    const opponentOrder = checked[other(side)];
    const terrainGuard = side === 'attacker' && state.terrain >= 3 ? 5 : state.terrain === 2 ? 2 : 0;
    const rangedPenalty = unit.range > 0 && state.terrain === 2 ? 4 : 0;
    const attack = unit.attack + (order === 'flank' ? 5 : order === 'brace' ? -3 : 0) - Math.floor(unit.fatigue / 8) - rangedPenalty;
    const armor = target.armor + terrainGuard + (opponentOrder === 'brace' ? 6 : opponentOrder === 'flank' ? -3 : 0);
    const rolledPower = version < 10 ? Math.max(3, attack - armor + rng.nextInt(5)) : 0;
    const before = observe ? { ...target } : undefined, actorBefore = observe ? { ...unit } : undefined;
    const individual = version >= 10 ? individualAttack(state, unit, target, order, opponentOrder, state[side], state[other(side)], rng) : null;
    const rawDamage = individual ? 0 : Math.min(target.strength, Math.max(1, Math.floor(unit.strength * rolledPower / 120)));
    const absorbed = version >= 9 ? Math.min(target.ward ?? 0, rawDamage) : 0;
    if (!individual && version >= 9) target.ward = (target.ward ?? 0) - absorbed;
    const damage = individual?.damage ?? rawDamage - absorbed;
    if (!individual) target.strength -= damage;
    if (damage || version < 9) target.morale = Math.max(0, target.morale - 4 - Math.floor(damage * 70 / target.maxStrength) - (order === 'flank' ? 6 : 0));
    unit.fatigue = Math.min(100, unit.fatigue + (order === 'flank' ? 14 : order === 'brace' ? 3 : 8));
    append(state, `${unit.id} struck ${target.id} for ${damage} strength.`);
    if (observe && before && actorBefore) observe(fact(state.round, 'attack', { ...(individual ? { sourceSoldierIds: individual.sourceSoldierIds, targetSoldierIds: individual.targetSoldierIds, killedSoldierIds: individual.killedSoldierIds, reason: individual.detail } : {}), sourceId: unit.id, sourceKind: 'formation', targetIds: [target.id], attackKind: unit.unitId === 'unit.spearman' || unit.unitId === 'unit.halberdier' ? 'reach' : unit.range > 0 ? 'projectile' : 'melee', changes: [battleStatChange(before, target), battleStatChange(actorBefore, unit)] }));
    if (!active(target)) {
      append(state, `${target.id} ${target.strength === 0 ? 'was destroyed' : 'routed'}.`);
      const changes: BattleStatChange[] = [];
      for (const ally of state[other(side)]) if (active(ally)) { const morale = ally.morale; ally.morale = Math.max(0, ally.morale - 8); if (observe) changes.push({ formationId: ally.id, strengthDelta: 0, moraleDelta: ally.morale - morale, fatigueDelta: 0, wardDelta: 0 }); }
      observe?.(fact(state.round, target.strength === 0 ? 'destroyed' : 'rout', { sourceId: unit.id, sourceKind: 'formation', targetIds: [target.id], changes }));
    }
  }
  state.rngState = rng.state;
  if (checkRout(state, rng, observe)) return state;
  if (state.round === MAX_BATTLE_ROUNDS) {
    const power = (side: Side): number => state[side].filter(active).reduce((sum, unit) => sum + unit.strength * (unit.morale + 25), 0);
    const attacker = power('attacker');
    const defender = power('defender');
    const winner = attacker * 10 > defender * 11 ? 'attacker' : defender * 10 > attacker * 11 ? 'defender' : 'draw';
    finish(state, winner, 'round limit', rng, false, observe);
  }
  return state;
}

/** Bounded tactical policy. It sees only the battlefield, and never mutates it. */
export function chooseBattleOrder(state: BattleState, side: Side): BattleOrder {
  const own = state[side].filter(active);
  const enemy = state[other(side)].filter(active);
  const ownStrength = totalStrength(own);
  const enemyStrength = totalStrength(enemy);
  if (!own.length || ownStrength * 3 < enemyStrength || own.every(unit => unit.morale < 25)) return 'withdraw';
  const fatigue = own.reduce((sum, unit) => sum + unit.fatigue, 0);
  const ranged = own.filter(unit => unit.range > 0).length;
  if (fatigue > own.length * 65 || (ranged > own.length / 2 && state.round < 2) || (side === 'defender' && state.terrain >= 3 && state.round % 3 !== 2)) return 'brace';
  const speed = own.reduce((sum, unit) => sum + unit.initiative, 0);
  const enemySpeed = enemy.reduce((sum, unit) => sum + unit.initiative, 0);
  if (speed * enemy.length > enemySpeed * own.length && state.terrain !== 2 && state.round % 2 === 0) return 'flank';
  return 'advance';
}

export function autoResolveBattle(input: BattleState, version = 8): BattleState {
  let state: BattleState = (version < 8 ? legacyBattleStateSchema : version < 9 ? schema13BattleStateSchema : version < 10 ? schema15BattleStateSchema : battleStateSchema).parse(input);
  state.attacker.sort(byId); state.defender.sort(byId);
  while (!state.result) {
    state = resolveBattleRound(state, { attacker: chooseBattleOrder(state, 'attacker'), defender: chooseBattleOrder(state, 'defender') }, version);
  }
  return state;
}
