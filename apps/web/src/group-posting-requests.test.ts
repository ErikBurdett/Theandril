import { expect, it } from 'vitest';
import { GroupPostingRequests } from './group-posting-requests';

it('correlates group results without allowing another submission or accepting unrelated replies', async () => {
  const requests = new GroupPostingRequests();
  const pending = requests.enqueue(1);
  expect(requests.has(1)).toBe(true);
  expect(requests.has(2)).toBe(false);
  await expect(requests.enqueue(2)).rejects.toThrow('Wait');
  requests.finish(2, []);
  expect(requests.busy).toBe(true);
  const results = [{ armyId: 'army.1', accepted: false, message: 'No such army.' }];
  requests.finish(1, results);
  await expect(pending).resolves.toEqual(results);
  expect(requests.busy).toBe(false);
  expect(requests.has(1)).toBe(false);
});

it('rejects interrupted work and ignores its delayed response after a new request', async () => {
  const requests = new GroupPostingRequests();
  const old = requests.enqueue(7);
  const rejected = expect(old).rejects.toThrow('campaign changed');
  requests.reset('The campaign changed.');
  await rejected;
  const next = requests.enqueue(8);
  requests.finish(7, []);
  expect(requests.busy).toBe(true);
  const failed = expect(next).rejects.toThrow('worker stopped');
  requests.finish(8, new Error('The worker stopped.'));
  await failed;
  expect(requests.busy).toBe(false);
});
