import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { applyCommand, createGame, getObservation, serializeGame, type Observation } from '@theandril/sim';
import { WorkerPolicy } from './worker-policy';
import { SettlementLand } from './land';

function scene() {
  const game = createGame({ seed: 17, size: 'tiny', pace: 'short', factionCount: 2 });
  expect(applyCommand(game, { type: 'found', factionId: game.turnOwnerId, armyId: 'army.1', name: 'Worker hearth' }).ok).toBe(true);
  const view = getObservation(game, game.turnOwnerId), settlementId = view.land.settlements[0]!.settlementId;
  return { game, view, settlementId };
}

describe('standing worker policy controls', () => {
  it('offers an explicit priority and explains immediate assignment, manual takeover and extraction tradeoffs without issuing orders on render', () => {
    const { game, view, settlementId } = scene(), issue = vi.fn(), saved = serializeGame(game);
    const html = renderToStaticMarkup(<WorkerPolicy view={view} settlementId={settlementId} busy={false} issue={issue}/>);
    expect(html).toContain('Manual control');
    for (const focus of ['Balanced', 'Food', 'Industry', 'Coin', 'Knowledge']) expect(html).toContain(`>${focus}</option>`);
    expect(html).toContain('value="balanced" selected=""');
    expect(html).toContain('Apply worker policy');
    expect(html).not.toContain('Return to manual control</button>');
    expect(html).toContain('Worker policies cost no coin');
    expect(html).toContain('leave a resource deposit unworked');
    expect(html).toContain('Assigning or removing a worker yourself also ends the policy');
    expect(issue).not.toHaveBeenCalled(); expect(serializeGame(game)).toBe(saved);
  });

  it('renders actual ownership-bound waiting information and leaves revocation available while waiting', () => {
    const { view, settlementId } = scene();
    view.workerPolicies = [{ settlementId, factionId: view.factionId, focus: 'food', assigned: 0, capacity: 3, blocker: 'The hearth is under siege. <unsafe>' }];
    const html = renderToStaticMarkup(<WorkerPolicy view={view} settlementId={settlementId} busy={false} issue={vi.fn()}/>);
    expect(html).toContain('Food · 0 / 3 assigned · waiting');
    expect(html).toContain('The hearth is under siege. &lt;unsafe&gt;');
    expect(html).toContain('<button type="button" class="wide">Return to manual control</button>');
    expect(html).toContain('value="food" selected=""');
  });

  it('locks policy choices, apply and revoke during a command', () => {
    const { game, settlementId } = scene();
    expect(applyCommand(game, { type: 'setWorkerPolicy', factionId: game.turnOwnerId, settlementId, focus: 'industry' }).ok).toBe(true);
    const html = renderToStaticMarkup(<WorkerPolicy view={getObservation(game, game.turnOwnerId)} settlementId={settlementId} busy issue={vi.fn()}/>);
    expect(html).toContain('<select disabled="">');
    expect(html).toContain('<button type="button" class="primary wide" disabled="">Apply worker policy</button>');
    expect(html).toContain('<button type="button" class="wide" disabled="">Return to manual control</button>');
  });

  it('hides controls when historical observations lack capability or the hearth is not owned', () => {
    const { view, settlementId } = scene();
    for (const altered of [{ ...view, workerPolicies: undefined }, { ...view, settlements: view.settlements.map(town => ({ ...town, factionId: 'foreign' })) }] satisfies Observation[]) {
      expect(renderToStaticMarkup(<WorkerPolicy view={altered} settlementId={settlementId} busy={false} issue={vi.fn()}/>)).toBe('');
    }
    expect(renderToStaticMarkup(<WorkerPolicy view={view} settlementId="missing" busy={false} issue={vi.fn()}/>)).toBe('');
  });

  it('keeps policies outside the collapsed compact overview, warns at manual controls and respects disabled land context', () => {
    const { game, settlementId } = scene();
    expect(applyCommand(game, { type: 'setWorkerPolicy', factionId: game.turnOwnerId, settlementId, focus: 'balanced' }).ok).toBe(true);
    const view = getObservation(game, game.turnOwnerId), cell = view.land.settlements[0]!.worked[0]!;
    expect(cell).toBeDefined();
    const html = renderToStaticMarkup(<SettlementLand view={view} settlementId={settlementId} selectedCell={cell} busy={false} compact queryEnabled={false} selectCell={vi.fn()} issue={vi.fn()}/>);
    expect(html.indexOf('data-testid="worker-policy"')).toBeLessThan(html.indexOf('data-testid="land-town-overview"'));
    expect(html).toContain('data-testid="worker-policy-manual-warning"');
    expect(html).toContain('ends its worker policy');
    expect(html).toContain('<button type="button" class="primary wide" disabled="">Apply worker policy</button>');
  });
});
