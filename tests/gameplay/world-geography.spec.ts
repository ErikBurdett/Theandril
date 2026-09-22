import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createGame, getObservation, serializeGame, stateHash } from '@theandril/sim';
import { isLake, riverSize, type MapLayout } from '@theandril/mapgen';
import { deserializeCampaign, exportSave, importSave } from '@theandril/persistence';
import { roadsCampaign } from '../../packages/test-fixtures/src/roads-fixture';
import { closeManagement, openSelectedOrders, selectFromRegistry } from './ui-navigation';

async function settings(page: Page) {
  await closeManagement(page);
  const popup = page.getByTestId('map-actions');
  if (await popup.isVisible()) await popup.getByRole('button', { name: 'Close map actions', exact: true }).click();
  const menu = page.getByTestId('campaign-menu');
  if (await menu.getAttribute('open') === null) await menu.locator('summary').click();
}
async function begin(page: Page, mode: 'watch' | 'player', layout: Exclude<MapLayout, 'legacy'> = 'continents', size: 'tiny' | 'huge' = 'tiny') {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'World seed', exact: true }).fill('74');
  await page.getByRole('combobox', { name: 'World size', exact: true }).selectOption(size);
  await page.getByRole('spinbutton', { name: 'Faction count', exact: true }).fill('4');
  await page.getByRole('combobox', { name: 'Map type', exact: true }).selectOption(layout);
  await page.getByRole('combobox', { name: 'Campaign pace', exact: true }).selectOption('short');
  await page.getByRole('combobox', { name: 'Campaign mode', exact: true }).selectOption(mode);
  await page.getByRole('spinbutton', { name: 'City-states', exact: true }).fill('0');
  await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 1');
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().frameCount ?? 0)).toBeGreaterThan(2);
}
async function exported(page: Page) {
  await settings(page);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export campaign', exact: true }).click();
  const path = await (await download).path(); if (!path) throw new Error('Campaign export missing');
  await page.getByTestId('campaign-menu').locator('summary').click();
  const text = await importSave(new Uint8Array(await readFile(path)));
  return { text, ...deserializeCampaign(text) };
}
async function mapClick(page: Page, cell: number) {
  await page.getByTestId('map-container').scrollIntoViewIfNeeded();
  const point = await page.evaluate(cell => window.__THEANDRIL__!.getCellScreenPoint(cell), cell);
  expect(point?.inViewport).toBe(true);
  await page.mouse.click(point!.x, point!.y);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSelection().cell)).toBe(cell);
}

test('AI-watch fog is a reversible UI/console presentation and saves retain only genuine faction sight', async ({ page }, testInfo) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await begin(page, 'watch');
  const initial = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!);
  const before = await exported(page);
  const reveal = page.getByRole('button', { name: 'Reveal spectator map', exact: true });
  await reveal.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Restore fog of war', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const revealed = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!);
  expect(revealed.exploredCells).toBe(1536);
  expect(revealed.cells).toEqual([]); expect(revealed.armies).toEqual(initial.armies); expect(revealed.factions).toEqual(initial.factions);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(stateHash(before.game));
  expect((await exported(page)).text).toBe(before.text);
  const result = await page.evaluate(() => window.theandril!.setWatchFog(true));
  expect(result).toEqual({ enabled: true, hash: stateHash(before.game) });
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.exploredCells)).toBe(initial.exploredCells);
  const toggles = await page.evaluate(async () => Promise.all([window.theandril!.toggleFogOfWar(), window.theandril!.toggleFogOfWar()]));
  expect(toggles.map(result => result.enabled)).toEqual([false, true]);
  expect((await exported(page)).text).toBe(before.text);
  await page.evaluate(() => window.theandril!.setWatchFog(false));
  await settings(page); await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  await page.reload(); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Reveal spectator map', exact: true })).toBeVisible();
  await expect(page.getByTestId('campaign-layout')).toHaveText('Continents');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.watch.fogEnabled)).toBe(true);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(stateHash(before.game));
  await page.getByRole('button', { name: 'Resume AI watch', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getTurn())).toBeGreaterThan(1);
  await page.evaluate(() => window.theandril!.toggleFogOfWar());
  await expect(page.getByTestId('watch-controls')).toContainText('AI watch paused');
  const after = await exported(page);
  expect(after.archive.records.length).toBeGreaterThan(0);
  for (const record of after.archive.records) expect(record.command).not.toMatchObject({ type: 'watchFog' });
  expect(after.game.explored[after.game.turnOwnerId]!.size).toBeLessThan(1536);
  await page.getByRole('button', { name: 'World overview', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().overview)).toBe(true);
  await page.getByTestId('map-container').screenshot({ path: testInfo.outputPath('spectator-world-overview.png') });
  expect(errors).toEqual([]);
});

for (const layout of ['continents', 'islands', 'archipelago'] as const) test(`${layout} geography renders actual lakes and joined rivers and can be inspected from the whole-world overview`, async ({ page }, testInfo) => {
  await begin(page, 'watch', layout);
  const expected = createGame({ seed: 74, size: 'tiny', factionCount: 4, pace: 'short', layout });
  await expect(page.getByTestId('campaign-layout')).toHaveText(layout[0]!.toUpperCase() + layout.slice(1));
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(stateHash(expected));
  await page.evaluate(() => window.theandril!.setWatchFog(false));
  await page.getByRole('button', { name: 'World overview', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().overview)).toBe(true);
  await page.getByTestId('map-container').screenshot({ path: testInfo.outputPath(`${layout}-whole-world.png`) });
  const river = [...expected.world.hydrology.keys()].find(cell => riverSize(expected.world.hydrology[cell]!));
  expect(river).toBeDefined();
  await mapClick(page, river!);
  // AI-watch map clicks select geography without opening player order menus.
  // The real full-orders window still exposes its read-only Hex inspection.
  const riverOrders = await openSelectedOrders(page);
  await expect(riverOrders.locator('.hex-inspector')).toContainText('River');
  await closeManagement(page);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSelection().cell)).toBe(river);
  await page.getByRole('button', { name: 'Focus selection', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().riverSegments ?? 0)).toBeGreaterThan(0);
  const presentation = await page.evaluate(cell => window.__THEANDRIL__!.getTerrainArt(cell), river!);
  expect(presentation?.hydrology).toBe(expected.world.hydrology[river!]);
  expect(presentation?.connections.rivers.length).toBeGreaterThan(0);
  expect(presentation?.riverCurves.length).toBe(presentation?.connections.rivers.length);
  for (const curve of presentation!.riverCurves) {
    const dx = curve.end[0] - curve.start[0], dy = curve.end[1] - curve.start[1];
    expect(Math.abs(dx * (curve.control1[1] - curve.start[1]) - dy * (curve.control1[0] - curve.start[0]))).toBeGreaterThan(1);
  }
  await page.getByTestId('map-container').screenshot({ path: testInfo.outputPath(`${layout}-river-near.png`) });
  const lake = [...expected.world.hydrology.keys()].find(cell => isLake(expected.world.hydrology[cell]!));
  if (lake !== undefined) {
    await page.getByRole('button', { name: 'World overview', exact: true }).click(); await mapClick(page, lake);
    const lakeOrders = await openSelectedOrders(page);
    await expect(lakeOrders.locator('.hex-inspector')).toContainText('Freshwater lake');
    await closeManagement(page);
    expect(await page.evaluate(() => window.__THEANDRIL__!.getSelection().cell)).toBe(lake);
    await page.getByRole('button', { name: 'Focus selection', exact: true }).click();
    const lakePresentation = await page.evaluate(cell => window.__THEANDRIL__!.getTerrainArt(cell), lake);
    expect(lakePresentation?.lake).toBe(true); expect(lakePresentation!.lakeShoreAngles.length).toBeLessThanOrEqual(6);
    await page.getByTestId('map-container').screenshot({ path: testInfo.outputPath(`${layout}-lake-near.png`) });
  }
  const saved = await exported(page); expect(saved.game.world.layout).toBe(layout);
  expect(serializeGame(saved.game)).toBe(serializeGame(expected));
});

test('Huge revealed world overview is one bounded texture and restoring fog removes unknown geography on a narrow viewport', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await begin(page, 'watch', 'archipelago', 'huge');
  const initial = await page.evaluate(() => ({ hash: window.__THEANDRIL__!.getStateHash(), cells: window.__THEANDRIL__!.getSummary()!.exploredCells }));
  const selected = await page.evaluate(() => {
    const view = window.__THEANDRIL__!.getSummary()!;
    return { selection: window.__THEANDRIL__!.getSelection(), factionId: view.factionId, color: view.factions.find(faction => faction.id === view.factionId)!.color };
  });
  expect(selected.selection.armyId).toBeDefined();
  const map = page.getByTestId('map-container');
  await map.scrollIntoViewIfNeeded(); await map.focus();
  for (let step = 0; step < 40; step++) await page.keyboard.press('-');
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().overview)).toBe(true);
  const minusFit = await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().zoom!);
  expect(minusFit).toBeLessThan(.05);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.exploredCells)).toBe(initial.cells);
  const { width, height } = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!);
  for (const cell of [0, width - 1, (height - 1) * width, width * height - 1]) expect(await page.evaluate(cell => window.__THEANDRIL__!.getCellScreenPoint(cell)?.inViewport, cell)).toBe(true);
  await page.getByRole('button', { name: 'World overview', exact: true }).click();
  expect(await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().zoom)).toBeCloseTo(minusFit, 8);
  await page.getByRole('button', { name: 'Focus selection', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().overview)).toBe(false);
  const canvas = await map.locator('canvas').boundingBox(); if (!canvas) throw new Error('Missing map canvas');
  await page.mouse.move(canvas.x + canvas.width / 2, canvas.y + canvas.height / 2);
  await page.mouse.wheel(0, 6000);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().zoom)).toBeCloseTo(minusFit, 8);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(initial.hash);
  await page.evaluate(() => window.theandril!.setWatchFog(false));
  await page.getByRole('button', { name: 'World overview', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().overview)).toBe(true);
  const metrics = await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters());
  expect(metrics.visibleChunks).toBe(0); expect(metrics.cachedChunks).toBeLessThanOrEqual(64);
  expect(metrics.visibleSprites).toBe(1); expect(metrics.overviewTextureBytes).toBeLessThan(4 * 1024 * 1024);
  expect(metrics.visibleCells).toBe(width * height);
  await page.getByTestId('map-container').screenshot({ path: testInfo.outputPath('huge-archipelago-overview-narrow.png') });
  await page.evaluate(() => window.theandril!.setWatchFog(true));
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.exploredCells)).toBe(initial.cells);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(initial.hash);
  await page.mouse.move(0, 0);
  await page.getByTestId('map-container').screenshot({ path: testInfo.outputPath('huge-overview-fog-restored.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSelection())).toEqual(selected.selection);
  // Overview retains the selected army in the inspector, but draws neither
  // its artwork nor a replacement whole-hex selection outline.
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.overlays)).toMatchObject({ selectedEntityTileOutline: false, selectionBounds: { width: 0, height: 0 }, selectedAsset: { mode: 'none', contours: 0 } });
  expect(await page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.visibleEntityArt)).toEqual([]);
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().zoom)).toBeCloseTo(minusFit * 1.25, 8);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().overview)).toBe(true);
  // Returning from world fit is continuous too; enough real wheel input crosses
  // back into detailed chunks without retaining the overview-sized selection.
  await map.scrollIntoViewIfNeeded();
  const back = await map.locator('canvas').boundingBox(); if (!back) throw new Error('Missing map canvas');
  await page.mouse.move(back.x + back.width / 2, back.y + back.height / 2);
  await page.mouse.wheel(0, -3000);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().overview)).toBe(false);
  await page.mouse.move(0, 0); // Exclude the independent hovered-cell affordance.
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.overlays)).toMatchObject({ selectedEntityTileOutline: false, selectionBounds: { width: 0, height: 0 } });
  await page.getByRole('button', { name: 'Focus selection', exact: true }).click();
  await page.mouse.move(0, 0);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.overlays)).toMatchObject({ selectedEntityTileOutline: false, selectionBounds: { width: 0, height: 0 }, selectedAsset: { entityId: selected.selection.armyId, factionId: selected.factionId, color: selected.color, mode: 'silhouette', contours: 1, failed: false } });
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSelection())).toEqual(selected.selection);
  expect(await page.evaluate(() => ({ hash: window.__THEANDRIL__!.getStateHash(), cells: window.__THEANDRIL__!.getSummary()!.exploredCells }))).toEqual(initial);
  await map.screenshot({ path: testInfo.outputPath('huge-fog-restored-selected-asset-narrow.png') });
});

test('player campaigns reject both public fog commands and expose no reveal button', async ({ page }) => {
  await begin(page, 'player');
  const before = await page.evaluate(() => ({ hash: window.__THEANDRIL__!.getStateHash(), cells: window.__THEANDRIL__!.getSummary()!.exploredCells }));
  expect(await page.evaluate(() => window.theandril!.toggleFogOfWar().then(() => 'unexpected', error => String(error)))).toContain('only in an active AI-watch');
  expect(await page.evaluate(() => window.theandril!.setWatchFog(false).then(() => 'unexpected', error => String(error)))).toContain('only in an active AI-watch');
  await expect(page.getByRole('button', { name: 'Reveal spectator map', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'World overview', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().overview)).toBe(true);
  const unknown = await page.evaluate(() => [0, 47, 1488, 1535].find(cell => !window.__THEANDRIL__!.getTerrainArt(cell)));
  expect(unknown).toBeDefined(); await mapClick(page, unknown!);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSelection().armyId)).toBeUndefined();
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSelection().settlementId)).toBeUndefined();
  await page.mouse.move(0, 0);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.overlays)).toMatchObject({ selectionBounds: { width: 0, height: 0 }, selectedAsset: { mode: 'none', contours: 0 } });
  expect(await page.evaluate(cell => window.__THEANDRIL__!.getTerrainArt(cell), unknown!)).toBeUndefined();
  expect(await page.evaluate(() => ({ hash: window.__THEANDRIL__!.getStateHash(), cells: window.__THEANDRIL__!.getSummary()!.exploredCells }))).toEqual(before);
});

test('a paid road segment has joined map geometry, preserves progress in a save and is suppressed only at far zoom', async ({ page }, testInfo) => {
  const game = roadsCampaign(), view = getObservation(game, game.turnOwnerId), road = view.roads![0]!;
  const town = view.settlements.find(town => town.id === road.settlementId)!;
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'road.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(game))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await selectFromRegistry(page, 'settlements', town.name);
  await openSelectedOrders(page);
  await page.getByTestId('settlement-road').locator('summary').click();
  const treasury = view.treasury;
  await page.getByRole('button', { name: new RegExp(`Hasten road · ${road.coinCost} crowns`) }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.treasury)).toBe(treasury - road.coinCost);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().roadSegments ?? 0)).toBeGreaterThan(0);
  const saved = await exported(page);
  expect(Object.values(saved.game.roads.edges).some(mask => mask > 0)).toBe(true);
  await page.getByTestId('map-container').screenshot({ path: testInfo.outputPath('paid-road-connected-near.png') });
  await page.getByRole('button', { name: 'Zoom out', exact: true }).click({ clickCount: 3, delay: 60 });
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().roadSegments)).toBe(0);
  await page.getByRole('button', { name: 'World overview', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().overview)).toBe(true);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().roadSegments)).toBe(0);
  await page.getByRole('button', { name: 'Focus selection', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().roadSegments ?? 0)).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(stateHash(saved.game));
  await settings(page); await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(stateHash(saved.game));
  await selectFromRegistry(page, 'settlements', town.name);
  await openSelectedOrders(page);
  const roadPanel = page.getByTestId('settlement-road');
  if (await roadPanel.getAttribute('open') === null) await roadPanel.locator('summary').click();
  const workFront = getObservation(saved.game, saved.game.turnOwnerId).roads!.find(item => item.settlementId === town.id)!.nextCell;
  expect(workFront).not.toBeNull();
  await roadPanel.getByRole('button', { name: `Show road work front · hex ${workFront}`, exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSelection().cell)).toBe(workFront);
  await closeManagement(page);
  await page.getByRole('button', { name: 'Focus selection', exact: true }).click();
  expect(await page.evaluate(cell => window.__THEANDRIL__!.getCellScreenPoint(cell!)?.inViewport, workFront)).toBe(true);
  await openSelectedOrders(page);
  if (await roadPanel.getAttribute('open') === null) await roadPanel.locator('summary').click();
  await page.screenshot({ path: testInfo.outputPath('paid-road-controls-and-work-front-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  const frontButton = roadPanel.getByRole('button', { name: `Show road work front · hex ${workFront}`, exact: true });
  await frontButton.scrollIntoViewIfNeeded();
  await expect(frontButton).toBeVisible();
  expect(await frontButton.evaluate(button => {
    const rect = button.getBoundingClientRect();
    return button.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
  })).toBe(true);
  await frontButton.click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSelection().cell)).toBe(workFront);
  await frontButton.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('paid-road-controls-narrow.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(stateHash(saved.game));
});
