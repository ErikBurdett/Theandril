import { describe, expect, it } from 'vitest';
import { LandQuerySession, type LandQueryKey, type LandQueryResult, type LandQueryState } from './use-land-query';

function deferred() {
  let resolve!: (value: LandQueryResult) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<LandQueryResult>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const key: LandQueryKey = { settlementId: 'town.1', hash: 'hash.1', epoch: 1 };
const response = (value = key): LandQueryResult => ({ settlementId: value.settlementId, hash: value.hash, town: null });

describe('one selected-town detail session', () => {
  it('ignores a late reply after switching towns, even when requests finish backwards', async () => {
    const session = new LandQuerySession(), old = deferred(), next = deferred(), states: LandQueryState[] = [];
    const first = session.load(key, () => old.promise, state => states.push(state));
    const other = { ...key, settlementId: 'town.2' };
    const second = session.load(other, () => next.promise, state => states.push(state));
    next.resolve(response(other)); await second;
    old.resolve(response()); await first;
    expect(states.map(state => `${state.key?.settlementId}:${state.status}`)).toEqual(['town.1:loading', 'town.2:loading', 'town.2:ready']);
    expect(session.state.key).toEqual(other);
  });

  it('drops old quotes immediately on a same-turn hash change and ignores the stale error', async () => {
    const session = new LandQuerySession(), old = deferred(), next = deferred();
    const first = session.load(key, () => old.promise, () => undefined);
    const changed = { ...key, hash: 'paid-order-hash' };
    const second = session.load(changed, () => next.promise, () => undefined);
    expect(session.state).toMatchObject({ status: 'loading', town: null, error: '', key: changed });
    old.reject(new Error('old worker failure')); await first;
    expect(session.state.status).toBe('loading');
    next.resolve(response(changed)); await second;
    expect(session.state.status).toBe('ready');
  });

  it('ignores a reply after unmount/reset even if the next campaign has the same hash and town ID', async () => {
    const session = new LandQuerySession(), old = deferred(), next = deferred();
    const first = session.load(key, () => old.promise, () => undefined);
    session.invalidate();
    const reset = { ...key, epoch: key.epoch + 1 };
    const second = session.load(reset, () => next.promise, () => undefined);
    old.resolve(response()); await first;
    expect(session.state).toMatchObject({ status: 'loading', key: reset });
    next.resolve(response(reset)); await second;
    session.invalidate(); expect(session.state).toMatchObject({ status: 'idle', town: null });
  });

  it.each([{ ...response(), hash: 'different' }, { ...response(), settlementId: 'foreign' }, { ...response(), town: { settlementId: 'foreign' } }])('rejects a mismatched response rather than enabling another quote', async result => {
    const session = new LandQuerySession();
    await session.load(key, async () => result as LandQueryResult, () => undefined);
    expect(session.state).toMatchObject({ status: 'error', town: null });
    expect(session.state.error).toContain('Retry land details');
  });

  it('has an explicit recoverable error and replaces it when the same query is retried', async () => {
    const session = new LandQuerySession();
    await session.load(key, async () => { throw new Error('Worker unavailable'); }, () => undefined);
    expect(session.state).toMatchObject({ status: 'error', error: 'Worker unavailable' });
    await session.load(key, async () => response(), () => undefined);
    expect(session.state).toMatchObject({ status: 'ready', error: '', town: null });
  });
});
