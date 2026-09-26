import { useEffect, useRef, useState } from 'react';
import { MAX_SELECTION_GROUPS_PER_FACTION, MAX_SELECTION_GROUP_MEMBERS, SELECTION_GROUP_NAME_MAX, type GameCommand, type Observation } from '@theandril/sim';
import { groupPostingArmies } from './group-postings';
import { groupCharterTowns } from './group-charters';

export type SelectionGroupCommand = Extract<GameCommand, { type: 'setSelectionGroup' | 'deleteSelectionGroup' }>;
export type SelectionGroupResult = { accepted: boolean; message?: string };
export type SelectionGroupIssue = (command: SelectionGroupCommand) => Promise<SelectionGroupResult>;
type SavedGroup = Observation['selectionGroups'][number];
type GroupKind = SavedGroup['kind'];

/** Reuse the registry's permitted members; recalling never issues a command. */
export function recallSelectionGroup(view: Observation, group: SavedGroup) {
  const members = new Set(group.memberIds);
  const eligible = new Set((group.kind === 'armies' ? groupPostingArmies(view) : groupCharterTowns(view)).map(item => item.id));
  const selected = new Set(group.factionId === view.factionId ? [...members].filter(id => eligible.has(id)).sort() : []);
  const embarked = group.factionId === view.factionId && group.kind === 'armies'
    ? view.armies.filter(army => members.has(army.id) && army.factionId === view.factionId && army.domain === 'land' && Boolean(army.carrierId)).length : 0;
  return { selected, embarked, unavailable: members.size - selected.size - embarked };
}

export function selectionGroupMembers(view: Observation, kind: GroupKind, checked: ReadonlySet<string>): string[] {
  return (kind === 'armies' ? groupPostingArmies(view) : groupCharterTowns(view))
    .filter(item => checked.has(item.id)).map(item => item.id).sort();
}

export function SelectionGroups({ view, kind, checked, busy, issue, recall, onPendingChange }: {
  view: Observation; kind: GroupKind; checked: ReadonlySet<string>; busy: boolean; issue: SelectionGroupIssue;
  recall: (ids: ReadonlySet<string>) => void; onPendingChange: (pending: boolean) => void;
}) {
  const [selectedId, setSelectedId] = useState('');
  const [name, setName] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [recalled, setRecalled] = useState('');
  const mounted = useRef(true), working = useRef(false);
  const pendingCallback = useRef(onPendingChange);
  pendingCallback.current = onPendingChange;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; pendingCallback.current(false); }; }, []);
  const ownGroups = view.selectionGroups.filter(group => group.factionId === view.factionId);
  const groups = ownGroups.filter(group => group.kind === kind).sort((a, b) => a.name.toLowerCase() < b.name.toLowerCase() ? -1 : a.name.toLowerCase() > b.name.toLowerCase() ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const selected = groups.find(group => group.id === selectedId);
  const memberIds = selectionGroupMembers(view, kind, checked);
  const memberSet = new Set(memberIds);
  const omitted = selected?.memberIds.filter(id => !memberSet.has(id)).length ?? 0;
  const label = kind === 'armies' ? 'army' : 'hearth';
  const plural = kind === 'armies' ? 'armies' : 'hearths';
  const locked = busy || pending;
  const validName = name.trim().length > 0 && name.trim().length <= SELECTION_GROUP_NAME_MAX;
  const submit = async (action: 'create' | 'update' | 'delete') => {
    if (locked || working.current || (action !== 'create' && !selected)) return;
    if (action !== 'delete' && (!validName || memberIds.length > MAX_SELECTION_GROUP_MEMBERS || (action === 'create' && !memberIds.length))) return;
    const groupName = action === 'delete' ? selected!.name : name.trim();
    const command: SelectionGroupCommand = action === 'delete'
      ? { type: 'deleteSelectionGroup', factionId: view.factionId, groupId: selected!.id }
      : { type: 'setSelectionGroup', factionId: view.factionId, ...(action === 'update' ? { groupId: selected!.id } : {}), kind, name: groupName, memberIds };
    working.current = true; setPending(true); pendingCallback.current(true); setError(''); setStatus('');
    try {
      const result = await issue(command);
      if (!mounted.current) return;
      if (!result.accepted) { setError(result.message ?? 'The group change was refused. Review the current selection and try again.'); return; }
      if (action === 'delete') { setSelectedId(''); setName(''); setRecalled(''); }
      else setName(groupName);
      setStatus(action === 'delete' ? `Deleted group “${groupName}”. Current selections and existing orders are unchanged.`
        : `${action === 'create' ? 'Saved' : 'Updated'} group “${groupName}” with ${memberIds.length} ${memberIds.length === 1 ? label : plural}. Existing orders are unchanged.`);
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : 'The group response could not be confirmed. Review the campaign before retrying.');
    } finally {
      working.current = false;
      if (mounted.current) { setPending(false); pendingCallback.current(false); }
    }
  };
  return <details className="selection-groups" data-testid="selection-groups" aria-busy={pending}>
    <summary>Saved {label} groups</summary>
    <p className="field-help">Groups belong to this campaign and are included in its saves and exports. Recall replaces this tab’s checked selection; apply postings or charters separately.</p>
    <div className="selection-group-recall" data-testid="selection-group-recall">
      <label>Saved {label} group<select value={selected?.id ?? ''} disabled={locked} onChange={event => {
        const next = groups.find(group => group.id === event.target.value);
        setSelectedId(next?.id ?? ''); setName(next?.name ?? ''); setError(''); setStatus(''); setRecalled('');
      }}><option value="">Choose a saved {label} group</option>{groups.map(group => <option value={group.id} key={group.id}>{group.name}</option>)}</select></label>
      <button disabled={locked || !selected} onClick={() => {
        if (locked || !selected) return;
        const result = recallSelectionGroup(view, selected);
        recall(result.selected);
        setRecalled(`Recalled group “${selected.name}”: ${result.selected.size} ${result.selected.size === 1 ? label : plural} selected. ${result.embarked + result.unavailable} skipped (${result.embarked} embarked, ${result.unavailable} unavailable or no longer owned). Existing orders are unchanged.`);
      }}>Recall group</button>
      {selected && <p className="field-help">{selected.memberIds.length} saved {selected.memberIds.length === 1 ? 'member' : 'members'} · {kind === 'armies' ? 'Only owned land armies ashore can be checked for orders.' : 'Only currently owned hearths can be checked for orders.'}</p>}
      {recalled && <p role="status">{recalled}</p>}
    </div>
    <label>Group name<input value={name} maxLength={SELECTION_GROUP_NAME_MAX} disabled={locked} autoComplete="off" onChange={event => setName(event.target.value)}/></label>
    <p className="field-help">Save up to {MAX_SELECTION_GROUP_MEMBERS} checked {plural} per group. Names can use {SELECTION_GROUP_NAME_MAX} characters and must be unique among {label} groups. This realm has {ownGroups.length} of {MAX_SELECTION_GROUPS_PER_FACTION} saved groups across both tabs.</p>
    <p className="field-help">Update group replaces all saved members with the {memberIds.length} currently checked {plural}. {kind === 'armies' ? 'Unchecked members, including skipped embarked armies, are removed from the group.' : 'Unchecked hearths are removed from the group.'}</p>
    {selected && omitted > 0 && <p className="field-help">Updating will remove {omitted} saved {omitted === 1 ? 'member' : 'members'} that {omitted === 1 ? 'is' : 'are'} not checked.{!memberIds.length ? ' This leaves an empty group that you can refill or delete later.' : ''}</p>}
    <div className="group-selection-actions">
      <button disabled={locked || !validName || !memberIds.length || memberIds.length > MAX_SELECTION_GROUP_MEMBERS || ownGroups.length >= MAX_SELECTION_GROUPS_PER_FACTION} onClick={() => { void submit('create'); }}>Save new group</button>
      <button disabled={locked || !selected || !validName || memberIds.length > MAX_SELECTION_GROUP_MEMBERS} onClick={() => { void submit('update'); }}>Update group</button>
      <button disabled={locked || !selected} onClick={() => { void submit('delete'); }}>Delete group</button>
    </div>
    {!memberIds.length && <p className="field-help">Check at least one {label} to save a new group. An existing group may be updated to an empty selection.</p>}
    {pending && <p role="status">Saving group changes…</p>}
    {status && <p role="status">{status}</p>}
    {error && <p role="alert" className="group-order-error">{error}</p>}
  </details>;
}
