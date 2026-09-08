import { expect, test, type Page } from '@playwright/test';
import { openRegistry } from './ui-navigation';
import { writeFile } from 'node:fs/promises';
import { FACTION_ART_FAMILIES, factionArtId, type RuntimeCatalog } from '@theandril/art-pipeline/runtime';
import { neighbors } from '@theandril/mapgen';
import { applyCommand, createArmyFormation, createGame, deserializeGame, getObservation, serializeGame, type GameState } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { rebaseAuthoredLand } from '../../packages/test-fixtures/src/authored-land';

const ROLES = ['unit.colonist', 'unit.scout', 'unit.guard', 'unit.spearman', 'unit.heavy_infantry', 'unit.cavalry'];
const TOWN_ROLES = ['settlement.village', 'settlement.town', 'settlement.city'];
const HIDDEN_ARMY_NAME = 'Unseen Glass detachment';
const GALLERY_WIDTH = 256;
const cell = (column: number, row: number) => row * GALLERY_WIDTH + column;
const COHORTS = Array.from({ length: Math.ceil(FACTION_ART_FAMILIES.length / 6) }, (_, index) => ({
  label: `culture-cohort-${index + 1}`, offset: index * 60, families: FACTION_ART_FAMILIES.slice(index * 6, index * 6 + 6),
}));

/** Authored initial placement, never a runtime mutator. Every subsequent input is real UI. */
function factionGallery(): GameState {
  const state = createGame({ generatorVersion: 4, seed: 20260905, size: 'small', factionCount: FACTION_ART_FAMILIES.length, pace: 'short' });
  if (state.world.width !== GALLERY_WIDTH || COHORTS.at(-1)!.offset + 65 >= state.world.width) throw new Error('Gallery exceeds its authored map bounds');
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
    const offset = COHORTS[Math.floor(family / 6)]!.offset, row = family % 6;
    ROLES.forEach((role, index) => addArmy(faction.id, role, cell(offset + 15 + index * 2, 10 + row * 2), `${FACTION_ART_FAMILIES[family]} ${role.slice(5)}`));
    const town = Object.values(state.settlements).find(town => town.factionId === faction.id)!;
    TOWN_ROLES.forEach((role, stage) => {
      const id = stage === 0 ? town.id : `settlement.${state.nextId++}`;
      state.settlements[id] = { ...town, id, name: `${FACTION_ART_FAMILIES[family]} ${role.slice(11)}`, cell: cell(offset + 15 + (row % 3) * 5 + stage * 20, row < 3 ? 8 : 22), population: [2, 3, 8][stage]!, queue: [], buildings: [] };
    });
  });
  for (const cohort of COHORTS) {
    for (const [column, row] of [[16, 14], [24, 14], [16, 18], [24, 18], [20, 19]]) addArmy(state.turnOwnerId, 'unit.scout', cell(cohort.offset + column!, row!), 'Gallery observer');
    addArmy(state.turnOwnerId, 'unit.scout', cell(cohort.offset + 22, 15), `${cohort.label} unit survey`);
    for (let stage = 0; stage < TOWN_ROLES.length; stage++) {
      const offset = cohort.offset + stage * 20;
      for (const [column, row] of [[18, 8], [23, 8], [18, 22], [23, 22]]) addArmy(state.turnOwnerId, 'unit.scout', cell(offset + column!, row!), 'Town observer');
      if (stage > 0) addArmy(state.turnOwnerId, 'unit.scout', cell(offset + 22, 15), `${cohort.label} stage-${stage + 1} survey`);
    }
  }
  addArmy(state.turnOwnerId, 'unit.guard', cell(19, 10), 'Co-located hearth reserve');
  // The same authored family also has a genuine unseen army, never sent to the renderer.
  addArmy(state.factions[3]!.id, 'unit.guard', 0, HIDDEN_ARMY_NAME);
  for (const faction of state.factions) state.explored[faction.id] = new Set();
  function reveal(factionId: string, origin: number, radius: number): void {
    const seen = new Set([origin]); let frontier = [origin];
    for (let distance = 0; distance < radius; distance++) {
      const next: number[] = [];
      for (const origin of frontier) for (const adjacent of neighbors(origin, state.world.width, state.world.height)) if (!seen.has(adjacent)) { seen.add(adjacent); next.push(adjacent); }
      frontier = next;
    }
    for (const origin of seen) state.explored[factionId]!.add(origin);
  }
  for (const army of Object.values(state.armies)) reveal(army.factionId, army.cell, 4);
  for (const town of Object.values(state.settlements)) reveal(town.factionId, town.cell, 3);
  rebaseAuthoredLand(state);
  const restored = deserializeGame(serializeGame(state)), view = getObservation(restored, restored.turnOwnerId, { landDetails: 'none' });
  if (view.factions.length !== FACTION_ART_FAMILIES.length || view.settlements.length !== FACTION_ART_FAMILIES.length * TOWN_ROLES.length || view.armies.some(army => army.name === HIDDEN_ARMY_NAME)) throw new Error('Gallery must expose every culture/town but not its genuinely unseen army');
  for (const faction of state.factions) for (const role of ROLES) if (!view.armies.some(army => army.factionId === faction.id && army.unitId === role)) throw new Error(`Gallery sight misses ${faction.definitionId}/${role}`);
  return restored;
}

// Construct once even during --list: validates the authored save and actual fog before a browser run.
const GALLERY_SAVE = serializeGame(factionGallery());

async function selectGalleryArmy(page: Page, name: string): Promise<void> {
  // Keep the three surveyors for this cohort in the real searched roster while
  // visiting its unit/town/city cameras. Reopening the dialog must not require
  // clearing and retyping an unchanged search or resetting unchanged filters.
  const cohort = COHORTS.find(cohort => name.startsWith(cohort.label + ' '));
  if (!cohort) throw new Error(`Unknown gallery survey ${name}`);
  const registry = await openRegistry(page, 'armies');
  const search = registry.getByRole('searchbox', { name: 'Search your realm' });
  if (await search.inputValue() !== cohort.label) await search.fill(cohort.label);
  const force = registry.getByRole('combobox', { name: 'Force type' });
  if (await force.inputValue() !== 'all') await force.selectOption('all');
  const rows = registry.getByTestId('army-registry').getByRole('button');
  await expect(rows).toHaveCount(3);
  await rows.filter({ has: page.getByText(name, { exact: true }) }).click();
  await expect(registry).toHaveCount(0);
}

async function loadGallery(page: Page, cohortLabel = COHORTS[0]!.label): Promise<void> {
  await page.setViewportSize({ width: 1680, height: 1320 });
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: `${FACTION_ART_FAMILIES.length}-observed-cultures.theandril`, mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(GALLERY_SAVE)) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await selectGalleryArmy(page, `${cohortLabel} unit survey`);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics()?.state)).toBe('ready');
}

// Each case starts from the same complete validated 24-culture world. A cohort
// is one independent native-camera review, not a relaxed timeout or reduced
// world fixture; the partition assertion below guarantees all24 are exercised.
for (const [index, cohort] of COHORTS.entries()) test(`${cohort.label}: six of all ${FACTION_ART_FAMILIES.length} observed cultures retain distinct untinted roles and strategic heraldry without changing canonical input or fog`, async ({ page }, testInfo) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await loadGallery(page, cohort.label);
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  const hash = await page.evaluate(() => window.__THEANDRIL__?.getStateHash());
  const summary = await page.evaluate(() => window.__THEANDRIL__?.getSummary());
  expect(FACTION_ART_FAMILIES).toHaveLength(24);
  expect(COHORTS).toHaveLength(4);
  expect(COHORTS.map(cohort => cohort.families.length)).toEqual([6, 6, 6, 6]);
  expect(COHORTS.flatMap(cohort => cohort.families)).toEqual(FACTION_ART_FAMILIES);
  expect(summary?.settlements).toHaveLength(72);
  expect(summary?.factions.map(faction => faction.definitionId)).toEqual(FACTION_ART_FAMILIES.map(family => `faction.${family}`));
  expect(summary?.armies.some(army => army.name === HIDDEN_ARMY_NAME)).toBe(false);
  const inspections: unknown[] = [], allNearAssets = new Set<string>(), allFarAssets = new Set<string>();
  const inspectNear = async (label: string, expected: string[]) => {
    // Real player camera input, not hidden CSS: clear the tall selected-army
    // overlay, then move the first town right of the retained map title/hint.
    // At this viewport/zoom +275px clears the map title (and any active hint)
    // and keeps even the rightmost 128px city inside with a measured margin.
    const zoomBefore = await page.evaluate(() => window.__THEANDRIL__?.getPerformanceCounters()?.zoom);
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('map-route-preview')).toHaveCount(0);
    const canvas = await page.getByTestId('map-container').locator('canvas').boundingBox();
    if (!canvas) throw new Error('Gallery camera requires the real map canvas');
    const start = { x: canvas.x + canvas.width * .42, y: canvas.y + Math.min(canvas.height * .55, 600) };
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + 275, start.y, { steps: 10 });
    await page.mouse.up();
    await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics()?.visibleAssetIds)).toEqual(expect.arrayContaining(expected));
    const framing = await page.evaluate(expectedIds => {
      const diagnostics = window.__THEANDRIL__?.getArtDiagnostics(), view = window.__THEANDRIL__?.getSummary();
      const canvas = document.querySelector('[data-testid="map-container"] canvas')?.getBoundingClientRect();
      const title = document.querySelector('.map-title')?.getBoundingClientRect();
      const hint = document.querySelector('.map-order-hint')?.getBoundingClientRect();
      const towns = (diagnostics?.visibleEntityArt ?? []).filter(art => art.role.startsWith('settlement.') && art.assetId && expectedIds.includes(art.assetId)).map(art => {
        const town = view?.settlements.find(town => town.id === art.entityId);
        const point = town && window.__THEANDRIL__?.getCellScreenPoint(town.cell);
        const adjacent = town && window.__THEANDRIL__?.getCellScreenPoint(town.cell + 1);
        if (!point || !adjacent || !art.nativeWidth) throw new Error('Missing observed town projection');
        // The approved centered native canvas uses the renderer's 56px tile
        // width fit; infer live zoom/spacing from adjacent projected hexes.
        const half = art.nativeWidth * (adjacent.x - point.x) / 56 / 2;
        return { assetId: art.assetId, left: point.x - half, right: point.x + half };
      });
      return { panPixels: 275, zoom: window.__THEANDRIL__?.getPerformanceCounters()?.zoom, titleRight: title?.right, hintRight: hint?.right, canvasRight: canvas?.right, towns };
    }, expected);
    expect(framing.zoom).toBe(zoomBefore);
    expect(framing.towns).toHaveLength(expected.filter(id => id.startsWith('settlement.')).length);
    expect(framing.titleRight).toBeDefined();
    // The title remains mandatory. The removed neutral hint has no rectangle
    // to clear; a real active hint, when present, still constrains every town.
    expect(Math.min(...framing.towns.map(town => town.left))).toBeGreaterThan(Math.max(framing.titleRight ?? Infinity, framing.hintRight ?? -Infinity) + 2);
    expect(Math.max(...framing.towns.map(town => town.right))).toBeLessThan((framing.canvasRight ?? -Infinity) - 4);
    expect(await page.evaluate(() => window.__THEANDRIL__?.getSelection()?.armyId)).toBeUndefined();
    const near = await page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics());
    expect(near?.lod).toBe('near-sprites'); expect(near?.warnings).toEqual([]);
    // Only the individually approved Ashen scout has a faction idle clip.
    // Other cultures/roles remain genuinely static, including every hull.
    const animatedScouts = near?.visibleEntityArt.filter(entity => entity.assetId === 'unit.scout.ashen_compact') ?? [];
    expect(near?.visibleAnimationFrames).toHaveLength(animatedScouts.length);
    for (const animation of near?.visibleAnimationFrames ?? []) expect(animation).toEqual({ contentId: 'unit.scout.ashen_compact', frameId: expect.stringMatching(/^unit\.scout\.ashen_compact\/idle\/se\/[0-3]$/) });
    for (const entity of near?.visibleEntityArt ?? []) {
      expect(entity.assetId).toBe(factionArtId(entity.role, entity.definitionId!));
      expect(entity.tint).toBe(0xffffff);
      expect(entity.nativeWidth).toBe(entity.role === 'settlement.city' ? 128 : entity.role.startsWith('settlement.') || entity.role === 'unit.cavalry' ? 96 : 64);
      expect(entity.nativeHeight).toBe(entity.nativeWidth);
    }
    for (const id of near?.visibleAssetIds ?? []) allNearAssets.add(id);
    inspections.push({ label, near, framing });
    await page.screenshot({ path: testInfo.outputPath(`${label}-near.png`), fullPage: true });
  };
  await inspectNear(`${cohort.label}-units-and-villages`, cohort.families.flatMap(family => [...ROLES, TOWN_ROLES[0]!].map(role => `${role}.${family}`)));
  if (index === 0) {
    // A sprite's larger visual canvas does not replace the canonical hex hit target.
    await page.keyboard.press('Escape');
    const target = cell(19, 12);
    const point = await page.evaluate(cell => window.__THEANDRIL__?.getCellScreenPoint(cell), target);
    if (!point?.inViewport) throw new Error('Visible Reedbound guard is not on the real map canvas');
    await page.mouse.click(point.x, point.y);
    await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getSelection()?.cell)).toBe(target);
  }
  // Keep every development stage at the same native camera scale, not squeezed into one giant screenshot.
  for (let stage = 1; stage < TOWN_ROLES.length; stage++) {
    await selectGalleryArmy(page, `${cohort.label} stage-${stage + 1} survey`);
    await inspectNear(`${cohort.label}-stage-${stage + 1}`, cohort.families.map(family => `${TOWN_ROLES[stage]}.${family}`));
  }
  await selectGalleryArmy(page, `${cohort.label} unit survey`);
  await page.getByRole('button', { name: 'Zoom out', exact: true }).click({ clickCount: 4, delay: 60 });
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics()?.lod)).toBe('strategic-glyphs');
  const expectedFar = cohort.families.flatMap(family => [`ui.badge.${family}`, `ui.banner.${family}`]);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics()?.visibleAssetIds)).toEqual(expect.arrayContaining(expectedFar));
  const far = await page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics());
  expect(far?.visibleAnimationFrames).toEqual([]);
  expect(far?.visibleEntityArt.every(entity => entity.presentation === 'strategic' && entity.tint === 0xffffff)).toBe(true);
  expect(far?.visibleEntityArt.every(entity => entity.nativeWidth === (entity.role.startsWith('settlement.') ? 64 : 32))).toBe(true);
  const metrics = await page.evaluate(() => window.__THEANDRIL__?.getPerformanceCounters());
  expect(metrics?.visibleSprites).toBeLessThanOrEqual(metrics?.visibleEntities ?? 0);
  if (index === 0) expect(metrics?.visibleSprites).toBeLessThan(metrics?.visibleEntities ?? 0); // Actual co-located reserve grouping.
  for (const id of far?.visibleAssetIds ?? []) allFarAssets.add(id);
  inspections.push({ label: cohort.label, far, metrics });
  await page.screenshot({ path: testInfo.outputPath(`${cohort.label}-far.png`), fullPage: true });
  expect([...allNearAssets]).toEqual(expect.arrayContaining(cohort.families.flatMap(family => [...ROLES, ...TOWN_ROLES].map(role => `${role}.${family}`))));
  expect([...allFarAssets]).toEqual(expect.arrayContaining(cohort.families.flatMap(family => [`ui.badge.${family}`, `ui.banner.${family}`])));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Focus selection', exact: true }).click();
  await page.getByTestId('map-container').scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath(`${FACTION_ART_FAMILIES.length}-cultures-narrow.png`) });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.evaluate(() => window.__THEANDRIL__?.getStateHash())).toBe(hash);
  const evidence = testInfo.outputPath('faction-art-inspection.json');
  await writeFile(evidence, JSON.stringify({ hash, cohort: cohort.label, families: cohort.families, fullFixtureFamilies: FACTION_ART_FAMILIES, inspections, coveredNearAssetIds: [...allNearAssets].sort(), coveredStrategicAssetIds: [...allFarAssets].sort(), notes: ['Authored Small-map placement imported through validated save boundary; no runtime mutation hooks.', 'This case independently imports the same complete24-culture/72-town world and reviews one six-culture cohort at same-scale village/town/city cameras. The four disjoint cases cover all24 families without shrinking native art or raising the45-second test timeout.', 'Only actually visible enemies supplied art metadata; an off-gallery army remains genuinely unseen.', 'One approved four-frame Ashen scout idle; all other faction assets static. Native32px badges and64px banners use exact nearest2:1 reduction at strategic zoom.', 'Selection, zoom and narrow resizing did not alter canonical state.'] }, null, 2));
  await testInfo.attach('faction-art-inspection.json', { path: evidence, contentType: 'application/json' });
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
