import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { deserializeCampaign, importSave } from '@theandril/persistence';
import { serializeGame, stateHash } from '@theandril/sim';
import { replayArchive } from '@theandril/chronicle';
import { closeManagement, openRegistry, openSelectedOrders, selectFromRegistry } from '../gameplay/ui-navigation';

async function begin(page: Page, seed: string, name: string) {
  await page.getByRole('textbox', { name: 'World seed', exact: true }).fill(seed);
  await page.getByRole('combobox', { name: 'World size', exact: true }).selectOption('tiny');
  await page.getByRole('spinbutton', { name: 'Faction count', exact: true }).fill('2');
  await page.getByRole('spinbutton', { name: 'City-states', exact: true }).fill('0');
  await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Your people await a hearth.');
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
  await selectFromRegistry(page, 'armies', /Hearth caravan/); await openSelectedOrders(page);
  await page.getByRole('textbox', { name: 'Settlement name', exact: true }).fill(name);
  await page.getByRole('button', { name: 'Found settlement', exact: true }).click();
  await openRegistry(page, 'settlements');
  await expect(page.getByTestId('settlement-registry')).toContainText(name);
}
async function settings(page: Page) {
  await closeManagement(page);
  const menu = page.getByTestId('campaign-menu');
  if (await menu.getAttribute('open') === null) await menu.locator(':scope > summary').click();
}
async function editor(page: Page) {
  await openRegistry(page, 'settlements');
  await page.getByTestId('group-charters').getByRole('button', { name: 'Select matching hearths', exact: true }).click();
  const group = page.getByTestId('group-production');
  if (await group.getAttribute('open') === null) await group.locator(':scope > summary').click();
  return group;
}
async function templates(page: Page) {
  const library = page.getByTestId('production-templates');
  if (await library.getAttribute('open') === null) await library.locator(':scope > summary').click();
  await expect(library.getByRole('combobox', { name: 'Saved production template', exact: true })).toBeEnabled();
  return library;
}
async function exported(page: Page) {
  await settings(page);
  const next = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export campaign', exact: true }).click();
  const path = await (await next).path(); expect(path).toBeTruthy();
  const bytes = await readFile(path!);
  const text = await importSave(bytes), campaign = deserializeCampaign(text);
  expect(serializeGame(replayArchive(campaign.archive))).toBe(serializeGame(campaign.game));
  return { bytes, text, ...campaign };
}

test('built production sequences cross campaigns, pay ordinary queues and survive manual and portable restoration without debug hooks', async ({ page }, testInfo) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('./'); await begin(page, '20260926', 'First Sequence Hearth');
  const group = await editor(page);
  for (const item of ['building.granary', 'building.market']) {
    await group.getByRole('combobox', { name: 'Production item', exact: true }).selectOption(item);
    await group.getByRole('button', { name: 'Add project', exact: true }).click();
  }
  const library = await templates(page);
  const saved = library.getByRole('combobox', { name: 'Saved production template', exact: true });
  await library.getByRole('textbox', { name: 'Production template name', exact: true }).fill('Frontier works');
  await library.getByRole('button', { name: 'Save production template', exact: true }).click();
  await expect(saved.getByRole('option', { name: 'Frontier works', exact: true })).toHaveCount(1);
  const passive = await exported(page);
  expect(passive.archive.records).toHaveLength(1);
  expect(passive.text).not.toContain('Frontier works');
  expect(Object.values(passive.game.settlements)[0]!.queue).toEqual([]);

  // Ordinary new-campaign controls; the preference library survives independently.
  await page.getByRole('button', { name: 'New campaign', exact: true }).click();
  await begin(page, '77', 'Second Sequence Hearth');
  await settings(page); await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  await page.reload(); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  await editor(page); await templates(page);
  await saved.selectOption({ label: 'Frontier works' });
  await expect(group.getByTestId('production-sequence-item')).toHaveCount(0);
  await library.getByRole('button', { name: 'Recall production template', exact: true }).click();
  await expect(group.getByTestId('production-sequence-item')).toHaveCount(2);
  await page.setViewportSize({ width: 390, height: 844 });
  await group.getByRole('button', { name: 'Apply production (1)', exact: true }).click();
  await expect(page.getByTestId('group-production-results')).toContainText('0 partial or refused. 2 orders accepted · 0 refused.');
  const applied = await exported(page);
  const town = Object.values(applied.game.settlements).find(town => town.factionId === applied.game.turnOwnerId)!;
  expect(town.name).toBe('Second Sequence Hearth');
  expect(town.queue.map(item => item.itemId)).toEqual(['building.granary', 'building.market']);
  expect(applied.game.factions.find(faction => faction.id === applied.game.turnOwnerId)!.treasury).toBe(42);
  expect(applied.archive.records.map(record => (record.command as { type: string }).type)).toEqual(['found', 'queue', 'queue']);
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  await page.reload(); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  const loaded = await exported(page);
  expect(stateHash(loaded.game)).toBe(stateHash(applied.game));
  expect(loaded.archive).toEqual(applied.archive);
  await page.reload();
  await page.getByLabel('Import save file').setInputFiles({ name: 'production-sequence.theandril', mimeType: 'application/gzip', buffer: applied.bytes });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  const imported = await exported(page);
  expect(serializeGame(imported.game)).toBe(serializeGame(applied.game));
  expect(imported.archive).toEqual(applied.archive);
  await selectFromRegistry(page, 'settlements', 'Second Sequence Hearth'); await openSelectedOrders(page);
  await expect(page.locator('.production-queue')).toContainText('Root cellar');
  await expect(page.locator('.production-queue')).toContainText('Charter market');
  await page.screenshot({ path: testInfo.outputPath('production-sequence-restored-narrow.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
