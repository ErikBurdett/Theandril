import { expect, it } from 'vitest';
import { assertSelectionGroupResponse } from './selection-group-response';

it('rejects missing, foreign and malformed saved-group responses before they reach React', () => {
  const valid = { id: 'selection-group.1', factionId: 'faction.1', kind: 'armies', name: 'Border watch', memberIds: ['army.1'] };
  for (const value of [undefined, null, {}, [null], [{ ...valid, memberIds: null }], [{ ...valid, name: null }],
    [{ ...valid, kind: 'fleets' }], [{ ...valid, factionId: 'faction.2' }], [valid, valid],
    [{ ...valid, memberIds: ['army.1', 'army.1'] }], Array.from({ length: 25 }, (_, i) => ({ ...valid, id: `selection-group.${i + 1}` }))]) {
    expect(() => assertSelectionGroupResponse(value, 'faction.1')).toThrow('saved group update');
  }
  expect(() => assertSelectionGroupResponse([], 'faction.1')).not.toThrow();
  expect(() => assertSelectionGroupResponse([valid, { ...valid, id: 'selection-group.2', kind: 'settlements', memberIds: [] }], 'faction.1')).not.toThrow();
});
