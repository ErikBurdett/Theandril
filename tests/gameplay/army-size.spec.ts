import { expect, test, type Page } from '@playwright/test';
import { openSelectedOrders, selectFromRegistry } from './ui-navigation';
import { writeFile } from 'node:fs/promises';
import { createArmyFormation, createGame, deserializeGame, serializeGame, stateHash } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { refreshAuthoredSight } from '../../packages/test-fixtures/src/authored-land';
import { navalCampaign, NAVAL_FIXTURE } from '../../packages/test-fixtures/src/naval-fixture';

function sizeCampaign() {
  const state = createGame({ generatorVersion: 4, seed: 74, size: 'tiny', factionCount: 2, pace: 'short' });
  state.world.terrain.fill(1); state.world.biome.fill(1); state.world.waterDepth.fill(0); state.world.fertility.fill(60);
  state.resources.deposits = {}; // This gallery replaces the entire generated terrain/resource layer.
  const largeId = `army.${state.nextId++}`;
  for (const [id, count, cell, name] of [['army.1', 1, 500, 'Lone witness'], ['army.2', 3, 503, 'Road company'], [largeId, 12, 506, 'Hearth host']] as const) {
    state.armies[id] = { id, factionId: state.turnOwnerId, name, cell, movement: 3,
      formations: Array.from({ length: count }, () => createArmyFormation(`army.${state.nextId++}`, 'unit.guard')).sort((a, b) => a.id.localeCompare(b.id)) };
  }
  delete state.armies['army.3']; state.armies['army.4']!.cell = 1400;
  refreshAuthoredSight(state);
  return { state: deserializeGame(serializeGame(state)), largeId };
}
async function choose(page: Page, name: string) {
  await selectFromRegistry(page, 'armies', name);
  await page.getByRole('button', { name: 'Focus selection', exact: true }).click();
}

test('actual one, three and twelve-formation armies use capped representative groups and update after a saved split', async ({ page }, testInfo) => {
  const { state, largeId } = sizeCampaign(), hash = stateHash(state);
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'army-size.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()?.state)).toBe('ready');
  await choose(page, 'Road company');
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().visibleSprites)).toBe(6);
  const groups = await page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.visibleEntityArt);
  for (const [id, count, figures] of [['army.1', 1, 1], ['army.2', 3, 2], [largeId, 12, 3]] as const) {
    expect(groups.find(group => group.entityId === id)).toMatchObject({ formationCount: count, representativeCount: figures, assetId: 'unit.guard.ashen_compact', tint: 0xffffff });
  }
  expect(groups.some(group => group.entityId === 'army.4')).toBe(false);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().visibleSprites)).toBe(6);
  await page.getByTestId('map-container').screenshot({ path: testInfo.outputPath('one-company-host-near.png') });
  await page.getByRole('button', { name: 'Zoom out', exact: true }).click({ clickCount: 3, delay: 60 });
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()?.lod)).toBe('strategic-glyphs');
  const far = await page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.visibleEntityArt);
  expect(far.filter(group => ['army.1', 'army.2', largeId].includes(group.entityId))).toHaveLength(3);
  expect(far.every(group => group.representativeCount === 1)).toBe(true);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);
  await page.getByTestId('map-container').screenshot({ path: testInfo.outputPath('army-size-strategic-badges.png') });

  await choose(page, 'Hearth host');
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click({ clickCount: 3, delay: 60 });
  await openSelectedOrders(page);
  const composition = page.getByTestId('army-composition'); await composition.locator('summary').click();
  for (const formation of state.armies[largeId]!.formations.slice(0, 7)) await composition.getByRole('checkbox', { name: `Select formation ${formation.id}`, exact: true }).check();
  await composition.getByRole('textbox', { name: 'New detachment name', exact: true }).fill('Seven witnesses');
  await composition.getByRole('button', { name: 'Split selected formations', exact: true }).click();
  await expect.poll(() => page.evaluate(id => window.__THEANDRIL__!.getSummary()!.armies.find(army => army.id === id)?.formations.length, largeId)).toBe(5);
  await expect.poll(() => page.evaluate(id => window.__THEANDRIL__!.getArtDiagnostics()!.visibleEntityArt.find(group => group.entityId === id)?.representativeCount, largeId)).toBe(2);
  expect(await page.evaluate(id => window.__THEANDRIL__!.getArtDiagnostics()!.visibleEntityArt.find(group => group.entityId === id), largeId)).toMatchObject({ formationCount: 5, stackArmyCount: 2, stackFormationCount: 12 });
  await choose(page, 'Seven witnesses');
  const detached = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.ownArmies.find(army => army.name === 'Seven witnesses')!);
  expect(detached.formations).toHaveLength(7);
  expect(await page.evaluate(id => window.__THEANDRIL__!.getArtDiagnostics()!.visibleEntityArt.find(group => group.entityId === id)?.representativeCount, detached.id)).toBe(3);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.visibleEntityArt.at(-1)?.entityId)).toBe(detached.id);
  expect(await page.evaluate(id => window.__THEANDRIL__!.getArtDiagnostics()!.visibleEntityArt.some(group => group.entityId === id), largeId)).toBe(false);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.overlays.stackBadges)).toEqual([expect.objectContaining({ cell: detached.cell, armies: 2, text: '×2', entityId: detached.id })]);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.overlays.labels.find(label => label.id === window.__THEANDRIL__!.getSelection().armyId)?.text)).toContain('Seven witnesses · 2 armies');
  const splitHash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  // Rendering one group must not remove either real same-cell selection target.
  await page.getByTestId('map-container').scrollIntoViewIfNeeded();
  const point = await page.evaluate(cell => window.__THEANDRIL__!.getCellScreenPoint(cell), detached.cell);
  expect(point?.inViewport).toBe(true);
  await page.mouse.click(point!.x, point!.y);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSelection().armyId)).toBe(largeId);
  await expect.poll(() => page.evaluate(id => window.__THEANDRIL__!.getArtDiagnostics()!.visibleEntityArt.find(group => group.entityId === id)?.representativeCount, largeId)).toBe(2);
  await page.mouse.click(point!.x, point!.y);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSelection().armyId)).toBe(detached.id);
  await expect.poll(() => page.evaluate(id => window.__THEANDRIL__!.getArtDiagnostics()!.visibleEntityArt.find(group => group.entityId === id)?.representativeCount, detached.id)).toBe(3);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(splitHash);
  expect(await page.evaluate(cell => window.__THEANDRIL__!.getSummary()!.ownArmies.filter(army => army.cell === cell).map(army => army.formations.length).sort((a, b) => a - b), detached.cell)).toEqual([5, 7]);
  const menu = page.getByTestId('campaign-menu');
  if (await menu.getAttribute('open') === null) await menu.locator('summary').click();
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  const savedHash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored');
  await page.setViewportSize({ width: 390, height: 844 }); await choose(page, 'Seven witnesses');
  await expect.poll(() => page.evaluate(id => window.__THEANDRIL__!.getArtDiagnostics()!.visibleEntityArt.find(group => group.entityId === id)?.representativeCount, detached.id)).toBe(3);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.overlays.stackBadges)).toEqual([expect.objectContaining({ armies: 2, text: '×2', entityId: detached.id })]);
  await page.getByTestId('map-container').screenshot({ path: testInfo.outputPath('selected-stacked-armies-narrow.png') });
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(savedHash);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const metrics = await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters());
  expect(metrics.visibleSprites).toBeLessThanOrEqual((metrics.visibleEntities ?? 0) * 3);
  expect(metrics.cachedChunks).toBeLessThanOrEqual(64);
  const reportPath = testInfo.outputPath('army-size-rendering.json');
  await writeFile(reportPath, JSON.stringify({ groups, far, metrics, savedHash }, null, 2));
  await testInfo.attach('army-size-rendering.json', { path: reportPath, contentType: 'application/json' });
});

test('fleet representatives count real hull formations without drawing embarked passengers twice', async ({ page }, testInfo) => {
  const state = navalCampaign();
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'fleet-size.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()?.state)).toBe('ready');
  await choose(page, NAVAL_FIXTURE.cargoName);
  await openSelectedOrders(page);
  await page.getByRole('combobox', { name: 'Transport fleet', exact: true }).selectOption(NAVAL_FIXTURE.fleetId);
  await page.getByRole('button', { name: 'Embark army', exact: true }).click();
  await expect.poll(() => page.evaluate(id => window.__THEANDRIL__!.getSummary()!.armies.find(army => army.id === id)?.carrierId, NAVAL_FIXTURE.cargoId)).toBe(NAVAL_FIXTURE.fleetId);
  await choose(page, NAVAL_FIXTURE.fleetName);
  await expect.poll(() => page.evaluate(id => window.__THEANDRIL__!.getArtDiagnostics()!.visibleEntityArt.find(group => group.entityId === id)?.representativeCount, NAVAL_FIXTURE.fleetId)).toBe(2);
  const art = await page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!);
  expect(art.visibleEntityArt.find(group => group.entityId === NAVAL_FIXTURE.fleetId)).toMatchObject({ formationCount: 3, representativeCount: 2, assetId: 'unit.transport.ashen_compact', nativeWidth: 96, tint: 0xffffff });
  expect(art.visibleEntityArt.some(group => group.entityId === NAVAL_FIXTURE.cargoId)).toBe(false);
  expect(art.visibleEntityArt.some(group => group.entityId === NAVAL_FIXTURE.enemyFleetId)).toBe(false);
  await page.getByTestId('map-container').screenshot({ path: testInfo.outputPath('fleet-size-and-embarked-passengers.png') });
  const hash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  await page.getByRole('button', { name: 'Zoom out', exact: true }).click({ clickCount: 3, delay: 60 });
  await expect.poll(() => page.evaluate(id => window.__THEANDRIL__!.getArtDiagnostics()!.visibleEntityArt.find(group => group.entityId === id)?.representativeCount, NAVAL_FIXTURE.fleetId)).toBe(1);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);
});
