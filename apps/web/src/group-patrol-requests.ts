import { GroupOrderRequests } from './group-posting-requests';
import { MAX_GROUP_ORDER_COMMANDS, type GroupPatrolCommand, type GroupPatrolResult } from './protocol';

const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.length <= 10_000 && Boolean(value.trim());
const badResults = (): never => { throw new Error('The patrol response does not match the submitted armies. Some patrol policies may have changed; restore a saved campaign.'); };

/** Correlation is transport validation; patrol decisions stay in the simulation. */
export function assertGroupPatrolResults(value: unknown, armyIds: readonly string[]): asserts value is GroupPatrolResult[] {
  if (!Array.isArray(value) || value.length !== armyIds.length || value.length > MAX_GROUP_ORDER_COMMANDS) badResults();
  for (let index = 0; index < armyIds.length; index++) {
    const row: unknown = (value as unknown[])[index];
    if (!object(row) || Object.keys(row).some(key => !['armyId', 'accepted', 'message'].includes(key))
      || row.armyId !== armyIds[index] || typeof row.accepted !== 'boolean'
      || (row.message !== undefined && !text(row.message)) || (row.accepted === false && !text(row.message))) badResults();
  }
}

export class GroupPatrolRequests {
  private readonly requests = new GroupOrderRequests<GroupPatrolResult>();
  private submitted?: { id: number; factionId: string; armyIds: string[] };
  get busy() { return this.requests.busy; }
  has(id: number) { return this.requests.has(id); }
  enqueue(id: number, commands: readonly GroupPatrolCommand[]): Promise<GroupPatrolResult[]> {
    if (this.busy) return Promise.reject(new Error('Wait for the current patrol orders to finish.'));
    if (!commands.length) return Promise.reject(new Error('Select armies before issuing patrol orders.'));
    this.submitted = { id, factionId: commands[0]!.factionId, armyIds: commands.map(command => command.armyId).sort() };
    return this.requests.enqueue(id);
  }
  validate(id: number, factionId: string, results: unknown, error: unknown): void {
    if (!this.has(id)) return;
    if (!this.submitted || this.submitted.id !== id || this.submitted.factionId !== factionId) badResults();
    // Partial results after a recorder failure are uncertain, never successes.
    if (error !== undefined) { if (!text(error)) badResults(); return; }
    assertGroupPatrolResults(results, this.submitted!.armyIds);
  }
  finish(id: number, result: GroupPatrolResult[] | Error): void {
    if (!this.has(id)) return;
    this.submitted = undefined; this.requests.finish(id, result);
  }
  reset(message: string): void { this.submitted = undefined; this.requests.reset(message); }
}

