import { expect, test } from '@playwright/test';
import { serializeGame } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { attunementCampaign } from '../../packages/test-fixtures/src/victory-fixture';
import { refreshAuthoredSight } from '../../packages/test-fixtures/src/authored-land';
import { isPassable, neighbors } from '@theandril/mapgen';
import { openCampaignJournal, openRealmAffairs } from './ui-navigation';

/** Rules 50: an alliance offered by another realm is accepted from Realm
 * affairs; the ally is listed, war on the ally is no longer offered, and the
 * journal records the pact. */
test('accept an alliance from Realm affairs and read the ally and the pact in the journal', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const state = attunementCampaign(), player = state.turnOwnerId, rival = state.factions[1]!.id;
  // The realms have met: the rival's company stands in sight of the player's hearth.
  const host = Object.values(state.settlements).find(town => town.factionId === player)!;
  const envoy = Object.values(state.armies).find(army => army.factionId === rival)!;
  envoy.cell = neighbors(host.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell] ?? 0) && Object.values(state.armies).every(army => army.cell !== cell))!;
  refreshAuthoredSight(state);
  state.alliances.offers = [{ id: `ally.${state.nextId++}`, proposerId: rival, recipientId: player, createdTurn: state.turn, expiresTurn: state.turn + 3, termTurns: 30 }];
  const rivalName = state.factions[1]!.name;
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type=file]').setInputFiles({ name: 'alliance-offer.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  const affairs = await openRealmAffairs(page);
  const offers = affairs.getByTestId('alliances');
  await expect(offers).toContainText(`From ${rivalName}`);
  await expect(offers).toContainText('defensive alliance of 30 turns');
  await page.screenshot({ path: test.info().outputPath('alliance-offered.png') });
  await offers.getByRole('button', { name: /^Accept alliance offer / }).click();
  await expect(affairs.getByTestId(`alliance-${rival}`)).toContainText('Allied until turn 31');
  await expect(affairs.getByRole('button', { name: `Declare war on ${rivalName}` })).toBeDisabled();
  await expect(affairs.getByRole('button', { name: `Renounce the alliance with ${rivalName}` })).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('alliance-sworn.png') });
  const journal = await openCampaignJournal(page);
  await expect(journal).toContainText('are allied until turn 31');
  expect(errors).toEqual([]);
});
