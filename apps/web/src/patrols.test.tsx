import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { getObservation, type Observation } from '@theandril/sim';
import { theaterCampaign } from '../../../packages/test-fixtures/src/theater-fixture';
import { ArmyPatrol, patrolEndpoint } from './patrols';

function scene() {
  const game = theaterCampaign(1), view = getObservation(game, game.turnOwnerId);
  const army = view.armies.find(army => army.factionId === view.factionId)!;
  return { view, army };
}
describe('two-point patrol controls', () => {
  it('parses bounded integer form coordinates without treating blank as hex zero', () => {
    for (const text of ['', ' ', '-1', '4.5', 'NaN', 'Infinity', '100']) expect(patrolEndpoint(text, 100)).toBeUndefined();
    expect(patrolEndpoint('0', 100)).toBe(0);
    expect(patrolEndpoint(' 99 ', 100)).toBe(99);
  });

  it('requires an explicit second endpoint and explains direct-order and cancellation priority', () => {
    const { view, army } = scene(), issue = vi.fn();
    const html = renderToStaticMarkup(<ArmyPatrol view={view} army={army} busy={false} issue={issue}/>);
    expect(html).toContain('Two-point patrol');
    expect(html).toContain('Choose two different hexes');
    expect(html).toContain('<button class="primary wide" disabled="">Start patrol</button>');
    expect(html).toContain('Travel already issued continues');
    expect(html).toContain('Cancel route');
    expect(html).toContain('never starts a battle automatically');
    expect(html).toContain('Pause when war begins');
    expect(html).not.toContain('checked=""');
    expect(issue).not.toHaveBeenCalled();
  });

  it('exposes actual waiting/paused state and keeps all controls locked during a command', () => {
    const { view, army } = scene();
    const patrol: NonNullable<Observation['patrols']>[number] = {
      armyId: army.id, factionId: view.factionId, firstCell: 495, secondCell: 510,
      target: 'second', targetCell: 510, enabled: false, pauseOnWar: true, lastAttemptTurn: 1,
      lastError: null, status: 'paused', blocker: 'Patrol assignments are paused.',
    };
    view.patrols = [patrol];
    const html = renderToStaticMarkup(<ArmyPatrol view={view} army={army} busy issue={vi.fn()}/>);
    expect(html).toContain('Paused · 495');
    expect(html).toContain('Patrol assignments are paused.');
    expect(html).toContain('<button class="wide" disabled="">Resume patrol</button>');
    expect(html).toContain('<button class="wide" disabled="">Remove patrol</button>');
    expect(html).toContain('Updating points preserves whether the patrol is paused.');
    expect(html).toContain('checked=""');
    expect(html).toContain('Resuming while still at war pauses the patrol again next turn');
  });

  it('does not offer a new patrol for historical observations, hulls, founders or foreign armies', () => {
    const { view, army } = scene(), issue = vi.fn();
    for (const altered of [{ ...army, domain: 'naval' as const }, { ...army, canFound: true }, { ...army, canAttack: false }, { ...army, factionId: 'foreign' }]) {
      expect(renderToStaticMarkup(<ArmyPatrol view={view} army={altered} busy={false} issue={issue}/>)).toBe('');
    }
    expect(renderToStaticMarkup(<ArmyPatrol view={{ ...view, patrols: undefined }} army={army} busy={false} issue={issue}/>)).toBe('');
    expect(issue).not.toHaveBeenCalled();
  });
});
