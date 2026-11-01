import { expect, test } from '@playwright/test';
import { createArmyFormation, serializeGame } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { attunementCampaign } from '../../packages/test-fixtures/src/victory-fixture';
import { refreshAuthoredSight } from '../../packages/test-fixtures/src/authored-land';
import { rebuildIndexes } from '../../packages/sim/src/visibility';
import { closeManagement, openCampaignJournal, openRegistry, openSelectedOrders, selectFromRegistry } from './ui-navigation';

/** Rules 75: an army's deployment is chosen in its composition panel; the
 * front-rank quote follows the doctrine and the journal records the choice. */
test('choose a shield wall for an army and read its front rank and the journal', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const state = attunementCampaign(), player = state.turnOwnerId;
  const army = Object.values(state.armies).find(item => item.factionId === player)!;
  for (const unitId of ['unit.heavy_infantry', 'unit.spearman']) army.formations.push({ ...createArmyFormation(army.id, unitId), id: `formation.${state.nextId++}` });
  army.formations.sort((a, b) => a.id < b.id ? -1 : 1);
  army.movement = Math.min(army.movement, 2); // the cohort's pace, the slowest in the column
  rebuildIndexes(state); refreshAuthoredSight(state);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type=file]').setInputFiles({ name: 'deployment.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await openRegistry(page, 'armies');
  await selectFromRegistry(page, 'armies', new RegExp(army.name)); await openSelectedOrders(page);
  const composition = page.getByTestId('army-composition');
  if (await composition.getAttribute('open') === null) await composition.locator('summary').click();
  const deployment = page.getByTestId('army-deployment');
  await expect(deployment.getByTestId('army-front-rank')).toContainText('The formations draw up in their canonical order.');
  await deployment.getByRole('combobox', { name: 'Deployment', exact: true }).selectOption('shieldwall');
  await expect(deployment.getByTestId('army-front-rank')).toContainText('The best-armored formations take the front rank. Front rank: Cinder plate cohort');
  await page.screenshot({ path: test.info().outputPath('shield-wall.png') });
  await closeManagement(page);
  const journal = await openCampaignJournal(page);
  await expect(journal).toContainText(`${army.name} will draw up as shield wall`);
  expect(errors).toEqual([]);
});
