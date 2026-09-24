import type { GroupPostingResult } from './protocol';

/** Correlates one group order with its final worker state, outside React state. */
export class GroupOrderRequests<Result> {
  private pending?: { id: number; resolve: (value: Result[]) => void; reject: (error: Error) => void };
  get busy(): boolean { return Boolean(this.pending); }
  has(id: number): boolean { return this.pending?.id === id; }
  enqueue(id: number): Promise<Result[]> {
    if (this.pending) return Promise.reject(new Error('Wait for the current group orders to finish.'));
    return new Promise((resolve, reject) => { this.pending = { id, resolve, reject }; });
  }
  finish(id: number, result: Result[] | Error): void {
    if (this.pending?.id !== id) return;
    const pending = this.pending; this.pending = undefined;
    if (result instanceof Error) pending.reject(result); else pending.resolve(result);
  }
  reset(message: string): void {
    if (this.pending) this.finish(this.pending.id, new Error(message));
  }
}

export class GroupPostingRequests extends GroupOrderRequests<GroupPostingResult> {}
