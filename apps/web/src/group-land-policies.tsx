import { useEffect, useRef, useState } from 'react';
import { IMPROVEMENTS } from '@theandril/content';
import type { GameCommand, Observation } from '@theandril/sim';
import { groupCharterTowns } from './group-charters';
import { GroupPolicyResults } from './group-policy-results';
import { landCommissionAmount } from './land-policy';
import { MAX_GROUP_ORDER_COMMANDS, type GroupLandPolicyResult } from './protocol';
import './group-land-policies.css';

export type GroupLandPolicyCommand = Extract<GameCommand, { type: 'setLandPolicy' }>;
export type GroupLandPolicyIssue = (commands: GroupLandPolicyCommand[], expectedHash: string) => Promise<GroupLandPolicyResult[]>;

/** Only maps permitted selection to orders; the simulation chooses and prices work. */
export function groupLandPolicyCommands(view: Observation, selected: ReadonlySet<string>, improvementId: string, allowance: number, reserve: number): GroupLandPolicyCommand[] {
  if (view.landPolicies === undefined) return [];
  const towns = groupCharterTowns(view, selected);
  if (towns.length > MAX_GROUP_ORDER_COMMANDS) return [];
  if (improvementId !== 'none' && (!Number.isSafeInteger(allowance) || allowance < 0 || !Number.isSafeInteger(reserve) || reserve < 0 || !IMPROVEMENTS.some(item => item.id === improvementId))) return [];
  const governed = new Set(view.landPolicies.filter(policy => policy.factionId === view.factionId).map(policy => policy.settlementId));
  return towns.filter(town => improvementId !== 'none' || governed.has(town.id))
    .map(town => ({ type: 'setLandPolicy', factionId: view.factionId, settlementId: town.id, improvementId,
      allowance: improvementId === 'none' ? 0 : allowance, reserve: improvementId === 'none' ? 0 : reserve }));
}

/** Permission totals can exceed Number's exact range even when each order cannot. */
export function groupLandAllowanceTotal(allowance: number, count: number): string {
  return (BigInt(allowance) * BigInt(count)).toString();
}

export function GroupLandPolicyOrders({ view, hash, selected, matching, busy, issue, accepted, onPendingChange }: {
  view: Observation; hash?: string; selected: ReadonlySet<string>; matching: ReadonlySet<string>; busy: boolean;
  issue: GroupLandPolicyIssue; accepted: (ids: ReadonlySet<string>) => void; onPendingChange: (pending: boolean) => void;
}) {
  const [improvementId, setImprovementId] = useState(IMPROVEMENTS[0]!.id);
  const [allowance, setAllowance] = useState('100');
  const [reserve, setReserve] = useState('40');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<Array<GroupLandPolicyResult & { name: string }>>();
  const mounted = useRef(true), inFlight = useRef(false), pendingCallback = useRef(onPendingChange);
  pendingCallback.current = onPendingChange;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; pendingCallback.current(false); }; }, []);
  if (view.landPolicies === undefined) return null;
  const towns = groupCharterTowns(view, selected);
  const outside = towns.filter(town => !matching.has(town.id)).length;
  const allowanceValue = landCommissionAmount(allowance), reserveValue = landCommissionAmount(reserve);
  const invalid = allowanceValue === null || reserveValue === null;
  const assignment = invalid ? [] : groupLandPolicyCommands(view, selected, improvementId, allowanceValue, reserveValue);
  const removal = groupLandPolicyCommands(view, selected, 'none', 0, 0);
  const locked = busy || pending;
  const submit = async (next: string) => {
    if (locked || inFlight.current || !hash || (next !== 'none' && invalid)) return;
    const commands = groupLandPolicyCommands(view, selected, next, allowanceValue ?? 0, reserveValue ?? 0);
    if (!commands.length) return;
    const names = new Map(towns.map(town => [town.id, town.name]));
    inFlight.current = true; setPending(true); pendingCallback.current(true); setError(''); setResults(undefined);
    try {
      const response = await issue(commands, hash);
      if (!mounted.current) return;
      setResults(response.map(row => ({ ...row, name: names.get(row.settlementId) ?? row.settlementId })));
      accepted(new Set(response.filter(row => row.accepted).map(row => row.settlementId)));
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : 'Land commission orders could not be completed. Review the hearths before retrying.');
    } finally {
      inFlight.current = false;
      if (mounted.current) { setPending(false); pendingCallback.current(false); }
    }
  };
  return <details className="group-postings group-land-policies" data-testid="group-land-policies" aria-busy={pending}>
    <summary>Land commissions</summary>
    <p className="group-selection-count">{towns.length} {towns.length === 1 ? 'hearth' : 'hearths'} selected{outside ? ` · ${outside} outside this filter` : ''}</p>
    <p className="field-help">Use checked hearths or recall a saved hearth group. Apply one improvement and budget per hearth to up to {MAX_GROUP_ORDER_COMMANDS} hearths together.</p>
    <label>Group commission improvement<select value={improvementId} disabled={locked} onChange={event => setImprovementId(event.target.value)}>{IMPROVEMENTS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    <div className="group-land-amounts">
      <label>Allowance per hearth · coin<input type="text" inputMode="numeric" value={allowance} disabled={locked} aria-invalid={allowanceValue === null} onChange={event => setAllowance(event.target.value)}/></label>
      <label>Shared treasury reserve · coin<input type="text" inputMode="numeric" value={reserve} disabled={locked} aria-invalid={reserveValue === null} onChange={event => setReserve(event.target.value)}/></label>
    </div>
    {allowanceValue !== null && <p className="group-land-total" role="status">{allowanceValue} coin per hearth × {towns.length} = {groupLandAllowanceTotal(allowanceValue, towns.length)} coin total permission.</p>}
    <p className="field-help">This replaces each hearth’s remaining allowance; it does not add to it. Permission is not escrow or a payment quote. Zero allowance stops new purchases. Applying can pay for each first order immediately in stable hearth order, sharing the same treasury.</p>
    <p className="field-help">Each purchase must leave the shared treasury reserve; the reserve is not multiplied by the hearth count. Other realm orders can still spend it. Further orders begin after upkeep and production charters. Accepted means the commission was set, not that work started.</p>
    <p className="field-help">Only suitable worked, unimproved land qualifies. Existing sites and mismatched deposits are protected. Commissions do not claim land, cultivate biomes or assign workers. Siege and occupation pause work.</p>
    <p className="field-help">Ending commissions keeps paid work underway. Successful manual construction, cultivation or cancellation ends that hearth’s commission. Ownership loss ends permission; cancelled work is not refunded.</p>
    {invalid && <p className="group-order-error" role="alert">Enter whole, nonnegative coin amounts up to {Number.MAX_SAFE_INTEGER}.</p>}
    <div className="group-selection-actions"><button className="primary" disabled={locked || !hash || !assignment.length} onClick={() => { void submit(improvementId); }}>Apply land commissions ({towns.length})</button><button disabled={locked || !hash || !removal.length} onClick={() => { void submit('none'); }}>End land commissions ({removal.length})</button></div>
    {towns.length > MAX_GROUP_ORDER_COMMANDS && <p role="alert">Select at most {MAX_GROUP_ORDER_COMMANDS} hearths. No partial selection will be applied.</p>}
    {removal.length < towns.length && towns.length <= MAX_GROUP_ORDER_COMMANDS && <p className="field-help">Ending commissions leaves {towns.length - removal.length} selected hearths without commissions unchanged.</p>}
    {pending && <p role="status">Applying land commission orders…</p>}
    {error && <p role="alert" className="group-order-error">{error}</p>}
    {results && <GroupPolicyResults kind="land-policy" rows={results.map(row => ({ ...row, id: row.settlementId }))} busy={locked}/>}
  </details>;
}
