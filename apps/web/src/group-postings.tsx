import { useEffect, useRef, useState } from 'react';
import { GroupPolicyResults } from './group-policy-results';
import type { ArmyView, GameCommand, Observation, PostingMode } from '@theandril/sim';
import { MAX_GROUP_POSTING_COMMANDS, type GroupPostingResult } from './protocol';
import { PostingTemplates } from './posting-templates';

export type GroupPostingCommand = Extract<GameCommand, { type: 'setPosting' }>;
export type { GroupPostingResult } from './protocol';
export type GroupPostingIssue = (commands: GroupPostingCommand[], expectedHash: string) => Promise<GroupPostingResult[]>;
export const GROUP_POSTING_LIMIT = MAX_GROUP_POSTING_COMMANDS;
const byId = (a: { id: string }, b: { id: string }) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
type PostingDestination = number | 'current' | '';

/** A lost hearth requires a fresh choice, never a different order by fallback. */
export function groupPostingDestination(points: Observation['settlements'], destination: PostingDestination): PostingDestination {
  return destination === 'current' || points.some(town => town.cell === destination) ? destination : '';
}

/** This is a presentation selection, never a second command validator. */
export function groupPostingArmies(view: Observation, selected?: ReadonlySet<string>): ArmyView[] {
  return view.armies.filter(army => army.factionId === view.factionId && army.domain === 'land' && !army.carrierId && (!selected || selected.has(army.id))).sort(byId);
}

/** Keep previous selections across pages/filters, then fill the bounded group. */
export function addGroupSelection(selected: ReadonlySet<string>, candidates: readonly string[]): Set<string> {
  const next = new Set(selected);
  for (const id of [...candidates].sort()) {
    if (next.size >= GROUP_POSTING_LIMIT) break;
    next.add(id);
  }
  return next;
}

export function groupPostingCommands(view: Observation, selected: ReadonlySet<string>, destination: number | 'current', mode: PostingMode | 'none'): GroupPostingCommand[] {
  const posted = new Set(view.postings.map(posting => posting.armyId));
  return groupPostingArmies(view, selected).slice(0, GROUP_POSTING_LIMIT)
    .filter(army => mode !== 'none' || posted.has(army.id))
    .map(army => ({ type: 'setPosting', factionId: view.factionId, armyId: army.id, cell: destination === 'current' ? army.cell : destination, mode }));
}

export function GroupPostingOrders({ view, hash, selected, matching, busy, issue, selectMatching, clearSelection, accepted }: {
  view: Observation; hash?: string; selected: ReadonlySet<string>; matching: ReadonlySet<string>; busy: boolean;
  issue: GroupPostingIssue; selectMatching: () => void; clearSelection: () => void; accepted: (ids: ReadonlySet<string>) => void;
}) {
  const points = view.settlements.filter(town => town.factionId === view.factionId);
  const [destination, setDestination] = useState<PostingDestination>('current');
  const [mode, setMode] = useState<PostingMode>('hold');
  const [pending, setPending] = useState(false);
  const [templatesBusy, setTemplatesBusy] = useState(false);
  const [results, setResults] = useState<Array<GroupPostingResult & { name: string }>>();
  const [error, setError] = useState('');
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const armies = groupPostingArmies(view, selected);
  const checked = new Set(armies.map(army => army.id));
  const outside = armies.filter(army => !matching.has(army.id)).length;
  const posted = new Set(view.postings.map(posting => posting.armyId));
  const postedCount = armies.filter(army => posted.has(army.id)).length;
  const locked = busy || pending || templatesBusy;
  const target = groupPostingDestination(points, destination);
  const submit = async (nextMode: PostingMode | 'none') => {
    const commandTarget = nextMode === 'none' ? 'current' : target;
    if (locked || !hash || commandTarget === '') return;
    const commands = groupPostingCommands(view, checked, commandTarget, nextMode);
    if (!commands.length) return;
    const names = new Map(armies.map(army => [army.id, army.name]));
    setPending(true); setError(''); setResults(undefined);
    try {
      const response = await issue(commands, hash);
      if (!mounted.current) return;
      setResults(response.map(result => ({ ...result, name: names.get(result.armyId) ?? result.armyId })));
      accepted(new Set(response.filter(result => result.accepted).map(result => result.armyId)));
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : 'The group order could not be completed. Review the armies before retrying.');
    } finally { if (mounted.current) setPending(false); }
  };
  return <section className="group-postings" data-testid="group-postings" aria-label="Group army postings" aria-busy={pending}>
    <div className="group-selection-actions"><button disabled={locked || checked.size >= GROUP_POSTING_LIMIT || ![...matching].some(id => !checked.has(id))} onClick={selectMatching}>Select matching armies</button><button disabled={locked || !checked.size} onClick={clearSelection}>Clear group selection</button></div>
    <p className="group-selection-count" role="status">{checked.size} armies selected{outside ? ` · ${outside} outside this filter` : ''}</p>
    <p className="field-help">Check land armies ashore to give them a standing posting together. Select up to {GROUP_POSTING_LIMIT} at a time; page and search changes keep your selection.</p>
    {checked.size > 0 && <>
      <div className="group-posting-fields"><label>Group destination<select value={target} disabled={locked} aria-invalid={target === ''} aria-describedby={target === '' ? 'group-posting-destination-error' : undefined} onChange={event => setDestination(event.target.value === 'current' ? 'current' : event.target.value === '' ? '' : Number(event.target.value))}>
        <option value="" disabled>Choose an owned hearth</option>
        <option value="current">Where each army stands</option>
        {points.map(town => <option key={town.id} value={town.cell}>{town.name} · hex {town.cell}</option>)}
      </select></label><label>Group arrival order<select value={mode} disabled={locked} onChange={event => setMode(event.target.value as PostingMode)}><option value="hold">Hold the hex</option><option value="join">Join the force there</option></select></label></div>
      {target === '' && <p id="group-posting-destination-error" className="group-order-error">Choose a current owned hearth or where each army stands before posting. Clearing existing postings is still available.</p>}
      <p className="field-help">Each army receives its own posting. Existing travel orders come first. Routes, arrival and joining use the ordinary army rules; a stalled posting explains its reason in selected orders.</p>
      <PostingTemplates mode={mode} destination={target === '' ? undefined : target === 'current' ? 'current' : 'hearth'} busy={busy || pending} onPendingChange={setTemplatesBusy} recall={template => { setMode(template.mode); setDestination(template.destination === 'current' ? 'current' : ''); setResults(undefined); setError(''); }}/>
      <div className="group-selection-actions"><button className="primary" disabled={locked || !hash || target === ''} onClick={() => { void submit(mode); }}>Post selected armies ({checked.size})</button><button disabled={locked || !hash || !postedCount} onClick={() => { void submit('none'); }}>Clear selected postings ({postedCount})</button></div>
      {postedCount < checked.size && <p className="field-help">Clearing postings leaves the {checked.size - postedCount} selected armies without postings unchanged.</p>}
    </>}
    {pending && <p role="status">Applying group orders…</p>}
    {error && <p className="group-order-error" role="alert">{error}</p>}
    {results && <GroupPolicyResults kind="posting" rows={results.map(result => ({ ...result, id: result.armyId }))} busy={locked}/>}
  </section>;
}
