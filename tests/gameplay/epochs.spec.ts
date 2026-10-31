import { expect, test } from '@playwright/test';
import { serializeGame } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { attunementCampaign } from '../../packages/test-fixtures/src/victory-fixture';
import { openCampaignJournal } from './ui-navigation';

/** Rules 49: the masthead names the world's age from the campaign, and the
 * journal records the age that begins when the world meets its condition. */
test('read the world’s age in the masthead and the age that begins in the journal', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const state = attunementCampaign();
  state.turn = 11; // one turn before the Short pace's Age of Roads; the found seam carries the world on into the Age of Seams at the same close
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type=file]').setInputFiles({ name: 'age-of-roads.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await expect(page.locator('.masthead .wordmark .eyebrow')).toHaveText('The Age of Fracture');
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 12');
  await expect(page.locator('.masthead .wordmark .eyebrow')).toHaveText('The Age of Seams');
  await expect(page.locator('.hud-end-turn .turn small')).toHaveText('AGE OF SEAMS');
  await page.screenshot({ path: test.info().outputPath('age-of-seams.png') });
  const journal = await openCampaignJournal(page);
  await expect(journal).toContainText('The Age of Seams begins');
  expect(errors).toEqual([]);
});
