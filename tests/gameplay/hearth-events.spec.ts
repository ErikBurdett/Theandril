import { expect, test } from '@playwright/test';
import { serializeGame } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { attunementCampaign } from '../../packages/test-fixtures/src/victory-fixture';
import { openCampaignJournal, openRealmAffairs } from './ui-navigation';

/** Rules 46: a hearth event offered to the realm is answered from Realm affairs
 * with one of its quoted answers; the coin arrives in the treasury and the
 * campaign journal records the answer. */
test('answer a hearth event from Realm affairs and read its effect in the treasury and the journal', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const state = attunementCampaign(), player = state.turnOwnerId;
  const host = Object.values(state.settlements).find(town => town.factionId === player)!;
  const faction = state.factions.find(item => item.id === player)!;
  faction.treasury = 100;
  state.hearthEvents.pending = [{ id: `event.${state.turn}.1`, factionId: player, settlementId: host.id, templateId: 'event.bumper_harvest', turn: state.turn, expiresTurn: state.turn + 5 }];
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type=file]').setInputFiles({ name: 'heavy-harvest.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  const affairs = await openRealmAffairs(page);
  const panel = affairs.getByTestId('hearth-events');
  await expect(panel).toContainText('A heavy harvest');
  await expect(panel).toContainText(`The terraces of ${host.name} yield beyond`);
  await expect(panel).toContainText('+40 coin');
  await page.screenshot({ path: test.info().outputPath('hearth-event-offered.png') });
  await panel.getByRole('button', { name: `Sell the surplus: A heavy harvest at ${host.name}` }).click();
  await expect(panel).toHaveCount(0);
  await expect(page.getByText(/\b140\b.*coin|coin.*\b140\b/).first()).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('hearth-event-answered.png') });
  const journal = await openCampaignJournal(page);
  await expect(journal).toContainText('A heavy harvest at');
  await expect(journal).toContainText('sell the surplus');
  expect(errors).toEqual([]);
});
