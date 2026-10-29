# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: posting-targets.spec.ts >> production where it stands posts to the displayed current position after real movement in the mounted inspector
- Location: tests/production/posting-targets.spec.ts:34:1

# Error details

```
Error: locator.click: Target crashed 
Call log:
  - waiting for getByRole('button', { name: 'Armies & fleets', exact: true })

```

# Test source

```ts
  1  | import { expect, type Page } from '@playwright/test';
  2  | 
  3  | type RegistryKind = 'armies' | 'settlements';
  4  | const managementNames = /^(Realm registry|Selected orders|Realm affairs|Campaign journal|Map guide)$/;
  5  | 
  6  | /** Use native close controls without clearing map selection or dismissing a battle. */
  7  | export async function closeManagement(page: Page) {
  8  |   const window = page.getByRole('dialog', { name: managementNames });
  9  |   if (await window.isVisible()) {
  10 |     await window.locator(':scope > .campaign-window-header').getByRole('button', { name: /^Close / }).click();
  11 |     await expect(window).toHaveCount(0);
  12 |   }
  13 | }
  14 | export async function closeCampaignOptions(page: Page) {
  15 |   const settings = page.getByTestId('campaign-menu');
  16 |   if (await settings.getAttribute('open') !== null) await settings.locator(':scope > summary').click();
  17 | }
  18 | async function openManagement(page: Page, title: string, launcher = title) {
  19 |   const window = page.getByRole('dialog', { name: title, exact: true });
  20 |   if (!await window.isVisible()) {
  21 |     await closeManagement(page);
  22 |     // Save/load leaves this real overlay open; dismiss it before clicking a
  23 |     // potentially covered HUD launcher. Never synthesize Escape or a map click.
  24 |     await closeCampaignOptions(page);
> 25 |     await page.getByRole('button', { name: launcher, exact: true }).click();
     |                                                                     ^ Error: locator.click: Target crashed 
  26 |   }
  27 |   await expect(window).toBeVisible();
  28 |   return window;
  29 | }
  30 | export async function openRegistry(page: Page, kind: RegistryKind) {
  31 |   const window = await openManagement(page, 'Realm registry', kind === 'armies' ? 'Armies & fleets' : 'Settlements');
  32 |   const tab = window.getByRole('tab', { name: kind === 'armies' ? /^Armies/ : /^Settlements/ });
  33 |   // The launcher already lands on its own tab; in AI watch the tabs are locked, so never click a tab that is selected.
  34 |   if (await tab.getAttribute('aria-selected') !== 'true') await tab.click();
  35 |   await expect(tab).toHaveAttribute('aria-selected', 'true');
  36 |   return window;
  37 | }
  38 | /** Search literal names; regex callers traverse real pages, never a debug selector. */
  39 | export async function selectFromRegistry(page: Page, kind: RegistryKind, name: string | RegExp) {
  40 |   const window = await openRegistry(page, kind);
  41 |   await window.getByRole('searchbox', { name: 'Search your realm' }).fill(typeof name === 'string' ? name : '');
  42 |   if (kind === 'armies') await window.getByRole('combobox', { name: 'Force type' }).selectOption('all');
  43 |   const previous = window.getByRole('button', { name: 'Previous registry page', exact: true });
  44 |   while (await previous.count() && await previous.isEnabled()) await previous.click();
  45 |   const entry = window.getByTestId(kind === 'armies' ? 'army-registry' : 'settlement-registry').getByRole('button', { name }).first();
  46 |   const next = window.getByRole('button', { name: 'Next registry page', exact: true });
  47 |   while (!await entry.count() && await next.count() && await next.isEnabled()) await next.click();
  48 |   await entry.click();
  49 |   await expect(window).toHaveCount(0);
  50 | }
  51 | export async function openSelectedOrders(page: Page) {
  52 |   return openManagement(page, 'Selected orders', 'Show selected orders');
  53 | }
  54 | export async function openRealmAffairs(page: Page) {
  55 |   return openManagement(page, 'Realm affairs');
  56 | }
  57 | export async function openCampaignJournal(page: Page) {
  58 |   return openManagement(page, 'Campaign journal');
  59 | }
  60 | /** Open the currently mounted real production disclosure, or its full orders window. */
  61 | export async function openProduction(page: Page, kind: 'building' | 'land' | 'naval') {
  62 |   const disclosure = page.getByTestId(`production-${kind}`);
  63 |   if (!await disclosure.isVisible()) await openSelectedOrders(page);
  64 |   if (await disclosure.getAttribute('open') === null) await disclosure.locator(':scope > summary').click();
  65 | }
  66 | 
```