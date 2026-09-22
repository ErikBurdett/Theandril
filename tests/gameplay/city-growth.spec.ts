import { closeManagement, openRegistry, selectFromRegistry, openSelectedOrders } from './ui-navigation';
import { expect, test, type Page } from '@playwright/test';
import { IMPROVEMENTS, TECHNOLOGIES } from '@theandril/content';
import { hexDistance, naturalFeatures } from '@theandril/mapgen';
import { applyCommand, createGame, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand, type GameState } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { cellsWithin } from '../../packages/sim/src/visibility';

function issue(state: GameState, command: GameCommand) { const result = applyCommand(state, command); if (!result.ok) throw new Error(result.error); }
function cityScene() {
  const state = createGame({ generatorVersion: 4, seed: 17, size: 'tiny', factionCount: 1, pace: 'epic' });
  const origin = state.armies['army.1']!.cell;
  for (const cell of cellsWithin(state, origin, 3)) {
    state.world.terrain[cell] = 1; state.world.biome[cell] = 7; state.world.waterDepth[cell] = 0; state.world.fertility[cell] = 80;
    delete state.resources.deposits[cell];
  }
  issue(state, { type: 'found', factionId: state.turnOwnerId, armyId: 'army.1', name: 'Boundary Hearth' });
  const town = Object.values(state.settlements)[0]!;
  town.population = 8; state.factions[0]!.knowledge = 1000; state.factions[0]!.treasury = 1000;
  return deserializeGame(serializeGame(state));
}
async function importCity(page: Page, state: GameState) {
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'city-witness.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await openRegistry(page, 'settlements');
  await selectFromRegistry(page, 'settlements', /Boundary Hearth/); await openSelectedOrders(page);
}
async function endTurn(page: Page) {
  const turn = await page.evaluate(() => window.__THEANDRIL__!.getTurn());
  await closeManagement(page);
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getTurn())).toBe(turn + 1);
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
}

test('city borders expand through a saved turn while researched tile construction remains paid and worker-controlled', async ({ page }, testInfo) => {
  const state = cityScene(), factionId = state.turnOwnerId, town = Object.values(state.settlements)[0]!;
  // Generate the pre-expansion checkpoint with actual turns, not a granted civic meter. Rules-21
  // boundaries grow in a handful of turns, so stop on the last turn before the next hex is claimed.
  const boundary = () => getObservation(state, factionId).land.settlements[0]!;
  let view = boundary();
  for (let turn = 0; turn < 40 && view.borderExpansion.progress + view.borderExpansion.rate < view.borderExpansion.threshold; turn++) {
    issue(state, { type: 'endTurn', factionId }); view = boundary();
  }
  const claims = view.claimed.length;
  expect(view.borderExpansion.progress).toBeGreaterThan(0);
  expect(view.borderExpansion.progress + view.borderExpansion.rate).toBeGreaterThanOrEqual(view.borderExpansion.threshold);
  const target = view.cells.find(cell => cell.canWork)!.cell, next = view.borderExpansion.nextCell!;
  await importCity(page, state);
  await expect(page.getByTestId('border-growth')).toContainText(`${view.borderExpansion.progress} / ${view.borderExpansion.threshold}`);
  await closeManagement(page);
  await page.getByRole('button', { name: 'Realm progression', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Realm progression' });
  await dialog.getByRole('button', { name: 'Research Seasonal stewardship', exact: true }).click();
  await dialog.getByRole('button', { name: 'Research Sluice waterworks', exact: true }).click();
  await page.keyboard.press('Escape');
  await openSelectedOrders(page);
  await page.getByRole('button', { name: 'Select tiles', exact: true }).click();
  await page.getByRole('button', { name: `Inspect land hex ${target}`, exact: true }).click();
  await page.locator('.land-options > summary').filter({ hasText: 'Tile improvements' }).click();
  const treasury = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.treasury);
  await page.getByRole('button', { name: 'Build Polder', exact: true }).click();
  const paid = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.land.settlements[0]!.work!.coinCost);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.treasury)).toBe(treasury - paid);
  await closeManagement(page);
  await page.getByTestId('campaign-menu').locator('summary').click();
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  const saved = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  await page.reload(); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(saved);
  await openRegistry(page, 'settlements');
  await selectFromRegistry(page, 'settlements', /Boundary Hearth/); await openSelectedOrders(page);
  await endTurn(page);
  const expanded = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.land.settlements[0]!);
  expect(expanded.claimed).toContain(next); expect(expanded.claimed).toHaveLength(claims + 1); expect(expanded.worked).toEqual([]);
  expect(expanded.borderExpansion.threshold).toBe(4 + Math.ceil((claims + 1) / 2));
  expect(await page.evaluate(cell => window.__THEANDRIL__!.getTerrainArt(cell)?.settlementId, next)).toBe(town.id);
  await openSelectedOrders(page);
  await expect(page.getByTestId('land-work')).toContainText('1 / 4 turns');
  for (let turn = 0; turn < 3; turn++) await endTurn(page);
  expect(await page.evaluate(cell => window.__THEANDRIL__!.getTerrainArt(cell)?.improvementId, target)).toBe('improvement.polder');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.land.settlements[0]!.worked)).toEqual([]);
  await openSelectedOrders(page);
  await page.getByRole('button', { name: 'Select tiles', exact: true }).click();
  await page.getByRole('button', { name: `Inspect land hex ${target}`, exact: true }).click();
  await page.getByRole('button', { name: 'Assign worker', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.land.settlements[0]!.worked)).toEqual([target]);
  await closeManagement(page);
  await page.getByTestId('map-container').screenshot({ path: testInfo.outputPath('expanded-city-and-polder.png') });
  await openSelectedOrders(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByTestId('border-growth').scrollIntoViewIfNeeded();
  await expect(page.getByTestId('border-growth')).toBeInViewport();
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await page.screenshot({ path: testInfo.outputPath('city-growth-narrow.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('all five research-gated sites display their approved pixel assets and stable idle chunks', async ({ page }, testInfo) => {
  const state = createGame({ generatorVersion: 4, seed: 17, size: 'tiny', factionCount: 1, pace: 'short' }), factionId = state.turnOwnerId, origin = state.armies['army.1']!.cell;
  const cells = cellsWithin(state, origin, 3).filter(cell => cell !== origin);
  for (const cell of [origin, ...cells]) { state.world.terrain[cell] = 2; state.world.biome[cell] = 2; state.world.waterDepth[cell] = 0; state.world.fertility[cell] = 80; delete state.resources.deposits[cell]; }
  const spring = cells.find(cell => naturalFeatures(state.world, cell) & 1)!;
  expect(spring).toBeDefined();
  const grove = cells.find(cell => cell !== spring && (naturalFeatures(state.world, cell) & 4))!;
  expect(grove).toBeDefined();
  const remaining = cells.filter(cell => cell !== spring && cell !== grove);
  for (const cell of remaining) { state.world.terrain[cell] = 3; state.world.biome[cell] = 6; }
  const ore = remaining.find(cell => naturalFeatures(state.world, cell) & 2)!; expect(ore).toBeDefined();
  const polder = remaining.find(cell => cell !== ore)!, tide = remaining.find(cell => cell !== ore && cell !== polder)!;
  state.world.terrain[polder] = 1; state.world.biome[polder] = 7;
  state.world.terrain[tide] = 0; state.world.biome[tide] = 0; state.world.waterDepth[tide] = 1;
  const sites = [spring, polder, grove, ore, tide];
  issue(state, { type: 'found', factionId, armyId: 'army.1', name: 'Boundary Hearth' });
  const town = Object.values(state.settlements)[0]!; town.population = 8;
  state.factions[0]!.treasury = 20_000; state.factions[0]!.knowledge = 20_000;
  for (const technology of TECHNOLOGIES) issue(state, { type: 'research', factionId, technologyId: technology.id });
  for (const cell of [...cells].sort((a, b) => hexDistance(origin, a, state.world.width) - hexDistance(origin, b, state.world.width) || a - b)) if (!state.land.settlements[town.id]!.claimed.includes(cell)) issue(state, { type: 'claimCell', factionId, settlementId: town.id, cell });
  for (const [index, definition] of IMPROVEMENTS.slice(5, 10).entries()) {
    issue(state, { type: 'improveTile', factionId, settlementId: town.id, cell: sites[index]!, improvementId: definition.id });
    for (let turn = 0; turn < definition.turns; turn++) issue(state, { type: 'endTurn', factionId });
  }
  const checked = deserializeGame(serializeGame(state)); expect(stateHash(checked)).toBe(stateHash(state));
  await importCity(page, checked);
  await closeManagement(page);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().improvementProps)).toBe(5);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()?.state)).toBe('ready');
  await expect(page.getByTestId('art-runtime-status')).not.toHaveAttribute('title', /land improvements lack approved artwork/);
  for (const [index, definition] of IMPROVEMENTS.slice(5, 10).entries()) {
    expect(await page.evaluate(cell => window.__THEANDRIL__!.getTerrainArt(cell), sites[index]!)).toMatchObject({ improvementId: definition.id, improvementPresentation: 'approved' });
    await page.getByTestId('map-container').scrollIntoViewIfNeeded();
    const point = await page.evaluate(cell => window.__THEANDRIL__!.getCellScreenPoint(cell), sites[index]!); expect(point?.inViewport).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`${definition.id}-native.png`), clip: { x: Math.floor(point!.x - 30), y: Math.floor(point!.y - 30), width: 60, height: 60 } });
  }
  await page.getByTestId('map-container').screenshot({ path: testInfo.outputPath('five-researched-sites.png') });
  const rebuilds = await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().chunkRebuilds);
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  expect(await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().chunkRebuilds)).toBe(rebuilds);
  const hash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  for (let step = 0; step < 4; step++) await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await page.getByTestId('map-container').screenshot({ path: testInfo.outputPath('five-researched-sites-near.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Focus selection', exact: true }).click();
  await page.getByTestId('map-container').screenshot({ path: testInfo.outputPath('five-researched-sites-narrow.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);
});
