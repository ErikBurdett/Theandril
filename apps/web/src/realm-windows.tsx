import type { Observation } from '@theandril/sim';
import { RealmNavigation, RealmRegistry } from './realm-navigation';
import { FactionArt } from './faction-art';
import type { MapSelection } from './movement';
import type { GroupPostingIssue } from './group-postings';
import type { GroupCharterIssue } from './group-charters';
import type { SelectionGroupIssue } from './selection-groups';

export function RealmRoster({ view, registry, search, force, selection, choose, setSearch, setForce, select, characters, busy = false, onGroupPosting, onGroupCharter, onSelectionGroupCommand }: {
  view: Observation; registry: 'armies' | 'settlements'; search: string; force: string; selection: MapSelection;
  choose: (kind: 'armies' | 'settlements') => void; setSearch: (value: string) => void; setForce: (value: string) => void;
  select: (selection: MapSelection) => void; characters: () => void;
  busy?: boolean; onGroupPosting?: GroupPostingIssue; onGroupCharter?: GroupCharterIssue; onSelectionGroupCommand?: SelectionGroupIssue;
}) {
  const realm = view.factions.find(faction => faction.id === view.factionId);
  return <section className="realm-roster">
    <div className="realm-heading faction-art-heading"><FactionArt contentId="ui.crest" definitionId={realm?.definitionId} label={`${realm?.name} crest`} compact/><div><span className="eyebrow">Your people</span><h3>{realm?.name}</h3></div></div>
    <RealmNavigation registry={registry} armyCount={view.armies.filter(item => item.factionId === view.factionId).length} townCount={view.settlements.filter(item => item.factionId === view.factionId).length} characterCount={view.characters.length} choose={choose} characters={characters} showMap={() => undefined} showOrders={() => undefined} selectionControls={false} busy={busy}/>
    <label className="search-label">Search your realm<input type="search" value={search} placeholder="Find a name or stable ID" onChange={event => setSearch(event.target.value)}/></label>
    <section id="realm-registry-panel" role="tabpanel" aria-labelledby={`realm-tab-${registry}`}>
      {registry === 'armies' && <label className="force-filter">Force type<select value={force} onChange={event => setForce(event.target.value)}><option value="all">All armies & fleets</option><option value="land">Land armies ashore</option><option value="naval">Fleets</option><option value="embarked">Embarked armies</option></select></label>}
      <RealmRegistry view={view} registry={registry} search={search} force={force} selection={selection} select={select} busy={busy} onGroupPosting={onGroupPosting} onGroupCharter={onGroupCharter} onSelectionGroupCommand={onSelectionGroupCommand}/>
    </section>
    <p className="field-help">Choose an entry to locate it on the map. Use the bottom command tray for its orders.</p>
  </section>;
}

export function RealmJournal({ view, locate }: { view: Observation; locate: (cell: number) => void }) {
  return <section className="chronicle"><h3>Recent campaign events</h3><p className="field-help">The latest {Math.min(16, view.events.length)} entries. A completed campaign unlocks the full history tome and technical log.</p><ol data-testid="chronicle">{view.events.slice(-16).reverse().map((event, index) => <li key={`${event.turn}-${index}`}><small>TURN {event.turn}</small>{event.message}{event.cell !== undefined && <button aria-label={`Locate event: ${event.message}`} onClick={() => { if (event.cell !== undefined) locate(event.cell); }}>Locate</button>}</li>)}</ol></section>;
}
