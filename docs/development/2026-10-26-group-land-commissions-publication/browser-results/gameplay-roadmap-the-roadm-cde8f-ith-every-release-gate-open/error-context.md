# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: gameplay/roadmap.spec.ts >> the roadmap is discoverable from home and shows bounded completion with every release gate open
- Location: tests/gameplay/roadmap.spec.ts:4:1

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  locator('#roadmap-empire-management').getByRole('link', { name: 'Settlement order filter verification', exact: true })
Expected: "https://github.com/ErikBurdett/Theandril/blob/24a710aaa8ddc49aa4ce56173ac043fe4ba1f767/docs/development/2026-10-25-settlement-order-filters/README.md"
Received: "https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/docs/development/2026-10-25-settlement-order-filters/README.md"
Timeout:  5000ms

Call log:
  - Expect "toHaveAttribute" locator('#roadmap-empire-management').getByRole('link', { name: 'Settlement order filter verification', exact: true }) with timeout 5000ms
  - waiting for locator('#roadmap-empire-management').getByRole('link', { name: 'Settlement order filter verification', exact: true })
    14 × locator resolved to <a href="https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/docs/development/2026-10-25-settlement-order-filters/README.md">Settlement order filter verification</a>
       - unexpected value "https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/docs/development/2026-10-25-settlement-order-filters/README.md"

```

```yaml
- link "Settlement order filter verification":
  - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/docs/development/2026-10-25-settlement-order-filters/README.md
```

# Test source

```ts
  1   | import { expect, test } from '@playwright/test';
  2   | import { roadmapGates, roadmapItems } from '../../apps/web/src/updates/library';
  3   | 
  4   | test('the roadmap is discoverable from home and shows bounded completion with every release gate open', async ({ page }) => {
  5   |   const workers: string[] = [];
  6   |   const errors: string[] = [];
  7   |   page.on('worker', worker => workers.push(worker.url()));
  8   |   page.on('pageerror', error => errors.push(error.message));
  9   |   page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  10  |   await page.goto('updates/');
  11  |   await page.getByRole('link', { name: 'Explore the full roadmap' }).click();
  12  |   await expect(page.getByRole('heading', { level: 1, name: 'Theandril Roadmap' })).toBeVisible();
  13  |   await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Roadmap', exact: true })).toHaveAttribute('aria-current', 'page');
  14  |   await expect(page.locator('.roadmap-item')).toHaveCount(roadmapItems.length);
  15  |   await expect(page.locator('.roadmap-item[data-status="completed"]').first().locator('.roadmap-status')).toHaveText('✓ Completed');
  16  |   await expect(page.locator('.roadmap-gates > div')).toHaveCount(roadmapGates.length);
  17  |   await expect(page.locator('.roadmap-gates .roadmap-status-completed')).toHaveCount(0);
  18  |   await expect(page.locator('.roadmap-introduction')).toContainText('No overall 1.0 gate is signed off.');
  19  |   const empire = page.locator('#roadmap-empire-management');
  20  |   await empire.locator('summary').click();
  21  |   await expect(empire).toContainText('Up to 24 named campaign groups');
  22  |   await expect(empire).toContainText('currently visible foreign hearth');
  23  |   await expect(empire).toContainText('exact nine-record archive');
  24  |   await expect(empire).toContainText('exact 352-record archive');
  25  |   await expect(empire).toContainText('exact 36-record archive');
> 26  |   await expect(empire.getByRole('link', { name: 'Settlement order filter verification', exact: true })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/24a710aaa8ddc49aa4ce56173ac043fe4ba1f767/docs/development/2026-10-25-settlement-order-filters/README.md');
      |                                                                                                         ^ Error: expect(locator).toHaveAttribute(expected) failed
  27  |   await expect(empire.getByRole('link', { name: 'Group patrol verification', exact: true })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/24a710aaa8ddc49aa4ce56173ac043fe4ba1f767/docs/development/2026-10-24-group-patrols/README.md');
  28  |   await expect(empire.getByRole('link', { name: 'Army order filter verification', exact: true })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/24a710aaa8ddc49aa4ce56173ac043fe4ba1f767/docs/development/2026-10-24-army-order-filters/README.md');
  29  |   await expect(empire.getByRole('link', { name: 'Captured-hearth retirement verification', exact: true })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/24a710aaa8ddc49aa4ce56173ac043fe4ba1f767/docs/development/2026-10-24-patrol-retirement/README.md');
  30  |   await expect(empire).toContainText('reusable army order templates');
  31  |   await expect(empire.getByRole('link', { name: 'Saved groups verification', exact: true })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/24a710aaa8ddc49aa4ce56173ac043fe4ba1f767/docs/development/2026-09-25-selection-groups/README.md');
  32  |   await expect(page.getByRole('link', { name: 'Hearth & Card roadmap' })).toHaveAttribute('href', 'https://erikburdett.github.io/theandril-hearth-and-card/updates/roadmap/');
  33  |   expect(workers).toEqual([]);
  34  |   expect(errors).toEqual([]);
  35  | });
  36  | 
  37  | test('status and acceptance search survive refresh, reset cleanly and preserve the release check', async ({ page }) => {
  38  |   await page.goto('updates/roadmap/');
  39  |   const pending = page.getByRole('button', { name: 'Pending', exact: true });
  40  |   await pending.focus();
  41  |   await page.keyboard.press('Enter');
  42  |   await expect(pending).toHaveAttribute('aria-pressed', 'true');
  43  |   await expect(page.locator('.roadmap-item')).toHaveCount(roadmapItems.filter(item => item.status === 'pending').length);
  44  |   await page.getByRole('searchbox', { name: 'Search roadmap' }).fill('authoritative');
  45  |   await expect(page.locator('.roadmap-item')).toHaveCount(1);
  46  |   await expect(page).toHaveURL(/q=authoritative&status=pending#roadmap-items$/);
  47  |   await page.reload();
  48  |   await expect(page.getByRole('searchbox', { name: 'Search roadmap' })).toHaveValue('authoritative');
  49  |   await expect(pending).toHaveAttribute('aria-pressed', 'true');
  50  |   await page.getByRole('button', { name: 'Completed', exact: true }).click();
  51  |   await expect(page.getByRole('heading', { name: 'No roadmap items found' })).toBeVisible();
  52  |   await expect(page.locator('.roadmap-gates > div')).toHaveCount(roadmapGates.length);
  53  |   await page.getByRole('button', { name: 'Reset search & filters', exact: true }).click();
  54  |   await expect(page.locator('.roadmap-item')).toHaveCount(roadmapItems.length);
  55  |   await expect(page.getByRole('button', { name: 'All items', exact: true })).toHaveAttribute('aria-pressed', 'true');
  56  | });
  57  | 
  58  | test('an item permalink opens its evidence, survives refresh and returns to the filtered record', async ({ page }) => {
  59  |   await page.goto('updates/roadmap/?status=pending');
  60  |   await page.getByRole('link', { name: 'Build authoritative online campaigns', exact: true }).click();
  61  |   await expect(page).toHaveURL(/\?item=online-campaigns#roadmap-online-campaigns$/);
  62  |   const item = page.locator('#roadmap-online-campaigns');
  63  |   await expect(item).toBeFocused();
  64  |   await expect(item.locator('details')).toHaveAttribute('open', '');
  65  |   await expect(item.getByText('Remaining acceptance', { exact: true })).toBeVisible();
  66  |   await expect(item.getByRole('link', { name: 'Implementation status', exact: true })).toHaveAttribute('href', /\/blob\/[a-f0-9]{40}\/docs\/IMPLEMENTATION_STATUS.md$/);
  67  |   await page.reload();
  68  |   await expect(item).toBeFocused();
  69  |   await expect(item.locator('details')).toHaveAttribute('open', '');
  70  |   await page.goBack();
  71  |   await expect(page.getByRole('button', { name: 'Pending', exact: true })).toHaveAttribute('aria-pressed', 'true');
  72  |   await expect(page.locator('.roadmap-item')).toHaveCount(roadmapItems.filter(entry => entry.status === 'pending').length);
  73  | });
  74  | 
  75  | test('same-document Back and Forward restore filters and linked-item evidence', async ({ page }) => {
  76  |   await page.goto('updates/roadmap/');
  77  |   await page.getByRole('link', { name: /Complete the playable systems/ }).click();
  78  |   await expect(page).toHaveURL(/#current-work$/);
  79  |   await page.getByRole('button', { name: 'Pending', exact: true }).click();
  80  |   await expect(page).toHaveURL(/\?status=pending#roadmap-items$/);
  81  |   await page.goBack();
  82  |   await expect(page.getByRole('button', { name: 'All items', exact: true })).toHaveAttribute('aria-pressed', 'true');
  83  |   await expect(page.locator('.roadmap-item')).toHaveCount(roadmapItems.length);
  84  |   await page.goForward();
  85  |   await expect(page.getByRole('button', { name: 'Pending', exact: true })).toHaveAttribute('aria-pressed', 'true');
  86  |   await expect(page.locator('.roadmap-item')).toHaveCount(roadmapItems.filter(item => item.status === 'pending').length);
  87  | 
  88  |   await page.goto('updates/roadmap/?item=online-campaigns#roadmap-online-campaigns');
  89  |   const item = page.locator('#roadmap-online-campaigns');
  90  |   await item.locator('summary').click();
  91  |   await expect(item.locator('details')).not.toHaveAttribute('open', '');
  92  |   await item.getByRole('link', { name: 'Gate M', exact: true }).click();
  93  |   await expect(page.locator('#gate-M')).toBeInViewport();
  94  |   await page.getByRole('button', { name: 'Completed', exact: true }).click();
  95  |   await expect(item).toHaveCount(0);
  96  |   await page.goBack();
  97  |   await expect(page).toHaveURL(/\?item=online-campaigns#roadmap-online-campaigns$/);
  98  |   await expect(item).toBeFocused();
  99  |   await expect(item.locator('details')).toHaveAttribute('open', '');
  100 |   await page.goForward();
  101 |   await expect(page.getByRole('button', { name: 'Completed', exact: true })).toHaveAttribute('aria-pressed', 'true');
  102 |   await expect(item).toHaveCount(0);
  103 | });
  104 | 
  105 | for (const dimensions of [{ width: 1440, height: 1000, scale: 100 }, { width: 390, height: 844, scale: 130 }]) {
  106 |   test(`roadmap keyboard and layout at ${dimensions.width}px / ${dimensions.scale}% text`, async ({ page }, testInfo) => {
  107 |     await page.setViewportSize({ width: dimensions.width, height: dimensions.height });
  108 |     await page.goto('updates/roadmap/');
  109 |     await page.evaluate(scale => { document.documentElement.style.fontSize = `${scale}%`; }, dimensions.scale);
  110 |     await page.keyboard.press('Tab');
  111 |     await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  112 |     await page.keyboard.press('Enter');
  113 |     await expect(page.getByRole('main')).toBeFocused();
  114 |     await page.screenshot({ path: testInfo.outputPath('roadmap-top.png') });
  115 |     const item = page.locator('#roadmap-campaign-safety-review');
  116 |     const summary = item.locator('summary');
  117 |     await summary.focus();
  118 |     await page.keyboard.press('Enter');
  119 |     await expect(item.getByText('Remaining acceptance', { exact: true })).toBeVisible();
  120 |     await item.screenshot({ path: testInfo.outputPath('roadmap-open-item.png') });
  121 |     await page.keyboard.press('Space');
  122 |     await expect(item.locator('details')).not.toHaveAttribute('open', '');
  123 |     await expect(summary).toBeFocused();
  124 |     expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  125 |     await page.getByRole('button', { name: 'Pending', exact: true }).click();
  126 |     await page.getByRole('link', { name: /Build the missing release systems/ }).click();
```