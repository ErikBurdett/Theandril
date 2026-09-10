export type PageId = 'home' | 'dispatches' | 'lore' | 'compendium';
export type SitePage = { path: string; entry: string; module: string; label: string; title: string };

/** Every public page is its own static HTML entry so refreshes and deep links work on plain Pages hosting. */
export const SITE_PAGES: Readonly<Record<PageId, SitePage>> = {
  home: { path: 'updates/', entry: 'updates/index.html', module: 'main.tsx', label: 'Home', title: 'Theandril · A world in the making' },
  dispatches: { path: 'updates/dispatches/', entry: 'updates/dispatches/index.html', module: 'dispatches.tsx', label: 'Dispatches', title: 'Theandril Dispatches · Developer journal' },
  lore: { path: 'updates/lore/', entry: 'updates/lore/index.html', module: 'lore.tsx', label: 'Lore', title: 'The Book of Broken Roads · Theandril lore library' },
  compendium: { path: 'updates/compendium/', entry: 'updates/compendium/index.html', module: 'compendium.tsx', label: 'Compendium', title: 'Theandril Compendium · Cultures, units and the world' },
};

export function pageUrl(base: string, page: PageId): string {
  return `${base}${SITE_PAGES[page].path}`;
}

export function siteNavigation(base: string): { label: string; href: string; page?: PageId }[] {
  return [
    ...(Object.keys(SITE_PAGES) as PageId[]).map(page => ({ label: SITE_PAGES[page].label, href: pageUrl(base, page), page })),
    { label: 'Play development build', href: base },
  ];
}

export function currentPage(pathname: string, base: string): PageId | undefined {
  const relative = pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  const normalized = relative.replace(/index\.html$/, '');
  return (Object.keys(SITE_PAGES) as PageId[]).find(page => SITE_PAGES[page].path === normalized);
}
