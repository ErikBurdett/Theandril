import { expect, test } from '@playwright/test';
import { isPassable, neighbors } from '@theandril/mapgen';
import { applyCommand, serializeGame, type GameCommand } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { CONQUEST_FIXTURE, subjectCampaign } from '../../packages/test-fixtures/src/conquest-fixture';
import { indexes } from '../../packages/sim/src/visibility';
import { closeManagement, openCampaignJournal, openRegistry, openSelectedOrders, selectFromRegistry } from './ui-navigation';

/** Rules 80: a conquered hearth whose garrison has marched out is read as one
 * that may rise for its founder; when its unrest reaches a hundred it returns
 * to the founder and the journal records the restoration. */
test('read a conquered hearth that may rise for its founder, and watch it return when the lanes rise', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const player = CONQUEST_FIXTURE.playerFactionId, rival = CONQUEST_FIXTURE.enemyFactionId, townId = CONQUEST_FIXTURE.settlementId, armyId = CONQUEST_FIXTURE.playerArmyId;
  const state = subjectCampaign();
  const issue = (command: GameCommand) => { const result = applyCommand(state, command); if (!result.ok) throw new Error(result.error); };
  issue({ type: 'declareWar', factionId: player, targetFactionId: rival }); issue({ type: 'besiege', factionId: player, armyId, settlementId: townId });
  for (let turn = 0; turn < 3; turn++) issue({ type: 'endTurn', factionId: player });
  issue({ type: 'assault', factionId: player, settlementId: townId }); issue({ type: 'autoResolveBattle', factionId: player });
  issue({ type: 'resolveCapture', factionId: player, settlementId: townId, outcome: 'occupy' });
  issue({ type: 'endTurn', factionId: player });
  const town = state.settlements[townId]!;
  const away = neighbors(town.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell]!) && !indexes(state).settlements.get(cell))!;
  issue({ type: 'moveTo', factionId: player, armyId, target: away });
  state.unrest = [{ settlementId: townId, level: 99 }];
  const turn = state.turn;
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type=file]').setInputFiles({ name: 'restoration.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await openRegistry(page, 'settlements');
  await selectFromRegistry(page, 'settlements', /Reedwatch/); await openSelectedOrders(page);
  const unrest = page.getByTestId('settlement-unrest');
  await expect(unrest).toContainText('Unrest 99/100');
  await expect(page.getByTestId('settlement-rising')).toContainText('may rise for Reedbound Council');
  await page.screenshot({ path: test.info().outputPath('hearth-may-rise.png') });
  await closeManagement(page);
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${turn + 1}`);
  const journal = await openCampaignJournal(page);
  await expect(journal).toContainText('Reedwatch rises for Reedbound Council');
  await expect(journal).toContainText('returns to the realm that founded it');
  await page.screenshot({ path: test.info().outputPath('hearth-restored.png') });
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.settlements.find(item => item.name === 'Reedwatch')?.factionId)).toBe(rival);
  expect(errors).toEqual([]);
});
