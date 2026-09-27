import { describe, expect, it } from 'vitest';
import { applyCommand, getObservation, type TheaterCommand } from '@theandril/sim';
import { theaterCampaign } from '../../../packages/test-fixtures/src/theater-fixture';
import { assertTheaterApplied, assertTheaterResponse } from './theater-response';
function example() {
  const state = theaterCampaign();
  const command: TheaterCommand = { type: 'setTheater', factionId: state.turnOwnerId, name: 'Watch', settlementIds: Object.keys(state.settlements), armyIds: Object.keys(state.armies), reserveCell: 495, guardsPerSettlement: 1, enabled: true };
  expect(applyCommand(state, command).ok).toBe(true);
  return { command, factionId: state.turnOwnerId, theaters: getObservation(state, state.turnOwnerId).theaters! };
}
describe('defensive theater worker response boundary', () => {
  it('accepts detached canonical reports and matches submitted config independent of selection order', () => {
    const { theaters, factionId, command } = example();
    expect(() => assertTheaterResponse(theaters, factionId)).not.toThrow();
    expect(() => assertTheaterApplied(theaters, { ...command, armyIds: [...command.armyIds].reverse() })).not.toThrow();
    expect(() => assertTheaterResponse(undefined, factionId)).toThrow();
    expect(() => assertTheaterApplied(undefined, command)).toThrow('missing');
  });
  it('rejects malformed, oversized, foreign, duplicate and mismatched nested reports', () => {
    const { theaters, factionId } = example();
    const first = theaters[0]!;
    for (const bad of [null, {}, Array(1), Array(9).fill(first), [first, first], [{ ...first, factionId: 'foreign' }], [{ ...first, members: [] }], [{ ...first, hearths: [] }], [{ ...first, missingGuards: -1 }], [{ ...first, members: [{ ...first.members[0], status: 'fabricated' }] }], [{ ...first, lastDispatches: Array(17).fill({ armyId: 'army.1', targetCell: 1, accepted: true, message: 'x' }) }]]) {
      expect(() => assertTheaterResponse(bad, factionId)).toThrow();
    }
  });
  it('refuses a valid response that does not actually reflect the requested create/edit/delete', () => {
    const { theaters, command } = example();
    for (const bad of [{ ...command, name: 'Different' }, { ...command, enabled: false }, { ...command, reserveCell: 500 }, { ...command, guardsPerSettlement: 2 }, { ...command, armyIds: [] }, { ...command, theaterId: 'theater.9' }]) expect(() => assertTheaterApplied(theaters, bad)).toThrow();
    expect(() => assertTheaterApplied(theaters, { type: 'deleteTheater', factionId: command.factionId, theaterId: theaters[0]!.id })).toThrow();
    expect(() => assertTheaterApplied([], { type: 'deleteTheater', factionId: command.factionId, theaterId: theaters[0]!.id })).not.toThrow();
  });
});
