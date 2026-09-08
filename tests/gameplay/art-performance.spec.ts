import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { deserializeGame, serializeGame, stateHash } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { matureCampaign } from '../../packages/test-fixtures/src/index';
import { FACTION_ART_IDS, factionArtId, parseRuntimeCatalog } from '@theandril/art-pipeline/runtime';

test('fully explored Huge art rendering stays viewport-bounded across static faction poses, pan and strategic LOD', async ({ page }, testInfo) => {
  const fixture = matureCampaign('huge');
  const cells = fixture.world.width * fixture.world.height;
  // Synthetic knowledge only, imported through the real validated save boundary.
  // 1,500 global armies are not 1,500 visible enemies: live visibility still applies.
  fixture.explored[fixture.turnOwnerId] = new Set(Array.from({ length: cells }, (_, cell) => cell));
  const state = deserializeGame(serializeGame(fixture)), hash = stateHash(state);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  const catalog = parseRuntimeCatalog(await (await page.request.get('/art/catalog.json')).json());
  const mapBindings = new Set<string>([...FACTION_ART_IDS,
    'terrain.ocean', 'terrain.grassland', 'terrain.temperate_forest', 'terrain.taiga', 'terrain.tundra', 'terrain.desert', 'terrain.steppe', 'terrain.marsh', 'terrain.rainforest', 'terrain.alpine', 'terrain.ash_scrub', 'terrain.chalkland',
    'improvement.terraced_fields', 'improvement.managed_woodlot', 'improvement.quarry', 'improvement.reedworks', 'improvement.shore_fishery',
    'unit.guard', 'unit.scout', 'unit.colonist', 'unit.spearman', 'unit.heavy_infantry', 'unit.cavalry', 'settlement.village', 'settlement.town', 'settlement.city', 'map.ruin',
  ]);
  const neededPages = new Set(catalog.assets.filter(asset => mapBindings.has(asset.id) || asset.contentIds.some(id => mapBindings.has(id))).map(asset => asset.atlasId));
  const mapAtlases = catalog.atlases.filter(atlas => neededPages.has(atlas.id));
  const expectedResidency = mapAtlases.reduce((sum, atlas) => sum + atlas.width * atlas.height * 4, 0);
  expect(expectedResidency).toBeGreaterThan(0);
  expect(expectedResidency).toBeLessThanOrEqual(16 * 1024 * 1024);
  const ownDefinition = state.factions.find(faction => faction.id === state.turnOwnerId)!.definitionId;
  await page.locator('input[type=file]').setInputFiles({ name: 'fully-explored-art.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics()?.state)).toBe('ready');
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getSummary()?.exploredCells)).toBe(cells);
  const samples: { stage: string; metrics: unknown; art: unknown }[] = [];
  const sample = async (stage: string) => {
    const frame = await page.evaluate(() => window.__THEANDRIL__?.getPerformanceCounters().frameCount ?? 0);
    await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getPerformanceCounters().frameCount ?? 0)).toBeGreaterThan(frame + 60);
    const metrics = await page.evaluate(() => window.__THEANDRIL__?.getPerformanceCounters());
    const art = await page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics());
    expect(metrics?.cachedChunks).toBeLessThanOrEqual(64);
    // Empty Graphics must not drag a distant chunk's cache back to world(0,0).
    expect(metrics?.maxCachedChunkWidth).toBeLessThanOrEqual(900);
    expect(metrics?.maxCachedChunkHeight).toBeLessThanOrEqual(760);
    expect(metrics?.cachedTextureBytesEstimate).toBeLessThanOrEqual(64 * 4 * 1024 * 1024);
    expect(metrics?.visibleCells).toBeLessThan(10000);
    expect(metrics?.pooledSprites).toBeLessThanOrEqual(64 * 256 + 1500);
    expect(metrics?.residentAtlasBytesEstimate).toBe(expectedResidency);
    expect(metrics?.residentAtlasBytesEstimate).toBeLessThanOrEqual(16 * 1024 * 1024);
    expect(metrics?.atlasPages).toBe(mapAtlases.length);
    // Full exploration must not regress to cloning hundreds of thousands of
    // cell objects, or eagerly enumerate every town's land action quotes.
    expect(metrics?.cellTransferBytes).toBeGreaterThan(cells * 9);
    expect(metrics?.cellTransferBytes).toBeLessThan(2 * 1024 * 1024);
    expect(metrics?.transferBytes).toBeLessThan(3 * 1024 * 1024);
    expect(metrics?.landQueryCount).toBe(0);
    expect(await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.land.settlements.every(town => town.cells.length === 0))).toBe(true);
    expect(await page.evaluate(() => window.__THEANDRIL__?.getStateHash())).toBe(hash);
    samples.push({ stage, metrics, art });
  };
  await sample('fully-explored-static');
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics()?.lod)).toBe('near-sprites');
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics()?.visibleAssetIds ?? [])).toEqual(expect.arrayContaining([factionArtId('unit.guard', ownDefinition), factionArtId('settlement.village', ownDefinition)]));
  expect(await page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics()?.visibleAnimationFrames)).toEqual([]);
  await sample('near-static-faction-poses');
  await page.screenshot({ path: testInfo.outputPath('fully-explored-near.png'), fullPage: true });
  const bounds = await page.getByTestId('map-container').locator('canvas').boundingBox(); if (!bounds) throw new Error('Missing map canvas');
  const x = bounds.x + bounds.width * .6, y = bounds.y + bounds.height * .5;
  for (let index = 0; index < 6; index++) {
    await page.mouse.move(x, y); await page.mouse.down();
    await page.mouse.move(x - 300, y - 100, { steps: 12 }); await page.mouse.up();
  }
  await sample('six-camera-drags');
  for (let index = 0; index < 4; index++) await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics()?.lod)).toBe('strategic-glyphs');
  await sample('far-strategic');
  // This panned viewport may contain no entities. Return home for meaningful far-marker coverage.
  expect(await page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics()?.visibleAnimationFrames.length)).toBe(0);
  await page.getByRole('button', { name: 'Focus selection', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics()?.visibleAssetIds ?? [])).toEqual(expect.arrayContaining([factionArtId('ui.badge', ownDefinition), factionArtId('ui.banner', ownDefinition)]));
  await sample('far-strategic-home-aggregates');
  const far = await page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics());
  const farMetrics = await page.evaluate(() => window.__THEANDRIL__?.getPerformanceCounters());
  expect(far?.visibleSprites).toBeGreaterThan(0);
  expect(far?.visibleEntityArt.every(entity => entity.presentation === 'strategic')).toBe(true);
  expect(farMetrics?.visibleSprites).toBeLessThan(farMetrics?.visibleEntities ?? 0);
  expect(far?.visibleAnimationFrames).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath('fully-explored-strategic.png'), fullPage: true });
  const canvas = await page.getByTestId('map-container').locator('canvas').boundingBox();
  const homeCell = Object.values(state.armies).find(army => army.factionId === state.turnOwnerId)!.cell;
  const report = { workload: 'Synthetic fully explored Huge, 32 factions, 1,500 global armies, 32 towns; fog still limits currently visible entities. Static qualified faction poses at near zoom; co-located armies aggregate to heraldic badges at far zoom. No turn advancement or claims about late-game strategic load. Cache backing is separately estimated with power-of-two dimensions; returned texture-pool resources and other GPU allocations are not included.', homeCell, canvas, mapAtlases, expectedResidency, cells, stateHash: hash, samples };
  const reportPath = testInfo.outputPath('fully-explored-art-performance.json');
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  await testInfo.attach('fully-explored-art-performance.json', { path: reportPath, contentType: 'application/json' });
  // Retain detailed entity evidence in the attachment; keep the console measurement summary bounded.
  console.log('Fully explored Huge art measurements:', JSON.stringify({ ...report, samples: samples.map(({ stage, metrics }) => ({ stage, metrics })) }));
  expect(errors).toEqual([]);
});
