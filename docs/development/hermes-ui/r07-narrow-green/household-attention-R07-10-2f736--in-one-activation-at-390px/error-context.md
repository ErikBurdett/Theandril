# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: household-attention.spec.ts >> R07 10-town labor exception opens the exact hearth in one activation at 390px
- Location: tests/gameplay/household-attention.spec.ts:53:3

# Error details

```
Error: expect(locator).toBeInViewport() failed

Locator:  getByTestId('map-actions').getByRole('heading', { name: 'Land & stewardship', exact: true })
Expected: in viewport
Received: viewport ratio 0
Timeout:  5000ms

Call log:
  - Expect "toBeInViewport" getByTestId('map-actions').getByRole('heading', { name: 'Land & stewardship', exact: true }) with timeout 5000ms
  - waiting for getByTestId('map-actions').getByRole('heading', { name: 'Land & stewardship', exact: true })
    13 × locator resolved to <h3>Land & stewardship</h3>
       - unexpected value "viewport ratio 0"

```

```yaml
- heading "Land & stewardship" [level=3]
```

# Test source

```ts
  1  | import { expect, test, type Page } from '@playwright/test';
  2  | import { serializeGame, type GameState } from '@theandril/sim';
  3  | import { exportSave } from '@theandril/persistence';
  4  | import { growingHouseholdCampaign, householdScaleCampaign } from './household-fixture';
  5  | import { closeCampaignOptions } from './ui-navigation';
  6  | 
  7  | async function importCampaign(page: Page, game: GameState) {
  8  |   await page.goto('/');
  9  |   await page.locator('input[type=file]').setInputFiles({ name: 'household-attention.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(game))) });
  10 |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  11 |   await closeCampaignOptions(page);
  12 | }
  13 | const review = (page: Page) => page.getByRole('button', { name: 'Next settlement with unassigned households', exact: true });
  14 | 
  15 | test('R07 growing queued hearth exposes exact labor attention and preserves manual assignments until a real order', async ({ page }, info) => {
  16 |   await importCampaign(page, growingHouseholdCampaign());
  17 |   await expect(review(page)).toBeDisabled();
  18 |   await page.getByRole('button', { name: 'End turn', exact: true }).click();
  19 |   await expect(page.getByTestId('turn-counter')).toHaveText('Turn 2');
  20 |   const before = await page.evaluate(() => { const api = window.__THEANDRIL__!, view = api.getSummary()!; return { hash: api.getStateHash(), land: view.land.settlements[0]!, treasury: view.treasury, town: view.ownSettlements[0]!, routes: view.routes }; });
  21 |   expect(before.town.queue.length).toBeGreaterThan(0);
  22 |   expect(before.land.workerCapacity - before.land.worked.length).toBe(1);
  23 |   await expect(page.getByTestId('household-counts')).toHaveText('Labor: 1 unassigned household · 1 settlement');
  24 |   await expect(page.getByRole('button', { name: 'Next idle settlement', exact: true })).toBeDisabled();
  25 |   await page.screenshot({ path: info.outputPath('household-growth-desktop.png') });
  26 |   await review(page).focus(); await page.keyboard.press('Enter');
  27 |   const popup = page.getByTestId('map-actions');
  28 |   await expect(popup.getByRole('tab', { name: 'Land & tiles', exact: true })).toHaveAttribute('aria-selected', 'true');
  29 |   await expect(popup.getByTestId('land-panel')).toHaveAttribute('data-query-state', 'ready');
  30 |   expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(before.hash);
  31 |   await expect(page.getByTestId('next-action-notice')).toContainText('unassigned households add no tile yields');
  32 |   await popup.getByRole('button', { name: 'Select tiles', exact: true }).click();
  33 |   await popup.locator('.land-tile-list button').filter({ hasText: /Owned/ }).first().click();
  34 |   const cell = await page.evaluate(() => window.__THEANDRIL__!.getSelection().cell!);
  35 |   expect(before.land.worked).not.toContain(cell);
  36 |   await popup.getByRole('button', { name: 'Assign worker', exact: true }).click();
  37 |   await expect(page.getByTestId('household-counts')).toHaveText('Labor: 0 unassigned households · 0 settlements');
  38 |   const after = await page.evaluate(() => { const view = window.__THEANDRIL__!.getSummary()!; return { worked: view.land.settlements[0]!.worked, treasury: view.treasury, routes: view.routes }; });
  39 |   expect(after.worked).toEqual([...before.land.worked, cell].sort((a, b) => a - b));
  40 |   expect(after.treasury).toBe(before.treasury); expect(after.routes).toEqual(before.routes);
  41 |   await popup.getByRole('button', { name: 'Close map actions', exact: true }).click();
  42 |   await page.getByTestId('campaign-menu').locator(':scope > summary').click();
  43 |   await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  44 |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  45 |   await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  46 |   await expect(page.getByTestId('feedback')).toContainText('Campaign restored');
  47 |   await expect(review(page)).toBeDisabled();
  48 |   expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.land.settlements[0]!.worked)).toEqual(after.worked);
  49 |   await info.attach('household-growth', { body: JSON.stringify({ before, cell, after }, null, 2), contentType: 'application/json' });
  50 | });
  51 | 
  52 | for (const count of [2, 10, 40] as const) {
  53 |   test(`R07 ${count}-town labor exception opens the exact hearth in one activation at 390px`, async ({ page }, info) => {
  54 |     const game = householdScaleCampaign(count);
  55 |     const towns = Object.values(game.settlements).sort((a, b) => a.id < b.id ? -1 : 1), target = towns.at(-1)!;
  56 |     await importCampaign(page, game);
  57 |     await page.setViewportSize({ width: 390, height: 844 });
  58 |     const before = await page.evaluate(() => ({ hash: window.__THEANDRIL__!.getStateHash(), view: window.__THEANDRIL__!.getSummary()! }));
  59 |     expect(before.view.ownSettlements).toHaveLength(count);
  60 |     expect(before.view.land.settlements.every(town => town.cells.length === 0)).toBe(true);
  61 |     await expect(page.getByTestId('household-counts')).toHaveText('Labor: 1 unassigned household · 1 settlement');
  62 |     await page.screenshot({ path: info.outputPath('household-attention-390.png') });
  63 |     await review(page).click();
  64 |     const popup = page.getByTestId('map-actions');
  65 |     await expect(popup.getByRole('heading', { name: target.name, exact: true })).toBeVisible();
  66 |     await expect(popup.getByTestId('land-panel')).toHaveAttribute('data-settlement-id', target.id);
  67 |     await expect(popup.getByTestId('land-panel')).toHaveAttribute('data-query-state', 'ready');
  68 |     expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(before.hash);
  69 |     expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
> 70 |     await expect(popup.getByRole('heading', { name: 'Land & stewardship', exact: true })).toBeInViewport();
     |                                                                                           ^ Error: expect(locator).toBeInViewport() failed
  71 |     await popup.screenshot({ path: info.outputPath('household-review-390.png') });
  72 |     await popup.getByRole('button', { name: 'Select tiles', exact: true }).click();
  73 |     await popup.locator('.land-tile-list button').filter({ hasText: /Owned/ }).first().click();
  74 |     await popup.getByRole('button', { name: 'Assign worker', exact: true }).click();
  75 |     await expect(page.getByTestId('household-counts')).toHaveText('Labor: 0 unassigned households · 0 settlements');
  76 |     const after = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!);
  77 |     expect(after.treasury).toBe(before.view.treasury);
  78 |     for (const land of before.view.land.settlements) {
  79 |       const worked = after.land.settlements.find(item => item.settlementId === land.settlementId)!.worked;
  80 |       if (land.settlementId !== target.id) expect(worked).toEqual(land.worked);
  81 |       else expect(worked).toEqual(expect.arrayContaining(land.worked));
  82 |     }
  83 |     await info.attach('household-scale', { body: JSON.stringify({ count, target: target.id, locateActivations: 1, beforeHash: before.hash, before: before.view.land.settlements.map(({ settlementId, workerCapacity, worked }) => ({ settlementId, workerCapacity, worked })), after: after.land.settlements.map(({ settlementId, workerCapacity, worked }) => ({ settlementId, workerCapacity, worked })) }, null, 2), contentType: 'application/json' });
  84 |   });
  85 | }
  86 | 
```