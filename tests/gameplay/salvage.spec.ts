import { expect, test } from '@playwright/test';
import { applyCommand, serializeGame, type GameCommand } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { CONQUEST_FIXTURE, conquestCampaign } from '../../packages/test-fixtures/src/conquest-fixture';
import { closeManagement, openCampaignJournal, openRegistry, openSelectedOrders, selectFromRegistry } from './ui-navigation';

/** Rules 81: the hex inspector reads untouched ruins' salvage; the company
 * standing on them takes it at the turn's end, the journal records it and
 * the inspector names the realm that took it. */
test('read untouched ruins, take their salvage at the turn’s end and read who took it', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const player = CONQUEST_FIXTURE.playerFactionId, rival = CONQUEST_FIXTURE.enemyFactionId, townId = CONQUEST_FIXTURE.settlementId, armyId = CONQUEST_FIXTURE.playerArmyId;
  const state = conquestCampaign();
  const issue = (command: GameCommand) => { const result = applyCommand(state, command); if (!result.ok) throw new Error(result.error); };
  issue({ type: 'declareWar', factionId: player, targetFactionId: rival }); issue({ type: 'besiege', factionId: player, armyId, settlementId: townId });
  for (let turn = 0; turn < 3; turn++) issue({ type: 'endTurn', factionId: player });
  issue({ type: 'assault', factionId: player, settlementId: townId }); issue({ type: 'autoResolveBattle', factionId: player });
  issue({ type: 'resolveCapture', factionId: player, settlementId: townId, outcome: 'raze' });
  const turn = state.turn;
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type=file]').setInputFiles({ name: 'salvage.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await openRegistry(page, 'armies');
  await selectFromRegistry(page, 'armies', /Ashen Vanguard/); await openSelectedOrders(page);
  await expect(page.getByTestId('ruin-inspection')).toContainText('Ruins of Reedwatch');
  await expect(page.getByTestId('ruin-salvage')).toContainText('The salvage is untouched');
  await page.screenshot({ path: test.info().outputPath('ruins-untouched.png') });
  await closeManagement(page);
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${turn + 1}`);
  const journal = await openCampaignJournal(page);
  await expect(journal).toContainText('picks over the ruins of Reedwatch');
  await closeManagement(page);
  await openRegistry(page, 'armies');
  await selectFromRegistry(page, 'armies', /Ashen Vanguard/); await openSelectedOrders(page);
  await expect(page.getByTestId('ruin-salvage')).toContainText('Salvaged by Ashen Compact');
  await page.screenshot({ path: test.info().outputPath('ruins-salvaged.png') });
  expect(errors).toEqual([]);
});
