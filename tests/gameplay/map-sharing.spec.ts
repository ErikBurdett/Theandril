import { expect, test } from '@playwright/test';
import { applyCommand, serializeGame } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { attunementCampaign } from '../../packages/test-fixtures/src/victory-fixture';
import { refreshAuthoredSight } from '../../packages/test-fixtures/src/authored-land';
import { isPassable, neighbors } from '@theandril/mapgen';
import { openCampaignJournal, openRealmAffairs } from './ui-navigation';

/** Rules 72: an allied realm shares maps from Realm affairs; the quote turns
 * to the turn it was shared, the button waits for the cooldown, and the
 * journal records what each ally learned. */
test('share maps with an ally from Realm affairs and read the exchange in the journal', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const state = attunementCampaign(), player = state.turnOwnerId, rival = state.factions[1]!.id;
  const host = Object.values(state.settlements).find(town => town.factionId === player)!;
  const envoy = Object.values(state.armies).find(army => army.factionId === rival)!;
  envoy.cell = neighbors(host.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell] ?? 0) && Object.values(state.armies).every(army => army.cell !== cell))!;
  refreshAuthoredSight(state);
  expect(applyCommand(state, { type: 'proposeAlliance', factionId: rival, targetFactionId: player, termTurns: 30 })).toMatchObject({ ok: true });
  expect(applyCommand(state, { type: 'respondAlliance', factionId: player, offerId: state.alliances.offers[0]!.id, accept: true })).toMatchObject({ ok: true });
  const rivalName = state.factions[1]!.name, playerName = state.factions.find(item => item.id === player)!.name;
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type=file]').setInputFiles({ name: 'map-sharing.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  const affairs = await openRealmAffairs(page);
  await expect(affairs.getByTestId(`map-share-${rival}`)).toContainText('Maps have not been shared.');
  await affairs.getByRole('button', { name: `Share maps with ${rivalName}`, exact: true }).click();
  await expect(affairs.getByTestId(`map-share-${rival}`)).toContainText('shared again from turn');
  await expect(affairs.getByRole('button', { name: `Share maps with ${rivalName}`, exact: true })).toBeDisabled();
  await page.screenshot({ path: test.info().outputPath('maps-shared.png') });
  const journal = await openCampaignJournal(page);
  await expect(journal).toContainText(`${playerName} and ${rivalName} share their maps`);
  expect(errors).toEqual([]);
});
