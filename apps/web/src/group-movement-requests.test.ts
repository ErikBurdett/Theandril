import { expect, it } from 'vitest';
import { assertGroupMovementResults, assertGroupMovementReview, GroupMovementPreviewRequests, GroupMovementRequests } from './group-movement-requests';
import type { GroupMovementCommand, GroupMovementReview } from './protocol';

const plan = { factionId: 'faction.1', armyIds: ['army.1', 'army.2'], target: 20, append: false };
const review = (): GroupMovementReview => ({ hash: 'abc12345', target: 20, append: false, results: plan.armyIds.map(armyId => ({ armyId, target: 20, cost: 3, steps: 3, canQueue: true, blocker: null, limited: false, expandedNodes: 4 })) });
const results = () => plan.armyIds.map(armyId => ({ armyId, accepted: true }));
const commands = (): GroupMovementCommand[] => plan.armyIds.map(armyId => ({ type: 'queueMovement', factionId: plan.factionId, armyId, target: plan.target, append: false }));

it('requires one correctly ordered result for every submitted army and explains each refusal', () => {
  expect(() => assertGroupMovementResults(results(), plan.armyIds)).not.toThrow();
  expect(() => assertGroupMovementResults([results()[0], { armyId: 'army.2', accepted: false, message: 'Cancel the active character mission.' }], plan.armyIds)).not.toThrow();
  for (const value of [undefined, [], [results()[0]], results().reverse(), [results()[0], results()[0]], [null, results()[1]],
    [{ ...results()[0], accepted: 'yes' }, results()[1]], [{ ...results()[0], extra: true }, results()[1]],
    [{ ...results()[0], accepted: false }, results()[1]], [{ ...results()[0], accepted: false, message: '' }, results()[1]]]) {
    expect(() => assertGroupMovementResults(value, plan.armyIds)).toThrow('Some armies may have moved');
  }
});

it('snapshots submitted orders, correlates the faction, and isolates later batches from old replies', async () => {
  const ledger = new GroupMovementRequests(), orders = commands().reverse();
  const pending = ledger.enqueue(1, orders), rejection = expect(pending).rejects.toThrow('Restore');
  orders[0]!.armyId = 'army.changed';
  expect(() => ledger.validate(1, plan.factionId, results(), undefined)).not.toThrow();
  expect(() => ledger.validate(1, 'faction.2', results(), undefined)).toThrow('does not match');
  await expect(ledger.enqueue(2, commands())).rejects.toThrow('Wait');
  ledger.finish(9, results()); expect(ledger.busy).toBe(true);
  ledger.reset('Restore the campaign.'); await rejection;
  const next = ledger.enqueue(3, commands());
  ledger.finish(1, results()); expect(ledger.has(3)).toBe(true);
  ledger.validate(3, plan.factionId, results(), undefined); ledger.finish(3, results());
  await expect(next).resolves.toEqual(results());
});

it('accepts explicit uncertain-order recovery without interpreting partial rows', async () => {
  const ledger = new GroupMovementRequests(), pending = ledger.enqueue(1, commands());
  const rejection = expect(pending).rejects.toThrow('Recording');
  expect(() => ledger.validate(1, plan.factionId, [], 'Recording failed; restore.')).not.toThrow();
  expect(() => ledger.validate(1, plan.factionId, results(), {})).toThrow('does not match');
  ledger.finish(1, new Error('Recording failed; restore.')); await rejection;
});

it('discards stale or malformed reviews without widening the query into paths or map state', () => {
  expect(() => assertGroupMovementReview(review(), plan, 'abc12345', 'abc12345')).not.toThrow();
  const row = review().results[0]!;
  const invalid = [undefined, { ...review(), hash: 'other' }, { ...review(), target: 21 }, { ...review(), append: true },
    { ...review(), results: [] }, { ...review(), results: review().results.reverse() },
    ...[{ ...row, path: [1, 2, 20] }, { ...row, cost: NaN }, { ...row, steps: 257 }, { ...row, expandedNodes: 4097 },
      { ...row, canQueue: false, blocker: null }, { ...row, limited: 'no' }].map(value => ({ ...review(), results: [value, review().results[1]] }))];
  for (const value of invalid) expect(() => assertGroupMovementReview(value, plan, 'abc12345', 'abc12345')).toThrow('Review');
  expect(() => assertGroupMovementReview(review(), plan, 'abc12345', 'changed')).toThrow('Review');
});

it('settles read-only failures and resets without consuming a subsequent review', async () => {
  const ledger = new GroupMovementPreviewRequests(), input = { ...plan, armyIds: [...plan.armyIds] };
  const first = ledger.enqueue(1, input, 'abc12345'); input.armyIds[0] = 'changed';
  await expect(ledger.enqueue(2, plan, 'abc12345')).rejects.toThrow('Wait');
  expect(ledger.finish(1, review(), 'abc12345')).toBe(true); await expect(first).resolves.toEqual(review());
  const stale = ledger.enqueue(3, plan, 'abc12345'), rejection = expect(stale).rejects.toThrow('out of date');
  expect(ledger.finish(3, review(), 'changed')).toBe(false); await rejection;
  const interrupted = ledger.enqueue(4, plan, 'abc12345'), reset = expect(interrupted).rejects.toThrow('Closed');
  ledger.reset('Closed view.'); await reset;
  const next = ledger.enqueue(5, plan, 'abc12345');
  expect(ledger.finish(4, review(), 'abc12345')).toBe(false); expect(ledger.busy).toBe(true);
  ledger.finish(5, review(), 'abc12345'); await expect(next).resolves.toEqual(review());
});
