import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { applyCommand, getObservation, stateHash } from '@theandril/sim';
import { theaterCampaign } from '../../../packages/test-fixtures/src/theater-fixture';
import { armyOrderCounts, buildArmyOrderIndex } from './army-order-status';
import { addGroupSelection, GroupPostingOrders } from './group-postings';
import { ArmyOrderDetails, RealmRegistry, registryEntries, REGISTRY_PAGE_SIZE } from './realm-navigation';

function roster() {
  const game = theaterCampaign(101), factionId = game.turnOwnerId;
  const armies = Object.values(game.armies).filter(army => army.factionId === factionId)
    .sort((a, b) => a.id.localeCompare(b.id));
  const first = armies[0]!, last = armies.at(-1)!;
  expect(applyCommand(game, { type: 'setPosting', factionId, armyId: first.id, cell: 497, mode: 'hold' }).ok).toBe(true);
  expect(applyCommand(game, { type: 'setPatrol', factionId, armyId: last.id, firstCell: 495, secondCell: 497, enabled: false }).ok).toBe(true);
  return { game, view: getObservation(game, factionId), first, last };
}
const forbidden = () => { throw new Error('Rendering and filtering must not issue an action.'); };

describe('army registry order filters', () => {
  it('locates a last-page paused policy before paging, regardless of movement or active travel', () => {
    const { game, view, last } = roster();
    // Authored observation contract isolates zero-movement, disabled-policy, active-travel display.
    view.armies.find(army => army.id === last.id)!.movement = 0;
    view.routes = [{ armyId: last.id, origin: 495, waypoints: [497], path: [496], status: 'active', pauseReason: null, knownHostileIds: [] }];
    const before = structuredClone(view), hash = stateHash(game), index = buildArmyOrderIndex(view);
    const all = registryEntries(view, 'armies', '', 'all', 'id');
    expect(all).toHaveLength(101); expect(all.at(-1)!.id).toBe(last.id);
    const paused = registryEntries(view, 'armies', '', 'all', 'id', 'paused-patrols', index);
    expect(paused.map(army => army.id)).toEqual([last.id]);
    expect(paused.slice(0, REGISTRY_PAGE_SIZE)).toHaveLength(1);
    const html = renderToStaticMarkup(<ArmyOrderDetails status={index.get(last.id)}/>);
    expect(html).toContain('Patrol policy: paused'); expect(html).toContain('Travel queued');
    expect(html).toContain('target hex 497'); expect(html).not.toContain('Route interrupted');
    expect(view).toEqual(before); expect(stateHash(game)).toBe(hash);
  });

  it('composes cohort counts with search and domain before filtering and paging', () => {
    const { view, last } = roster(), index = buildArmyOrderIndex(view);
    const matching = registryEntries(view, 'armies', last.id, 'land', 'name');
    expect(armyOrderCounts(matching.map(item => item.id), index)).toEqual({ all: 1, standing: 1, waiting: 0, 'paused-patrols': 1 });
    expect(registryEntries(view, 'armies', last.id, 'naval', 'id', 'paused-patrols', index)).toEqual([]);
    expect(registryEntries(view, 'armies', last.id, 'land', 'id', 'waiting', index)).toEqual([]);
    expect(registryEntries(view, 'settlements', '', 'all', 'id', 'paused-patrols', index))
      .toEqual(registryEntries(view, 'settlements', '', 'all', 'id'));
  });

  it('exposes optional group patrol controls only for armies and respects the shared registry lock', () => {
    const { game, view } = roster();
    const html = renderToStaticMarkup(<RealmRegistry view={view} hash={stateHash(game)} registry="armies" search="" force="all" selection={{}} select={forbidden} onGroupPatrol={async () => forbidden()} busy/>);
    expect(html).toContain('data-testid="group-patrols"');
    expect(html).toContain('Army orders<select disabled=""');
    expect(html).toContain('<button disabled="">Pause enabled patrols (0)</button>');
    expect(html.match(/type="checkbox" aria-label="Select [^"]+ for group orders"/g)).toHaveLength(REGISTRY_PAGE_SIZE);
    expect(html.match(/type="checkbox" aria-label="[^"]+" disabled=""/g)).toHaveLength(REGISTRY_PAGE_SIZE);
    const towns = renderToStaticMarkup(<RealmRegistry view={view} hash={stateHash(game)} registry="settlements" search="" force="all" selection={{}} select={forbidden} onGroupPatrol={async () => forbidden()}/>);
    expect(towns).not.toContain('data-testid="group-patrols"');
  });

  it('defaults to all forces with four exact filter labels and only 25 rows', () => {
    const { view } = roster();
    const html = renderToStaticMarkup(<RealmRegistry view={view} registry="armies" search="" force="all" selection={{}} select={forbidden}/>);
    expect(html).toContain('<option value="all" selected="">All forces (101)</option>');
    expect(html).toContain('Postings and patrols (2)'); expect(html).toContain('Orders waiting (1)');
    expect(html).toContain('Paused patrols (1)'); expect(html).toContain('Page 1 of 5');
    expect(html.match(/class="registry-item /g)).toHaveLength(REGISTRY_PAGE_SIZE);
  });

  it('retains checked actors outside the new matching cohort using existing group semantics', () => {
    const { view, first, last } = roster(), checked = new Set([first.id]);
    const matching = new Set(registryEntries(view, 'armies', '', 'all', 'id', 'paused-patrols').map(item => item.id));
    const afterSelectMatching = addGroupSelection(checked, [...matching]);
    expect([...checked]).toEqual([first.id]); expect(afterSelectMatching).toEqual(new Set([first.id, last.id]));
    const html = renderToStaticMarkup(<GroupPostingOrders view={view} selected={afterSelectMatching} matching={matching} busy={false} issue={async () => forbidden()} selectMatching={forbidden} clearSelection={forbidden} accepted={forbidden}/>);
    expect(html).toContain('2 armies selected'); expect(html).toContain('1 outside this filter');
  });

  it('uses the existing busy lock and leaves settlement registries without army filters', () => {
    const { view } = roster();
    const html = renderToStaticMarkup(<RealmRegistry view={view} registry="armies" search="" force="all" selection={{}} select={forbidden} busy/>);
    expect(html).toContain('Army orders<select disabled="">');
    const towns = renderToStaticMarkup(<RealmRegistry view={view} registry="settlements" search="" force="all" selection={{}} select={forbidden}/>);
    expect(towns).not.toContain('Army orders'); expect(towns).not.toContain('Postings and patrols');
  });

  it('displays exact posting and route reasons independently of patrol policy', () => {
    const { view, first } = roster();
    view.routes = [{ armyId: first.id, origin: 495, waypoints: [0], path: [496], status: 'paused', pauseReason: 'Hostile force observed.', knownHostileIds: [] }];
    const status = buildArmyOrderIndex(view).get(first.id)!;
    const html = renderToStaticMarkup(<ArmyOrderDetails status={status}/>);
    expect(html).toContain('Posting: Hold at hex 497');
    expect(html).toContain(status.posting!.blocker!);
    expect(html).toContain('Route interrupted'); expect(html).toContain('target hex 0');
    expect(html).toContain('Hostile force observed.');
  });
});
