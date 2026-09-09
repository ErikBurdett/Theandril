import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { RESOURCES, UNITS } from '@theandril/content';
import type { DevelopmentChoice, DevelopmentEntityView, DevelopmentFocus, GameCommand, Observation } from '@theandril/sim';
import type { DevelopmentScope } from '@theandril/content';
import { sameDevelopmentFocus, useDevelopmentQuery, type DevelopmentQuery } from './use-development-query';
import './development-panel.css';

const PAGE_SIZE = 20;
const labels: Record<DevelopmentScope, string> = { formation: 'Formation training', hearth: 'Hearth development', faction: 'Faction traditions' };
const scopes = ['formation', 'hearth', 'faction'] as const;
const materialNames = new Map(RESOURCES.map(item => [item.id, item.name]));
const unitNames = new Map(UNITS.map(item => [item.id, item.name]));
const effectLabels = { food: 'food', industry: 'industry', coin: 'coin', knowledge: 'knowledge', attack: 'attack', armor: 'armor', initiative: 'initiative', range: 'range', morale: 'battle morale' };
const sameFocus = (a: DevelopmentFocus | null | undefined, b: DevelopmentFocus | null | undefined) => Boolean(a && b && a.scope === b.scope && a.entityId === b.entityId);
export function developmentStatus(choice: DevelopmentChoice, choices: readonly DevelopmentChoice[]): 'Acquired' | 'Dormant' | 'Available' | 'Excluded' | 'Locked' {
  if (choice.acquired) return choice.active ? 'Acquired' : 'Dormant';
  if (choice.exclusiveGroup && choices.some(other => other.acquired && other.exclusiveGroup === choice.exclusiveGroup)) return 'Excluded';
  return choice.available ? 'Available' : 'Locked';
}

/** Links and lanes describe the authoritative quote graph. Inspection never
 * reconstructs affordability or issues a progression command. */
export function DevelopmentTree({ entity, factionId, busy, issue }: { entity: DevelopmentEntityView; factionId: string; busy: boolean; issue: (command: GameCommand) => void }) {
  const treeId = useId(), cards = useRef(new Map<string, HTMLElement>());
  const branches = [...new Set(entity.choices.map(choice => choice.branch))];
  const [branch, setBranch] = useState<string | null>(null);
  const visible = entity.choices.filter(choice => !branch || choice.branch === branch);
  const [inspection, setInspection] = useState<string | null>(null);
  useEffect(() => { if (inspection) { cards.current.get(inspection)?.focus(); setInspection(null); } }, [inspection, branch]);
  const inspect = (nodeId: string) => {
    const choice = entity.choices.find(choice => choice.id === nodeId);
    if (!choice) return;
    if (branch && choice.branch !== branch) setBranch(choice.branch);
    setInspection(nodeId);
  };
  const prerequisite = (nodeId: string) => {
    const previous = entity.choices.find(choice => choice.id === nodeId);
    return previous ? <button type="button" key={nodeId} aria-label={`Inspect prerequisite ${previous.name}`} onClick={() => inspect(nodeId)}>{previous.acquired ? '◆' : '◇'} {previous.name}</button> : <span key={nodeId}>{nodeId} · unavailable in this campaign</span>;
  };
  return <section className="development-tree" data-testid="development-tree" aria-label={`${labels[entity.scope]} tree`}>
    <header className="development-summary"><div><span className="eyebrow">{labels[entity.scope]}</span><h3>{entity.name}</h3></div><dl>
      <div><dt>{entity.currency}</dt><dd>{entity.progress}</dd></div><div><dt>Coin</dt><dd>{entity.treasury}</dd></div><div><dt>Development upkeep</dt><dd>{entity.upkeep} / turn</dd></div>
    </dl></header>
    <p className="development-explanation">{entity.scope === 'formation'
      ? 'Surviving fighting formations earn 3 experience from a victory, or 1 from another battle outcome. Training belongs to this company through transfers and splits; it does not restore losses, movement or its commander’s experience.'
      : entity.scope === 'hearth'
        ? 'This hearth earns 1 civic point per active turn with population 2+ and a completed building. Siege and occupation pause the work. Foundation projects can coexist; choosing an advanced specialization permanently excludes the other advanced branches.'
        : 'Each active population 3+ hearth with a market or archive earns 1 influence per turn, up to 6 for the realm. Traditions continue your permanent institution and doctrine. Influence is separate from practical and arcane knowledge.'}</p>
    <p className="development-key">◆ Acquired · ◇ Available · ⊘ Locked or excluded. Material and coin commitments are paid once; listed upkeep recurs each turn.</p>
    <nav className="development-branches" aria-label="Development branches"><button type="button" aria-pressed={!branch} onClick={() => setBranch(null)}>All branches</button>{branches.map(name => <button type="button" key={name} aria-pressed={branch === name} onClick={() => setBranch(name)}>{name}</button>)}</nav>
    <div className="development-lanes">{branches.filter(name => !branch || name === branch).map(name => <section className="development-lane" key={name} aria-label={`${name} branch`}>
      <h4>{name}</h4><ol>{visible.filter(choice => choice.branch === name).sort((a, b) => a.tier - b.tier || (a.id < b.id ? -1 : 1)).map(choice => {
        const status = developmentStatus(choice, entity.choices);
        return <li key={choice.id}><article className="development-node" tabIndex={-1} ref={element => { if (element) cards.current.set(choice.id, element); else cards.current.delete(choice.id); }} aria-label={`${choice.name} development`} data-testid={`development-${choice.id}`} data-state={status.toLowerCase()}>
          <span className="development-node-state">{choice.acquired ? '◆' : choice.available ? '◇' : '⊘'} {status} · Stage {choice.tier}</span>
          <h5>{choice.name}</h5><p>{choice.description}</p>
          <ul className="development-effects" aria-label={`${choice.name} effects`}>{Object.entries(choice.effects).filter(([, value]) => value).map(([key, value]) => <li key={key}>+{value} {effectLabels[key as keyof typeof effectLabels]}</li>)}</ul>
          {choice.requiresAll.length > 0 && <div className="development-links"><span>Requires all</span>{choice.requiresAll.map(prerequisite)}</div>}
          {choice.requiresAny.length > 0 && <div className="development-links"><span>Requires one</span>{choice.requiresAny.map(prerequisite)}</div>}
          {!choice.requiresAll.length && !choice.requiresAny.length && <p className="development-root">Branch foundation</p>}
          <p className="development-price">{choice.progressCost} {entity.currency} + {choice.coinCost} coin<br/>{choice.upkeep ? `+${choice.upkeep} coin upkeep per turn` : 'No additional upkeep'}</p>
          {choice.resourceCosts && <ul className="development-materials" aria-label={`${choice.name} materials`}>{Object.entries(choice.resourceCosts).map(([resourceId, amount]) => <li key={resourceId}>{amount} {materialNames.get(resourceId) ?? resourceId}</li>)}</ul>}
          {status === 'Dormant' && <p className="development-blocker">Restore the required building to reactivate these benefits. The development and its upkeep remain attached to this hearth.</p>}
          {!choice.acquired && choice.blocker && <p className="development-blocker" id={`${treeId}-${choice.id}-blocker`}>{choice.blocker}</p>}
          <button type="button" className="primary" disabled={busy || !choice.available} aria-label={`Acquire ${choice.name}`} aria-describedby={!choice.acquired && choice.blocker ? `${treeId}-${choice.id}-blocker` : undefined} onClick={() => {
            cards.current.get(choice.id)?.focus();
            issue({ type: 'develop', factionId, scope: entity.scope, entityId: entity.entityId, nodeId: choice.id });
          }}>{choice.acquired ? 'Acquired' : choice.exclusiveGroup ? 'Choose specialization' : 'Acquire development'}</button>
        </article></li>;
      })}</ol>
    </section>)}</div>
  </section>;
}

export interface DevelopmentPanelProps {
  view: Observation; detail: DevelopmentEntityView | null; pending: boolean; error: string | null; busy: boolean;
  request: (focus: DevelopmentFocus | null) => void; retry?: () => void; issue: (command: GameCommand) => void; initialFocus?: DevelopmentFocus;
}
/** Main owns the query/hash lifecycle and discards stale prices. The directory
 * renders at most 20 existing armies/towns; only one company tree is requested. */
export function DevelopmentPanel({ view, detail, pending, error, busy, request, retry, issue, initialFocus }: DevelopmentPanelProps) {
  const id = useId(), [scope, setScope] = useState<DevelopmentScope>(initialFocus?.scope ?? 'faction');
  const [focus, setFocus] = useState<DevelopmentFocus | null>(initialFocus ?? null);
  const [search, setSearch] = useState(''), [page, setPage] = useState(0), [armyId, setArmyId] = useState<string | null>(null);
  const ownArmies = view.armies.filter(army => army.factionId === view.factionId);
  const ownHearths = view.settlements.filter(hearth => hearth.factionId === view.factionId);
  const subjects = scope === 'hearth' ? ownHearths : ownArmies;
  const needle = search.trim().toLowerCase();
  const matches = subjects.filter(subject => `${subject.name} ${subject.id}`.toLowerCase().includes(needle));
  const pages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE)), currentPage = Math.min(page, pages - 1);
  const activeArmy = ownArmies.find(army => army.id === armyId || focus?.scope === 'formation' && army.formations.some(formation => formation.id === focus.entityId));
  const displayed = scope === 'faction' ? view.development?.faction : !pending && detail && sameFocus(detail, focus) ? detail : null;
  useEffect(() => { request(focus?.scope === 'faction' ? null : focus); }, [focus, request]);
  const selectScope = (next: DevelopmentScope) => { setScope(next); setFocus(null); setSearch(''); setPage(0); setArmyId(null); document.getElementById(`${id}-${next}-tab`)?.focus(); };
  const chooseSubject = (entityId: string) => {
    if (scope === 'hearth') setFocus({ scope, entityId });
    else { setArmyId(entityId); const army = ownArmies.find(item => item.id === entityId), formation = army?.formations[0]; setFocus(formation ? { scope: 'formation', entityId: formation.id } : null); }
  };
  if (!view.development) return <p className="development-explanation">Formation training, civic development and faction traditions are unavailable under this campaign’s historical rules.</p>;
  return <section className="development-panel" aria-label="Development paths" data-testid="development-panel">
    <div role="tablist" className="development-tabs" aria-label="Development subjects" onKeyDown={event => {
      const index = scopes.indexOf(scope), next = event.key === 'ArrowRight' ? (index + 1) % scopes.length : event.key === 'ArrowLeft' ? (index + scopes.length - 1) % scopes.length : event.key === 'Home' ? 0 : event.key === 'End' ? scopes.length - 1 : undefined;
      if (next !== undefined) { event.preventDefault(); selectScope(scopes[next]!); }
    }}>{scopes.map(kind => <button type="button" role="tab" id={`${id}-${kind}-tab`} aria-controls={`${id}-panel`} key={kind} aria-selected={scope === kind} tabIndex={scope === kind ? 0 : -1} onClick={() => selectScope(kind)}>{labels[kind]}</button>)}</div>
    <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${scope}-tab`}>
      {scope !== 'faction' && <details className="development-directory" open={!focus}><summary>{focus ? 'Choose another ' : 'Choose a '}{scope === 'hearth' ? 'hearth' : 'formation'}</summary>
        <label>Search {scope === 'hearth' ? 'hearths' : 'armies'}<input type="search" value={search} placeholder="Name or identity" onChange={event => { setSearch(event.target.value); setPage(0); }}/></label>
        <nav className="development-subjects" aria-label={scope === 'hearth' ? 'Hearth development directory' : 'Training army directory'}>{matches.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE).map(item => <button type="button" key={item.id} aria-pressed={scope === 'hearth' ? focus?.entityId === item.id : activeArmy?.id === item.id} onClick={() => chooseSubject(item.id)}><strong>{item.name}</strong><small>{item.id} · hex {item.cell}{'population' in item ? ` · population ${item.population}` : ` · ${item.formations.length} formations`}</small></button>)}</nav>
        {!matches.length && <p>{subjects.length ? 'No subjects match the search.' : scope === 'hearth' ? 'Found a hearth to begin civic development.' : 'Recruit a fighting formation to begin military training.'}</p>}
        <div className="development-pages"><button type="button" aria-label="Previous development subjects" disabled={!currentPage} onClick={() => setPage(currentPage - 1)}>Previous</button><span aria-live="polite">{matches.length} records · {currentPage + 1} / {pages}</span><button type="button" aria-label="Next development subjects" disabled={currentPage + 1 >= pages} onClick={() => setPage(currentPage + 1)}>Next</button></div>
      </details>}
      {scope === 'formation' && activeArmy && <label className="development-company">Formation in {activeArmy.name}<select value={focus?.entityId ?? ''} onChange={event => setFocus({ scope: 'formation', entityId: event.target.value })}>{activeArmy.formations.map(formation => <option key={formation.id} value={formation.id}>{unitNames.get(formation.unitId) ?? formation.unitId} · {formation.id} · strength {formation.strength}</option>)}</select></label>}
      {scope !== 'faction' && pending && <p role="status">Reviewing current development costs…</p>}
      {scope !== 'faction' && error && <p role="alert" className="development-blocker">{error} {focus && <button type="button" onClick={() => retry ? retry() : request(focus)}>Review development again</button>}</p>}
      {displayed && <DevelopmentTree key={`${displayed.scope}/${displayed.entityId}`} entity={displayed} factionId={view.factionId} busy={busy || pending || Boolean(view.battle || view.pendingCapture || view.victory)} issue={issue}/>}
      {!displayed && !pending && !error && scope !== 'faction' && <p className="development-explanation">Choose a subject above to inspect its earned progress and exact current costs.</p>}
    </div>
  </section>;
}

export function QueriedDevelopmentPanel({ view, busy, issue, query, hash, epoch, enabled = true }: { view: Observation; busy: boolean; issue: (command: GameCommand) => void; query?: DevelopmentQuery; hash: string; epoch: number; enabled?: boolean }) {
  const [focus, setFocus] = useState<DevelopmentFocus | null>(null);
  const request = useCallback((next: DevelopmentFocus | null) => setFocus(previous => sameDevelopmentFocus(previous, next) ? previous : next), []);
  const result = useDevelopmentQuery({ focus, hash, epoch, query, enabled });
  return <div data-testid="development-query" data-query-state={result.status} data-query-hash={result.key?.hash ?? ''} data-scope={focus?.scope ?? 'faction'} data-entity-id={focus?.entityId ?? view.factionId}><DevelopmentPanel view={view} detail={result.entity} pending={result.status === 'loading'} error={result.error || null} busy={busy || !enabled} request={request} retry={result.retry} issue={issue}/></div>;
}
