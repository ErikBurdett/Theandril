import { useEffect, useState } from 'react';
import { evidenceUrl } from './journal';
import { roadmapGates, roadmapItems, roadmapSnapshot, roadmapStages } from './library';
import { filterRoadmap, readRoadmapFilters, roadmapCounts, roadmapFilters, roadmapItemUrl, roadmapStatusLabels, roadmapStatusSymbols, roadmapUrl, type RoadmapFilter } from './roadmap';
import { SiteShell } from './SiteShell';
import type { RoadmapItem, RoadmapStatus } from './types';

const base = import.meta.env.BASE_URL;

function Status({ status }: { status: RoadmapStatus }) {
  return <span className={`roadmap-status roadmap-status-${status}`}><span aria-hidden="true">{roadmapStatusSymbols[status]}</span> {roadmapStatusLabels[status]}</span>;
}

function Item({ item }: { item: RoadmapItem }) {
  return <li>
    <article id={`roadmap-${item.id}`} className="roadmap-item" data-status={item.status} tabIndex={-1} aria-labelledby={`title-${item.id}`}>
      <div className="roadmap-item-heading"><Status status={item.status} /><p className="roadmap-gate-links">{item.gates.map(gate => <a key={gate} href={`#gate-${gate}`}>Gate {gate}</a>)}</p></div>
      <h3 id={`title-${item.id}`}><a href={roadmapItemUrl(base, item.id)}>{item.title}</a></h3>
      <p className="roadmap-summary">{item.summary}</p>
      {item.remaining[0] && <p className="roadmap-next"><strong>Next:</strong> {item.remaining[0]}</p>}
      <details className="roadmap-details">
        <summary>Evidence & acceptance <span className="sr-only">for {item.title}</span></summary>
        {item.delivered.length > 0 && <div><h4>Delivered in this checkpoint</h4><ul className="roadmap-checklist">{item.delivered.map(text => <li key={text}><span aria-hidden="true">✓</span><span>{text}</span></li>)}</ul></div>}
        <div><h4>Remaining acceptance</h4>{item.remaining.length > 0
          ? <ul className="roadmap-checklist">{item.remaining.map(text => <li key={text}><span aria-hidden="true">○</span><span>{text}</span></li>)}</ul>
          : <p>This bounded checkpoint is complete. Its broader release gates remain open in the roadmap below.</p>}</div>
        <div><h4>Source & verification</h4><ul className="roadmap-evidence">{item.evidence.map(link => <li key={link.path}><a href={evidenceUrl(link.path, roadmapSnapshot.revision)}>{link.label}</a><p>{link.note}</p></li>)}</ul></div>
        <a className="back-link" href={roadmapItemUrl(base, item.id)}>Link to this item <span className="sr-only">{item.title}</span> →</a>
      </details>
    </article>
  </li>;
}

export function Roadmap() {
  const [filters, setFilters] = useState(() => readRoadmapFilters(window.location.search));
  const [linkedItem, setLinkedItem] = useState(() => new URLSearchParams(window.location.search).get('item'));
  const counts = roadmapCounts(roadmapItems);
  const filtered = filterRoadmap(roadmapItems, filters.query, filters.status);
  const unknownItem = linkedItem !== null && !roadmapItems.some(item => item.id === linkedItem);

  useEffect(() => {
    const restore = () => {
      setFilters(readRoadmapFilters(window.location.search));
      setLinkedItem(new URLSearchParams(window.location.search).get('item'));
    };
    // Stage and gate fragments create same-document history entries. Back and
    // Forward must restore the URL's filters even when the page stays mounted.
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, []);

  useEffect(() => {
    if (!linkedItem) return;
    const target = document.getElementById(`roadmap-${linkedItem}`);
    if (!target) return;
    const details = target.querySelector('details');
    if (details) details.open = true;
    const fragment = window.location.hash;
    if (!fragment || fragment === `#roadmap-${linkedItem}`) {
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: 'start' });
    } else {
      // A gate/stage link can keep the item's query parameter. Preserve that
      // more specific destination when restoring it from browser history.
      document.getElementById(fragment.slice(1))?.scrollIntoView({ block: 'start' });
    }
  }, [linkedItem]);

  function update(query: string, status: RoadmapFilter) {
    setFilters({ query, status });
    setLinkedItem(null);
    window.history.replaceState(null, '', `${roadmapUrl(base, query, status)}#roadmap-items`);
  }

  return <SiteShell page="roadmap" base={base}>
    <header className="masthead roadmap-masthead"><div><p className="eyebrow">The promise & the remaining work</p><h1>Theandril <em>Roadmap</em></h1></div><p className="masthead-note">What you can play. What is partial. What still needs building and proof.</p></header>
    <section className="roadmap-introduction" aria-label="How to read this roadmap">
      <p className="roadmap-lead">A substantial playable alpha, with major 1.0 systems still to build.</p>
      <p>This roadmap follows the <a href={evidenceUrl('GAME_1_0_SCOPE.md', roadmapSnapshot.revision)}>agreed scope</a> and <a href={evidenceUrl('DEFINITION_OF_DONE.md', roadmapSnapshot.revision)}>release gates</a>. Completed checkmarks apply to the named checkpoints. No overall 1.0 gate is signed off.</p>
      <dl className="roadmap-legend">
        <div><dt><Status status="completed" /></dt><dd>The bounded checkpoint is implemented with recorded evidence.</dd></div>
        <div><dt><Status status="in-progress" /></dt><dd>Parts are playable or review is open. This describes partial completion, not a promise of daily activity.</dd></div>
        <div><dt><Status status="pending" /></dt><dd>The named system or final proof is still to be completed.</dd></div>
      </dl>
      <p className="roadmap-snapshot">Reconciled <time dateTime={roadmapSnapshot.date}>{new Date(`${roadmapSnapshot.date}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}</time> · Gameplay rules {roadmapSnapshot.rules} · <a href={evidenceUrl('docs/IMPLEMENTATION_STATUS.md', roadmapSnapshot.revision)}>Source snapshot {roadmapSnapshot.revision.slice(0, 7)}</a></p>
      <p className="roadmap-counts">{counts.completed} completed checkpoints · {counts['in-progress']} in progress · {counts.pending} pending. These are roadmap item counts, not a percentage of the game.</p>
    </section>

    <section id="roadmap-items" className="roadmap-browser" aria-labelledby="roadmap-items-title">
      <div className="section-heading"><div><p className="eyebrow">A practical order of work</p><h2 id="roadmap-items-title">From foundations to release</h2></div><p>Order expresses priorities and dependencies. There are no promised dates; related work can proceed together.</p></div>
      <div className="archive-tools"><div className="search-field"><label htmlFor="roadmap-search">Search roadmap</label><input id="roadmap-search" type="search" placeholder="A feature, blocker or release gate…" value={filters.query} onChange={event => update(event.target.value, filters.status)} /></div><fieldset className="topic-filters"><legend>Filter by status</legend><div>{roadmapFilters.map(status => <button type="button" key={status} aria-pressed={filters.status === status} onClick={() => update(filters.query, status)}>{status === 'all' ? 'All items' : roadmapStatusLabels[status]}</button>)}</div></fieldset></div>
      <div className="results-heading"><p role="status" aria-live="polite">{filtered.length} of {roadmapItems.length} roadmap items</p>{(filters.query || filters.status !== 'all' || linkedItem !== null) && <button className="text-button" type="button" onClick={() => update('', 'all')}>Reset search & filters</button>}</div>
      {unknownItem && <div className="no-results"><h3>That roadmap item is not in this record</h3><p>Its link may be outdated. The available items are listed below.</p></div>}
      {filtered.length > 0 ? <>
        <nav className="roadmap-index" aria-label="Roadmap stages"><ol>{roadmapStages.map((stage, index) => {
          const count = filtered.filter(item => item.stage === stage.id).length;
          return <li key={stage.id}>{count > 0 ? <a href={`#${stage.id}`}><span aria-hidden="true">{index + 1}. </span>{stage.title} <span>({count})</span></a> : <span>{index + 1}. {stage.title} (0)</span>}</li>;
        })}</ol></nav>
        {roadmapStages.map((stage, index) => {
          const items = filtered.filter(item => item.stage === stage.id);
          return items.length > 0 && <section className="roadmap-stage" key={stage.id} id={stage.id} aria-labelledby={`stage-${stage.id}`}><header><p className="eyebrow">Stage {index + 1}</p><h2 id={`stage-${stage.id}`}>{stage.title}</h2><p>{stage.description}</p></header><ol className="roadmap-list">{items.map(item => <Item item={item} key={item.id} />)}</ol></section>;
        })}
      </> : <div className="no-results"><h3>No roadmap items found</h3><p>Try a feature name, a gate such as “Gate M”, or reset the search and status filter.</p></div>}
    </section>

    <section id="release-gates" className="roadmap-release" aria-labelledby="release-gates-title"><div className="section-heading"><div><p className="eyebrow">All fifteen acceptance gates</p><h2 id="release-gates-title">The 1.0 release check</h2></div><p>These gates are independent of the item filter. Every gate still has remaining work or proof.</p></div><p className="scope-intro">A checked foundation can advance a gate without completing it. The full definition of done remains the acceptance contract.</p><dl className="roadmap-gates">{roadmapGates.map(gate => <div id={`gate-${gate.id}`} key={gate.id}><dt><Status status={gate.status} /><h3>Gate {gate.id} · {gate.title}</h3></dt><dd><p>{gate.remaining}</p><a href={evidenceUrl('DEFINITION_OF_DONE.md', roadmapSnapshot.revision)}>Read acceptance criteria <span className="sr-only">for Gate {gate.id}</span> →</a></dd></div>)}</dl></section>
    <aside className="roadmap-maintenance"><h2>Keep the record useful</h2><p>Each future change should update its roadmap item, evidence and remaining acceptance alongside implementation status. The journal’s scope ledger owns this view; historical dispatches retain their original source snapshots.</p><a href={evidenceUrl('docs/updates/CONTRIBUTING.md', roadmapSnapshot.revision)}>Read the contributor contract →</a></aside>
  </SiteShell>;
}
