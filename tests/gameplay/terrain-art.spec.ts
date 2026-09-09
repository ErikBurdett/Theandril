import { expect, test, type Page } from '@playwright/test';
import { selectFromRegistry } from './ui-navigation';
import { BIOME_NAMES, neighbors } from '@theandril/mapgen';
import { IMPROVEMENTS } from '@theandril/content';
import { applyCommand, createArmyFormation, createGame, deserializeGame, serializeGame, type GameState } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { refreshAuthoredSight } from '../../packages/test-fixtures/src/authored-land';

const ORIGIN = 500;
const SAMPLES = [-98, -97, -96, -95, -94, -50, -49, -48, -47, -46, -2, -1].map(offset => ORIGIN + offset);
function climateGallery(): GameState {
  const state = createGame({ generatorVersion: 4, seed: 20260905, size: 'tiny', factionCount: 2 });
  state.world.terrain.fill(1); state.world.biome.fill(1); state.world.fertility.fill(60); state.world.waterDepth.fill(0);
  state.resources.deposits = {}; // This gallery replaces the entire generated terrain/resource layer.
  delete state.armies['army.1']; delete state.armies['army.3']; delete state.armies['army.4'];
  state.armies['army.2']!.cell = ORIGIN;
  state.armies['army.2']!.name = 'Climate survey';
  SAMPLES.forEach((cell, biome) => {
    state.world.biome[cell] = biome;
    state.world.terrain[cell] = biome === 0 ? 0 : biome === 9 ? 4 : [5, 6].includes(biome) ? 3 : [2, 3, 8].includes(biome) ? 2 : 1;
    state.world.waterDepth[cell] = biome === 0 ? 1 : 0;
  });
  ['unit.spearman', 'unit.heavy_infantry', 'unit.cavalry'].forEach((unitId, index) => {
    const id = `army.${state.nextId++}`;
    state.armies[id] = { id, name: ['Pike survey escort', 'Plate survey escort', 'Mounted survey escort'][index]!, factionId: state.turnOwnerId, cell: ORIGIN + index + 1, movement: 0, formations: [createArmyFormation(id, unitId)] };
  });
  for (const faction of state.factions) state.explored[faction.id] = new Set(Array.from({ length: state.world.width * state.world.height }, (_, cell) => cell));
  return deserializeGame(serializeGame(state));
}
async function loadGallery(page: Page): Promise<void> {
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'observed-climate-gallery.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(climateGallery()))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await selectFromRegistry(page, 'armies', 'Climate survey');
  await expect(page.getByTestId('map-container').locator('canvas')).toBeVisible();
}
async function inspectCell(page: Page, cell: number): Promise<void> {
  await page.keyboard.press('Escape');
  await page.getByTestId('map-container').scrollIntoViewIfNeeded();
  const point = await page.evaluate(cell => window.__THEANDRIL__?.getCellScreenPoint(cell), cell);
  if (!point?.inViewport) throw new Error('The climate sample is outside the actual map viewport');
  await page.mouse.click(point.x, point.y);
}

test('all twelve approved biome tiles remain distinct beneath compact hills relief and actual troop sprites', async ({ page }, testInfo) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await loadGallery(page);
  await expect(page.getByTestId('art-runtime-status')).toContainText('approved pixel pack');
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics()?.visibleAssetIds ?? [])).toEqual(expect.arrayContaining(['unit.spearman.ashen_compact', 'unit.heavy_infantry.ashen_compact', 'unit.cavalry.ashen_compact']));
  const hash = await page.evaluate(() => window.__THEANDRIL__?.getStateHash());
  const tiles = await page.evaluate(cells => cells.map(cell => window.__THEANDRIL__?.getTerrainArt(cell)), SAMPLES);
  tiles.forEach((tile, biome) => expect(tile).toMatchObject({ cell: SAMPLES[biome], biome, approved: true }));
  expect(new Set(tiles.map(tile => tile?.assetId)).size).toBe(12);
  expect(tiles[5]).toMatchObject({ terrain: 3, relief: 'hill-ridges', baseId: 'terrain.desert' });
  expect(tiles[6]).toMatchObject({ terrain: 3, relief: 'hill-ridges', baseId: 'terrain.steppe' });
  expect(tiles[9]).toMatchObject({ terrain: 4, relief: 'pixel-mountains', baseId: 'terrain.alpine' });
  expect(tiles[10]).toMatchObject({ terrain: 1, baseId: 'terrain.ash_scrub' });
  expect(tiles[11]).toMatchObject({ terrain: 1, baseId: 'terrain.chalkland' });
  await inspectCell(page, SAMPLES[5]!);
  await expect(page.locator('.hex-inspector')).toContainText('Desert · Hills');
  await page.getByRole('button', { name: 'Close map actions', exact: true }).click();
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics()?.lod)).toBe('near-sprites');
  expect(await page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics()?.visibleAnimationFrames)).toEqual([{ contentId: 'unit.scout.ashen_compact', frameId: expect.stringMatching(/^unit\.scout\.ashen_compact\/idle\/se\/[0-3]$/) }]);
  await page.screenshot({ path: testInfo.outputPath('biome-hills-and-alpine.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Focus selection', exact: true }).click();
  await page.getByTestId('map-container').scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('biome-hills-narrow.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.evaluate(() => window.__THEANDRIL__?.getStateHash())).toBe(hash);
  await testInfo.attach('terrain-art-review.json', { body: JSON.stringify({ annotations: ['Native approved raster art is unchanged.', 'Physical desert/steppe hills retain a small lower-edge double ridge, revealing the biome pixels previously hidden by an opaque triangle.', 'Canonical alpine mountains use their approved raster relief without a second triangle.', 'The three new role sprites belong to real observed armies; no future-only objects were spawned.', 'Inspection, zoom and narrow resizing preserve canonical state.'], samples: tiles.map((tile, biome) => ({ ...tile, name: BIOME_NAMES[biome] })), metrics: await page.evaluate(() => window.__THEANDRIL__?.getPerformanceCounters()) }, null, 2), contentType: 'application/json' });
  expect(errors).toEqual([]);
});

test('missing approved terrain art keeps explicit physical hill and mountain fallbacks without pretending tiles loaded', async ({ page }) => {
  await page.route('**/art/catalog.json', route => route.fulfill({ status: 503, body: 'Unavailable approved catalog' }));
  await loadGallery(page);
  await expect(page.getByTestId('art-runtime-status')).toContainText('procedural fallback');
  const tiles = await page.evaluate(cells => cells.map(cell => window.__THEANDRIL__?.getTerrainArt(cell)), SAMPLES);
  expect(tiles[5]).toMatchObject({ biome: 5, terrain: 3, approved: false, assetId: null, relief: 'procedural-peak' });
  expect(tiles[9]).toMatchObject({ biome: 9, terrain: 4, approved: false, assetId: null, relief: 'procedural-peak' });
  await inspectCell(page, SAMPLES[5]!);
  await expect(page.locator('.hex-inspector')).toContainText('Desert · Hills');
  await page.getByRole('button', { name: 'Close map actions', exact: true }).click();
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
});

function improvedLandGallery() {
  const state = createGame({ generatorVersion: 4, seed: 17, size: 'tiny', factionCount: 2 }), origin = state.armies['army.1']!.cell;
  const cells = neighbors(origin, state.world.width, state.world.height).slice(0, 5);
  const biomes = [1, 2, 11, 7, 0], terrain = [1, 2, 3, 1, 0];
  // Authored terrain isolates all five legal sites. Each improvement below is
  // paid for and completed through public commands, never painted into a save.
  cells.forEach((cell, index) => { state.world.terrain[cell] = terrain[index]!; state.world.biome[cell] = biomes[index]!; state.world.waterDepth[cell] = index === 4 ? 1 : 0; delete state.resources.deposits[cell]; });
  state.armies['army.2']!.cell = origin;
  refreshAuthoredSight(state);
  expect(applyCommand(state, { type: 'found', factionId: state.turnOwnerId, armyId: 'army.1', name: 'Five works' }).ok).toBe(true);
  const town = Object.values(state.settlements)[0]!;
  town.population = 6; state.factions[0]!.treasury = 5000;
  expect(applyCommand(state, { type: 'setWorkedTiles', factionId: state.turnOwnerId, settlementId: town.id, cells }).ok).toBe(true);
  // This gallery owns the five approved original props. Research-gated sites
  // have separate real-command and procedural-only coverage in city-growth.
  IMPROVEMENTS.slice(0, 5).forEach((definition, index) => {
    expect(applyCommand(state, { type: 'improveTile', factionId: state.turnOwnerId, settlementId: town.id, cell: cells[index]!, improvementId: definition.id }).ok).toBe(true);
    for (let turn = 0; turn < definition.turns; turn++) expect(applyCommand(state, { type: 'endTurn', factionId: state.turnOwnerId }).ok).toBe(true);
  });
  return { state: deserializeGame(serializeGame(state)), cells };
}

for (const fallback of [false, true]) test(`all five completed land works retain ${fallback ? 'distinct explicit fallback glyphs' : 'approved prop artwork'} and borders`, async ({ page }, testInfo) => {
  const { state, cells } = improvedLandGallery();
  if (fallback) await page.route('**/art/catalog.json', route => route.fulfill({ status: 503, body: 'Diagnostic missing approved art' }));
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'five-paid-works.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await expect(page.getByTestId('art-runtime-status')).toContainText(fallback ? 'procedural fallback' : 'approved pixel pack');
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().improvementProps)).toBe(5);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().territoryEdges)).toBeGreaterThan(0);
  const hash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  const tiles = await page.evaluate(cells => cells.map(cell => window.__THEANDRIL__!.getTerrainArt(cell)), cells);
  tiles.forEach((tile, index) => expect(tile).toMatchObject({ improvementId: IMPROVEMENTS[index]!.id, improvementPresentation: fallback ? 'procedural' : 'approved', factionId: state.turnOwnerId }));
  await page.getByTestId('map-container').scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath(fallback ? 'five-works-fallback.png' : 'five-works-approved.png') });
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Focus selection', exact: true }).click();
  await page.getByTestId('map-container').scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath(fallback ? 'five-works-fallback-narrow.png' : 'five-works-approved-narrow.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);
});
