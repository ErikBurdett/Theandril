import { expect, test } from '@playwright/test';
import { serializeGame, UNREST_HALVING } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { attunementCampaign } from '../../packages/test-fixtures/src/victory-fixture';
import { openRegistry, openSelectedOrders, selectFromRegistry } from './ui-navigation';

/** Rules 71: a hearth's condition panel reads its unrest, its pressures and
 * the halved industry once the lanes are restless enough. */
test('read a restless hearth’s unrest and pressures in its condition panel', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const state = attunementCampaign(), player = state.turnOwnerId;
  const town = Object.values(state.settlements).find(item => item.factionId === player)!;
  state.taxes = [{ factionId: player, rate: 'heavy' }];
  state.unrest = [{ settlementId: town.id, level: UNREST_HALVING + 5 }];
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type=file]').setInputFiles({ name: 'unrest.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await openRegistry(page, 'settlements');
  await selectFromRegistry(page, 'settlements', new RegExp(town.name)); await openSelectedOrders(page);
  const unrest = page.getByTestId('settlement-unrest');
  await expect(unrest).toContainText(`Unrest ${UNREST_HALVING + 5}/100`);
  await expect(unrest).toContainText('industry halved');
  await expect(unrest).toContainText('heavy taxes');
  await page.screenshot({ path: test.info().outputPath('restless-hearth.png') });
  expect(errors).toEqual([]);
});
