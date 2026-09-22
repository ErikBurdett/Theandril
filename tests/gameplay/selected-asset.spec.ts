import { expect, test, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parseRuntimeCatalog } from '@theandril/art-pipeline/runtime';
import type { WorldRenderer } from '../../packages/render/src/index';
import { createArmyFormation, deserializeGame, serializeGame, stateHash } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { borderBattleCampaign } from '../../packages/test-fixtures/src/combat-fixture';
import { selectFromRegistry } from './ui-navigation';

type SelectionDiagnostic = ReturnType<WorldRenderer['getArtDiagnostics']>['overlays']['selectedAsset'];

async function loadSelectionCampaign(page: Page) {
  const state = borderBattleCampaign(), army = state.armies['army.2']!;
  army.formations = Array.from({ length: 6 }, () => createArmyFormation(`army.${state.nextId++}`, 'unit.guard')).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const game = deserializeGame(serializeGame(state));
  const town = Object.values(game.settlements).find(town => town.factionId === game.turnOwnerId)!;
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'selected-real-assets.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(game))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  return { game, army: game.armies[army.id]!, town };
}
async function chooseArmy(page: Page, name: string) {
  await selectFromRegistry(page, 'armies', name);
  await page.getByRole('button', { name: 'Focus selection', exact: true }).click();
  await page.mouse.move(0, 0);
}

test('only the selected artwork has a quiet faction contour and slow glints, with steady reduced motion and preserved map actions', async ({ page }, testInfo) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  const { game, army, town } = await loadSelectionCampaign(page), hash = stateHash(game);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics()?.state)).toBe('ready');
  await chooseArmy(page, army.name);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.overlays.selectedAsset)).toMatchObject({ entityId: army.id, factionId: game.turnOwnerId, color: game.factions[0]!.color, mode: 'silhouette', contours: 3, glints: 3, animated: true, failed: false });
  const first = await page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!);
  expect(first.overlays.selectedEntityTileOutline).toBe(false);
  expect(first.overlays.selectionBounds).toEqual({ width: 0, height: 0 });
  expect(first.visibleEntityArt.filter(entity => entity.entityId === army.id)).toEqual([expect.objectContaining({ representativeCount: 3, tint: 0xffffff })]);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().highlightedCells ?? 0)).toBeGreaterThan(0);
  const cached = await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().chunkRebuilds);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.overlays.selectedAsset.contourAlpha)).not.toBeCloseTo(first.overlays.selectedAsset.contourAlpha, 2);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().chunkRebuilds)).toBe(cached);
  await page.getByTestId('map-container').screenshot({ path: testInfo.outputPath('selected-army-silhouette.png') });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.overlays.selectedAsset)).toMatchObject({ contours: 3, glints: 0, animated: false, contourAlpha: .5 });
  const reduced = await page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.overlays.selectedAsset);
  const frame = await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().frameCount ?? 0);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().frameCount ?? 0)).toBeGreaterThan(frame + 20);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.overlays.selectedAsset)).toEqual(reduced);
  await selectFromRegistry(page, 'settlements', town.name);
  await page.mouse.move(0, 0);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.overlays.selectedAsset)).toMatchObject({ entityId: town.id, mode: 'silhouette', contours: 1, animated: false });
  expect(await page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.overlays.selectionBounds)).toEqual({ width: 0, height: 0 });
  await page.getByTestId('map-container').screenshot({ path: testInfo.outputPath('selected-town-silhouette.png') });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('button', { name: 'Zoom out', exact: true }).click({ clickCount: 3, delay: 70 });
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.overlays.selectedAsset)).toMatchObject({ mode: 'silhouette', animated: false, glints: 0 });
  await page.getByRole('button', { name: 'World overview', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.overlays.selectedAsset.mode)).toBe('none');
  await page.getByRole('button', { name: 'Focus selection', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await chooseArmy(page, army.name);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.overlays.selectedAsset.contours)).toBe(3);
  await page.getByTestId('map-container').screenshot({ path: testInfo.outputPath('selected-asset-narrow.png') });
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.overlays.selectedAsset.mode)).toBe('none');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(reduced.cacheEntries).toBeLessThanOrEqual(16);
  expect(reduced.textureBytes).toBeLessThan(16 * 260 * 260 * 4);
  const artifact = testInfo.outputPath('selected-asset-review.json');
  await writeFile(artifact, JSON.stringify({ hash, first, reduced, final: await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters()), annotations: ['Six real formations use three selected representative silhouettes; no extra army or tile-shaped selection.', 'Artwork stays untinted; only external alpha contours and three fixed slow glints use visible faction color.', 'Reduced motion and far LOD have a steady contour. World overview and cleared selection have no entity effect.', 'Changing animation opacity does not rebuild terrain chunks or issue orders.'] }, null, 2));
  await testInfo.attach('selected-asset-review.json', { path: artifact, contentType: 'application/json' });
  expect(errors).toEqual([]);
});

test('unavailable selected artwork uses small honest glyph brackets without restoring a whole-tile outline', async ({ page }) => {
  await page.route('**/art/catalog.json', route => route.fulfill({ status: 503, body: 'Diagnostic missing approved art' }));
  const { game, army } = await loadSelectionCampaign(page);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics()?.state)).toBe('fallback');
  await chooseArmy(page, army.name);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.overlays.selectedAsset)).toMatchObject({ entityId: army.id, mode: 'procedural-brackets', contours: 0, glints: 0, animated: false, bounds: { width: 24, height: 24 } });
  expect(await page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.overlays.selectionBounds)).toEqual({ width: 0, height: 0 });
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(stateHash(game));
});

test('the approved Ashen scout plays all four genuine idle frames with matching bounded selection masks and native Lab playback', async ({ page }, testInfo) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('textbox', { name: 'World seed', exact: true }).fill('20260905');
  await page.getByRole('combobox', { name: 'World size', exact: true }).selectOption('tiny');
  await page.getByRole('spinbutton', { name: 'City-states', exact: true }).fill('0');
  await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 1');
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics()?.state)).toBe('ready');
  const catalog = parseRuntimeCatalog(await (await page.request.get('/art/catalog.json')).json());
  const asset = catalog.assets.find(asset => asset.id === 'unit.scout.ashen_compact')!;
  expect(asset).toMatchObject({ nativeResolution: { width: 64, height: 64 }, pivot: [32, 56] });
  expect(asset.frames.map(frame => [frame.index, frame.direction, frame.state, frame.durationMs])).toEqual([0, 1, 2, 3].map(index => [index, 'se', 'idle', 250]));
  expect(asset.clips).toEqual([expect.objectContaining({ frames: asset.frames.map(frame => frame.id), durationsMs: [250, 250, 250, 250], loop: true })]);
  const scout = (await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.ownArmies)).find(army => army.unitId === 'unit.scout')!;
  const hash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  await chooseArmy(page, scout.name);
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.visibleAnimationFrames.length)).toBe(1);

  // Observe the real renderer clock over several complete cycles. No clock,
  // frame, campaign, or sprite is mutated by the test.
  const samples = await page.evaluate(() => new Promise<{ frameId: string; selection: SelectionDiagnostic; rebuilds: number }[]>(resolve => {
    const results: { frameId: string; selection: SelectionDiagnostic; rebuilds: number }[] = [];
    let count = 0;
    const read = () => {
      const art = window.__THEANDRIL__!.getArtDiagnostics()!, frameId = art.visibleAnimationFrames[0]?.frameId;
      if (frameId) results.push({ frameId, selection: art.overlays.selectedAsset, rebuilds: window.__THEANDRIL__!.getPerformanceCounters().chunkRebuilds! });
      if (++count >= 150) resolve(results); else requestAnimationFrame(read);
    };
    requestAnimationFrame(read);
  }));
  expect(new Set(samples.map(sample => sample.frameId))).toEqual(new Set(asset.frames.map(frame => frame.id)));
  for (const sample of samples) {
    const frame = asset.frames.find(frame => frame.id === sample.frameId)!;
    expect(sample.selection).toMatchObject({ entityId: scout.id, mode: 'silhouette', contours: 1, glints: 3, animated: true, failed: false });
    expect(sample.selection.sourceFrames).toEqual([{ x: frame.frame.x, y: frame.frame.y, width: 64, height: 64 }]);
    expect(sample.selection.cacheEntries).toBeLessThanOrEqual(16);
  }
  expect(new Set(samples.map(sample => sample.rebuilds)).size).toBe(1);
  // Repeated cycles reuse all four masks instead of allocating per frame.
  expect(new Set(samples.slice(-60).map(sample => sample.selection.cacheEntries)).size).toBe(1);
  expect(samples.at(-1)!.selection.cacheEntries).toBeGreaterThanOrEqual(4);
  expect(samples.at(-1)!.selection.textureBytes).toBeLessThan(16 * 260 * 260 * 4);
  const screenshotFrames: { frameId: string; elapsedMs: number; sha256: string; file: string }[] = [];
  await page.getByTestId('map-container').scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  for (const frame of asset.frames) {
    let captured = false;
    for (let attempt = 0; attempt < 8 && !captured; attempt++) {
      await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.visibleAnimationFrames[0]?.frameId), { intervals: [16] }).toBe(frame.id);
      const started = Date.now();
      const pixels = await page.getByTestId('map-container').screenshot();
      const after = await page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!);
      const elapsedMs = Date.now() - started;
      // Keep only an actual, unpaused capture bracketed by the same frame;
      // under250ms also rules out a full-loop wrap during capture.
      if (elapsedMs >= 250 || after.visibleAnimationFrames[0]?.frameId !== frame.id) continue;
      const file = `selected-scout-live-frame-${frame.index + 1}.png`;
      await writeFile(testInfo.outputPath(file), pixels);
      screenshotFrames.push({ frameId: frame.id, elapsedMs, sha256: createHash('sha256').update(pixels).digest('hex'), file });
      captured = true;
    }
    expect(captured, `Actual live capture of ${frame.id}`).toBe(true);
  }
  const art = await page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!);
  expect(art.visibleEntityArt.find(entity => entity.entityId === scout.id)).toMatchObject({ assetId: asset.id, tint: 0xffffff });
  expect(art.overlays.selectionBounds).toEqual({ width: 0, height: 0 });
  expect(art.overlays.selectedEntityTileOutline).toBe(false);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.visibleAnimationFrames)).toEqual([]);
  const reduced = await page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.overlays.selectedAsset);
  expect(reduced).toMatchObject({ contours: 1, glints: 0, animated: false, contourAlpha: .5, sourceFrames: [{ x: asset.frames[0]!.frame.x, y: asset.frames[0]!.frame.y, width: 64, height: 64 }] });
  const ticks = await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().frameCount ?? 0);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().frameCount)).toBeGreaterThan(ticks + 30);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.overlays.selectedAsset)).toEqual(reduced);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('button', { name: 'Zoom out', exact: true }).click({ clickCount: 4, delay: 60 });
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.lod)).toBe('strategic-glyphs');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.visibleAnimationFrames)).toEqual([]);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.overlays.selectedAsset)).toMatchObject({ animated: false, glints: 0 });

  await page.getByRole('button', { name: 'Art Lab', exact: true }).click();
  const lab = page.getByRole('dialog', { name: 'Art Lab', exact: true });
  await lab.getByLabel('Search art assets', { exact: true }).fill(asset.id);
  await lab.getByRole('button', { name: `Inspect ${asset.id}`, exact: true }).click();
  await expect(lab.getByTestId('art-consumer')).toContainText('Current gameplay consumer');
  await lab.getByRole('combobox', { name: 'Native zoom', exact: true }).selectOption('1');
  await lab.getByLabel('Show alpha bounds', { exact: true }).uncheck();
  await lab.getByLabel('Show pivot', { exact: true }).uncheck();
  await expect(lab.getByTestId('art-preview-canvas')).toHaveAttribute('width', '64');
  const nativeHashes: string[] = [];
  for (let index = 0; index < 4; index++) {
    await expect(lab.getByTestId('art-frame-counter')).toHaveText(`Frame ${index + 1} / 4 · 250 ms`);
    const pixels = await lab.getByTestId('art-preview-canvas').evaluate(canvas => (canvas as HTMLCanvasElement).toDataURL());
    nativeHashes.push(createHash('sha256').update(pixels).digest('hex'));
    await lab.getByTestId('art-preview-canvas').screenshot({ path: testInfo.outputPath(`scout-lab-native-frame-${index + 1}.png`) });
    if (index < 3) await lab.getByRole('button', { name: 'Next frame', exact: true }).click();
  }
  expect(new Set(nativeHashes).size).toBe(4);
  await lab.getByRole('button', { name: 'Play animation', exact: true }).click();
  const labSequence = await lab.getByTestId('art-frame-counter').evaluate(element => new Promise<string[]>(resolve => {
    const entries: string[] = []; let count = 0;
    const read = () => { const text = element.textContent!; if (entries.at(-1) !== text) entries.push(text); if (++count >= 135) resolve(entries); else requestAnimationFrame(read); };
    requestAnimationFrame(read);
  }));
  expect(new Set(labSequence)).toEqual(new Set([1, 2, 3, 4].map(index => `Frame ${index} / 4 · 250 ms`)));
  expect(labSequence.length).toBeGreaterThanOrEqual(8);
  await lab.screenshot({ path: testInfo.outputPath('scout-lab-native-playing.png') });
  await lab.getByRole('button', { name: 'Pause animation', exact: true }).click();
  await lab.getByRole('combobox', { name: 'Native zoom', exact: true }).selectOption('4');
  await lab.screenshot({ path: testInfo.outputPath('scout-lab-4x.png') });
  await lab.getByLabel('Search art assets', { exact: true }).fill('terrain.grassland.variant_1');
  await lab.getByRole('button', { name: 'Inspect terrain.grassland.variant_1', exact: true }).click();
  await expect(lab.getByTestId('art-consumer')).toContainText('Current gameplay consumer');
  await lab.getByLabel('Search art assets', { exact: true }).fill('effect.selection');
  await lab.getByRole('button', { name: 'Inspect effect.selection', exact: true }).click();
  await expect(lab.getByTestId('art-consumer')).toContainText('no current gameplay consumer');
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);
  const artifact = testInfo.outputPath('scout-idle-playback-review.json');
  await writeFile(artifact, JSON.stringify({ hash, assetId: asset.id, atlas: catalog.atlases.find(atlas => atlas.id === asset.atlasId), frames: asset.frames, samples, screenshotFrames, reduced, nativeHashes, labSequence, notes: ['Only the published four-frame Ashen scout was animated; all game state remained unchanged.', 'Every sampled selected contour referenced the simultaneously displayed atlas frame.', 'The repeated real clock cycles reuse a bounded mask cache without terrain rebuilds.', 'The four gameplay captures were not paused or clock-injected; before/after frame checks bracket each under250ms capture.', 'Art Lab native frames are individually distinct and the real timer traverses two complete loops.'] }, null, 2));
  await testInfo.attach('scout-idle-playback-review.json', { path: artifact, contentType: 'application/json' });
  expect(errors).toEqual([]);
});
