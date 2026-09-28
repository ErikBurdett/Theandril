import { MAX_THEATERS_PER_FACTION, MAX_THEATER_DISPATCHES, type DefenseTheater, type TheaterCommand, type TheaterDispatch, type TheaterHearth, type TheaterMember, type ObservedDefenseTheater } from './theater-state';
export * from './theater-state';
import { hexDistance } from '@theandril/mapgen';
import type { Army, CommandResult, DomainEvent, GameState } from './types';
import { armyCanAttack, armyCanFound } from './army-composition';
import { armyDomain } from './naval';
import { armyHasCharacterMission } from './characters';
import { queueMovement } from './movement';
import { rulesVersion } from './rules';
import { cellsWithin, indexes } from './visibility';

const fail = (error: string): CommandResult => ({ ok: false, error, events: [] });
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
const eligible = (army: Army) => armyDomain(army) === 'land' && armyCanAttack(army) && !armyCanFound(army);
const notice = (state: GameState, theater: DefenseTheater, type: string, message: string): DomainEvent => ({ turn: state.turn, factionId: theater.factionId, type, message });

export function setTheater(state: GameState, command: Extract<TheaterCommand, { type: 'setTheater' }>): CommandResult {
  const previous = command.theaterId ? state.theaters.find(item => item.id === command.theaterId && item.factionId === command.factionId) : undefined;
  if (command.theaterId && !previous) return fail('You do not control that defensive theater.');
  if (!previous && !command.armyIds.length) return fail('Assign at least one combat army to a new theater.');
  if (new Set(command.armyIds).size !== command.armyIds.length || new Set(command.settlementIds).size !== command.settlementIds.length) return fail('Choose distinct theater members and hearths.');
  if (command.armyIds.some(id => { const army = state.armies[id]; return !army || army.factionId !== command.factionId || !eligible(army) || Boolean(state.transports[id] && !previous?.armyIds.includes(id)); })) return fail('New theater members must be combat land armies you control, ashore and without caravans.');
  if (command.settlementIds.some(id => state.settlements[id]?.factionId !== command.factionId && !previous?.settlementIds.includes(id))) return fail('Assign only hearths you control.');
  if (!state.explored[command.factionId]?.has(command.reserveCell)) return fail('Choose an explored reserve hex.');
  const own = state.theaters.filter(item => item.factionId === command.factionId && item !== previous);
  if (!previous && own.length >= MAX_THEATERS_PER_FACTION) return fail('A realm may keep at most eight defensive theaters.');
  if (own.some(item => item.name.toLowerCase() === command.name.toLowerCase())) return fail('Another defensive theater already uses this name.');
  if (own.some(item => item.armyIds.some(id => command.armyIds.includes(id)) || item.settlementIds.some(id => command.settlementIds.includes(id)))) return fail('An army or hearth may belong to only one defensive theater.');
  if (!previous && state.nextTheaterId >= Number.MAX_SAFE_INTEGER) return fail('The theater identifier limit has been reached.');
  const theater: DefenseTheater = { id: previous?.id ?? `theater.${state.nextTheaterId}`, factionId: command.factionId, name: command.name,
    settlementIds: [...command.settlementIds].sort(), armyIds: [...command.armyIds].sort(), reserveCell: command.reserveCell, guardsPerSettlement: command.guardsPerSettlement, enabled: command.enabled, lastRunTurn: null, lastDispatches: [],
    ...(rulesVersion(state) >= 34 ? { reinforcementLimit: command.reinforcementLimit ?? 0,
      reinforcementHolds: command.enabled && command.reinforcementLimit ? (previous?.reinforcementHolds ?? []).filter(hold => command.settlementIds.includes(hold.settlementId) && hold.untilTurn >= state.turn).map(hold => ({ ...hold, extraGuards: Math.min(hold.extraGuards, command.reinforcementLimit!) })) : [] } : {}) };
  if (previous) state.theaters[state.theaters.indexOf(previous)] = theater;
  else { state.nextTheaterId++; state.theaters.push(theater); state.theaters.sort((a, b) => compare(a.id, b.id)); }
  return { ok: true, events: [notice(state, theater, 'theater_saved', `Saved defensive theater “${theater.name}”. ${theater.enabled ? 'Idle members receive assignments next turn.' : 'Automatic assignments are paused.'} Existing travel and postings continue.`)] };
}
export function deleteTheater(state: GameState, factionId: string, id: string): CommandResult {
  const index = state.theaters.findIndex(item => item.id === id && item.factionId === factionId);
  if (index < 0) return fail('You do not control that defensive theater.');
  const theater = state.theaters[index]!; state.theaters.splice(index, 1);
  return { ok: true, events: [notice(state, theater, 'theater_deleted', `Deleted defensive theater “${theater.name}”. Existing travel and postings continue.`)] };
}
export function pruneTheaters(state: GameState, events: DomainEvent[]): void {
  for (const theater of state.theaters) {
    const retained = theater.armyIds.filter(id => { const army = state.armies[id]; return army && army.factionId === theater.factionId && eligible(army); });
    if (retained.length === theater.armyIds.length) continue;
    theater.armyIds = retained;
    events.push(notice(state, theater, 'theater_members_lost', `Defensive theater “${theater.name}” now has ${retained.length} available members.`));
  }
}

/** One O(armies + postings + sieges + bounded references) index per phase/read.
 * Counts include nonmembers but only explicit members can receive commands. */
function coverageIndex(state: GameState, theaters: readonly DefenseTheater[]) {
  const stationed = new Map<string, number>(), incoming = new Map<string, number>(), floors = new Map<string, number>();
  const reinforcements = new Map<string, NonNullable<TheaterHearth['reinforcement']>>();
  // Each owned hearth examines a radius-three disk (at most37 hexes) using
  // existing spatial/sight indexes. Hidden armies and remembered contacts do
  // not participate; no global cells × armies or factions × armies search.
  const spatial = rulesVersion(state) >= 34 ? indexes(state) : undefined;
  const hostiles = new Map<string, Set<string>>();
  if (spatial) for (const [a, b] of state.wars) {
    if (!hostiles.has(a)) hostiles.set(a, new Set());
    if (!hostiles.has(b)) hostiles.set(b, new Set());
    hostiles.get(a)!.add(b); hostiles.get(b)!.add(a);
  }
  const key = (factionId: string, cell: number) => `${factionId}:${cell}`;
  const bump = (map: Map<string, number>, factionId: string, cell: number, amount: number) => { const k = key(factionId, cell); map.set(k, (map.get(k) ?? 0) + amount); };
  const count = (army: Army, amount: number) => {
    if (!eligible(army) || state.transports[army.id]) return;
    const route = state.routes[army.id], target = route?.status === 'active' ? route.waypoints.at(-1) : undefined;
    if (target === undefined || target === army.cell) bump(stationed, army.factionId, army.cell, amount);
    if (target !== undefined && target !== army.cell) bump(incoming, army.factionId, target, amount);
  };
  for (const army of Object.values(state.armies)) count(army, 1);
  for (const theater of theaters) for (const id of theater.settlementIds) {
    const town = state.settlements[id]; if (town?.factionId !== theater.factionId) continue;
    let extraGuards = 0;
    if (spatial) {
      const visible = spatial.visible.get(theater.factionId), limit = theater.enabled ? theater.reinforcementLimit ?? 0 : 0;
      let visibleEnemies = 0;
      if (limit) for (const cell of cellsWithin(state, town.cell, 3)) {
        if (!visible?.has(cell)) continue;
        for (const id of spatial.armies.get(cell) ?? []) {
          const enemy = state.armies[id];
          if (enemy && hostiles.get(theater.factionId)?.has(enemy.factionId) && eligible(enemy) && !state.transports[id]) visibleEnemies++;
        }
      }
      const hold = limit ? theater.reinforcementHolds?.find(hold => hold.settlementId === id && hold.untilTurn >= state.turn) : undefined;
      extraGuards = Math.min(limit, Math.max(visibleEnemies, hold?.extraGuards ?? 0));
      reinforcements.set(id, { visibleEnemies, extraGuards, holdUntilTurn: hold?.untilTurn ?? null });
    }
    if (theater.enabled) floors.set(key(theater.factionId, town.cell), theater.guardsPerSettlement + extraGuards);
  }
  return { stationed, incoming, floors, reinforcements, key, count, postings: new Set(state.postings.map(item => item.armyId)), besiegers: new Set(Object.values(state.sieges).map(item => item.armyId)) };
}
type Coverage = ReturnType<typeof coverageIndex>;
function hearthRows(state: GameState, theater: DefenseTheater, index: Coverage): TheaterHearth[] {
  return theater.settlementIds.map(settlementId => {
    const town = state.settlements[settlementId], available = town?.factionId === theater.factionId;
    const key = available ? index.key(theater.factionId, town.cell) : '';
    const stationed = index.stationed.get(key) ?? 0, incoming = index.incoming.get(key) ?? 0;
    const reinforcement = index.reinforcements.get(settlementId), required = theater.guardsPerSettlement + (reinforcement?.extraGuards ?? 0);
    // No captured hearth location/name is refreshed through this read model.
    return { settlementId, name: available ? town.name : settlementId, cell: available ? town.cell : null, available, stationed, incoming, required, deficit: available ? Math.max(0, required - stationed - incoming) : 0, ...(reinforcement ? { reinforcement } : {}) };
  });
}
function memberBlocker(state: GameState, army: Army, index: Coverage): string | null {
  if (state.transports[army.id]) return 'This army is aboard a fleet; theater assignments resume ashore.';
  if (index.postings.has(army.id)) return 'A standing posting takes priority. Clear it to delegate this army.';
  if (state.routes[army.id]) return state.routes[army.id]!.status === 'paused' ? 'Paused travel takes priority. Resume or cancel it explicitly.' : 'Existing travel takes priority until it finishes.';
  if (index.besiegers.has(army.id)) return 'This army is maintaining a siege.';
  if (armyHasCharacterMission(state, army.id)) return 'This army has an active character mission.';
  return null;
}

export function advanceTheaters(state: GameState, events: DomainEvent[]): void {
  if (rulesVersion(state) < 33 || !state.theaters.length) return;
  pruneTheaters(state, events);
  const index = coverageIndex(state, state.theaters);
  for (const theater of state.theaters) {
    if (!theater.enabled) continue;
    if (rulesVersion(state) >= 34) theater.reinforcementHolds = theater.settlementIds.flatMap(settlementId => {
      const current = index.reinforcements.get(settlementId);
      if (!current?.extraGuards) return [];
      const untilTurn = current.visibleEnemies >= current.extraGuards ? state.turn + 1 : current.holdUntilTurn!;
      return [{ settlementId, extraGuards: current.extraGuards, untilTurn }];
    });
    theater.lastRunTurn = state.turn; theater.lastDispatches = [];
    if (!theater.settlementIds.some(id => state.settlements[id]?.factionId === theater.factionId)) continue;
    // Rotate even after failed searches: one inaccessible low-ID member cannot
    // consume every future turn's allowance. Every route attempt costs one slot.
    const offset = theater.armyIds.length ? ((state.turn - 1) * MAX_THEATER_DISPATCHES) % theater.armyIds.length : 0;
    const order = [...theater.armyIds.slice(offset), ...theater.armyIds.slice(0, offset)];
    for (const id of order) {
      if (theater.lastDispatches.length >= MAX_THEATER_DISPATCHES) break;
      const army = state.armies[id];
      if (!army || memberBlocker(state, army, index)) continue;
      const sourceKey = index.key(army.factionId, army.cell), floor = index.floors.get(sourceKey) ?? 0;
      // Incoming promises never license withdrawing a physical guard.
      if (floor && (index.stationed.get(sourceKey) ?? 0) <= floor) continue;
      const destinations = hearthRows(state, theater, index).filter(row => row.available && row.deficit > 0 && row.cell !== army.cell)
        .sort((a, b) => b.deficit - a.deficit || hexDistance(army.cell, a.cell!, state.world.width) - hexDistance(army.cell, b.cell!, state.world.width) || compare(a.settlementId, b.settlementId));
      const destinationIndex = destinations.length ? (state.turn - 1 + theater.lastDispatches.length) % destinations.length : 0;
      const target = destinations[destinationIndex]?.cell ?? theater.reserveCell;
      if (target === army.cell) continue;
      index.count(army, -1);
      const result = queueMovement(state, theater.factionId, id, target);
      index.count(army, 1);
      const dispatch: TheaterDispatch = { armyId: id, targetCell: target, accepted: result.ok, message: result.ok ? result.events.at(-1)?.message ?? 'Travel accepted.' : result.error ?? 'Travel could not be queued.' };
      theater.lastDispatches.push(dispatch);
      if (result.ok) events.push(...result.events);
      else events.push(notice(state, theater, 'theater_dispatch_blocked', `${theater.name}: ${army.name} could not travel to hex ${target}. ${dispatch.message}`));
    }
  }
}

export function observeTheaters(state: GameState, factionId: string): ObservedDefenseTheater[] {
  const own = state.theaters.filter(item => item.factionId === factionId);
  if (!own.length) return [];
  const index = coverageIndex(state, own);
  return own.map(theater => {
    const hearths = hearthRows(state, theater, index), available = new Set(hearths.filter(row => row.available).map(row => row.cell));
    const members: TheaterMember[] = theater.armyIds.map(armyId => {
      const army = state.armies[armyId];
      if (!army || army.factionId !== factionId) return { armyId, cell: null, status: 'unavailable', targetCell: null, blocker: 'This army is no longer available.' };
      const route = state.routes[armyId], target = route?.waypoints.at(-1) ?? null;
      const blocker = memberBlocker(state, army, index);
      const status: TheaterMember['status'] = state.transports[armyId] ? 'blocked' : route || index.postings.has(armyId) ? route?.status === 'active' && available.has(target) ? 'incoming' : 'overridden' : blocker ? 'blocked' : available.has(army.cell) ? 'garrison' : army.cell === theater.reserveCell ? 'reserve' : 'ready';
      return { armyId, cell: army.cell, status, targetCell: target, blocker };
    });
    return { ...theater, ...(theater.reinforcementHolds ? { reinforcementHolds: theater.reinforcementHolds.map(hold => ({ ...hold })) } : {}), armyIds: [...theater.armyIds], settlementIds: [...theater.settlementIds], lastDispatches: theater.lastDispatches.map(item => ({ ...item })), hearths, members, missingGuards: hearths.reduce((sum, row) => sum + row.deficit, 0),
      blocker: !theater.enabled ? 'Automatic assignments are paused. Existing travel continues.' : !available.size ? 'No assigned hearth remains under your control. Update this theater before it can assign armies.' : !theater.armyIds.length ? 'No armies are assigned. Add combat land armies to fill garrison gaps.' : null };
  });
}
