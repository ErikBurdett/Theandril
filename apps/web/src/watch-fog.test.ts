import { describe, expect, it } from 'vitest';
import { WatchFogRequests } from './watch-fog';

describe('spectator presentation request lifecycle', () => {
  it('orders rapid toggles using desired state, not a stale displayed flag', async () => {
    const requests = new WatchFogRequests();
    const first = requests.enqueue(1, !requests.desired);
    const second = requests.enqueue(2, !requests.desired);
    expect(requests.desired).toBe(true);
    expect(requests.accept(false, 2)).toBe(true);
    requests.finish(1, { enabled: false, hash: 'same-hash' });
    expect(requests.desired).toBe(true);
    expect(requests.accept(true, 3)).toBe(true);
    requests.finish(2, { enabled: true, hash: 'same-hash' });
    await expect(first).resolves.toEqual({ enabled: false, hash: 'same-hash' });
    await expect(second).resolves.toEqual({ enabled: true, hash: 'same-hash' });
    expect(requests.size).toBe(0);
    expect(requests.accept(false, 2)).toBe(false);
    expect(requests.enabled).toBe(true);
  });

  it('rejects pending requests and clears the presentation epoch on campaign reset', async () => {
    const requests = new WatchFogRequests(); requests.accept(false, 12);
    const pending = requests.enqueue(7, true);
    const rejected = expect(pending).rejects.toThrow('changed');
    requests.reset('The campaign changed.');
    await rejected;
    expect(requests.has(7)).toBe(false);
    expect(requests.enabled).toBe(true);
    expect(requests.accept(true, 1)).toBe(true);
  });

  it('restores the current desired state after a failed request', async () => {
    const requests = new WatchFogRequests();
    const pending = requests.enqueue(1, false);
    const rejected = expect(pending).rejects.toThrow('watch only');
    requests.finish(1, new Error('watch only'));
    await rejected;
    expect(requests.desired).toBe(true);
  });
});
