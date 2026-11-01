import { expect, test } from '@playwright/test';
import { applyCommand, createArmyFormation, createGame, serializeGame, tributeOf } from '@theandril/sim';
import { isPassable, neighbors } from '@theandril/mapgen';
import { exportSave } from '@theandril/persistence';
import { refreshAuthoredSight } from '../../packages/test-fixtures/src/authored-land';
import { openCampaignJournal, openRealmAffairs } from './ui-navigation';

/** Rules 61: a company at a city-state's gate is quoted the tribute it may
 * press for; the demand is made from Realm affairs and the city pays or
 * refuses, the journal recording it. */
test('press a city-state for tribute from Realm affairs and read the payment in the treasury and the journal', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const state = createGame({ seed: 74, size: 'tiny', factionCount: 4, cityStateCount: 1, pace: 'short', generatorVersion: 4 });
  for (const faction of state.factions) faction.treasury = 200;
  const player = state.turnOwnerId, city = state.factions.find(faction => faction.id.startsWith('citystate.'))!.id;
  // Every seat founds its hearth from its caravan on turn 1; the city-state's goes up first here.
  const caravan = Object.values(state.armies).find(army => army.factionId === city && army.formations.some(item => item.unitId === 'unit.colonist'))!;
  const founded = applyCommand(state, { type: 'found', factionId: city, armyId: caravan.id, name: 'Gate City' });
  if (!founded.ok) throw new Error(founded.error);
  const hearth = Object.values(state.settlements).find(town => town.factionId === city)!;
  const gate = neighbors(hearth.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell] ?? 0) && Object.values(state.armies).every(army => army.cell !== cell))!;
  const id = `army.${state.nextId++}`;
  state.armies[id] = { id, factionId: player, name: 'Pressing company', cell: gate, movement: 1, formations: [0, 1, 2].map(() => ({ ...createArmyFormation(id, 'unit.heavy_infantry'), id: `formation.${state.nextId++}` })) };
  refreshAuthoredSight(state);
  state.factions.find(faction => faction.id === player)!.treasury = 100;
  const expected = tributeOf(state, city), cityName = state.factions.find(faction => faction.id === city)!.name;
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type=file]').setInputFiles({ name: 'tribute.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  const affairs = await openRealmAffairs(page);
  await expect(affairs.getByTestId(`tribute-quote-${city}`)).toContainText(`Pressing company stands at the gate: ${expected} coin if the walls yield.`);
  await page.screenshot({ path: test.info().outputPath('tribute-quote.png') });
  await affairs.getByRole('button', { name: `Demand tribute of ${cityName}` }).click();
  await expect(affairs.getByTestId(`tribute-quote-${city}`)).toContainText('not pressed again');
  await expect(page.getByText(new RegExp(`\\b${100 + expected}\\b.*coin|coin.*\\b${100 + expected}\\b`)).first()).toBeVisible();
  const journal = await openCampaignJournal(page);
  await expect(journal).toContainText(`${cityName} pays ${expected} coin`);
  await page.screenshot({ path: test.info().outputPath('tribute-paid.png') });
  expect(errors).toEqual([]);
});
