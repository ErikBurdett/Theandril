import { expect, type Page } from '@playwright/test';

type RegistryKind = 'armies' | 'settlements';
const managementNames = /^(Realm registry|Selected orders|Realm affairs|Campaign journal|Map guide)$/;

/** Use native close controls without clearing map selection or dismissing a battle. */
export async function closeManagement(page: Page) {
  const window = page.getByRole('dialog', { name: managementNames });
  if (await window.isVisible()) {
    await window.locator(':scope > .campaign-window-header').getByRole('button', { name: /^Close / }).click();
    await expect(window).toHaveCount(0);
  }
}
export async function closeCampaignOptions(page: Page) {
  const settings = page.getByTestId('campaign-menu');
  if (await settings.getAttribute('open') !== null) await settings.locator(':scope > summary').click();
}
async function openManagement(page: Page, title: string, launcher = title) {
  const window = page.getByRole('dialog', { name: title, exact: true });
  if (!await window.isVisible()) {
    await closeManagement(page);
    // Save/load leaves this real overlay open; dismiss it before clicking a
    // potentially covered HUD launcher. Never synthesize Escape or a map click.
    await closeCampaignOptions(page);
    await page.getByRole('button', { name: launcher, exact: true }).click();
  }
  await expect(window).toBeVisible();
  return window;
}
export async function openRegistry(page: Page, kind: RegistryKind) {
  const window = await openManagement(page, 'Realm registry', kind === 'armies' ? 'Armies & fleets' : 'Settlements');
  await window.getByRole('tab', { name: kind === 'armies' ? /^Armies/ : /^Settlements/ }).click();
  return window;
}
/** Search literal names; regex callers traverse real pages, never a debug selector. */
export async function selectFromRegistry(page: Page, kind: RegistryKind, name: string | RegExp) {
  const window = await openRegistry(page, kind);
  await window.getByRole('searchbox', { name: 'Search your realm' }).fill(typeof name === 'string' ? name : '');
  if (kind === 'armies') await window.getByRole('combobox', { name: 'Force type' }).selectOption('all');
  const previous = window.getByRole('button', { name: 'Previous registry page', exact: true });
  while (await previous.count() && await previous.isEnabled()) await previous.click();
  const entry = window.getByTestId(kind === 'armies' ? 'army-registry' : 'settlement-registry').getByRole('button', { name }).first();
  const next = window.getByRole('button', { name: 'Next registry page', exact: true });
  while (!await entry.count() && await next.count() && await next.isEnabled()) await next.click();
  await entry.click();
  await expect(window).toHaveCount(0);
}
export async function openSelectedOrders(page: Page) {
  return openManagement(page, 'Selected orders', 'Show selected orders');
}
export async function openRealmAffairs(page: Page) {
  return openManagement(page, 'Realm affairs');
}
export async function openCampaignJournal(page: Page) {
  return openManagement(page, 'Campaign journal');
}
/** Open the currently mounted real production disclosure, or its full orders window. */
export async function openProduction(page: Page, kind: 'building' | 'land' | 'naval') {
  const disclosure = page.getByTestId(`production-${kind}`);
  if (!await disclosure.isVisible()) await openSelectedOrders(page);
  if (await disclosure.getAttribute('open') === null) await disclosure.locator(':scope > summary').click();
}
