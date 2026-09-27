import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Observation } from '@theandril/sim';
import { groupPostingArmies } from './group-postings';
import { MAX_GROUP_ORDER_COMMANDS, type GroupMovementCommand, type GroupMovementPreviewPlan, type GroupMovementResult, type GroupMovementReview } from './protocol';

export type GroupMovementIssue = (commands: GroupMovementCommand[], expectedHash: string) => Promise<GroupMovementResult[]>;
export type GroupMovementPreviewIssue = (plan: GroupMovementPreviewPlan) => Promise<GroupMovementReview>;
export const GROUP_MOVEMENT_PAGE_SIZE = 25;

/** Validate only the input's shape; knowledge and travel legality belong to the worker. */
export function groupMovementTarget(value: string, view: Pick<Observation, 'width' | 'height'>): number | undefined {
  if (!value.trim()) return undefined;
  const target = Number(value);
  return Number.isInteger(target) && target >= 0 && target < view.width * view.height ? target : undefined;
}

export function groupMovementPlan(view: Observation, selected: ReadonlySet<string>, target: number | undefined, append: boolean): GroupMovementPreviewPlan | undefined {
  if (target === undefined || groupMovementTarget(String(target), view) === undefined) return undefined;
  const armyIds = groupPostingArmies(view, selected).map(army => army.id);
  if (!armyIds.length || armyIds.length > MAX_GROUP_ORDER_COMMANDS) return undefined;
  return { factionId: view.factionId, armyIds, target, append };
}

export function groupMovementRouteCommands(view: Observation, selected: ReadonlySet<string>, type: 'resumeMovement' | 'cancelMovement'): GroupMovementCommand[] {
  const routes = new Map(view.routes.map(route => [route.armyId, route]));
  const armies = groupPostingArmies(view, selected);
  if (armies.length > MAX_GROUP_ORDER_COMMANDS) return [];
  return armies.filter(army => {
    const route = routes.get(army.id);
    return route && (type === 'cancelMovement' || route.status === 'paused');
  }).map(army => ({ type, factionId: view.factionId, armyId: army.id }));
}

/** Include every reviewed army: canonical commands report refusals and may see newly revealed terrain. */
export function groupMovementQueueCommands(plan: GroupMovementPreviewPlan): GroupMovementCommand[] {
  return [...plan.armyIds].sort().map(armyId => ({ type: 'queueMovement', factionId: plan.factionId, armyId, target: plan.target, append: plan.append }));
}

export function groupMovementContextKey(hash: string | undefined, plan: GroupMovementPreviewPlan | undefined): string {
  return JSON.stringify([hash ?? '', plan?.factionId, plan ? [...plan.armyIds].sort() : [], plan?.target, plan?.append]);
}

export function groupMovementReviewMatches(review: GroupMovementReview, plan: GroupMovementPreviewPlan | undefined, hash: string | undefined): boolean {
  return Boolean(hash && plan && review.hash === hash && review.target === plan.target && review.append === plan.append
    && review.results.length === plan.armyIds.length
    && review.results.every((row, index) => row.armyId === plan.armyIds[index] && row.target === plan.target));
}

function MovementPages({ rows, label, busy }: { rows: { id: string; content: ReactNode }[]; label: string; busy: boolean }) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(rows.length / GROUP_MOVEMENT_PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  return <><ul>{rows.slice(current * GROUP_MOVEMENT_PAGE_SIZE, (current + 1) * GROUP_MOVEMENT_PAGE_SIZE).map(row => <li key={row.id}>{row.content}</li>)}</ul>
    {pages > 1 && <nav className="registry-pages" aria-label={label}>
      <button disabled={busy || current === 0} aria-label={`Previous ${label.toLowerCase()} page`} onClick={() => setPage(current - 1)}>←</button>
      <span>Page {current + 1} of {pages}</span>
      <button disabled={busy || current === pages - 1} aria-label={`Next ${label.toLowerCase()} page`} onClick={() => setPage(current + 1)}>→</button>
    </nav>}
  </>;
}

export function GroupMovementPreview({ review, names, busy = false }: { review: GroupMovementReview; names: ReadonlyMap<string, string>; busy?: boolean }) {
  const available = review.results.filter(row => row.canQueue).length;
  return <div className="group-movement-review" data-testid="group-movement-preview" data-hash={review.hash}>
    <p role="status">{available} can queue · {review.results.length - available} unavailable. Destination hex {review.target}.</p>
    <MovementPages label="Travel review" busy={busy} rows={review.results.map(row => ({ id: row.armyId, content: <>
      <strong>{names.get(row.armyId) ?? row.armyId}</strong> · {row.canQueue ? 'Can queue' : 'Unavailable'}
      <span>{row.steps} steps · {row.cost} movement</span>
      {row.blocker && <span>{row.blocker}</span>}
      {row.limited && <span>Search limit reached. Choose a nearer waypoint.</span>}
    </> }))}/>
  </div>;
}

export function GroupMovementResults({ rows, busy = false }: { rows: (GroupMovementResult & { name: string })[]; busy?: boolean }) {
  const refused = rows.filter(row => !row.accepted).length;
  return <div data-testid="group-movement-results">
    <p role="status">{rows.length - refused} orders accepted · {refused} refused.{refused > 0 ? ' Refused armies remain selected for review.' : ''}</p>
    <p className="field-help">Accepted travel may have moved, arrived or paused. Check each army’s current route before issuing another order.</p>
    <details><summary>Review travel results</summary><MovementPages label="Travel results" busy={busy} rows={rows.map(row => ({ id: row.armyId, content: <>
      <strong>{row.name}</strong> · {row.accepted ? 'Accepted' : `Refused: ${row.message ?? 'The army could not accept this order.'}`}
      {row.accepted && row.message && <span>{row.message}</span>}
    </> }))}/></details>
  </div>;
}

export function GroupMovementOrders({ view, hash, selected, selectedCell, busy, issue, preview, accepted, onPendingChange }: {
  view: Observation; hash?: string; selected: ReadonlySet<string>; selectedCell?: number; busy: boolean;
  issue: GroupMovementIssue; preview: GroupMovementPreviewIssue; accepted: (ids: ReadonlySet<string>) => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const points = view.settlements.filter(town => town.factionId === view.factionId);
  const [destination, setDestination] = useState(selectedCell === undefined ? points[0]?.id ?? 'hex' : 'map');
  const [hex, setHex] = useState('');
  const [append, setAppend] = useState(false);
  const [pending, setPending] = useState<'review' | 'orders'>();
  const [reviewed, setReviewed] = useState<{ key: string; review: GroupMovementReview }>();
  const [results, setResults] = useState<(GroupMovementResult & { name: string })[]>();
  const [error, setError] = useState('');
  const mounted = useRef(true), inFlight = useRef(false);
  const pendingCallback = useRef(onPendingChange);
  pendingCallback.current = onPendingChange;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; pendingCallback.current(false); }; }, []);
  const armies = groupPostingArmies(view, selected);
  const names = new Map(armies.map(army => [army.id, army.name]));
  const rawTarget = destination === 'map' ? selectedCell : destination === 'hex' ? groupMovementTarget(hex, view) : points.find(town => town.id === destination)?.cell;
  const plan = groupMovementPlan(view, selected, rawTarget, append);
  const contextKey = groupMovementContextKey(hash, plan);
  const currentContext = useRef(contextKey);
  currentContext.current = contextKey;
  // Hide a stale review during render, and discard it so returning to an old selection never resurrects it.
  const ready = reviewed?.key === contextKey && groupMovementReviewMatches(reviewed.review, plan, hash) ? reviewed.review : undefined;
  useEffect(() => { setReviewed(previous => previous?.key === contextKey ? previous : undefined); }, [contextKey]);
  const locked = busy || Boolean(pending);
  const resumes = groupMovementRouteCommands(view, selected, 'resumeMovement');
  const cancellations = groupMovementRouteCommands(view, selected, 'cancelMovement');
  const posted = new Set(view.postings.map(posting => posting.armyId));
  const postedCount = armies.filter(army => posted.has(army.id)).length;
  const cancelledPosts = cancellations.filter(command => posted.has(command.armyId)).length;
  const start = (action: 'review' | 'orders') => {
    inFlight.current = true; setPending(action); pendingCallback.current(true); setError(''); setResults(undefined);
  };
  const finish = () => {
    inFlight.current = false;
    if (mounted.current) { setPending(undefined); pendingCallback.current(false); }
  };
  const reviewRoutes = async () => {
    if (locked || inFlight.current || !plan || !hash) return;
    const key = contextKey;
    start('review'); setReviewed(undefined);
    try {
      const response = await preview(plan);
      if (!mounted.current || currentContext.current !== key) return;
      if (!groupMovementReviewMatches(response, plan, hash)) { setError('The campaign changed during review. Review routes again before applying.'); return; }
      setReviewed({ key, review: response });
    } catch (cause) {
      if (mounted.current && currentContext.current === key) setError(cause instanceof Error ? cause.message : 'Routes could not be reviewed. Try again when the campaign is ready.');
    } finally { finish(); }
  };
  const submit = async (commands: GroupMovementCommand[]) => {
    if (locked || inFlight.current || !hash || !commands.length) return;
    start('orders'); setReviewed(undefined);
    try {
      const response = await issue(commands, hash);
      if (!mounted.current) return;
      setResults(response.map(row => ({ ...row, name: names.get(row.armyId) ?? row.armyId })));
      accepted(new Set(response.filter(row => row.accepted).map(row => row.armyId)));
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : 'The travel response could not be confirmed. Review current routes before retrying.');
    } finally { finish(); }
  };
  const edit = () => { setReviewed(undefined); setError(''); };
  return <details className="group-movement" data-testid="group-movement" aria-busy={Boolean(pending)}>
    <summary>Group travel</summary>
    <p className="field-help">Use checked land armies ashore or recall a saved army group. Review up to {MAX_GROUP_ORDER_COMMANDS} armies together, then apply their individual travel orders.</p>
    <p className="group-selection-count">{armies.length} armies selected for travel.</p>
    <div className="group-posting-fields"><label>Travel destination<select value={destination} disabled={locked} onChange={event => { setDestination(event.target.value); edit(); }}>
      <option value="map" disabled={selectedCell === undefined}>{selectedCell === undefined ? 'No map hex selected' : `Selected map hex · ${selectedCell}`}</option>
      {points.map(town => <option key={town.id} value={town.id}>{town.name} · hex {town.cell}</option>)}
      <option value="hex">Enter a hex number</option>
    </select></label><label>Route mode<select value={append ? 'append' : 'replace'} disabled={locked} onChange={event => { setAppend(event.target.value === 'append'); edit(); }}>
      <option value="replace">Replace route</option><option value="append">Append waypoint</option>
    </select></label></div>
    {destination === 'hex' && <label>Destination hex<input type="number" inputMode="numeric" min={0} max={view.width * view.height - 1} step={1} value={hex} disabled={locked} aria-invalid={hex.length > 0 && groupMovementTarget(hex, view) === undefined} onChange={event => { setHex(event.target.value); edit(); }}/></label>}
    {destination === 'hex' && hex.length > 0 && groupMovementTarget(hex, view) === undefined && <p className="group-order-error">Enter a whole hex number from 0 to {view.width * view.height - 1}.</p>}
    <p className="field-help">{append ? 'Append preserves existing waypoints; paused routes stay paused until explicitly resumed.' : 'Replace substitutes the current route with a journey to this destination.'}</p>
    <p className="field-help">Applying or resuming travel starts movement immediately, in stable army ID order. Each army may arrive or pause; travel never attacks or declares war automatically.</p>
    <p className="field-help">Reviews are advisory. Earlier orders can reveal terrain or change later routes. Changing the selection, destination, route mode or campaign requires a new review.</p>
    <button disabled={locked || !plan || !hash} onClick={() => { void reviewRoutes(); }}>Review routes</button>
    {ready && <GroupMovementPreview key={contextKey} review={ready} names={names} busy={locked}/>}
    <button className="primary" disabled={locked || !ready?.results.some(row => row.canQueue)} onClick={() => {
      if (ready?.results.some(row => row.canQueue) && plan) void submit(groupMovementQueueCommands(plan));
    }}>Apply reviewed routes ({armies.length})</button>
    <p className="field-help">Travel preserves {postedCount} selected {postedCount === 1 ? 'posting' : 'postings'}. Posted armies may march again on the next turn after travel finishes or is cancelled. Use Clear selected postings above to remove those standing orders.</p>
    <div className="group-selection-actions">
      <button disabled={locked || !hash || !resumes.length} onClick={() => { void submit(resumes); }}>Resume paused routes ({resumes.length})</button>
      <button disabled={locked || !hash || !cancellations.length} onClick={() => { void submit(cancellations); }}>Cancel travel routes ({cancellations.length})</button>
    </div>
    {cancelledPosts > 0 && <p className="field-help">Cancelling these routes preserves {cancelledPosts} affected {cancelledPosts === 1 ? 'posting' : 'postings'}; those armies may march again next turn.</p>}
    {!ready && !pending && <p className="field-help">Review routes when the destination and checked armies are ready. Reviews never issue orders.</p>}
    {pending && <p role="status">{pending === 'review' ? 'Reviewing group routes…' : 'Applying travel orders…'}</p>}
    {error && <p className="group-order-error" role="alert">{error}</p>}
    {results && <GroupMovementResults rows={results} busy={locked}/>}
  </details>;
}
