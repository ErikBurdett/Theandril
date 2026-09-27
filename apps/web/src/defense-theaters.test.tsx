import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { getObservation, stateHash, type Observation } from '@theandril/sim';
import { characterCampaign } from '../../../packages/test-fixtures/src/character-fixture';
import { DefenseTheaters, TheaterEditor, TheaterReport, THEATER_PAGE_SIZE, detachTheaterMember, theaterArmySelection, theaterDraft, theaterDraftCommand, theaterMembershipChange } from './defense-theaters';
import { RealmRoster } from './realm-windows';

type Theater = NonNullable<Observation['theaters']>[number];
function fixture(count = 3) {
  const game = characterCampaign(count), view = getObservation(game, game.turnOwnerId);
  const town = view.settlements.find(row => row.factionId === view.factionId)!;
  const armyIds = view.armies.filter(army => army.factionId === view.factionId).map(army => army.id).sort();
  // Detached presentation rows exercise the UI; they do not claim simulation outcomes.
  const theater: Theater = {
    id: 'theater.1', factionId: view.factionId, name: 'East watch', settlementIds: [town.id], armyIds,
    reserveCell: town.cell, guardsPerSettlement: 2, enabled: true, lastRunTurn: 4, lastDispatches: [],
    hearths: [{ settlementId: town.id, name: town.name, cell: town.cell, available: true, stationed: 0, incoming: 0, required: 2, deficit: 2 }],
    members: armyIds.map(armyId => ({ armyId, cell: town.cell, status: 'ready', targetCell: null, blocker: null })),
    missingGuards: 2, blocker: null,
  };
  view.theaters = [theater];
  return { game, view, theater, town, armyIds };
}

describe('defensive theater presentation', () => {
  it('copies only permitted combat land armies ashore and discloses membership conflicts without truncating', () => {
    const { view, theater, armyIds } = fixture(129), source = view.armies[0]!;
    view.armies.push({ ...source, id: 'fleet', domain: 'naval' }, { ...source, id: 'caravan', canFound: true }, { ...source, id: 'civilian', canAttack: false }, { ...source, id: 'passenger', carrierId: 'fleet' }, { ...source, id: 'foreign', factionId: 'another-realm' });
    view.theaters = [{ ...theater, armyIds: [armyIds[0]!] }];
    const checked = new Set(view.armies.map(army => army.id)); checked.add('missing');
    const before = JSON.stringify(view);
    const create = theaterArmySelection(view, checked);
    expect(create.armyIds).toHaveLength(128); expect(create.assignedElsewhere).toBe(1); expect(create.unavailable).toBe(6);
    const edit = theaterArmySelection(view, checked, theater.id);
    expect(edit.armyIds).toHaveLength(129); expect(edit.armyIds).toEqual([...armyIds].sort());
    expect(JSON.stringify(view)).toBe(before);
  });

  it('builds bounded stable ordinary commands and rejects empty new membership, duplicates and invalid configuration', () => {
    const { view, theater, armyIds, game } = fixture(); view.theaters = [];
    const hash = stateHash(game), before = JSON.stringify(view), draft = theaterDraft(theater);
    draft.name = '  North watch  '; draft.armyIds.reverse();
    expect(theaterDraftCommand(view, draft)).toEqual({ type: 'setTheater', factionId: view.factionId, ...draft, name: 'North watch', armyIds });
    for (const changed of [{ name: '' }, { name: 'x'.repeat(41) }, { armyIds: [] }, { armyIds: [armyIds[0]!, armyIds[0]!] }, { armyIds: Array.from({ length: 129 }, (_, i) => `army.${i}`) }, { settlementIds: [] }, { settlementIds: [theater.settlementIds[0]!, theater.settlementIds[0]!] }, { settlementIds: Array.from({ length: 17 }, (_, i) => `town.${i}`) }, { reserveCell: -1 }, { reserveCell: view.width * view.height }, { guardsPerSettlement: 0 }, { guardsPerSettlement: 5 }, { guardsPerSettlement: 1.5 }]) expect(theaterDraftCommand(view, { ...draft, ...changed }), JSON.stringify(changed)).toBeUndefined();
    expect(theaterDraftCommand(view, draft, 'theater.missing')).toBeUndefined();
    expect(JSON.stringify(view)).toBe(before); expect(stateHash(game)).toBe(hash);
  });

  it('preserves captured hearths and embarked existing members while editing, but refuses new use of either', () => {
    const { view, theater, armyIds } = fixture();
    const member = view.armies.find(army => army.id === armyIds[0])!; member.carrierId = 'fleet';
    theater.settlementIds.push('lost.hearth');
    const draft = theaterDraft(theater);
    expect(theaterDraftCommand(view, draft, theater.id)).toMatchObject({ type: 'setTheater', armyIds, settlementIds: [...theater.settlementIds].sort() });
    expect(theaterDraftCommand(view, { ...draft, armyIds: [] }, theater.id)).toMatchObject({ type: 'setTheater', armyIds: [] });
    view.theaters = [];
    expect(theaterDraftCommand(view, { ...draft, name: 'New' })).toBeUndefined();
    expect(theaterDraftCommand(view, { ...draft, name: 'New', settlementIds: draft.settlementIds.slice(0, 1), armyIds: [member.id] })).toBeUndefined();
  });

  it('prevents stealing another theater’s hearth or members and enforces the eight-theater/name boundaries', () => {
    const { view, theater, armyIds, town } = fixture();
    const other = { ...theater, id: 'theater.2', name: 'West watch', armyIds: [armyIds[1]!], settlementIds: ['town.other'] };
    theater.armyIds = [armyIds[0]!]; view.theaters = [theater, other];
    view.settlements.push({ ...town, id: 'town.other', name: 'Other hearth' });
    const draft = theaterDraft(theater);
    expect(theaterDraftCommand(view, { ...draft, name: 'WEST WATCH' }, theater.id)).toBeUndefined();
    expect(theaterDraftCommand(view, { ...draft, armyIds: [armyIds[1]!] }, theater.id)).toBeUndefined();
    expect(theaterDraftCommand(view, { ...draft, settlementIds: ['town.other'] }, theater.id)).toBeUndefined();
    view.theaters = Array.from({ length: 8 }, (_, i) => ({ ...theater, id: `theater.${i + 1}`, name: `Watch ${i}`, armyIds: [], settlementIds: [] }));
    expect(theaterDraftCommand(view, { ...draft, name: 'Ninth' })).toBeUndefined();
  });

  it('detaches one current member without disabling the others or changing routes, postings or the saved configuration', () => {
    const { view, theater, armyIds } = fixture();
    const before = JSON.stringify(view);
    const command = detachTheaterMember(view, theater.id, armyIds[1]!);
    expect(command).toEqual({ type: 'setTheater', factionId: view.factionId, theaterId: theater.id, ...theaterDraft(theater), armyIds: [armyIds[0]!, armyIds[2]!] });
    expect(theaterMembershipChange(theater.armyIds, [armyIds[0]!, 'army.new'])).toEqual({ removed: armyIds.slice(1), added: ['army.new'] });
    expect(detachTheaterMember(view, theater.id, 'not.a.member')).toBeUndefined();
    expect(detachTheaterMember(view, 'another.theater', armyIds[0]!)).toBeUndefined();
    expect(JSON.stringify(view)).toBe(before);
    theater.armyIds = [armyIds[0]!];
    expect(detachTheaterMember(view, theater.id, armyIds[0]!)).toMatchObject({ enabled: true, armyIds: [] });
  });

  it('renders canonical deficits, override reasons and actual last-turn refusals with bounded member rows', () => {
    const { theater, armyIds } = fixture(128);
    theater.members[0] = { armyId: armyIds[0]!, cell: 4, status: 'overridden', targetCell: 8, blocker: 'A paused direct route takes precedence.' };
    theater.hearths[0] = { ...theater.hearths[0]!, stationed: 7, incoming: 5, required: 13, deficit: 1 };
    theater.missingGuards = 1;
    theater.hearths.push({ settlementId: 'lost.hearth', name: 'Lost hearth', cell: null, available: false, stationed: 0, incoming: 0, required: 2, deficit: 0 });
    theater.lastDispatches = [{ armyId: armyIds[0]!, targetCell: 8, accepted: false, message: 'Hostile approach blocks ordinary travel.' }];
    const html = renderToStaticMarkup(<TheaterReport theater={theater} names={new Map([[armyIds[0]!, 'First column']])} busy detach={vi.fn()}/>);
    expect(html).toContain('1 missing guards'); expect(html).toContain('7 stationed · 5 incoming · 13 required · 1 missing');
    expect(html).toContain('Lost hearth</strong> · Unavailable. Retained in this theater; no guards dispatched here.');
    expect(html).toContain('A paused direct route takes precedence.'); expect(html).toContain('Last theater dispatches · turn 4');
    expect(html).toContain('Refused: Hostile approach blocks ordinary travel.'); expect(html).toContain('not a route preview');
    expect(html.match(/>Detach army<\/button>/g)).toHaveLength(THEATER_PAGE_SIZE); expect(html).toContain('Page 1 of 6');
    expect(html).toContain('disabled="" aria-label="Detach First column from theater"');
  });

  it('pages named owned hearth choices and preserves the draft independently of registry checks', () => {
    const { view, theater, town, armyIds } = fixture();
    view.settlements = Array.from({ length: 40 }, (_, i) => ({ ...town, id: `town.${String(i).padStart(2, '0')}`, name: `Hearth ${i}` }));
    view.settlements.push({ ...town, id: 'town.foreign', name: 'Foreign private town', factionId: 'another-realm' });
    theater.settlementIds = ['town.00', 'lost.hearth']; theater.hearths.push({ settlementId: 'lost.hearth', name: 'Lost hearth', cell: null, available: false, stationed: 0, incoming: 0, required: 2, deficit: 0 });
    const save = vi.fn();
    const html = renderToStaticMarkup(<TheaterEditor view={view} theater={theater} checked={new Set([armyIds[0]!])} knownSelectedCell={17} busy save={save}/>);
    expect(html).toContain('Page 1 of 2'); expect(html).toContain('Next protected hearths page');
    expect(html).toContain('Known selected map hex · 17'); expect(html).not.toContain('Foreign private town');
    expect(html).toContain('3 draft member armies · 1 eligible checked armies');
    expect(html).toContain('0 existing member armies will be removed and 0 added');
    expect(html).toContain('Lost hearth · Unavailable; retained until unchecked');
    expect(html).toContain('<button class="primary" disabled="">Save theater changes</button>'); expect(save).not.toHaveBeenCalled();
  });

  it('starts collapsed, explains future dispatch and continuing routes, and offers no historical capability by default', () => {
    const { view } = fixture();
    const issue = vi.fn(), onPendingChange = vi.fn();
    const props = { view, checked: new Set<string>(), busy: false, issue, onPendingChange };
    const html = renderToStaticMarkup(<DefenseTheaters {...props}/>);
    expect(html).toContain('<summary>Defensive theaters</summary>'); expect(html).not.toContain(' open=');
    expect(html).toContain('on the next End turn'); expect(html).toContain('at most 16 new routes per turn');
    expect(html).toContain('Active or paused direct routes and standing postings override');
    expect(html).toContain('Existing routes continue; cancel travel separately'); expect(html).toContain('never attacks automatically');
    expect(html).toContain('Guards are whole armies'); expect(html).not.toContain('Known selected map hex');
    delete view.theaters;
    const historical = renderToStaticMarkup(<DefenseTheaters {...props}/>);
    expect(historical).toContain('historical campaign has no defensive-theater controls'); expect(historical).not.toContain('<select');
    expect(issue).not.toHaveBeenCalled(); expect(onPendingChange).not.toHaveBeenCalled();
  });

  it('integrates with the existing army selection and honors the external roster lock', () => {
    const { view } = fixture(100), issue = vi.fn();
    const html = renderToStaticMarkup(<RealmRoster view={view} registry="armies" search="" force="all" selection={{ cell: 20 }} knownSelectedCell={17} select={vi.fn()} choose={vi.fn()} setSearch={vi.fn()} setForce={vi.fn()} characters={vi.fn()} busy onTheaterCommand={issue}/>);
    expect(html).toContain('data-testid="defense-theaters"'); expect(html).toContain('Known selected map hex · 17'); expect(html).not.toContain('Known selected map hex · 20');
    expect(html).toContain('type="search" disabled=""'); expect(html).toContain('Force type<select disabled=""');
    expect(html).toContain('Defensive theater<select disabled=""'); expect(html).toContain('for group orders');
    expect(issue).not.toHaveBeenCalled();
  });
});
