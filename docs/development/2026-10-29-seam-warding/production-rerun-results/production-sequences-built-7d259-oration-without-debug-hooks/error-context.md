# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: production-sequences.spec.ts >> built production sequences cross campaigns, pay ordinary queues and survive manual and portable restoration without debug hooks
- Location: tests/production/production-sequences.spec.ts:52:1

# Error details

```
Error: locator.click: Target crashed 
Call log:
  - waiting for getByRole('button', { name: 'Found settlement', exact: true })

```

# Test source

```ts
  1   | import { readFile } from 'node:fs/promises';
  2   | import { expect, test, type Page } from '@playwright/test';
  3   | import { deserializeCampaign, importSave } from '@theandril/persistence';
  4   | import { serializeGame, stateHash } from '@theandril/sim';
  5   | import { replayArchive } from '@theandril/chronicle';
  6   | import { closeManagement, openRegistry, openSelectedOrders, selectFromRegistry } from '../gameplay/ui-navigation';
  7   | 
  8   | async function begin(page: Page, seed: string, name: string) {
  9   |   await page.getByRole('textbox', { name: 'World seed', exact: true }).fill(seed);
  10  |   await page.getByRole('combobox', { name: 'World size', exact: true }).selectOption('tiny');
  11  |   await page.getByRole('spinbutton', { name: 'Faction count', exact: true }).fill('2');
  12  |   await page.getByRole('spinbutton', { name: 'City-states', exact: true }).fill('0');
  13  |   await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
  14  |   await expect(page.getByTestId('feedback')).toContainText('Your people await a hearth.');
  15  |   await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  16  |   expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
  17  |   await selectFromRegistry(page, 'armies', /Hearth caravan/); await openSelectedOrders(page);
  18  |   await page.getByRole('textbox', { name: 'Settlement name', exact: true }).fill(name);
> 19  |   await page.getByRole('button', { name: 'Found settlement', exact: true }).click();
      |                                                                             ^ Error: locator.click: Target crashed 
  20  |   await openRegistry(page, 'settlements');
  21  |   await expect(page.getByTestId('settlement-registry')).toContainText(name);
  22  | }
  23  | async function settings(page: Page) {
  24  |   await closeManagement(page);
  25  |   const menu = page.getByTestId('campaign-menu');
  26  |   if (await menu.getAttribute('open') === null) await menu.locator(':scope > summary').click();
  27  | }
  28  | async function editor(page: Page) {
  29  |   await openRegistry(page, 'settlements');
  30  |   await page.getByTestId('group-charters').getByRole('button', { name: 'Select matching hearths', exact: true }).click();
  31  |   const group = page.getByTestId('group-production');
  32  |   if (await group.getAttribute('open') === null) await group.locator(':scope > summary').click();
  33  |   return group;
  34  | }
  35  | async function templates(page: Page) {
  36  |   const library = page.getByTestId('production-templates');
  37  |   if (await library.getAttribute('open') === null) await library.locator(':scope > summary').click();
  38  |   await expect(library.getByRole('combobox', { name: 'Saved production template', exact: true })).toBeEnabled();
  39  |   return library;
  40  | }
  41  | async function exported(page: Page) {
  42  |   await settings(page);
  43  |   const next = page.waitForEvent('download');
  44  |   await page.getByRole('button', { name: 'Export campaign', exact: true }).click();
  45  |   const path = await (await next).path(); expect(path).toBeTruthy();
  46  |   const bytes = await readFile(path!);
  47  |   const text = await importSave(bytes), campaign = deserializeCampaign(text);
  48  |   expect(serializeGame(replayArchive(campaign.archive))).toBe(serializeGame(campaign.game));
  49  |   return { bytes, text, ...campaign };
  50  | }
  51  | 
  52  | test('built production sequences cross campaigns, pay ordinary queues and survive manual and portable restoration without debug hooks', async ({ page }, testInfo) => {
  53  |   const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  54  |   await page.goto('./'); await begin(page, '20260926', 'First Sequence Hearth');
  55  |   const group = await editor(page);
  56  |   for (const item of ['building.granary', 'building.market']) {
  57  |     await group.getByRole('combobox', { name: 'Production item', exact: true }).selectOption(item);
  58  |     await group.getByRole('button', { name: 'Add project', exact: true }).click();
  59  |   }
  60  |   const library = await templates(page);
  61  |   const saved = library.getByRole('combobox', { name: 'Saved production template', exact: true });
  62  |   await library.getByRole('textbox', { name: 'Production template name', exact: true }).fill('Frontier works');
  63  |   await library.getByRole('button', { name: 'Save production template', exact: true }).click();
  64  |   await expect(saved.getByRole('option', { name: 'Frontier works', exact: true })).toHaveCount(1);
  65  |   const passive = await exported(page);
  66  |   expect(passive.archive.records).toHaveLength(1);
  67  |   expect(passive.text).not.toContain('Frontier works');
  68  |   expect(Object.values(passive.game.settlements)[0]!.queue).toEqual([]);
  69  | 
  70  |   // Ordinary new-campaign controls; the preference library survives independently.
  71  |   await page.getByRole('button', { name: 'New campaign', exact: true }).click();
  72  |   await begin(page, '77', 'Second Sequence Hearth');
  73  |   await settings(page); await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  74  |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  75  |   await page.reload(); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  76  |   await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  77  |   await editor(page); await templates(page);
  78  |   await saved.selectOption({ label: 'Frontier works' });
  79  |   await expect(group.getByTestId('production-sequence-item')).toHaveCount(0);
  80  |   await library.getByRole('button', { name: 'Recall production template', exact: true }).click();
  81  |   await expect(group.getByTestId('production-sequence-item')).toHaveCount(2);
  82  |   await page.setViewportSize({ width: 390, height: 844 });
  83  |   await group.getByRole('button', { name: 'Apply production (1)', exact: true }).click();
  84  |   await expect(page.getByTestId('group-production-results')).toContainText('0 partial or refused. 2 orders accepted · 0 refused.');
  85  |   const applied = await exported(page);
  86  |   const town = Object.values(applied.game.settlements).find(town => town.factionId === applied.game.turnOwnerId)!;
  87  |   expect(town.name).toBe('Second Sequence Hearth');
  88  |   expect(town.queue.map(item => item.itemId)).toEqual(['building.granary', 'building.market']);
  89  |   expect(applied.game.factions.find(faction => faction.id === applied.game.turnOwnerId)!.treasury).toBe(42);
  90  |   expect(applied.archive.records.map(record => (record.command as { type: string }).type)).toEqual(['found', 'queue', 'queue']);
  91  |   await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  92  |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  93  |   await page.reload(); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  94  |   await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  95  |   const loaded = await exported(page);
  96  |   expect(stateHash(loaded.game)).toBe(stateHash(applied.game));
  97  |   expect(loaded.archive).toEqual(applied.archive);
  98  |   await page.reload();
  99  |   await page.getByLabel('Import save file').setInputFiles({ name: 'production-sequence.theandril', mimeType: 'application/gzip', buffer: applied.bytes });
  100 |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  101 |   const imported = await exported(page);
  102 |   expect(serializeGame(imported.game)).toBe(serializeGame(applied.game));
  103 |   expect(imported.archive).toEqual(applied.archive);
  104 |   await selectFromRegistry(page, 'settlements', 'Second Sequence Hearth'); await openSelectedOrders(page);
  105 |   await expect(page.locator('.production-queue')).toContainText('Root cellar');
  106 |   await expect(page.locator('.production-queue')).toContainText('Charter market');
  107 |   await page.screenshot({ path: testInfo.outputPath('production-sequence-restored-narrow.png') });
  108 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  109 |   expect(errors).toEqual([]);
  110 | });
  111 | 
```