import { describe, expect, it } from 'vitest';
import { applyCommand, getObservation } from '@theandril/sim';
import { theaterCampaign } from '../../../packages/test-fixtures/src/theater-fixture';
import { armyOrderCounts, buildArmyOrderIndex, matchesArmyOrderFilter } from './army-order-status';

function roster() {
  const game = theaterCampaign(101), factionId = game.turnOwnerId;
  const armies = Object.values(game.armies).filter(army => army.factionId === factionId)
    .sort((a, b) => a.id.localeCompare(b.id));
  const first = armies[0]!, last = armies.at(-1)!;
  expect(applyCommand(game, { type: 'setPosting', factionId, armyId: first.id, cell: 497, mode: 'hold' }).ok).toBe(true);
  expect(applyCommand(game, { type: 'setPatrol', factionId, armyId: last.id, firstCell: 495, secondCell: 497, enabled: false }).ok).toBe(true);
  return { view: getObservation(game, factionId), first, last };
}

describe('owned army order presentation', () => {
  it('projects canonical reports for all 101 armies, without geography reads or mutation', () => {
    const { view, first, last } = roster(), before = structuredClone(view);
    const guarded = new Proxy(view, { get(target, key, receiver) {
      if (key === 'cells') throw new Error('Order projection must not inspect geography.');
      return Reflect.get(target, key, receiver);
    } });
    const index = buildArmyOrderIndex(guarded);
    expect(index.size).toBe(101);
    expect(index.get(first.id)!.posting).toEqual(expect.objectContaining({ cell: 497, blocker: view.postings[0]!.blocker }));
    expect(index.get(first.id)!.posting).not.toBe(view.postings[0]);
    expect(matchesArmyOrderFilter(index.get(last.id)!, 'paused-patrols')).toBe(true);
    expect(view).toEqual(before);
  });

  it('keeps disabled policy distinct from active travel and movement availability', () => {
    const { view, last } = roster();
    // Explicit observation contract, not a claimed saved campaign: isolate display facts.
    view.armies.find(army => army.id === last.id)!.movement = 0;
    view.routes = [{ armyId: last.id, origin: 495, waypoints: [0], path: [496], status: 'active', pauseReason: null, knownHostileIds: [] }];
    const status = buildArmyOrderIndex(view).get(last.id)!;
    expect(status).toMatchObject({ pausedPatrol: true, standing: true, waiting: false, route: { targetCell: 0, status: 'active' } });
    view.routes[0]!.status = 'paused';
    view.routes[0]!.pauseReason = 'Exact observed route interruption.';
    expect(buildArmyOrderIndex(view).get(last.id)).toMatchObject({ pausedPatrol: true, waiting: true, route: { pauseReason: 'Exact observed route interruption.' } });
  });

  it('unions current waiting facts without parsing reason text or stale last errors', () => {
    const { view, last } = roster(), patrol = view.patrols![0]!;
    patrol.enabled = true; patrol.status = 'waiting'; patrol.blocker = 'Exact canonical patrol reason.';
    expect(buildArmyOrderIndex(view).get(last.id)).toMatchObject({ waiting: true, pausedPatrol: false, patrol: { blocker: patrol.blocker } });
    for (const status of ['ready', 'traveling', 'overridden'] as const) {
      patrol.status = status; patrol.lastError = 'Old failed attempt.';
      expect(buildArmyOrderIndex(view).get(last.id)!.waiting).toBe(false);
    }
  });

  it('does not call a route alone a posting or patrol', () => {
    const { view, first } = roster();
    view.postings = []; view.patrols = [];
    view.routes = [{ armyId: first.id, origin: 495, waypoints: [497], path: [496], status: 'paused', pauseReason: 'Exact route reason.', knownHostileIds: [] }];
    expect(buildArmyOrderIndex(view).get(first.id)).toMatchObject({ standing: false, waiting: true, pausedPatrol: false });
  });

  it('excludes foreign and missing actors and mismatched order owners', () => {
    const { view, first } = roster();
    const foreign = { ...view.armies[0]!, id: 'foreign.army', factionId: 'foreign.realm' };
    view.armies.push(foreign);
    view.postings.push({ ...view.postings[0]!, armyId: foreign.id }, { ...view.postings[0]!, armyId: 'missing' });
    view.patrols!.push({ ...view.patrols![0]!, armyId: first.id, factionId: foreign.factionId });
    view.routes.push({ armyId: foreign.id, origin: 495, waypoints: [497], path: [496], status: 'paused', pauseReason: 'Foreign reason.', knownHostileIds: [] });
    const index = buildArmyOrderIndex(view);
    expect(index.size).toBe(101); expect(index.has(foreign.id)).toBe(false);
    expect(index.get(first.id)!.patrol).toBeNull();
  });

  it('supports historical patrol absence and counts a supplied search cohort once', () => {
    const { view, first, last } = roster(), index = buildArmyOrderIndex(view);
    expect(armyOrderCounts([first.id, last.id, last.id, 'missing'], index)).toEqual({ all: 2, standing: 2, waiting: 1, 'paused-patrols': 1 });
    expect(armyOrderCounts([], index)).toEqual({ all: 0, standing: 0, waiting: 0, 'paused-patrols': 0 });
    expect(buildArmyOrderIndex({ ...view, patrols: undefined }).get(last.id)!.patrol).toBeNull();
  });
});
