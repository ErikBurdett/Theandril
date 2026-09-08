export interface WatchFogResult { enabled: boolean; hash: string }
export interface WatchFogApi {
  /** true restores faction sight; false reveals only the spectator map. */
  setWatchFog(enabled: boolean): Promise<WatchFogResult>;
  toggleFogOfWar(): Promise<WatchFogResult>;
}

/** Small presentation request ledger, never a game-state mutation interface. */
export class WatchFogRequests {
  enabled = true;
  desired = true;
  revision = -1;
  private pending = new Map<number, { resolve: (result: WatchFogResult) => void; reject: (error: Error) => void }>();
  get size(): number { return this.pending.size; }
  has(id: number): boolean { return this.pending.has(id); }
  enqueue(id: number, enabled: boolean): Promise<WatchFogResult> {
    this.desired = enabled;
    return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); });
  }
  finish(id: number, result: WatchFogResult | Error): void {
    const request = this.pending.get(id); this.pending.delete(id);
    if (result instanceof Error) request?.reject(result); else request?.resolve(result);
    if (!this.pending.size) this.desired = this.enabled;
  }
  accept(enabled: boolean, revision: number): boolean {
    if (!Number.isSafeInteger(revision) || revision < this.revision) return false;
    this.enabled = enabled; this.revision = revision;
    if (!this.pending.size) this.desired = enabled;
    return true;
  }
  reset(message: string): void {
    for (const request of this.pending.values()) request.reject(new Error(message));
    this.pending.clear(); this.enabled = true; this.desired = true; this.revision = -1;
  }
}

declare global { interface Window { theandril?: WatchFogApi } }
