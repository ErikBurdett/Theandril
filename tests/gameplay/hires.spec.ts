import { expect, test } from '@playwright/test';
import { applyCommand, createArmyFormation, createGame, hirePriceOf, serializeGame } from '@theandril/sim';
import { isPassable, neighbors } from '@theandril/mapgen';
import { exportSave } from '@theandril/persistence';
import { refreshAuthoredSight } from '../../packages/test-fixtures/src/authored-land';
import { closeManagement, openCampaignJournal, openRealmAffairs, openRegistry } from './ui-navigation';

/** Rules 68: a company at a city-state's gate is quoted a company for hire;
 * the hire is made from Realm affairs, the coin leaves the treasury, the
 * company appears in the army registry and the journal records the sale. */
test('hire a company from a city-state in Realm affairs and find it in the registry and the journal', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const state = createGame({ seed: 74, size: 'tiny', factionCount: 4, cityStateCount: 1, pace: 'short', generatorVersion: 4 });
  for (const faction of state.factions) faction.treasury = 200;
  const player = state.turnOwnerId, city = state.factions.find(faction => faction.id.startsWith('citystate.'))!.id;
  const caravan = Object.values(state.armies).find(army => army.factionId === city && army.formations.some(item => item.unitId === 'unit.colonist'))!;
  const founded = applyCommand(state, { type: 'found', factionId: city, armyId: caravan.id, name: 'Gate City' });
  if (!founded.ok) throw new Error(founded.error);
  const hearth = Object.values(state.settlements).find(town => town.factionId === city)!;
  const gate = neighbors(hearth.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell] ?? 0) && Object.values(state.armies).every(army => army.cell !== cell))!;
  const id = `army.${state.nextId++}`;
  state.armies[id] = { id, factionId: player, name: 'Buying company', cell: gate, movement: 1, formations: [{ ...createArmyFormation(id, 'unit.heavy_infantry'), id: `formation.${state.nextId++}` }] };
  refreshAuthoredSight(state);
  state.factions.find(faction => faction.id === player)!.treasury = 100;
  const price = hirePriceOf(state, city), cityName = state.factions.find(faction => faction.id === city)!.name;
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type=file]').setInputFiles({ name: 'hire.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  const affairs = await openRealmAffairs(page);
  await expect(affairs.getByTestId(`hire-quote-${city}`)).toContainText(`Buying company stands at the gate: a company of Ash pike for ${price} coin.`);
  await page.screenshot({ path: test.info().outputPath('hire-quote.png') });
  await affairs.getByRole('button', { name: `Hire a company from ${cityName}` }).click();
  await expect(affairs.getByTestId(`hire-quote-${city}`)).toContainText('sells again from turn');
  await expect(page.getByText(new RegExp(`\\b${100 - price}\\b.*coin|coin.*\\b${100 - price}\\b`)).first()).toBeVisible();
  await closeManagement(page);
  const registry = await openRegistry(page, 'armies');
  await expect(registry).toContainText(`Hired pikes of ${cityName}`);
  await page.screenshot({ path: test.info().outputPath('hire-registry.png') });
  await closeManagement(page);
  const journal = await openCampaignJournal(page);
  await expect(journal).toContainText(`${cityName} sells`);
  await expect(journal).toContainText(`for ${price} coin`);
  expect(errors).toEqual([]);
});
