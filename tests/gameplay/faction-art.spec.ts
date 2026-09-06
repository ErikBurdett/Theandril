import { expect, test, type Page } from '@playwright/test';
import { FACTION_ART_FAMILIES, factionArtId, type RuntimeCatalog } from '@theandril/art-pipeline/runtime';
import { neighbors } from '@theandril/mapgen';
import { applyCommand, createArmyFormation, createGame, deserializeGame, serializeGame, type GameState } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { rebaseAuthoredLand } from '../../packages/test-fixtures/src/authored-land';

const ROLES = ['unit.colonist', 'unit.scout', 'unit.guard', 'unit.spearman', 'unit.heavy_infantry', 'unit.cavalry'];
const HIDDEN_ARMY_NAME = 'Unseen Glass detachment';
const cell = (column: number, row: number) => row * 48 + column;

/** Authored initial placement, never a runtime mutator. Every subsequent input is real UI. */
function factionGallery(): GameState {
  const state = createGame({ seed: 20260905, size: 'tiny', factionCount: 6, pace: 'short' });
  for (const faction of state.factions) {
    const colonist = Object.values(state.armies).find(army => army.factionId === faction.id && army.formations[0]?.unitId === 'unit.colonist');
    if (!colonist) throw new Error('Gallery requires a founding caravan');
    const result = applyCommand(state, { type: 'found', factionId: faction.id, armyId: colonist.id, name: `${faction.name} hearth` });
    if (!result.ok) throw new Error(result.error);
  }
  state.world.terrain.fill(1); state.world.biome.fill(1); state.world.fertility.fill(60); state.world.waterDepth.fill(0);
  state.armies = {};
  function addArmy(factionId: string, unitId: string, location: number, name: string) {
    const id = `army.${state.nextId++}`;
    state.armies[id] = { id, factionId, name, cell: location, movement: 0, formations: [createArmyFormation(id, unitId)] };
  }
  state.factions.forEach((faction, family) => {
    ROLES.forEach((role, index) => addArmy(faction.id, role, cell(15 + index * 2, 10 + family * 2), `${FACTION_ART_FAMILIES[family]} ${role.slice(5)}`));
    const town = Object.values(state.settlements).find(town => town.factionId === faction.id)!;
    town.cell = cell(15 + (family % 3) * 5, family < 3 ? 8 : 22); town.population = [2, 3, 8, 2, 3, 8][family]!;
  });
  for (const [column, row] of [[16, 14], [24, 14], [16, 18], [24, 18]]) addArmy(state.turnOwnerId, 'unit.scout', cell(column!, row!), 'Gallery observer');
  addArmy(state.turnOwnerId, 'unit.scout', cell(20, 19), 'Southern town observer');
  addArmy(state.turnOwnerId, 'unit.scout', cell(22, 15), 'Culture survey');
  addArmy(state.turnOwnerId, 'unit.guard', cell(19, 10), 'Co-located hearth reserve');
  // The same authored family also has a genuine unseen army, never sent to the renderer.
  addArmy(state.factions[3]!.id, 'unit.guard', 0, HIDDEN_ARMY_NAME);
  for (const faction of state.factions) state.explored[faction.id] = new Set();
  function reveal(factionId: string, origin: number, radius: number): void {
    const seen = new Set([origin]); let frontier = [origin];
    for (let distance = 0; distance < radius; distance++) {
      const next: number[] = [];
      for (const origin of frontier) for (const adjacent of neighbors(origin, 48, 32)) if (!seen.has(adjacent)) { seen.add(adjacent); next.push(adjacent); }
      frontier = next;
    }
    for (const origin of seen) state.explored[factionId]!.add(origin);
  }
  for (const army of Object.values(state.armies)) reveal(army.factionId, army.cell, 4);
  for (const town of Object.values(state.settlements)) reveal(town.factionId, town.cell, 3);
  rebaseAuthoredLand(state);
  return deserializeGame(serializeGame(state));
}

async function loadGallery(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1680, height: 1320 });
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'six-observed-cultures.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(factionGallery()))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await page.getByTestId('army-registry').getByRole('button', { name: /Culture survey/ }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics()?.state)).toBe('ready');
}

test('all six observed cultures select distinct untinted role art and bounded strategic heraldry without changing canonical input or fog', async ({ page }, testInfo) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await loadGallery(page);
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  const expectedUnits = FACTION_ART_FAMILIES.flatMap(family => ROLES.map(role => `${role}.${family}`));
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics()?.visibleAssetIds)).toEqual(expect.arrayContaining(expectedUnits));
  const hash = await page.evaluate(() => window.__THEANDRIL__?.getStateHash());
  const summary = await page.evaluate(() => window.__THEANDRIL__?.getSummary());
  expect(summary?.factions.map(faction => faction.definitionId)).toEqual(FACTION_ART_FAMILIES.map(family => `faction.${family}`));
  expect(summary?.armies.some(army => army.name === HIDDEN_ARMY_NAME)).toBe(false);
  const near = await page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics());
  expect(near?.lod).toBe('near-sprites'); expect(near?.warnings).toEqual([]);
  expect(near?.visibleAnimationFrames).toEqual([]); // These approved faction poses are static, not a fabricated idle cycle.
  for (const entity of near?.visibleEntityArt ?? []) {
    expect(entity.assetId).toBe(factionArtId(entity.role, entity.definitionId!));
    expect(entity.tint).toBe(0xffffff);
    expect(entity.nativeWidth).toBe(entity.role === 'settlement.city' ? 128 : entity.role.startsWith('settlement.') || entity.role === 'unit.cavalry' ? 96 : 64);
    expect(entity.nativeHeight).toBe(entity.nativeWidth);
  }
  await page.screenshot({ path: testInfo.outputPath('six-cultures-near.png'), fullPage: true });
  // A sprite's larger visual canvas does not replace the canonical hex hit target.
  await page.keyboard.press('Escape');
  const target = cell(19, 12);
  const point = await page.evaluate(cell => window.__THEANDRIL__?.getCellScreenPoint(cell), target);
  if (!point?.inViewport) throw new Error('Visible Reedbound guard is not on the real map canvas');
  await page.mouse.click(point.x, point.y);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getSelection()?.cell)).toBe(target);
  for (let zoom = 0; zoom < 4; zoom++) await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics()?.lod)).toBe('strategic-glyphs');
  const far = await page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics());
  expect(far?.visibleAssetIds).toEqual(expect.arrayContaining(FACTION_ART_FAMILIES.flatMap(family => [`ui.badge.${family}`, `ui.banner.${family}`])));
  expect(far?.visibleAnimationFrames).toEqual([]);
  expect(far?.visibleEntityArt.every(entity => entity.presentation === 'strategic')).toBe(true);
  expect(far?.visibleEntityArt.every(entity => entity.nativeWidth === (entity.role.startsWith('settlement.') ? 64 : 32))).toBe(true);
  const farMetrics = await page.evaluate(() => window.__THEANDRIL__?.getPerformanceCounters());
  expect(farMetrics?.visibleSprites).toBeLessThan(farMetrics?.visibleEntities ?? 0);
  await page.screenshot({ path: testInfo.outputPath('six-cultures-far.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Focus selection', exact: true }).click();
  await page.getByTestId('map-container').scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('six-cultures-narrow.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.evaluate(() => window.__THEANDRIL__?.getStateHash())).toBe(hash);
  await testInfo.attach('faction-art-inspection.json', { body: JSON.stringify({ near, far, metrics: await page.evaluate(() => window.__THEANDRIL__?.getPerformanceCounters()), notes: ['Authored placement imported through validated save boundary; no runtime mutation hooks.', 'Only actually visible enemies supplied art metadata.', 'Static one-pose faction art; native 32px badges and 64px banners use exact nearest 2:1 reduction at strategic zoom.', 'Selection, zoom and narrow resizing did not alter canonical state.'] }, null, 2), contentType: 'application/json' });
  expect(errors).toEqual([]);
});

test('a missing approved culture variant uses its generic role and explicit warning, never a different culture', async ({ page }) => {
  const missingId = 'unit.guard.reedbound_council';
  await page.route('**/art/catalog.json', async route => {
    const response = await route.fetch(); const catalog = await response.json() as RuntimeCatalog;
    const missing = catalog.assets.find(asset => asset.id === missingId);
    const atlas = catalog.atlases.find(atlas => atlas.id === missing?.atlasId);
    if (!missing || !atlas) throw new Error('Missing-variant test requires the real approved Reedbound guard asset');
    // Simulate an incomplete deployment without forging pixels, approvals or hashes.
    await page.route(`**${atlas.jsonUrl}`, async atlasRoute => {
      const response = await atlasRoute.fetch(); const metadata = await response.json();
      for (const frame of missing.frames) delete metadata.frames[frame.id];
      for (const clip of missing.clips) delete metadata.animations[clip.id];
      await atlasRoute.fulfill({ response, json: metadata });
    });
    catalog.assets = catalog.assets.filter(asset => asset.id !== missingId);
    await route.fulfill({ response, json: catalog });
  });
  await loadGallery(page);
  await expect(page.getByTestId('art-runtime-status')).toContainText('partial pixel pack');
  await expect(page.getByTestId('art-runtime-status')).toHaveAttribute('title', new RegExp(missingId));
  const art = await page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics());
  const guard = art?.visibleEntityArt.find(entity => entity.role === 'unit.guard' && entity.definitionId === 'faction.reedbound_council');
  expect(guard).toMatchObject({ assetId: 'unit.guard', presentation: 'generic', nativeWidth: 64, tint: 0xffffff });
  expect(art?.visibleAssetIds).not.toContain(missingId);
  expect(art?.visibleAssetIds).toContain('unit.guard.glass_tide');
});
