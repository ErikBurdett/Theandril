import { openRegistry } from './ui-navigation';
import { expect, test, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { generateWorld, riverSize } from '@theandril/mapgen';

const counters = (page: Page) => page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters());

test('Huge generated archipelago spectator geography stays bounded through reveal, river inspection, pan, overview and restored fog', async ({ page }, testInfo) => {
  // Independent read-only geography identifies an actual river to click. It is
  // never imported, injected into the worker, or included in frame measurements.
  const world = generateWorld(74, 'huge', 32, undefined, { layout: 'archipelago' });
  const cellCount = world.width * world.height;
  const home = world.starts[0]!;
  const river = world.hydrology.findIndex((value, cell) => riverSize(value) > 0
    && cell % world.width > 8 && cell % world.width < world.width - 8
    && Math.abs(Math.floor(cell / world.width) - Math.floor(home / world.width)) + Math.abs(cell % world.width - home % world.width) > 30
    && Math.floor(cell / world.width) > world.height / 3 && Math.floor(cell / world.width) < world.height * 2 / 3);
  expect(river).toBeGreaterThanOrEqual(0);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.getByRole('textbox', { name: 'World seed', exact: true }).fill('74');
  await page.getByRole('combobox', { name: 'World size', exact: true }).selectOption('huge');
  await page.getByRole('spinbutton', { name: 'Faction count', exact: true }).fill('32');
  await page.getByRole('combobox', { name: 'Map type', exact: true }).selectOption('archipelago');
  await page.getByRole('combobox', { name: 'Campaign pace', exact: true }).selectOption('short');
  await page.getByRole('combobox', { name: 'Campaign mode', exact: true }).selectOption('watch');
  await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 1');
  await expect(page.getByTestId('watch-controls')).toContainText('AI watch paused');
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()?.state)).toBe('ready');
  const initial = await page.evaluate(() => {
    const api = window.__THEANDRIL__!, view = api.getSummary()!;
    return { hash: api.getStateHash(), selection: api.getSelection(), cells: view.exploredCells,
      factions: view.factions.map(faction => faction.id), armies: view.armies.map(army => army.id), turn: view.turn };
  });
  expect(initial.cells).toBe(61);
  const samples: { stage: string; warmedFrames: number; metrics: Awaited<ReturnType<typeof counters>> }[] = [];
  const sample = async (stage: string) => {
    const frame = (await counters(page)).frameCount ?? 0;
    await page.waitForFunction(frame => (window.__THEANDRIL__!.getPerformanceCounters().frameCount ?? 0) >= frame + 75, frame);
    const metrics = await counters(page);
    expect(metrics.cachedChunks).toBeLessThanOrEqual(64);
    expect(metrics.maxCachedChunkWidth).toBeLessThanOrEqual(900);
    expect(metrics.maxCachedChunkHeight).toBeLessThanOrEqual(760);
    expect(metrics.cachedTextureBytesEstimate).toBeLessThanOrEqual(64 * 4 * 1024 * 1024);
    expect(metrics.residentAtlasBytesEstimate).toBeLessThanOrEqual(17 * 1024 * 1024);
    expect(metrics.landQueryCount).toBe(0);
    if (!metrics.overview) expect(metrics.visibleCells).toBeLessThan(10000);
    expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(initial.hash);
    expect(await page.evaluate(() => window.__THEANDRIL__!.getTurn())).toBe(1);
    samples.push({ stage, warmedFrames: (metrics.frameCount ?? 0) - frame, metrics });
    return metrics;
  };
  const normal = await sample('normal-faction-sight');
  // A fresh sight patch with no hydrology/roads legitimately uses compact v1
  // (nine bytes per row). Revealing the actual river-bearing world below uses v2.
  expect(normal.cellTransferBytes).toBeGreaterThan(61 * 9);
  expect(normal.cellTransferBytes).toBeLessThan(4096);
  const reveal = await page.evaluate(async () => {
    const started = performance.now(), result = await window.theandril!.setWatchFog(false);
    return { ...result, acknowledgementMs: performance.now() - started };
  });
  expect(reveal).toMatchObject({ enabled: false, hash: initial.hash });
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.exploredCells)).toBe(cellCount);
  const revealedTransfer = await counters(page);
  expect(revealedTransfer.cellTransferBytes).toBeGreaterThan(cellCount * 11);
  expect(revealedTransfer.cellTransferBytes).toBeLessThan(3 * 1024 * 1024);
  expect(revealedTransfer.transferBytes).toBeLessThan(4 * 1024 * 1024);

  // Overview picking and Focus selection are normal controls, not a camera or
  // state mutator. The observation hook returns screen coordinates only.
  await page.getByRole('button', { name: 'World overview', exact: true }).click();
  await expect.poll(() => counters(page).then(metrics => metrics.overview)).toBe(true);
  const point = await page.evaluate(cell => window.__THEANDRIL__!.getCellScreenPoint(cell), river);
  expect(point?.inViewport).toBe(true);
  await page.mouse.click(point!.x, point!.y);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSelection().cell)).toBe(river);
  await page.getByRole('button', { name: 'Focus selection', exact: true }).click();
  const near = await sample('revealed-river-near');
  expect(near.overview).toBe(false); expect(near.riverSegments).toBeGreaterThan(0);
  const riverArt = await page.evaluate(cell => window.__THEANDRIL__!.getTerrainArt(cell), river);
  expect(riverArt?.hydrology).toBe(world.hydrology[river]);
  expect(riverArt?.riverCurves.length).toBeGreaterThan(0);
  await page.getByTestId('map-container').screenshot({ path: testInfo.outputPath('huge-archipelago-rivers-near.png') });

  const canvas = await page.getByTestId('map-container').locator('canvas').boundingBox();
  if (!canvas) throw new Error('Missing map canvas');
  for (let index = 0; index < 3; index++) {
    const x = canvas.x + canvas.width * .65, y = canvas.y + canvas.height * .55;
    await page.mouse.move(x, y); await page.mouse.down();
    await page.mouse.move(x - 220, y - 80, { steps: 10 }); await page.mouse.up();
  }
  await sample('three-local-camera-drags');
  await page.getByRole('button', { name: 'Zoom out', exact: true }).click({ clickCount: 4, delay: 60 });
  const far = await sample('revealed-strategic-zoom');
  expect(far.overview).toBe(false); expect(far.zoom).toBeLessThan(.65); expect(far.roadSegments).toBe(0);
  await page.getByRole('button', { name: 'World overview', exact: true }).click();
  const overview = await sample('revealed-whole-world-overview');
  expect(overview.overview).toBe(true); expect(overview.visibleCells).toBe(cellCount);
  expect(overview.visibleChunks).toBe(0); expect(overview.visibleSprites).toBe(1);
  expect(overview.terrainSpriteCells).toBe(0); expect(overview.visibleEntities).toBe(0);
  expect(overview.roadSegments).toBe(0);
  expect(overview.overviewTextureBytes).toBe((world.width * 2 + 1) * world.height * 2 * 4);
  expect(overview.overviewTextureBytes).toBeLessThan(4 * 1024 * 1024);
  await page.getByTestId('map-container').screenshot({ path: testInfo.outputPath('huge-archipelago-whole-world-overview.png') });

  const restore = await page.evaluate(async () => {
    const started = performance.now(), result = await window.theandril!.setWatchFog(true);
    return { ...result, acknowledgementMs: performance.now() - started };
  });
  expect(restore).toMatchObject({ enabled: true, hash: initial.hash });
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.exploredCells)).toBe(61);
  await expect.poll(() => counters(page).then(metrics => metrics.visibleCells)).toBe(61);
  const restoredOverview = await counters(page);
  expect(restoredOverview.overview).toBe(true); expect(restoredOverview.visibleChunks).toBe(0);
  expect(restoredOverview.cellTransferBytes).toBe(normal.cellTransferBytes);
  expect(await page.evaluate(cell => window.__THEANDRIL__!.getTerrainArt(cell), river)).toBeUndefined();
  // Registry selection returns to genuine own sight, then ordinary focus exits
  // overview without retaining the remote spectator geography or giant ring.
  await openRegistry(page, 'armies');
  await page.getByTestId('army-registry').getByRole('button').first().click();
  await page.getByRole('button', { name: 'Focus selection', exact: true }).click();
  const restored = await sample('restored-faction-sight-focused');
  expect(restored.overview).toBe(false);
  // The fog-safe overview texture remains cached for reopening; exiting the
  // overview does not claim that its allocation was destroyed.
  expect(restored.overviewTextureBytes).toBe(restoredOverview.overviewTextureBytes);
  expect(restored.visibleCells).toBeLessThanOrEqual(61);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.overlays.selectionBounds.width)).toBeLessThan(61);
  const final = await page.evaluate(() => {
    const view = window.__THEANDRIL__!.getSummary()!;
    return { hash: window.__THEANDRIL__!.getStateHash(), cells: view.cells,
      factions: view.factions.map(faction => faction.id), armies: view.armies.map(army => army.id), watch: view.watch };
  });
  expect(final).toMatchObject({ hash: initial.hash, cells: [], factions: initial.factions, armies: initial.armies, watch: { running: false, fogEnabled: true } });
  const report = { workload: 'Real new-game worker; Huge archipelago, seed 74, 32 factions, Short pace, paused AI watch, 1440×1000. No turn advancement, imports or canonical mutations.',
    measurementNotes: 'Each sampled phase waits at least 75 renderer frames. frameP95Ms is the renderer rolling 240-frame percentile, not an independent phase percentile. Acknowledgement timings include worker projection, transfer and main-thread handling, not completed GPU presentation. Packed transfer bytes are the actual worker metric. Chunk cache estimates are separate from the map atlas, overview texture, DOM atlas decoder and other GPU allocations. Timing is reported rather than asserted against host-dependent thresholds.',
    seed: 74, factionCount: 32, cellCount, normalCells: initial.cells, hash: initial.hash, river, canvas,
    reveal, restore, revealedTransfer, restoredOverview, samples };
  const reportPath = testInfo.outputPath('geography-performance.json');
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  await testInfo.attach('geography-performance.json', { path: reportPath, contentType: 'application/json' });
  console.log('Huge generated geography measurements:', JSON.stringify(report));
  expect(errors).toEqual([]);
});
