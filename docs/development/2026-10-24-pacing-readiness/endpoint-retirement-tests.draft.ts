/** Future acceptance draft, intentionally outside Vitest discovery while the
 * preceding checkpoint publishes. Do not rename/promote until parent go-ahead. */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { applyCommand, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand, type Observation } from '../../../packages/sim/src';
import { createJournal, replayArchive } from '../../../packages/chronicle/src';
import { planPatrol } from '../../../packages/ai/src/patrols';
import { planTurnWithReasons } from '../../../packages/ai/src';
import { heldDelegatedArmyIds } from '../../../packages/ai/src/theaters';

const factionId = 'faction.wardhall_remnant', armyId = 'army.408';
const clear = { type: 'clearPatrol' as const, factionId, armyId };
function captured() {
  const bytes = readFileSync(new URL('../2026-10-24-patrol-recovery/diagnosis-recovered/snapshot-3-turn-150.json', import.meta.url), 'utf8');
  expect(createHash('sha256').update(bytes).digest('hex')).toBe('e8b68f936e8f7042f04465f879e669ef038cc27a9c927781fe368075a9e92b25');
  const game = deserializeGame(bytes);
  expect(stateHash(game)).toBe('4f60f2e3');
  return game;
}
const actorOrders = (commands: GameCommand[]) => commands.filter(command => 'armyId' in command && command.armyId === armyId
  || 'sourceArmyId' in command && (command.sourceArmyId === armyId || command.targetArmyId === armyId));
const expectNoRetirement = (view: Observation) => expect(planPatrol(view).commands.some(command => command.type === 'clearPatrol')).toBe(false);

describe('observed captured home circuit retirement — acceptance draft', () => {
  it('proposes only ordinary cleanup for the genuine currently observed capture and retains the batch reservation', () => {
    const game = captured(), view = getObservation(game, factionId), before = structuredClone(view);
    expect(view.settlements.find(town => town.cell === 9108)).toMatchObject({ id: 'settlement.517', factionId: 'faction.ashen_compact' });
    expect(view.cells.find(cell => cell.cell === 9108)?.visible).toBe(true);
    expect(view.settlements.find(town => town.cell === 8431)?.factionId).toBe(factionId);
    const plan = planPatrol(view);
    expect(plan.commands).toEqual([clear]); expect(plan.routeQueries).toBe(0);
    expect(plan.heldArmyIds.has(armyId)).toBe(true);
    expect(view).toEqual(before); expect(stateHash(game)).toBe('4f60f2e3');
  });

  it('clears in one full AI batch, preserves the direct route at that boundary, then actually moves on a fresh plan with exact replay', () => {
    const game = captured(), mirror = deserializeGame(serializeGame(game));
    const journal = createJournal(game, { mode: 'watch', coverage: 'from-save' });
    const route = structuredClone(game.routes[armyId]);
    const first = planTurnWithReasons(getObservation(game, factionId));
    expect(actorOrders(first.commands)).toEqual([clear]);
    const record = (command: GameCommand) => {
      const result = journal.record(game, command);
      expect(result.ok, result.error).toBe(true); expect(applyCommand(mirror, command)).toEqual(result);
      expect(game.battle).toBeNull(); expect(game.pendingCapture).toBeNull();
    };
    for (const command of first.commands) {
      record(command);
      if (command.type === 'clearPatrol' && command.armyId === armyId) expect(game.routes[armyId]).toEqual(route);
    }
    expect(game.routes[armyId]).toEqual(route);
    const fresh = getObservation(game, factionId);
    expect(heldDelegatedArmyIds(fresh).has(armyId)).toBe(false);
    expect(fresh.patrols!.some(patrol => patrol.armyId === armyId)).toBe(false);
    const next = planTurnWithReasons(fresh);
    expect(next).toEqual(planTurnWithReasons(getObservation(mirror, factionId)));
    expect(actorOrders(next.commands).some(command => command.type === 'moveTo')).toBe(true);
    const cell = game.armies[armyId]!.cell;
    for (const command of next.commands) record(command);
    expect(game.armies[armyId]!.cell).not.toBe(cell);
    expect(stateHash(mirror)).toBe(stateHash(game));
    expect(stateHash(deserializeGame(serializeGame(game)))).toBe(stateHash(game));
    expect(stateHash(replayArchive(journal.materialize()))).toBe(stateHash(game));
  });

  // Administrative retirement does not march or feed the army. These are
  // explicit observation-contract cases, not claims of alternate campaigns.
  it.each(['no-movement', 'exhausted', 'unsupplied'] as const)('allows administrative cleanup for a %s company without changing its route', condition => {
    const game = captured(), view = getObservation(game, factionId);
    const army = view.armies.find(item => item.id === armyId)!;
    if (condition === 'no-movement') { army.movement = 0; army.movementBlocker = 'No movement remains in this authored observation contract.'; }
    if (condition === 'exhausted') { army.morale = 1; army.fatigue = 100; }
    if (condition === 'unsupplied') {
      const supply = view.supply.find(item => item.armyId === armyId)!;
      supply.supplied = false; supply.sourceSettlementId = null; supply.reason = 'No supply reaches this authored observation contract.';
    }
    const before = structuredClone(view), route = structuredClone(game.routes[armyId]);
    const plan = planPatrol(view);
    expect(plan.commands).toEqual([clear]); expect(plan.routeQueries).toBe(0);
    expect(plan.targetSearchExpandedNodes).toBe(0); expect(plan.heldArmyIds.has(armyId)).toBe(true);
    expect(view).toEqual(before);
    expect(applyCommand(game, clear).ok).toBe(true);
    expect(game.routes[armyId]).toEqual(route);
  });

  it('preserves a separate enabled theater reservation in the cleanup batch and in the fresh observation', () => {
    const game = captured(), route = structuredClone(game.routes[armyId]);
    const theater = game.theaters.find(item => item.factionId === factionId)!;
    expect(theater).toBeDefined(); expect(theater.armyIds).not.toContain(armyId);
    const armyIds = [...theater.armyIds.filter(id => game.armies[id]?.factionId === factionId), armyId].sort();
    const assigned = applyCommand(game, { type: 'setTheater', factionId, theaterId: theater.id, name: theater.name,
      armyIds, settlementIds: theater.settlementIds, reserveCell: theater.reserveCell,
      guardsPerSettlement: theater.guardsPerSettlement, reinforcementLimit: theater.reinforcementLimit ?? 0, enabled: true });
    expect(assigned.ok, assigned.error).toBe(true);
    const view = getObservation(game, factionId), plan = planPatrol(view);
    expect(plan.commands).toEqual([clear]); expect(plan.heldArmyIds.has(armyId)).toBe(true);
    expect(applyCommand(game, clear).ok).toBe(true); expect(game.routes[armyId]).toEqual(route);
    const fresh = getObservation(game, factionId);
    expect(fresh.patrols!.some(patrol => patrol.armyId === armyId)).toBe(false);
    expect(fresh.theaters!.some(item => item.enabled && item.armyIds.includes(armyId))).toBe(true);
    expect(heldDelegatedArmyIds(fresh).has(armyId)).toBe(true);
    expect(actorOrders(planTurnWithReasons(fresh).commands)).toEqual([]);
  });

  it('keeps an explicitly disabled policy and the matching paused route', () => {
    const game = captured(), route = structuredClone(game.routes[armyId]);
    expect(applyCommand(game, { type: 'setPatrolEnabled', factionId, armyId, enabled: false }).ok).toBe(true);
    const view = getObservation(game, factionId), before = serializeGame(game);
    expectNoRetirement(view); expect(serializeGame(game)).toBe(before); expect(game.routes[armyId]).toEqual(route);
  });

  it('preserves an explicit war-pause policy even when the leg still matches the captured endpoint', () => {
    const game = captured();
    expect(applyCommand(game, { type: 'setPatrol', factionId, armyId, firstCell: 9108, secondCell: 8431, enabled: true, pauseOnWar: true }).ok).toBe(true);
    const view = getObservation(game, factionId);
    expect(view.routes.find(route => route.armyId === armyId)?.waypoints).toEqual([view.patrols!.find(patrol => patrol.armyId === armyId)!.targetCell]);
    expectNoRetirement(view);
  });

  it('preserves an ordinary standing posting override', () => {
    const game = captured();
    expect(applyCommand(game, { type: 'setPosting', factionId, armyId, cell: 8431, mode: 'hold' }).ok).toBe(true);
    expectNoRetirement(getObservation(game, factionId));
  });

  it('leaves the player-controlled canonical configuration intact without an AI cleanup command', () => {
    const game = captured(), policy = structuredClone(game.patrols.find(patrol => patrol.armyId === armyId));
    expect(applyCommand(game, { type: 'endTurn', factionId: game.turnOwnerId }).ok).toBe(true);
    expect(game.patrols.find(patrol => patrol.armyId === armyId)).toEqual(policy);
  });

  // These are observation-level contract controls, not alternate recorded
  // campaign histories. Real configuration/direct-route controls are also
  // exercised by the retained standalone fail-before probe.
  it.each(['active', 'different-target', 'multi-waypoint'] as const)('leaves %s direct travel alone', kind => {
    const view = getObservation(captured(), factionId), route = view.routes.find(item => item.armyId === armyId)!;
    if (kind === 'active') { route.status = 'active'; route.pauseReason = null; }
    if (kind === 'different-target') route.waypoints = [8431];
    if (kind === 'multi-waypoint') route.waypoints = [9108, 8431];
    const before = structuredClone(view); expectNoRetirement(view); expect(view).toEqual(before);
  });

  it('does not infer captured-town ownership from stale charted cells or an absent own-hearth entry', () => {
    const view = getObservation(captured(), factionId);
    view.settlements = view.settlements.filter(town => town.cell !== 9108);
    const cell = view.cells.find(item => item.cell === 9108)!;
    cell.visible = false; // Retain last-known faction/settlement fields as misleading stale context.
    const before = structuredClone(view); expectNoRetirement(view); expect(view).toEqual(before);
  });

  it('requires the other endpoint to remain an owned hearth', () => {
    const view = getObservation(captured(), factionId);
    view.settlements = view.settlements.filter(town => town.cell !== 8431);
    expectNoRetirement(view);
  });

  it('does not invent patrol controls for a historical observation capability', () => {
    const view = getObservation(captured(), factionId);
    delete view.patrols;
    expect(planPatrol(view).commands).toEqual([]);
  });
});
