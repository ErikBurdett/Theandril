import { expect, test, type Page } from '@playwright/test';
import { IMPROVEMENTS } from '@theandril/content';
import { serializeGame } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { tileFootprintCampaign } from '../../packages/test-fixtures/src/tile-footprints';
import { tileFootprintContained } from '../../packages/render/src/tile-footprint';
import { selectFromRegistry } from './ui-navigation';

async function mapZoom(page: Page) {
  return page.evaluate(() => {
    const zoom = window.__THEANDRIL__!.getPerformanceCounters().zoom;
    if (typeof zoom !== 'number') throw new Error('Missing actual map camera scale.');
    return zoom;
  });
}

async function load(page: Page, rememberForeignSite = false) {
  const fixture = tileFootprintCampaign({ rememberForeignSite });
  await page.goto('/');
  await page.getByLabel('Import save file').setInputFiles({ name: 'tile-footprints.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(fixture.game))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()?.atlasPages)).toBe(2);
  await expect(page.getByTestId('art-runtime-status')).toContainText('pixel pack');
  return fixture;
}

/** Camera movement uses the real canvas, never a renderer mutation hook. */
async function dragToCell(page: Page, cell: number) {
  const canvas = page.getByTestId('map-container');
  await canvas.scrollIntoViewIfNeeded();
  for (let step = 0; step < 12; step++) {
    const box = await canvas.boundingBox(), point = await page.evaluate(cell => window.__THEANDRIL__!.getCellScreenPoint(cell), cell);
    if (!box || !point) throw new Error('Missing map projection for footprint review.');
    const dx = box.x + box.width / 2 - point.x, dy = box.y + box.height / 2 - point.y;
    if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
    const amount = Math.max(1, Math.abs(dx) / (box.width * .3), Math.abs(dy) / (box.height * .3));
    const x = box.x + box.width / 2, y = box.y + box.height / 2;
    await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + dx / amount, y + dy / amount, { steps: 5 }); await page.mouse.up();
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
  }
  throw new Error('Actual pointer drags did not center the footprint review.');
}

test('all ten paid improvements retain containment while camp, town, capital fill their hex with untinted opaque bodies', async ({ page }, info) => {
  await page.setViewportSize({ width: 1680, height: 1120 });
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  const fixture = await load(page);
  const hash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  await selectFromRegistry(page, 'settlements', /Inset Capital/);
  await dragToCell(page, fixture.towns[0]!.cell + 2);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.tileFootprints.filter(item => item.role === 'improvement').length)).toBe(10);
  const initial = await page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!);
  for (const [i, cell] of fixture.siteCells.entries()) {
    const footprint = initial.tileFootprints.find(item => item.cell === cell && item.role === 'improvement');
    expect(footprint).toMatchObject({ contentId: IMPROVEMENTS[i]!.id, presentation: 'approved', alpha: 1 });
    expect(footprint!.boundsKind).toBe('opaque-union');
    expect(tileFootprintContained(footprint!)).toBe(true);
    expect(footprint!.bounds.width).toBeGreaterThan(25);
  }
  for (const [i, town] of fixture.towns.entries()) {
    const footprint = initial.tileFootprints.find(item => item.cell === town.cell && item.role !== 'improvement')!;
    expect(footprint).toMatchObject({ role: ['city', 'town', 'village'][i], presentation: 'approved', boundsKind: 'opaque-union' });
    expect(tileFootprintContained(footprint)).toBe(true);
    // Actual Ashen opaque widths, not the padded 96/128 source canvas. These
    // lower bounds also reject accidentally restoring the tiny old fit.
    expect(footprint.bounds.width).toBeGreaterThan([41, 39, 35][i]!);
    expect(footprint.canvasBounds!.width).toBeGreaterThan(footprint.bounds.width);
  }
  expect(initial.visibleEntityArt.filter(item => fixture.towns.some(town => town.id === item.entityId)).every(item => item.tint === 0xffffff)).toBe(true);
  expect(initial.visibleEntityArt.some(item => item.entityId === fixture.hidden.id)).toBe(false);
  await page.getByTestId('map-container').screenshot({ path: info.outputPath('all-ten-works-and-three-town-stages.png') });
  for (const town of fixture.towns) {
    await selectFromRegistry(page, 'settlements', new RegExp(town.name));
    await page.getByTestId('map-container').scrollIntoViewIfNeeded();
    await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.overlays.selectedAsset.entityId)).toBe(town.id);
    const selectedArt = await page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!), selection = selectedArt.overlays.selectedAsset;
    const footprint = selectedArt.tileFootprints.find(item => item.cell === town.cell && item.role !== 'improvement')!;
    expect(selection.mode).toBe('silhouette');
    // Selected-asset diagnostics measure the external one-native-pixel contour,
    // not the opaque body. Both sides inherit the body's exact uniform scale.
    expect(selection.bounds.width).toBeCloseTo(footprint.bounds.width + 2 * footprint.scale, 8);
    expect(selection.bounds.height).toBeCloseTo(footprint.bounds.height + 2 * footprint.scale, 8);
    expect(tileFootprintContained(footprint)).toBe(true);
    // Same actual camera magnification for each stage; do not compare a camp
    // at 1.95× with a city at 1.25× or shrink artwork merely for a screenshot.
    for (let step = 0; step < 8 && await mapZoom(page) < 2.2; step++) await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
    expect(await mapZoom(page)).toBe(2.2);
    await page.getByTestId('map-container').screenshot({ path: info.outputPath(`${town.name.replaceAll(' ', '-').toLowerCase()}-near.png`) });
  }
  // Stop at the first genuine far-marker step instead of accidentally reaching
  // Tiny's fit-to-world raster, where omission of all entities is intentional.
  for (let step = 0; step < 8 && await mapZoom(page) >= .65; step++) await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.lod)).toBe('strategic-glyphs');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().overview)).toBe(false);
  await dragToCell(page, fixture.towns[0]!.cell + 2);
  const far = await page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!);
  // Far heraldry is deliberately sized in screen pixels, not fitted into a shrinking hex.
  expect(far.tileFootprints.filter(item => item.role !== 'improvement')).toHaveLength(0);
  for (const town of fixture.towns) {
    const marker = far.visibleEntityArt.find(item => item.entityId === town.id)!;
    expect(Math.max(marker.screenWidth!, marker.screenHeight!)).toBeCloseTo(44);
  }
  for (const town of fixture.towns) expect(far.visibleEntityArt.find(item => item.entityId === town.id)).toMatchObject({ presentation: 'strategic', assetId: 'ui.banner.ashen_compact' });
  for (const footprint of far.tileFootprints) expect(tileFootprintContained(footprint)).toBe(true);
  await page.getByTestId('map-container').screenshot({ path: info.outputPath('three-town-far-markers.png') });
  const rebuilds = await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().chunkRebuilds);
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  expect(await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().chunkRebuilds)).toBe(rebuilds);
  await page.getByRole('button', { name: 'World overview', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.lod)).toBe('world-overview');
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.tileFootprints)).toEqual([]);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.visibleEntityArt)).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  await selectFromRegistry(page, 'settlements', /Inset Capital/);
  await page.getByRole('button', { name: 'Focus selection', exact: true }).click();
  await page.getByTestId('map-container').scrollIntoViewIfNeeded();
  for (let step = 0; step < 8 && await mapZoom(page) < 2.2; step++) await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.overlays.selectedAsset.entityId)).toBe(fixture.towns[0]!.id);
  await page.getByTestId('map-container').screenshot({ path: info.outputPath('capital-and-works-390.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);
  await info.attach('tile-footprints.json', { body: JSON.stringify({ hash, authoredSetup: 'Terrain, treasury and populations authored; all ten improvements paid and completed through actual commands.', paidWorks: fixture.paidWorks, initial, far }, null, 2), contentType: 'application/json' });
  expect(errors).toEqual([]);
});

test('a previously scouted empty foreign field does not reveal its later improvement while zooming and inspecting fog', async ({ page }, info) => {
  const fixture = await load(page, true), cell = fixture.hidden.improvementCell;
  const hash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  expect(await page.evaluate(cell => window.__THEANDRIL__!.getTerrainArt(cell), cell)).toMatchObject({ visible: false, improvementId: null, improvementPresentation: null });
  await page.keyboard.press('Escape');
  await dragToCell(page, cell);
  const point = await page.evaluate(cell => window.__THEANDRIL__!.getCellScreenPoint(cell), cell);
  expect(point?.inViewport).toBe(true);
  await page.mouse.click(point!.x, point!.y);
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  const art = await page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!);
  expect(art.tileFootprints.some(item => item.cell === cell && item.role === 'improvement')).toBe(false);
  expect(art.visibleEntityArt.some(item => item.entityId === fixture.hidden.id)).toBe(false);
  await page.getByTestId('map-container').screenshot({ path: info.outputPath('remembered-field-no-hidden-work.png') });
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);
});
