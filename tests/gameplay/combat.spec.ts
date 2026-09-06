import { expect, test, type Page } from '@playwright/test';
import { serializeGame } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { borderBattleCampaign } from '../../packages/test-fixtures/src/combat-fixture';

async function importFrontier(page: Page): Promise<void> {
  const buffer = Buffer.from(await exportSave(serializeGame(borderBattleCampaign())));
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'broken-ford.theandril', mimeType: 'application/gzip', buffer });
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 1');
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
}
async function beginBattle(page: Page): Promise<void> {
  await importFrontier(page);
  await page.getByRole('button', { name: 'Declare war on Reedbound Council', exact: true }).click();
  await page.getByRole('button', { name: 'Attack Reedbound Watch (army.4)', exact: true }).click();
  await expect(page.getByTestId('battle-panel')).toBeVisible();
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeDisabled();
}
test('field battle permits tactical orders and resumes to the identical result from a saved round', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await beginBattle(page);
  await page.getByRole('button', { name: 'Brace', exact: true }).click();
  await expect(page.getByTestId('battle-round')).toContainText('1');
  await page.getByText('Campaign & settings', { exact: true }).click();
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  const during = await page.evaluate(() => window.__THEANDRIL__?.getStateHash());
  await page.screenshot({ path: testInfo.outputPath('tactical-battle.png'), fullPage: true });
  await page.getByRole('button', { name: 'Auto-resolve battle', exact: true }).click();
  await expect(page.getByTestId('battle-report')).toBeVisible();
  const completed = await page.evaluate(() => window.__THEANDRIL__?.getStateHash());
  expect(completed).not.toBe(during);
  await page.reload();
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('battle-round')).toContainText('1');
  expect(await page.evaluate(() => window.__THEANDRIL__?.getStateHash())).toBe(during);
  await page.getByRole('button', { name: 'Auto-resolve battle', exact: true }).click();
  await expect(page.getByTestId('battle-report')).toBeVisible();
  expect(await page.evaluate(() => window.__THEANDRIL__?.getStateHash())).toBe(completed);
  expect(await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.battle)).toBeNull();
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  await page.screenshot({ path: testInfo.outputPath('battle-report.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('withdrawal applies strategic retreat and pursuit through the player order', async ({ page }) => {
  await beginBattle(page);
  const original = await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.ownArmies.find(army => army.id === 'army.2')?.cell);
  await page.getByRole('button', { name: 'Withdraw', exact: true }).click();
  await expect(page.getByTestId('battle-report')).toContainText('ordered withdrawal');
  const survivor = await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.ownArmies.find(army => army.id === 'army.2'));
  expect(survivor).toBeTruthy();
  expect(survivor?.cell).not.toBe(original);
  expect(survivor?.strength).toBeLessThan(60);
});

test('an AI attack pauses for the human defender to choose an order', async ({ page }) => {
  await importFrontier(page);
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect(page.getByTestId('battle-panel')).toBeVisible();
  const view = await page.evaluate(() => window.__THEANDRIL__?.getSummary());
  expect(view?.battle?.defenderFactionId).toBe(view?.factionId);
  await page.getByRole('button', { name: 'Withdraw', exact: true }).click();
  await expect(page.getByTestId('battle-report')).toBeVisible();
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
});
