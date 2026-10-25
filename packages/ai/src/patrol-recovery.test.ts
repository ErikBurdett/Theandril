import { describe, expect, it } from 'vitest';
import { hexDistance } from '@theandril/mapgen';
import { applyCommand, createArmyFormation, deserializeGame, getMovementPreview, getObservation, serializeGame, stateHash, type GameCommand, type Observation } from '@theandril/sim';
import { createJournal, replayArchive } from '../../chronicle/src';
import { theaterCampaign } from '../../test-fixtures/src/theater-fixture';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { reconcileMovement } from '../../sim/src/movement';
import { relocateArmy } from '../../sim/src/warfare';
import { planPatrol } from './patrols';
import { planTurnWithReasons } from './index';

/** Authored open land and initial contact only. Patrol, travel interruption,
 * peace and recovery below use ordinary recorded campaign commands. */
function interruptedCircuit() {
  let game = theaterCampaign(1);
  const factionId = game.turnOwnerId, rival = game.factions[1]!.id;
  const armyId = Object.keys(game.armies)[0]!, enemyId = `army.${game.nextId++}`;
  game.armies[armyId]!.cell = 500;
  game.armies[enemyId] = { id: enemyId, factionId: rival, name: 'Authored approaching guard', cell: 508, movement: 3,
    formations: [createArmyFormation(enemyId, 'unit.guard')] };
  refreshAuthoredSight(game);
  game = deserializeGame(serializeGame(game));
  const journal = createJournal(game, { mode: 'watch', coverage: 'from-save' });
  const record = (command: GameCommand) => {
    const result = journal.record(game, command);
    expect(result.ok, `${command.type}: ${result.error ?? ''}`).toBe(true);
    return result;
  };
  const end = () => record({ type: 'endTurn', factionId });
  record({ type: 'setPatrol', factionId, armyId, firstCell: 500, secondCell: 510, enabled: true, pauseOnWar: false });
  record({ type: 'declareWar', factionId, targetFactionId: rival });
  // The direct leg matches the canonical patrol target. Saved routes do not
  // record provenance, so this does not claim to distinguish an identical
  // manual leg from one assigned by patrol scheduling during AI takeover.
  record({ type: 'queueMovement', factionId, armyId, target: 510 });
  for (let turn = 0; game.routes[armyId]?.status === 'active' && turn < 4; turn++) end();
  expect(game.routes[armyId]).toMatchObject({ status: 'paused', waypoints: [510], pauseReason: 'New hostile forces or a hostile settlement were sighted nearby.' });
  const peace = () => {
    record({ type: 'proposePeace', factionId, targetFactionId: rival, terms: { offerCoin: 0, requestCoin: 0, truceTurns: 5 } });
    record({ type: 'respondPeace', factionId: rival, offerId: game.diplomacy.offers[0]!.id, accept: true });
    end(); // Canonical player turns do not silently resume the paused route.
    expect(game.routes[armyId]?.status).toBe('paused');
    const view = getObservation(game, factionId), army = view.armies.find(item => item.id === armyId)!;
    expect(army.movement).toBeGreaterThan(0);
    expect(view.supply.find(item => item.armyId === armyId)?.supplied).toBe(true);
    expect(getMovementPreview(view, armyId, 510)).toMatchObject({ canQueue: true, action: 'move' });
    return view;
  };
  return { game, factionId, rival, armyId, enemyId, journal, record, end, peace };
}

const resumes = (view: Observation) => planPatrol(view).commands.filter(command => command.type === 'resumeMovement');

function actorCommands(commands: GameCommand[], ids: ReadonlySet<string>, view: Observation) {
  const characters = new Set(view.characters.filter(character => character.location?.kind === 'army' && ids.has(character.location.armyId)).map(character => character.id));
  return commands.filter(command => 'armyId' in command && ids.has(command.armyId)
    || 'sourceArmyId' in command && (ids.has(command.sourceArmyId) || ids.has(command.targetArmyId))
    || 'characterId' in command && characters.has(command.characterId));
}

/** Deliberately synthetic observation roster, solely for planner budget/fairness
 * checks. It is never serialized as a campaign or passed to applyCommand. */
function recoveryRoster(base: Observation, count: number): Observation {
  const view = structuredClone(base), patrol = view.patrols![0]!;
  const army = view.armies.find(item => item.id === patrol.armyId)!;
  const route = view.routes.find(item => item.armyId === army.id)!;
  const supply = view.supply.find(item => item.armyId === army.id)!;
  view.armies = view.armies.filter(item => item.factionId !== view.factionId);
  view.routes = []; view.patrols = []; view.supply = [];
  for (let i = 0; i < count; i++) {
    const armyId = `army.recovery.${String(i).padStart(3, '0')}`;
    view.armies.push({ ...structuredClone(army), id: armyId });
    view.routes.push({ ...structuredClone(route), armyId });
    view.patrols.push({ ...structuredClone(patrol), armyId });
    view.supply.push({ ...structuredClone(supply), armyId });
  }
  return view;
}

describe('explicit AI recovery of observed interrupted patrol legs', () => {
  it('waits for a real nearby hostile to clear, then resumes through public commands with save and journal parity', () => {
    const scene = interruptedCircuit(), { game, armyId, factionId } = scene;
    const threatened = getObservation(game, factionId), army = threatened.armies.find(item => item.id === armyId)!;
    const enemy = threatened.armies.find(item => item.id === scene.enemyId)!;
    expect(hexDistance(army.cell, enemy.cell, threatened.width)).toBeLessThanOrEqual(army.sight);
    expect(resumes(threatened)).toEqual([]);
    const view = scene.peace(), unchanged = structuredClone(view), hash = stateHash(game), policy = structuredClone(game.patrols);
    const plan = planPatrol(view);
    expect(plan.commands).toEqual([{ type: 'resumeMovement', factionId, armyId }]);
    expect(plan.heldArmyIds.has(armyId)).toBe(true);
    expect(plan.routeQueries).toBe(1);
    expect(view).toEqual(unchanged); expect(stateHash(game)).toBe(hash);
    expect(actorCommands(planTurnWithReasons(view).commands, new Set([armyId]), view)).toEqual(plan.commands);
    const mirror = deserializeGame(serializeGame(game));
    expect(planPatrol(getObservation(mirror, factionId))).toEqual(plan);
    const cell = game.armies[armyId]!.cell;
    for (const command of plan.commands) {
      const result = scene.record(command);
      expect(applyCommand(mirror, command)).toEqual(result);
    }
    expect(game.armies[armyId]!.cell).not.toBe(cell);
    expect(game.patrols).toEqual(policy); expect(game.battle).toBeNull();
    expect(stateHash(mirror)).toBe(stateHash(game));
    expect(stateHash(replayArchive(scene.journal.materialize()))).toBe(stateHash(game));
  });

  it('honors an actual standing posting and an explicitly paused patrol instead of resuming their route', () => {
    const scene = interruptedCircuit(); scene.peace();
    scene.record({ type: 'setPosting', factionId: scene.factionId, armyId: scene.armyId, cell: scene.game.armies[scene.armyId]!.cell, mode: 'hold' });
    const posted = getObservation(scene.game, scene.factionId);
    expect(posted.patrols![0]!.status).toBe('overridden'); expect(resumes(posted)).toEqual([]);
    expect(planPatrol(posted).heldArmyIds.has(scene.armyId)).toBe(true);
    scene.record({ type: 'setPosting', factionId: scene.factionId, armyId: scene.armyId, cell: 500, mode: 'none' });
    scene.record({ type: 'setPatrolEnabled', factionId: scene.factionId, armyId: scene.armyId, enabled: false });
    const paused = getObservation(scene.game, scene.factionId);
    expect(resumes(paused)).toEqual([]); expect(planPatrol(paused).heldArmyIds.has(scene.armyId)).toBe(false);
    expect(scene.game.routes[scene.armyId]?.status).toBe('paused');
  });

  it('recovers during an ongoing war after the actually observed enemy moves beyond this company’s sight', () => {
    const scene = interruptedCircuit(), { game, armyId, enemyId, factionId, rival } = scene;
    const own = getObservation(game, factionId).armies.find(army => army.id === armyId)!;
    const hostileView = getObservation(game, rival), enemy = hostileView.armies.find(army => army.id === enemyId)!;
    const escape = hostileView.cells.filter(cell => hexDistance(own.cell, cell.cell, hostileView.width) > own.sight
      && hexDistance(enemy.cell, cell.cell, hostileView.width) <= enemy.movement)
      .sort((a, b) => hexDistance(own.cell, b.cell, hostileView.width) - hexDistance(own.cell, a.cell, hostileView.width) || a.cell - b.cell)
      .find(cell => { const preview = getMovementPreview(hostileView, enemyId, cell.cell); return preview.canMoveNow && preview.action === 'move'; });
    expect(escape).toBeDefined();
    scene.record({ type: 'moveTo', factionId: rival, armyId: enemyId, target: escape!.cell });
    scene.end();
    const view = getObservation(game, factionId);
    expect(view.wars).toContain(rival); expect(game.routes[armyId]?.status).toBe('paused');
    expect(hexDistance(game.armies[armyId]!.cell, game.armies[enemyId]!.cell, view.width)).toBeGreaterThan(own.sight);
    const commands = resumes(view);
    expect(commands).toEqual([{ type: 'resumeMovement', factionId, armyId }]);
    for (const command of commands) scene.record(command);
    expect(game.battle).toBeNull();
    expect(stateHash(replayArchive(scene.journal.materialize()))).toBe(stateHash(game));
  });

  it('declines isolated observation variants for direct routes, lost hearths, unavailable armies and visible hostile towns', () => {
    const scene = interruptedCircuit(), base = scene.peace(), own = scene.factionId, rival = scene.rival, armyId = scene.armyId;
    // These mutations isolate client-side red lines, not canonical save fixtures.
    const variants: [string, (view: Observation) => void][] = [
      ['active route', view => { view.routes[0]!.status = 'active'; view.routes[0]!.pauseReason = null; }],
      ['different target', view => { view.routes[0]!.waypoints = [511]; }],
      ['multiple waypoints', view => { view.routes[0]!.waypoints = [507, 510]; }],
      ['missing first hearth', view => { view.settlements = view.settlements.filter(town => town.cell !== 500); }],
      ['lost second hearth', view => { view.settlements.find(town => town.cell === 510)!.factionId = rival; }],
      ['foreign army', view => { view.armies.find(army => army.id === armyId)!.factionId = rival; }],
      ['embarked army', view => { view.armies.find(army => army.id === armyId)!.carrierId = 'army.carrier'; }],
      ['naval army', view => { view.armies.find(army => army.id === armyId)!.domain = 'naval'; }],
      ['noncombat army', view => { view.armies.find(army => army.id === armyId)!.canAttack = false; }],
      ['caravan-bearing army', view => { view.armies.find(army => army.id === armyId)!.canFound = true; }],
      ['movement blocker', view => { view.armies.find(army => army.id === armyId)!.movementBlocker = 'Authored stationary restriction.'; }],
      ['no movement', view => { view.armies.find(army => army.id === armyId)!.movement = 0; }],
      ['unsupplied', view => { view.supply.find(item => item.armyId === armyId)!.supplied = false; }],
      ['missing supply status', view => { view.supply = []; }],
      ['siege', view => { view.sieges.push({ settlementId: 'settlement.target', armyId, factionId: own, startedTurn: 1, defenses: 1, supplies: 1, militiaStrength: 1, militiaMorale: 1, militiaFatigue: 0, canAssault: false, assaultBlocker: 'Authored siege', defenderStrength: 1 }); }],
      ['stationary mission', view => { view.characters.push({ id: 'character.recovery', factionId: own, definitionId: 'character.engineer', name: 'Authored engineer', experience: 0, skillId: null, learnedSkillIds: [], woundedTurns: 0, dead: false, location: { kind: 'army', armyId }, mission: { id: 'mission.recovery', definitionId: 'mission.road', armyId, anchorCell: view.armies.find(army => army.id === armyId)!.cell, targetSettlementId: null, remainingTurns: 1, startedTurn: 1 }, role: 'engineer', status: 'mission', rank: 1, cell: null, assignmentOptions: [], unassignmentOptions: [], missions: [], promotions: [] }); }],
      ['nearby hostile town', view => { view.wars = [rival]; view.armies = view.armies.filter(army => army.factionId === own); view.settlements.push({ ...structuredClone(view.settlements[0]!), id: 'settlement.threat', factionId: rival, cell: view.armies[0]!.cell + 1 }); }],
      ['historical observation', view => { delete view.patrols; }],
    ];
    for (const [name, change] of variants) {
      const view = structuredClone(base); change(view);
      expect(resumes(view), name).toEqual([]);
    }
  });

  it('rotates bounded recovery across 128 synthetic observed records without rewriting policies or losing reservations', () => {
    const scene = interruptedCircuit(), base = recoveryRoster(scene.peace(), 128), seen = new Set<string>();
    for (let turn = base.turn; turn < base.turn + 32; turn++) {
      const view = { ...structuredClone(base), turn }, before = structuredClone(view), plan = planPatrol(view);
      expect(plan.routeQueries).toBe(4); expect(plan.commands).toHaveLength(4);
      expect(plan.heldArmyIds.size).toBe(128);
      for (const command of plan.commands) {
        expect(command.type).toBe('resumeMovement');
        if (command.type === 'resumeMovement') seen.add(command.armyId);
      }
      const shuffled = structuredClone(view);
      shuffled.patrols!.reverse(); shuffled.armies.reverse(); shuffled.routes.reverse(); shuffled.supply.reverse();
      expect(planPatrol(shuffled)).toEqual(plan);
      expect(view).toEqual(before);
    }
    expect(seen.size).toBe(128);
  });

  it('bounds unsuccessful route reviews and does not spend recovery commands on an unreachable observed target', () => {
    const scene = interruptedCircuit(), view = recoveryRoster(scene.peace(), 128);
    // A synthetic contradictory observed destination isolates failed-preview
    // accounting; this is not asserted to be a valid canonical settlement.
    view.cells.find(cell => cell.cell === 510)!.terrain = 0;
    const plan = planPatrol(view);
    expect(plan.routeQueries).toBe(4); expect(plan.commands).toEqual([]);
    expect(plan.heldArmyIds.size).toBe(128);
  });

  it('caps already-arrived synthetic paused legs at four public resumes without route searches', () => {
    const scene = interruptedCircuit(), view = recoveryRoster(scene.peace(), 128);
    // Isolated observed already-arrived shape: resumeMovement owns cancellation;
    // the planner must neither rewrite the policy nor issue cancelMovement itself.
    for (const army of view.armies) if (army.factionId === view.factionId) army.cell = 510;
    const plan = planPatrol(view);
    expect(plan.routeQueries).toBe(0); expect(plan.commands).toHaveLength(4);
    expect(plan.commands.every(command => command.type === 'resumeMovement')).toBe(true);
    expect(plan.heldArmyIds.size).toBe(128);
  });

  it('resumes a saveable displaced route at its completed endpoint by cancelling only that route, with exact replay', () => {
    const scene = interruptedCircuit(); scene.peace();
    const { game, armyId, factionId } = scene;
    // Explicit authored displacement, such as a post-battle relocation. Use the
    // canonical relocation/reconciliation helpers, then begin a fresh archive
    // from that validated save; this is not claimed as a played battle outcome.
    relocateArmy(game, game.armies[armyId]!, 510);
    const events: Parameters<typeof reconcileMovement>[1] = [];
    reconcileMovement(game, events, [armyId]);
    game.events.push(...events);
    expect(game.routes[armyId]).toMatchObject({ status: 'paused', waypoints: [510], pauseReason: 'The army was displaced from its planned route.' });
    const saved = serializeGame(game), restored = deserializeGame(saved);
    expect(serializeGame(restored)).toBe(saved);
    const journal = createJournal(restored, { mode: 'watch', coverage: 'from-save' });
    const view = getObservation(restored, factionId), plan = planPatrol(view);
    expect(plan.commands).toEqual([{ type: 'resumeMovement', factionId, armyId }]);
    expect(plan.routeQueries).toBe(0); expect(plan.heldArmyIds.has(armyId)).toBe(true);
    const policy = structuredClone(restored.patrols), army = structuredClone(restored.armies[armyId]);
    const result = journal.record(restored, plan.commands[0]!);
    expect(result.ok, result.error).toBe(true);
    expect(result.events.some(event => event.type === 'movement_cancelled')).toBe(true);
    expect(restored.routes[armyId]).toBeUndefined();
    expect(restored.patrols).toEqual(policy); expect(restored.armies[armyId]).toEqual(army);
    expect(stateHash(replayArchive(journal.materialize()))).toBe(stateHash(restored));
    expect(serializeGame(deserializeGame(serializeGame(restored)))).toBe(serializeGame(restored));
  });

  it('has identical recovery proposals when a distant unseen foreign force changes', () => {
    const scene = interruptedCircuit(); scene.peace();
    // Authored far-away force is added before taking either observation.
    const hidden = scene.game.world.width * 25 + 35, id = `army.${scene.game.nextId++}`;
    scene.game.armies[id] = { id, factionId: scene.rival, name: 'Hidden guard', cell: hidden, movement: 3, formations: [createArmyFormation(id, 'unit.guard')] };
    refreshAuthoredSight(scene.game);
    const view = getObservation(scene.game, scene.factionId);
    expect(view.armies.some(army => army.id === id)).toBe(false);
    // The theater fixture explored the full map; only never-observed occupancy
    // and unchanged remembered terrain may be used for this fog check.
    scene.game.armies[id]!.formations[0]!.strength = 1;
    const changed = getObservation(scene.game, scene.factionId);
    expect(changed).toEqual(view);
    expect(planPatrol(changed)).toEqual(planPatrol(view));
    expect(resumes(view)).toHaveLength(1);
  });
});
