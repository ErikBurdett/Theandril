import { expect, test, type Page } from '@playwright/test';
import { applyCommand, serializeGame, type GameState } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { borderBattleCampaign } from '../../packages/test-fixtures/src/combat-fixture';

async function importCampaign(page: Page, state: GameState): Promise<void> {
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'peace-at-the-ford.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
}

test('review a funded peace package, receive AI acceptance, and restore the binding treaty', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await importCampaign(page, borderBattleCampaign());
  await page.getByRole('button', { name: 'Declare war on Reedbound Council', exact: true }).click();
  await page.getByRole('button', { name: 'Negotiate peace with Reedbound Council', exact: true }).click();
  await page.getByLabel('Coin offered', { exact: true }).fill('40');
  await page.getByLabel('Coin requested', { exact: true }).fill('0');
  await page.getByLabel('Peace duration', { exact: true }).fill('10');
  await page.getByRole('button', { name: 'Review peace terms', exact: true }).click();
  await expect(page.getByTestId('peace-assessment')).toContainText(/likely/i);
  await expect(page.getByTestId('peace-assessment')).toContainText('payment');
  await expect(page.getByTestId('peace-assessment')).toBeFocused();
  await page.getByTestId('peace-assessment').screenshot({ path: testInfo.outputPath('peace-assessment.png') });
  await page.screenshot({ path: testInfo.outputPath('peace-review.png'), fullPage: true });
  await page.getByRole('button', { name: 'Send peace offer', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getSummary()?.diplomacy.offers.length)).toBe(1);
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 2');
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getSummary()?.diplomacy.treaties.length)).toBe(1);
  expect(await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.wars)).toEqual([]);
  await expect(page.getByRole('button', { name: 'Declare war on Reedbound Council', exact: true })).toBeDisabled();
  await page.getByText('Campaign & settings', { exact: true }).click();
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  const hash = await page.evaluate(() => window.__THEANDRIL__?.getStateHash());
  await page.reload();
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 2');
  expect(await page.evaluate(() => window.__THEANDRIL__?.getStateHash())).toBe(hash);
  await page.screenshot({ path: testInfo.outputPath('binding-peace.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('a human can accept an incoming proposal and receive its actual payment', async ({ page }) => {
  const state = borderBattleCampaign();
  const [player, opponent] = state.factions;
  expect(applyCommand(state, { type: 'declareWar', factionId: opponent!.id, targetFactionId: player!.id }).ok).toBe(true);
  expect(applyCommand(state, { type: 'proposePeace', factionId: opponent!.id, targetFactionId: player!.id, terms: { offerCoin: 30, requestCoin: 0, truceTurns: 10 } }).ok).toBe(true);
  const offer = state.diplomacy.offers[0]!;
  const before = player!.treasury;
  await importCampaign(page, state);
  await page.getByRole('button', { name: `Accept peace offer ${offer.id}`, exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getSummary()?.treasury)).toBe(before + 30);
  expect(await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.wars)).toEqual([]);
  expect(await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.diplomacy.offers.length)).toBe(0);
});

test('an unfundable incoming offer explains its blocker and remains rejectable', async ({ page }) => {
  const state = borderBattleCampaign();
  const [player, opponent] = state.factions;
  const town = Object.values(state.settlements).find(town => town.factionId === opponent!.id)!;
  expect(applyCommand(state, { type: 'declareWar', factionId: opponent!.id, targetFactionId: player!.id }).ok).toBe(true);
  expect(applyCommand(state, { type: 'proposePeace', factionId: opponent!.id, targetFactionId: player!.id, terms: { offerCoin: 40, requestCoin: 0, truceTurns: 10 } }).ok).toBe(true);
  for (const itemId of ['building.granary', 'building.workshop', 'building.market']) expect(applyCommand(state, { type: 'queue', factionId: opponent!.id, settlementId: town.id, itemId }).ok).toBe(true);
  const offer = state.diplomacy.offers[0]!;
  await importCampaign(page, state);
  await expect(page.getByTestId(`peace-offer-${offer.id}`)).toContainText('no longer fund');
  await expect(page.getByRole('button', { name: `Accept peace offer ${offer.id}`, exact: true })).toBeDisabled();
  await page.getByRole('button', { name: `Reject peace offer ${offer.id}`, exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getSummary()?.diplomacy.offers.length)).toBe(0);
  expect(await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.wars.length)).toBe(1);
});
