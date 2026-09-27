# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: production/map-actions.spec.ts >> built map actions preserve paid production, land work and resources through a real save/load without development hooks
- Location: tests/production/map-actions.spec.ts:35:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByTestId('feedback')
Expected substring: "Imported campaign"
Received string:    "◆Resolving… A world of broken oaths awaits a new beginning."
Timeout: 5000ms

Call log:
  - Expect "toContainText" getByTestId('feedback') with timeout 5000ms
  - waiting for getByTestId('feedback')
    14 × locator resolved to <div role="status" class="feedback " aria-live="polite" data-testid="feedback">…</div>
       - unexpected value "◆Resolving… A world of broken oaths awaits a new beginning."

```

```yaml
- status: Resolving… A world of broken oaths awaits a new beginning.
```

# Test source

```ts
  1   | import { expect, test, type Page } from '@playwright/test';
  2   | import { BUILDINGS } from '@theandril/content';
  3   | import { applyCommand, getObservation, serializeGame } from '@theandril/sim';
  4   | import { exportSave } from '@theandril/persistence';
  5   | import { roadsCampaign } from '../../packages/test-fixtures/src/roads-fixture';
  6   | import { selectFromRegistry } from '../gameplay/ui-navigation';
  7   | 
  8   | async function settings(page: Page) {
  9   |   const menu = page.getByTestId('campaign-menu');
  10  |   if (await menu.getAttribute('open') === null) await menu.locator(':scope > summary').click();
  11  | }
  12  | 
  13  | async function openTown(page: Page, name: string) {
  14  |   await selectFromRegistry(page, 'settlements', name);
  15  |   await page.getByRole('button', { name: 'Open map actions', exact: true }).click();
  16  |   const popup = page.getByTestId('map-actions');
  17  |   await expect(popup).toBeVisible();
  18  |   await expect(popup.getByRole('heading', { name, exact: true })).toBeVisible();
  19  | }
  20  | 
  21  | async function openLand(page: Page, settlementId: string, cell: number) {
  22  |   const popup = page.getByTestId('map-actions');
  23  |   await popup.getByRole('tab', { name: 'Land & tiles', exact: true }).click();
  24  |   const land = popup.getByTestId('land-panel');
  25  |   await expect(land).toHaveAttribute('data-settlement-id', settlementId);
  26  |   await expect(land).toHaveAttribute('data-query-state', 'ready');
  27  |   const picker = land.getByRole('button', { name: 'Select tiles', exact: true });
  28  |   if (await picker.getAttribute('aria-expanded') !== 'true') await picker.click();
  29  |   await land.getByRole('button', { name: `Inspect land hex ${cell}`, exact: true }).click();
  30  |   await expect(land).toHaveAttribute('data-query-state', 'ready');
  31  |   await expect(land.getByTestId('land-cell')).toContainText(`Hex ${cell}`);
  32  |   await expect(page.getByTestId('land-panel')).toHaveCount(1);
  33  | }
  34  | 
  35  | test('built map actions preserve paid production, land work and resources through a real save/load without development hooks', async ({ page }, info) => {
  36  |   const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  37  |   const game = roadsCampaign(), factionId = game.turnOwnerId;
  38  |   const initial = getObservation(game, factionId), town = initial.settlements.find(item => item.name === 'Old Hearth')!;
  39  |   const building = BUILDINGS.find(item => item.id === 'building.granary')!;
  40  |   expect(initial.productionOptions.find(item => item.settlementId === town.id && item.itemId === building.id)?.canQueue).toBe(true);
  41  |   const imported = Buffer.from(await exportSave(serializeGame(game)));
  42  |   // Derive exact expected prices through ordinary commands, without modifying
  43  |   // the browser's imported campaign or using any development inspection hook.
  44  |   expect(applyCommand(game, { type: 'queue', factionId, settlementId: town.id, itemId: building.id }).ok).toBe(true);
  45  |   const queued = getObservation(game, factionId);
  46  |   const tile = queued.land.settlements.find(item => item.settlementId === town.id)!.cells.find(item => item.canWork && item.improvementOptions.some(option => option.improvementId === 'improvement.quarry' && option.canStart))!;
  47  |   const quote = tile.improvementOptions.find(item => item.improvementId === 'improvement.quarry')!;
  48  |   expect(applyCommand(game, { type: 'improveTile', factionId, settlementId: town.id, cell: tile.cell, improvementId: quote.improvementId }).ok).toBe(true);
  49  |   const expected = getObservation(game, factionId);
  50  | 
  51  |   await page.goto('./');
  52  |   expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
  53  |   await page.getByLabel('Import save file').setInputFiles({ name: 'production-map-actions.theandril', mimeType: 'application/gzip', buffer: imported });
> 54  |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
      |                                              ^ Error: expect(locator).toContainText(expected) failed
  55  |   const treasury = page.locator('.resources > div').filter({ has: page.getByText('TREASURY', { exact: true }) }).locator('strong');
  56  |   await expect(treasury).toHaveText(`${initial.treasury} coin`);
  57  |   await openTown(page, town.name);
  58  |   const popup = page.getByTestId('map-actions');
  59  |   await popup.getByRole('button', { name: `Build ${building.name}`, exact: true }).click();
  60  |   await expect(treasury).toHaveText(`${queued.treasury} coin`);
  61  |   await expect(popup.locator('.production-queue > li')).toHaveCount(1);
  62  |   await expect(popup.locator('.production-queue')).toContainText(building.name);
  63  |   const queueBefore = await popup.locator('.production-queue').innerText();
  64  | 
  65  |   await openLand(page, town.id, tile.cell);
  66  |   const improvements = popup.locator('.land-options').filter({ has: page.locator('summary', { hasText: 'Tile improvements' }) });
  67  |   await improvements.locator(':scope > summary').click();
  68  |   await popup.getByRole('button', { name: `Build ${quote.name}`, exact: true }).click();
  69  |   await expect(treasury).toHaveText(`${expected.treasury} coin`);
  70  |   await expect(popup.getByTestId('land-panel')).toHaveAttribute('data-query-state', 'ready');
  71  |   await expect(popup.getByTestId('land-work')).toContainText(`${quote.coinCost} coin paid`);
  72  |   const workBefore = await popup.getByTestId('land-work').innerText();
  73  |   const yieldBefore = await popup.locator('.land-tile-total').innerText();
  74  |   const resourcesBefore = await page.locator('.resources').innerText();
  75  |   const turnBefore = await page.getByTestId('turn-counter').innerText();
  76  |   await page.screenshot({ path: info.outputPath('production-map-paid-land.png') });
  77  |   await popup.getByRole('button', { name: 'Close map actions', exact: true }).click();
  78  |   await settings(page);
  79  |   await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  80  |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  81  | 
  82  |   // Change real post-save state, so a no-op Load cannot pass this regression.
  83  |   await openTown(page, town.name); await openLand(page, town.id, tile.cell);
  84  |   await popup.getByRole('button', { name: 'Cancel land work · no refund', exact: true }).click();
  85  |   await expect(popup.getByTestId('land-work')).toHaveCount(0);
  86  |   await expect(treasury).toHaveText(`${expected.treasury} coin`);
  87  |   await popup.getByRole('button', { name: 'Close map actions', exact: true }).click();
  88  |   await settings(page);
  89  |   await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  90  |   await expect(page.getByTestId('feedback')).toContainText('Campaign restored');
  91  |   await openTown(page, town.name);
  92  |   await expect(popup.locator('.production-queue')).toHaveText(queueBefore, { useInnerText: true });
  93  |   await openLand(page, town.id, tile.cell);
  94  |   await expect(popup.getByTestId('land-work')).toHaveText(workBefore, { useInnerText: true });
  95  |   await expect(popup.locator('.land-tile-total')).toHaveText(yieldBefore, { useInnerText: true });
  96  |   await expect(page.locator('.resources')).toHaveText(resourcesBefore, { useInnerText: true });
  97  |   await expect(page.getByTestId('turn-counter')).toHaveText(turnBefore, { useInnerText: true });
  98  |   expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
  99  |   expect(errors).toEqual([]);
  100 | });
  101 | 
```