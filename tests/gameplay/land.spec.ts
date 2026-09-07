import { expect, test, type Page } from '@playwright/test';
import { applyCommand, createGame, deserializeGame, getObservation, serializeGame, type GameState } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { cellsWithin } from '../../packages/sim/src/visibility';
import { prosperityCampaign } from '../../packages/test-fixtures/src/victory-fixture';

function landCampaign(): GameState {
  const state = createGame({ seed: 17, size: 'tiny', pace: 'short', factionCount: 2 });
  // Authored local soil, population and purse isolate UI actions; territory and
  // all subsequent work are created by the actual command rules, not UI mocks.
  for (const cell of cellsWithin(state, state.armies['army.1']!.cell, 3)) {
    state.world.terrain[cell] = 1; state.world.biome[cell] = 1; state.world.waterDepth[cell] = 0; state.world.fertility[cell] = 80;
  }
  for (const [index, armyId] of ['army.1', 'army.3'].entries()) expect(applyCommand(state, { type: 'found', factionId: state.factions[index]!.id, armyId, name: index ? 'Distant reeds' : 'Soil witness' }).ok).toBe(true);
  state.settlements['settlement.5']!.population = 3; state.factions[0]!.treasury = 1000;
  return deserializeGame(serializeGame(state));
}
async function selectTown(page: Page) {
  await page.getByRole('tab', { name: /Settlements/ }).click();
  await page.getByTestId('settlement-registry').getByRole('button', { name: /Soil witness/ }).click();
}
async function selectLand(page: Page, cell: number) {
  const tiles = page.getByRole('button', { name: 'Select tiles', exact: true });
  if (await tiles.getAttribute('aria-expanded') !== 'true') await tiles.click();
  await page.getByRole('button', { name: `Inspect land hex ${cell}`, exact: true }).click();
  await expect(page.getByTestId('land-cell')).toContainText(`Hex ${cell}`);
}
async function nextTurn(page: Page) {
  const turn = await page.evaluate(() => window.__THEANDRIL__!.getTurn());
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getTurn())).toBe(turn + 1);
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
}

test('territory clicks, paid work, cultivation and saved continuation remain playable at narrow width', async ({ page }, testInfo) => {
  const state = landCampaign(), initial = getObservation(state, state.turnOwnerId), town = initial.land.settlements[0]!;
  const claim = town.cells.find(cell => cell.claim.canStart)!, owned = town.cells.find(cell => cell.canWork)!;
  expect(claim).toBeTruthy(); expect(owned).toBeTruthy();
  await page.goto('/'); await page.locator('input[type=file]').setInputFiles({ name: 'land-witness.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  const armiesBefore = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.ownArmies.map(army => ({ id: army.id, cell: army.cell, movement: army.movement })));
  await selectTown(page); await expect(page.getByTestId('settlement-stage')).toHaveText('settlement · Capital');
  const culture = page.getByTestId('realm-culture');
  await expect(culture).not.toHaveAttribute('open');
  await culture.locator(':scope > summary').click();
  await expect(culture.getByTestId('faction-identity')).toHaveAttribute('data-definition-id', 'faction.ashen_compact');
  await expect(culture.getByRole('list', { name: 'Biome affinities' })).toContainText('+1 food');
  await expect(culture.getByRole('list', { name: 'Biome affinities' })).toContainText('−1 food');
  await culture.locator(':scope > summary').click();
  await page.getByTestId('map-container').scrollIntoViewIfNeeded();
  const point = await page.evaluate(cell => window.__THEANDRIL__!.getCellScreenPoint(cell), owned.cell);
  expect(point?.inViewport).toBe(true); await page.mouse.click(point!.x, point!.y);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSelection())).toEqual({ settlementId: 'settlement.5', cell: owned.cell });
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.ownArmies.map(army => ({ id: army.id, cell: army.cell, movement: army.movement })))).toEqual(armiesBefore);
  const cost = owned.improvementOptions.find(option => option.improvementId === 'improvement.terraced_fields')!;
  await page.getByRole('button', { name: 'Assign worker', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.land.settlements[0]!.worked)).toEqual([owned.cell]);
  await selectLand(page, claim.cell);
  await page.getByRole('button', { name: `Claim hex ${claim.cell} · ${claim.claim.coinCost} coin`, exact: true }).click();
  await expect.poll(() => page.evaluate(cell => window.__THEANDRIL__!.getTerrainArt(cell)?.settlementId, claim.cell)).toBe('settlement.5');
  await selectLand(page, owned.cell);
  await page.locator('.land-options').filter({ has: page.locator('summary', { hasText: 'Tile improvements' }) }).locator('summary').click();
  await page.getByRole('button', { name: 'Build Terraced fields', exact: true }).click();
  await expect(page.getByTestId('land-work')).toContainText(`${cost.coinCost} coin paid`);
  const options = page.locator('.campaign-options'); await options.locator('summary').click();
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click(); await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  const saved = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  await page.reload(); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(saved);
  await selectTown(page); await expect(page.getByTestId('land-work')).toContainText('0 / 2 turns');
  await nextTurn(page); await nextTurn(page);
  await expect(page.getByTestId('land-work')).toHaveCount(0);
  await expect.poll(() => page.evaluate(cell => window.__THEANDRIL__!.getTerrainArt(cell)?.improvementId, owned.cell)).toBe('improvement.terraced_fields');
  await selectLand(page, owned.cell);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().improvementProps ?? 0)).toBeGreaterThan(0);
  const atlasBytes = await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().residentAtlasBytesEstimate);
  await page.locator('.campaign-options > summary').click();
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click(); await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  const improvedHash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  // Load without a page reload: old chunk sprites return to the shared pool and
  // are reused by replacement chunks, while the verified atlas stays resident.
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(improvedHash);
  await selectTown(page); await selectLand(page, owned.cell);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().improvementProps ?? 0)).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().residentAtlasBytesEstimate)).toBe(atlasBytes);
  await page.getByTestId('map-container').screenshot({ path: testInfo.outputPath('territory-and-recycled-improvement.png') });
  // A separate unimproved tile can change biome without invalidating fields.
  await selectLand(page, claim.cell); await page.locator('.land-options summary').filter({ hasText: 'Cultivate biome' }).click();
  await page.getByRole('button', { name: 'Cultivate Temperate forest', exact: true }).click();
  await expect(page.getByTestId('land-work')).toContainText('Cultivate Temperate forest');
  await page.getByRole('button', { name: 'Cancel land work · no refund', exact: true }).click();
  await expect(page.getByTestId('land-work')).toHaveCount(0);
  await page.getByRole('button', { name: 'Cultivate Temperate forest', exact: true }).click();
  for (let turn = 0; turn < 3; turn++) await nextTurn(page);
  await expect.poll(() => page.evaluate(cell => window.__THEANDRIL__!.getTerrainArt(cell)?.biome, claim.cell)).toBe(2);
  await page.setViewportSize({ width: 390, height: 844 }); await selectLand(page, owned.cell);
  await expect(page.getByTestId('land-cell')).toContainText('Final tile yield');
  await page.getByTestId('land-cell').scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('worked-territory-narrow.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const rebuilds = await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().chunkRebuilds);
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  expect(await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().chunkRebuilds)).toBe(rebuilds);
});

test('capital designation is paid and independent of colony, settlement and city size', async ({ page }) => {
  const state = prosperityCampaign(), view = getObservation(state, state.turnOwnerId);
  const target = view.land.settlements.find(town => !town.isCapital)!;
  // Population is authored for the stage witness; the new capital uses its real command.
  state.settlements['settlement.5']!.population = 8;
  state.settlements[target.settlementId]!.population = 1;
  const checked = deserializeGame(serializeGame(state));
  await page.goto('/'); await page.locator('input[type=file]').setInputFiles({ name: 'capital-witness.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(checked))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await page.getByRole('tab', { name: /Settlements/ }).click();
  await page.getByTestId('settlement-registry').getByRole('button', { name: /Ledger Hearth/ }).click();
  await expect(page.getByTestId('settlement-stage')).toHaveText('city · Capital');
  await page.getByTestId('settlement-registry').getByRole('button', { name: new RegExp(state.settlements[target.settlementId]!.name) }).click();
  await expect(page.getByTestId('settlement-stage')).toHaveText('colony');
  const coin = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.treasury);
  await page.getByRole('button', { name: `Designate capital · ${target.capitalOption.coinCost} coin`, exact: true }).click();
  await expect(page.getByTestId('settlement-stage')).toHaveText('colony · Capital');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.treasury)).toBe(coin - target.capitalOption.coinCost);
  await page.getByTestId('settlement-registry').getByRole('button', { name: /Ledger Hearth/ }).click();
  await expect(page.getByTestId('settlement-stage')).toHaveText('city');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.land.settlements.filter(town => town.isCapital).length)).toBe(1);
});
