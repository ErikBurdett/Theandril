import { expect, test, type Page } from '@playwright/test';
import { BUILDINGS } from '@theandril/content';
import { hexDistance } from '@theandril/mapgen';
import { applyCommand, createGame, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand, type GameState } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { cellsWithin } from '../../packages/sim/src/visibility';
import { refreshAuthoredSight } from '../../packages/test-fixtures/src/authored-land';
import { tileFootprintCampaign } from '../../packages/test-fixtures/src/tile-footprints';
import { closeCampaignOptions, closeManagement, openProduction, openSelectedOrders, selectFromRegistry } from './ui-navigation';

function issue(state: GameState, command: GameCommand) {
  const result = applyCommand(state, command);
  if (!result.ok) throw new Error(`Hearth fixture ${command.type}: ${result.error}`);
}

/** Soil, population and purse are authored review inputs. Founding, claims,
 * workers and completed buildings/improvements all use ordinary paid commands. */
function hearthScene(mature = false) {
  const state = createGame({ generatorVersion: 4, seed: 17, size: 'tiny', factionCount: 1, pace: 'short' });
  const factionId = state.turnOwnerId, center = 14 * state.world.width + 16;
  state.armies['army.1']!.cell = center; state.armies['army.2']!.cell = center + 3;
  const cells = cellsWithin(state, center, 3);
  for (const cell of cells) {
    state.world.terrain[cell] = 1; state.world.biome[cell] = 1; state.world.waterDepth[cell] = 0; state.world.fertility[cell] = 80;
    delete state.resources.deposits[cell];
  }
  refreshAuthoredSight(state);
  issue(state, { type: 'found', factionId, armyId: 'army.1', name: 'Sprawling Oathhearth' });
  const town = Object.values(state.settlements)[0]!;
  town.population = mature ? 12 : 4; town.food = 100;
  state.factions[0]!.treasury = 20_000; state.factions[0]!.knowledge = 20_000;
  refreshAuthoredSight(state);
  const paidBuildings: { id: string; coinCost: number }[] = [];
  if (mature) {
    for (const cell of [...cells].sort((a, b) => hexDistance(center, a, state.world.width) - hexDistance(center, b, state.world.width) || a - b)) {
      if (!state.land.settlements[town.id]!.claimed.includes(cell)) issue(state, { type: 'claimCell', factionId, settlementId: town.id, cell });
    }
    for (const building of BUILDINGS.filter(item => !item.coastalOnly)) {
      const before = state.factions[0]!.treasury;
      issue(state, { type: 'queue', factionId, settlementId: town.id, itemId: building.id });
      paidBuildings.push({ id: building.id, coinCost: before - state.factions[0]!.treasury });
    }
    for (let turn = 0; town.queue.length && turn < 30; turn++) issue(state, { type: 'endTurn', factionId });
    expect(town.queue).toEqual([]);
    expect(paidBuildings.every(building => building.coinCost > 0 && town.buildings.includes(building.id))).toBe(true);
    town.population = 12; town.food = 100;
    const outer = cells.filter(cell => hexDistance(center, cell, state.world.width) === 3);
    issue(state, { type: 'setWorkedTiles', factionId, settlementId: town.id, cells: outer.slice(0, 2) });
    issue(state, { type: 'improveTile', factionId, settlementId: town.id, cell: outer[0]!, improvementId: 'improvement.terraced_fields' });
    for (let turn = 0; turn < 2; turn++) issue(state, { type: 'endTurn', factionId });
    town.population = 12;
  }
  refreshAuthoredSight(state);
  const checked = deserializeGame(serializeGame(state));
  expect(stateHash(checked)).toBe(stateHash(state));
  return { state: checked, townId: town.id, center, paidBuildings };
}

async function load(page: Page, state: GameState) {
  await page.goto('/');
  await page.getByLabel('Import save file').setInputFiles({ name: 'hearth-development.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()?.state)).toBe('ready');
}

const terrain = (page: Page, cell: number) => page.evaluate(cell => window.__THEANDRIL__!.getTerrainArt(cell), cell);
const diagnostics = (page: Page) => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!);
const currentHash = (page: Page) => page.evaluate(() => window.__THEANDRIL__!.getStateHash());
const summary = (page: Page) => page.evaluate(() => window.__THEANDRIL__!.getSummary()!);
const zoom = (page: Page) => page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().zoom!);

async function landCell(page: Page, cell: number) {
  await openSelectedOrders(page);
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

async function mapView(page: Page) {
  await closeManagement(page); await closeCampaignOptions(page);
  await page.getByTestId('map-container').scrollIntoViewIfNeeded();
}

test('paid hearth and tile construction change actual district art through cancellation, restoration and completion', async ({ page }, info) => {
  const fixture = hearthScene(), initial = getObservation(fixture.state, fixture.state.turnOwnerId);
  await load(page, fixture.state);
  await selectFromRegistry(page, 'settlements', 'Sprawling Oathhearth');
  expect((await terrain(page, fixture.center))?.district).toMatchObject({ kind: 'hearth', settlementId: fixture.townId });
  await openProduction(page, 'building');
  const buildingCost = BUILDINGS.find(building => building.id === 'building.granary')!.coinCost;
  await page.getByRole('button', { name: /^Build Root cellar/ }).click();
  await expect.poll(async () => (await summary(page)).treasury).toBe(initial.treasury - buildingCost);
  const building = (await diagnostics(page)).hearthDistricts.find(item => item.buildingId === 'building.granary')!;
  expect(building).toMatchObject({ kind: 'construction', settlementId: fixture.townId });
  expect(building.cell).not.toBe(fixture.center);

  const target = initial.land.settlements[0]!.cells.find(cell => cell.canWork && cell.cell !== building.cell)!.cell;
  await landCell(page, target);
  await page.getByRole('button', { name: 'Assign worker', exact: true }).click();
  await expect.poll(async () => (await terrain(page, target))?.district?.kind).toBe('worked');
  await page.locator('.land-options > summary').filter({ hasText: 'Tile improvements' }).click();
  const beforeLand = (await summary(page)).treasury;
  await page.getByRole('button', { name: 'Build Terraced fields', exact: true }).click();
  await expect.poll(async () => (await terrain(page, target))?.district?.kind).toBe('construction');
  const pending = (await summary(page)).land.settlements[0]!.work!;
  expect(pending.coinCost).toBeGreaterThan(0);
  expect((await summary(page)).treasury).toBe(beforeLand - pending.coinCost);
  expect((await terrain(page, target))?.district).toMatchObject({ cell: target, progress: 0 });
  await mapView(page);
  await page.getByTestId('map-container').screenshot({ path: info.outputPath('paid-hearth-and-tile-construction.png') });
  await page.getByTestId('campaign-menu').locator('summary').click();
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  const savedHash = await currentHash(page), savedCoin = (await summary(page)).treasury;
  await landCell(page, target);
  await page.getByRole('button', { name: 'Cancel land work · no refund', exact: true }).click();
  await expect.poll(async () => (await summary(page)).land.settlements[0]!.work).toBeNull();
  expect((await summary(page)).treasury).toBe(savedCoin);
  await expect.poll(async () => (await terrain(page, target))?.district?.kind).toBe('worked');

  await page.reload();
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect.poll(() => currentHash(page)).toBe(savedHash);
  await expect.poll(async () => (await terrain(page, target))?.district).toMatchObject({ kind: 'construction', progress: 0 });
  await selectFromRegistry(page, 'settlements', 'Sprawling Oathhearth');
  await nextTurn(page);
  expect((await summary(page)).land.settlements[0]!.work?.remainingTurns).toBe(1);
  expect((await terrain(page, target))?.district?.progress).toBeGreaterThan(0);
  await nextTurn(page);
  expect((await summary(page)).land.settlements[0]!.work).toBeNull();
  await expect.poll(async () => (await terrain(page, target))?.improvementId).toBe('improvement.terraced_fields');
  for (let turn = 0; !(await summary(page)).ownSettlements[0]!.buildings.includes('building.granary') && turn < 4; turn++) await nextTurn(page);
  await expect.poll(async () => (await diagnostics(page)).hearthDistricts.some(item => item.kind === 'granary' && item.buildingId === 'building.granary')).toBe(true);
  expect((await diagnostics(page)).hearthDistricts.some(item => item.buildingId === 'building.granary' && item.kind === 'construction')).toBe(false);
  await mapView(page);
  await page.getByTestId('map-container').screenshot({ path: info.outputPath('completed-cellar-and-fields.png') });

  // A second real land order visibly changes cultivation progress; cancellation
  // must remove that presentation without changing the generated biome.
  const cultivate = initial.land.settlements[0]!.cells.find(cell => cell.canWork && cell.cell !== target && cell.cell !== fixture.center)!.cell;
  await landCell(page, cultivate);
  await page.locator('.land-options > summary').filter({ hasText: 'Cultivate biome' }).click();
  await page.getByRole('button', { name: 'Cultivate Temperate forest', exact: true }).click();
  await expect.poll(async () => (await terrain(page, cultivate))?.district?.kind).toBe('cultivation');
  await nextTurn(page);
  expect((await terrain(page, cultivate))?.district?.progress).toBeGreaterThan(0);
  await landCell(page, cultivate);
  await page.getByRole('button', { name: 'Cancel land work · no refund', exact: true }).click();
  expect((await terrain(page, cultivate))?.biome).toBe(1);
  expect((await terrain(page, cultivate))?.district?.kind).not.toBe('cultivation');
});

test('a mature paid hearth sprawls inside its 39 claims at normal, near, far and narrow camera scales', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  const fixture = hearthScene(true), hash = stateHash(fixture.state), land = getObservation(fixture.state, fixture.state.turnOwnerId).land.settlements[0]!;
  expect(land.claimed).toHaveLength(39);
  await load(page, fixture.state);
  await selectFromRegistry(page, 'settlements', 'Sprawling Oathhearth');
  await mapView(page);
  const normal = await diagnostics(page), districts = normal.hearthDistricts.filter(item => item.settlementId === fixture.townId);
  expect(districts.filter(item => item.kind === 'housing')).toHaveLength(10);
  expect(new Set(districts.map(item => item.cell)).size).toBe(districts.length);
  expect(districts.every(item => land.claimed.includes(item.cell))).toBe(true);
  expect(districts.every(item => item.links.every(cell => land.claimed.includes(cell)))).toBe(true);
  expect(new Set(districts.filter(item => item.buildingId).map(item => item.buildingId))).toEqual(new Set(fixture.paidBuildings.map(item => item.id)));
  for (const district of districts.filter(item => item.buildingId)) expect(district).toMatchObject({ assetId: district.buildingId, presentation: 'approved' });
  expect(districts.some(item => item.kind === 'worked')).toBe(true);
  expect(districts.some(item => hexDistance(fixture.center, item.cell, fixture.state.world.width) >= 2)).toBe(true);
  await page.getByTestId('map-container').screenshot({ path: info.outputPath('mature-hearth-normal.png') });
  for (let step = 0; step < 8 && await zoom(page) < 2.2; step++) await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  expect(await zoom(page)).toBe(2.2);
  await page.getByTestId('map-container').screenshot({ path: info.outputPath('mature-hearth-near.png') });
  for (let step = 0; step < 8 && await zoom(page) >= .65; step++) await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
  await expect.poll(async () => (await diagnostics(page)).lod).toBe('strategic-glyphs');
  await page.getByTestId('map-container').screenshot({ path: info.outputPath('mature-hearth-far.png') });
  expect(await currentHash(page)).toBe(hash);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Focus selection', exact: true }).click();
  await mapView(page);
  await page.getByTestId('map-container').screenshot({ path: info.outputPath('mature-hearth-narrow.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await currentHash(page)).toBe(hash);
  const rebuilds = await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().chunkRebuilds);
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  expect(await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().chunkRebuilds)).toBe(rebuilds);
  await info.attach('mature-hearth-evidence.json', { body: JSON.stringify({ scope: 'Authored population12, soil and treasury; 37 legal paid claims, four paid completed buildings, paid completed fields, actual worker assignments. Visual and idle-invalidation review, not campaign balance or a frame-time benchmark.', hash, paidBuildings: fixture.paidBuildings, claimed: land.claimed, normal, final: await diagnostics(page) }, null, 2), contentType: 'application/json' });
  expect(errors).toEqual([]);
});

test('remembered foreign land never exposes unseen construction or newly completed district art', async ({ page }) => {
  const fixture = tileFootprintCampaign({ rememberForeignSite: true });
  const hidden = fixture.game.settlements[fixture.hidden.id]!;
  issue(fixture.game, { type: 'queue', factionId: hidden.factionId, settlementId: hidden.id, itemId: 'building.workshop' });
  expect(hidden.queue).toContainEqual({ itemId: 'building.workshop', progress: 0 });
  expect(fixture.game.land.settlements[hidden.id]!.improvements[String(fixture.hidden.improvementCell)]).toBe('improvement.terraced_fields');
  await load(page, fixture.game);
  const remembered = await terrain(page, fixture.hidden.improvementCell);
  expect(remembered).toMatchObject({ visible: false, improvementId: null, district: null });
  expect((await diagnostics(page)).hearthDistricts.some(item => item.settlementId === hidden.id)).toBe(false);
  expect((await summary(page)).settlements.some(town => town.id === hidden.id)).toBe(false);
});
