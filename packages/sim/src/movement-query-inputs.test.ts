import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createArmyFormation, deserializeGame, getMovementQuery, serializeGame } from './index';
import { queueMovement } from './movement';
import { withRules } from './rules';
import { canonicalCorpus } from '../../../docs/development/2026-09-21-verification-cost/movement/canonical-corpus';
import baseline from '../../../docs/development/2026-09-21-verification-cost/movement/canonical-before.json';
import { previewCorpus } from '../../../docs/development/2026-09-21-campaign-continuation/movement-preview/corpus';

describe('movement query inputs preserve original canonical route planning', () => {
  const cases = canonicalCorpus();
  it.each(cases)('$name keeps its complete result, route and canonical state', item => {
    const expected = baseline.entries.find(entry => entry.name === item.name)!;
    const result = withRules(item.state, item.version, () => queueMovement(item.state, item.factionId, item.armyId, item.target));
    expect(result).toStrictEqual(expected.result);
    expect(item.state.routes[item.armyId] ?? null).toStrictEqual(expected.route);
    expect(createHash('sha256').update(serializeGame(item.state)).digest('hex')).toBe(expected.stateSha256);
    expect(serializeGame(deserializeGame(serializeGame(item.state)))).toBe(serializeGame(item.state));
  });

  it('recomputes fleet capabilities and historical rules on every new canonical query', () => {
    const item = canonicalCorpus().find(entry => entry.name === 'coastal-v17')!;
    const { state, armyId, factionId, target } = item;
    const queue = () => queueMovement(state, factionId, armyId, target);
    expect(queue()).toMatchObject({ ok: false, error: expect.stringContaining('Deep ocean') });
    state.progression[factionId]!.technologies.push('technology.ocean_navigation');
    expect(queue()).toMatchObject({ ok: true });
    const route = structuredClone(state.routes[armyId]);
    const coastal = createArmyFormation(`army.${state.nextId++}`, 'unit.coastal_warship');
    state.armies[armyId]!.formations.push(coastal);
    expect(queue()).toMatchObject({ ok: false, error: expect.stringContaining('Deep ocean') });
    expect(state.routes[armyId]).toStrictEqual(route);
    state.armies[armyId]!.formations = state.armies[armyId]!.formations.filter(formation => formation !== coastal);
    expect(withRules(state, 7, queue)).toMatchObject({ ok: false, error: 'Water and mountains are impassable to these armies.' });
    expect(queue()).toMatchObject({ ok: true });
    state.armies[armyId]!.formations = [createArmyFormation(armyId, 'unit.guard')];
    expect(queue()).toMatchObject({ ok: false, error: expect.stringContaining('Water and mountains') });
  });

  it('preserves copied geography and last-truthy-road behavior when indexing duplicate observed cells', () => {
    const item = previewCorpus().find(entry => entry.name === 'road-route')!;
    const view = structuredClone(item.view), origin = view.armies[0]!.cell;
    const first = view.cells.find(cell => cell.cell === origin)!;
    expect(first.roadMask).toBeTruthy();
    view.cells.push({ ...first, terrain: 1, roadMask: 0 });
    const equivalent = structuredClone(item.view);
    equivalent.cells.find(cell => cell.cell === origin)!.terrain = 1;
    const expected = getMovementQuery(equivalent, item.armyId, item.target);
    expect(getMovementQuery(view, item.armyId, item.target)).toStrictEqual(expected);
    for (const cell of view.cells) { cell.terrain = 4; cell.waterDepth = 0; cell.roadMask = 0; }
    expect(getMovementQuery(view, item.armyId, item.target)).toStrictEqual(expected);
    expect(getMovementQuery(structuredClone(view), item.armyId, item.target)).not.toStrictEqual(expected);
  });
});
