import { closeManagement, openRegistry, selectFromRegistry, openSelectedOrders } from './ui-navigation';
import { expect, test, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { deserializeGame, getObservation, getSettlementLandObservation, serializeGame, stateHash } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { cellsWithin } from '../../packages/sim/src/visibility';
import { prosperityCampaign } from '../../packages/test-fixtures/src/victory-fixture';
import { refreshAuthoredSight } from '../../packages/test-fixtures/src/authored-land';
import { empireLandCampaign } from '../../packages/test-fixtures/src/empire-land-fixture';

function campaign() {
  const state = prosperityCampaign();
  // Author stable local soil and funds only. Claims, work and every action after
  // import still use the real simulation. Re-seed the authored visible memory.
  for (const town of Object.values(state.settlements).filter(town => town.factionId === state.turnOwnerId)) {
    town.population = 3;
    for (const cell of cellsWithin(state, town.cell, 3)) {
      state.world.terrain[cell] = 1; state.world.biome[cell] = 1;
      state.world.waterDepth[cell] = 0; state.world.fertility[cell] = 80;
      delete state.resources.deposits[cell]; // Preserve generated deposits outside authored soil.
    }
  }
  state.factions.find(faction => faction.id === state.turnOwnerId)!.treasury = 2000;
  refreshAuthoredSight(state);
  return deserializeGame(serializeGame(state));
}
async function importCampaign(page: Page, text: string) {
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'land-query.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(text)) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await openRegistry(page, 'settlements');
}
async function ready(page: Page, settlementId: string) {
  await openSelectedOrders(page);
  await expect.poll(() => page.evaluate(() => {
    const panel = document.querySelector<HTMLElement>('[data-testid="land-panel"]');
    const currentHash = window.__THEANDRIL__!.getStateHash(), queryHash = panel?.dataset.queryHash;
    return { settlementId: panel?.dataset.settlementId, status: panel?.dataset.queryState,
      currentHash, queryHash, matchesCurrent: Boolean(currentHash) && queryHash === currentHash };
  })).toMatchObject({ settlementId, status: 'ready', matchesCurrent: true });
}
async function selectTown(page: Page, town: { id: string; name: string }) {
  await openRegistry(page, 'settlements');
  await selectFromRegistry(page, 'settlements', new RegExp(town.name)); await openSelectedOrders(page);
  await ready(page, town.id);
}
async function selectTile(page: Page, cell: number) {
  const button = page.getByRole('button', { name: 'Select tiles', exact: true });
  if (await button.getAttribute('aria-expanded') !== 'true') await button.click();
  await page.getByRole('button', { name: `Inspect land hex ${cell}`, exact: true }).click();
  await expect(page.getByTestId('land-cell')).toContainText(`Hex ${cell}`);
}
async function openImprovements(page: Page) {
  const details = page.locator('.land-options').filter({ has: page.locator('summary', { hasText: 'Tile improvements' }) });
  if (await details.getAttribute('open') === null) await details.locator('summary').click();
  return details;
}
async function settings(page: Page) {
  await closeManagement(page);
  const panel = page.locator('.campaign-options');
  if (await panel.getAttribute('open') === null) await panel.locator('summary').click();
}
async function endTurn(page: Page) {
  const turn = await page.evaluate(() => window.__THEANDRIL__!.getTurn());
  await closeManagement(page);
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getTurn())).toBe(turn + 1);
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
}

test('selected-town queries are reused for tile clicks and fast registry changes never retain another town’s options', async ({ page }, testInfo) => {
  const state = campaign(), view = getObservation(state, state.turnOwnerId);
  const towns = view.settlements.filter(town => town.factionId === view.factionId);
  const first = towns[0]!, second = towns[1]!, third = towns[2]!;
  const cells = view.land.settlements.find(town => town.settlementId === first.id)!.cells.filter(cell => cell.claimed).slice(0, 3);
  await importCampaign(page, serializeGame(state));
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.land.settlements.every(town => town.cells.length === 0))).toBe(true);
  await selectTown(page, first);
  const count = await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().landQueryCount);
  for (const cell of cells) await selectTile(page, cell.cell);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().landQueryCount)).toBe(count);
  // Click without awaiting details between changes; correctness also has reversed
  // asynchronous-response unit witnesses rather than assuming worker timing.
  for (const town of [second, first, third, second]) {
    await selectFromRegistry(page, 'settlements', town.name);
    await openSelectedOrders(page); // Mount the query owner, without waiting for its response.
  }
  await ready(page, second.id);
  await expect(page.getByTestId('land-cell')).toContainText(`Hex ${second.cell}`);
  const options = view.land.settlements.find(town => town.settlementId === second.id)!.cells;
  const select = page.getByRole('button', { name: 'Select tiles', exact: true });
  if (await select.getAttribute('aria-expanded') !== 'true') await select.click();
  await expect(page.getByRole('region', { name: 'Settlement territory' }).getByRole('button', { name: /Inspect land hex/ })).toHaveCount(options.length);
  for (const cell of options) await expect(page.getByRole('button', { name: `Inspect land hex ${cell.cell}`, exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.cells.length)).toBe(0);
  await page.getByTestId('land-panel').screenshot({ path: testInfo.outputPath('selected-town-current-details.png') });
});

test('same-turn land orders refresh quotes, cancellation spends honestly and saved pending work restores at narrow width', async ({ page }, testInfo) => {
  const state = campaign(), view = getObservation(state, state.turnOwnerId);
  const town = view.settlements.find(town => town.factionId === view.factionId)!;
  const detail = view.land.settlements.find(item => item.settlementId === town.id)!;
  const tile = detail.cells.find(cell => cell.canWork && cell.improvementOptions.some(option => option.improvementId === 'improvement.terraced_fields' && option.canStart))!;
  const other = detail.cells.find(cell => cell.cell !== tile.cell && cell.canWork && cell.improvementOptions.some(option => option.improvementId === 'improvement.terraced_fields' && option.canStart))!;
  expect(tile).toBeTruthy(); expect(other).toBeTruthy();
  const price = tile.improvementOptions.find(option => option.improvementId === 'improvement.terraced_fields')!.coinCost;
  const otherInitialPrice = other.improvementOptions.find(option => option.improvementId === 'improvement.terraced_fields')!.coinCost;
  await importCampaign(page, serializeGame(state)); await selectTown(page, town); await selectTile(page, tile.cell);
  const initialTurn = await page.evaluate(() => window.__THEANDRIL__!.getTurn());
  const before = await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().landQueryCount);
  await page.getByRole('button', { name: 'Assign worker', exact: true }).click(); await ready(page, town.id);
  await expect(page.getByRole('button', { name: 'Remove worker', exact: true })).toBeEnabled();
  expect(await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().landQueryCount)).toBe(before + 1);
  const coin = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.treasury);
  await openImprovements(page);
  await page.getByRole('button', { name: 'Build Terraced fields', exact: true }).click(); await ready(page, town.id);
  await expect(page.getByTestId('land-work')).toContainText(`${price} coin paid`);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getTurn())).toBe(initialTurn);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.treasury)).toBe(coin - price);
  await openImprovements(page); await expect(page.getByRole('button', { name: 'Build Terraced fields', exact: true })).toBeDisabled();
  await settings(page); await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  const savedHash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  await openSelectedOrders(page);
  await page.getByRole('button', { name: 'Cancel land work · no refund', exact: true }).click(); await ready(page, town.id);
  await expect(page.getByTestId('land-work')).toHaveCount(0);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.treasury)).toBe(coin - price);
  await openImprovements(page); await expect(page.getByRole('button', { name: 'Build Terraced fields', exact: true })).toBeEnabled();
  await settings(page); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(savedHash);
  await selectTown(page, town); await selectTile(page, tile.cell); await openImprovements(page);
  await expect(page.getByTestId('land-work')).toContainText('0 / 2 turns completed');
  await expect(page.getByRole('button', { name: 'Build Terraced fields', exact: true })).toBeDisabled();
  await endTurn(page); await endTurn(page); await ready(page, town.id);
  await expect(page.getByTestId('land-work')).toHaveCount(0);
  await selectTile(page, other.cell); const improvements = await openImprovements(page);
  const quote = improvements.locator('.land-option').filter({ has: page.getByRole('button', { name: 'Build Terraced fields', exact: true }) });
  await expect(quote).toContainText(`${otherInitialPrice + 3} coin upfront`);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.land.settlements.every(item => item.cells.length === 0))).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Build Terraced fields', exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('current-land-quotes-narrow.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Build Terraced fields', exact: true }).click(); await ready(page, town.id);
  await expect(page.getByTestId('land-work')).toContainText(`${otherInitialPrice + 3} coin paid`);
});

test('a mature thirty-two-town empire transfers summaries and opens only the searched town detail', async ({ page }, testInfo) => {
  const state = empireLandCampaign('huge'), towns = Object.values(state.settlements).filter(town => town.factionId === state.turnOwnerId);
  const target = towns.at(-1)!;
  const anchored = getSettlementLandObservation(state, state.turnOwnerId, target.id, { offset: 0, limit: 24, cell: target.cell })!;
  const total = anchored.cellWindow!.total;
  const pages = Array.from({ length: Math.ceil(total / 24) }, (_, index) => getSettlementLandObservation(state, state.turnOwnerId, target.id, { offset: index * 24, limit: 24 })!);
  expect(anchored.cellWindow!.offset).toBeGreaterThan(0); // Selection must locate a later page, not silently default to page one.
  await importCampaign(page, serializeGame(state));
  const initial = await page.evaluate(() => ({ summary: window.__THEANDRIL__!.getSummary()!.land, metrics: window.__THEANDRIL__!.getPerformanceCounters() }));
  expect(initial.summary.settlements).toHaveLength(32);
  expect(initial.summary.settlements.every(town => town.cells.length === 0 && town.claimed.length === 37)).toBe(true);
  expect(initial.metrics.landQueryCount).toBe(0);
  await page.getByRole('searchbox', { name: 'Search your realm' }).fill(target.name);
  await selectTown(page, target);
  const metrics = await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters());
  expect(metrics.landQueryCount).toBe(1); expect(metrics.landQueryBytes).toBeGreaterThan(0);
  expect(metrics.landQueryBytes).toBeLessThan(200_000);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.land.settlements.every(town => town.cells.length === 0))).toBe(true);
  await expect(page.getByTestId('land-cell')).toContainText(`Hex ${target.cell}`);
  await page.getByRole('button', { name: 'Select tiles', exact: true }).click();
  const navigation = page.getByRole('navigation', { name: 'Territory tile pages', exact: true });
  const tileButtons = page.getByRole('region', { name: 'Settlement territory' }).getByRole('button', { name: /Inspect land hex/ });
  let queryCount = 1;
  const samples: { offset: number; count: number; bytes: number }[] = [];
  const checkPage = async (detail: typeof anchored) => {
    await ready(page, target.id);
    const range = detail.cellWindow!;
    await expect(navigation).toContainText(`Tiles ${range.offset + 1}–${Math.min(total, range.offset + range.limit)} of ${total}`);
    await expect(tileButtons).toHaveCount(detail.cells.length);
    expect(await tileButtons.evaluateAll(buttons => buttons.map(button => Number(button.getAttribute('aria-label')!.replace('Inspect land hex ', ''))))).toEqual(detail.cells.map(cell => cell.cell));
    const actual = await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters());
    expect(actual.landQueryCount).toBe(queryCount);
    expect(actual.landQueryBytes).toBeGreaterThan(0);
    expect(actual.landQueryBytes).toBeLessThan(200_000);
    samples.push({ offset: range.offset, count: detail.cells.length, bytes: actual.landQueryBytes });
  };
  await checkPage(anchored);
  for (let index = anchored.cellWindow!.offset / 24; index > 0; index--) {
    await navigation.getByRole('button', { name: 'Previous tiles', exact: true }).click();
    queryCount++;
    await checkPage(pages[index - 1]!);
  }
  await expect(navigation.getByRole('button', { name: 'Previous tiles', exact: true })).toBeDisabled();
  // Capture the real dialog viewport; the full land element is taller than its
  // scrolling container, so an element screenshot clips content outside it.
  await navigation.evaluate(element => element.scrollIntoView({ block: 'start' }));
  await page.getByRole('dialog', { name: 'Selected orders', exact: true }).screenshot({ path: testInfo.outputPath('mature-empire-24-tile-page.png') });
  const visited: number[] = [];
  for (let index = 0; index < pages.length; index++) {
    const detail = pages[index]!;
    if (index) {
      await navigation.getByRole('button', { name: 'Next tiles', exact: true }).click();
      queryCount++;
      await checkPage(detail);
    }
    for (const tile of [detail.cells[0]!, detail.cells.at(-1)!]) await selectTile(page, tile.cell);
    expect(await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().landQueryCount)).toBe(queryCount);
    visited.push(...detail.cells.map(cell => cell.cell));
  }
  expect(visited).toHaveLength(total);
  expect(new Set(visited).size).toBe(total);
  await expect(navigation.getByRole('button', { name: 'Next tiles', exact: true })).toBeDisabled();
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(stateHash(state));
  await navigation.evaluate(element => element.scrollIntoView({ block: 'start' }));
  await page.getByRole('dialog', { name: 'Selected orders', exact: true }).screenshot({ path: testInfo.outputPath('mature-empire-final-tile-page.png') });
  const after = await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters());
  const reportPath = testInfo.outputPath('selected-town-transfer.json');
  await writeFile(reportPath, JSON.stringify({ towns: towns.length, total, pageLimit: 24, stateHash: stateHash(state), visitedCells: visited, before: initial.metrics, selected: metrics, after, samples }, null, 2));
  await testInfo.attach('selected-town-transfer.json', { path: reportPath, contentType: 'application/json' });
});
