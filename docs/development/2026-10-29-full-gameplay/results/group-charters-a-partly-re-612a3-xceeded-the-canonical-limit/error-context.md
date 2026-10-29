# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: group-charters.spec.ts >> a partly refused group retains only the hearth whose new charter exceeded the canonical limit
- Location: tests/gameplay/group-charters.spec.ts:93:1

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
    13 × locator resolved to <div role="status" class="feedback " aria-live="polite" data-testid="feedback">…</div>
       - unexpected value "◆Resolving… A world of broken oaths awaits a new beginning."

```

```yaml
- status: Resolving… A world of broken oaths awaits a new beginning.
```

# Test source

```ts
  3   | import { exportSave } from '@theandril/persistence';
  4   | import { cellTransferBytes, packCells } from '../../apps/web/src/cell-transfer';
  5   | import { empireLandCampaign } from '../../packages/test-fixtures/src/empire-land-fixture';
  6   | import { closeManagement, openRegistry, openSelectedOrders, selectFromRegistry } from './ui-navigation';
  7   | 
  8   | test('forty hearths receive shared charters across pages, preserve queues, and restore individual overrides', async ({ page }, testInfo) => {
  9   |   const game = empireLandCampaign('legendary');
  10  |   const towns = Object.values(game.settlements).filter(town => town.factionId === game.turnOwnerId).sort((a, b) => a.id < b.id ? -1 : 1);
  11  |   towns.forEach((town, index) => { town.name = `Registry hearth ${String(index + 1).padStart(3, '0')}`; });
  12  |   expect(towns).toHaveLength(40);
  13  |   expect(Object.values(game.armies).filter(army => army.factionId === game.turnOwnerId)).toHaveLength(100);
  14  |   expect(applyCommand(game, { type: 'queue', factionId: game.turnOwnerId, settlementId: towns[0]!.id, itemId: 'building.granary' }).ok).toBe(true);
  15  |   const errors: string[] = [];
  16  |   page.on('pageerror', error => errors.push(error.message));
  17  |   await page.goto('/');
  18  |   await page.locator('input[type=file]').setInputFiles({ name: 'group-charters.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(game))) });
  19  |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  20  |   const before = await page.evaluate(() => ({ hash: window.__THEANDRIL__!.getStateHash(), view: window.__THEANDRIL__!.getSummary()!, metrics: window.__THEANDRIL__!.getPerformanceCounters() }));
  21  |   await openRegistry(page, 'settlements');
  22  |   const registry = page.getByTestId('settlement-registry'), group = page.getByTestId('group-charters');
  23  |   await expect(registry.getByRole('button')).toHaveCount(25);
  24  |   await registry.getByRole('checkbox').first().focus(); await page.keyboard.press('Space');
  25  |   await page.getByRole('button', { name: 'Next registry page', exact: true }).click();
  26  |   await registry.getByRole('checkbox').first().check();
  27  |   const search = page.getByRole('searchbox', { name: 'Search your realm' });
  28  |   await search.fill('Registry hearth 040');
  29  |   await expect(group).toContainText('2 hearths selected · 2 outside this filter');
  30  |   await group.getByRole('button', { name: 'Select matching hearths', exact: true }).click();
  31  |   await expect(group).toContainText('3 hearths selected · 2 outside this filter');
  32  |   await openRegistry(page, 'armies');
  33  |   await search.fill('');
  34  |   await page.getByTestId('army-registry').getByRole('checkbox').first().check();
  35  |   await openRegistry(page, 'settlements');
  36  |   await expect(group).toContainText('3 hearths selected');
  37  |   await group.getByRole('button', { name: 'Select matching hearths', exact: true }).click();
  38  |   await group.getByLabel('Charter focus').selectOption('wealth');
  39  |   await group.getByLabel('Coin ceiling per hearth').fill('24');
  40  |   await expect(group).toContainText('40 coin');
  41  |   expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(before.hash);
  42  |   expect(await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().totalTransferBytes)).toBe(before.metrics.totalTransferBytes);
  43  |   await page.screenshot({ path: testInfo.outputPath('group-charters-desktop.png') });
  44  |   await group.getByRole('button', { name: 'Apply charters (40)', exact: true }).click();
  45  |   await expect(page.getByTestId('group-charter-results')).toContainText('40 orders accepted · 0 refused');
  46  |   await expect(group).toContainText('0 hearths selected');
  47  |   const after = await page.evaluate(() => ({ view: window.__THEANDRIL__!.getSummary()!, hash: window.__THEANDRIL__!.getStateHash(), metrics: window.__THEANDRIL__!.getPerformanceCounters() }));
  48  |   expect(after.view.charters).toHaveLength(40);
  49  |   expect(after.view.charters.every(charter => charter.focus === 'wealth' && charter.ceiling === 24)).toBe(true);
  50  |   expect(after.view.ownSettlements.map(town => town.queue)).toEqual(before.view.ownSettlements.map(town => town.queue));
  51  |   expect(after.view.treasury).toBe(before.view.treasury);
  52  |   expect(after.view.exploredCells).toBe(before.view.exploredCells);
  53  |   expect(after.metrics.cellTransferBytes).toBe(cellTransferBytes(packCells([])));
  54  |   expect(after.metrics.totalTransferBytes - before.metrics.totalTransferBytes).toBe(after.metrics.transferBytes);
  55  |   await testInfo.attach('group-charter-transfer.json', { body: JSON.stringify({ authored: 'Legendary, 40 owned hearths, 100 owned armies, 4000 total armies; paid manual queue', commandMs: after.metrics.commandMs, transferBytes: after.metrics.transferBytes, cellTransferBytes: after.metrics.cellTransferBytes, publishedStates: 1, beforeHash: before.hash, afterHash: after.hash }, null, 2), contentType: 'application/json' });
  56  |   await openRegistry(page, 'armies');
  57  |   await expect(page.getByTestId('group-postings')).toContainText('1 armies selected');
  58  |   await closeManagement(page);
  59  |   await page.getByTestId('campaign-menu').locator(':scope > summary').click();
  60  |   await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  61  |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  62  |   await selectFromRegistry(page, 'settlements', towns[0]!.name);
  63  |   await openSelectedOrders(page);
  64  |   const charter = page.getByTestId('settlement-charter');
  65  |   await charter.locator(':scope > summary').click();
  66  |   await charter.getByRole('combobox', { name: 'Focus', exact: true }).selectOption('learning');
  67  |   await charter.getByRole('button', { name: 'Update charter', exact: true }).click();
  68  |   await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.charters.filter(item => item.focus === 'learning').length)).toBe(1);
  69  |   expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.charters.filter(item => item.focus === 'wealth').length)).toBe(39);
  70  |   await page.setViewportSize({ width: 390, height: 844 });
  71  |   await openRegistry(page, 'settlements');
  72  |   await search.fill('');
  73  |   await group.getByRole('button', { name: 'Select matching hearths', exact: true }).click();
  74  |   await group.getByLabel('Coin ceiling per hearth').fill('');
  75  |   await expect(group.getByRole('button', { name: 'Apply charters (40)', exact: true })).toBeDisabled();
  76  |   await group.scrollIntoViewIfNeeded();
  77  |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  78  |   await page.screenshot({ path: testInfo.outputPath('group-charters-narrow.png') });
  79  |   await group.getByRole('button', { name: 'Revoke charters (40)', exact: true }).click();
  80  |   await expect(page.getByTestId('group-charter-results')).toContainText('40 orders accepted · 0 refused');
  81  |   expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.charters.length)).toBe(0);
  82  |   expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.ownSettlements.map(town => town.queue))).toEqual(before.view.ownSettlements.map(town => town.queue));
  83  |   await closeManagement(page);
  84  |   await page.getByTestId('campaign-menu').locator(':scope > summary').click();
  85  |   await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  86  |   await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  87  |   expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(after.hash);
  88  |   await openRegistry(page, 'settlements');
  89  |   await expect(group).toContainText('0 hearths selected');
  90  |   expect(errors).toEqual([]);
  91  | });
  92  | 
  93  | test('a partly refused group retains only the hearth whose new charter exceeded the canonical limit', async ({ page }) => {
  94  |   const game = empireLandCampaign('legendary');
  95  |   const towns = Object.values(game.settlements).sort((a, b) => a.id < b.id ? -1 : 1);
  96  |   towns.forEach((town, index) => { town.name = `Limit hearth ${String(index + 1).padStart(3, '0')}`; });
  97  |   // Authored legal save boundary: lost foreign hearth records await next-turn pruning.
  98  |   game.charters = [{ settlementId: towns[0]!.id, factionId: game.turnOwnerId, focus: 'works' as const, ceiling: 24 },
  99  |     ...Array.from({ length: 4095 }, (_, index) => ({ settlementId: `town.expired.${String(index).padStart(4, '0')}`, factionId: game.factions[1]!.id, focus: 'works' as const, ceiling: 24 }))]
  100 |     .sort((a, b) => a.settlementId < b.settlementId ? -1 : 1);
  101 |   await page.goto('/');
  102 |   await page.locator('input[type=file]').setInputFiles({ name: 'limited-group-charters.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(game))) });
> 103 |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
      |                                              ^ Error: expect(locator).toContainText(expected) failed
  104 |   await openRegistry(page, 'settlements');
  105 |   const registry = page.getByTestId('settlement-registry'), group = page.getByTestId('group-charters');
  106 |   await registry.getByRole('checkbox').nth(0).check();
  107 |   await registry.getByRole('checkbox').nth(1).check();
  108 |   await group.getByRole('button', { name: 'Apply charters (2)', exact: true }).click();
  109 |   await expect(page.getByTestId('group-charter-results')).toContainText('1 orders accepted · 1 refused');
  110 |   await expect(page.getByTestId('group-charter-results')).toContainText('as many charters as it may');
  111 |   await expect(group).toContainText('1 hearth selected');
  112 |   await expect(registry.getByRole('checkbox').nth(0)).not.toBeChecked();
  113 |   await expect(registry.getByRole('checkbox').nth(1)).toBeChecked();
  114 |   expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.charters.length)).toBe(1);
  115 | });
  116 | 
```