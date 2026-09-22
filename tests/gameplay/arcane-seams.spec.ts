import { expect, test } from '@playwright/test';
import { applyCommand, arcaneSites, createGame, serializeGame, SITE_SEARCH_COIN, type GameState } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { refreshAuthoredSight } from '../../packages/test-fixtures/src/authored-land';
import { closeManagement, openRegistry, openSelectedOrders, selectFromRegistry } from './ui-navigation';

/** A company standing on a seam, so the journey measures the paid survey itself. */
function seamScene(): { state: GameState; cell: number } {
  const state = createGame({ seed: 20260905, size: 'tiny', factionCount: 2, generatorVersion: 3 });
  const factionId = state.turnOwnerId;
  expect(applyCommand(state, { type: 'found', factionId, armyId: 'army.1', name: 'Glasswatch' }).ok).toBe(true);
  state.factions[0]!.treasury = 400;
  const cell = arcaneSites(state.world)[0]!.cell;
  state.armies['army.2']!.cell = cell;
  refreshAuthoredSight(state);
  return { state, cell };
}

test('a paid survey finds a hidden seam, names what it unlocks and survives a save', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const { state } = seamScene();
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'ashfall-glass.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');

  // Nothing is known before the ground is surveyed, and the panel says so.
  const dialog = page.getByRole('dialog', { name: 'Realm progression' });
  await page.getByRole('button', { name: 'Realm progression', exact: true }).click();
  await dialog.getByRole('tab', { name: 'Arcane Theory', exact: true }).click();
  await expect(dialog.getByTestId('arcane-seams')).toContainText('surveyed no arcane seam');
  await expect(dialog.getByTestId('arcane-research')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);

  await openRegistry(page, 'armies');
  await selectFromRegistry(page, 'armies', /Wayfinder/);
  await openSelectedOrders(page);
  const survey = page.getByRole('button', { name: `Survey for an arcane seam · ${SITE_SEARCH_COIN} coin`, exact: true });
  await expect(page.getByTestId('arcane-survey')).toContainText('Ashfall glass marks ground worth surveying');
  const purse = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.treasury);
  await survey.click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.arcaneSites.length)).toBe(1);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.treasury)).toBe(purse - SITE_SEARCH_COIN);
  // A spent company cannot survey again this turn, and the panel explains why.
  await expect(page.getByTestId('arcane-survey')).toContainText('already spent its movement');
  await expect(survey).toBeDisabled();

  await closeManagement(page);
  await page.getByRole('button', { name: 'Realm progression', exact: true }).click();
  await dialog.getByRole('tab', { name: 'Arcane Theory', exact: true }).click();
  await expect(dialog.getByTestId('arcane-seams')).toContainText('seam');
  await expect(dialog.getByTestId('arcane-seams')).toContainText('outside your borders');
  await page.screenshot({ path: testInfo.outputPath('arcane-seam-found.png'), fullPage: true });
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);

  await page.getByText('Campaign & settings', { exact: true }).click();
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  const hash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  await page.reload();
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.arcaneSites.length)).toBe(1);
  expect(errors).toEqual([]);
});
