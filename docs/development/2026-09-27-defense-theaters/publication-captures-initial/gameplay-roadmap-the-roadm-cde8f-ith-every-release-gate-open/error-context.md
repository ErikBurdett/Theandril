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

Locator:  locator('#roadmap-empire-management').getByRole('link', { name: 'Saved groups verification', exact: true })
Expected: "https://github.com/ErikBurdett/Theandril/blob/3b0918999a166f36f6f3d51fbcb49413de549163/docs/development/2026-09-25-selection-groups/README.md"
Received: "https://github.com/ErikBurdett/Theandril/blob/0ecd2d1767f613942cf9f22315da624164cc4055/docs/development/2026-09-25-selection-groups/README.md"
Timeout:  5000ms

Call log:
  - Expect "toHaveAttribute" locator('#roadmap-empire-management').getByRole('link', { name: 'Saved groups verification', exact: true }) with timeout 5000ms
  - waiting for locator('#roadmap-empire-management').getByRole('link', { name: 'Saved groups verification', exact: true })
    14 × locator resolved to <a href="https://github.com/ErikBurdett/Theandril/blob/0ecd2d1767f613942cf9f22315da624164cc4055/docs/development/2026-09-25-selection-groups/README.md">Saved groups verification</a>
       - unexpected value "https://github.com/ErikBurdett/Theandril/blob/0ecd2d1767f613942cf9f22315da624164cc4055/docs/development/2026-09-25-selection-groups/README.md"

```

```yaml
- link "Saved groups verification":
  - /url: https://github.com/ErikBurdett/Theandril/blob/0ecd2d1767f613942cf9f22315da624164cc4055/docs/development/2026-09-25-selection-groups/README.md
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
  22  |   await expect(empire).toContainText('reusable army order templates');
> 23  |   await expect(empire.getByRole('link', { name: 'Saved groups verification', exact: true })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/3b0918999a166f36f6f3d51fbcb49413de549163/docs/development/2026-09-25-selection-groups/README.md');
      |                                                                                              ^ Error: expect(locator).toHaveAttribute(expected) failed
  24  |   await expect(page.getByRole('link', { name: 'Hearth & Card roadmap' })).toHaveAttribute('href', 'https://erikburdett.github.io/theandril-hearth-and-card/updates/roadmap/');
  25  |   expect(workers).toEqual([]);
  26  |   expect(errors).toEqual([]);
  27  | });
  28  | 
  29  | test('status and acceptance search survive refresh, reset cleanly and preserve the release check', async ({ page }) => {
  30  |   await page.goto('updates/roadmap/');
  31  |   const pending = page.getByRole('button', { name: 'Pending', exact: true });
  32  |   await pending.focus();
  33  |   await page.keyboard.press('Enter');
  34  |   await expect(pending).toHaveAttribute('aria-pressed', 'true');
  35  |   await expect(page.locator('.roadmap-item')).toHaveCount(roadmapItems.filter(item => item.status === 'pending').length);
  36  |   await page.getByRole('searchbox', { name: 'Search roadmap' }).fill('authoritative');
  37  |   await expect(page.locator('.roadmap-item')).toHaveCount(1);
  38  |   await expect(page).toHaveURL(/q=authoritative&status=pending#roadmap-items$/);
  39  |   await page.reload();
  40  |   await expect(page.getByRole('searchbox', { name: 'Search roadmap' })).toHaveValue('authoritative');
  41  |   await expect(pending).toHaveAttribute('aria-pressed', 'true');
  42  |   await page.getByRole('button', { name: 'Completed', exact: true }).click();
  43  |   await expect(page.getByRole('heading', { name: 'No roadmap items found' })).toBeVisible();
  44  |   await expect(page.locator('.roadmap-gates > div')).toHaveCount(roadmapGates.length);
  45  |   await page.getByRole('button', { name: 'Reset search & filters', exact: true }).click();
  46  |   await expect(page.locator('.roadmap-item')).toHaveCount(roadmapItems.length);
  47  |   await expect(page.getByRole('button', { name: 'All items', exact: true })).toHaveAttribute('aria-pressed', 'true');
  48  | });
  49  | 
  50  | test('an item permalink opens its evidence, survives refresh and returns to the filtered record', async ({ page }) => {
  51  |   await page.goto('updates/roadmap/?status=pending');
  52  |   await page.getByRole('link', { name: 'Build authoritative online campaigns', exact: true }).click();
  53  |   await expect(page).toHaveURL(/\?item=online-campaigns#roadmap-online-campaigns$/);
  54  |   const item = page.locator('#roadmap-online-campaigns');
  55  |   await expect(item).toBeFocused();
  56  |   await expect(item.locator('details')).toHaveAttribute('open', '');
  57  |   await expect(item.getByText('Remaining acceptance', { exact: true })).toBeVisible();
  58  |   await expect(item.getByRole('link', { name: 'Implementation status', exact: true })).toHaveAttribute('href', /\/blob\/[a-f0-9]{40}\/docs\/IMPLEMENTATION_STATUS.md$/);
  59  |   await page.reload();
  60  |   await expect(item).toBeFocused();
  61  |   await expect(item.locator('details')).toHaveAttribute('open', '');
  62  |   await page.goBack();
  63  |   await expect(page.getByRole('button', { name: 'Pending', exact: true })).toHaveAttribute('aria-pressed', 'true');
  64  |   await expect(page.locator('.roadmap-item')).toHaveCount(roadmapItems.filter(entry => entry.status === 'pending').length);
  65  | });
  66  | 
  67  | test('same-document Back and Forward restore filters and linked-item evidence', async ({ page }) => {
  68  |   await page.goto('updates/roadmap/');
  69  |   await page.getByRole('link', { name: /Complete the playable systems/ }).click();
  70  |   await expect(page).toHaveURL(/#current-work$/);
  71  |   await page.getByRole('button', { name: 'Pending', exact: true }).click();
  72  |   await expect(page).toHaveURL(/\?status=pending#roadmap-items$/);
  73  |   await page.goBack();
  74  |   await expect(page.getByRole('button', { name: 'All items', exact: true })).toHaveAttribute('aria-pressed', 'true');
  75  |   await expect(page.locator('.roadmap-item')).toHaveCount(roadmapItems.length);
  76  |   await page.goForward();
  77  |   await expect(page.getByRole('button', { name: 'Pending', exact: true })).toHaveAttribute('aria-pressed', 'true');
  78  |   await expect(page.locator('.roadmap-item')).toHaveCount(roadmapItems.filter(item => item.status === 'pending').length);
  79  | 
  80  |   await page.goto('updates/roadmap/?item=online-campaigns#roadmap-online-campaigns');
  81  |   const item = page.locator('#roadmap-online-campaigns');
  82  |   await item.locator('summary').click();
  83  |   await expect(item.locator('details')).not.toHaveAttribute('open', '');
  84  |   await item.getByRole('link', { name: 'Gate M', exact: true }).click();
  85  |   await expect(page.locator('#gate-M')).toBeInViewport();
  86  |   await page.getByRole('button', { name: 'Completed', exact: true }).click();
  87  |   await expect(item).toHaveCount(0);
  88  |   await page.goBack();
  89  |   await expect(page).toHaveURL(/\?item=online-campaigns#roadmap-online-campaigns$/);
  90  |   await expect(item).toBeFocused();
  91  |   await expect(item.locator('details')).toHaveAttribute('open', '');
  92  |   await page.goForward();
  93  |   await expect(page.getByRole('button', { name: 'Completed', exact: true })).toHaveAttribute('aria-pressed', 'true');
  94  |   await expect(item).toHaveCount(0);
  95  | });
  96  | 
  97  | for (const dimensions of [{ width: 1440, height: 1000, scale: 100 }, { width: 390, height: 844, scale: 130 }]) {
  98  |   test(`roadmap keyboard and layout at ${dimensions.width}px / ${dimensions.scale}% text`, async ({ page }, testInfo) => {
  99  |     await page.setViewportSize({ width: dimensions.width, height: dimensions.height });
  100 |     await page.goto('updates/roadmap/');
  101 |     await page.evaluate(scale => { document.documentElement.style.fontSize = `${scale}%`; }, dimensions.scale);
  102 |     await page.keyboard.press('Tab');
  103 |     await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  104 |     await page.keyboard.press('Enter');
  105 |     await expect(page.getByRole('main')).toBeFocused();
  106 |     await page.screenshot({ path: testInfo.outputPath('roadmap-top.png') });
  107 |     const item = page.locator('#roadmap-campaign-safety-review');
  108 |     const summary = item.locator('summary');
  109 |     await summary.focus();
  110 |     await page.keyboard.press('Enter');
  111 |     await expect(item.getByText('Remaining acceptance', { exact: true })).toBeVisible();
  112 |     await item.screenshot({ path: testInfo.outputPath('roadmap-open-item.png') });
  113 |     await page.keyboard.press('Space');
  114 |     await expect(item.locator('details')).not.toHaveAttribute('open', '');
  115 |     await expect(summary).toBeFocused();
  116 |     expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  117 |     await page.getByRole('button', { name: 'Pending', exact: true }).click();
  118 |     await page.getByRole('link', { name: /Build the missing release systems/ }).click();
  119 |     await expect(page.locator('#missing-systems')).toBeInViewport();
  120 |     await page.screenshot({ path: testInfo.outputPath('roadmap-pending.png') });
  121 |     expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  122 |   });
  123 | }
```