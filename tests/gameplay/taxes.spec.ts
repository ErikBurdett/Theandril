import { expect, test } from '@playwright/test';
import { serializeGame } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { attunementCampaign } from '../../packages/test-fixtures/src/victory-fixture';
import { openCampaignJournal, openRealmAffairs } from './ui-navigation';

/** Rules 70: the realm's taxes are read and set from Realm affairs, the
 * journal records the change, and the rate's text follows it. */
test('set heavy taxes from Realm affairs and read the change in the journal', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const state = attunementCampaign(), player = state.turnOwnerId;
  const realm = state.factions.find(item => item.id === player)!.name;
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type=file]').setInputFiles({ name: 'taxes.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  const affairs = await openRealmAffairs(page);
  const taxes = affairs.getByTestId('tax-policy');
  await expect(taxes.getByTestId('tax-rate')).toContainText('Steady taxes');
  await expect(taxes.getByRole('button', { name: 'Set steady taxes', exact: true })).toBeDisabled();
  await page.screenshot({ path: test.info().outputPath('taxes-steady.png') });
  await taxes.getByRole('button', { name: 'Set heavy taxes', exact: true }).click();
  await expect(taxes.getByTestId('tax-rate')).toContainText('Heavy taxes: every hearth yields a quarter more coin');
  await expect(taxes.getByRole('button', { name: 'Set heavy taxes', exact: true })).toBeDisabled();
  await page.screenshot({ path: test.info().outputPath('taxes-heavy.png') });
  const journal = await openCampaignJournal(page);
  await expect(journal).toContainText(`${realm} sets heavy taxes`);
  expect(errors).toEqual([]);
});
