import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { getObservation, stateHash } from '@theandril/sim';
import { characterCampaign } from '../../../packages/test-fixtures/src/character-fixture';
import { groupPostingArmies } from './group-postings';
import { GROUP_MOVEMENT_PAGE_SIZE, GroupMovementOrders, GroupMovementPreview, GroupMovementResults, groupMovementContextKey, groupMovementPlan, groupMovementQueueCommands, groupMovementReviewMatches, groupMovementRouteCommands, groupMovementTarget } from './group-movement';
import { RealmRegistry } from './realm-navigation';
import { RealmRoster } from './realm-windows';
import type { GroupMovementReview } from './protocol';

describe('group travel presentation', () => {
  it('snapshots owned land armies ashore in stable order without screening canonical blockers or hidden destinations', () => {
    const game = characterCampaign(100), view = getObservation(game, game.turnOwnerId);
    const source = groupPostingArmies(view)[0]!;
    source.movementBlocker = 'Cancel the active character mission before moving this army.';
    view.armies.push({ ...source, id: 'foreign', factionId: 'other' }, { ...source, id: 'hull', domain: 'naval' }, { ...source, id: 'passenger', carrierId: 'hull' });
    const selected = new Set([...view.armies].reverse().map(army => army.id)); selected.add('lost-army');
    const target = Array.from({ length: view.width * view.height }, (_, cell) => cell).find(cell => !game.explored[view.factionId]!.has(cell))!;
    const before = JSON.stringify(view), hash = stateHash(game);
    const plan = groupMovementPlan(view, selected, target, true)!;
    expect(plan.armyIds).toHaveLength(100);
    expect(plan.armyIds).toContain(source.id);
    expect(plan.armyIds).toEqual([...plan.armyIds].sort());
    expect(plan.armyIds.some(id => ['foreign', 'hull', 'passenger', 'lost-army'].includes(id))).toBe(false);
    const commands = groupMovementQueueCommands(plan);
    expect(commands).toHaveLength(100);
    expect(commands[0]).toEqual({ type: 'queueMovement', factionId: view.factionId, armyId: plan.armyIds[0], target, append: true });
    expect(commands.map(command => command.armyId)).toEqual(plan.armyIds);
    expect(JSON.stringify(view)).toBe(before); expect(stateHash(game)).toBe(hash);
  });

  it('requires an explicit integer world destination and refuses oversized selections without silent truncation', () => {
    const game = characterCampaign(129), view = getObservation(game, game.turnOwnerId);
    const selected = new Set(groupPostingArmies(view).map(army => army.id));
    expect(groupMovementPlan(view, selected, 0, false)).toBeUndefined();
    expect(groupMovementPlan(view, new Set(), 0, false)).toBeUndefined();
    for (const input of ['', ' ', '-1', '1.5', 'NaN', 'Infinity', String(view.width * view.height)]) expect(groupMovementTarget(input, view)).toBeUndefined();
    expect(groupMovementTarget('0', view)).toBe(0);
    expect(groupMovementTarget(String(view.width * view.height - 1), view)).toBe(view.width * view.height - 1);
    expect(groupMovementPlan(view, new Set([view.armies[0]!.id]), undefined, false)).toBeUndefined();
  });

  it('resumes only selected paused routes and cancels only existing selected routes, preserving postings', () => {
    const game = characterCampaign(4), view = getObservation(game, game.turnOwnerId);
    const armies = groupPostingArmies(view), selected = new Set(armies.map(army => army.id));
    const route = { origin: 0, path: [1], waypoints: [1], knownHostileIds: [], pauseReason: null };
    view.routes = [
      { ...route, armyId: armies[0]!.id, status: 'paused', pauseReason: 'New hostile sighting.' },
      { ...route, armyId: armies[1]!.id, status: 'active' },
      { ...route, armyId: 'unselected-army', status: 'paused' },
      { ...route, armyId: 'foreign-army', status: 'active' },
    ];
    const before = JSON.stringify(view);
    expect(groupMovementRouteCommands(view, selected, 'resumeMovement')).toEqual([
      { type: 'resumeMovement', factionId: view.factionId, armyId: armies[0]!.id },
    ]);
    expect(groupMovementRouteCommands(view, selected, 'cancelMovement')).toEqual(armies.slice(0, 2).map(army => ({ type: 'cancelMovement', factionId: view.factionId, armyId: army.id })));
    expect(JSON.stringify(view)).toBe(before);
  });

  it('rejects reviews when the campaign, selection, target, route mode or response membership has changed', () => {
    const game = characterCampaign(), view = getObservation(game, game.turnOwnerId), hash = stateHash(game);
    const plan = groupMovementPlan(view, new Set(groupPostingArmies(view).map(army => army.id)), 0, false)!;
    const review: GroupMovementReview = { hash, target: 0, append: false, results: plan.armyIds.map(armyId => ({ armyId, target: 0, cost: 5, steps: 3, canQueue: true, blocker: null, limited: false, expandedNodes: 7 })) };
    const key = groupMovementContextKey(hash, plan);
    expect(groupMovementReviewMatches(review, plan, hash)).toBe(true);
    expect(groupMovementContextKey(hash, { ...plan, armyIds: [...plan.armyIds].reverse() })).toBe(key);
    for (const changed of [{ ...plan, armyIds: plan.armyIds.slice(1) }, { ...plan, target: 1 }, { ...plan, append: true }, { ...plan, factionId: 'another-realm' }]) {
      expect(groupMovementContextKey(hash, changed)).not.toBe(key);
    }
    expect(groupMovementContextKey('new-hash', plan)).not.toBe(key);
    expect(groupMovementReviewMatches(review, plan, 'new-hash')).toBe(false);
    expect(groupMovementReviewMatches(review, plan, undefined)).toBe(false);
    expect(groupMovementReviewMatches(review, undefined, hash)).toBe(false);
    expect(groupMovementReviewMatches({ ...review, target: 1 }, plan, hash)).toBe(false);
    expect(groupMovementReviewMatches({ ...review, append: true }, plan, hash)).toBe(false);
    expect(groupMovementReviewMatches({ ...review, results: review.results.slice(1) }, plan, hash)).toBe(false);
    expect(groupMovementReviewMatches({ ...review, results: [review.results[0]!, review.results[0]!] }, plan, hash)).toBe(false);
    expect(groupMovementReviewMatches({ ...review, results: review.results.map(row => ({ ...row, target: 2 })) }, plan, hash)).toBe(false);
  });

  it('bounds reviewed rows, reports blockers and search limits, and never offers an attack action', () => {
    const review: GroupMovementReview = { hash: 'review-hash', target: 50, append: false, results: Array.from({ length: 128 }, (_, index) => ({ armyId: `army.${index}`, target: 50, cost: index, steps: index, canQueue: index > 0, blocker: index === 0 ? 'Hostile destination.' : null, limited: index === 0, expandedNodes: index })) };
    const html = renderToStaticMarkup(<GroupMovementPreview review={review} names={new Map([['army.0', 'First column']])}/>);
    expect(html).toContain('127 can queue · 1 unavailable. Destination hex 50.');
    expect(html).toContain('data-hash="review-hash"');
    expect(html).toContain('First column</strong> · Unavailable');
    expect(html).toContain('Hostile destination.');
    expect(html).toContain('Search limit reached. Choose a nearer waypoint.');
    expect(html.match(/<li>/g)).toHaveLength(GROUP_MOVEMENT_PAGE_SIZE);
    expect(html).toContain('Page 1 of 6');
    expect(html).toContain('Next travel review page');
    expect(html).not.toContain('Attack now');
  });

  it('reports actual accepted and refused results without promising an active route', () => {
    const html = renderToStaticMarkup(<GroupMovementResults rows={[
      { armyId: 'army.1', name: 'First', accepted: true },
      { armyId: 'army.2', name: 'Second', accepted: false, message: 'You have not explored that hex.' },
    ]}/>);
    expect(html).toContain('1 orders accepted · 1 refused. Refused armies remain selected for review.');
    expect(html).toContain('First</strong> · Accepted');
    expect(html).toContain('Second</strong> · Refused: You have not explored that hex.');
    expect(html).toContain('Accepted travel may have moved, arrived or paused.');
  });

  it('starts collapsed and requires explicit review while explaining immediate travel and preserved postings', () => {
    const game = characterCampaign(), view = getObservation(game, game.turnOwnerId);
    const armies = groupPostingArmies(view), selected = new Set(armies.map(army => army.id));
    const issue = vi.fn(async () => []), preview = vi.fn(), accepted = vi.fn(), pending = vi.fn();
    const html = renderToStaticMarkup(<GroupMovementOrders view={view} hash={stateHash(game)} selected={selected} selectedCell={17} busy issue={issue} preview={preview} accepted={accepted} onPendingChange={pending}/>);
    expect(html).toContain('<summary>Group travel</summary>'); expect(html).not.toContain(' open=');
    expect(html).toContain('Selected map hex · 17');
    expect(html).toContain('value="map" selected=""');
    expect(html).toContain('value="replace" selected=""');
    expect(html).toContain('<button disabled="">Review routes</button>');
    expect(html).toContain('<button class="primary" disabled="">Apply reviewed routes (2)</button>');
    expect(html).toContain('starts movement immediately');
    expect(html).toContain('Reviews are advisory. Earlier orders can reveal terrain');
    expect(html).toContain('travel never attacks or declares war automatically');
    expect(html).toContain('Use Clear selected postings above');
    expect(html).not.toContain('data-testid="group-movement-preview"');
    expect(issue).not.toHaveBeenCalled(); expect(preview).not.toHaveBeenCalled(); expect(accepted).not.toHaveBeenCalled(); expect(pending).not.toHaveBeenCalled();
  });

  it('locks the roster and exposes travel with the existing shared group selection', () => {
    const game = characterCampaign(100), view = getObservation(game, game.turnOwnerId);
    const props = { view, registry: 'armies' as const, search: '', force: 'all', selection: {}, select: vi.fn(), onGroupMovement: vi.fn(), onGroupMovementPreview: vi.fn() };
    const html = renderToStaticMarkup(<RealmRegistry {...props} busy hash={stateHash(game)}/>);
    expect(html).toContain('data-testid="group-movement"');
    expect(html.match(/type="checkbox"/g)).toHaveLength(25);
    expect(html).toContain('Registry order<select disabled=""');
    expect(html).toContain('<button disabled="" aria-label="Next registry page">');
    const roster = renderToStaticMarkup(<RealmRoster {...props} busy choose={() => {}} setSearch={() => {}} setForce={() => {}} characters={() => {}}/>);
    expect(roster).toContain('type="search" disabled=""');
    expect(roster).toContain('Force type<select disabled=""');
    expect(props.onGroupMovement).not.toHaveBeenCalled(); expect(props.onGroupMovementPreview).not.toHaveBeenCalled();
  });
});
