import { expect, test, type Page } from '@playwright/test';
import { openSelectedOrders, selectFromRegistry } from './ui-navigation';
import { writeFile } from 'node:fs/promises';
import { factionArtId, type RuntimeCatalog } from '@theandril/art-pipeline/runtime';
import { exportSave } from '@theandril/persistence';
import { serializeGame } from '@theandril/sim';
import { NAVAL_ART_CARGO_NAME, NAVAL_ART_COHORTS, NAVAL_ART_HIDDEN_NAME, NAVAL_ART_ROLES, navalArtCell, navalArtGallery } from '../../packages/test-fixtures/src/naval-art-fixture';

const SAVE = serializeGame(navalArtGallery());
async function selectArmy(page: Page, name: string): Promise<void> {
  await selectFromRegistry(page, 'armies', name);
}
async function loadGallery(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1680, height: 1320 });
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'twenty-four-culture-navies.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(SAVE)) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await selectArmy(page, `${NAVAL_ART_COHORTS[0]!.label} harbor survey`);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics()?.state)).toBe('ready');
}

test('all twenty-four cultures show three distinct approved naval hulls, stable strategic badges and canonical fog without duplicate passengers', async ({ page }, testInfo) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await loadGallery(page);
  const hash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  const summary = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!);
  expect(summary.factions).toHaveLength(24);
  expect(summary.armies.filter(army => army.domain === 'naval')).toHaveLength(72);
  expect(summary.armies.some(army => army.name === NAVAL_ART_HIDDEN_NAME)).toBe(false);
  const cargoId = summary.ownArmies.find(army => army.name === NAVAL_ART_CARGO_NAME)!.id;
  const covered = new Set<string>(), inspections: unknown[] = [];
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  for (const [index, cohort] of NAVAL_ART_COHORTS.entries()) {
    if (index) for (let step = 0; step < 4; step++) await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
    await selectArmy(page, `${cohort.label} harbor survey`);
    await page.keyboard.press('Escape');
    const expected = cohort.families.flatMap(family => NAVAL_ART_ROLES.map(role => `${role}.${family}`));
    const canvas = await page.getByTestId('map-container').locator('canvas').boundingBox();
    if (!canvas) throw new Error('Naval gallery requires the real map canvas.');
    const beforePan = await page.evaluate(ids => {
      const api = window.__THEANDRIL__!, view = api.getSummary()!;
      const canvas = document.querySelector('[data-testid="map-container"] canvas')!.getBoundingClientRect();
      const title = document.querySelector('.map-title')?.getBoundingClientRect();
      if (!title) throw new Error('The real map title is required for gallery clearance.');
      const hint = document.querySelector('.map-order-hint')?.getBoundingClientRect();
      // Use every required observed army, including one whose anchor is visible
      // but whose larger native canvas might currently extend beyond the viewport.
      const hulls = view.armies.filter(army => {
        const definition = view.factions.find(faction => faction.id === army.factionId)?.definitionId;
        return definition && ids.includes(`${army.unitId}.${definition.slice('faction.'.length)}`);
      }).map(army => {
        const point = api.getCellScreenPoint(army.cell)!, right = api.getCellScreenPoint(army.cell + 1)!, down = api.getCellScreenPoint(army.cell + view.width)!;
        const scaleX = (right.x - point.x) / 56, scaleY = (down.y - point.y) / 48;
        return { left: point.x - 48 * scaleX, right: point.x + 48 * scaleX, top: point.y - 80 * scaleY, bottom: point.y + 16 * scaleY };
      });
      return { hulls, zoom: api.getPerformanceCounters().zoom,
        minDx: Math.max(canvas.left, title.right, hint?.right ?? -Infinity) + 8 - Math.min(...hulls.map(hull => hull.left)),
        maxDx: canvas.right - 8 - Math.max(...hulls.map(hull => hull.right)),
        minDy: canvas.top + 8 - Math.min(...hulls.map(hull => hull.top)),
        maxDy: canvas.bottom - 8 - Math.max(...hulls.map(hull => hull.bottom)) };
    }, expected);
    expect(beforePan.hulls).toHaveLength(18);
    expect(beforePan.minDx).toBeLessThanOrEqual(beforePan.maxDx);
    expect(beforePan.minDy).toBeLessThanOrEqual(beforePan.maxDy);
    const pan = { x: (beforePan.minDx + beforePan.maxDx) / 2, y: (beforePan.minDy + beforePan.maxDy) / 2 };
    expect(Math.abs(pan.x)).toBeLessThan(canvas.width - 32); expect(Math.abs(pan.y)).toBeLessThan(canvas.height - 32);
    // Center all full canvases within the measured available rectangle using
    // an ordinary drag. No zoom change, CSS hiding or sprite-bound relaxation.
    const start = { x: canvas.x + canvas.width / 2 - pan.x / 2, y: canvas.y + canvas.height / 2 - pan.y / 2 };
    if (Math.hypot(pan.x, pan.y) > 5) {
      await page.mouse.move(start.x, start.y); await page.mouse.down();
      await page.mouse.move(start.x + pan.x, start.y + pan.y, { steps: 10 }); await page.mouse.up();
    }
    await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()?.visibleAssetIds)).toEqual(expect.arrayContaining(expected));
    const near = await page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!);
    expect(near.lod).toBe('near-sprites'); expect(near.warnings).toEqual([]);
    // Shore observers can use the one approved faction idle animation; the
    // seventy-two hulls remain static and never inherit a land-unit clip.
    const animatedScouts = near.visibleEntityArt.filter(entity => entity.assetId === 'unit.scout.ashen_compact');
    expect(near.visibleAnimationFrames).toHaveLength(animatedScouts.length);
    for (const animation of near.visibleAnimationFrames) expect(animation).toEqual({ contentId: 'unit.scout.ashen_compact', frameId: expect.stringMatching(/^unit\.scout\.ashen_compact\/idle\/se\/[0-3]$/) });
    expect(near.visibleEntityArt.some(entity => entity.entityId === cargoId)).toBe(false);
    const hulls = near.visibleEntityArt.filter(entity => expected.includes(entity.assetId ?? ''));
    expect(hulls).toHaveLength(18);
    for (const hull of hulls) {
      expect(hull.assetId).toBe(factionArtId(hull.role, hull.definitionId!));
      expect(hull).toMatchObject({ presentation: 'faction', nativeWidth: 96, nativeHeight: 96, tint: 0xffffff });
      covered.add(hull.assetId!);
    }
    const framing = await page.evaluate(ids => {
      const api = window.__THEANDRIL__!, diagnostics = api.getArtDiagnostics()!, view = api.getSummary()!;
      const canvas = document.querySelector('[data-testid="map-container"] canvas')!.getBoundingClientRect();
      const title = document.querySelector('.map-title')?.getBoundingClientRect();
      const hint = document.querySelector('.map-order-hint')?.getBoundingClientRect();
      return { canvas: { left: canvas.left, right: canvas.right, top: canvas.top, bottom: canvas.bottom }, overlayRight: Math.max(title?.right ?? 0, hint?.right ?? 0),
        hulls: diagnostics.visibleEntityArt.filter(art => ids.includes(art.assetId ?? '')).map(art => {
          const army = view.armies.find(army => army.id === art.entityId)!;
          const point = api.getCellScreenPoint(army.cell)!, right = api.getCellScreenPoint(army.cell + 1)!, down = api.getCellScreenPoint(army.cell + view.width)!;
          const scaleX = (right.x - point.x) / 56, scaleY = (down.y - point.y) / 48;
          return { assetId: art.assetId, left: point.x - 48 * scaleX, right: point.x + 48 * scaleX, top: point.y - 80 * scaleY, bottom: point.y + 16 * scaleY };
        }) };
    }, expected);
    expect(await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().zoom)).toBe(beforePan.zoom);
    for (const hull of framing.hulls) {
      expect(hull.left).toBeGreaterThan(Math.max(framing.canvas.left, framing.overlayRight) + 2);
      expect(hull.right).toBeLessThan(framing.canvas.right - 2);
      expect(hull.top).toBeGreaterThan(framing.canvas.top + 2);
      expect(hull.bottom).toBeLessThan(framing.canvas.bottom - 2);
    }
    await page.screenshot({ path: testInfo.outputPath(`${cohort.label}-all-three-hulls-near.png`), fullPage: true });
    // Art anchors never replace the canonical hex hit target.
    const target = navalArtCell(cohort.offset + 20, 12), point = await page.evaluate(cell => window.__THEANDRIL__!.getCellScreenPoint(cell), target);
    expect(point?.inViewport).toBe(true); await page.mouse.click(point!.x, point!.y);
    await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSelection().cell)).toBe(target);
    await page.keyboard.press('Escape');
    for (let step = 0; step < 4; step++) await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
    await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()?.lod)).toBe('strategic-glyphs');
    const badges = cohort.families.map(family => `ui.badge.${family}`);
    await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()?.visibleAssetIds)).toEqual(expect.arrayContaining(badges));
    const far = await page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!);
    const fleetBadges = far.visibleEntityArt.filter(entity => NAVAL_ART_ROLES.some(role => role === entity.role));
    expect(fleetBadges.length).toBeGreaterThanOrEqual(18);
    expect(fleetBadges.every(entity => entity.assetId === factionArtId('ui.badge', entity.definitionId!) && entity.presentation === 'strategic' && entity.nativeWidth === 32 && entity.tint === 0xffffff)).toBe(true);
    expect(far.visibleEntityArt.some(entity => entity.entityId === cargoId)).toBe(false);
    await page.screenshot({ path: testInfo.outputPath(`${cohort.label}-naval-strategic.png`), fullPage: true });
    inspections.push({ cohort: cohort.label, pan, beforePan, near, framing, far });
  }
  expect(covered.size).toBe(72);
  expect([...covered].sort()).toEqual(NAVAL_ART_COHORTS.flatMap(cohort => cohort.families.flatMap(family => NAVAL_ART_ROLES.map(role => `${role}.${family}`))).sort());
  await page.setViewportSize({ width: 390, height: 844 });
  const transportName = summary.ownArmies.find(army => army.unitId === 'unit.transport')!.name;
  await selectArmy(page, transportName);
  await openSelectedOrders(page);
  await page.getByTestId('army-composition').locator(':scope > summary').click();
  const frame = page.locator('.formation-choice [data-art-id="unit.transport.ashen_compact"]');
  await expect(frame).toHaveAttribute('data-art-state', 'ready');
  await expect(frame).toHaveAttribute('data-art-rendered-id', 'unit.transport.ashen_compact');
  expect(await frame.evaluate(element => ({ width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height }))).toEqual({ width: 96, height: 96 });
  await frame.scrollIntoViewIfNeeded(); await page.screenshot({ path: testInfo.outputPath('approved-transport-roster-narrow.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);
  const evidence = testInfo.outputPath('naval-art-inspection.json');
  await writeFile(evidence, JSON.stringify({ covered: [...covered].sort(), inspections, notes: ['Authored placement and shallow geography, validated by canonical save import; actual existing hull definitions.', 'A real embark command carries the guard; cargo remains in its observed army read model but never receives a duplicate map marker.', 'Four six-culture galleries retain native96 framing; all72 hulls use one static southeast pose. Only approved Ashen scout observers animate.', 'Fog-hidden reserve never entered the renderer. Camera/selection/resizing left canonical state unchanged.'] }, null, 2));
  await testInfo.attach('naval-art-inspection.json', { path: evidence, contentType: 'application/json' });
  expect(errors).toEqual([]);
});

test('an absent approved naval variant falls back to a ship marker, never another culture or a land unit', async ({ page }) => {
  const missingId = 'unit.coastal_warship.reedbound_council';
  await page.route('**/art/catalog.json', async route => {
    const response = await route.fetch(), catalog = await response.json() as RuntimeCatalog;
    const missing = catalog.assets.find(asset => asset.id === missingId), atlas = catalog.atlases.find(atlas => atlas.id === missing?.atlasId);
    if (!missing || !atlas) throw new Error('Naval missing-variant check requires the published approved asset.');
    await page.route(`**${atlas.jsonUrl}`, async atlasRoute => {
      const response = await atlasRoute.fetch(), metadata = await response.json();
      for (const frame of missing.frames) delete metadata.frames[frame.id];
      for (const clip of missing.clips) delete metadata.animations[clip.id];
      await atlasRoute.fulfill({ response, json: metadata });
    });
    catalog.assets = catalog.assets.filter(asset => asset.id !== missingId);
    await route.fulfill({ response, json: catalog });
  });
  await loadGallery(page);
  const hash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  await expect(page.getByTestId('art-runtime-status')).toContainText('partial pixel pack');
  await expect(page.getByTestId('art-runtime-status')).toHaveAttribute('title', new RegExp(missingId));
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()?.visibleEntityArt.find(entity => entity.role === 'unit.coastal_warship' && entity.definitionId === 'faction.reedbound_council'))).toMatchObject({ assetId: null, presentation: 'procedural-coastal-warship', nativeWidth: null });
  const art = await page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!);
  expect(art.visibleAssetIds).not.toContain(missingId);
  expect(art.visibleAssetIds).toContain('unit.coastal_warship.glass_tide');
  expect(art.visibleAssetIds).not.toContain('unit.coastal_warship');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);
});
