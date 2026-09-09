import { describe, expect, it } from 'vitest';
import { DevelopmentQuerySession, type DevelopmentQueryKey, type DevelopmentQueryResult, type DevelopmentQueryState } from './use-development-query';

const key: DevelopmentQueryKey = { focus: { scope: 'formation', entityId: 'formation.1' }, hash: 'hash.1', epoch: 1 };
const response = (value = key): DevelopmentQueryResult => ({ focus: value.focus, hash: value.hash, entity: null });
function deferred() {
  let resolve!: (value: DevelopmentQueryResult) => void, reject!: (cause: Error) => void;
  const promise = new Promise<DevelopmentQueryResult>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
describe('selected development query lifecycle', () => {
  it('switches scope and company without retaining an old price or enabling a stale response', async () => {
    const session = new DevelopmentQuerySession(), first = deferred(), second = deferred(), states: DevelopmentQueryState[] = [];
    const a = session.load(key, () => first.promise, state => states.push(state));
    const next = { ...key, focus: { scope: 'hearth' as const, entityId: 'hearth.2' } };
    const b = session.load(next, () => second.promise, state => states.push(state));
    expect(session.state).toMatchObject({ key: next, status: 'loading', entity: null });
    second.resolve(response(next)); await b; first.resolve(response()); await a;
    expect(states.map(state => `${state.key?.focus.entityId}:${state.status}`)).toEqual(['formation.1:loading', 'hearth.2:loading', 'hearth.2:ready']);
  });
  it('invalidates same-turn purchases, reloads and late worker errors before accepting new quotes', async () => {
    const session = new DevelopmentQuerySession(), old = deferred(), current = deferred();
    const a = session.load(key, () => old.promise, () => undefined);
    session.invalidate();
    const next = { ...key, hash: 'paid-order-hash', epoch: 2 };
    const b = session.load(next, () => current.promise, () => undefined);
    old.reject(new Error('old worker failed')); await a;
    expect(session.state).toMatchObject({ key: next, status: 'loading', error: '', entity: null });
    current.resolve(response(next)); await b; expect(session.state.status).toBe('ready');
    session.invalidate(); expect(session.state).toMatchObject({ status: 'idle', entity: null });
  });
  it.each([
    { ...response(), hash: 'different' },
    { ...response(), focus: { scope: 'hearth', entityId: key.focus.entityId } },
    { ...response(), entity: { scope: 'formation', entityId: 'foreign' } },
  ])('rejects a response with mismatched identity or canonical hash', async value => {
    const session = new DevelopmentQuerySession();
    await session.load(key, async () => value as DevelopmentQueryResult, () => undefined);
    expect(session.state).toMatchObject({ status: 'error', entity: null });
    expect(session.state.error).toContain('Review development again');
  });
  it('retries a failed request without mutating or accumulating subject records', async () => {
    const session = new DevelopmentQuerySession();
    await session.load(key, async () => { throw new Error('Worker unavailable'); }, () => undefined);
    expect(session.state.error).toBe('Worker unavailable');
    await session.load(key, async () => response(), () => undefined);
    expect(session.state).toMatchObject({ key, status: 'ready', entity: null, error: '' });
  });
});
