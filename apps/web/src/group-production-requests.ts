import { MAX_GROUP_PRODUCTION_SETTLEMENTS, MAX_PRODUCTION_SEQUENCE_ITEMS, type GroupProductionResult } from './protocol';
import { GroupOrderRequests } from './group-posting-requests';

export interface ProductionRequestPlan { factionId: string; settlementIds: string[]; itemIds: string[] }
const bad = (): never => { throw new Error('The production sequence response does not match the submitted orders. Some orders may have applied; restore a saved campaign.'); };
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);

/** Transport correlation only. Production eligibility remains canonical. */
export function assertProductionResults(value: unknown, plan: ProductionRequestPlan): asserts value is GroupProductionResult[] {
  if (!Array.isArray(value) || value.length !== plan.settlementIds.length || value.length > MAX_GROUP_PRODUCTION_SETTLEMENTS) bad();
  const rows = value as unknown[];
  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    if (!object(row) || Object.keys(row).some(key => !['settlementId', 'orders'].includes(key)) || row.settlementId !== plan.settlementIds[index]
      || !Array.isArray(row.orders) || row.orders.length < 1 || row.orders.length > plan.itemIds.length || row.orders.length > MAX_PRODUCTION_SEQUENCE_ITEMS) bad();
    const orders = (row as { orders: unknown[] }).orders;
    for (let step = 0; step < orders.length; step++) {
      const order = orders[step];
      if (!object(order) || Object.keys(order).some(key => !['itemId', 'accepted', 'message'].includes(key)) || order.itemId !== plan.itemIds[step]
        || typeof order.accepted !== 'boolean' || (order.message !== undefined && (typeof order.message !== 'string' || order.message.length > 10_000))
        || (order.accepted === false && (step !== orders.length - 1 || typeof order.message !== 'string' || !order.message.trim()))) bad();
    }
    if (orders.length < plan.itemIds.length && (orders[orders.length - 1] as { accepted: boolean }).accepted) bad();
  }
}

/** Keep the submitted snapshot alongside its one pending worker response. */
export class GroupProductionRequests {
  private readonly requests = new GroupOrderRequests<GroupProductionResult>();
  private submitted?: { id: number; plan: ProductionRequestPlan };
  get busy() { return this.requests.busy; }
  has(id: number) { return this.requests.has(id); }
  enqueue(id: number, plan: ProductionRequestPlan): Promise<GroupProductionResult[]> {
    if (this.busy) return Promise.reject(new Error('Wait for the current production sequence to finish.'));
    this.submitted = { id, plan: { factionId: plan.factionId, settlementIds: [...plan.settlementIds].sort(), itemIds: [...plan.itemIds] } };
    return this.requests.enqueue(id);
  }
  validate(id: number, factionId: string, results: unknown, error: unknown): void {
    if (!this.has(id)) return;
    if (!this.submitted || this.submitted.id !== id || this.submitted.plan.factionId !== factionId) bad();
    // An explicit recorder/publication failure is never announced as success.
    // Its partial rows are not consumed by the UI; saved recovery is required.
    if (error !== undefined) {
      if (typeof error !== 'string' || !error.trim()) bad();
      return;
    }
    assertProductionResults(results, this.submitted!.plan);
  }
  finish(id: number, result: GroupProductionResult[] | Error) {
    if (!this.has(id)) return;
    this.submitted = undefined;
    this.requests.finish(id, result);
  }
  reset(message: string) { this.submitted = undefined; this.requests.reset(message); }
}
