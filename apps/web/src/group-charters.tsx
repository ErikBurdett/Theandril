import { useEffect, useRef, useState } from 'react';
import { CHARTER_CEILING_MAX, CHARTER_CEILING_MIN, CHARTER_FOCI, CHARTER_NAMES, CHARTER_RESERVE, type CharterFocus, type GameCommand, type Observation } from '@theandril/sim';
import { MAX_GROUP_ORDER_COMMANDS, type GroupCharterResult } from './protocol';

export type GroupCharterCommand = Extract<GameCommand, { type: 'setCharter' }>;
export type { GroupCharterResult } from './protocol';
export type GroupCharterIssue = (commands: GroupCharterCommand[]) => Promise<GroupCharterResult[]>;
const byId = (a: { id: string }, b: { id: string }) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;

/** Snapshot permitted selection only; the canonical command decides legality. */
export function groupCharterTowns(view: Observation, selected?: ReadonlySet<string>): Observation['settlements'] {
  return view.settlements.filter(town => town.factionId === view.factionId && (!selected || selected.has(town.id))).sort(byId);
}

export function groupCharterCommands(view: Observation, selected: ReadonlySet<string>, focus: CharterFocus | 'none', ceiling: number): GroupCharterCommand[] {
  const charters = new Map(view.charters.map(charter => [charter.settlementId, charter]));
  return groupCharterTowns(view, selected).slice(0, MAX_GROUP_ORDER_COMMANDS)
    .filter(town => focus !== 'none' || charters.has(town.id))
    .map(town => ({ type: 'setCharter', factionId: view.factionId, settlementId: town.id, focus,
      // Revoking a charter does not depend on the unsubmitted grant form.
      ceiling: focus === 'none' ? charters.get(town.id)!.ceiling : ceiling }));
}

export function GroupCharterOrders({ view, selected, matching, busy, issue, selectMatching, clearSelection, accepted }: {
  view: Observation; selected: ReadonlySet<string>; matching: ReadonlySet<string>; busy: boolean;
  issue: GroupCharterIssue; selectMatching: () => void; clearSelection: () => void; accepted: (ids: ReadonlySet<string>) => void;
}) {
  const [focus, setFocus] = useState<CharterFocus>('works');
  const [ceilingText, setCeilingText] = useState('24');
  const [pending, setPending] = useState(false);
  const [results, setResults] = useState<Array<GroupCharterResult & { name: string }>>();
  const [error, setError] = useState('');
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const towns = groupCharterTowns(view, selected);
  const checked = new Set(towns.map(town => town.id));
  const outside = towns.filter(town => !matching.has(town.id)).length;
  const chartered = new Set(view.charters.map(charter => charter.settlementId));
  const charterCount = towns.filter(town => chartered.has(town.id)).length;
  const queuedCount = towns.filter(town => town.queue.length > 0).length;
  const ceiling = Number(ceilingText);
  const validCeiling = ceilingText.trim() !== '' && Number.isInteger(ceiling) && ceiling >= CHARTER_CEILING_MIN && ceiling <= CHARTER_CEILING_MAX;
  const locked = busy || pending;
  const submit = async (nextFocus: CharterFocus | 'none') => {
    if (locked || (nextFocus !== 'none' && !validCeiling)) return;
    const commands = groupCharterCommands(view, checked, nextFocus, ceiling);
    if (!commands.length) return;
    const names = new Map(towns.map(town => [town.id, town.name]));
    setPending(true); setError(''); setResults(undefined);
    try {
      const response = await issue(commands);
      if (!mounted.current) return;
      setResults(response.map(result => ({ ...result, name: names.get(result.settlementId) ?? result.settlementId })));
      accepted(new Set(response.filter(result => result.accepted).map(result => result.settlementId)));
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : 'The charter orders could not be completed. Review the hearths before retrying.');
    } finally { if (mounted.current) setPending(false); }
  };
  const refused = results?.filter(result => !result.accepted) ?? [];
  return <section className="group-postings group-charters" data-testid="group-charters" aria-label="Group hearth charters" aria-busy={pending}>
    <div className="group-selection-actions"><button disabled={locked || checked.size >= MAX_GROUP_ORDER_COMMANDS || ![...matching].some(id => !checked.has(id))} onClick={selectMatching}>Select matching hearths</button><button disabled={locked || !checked.size} onClick={clearSelection}>Clear hearth selection</button></div>
    <p className="group-selection-count" role="status">{checked.size} {checked.size === 1 ? 'hearth' : 'hearths'} selected{outside ? ` · ${outside} outside this filter` : ''}</p>
    <p className="field-help">Check hearths to give them standing charters together. Select up to {MAX_GROUP_ORDER_COMMANDS} at a time; page, search and registry changes keep your selection.</p>
    {checked.size > 0 && <>
      <div className="group-posting-fields"><label>Charter focus<select value={focus} disabled={locked} onChange={event => setFocus(event.target.value as CharterFocus)}>{CHARTER_FOCI.map(option => <option key={option} value={option}>{CHARTER_NAMES[option]}</option>)}</select></label>
        <label>Coin ceiling per hearth<input type="number" value={ceilingText} min={CHARTER_CEILING_MIN} max={CHARTER_CEILING_MAX} step={1} required disabled={locked} aria-invalid={!validCeiling} aria-describedby={!validCeiling ? 'group-charter-ceiling-error' : undefined} onChange={event => setCeilingText(event.target.value)}/></label></div>
      {!validCeiling && <p id="group-charter-ceiling-error" className="group-order-error">Choose a whole coin amount from {CHARTER_CEILING_MIN} to {CHARTER_CEILING_MAX}.</p>}
      <p className="field-help">Applying charters spends no coin now. Each hearth may spend up to its ceiling on one work whenever its queue is empty, once per turn after upkeep. All charters share your treasury and leave {CHARTER_RESERVE} coin in reserve.</p>
      <p className="field-help">Works, Wealth and Learning prioritize buildings; Muster raises land companies that add upkeep. Existing production orders stay in place. Revoking a charter stops future orders and keeps its current queue.</p>
      {queuedCount > 0 && <p className="field-help">{queuedCount} selected {queuedCount === 1 ? 'hearth already has' : 'hearths already have'} production queued; those orders come first.</p>}
      <div className="group-selection-actions"><button className="primary" disabled={locked || !validCeiling} onClick={() => { void submit(focus); }}>Apply charters ({checked.size})</button><button disabled={locked || !charterCount} onClick={() => { void submit('none'); }}>Revoke charters ({charterCount})</button></div>
      {charterCount < checked.size && <p className="field-help">Revocation leaves the {checked.size - charterCount} selected {checked.size - charterCount === 1 ? 'hearth' : 'hearths'} without charters unchanged.</p>}
    </>}
    {pending && <p role="status">Applying charter orders…</p>}
    {error && <p className="group-order-error" role="alert">{error}</p>}
    {results && <div data-testid="group-charter-results"><p role="status">{results.length - refused.length} orders accepted · {refused.length} refused.{refused.length > 0 ? ' Refused hearths remain selected for review.' : ''}</p>{refused.length > 0 && <ul>{refused.map(result => <li key={result.settlementId}><strong>{result.name}</strong> · {result.message ?? 'The hearth could not accept this order.'}</li>)}</ul>}</div>}
  </section>;
}
