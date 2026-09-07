import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { applyCommand, deserializeGame, getObservation, serializeGame, stateHash } from '@theandril/sim';
import { hexDistance, neighbors } from '@theandril/mapgen';
import { exportSave } from '@theandril/persistence';
import { borderBattleCampaign } from '../../packages/test-fixtures/src/combat-fixture';
import { refreshAuthoredSight } from '../../packages/test-fixtures/src/authored-land';
import { cellsWithin } from '../../packages/sim/src/visibility';

/** Authored terrain/population/funds isolate presentation; all claims use public paid commands. */
function readabilityCampaign() {
  const state = borderBattleCampaign(), factionId = state.turnOwnerId;
  const town = Object.values(state.settlements).find(item => item.factionId === factionId)!;
  const player = state.armies['army.2']!, enemy = state.armies['army.4']!;
  town.name = 'The Hearth of the Western Oathkeepers'; town.population = 8;
  state.factions[0]!.treasury = 20_000;
  const cells = cellsWithin(state, town.cell, 3);
  for (const cell of cells) { state.world.terrain[cell] = 1; state.world.biome[cell] = 1; state.world.fertility[cell] = 80; state.world.waterDepth[cell] = 0; }
  // Keep the other culture's existing remote town unseen; its nearby envoy is truly visible.
  enemy.cell = Object.values(state.settlements).find(item => item.factionId === enemy.factionId)!.cell;
  refreshAuthoredSight(state);
  for (const cell of [...cells].sort((a, b) => hexDistance(town.cell, a, state.world.width) - hexDistance(town.cell, b, state.world.width) || a - b)) if (!state.land.settlements[town.id]!.claimed.includes(cell)) {
    const result = applyCommand(state, { type: 'claimCell', factionId, settlementId: town.id, cell });
    if (!result.ok) throw new Error(`Readability fixture cannot claim ${cell}: ${result.error}`);
  }
  const neighborsOfTown = neighbors(town.cell, state.world.width, state.world.height);
  player.cell = neighborsOfTown[0]!;
  enemy.cell = neighbors(player.cell, state.world.width, state.world.height).find(cell => cell !== town.cell && cells.includes(cell))!;
  enemy.name = 'Reedbound Envoys of the Marshward Council';
  refreshAuthoredSight(state);
  const checked = deserializeGame(serializeGame(state)), view = getObservation(checked, factionId);
  expect(view.land.settlements[0]!.claimed).toHaveLength(37);
  expect(view.armies.some(army => army.id === enemy.id)).toBe(true);
  expect(view.settlements.every(item => item.factionId === factionId)).toBe(true);
  return { state: checked, town, player, enemy, cells };
}

test('realm perimeters and contextual names stay quiet while real selection, hover, range and land inspection remain clear', async ({ page }, testInfo) => {
  const { state, town, player, enemy, cells } = readabilityCampaign(), hash = stateHash(state);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'readable-border.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()?.state)).toBe('ready');
  await page.getByRole('tab', { name: /Settlements/ }).click();
  await page.getByTestId('settlement-registry').getByRole('button', { name: new RegExp(town.name) }).click();
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()?.overlays.labels.every(label => label.settlement))).toBe(true);
  const quiet = await page.evaluate(() => ({ art: window.__THEANDRIL__!.getArtDiagnostics(), metrics: window.__THEANDRIL__!.getPerformanceCounters() }));
  expect(quiet.art?.overlays).toMatchObject({ territoryMode: 'realm-perimeter', ambientGrid: false, unselectedRings: false });
  expect(quiet.art?.overlays.labels.find(label => label.id === town.id)).toMatchObject({ name: town.name, text: expect.stringContaining('…') });
  expect(quiet.art?.overlays.labels.some(label => label.id === enemy.id)).toBe(false);
  expect(quiet.metrics.territoryEdges).toBe(42); // A radius-three realm, not 37 individually outlined hexes.
  expect(quiet.metrics.selectedCells).toBe(0);
  await page.getByTestId('map-container').screenshot({ path: testInfo.outputPath('quiet-realm-perimeter.png') });

  // Hover an actually visible foreign army: no selected army means no movement order is possible.
  await page.getByTestId('map-container').scrollIntoViewIfNeeded();
  const enemyPoint = await page.evaluate(cell => window.__THEANDRIL__!.getCellScreenPoint(cell), enemy.cell);
  expect(enemyPoint?.inViewport).toBe(true); await page.mouse.move(enemyPoint!.x, enemyPoint!.y);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()?.overlays.labels.some(label => label.id === 'army.4' && label.priority === 1))).toBe(true);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);

  await page.getByRole('tab', { name: /Armies/ }).click();
  await page.getByTestId('army-registry').getByRole('button', { name: new RegExp(player.name) }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().highlightedCells ?? 0)).toBeGreaterThan(6);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()?.overlays.labels.some(label => label.id === 'army.2' && label.priority === 0))).toBe(true);
  const range = await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters());
  expect(range.rangePerimeterEdges).toBeGreaterThan(0); expect(range.rangePerimeterEdges).toBeLessThan(range.highlightedCells! * 6);
  expect(range.selectedCells).toBe(1);
  await page.getByTestId('map-container').screenshot({ path: testInfo.outputPath('selected-army-perimeter-range.png') });

  // A real claimed-hex click still resolves the town inspector; display changes cannot issue orders.
  await page.keyboard.press('Escape');
  const tile = cells.find(cell => cell !== town.cell && cell !== player.cell && cell !== enemy.cell && neighbors(cell, state.world.width, state.world.height).some(adjacent => !cells.includes(adjacent)))!;
  const point = await page.evaluate(cell => window.__THEANDRIL__!.getCellScreenPoint(cell), tile);
  expect(point?.inViewport).toBe(true); await page.mouse.click(point!.x, point!.y);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSelection())).toEqual({ settlementId: town.id, cell: tile });
  await expect(page.getByTestId('land-cell')).toContainText(`Hex ${tile}`);
  await expect(page.getByRole('tab', { name: /Settlements/ })).toHaveAttribute('aria-selected', 'true');
  expect(await page.evaluate(cell => window.__THEANDRIL__!.getTerrainArt(cell)?.settlementId, tile)).toBe(town.id);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);

  // Inspecting a claimed tile must not trap the user in town mode: clicking the
  // actual friendly army still selects it, without moving or issuing an order.
  const playerPoint = await page.evaluate(cell => window.__THEANDRIL__!.getCellScreenPoint(cell), player.cell);
  expect(playerPoint?.inViewport).toBe(true); await page.mouse.click(playerPoint!.x, playerPoint!.y);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSelection())).toEqual({ armyId: player.id, cell: player.cell });
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);
  await page.keyboard.press('Escape');
  const candidates = neighbors(tile, state.world.width, state.world.height).filter(cell => !cells.includes(cell) && cell !== enemy.cell && cell !== player.cell);
  const unclaimed = (await page.evaluate(cells => cells.map(cell => ({ cell, point: window.__THEANDRIL__!.getCellScreenPoint(cell) })), candidates)).find(item => item.point?.inViewport);
  expect(unclaimed).toBeDefined();
  await page.mouse.click(unclaimed!.point!.x, unclaimed!.point!.y);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSelection())).toEqual({ cell: unclaimed!.cell });
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);
  await page.mouse.click(point!.x, point!.y);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSelection())).toEqual({ settlementId: town.id, cell: tile });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByTestId('map-container').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Focus selection', exact: true }).click();
  await page.getByTestId('map-container').screenshot({ path: testInfo.outputPath('quiet-territory-narrow.png') });
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()?.lod)).toBe('strategic-glyphs');
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()?.overlays.labels.every(label => label.priority < 2))).toBe(true);
  const final = await page.evaluate(() => ({ art: window.__THEANDRIL__!.getArtDiagnostics(), metrics: window.__THEANDRIL__!.getPerformanceCounters(), hash: window.__THEANDRIL__!.getStateHash() }));
  expect(final.hash).toBe(hash); expect(final.metrics.visibleLabels).toBeLessThanOrEqual(32);
  expect(final.metrics.cachedChunks).toBeLessThanOrEqual(64);
  const evidence = testInfo.outputPath('map-readability-overlays.json');
  await writeFile(evidence, JSON.stringify({ scope: 'Authored local radius-three town and one visible envoy. Presentation-only interactions; not a frame-time benchmark.', hash, quiet, range, final }, null, 2));
  await testInfo.attach('map-readability-overlays.json', { path: evidence, contentType: 'application/json' });
  expect(errors).toEqual([]);
});
