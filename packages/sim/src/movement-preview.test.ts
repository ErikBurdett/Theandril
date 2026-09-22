import { describe, expect, it } from 'vitest';
import { applyCommand, getObservation, getMovementPreview, getMovementQuery, MAX_PATH_NODES } from './index';
import { navalCampaign, NAVAL_FIXTURE } from '../../test-fixtures/src/naval-fixture';
import { previewCorpus } from '../../../docs/development/2026-09-21-campaign-continuation/movement-preview/corpus';
import baseline from '../../../docs/development/2026-09-21-campaign-continuation/movement-preview/baseline.json';

describe('target-only movement publication preserves the complete public preview', () => {
  const cases = previewCorpus();
  it.each(cases)('$name matches the captured original preview and current full query', item => {
    const original = structuredClone(item.view), expected = baseline.entries.find(entry => entry.name === item.name)!.preview;
    const actual = getMovementPreview(item.view, item.armyId, item.target, { append: item.append });
    expect(actual).toStrictEqual(expected);
    expect(JSON.stringify(actual)).toBe(JSON.stringify(expected));
    expect(actual).toEqual(getMovementQuery(item.view, item.armyId, item.target, { append: item.append }).preview);
    expect(getMovementPreview(structuredClone(item.view), item.armyId, item.target, { append: item.append })).toEqual(expected);
    expect(item.view).toEqual(original);
  });

  it('retains the shared range budget even when a nearby destination would be trivial alone', () => {
    const item = cases.find(item => item.name === 'range-200-shared-budget')!;
    const query = getMovementQuery(item.view, item.armyId, item.target);
    expect(query.expandedNodes).toBe(MAX_PATH_NODES);
    expect(query.preview).toMatchObject({ canQueue: false, limited: true, expandedNodes: 0, path: [] });
    expect(getMovementPreview(item.view, item.armyId, item.target)).toEqual(query.preview);
  });

  it.each(['missing', 'besieging'] as const)('preserves the %s army blocker without spending range or preview nodes', kind => {
    const item = cases[0]!, view = structuredClone(item.view);
    if (kind === 'missing') view.armies = [];
    else view.sieges = [{ settlementId: 'settlement.enemy', armyId: item.armyId, factionId: view.factionId,
      startedTurn: 1, defenses: 10, supplies: 10, militiaStrength: 10, militiaMorale: 10, militiaFatigue: 0,
      canAssault: false, assaultBlocker: 'Prepare the assault.', defenderStrength: 10 }];
    const full = getMovementQuery(view, item.armyId, item.target);
    expect(full).toMatchObject({ reachable: [], expandedNodes: 0, preview: { action: 'blocked', expandedNodes: 0, canMoveNow: false, canQueue: false } });
    expect(getMovementPreview(view, item.armyId, item.target)).toStrictEqual(full.preview);
  });

  it('preserves the canonical embarked-passenger blocker after an accepted boarding command', () => {
    const state = navalCampaign({ enemyFleet: false });
    expect(applyCommand(state, { type: 'embarkArmy', factionId: state.turnOwnerId, armyId: NAVAL_FIXTURE.cargoId, fleetId: NAVAL_FIXTURE.fleetId }).ok).toBe(true);
    const view = getObservation(state, state.turnOwnerId), target = NAVAL_FIXTURE.homeCell;
    const full = getMovementQuery(view, NAVAL_FIXTURE.cargoId, target);
    expect(full).toMatchObject({ reachable: [], expandedNodes: 0, preview: { action: 'blocked', expandedNodes: 0, canMoveNow: false, canQueue: false } });
    expect(full.preview?.blocker).toContain('aboard a transport');
    expect(getMovementPreview(view, NAVAL_FIXTURE.cargoId, target)).toStrictEqual(full.preview);
  });

  it('does not cache caller-owned paths, movement, naval capability, war or current mission blockers', () => {
    const item = cases.find(item => item.name === 'ocean-route')!, view = structuredClone(item.view);
    const original = getMovementPreview(view, item.armyId, item.target);
    original.path.length = 0; original.cost = -1;
    expect(getMovementPreview(view, item.armyId, item.target)).toEqual(getMovementQuery(view, item.armyId, item.target).preview);
    for (const movement of [0, 2, 9]) {
      view.armies[0]!.movement = movement;
      expect(getMovementPreview(view, item.armyId, item.target)).toEqual(getMovementQuery(structuredClone(view), item.armyId, item.target).preview);
    }
    view.armies[0]!.canEnterDeepWater = false;
    expect(getMovementPreview(view, item.armyId, item.target)).toEqual(getMovementQuery(structuredClone(view), item.armyId, item.target).preview);
    view.armies[0]!.movementBlocker = 'Cancel the active character mission.';
    expect(getMovementPreview(view, item.armyId, item.target)).toMatchObject({ expandedNodes: 0, blocker: 'Cancel the active character mission.' });
    const enemy = cases.find(item => item.name === 'hostile-attack')!, peaceful = structuredClone(enemy.view);
    getMovementPreview(peaceful, enemy.armyId, enemy.target);
    peaceful.wars = [];
    expect(getMovementPreview(peaceful, enemy.armyId, enemy.target)).toEqual(getMovementQuery(structuredClone(peaceful), enemy.armyId, enemy.target).preview);
  });
});
