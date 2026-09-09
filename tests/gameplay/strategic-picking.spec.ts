import { expect, test, type Page } from '@playwright/test';
import { applyCommand, createArmyFormation, createGame, deserializeGame, getObservation, serializeGame, stateHash } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { refreshAuthoredSight } from '../../packages/test-fixtures/src/authored-land';
import { closeManagement, selectFromRegistry } from './ui-navigation';

function markerScene() {
  const game = createGame({ generatorVersion: 4, seed: 17, size: 'tiny', factionCount: 2, pace: 'short' });
  const center = 14 * game.world.width + 16, factionId = game.turnOwnerId;
  game.world.terrain.fill(1); game.world.biome.fill(1); game.world.waterDepth.fill(0); game.world.fertility.fill(60);
  game.resources.deposits = {}; // This gallery replaces the entire generated terrain/resource layer.
  game.armies['army.1']!.cell = center; game.armies['army.2']!.cell = center;
  game.armies['army.3']!.cell = 1400; game.armies['army.4']!.cell = center + 3;
  const travelerId = `army.${game.nextId++}`;
  game.armies[travelerId] = { id: travelerId, name: 'Waiting road guard', factionId, cell: center - 3, movement: 3, formations: [createArmyFormation(travelerId, 'unit.guard')] };
  refreshAuthoredSight(game);
  const found = applyCommand(game, { type: 'found', factionId, armyId: 'army.1', name: 'Badge Hearth' });
  if (!found.ok) throw new Error(found.error);
  const town = Object.values(game.settlements)[0]!; town.population = 8;
  refreshAuthoredSight(game);
  const state = deserializeGame(serializeGame(game)), view = getObservation(state, factionId);
  expect(view.armies.some(army => army.id === 'army.4')).toBe(true);
  expect(view.armies.some(army => army.id === 'army.3')).toBe(false);
  return { state, center, townId: town.id, travelerId };
}

const summary = (page: Page) => page.evaluate(() => window.__THEANDRIL__!.getSummary()!);
const selection = (page: Page) => page.evaluate(() => window.__THEANDRIL__!.getSelection());
const hash = (page: Page) => page.evaluate(() => window.__THEANDRIL__!.getStateHash());

async function load(page: Page) {
  const fixture = markerScene();
  await page.goto('/');
  await page.getByLabel('Import save file').setInputFiles({ name: 'strategic-marker-picking.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(fixture.state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()?.state)).toBe('ready');
  await selectFromRegistry(page, 'armies', 'Waiting road guard');
  for (let step = 0; step < 8 && await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().zoom!) >= .65; step++) await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()?.lod)).toBe('strategic-glyphs');
  return fixture;
}

test('clicking a displaced garrison badge and foreign banner inspects the rendered entity without moving the selected army', async ({ page }, info) => {
  const fixture = await load(page), before = stateHash(fixture.state);
  const townPoint = await page.evaluate(cell => window.__THEANDRIL__!.getCellScreenPoint(cell), fixture.center);
  expect(townPoint?.inViewport).toBe(true);
  // The badge is deliberately shifted 26 SCREEN pixels diagonally, crossing
  // its shrinking hex. Clicking the canonical cell center would miss this bug.
  await page.mouse.click(townPoint!.x + 26, townPoint!.y + 26);
  await expect.poll(() => selection(page)).toEqual({ armyId: 'army.2', cell: fixture.center });
  await expect(page.getByTestId('map-actions')).toContainText('Wayfinder');
  expect(await hash(page)).toBe(before);
  await page.keyboard.press('Escape');
  await page.mouse.click(townPoint!.x, townPoint!.y);
  await expect.poll(() => selection(page)).toEqual({ settlementId: fixture.townId, cell: fixture.center });
  expect(await hash(page)).toBe(before);
  await page.keyboard.press('Escape');
  await selectFromRegistry(page, 'armies', 'Waiting road guard');
  for (let step = 0; step < 8 && await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().zoom!) >= .65; step++) await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
  const enemy = (await summary(page)).armies.find(army => army.id === 'army.4')!;
  const enemyPoint = await page.evaluate(cell => window.__THEANDRIL__!.getCellScreenPoint(cell), enemy.cell);
  expect(enemyPoint?.inViewport).toBe(true);
  await page.mouse.click(enemyPoint!.x, enemyPoint!.y);
  await expect.poll(() => selection(page)).toEqual({ cell: enemy.cell });
  await expect(page.getByTestId('map-actions')).toBeVisible();
  expect(await hash(page)).toBe(before);
  expect((await summary(page)).ownArmies.find(army => army.id === fixture.travelerId)?.cell).toBe(fixture.center - 3);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.visibleEntityArt.some(item => item.entityId === 'army.3'))).toBe(false);
  await page.keyboard.press('Escape');
  await page.getByTestId('map-container').screenshot({ path: info.outputPath('strategic-badges-inspected-without-orders.png') });
});

test('shift-clicking the displaced badge deliberately follows a route to its actual hearth cell', async ({ page }) => {
  const fixture = await load(page);
  await closeManagement(page);
  const townPoint = await page.evaluate(cell => window.__THEANDRIL__!.getCellScreenPoint(cell), fixture.center);
  expect(townPoint?.inViewport).toBe(true);
  await page.keyboard.down('Shift');
  await page.mouse.click(townPoint!.x + 26, townPoint!.y + 26);
  await page.keyboard.up('Shift');
  // Canonical queued travel spends available movement immediately. This
  // three-step route finishes in the same command and removes its queue.
  await expect.poll(async () => (await summary(page)).ownArmies.find(army => army.id === fixture.travelerId)?.cell).toBe(fixture.center);
  expect((await selection(page)).armyId).toBe(fixture.travelerId);
  expect((await summary(page)).ownArmies.find(army => army.id === fixture.travelerId)?.movement).toBe(0);
  expect((await summary(page)).routes.find(route => route.armyId === fixture.travelerId)).toBeUndefined();
});
