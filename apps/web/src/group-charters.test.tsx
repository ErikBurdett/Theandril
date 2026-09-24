import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { applyCommand, CHARTER_CEILING_MAX, CHARTER_CEILING_MIN, CHARTER_RESERVE, getObservation, stateHash } from '@theandril/sim';
import { characterCampaign } from '../../../packages/test-fixtures/src/character-fixture';
import { MAX_GROUP_ORDER_COMMANDS } from './protocol';
import { groupCharterCommands, groupCharterTowns, GroupCharterOrders } from './group-charters';

describe('group hearth charters', () => {
  it('snapshots current owned hearths in stable order and bounds each group without changing the observation', () => {
    const game = characterCampaign(), view = getObservation(game, game.turnOwnerId);
    const home = view.settlements.find(town => town.factionId === view.factionId)!;
    view.settlements = Array.from({ length: 140 }, (_, index) => ({ ...home, id: `hearth.${String(index).padStart(3, '0')}` })).reverse();
    view.settlements.push({ ...home, id: 'foreign-town', factionId: 'another-realm' });
    const selected = new Set([...view.settlements.map(town => town.id), 'lost-town']);
    const before = JSON.stringify(view), hash = stateHash(game);
    const commands = groupCharterCommands(view, selected, 'learning', 24);
    expect(groupCharterTowns(view, selected)).toHaveLength(140);
    expect(commands).toHaveLength(MAX_GROUP_ORDER_COMMANDS);
    expect(commands.map(command => command.settlementId)).toEqual(Array.from({ length: MAX_GROUP_ORDER_COMMANDS }, (_, index) => `hearth.${String(index).padStart(3, '0')}`));
    expect(commands.every(command => command.factionId === view.factionId && command.focus === 'learning' && command.ceiling === 24)).toBe(true);
    expect(JSON.stringify(view)).toBe(before); expect(stateHash(game)).toBe(hash);
  });

  it('grants and revokes through ordinary commands while preserving paid manual production and treasury', () => {
    const game = characterCampaign(), first = getObservation(game, game.turnOwnerId);
    const town = first.settlements.find(item => item.factionId === first.factionId)!;
    const choice = first.productionOptions.find(option => option.settlementId === town.id && !option.blocker)!;
    expect(applyCommand(game, { type: 'queue', factionId: first.factionId, settlementId: town.id, itemId: choice.itemId }).ok).toBe(true);
    const view = getObservation(game, game.turnOwnerId), selected = new Set([town.id]);
    const queued = structuredClone(game.settlements[town.id]!.queue), treasury = view.treasury;
    const commands = groupCharterCommands(view, selected, 'wealth', 24);
    expect(commands).toHaveLength(1);
    expect(applyCommand(game, commands[0]!).ok).toBe(true);
    expect(game.settlements[town.id]!.queue).toEqual(queued);
    expect(getObservation(game, game.turnOwnerId).treasury).toBe(treasury);
    const updated = getObservation(game, game.turnOwnerId);
    const revoke = groupCharterCommands(updated, selected, 'none', Number.NaN);
    expect(revoke).toEqual([{ type: 'setCharter', factionId: view.factionId, settlementId: town.id, focus: 'none', ceiling: 24 }]);
    expect(applyCommand(game, revoke[0]!).ok).toBe(true);
    expect(game.settlements[town.id]!.queue).toEqual(queued);
    const revoked = getObservation(game, game.turnOwnerId);
    expect(revoked.treasury).toBe(treasury);
    expect(groupCharterCommands(revoked, selected, 'none', 24)).toEqual([]);
  });

  it('allows a charter at the shared reserve and leaves future affordability to the canonical rules', () => {
    const game = characterCampaign();
    game.factions.find(faction => faction.id === game.turnOwnerId)!.treasury = CHARTER_RESERVE;
    const view = getObservation(game, game.turnOwnerId), town = groupCharterTowns(view)[0]!;
    const [command] = groupCharterCommands(view, new Set([town.id]), 'works', CHARTER_CEILING_MAX);
    expect(applyCommand(game, command!).ok).toBe(true);
    const updated = getObservation(game, game.turnOwnerId);
    expect(updated.treasury).toBe(CHARTER_RESERVE);
    expect(updated.charters.find(charter => charter.settlementId === town.id)?.blocker).toContain('reserve');
  });

  it('shows the per-hearth spending consequences, preserves queue precedence and labels locked form controls', () => {
    const game = characterCampaign(), view = getObservation(game, game.turnOwnerId), town = groupCharterTowns(view)[0]!;
    town.queue = [{ itemId: 'unit.guard', progress: 0 }];
    const html = renderToStaticMarkup(<GroupCharterOrders view={view} selected={new Set([town.id])} matching={new Set()} busy issue={async () => { throw new Error('Rendering cannot issue orders.'); }} selectMatching={() => {}} clearSelection={() => {}} accepted={() => {}}/>);
    expect(html).toContain('1 hearth selected · 1 outside this filter');
    expect(html).toContain('Applying charters spends no coin now.');
    expect(html).toContain(`leave ${CHARTER_RESERVE} coin in reserve`);
    expect(html).toContain('Muster raises land companies that add upkeep');
    expect(html).toContain('Revoking a charter stops future orders and keeps its current queue');
    expect(html).toContain('1 selected hearth already has production queued; those orders come first.');
    expect(html).toContain('Charter focus<select');
    expect(html).toContain(`min="${CHARTER_CEILING_MIN}" max="${CHARTER_CEILING_MAX}" step="1"`);
    expect(html).toContain('Coin ceiling per hearth<input');
    expect(html).toContain('<button class="primary" disabled="">Apply charters (1)</button>');
  });
});
