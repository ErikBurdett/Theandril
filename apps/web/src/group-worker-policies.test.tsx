import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { applyCommand, getObservation, stateHash } from '@theandril/sim';
import { characterCampaign } from '../../../packages/test-fixtures/src/character-fixture';
import { GroupWorkerPolicyOrders, groupWorkerPolicyCommands } from './group-worker-policies';

const forbidden = (): never => { throw new Error('Rendering must not issue or acknowledge orders.'); };
function scene() {
  const game = characterCampaign(), view = getObservation(game, game.turnOwnerId);
  const town = view.settlements.find(item => item.factionId === view.factionId)!;
  return { game, view, town, selected: new Set([town.id]) };
}
describe('group worker stewardship', () => {
  it('keeps stable owned selection and refuses an oversized selection without applying a prefix', () => {
    const { game, view, town } = scene();
    view.settlements = Array.from({ length: 129 }, (_, index) => ({ ...town, id: `town.${String(index).padStart(3, '0')}` })).reverse();
    const selected = new Set(view.settlements.map(item => item.id)), before = JSON.stringify(view), hash = stateHash(game);
    expect(groupWorkerPolicyCommands(view, selected, 'food')).toEqual([]);
    selected.delete('town.128');
    view.settlements.push({ ...town, id: 'foreign', factionId: 'another' }); selected.add('foreign'); selected.add('lost');
    const commands = groupWorkerPolicyCommands(view, selected, 'food');
    expect(commands).toHaveLength(128);
    expect(commands.map(command => command.settlementId)).toEqual([...commands.map(command => command.settlementId)].sort());
    expect(commands.every(command => command.focus === 'food' && command.factionId === view.factionId)).toBe(true);
    view.settlements.pop(); expect(JSON.stringify(view)).toBe(before); expect(stateHash(game)).toBe(hash);
  });

  it('removes only selected governed hearths, preserving actual workers, production and coin', () => {
    const { game, view, town, selected } = scene();
    const treasury = view.treasury, queue = structuredClone(town.queue);
    expect(groupWorkerPolicyCommands(view, selected, 'none')).toEqual([]);
    const grant = groupWorkerPolicyCommands(view, selected, 'balanced');
    expect(applyCommand(game, grant[0]!).ok).toBe(true);
    const workers = [...game.land.settlements[town.id]!.worked];
    const removal = groupWorkerPolicyCommands(getObservation(game, view.factionId), selected, 'none');
    expect(removal).toHaveLength(1); expect(applyCommand(game, removal[0]!).ok).toBe(true);
    expect(game.land.settlements[town.id]!.worked).toEqual(workers);
    expect(game.settlements[town.id]!.queue).toEqual(queue);
    expect(getObservation(game, view.factionId).treasury).toBe(treasury);
  });

  it('requires the reviewed hash and names worker, harvest, override and extraction consequences', () => {
    const { view, selected } = scene();
    for (const hash of [undefined, '12345678']) {
      const html = renderToStaticMarkup(<GroupWorkerPolicyOrders view={view} hash={hash} selected={selected} matching={new Set()} busy={false} issue={async () => forbidden()} accepted={forbidden} onPendingChange={forbidden}/>);
      expect(html).toContain('1 hearth selected · 1 outside this filter');
      expect(html).toContain(`<button class="primary"${hash ? '' : ' disabled=""'}>Apply worker policies (1)</button>`);
      expect(html).toContain('reassigns workers immediately at no coin cost');
      expect(html).toContain('following harvest'); expect(html).toContain('stop resource extraction');
      expect(html).toContain('Manual worker orders revoke'); expect(html).toContain('Removing a policy keeps its current workers');
      expect(html).toContain('Remove worker policies (0)');
    }
    delete view.workerPolicies;
    expect(groupWorkerPolicyCommands(view, selected, 'balanced')).toEqual([]);
    expect(renderToStaticMarkup(<GroupWorkerPolicyOrders view={view} hash="12345678" selected={selected} matching={selected} busy={false} issue={async () => forbidden()} accepted={forbidden} onPendingChange={forbidden}/>)).toBe('');
  });
});
