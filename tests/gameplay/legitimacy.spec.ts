import { expect, test } from '@playwright/test';
import { serializeGame } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { attunementCampaign } from '../../packages/test-fixtures/src/victory-fixture';
import { openRealmAffairs } from './ui-navigation';

/** Rules 82: Realm affairs reads the realm's legitimacy with its reasons. */
test('read the realm’s legitimacy and its reasons in Realm affairs', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const state = attunementCampaign(), player = state.turnOwnerId;
  const town = Object.values(state.settlements).find(item => item.factionId === player)!;
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type=file]').setInputFiles({ name: 'legitimacy.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  const affairs = await openRealmAffairs(page);
  const legitimacy = affairs.getByTestId('legitimacy');
  await expect(legitimacy.getByTestId('legitimacy-text')).toContainText('Legitimacy 2. Settled legitimacy');
  await expect(legitimacy).toContainText(`its seat, ${town.name}, is a hearth of its own founding`);
  await page.screenshot({ path: test.info().outputPath('legitimacy-settled.png') });
  expect(errors).toEqual([]);
});
