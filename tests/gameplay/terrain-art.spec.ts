import { expect, test, type Page } from '@playwright/test';
import { BIOME_NAMES } from '@theandril/mapgen';
import { createArmyFormation, createGame, deserializeGame, serializeGame, type GameState } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';

const ORIGIN = 500;
const SAMPLES = [-98, -97, -96, -95, -94, -50, -49, -48, -47, -46].map(offset => ORIGIN + offset);
function climateGallery(): GameState {
  const state = createGame({ seed: 20260905, size: 'tiny', factionCount: 2 });
  state.world.terrain.fill(1); state.world.biome.fill(1); state.world.fertility.fill(60);
  delete state.armies['army.1']; delete state.armies['army.3']; delete state.armies['army.4'];
  state.armies['army.2']!.cell = ORIGIN;
  state.armies['army.2']!.name = 'Climate survey';
  SAMPLES.forEach((cell, biome) => {
    state.world.biome[cell] = biome;
    state.world.terrain[cell] = biome === 0 ? 0 : biome === 9 ? 4 : [5, 6].includes(biome) ? 3 : [2, 3, 8].includes(biome) ? 2 : 1;
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
  await page.getByTestId('army-registry').getByRole('button', { name: /Climate survey/ }).click();
  await expect(page.getByTestId('map-container').locator('canvas')).toBeVisible();
}
async function inspectCell(page: Page, cell: number): Promise<void> {
  await page.keyboard.press('Escape');
  await page.getByTestId('map-container').scrollIntoViewIfNeeded();
  const point = await page.evaluate(cell => window.__THEANDRIL__?.getCellScreenPoint(cell), cell);
  if (!point?.inViewport) throw new Error('The climate sample is outside the actual map viewport');
  await page.mouse.click(point.x, point.y);
}

test('all ten approved biome tiles remain distinct beneath compact hills relief and actual new troop sprites', async ({ page }, testInfo) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await loadGallery(page);
  await expect(page.getByTestId('art-runtime-status')).toContainText('approved pixel pack');
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics()?.visibleAssetIds ?? [])).toEqual(expect.arrayContaining(['unit.spearman.ashen_compact', 'unit.heavy_infantry.ashen_compact', 'unit.cavalry.ashen_compact']));
  const hash = await page.evaluate(() => window.__THEANDRIL__?.getStateHash());
  const tiles = await page.evaluate(cells => cells.map(cell => window.__THEANDRIL__?.getTerrainArt(cell)), SAMPLES);
  tiles.forEach((tile, biome) => expect(tile).toMatchObject({ cell: SAMPLES[biome], biome, approved: true }));
  expect(new Set(tiles.map(tile => tile?.assetId)).size).toBe(10);
  expect(tiles[5]).toMatchObject({ terrain: 3, relief: 'hill-ridges', assetId: 'terrain.desert' });
  expect(tiles[6]).toMatchObject({ terrain: 3, relief: 'hill-ridges', assetId: 'terrain.steppe' });
  expect(tiles[9]).toMatchObject({ terrain: 4, relief: 'pixel-mountains', assetId: 'terrain.alpine' });
  await inspectCell(page, SAMPLES[5]!);
  await expect(page.locator('.hex-inspector')).toContainText('Desert · Hills');
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics()?.lod)).toBe('near-sprites');
  expect(await page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics()?.visibleAnimationFrames)).toEqual([]);
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
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
});
