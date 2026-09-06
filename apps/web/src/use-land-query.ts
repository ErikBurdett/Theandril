import { useCallback, useEffect, useRef, useState } from 'react';
import type { Observation } from '@theandril/sim';

export type LandTown = Observation['land']['settlements'][number];
export interface LandQueryResult { settlementId: string; hash: string; town: LandTown | null }
export type LandQuery = (settlementId: string) => Promise<LandQueryResult>;
export interface LandQueryKey { settlementId: string; hash: string; epoch: number }
export interface LandQueryState {
  key?: LandQueryKey;
  status: 'idle' | 'loading' | 'ready' | 'error';
  town: LandTown | null;
  error: string;
}
const idle: LandQueryState = { status: 'idle', town: null, error: '' };
const sameKey = (a: LandQueryKey | undefined, b: LandQueryKey) => a?.settlementId === b.settlementId && a.hash === b.hash && a.epoch === b.epoch;

/** One detached selected-town result; replaced, never accumulated across towns. */
export class LandQuerySession {
  private revision = 0;
  state: LandQueryState = idle;

  invalidate(): void { this.revision++; this.state = idle; }

  async load(key: LandQueryKey, query: LandQuery, publish: (state: LandQueryState) => void): Promise<void> {
    const revision = ++this.revision;
    const update = (state: LandQueryState) => { this.state = state; publish(state); };
    update({ key, status: 'loading', town: null, error: '' });
    try {
      const result = await query(key.settlementId);
      if (revision !== this.revision) return;
      if (result.hash !== key.hash || result.settlementId !== key.settlementId || (result.town && result.town.settlementId !== key.settlementId)) {
        throw new Error('The campaign or selected settlement changed. Retry land details for current quotes.');
      }
      update({ key, status: 'ready', town: result.town, error: '' });
    } catch (cause) {
      if (revision !== this.revision) return;
      update({ key, status: 'error', town: null, error: cause instanceof Error ? cause.message : String(cause) });
    }
  }
}

export function useLandQuery({ settlementId, hash, epoch, query, enabled = true }: LandQueryKey & { query?: LandQuery; enabled?: boolean }) {
  const session = useRef<LandQuerySession | null>(null);
  session.current ??= new LandQuerySession();
  const [state, setState] = useState<LandQueryState>(idle);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt(value => value + 1), []);
  useEffect(() => {
    const current = session.current!;
    if (query && enabled) void current.load({ settlementId, hash, epoch }, query, setState);
    return () => current.invalidate();
  }, [settlementId, hash, epoch, query, enabled, attempt]);
  // A changed key hides old actions during render, before effect cleanup runs.
  const current = enabled && sameKey(state.key, { settlementId, hash, epoch }) ? state : { ...idle, status: 'loading' as const };
  return { ...current, retry };
}
