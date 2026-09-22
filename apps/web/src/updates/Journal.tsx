import { useEffect, useState } from 'react';
import { dispatches, repository } from './content';
import { dispatchUrl, evidenceUrl, filterDispatches, localUrl, resolveDispatch } from './journal';
import { Illustration } from './Illustration';
import { scopeLedger, library, libraryRevision } from './library';
import provenance from './media.json';
import { SiteShell } from './SiteShell';
import { pageUrl } from './site';
import type { Dispatch } from './types';

const base = import.meta.env.BASE_URL;
const home = pageUrl(base, 'dispatches');
function DispatchRow({ story }: { story: Dispatch }) {
  const image = provenance.assets.find(asset => asset.id === story.image)!;
  return <article className="dispatch-row">
    <a className="row-image" href={dispatchUrl(base, story.id)} aria-label={`Read ${story.title}`} tabIndex={-1} aria-hidden="true"><img src={localUrl(base, image.path)} width={image.width} height={image.height} alt="" loading="lazy" /></a>
    <div className="row-copy"><p className="eyebrow">{story.topic} <span aria-hidden="true">/</span> {story.checkpoint}</p><h3><a href={dispatchUrl(base, story.id)}>{story.title}</a></h3><p>{story.summary}</p><span className="status-label">{story.status}</span></div>
    <span className="folio" aria-hidden="true">{story.edition}<span>↗</span></span>
  </article>;
}

const topics = ['All', 'Engineering', 'World & culture', 'Archives'];

function Archive() {
  const initial = new URLSearchParams(window.location.search);
  const [query, setQuery] = useState(initial.get('q') ?? '');
  const [topic, setTopic] = useState(topics.includes(initial.get('topic') ?? '') ? initial.get('topic')! : 'All');
  const filtered = filterDispatches(dispatches, query, topic);
  function update(nextQuery: string, nextTopic: string) {
    setQuery(nextQuery);
    setTopic(nextTopic);
    const parameters = new URLSearchParams();
    if (nextQuery) parameters.set('q', nextQuery);
    if (nextTopic !== 'All') parameters.set('topic', nextTopic);
    const search = parameters.size ? `?${parameters}` : '';
    window.history.replaceState(null, '', `${home}${search}#archive`);
  }
  return <section id="archive" className="archive" aria-labelledby="archive-title">
    <div className="section-heading"><div><p className="eyebrow">Browse the record</p><h2 id="archive-title">From the workbench</h2></div><p>Current review work, then the playable foundations. Not a release calendar.</p></div>
    <div className="archive-tools"><div className="search-field"><label htmlFor="dispatch-search">Search dispatches</label><input id="dispatch-search" type="search" placeholder="A change, a culture, a decision…" value={query} onChange={event => update(event.target.value, topic)} /></div><fieldset className="topic-filters"><legend>Filter by topic</legend><div>{topics.map(item => <button type="button" key={item} aria-pressed={topic === item} onClick={() => update(query, item)}>{item}</button>)}</div></fieldset></div>
    <div className="results-heading"><p role="status" aria-live="polite">{filtered.length} {filtered.length === 1 ? 'dispatch' : 'dispatches'}</p>{(query || topic !== 'All') && <button type="button" className="text-button" onClick={() => update('', 'All')}>Reset search & filters</button>}</div>
    <div className="dispatch-list">{filtered.map(story => <DispatchRow key={story.id} story={story} />)}</div>
    {!filtered.length && <div className="no-results"><h3>No dispatches found</h3><p>Try another word or topic. Search includes the full story, not just its title.</p></div>}
  </section>;
}

function ScopeAndLibrary() {
  return <>
    <section id="scope" className="scope-section" aria-labelledby="scope-title"><div className="section-heading"><div><p className="eyebrow">The promise & the remaining work</p><h2 id="scope-title">Road to 1.0</h2></div><p>Selected gates and decisions. Not a complete release report or a completion percentage.</p></div><p className="scope-intro">The agreed scope stays put. The evidence changes. A scoped approval moves a piece of the game forward; it does not clear every gate around it.</p><p className="scope-intro"><a href={pageUrl(base, 'roadmap')}>Open the full roadmap →</a><br />Browse checked completed checkpoints, in-progress systems and pending features with evidence and remaining acceptance. The selected decisions below use the current roadmap snapshot; historical dispatches retain their own evidence.</p><dl className="scope-ledger">{scopeLedger.map(entry => <div key={entry.id}><dt><span className="scope-state">{entry.state}</span><h3>{entry.title}</h3></dt><dd><p>{entry.description}</p><a href={evidenceUrl(entry.path, libraryRevision)}>Read the source <span className="sr-only">for {entry.title}</span><span aria-hidden="true">↗</span></a></dd></div>)}</dl><a className="back-link" href={evidenceUrl('DEFINITION_OF_DONE.md', libraryRevision)}>Read all release gates →</a></section>
    <section id="library" className="library-section" aria-labelledby="library-title"><div className="section-heading"><div><p className="eyebrow">Read further</p><h2 id="library-title">The reference shelf</h2></div><p>The documents behind the dispatches. Snapshot links preserve the reviewed source revision.</p></div><ol className="library-list">{library.map((link, index) => <li key={link.path}><span className="shelf-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><div><a href={evidenceUrl(link.path, libraryRevision)}>{link.label}</a><p>{link.note}</p></div></li>)}</ol></section>
    <section id="contribute" className="contribute-section" aria-labelledby="contribute-title"><p className="eyebrow">Leave a useful record</p><h2 id="contribute-title">Bring a change to the table</h2><p>Start with a bounded problem, a failing regression and a player-visible result. Record the decision, the exact evidence and the work still open. A proposal is not a delivered feature.</p><ol><li><strong>Draft before publishing.</strong> Use the template in your work branch. Drafts stay out of the public catalog until reviewed; this journal has no private draft route or CMS.</li><li><strong>Attach evidence, not a green total.</strong> Link actual source and results; label authored examples versus organic campaigns. Keep blocked checks blocked.</li><li><strong>Check the reading experience.</strong> Add typed content, inspect owned pixels and verify the permalink, keyboard, narrow layout and deployment base.</li></ol><div className="contributor-links"><a className="plaque" href={`${repository}/blob/master/docs/updates/CONTRIBUTING.md`}>Authoring guide</a><a href={`${repository}/blob/master/docs/updates/TEMPLATE.md`}>Dispatch template</a><a href={`${repository}/issues/new?title=${encodeURIComponent('Journal feedback: ')}`}>Report a problem ↗</a></div><p className="contribution-note">Useful next packet: document one specific player journey with source links and acceptance criteria. Propose scope changes explicitly; no paid tools, generated art or blocked AI probes are required to improve a dispatch.</p></section>
  </>;
}

function Explore() {
  const featured = dispatches[0]!;
  return <>
    <section className="masthead" aria-labelledby="journal-title"><div><p className="eyebrow">Developer journal <span aria-hidden="true">/</span> A world in the making</p><h1 id="journal-title">Theandril <em>Dispatches</em></h1></div><p className="masthead-note">The work. The world. The record.<br /><span>Substantial changes, their evidence, and the distance still to go.</span></p></section>
    <section className="featured" aria-labelledby="featured-title">
      <div className="featured-copy"><p className="eyebrow"><span className="small-rule" aria-hidden="true" /> Featured dispatch · {featured.edition}</p><span className="status-label">{featured.status}</span><h2 id="featured-title">{featured.title}</h2><p className="subtitle">{featured.subtitle}</p><p className="feature-summary">{featured.summary}</p><a className="plaque" aria-label="Read the featured dispatch" href={dispatchUrl(base, featured.id)}>Read the dispatch <span aria-hidden="true">→</span></a><p className="feature-footnote">Source checkpoint {featured.sourceRevision.slice(0, 7)} · Not a 1.0 release.</p></div>
      <Illustration id={featured.image} eager />
    </section>
    <aside className="checkpoint-note" aria-label="Checkpoint scope"><strong>A checkpoint, not a finish line.</strong><p>The original naval findings have reviewed corrections. Epic archive timing, M0 and all fifteen whole release gates remain open. Test sets overlap; we do not add them into a release score.</p></aside>
    <Archive /><ScopeAndLibrary />
  </>;
}

function Reader({ story }: { story: Dispatch }) {
  return <article className="reader">
    <a className="back-link" href={`${home}#archive`}><span aria-hidden="true">← </span>All dispatches</a>
    <header className="article-header"><p className="eyebrow">Dispatch {story.edition} <span aria-hidden="true">/</span> {story.topic}</p><span className="status-label">{story.status}</span><h1>{story.title}</h1><p className="article-subtitle">{story.subtitle}</p><p className="article-intro">{story.summary}</p><p className="byline">Theandril development <span aria-hidden="true">·</span> {story.checkpoint}</p></header>
    <div className="reading-layout"><aside className="article-index"><nav aria-label="In this dispatch"><p className="eyebrow">In this dispatch</p><ol>{story.sections.map(section => <li key={section.id}><a href={`#${section.id}`}>{section.title}</a></li>)}</ol><a href="#source-notes">Sources & review notes</a></nav><p className="index-note">A permanent record, tied to the evidence below. No invented release date or completion score.</p><a className="permalink" href={dispatchUrl(base, story.id)}>Permanent link ↗</a></aside>
      <div className="article-body"><aside className="at-a-glance"><p className="eyebrow">The short version</p><ul>{story.takeaways.map(text => <li key={text}>{text}</li>)}</ul></aside><Illustration id={story.image} eager />
        {story.sections.map(section => <section id={section.id} key={section.id}><h2>{section.title}</h2>{section.paragraphs.map(text => <p key={text}>{text}</p>)}{section.bullets && <ul>{section.bullets.map(text => <li key={text}>{text}</li>)}</ul>}{section.image && section.image !== story.image && <Illustration id={section.image} />}</section>)}
        <section id="source-notes" className="source-notes"><p className="eyebrow">Evidence, not decoration</p><h2>Sources & review notes</h2><p>These links preserve the source checkpoint at <code>{story.sourceRevision.slice(0, 7)}</code>. Counts describe the cited executions, not new runs performed for this journal.</p><ol>{story.evidence.map(link => <li key={link.path}><a href={evidenceUrl(link.path, story.sourceRevision)}>{link.label}</a><p>{link.note}</p></li>)}</ol></section>
        <nav className="more-dispatches" aria-label="Continue reading"><p className="eyebrow">Continue reading</p>{dispatches.filter(entry => entry.id !== story.id).map(entry => <a href={dispatchUrl(base, entry.id)} key={entry.id}>{entry.title} <span aria-hidden="true">→</span></a>)}</nav>
      </div>
    </div>
  </article>;
}

export function Journal() {
  const story = resolveDispatch(window.location.search);
  const missing = new URLSearchParams(window.location.search).has('dispatch') && !story;
  useEffect(() => {
    document.title = story ? `${story.title} · Theandril Dispatches` : 'Theandril Dispatches · Developer journal';
  }, [story]);
  return <SiteShell page="dispatches" base={base}>{missing ? <section className="missing-dispatch"><p className="eyebrow">Unlisted dispatch</p><h1>That page is not in the journal</h1><p>This link may be incomplete or point to work that has not been published. No draft has been substituted.</p><a className="plaque" href={pageUrl(base, 'dispatches')}>Browse published dispatches →</a></section> : story ? <Reader story={story} /> : <Explore />}</SiteShell>;
}
