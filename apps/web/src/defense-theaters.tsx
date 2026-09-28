import { useEffect, useRef, useState } from 'react';
import { MAX_THEATERS_PER_FACTION, MAX_THEATER_HEARTHS, MAX_THEATER_MEMBERS, MAX_THEATER_DISPATCHES, type GameCommand, type Observation } from '@theandril/sim';

export type TheaterCommand = Extract<GameCommand, { type: 'setTheater' | 'deleteTheater' }>;
export type TheaterIssue = (command: TheaterCommand) => Promise<{ accepted: boolean; message: string }>;
type Theater = NonNullable<Observation['theaters']>[number];
type TheaterDraft = Pick<Theater, 'name' | 'settlementIds' | 'armyIds' | 'reserveCell' | 'guardsPerSettlement' | 'reinforcementLimit' | 'enabled'>;
export const THEATER_PAGE_SIZE = 25;
const MAX_THEATERS = MAX_THEATERS_PER_FACTION, MAX_HEARTHS = MAX_THEATER_HEARTHS, MAX_MEMBERS = MAX_THEATER_MEMBERS, NAME_MAX = 40;
const stableIds = (ids: readonly string[]) => [...ids].sort();
const ownTheaters = (view: Observation) => (view.theaters ?? []).filter(theater => theater.factionId === view.factionId);

/** Presentation eligibility uses the existing permitted army capabilities. */
export function theaterArmySelection(view: Observation, checked: ReadonlySet<string>, theaterId?: string) {
  const assigned = new Set(ownTheaters(view).filter(theater => theater.id !== theaterId).flatMap(theater => theater.armyIds));
  const eligible = view.armies.filter(army => checked.has(army.id) && army.factionId === view.factionId && army.domain === 'land' && army.canAttack && !army.canFound && !army.carrierId);
  const armyIds = stableIds(eligible.filter(army => !assigned.has(army.id)).map(army => army.id));
  return { armyIds, unavailable: checked.size - eligible.length, assignedElsewhere: eligible.filter(army => assigned.has(army.id)).length };
}

export function theaterDraft(theater?: Theater, reserveCell = -1): TheaterDraft {
  return theater ? { name: theater.name, settlementIds: [...theater.settlementIds], armyIds: [...theater.armyIds], reserveCell: theater.reserveCell, guardsPerSettlement: theater.guardsPerSettlement, reinforcementLimit: theater.reinforcementLimit ?? 0, enabled: theater.enabled }
    : { name: '', settlementIds: [], armyIds: [], reserveCell, guardsPerSettlement: 1, reinforcementLimit: 0, enabled: true };
}

export function theaterMembershipChange(previous: readonly string[], next: readonly string[]) {
  const before = new Set(previous), after = new Set(next);
  return { removed: stableIds(previous.filter(id => !after.has(id))), added: stableIds(next.filter(id => !before.has(id))) };
}

/** Bounded editor checks; the simulation remains the command authority. */
export function theaterDraftCommand(view: Observation, draft: TheaterDraft, theaterId?: string): TheaterCommand | undefined {
  if (!view.theaters) return undefined;
  if (!Number.isInteger(draft.reinforcementLimit ?? 0) || (draft.reinforcementLimit ?? 0) < 0 || (draft.reinforcementLimit ?? 0) > 4) return undefined;
  const theaters = ownTheaters(view), previous = theaters.find(theater => theater.id === theaterId);
  if (theaterId && !previous) return undefined;
  if (!previous && theaters.length >= MAX_THEATERS) return undefined;
  const name = draft.name.trim();
  if (!name || name.length > NAME_MAX || theaters.some(theater => theater.id !== theaterId && theater.name.toLowerCase() === name.toLowerCase())) return undefined;
  if (!Number.isInteger(draft.reserveCell) || draft.reserveCell < 0 || draft.reserveCell >= view.width * view.height || !Number.isInteger(draft.guardsPerSettlement) || draft.guardsPerSettlement < 1 || draft.guardsPerSettlement > 4) return undefined;
  if (!draft.settlementIds.length || draft.settlementIds.length > MAX_HEARTHS || draft.armyIds.length > MAX_MEMBERS || (!previous && !draft.armyIds.length)) return undefined;
  if (new Set(draft.settlementIds).size !== draft.settlementIds.length || new Set(draft.armyIds).size !== draft.armyIds.length) return undefined;
  const otherHearths = new Set(theaters.filter(theater => theater.id !== theaterId).flatMap(theater => theater.settlementIds));
  const ownHearths = new Set(view.settlements.filter(town => town.factionId === view.factionId).map(town => town.id));
  if (draft.settlementIds.some(id => otherHearths.has(id) || (!ownHearths.has(id) && !previous?.settlementIds.includes(id)))) return undefined;
  const available = new Set(theaterArmySelection(view, new Set(draft.armyIds), theaterId).armyIds);
  if (draft.armyIds.some(id => !available.has(id) && !previous?.armyIds.includes(id))) return undefined;
  const { reinforcementLimit, ...base } = draft;
  return { type: 'setTheater', factionId: view.factionId, ...(theaterId ? { theaterId } : {}), ...base, ...(view.theaterReinforcement ? { reinforcementLimit: reinforcementLimit ?? 0 } : {}), name, settlementIds: stableIds(draft.settlementIds), armyIds: stableIds(draft.armyIds) };
}

/** Detach only this current member; unsaved editor changes cannot enter the order. */
export function detachTheaterMember(view: Observation, theaterId: string, armyId: string): TheaterCommand | undefined {
  const theater = ownTheaters(view).find(row => row.id === theaterId);
  if (!theater?.armyIds.includes(armyId)) return undefined;
  return theaterDraftCommand(view, { ...theaterDraft(theater), armyIds: theater.armyIds.filter(id => id !== armyId) }, theaterId);
}

function TheaterPages({ page, pages, label, locked, change }: { page: number; pages: number; label: string; locked: boolean; change: (page: number) => void }) {
  return pages > 1 && <nav className="registry-pages" aria-label={`${label} pages`}><button disabled={locked || page === 0} aria-label={`Previous ${label} page`} onClick={() => change(page - 1)}>←</button><span>Page {page + 1} of {pages}</span><button disabled={locked || page === pages - 1} aria-label={`Next ${label} page`} onClick={() => change(page + 1)}>→</button></nav>;
}

export function TheaterReport({ theater, names, busy, detach }: { theater: Theater; names: ReadonlyMap<string, string>; busy: boolean; detach: (armyId: string) => void }) {
  const [memberPage, setMemberPage] = useState(0), [dispatchPage, setDispatchPage] = useState(0);
  const memberPages = Math.max(1, Math.ceil(theater.members.length / THEATER_PAGE_SIZE)), memberCurrent = Math.min(memberPage, memberPages - 1);
  const dispatchPages = Math.max(1, Math.ceil(theater.lastDispatches.length / THEATER_PAGE_SIZE)), dispatchCurrent = Math.min(dispatchPage, dispatchPages - 1);
  const count = (status: Theater['members'][number]['status']) => theater.members.filter(member => member.status === status).length;
  return <section className="theater-report" data-testid="theater-report" aria-label={`${theater.name} defense report`}>
    <h4>{theater.name} · {theater.enabled ? 'Enabled' : 'Paused'}</h4>
    <p>{theater.missingGuards} missing guards · {count('incoming')} incoming · {count('reserve')} in reserve · {count('overridden')} direct overrides.</p>
    {theater.blocker && <p className="field-help">{theater.blocker}</p>}
    <h5>Protected hearths</h5><ul data-testid="theater-hearth-report">{theater.hearths.map(hearth => <li key={hearth.settlementId}><strong>{hearth.name}</strong>{hearth.available ? <> · {hearth.stationed} stationed · {hearth.incoming} incoming · {hearth.required} required · {hearth.deficit} missing{hearth.cell !== null ? ` · hex ${hearth.cell}` : ''}{hearth.reinforcement && <span> · {hearth.reinforcement.visibleEnemies} visible enemy armies nearby · {hearth.reinforcement.extraGuards} extra guards requested{hearth.reinforcement.holdUntilTurn !== null && !hearth.reinforcement.visibleEnemies ? ` · hold through turn ${hearth.reinforcement.holdUntilTurn}` : ''}</span>}</> : ' · Unavailable. Retained in this theater; no guards dispatched here.'}</li>)}</ul>
    <h5>Member armies</h5><ul data-testid="theater-member-report">{theater.members.slice(memberCurrent * THEATER_PAGE_SIZE, (memberCurrent + 1) * THEATER_PAGE_SIZE).map(member => <li key={member.armyId}><strong>{names.get(member.armyId) ?? member.armyId}</strong><span>{member.status}{member.cell !== null ? ` · hex ${member.cell}` : ''}{member.targetCell !== null ? ` · assigned hex ${member.targetCell}` : ''}</span>{member.blocker && <span>{member.blocker}</span>}<button disabled={busy} aria-label={`Detach ${names.get(member.armyId) ?? member.armyId} from theater`} onClick={() => detach(member.armyId)}>Detach army</button></li>)}</ul>
    {!theater.members.length && <p className="field-help">No member armies. Add checked armies to this theater to staff its hearths.</p>}
    <TheaterPages page={memberCurrent} pages={memberPages} label="theater members" locked={busy} change={setMemberPage}/>
    <details className="theater-dispatches"><summary>Last theater dispatches{theater.lastRunTurn !== null ? ` · turn ${theater.lastRunTurn}` : ''}</summary><p className="field-help">Actual attempts from the last theater allocation, not a route preview. Accepted travel may have arrived or paused.</p>
      {!theater.lastDispatches.length ? <p>No dispatch attempts recorded.</p> : <ul data-testid="theater-dispatch-report">{theater.lastDispatches.slice(dispatchCurrent * THEATER_PAGE_SIZE, (dispatchCurrent + 1) * THEATER_PAGE_SIZE).map((dispatch, index) => <li key={`${dispatch.armyId}:${index}`}><strong>{names.get(dispatch.armyId) ?? dispatch.armyId}</strong> · hex {dispatch.targetCell} · {dispatch.accepted ? 'Accepted' : 'Refused'}: {dispatch.message}</li>)}</ul>}
      <TheaterPages page={dispatchCurrent} pages={dispatchPages} label="theater dispatches" locked={busy} change={setDispatchPage}/>
    </details>
  </section>;
}

export function TheaterEditor({ view, theater, checked, knownSelectedCell, busy, save }: {
  view: Observation; theater?: Theater; checked: ReadonlySet<string>; knownSelectedCell?: number; busy: boolean; save: (command: TheaterCommand, createdName?: string) => void;
}) {
  const ownTowns = view.settlements.filter(town => town.factionId === view.factionId).sort((a, b) => a.id.localeCompare(b.id));
  const knownMapCell = knownSelectedCell !== undefined && Number.isInteger(knownSelectedCell) && knownSelectedCell >= 0 && knownSelectedCell < view.width * view.height ? knownSelectedCell : undefined;
  const [draft, setDraft] = useState(() => theaterDraft(theater, knownMapCell ?? ownTowns[0]?.cell));
  const [search, setSearch] = useState(''), [page, setPage] = useState(0), [copied, setCopied] = useState(false);
  const available = theaterArmySelection(view, checked, theater?.id);
  const otherTheaters = ownTheaters(view).filter(row => row.id !== theater?.id);
  const owners = new Map(otherTheaters.flatMap(row => row.settlementIds.map(id => [id, row.name] as const)));
  const needle = search.trim().toLowerCase(), towns = ownTowns.filter(town => `${town.name} ${town.id}`.toLowerCase().includes(needle));
  const pages = Math.max(1, Math.ceil(towns.length / THEATER_PAGE_SIZE)), current = Math.min(page, pages - 1);
  const ownTownIds = new Set(ownTowns.map(town => town.id));
  const unavailable = draft.settlementIds.filter(id => !ownTownIds.has(id));
  const reserves = new Map<number, string>();
  if (knownMapCell !== undefined) reserves.set(knownMapCell, `Known selected map hex · ${knownMapCell}`);
  for (const town of ownTowns) reserves.set(town.cell, `${town.name} · hex ${town.cell}`);
  if (theater && !reserves.has(theater.reserveCell)) reserves.set(theater.reserveCell, `Current reserve · hex ${theater.reserveCell}`);
  const command = theaterDraftCommand(view, draft, theater?.id);
  const reserveAvailable = reserves.has(draft.reserveCell);
  const change = theaterMembershipChange(theater?.armyIds ?? [], draft.armyIds);
  const toggleHearth = (id: string, selected: boolean) => setDraft(previous => ({ ...previous, settlementIds: selected ? [...previous.settlementIds, id] : previous.settlementIds.filter(member => member !== id) }));
  return <section className="theater-editor" aria-label={theater ? 'Edit defensive theater' : 'Create defensive theater'}>
    <label>Theater name<input value={draft.name} maxLength={NAME_MAX} disabled={busy} onChange={event => setDraft({ ...draft, name: event.target.value })}/></label>
    <p className="field-help">Use a unique name of up to {NAME_MAX} characters. A hearth or army belongs to only one theater.</p>
    <label>Reserve destination<select value={reserveAvailable ? draft.reserveCell : ''} disabled={busy} onChange={event => setDraft({ ...draft, reserveCell: Number(event.target.value) })}><option value="" disabled>Choose a known map hex or owned hearth</option>{[...reserves].map(([cell, name]) => <option value={cell} key={cell}>{name}</option>)}</select></label>
    <label>Guards per hearth<select value={draft.guardsPerSettlement} disabled={busy} onChange={event => setDraft({ ...draft, guardsPerSettlement: Number(event.target.value) })}>{[1, 2, 3, 4].map(count => <option value={count} key={count}>{count} {count === 1 ? 'army' : 'armies'}</option>)}</select></label>
    {view.theaterReinforcement && <><label>Extra guards when threatened<select value={draft.reinforcementLimit ?? 0} disabled={busy} onChange={event => setDraft({ ...draft, reinforcementLimit: Number(event.target.value) })}>{[0, 1, 2, 3, 4].map(count => <option value={count} key={count}>{count === 0 ? 'Off' : `Up to ${count} extra ${count === 1 ? 'army' : 'armies'}`}</option>)}</select></label><p className="field-help">Visible wartime combat land armies within three hexes request one extra guard each, up to this limit. Extra guards hold through one quiet turn. Only idle assigned members can respond; minimum garrisons and direct orders keep priority. Army counts do not predict battle strength.</p></>}
    <label className="theater-check"><input type="checkbox" checked={draft.enabled} disabled={busy} onChange={event => setDraft({ ...draft, enabled: event.target.checked })}/>Enable dispatch on the next End turn</label>
    <fieldset disabled={busy}><legend>Protected hearths · {draft.settlementIds.length} / {MAX_HEARTHS}</legend>
      <label>Find protected hearths<input type="search" value={search} onChange={event => { setSearch(event.target.value); setPage(0); }}/></label>
      <ul className="theater-hearth-picker">{towns.slice(current * THEATER_PAGE_SIZE, (current + 1) * THEATER_PAGE_SIZE).map(town => <li key={town.id}><label className="theater-check"><input type="checkbox" checked={draft.settlementIds.includes(town.id)} disabled={busy || owners.has(town.id) || (!draft.settlementIds.includes(town.id) && draft.settlementIds.length >= MAX_HEARTHS)} onChange={event => toggleHearth(town.id, event.target.checked)}/><span>{town.name} · hex {town.cell}{owners.has(town.id) && <small>Protected by {owners.get(town.id)}</small>}</span></label></li>)}</ul>
      {!towns.length && <p className="field-help">No matching owned hearths.</p>}
      <TheaterPages page={current} pages={pages} label="protected hearths" locked={busy} change={setPage}/>
      {unavailable.map(id => <label className="theater-check" key={id}><input type="checkbox" checked disabled={busy} onChange={() => toggleHearth(id, false)}/>{theater?.hearths.find(hearth => hearth.settlementId === id)?.name ?? id} · Unavailable; retained until unchecked</label>)}
    </fieldset>
    <p className="field-help">{draft.armyIds.length} draft member armies · {available.armyIds.length} eligible checked armies. {available.unavailable} unavailable or noncombat · {available.assignedElsewhere} assigned to another theater.</p>
    <button disabled={busy || available.armyIds.length > MAX_MEMBERS || (!theater && !available.armyIds.length)} onClick={() => { setDraft({ ...draft, armyIds: [...available.armyIds] }); setCopied(true); }}>Use checked armies ({available.armyIds.length})</button>
    <p className="field-help">Use checked armies replaces the draft membership; it issues no order. Only owned combat land armies ashore can be added. Existing member armies stay assigned while other settings are edited.</p>
    {theater && <p className="field-help">Saving replaces the theater configuration. {change.removed.length} existing member armies will be removed and {change.added.length} added. Removed armies keep existing travel routes.</p>}
    {copied && <p role="status">Copied {draft.armyIds.length} checked armies into the draft. Save explicitly to change the theater.</p>}
    <button className="primary" disabled={busy || !command || !reserveAvailable} onClick={() => { if (command && reserveAvailable) save(command, theater ? undefined : draft.name.trim()); }}>{theater ? 'Save theater changes' : 'Create theater'}</button>
    {theater && <button disabled={busy} onClick={() => { setDraft(theaterDraft(theater)); setCopied(false); }}>Reset theater draft</button>}
    {!command && <p className="field-help">Choose a unique name, one to sixteen protected hearths and a reserve destination. New theaters need one to 128 member armies; existing theaters may have none.</p>}
  </section>;
}

export function DefenseTheaters({ view, checked, knownSelectedCell, busy, issue, onPendingChange, theaterFocus }: {
  view: Observation; checked: ReadonlySet<string>; knownSelectedCell?: number; busy: boolean; issue: TheaterIssue; onPendingChange: (pending: boolean) => void; theaterFocus?: { id: string; nonce: number };
}) {
  const details = useRef<HTMLDetailsElement>(null);
  const [selectedId, setSelectedId] = useState(''), [createdName, setCreatedName] = useState<string>();
  const [pending, setPending] = useState(false), [status, setStatus] = useState(''), [error, setError] = useState('');
  const mounted = useRef(true), working = useRef(false), faction = useRef(view.factionId), pendingCallback = useRef(onPendingChange);
  faction.current = view.factionId; pendingCallback.current = onPendingChange;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; pendingCallback.current(false); }; }, []);
  const theaters = ownTheaters(view).sort((a, b) => a.id.localeCompare(b.id)), selected = theaters.find(theater => theater.id === selectedId);
  const names = new Map(view.armies.filter(army => army.factionId === view.factionId).map(army => [army.id, army.name]));
  const locked = busy || pending;
  useEffect(() => {
    if (!theaterFocus || !view.theaters?.some(row => row.id === theaterFocus.id)) return;
    setSelectedId(theaterFocus.id);
    if (details.current) details.current.open = true;
    // The parent first opens/focuses its native dialog. Move to the requested
    // disclosure after that mount effect, once the dialog can receive focus.
    const frame = requestAnimationFrame(() => {
      details.current?.querySelector('summary')?.focus();
      details.current?.scrollIntoView({ block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [theaterFocus]);
  useEffect(() => {
    if (!createdName) return;
    const created = theaters.find(theater => theater.name === createdName);
    if (created) { setSelectedId(created.id); setCreatedName(undefined); }
  }, [createdName, theaters]);
  const submit = async (command: TheaterCommand | undefined, newName?: string) => {
    if (!command || locked || working.current) return;
    const owner = view.factionId;
    working.current = true; setPending(true); pendingCallback.current(true); setStatus(''); setError('');
    try {
      const result = await issue(command);
      if (!mounted.current || faction.current !== owner) return;
      if (!result.accepted) { setError(result.message); return; }
      setStatus(result.message);
      if (command.type === 'deleteTheater') setSelectedId('');
      else if (newName) setCreatedName(newName);
    } catch (cause) {
      if (mounted.current && faction.current === owner) setError(cause instanceof Error ? cause.message : 'The theater change could not be confirmed. Restore the campaign if required before retrying.');
    } finally { working.current = false; if (mounted.current) { setPending(false); pendingCallback.current(false); } }
  };
  return <details ref={details} className="defense-theaters" data-testid="defense-theaters" aria-busy={pending}>
    <summary>Defensive theaters</summary>
    <p className="field-help">Assign armies to protect named hearths and gather surplus at a reserve hex. Allocation runs on the next End turn and never attacks automatically. Active or paused direct routes and standing postings override theater dispatch.</p>
    <p className="field-help">Each theater attempts at most {MAX_THEATER_DISPATCHES} new routes per turn. Unfilled garrison gaps remain visible for later allocation.</p>
    {view.theaters === undefined ? <p>This historical campaign has no defensive-theater controls.</p> : <>
      <label>Defensive theater<select value={selected?.id ?? ''} disabled={locked} onChange={event => { setSelectedId(event.target.value); setStatus(''); setError(''); }}><option value="">New theater</option>{theaters.map(theater => <option value={theater.id} key={theater.id}>{theater.name} · {theater.enabled ? 'Enabled' : 'Paused'} · {theater.missingGuards} missing guards</option>)}</select></label>
      <p className="field-help">{theaters.length} / {MAX_THEATERS} theaters. Guards are whole armies, not formations or soldiers.</p>
      {!selected && theaters.length >= MAX_THEATERS ? <p className="field-help">This realm has eight theaters. Choose one to edit or delete.</p> : <TheaterEditor key={`${view.factionId}:${selected?.id ?? 'new'}:${JSON.stringify(selected ? theaterDraft(selected) : null)}`} view={view} theater={selected} checked={checked} knownSelectedCell={knownSelectedCell} busy={locked} save={(command, name) => { void submit(command, name); }}/>}
      <p className="field-help">Pause, delete and detach stop future theater dispatch only. Existing routes continue; cancel travel separately when needed. Captured hearths remain listed but are not staffed. Lost member armies are pruned.</p>
      {selected && <><div className="group-selection-actions"><button disabled={locked} onClick={() => { void submit(theaterDraftCommand(view, { ...theaterDraft(selected), enabled: !selected.enabled }, selected.id)); }}>{selected.enabled ? 'Pause theater' : 'Enable theater'}</button><button disabled={locked} onClick={() => { void submit({ type: 'deleteTheater', factionId: view.factionId, theaterId: selected.id }); }}>Delete theater</button></div>
        <TheaterReport key={selected.id} theater={selected} names={names} busy={locked} detach={armyId => { void submit(detachTheaterMember(view, selected.id, armyId)); }}/></>}
    </>}
    {pending && <p role="status">Saving theater changes…</p>}{status && <p role="status">{status}</p>}{error && <p role="alert" className="group-order-error">{error}</p>}
  </details>;
}
