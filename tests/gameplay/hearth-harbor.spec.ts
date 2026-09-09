import { expect, test, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { BUILDINGS } from '@theandril/content';
import { cropImage, decodePng, parseRuntimeCatalog, sha256 } from '@theandril/art-pipeline';
import { neighbors } from '@theandril/mapgen';
import { applyCommand, createGame, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand, type GameState } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { cellsWithin } from '../../packages/sim/src/visibility';
import { refreshAuthoredSight } from '../../packages/test-fixtures/src/authored-land';
import { TILE_ART_INSET, TILE_RADIUS, tileFootprintContained, type TileArtworkFit } from '../../packages/render/src/tile-footprint';
import { closeCampaignOptions, closeManagement, selectFromRegistry } from './ui-navigation';

function issue(state: GameState, command: GameCommand) {
  const result = applyCommand(state, command);
  if (!result.ok) throw new Error(`Harbor fixture ${command.type}: ${result.error}`);
}

/** Coast, resources and population are authored. The harbor is researched,
 * paid and completed by canonical commands; no building is granted directly. */
function harborScene() {
  const state = createGame({ generatorVersion: 4, seed: 17, size: 'tiny', factionCount: 1, pace: 'short' });
  const factionId = state.turnOwnerId, center = 14 * state.world.width + 16;
  state.armies['army.1']!.cell = center; state.armies['army.2']!.cell = center - 2;
  const coast = cellsWithin(state, center, 4);
  for (const cell of coast) {
    const water = cell % state.world.width > 16;
    state.world.terrain[cell] = water ? 0 : 1; state.world.biome[cell] = water ? 0 : 1;
    state.world.waterDepth[cell] = water ? 1 : 0; state.world.fertility[cell] = water ? 0 : 80;
    delete state.resources.deposits[cell];
  }
  refreshAuthoredSight(state);
  issue(state, { type: 'found', factionId, armyId: 'army.1', name: 'Sounding Quay' });
  const town = Object.values(state.settlements)[0]!;
  town.population = 8; town.food = 100;
  state.factions[0]!.treasury = 2000; state.factions[0]!.knowledge = 2000;
  const beforeResearch = state.factions[0]!.knowledge;
  issue(state, { type: 'research', factionId, technologyId: 'technology.coastal_navigation' });
  const paidKnowledge = beforeResearch - state.factions[0]!.knowledge;
  expect(paidKnowledge).toBeGreaterThan(0);
  const beforeQueue = state.factions[0]!.treasury;
  issue(state, { type: 'queue', factionId, settlementId: town.id, itemId: 'building.harbor' });
  const paidCoin = beforeQueue - state.factions[0]!.treasury;
  expect(paidCoin).toBe(BUILDINGS.find(building => building.id === 'building.harbor')!.coinCost);
  expect(town.queue).toContainEqual({ itemId: 'building.harbor', progress: 0 });
  let constructionTurns = 0;
  while (!town.buildings.includes('building.harbor') && constructionTurns < 30) {
    issue(state, { type: 'endTurn', factionId }); constructionTurns++;
  }
  expect(constructionTurns).toBeGreaterThan(0); expect(town.buildings).toContain('building.harbor');
  expect(town.queue).toEqual([]);
  refreshAuthoredSight(state);
  const checked = deserializeGame(serializeGame(state));
  expect(stateHash(checked)).toBe(stateHash(state));
  return { state: checked, center, townId: town.id, coast, paidKnowledge, paidCoin, constructionTurns };
}

const zoom = (page: Page) => page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().zoom!);
const diagnostics = (page: Page) => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!);
async function nearView(page: Page) {
  await closeManagement(page); await closeCampaignOptions(page);
  await page.getByTestId('map-container').scrollIntoViewIfNeeded();
  for (let step = 0; step < 8 && await zoom(page) < 2.2; step++) await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  expect(await zoom(page)).toBe(2.2);
}

test('a paid Charter harbor uses its approved coastal sprite at desktop and narrow near zoom without changing naval rules', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  const fixture = harborScene(), hash = stateHash(fixture.state), observation = getObservation(fixture.state, fixture.state.turnOwnerId);
  const land = observation.land.settlements.find(item => item.settlementId === fixture.townId)!;
  const navigation = observation.productionOptions.filter(item => item.settlementId === fixture.townId && item.kind === 'naval');
  expect(navigation.some(item => item.itemId === 'unit.transport' && item.canQueue)).toBe(true);
  expect(navigation.some(item => item.itemId === 'unit.ocean_warship' && !item.canQueue && /Ocean navigation/.test(item.blocker ?? ''))).toBe(true);
  await page.goto('/');
  await page.getByLabel('Import save file').setInputFiles({ name: 'hearth-harbor.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(fixture.state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()?.state)).toBe('ready');
  await selectFromRegistry(page, 'settlements', 'Sounding Quay');
  await nearView(page);
  const district = (await diagnostics(page)).hearthDistricts.find(item => item.buildingId === 'building.harbor');
  expect(district).toMatchObject({ kind: 'harbor', settlementId: fixture.townId, buildingId: 'building.harbor', assetId: 'building.harbor', presentation: 'approved' });
  expect(land.claimed).toContain(district!.cell); expect(district!.cell).not.toBe(fixture.center);
  expect(await page.evaluate(cell => window.__THEANDRIL__!.getTerrainArt(cell), district!.cell)).toMatchObject({ visible: true, terrain: 1, district: { kind: 'harbor' } });
  const adjacentCells = neighbors(district!.cell, fixture.state.world.width, fixture.state.world.height);
  const shore = await page.evaluate(cells => cells.map(cell => window.__THEANDRIL__!.getTerrainArt(cell)), adjacentCells);
  expect(shore.some(tile => tile?.visible && tile.terrain === 0 && tile.waterDepth === 1)).toBe(true);

  // Verify the served, approved frame's complete opaque silhouette against the
  // same identity-bound geometry used by the civic renderer. No image readback
  // or injected terrain is needed in the running game.
  const catalog = parseRuntimeCatalog(await (await page.request.get('/art/catalog.json')).json());
  const asset = catalog.assets.find(asset => asset.id === district!.assetId)!;
  const atlas = catalog.atlases.find(atlas => atlas.id === asset.atlasId)!;
  const png = await (await page.request.get(atlas.imageUrl)).body();
  expect(sha256(png)).toBe(atlas.sha256);
  // Resolve through the application's Vite module graph: its JSON geometry
  // import belongs to that browser graph, not Playwright's Node ESM loader.
  const geometryModule = '/@fs' + fileURLToPath(new URL('../../packages/render/src/improvement-geometry.ts', import.meta.url));
  const image = decodePng(png), fit = await page.evaluate(async ({ asset, atlasHash, geometryModule }) => {
    const { registeredImprovementFit } = await import(geometryModule);
    return registeredImprovementFit(asset, atlasHash) as TileArtworkFit | undefined;
  }, { asset, atlasHash: atlas.sha256, geometryModule });
  expect(fit).toBeDefined();
  if (!fit) throw new Error('The served Charter harbor has no runtime improvement fit.');
  expect(fit.boundsKind).toBe('opaque-union'); expect(tileFootprintContained(fit)).toBe(true);
  expect(fit.bounds.width).toBeGreaterThan(36); expect(fit.bounds.width).toBeLessThanOrEqual(40);
  let escapedCorners = 0;
  for (const frame of asset.frames) {
    const pixels = cropImage(image, frame.frame);
    for (let y = 0; y < pixels.height; y++) for (let x = 0; x < pixels.width; x++) if (pixels.data[(y * pixels.width + x) * 4 + 3]) {
      for (const dx of [0, 1]) for (const dy of [0, 1]) {
        const px = fit.x + (x + dx - asset.pivot[0]) * fit.scale, py = fit.y + (y + dy - asset.pivot[1]) * fit.scale;
        if (Math.abs(px) > Math.sqrt(3) * (TILE_RADIUS - TILE_ART_INSET) / 2 + 1e-8 || Math.abs(py) + Math.abs(px) / Math.sqrt(3) > TILE_RADIUS - TILE_ART_INSET + 1e-8) escapedCorners++;
      }
    }
  }
  expect(escapedCorners).toBe(0);
  await page.getByTestId('map-container').screenshot({ path: info.outputPath('charter-harbor-near.png') });
  const terrainBefore = await page.evaluate(cells => cells.map(cell => { const tile = window.__THEANDRIL__!.getTerrainArt(cell); return tile ? { cell, terrain: tile.terrain, biome: tile.biome, depth: tile.waterDepth } : null; }), [district!.cell, ...adjacentCells]);
  for (let step = 0; step < 8 && await zoom(page) >= .65; step++) await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
  await expect.poll(async () => (await diagnostics(page)).lod).toBe('strategic-glyphs');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Focus selection', exact: true }).click();
  await nearView(page);
  await expect.poll(async () => (await diagnostics(page)).hearthDistricts.find(item => item.buildingId === 'building.harbor')?.assetId).toBe('building.harbor');
  const point = await page.evaluate(cell => window.__THEANDRIL__!.getCellScreenPoint(cell), district!.cell);
  expect(point?.inViewport).toBe(true);
  await page.getByTestId('map-container').screenshot({ path: info.outputPath('charter-harbor-near-390.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.evaluate(cells => cells.map(cell => { const tile = window.__THEANDRIL__!.getTerrainArt(cell); return tile ? { cell, terrain: tile.terrain, biome: tile.biome, depth: tile.waterDepth } : null; }), [district!.cell, ...adjacentCells])).toEqual(terrainBefore);
  expect(await page.evaluate(townId => window.__THEANDRIL__!.getSummary()!.productionOptions.filter(item => item.settlementId === townId && item.kind === 'naval'), fixture.townId)).toEqual(navigation);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);
  const evidencePath = info.outputPath('charter-harbor-evidence.json');
  await writeFile(evidencePath, JSON.stringify({ scope: 'Authored coast/population/resources; actual found, paid navigation research, paid harbor queue and completed construction turns. Served approved atlas silhouette verified; no navigation rules changed by display.', hash, paidKnowledge: fixture.paidKnowledge, paidCoin: fixture.paidCoin, constructionTurns: fixture.constructionTurns, district, fit, shore, navigation, nearZoom: await zoom(page) }, null, 2) + '\n');
  await info.attach('charter-harbor-evidence.json', { path: evidencePath, contentType: 'application/json' });
  expect(errors).toEqual([]);
});
