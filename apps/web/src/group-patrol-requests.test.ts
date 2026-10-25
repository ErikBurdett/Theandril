import { expect, it } from 'vitest';
import { assertGroupPatrolResults, GroupPatrolRequests } from './group-patrol-requests';
import type { GroupPatrolCommand } from './protocol';

const plan = { factionId: 'faction.1', armyIds: ['army.1', 'army.2'] };
const results = () => plan.armyIds.map(armyId => ({ armyId, accepted: true }));
const commands = (): GroupPatrolCommand[] => plan.armyIds.map(armyId => ({ type: 'setPatrolEnabled', factionId: plan.factionId, armyId, enabled: true }));

it('requires one correctly ordered result for every submitted army and explains each refusal', () => {
  expect(() => assertGroupPatrolResults(results(), plan.armyIds)).not.toThrow();
  expect(() => assertGroupPatrolResults([results()[0], { armyId: 'army.2', accepted: false, message: 'This army has no saved patrol.' }], plan.armyIds)).not.toThrow();
  for (const value of [undefined, [], [results()[0]], [...results(), { armyId: 'army.3', accepted: true }], results().reverse(), [results()[0], results()[0]], [null, results()[1]],
    [{ ...results()[0], accepted: 'yes' }, results()[1]], [{ ...results()[0], extra: true }, results()[1]],
    [{ ...results()[0], accepted: false }, results()[1]], [{ ...results()[0], accepted: false, message: '' }, results()[1]]]) {
    expect(() => assertGroupPatrolResults(value, plan.armyIds)).toThrow('Some patrol policies may have changed');
  }
});

it('snapshots submitted orders, correlates the faction, and isolates later batches from old replies', async () => {
  const ledger = new GroupPatrolRequests(), orders = commands().reverse();
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
  const ledger = new GroupPatrolRequests(), pending = ledger.enqueue(1, commands());
  const rejection = expect(pending).rejects.toThrow('Recording');
  expect(() => ledger.validate(1, plan.factionId, [], 'Recording failed; restore.')).not.toThrow();
  expect(() => ledger.validate(1, plan.factionId, results(), {})).toThrow('does not match');
  ledger.finish(1, new Error('Recording failed; restore.')); await rejection;
});

