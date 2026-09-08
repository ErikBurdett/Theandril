import { expect, test, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { parseRuntimeCatalog } from '@theandril/art-pipeline/runtime';
import { createArmyFormation, createGame, deserializeGame, serializeGame, stateHash } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { refreshAuthoredSight } from '../../packages/test-fixtures/src/authored-land';
import { BIOME_ART_IDS, BIOME_ART_VARIANTS, TERRAIN_ART_IDS, terrainVariantIndex } from '../../packages/render/src/terrain-variants';
import { closeCampaignOptions, selectFromRegistry } from './ui-navigation';

const SEED = 20260905, WIDTH = 48;
const SAMPLES = BIOME_ART_IDS.flatMap((_, biome) => Array.from({ length: 16 }, (_, column) => ({ cell: (8 + biome) * WIDTH + 10 + column, biome })));

/** Authored presentation gallery, not generated geography. Every canonical
 * change happens before strict save/import; the browser never mutates a world. */
function biomeGallery() {
  const game = createGame({ generatorVersion: 4, seed: SEED, size: 'tiny', factionCount: 2 });
  game.world.terrain.fill(1); game.world.biome.fill(1); game.world.waterDepth.fill(0); game.world.fertility.fill(60);
  for (const { cell, biome } of SAMPLES) {
    game.world.biome[cell] = biome;
    game.world.terrain[cell] = biome === 0 ? 0 : biome === 9 ? 4 : [2, 3, 8].includes(biome) ? 2 : 1;
    game.world.waterDepth[cell] = biome === 0 ? 1 : 0;
  }
  // A bounded real scout roster provides sight over the native-art gallery.
  for (const army of Object.values(game.armies)) if (army.factionId === game.turnOwnerId) delete game.armies[army.id];
  for (const row of [10, 14, 18]) for (const column of [12, 18, 24]) {
    const id = `army.${game.nextId++}`;
    game.armies[id] = { id, name: row === 14 && column === 18 ? 'Biome survey center' : `Biome survey ${row}-${column}`, factionId: game.turnOwnerId, cell: row * WIDTH + column, movement: 5, formations: [createArmyFormation(id, 'unit.scout')] };
  }
  game.explored[game.turnOwnerId] = new Set(Array.from({ length: WIDTH * 32 }, (_, cell) => cell));
  refreshAuthoredSight(game);
  for (let biome = 0; biome < 12; biome++) expect(new Set(SAMPLES.filter(sample => sample.biome === biome).map(sample => terrainVariantIndex(SEED, sample.cell, biome))).size).toBe(3);
  return deserializeGame(serializeGame(game));
}

async function importGallery(page: Page) {
  const game = biomeGallery();
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'biome-variation-gallery.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(game))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics()?.state)).toBe('ready');
  await selectFromRegistry(page, 'armies', 'Biome survey center');
  return game;
}
async function selections(page: Page) {
  return page.evaluate(samples => samples.map(({ cell }) => {
    const tile = window.__THEANDRIL__!.getTerrainArt(cell)!;
    return { cell, biome: tile.biome, assetId: tile.assetId, baseId: tile.baseId, variantIndex: tile.variantIndex, renderedVariantIndex: tile.renderedVariantIndex, approved: tile.approved, fallback: tile.fallback };
  }), SAMPLES);
}
async function settings(page: Page) {
  const menu = page.getByTestId('campaign-menu');
  if (await menu.getAttribute('open') === null) await menu.locator('summary').click();
}

test('all twelve biomes use three approved originals with stable cell choices across camera, turns and saved restoration', async ({ page }, testInfo) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  const game = await importGallery(page), hash = stateHash(game);
  const catalog = parseRuntimeCatalog(await (await page.request.get('/art/catalog.json')).json());
  for (const id of TERRAIN_ART_IDS) {
    const asset = catalog.assets.find(asset => asset.id === id);
    expect(asset, `Approved original ${id}`).toMatchObject({ id, contentIds: [id], nativeResolution: { width: 64, height: 64 }, pivot: [32, 32] });
    expect(asset!.frames).toHaveLength(1);
  }
  const before = await selections(page);
  for (const sample of before) {
    const slot = terrainVariantIndex(SEED, sample.cell, sample.biome);
    expect(sample).toMatchObject({ baseId: BIOME_ART_IDS[sample.biome], assetId: BIOME_ART_VARIANTS[sample.biome]![slot], variantIndex: slot, renderedVariantIndex: slot, approved: true, fallback: false });
  }
  expect(new Set(before.map(sample => sample.assetId)).size).toBe(36);
  const frame = await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().frameCount ?? 0);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().frameCount)).toBeGreaterThan(frame + 30);
  await page.getByTestId('map-container').screenshot({ path: testInfo.outputPath('twelve-biome-variation-bands.png') });
  const canvas = await page.getByTestId('map-container').locator('canvas').boundingBox(); if (!canvas) throw new Error('Map canvas unavailable');
  await page.mouse.move(canvas.x + canvas.width * .65, canvas.y + canvas.height * .5); await page.mouse.down();
  await page.mouse.move(canvas.x + canvas.width * .35, canvas.y + canvas.height * .4, { steps: 10 }); await page.mouse.up();
  for (let step = 0; step < 4; step++) await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
  expect(await selections(page)).toEqual(before);
  await page.getByRole('button', { name: 'World overview', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().overview)).toBe(true);
  expect(await selections(page)).toEqual(before);
  await page.getByRole('button', { name: 'Focus selection', exact: true }).click();
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);
  await settings(page); await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  await closeCampaignOptions(page);
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 2');
  expect(await selections(page)).toEqual(before);
  await settings(page);
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored');
  expect(await selections(page)).toEqual(before);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);
  await page.setViewportSize({ width: 390, height: 844 });
  await selectFromRegistry(page, 'armies', 'Biome survey center');
  await page.getByTestId('map-container').screenshot({ path: testInfo.outputPath('biome-variation-narrow.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await selections(page)).toEqual(before);
  const metrics = await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters());
  expect(metrics.visibleCells).toBeGreaterThan(0);
  expect(metrics.terrainSpriteCells).toBeGreaterThan(0);
  expect(metrics.terrainSpriteCells).toBeLessThanOrEqual(metrics.visibleCells!);
  expect(metrics.cachedChunks).toBeLessThanOrEqual(64);
  expect(metrics.residentAtlasBytesEstimate).toBeLessThanOrEqual(16 * 1024 * 1024);
  const artifact = testInfo.outputPath('biome-variation-review.json');
  await writeFile(artifact, JSON.stringify({ workload: 'Authored twelve-biome bands, 192 actual cells, nine real scout formations; strict save/import. This is an art gallery, not generated geography or a performance benchmark.', seed: SEED, hash, selections: before, metrics }, null, 2));
  await testInfo.attach('biome-variation-review.json', { path: artifact, contentType: 'application/json' });
  expect(errors).toEqual([]);
});

test('a missing chosen variant uses its unchanged approved base and reports the exact missing identity', async ({ page }) => {
  // Serve a consistent, reduced approved manifest/page metadata. The original
  // atlas PNG/hash is untouched; unavailable frames are simply not declared.
  const catalog = parseRuntimeCatalog(await (await page.request.get('/art/catalog.json')).json());
  const absentId = 'terrain.grassland.variant_1', absent = catalog.assets.find(asset => asset.id === absentId);
  expect(absent).toBeTruthy();
  const atlas = catalog.atlases.find(atlas => atlas.id === absent!.atlasId)!;
  const metadata = await (await page.request.get(atlas.jsonUrl)).json();
  for (const frame of absent!.frames) delete metadata.frames[frame.id];
  for (const clip of absent!.clips) delete metadata.animations[clip.id];
  await page.route('**/art/catalog.json', route => route.fulfill({ json: { ...catalog, assets: catalog.assets.filter(asset => asset.id !== absentId) } }));
  await page.route(`**${atlas.jsonUrl}`, route => route.fulfill({ json: metadata }));
  await importGallery(page);
  const tiles = await selections(page);
  const missing = tiles.filter(tile => tile.biome === 1 && tile.variantIndex === 1);
  expect(missing.length).toBeGreaterThan(0);
  missing.forEach(tile => expect(tile).toMatchObject({ assetId: 'terrain.grassland', renderedVariantIndex: 0, approved: true, fallback: true }));
  tiles.filter(tile => tile.biome !== 1 || tile.variantIndex !== 1).forEach(tile => expect(tile).toMatchObject({ fallback: false, renderedVariantIndex: tile.variantIndex }));
  expect((await page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.warnings)).join(' ')).toContain(absentId);
});

test('generated watched terrain retains variants, fog privacy and exact river joins through spectator reveal and restore', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'World seed', exact: true }).fill('74');
  await page.getByRole('combobox', { name: 'World size', exact: true }).selectOption('tiny');
  await page.getByRole('combobox', { name: 'Campaign mode', exact: true }).selectOption('watch');
  await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 1');
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics()?.state)).toBe('ready');
  const hash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  const normal = await page.evaluate(() => Array.from({ length: 1536 }, (_, cell) => window.__THEANDRIL__!.getTerrainArt(cell) ?? null));
  const unknown = normal.findIndex(tile => tile === null); expect(unknown).toBeGreaterThanOrEqual(0);
  await page.evaluate(() => window.theandril!.setWatchFog(false));
  const revealed = await page.evaluate(() => Array.from({ length: 1536 }, (_, cell) => window.__THEANDRIL__!.getTerrainArt(cell)!));
  expect(revealed.every(tile => tile.approved && !tile.fallback)).toBe(true);
  expect(new Set(revealed.map(tile => tile.variantIndex))).toEqual(new Set([0, 1, 2]));
  for (const tile of normal) if (tile) expect(revealed[tile.cell]).toMatchObject({ assetId: tile.assetId, baseId: tile.baseId, variantIndex: tile.variantIndex });
  expect(revealed.some(tile => tile.connections.rivers.length > 0)).toBe(true);
  for (const tile of revealed) for (const edge of tile.connections.rivers) expect(revealed[edge.neighbor]!.connections.rivers.some(reverse => reverse.neighbor === tile.cell)).toBe(true);
  await page.evaluate(() => window.theandril!.setWatchFog(true));
  expect(await page.evaluate(cell => window.__THEANDRIL__!.getTerrainArt(cell), unknown)).toBeUndefined();
  const restored = await page.evaluate(() => Array.from({ length: 1536 }, (_, cell) => window.__THEANDRIL__!.getTerrainArt(cell) ?? null));
  expect(restored).toEqual(normal);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);
});
