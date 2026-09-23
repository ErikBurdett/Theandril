# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: group-postings.spec.ts >> historical rules refuse group postings with a reason and retain selection for review
- Location: tests/gameplay/group-postings.spec.ts:78:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByTestId('group-posting-results')
Expected substring: "0 orders accepted"
Received string:    "2 orders accepted · 0 refused."
Timeout: 5000ms

Call log:
  - Expect "toContainText" getByTestId('group-posting-results') with timeout 5000ms
  - waiting for getByTestId('group-posting-results')
    14 × locator resolved to <div data-testid="group-posting-results">…</div>
       - unexpected value "2 orders accepted · 0 refused."

```

```yaml
- status: 2 orders accepted · 0 refused.
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | import { createGame, serializeGame } from '@theandril/sim';
  3  | import { exportSave } from '@theandril/persistence';
  4  | import { empireLandCampaign } from '../../packages/test-fixtures/src/empire-land-fixture';
  5  | import { closeManagement, openRegistry, openSelectedOrders, selectFromRegistry } from './ui-navigation';
  6  | 
  7  | test('a hundred armies receive one group posting, retain individual overrides and restore through a real save', async ({ page }, testInfo) => {
  8  |   const game = empireLandCampaign('legendary');
  9  |   const own = Object.values(game.armies).filter(army => army.factionId === game.turnOwnerId).sort((a, b) => a.id < b.id ? -1 : 1);
  10 |   own.forEach((army, index) => { army.name = `Registry company ${String(index + 1).padStart(3, '0')}`; });
  11 |   expect(own).toHaveLength(100);
  12 |   const errors: string[] = [];
  13 |   page.on('pageerror', error => errors.push(error.message));
  14 |   await page.goto('/');
  15 |   await page.locator('input[type=file]').setInputFiles({ name: 'group-postings.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(game))) });
  16 |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  17 |   const before = await page.evaluate(() => ({ hash: window.__THEANDRIL__!.getStateHash(), metrics: window.__THEANDRIL__!.getPerformanceCounters(), explored: window.__THEANDRIL__!.getSummary()!.exploredCells }));
  18 |   await openRegistry(page, 'armies');
  19 |   const registry = page.getByTestId('army-registry'), group = page.getByTestId('group-postings');
  20 |   await expect(registry.getByRole('button')).toHaveCount(25);
  21 |   await registry.getByRole('checkbox').first().focus(); await page.keyboard.press('Space');
  22 |   await page.getByRole('button', { name: 'Next registry page', exact: true }).click();
  23 |   await registry.getByRole('checkbox').first().check();
  24 |   const search = page.getByRole('searchbox', { name: 'Search your realm' });
  25 |   await search.fill('Registry company 100');
  26 |   await expect(group).toContainText('2 armies selected · 2 outside this filter');
  27 |   await group.getByRole('button', { name: 'Select matching armies', exact: true }).click();
  28 |   await expect(group).toContainText('3 armies selected · 2 outside this filter');
  29 |   await search.fill('');
  30 |   await group.getByRole('button', { name: 'Select matching armies', exact: true }).click();
  31 |   await expect(group).toContainText('100 armies selected');
  32 |   expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(before.hash);
  33 |   expect(await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().totalTransferBytes)).toBe(before.metrics.totalTransferBytes);
  34 |   await group.getByRole('button', { name: 'Post selected armies (100)', exact: true }).click();
  35 |   await expect(page.getByTestId('group-posting-results')).toContainText('100 orders accepted · 0 refused');
  36 |   await expect(group).toContainText('0 armies selected');
  37 |   const after = await page.evaluate(() => ({ view: window.__THEANDRIL__!.getSummary()!, hash: window.__THEANDRIL__!.getStateHash(), metrics: window.__THEANDRIL__!.getPerformanceCounters() }));
  38 |   expect(after.view.postings).toHaveLength(100);
  39 |   expect(after.view.postings.every(posting => posting.mode === 'hold' && posting.arrived)).toBe(true);
  40 |   expect(after.view.exploredCells).toBe(before.explored);
  41 |   expect(after.metrics.cellTransferBytes).toBe(0);
  42 |   expect(after.metrics.totalTransferBytes - before.metrics.totalTransferBytes).toBe(after.metrics.transferBytes);
  43 |   await testInfo.attach('group-transfer.json', { body: JSON.stringify({ authored: 'Legendary, 40 owned hearths, 100 owned armies, 4000 total armies', commandMs: after.metrics.commandMs, transferBytes: after.metrics.transferBytes, cellTransferBytes: after.metrics.cellTransferBytes, publishedStates: 1, beforeHash: before.hash, afterHash: after.hash }, null, 2), contentType: 'application/json' });
  44 |   await page.screenshot({ path: testInfo.outputPath('group-postings-desktop.png') });
  45 |   await closeManagement(page);
  46 |   await page.getByTestId('campaign-menu').locator(':scope > summary').click();
  47 |   await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  48 |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  49 |   await selectFromRegistry(page, 'armies', own[0]!.name);
  50 |   await openSelectedOrders(page);
  51 |   const posting = page.getByTestId('army-posting');
  52 |   await posting.locator(':scope > summary').click();
  53 |   await posting.getByLabel('On arrival').selectOption('join');
  54 |   await posting.getByRole('button', { name: 'Post army', exact: true }).click();
  55 |   await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.postings.filter(item => item.mode === 'join').length)).toBe(1);
  56 |   expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.postings.filter(item => item.mode === 'hold').length)).toBe(99);
  57 |   await page.setViewportSize({ width: 390, height: 844 });
  58 |   await openRegistry(page, 'armies');
  59 |   await search.fill('');
  60 |   await group.getByRole('button', { name: 'Select matching armies', exact: true }).click();
  61 |   await expect(group).toContainText('100 armies selected');
  62 |   await group.scrollIntoViewIfNeeded();
  63 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  64 |   await page.screenshot({ path: testInfo.outputPath('group-postings-narrow.png') });
  65 |   await group.getByRole('button', { name: 'Clear selected postings (100)', exact: true }).click();
  66 |   await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.postings.length)).toBe(0);
  67 |   await expect(page.getByTestId('group-posting-results')).toContainText('100 orders accepted · 0 refused');
  68 |   await closeManagement(page);
  69 |   await page.getByTestId('campaign-menu').locator(':scope > summary').click();
  70 |   await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  71 |   await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  72 |   expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(after.hash);
  73 |   await openRegistry(page, 'armies');
  74 |   await expect(group).toContainText('0 armies selected');
  75 |   expect(errors).toEqual([]);
  76 | });
  77 | 
  78 | test('historical rules refuse group postings with a reason and retain selection for review', async ({ page }) => {
  79 |   const game = createGame({ seed: 17, size: 'tiny', factionCount: 1, rulesVersion: 25 });
  80 |   await page.goto('/');
  81 |   await page.locator('input[type=file]').setInputFiles({ name: 'historical-group-postings.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(game))) });
  82 |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  83 |   const hash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  84 |   await openRegistry(page, 'armies');
  85 |   const group = page.getByTestId('group-postings');
  86 |   await group.getByRole('button', { name: 'Select matching armies', exact: true }).click();
  87 |   await group.getByRole('button', { name: /^Post selected armies/ }).click();
> 88 |   await expect(page.getByTestId('group-posting-results')).toContainText('0 orders accepted');
     |                                                           ^ Error: expect(locator).toContainText(expected) failed
  89 |   await expect(page.getByTestId('group-posting-results')).toContainText('Refused armies remain selected for review');
  90 |   await expect(group.getByRole('button', { name: /^Post selected armies/ })).toBeEnabled();
  91 |   expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);
  92 | });
  93 | 
```