import { describe, expect, it } from 'vitest';
import { applyCommand, createGame, getObservation, stateHash, type ArmyView, type Observation } from '@theandril/sim';
import { conquestCampaign } from '../../../packages/test-fixtures/src/conquest-fixture';
import { growingHouseholdCampaign } from '../../../tests/gameplay/household-fixture';
import { actionCandidates, actionGroups, actionShortcut, loadShortcuts, nextAction, saveShortcuts, shortcutError, type ActionCandidate } from './next-action';

const game = createGame({ seed: 20260905, size: 'tiny', factionCount: 2 });
const initial = getObservation(game, game.turnOwnerId);
function army(id: string, override: Partial<ArmyView> = {}): ArmyView { return { ...initial.armies[0]!, id, factionId: initial.factionId, name: id, movement: 3, ...override }; }
const route = (armyId: string, status: 'active' | 'paused'): Observation['routes'][number] => ({ armyId, origin: 10, path: [11], waypoints: [11], status, pauseReason: status === 'paused' ? 'A foreign force blocks the next step.' : null, knownHostileIds: [] });
const bindings = { army: 'n', settlement: 's', turn: 'e' };
const keyEvent = { key: 'n', shiftKey: false, ctrlKey: false, altKey: false, metaKey: false, repeat: false, isComposing: false, defaultPrevented: false };

describe('observed-only next-action navigation', () => {
  it('reports newly unassigned households after real growth even while the town has a full production queue', () => {
    const game = growingHouseholdCampaign(), factionId = game.turnOwnerId;
    const before = getObservation(game, factionId, { landDetails: 'none' });
    expect(before.land.settlements[0]!.workerCapacity).toBe(before.land.settlements[0]!.worked.length);
    expect(applyCommand(game, { type: 'endTurn', factionId }).ok).toBe(true);
    const view = getObservation(game, factionId, { landDetails: 'none' });
    const town = view.settlements.find(town => town.factionId === factionId)!;
    expect(town.queue.length).toBeGreaterThan(0);
    expect(view.land.settlements[0]!.cells).toEqual([]);
    expect(view.land.settlements[0]!.workerCapacity - view.land.settlements[0]!.worked.length).toBe(1);
    const hash = stateHash(game), observation = JSON.stringify(view);
    const attention = actionCandidates(view);
    expect(attention.settlements).toEqual([]);
    expect(attention.households).toEqual([{ id: town.id, name: town.name, cell: town.cell, unassignedHouseholds: 1, cause: 'households',
      reason: '1 unassigned household. Review land to assign worked tiles; unassigned households add no tile yields.' }]);
    expect(JSON.stringify(view)).toBe(observation); expect(stateHash(game)).toBe(hash);
  });

  it('uses observed capacity rather than population, excludes missing/foreign/full summaries and orders labor by stable ID', () => {
    const game = growingHouseholdCampaign(), view = getObservation(game, game.turnOwnerId, { landDetails: 'none' });
    const town = view.settlements[0]!, land = view.land.settlements[0]!;
    view.settlements = [
      { ...town, id: 'town.3', population: 99 }, { ...town, id: 'town.1', population: 99 },
      { ...town, id: 'town.2' }, { ...town, id: 'town.foreign', factionId: 'foreign' }, { ...town, id: 'town.missing' },
    ];
    view.land.settlements = [
      { ...land, settlementId: 'town.3', workerCapacity: 3 }, { ...land, settlementId: 'town.1', workerCapacity: 2 },
      { ...land, settlementId: 'town.2' }, { ...land, settlementId: 'town.foreign', workerCapacity: 99 },
      { ...land, settlementId: 'town.unknown', workerCapacity: 99 },
    ];
    const before = JSON.stringify(view), households = actionCandidates(view).households;
    expect(households.map(({ id, unassignedHouseholds }) => ({ id, unassignedHouseholds }))).toEqual([
      { id: 'town.1', unassignedHouseholds: 1 }, { id: 'town.3', unassignedHouseholds: 2 },
    ]);
    expect(nextAction(households, 'town.3')?.id).toBe('town.1');
    expect(nextAction(households, 'town.1', -1)?.id).toBe('town.3');
    expect(households[1]!.reason).toContain('2 unassigned households.');
    expect(JSON.stringify(view)).toBe(before);
  });

  it('includes land/fleets and zero-movement paused routes but skips foreign, dead, embarked, busy and automatic forces', () => {
    const view = {
      ...initial,
      armies: [army('army.2'), army('army.10', { domain: 'naval' }), army('army.3', { movement: 0 }), army('army.4', { movement: 0 }),
        army('army.5'), army('army.6', { carrierId: 'fleet.1' }), army('army.7', { strength: 0 }), army('army.8', { formations: [] }),
        army('army.9', { factionId: 'foreign' }), army('army.11', { movementBlocker: 'Stationary mission' }),
        army('army.12', { agents: [{ id: 'agent.1', name: 'Witness', definitionId: 'character.surveyor', role: 'surveyor', status: 'mission', rank: 1, experience: 0, skillId: null, learnedSkillIds: [], woundedTurns: 0 }] })],
      routes: [route('army.4', 'paused'), route('army.5', 'active')],
    };
    const before = JSON.stringify(view), hash = stateHash(game);
    const candidates = actionCandidates(view);
    expect(candidates.armies.map(item => item.id)).toEqual(['army.10', 'army.2', 'army.4']);
    expect(candidates.armies[2]!.reason).toContain('foreign force');
    expect(JSON.stringify(view)).toBe(before); expect(stateHash(game)).toBe(hash);
  });

  it('requires an owned empty queue and a real available production option, not invented funding or siege rules', () => {
    const town = (id: string, factionId = initial.factionId, queued = false) => ({ id, factionId, founderFactionId: factionId, name: id, cell: 5, population: 1, food: 0, devastation: 0, occupationTurns: 0, buildings: [], queue: queued ? [{ itemId: 'unit.guard', progress: 0 }] : [] });
    const view = { ...initial, settlements: [town('town.3'), town('town.1'), town('town.2', initial.factionId, true), town('town.4', 'foreign'), town('town.5')],
      productionOptions: ['town.1', 'town.2', 'town.3', 'town.4'].map(settlementId => ({ settlementId, itemId: 'unit.guard', kind: 'land' as const, canQueue: settlementId !== 'town.3', blocker: settlementId === 'town.3' ? 'No coin' : null })) };
    expect(actionCandidates(view).settlements.map(item => item.id)).toEqual(['town.1']);
  });

  it('skips standing siege duty even when movement refreshes or an old route remains paused', () => {
    const view = { ...initial, armies: [army('army.1'), army('army.2')], routes: [route('army.2', 'paused')], sieges: [
      { settlementId: 'town.1', armyId: 'army.1', factionId: initial.factionId, startedTurn: 1, defenses: 10, supplies: 5, militiaStrength: 20, militiaMorale: 50, militiaFatigue: 0, canAssault: false, assaultBlocker: 'Wait one turn', defenderStrength: 20 },
      { settlementId: 'town.2', armyId: 'army.2', factionId: initial.factionId, startedTurn: 1, defenses: 0, supplies: 0, militiaStrength: 20, militiaMorale: 50, militiaFatigue: 0, canAssault: true, assaultBlocker: null, defenderStrength: 20 },
    ] };
    expect(actionCandidates(view).armies).toEqual([]);
  });
  it('does not call a real investing army idle after the next turn refreshes its movement', () => {
    const state = conquestCampaign(), factionId = state.turnOwnerId;
    expect(applyCommand(state, { type: 'declareWar', factionId, targetFactionId: 'faction.reedbound_council' }).ok).toBe(true);
    expect(applyCommand(state, { type: 'besiege', factionId, armyId: 'army.2', settlementId: 'settlement.6' }).ok).toBe(true);
    expect(applyCommand(state, { type: 'endTurn', factionId }).ok).toBe(true);
    const view = getObservation(state, factionId);
    expect(view.armies.find(item => item.id === 'army.2')!.movement).toBeGreaterThan(0);
    expect(view.sieges.some(siege => siege.armyId === 'army.2')).toBe(true);
    expect(actionCandidates(view).armies.some(item => item.id === 'army.2')).toBe(false);
  });

  it('groups what wants a decision by cause, largest first', () => {
    const candidate = (id: string, cause: ActionCandidate['cause']): ActionCandidate => ({ id, name: id, cell: 1, reason: '', cause });
    expect(actionGroups({
      armies: [candidate('army.1', 'movement'), candidate('army.2', 'movement'), candidate('army.3', 'route-interrupted')],
      settlements: [candidate('settlement.1', 'charter-stalled')],
      households: [{ ...candidate('settlement.2', 'households'), unassignedHouseholds: 3 }],
    })).toEqual([
      { kind: 'army', cause: 'movement', count: 2, label: '2 companies with movement remaining' },
      { kind: 'army', cause: 'route-interrupted', count: 1, label: '1 company with an interrupted route' },
      { kind: 'settlement', cause: 'charter-stalled', count: 1, label: '1 hearth with a stalled charter' },
      { kind: 'household', cause: 'households', count: 1, label: '1 hearth with unassigned households' },
    ]);
    expect(actionGroups({ armies: [], settlements: [], households: [] })).toEqual([]);
  });

  it('wraps stable IDs forward/backward, including from a removed or now-ineligible selection', () => {
    const candidates: ActionCandidate[] = ['army.1', 'army.10', 'army.3'].map(id => ({ id, name: id, cell: 1, reason: '', cause: 'movement' as const }));
    expect(nextAction(candidates, undefined)?.id).toBe('army.1');
    expect(nextAction(candidates, undefined, -1)?.id).toBe('army.3');
    expect(nextAction(candidates, 'army.3')?.id).toBe('army.1');
    expect(nextAction(candidates, 'army.1', -1)?.id).toBe('army.3');
    expect(nextAction(candidates, 'army.2')?.id).toBe('army.3');
    expect(nextAction(candidates, 'army.2', -1)?.id).toBe('army.10');
    expect(nextAction(candidates.slice(0, 1), 'army.1')?.id).toBe('army.1');
    expect(nextAction([], 'army.1')).toBeUndefined();
  });

  it('uses remapped shortcuts, Shift for previous, and suppresses input/lock/modifier/repeat/composition events', () => {
    expect(actionShortcut(keyEvent, bindings, false)).toEqual({ kind: 'army', direction: 1 });
    expect(actionShortcut({ ...keyEvent, key: 'S', shiftKey: true }, bindings, false)).toEqual({ kind: 'settlement', direction: -1 });
    expect(actionShortcut({ ...keyEvent, key: 'g' }, { ...bindings, army: 'g' }, false)?.kind).toBe('army');
    expect(actionShortcut(keyEvent, bindings, true)).toBeUndefined();
    for (const property of ['ctrlKey', 'altKey', 'metaKey', 'repeat', 'isComposing', 'defaultPrevented'] as const) expect(actionShortcut({ ...keyEvent, [property]: true }, bindings, false)).toBeUndefined();
    expect(actionShortcut({ ...keyEvent, key: 'e' }, bindings, false)).toBeUndefined();
  });

  it('keeps bindings distinct from each other and the existing end-turn shortcut', () => {
    expect(shortcutError(bindings, 'army', 'e')).toContain('already assigned');
    expect(shortcutError(bindings, 'turn', 's')).toContain('already assigned');
    expect(shortcutError(bindings, 'settlement', 'G')).toBeNull();
    expect(shortcutError(bindings, 'army', 'n')).toBeNull();
    for (const value of ['', ' ', 'Enter', '→', '1', '!']) expect(shortcutError(bindings, 'army', value)).toContain('one letter from A to Z');
  });

  it('persists valid remapping separately from campaigns and reports corrupt/unavailable local storage', () => {
    const changed = { army: 'g', settlement: 'h', turn: 't' };
    let saved = '';
    expect(saveShortcuts(changed, text => { saved = text; })).toBe('');
    expect(loadShortcuts(() => saved)).toEqual({ bindings: changed, error: '' });
    expect(loadShortcuts(() => null)).toEqual({ bindings, error: '' });
    for (const text of ['null', '{broken', '{"army":"n","settlement":"n","turn":"e"}', '{"army":"ENTER","settlement":"s","turn":"e"}']) {
      const fallback = loadShortcuts(() => text); expect(fallback.bindings).toEqual(bindings); expect(fallback.error).toContain('could not be read');
    }
    expect(loadShortcuts(() => { throw new Error('Blocked storage'); }).error).toContain('could not be read');
    expect(saveShortcuts(changed, () => { throw new Error('Quota'); })).toContain('this session');
  });
});
