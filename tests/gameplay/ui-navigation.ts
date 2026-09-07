import type { Page } from '@playwright/test';

/** Open real disclosures by pointer; never mutate the DOM or command the game. */
export async function openRealmAffairs(page: Page) {
  const disclosure = page.getByTestId('realm-affairs');
  if (await disclosure.getAttribute('open') === null) await disclosure.locator(':scope > summary').click();
}
export async function openProduction(page: Page, kind: 'building' | 'land' | 'naval') {
  const disclosure = page.getByTestId(`production-${kind}`);
  if (await disclosure.getAttribute('open') === null) await disclosure.locator(':scope > summary').click();
}
