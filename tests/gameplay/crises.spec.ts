import { expect, test } from '@playwright/test';
import { crisisDefinition } from '@theandril/content';
import { createArmyFormation, serializeGame } from '@theandril/sim';
import { hexDistance, isPassable } from '@theandril/mapgen';
import { refreshAuthoredSight } from '../../packages/test-fixtures/src/authored-land';
import { exportSave } from '@theandril/persistence';
import { attunementCampaign } from '../../packages/test-fixtures/src/victory-fixture';
import { openCampaignJournal, openRealmAffairs } from './ui-navigation';

/** Rules 53: the crisis that stands is named in the masthead and quoted in
 * Realm affairs with the realm's own shelter price; sheltering pays the
 * treasury and the journal records it. */
test('read the standing crisis and shelter the hearths from Realm affairs', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const state = attunementCampaign(), player = state.turnOwnerId;
  const hearths = Object.values(state.settlements).filter(town => town.factionId === player).length;
  state.factions.find(item => item.id === player)!.treasury = 100;
  state.crises.active = { id: `crisis.${state.turn}.1`, crisisId: 'crisis.grey_winter', startedTurn: state.turn, endsTurn: state.turn + 10, sheltered: [] };
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type=file]').setInputFiles({ name: 'grey-winter.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await expect(page.getByTestId('masthead-crisis')).toContainText('The Grey Winter');
  const affairs = await openRealmAffairs(page);
  const card = affairs.getByTestId('crisis');
  await expect(card).toContainText('The Grey Winter');
  await expect(card).toContainText('A winter that does not break');
  await expect(card).toContainText('loses 2 food each turn');
  await page.screenshot({ path: test.info().outputPath('crisis-standing.png') });
  await card.getByRole('button', { name: 'Shelter the hearths from The Grey Winter' }).click();
  await expect(card.getByTestId('crisis-sheltered')).toContainText('sheltered');
  const left = 100 - crisisDefinition('crisis.grey_winter')!.shelterCoinPerHearth * hearths;
  await expect(page.getByText(new RegExp(`\\b${left}\\b.*coin|coin.*\\b${left}\\b`)).first()).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('crisis-sheltered.png') });
  const journal = await openCampaignJournal(page);
  await expect(journal).toContainText('The Grey Winter: ');
  await expect(journal).toContainText('shelters its');
  expect(errors).toEqual([]);
});

/** Rules 54: an event of the standing crisis is answered from Realm affairs
 * like any other hearth event. */
test('answer an event of the standing crisis from Realm affairs', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const state = attunementCampaign(), player = state.turnOwnerId;
  const host = Object.values(state.settlements).find(town => town.factionId === player)!;
  state.factions.find(item => item.id === player)!.treasury = 100;
  state.crises.active = { id: `crisis.${state.turn}.1`, crisisId: 'crisis.grey_winter', startedTurn: state.turn, endsTurn: state.turn + 5, sheltered: [player] };
  state.hearthEvents.pending = [{ id: `event.${state.turn}.1`, factionId: player, settlementId: host.id, templateId: 'event.last_of_the_grain', turn: state.turn, expiresTurn: state.turn + 5 }];
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type=file]').setInputFiles({ name: 'seed-grain.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  const affairs = await openRealmAffairs(page);
  await expect(affairs.getByTestId('crisis').getByTestId('crisis-sheltered')).toContainText('sheltered');
  const panel = affairs.getByTestId('hearth-events');
  await expect(panel).toContainText('The last of the grain');
  await expect(panel).toContainText(`The stores of ${host.name} are down to the seed grain`);
  await panel.getByRole('button', { name: `Buy grain on the roads: The last of the grain at ${host.name}` }).click();
  await expect(panel).toHaveCount(0);
  await expect(page.getByText(/\b85\b.*coin|coin.*\b85\b/).first()).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('crisis-event-answered.png') });
  const journal = await openCampaignJournal(page);
  await expect(journal).toContainText('The last of the grain at');
  await expect(journal).toContainText('buy grain on the roads');
  expect(errors).toEqual([]);
});

/** Rules 55: when a crisis passes, a hearth that bore the whole toll loses a
 * household to the nearest sheltered hearth within range; the card says so
 * while the crisis stands and the journal records the crossing. */
test('read the migration a crisis leaves behind', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const state = attunementCampaign(), player = state.turnOwnerId, rival = state.factions.find(item => item.id !== player)!.id;
  const haven = Object.values(state.settlements).find(town => town.factionId === player)!;
  const cell = state.world.terrain.findIndex((terrain, index) => isPassable(terrain) && state.world.waterDepth[index] === 0 && hexDistance(index, haven.cell, state.world.width) === 5
    && Object.values(state.settlements).every(town => hexDistance(town.cell, index, state.world.width) > 3));
  const id = 'army.rival_caravan';
  state.armies[id] = { id, factionId: rival, name: 'Reed caravan', cell, movement: 3, formations: [createArmyFormation(id, 'unit.colonist')] };
  state.factions.find(item => item.id === rival)!.treasury = 500;
  refreshAuthoredSight(state);
  const founded = (await import('@theandril/sim')).applyCommand(state, { type: 'found', factionId: rival, armyId: id, name: 'Reed Reach' });
  expect(founded.ok).toBe(true);
  for (const town of Object.values(state.settlements)) town.population = 3;
  state.crises.active = { id: `crisis.${state.turn}.1`, crisisId: 'crisis.grey_winter', startedTurn: state.turn, endsTurn: state.turn + 1, sheltered: [player] };
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type=file]').setInputFiles({ name: 'migration.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  const affairs = await openRealmAffairs(page);
  await expect(affairs.getByTestId('crisis-migration')).toContainText('1 realm has sheltered');
  await page.screenshot({ path: test.info().outputPath('crisis-migration-card.png') });
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${state.turn + 1}`);
  const journal = await openCampaignJournal(page);
  await expect(journal).toContainText('The Grey Winter passes');
  await expect(journal).toContainText(`A household comes to ${haven.name} from Reed Reach`);
  await page.screenshot({ path: test.info().outputPath('crisis-migration-journal.png') });
  expect(errors).toEqual([]);
});
