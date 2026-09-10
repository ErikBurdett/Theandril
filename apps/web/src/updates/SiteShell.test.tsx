import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SiteShell } from './SiteShell';

describe('shared site shell', () => {
  it('renders the same masthead navigation on every page and marks the current one', () => {
    const html = renderToStaticMarkup(<SiteShell page="lore" base="/Theandril/"><p>body</p></SiteShell>);
    expect(html).toContain('aria-current="page"');
    expect(html).toMatch(/<a[^>]*href="\/Theandril\/updates\/lore\/"[^>]*aria-current="page"|<a[^>]*aria-current="page"[^>]*href="\/Theandril\/updates\/lore\/"/);
    expect(html).toContain('href="/Theandril/updates/"');
    expect(html).toContain('href="/Theandril/updates/dispatches/"');
    expect(html).toContain('href="/Theandril/updates/compendium/"');
    expect(html).toContain('href="/Theandril/"');
    expect(html).toContain('Skip to content');
    expect(html).toContain('<p>body</p>');
    expect(html).toContain('Not Theandril 1.0');
  });
  it('keeps the shell in the existing Hearth material stylesheet rather than a new theme', () => {
    const css = readFileSync('apps/web/src/updates/journal.css', 'utf8');
    expect(css).toContain('.site-header nav a[aria-current="page"]');
    expect(css).not.toMatch(/linear-gradient|@import|@font-face/);
  });
});
