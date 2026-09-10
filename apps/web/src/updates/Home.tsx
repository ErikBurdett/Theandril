import { useEffect, useState } from 'react';
import { dispatches, repository } from './content';
import feed from './changelog/feed.json';
import { Illustration } from './Illustration';
import { scopeLedger } from './library';
import { initialVisibleCommits, renderMarkdown, type ChangelogEntry } from './changelog';
import { pageUrl } from './site';
import { SiteShell } from './SiteShell';

const base = import.meta.env.BASE_URL;
const description = 'Theandril is a single-player grand strategy game about building a realm through an age of fracture.';
function Commit({ entry }: { entry: ChangelogEntry }) {
  const id = `commit-${entry.shortSha}`;
  return <article id={id} className="commit-entry"><p className="eyebrow"><time dateTime={entry.date}>{entry.date.slice(0, 10)}</time> · <a href={`${repository}/commit/${entry.sha}`}>{entry.shortSha}</a> · <a href={`?commit=${entry.shortSha}#${id}`}>Permalink</a></p><h3>{entry.subject}</h3><p className="byline">{entry.author} · {entry.files} files · +{entry.insertions}/−{entry.deletions}</p><p className="commit-areas">{entry.areas.map(area => <span key={area} className="scope-state">{area}</span>)}</p>{entry.body.split(/\n\s*\n/).filter(Boolean).map(paragraph => <p key={paragraph}>{paragraph}</p>)}{entry.notes && <section className="commit-notes" dangerouslySetInnerHTML={{ __html: renderMarkdown(entry.notes) }} />}</article>;
}
export function Home() {
  const [visible, setVisible] = useState(() => initialVisibleCommits(location.search, feed, 8));
  useEffect(() => { const value = new URLSearchParams(location.search).get('commit'); if (value) document.getElementById(`commit-${value}`)?.scrollIntoView(); }, []);
  const latest = dispatches[0]!;
  return <SiteShell page="home" base={base}>
    <section className="masthead home-hero" aria-labelledby="home-title"><div><p className="eyebrow">A world in the making</p><h1 id="home-title">Theandril</h1><p className="masthead-note">{description}</p><div className="hero-actions"><a className="plaque" href={base}>Play the development build</a><a className="plaque" href={pageUrl(base, 'dispatches')}>Read the dispatches</a></div></div></section>
    <section className="featured" aria-labelledby="latest-title"><div className="featured-copy"><p className="eyebrow">Latest dispatch</p><h2 id="latest-title">{latest.title}</h2><p className="feature-summary">{latest.summary}</p><a className="plaque" href={`${pageUrl(base, 'dispatches')}?dispatch=${latest.id}`}>Read the dispatch →</a></div><Illustration id={latest.image} eager /></section>
    <section className="home-doorways" aria-label="Explore Theandril">{[{ page: 'dispatches' as const, title: 'Dispatches', text: 'Development notes with evidence and context.' }, { page: 'lore' as const, title: 'Lore library', text: 'The book of broken roads and its people.' }, { page: 'compendium' as const, title: 'Compendium', text: 'Cultures, units and the known world.' }].map(item => <a key={item.page} className="plaque" href={pageUrl(base, item.page)}><strong>{item.title}</strong><span>{item.text}</span></a>)}</section>
    <section id="scope" className="scope-section" aria-labelledby="scope-title"><div className="section-heading"><div><p className="eyebrow">Selected gates</p><h2 id="scope-title">Road to 1.0</h2></div></div><dl className="scope-ledger">{scopeLedger.map(entry => <div key={entry.id}><dt><span className="scope-state">{entry.state}</span><h3>{entry.title}</h3></dt></div>)}</dl><a href={`${pageUrl(base, 'dispatches')}#scope`}>Read the complete scope ledger →</a></section>
    <section className="commit-ledger" aria-labelledby="commit-title"><div className="section-heading"><div><p className="eyebrow">Generated from the master history at build time</p><h2 id="commit-title">The change ledger</h2></div></div>{feed.slice(0, visible).map(entry => <Commit key={entry.sha} entry={entry} />)}{visible < feed.length && <button type="button" className="plaque" onClick={() => setVisible(feed.length)}>Show {feed.length - visible} older commits</button>}</section>
  </SiteShell>;
}
