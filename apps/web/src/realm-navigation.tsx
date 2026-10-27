import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { BUILDINGS, IMPROVEMENTS, UNITS } from '@theandril/content';
import { CHARTER_NAMES, POSTING_NAMES, type Observation } from '@theandril/sim';
import { addGroupSelection, groupPostingArmies, GroupPostingOrders, GROUP_POSTING_LIMIT, type GroupPostingIssue } from './group-postings';
import { GroupLandPolicyOrders, type GroupLandPolicyIssue } from './group-land-policies';
import { GroupWorkerPolicyOrders, type GroupWorkerPolicyIssue } from './group-worker-policies';
import { groupCharterTowns, GroupCharterOrders, type GroupCharterIssue } from './group-charters';
import { SelectionGroups, type SelectionGroupIssue } from './selection-groups';
import { GroupProductionOrders, type GroupProductionIssue } from './group-production';
import { GroupPatrolOrders, type GroupPatrolIssue } from './group-patrols';
import { GroupMovementOrders, type GroupMovementIssue, type GroupMovementPreviewIssue } from './group-movement';
import { DefenseTheaters, type TheaterIssue } from './defense-theaters';
import { ARMY_ORDER_FILTERS, armyOrderCounts, buildArmyOrderIndex, matchesArmyOrderFilter, type ArmyOrderFilter, type ArmyOrderStatus } from './army-order-status';
import { SETTLEMENT_ORDER_FILTERS, buildSettlementOrderIndex, matchesSettlementOrderFilter, settlementOrderCounts, type SettlementOrderFilter, type SettlementOrderStatus } from './settlement-order-status';
import { LAND_COMMISSION_FILTERS, buildLandCommissionIndex, filterLandCommissionEntries, landCommissionCounts, type LandCommissionFilter } from './land-commission-status';
import './realm-navigation.css';

export type RegistryKind = 'armies' | 'settlements';
export const REGISTRY_PAGE_SIZE = 25;
type Selection = { armyId?: string; settlementId?: string; cell?: number };
type Sort = 'id' | 'name';
const itemName = (id: string) => [...BUILDINGS, ...UNITS].find(item => item.id === id)?.name ?? id;

/** Only already-observed owned entities enter the registry; navigation issues no orders. */
export function registryEntries(view: Observation, kind: RegistryKind, search: string, force: string, sort: Sort, orderFilter: ArmyOrderFilter = 'all', orderIndex?: ReadonlyMap<string, ArmyOrderStatus>) {
  const needle = search.trim().toLowerCase();
  const index = kind === 'armies' && orderFilter !== 'all' ? orderIndex ?? buildArmyOrderIndex(view) : undefined;
  const entries = (kind === 'armies' ? view.armies : view.settlements).filter(item => item.factionId === view.factionId)
    .filter(item => `${item.name} ${item.id}`.toLowerCase().includes(needle))
    .filter(item => kind !== 'armies' || force === 'all' || ('carrierId' in item && (force === 'embarked' ? Boolean(item.carrierId) : force === 'naval' ? item.domain === 'naval' : item.domain === 'land' && !item.carrierId)));
  const matching = index ? entries.filter(item => {
    const status = index.get(item.id);
    return status !== undefined && matchesArmyOrderFilter(status, orderFilter);
  }) : entries;
  return matching.sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) || a.id.localeCompare(b.id) : a.id.localeCompare(b.id));
}

export function RealmNavigation({ registry, armyCount, townCount, characterCount, choose, characters, selectionName, selectionKind, showMap, showOrders, selectionControls = true, busy = false }: {
  registry: RegistryKind; armyCount: number; townCount: number; characterCount: number;
  choose: (kind: RegistryKind) => void; characters: () => void; selectionName?: string; selectionKind?: string; showMap: () => void; showOrders: () => void;
  selectionControls?: boolean;
  busy?: boolean;
}) {
  const changeTab = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (busy || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 'armies' : event.key === 'End' ? 'settlements' : registry === 'armies' ? 'settlements' : 'armies';
    choose(next); document.getElementById(`realm-tab-${next}`)?.focus();
  };
  return <div className="realm-command-strip" data-testid="realm-navigation">
    <div className="realm-switcher"><div role="tablist" aria-label="Realm registry">
      <button id="realm-tab-armies" role="tab" disabled={busy} aria-controls="realm-registry-panel" aria-selected={registry === 'armies'} tabIndex={registry === 'armies' ? 0 : -1} onKeyDown={changeTab} onClick={() => choose('armies')}>Armies <span>{armyCount}</span></button>
      <button id="realm-tab-settlements" role="tab" disabled={busy} aria-controls="realm-registry-panel" aria-selected={registry === 'settlements'} tabIndex={registry === 'settlements' ? 0 : -1} onKeyDown={changeTab} onClick={() => choose('settlements')}>Settlements <span>{townCount}</span></button>
    </div><button aria-label="Characters & agents" disabled={busy} onClick={characters}>Characters <span>{characterCount}</span></button></div>
    {selectionControls && <div className="selection-command" data-testid="current-selection"><div><small>{selectionKind ?? 'Your realm'}</small><strong>{selectionName ?? 'Select a force or town'}</strong></div><button onClick={showMap}>Show on map</button><button disabled={!selectionName} onClick={showOrders}>Show selected orders</button></div>}
  </div>;
}

export function RealmRegistry({ view, hash, registry, search, force, selection, select, busy = false, onGroupPosting, onGroupLandPolicy, onGroupWorkerPolicy, onGroupCharter, onGroupProduction, onGroupMovement, onGroupMovementPreview, onGroupPatrol, onSelectionGroupCommand, onTheaterCommand, knownSelectedCell, theaterFocus, onPendingChange }: {
  view: Observation; registry: RegistryKind; search: string; force: string; selection: Selection; select: (selection: Selection) => void;
  hash?: string; busy?: boolean; onGroupPosting?: GroupPostingIssue; onGroupCharter?: GroupCharterIssue; onGroupWorkerPolicy?: GroupWorkerPolicyIssue; onGroupLandPolicy?: GroupLandPolicyIssue; onGroupProduction?: GroupProductionIssue; onGroupMovement?: GroupMovementIssue; onGroupMovementPreview?: GroupMovementPreviewIssue; onGroupPatrol?: GroupPatrolIssue; onSelectionGroupCommand?: SelectionGroupIssue; onPendingChange?: (pending: boolean) => void;
  onTheaterCommand?: TheaterIssue; knownSelectedCell?: number;
  theaterFocus?: { id: string; nonce: number };
}) {
  const [sort, setSort] = useState<Sort>('id');
  const [orderFilter, setOrderFilter] = useState<ArmyOrderFilter>('all');
  const [settlementFilter, setSettlementFilter] = useState<SettlementOrderFilter>('all');
  const [landCommissionFilter, setLandCommissionFilter] = useState<LandCommissionFilter>('all');
  const [page, setPage] = useState(0);
  const [armyGroupIds, setArmyGroupIds] = useState<ReadonlySet<string>>(() => new Set());
  const [townGroupIds, setTownGroupIds] = useState<ReadonlySet<string>>(() => new Set());
  const [selectionGroupPending, setSelectionGroupPending] = useState(false);
  const [productionPending, setProductionPending] = useState(false);
  const [movementPending, setMovementPending] = useState(false);
  const [theaterPending, setTheaterPending] = useState(false);
  const [landPolicyPending, setLandPolicyPending] = useState(false);
  const [workerPolicyPending, setWorkerPolicyPending] = useState(false);
  const [patrolPending, setPatrolPending] = useState(false);
  const pendingFlags = useRef({ selection: false, production: false, movement: false, theater: false, patrol: false, workerPolicy: false, landPolicy: false });
  const reportPending = (kind: keyof typeof pendingFlags.current, pending: boolean) => {
    pendingFlags.current[kind] = pending;
    ({ selection: setSelectionGroupPending, production: setProductionPending, movement: setMovementPending, theater: setTheaterPending, patrol: setPatrolPending, workerPolicy: setWorkerPolicyPending, landPolicy: setLandPolicyPending })[kind](pending);
    onPendingChange?.(Object.values(pendingFlags.current).some(Boolean));
  };
  const locked = busy || selectionGroupPending || productionPending || movementPending || theaterPending || landPolicyPending || workerPolicyPending || patrolPending;
  const availableArmyIds = useMemo(() => new Set(groupPostingArmies(view).map(army => army.id)), [view]);
  const availableTownIds = useMemo(() => new Set(groupCharterTowns(view).map(town => town.id)), [view]);
  const groupIds = registry === 'armies' ? armyGroupIds : townGroupIds;
  const setGroupIds = registry === 'armies' ? setArmyGroupIds : setTownGroupIds;
  const availableGroupIds = registry === 'armies' ? availableArmyIds : availableTownIds;
  const currentGroupIds = new Set([...groupIds].filter(id => availableGroupIds.has(id)));
  useEffect(() => {
    setArmyGroupIds(previous => [...previous].some(id => !availableArmyIds.has(id)) ? new Set([...previous].filter(id => availableArmyIds.has(id))) : previous);
    setTownGroupIds(previous => [...previous].some(id => !availableTownIds.has(id)) ? new Set([...previous].filter(id => availableTownIds.has(id))) : previous);
  }, [availableArmyIds, availableTownIds]);
  const orderIndex = useMemo(() => registry === 'armies' ? buildArmyOrderIndex(view) : new Map<string, ArmyOrderStatus>(), [view, registry]);
  const settlementIndex = useMemo(() => registry === 'settlements' ? buildSettlementOrderIndex(view) : new Map<string, SettlementOrderStatus>(), [view, registry]);
  const landCommissionIndex = useMemo(() => registry === 'settlements' ? buildLandCommissionIndex(view) : undefined, [view, registry]);
  const activeLandCommissionFilter = landCommissionIndex === undefined ? 'all' : landCommissionFilter;
  const baseEntries = useMemo(() => registryEntries(view, registry, search, force, sort), [view, registry, search, force, sort]);
  const orderCounts = useMemo(() => armyOrderCounts(baseEntries.map(item => item.id), orderIndex), [baseEntries, orderIndex]);
  const settlementCounts = useMemo(() => settlementOrderCounts(baseEntries.map(item => item.id), settlementIndex), [baseEntries, settlementIndex]);
  const orderEntries = useMemo(() => registry === 'armies' && orderFilter !== 'all'
    ? baseEntries.filter(item => {
      const status = orderIndex.get(item.id);
      return status !== undefined && matchesArmyOrderFilter(status, orderFilter);
    }) : registry === 'settlements' && settlementFilter !== 'all'
      ? baseEntries.filter(item => {
        const status = settlementIndex.get(item.id);
        return status !== undefined && matchesSettlementOrderFilter(status, settlementFilter);
      }) : baseEntries, [baseEntries, registry, orderFilter, orderIndex, settlementFilter, settlementIndex]);
  const commissionCounts = useMemo(() => landCommissionCounts(orderEntries.map(item => item.id), landCommissionIndex), [orderEntries, landCommissionIndex]);
  const entries = useMemo(() => filterLandCommissionEntries(orderEntries, landCommissionIndex, activeLandCommissionFilter), [orderEntries, landCommissionIndex, activeLandCommissionFilter]);
  const selectedId = registry === 'armies' ? selection.armyId : selection.settlementId;
  useEffect(() => { setPage(0); }, [registry, search, force, sort, orderFilter, settlementFilter, activeLandCommissionFilter]);
  useEffect(() => {
    const index = entries.findIndex(item => item.id === selectedId);
    if (index >= 0) setPage(Math.floor(index / REGISTRY_PAGE_SIZE));
    // Follow a new map/next-action selection, not every turn or pagination click.
  }, [selectedId, registry]);
  const pages = Math.max(1, Math.ceil(entries.length / REGISTRY_PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = entries.slice(current * REGISTRY_PAGE_SIZE, (current + 1) * REGISTRY_PAGE_SIZE);
  const armies = new Map(view.armies.map(army => [army.id, army]));
  const groupEnabled = Boolean(onSelectionGroupCommand) || (registry === 'armies' ? Boolean(onGroupPosting || onGroupMovement || onGroupPatrol || onTheaterCommand) : Boolean(onGroupCharter || onGroupLandPolicy || onGroupWorkerPolicy || onGroupProduction));
  const matchingGroupIds = new Set(entries.filter(item => availableGroupIds.has(item.id)).map(item => item.id));
  return <div className="realm-registry-content">
    {registry === 'armies' && <div className="registry-tools"><label>Army orders<select value={orderFilter} disabled={locked} onChange={event => setOrderFilter(event.target.value as ArmyOrderFilter)}>
      {ARMY_ORDER_FILTERS.map(filter => <option key={filter.value} value={filter.value}>{filter.label} ({orderCounts[filter.value]})</option>)}
    </select></label></div>}
    {registry === 'settlements' && <><div className="registry-tools"><label>Settlement orders<select value={settlementFilter} disabled={locked} onChange={event => setSettlementFilter(event.target.value as SettlementOrderFilter)}>
      {SETTLEMENT_ORDER_FILTERS.map(filter => <option key={filter.value} value={filter.value}>{filter.label} ({settlementCounts[filter.value]})</option>)}
    </select></label></div>
      {landCommissionIndex !== undefined && <div className="registry-tools"><label>Land commission status<select value={activeLandCommissionFilter} disabled={locked} onChange={event => setLandCommissionFilter(event.target.value as LandCommissionFilter)}>
        {LAND_COMMISSION_FILTERS.map(filter => <option key={filter.value} value={filter.value}>{filter.label} ({commissionCounts[filter.value]})</option>)}
      </select></label></div>}
      <details className="registry-filter-help field-help"><summary>How these filters work</summary><p>Counts overlap and follow your search. No production includes hearths waiting for a charter’s next turn; Without charters can include queued work. Charters waiting includes budget limits and completed building programs, not just problems. Current queues come first; next-work candidates share the treasury and are not guaranteed purchases.</p>
        {landCommissionIndex !== undefined && <p>Land commission counts follow your search and Settlement orders filter. Zero allowance includes hearths with paid work still underway. Reported waits includes pauses such as paid work already underway; it does not list every affordability or land-suitability limit. No reported wait does not guarantee an affordable or suitable job. Select a hearth for its exact commission details.</p>}
      </details></>}
    <div className="registry-tools"><label>Registry order<select value={sort} disabled={locked} onChange={event => setSort(event.target.value as Sort)}><option value="id">Stable order</option><option value="name">Name A–Z</option></select></label><span>{entries.length} {registry === 'armies' ? 'forces' : 'towns'}</span></div>
    {onSelectionGroupCommand && <SelectionGroups key={registry} view={view} kind={registry} checked={currentGroupIds} busy={locked} issue={onSelectionGroupCommand} recall={setGroupIds} onPendingChange={pending => reportPending('selection', pending)}/>}
    {registry === 'armies' && onGroupPosting && <GroupPostingOrders view={view} hash={hash} selected={currentGroupIds} matching={matchingGroupIds} busy={locked} issue={onGroupPosting} selectMatching={() => setGroupIds(addGroupSelection(currentGroupIds, [...matchingGroupIds]))} clearSelection={() => setGroupIds(new Set())} accepted={ids => setGroupIds(previous => new Set([...previous].filter(id => !ids.has(id))))}/>}
    {registry === 'armies' && onGroupMovement && onGroupMovementPreview && <GroupMovementOrders view={view} hash={hash} selected={currentGroupIds} selectedCell={selection.cell} busy={busy || selectionGroupPending || productionPending || theaterPending || landPolicyPending || workerPolicyPending || patrolPending} issue={onGroupMovement} preview={onGroupMovementPreview} accepted={ids => setGroupIds(previous => new Set([...previous].filter(id => !ids.has(id))))} onPendingChange={pending => reportPending('movement', pending)}/>}
    {registry === 'armies' && onGroupPatrol && <GroupPatrolOrders view={view} hash={hash} selected={currentGroupIds} matching={matchingGroupIds} busy={busy || selectionGroupPending || productionPending || movementPending || theaterPending || landPolicyPending} issue={onGroupPatrol} accepted={ids => setGroupIds(previous => new Set([...previous].filter(id => !ids.has(id))))} onPendingChange={pending => reportPending('patrol', pending)}/>}
    {registry === 'armies' && onTheaterCommand && <DefenseTheaters view={view} checked={currentGroupIds} knownSelectedCell={knownSelectedCell} theaterFocus={theaterFocus} busy={busy || selectionGroupPending || productionPending || movementPending || landPolicyPending || workerPolicyPending || patrolPending} issue={onTheaterCommand} onPendingChange={pending => reportPending('theater', pending)}/>}
    {registry === 'settlements' && onGroupCharter && <GroupCharterOrders view={view} hash={hash} selected={currentGroupIds} matching={matchingGroupIds} busy={locked} issue={onGroupCharter} selectMatching={() => setGroupIds(addGroupSelection(currentGroupIds, [...matchingGroupIds]))} clearSelection={() => setGroupIds(new Set())} accepted={ids => setGroupIds(previous => new Set([...previous].filter(id => !ids.has(id))))}/>}
    {registry === 'settlements' && onGroupWorkerPolicy && <GroupWorkerPolicyOrders view={view} hash={hash} selected={currentGroupIds} matching={matchingGroupIds} busy={busy || selectionGroupPending || productionPending || movementPending || theaterPending || landPolicyPending || patrolPending} issue={onGroupWorkerPolicy} accepted={ids => setGroupIds(previous => new Set([...previous].filter(id => !ids.has(id))))} onPendingChange={pending => reportPending('workerPolicy', pending)}/>}
    {registry === 'settlements' && onGroupLandPolicy && <GroupLandPolicyOrders view={view} hash={hash} selected={currentGroupIds} matching={matchingGroupIds} busy={busy || selectionGroupPending || productionPending || movementPending || theaterPending || workerPolicyPending || patrolPending} issue={onGroupLandPolicy} accepted={ids => setGroupIds(previous => new Set([...previous].filter(id => !ids.has(id))))} onPendingChange={pending => reportPending('landPolicy', pending)}/>}
    {registry === 'settlements' && onGroupProduction && <GroupProductionOrders view={view} selected={currentGroupIds} busy={locked} issue={onGroupProduction} accepted={ids => setGroupIds(previous => new Set([...previous].filter(id => !ids.has(id))))} onPendingChange={pending => reportPending('production', pending)}/>}
    <div className="registry" data-testid={registry === 'armies' ? 'army-registry' : 'settlement-registry'}>{visible.map(item => {
      const army = 'formations' in item ? item : undefined;
      const town = 'queue' in item ? item : undefined;
      const orderStatus = orderIndex.get(item.id);
      const settlementStatus = settlementIndex.get(item.id);
      const landPolicy = landCommissionIndex?.get(item.id)?.policy;
      return <div className={`registry-row${groupEnabled ? ' registry-row-group' : ''}`} key={item.id}>
        {groupEnabled && <label className="registry-group-check">{availableGroupIds.has(item.id) ? <input type="checkbox" aria-label={`Select ${item.name} for group orders`} checked={currentGroupIds.has(item.id)} disabled={locked || (!currentGroupIds.has(item.id) && currentGroupIds.size >= GROUP_POSTING_LIMIT)} onChange={event => {
          const checked = event.target.checked;
          setGroupIds(previous => { const next = new Set(previous); if (checked && next.size < GROUP_POSTING_LIMIT) next.add(item.id); else if (!checked) next.delete(item.id); return next; });
        }}/> : <span aria-label="Group orders require a land army ashore">—</span>}</label>}
        <button className={`registry-item ${selectedId === item.id ? 'selected' : ''}`} disabled={locked} aria-current={selectedId === item.id ? 'true' : undefined} onClick={() => select({ ...(army ? { armyId: item.id } : { settlementId: item.id }), cell: item.cell })}>
        <span className="entity-symbol" aria-hidden="true">{army ? army.domain === 'naval' ? '⚓' : army.carrierId ? '↪' : '△' : '⌂'}</span><span><strong>{item.name}</strong>
          {army && <><small>{army.formations.length} {army.formations.length === 1 ? 'formation' : 'formations'} · {army.movement} movement · {army.strength} strength</small>
            {army.domain === 'naval' && <small>Fleet · {army.transportUsed} / {army.transportCapacity} passengers</small>}
            {army.carrierId && <small>Aboard {armies.get(army.carrierId)?.name ?? army.carrierId}</small>}
            {army.commander && <small>Commander: {army.commander.name}</small>}
            {army.overCommand && <small className="registry-route-state">⚑ Over command · {army.formations.length} / {army.formationCapacity}</small>}
            {army.agents.some(agent => agent.status === 'mission') && <small className="registry-route-state">⚑ Stationary mission</small>}
            <ArmyOrderDetails status={orderStatus}/></>}
          {town && <><small>{town.population} people · {town.queue.length ? itemName(town.queue[0]!.itemId) : 'No production'}</small>
            <SettlementOrderDetails status={settlementStatus}/>
            {landPolicy && <small>Land commission: {IMPROVEMENTS.find(improvement => improvement.id === landPolicy.improvementId)?.name ?? landPolicy.improvementId} · {landPolicy.allowance} coin left · {landPolicy.reserve} reserve{landPolicy.blocker ? ` · ${landPolicy.blocker}` : ''}</small>}</>}
        </span><span aria-hidden="true">›</span>
      </button></div>;
    })}{!entries.length && <p className="empty">{search || force !== 'all' || (registry === 'armies' && orderFilter !== 'all') || (registry === 'settlements' && (settlementFilter !== 'all' || activeLandCommissionFilter !== 'all')) ? 'No matching entries. Clear your search or filter.' : registry === 'armies' ? 'Recruit an army or fleet from a settlement.' : 'Select your caravan to establish the first hearth.'}</p>}</div>
    {pages > 1 && <nav className="registry-pages" aria-label="Registry pages"><button disabled={locked || current === 0} onClick={() => setPage(current - 1)} aria-label="Previous registry page">←</button><span>Page {current + 1} of {pages}</span><button disabled={locked || current === pages - 1} onClick={() => setPage(current + 1)} aria-label="Next registry page">→</button></nav>}
  </div>;
}

/** Display supplied canonical facts independently; no commands or eligibility queries. */
export function ArmyOrderDetails({ status }: { status: ArmyOrderStatus | undefined }) {
  if (!status) return null;
  const { posting, patrol, route } = status;
  return <>
    {posting && <small className="registry-route-state">Posting: {POSTING_NAMES[posting.mode]} at hex {posting.cell}{posting.arrived ? ' · Arrived' : ''}{posting.blocker ? ` · ${posting.blocker}` : ''}</small>}
    {patrol && <small className="registry-route-state">Patrol policy: {patrol.enabled ? patrol.status : 'paused'} · target hex {patrol.targetCell}{patrol.blocker ? ` · ${patrol.blocker}` : ''}</small>}
    {route && <small className="registry-route-state">{route.status === 'paused' ? '⚑ Route interrupted' : '↝ Travel queued'} · target hex {route.targetCell}{route.pauseReason ? ` · ${route.pauseReason}` : ''}</small>}
  </>;
}

/** Display supplied policy facts without predicting purchases or eligibility. */
export function SettlementOrderDetails({ status }: { status: SettlementOrderStatus | undefined }) {
  if (!status) return null;
  const { charter, queueLength } = status;
  if (!charter) return <small>Direct orders · No charter.</small>;
  return <small>{CHARTER_NAMES[charter.focus]} charter · {charter.ceiling} coin per work · {queueLength > 0
    ? 'Current queue comes first.'
    : charter.blocker ?? (charter.itemName ? `Next candidate: ${charter.itemName}.` : 'Waiting for the next turn.')}</small>;
}
