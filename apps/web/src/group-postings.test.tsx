import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { applyCommand, getObservation, stateHash } from '@theandril/sim';
import { characterCampaign } from '../../../packages/test-fixtures/src/character-fixture';
import { addGroupSelection, groupPostingArmies, groupPostingCommands, GroupPostingOrders, GROUP_POSTING_LIMIT } from './group-postings';

describe('group army postings', () => {
  it('retains cross-page selections, deduplicates matches and caps an explicit group', () => {
    const initial = new Set(['army.last-page']);
    const candidates = Array.from({ length: 200 }, (_, index) => `army.${String(index).padStart(3, '0')}`);
    const selected = addGroupSelection(initial, [...candidates].reverse());
    expect(selected.size).toBe(GROUP_POSTING_LIMIT);
    expect(selected.has('army.last-page')).toBe(true);
    expect(selected.has('army.000')).toBe(true);
    expect(initial).toEqual(new Set(['army.last-page']));
    expect(addGroupSelection(selected, candidates)).toEqual(selected);
  });

  it('snapshots only current owned land armies ashore, in stable ID order, without mutating the view', () => {
    const game = characterCampaign(100), view = getObservation(game, game.turnOwnerId);
    const source = view.armies.find(army => army.factionId === view.factionId)!;
    view.armies.push({ ...source, id: 'foreign', factionId: 'other' }, { ...source, id: 'hull', domain: 'naval' }, { ...source, id: 'passenger', carrierId: 'hull' });
    const before = JSON.stringify(view);
    const selected = new Set([...view.armies].reverse().map(army => army.id)); selected.add('lost-army');
    const commands = groupPostingCommands(view, selected, 'current', 'hold');
    expect(commands).toHaveLength(100);
    expect(commands.map(command => command.armyId)).toEqual(commands.map(command => command.armyId).sort());
    expect(commands.every(command => command.cell === view.armies.find(army => army.id === command.armyId)!.cell)).toBe(true);
    expect(commands.some(command => ['foreign', 'hull', 'passenger', 'lost-army'].includes(command.armyId))).toBe(false);
    expect(JSON.stringify(view)).toBe(before);
  });

  it('lets canonical rules decide destination legality and clears only observed postings', () => {
    const game = characterCampaign(), view = getObservation(game, game.turnOwnerId);
    const armies = groupPostingArmies(view), selected = new Set(armies.map(army => army.id));
    const unknown = Array.from({ length: game.world.terrain.length }, (_, cell) => cell).find(cell => !game.explored[view.factionId]!.has(cell))!;
    const command = groupPostingCommands(view, selected, unknown, 'join')[0]!;
    const before = stateHash(game);
    expect(applyCommand(game, command)).toMatchObject({ ok: false, error: 'You have not explored that hex.' });
    expect(stateHash(game)).toBe(before);
    expect(groupPostingCommands(view, selected, 'current', 'none')).toEqual([]);
    const army = armies[0]!;
    expect(applyCommand(game, { type: 'setPosting', factionId: view.factionId, armyId: army.id, cell: army.cell, mode: 'hold' }).ok).toBe(true);
    const updated = getObservation(game, game.turnOwnerId);
    expect(groupPostingCommands(updated, selected, 'current', 'none')).toEqual([{ type: 'setPosting', factionId: view.factionId, armyId: army.id, cell: army.cell, mode: 'none' }]);
  });

  it('states hidden selections and order precedence with locked accessible controls while working', () => {
    const game = characterCampaign(), view = getObservation(game, game.turnOwnerId);
    const armies = groupPostingArmies(view), selected = new Set(armies.map(army => army.id));
    const html = renderToStaticMarkup(<GroupPostingOrders view={view} selected={selected} matching={new Set([armies[0]!.id])} busy issue={async () => { throw new Error('Rendering must not issue orders.'); }} selectMatching={() => {}} clearSelection={() => {}} accepted={() => {}}/>);
    expect(html).toContain(`${armies.length} armies selected`);
    if (armies.length > 1) expect(html).toContain(`${armies.length - 1} outside this filter`);
    expect(html).toContain('Existing travel orders come first.');
    expect(html).toContain('Group destination<select');
    expect(html).toContain('Group arrival order<select');
    expect(html).toContain('<button class="primary" disabled="">Post selected armies');
    expect(html).toContain(`Select up to ${GROUP_POSTING_LIMIT} at a time`);
  });
});
