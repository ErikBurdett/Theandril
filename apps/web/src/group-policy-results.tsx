import { useState } from 'react';

export const GROUP_POLICY_RESULTS_PAGE_SIZE = 25;
export type GroupPolicyResult = { id: string; name: string; accepted: boolean; message?: string };
export type GroupPolicyResultFilter = 'all' | 'accepted' | 'refused';

/** Retain the worker's stable command order; browsing a receipt never issues orders. */
export function groupPolicyResultPage(rows: readonly GroupPolicyResult[], filter: GroupPolicyResultFilter, page: number) {
  const accepted = rows.filter(row => row.accepted).length;
  const matching = rows.filter(row => filter === 'all' || row.accepted === (filter === 'accepted'));
  const pages = Math.max(1, Math.ceil(matching.length / GROUP_POLICY_RESULTS_PAGE_SIZE));
  const current = Math.max(0, Math.min(page, pages - 1));
  return { accepted, refused: rows.length - accepted, total: rows.length, matching: matching.length, pages, current,
    rows: matching.slice(current * GROUP_POLICY_RESULTS_PAGE_SIZE, (current + 1) * GROUP_POLICY_RESULTS_PAGE_SIZE) };
}

export function GroupPolicyResults({ kind, rows, busy = false }: {
  kind: 'posting' | 'charter'; rows: readonly GroupPolicyResult[]; busy?: boolean;
}) {
  const hasRefusals = rows.some(row => !row.accepted);
  const [filter, setFilter] = useState<GroupPolicyResultFilter>(hasRefusals ? 'refused' : 'all');
  const [page, setPage] = useState(0);
  const result = groupPolicyResultPage(rows, filter, page);
  const title = kind === 'posting' ? 'Posting' : 'Charter';
  const actors = kind === 'posting' ? 'armies' : 'hearths';
  return <div data-testid={`group-${kind}-results`}>
    <p role="status">{result.accepted} orders accepted · {result.refused} refused.{result.refused > 0 ? ` Refused ${actors} remain selected for review.` : ''}</p>
    <details open={hasRefusals}>
      <summary>Review {kind} results</summary>
      <p className="field-help">This receipt shows the last submitted orders. Browsing results does not change your selection or retry any order.</p>
      <label>{title} result filter<select value={filter} disabled={busy} onChange={event => { setFilter(event.target.value as GroupPolicyResultFilter); setPage(0); }}>
        <option value="all">All results ({result.total})</option>
        <option value="accepted">Accepted ({result.accepted})</option>
        <option value="refused">Refused ({result.refused})</option>
      </select></label>
      {result.rows.length ? <ul aria-label={`${title} order results`}>{result.rows.map(row => <li key={row.id}>
        <strong>{row.name}</strong> · {row.accepted ? 'Accepted' : 'Refused'}{row.message ? `: ${row.message}` : !row.accepted ? ': The order could not be accepted.' : ''}
      </li>)}</ul> : <p role="status">No {filter === 'all' ? '' : `${filter} `}orders in this receipt.</p>}
      <nav className="registry-pages" aria-label={`${title} results pages`}>
        <button disabled={busy || result.current === 0} aria-label={`Previous ${kind} results page`} onClick={() => setPage(result.current - 1)}>←</button>
        <span role="status">Page {result.current + 1} of {result.pages} · {result.matching} {filter === 'all' ? 'total' : filter}</span>
        <button disabled={busy || result.current === result.pages - 1} aria-label={`Next ${kind} results page`} onClick={() => setPage(result.current + 1)}>→</button>
      </nav>
    </details>
  </div>;
}
