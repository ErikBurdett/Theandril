import { MAX_PATH_NODES, MAX_ROUTE_CELLS } from '@theandril/sim';
import { GroupOrderRequests } from './group-posting-requests';
import { MAX_GROUP_ORDER_COMMANDS, type GroupMovementCommand, type GroupMovementPreviewPlan, type GroupMovementResult, type GroupMovementReview } from './protocol';

const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.length <= 10_000 && Boolean(value.trim());
const integer = (value: unknown, max: number): boolean => Number.isSafeInteger(value) && Number(value) >= 0 && Number(value) <= max;
const badResults = (): never => { throw new Error('The travel response does not match the submitted armies. Some armies may have moved; restore a saved campaign.'); };

/** Correlation is transport validation; movement decisions stay in the simulation. */
export function assertGroupMovementResults(value: unknown, armyIds: readonly string[]): asserts value is GroupMovementResult[] {
  if (!Array.isArray(value) || value.length !== armyIds.length || value.length > MAX_GROUP_ORDER_COMMANDS) badResults();
  for (let index = 0; index < armyIds.length; index++) {
    const row: unknown = (value as unknown[])[index];
    if (!object(row) || Object.keys(row).some(key => !['armyId', 'accepted', 'message'].includes(key))
      || row.armyId !== armyIds[index] || typeof row.accepted !== 'boolean'
      || (row.message !== undefined && !text(row.message)) || (row.accepted === false && !text(row.message))) badResults();
  }
}

export class GroupMovementRequests {
  private readonly requests = new GroupOrderRequests<GroupMovementResult>();
  private submitted?: { id: number; factionId: string; armyIds: string[] };
  get busy() { return this.requests.busy; }
  has(id: number) { return this.requests.has(id); }
  enqueue(id: number, commands: readonly GroupMovementCommand[]): Promise<GroupMovementResult[]> {
    if (this.busy) return Promise.reject(new Error('Wait for the current travel orders to finish.'));
    if (!commands.length) return Promise.reject(new Error('Select armies before issuing travel orders.'));
    this.submitted = { id, factionId: commands[0]!.factionId, armyIds: commands.map(command => command.armyId).sort() };
    return this.requests.enqueue(id);
  }
  validate(id: number, factionId: string, results: unknown, error: unknown): void {
    if (!this.has(id)) return;
    if (!this.submitted || this.submitted.id !== id || this.submitted.factionId !== factionId) badResults();
    // Partial results after a recorder failure are uncertain, never successes.
    if (error !== undefined) { if (!text(error)) badResults(); return; }
    assertGroupMovementResults(results, this.submitted!.armyIds);
  }
  finish(id: number, result: GroupMovementResult[] | Error): void {
    if (!this.has(id)) return;
    this.submitted = undefined; this.requests.finish(id, result);
  }
  reset(message: string): void { this.submitted = undefined; this.requests.reset(message); }
}

/** A read-only result may be discarded safely, including a malformed worker reply. */
export function assertGroupMovementReview(value: unknown, plan: GroupMovementPreviewPlan, expectedHash: string, currentHash: string): asserts value is GroupMovementReview {
  const bad = (): never => { throw new Error('The route review is incomplete or out of date. Review the selected armies again.'); };
  if (!object(value) || value.hash !== expectedHash || expectedHash !== currentHash || value.target !== plan.target || value.append !== plan.append
    || !Array.isArray(value.results) || value.results.length !== plan.armyIds.length || value.results.length > MAX_GROUP_ORDER_COMMANDS) bad();
  const ids = [...plan.armyIds].sort();
  for (let index = 0; index < ids.length; index++) {
    const row: unknown = (value as { results: unknown[] }).results[index];
    if (!object(row) || Object.keys(row).some(key => !['armyId', 'target', 'cost', 'steps', 'canQueue', 'blocker', 'limited', 'expandedNodes'].includes(key))
      || row.armyId !== ids[index] || row.target !== plan.target || typeof row.canQueue !== 'boolean' || typeof row.limited !== 'boolean'
      || !integer(row.steps, MAX_ROUTE_CELLS) || !integer(row.expandedNodes, MAX_PATH_NODES) || !integer(row.cost, Number.MAX_SAFE_INTEGER)
      || (row.blocker !== null && !text(row.blocker)) || (!row.canQueue && !text(row.blocker))) bad();
  }
}

export class GroupMovementPreviewRequests {
  private pending?: { id: number; plan: GroupMovementPreviewPlan; hash: string; resolve: (value: GroupMovementReview) => void; reject: (error: Error) => void };
  get busy() { return Boolean(this.pending); }
  has(id: number) { return this.pending?.id === id; }
  enqueue(id: number, plan: GroupMovementPreviewPlan, hash: string): Promise<GroupMovementReview> {
    if (this.pending) return Promise.reject(new Error('Wait for the current route review to finish.'));
    return new Promise((resolve, reject) => { this.pending = { id, plan: { ...plan, armyIds: [...plan.armyIds].sort() }, hash, resolve, reject }; });
  }
  finish(id: number, value: unknown, currentHash: string): boolean {
    const pending = this.pending;
    if (!pending || pending.id !== id) return false;
    this.pending = undefined;
    try {
      if (value instanceof Error) throw value;
      assertGroupMovementReview(value, pending.plan, pending.hash, currentHash);
      pending.resolve(value);
      return true;
    } catch (cause) { pending.reject(cause instanceof Error ? cause : new Error(String(cause))); return false; }
  }
  reset(message: string): void { this.pending?.reject(new Error(message)); this.pending = undefined; }
}
