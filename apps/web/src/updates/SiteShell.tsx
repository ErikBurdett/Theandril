import type { CSSProperties, ReactNode } from 'react';
import { repository } from './content';
import { localUrl } from './journal';
import { pageUrl, siteNavigation, type PageId } from './site';

function materials(base: string): CSSProperties {
  return {
    '--wood': `url("${localUrl(base, 'ui/hearth-card/wood.webp')}")`,
    '--parchment': `url("${localUrl(base, 'ui/hearth-card/parchment.webp')}")`,
  } as CSSProperties;
}

/** One masthead, one bound book, one footer: every public page reads as the same site. */
export function SiteShell({ page, base, children }: { page: PageId; base: string; children: ReactNode }) {
  return <div className="journal-site" style={materials(base)}>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header">
      <a className="wordmark" href={pageUrl(base, 'home')} aria-label="Theandril home"><span className="monogram" aria-hidden="true">T</span><span><small>The age of fracture</small><strong>Theandril</strong></span></a>
      <nav aria-label="Main navigation">{siteNavigation(base).map(item => item.page
        ? <a key={item.href} href={item.href} aria-current={item.page === page ? 'page' : undefined}>{item.label}</a>
        : <a key={item.href} className="play-link" href={item.href}>{item.label} <span aria-hidden="true">↗</span></a>)}</nav>
    </header>
    <main id="main" tabIndex={-1} className="bound-journal"><div className="paper-content">{children}</div></main>
    <footer className="site-footer"><p><strong>Theandril</strong> · A world in the making.<br /><span>Single-player development build. Not Theandril 1.0.</span></p><div><a href={`${repository}/blob/master/docs/IMPLEMENTATION_STATUS.md`}>Current implementation status ↗</a><a href={localUrl(base, 'updates/provenance.json')}>Image provenance ↗</a><a href="https://erikburdett.github.io/theandril-hearth-and-card/updates/roadmap/">Hearth & Card roadmap ↗</a><a href={repository}>Source repository ↗</a></div></footer>
  </div>;
}
