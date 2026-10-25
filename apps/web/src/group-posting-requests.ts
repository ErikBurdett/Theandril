import type { GameCommand } from '@theandril/sim';
import { MAX_GROUP_ORDER_COMMANDS, type GroupWorkerPolicyResult, type GroupCharterResult, type GroupPostingResult } from './protocol';

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

type PostingCommand = Extract<GameCommand, { type: 'setPosting' }>;
type WorkerPolicyCommand = Extract<GameCommand, { type: 'setWorkerPolicy' }>;
type CharterCommand = Extract<GameCommand, { type: 'setCharter' }>;
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.length <= 10_000 && Boolean(value.trim());
const identifier = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 100;

/** Correlates only transport identity. Command legality remains in simulation. */
class CorrelatedGroupRequests<Command extends PostingCommand | CharterCommand | WorkerPolicyCommand, Result extends GroupPostingResult | GroupCharterResult | GroupWorkerPolicyResult> {
  private readonly requests = new GroupOrderRequests<Result>();
  private submitted?: { id: number; factionId: string; entityIds: string[] };
  constructor(private readonly kind: 'posting' | 'charter' | 'worker policy', private readonly field: 'armyId' | 'settlementId', private readonly entityId: (command: Command) => string) {}
  get busy() { return this.requests.busy; }
  has(id: number) { return this.requests.has(id); }
  enqueue(id: number, commands: readonly Command[]): Promise<Result[]> {
    if (this.busy) return Promise.reject(new Error('Wait for the current group orders to finish.'));
    if (!Number.isSafeInteger(id) || id < 0 || !Array.isArray(commands) || !commands.length || commands.length > MAX_GROUP_ORDER_COMMANDS
      || Object.keys(commands).length !== commands.length
      || !Array.from(commands).every(command => object(command) && identifier(command.factionId) && identifier(command[this.field]))) {
      return Promise.reject(new Error(`Select between 1 and ${MAX_GROUP_ORDER_COMMANDS} actors before issuing group ${this.kind} orders.`));
    }
    const factionId = commands[0]!.factionId, entityIds = commands.map(command => this.entityId(command)).sort();
    if (new Set(entityIds).size !== entityIds.length || commands.some(command => command.factionId !== factionId)) {
      return Promise.reject(new Error(`Group ${this.kind} orders require distinct actors from one faction.`));
    }
    this.submitted = { id, factionId, entityIds };
    return this.requests.enqueue(id);
  }
  private badResults(): never {
    throw new Error(`The ${this.kind} response does not match the submitted ${this.kind === 'posting' ? 'armies' : 'hearths'}. Some orders may have applied; restore a saved campaign.`);
  }
  validate(id: number, factionId: string, results: unknown, error: unknown): void {
    if (!this.has(id)) return;
    const submitted = this.submitted;
    if (!submitted || submitted.id !== id || submitted.factionId !== factionId) this.badResults();
    // An interrupted recorder can return a partial list after mutation. The
    // caller must reject the request and require restore, never accept that list.
    if (error !== undefined) { if (!text(error)) this.badResults(); return; }
    if (!Array.isArray(results) || results.length !== submitted.entityIds.length || results.length > MAX_GROUP_ORDER_COMMANDS
      || Object.keys(results).length !== results.length) this.badResults();
    for (let index = 0; index < submitted.entityIds.length; index++) {
      const row: unknown = results[index];
      if (!object(row) || Object.keys(row).some(key => ![this.field, 'accepted', 'message'].includes(key))
        || row[this.field] !== submitted.entityIds[index] || typeof row.accepted !== 'boolean'
        || (row.message !== undefined && !text(row.message)) || (row.accepted === false && !text(row.message))) this.badResults();
    }
  }
  finish(id: number, result: Result[] | Error): void {
    if (!this.has(id)) return;
    this.submitted = undefined; this.requests.finish(id, result);
  }
  reset(message: string): void { this.submitted = undefined; this.requests.reset(message); }
}

export class GroupPostingRequests extends CorrelatedGroupRequests<PostingCommand, GroupPostingResult> {
  constructor() { super('posting', 'armyId', command => command.armyId); }
}
export class GroupCharterRequests extends CorrelatedGroupRequests<CharterCommand, GroupCharterResult> {
  constructor() { super('charter', 'settlementId', command => command.settlementId); }
}

export class GroupWorkerPolicyRequests extends CorrelatedGroupRequests<WorkerPolicyCommand, GroupWorkerPolicyResult> {
  constructor() { super('worker policy', 'settlementId', command => command.settlementId); }
}
