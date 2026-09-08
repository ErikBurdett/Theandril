import { expect, test, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { hexDistance, isPassable } from '@theandril/mapgen';
import { createArmyFormation, deserializeGame, serializeGame, stateHash } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { factionArtId } from '@theandril/art-pipeline/runtime';
import { matureCampaign } from '../../packages/test-fixtures/src/index';
import { refreshAuthoredSight } from '../../packages/test-fixtures/src/authored-land';
import { selectFromRegistry } from './ui-navigation';

function stackedCampaign() {
  const fixture = matureCampaign('huge'), owner = fixture.turnOwnerId;
  const armies = Object.values(fixture.armies).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const home = fixture.world.starts[0]!;
  const foreignTowns = new Set(Object.values(fixture.settlements).filter(town => town.factionId !== owner).map(town => town.cell));
  const positions = Array.from(fixture.world.terrain.keys()).filter(cell => isPassable(fixture.world.terrain[cell]!)
    && hexDistance(cell, home, fixture.world.width) <= 5 && !foreignTowns.has(cell))
    .sort((a, b) => hexDistance(a, home, fixture.world.width) - hexDistance(b, home, fixture.world.width) || a - b);
  if (armies.length !== 1500 || positions.length < 20) throw new Error('Stack workload requires 1,500 containers and a real passable neighborhood.');
  for (const [index, army] of armies.entries()) {
    // Authored stress setup only: concentrate real legal formations into friendly
    // stacks. This is not a campaign earned by recruitment or conquest.
    army.factionId = owner; army.cell = positions[index % positions.length]!;
    army.name = `Stack load ${army.id}`; army.movement = 3;
    army.formations = Array.from({ length: 12 }, () => createArmyFormation(`army.${fixture.nextId++}`, 'unit.guard'))
      .sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  }
  fixture.explored[owner] = new Set(fixture.world.terrain.keys());
  refreshAuthoredSight(fixture);
  const serialized = serializeGame(fixture), state = deserializeGame(serialized);
  return { state, serialized, positions, selectedId: armies[0]!.id, home };
}

const counters = (page: Page) => page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters());

test('synthetic Huge 1500 twelve-formation armies keep representative stacks bounded through near, far, full fit and restored focus', async ({ page }, testInfo) => {
  const { state, serialized, positions, selectedId, home } = stackedCampaign();
  const hash = stateHash(state), cellCount = state.world.terrain.length;
  const armyCount = Object.keys(state.armies).length, formationCount = Object.values(state.armies).reduce((sum, army) => sum + army.formations.length, 0);
  expect(armyCount).toBe(1500); expect(formationCount).toBe(18000);
  expect(Object.values(state.armies).every(army => army.factionId === state.turnOwnerId && army.formations.length === 12)).toBe(true);
  const bytes = await exportSave(serialized);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'synthetic-huge-stacks.theandril', mimeType: 'application/gzip', buffer: Buffer.from(bytes) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()?.state)).toBe('ready');
  await selectFromRegistry(page, 'armies', state.armies[selectedId]!.name);
  await page.getByRole('button', { name: 'Focus selection', exact: true }).click();
  const observed = await page.evaluate(() => {
    const view = window.__THEANDRIL__!.getSummary()!;
    return { armies: view.armies.length, ownArmies: view.ownArmies.length,
      formations: view.armies.reduce((sum, army) => sum + army.formations.length, 0),
      exploredCells: view.exploredCells, reactCells: view.cells.length, turn: view.turn };
  });
  expect(observed).toMatchObject({ armies: 1500, ownArmies: 1500, formations: 18000, exploredCells: cellCount, reactCells: 0, turn: state.turn });

  const samples: { stage: string; warmedFrames: number; metrics: Awaited<ReturnType<typeof counters>>;
    renderedArmyGroups: number; representedArmies: number; representedFormations: number; armySprites: number }[] = [];
  const sample = async (stage: string) => {
    const frame = (await counters(page)).frameCount ?? 0;
    await page.waitForFunction(frame => (window.__THEANDRIL__!.getPerformanceCounters().frameCount ?? 0) >= frame + 75, frame);
    const metrics = await counters(page);
    const rendered = await page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.visibleEntityArt
      .filter(entity => entity.formationCount !== null)
      .map(entity => ({ id: entity.entityId, formations: entity.formationCount!, representatives: entity.representativeCount, assetId: entity.assetId,
        stackArmies: entity.stackArmyCount, stackFormations: entity.stackFormationCount })));
    expect(metrics.cachedChunks).toBeLessThanOrEqual(64);
    expect(metrics.maxCachedChunkWidth).toBeLessThanOrEqual(900);
    expect(metrics.maxCachedChunkHeight).toBeLessThanOrEqual(760);
    expect(metrics.cachedTextureBytesEstimate).toBeLessThanOrEqual(64 * 4 * 1024 * 1024);
    expect(metrics.residentAtlasBytesEstimate).toBeGreaterThan(0);
    expect(metrics.residentAtlasBytesEstimate).toBeLessThanOrEqual(16 * 1024 * 1024);
    // Terrain sprites can reside in64 cached chunks plus the independently
    // bounded16-chunk recycle pool. Figures cap at3 per actual container.
    expect(metrics.pooledSprites).toBeLessThanOrEqual((64 + 16) * 256 + positions.length * 3 + Object.keys(state.settlements).length);
    expect(metrics.pooledStackBadges).toBeLessThanOrEqual(positions.length);
    expect(metrics.landQueryCount).toBe(0);
    expect(metrics.cellTransferBytes).toBeGreaterThan(cellCount * 9);
    expect(metrics.cellTransferBytes).toBeLessThan(3 * 1024 * 1024);
    expect(metrics.transferBytes).toBeGreaterThan(metrics.cellTransferBytes);
    if (!metrics.overview) {
      expect(metrics.visibleCells).toBeLessThan(10000);
      expect(metrics.visibleSprites).toBeLessThanOrEqual((metrics.visibleEntities ?? 0) * 3);
    }
    expect(rendered.every(army => army.formations === 12 && army.representatives >= 1 && army.representatives <= 3)).toBe(true);
    expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);
    expect(await page.evaluate(() => window.__THEANDRIL__!.getTurn())).toBe(state.turn);
    const armySprites = rendered.reduce((sum, army) => sum + army.representatives, 0);
    const representedArmies = rendered.reduce((sum, army) => sum + army.stackArmies, 0);
    const representedFormations = rendered.reduce((sum, army) => sum + army.stackFormations, 0);
    expect(representedArmies).toBe(metrics.overview ? 0 : armyCount);
    expect(representedFormations).toBe(metrics.overview ? 0 : formationCount);
    samples.push({ stage, warmedFrames: (metrics.frameCount ?? 0) - frame, metrics, renderedArmyGroups: rendered.length,
      representedArmies, representedFormations, armySprites });
    return { metrics, rendered, armySprites };
  };

  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()?.lod)).toBe('near-sprites');
  const near = await sample('all-1500-composed-armies-near');
  expect(near.rendered).toHaveLength(positions.length); expect(near.armySprites).toBe(positions.length * 3);
  const definitionId = state.factions.find(faction => faction.id === state.turnOwnerId)!.definitionId;
  expect(near.rendered.every(army => army.assetId === factionArtId('unit.guard', definitionId))).toBe(true);
  expect(near.metrics.visibleEntities).toBeGreaterThanOrEqual(1500);
  expect(near.metrics.visibleSprites).toBe(positions.length * 3 + 1);
  expect(near.metrics.stackBadges).toBe(positions.length);
  await page.getByTestId('map-container').screenshot({ path: testInfo.outputPath('huge-1500-composed-armies-near.png') });

  await page.getByRole('button', { name: 'Zoom out', exact: true }).click({ clickCount: 4, delay: 60 });
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()?.lod)).toBe('strategic-glyphs');
  const far = await sample('same-neighborhood-strategic-aggregation');
  expect(far.metrics.overview).toBe(false);
  expect(far.metrics.visibleEntities).toBeGreaterThanOrEqual(1500);
  expect(far.rendered).toHaveLength(positions.length);
  expect(far.rendered.every(army => army.representatives === 1)).toBe(true);
  expect(far.metrics.visibleSprites).toBeLessThan(1500);
  expect(far.metrics.pooledSprites).toBeGreaterThanOrEqual(positions.length * 3);
  expect(far.metrics.stackBadges).toBe(0);
  await page.getByTestId('map-container').screenshot({ path: testInfo.outputPath('huge-composed-armies-strategic.png') });

  const map = page.getByTestId('map-container'); await map.focus();
  for (let index = 0; index < 40; index++) await map.press('-');
  const fit = await sample('normal-minus-zoom-whole-world-fit');
  expect(fit.metrics.overview).toBe(true); expect(fit.metrics.zoom).toBeLessThan(.05);
  expect(fit.metrics.visibleCells).toBe(cellCount); expect(fit.metrics.visibleEntities).toBe(0);
  expect(fit.metrics.visibleSprites).toBe(1); expect(fit.metrics.visibleChunks).toBe(0);
  expect(fit.rendered).toHaveLength(0);
  expect(fit.metrics.stackBadges).toBe(0);
  expect(fit.metrics.overviewTextureBytes).toBe((state.world.width * 2 + 1) * state.world.height * 2 * 4);
  expect(fit.metrics.overviewTextureBytes).toBeLessThan(4 * 1024 * 1024);
  await map.screenshot({ path: testInfo.outputPath('huge-composed-armies-whole-world.png') });

  await page.getByRole('button', { name: 'Focus selection', exact: true }).click();
  const restored = await sample('restored-selection-composed-armies');
  expect(restored.metrics.overview).toBe(false);
  expect(restored.rendered).toHaveLength(positions.length); expect(restored.armySprites).toBe(positions.length * 3);
  expect(restored.metrics.stackBadges).toBe(positions.length);
  expect(restored.metrics.overviewTextureBytes).toBe(fit.metrics.overviewTextureBytes);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSelection().armyId)).toBe(selectedId);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.cells)).toEqual([]);
  await map.screenshot({ path: testInfo.outputPath('huge-composed-armies-restored-focus.png') });

  const report = { workload: 'Synthetic gen4 Huge mature fixture: 32 factions and32 towns retained; all1500 existing army containers explicitly reassigned to the player, moved onto nearby passable cells, and filled with12 legal guard formations each. Fully explored terrain. Strict save/import, no runtime state mutation or turn advancement.',
    comparison: 'Retains the gen4 physical world and authored near-home placement workload of docs/performance/0030-army-stacks-before.json (historical seal 436e19c5): 1,500 visible containers and 18,000 actual formations, previously 4,500 near figures. Current schema 13/roster 4/content and the 500-asset publication differ from that historical checkpoint, so this is NOT a byte-identical saved fixture; the report hash field records the current run seal. Co-located grouping draws 273 figures for 91 groups; stack metadata still totals every army/formation. NOT a matched comparison to art-performance.spec.ts, which uses 1,500 global singleton armies with ordinary ownership/fog.',
    measurementNotes: 'Each phase waits at least75 renderer frames. frameP95Ms is the rolling240-frame metric, not a fresh independent percentile. renderCpuMs is one sampled frame, not GPU duration. Actual worker packed and total transfer bytes are recorded; no claim that the enlarged roster payload matches the singleton byte budget. Cached chunk/POT estimates, map atlas and retained overview texture are distinct allocations; DOM atlas decoding and other GPU allocations are not included.',
    seed: state.world.seed, generatorVersion: state.world.generatorVersion, cellCount, armyCount, formationCount,
    occupiedCells: positions.length, home, selectedId, hash, observed, saveBytes: Buffer.byteLength(serialized), compressedSaveBytes: bytes.byteLength, samples };
  const reportPath = testInfo.outputPath('army-size-performance.json');
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  await testInfo.attach('army-size-performance.json', { path: reportPath, contentType: 'application/json' });
  console.log('Synthetic Huge composed-army measurements:', JSON.stringify(report));
  expect(errors).toEqual([]);
});
