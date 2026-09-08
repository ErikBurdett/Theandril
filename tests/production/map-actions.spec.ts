import { expect, test, type Page } from '@playwright/test';
import { BUILDINGS } from '@theandril/content';
import { applyCommand, getObservation, serializeGame } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { roadsCampaign } from '../../packages/test-fixtures/src/roads-fixture';
import { selectFromRegistry } from '../gameplay/ui-navigation';

async function settings(page: Page) {
  const menu = page.getByTestId('campaign-menu');
  if (await menu.getAttribute('open') === null) await menu.locator(':scope > summary').click();
}

async function openTown(page: Page, name: string) {
  await selectFromRegistry(page, 'settlements', name);
  await page.getByRole('button', { name: 'Open map actions', exact: true }).click();
  const popup = page.getByTestId('map-actions');
  await expect(popup).toBeVisible();
  await expect(popup.getByRole('heading', { name, exact: true })).toBeVisible();
}

async function openLand(page: Page, settlementId: string, cell: number) {
  const popup = page.getByTestId('map-actions');
  await popup.getByRole('tab', { name: 'Land & tiles', exact: true }).click();
  const land = popup.getByTestId('land-panel');
  await expect(land).toHaveAttribute('data-settlement-id', settlementId);
  await expect(land).toHaveAttribute('data-query-state', 'ready');
  const picker = land.getByRole('button', { name: 'Select tiles', exact: true });
  if (await picker.getAttribute('aria-expanded') !== 'true') await picker.click();
  await land.getByRole('button', { name: `Inspect land hex ${cell}`, exact: true }).click();
  await expect(land).toHaveAttribute('data-query-state', 'ready');
  await expect(land.getByTestId('land-cell')).toContainText(`Hex ${cell}`);
  await expect(page.getByTestId('land-panel')).toHaveCount(1);
}

test('built map actions preserve paid production, land work and resources through a real save/load without development hooks', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  const game = roadsCampaign(), factionId = game.turnOwnerId;
  const initial = getObservation(game, factionId), town = initial.settlements.find(item => item.name === 'Old Hearth')!;
  const building = BUILDINGS.find(item => item.id === 'building.granary')!;
  expect(initial.productionOptions.find(item => item.settlementId === town.id && item.itemId === building.id)?.canQueue).toBe(true);
  const imported = Buffer.from(await exportSave(serializeGame(game)));
  // Derive exact expected prices through ordinary commands, without modifying
  // the browser's imported campaign or using any development inspection hook.
  expect(applyCommand(game, { type: 'queue', factionId, settlementId: town.id, itemId: building.id }).ok).toBe(true);
  const queued = getObservation(game, factionId);
  const tile = queued.land.settlements.find(item => item.settlementId === town.id)!.cells.find(item => item.canWork && item.improvementOptions.some(option => option.improvementId === 'improvement.quarry' && option.canStart))!;
  const quote = tile.improvementOptions.find(item => item.improvementId === 'improvement.quarry')!;
  expect(applyCommand(game, { type: 'improveTile', factionId, settlementId: town.id, cell: tile.cell, improvementId: quote.improvementId }).ok).toBe(true);
  const expected = getObservation(game, factionId);

  await page.goto('./');
  expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
  await page.getByLabel('Import save file').setInputFiles({ name: 'production-map-actions.theandril', mimeType: 'application/gzip', buffer: imported });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  const treasury = page.locator('.resources > div').filter({ has: page.getByText('TREASURY', { exact: true }) }).locator('strong');
  await expect(treasury).toHaveText(`${initial.treasury} coin`);
  await openTown(page, town.name);
  const popup = page.getByTestId('map-actions');
  await popup.getByRole('button', { name: `Build ${building.name}`, exact: true }).click();
  await expect(treasury).toHaveText(`${queued.treasury} coin`);
  await expect(popup.locator('.production-queue > li')).toHaveCount(1);
  await expect(popup.locator('.production-queue')).toContainText(building.name);
  const queueBefore = await popup.locator('.production-queue').innerText();

  await openLand(page, town.id, tile.cell);
  const improvements = popup.locator('.land-options').filter({ has: page.locator('summary', { hasText: 'Tile improvements' }) });
  await improvements.locator(':scope > summary').click();
  await popup.getByRole('button', { name: `Build ${quote.name}`, exact: true }).click();
  await expect(treasury).toHaveText(`${expected.treasury} coin`);
  await expect(popup.getByTestId('land-panel')).toHaveAttribute('data-query-state', 'ready');
  await expect(popup.getByTestId('land-work')).toContainText(`${quote.coinCost} coin paid`);
  const workBefore = await popup.getByTestId('land-work').innerText();
  const yieldBefore = await popup.locator('.land-tile-total').innerText();
  const resourcesBefore = await page.locator('.resources').innerText();
  const turnBefore = await page.getByTestId('turn-counter').innerText();
  await page.screenshot({ path: info.outputPath('production-map-paid-land.png') });
  await popup.getByRole('button', { name: 'Close map actions', exact: true }).click();
  await settings(page);
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');

  // Change real post-save state, so a no-op Load cannot pass this regression.
  await openTown(page, town.name); await openLand(page, town.id, tile.cell);
  await popup.getByRole('button', { name: 'Cancel land work · no refund', exact: true }).click();
  await expect(popup.getByTestId('land-work')).toHaveCount(0);
  await expect(treasury).toHaveText(`${expected.treasury} coin`);
  await popup.getByRole('button', { name: 'Close map actions', exact: true }).click();
  await settings(page);
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored');
  await openTown(page, town.name);
  await expect(popup.locator('.production-queue')).toHaveText(queueBefore, { useInnerText: true });
  await openLand(page, town.id, tile.cell);
  await expect(popup.getByTestId('land-work')).toHaveText(workBefore, { useInnerText: true });
  await expect(popup.locator('.land-tile-total')).toHaveText(yieldBefore, { useInnerText: true });
  await expect(page.locator('.resources')).toHaveText(resourcesBefore, { useInnerText: true });
  await expect(page.getByTestId('turn-counter')).toHaveText(turnBefore, { useInnerText: true });
  expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
  expect(errors).toEqual([]);
});
