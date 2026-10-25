import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { applyCommand, createArmyFormation, deserializeGame, getObservation, serializeGame, stateHash } from '@theandril/sim';
import { theaterCampaign } from '../../../packages/test-fixtures/src/theater-fixture';
import { GroupPatrolOrders, GroupPatrolResults, groupPatrolPlan, groupPatrolAssignment, GROUP_PATROL_PAGE_SIZE } from './group-patrols';
import { MAX_GROUP_ORDER_COMMANDS } from './protocol';

function fixture(count = 5) {
  const game = theaterCampaign(count), factionId = game.turnOwnerId;
  const armies = Object.values(game.armies).filter(army => army.factionId === factionId).sort((a, b) => a.id < b.id ? -1 : 1);
  for (const [index, army] of armies.slice(0, -1).entries()) expect(applyCommand(game, {
    type: 'setPatrol', factionId, armyId: army.id, firstCell: 495, secondCell: 497,
    enabled: index % 2 === 0, pauseOnWar: index % 2 !== 0,
  }).ok).toBe(true);
  return { game, view: getObservation(game, factionId), armies, selected: new Set(armies.map(army => army.id)) };
}
const forbidden = () => { throw new Error('Rendering must not issue orders or change selection.'); };

describe('group patrol policy controls', () => {
  it('composes a hundred observed policies in stable order and skips absent/already-desired policies', () => {
    const { game, view, armies, selected } = fixture(101), before = structuredClone(view), hash = stateHash(game);
    const plan = groupPatrolPlan(view, new Set([...selected].reverse()));
    expect(plan.commands.pause).toHaveLength(50); expect(plan.commands.resume).toHaveLength(50); expect(plan.commands.remove).toHaveLength(100);
    expect(plan.warPauseResumes).toBe(50);
    for (const commands of Object.values(plan.commands)) {
      expect(commands.map(command => command.armyId)).toEqual(commands.map(command => command.armyId).sort());
      expect(commands.some(command => command.armyId === armies.at(-1)!.id)).toBe(false);
    }
    expect(plan.commands.pause.every(command => command.type === 'setPatrolEnabled' && !command.enabled)).toBe(true);
    expect(plan.commands.resume.every(command => command.type === 'setPatrolEnabled' && command.enabled)).toBe(true);
    expect(plan.commands.remove.every(command => command.type === 'clearPatrol')).toBe(true);
    expect(view).toEqual(before); expect(stateHash(game)).toBe(hash);
  });

  it('applies ordinary pause, resume and remove without changing issued routes or spent movement', () => {
    const { game, armies, selected } = fixture();
    expect(applyCommand(game, { type: 'queueMovement', factionId: game.turnOwnerId, armyId: armies[0]!.id, target: 510 }).ok).toBe(true);
    expect(game.armies[armies[0]!.id]!.movement).toBe(0);
    const routes = structuredClone(game.routes), actors = structuredClone(game.armies);
    for (const action of ['pause', 'resume', 'remove'] as const) {
      const commands = groupPatrolPlan(getObservation(game, game.turnOwnerId), selected).commands[action];
      expect(commands.length).toBeGreaterThan(0);
      for (const command of commands) expect(applyCommand(game, command).ok).toBe(true);
      expect(game.routes).toEqual(routes); expect(game.armies).toEqual(actors);
      expect(serializeGame(deserializeGame(serializeGame(game)))).toBe(serializeGame(game));
    }
    expect(game.patrols).toEqual([]);
    expect(groupPatrolPlan(getObservation(game, game.turnOwnerId), selected).commands).toEqual({ pause: [], resume: [], remove: [] });
  });

  it('keeps the existing own-land-ashore selection boundary without adding movement or supply rules', () => {
    const { view, armies } = fixture();
    // Observation-only contract: exclude unavailable actors and mismatched owners;
    // zero movement and a reported override do not forbid administrative controls.
    view.armies[0]!.movement = 0;
    view.armies.find(army => army.id === armies[1]!.id)!.carrierId = 'fleet.example';
    view.armies.find(army => army.id === armies[2]!.id)!.domain = 'naval';
    view.patrols![0]!.status = 'overridden';
    const source = view.armies[0]!, policy = view.patrols!.find(item => item.armyId === source.id)!;
    view.armies.push({ ...source, id: 'foreign', factionId: 'other' }, { ...source, id: 'wrong-owner' });
    view.patrols!.push({ ...policy, armyId: 'foreign', factionId: 'other' }, { ...policy, armyId: 'wrong-owner', factionId: 'other' }, { ...policy, armyId: 'lost' });
    const plan = groupPatrolPlan(view, new Set([...view.armies.map(army => army.id), 'lost']));
    expect(plan.commands.remove.map(command => command.armyId)).toEqual([armies[0]!.id, armies[3]!.id]);
    expect(plan.commands.pause).toContainEqual({ type: 'setPatrolEnabled', factionId: view.factionId, armyId: armies[0]!.id, enabled: false });
  });

  it('refuses an oversized external selection without submitting a prefix and tolerates historical absence', () => {
    const { view } = fixture();
    const army = view.armies[0]!, patrol = view.patrols![0]!;
    // Explicit presentation contract; this is not a saveable recruited campaign.
    view.armies = Array.from({ length: 140 }, (_, index) => ({ ...army, id: `army.${String(index).padStart(3, '0')}` }));
    view.patrols = view.armies.map(item => ({ ...patrol, armyId: item.id }));
    const selected = new Set(view.armies.map(item => item.id));
    expect(groupPatrolPlan(view, selected)).toMatchObject({ overLimit: true, commands: { pause: [], resume: [], remove: [] } });
    const html = renderToStaticMarkup(<GroupPatrolOrders view={view} hash="12345678" selected={selected} matching={selected} busy={false} issue={async () => forbidden()} accepted={forbidden} onPendingChange={forbidden}/>);
    expect(html).toContain(`Select at most ${MAX_GROUP_ORDER_COMMANDS} armies. No partial selection will be submitted.`);
    expect(html.match(/<button[^>]* disabled=""/g)).toHaveLength(4);
    delete view.patrols;
    expect(groupPatrolPlan(view, selected).commands).toEqual({ pause: [], resume: [], remove: [] });
    expect(renderToStaticMarkup(<GroupPatrolOrders view={view} hash="12345678" selected={selected} matching={selected} busy={false} issue={async () => forbidden()} accepted={forbidden} onPendingChange={forbidden}/>)).toBe('');
  });

  it('shows exact action counts, outside-filter checks, route consequences and war-pause caution', () => {
    const { view, selected, armies } = fixture();
    const html = renderToStaticMarkup(<GroupPatrolOrders view={view} hash="12345678" selected={selected} matching={new Set([armies[0]!.id])} busy={false} issue={async () => forbidden()} accepted={forbidden} onPendingChange={forbidden}/>);
    expect(html).toContain('<summary>Group patrols</summary>');
    expect(html).toContain('5 armies selected · 4 outside this filter. 4 have patrols.');
    expect(html).toContain('Pause enabled patrols (2)'); expect(html).toContain('Resume paused patrols (2)'); expect(html).toContain('Remove selected patrols (4)');
    expect(html).toContain('Existing travel continues unchanged'); expect(html).toContain('does not resume a paused travel route');
    expect(html).toContain('2 paused patrols have Pause when war begins enabled');
    expect(html).toContain('Removing a patrol discards its saved points and war option');
    expect(html.match(/<button[^>]* disabled=""/g)).toHaveLength(1);
    expect(html).toContain('Assign patrols (5)');
  });

  it('locks every action while busy or missing a campaign hash, including no-policy selections', () => {
    const { view, selected, armies } = fixture();
    for (const props of [{ busy: true, hash: '12345678', selected }, { busy: false, hash: undefined, selected }, { busy: false, hash: '12345678', selected: new Set([armies.at(-1)!.id]) }]) {
      const html = renderToStaticMarkup(<GroupPatrolOrders view={view} matching={selected} {...props} issue={async () => forbidden()} accepted={forbidden} onPendingChange={forbidden}/>);
      expect(html.match(/<button[^>]* disabled=""/g)).toHaveLength(4);
    }
  });

  it('assigns common endpoints and war policy in stable order while preserving paused policies', () => {
    const { view, armies, selected } = fixture(), before = structuredClone(view);
    const commands = groupPatrolAssignment(view, new Set([...selected].reverse()), '497', '495', true);
    expect(commands.map(command => command.armyId)).toEqual(armies.map(army => army.id));
    expect(commands).toEqual(armies.map((army, index) => ({ type: 'setPatrol', factionId: view.factionId, armyId: army.id,
      firstCell: 497, secondCell: 495, enabled: index % 2 === 0, pauseOnWar: true })));
    expect(commands.at(-1)).toMatchObject({ enabled: true });
    expect(view).toEqual(before);
  });

  it('leaves combat and explored-point acceptance to simulation while excluding foreign, naval and carried actors', () => {
    const { view, armies } = fixture();
    view.armies.find(army => army.id === armies[0]!.id)!.canAttack = false;
    view.armies.find(army => army.id === armies[1]!.id)!.canFound = true;
    view.armies.find(army => army.id === armies[2]!.id)!.carrierId = 'fleet.example';
    view.armies.find(army => army.id === armies[3]!.id)!.domain = 'naval';
    view.armies.find(army => army.id === armies[4]!.id)!.factionId = 'other';
    const commands = groupPatrolAssignment(view, new Set([...armies.map(army => army.id), 'missing']), '0', '1', false);
    expect(commands.map(command => command.armyId)).toEqual([armies[0]!.id, armies[1]!.id]);
    expect(commands.every(command => command.type === 'setPatrol' && command.firstCell === 0 && command.secondCell === 1 && !command.pauseOnWar)).toBe(true);
  });

  it('replaces saved points with ordinary commands without touching routes, armies or postings', () => {
    const { game, armies, selected } = fixture();
    expect(applyCommand(game, { type: 'queueMovement', factionId: game.turnOwnerId, armyId: armies[0]!.id, target: 510 }).ok).toBe(true);
    expect(applyCommand(game, { type: 'setPosting', factionId: game.turnOwnerId, armyId: armies[1]!.id, cell: 495, mode: 'hold' }).ok).toBe(true);
    const routes = structuredClone(game.routes), actors = structuredClone(game.armies), postings = structuredClone(game.postings);
    const commands = groupPatrolAssignment(getObservation(game, game.turnOwnerId), selected, '497', '495', false);
    for (const command of commands) expect(applyCommand(game, command).ok).toBe(true);
    expect(game.routes).toEqual(routes); expect(game.armies).toEqual(actors); expect(game.postings).toEqual(postings);
    for (const [index, army] of armies.entries()) expect(game.patrols.find(patrol => patrol.armyId === army.id)).toMatchObject({
      firstCell: 497, secondCell: 495, enabled: index % 2 === 0, pauseOnWar: false,
      target: game.armies[army.id]!.cell === 497 ? 'second' : 'first', lastAttemptTurn: null, lastError: null,
    });
    expect(serializeGame(deserializeGame(serializeGame(game)))).toBe(serializeGame(game));
  });

  it('submits a caravan-containing selection and retains its canonical refusal alongside accepted patrols', () => {
    const { game, armies, selected } = fixture();
    const caravan = armies.at(-1)!;
    game.armies[caravan.id]!.formations.push(createArmyFormation(`army.${game.nextId++}`, 'unit.colonist'));
    game.armies[caravan.id]!.formations.sort((a, b) => a.id.localeCompare(b.id));
    const commands = groupPatrolAssignment(getObservation(game, game.turnOwnerId), selected, '495', '497', false);
    expect(commands).toHaveLength(5);
    const results = commands.map(command => applyCommand(game, command));
    expect(results.map(result => result.ok)).toEqual([true, true, true, true, false]);
    expect(results.at(-1)?.error).toContain('without caravans');
    expect(game.patrols.some(patrol => patrol.armyId === caravan.id)).toBe(false);
    expect(serializeGame(deserializeGame(serializeGame(game)))).toBe(serializeGame(game));
  });

  it('requires distinct in-world integers, a current patrol observation and a complete bounded selection', () => {
    const { view, selected } = fixture();
    for (const [first, second] of [['', '495'], ['495', ''], ['495', '495'], ['-1', '495'], ['1.5', '495'], ['NaN', '495'], ['495', String(view.width * view.height)]]) {
      expect(groupPatrolAssignment(view, selected, first!, second!, false)).toEqual([]);
    }
    expect(groupPatrolAssignment(view, new Set(), '495', '497', false)).toEqual([]);
    const source = view.armies[0]!;
    view.armies = Array.from({ length: MAX_GROUP_ORDER_COMMANDS + 1 }, (_, index) => ({ ...source, id: `army.assign.${index}` }));
    const oversized = new Set(view.armies.map(army => army.id));
    expect(groupPatrolAssignment(view, oversized, '495', '497', false)).toEqual([]);
    view.armies.pop(); oversized.delete(`army.assign.${MAX_GROUP_ORDER_COMMANDS}`);
    expect(groupPatrolAssignment(view, oversized, '495', '497', false)).toHaveLength(MAX_GROUP_ORDER_COMMANDS);
    delete view.patrols;
    expect(groupPatrolAssignment(view, oversized, '495', '497', false)).toEqual([]);
  });

  it('explains replacement, enabled defaults, common war settings and fresh endpoint choices before assignment', () => {
    const { view, selected } = fixture();
    const own = view.settlements.filter(town => town.factionId === view.factionId);
    const html = renderToStaticMarkup(<GroupPatrolOrders view={view} hash="12345678" selected={selected} matching={selected} busy={false} issue={async () => forbidden()} accepted={forbidden} onPendingChange={forbidden}/>);
    expect(html).toContain('First group patrol point'); expect(html).toContain('Second group patrol point');
    expect(html).toContain('Choose two different hexes inside this world before assigning patrols.');
    expect(html).toContain('Assignment creates new patrols enabled and preserves whether existing patrols are paused.');
    expect(html).toContain('Replacing a patrol resets its next point');
    expect(html).toContain('Existing routes and standing postings remain in place and take priority.');
    expect(html).toContain('This war option replaces the option on every assigned patrol.');
    expect(html).toContain('This replaces 4 existing patrols.');
    expect(html.match(/<option value=""/g)).toHaveLength(2);
    expect(html.match(/<option /g)).toHaveLength(2 + own.length * 2);
    expect(html).toContain('<button class="primary wide" disabled="">Assign patrols (5)</button>');
  });

  it('shows canonical refusals first with skipped-selection accounting and bounded result pages', () => {
    const rows = Array.from({ length: 128 }, (_, index) => ({ armyId: `army.${index}`, name: `Company ${index}`, accepted: index !== 127, message: index === 127 ? 'You do not control that army patrol.' : 'Existing travel continues.' }));
    const html = renderToStaticMarkup(<GroupPatrolResults rows={rows} skipped={2}/>);
    expect(html).toContain('127 patrol orders accepted · 1 refused. Refused armies remain selected for review. 2 unaffected selected armies remain checked.');
    expect(html).toContain('<details open="">');
    expect(html.indexOf('Company 127')).toBeLessThan(html.indexOf('Company 0'));
    expect(html).toContain('You do not control that army patrol.');
    expect(html.match(/<li>/g)).toHaveLength(GROUP_PATROL_PAGE_SIZE);
    expect(html).toContain('Page 1 of 6'); expect(html).toContain('Next patrol results page');
  });
});
