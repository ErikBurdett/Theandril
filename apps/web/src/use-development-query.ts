import { useCallback, useEffect, useRef, useState } from 'react';
import type { DevelopmentEntityView, DevelopmentFocus } from '@theandril/sim';

export interface DevelopmentQueryResult { focus: DevelopmentFocus; hash: string; entity: DevelopmentEntityView | null }
export type DevelopmentQuery = (focus: DevelopmentFocus) => Promise<DevelopmentQueryResult>;
export interface DevelopmentQueryKey { focus: DevelopmentFocus; hash: string; epoch: number }
export interface DevelopmentQueryState {
  key?: DevelopmentQueryKey;
  status: 'idle' | 'loading' | 'ready' | 'error';
  entity: DevelopmentEntityView | null;
  error: string;
}
const idle: DevelopmentQueryState = { status: 'idle', entity: null, error: '' };
export const sameDevelopmentFocus = (a: DevelopmentFocus | undefined | null, b: DevelopmentFocus | undefined | null): boolean => Boolean(a && b && a.scope === b.scope && a.entityId === b.entityId);
const sameKey = (a: DevelopmentQueryKey | undefined, b: DevelopmentQueryKey): boolean => sameDevelopmentFocus(a?.focus, b.focus) && a?.hash === b.hash && a.epoch === b.epoch;

/** One selected subject, never an accumulating cache of company/hearth quotes. */
export class DevelopmentQuerySession {
  private revision = 0;
  state: DevelopmentQueryState = idle;
  invalidate(): void { this.revision++; this.state = idle; }
  async load(key: DevelopmentQueryKey, query: DevelopmentQuery, publish: (state: DevelopmentQueryState) => void): Promise<void> {
    const revision = ++this.revision;
    const update = (state: DevelopmentQueryState) => { this.state = state; publish(state); };
    update({ key, status: 'loading', entity: null, error: '' });
    try {
      const result = await query(key.focus);
      if (revision !== this.revision) return;
      if (result.hash !== key.hash || !sameDevelopmentFocus(result.focus, key.focus) || result.entity && !sameDevelopmentFocus(result.entity, key.focus)) throw new Error('The campaign or selected subject changed. Review development again for current costs.');
      update({ key, status: 'ready', entity: result.entity, error: '' });
    } catch (cause) {
      if (revision !== this.revision) return;
      update({ key, status: 'error', entity: null, error: cause instanceof Error ? cause.message : String(cause) });
    }
  }
}

export function useDevelopmentQuery({ focus, hash, epoch, query, enabled = true }: { focus: DevelopmentFocus | null; hash: string; epoch: number; query?: DevelopmentQuery; enabled?: boolean }) {
  const session = useRef<DevelopmentQuerySession | null>(null);
  session.current ??= new DevelopmentQuerySession();
  const [state, setState] = useState<DevelopmentQueryState>(idle), [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt(value => value + 1), []);
  const scope = focus?.scope, entityId = focus?.entityId;
  useEffect(() => {
    const current = session.current!;
    if (query && enabled && scope && entityId) void current.load({ focus: { scope, entityId }, hash, epoch }, query, setState);
    return () => current.invalidate();
  }, [scope, entityId, hash, epoch, query, enabled, attempt]);
  // Hide prior prices during render, before effect cleanup or the new response.
  const current = !enabled || !focus ? idle : sameKey(state.key, { focus, hash, epoch }) ? state : { ...idle, status: 'loading' as const };
  return { ...current, retry };
}
