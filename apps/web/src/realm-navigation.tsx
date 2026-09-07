import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { BUILDINGS, UNITS } from '@theandril/content';
import type { Observation } from '@theandril/sim';
import './realm-navigation.css';

export type RegistryKind = 'armies' | 'settlements';
export const REGISTRY_PAGE_SIZE = 25;
type Selection = { armyId?: string; settlementId?: string; cell?: number };
type Sort = 'id' | 'name';
const itemName = (id: string) => [...BUILDINGS, ...UNITS].find(item => item.id === id)?.name ?? id;

/** Only already-observed owned entities enter the registry; navigation issues no orders. */
export function registryEntries(view: Observation, kind: RegistryKind, search: string, force: string, sort: Sort) {
  const needle = search.trim().toLowerCase();
  const entries = (kind === 'armies' ? view.armies : view.settlements).filter(item => item.factionId === view.factionId)
    .filter(item => `${item.name} ${item.id}`.toLowerCase().includes(needle))
    .filter(item => kind !== 'armies' || force === 'all' || ('carrierId' in item && (force === 'embarked' ? Boolean(item.carrierId) : force === 'naval' ? item.domain === 'naval' : item.domain === 'land' && !item.carrierId)));
  return entries.sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) || a.id.localeCompare(b.id) : a.id.localeCompare(b.id));
}

export function RealmNavigation({ registry, armyCount, townCount, characterCount, choose, characters, selectionName, selectionKind, showMap, showOrders }: {
  registry: RegistryKind; armyCount: number; townCount: number; characterCount: number;
  choose: (kind: RegistryKind) => void; characters: () => void; selectionName?: string; selectionKind?: string; showMap: () => void; showOrders: () => void;
}) {
  const changeTab = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 'armies' : event.key === 'End' ? 'settlements' : registry === 'armies' ? 'settlements' : 'armies';
    choose(next); document.getElementById(`realm-tab-${next}`)?.focus();
  };
  return <div className="realm-command-strip" data-testid="realm-navigation">
    <div className="realm-switcher"><div role="tablist" aria-label="Realm registry">
      <button id="realm-tab-armies" role="tab" aria-controls="realm-registry-panel" aria-selected={registry === 'armies'} tabIndex={registry === 'armies' ? 0 : -1} onKeyDown={changeTab} onClick={() => choose('armies')}>Armies <span>{armyCount}</span></button>
      <button id="realm-tab-settlements" role="tab" aria-controls="realm-registry-panel" aria-selected={registry === 'settlements'} tabIndex={registry === 'settlements' ? 0 : -1} onKeyDown={changeTab} onClick={() => choose('settlements')}>Settlements <span>{townCount}</span></button>
    </div><button aria-label="Characters & agents" onClick={characters}>Characters <span>{characterCount}</span></button></div>
    <div className="selection-command" data-testid="current-selection"><div><small>{selectionKind ?? 'Your realm'}</small><strong>{selectionName ?? 'Select a force or town'}</strong></div><button onClick={showMap}>Show on map</button><button disabled={!selectionName} onClick={showOrders}>Show selected orders</button></div>
  </div>;
}

export function RealmRegistry({ view, registry, search, force, selection, select }: {
  view: Observation; registry: RegistryKind; search: string; force: string; selection: Selection; select: (selection: Selection) => void;
}) {
  const [sort, setSort] = useState<Sort>('id');
  const [page, setPage] = useState(0);
  const entries = useMemo(() => registryEntries(view, registry, search, force, sort), [view, registry, search, force, sort]);
  const selectedId = registry === 'armies' ? selection.armyId : selection.settlementId;
  useEffect(() => { setPage(0); }, [registry, search, force, sort]);
  useEffect(() => {
    const index = entries.findIndex(item => item.id === selectedId);
    if (index >= 0) setPage(Math.floor(index / REGISTRY_PAGE_SIZE));
    // Follow a new map/next-action selection, not every turn or pagination click.
  }, [selectedId, registry]);
  const pages = Math.max(1, Math.ceil(entries.length / REGISTRY_PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = entries.slice(current * REGISTRY_PAGE_SIZE, (current + 1) * REGISTRY_PAGE_SIZE);
  const routes = new Map(view.routes.map(route => [route.armyId, route]));
  const armies = new Map(view.armies.map(army => [army.id, army]));
  return <div className="realm-registry-content">
    <div className="registry-tools"><label>Registry order<select value={sort} onChange={event => setSort(event.target.value as Sort)}><option value="id">Stable order</option><option value="name">Name A–Z</option></select></label><span>{entries.length} {registry === 'armies' ? 'forces' : 'towns'}</span></div>
    <div className="registry" data-testid={registry === 'armies' ? 'army-registry' : 'settlement-registry'}>{visible.map(item => {
      const army = 'formations' in item ? item : undefined;
      const town = 'queue' in item ? item : undefined;
      const route = routes.get(item.id);
      return <button className={`registry-item ${selectedId === item.id ? 'selected' : ''}`} aria-current={selectedId === item.id ? 'true' : undefined} key={item.id} onClick={() => select({ ...(army ? { armyId: item.id } : { settlementId: item.id }), cell: item.cell })}>
        <span className="entity-symbol" aria-hidden="true">{army ? army.domain === 'naval' ? '⚓' : army.carrierId ? '↪' : '△' : '⌂'}</span><span><strong>{item.name}</strong>
          {army && <><small>{army.formations.length} {army.formations.length === 1 ? 'formation' : 'formations'} · {army.movement} movement · {army.strength} strength</small>
            {army.domain === 'naval' && <small>Fleet · {army.transportUsed} / {army.transportCapacity} passengers</small>}
            {army.carrierId && <small>Aboard {armies.get(army.carrierId)?.name ?? army.carrierId}</small>}
            {army.commander && <small>Commander: {army.commander.name}</small>}
            {army.overCommand && <small className="registry-route-state">⚑ Over command · {army.formations.length} / {army.formationCapacity}</small>}
            {army.agents.some(agent => agent.status === 'mission') && <small className="registry-route-state">⚑ Stationary mission</small>}
            {route && <small className="registry-route-state">{route.status === 'paused' ? '⚑ Route interrupted' : '↝ Travel queued'}</small>}</>}
          {town && <small>{town.population} people · {town.queue.length ? itemName(town.queue[0]!.itemId) : 'No production'}</small>}
        </span><span aria-hidden="true">›</span>
      </button>;
    })}{!entries.length && <p className="empty">{search || force !== 'all' ? 'No matching entries. Clear your search or filter.' : registry === 'armies' ? 'Recruit an army or fleet from a settlement.' : 'Select your caravan to establish the first hearth.'}</p>}</div>
    {pages > 1 && <nav className="registry-pages" aria-label="Registry pages"><button disabled={current === 0} onClick={() => setPage(current - 1)} aria-label="Previous registry page">←</button><span>Page {current + 1} of {pages}</span><button disabled={current === pages - 1} onClick={() => setPage(current + 1)} aria-label="Next registry page">→</button></nav>}
  </div>;
}
