import type { Army, CommandResult, DomainEvent, GameState } from './types';
import { armyCanAttack, armyCanFound } from './army-composition';
import { armyHasCharacterMission } from './characters';
import { armyDomain } from './naval';
import { queueMovement } from './movement';
import { rulesVersion } from './rules';
import { MAX_PATROLS, MAX_PATROLS_PER_FACTION, MAX_PATROL_ROUTE_ATTEMPTS, type Patrol, type PatrolCommand, type ObservedPatrol } from './patrol-state';
export * from './patrol-state';

const fail = (error: string): CommandResult => ({ ok: false, error, events: [] });
const compare = (a: Patrol, b: Patrol) => a.armyId < b.armyId ? -1 : a.armyId > b.armyId ? 1 : 0;
const eligible = (army: Army) => armyDomain(army) === 'land' && armyCanAttack(army) && !armyCanFound(army);
const targetCell = (patrol: Patrol) => patrol.target === 'first' ? patrol.firstCell : patrol.secondCell;
const switchTarget = (patrol: Patrol) => { patrol.target = patrol.target === 'first' ? 'second' : 'first'; };
const notice = (state: GameState, patrol: Patrol, type: string, message: string): DomainEvent => ({ turn: state.turn, factionId: patrol.factionId, type, message });
const currentRules = 'Army patrols require current campaign rules.';

export function setPatrol(state: GameState, command: Extract<PatrolCommand, { type: 'setPatrol' }>): CommandResult {
  if (rulesVersion(state) < 35) return fail(currentRules);
  const army = state.armies[command.armyId];
  if (!army || army.factionId !== command.factionId) return fail('You do not control that army.');
  if (!eligible(army) || state.transports[army.id]) return fail('Assign a combat land army ashore, without caravans, to a patrol.');
  const cells = state.world.width * state.world.height;
  if (command.firstCell === command.secondCell) return fail('Choose two different patrol endpoints.');
  if (![command.firstCell, command.secondCell].every(cell => Number.isInteger(cell) && cell >= 0 && cell < cells && state.explored[command.factionId]?.has(cell))) return fail('Choose two explored world hexes for this patrol.');
  const index = state.patrols.findIndex(patrol => patrol.armyId === army.id);
  if (index >= 0 && state.patrols[index]!.factionId !== command.factionId) return fail('This army has a previous owner’s patrol awaiting cleanup.');
  if (index < 0 && (state.patrols.length >= MAX_PATROLS || state.patrols.filter(patrol => patrol.factionId === command.factionId).length >= MAX_PATROLS_PER_FACTION)) return fail('A realm may keep at most 128 army patrols.');
  const patrol: Patrol = { armyId: army.id, factionId: command.factionId, firstCell: command.firstCell, secondCell: command.secondCell,
    target: army.cell === command.firstCell ? 'second' : 'first', enabled: command.enabled, pauseOnWar: command.pauseOnWar ?? false, lastAttemptTurn: null, lastError: null };
  if (index < 0) { state.patrols.push(patrol); state.patrols.sort(compare); } else state.patrols[index] = patrol;
  return { ok: true, events: [notice(state, patrol, 'patrol_set', `${army.name} patrols between hexes ${patrol.firstCell} and ${patrol.secondCell}. ${patrol.enabled ? 'New patrol travel starts next turn.' : 'Patrol assignments are paused.'} Existing travel and postings take priority.${patrol.pauseOnWar ? ' Assignments pause when this realm is at war.' : ''}`)] };
}

export function setPatrolEnabled(state: GameState, factionId: string, armyId: string, enabled: boolean): CommandResult {
  if (rulesVersion(state) < 35) return fail(currentRules);
  const patrol = state.patrols.find(patrol => patrol.armyId === armyId && patrol.factionId === factionId);
  if (!patrol || state.armies[armyId]?.factionId !== factionId) return fail('You do not control that army patrol.');
  patrol.enabled = enabled;
  if (enabled) patrol.lastError = null; // Explicit retry awaits the next bounded allocation.
  return { ok: true, events: [notice(state, patrol, enabled ? 'patrol_resumed' : 'patrol_paused', `${state.armies[armyId]!.name}: patrol assignments ${enabled ? 'resume next turn' : 'are paused'}. Existing travel continues.`)] };
}

export function clearPatrol(state: GameState, factionId: string, armyId: string): CommandResult {
  if (rulesVersion(state) < 35) return fail(currentRules);
  const index = state.patrols.findIndex(patrol => patrol.armyId === armyId && patrol.factionId === factionId);
  if (index < 0) return fail('You do not control that army patrol.');
  const patrol = state.patrols[index]!; state.patrols.splice(index, 1);
  return { ok: true, events: [notice(state, patrol, 'patrol_cleared', `Cleared the patrol for ${state.armies[armyId]?.factionId === factionId ? state.armies[armyId]!.name : armyId}. Existing travel continues.`)] };
}

/** Index only orders used by the bounded patrol roster, not a per-army global scan. */
function overrides(state: GameState) {
  return { posted: new Set(state.postings.map(posting => posting.armyId)), besieging: new Set(Object.values(state.sieges).map(siege => siege.armyId)) };
}
function overrideReason(state: GameState, army: Army, index: ReturnType<typeof overrides>): string | null {
  if (!eligible(army)) return 'This patrol needs a combat land army without caravans.';
  if (state.transports[army.id]) return 'The army is aboard a fleet; patrol assignments resume ashore.';
  if (index.posted.has(army.id)) return 'A standing posting takes priority. Clear it to resume patrol assignments.';
  if (index.besieging.has(army.id)) return 'The army is maintaining a siege; patrol assignments wait.';
  if (armyHasCharacterMission(state, army.id)) return 'An active character mission takes priority over patrol assignments.';
  return null;
}

/** One rotating O(patrols + postings + sieges + wars) pass, with eight ordinary route
 * attempts per realm. Active and paused routes always keep their exact state. */
export function advancePatrols(state: GameState, events: DomainEvent[]): void {
  if (rulesVersion(state) < 35 || !state.patrols.length) return;
  state.patrols = state.patrols.filter(patrol => {
    if (state.armies[patrol.armyId]?.factionId === patrol.factionId) return true;
    events.push(notice(state, patrol, 'patrol_lost', `The patrol for ${patrol.armyId} ended because its army is no longer available.`));
    return false;
  });
  const index = overrides(state), realms = new Map<string, Patrol[]>(), atWar = new Set(state.wars.flat());
  for (const patrol of state.patrols) {
    // This is an explicit public order policy, shared by human and AI commands.
    // Pausing does not cancel already issued routes or restart after peace.
    if (patrol.enabled && patrol.pauseOnWar && atWar.has(patrol.factionId)) {
      patrol.enabled = false; patrol.lastError = null;
      events.push(notice(state, patrol, 'patrol_paused_for_war', `${state.armies[patrol.armyId]!.name}: patrol assignments paused because this realm is at war. Existing travel continues. Resume explicitly when ready.`));
    }
    const own = realms.get(patrol.factionId) ?? []; own.push(patrol); realms.set(patrol.factionId, own);
  }
  for (const factionId of [...realms.keys()].sort()) {
    const own = realms.get(factionId)!;
    let attempts = own.filter(patrol => patrol.lastAttemptTurn === state.turn).length;
    const offset = ((state.turn - 1) * MAX_PATROL_ROUTE_ATTEMPTS) % own.length;
    for (let i = 0; i < own.length && attempts < MAX_PATROL_ROUTE_ATTEMPTS; i++) {
      const patrol = own[(offset + i) % own.length]!, army = state.armies[patrol.armyId]!;
      if (!patrol.enabled || patrol.lastAttemptTurn === state.turn || state.routes[army.id] || overrideReason(state, army, index)) continue;
      if (army.cell === targetCell(patrol)) switchTarget(patrol);
      const target = targetCell(patrol);
      const result = queueMovement(state, factionId, army.id, target);
      patrol.lastAttemptTurn = state.turn; patrol.lastError = result.ok ? null : result.error ?? 'No safe patrol route could be queued.';
      attempts++;
      if (result.ok) {
        events.push(...result.events);
        // Completing a short leg never grants a second route in this phase.
        if (army.cell === target && !state.routes[army.id]) switchTarget(patrol);
      } else events.push(notice(state, patrol, 'patrol_blocked', `${army.name} could not patrol toward hex ${target}. ${patrol.lastError}`));
    }
  }
}

export function observePatrols(state: GameState, factionId: string): ObservedPatrol[] {
  if (rulesVersion(state) < 35 || !state.patrols.length) return [];
  const index = overrides(state);
  return state.patrols.filter(patrol => patrol.factionId === factionId).map(patrol => {
    const army = state.armies[patrol.armyId], route = state.routes[patrol.armyId], target = targetCell(patrol);
    let status: ObservedPatrol['status'] = 'ready', blocker: string | null = null;
    if (!army || army.factionId !== factionId) { status = 'waiting'; blocker = 'The patrol army is no longer available.'; }
    else if (!patrol.enabled) { status = 'paused'; blocker = 'Patrol assignments are paused. Existing travel continues.'; }
    else if ((blocker = overrideReason(state, army, index))) status = 'overridden';
    else if (route?.status === 'paused') { status = 'waiting'; blocker = route.pauseReason ?? 'Travel is paused. Resume or cancel it explicitly.'; }
    else if (route) { status = 'traveling'; blocker = route.waypoints.at(-1) === target ? null : 'Existing travel takes priority until it finishes.'; }
    else if (patrol.lastError) { status = 'waiting'; blocker = patrol.lastError; }
    return { ...patrol, targetCell: target, status, blocker };
  });
}
