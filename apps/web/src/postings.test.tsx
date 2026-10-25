import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { applyCommand, getObservation, stateHash } from '@theandril/sim';
import { theaterCampaign } from '../../../packages/test-fixtures/src/theater-fixture';
import { ArmyPosting, SettlementMuster } from './postings';

// Retain hook slots while invoking the actual component and its handlers with
// new observations. This is a component contract test, not a browser DOM test.
const hooks = vi.hoisted(() => ({ slots: [] as unknown[], cursor: 0 }));
vi.mock('react', async importOriginal => {
  const original = await importOriginal<typeof import('react')>();
  return { ...original, useState: (initial: unknown) => {
    const index = hooks.cursor++;
    if (!(index in hooks.slots)) hooks.slots[index] = initial;
    return [hooks.slots[index], (value: unknown) => { hooks.slots[index] = value; }];
  } };
});
type Control = ReactElement<{
  children?: ReactNode; value?: string | number; disabled?: boolean; id?: string;
  'aria-describedby'?: string;
  onChange?: (event: { target: { value: string } }) => void; onClick?: () => void;
}>;
function elements(node: ReactNode): Control[] {
  return Children.toArray(node).flatMap(child => isValidElement(child)
    ? [child as Control, ...elements((child as Control).props.children)] : []);
}
function render(component: () => ReactNode) { hooks.cursor = 0; return component(); }
function select(tree: ReactNode) { return elements(tree).find(item => item.type === 'select')!; }
function button(tree: ReactNode, name: string) {
  return elements(tree).find(item => item.type === 'button' && item.props.children === name)!;
}
function scene() {
  const game = theaterCampaign(1), view = getObservation(game, game.turnOwnerId);
  return { game, view, army: view.armies.find(item => item.factionId === view.factionId)!,
    points: view.settlements.filter(item => item.factionId === view.factionId) };
}
beforeEach(() => { hooks.slots = []; hooks.cursor = 0; });

describe('individual posting destination choices', () => {
  it('requires a fresh army destination when a chosen hearth leaves the list', () => {
    const { view, army, points } = scene(), issue = vi.fn();
    let current = view;
    const draw = () => render(() => ArmyPosting({ view: current, army, busy: false, issue }));
    select(draw()).props.onChange!({ target: { value: String(points[0]!.cell) } });
    current = { ...view, settlements: view.settlements.filter(item => item.id !== points[0]!.id) };
    const tree = draw(), target = select(tree), apply = button(tree, 'Post army');
    expect(target.props.value).toBe('');
    expect(apply.props.disabled).toBe(true);
    expect(target.props['aria-describedby']).toBeTruthy();
    expect(renderToStaticMarkup(tree)).toContain('Choose a destination');
    apply.props.onClick!();
    expect(issue).not.toHaveBeenCalled();
    target.props.onChange!({ target: { value: String(points[1]!.cell) } });
    button(draw(), 'Post army').props.onClick!();
    expect(issue).toHaveBeenCalledWith({ type: 'setPosting', factionId: view.factionId, armyId: army.id, cell: points[1]!.cell, mode: 'join' });
  });

  it('requires a fresh muster destination without hiding the existing arbitrary-hex order or its clear action', () => {
    const { game, points } = scene(), issue = vi.fn(), cell = 497;
    expect(applyCommand(game, { type: 'setMuster', factionId: game.turnOwnerId, settlementId: points[0]!.id, cell }).ok).toBe(true);
    const view = getObservation(game, game.turnOwnerId), before = stateHash(game);
    const tree = render(() => SettlementMuster({ view, settlementId: points[0]!.id, busy: false, issue }));
    expect(select(tree).props.value).toBe('');
    expect(button(tree, 'Move muster point').props.disabled).toBe(true);
    expect(select(tree).props['aria-describedby']).toBeTruthy();
    expect(renderToStaticMarkup(tree)).toContain(`hex ${cell}`);
    button(tree, 'Move muster point').props.onClick!();
    expect(issue).not.toHaveBeenCalled();
    expect(button(tree, 'Clear muster point').props.disabled).toBe(false);
    button(tree, 'Clear muster point').props.onClick!();
    expect(issue).toHaveBeenCalledExactlyOnceWith({ type: 'setMuster', factionId: view.factionId, settlementId: points[0]!.id, cell: null });
    expect(stateHash(game)).toBe(before);
  });

  it('does not silently replace a chosen muster hearth when its ownership changes', () => {
    const { view, points } = scene(), issue = vi.fn();
    let current = view;
    const draw = () => render(() => SettlementMuster({ view: current, settlementId: points[1]!.id, busy: false, issue }));
    select(draw()).props.onChange!({ target: { value: String(points[0]!.cell) } });
    current = { ...view, settlements: view.settlements.map(item => item.id === points[0]!.id ? { ...item, factionId: 'foreign' } : item) };
    const tree = draw();
    expect(select(tree).props.value).toBe('');
    expect(button(tree, 'Set muster point').props.disabled).toBe(true);
    button(tree, 'Set muster point').props.onClick!();
    expect(issue).not.toHaveBeenCalled();
  });

  it('resolves an explicit current-position choice against the latest army position', () => {
    const { view, army } = scene(), issue = vi.fn();
    let currentArmy = army;
    const draw = () => render(() => ArmyPosting({ view, army: currentArmy, busy: false, issue }));
    const first = select(draw());
    const current = elements(first).find(item => item.type === 'option' && renderToStaticMarkup(item).includes('Where it stands'))!;
    first.props.onChange!({ target: { value: String(current.props.value) } });
    currentArmy = { ...army, cell: army.cell + 1 };
    const tree = draw();
    expect(select(tree).props.value).toBe('current');
    expect(renderToStaticMarkup(tree)).toContain(`Where it stands · hex ${currentArmy.cell}`);
    button(tree, 'Post army').props.onClick!();
    expect(issue).toHaveBeenCalledExactlyOnceWith({ type: 'setPosting', factionId: view.factionId, armyId: army.id, cell: currentArmy.cell, mode: 'join' });
  });

  it('keeps canonical arbitrary-hex postings visible and clearable while the replacement choice is unresolved', () => {
    const { game, army } = scene(), issue = vi.fn(), cell = 497;
    expect(applyCommand(game, { type: 'setPosting', factionId: game.turnOwnerId, armyId: army.id, cell, mode: 'hold' }).ok).toBe(true);
    const view = getObservation(game, game.turnOwnerId), before = stateHash(game);
    const tree = render(() => ArmyPosting({ view, army, busy: false, issue }));
    expect(select(tree).props.value).toBe('');
    expect(renderToStaticMarkup(tree)).toContain(`hex ${cell}`);
    expect(button(tree, 'Update posting').props.disabled).toBe(true);
    expect(button(tree, 'Clear posting').props.disabled).toBe(false);
    button(tree, 'Clear posting').props.onClick!();
    expect(issue).toHaveBeenCalledExactlyOnceWith({ type: 'setPosting', factionId: view.factionId, armyId: army.id, cell, mode: 'none' });
    expect(stateHash(game)).toBe(before);
  });

  it('keeps a fixed hearth destination when the army moves, including hex zero', () => {
    const { view, army, points } = scene(), issue = vi.fn();
    const current = { ...view, settlements: [{ ...points[0]!, cell: 0 }] };
    let currentArmy = army;
    const draw = () => render(() => ArmyPosting({ view: current, army: currentArmy, busy: false, issue }));
    select(draw()).props.onChange!({ target: { value: '0' } });
    currentArmy = { ...army, cell: army.cell + 1 };
    expect(select(draw()).props.value).toBe(0);
    button(draw(), 'Post army').props.onClick!();
    expect(issue).toHaveBeenCalledExactlyOnceWith({ type: 'setPosting', factionId: view.factionId, armyId: army.id, cell: 0, mode: 'join' });
  });

  it('does not reinterpret a saved fixed hearth as current position when both initially coincide', () => {
    const { game, army, points } = scene(), issue = vi.fn(), cell = points[0]!.cell;
    expect(applyCommand(game, { type: 'setPosting', factionId: game.turnOwnerId, armyId: army.id, cell, mode: 'hold' }).ok).toBe(true);
    const view = getObservation(game, game.turnOwnerId);
    let currentArmy = { ...army, cell };
    const draw = () => render(() => ArmyPosting({ view, army: currentArmy, busy: false, issue }));
    expect(select(draw()).props.value).toBe(cell);
    currentArmy = { ...army, cell: cell + 1 };
    expect(select(draw()).props.value).toBe(cell);
    button(draw(), 'Update posting').props.onClick!();
    expect(issue).toHaveBeenCalledExactlyOnceWith({ type: 'setPosting', factionId: view.factionId, armyId: army.id, cell, mode: 'hold' });
  });

  it('distinguishes a blank muster choice from an explicitly selected hex zero', () => {
    const { view, points } = scene(), issue = vi.fn();
    const current = { ...view, settlements: [{ ...points[0]!, cell: 0 }] };
    const draw = () => render(() => SettlementMuster({ view: current, settlementId: points[0]!.id, busy: false, issue }));
    select(draw()).props.onChange!({ target: { value: '' } });
    const unresolved = draw(), description = select(unresolved).props['aria-describedby'];
    expect(description).toBeTruthy();
    expect(elements(unresolved).some(item => item.props.id === description)).toBe(true);
    expect(button(unresolved, 'Set muster point').props.disabled).toBe(true);
    button(unresolved, 'Set muster point').props.onClick!();
    expect(issue).not.toHaveBeenCalled();
    select(unresolved).props.onChange!({ target: { value: '0' } });
    button(draw(), 'Set muster point').props.onClick!();
    expect(issue).toHaveBeenCalledExactlyOnceWith({ type: 'setMuster', factionId: view.factionId, settlementId: points[0]!.id, cell: 0 });
  });

  it('keeps clearing a saved muster available even when the choice list is empty', () => {
    const { game, points } = scene(), issue = vi.fn();
    expect(applyCommand(game, { type: 'setMuster', factionId: game.turnOwnerId, settlementId: points[0]!.id, cell: 497 }).ok).toBe(true);
    const view = { ...getObservation(game, game.turnOwnerId), settlements: [] };
    const tree = render(() => SettlementMuster({ view, settlementId: points[0]!.id, busy: false, issue }));
    expect(select(tree).props.value).toBe('');
    expect(button(tree, 'Move muster point').props.disabled).toBe(true);
    button(tree, 'Clear muster point').props.onClick!();
    expect(issue).toHaveBeenCalledExactlyOnceWith({ type: 'setMuster', factionId: view.factionId, settlementId: points[0]!.id, cell: null });
  });

  it('preserves busy locking for applying and clearing both forms', () => {
    const { game, army, points } = scene(), issue = vi.fn();
    applyCommand(game, { type: 'setPosting', factionId: game.turnOwnerId, armyId: army.id, cell: points[0]!.cell, mode: 'hold' });
    applyCommand(game, { type: 'setMuster', factionId: game.turnOwnerId, settlementId: points[0]!.id, cell: points[0]!.cell });
    const view = getObservation(game, game.turnOwnerId);
    const trees = [render(() => ArmyPosting({ view, army, busy: true, issue }))];
    hooks.slots = [];
    trees.push(render(() => SettlementMuster({ view, settlementId: points[0]!.id, busy: true, issue })));
    for (const tree of trees) for (const control of elements(tree).filter(item => item.type === 'button' || item.type === 'select')) {
      expect(control.props.disabled).toBe(true);
      if (control.type === 'button') control.props.onClick!();
    }
    expect(issue).not.toHaveBeenCalled();
  });
});
