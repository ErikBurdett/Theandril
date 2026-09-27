import { useEffect, useRef, useState } from 'react';
import { BUILDINGS, UNITS } from '@theandril/content';
import type { Observation } from '@theandril/sim';
import { MAX_GROUP_PRODUCTION_SETTLEMENTS, MAX_PRODUCTION_SEQUENCE_ITEMS, type GroupProductionResult } from './protocol';
import { groupCharterTowns } from './group-charters';
import { ProductionTemplates } from './production-templates';

export type GroupProductionIssue = (request: { factionId: string; settlementIds: string[]; itemIds: string[] }) => Promise<GroupProductionResult[]>;
const definitions = [...BUILDINGS, ...UNITS];
const byId = new Map(definitions.map(item => [item.id, item]));
const buildingIds = new Set(BUILDINGS.map(item => item.id));
const itemName = (id: string) => byId.get(id)?.name ?? id;

/** Editor/library shape only. Existing queue, ownership, funds and prerequisites remain canonical. */
export function productionSequenceValid(itemIds: readonly string[]): boolean {
  return itemIds.length > 0 && itemIds.length <= MAX_PRODUCTION_SEQUENCE_ITEMS && itemIds.every(id => byId.has(id))
    && new Set(itemIds.filter(id => buildingIds.has(id))).size === itemIds.filter(id => buildingIds.has(id)).length;
}

export function groupProductionRequest(view: Observation, selected: ReadonlySet<string>, itemIds: readonly string[]) {
  if (!productionSequenceValid(itemIds)) return undefined;
  const settlementIds = groupCharterTowns(view, selected).slice(0, MAX_GROUP_PRODUCTION_SETTLEMENTS).map(town => town.id);
  return settlementIds.length ? { factionId: view.factionId, settlementIds, itemIds: [...itemIds] } : undefined;
}

export function completeProductionHearths(results: readonly GroupProductionResult[], itemIds: readonly string[]): Set<string> {
  return new Set(results.filter(result => result.orders.length === itemIds.length
    && result.orders.every((order, index) => order.accepted && order.itemId === itemIds[index])).map(result => result.settlementId));
}

type ProductionResults = { rows: Array<GroupProductionResult & { name: string }>; itemIds: string[] };
export function GroupProductionResults({ result }: { result: ProductionResults }) {
  const complete = completeProductionHearths(result.rows, result.itemIds);
  const orders = result.rows.flatMap(row => row.orders);
  const accepted = orders.filter(order => order.accepted).length;
  return <div data-testid="group-production-results">
    <p role="status">{complete.size} {complete.size === 1 ? 'hearth' : 'hearths'} complete · {result.rows.length - complete.size} partial or refused. {accepted} orders accepted · {orders.length - accepted} refused.</p>
    {complete.size < result.rows.length && <p className="field-help">Partial and refused hearths remain selected. Accepted items are already paid and queued; review them before applying another sequence. Nothing is retried automatically.</p>}
    <details><summary>Review production results</summary><ul>{result.rows.map(row => <li key={row.settlementId}>
      <strong>{row.name}</strong> · {complete.has(row.settlementId) ? 'Complete' : 'Partial or refused'}
      <ol>{row.orders.map((order, index) => <li key={index}>{itemName(order.itemId)} · {order.accepted ? 'Paid and queued' : `Refused: ${order.message ?? 'The hearth could not accept this project.'}`}</li>)}</ol>
      {row.orders.length < result.itemIds.length && <p>{result.itemIds.length - row.orders.length} later {result.itemIds.length - row.orders.length === 1 ? 'item was' : 'items were'} not attempted.</p>}
    </li>)}</ul></details>
  </div>;
}

export function GroupProductionOrders({ view, selected, busy, issue, accepted, onPendingChange }: {
  view: Observation; selected: ReadonlySet<string>; busy: boolean; issue: GroupProductionIssue;
  accepted: (ids: ReadonlySet<string>) => void; onPendingChange: (pending: boolean) => void;
}) {
  const [itemIds, setItemIds] = useState<string[]>([]);
  const [choice, setChoice] = useState(definitions[0]?.id ?? '');
  const [pending, setPending] = useState(false);
  const [results, setResults] = useState<ProductionResults>();
  const [error, setError] = useState('');
  const mounted = useRef(true), inFlight = useRef(false);
  const pendingCallback = useRef(onPendingChange);
  pendingCallback.current = onPendingChange;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; pendingCallback.current(false); }; }, []);
  const towns = groupCharterTowns(view, selected);
  const selectedIds = new Set(towns.map(town => town.id));
  const queuedTowns = towns.filter(town => town.queue.length > 0).length;
  const queuedItems = towns.reduce((sum, town) => sum + town.queue.length, 0);
  const nominalCost = itemIds.reduce((sum, id) => sum + (byId.get(id)?.coinCost ?? 0), 0);
  const locked = busy || pending;
  const canAdd = productionSequenceValid([...itemIds, choice]);
  const request = groupProductionRequest(view, selectedIds, itemIds);
  const currentBlockers = view.productionOptions.filter(option => selectedIds.has(option.settlementId) && option.itemId === choice && option.blocker);
  const blockerCounts = new Map<string, number>();
  for (const option of currentBlockers) blockerCounts.set(option.blocker!, (blockerCounts.get(option.blocker!) ?? 0) + 1);
  const move = (index: number, direction: -1 | 1) => {
    if (locked || index + direction < 0 || index + direction >= itemIds.length) return;
    setItemIds(previous => { const next = [...previous]; [next[index], next[index + direction]] = [next[index + direction]!, next[index]!]; return next; });
  };
  const submit = async () => {
    if (locked || inFlight.current || !request) return;
    const names = new Map(towns.map(town => [town.id, town.name]));
    inFlight.current = true; setPending(true); pendingCallback.current(true); setError(''); setResults(undefined);
    try {
      const response = await issue(request);
      if (!mounted.current) return;
      setResults({ rows: response.map(row => ({ ...row, name: names.get(row.settlementId) ?? row.settlementId })), itemIds: request.itemIds });
      accepted(completeProductionHearths(response, request.itemIds));
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : 'Production orders could not be completed. Review the hearths before retrying.');
    } finally {
      inFlight.current = false;
      if (mounted.current) { setPending(false); pendingCallback.current(false); }
    }
  };
  return <details className="group-production" data-testid="group-production" aria-busy={pending}>
    <summary>Production sequences</summary>
    <p className="field-help">Use the checked hearths above or recall a saved hearth group. Build a list of 1–{MAX_PRODUCTION_SEQUENCE_ITEMS} projects, then explicitly apply it to up to {MAX_GROUP_PRODUCTION_SETTLEMENTS} hearths.</p>
    <p className="group-selection-count">{towns.length} {towns.length === 1 ? 'hearth' : 'hearths'} selected for production · Treasury: {view.treasury} coin.</p>
    <label>Production item<select disabled={locked} value={choice} onChange={event => setChoice(event.target.value)}>
      <optgroup label="Construction">{BUILDINGS.map(item => <option key={item.id} value={item.id}>{item.name} · {item.coinCost} coin</option>)}</optgroup>
      <optgroup label="Recruitment">{UNITS.map(item => <option key={item.id} value={item.id}>{item.name} · {item.coinCost} coin</option>)}</optgroup>
    </select></label>
    <button disabled={locked || !canAdd} onClick={() => { if (!locked && canAdd) setItemIds(previous => [...previous, choice]); }}>Add project</button>
    <p className="field-help">Construction entries appear once per sequence; recruitment may repeat. Recruitment adds its normal upkeep after completion.</p>
    {blockerCounts.size > 0 && <details className="production-current-blockers"><summary>Current blockers for {itemName(choice)}</summary><ul>{[...blockerCounts].map(([blocker, count]) => <li key={blocker}>{count} {count === 1 ? 'hearth' : 'hearths'}: {blocker}</li>)}</ul><p className="field-help">These are the current canonical quotes. Funds and queue space can change as the sequence is applied.</p></details>}
    <ol className="production-sequence-items" data-testid="production-sequence-items">{itemIds.map((id, index) => <li key={index} data-testid="production-sequence-item">
      <span><strong>{index + 1}. {itemName(id)}</strong><small>{byId.get(id)?.coinCost} coin · {byId.get(id)?.cost} industry</small></span>
      <div className="production-sequence-actions"><button disabled={locked || index === 0} aria-label={`Move item ${index + 1} up`} onClick={() => move(index, -1)}>↑</button><button disabled={locked || index === itemIds.length - 1} aria-label={`Move item ${index + 1} down`} onClick={() => move(index, 1)}>↓</button><button disabled={locked} aria-label={`Remove item ${index + 1}`} onClick={() => { if (!locked) setItemIds(previous => previous.filter((_, position) => position !== index)); }}>Remove</button></div>
    </li>)}</ol>
    {!itemIds.length && <p className="field-help">No projects in this sequence yet.</p>}
    {itemIds.length >= MAX_PRODUCTION_SEQUENCE_ITEMS && <p className="field-help">The sequence is full. Remove a project before adding another.</p>}
    <p className="field-help" data-testid="production-sequence-cost">Nominal cost: {nominalCost} coin per hearth · {nominalCost * towns.length} coin across this selection. All hearths share the current treasury.</p>
    <p className="field-help">Existing queues: {queuedItems} {queuedItems === 1 ? 'project' : 'projects'} across {queuedTowns} selected {queuedTowns === 1 ? 'hearth' : 'hearths'}. Those orders come first. Accepted projects append to those queues and spend coin immediately.</p>
    {queuedTowns > 0 && <details><summary>Review existing queues</summary><ul>{towns.filter(town => town.queue.length > 0).map(town => <li key={town.id}>{town.name}: {town.queue.map(item => itemName(item.itemId)).join(' → ')}</li>)}</ul></details>}
    <p className="field-help">Hearths run in stable ID order; each list runs in your chosen order. A refusal stops the remaining items for that hearth, then the next hearth is processed. Accepted prefixes stay paid and queued; there is no rollback or automatic retry.</p>
    <p className="field-help">Nominal costs do not promise eligibility. Buildings do not finish while appending a sequence, so a queued prerequisite cannot unlock a later project immediately. Existing queues and charters are preserved.</p>
    <ProductionTemplates itemIds={itemIds} valid={productionSequenceValid(itemIds)} busy={locked} recall={template => setItemIds([...template.itemIds])}/>
    <button className="primary" disabled={locked || !request} onClick={() => { void submit(); }}>Apply production ({towns.length})</button>
    {pending && <p role="status">Applying production orders…</p>}
    {error && <p className="group-order-error" role="alert">{error}</p>}
    {results && <GroupProductionResults result={results}/>}
  </details>;
}
