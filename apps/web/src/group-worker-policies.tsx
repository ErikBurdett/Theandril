import { useEffect, useRef, useState } from 'react';
import { WORKER_POLICY_FOCI, WORKER_POLICY_NAMES, type WorkerPolicyFocus, type GameCommand, type Observation } from '@theandril/sim';
import { groupCharterTowns } from './group-charters';
import { GroupPolicyResults } from './group-policy-results';
import { MAX_GROUP_ORDER_COMMANDS, type GroupWorkerPolicyResult } from './protocol';

export type GroupWorkerPolicyCommand = Extract<GameCommand, { type: 'setWorkerPolicy' }>;
export type GroupWorkerPolicyIssue = (commands: GroupWorkerPolicyCommand[], expectedHash: string) => Promise<GroupWorkerPolicyResult[]>;

/** Selection is a permitted snapshot; ownership and every land rule stay canonical. */
export function groupWorkerPolicyCommands(view: Observation, selected: ReadonlySet<string>, focus: WorkerPolicyFocus | 'none'): GroupWorkerPolicyCommand[] {
  if (!view.workerPolicies) return [];
  const towns = groupCharterTowns(view, selected);
  // Never quietly apply a prefix when a caller bypasses the registry's limit.
  if (towns.length > MAX_GROUP_ORDER_COMMANDS) return [];
  const governed = new Set(view.workerPolicies.map(policy => policy.settlementId));
  return towns.filter(town => focus !== 'none' || governed.has(town.id))
    .map(town => ({ type: 'setWorkerPolicy', factionId: view.factionId, settlementId: town.id, focus }));
}

export function GroupWorkerPolicyOrders({ view, hash, selected, matching, busy, issue, accepted, onPendingChange }: {
  view: Observation; hash?: string; selected: ReadonlySet<string>; matching: ReadonlySet<string>; busy: boolean;
  issue: GroupWorkerPolicyIssue; accepted: (ids: ReadonlySet<string>) => void; onPendingChange: (pending: boolean) => void;
}) {
  const [focus, setFocus] = useState<WorkerPolicyFocus>('balanced');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<Array<GroupWorkerPolicyResult & { name: string }>>();
  const mounted = useRef(true), inFlight = useRef(false), pendingCallback = useRef(onPendingChange);
  pendingCallback.current = onPendingChange;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; pendingCallback.current(false); }; }, []);
  if (!view.workerPolicies) return null;
  const towns = groupCharterTowns(view, selected);
  const outside = towns.filter(town => !matching.has(town.id)).length;
  const removal = groupWorkerPolicyCommands(view, selected, 'none');
  const assignment = groupWorkerPolicyCommands(view, selected, focus);
  const locked = busy || pending;
  const submit = async (next: WorkerPolicyFocus | 'none') => {
    if (locked || inFlight.current || !hash) return;
    const commands = groupWorkerPolicyCommands(view, selected, next);
    if (!commands.length) return;
    const names = new Map(towns.map(town => [town.id, town.name]));
    inFlight.current = true; setPending(true); pendingCallback.current(true); setError(''); setResults(undefined);
    try {
      const response = await issue(commands, hash);
      if (!mounted.current) return;
      setResults(response.map(row => ({ ...row, name: names.get(row.settlementId) ?? row.settlementId })));
      accepted(new Set(response.filter(row => row.accepted).map(row => row.settlementId)));
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : 'Worker policy orders could not be completed. Review the hearths before retrying.');
    } finally {
      inFlight.current = false;
      if (mounted.current) { setPending(false); pendingCallback.current(false); }
    }
  };
  return <details className="group-postings group-worker-policies" data-testid="group-worker-policies" aria-busy={pending}>
    <summary>Worker policies</summary>
    <p className="group-selection-count">{towns.length} {towns.length === 1 ? 'hearth' : 'hearths'} selected{outside ? ` · ${outside} outside this filter` : ''}</p>
    <p className="field-help">Use checked hearths or recall a saved hearth group. Apply one priority to up to {MAX_GROUP_ORDER_COMMANDS} hearths together.</p>
    <label>Group worker priority<select value={focus} disabled={locked} onChange={event => setFocus(event.target.value as WorkerPolicyFocus)}>{WORKER_POLICY_FOCI.map(option => <option key={option} value={option}>{WORKER_POLICY_NAMES[option]}</option>)}</select></label>
    <p className="field-help">Applying a policy reassigns workers immediately at no coin cost. After each turn’s growth and land work, it assigns workers for the following harvest. Only already claimed, legally workable land is considered.</p>
    <p className="field-help">Changing priority can stop resource extraction when its tile becomes unworked. Manual worker orders revoke that hearth’s policy. Removing a policy keeps its current workers. Production queues, charters and paid land work keep their own orders.</p>
    <div className="group-selection-actions"><button className="primary" disabled={locked || !hash || !assignment.length} onClick={() => { void submit(focus); }}>Apply worker policies ({towns.length})</button><button disabled={locked || !hash || !removal.length} onClick={() => { void submit('none'); }}>Remove worker policies ({removal.length})</button></div>
    {towns.length > MAX_GROUP_ORDER_COMMANDS && <p role="alert">Select at most {MAX_GROUP_ORDER_COMMANDS} hearths. No partial selection will be applied.</p>}
    {removal.length < towns.length && towns.length <= MAX_GROUP_ORDER_COMMANDS && <p className="field-help">Removal leaves {towns.length - removal.length} selected hearths without worker policies unchanged.</p>}
    {pending && <p role="status">Applying worker policy orders…</p>}
    {error && <p role="alert" className="group-order-error">{error}</p>}
    {results && <GroupPolicyResults kind="worker-policy" rows={results.map(row => ({ ...row, id: row.settlementId }))} busy={locked}/>}
  </details>;
}
