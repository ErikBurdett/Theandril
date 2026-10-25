import { useEffect, useRef, useState } from 'react';
import type { Observation } from '@theandril/sim';
import { MAX_GROUP_ORDER_COMMANDS, type GroupPatrolCommand, type GroupPatrolResult } from './protocol';
import { groupPostingArmies } from './group-postings';

export type { GroupPatrolCommand, GroupPatrolResult } from './protocol';
export type GroupPatrolIssue = (commands: GroupPatrolCommand[], expectedHash: string) => Promise<GroupPatrolResult[]>;
export type GroupPatrolAction = 'pause' | 'resume' | 'remove';
export const GROUP_PATROL_PAGE_SIZE = 25;

/** Select supplied policies only. Canonical ownership and command acceptance stay in sim. */
export function groupPatrolPlan(view: Observation, selected: ReadonlySet<string>) {
  const armies = groupPostingArmies(view, selected);
  const commands: Record<GroupPatrolAction, GroupPatrolCommand[]> = { pause: [], resume: [], remove: [] };
  if (armies.length > MAX_GROUP_ORDER_COMMANDS) return { armies, commands, warPauseResumes: 0, overLimit: true };
  const policies = new Map((view.patrols ?? []).filter(patrol => patrol.factionId === view.factionId).map(patrol => [patrol.armyId, patrol]));
  let warPauseResumes = 0;
  for (const army of armies) {
    const patrol = policies.get(army.id);
    if (!patrol) continue;
    commands[patrol.enabled ? 'pause' : 'resume'].push({ type: 'setPatrolEnabled', factionId: view.factionId, armyId: army.id, enabled: !patrol.enabled });
    commands.remove.push({ type: 'clearPatrol', factionId: view.factionId, armyId: army.id });
    if (!patrol.enabled && patrol.pauseOnWar) warPauseResumes++;
  }
  return { armies, commands, warPauseResumes, overLimit: false };
}

type NamedResult = GroupPatrolResult & { name: string };
export function GroupPatrolResults({ rows, skipped, busy = false }: { rows: NamedResult[]; skipped: number; busy?: boolean }) {
  const [page, setPage] = useState(0);
  const refused = rows.filter(row => !row.accepted), accepted = rows.filter(row => row.accepted);
  const ordered = [...refused, ...accepted];
  const pages = Math.max(1, Math.ceil(ordered.length / GROUP_PATROL_PAGE_SIZE)), current = Math.min(page, pages - 1);
  return <div data-testid="group-patrol-results">
    <p role="status">{accepted.length} patrol orders accepted · {refused.length} refused.{refused.length > 0 ? ' Refused armies remain selected for review.' : ''}{skipped > 0 ? ` ${skipped} unaffected selected ${skipped === 1 ? 'army remains' : 'armies remain'} checked.` : ''}</p>
    <details open={refused.length > 0}><summary>Review patrol results</summary>
      <ul>{ordered.slice(current * GROUP_PATROL_PAGE_SIZE, (current + 1) * GROUP_PATROL_PAGE_SIZE).map(row => <li key={row.armyId}><strong>{row.name}</strong> · {row.accepted ? 'Accepted' : `Refused: ${row.message ?? 'The patrol could not accept this order.'}`}{row.accepted && row.message && <span>{row.message}</span>}</li>)}</ul>
      {pages > 1 && <nav className="registry-pages" aria-label="Patrol results">
        <button disabled={busy || current === 0} aria-label="Previous patrol results page" onClick={() => setPage(current - 1)}>←</button>
        <span>Page {current + 1} of {pages}</span>
        <button disabled={busy || current === pages - 1} aria-label="Next patrol results page" onClick={() => setPage(current + 1)}>→</button>
      </nav>}
    </details>
  </div>;
}

export function GroupPatrolOrders({ view, hash, selected, matching, busy, issue, accepted, onPendingChange }: {
  view: Observation; hash?: string; selected: ReadonlySet<string>; matching: ReadonlySet<string>; busy: boolean;
  issue: GroupPatrolIssue; accepted: (ids: ReadonlySet<string>) => void; onPendingChange: (pending: boolean) => void;
}) {
  const [pending, setPending] = useState(false);
  const [results, setResults] = useState<{ rows: NamedResult[]; skipped: number }>();
  const [error, setError] = useState('');
  const mounted = useRef(true), inFlight = useRef(false);
  const pendingCallback = useRef(onPendingChange); pendingCallback.current = onPendingChange;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; pendingCallback.current(false); }; }, []);
  const { armies, commands, warPauseResumes, overLimit } = groupPatrolPlan(view, selected);
  const outside = armies.filter(army => !matching.has(army.id)).length;
  const locked = busy || pending;
  const submit = async (action: GroupPatrolAction) => {
    if (locked || inFlight.current || !hash || !commands[action].length) return;
    const orders = commands[action], names = new Map(armies.map(army => [army.id, army.name]));
    const skipped = armies.length - orders.length;
    inFlight.current = true; setPending(true); pendingCallback.current(true); setError(''); setResults(undefined);
    try {
      const response = await issue(orders, hash);
      if (!mounted.current) return;
      setResults({ rows: response.map(row => ({ ...row, name: names.get(row.armyId) ?? row.armyId })), skipped });
      accepted(new Set(response.filter(row => row.accepted).map(row => row.armyId)));
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : 'The patrol response could not be confirmed. Review the campaign before retrying.');
    } finally {
      inFlight.current = false;
      if (mounted.current) { setPending(false); pendingCallback.current(false); }
    }
  };
  if (view.patrols === undefined) return null;
  return <details className="group-movement" data-testid="group-patrols" aria-busy={pending}>
    <summary>Group patrols</summary>
    <p className="group-selection-count">{armies.length} armies selected{outside ? ` · ${outside} outside this filter` : ''}. {overLimit ? 'Reduce the selection before issuing patrol orders.' : `${commands.remove.length} have patrols.`}</p>
    <p className="field-help">Use checked land armies ashore or a saved army group, up to {MAX_GROUP_ORDER_COMMANDS} at a time. Actions include checked armies outside this filter. Each action affects existing policies in the matching enabled/paused state only; armies without a patrol or already in the requested state stay checked.</p>
    <p className="field-help">Pause and Remove stop future patrol assignments. Resume allows future assignments; it does not resume a paused travel route. Existing travel continues unchanged. Use Group travel → Cancel travel routes to stop issued travel too.</p>
    {overLimit && <p className="group-order-error" role="alert">Select at most {MAX_GROUP_ORDER_COMMANDS} armies. No partial selection will be submitted.</p>}
    {warPauseResumes > 0 && <p className="field-help">{warPauseResumes} paused {warPauseResumes === 1 ? 'patrol has' : 'patrols have'} Pause when war begins enabled. Resuming during war pauses that policy again next turn. Change that option in the army’s patrol controls to keep it enabled through war.</p>}
    <div className="group-selection-actions">
      <button disabled={locked || !hash || !commands.pause.length} onClick={() => { void submit('pause'); }}>Pause enabled patrols ({commands.pause.length})</button>
      <button disabled={locked || !hash || !commands.resume.length} onClick={() => { void submit('resume'); }}>Resume paused patrols ({commands.resume.length})</button>
      <button disabled={locked || !hash || !commands.remove.length} onClick={() => { void submit('remove'); }}>Remove selected patrols ({commands.remove.length})</button>
    </div>
    <p className="field-help">Removing a patrol discards its saved points and war option. Accepted armies leave the selection; refused and unaffected armies stay checked.</p>
    {pending && <p role="status">Applying patrol orders…</p>}
    {error && <p className="group-order-error" role="alert">{error}</p>}
    {results && <GroupPatrolResults rows={results.rows} skipped={results.skipped} busy={locked}/>}
  </details>;
}
