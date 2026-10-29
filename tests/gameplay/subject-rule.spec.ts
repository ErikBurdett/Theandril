import { expect, test } from '@playwright/test';
import { applyCommand, serializeGame, type GameCommand, type GameState } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { CONQUEST_FIXTURE, subjectCampaign } from '../../packages/test-fixtures/src/conquest-fixture';
import { closeManagement, openRealmAffairs } from './ui-navigation';

/** Rules 39: a fallen capital is handed back under an imposed oath through the real capture panel. */
function fallenCapital(): GameState {
  const state = subjectCampaign(), player = CONQUEST_FIXTURE.playerFactionId;
  const issue = (command: GameCommand) => { const result = applyCommand(state, command); if (!result.ok) throw new Error(result.error); };
  issue({ type: 'declareWar', factionId: player, targetFactionId: CONQUEST_FIXTURE.enemyFactionId });
  issue({ type: 'besiege', factionId: player, armyId: CONQUEST_FIXTURE.playerArmyId, settlementId: CONQUEST_FIXTURE.settlementId });
  for (let turn = 0; turn < 3; turn++) issue({ type: 'endTurn', factionId: player });
  issue({ type: 'assault', factionId: player, settlementId: CONQUEST_FIXTURE.settlementId });
  issue({ type: 'autoResolveBattle', factionId: player });
  if (!state.pendingCapture) throw new Error('The capital did not fall.');
  return state;
}

test('make a fallen capital a subject realm: peace, tribute and the oath survive a save', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const state = fallenCapital();
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'fallen-reedwatch.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  const panel = page.getByTestId('capture-panel');
  await expect(panel).toContainText('Reedwatch has fallen');
  await expect(panel).toContainText('bind the realm as your subject');
  await panel.screenshot({ path: testInfo.outputPath('subject-offer.png') });
  await page.getByRole('button', { name: 'Make subject realm', exact: true }).click();
  await expect(panel).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getSummary()?.wars)).toEqual([]);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getSummary()?.diplomacy.clients.length)).toBe(1);
  expect(await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.settlements.find(town => town.id === 'settlement.6')?.factionId)).toBe(CONQUEST_FIXTURE.enemyFactionId);
  await openRealmAffairs(page);
  await expect(page.getByText(/answers? to you/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Declare war on Reedbound Council', exact: true })).toBeDisabled();
  await page.screenshot({ path: testInfo.outputPath('subject-oath.png'), fullPage: true });
  await closeManagement(page);
  await page.getByText('Campaign & settings', { exact: true }).click();
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  const hash = await page.evaluate(() => window.__THEANDRIL__?.getStateHash());
  await page.reload();
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getStateHash())).toBe(hash);
  expect(await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.diplomacy.clients.length)).toBe(1);
  expect(errors).toEqual([]);
});
