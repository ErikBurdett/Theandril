import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { IMPROVEMENTS } from '@theandril/content';
import { applyCommand, createGame, getObservation, serializeGame, type Observation } from '@theandril/sim';
import { LandPolicy, landCommissionAmount } from './land-policy';
import { SettlementLand } from './land';

function scene() {
  const game = createGame({ seed: 17, size: 'tiny', pace: 'short', factionCount: 2 });
  expect(applyCommand(game, { type: 'found', factionId: game.turnOwnerId, armyId: 'army.1', name: 'Commissioned hearth' }).ok).toBe(true);
  const view = getObservation(game, game.turnOwnerId), town = view.land.settlements[0]!;
  return { game, view, town, settlementId: town.settlementId };
}

describe('land commission review', () => {
  it('explains immediate spending, a replacement allowance and manual takeover without placing an order on render', () => {
    const { game, view, town, settlementId } = scene(), issue = vi.fn(), before = serializeGame(game);
    const html = renderToStaticMarkup(<LandPolicy view={view} town={town} settlementId={settlementId} busy={false} ready issue={issue}/>);
    expect(html).toContain('Direct construction');
    for (const improvement of IMPROVEMENTS) expect(html).toContain(`>${improvement.name}</option>`);
    expect(html).toContain('pay for its first order immediately');
    expect(html).toContain('replaces the remaining allowance');
    expect(html).toContain('it is not taken from the treasury in advance');
    expect(html).toContain('Other realm orders can still spend that reserve');
    expect(html).toContain('matching extraction site');
    expect(html).toContain('Ending a commission keeps paid work underway');
    expect(html).not.toContain('End land commission</button>');
    expect(html).not.toContain('Next order:');
    expect(issue).not.toHaveBeenCalled(); expect(serializeGame(game)).toBe(before);
  });

  it('shows only the selected authoritative next quote and escapes waiting reasons', () => {
    const { view, town, settlementId } = scene();
    view.landPolicies = [{ settlementId, factionId: view.factionId, improvementId: IMPROVEMENTS[0]!.id, allowance: 87, reserve: 61, blocker: null }];
    town.landPolicyChoice = { cell: 900, coinCost: 49, turns: 3, blocker: null };
    const props = { view, town, settlementId, busy: false, ready: true, issue: vi.fn() };
    const html = renderToStaticMarkup(<LandPolicy {...props}/>);
    expect(html).toContain('87 coin remaining · 61 coin treasury reserve');
    expect(html).toContain('Next order: hex 900 · 49 coin upfront · 3 turns');
    expect(html).toContain('<button type="button" class="wide">End land commission</button>');
    town.landPolicyChoice = { cell: null, coinCost: null, turns: null, blocker: 'Protected reserve <61> prevents this order.' };
    const waiting = renderToStaticMarkup(<LandPolicy {...props}/>);
    expect(waiting).toContain('Protected reserve &lt;61&gt; prevents this order.');
    expect(waiting).not.toContain('Next order:');
  });

  it('hides stale next quotes and locks inputs and both commands during review or command execution', () => {
    const { view, town, settlementId } = scene();
    view.landPolicies = [{ settlementId, factionId: view.factionId, improvementId: IMPROVEMENTS[0]!.id, allowance: 87, reserve: 61, blocker: null }];
    town.landPolicyChoice = { cell: 900, coinCost: 49, turns: 3, blocker: null };
    for (const state of [{ busy: false, ready: false }, { busy: true, ready: true }]) {
      const html = renderToStaticMarkup(<LandPolicy view={view} town={town} settlementId={settlementId} {...state} issue={vi.fn()}/>);
      expect(html).toContain('<select disabled="">');
      expect(html).toContain('<button type="button" class="primary wide" disabled="">Apply land commission</button>');
      expect(html).toContain('<button type="button" class="wide" disabled="">End land commission</button>');
      if (!state.ready) { expect(html).toContain('Loading the current land commission review'); expect(html).not.toContain('Next order:'); }
    }
  });

  it('does not present the capability for historical, foreign or missing hearths', () => {
    const { view, town, settlementId } = scene();
    for (const altered of [{ ...view, landPolicies: undefined }, { ...view, settlements: view.settlements.map(item => ({ ...item, factionId: 'foreign' })) }] satisfies Observation[]) {
      expect(renderToStaticMarkup(<LandPolicy view={altered} town={town} settlementId={settlementId} busy={false} ready issue={vi.fn()}/>)).toBe('');
    }
    expect(renderToStaticMarkup(<LandPolicy view={view} town={town} settlementId="missing" busy={false} ready issue={vi.fn()}/>)).toBe('');
  });

  it('places controls outside the compact overview and warns at manual construction and cancellation', () => {
    const { view, town, settlementId } = scene(), cell = town.cells.find(item => item.claimed && item.cell !== view.settlements[0]!.cell)!;
    view.landPolicies = [{ settlementId, factionId: view.factionId, improvementId: IMPROVEMENTS[0]!.id, allowance: 87, reserve: 61, blocker: null }];
    town.work = { kind: 'improve', cell: cell.cell, improvementId: IMPROVEMENTS[0]!.id, coinCost: 20, turns: 2, remainingTurns: 2, startedTurn: 1 };
    const html = renderToStaticMarkup(<SettlementLand view={view} settlementId={settlementId} selectedCell={cell.cell} busy={false} compact queryEnabled={false} selectCell={vi.fn()} issue={vi.fn()}/>);
    expect(html.indexOf('data-testid="land-policy"')).toBeLessThan(html.indexOf('data-testid="land-town-overview"'));
    expect(html).toContain('data-testid="land-policy-manual-warning"');
    expect(html).toContain('data-testid="land-policy-cancel-warning"');
    expect(html).toContain('<button type="button" class="primary wide" disabled="">Apply land commission</button>');
  });

  it('accepts exact safe whole coin amounts and rejects values that could accidentally reset or round the budget', () => {
    expect(landCommissionAmount('0')).toBe(0);
    expect(landCommissionAmount('0040')).toBe(40);
    expect(landCommissionAmount(String(Number.MAX_SAFE_INTEGER))).toBe(Number.MAX_SAFE_INTEGER);
    for (const value of ['', ' ', '-1', '3.2', '1e3', 'Infinity', 'NaN', '9007199254740992']) expect(landCommissionAmount(value)).toBeNull();
  });
});
