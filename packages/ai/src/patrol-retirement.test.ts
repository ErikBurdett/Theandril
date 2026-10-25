/** Genuine captured-home circuit acceptance plus labeled observation contracts. */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { hexDistance } from '@theandril/mapgen';
import { applyCommand, deserializeGame, getMovementPreview, getObservation, serializeGame, stateHash, type GameCommand, type Observation } from '@theandril/sim';
import { createJournal, replayArchive } from '../../chronicle/src';
import { planPatrol } from './patrols';
import { planTurnWithReasons } from './index';
import { heldDelegatedArmyIds } from './theaters';

const factionId = 'faction.wardhall_remnant', armyId = 'army.408';
const clear = { type: 'clearPatrol' as const, factionId, armyId };
function captured() {
  const bytes = readFileSync(new URL('../../../docs/development/2026-10-24-patrol-recovery/diagnosis-recovered/snapshot-3-turn-150.json', import.meta.url), 'utf8');
  expect(createHash('sha256').update(bytes).digest('hex')).toBe('e8b68f936e8f7042f04465f879e669ef038cc27a9c927781fe368075a9e92b25');
  const game = deserializeGame(bytes);
  expect(stateHash(game)).toBe('4f60f2e3');
  return game;
}
const actorOrders = (commands: GameCommand[], view: Observation) => {
  const attached = new Set(view.characters.filter(character => character.location?.kind === 'army' && character.location.armyId === armyId).map(character => character.id));
  return commands.filter(command => 'armyId' in command && command.armyId === armyId
    || 'sourceArmyId' in command && (command.sourceArmyId === armyId || command.targetArmyId === armyId)
    || 'characterId' in command && attached.has(command.characterId));
};
const expectNoRetirement = (view: Observation) => expect(planPatrol(view).commands.some(command => command.type === 'clearPatrol')).toBe(false);

/** Synthetic observed roster for review bounds only, never serialized or
 * executed as a campaign. Every source fact comes from the pinned witness. */
function retirementRoster(count: number): Observation {
  const view = getObservation(captured(), factionId);
  const patrol = view.patrols!.find(item => item.armyId === armyId)!;
  const army = view.armies.find(item => item.id === armyId)!;
  const route = view.routes.find(item => item.armyId === armyId)!;
  const supply = view.supply.find(item => item.armyId === armyId)!;
  view.armies = view.armies.filter(item => item.factionId !== factionId);
  view.patrols = []; view.routes = []; view.supply = []; view.theaters = []; view.postings = []; view.sieges = []; view.characters = [];
  for (let i = 0; i < count; i++) {
    const id = `army.retirement.${String(i).padStart(3, '0')}`;
    view.armies.push({ ...structuredClone(army), id });
    view.patrols.push({ ...structuredClone(patrol), armyId: id });
    view.routes.push({ ...structuredClone(route), armyId: id });
    view.supply.push({ ...structuredClone(supply), armyId: id });
  }
  return view;
}

describe('observed captured home circuit retirement', () => {
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
    const initial = getObservation(game, factionId), first = planTurnWithReasons(initial);
    expect(actorOrders(first.commands, initial)).toEqual([clear]);
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
    const cell = game.armies[armyId]!.cell;
    // This genuine full batch first makes the released company do a paid
    // survey. Do not suppress that legitimate work to demand immediate travel.
    const next = planTurnWithReasons(fresh);
    expect(next).toEqual(planTurnWithReasons(getObservation(mirror, factionId)));
    expect(actorOrders(next.commands, fresh)).toContainEqual({ type: 'searchArcane', factionId, armyId });
    const purse = game.factions.find(faction => faction.id === factionId)!.treasury;
    for (const command of next.commands) record(command);
    expect(game.factions.find(faction => faction.id === factionId)!.treasury).toBe(purse - fresh.arcaneSearchCoinCost);
    record({ type: 'endTurn', factionId: game.turnOwnerId });
    const continuing = getObservation(game, factionId), movement = planTurnWithReasons(continuing);
    expect(movement).toEqual(planTurnWithReasons(getObservation(mirror, factionId)));
    expect(actorOrders(movement.commands, continuing).some(command => command.type === 'moveTo')).toBe(true);
    for (const command of movement.commands) record(command);
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
    expect(actorOrders(planTurnWithReasons(fresh).commands, fresh)).toEqual([]);
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

  it('preserves a distinct route assigned through the ordinary queueMovement command', () => {
    const game = captured(), view = getObservation(game, factionId);
    const patrol = view.patrols!.find(item => item.armyId === armyId)!, army = view.armies.find(item => item.id === armyId)!;
    const targets = view.cells.filter(cell => cell.cell !== patrol.firstCell && cell.cell !== patrol.secondCell && cell.terrain !== 0
      && hexDistance(army.cell, cell.cell, view.width) >= 5 && hexDistance(army.cell, cell.cell, view.width) <= 8).slice(0, 24);
    const alternative = targets.find(cell => {
      const preview = getMovementPreview(view, armyId, cell.cell);
      return preview.action === 'move' && preview.canQueue && preview.cost > army.movement;
    });
    expect(alternative).toBeDefined();
    expect(applyCommand(game, { type: 'queueMovement', factionId, armyId, target: alternative!.cell }).ok).toBe(true);
    const route = structuredClone(game.routes[armyId]);
    expect(route).toBeDefined(); expect(route!.waypoints).not.toEqual([patrol.targetCell]);
    expect(planPatrol(getObservation(game, factionId)).commands).toEqual([]);
    expect(game.routes[armyId]).toEqual(route);
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

  it('requires current sight even if a foreign settlement row is supplied', () => {
    const view = getObservation(captured(), factionId);
    view.cells.find(cell => cell.cell === 9108)!.visible = false;
    expect(view.settlements.some(town => town.cell === 9108 && town.factionId !== factionId)).toBe(true);
    expectNoRetirement(view);
  });

  it('preserves circuits whose target remains owned', () => {
    const view = getObservation(captured(), factionId);
    view.settlements.find(town => town.cell === 9108)!.factionId = factionId;
    expectNoRetirement(view);
  });

  it('does not generalize retirement to a distant owned endpoint', () => {
    const view = getObservation(captured(), factionId);
    const distant = view.settlements.find(town => town.factionId === factionId && hexDistance(town.cell, 9108, view.width) > 6)!;
    expect(distant).toBeDefined();
    view.patrols!.find(patrol => patrol.armyId === armyId)!.firstCell = distant.cell;
    expectNoRetirement(view);
  });

  it.each(['siege', 'stationary mission'] as const)('preserves a %s override in an observation contract', kind => {
    const view = getObservation(captured(), factionId);
    if (kind === 'siege') view.sieges.push({ settlementId: 'settlement.target', armyId, factionId, startedTurn: 1, defenses: 1, supplies: 1, militiaStrength: 1, militiaMorale: 1, militiaFatigue: 0, canAssault: false, assaultBlocker: 'Authored siege', defenderStrength: 1 });
    else view.characters.push({ id: 'character.retirement', factionId, definitionId: 'character.engineer', name: 'Authored engineer', experience: 0, skillId: null, learnedSkillIds: [], woundedTurns: 0, dead: false, location: { kind: 'army', armyId }, mission: { id: 'mission.retirement', definitionId: 'mission.road', armyId, anchorCell: view.armies.find(army => army.id === armyId)!.cell, targetSettlementId: null, remainingTurns: 1, startedTurn: 1 }, role: 'engineer', status: 'mission', rank: 1, cell: null, assignmentOptions: [], unassignmentOptions: [], missions: [], promotions: [] });
    expectNoRetirement(view);
  });

  it('rotates four administrative commands across all 128 observed policies with no path queries', () => {
    const view = retirementRoster(128), seen = new Set<string>(), turn = view.turn;
    for (let step = 0; step < 32; step++) {
      view.turn = turn + step;
      const before = structuredClone(view), plan = planPatrol(view);
      expect(plan.commands).toHaveLength(4); expect(plan.routeQueries).toBe(0);
      expect(plan.targetSearchExpandedNodes).toBe(0); expect(plan.heldArmyIds.size).toBe(128);
      for (const command of plan.commands) {
        expect(command.type).toBe('clearPatrol');
        if ('armyId' in command) { expect(seen.has(command.armyId)).toBe(false); seen.add(command.armyId); }
      }
      expect(view).toEqual(before);
    }
    expect(seen.size).toBe(128);
    const ordered = planPatrol(view);
    view.patrols!.reverse(); view.armies.reverse(); view.routes.reverse(); view.supply.reverse(); view.cells.reverse(); view.settlements.reverse();
    expect(planPatrol(view)).toEqual(ordered);
  });

  it('shares one four-command cap between retirement and queried recovery in a 128-policy observation', () => {
    const view = retirementRoster(128);
    // Remove observed war relations for this explicitly synthetic contract;
    // foreign ownership alone is sufficient for retirement, while recovery
    // must have no nearby known wartime force.
    view.wars = [];
    const other = view.settlements.find(town => town.factionId === factionId && town.cell !== 8431)!;
    for (let index = 1; index < view.patrols!.length; index += 2) {
      const patrol = view.patrols![index]!;
      patrol.firstCell = other.cell; patrol.secondCell = 8431; patrol.target = 'second'; patrol.targetCell = 8431;
      view.routes.find(route => route.armyId === patrol.armyId)!.waypoints = [8431];
    }
    const sample = view.patrols![1]!, preview = getMovementPreview(view, sample.armyId, 8431);
    expect(preview.canQueue).toBe(true); expect(preview.action).toBe('move');
    const before = structuredClone(view), plan = planPatrol(view);
    expect(plan.commands).toHaveLength(4);
    expect(plan.commands.filter(command => command.type === 'clearPatrol')).toHaveLength(2);
    expect(plan.commands.filter(command => command.type === 'resumeMovement')).toHaveLength(2);
    expect(plan.routeQueries).toBe(2); expect(plan.targetSearchExpandedNodes).toBe(preview.expandedNodes * 2);
    expect(plan.heldArmyIds.size).toBe(128); expect(view).toEqual(before);
  });

  it('does not invent patrol controls for a historical observation capability', () => {
    const view = getObservation(captured(), factionId);
    delete view.patrols;
    expect(planPatrol(view).commands).toEqual([]);
  });
});
