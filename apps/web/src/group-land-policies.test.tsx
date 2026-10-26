import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { IMPROVEMENTS } from '@theandril/content';
import { getObservation, stateHash } from '@theandril/sim';
import { characterCampaign } from '../../../packages/test-fixtures/src/character-fixture';
import { GroupLandPolicyOrders, groupLandAllowanceTotal, groupLandPolicyCommands } from './group-land-policies';
import { RealmRegistry } from './realm-navigation';

const forbidden = (): never => { throw new Error('Rendering must not issue or acknowledge orders.'); };
function scene() {
  const game = characterCampaign(), view = getObservation(game, game.turnOwnerId);
  const town = view.settlements.find(item => item.factionId === view.factionId)!;
  return { game, view, town, selected: new Set([town.id]), improvementId: IMPROVEMENTS[0]!.id };
}

describe('group land commission controls', () => {
  it('maps only owned checked hearths in stable order, with no oversized prefix or observation mutation', () => {
    const { game, view, town, improvementId } = scene();
    view.settlements = Array.from({ length: 129 }, (_, index) => ({ ...town, id: `town.${String(index).padStart(3, '0')}` })).reverse();
    const selected = new Set(view.settlements.map(item => item.id));
    const before = structuredClone(view), hash = stateHash(game);
    expect(groupLandPolicyCommands(view, selected, improvementId, 100, 40)).toEqual([]);
    selected.delete('town.128'); selected.add('foreign'); selected.add('missing');
    view.settlements.push({ ...town, id: 'foreign', factionId: 'other' });
    const commands = groupLandPolicyCommands(view, selected, improvementId, 100, 40);
    expect(commands).toHaveLength(128);
    expect(commands.map(command => command.settlementId)).toEqual([...commands.map(command => command.settlementId)].sort());
    expect(commands.every(command => command.factionId === view.factionId && command.improvementId === improvementId && command.allowance === 100 && command.reserve === 40)).toBe(true);
    view.settlements.pop(); expect(view).toEqual(before); expect(stateHash(game)).toBe(hash);
  });

  it('does not manufacture purchase eligibility from incomplete or blocked summaries', () => {
    const { game, view, town, selected, improvementId } = scene();
    view.treasury = 0; view.land.settlements = [];
    view.landPolicies = [{ settlementId: town.id, factionId: view.factionId, improvementId, allowance: 0, reserve: 40, blocker: 'The hearth is under siege.' }];
    const before = structuredClone(view), hash = stateHash(game);
    expect(groupLandPolicyCommands(view, selected, improvementId, 25, 40)).toEqual([{ type: 'setLandPolicy', factionId: view.factionId, settlementId: town.id, improvementId, allowance: 25, reserve: 40 }]);
    expect(view).toEqual(before); expect(stateHash(game)).toBe(hash);
  });

  it('removes only selected owned commissions independently of invalid unsubmitted amounts', () => {
    const { view, town, selected, improvementId } = scene();
    expect(groupLandPolicyCommands(view, selected, 'none', NaN, Infinity)).toEqual([]);
    view.landPolicies = [
      { settlementId: town.id, factionId: view.factionId, improvementId, allowance: 11, reserve: 80, blocker: null },
      { settlementId: 'foreign', factionId: 'other', improvementId, allowance: 10, reserve: 0, blocker: null },
      { settlementId: 'unchecked', factionId: view.factionId, improvementId, allowance: 10, reserve: 0, blocker: null },
    ];
    selected.add('foreign'); selected.add('missing');
    expect(groupLandPolicyCommands(view, selected, 'none', NaN, Infinity)).toEqual([{ type: 'setLandPolicy', factionId: view.factionId, settlementId: town.id, improvementId: 'none', allowance: 0, reserve: 0 }]);
    expect(view.landPolicies![0]!.allowance).toBe(11);
  });

  it('rejects unusable form values and retains exact permission totals beyond safe aggregate integers', () => {
    const { view, selected, improvementId } = scene();
    for (const invalid of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
      expect(groupLandPolicyCommands(view, selected, improvementId, invalid, 0)).toEqual([]);
      expect(groupLandPolicyCommands(view, selected, improvementId, 0, invalid)).toEqual([]);
    }
    expect(groupLandPolicyCommands(view, selected, 'invented', 0, 0)).toEqual([]);
    expect(groupLandPolicyCommands(view, selected, improvementId, 0, 0)).toHaveLength(1);
    expect(groupLandAllowanceTotal(Number.MAX_SAFE_INTEGER, 128)).toBe('1152921504606846848');
    expect(groupLandAllowanceTotal(100, 128)).toBe('12800');
  });

  it('requires a reviewed hash, handles outside-filter selection and explains actual permission consequences', () => {
    const { view, selected } = scene();
    for (const hash of [undefined, '12345678']) {
      const html = renderToStaticMarkup(<GroupLandPolicyOrders view={view} hash={hash} selected={selected} matching={new Set()} busy={false} issue={async () => forbidden()} accepted={forbidden} onPendingChange={forbidden}/>);
      expect(html).toContain('1 hearth selected · 1 outside this filter');
      expect(html).toContain(`<button class="primary"${hash ? '' : ' disabled=""'}>Apply land commissions (1)</button>`);
      expect(html).toContain('100 coin per hearth × 1 = 100 coin total permission');
      expect(html).toContain('replaces each hearth’s remaining allowance');
      expect(html).toContain('not escrow or a payment quote');
      expect(html).toContain('immediately in stable hearth order');
      expect(html).toContain('reserve is not multiplied');
      expect(html).toContain('Other realm orders can still spend it');
      expect(html).toContain('not that work started');
      expect(html).toContain('Ending commissions keeps paid work underway');
      expect(html).toContain('cancelled work is not refunded');
    }
    const html = renderToStaticMarkup(<GroupLandPolicyOrders view={view} hash="12345678" selected={selected} matching={selected} busy issue={async () => forbidden()} accepted={forbidden} onPendingChange={forbidden}/>);
    expect(html).toContain('<button class="primary" disabled="">Apply land commissions');
    expect(html).toContain('<select disabled="">');
    delete view.landPolicies;
    expect(groupLandPolicyCommands(view, selected, IMPROVEMENTS[0]!.id, 100, 40)).toEqual([]);
    expect(renderToStaticMarkup(<GroupLandPolicyOrders view={view} hash="12345678" selected={selected} matching={selected} busy={false} issue={async () => forbidden()} accepted={forbidden} onPendingChange={forbidden}/>)).toBe('');
  });

  it('exposes supplied commission facts in the settlement registry without querying or issuing orders', () => {
    const { view, town, improvementId } = scene();
    view.landPolicies = [{ settlementId: town.id, factionId: view.factionId, improvementId, allowance: 17, reserve: 40, blocker: 'Waiting <unsafe>' }];
    const html = renderToStaticMarkup(<RealmRegistry view={view} hash="12345678" registry="settlements" search="" force="all" selection={{}} select={forbidden} onGroupLandPolicy={async () => forbidden()}/>);
    expect(html).toContain('data-testid="group-land-policies"');
    expect(html).toContain('for group orders');
    expect(html).toContain('Land commission:');
    expect(html).toContain('17 coin left · 40 reserve · Waiting &lt;unsafe&gt;');
    expect(html).not.toContain('Waiting <unsafe>');
  });
});
