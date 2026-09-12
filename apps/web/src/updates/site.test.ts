import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { currentPage, pageUrl, siteNavigation, SITE_PAGES } from './site';

describe('site pages', () => {
  it('registers every public page as its own refresh-safe static entry', () => {
    expect(Object.keys(SITE_PAGES)).toEqual(['home', 'dispatches', 'roadmap', 'lore', 'compendium']);
    expect(pageUrl('/Theandril/', 'home')).toBe('/Theandril/updates/');
    expect(pageUrl('/', 'lore')).toBe('/updates/lore/');
    expect(pageUrl('/Theandril/', 'compendium')).toBe('/Theandril/updates/compendium/');
    for (const page of Object.values(SITE_PAGES)) {
      const html = readFileSync(`apps/web/${page.entry}`, 'utf8');
      expect(html).toContain('href="%BASE_URL%ui/hearth-card/ornament.corner-idle.webp"');
      expect(html).toContain(`<script type="module" src="/src/updates/${page.module}"></script>`);
      expect(html).toContain('<div id="root"></div>');
    }
  });
  it('orders the main navigation from the site home to the playable build', () => {
    expect(siteNavigation('/Theandril/').map(item => [item.label, item.href])).toEqual([
      ['Home', '/Theandril/updates/'],
      ['Dispatches', '/Theandril/updates/dispatches/'],
      ['Roadmap', '/Theandril/updates/roadmap/'],
      ['Lore', '/Theandril/updates/lore/'],
      ['Compendium', '/Theandril/updates/compendium/'],
      ['Play development build', '/Theandril/'],
    ]);
  });
  it('resolves the current page from the deployed pathname on both bases', () => {
    expect(currentPage('/Theandril/updates/', '/Theandril/')).toBe('home');
    expect(currentPage('/Theandril/updates/index.html', '/Theandril/')).toBe('home');
    expect(currentPage('/updates/lore/', '/')).toBe('lore');
    expect(currentPage('/Theandril/updates/compendium/index.html', '/Theandril/')).toBe('compendium');
    expect(currentPage('/Theandril/updates/roadmap/index.html', '/Theandril/')).toBe('roadmap');
    expect(currentPage('/Theandril/', '/Theandril/')).toBeUndefined();
  });
});
