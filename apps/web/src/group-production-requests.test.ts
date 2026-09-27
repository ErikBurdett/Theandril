import { expect, it } from 'vitest';
import { assertProductionResults, GroupProductionRequests } from './group-production-requests';

const plan = { factionId: 'faction.1', settlementIds: ['town.1', 'town.2'], itemIds: ['building.granary', 'unit.spear'] };
const complete = () => plan.settlementIds.map(settlementId => ({ settlementId, orders: plan.itemIds.map(itemId => ({ itemId, accepted: true })) }));
it('requires every submitted hearth and ordered step, allowing only a terminal refusal prefix', () => {
  expect(() => assertProductionResults(complete(), plan)).not.toThrow();
  const refused = complete(); refused[0]!.orders = [{ itemId: plan.itemIds[0]!, accepted: false, message: 'Not enough coin.' } as typeof refused[0]['orders'][0]];
  expect(() => assertProductionResults(refused, plan)).not.toThrow();
  const invalid = [undefined, null, [], [complete()[0]], [...complete()].reverse(),
    [{ ...complete()[0], orders: [] }, complete()[1]],
    [{ ...complete()[0], orders: [complete()[0]!.orders[0]] }, complete()[1]],
    [{ ...complete()[0], orders: [{ itemId: 'unit.other', accepted: true }, complete()[0]!.orders[1]] }, complete()[1]],
    [{ ...complete()[0], orders: [{ itemId: plan.itemIds[0], accepted: false }, complete()[0]!.orders[1]] }, complete()[1]],
    [{ ...complete()[0], orders: [{ itemId: plan.itemIds[0], accepted: false, message: 'Refused' }, complete()[0]!.orders[1]] }, complete()[1]],
    [{ ...complete()[0], orders: [null] }, complete()[1]],
    [{ ...complete()[0], extra: true }, complete()[1]],
    [{ ...complete()[0], orders: [{ itemId: plan.itemIds[0], accepted: false, message: null }] }, complete()[1]]];
  for (const value of invalid) expect(() => assertProductionResults(value, plan)).toThrow('does not match');
});

it('snapshots submitted IDs and ignores unrelated or old responses across resets', async () => {
  const requests = new GroupProductionRequests();
  const input = { ...plan, settlementIds: [...plan.settlementIds].reverse(), itemIds: [...plan.itemIds] };
  const first = requests.enqueue(1, input); const refused = expect(first).rejects.toThrow('Restore');
  input.itemIds[0] = 'changed'; input.settlementIds.reverse();
  expect(() => requests.validate(1, plan.factionId, complete(), undefined)).not.toThrow();
  expect(() => requests.validate(1, 'faction.foreign', complete(), undefined)).toThrow('does not match');
  await expect(requests.enqueue(2, plan)).rejects.toThrow('Wait');
  requests.finish(99, complete()); expect(requests.busy).toBe(true);
  requests.reset('Restore the campaign.'); await refused; expect(requests.busy).toBe(false);
  const next = requests.enqueue(3, plan);
  requests.finish(1, complete()); expect(requests.has(3)).toBe(true);
  expect(() => requests.validate(1, plan.factionId, null, undefined)).not.toThrow();
  requests.validate(3, plan.factionId, complete(), undefined); requests.finish(3, complete());
  await expect(next).resolves.toEqual(complete()); expect(requests.busy).toBe(false);
});

it('permits an explicit recovery error without interpreting uncertain partial results as success', async () => {
  const requests = new GroupProductionRequests();
  const pending = requests.enqueue(1, plan); const rejection = expect(pending).rejects.toThrow('Recording');
  expect(() => requests.validate(1, plan.factionId, undefined, 'Recording failed. Restore.')).not.toThrow();
  expect(() => requests.validate(1, plan.factionId, complete(), {})).toThrow('does not match');
  requests.finish(1, new Error('Recording failed. Restore.')); await rejection;
});
