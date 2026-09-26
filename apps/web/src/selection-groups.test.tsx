import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { getObservation, stateHash, type SelectionGroup } from '@theandril/sim';
import { characterCampaign } from '../../../packages/test-fixtures/src/character-fixture';
import { recallSelectionGroup, selectionGroupMembers, SelectionGroups } from './selection-groups';

describe('saved selection group presentation', () => {
  it('recalls only currently selectable owned members and reports carried and unavailable members without changing the campaign', () => {
    const game = characterCampaign(4), view = getObservation(game, game.turnOwnerId), hash = stateHash(game);
    const armies = view.armies.filter(army => army.factionId === view.factionId);
    const [ashore, carried, naval, foreign] = armies;
    carried!.carrierId = 'transport'; naval!.domain = 'naval'; foreign!.factionId = 'another-realm';
    const group: SelectionGroup = { id: 'selection-group.1', factionId: view.factionId, kind: 'armies', name: 'Northern patrol', memberIds: [carried!.id, foreign!.id, 'missing-army', naval!.id, ashore!.id] };
    const before = JSON.stringify(view);
    const result = recallSelectionGroup(view, group);
    expect([...result.selected]).toEqual([ashore!.id]);
    expect(result.embarked).toBe(1); expect(result.unavailable).toBe(3);
    expect(JSON.stringify(view)).toBe(before); expect(stateHash(game)).toBe(hash);
    expect(recallSelectionGroup(view, { ...group, factionId: 'another-realm' }).selected.size).toBe(0);
  });

  it('recalls owned hearths and preserves an explicitly empty saved group', () => {
    const game = characterCampaign(), view = getObservation(game, game.turnOwnerId);
    const town = view.settlements.find(item => item.factionId === view.factionId)!;
    view.settlements.push({ ...town, id: 'foreign-town', factionId: 'another-realm' });
    const group: SelectionGroup = { id: 'selection-group.1', factionId: view.factionId, kind: 'settlements', name: 'Works', memberIds: ['foreign-town', 'lost-town', town.id] };
    const result = recallSelectionGroup(view, group);
    expect([...result.selected]).toEqual([town.id]);
    expect(result.embarked).toBe(0); expect(result.unavailable).toBe(2);
    expect(recallSelectionGroup(view, { ...group, memberIds: [] })).toEqual({ selected: new Set(), embarked: 0, unavailable: 0 });
  });

  it('snapshots sorted current checks for membership replacement without copying unavailable saved members', () => {
    const game = characterCampaign(4), view = getObservation(game, game.turnOwnerId);
    const own = view.armies.filter(army => army.factionId === view.factionId);
    own[0]!.carrierId = 'transport'; own[1]!.domain = 'naval';
    const checked = new Set([...own.map(army => army.id).reverse(), 'lost-army']);
    expect(selectionGroupMembers(view, 'armies', checked)).toEqual([own[2]!.id, own[3]!.id].sort());
    expect(checked.size).toBe(5);
    expect(selectionGroupMembers(view, 'settlements', checked)).toEqual([]);
  });

  it('labels the active kind, keeps empty groups available and hides foreign and other-kind names', () => {
    const game = characterCampaign(), view = getObservation(game, game.turnOwnerId);
    view.selectionGroups = [
      { id: 'selection-group.1', factionId: view.factionId, kind: 'armies', name: 'Empty army group', memberIds: [] },
      { id: 'selection-group.2', factionId: view.factionId, kind: 'settlements', name: 'Hearth-only name', memberIds: [] },
      { id: 'selection-group.3', factionId: 'another-realm', kind: 'armies', name: 'Foreign hidden group', memberIds: [] },
    ];
    const issue = vi.fn(), recall = vi.fn();
    const html = renderToStaticMarkup(<SelectionGroups view={view} kind="armies" checked={new Set()} busy issue={issue} recall={recall} onPendingChange={() => {}}/>);
    expect(html).toContain('<summary>Saved army groups</summary>');
    expect(html).toContain('Saved army group<select');
    expect(html).toContain('Empty army group');
    expect(html).not.toContain('Hearth-only name'); expect(html).not.toContain('Foreign hidden group');
    expect(html).toContain('2 of 24 saved groups across both tabs');
    expect(html).toContain('included in its saves and exports');
    expect(html).toContain('including skipped embarked armies');
    expect(html).toContain('<button disabled="">Recall group</button>');
    expect(html).toContain('<button disabled="">Save new group</button>');
    expect(html).toContain('<button disabled="">Update group</button>');
    expect(html).toContain('<button disabled="">Delete group</button>');
    expect(issue).not.toHaveBeenCalled(); expect(recall).not.toHaveBeenCalled();
  });
});
