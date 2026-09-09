import { expect, test, type Page } from '@playwright/test';
import { RESOURCES } from '@theandril/content';
import { serializeGame, type GameState } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { grainResourceCampaign, politicalOverviewCampaign } from '../../packages/test-fixtures/src/resource-fixture';
import { borderBattleCampaign } from '../../packages/test-fixtures/src/combat-fixture';
import { closeCampaignOptions, closeManagement, openRealmAffairs, openSelectedOrders, selectFromRegistry } from './ui-navigation';

const summary = (page: Page) => page.evaluate(() => window.__THEANDRIL__!.getSummary()!);
const grainStock = async (page: Page) => (await summary(page)).resources!.stockpiles.find(stock => stock.resourceId === 'resource.grain')!;
const progression = (page: Page) => page.getByRole('dialog', { name: 'Realm progression', exact: true });
async function load(page: Page, state: GameState) {
  await page.goto('/');
  await page.getByLabel('Import save file').setInputFiles({ name: 'resources-overview.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()?.state)).toBe('ready');
}
async function inspectLand(page: Page, cell: number) {
  await openSelectedOrders(page);
  await expect(page.getByTestId('land-panel')).toHaveAttribute('data-query-state', 'ready');
  const tiles = page.getByRole('button', { name: 'Select tiles', exact: true });
  if (await tiles.getAttribute('aria-expanded') !== 'true') await tiles.click();
  await page.getByRole('button', { name: `Inspect land hex ${cell}`, exact: true }).click();
  await expect(page.getByTestId('land-cell')).toContainText(`Hex ${cell}`);
}
async function nextTurn(page: Page) {
  const turn = (await summary(page)).turn;
  await closeManagement(page); await closeCampaignOptions(page);
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect.poll(async () => (await summary(page)).turn).toBe(turn + 1);
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
}
async function openResources(page: Page) {
  await closeManagement(page); await closeCampaignOptions(page);
  await page.getByRole('button', { name: 'Realm progression', exact: true }).click();
  await progression(page).getByRole('tab', { name: 'Resources', exact: true }).click();
  await expect(page.getByTestId('resource-panel')).toBeVisible();
}

test('a generated grain deposit becomes paid worked grange art, produces stocks and sells through a saved narrow market', async ({ page }, info) => {
  const fixture = grainResourceCampaign();
  expect(fixture.marketCost).toBeGreaterThan(0);
  await load(page, fixture.state); await selectFromRegistry(page, 'settlements', fixture.townName);
  await expect.poll(() => page.evaluate(cell => window.__THEANDRIL__!.getArtDiagnostics()!.tileFootprints.find(item => item.cell === cell && item.contentId === 'resource.grain')?.presentation, fixture.deposit)).toBe('approved');
  expect(await page.evaluate(cell => window.__THEANDRIL__!.getTerrainArt(cell)?.resourceId, fixture.deposit)).toBe('resource.grain');
  expect((await grainStock(page)).amount).toBe(0);
  await page.getByTestId('map-container').screenshot({ path: info.outputPath('generated-grain-deposit.png') });
  await inspectLand(page, fixture.deposit);
  const improvements = page.locator('.land-options').filter({ has: page.locator('summary', { hasText: 'Tile improvements' }) });
  if (await improvements.getAttribute('open') === null) await improvements.locator('summary').click();
  const before = (await summary(page)).treasury;
  await improvements.getByRole('button', { name: `Build ${fixture.quote.name}`, exact: true }).click();
  await expect(page.getByTestId('land-work')).toContainText(`${fixture.quote.coinCost} coin paid`);
  expect((await summary(page)).treasury).toBe(before - fixture.quote.coinCost);
  await page.getByRole('button', { name: 'Assign worker', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Remove worker', exact: true })).toBeEnabled();
  for (let turn = 0; turn < fixture.quote.turns; turn++) await nextTurn(page);
  expect(await page.evaluate(cell => window.__THEANDRIL__!.getTerrainArt(cell)?.improvementId, fixture.deposit)).toBe('improvement.grange');
  await expect.poll(() => page.evaluate(cell => window.__THEANDRIL__!.getArtDiagnostics()!.tileFootprints.find(item => item.cell === cell && item.contentId === 'improvement.grange')?.presentation, fixture.deposit)).toBe('approved');
  expect(await page.evaluate(cell => window.__THEANDRIL__!.getArtDiagnostics()!.tileFootprints.some(item => item.cell === cell && item.contentId === 'resource.grain'), fixture.deposit)).toBe(false);
  const completed = (await grainStock(page)).amount;
  await nextTurn(page);
  expect((await grainStock(page)).amount).toBe(completed + 3); expect((await grainStock(page)).perTurn).toBe(3);
  await page.getByTestId('map-container').screenshot({ path: info.outputPath('completed-worked-grange.png') });
  await openResources(page);
  const panel = page.getByTestId('resource-panel');
  await expect(panel.locator('[data-art-content-id^="resource."]')).toHaveCount(8);
  for (const resource of RESOURCES) await expect(panel.locator(`[data-art-content-id="${resource.id}"]`)).toHaveAttribute('data-art-state', 'ready');
  const stockCard = page.getByTestId('stockpile-resource.grain');
  await expect(stockCard).toContainText('+3 / turn');
  await stockCard.getByRole('spinbutton', { name: 'Hearthgrain sale quantity', exact: true }).fill('2');
  const stock = (await grainStock(page)).amount, coin = (await summary(page)).treasury;
  await stockCard.getByRole('button', { name: 'Sell for 4 coin', exact: true }).click();
  await expect.poll(async () => (await grainStock(page)).amount).toBe(stock - 2);
  expect((await summary(page)).treasury).toBe(coin + 4);
  await progression(page).screenshot({ path: info.outputPath('resource-market-ledger.png') });
  await progression(page).getByRole('button', { name: 'Close realm progression', exact: true }).click();
  const menu = page.getByTestId('campaign-menu');
  if (await menu.getAttribute('open') === null) await menu.locator('summary').click();
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  const savedHash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  await page.reload(); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(savedHash);
  expect((await grainStock(page)).amount).toBe(stock - 2);
  await page.setViewportSize({ width: 390, height: 844 }); await openResources(page);
  expect(await progression(page).evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  await progression(page).screenshot({ path: info.outputPath('resource-market-390.png') });
});

test('political overview and realm filters change only the map presentation, with an accessible narrow legend', async ({ page }, info) => {
  const state = politicalOverviewCampaign(); await load(page, state);
  const initial = await page.evaluate(() => {
    const api = window.__THEANDRIL__!, view = api.getSummary()!, metrics = api.getPerformanceCounters();
    return { hash: api.getStateHash(), explored: view.exploredCells, turn: view.turn, events: view.events, bytes: metrics.totalTransferBytes, commandMs: metrics.commandMs };
  });
  const view = await summary(page), realmIds = view.factions.map(faction => faction.id).sort();
  expect(realmIds).toHaveLength(2);
  const control = page.getByTestId('faction-overview-control');
  await control.locator(':scope > summary').click();
  await control.getByRole('button', { name: 'Realms', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getWorldOverview()?.mode)).toBe('political');
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()?.lod)).toBe('world-overview');
  await expect(control.getByRole('checkbox')).toHaveCount(2);
  for (const faction of view.factions) await expect(control.getByRole('checkbox', { name: faction.name, exact: true })).toBeChecked();
  const foreign = view.factions.find(faction => faction.id !== view.factionId)!;
  await control.getByRole('checkbox', { name: foreign.name, exact: true }).uncheck();
  expect(await page.evaluate(() => window.__THEANDRIL__!.getWorldOverview()!.factionIds)).toEqual([view.factionId]);
  await control.getByRole('button', { name: 'Clear realms', exact: true }).click();
  expect(await page.evaluate(() => window.__THEANDRIL__!.getWorldOverview()!.factionIds)).toEqual([]);
  await control.getByRole('button', { name: 'All known realms', exact: true }).click();
  expect(await page.evaluate(() => window.__THEANDRIL__!.getWorldOverview()!.factionIds)).toBeUndefined();
  await page.screenshot({ path: info.outputPath('known-realm-political-overview.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await control.getByRole('button', { name: 'Fit world map', exact: true }).click();
  await expect(control.getByRole('group', { name: 'Visible realm colors', exact: true })).toBeVisible();
  expect(await control.locator('.overview-controls').evaluate(element => { const bounds = element.getBoundingClientRect(), map = element.closest('.map-section')!.getBoundingClientRect(); return bounds.left >= 0 && bounds.right <= window.innerWidth && bounds.top >= map.top && bounds.bottom <= map.bottom && element.scrollWidth <= element.clientWidth + 1; })).toBe(true);
  await page.screenshot({ path: info.outputPath('political-overview-390.png') });
  await control.locator(':scope > summary').click();
  await page.screenshot({ path: info.outputPath('political-map-390.png') });
  const unchanged = await page.evaluate(() => {
    const api = window.__THEANDRIL__!, view = api.getSummary()!, metrics = api.getPerformanceCounters();
    return { hash: api.getStateHash(), explored: view.exploredCells, turn: view.turn, events: view.events, bytes: metrics.totalTransferBytes, commandMs: metrics.commandMs };
  });
  expect(unchanged).toEqual(initial);
});

test('political mode and a selected realm filter persist while an actual battle temporarily hides the map controls', async ({ page }) => {
  await load(page, borderBattleCampaign());
  const view = await summary(page), foreign = view.factions.find(faction => faction.id !== view.factionId)!;
  const control = page.getByTestId('faction-overview-control');
  await control.locator(':scope > summary').click();
  await control.getByRole('button', { name: 'Realms', exact: true }).click();
  await control.getByRole('checkbox', { name: foreign.name, exact: true }).uncheck();
  await control.locator(':scope > summary').click();
  expect(await page.evaluate(() => window.__THEANDRIL__!.getWorldOverview())).toEqual({ mode: 'political', factionIds: [view.factionId] });

  await openRealmAffairs(page);
  await page.getByRole('button', { name: 'Declare war on Reedbound Council', exact: true }).click();
  await openSelectedOrders(page);
  await page.getByRole('button', { name: 'Attack Reedbound Watch (army.4)', exact: true }).click();
  await expect(page.getByTestId('battle-panel')).toBeVisible();
  await expect(control).toBeHidden();
  await page.getByRole('button', { name: 'Auto-resolve battle', exact: true }).click();
  await expect(page.getByTestId('battle-panel')).toHaveCount(0);
  await expect(control).toBeVisible();
  await expect(control.locator(':scope > summary')).toContainText('Realms');
  await control.locator(':scope > summary').click();
  await expect(control.getByRole('button', { name: 'Realms', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(control.getByRole('checkbox', { name: view.factions.find(faction => faction.id === view.factionId)!.name, exact: true })).toBeChecked();
  await expect(control.getByRole('checkbox', { name: foreign.name, exact: true })).not.toBeChecked();
  expect(await page.evaluate(() => window.__THEANDRIL__!.getWorldOverview())).toEqual({ mode: 'political', factionIds: [view.factionId] });
});
