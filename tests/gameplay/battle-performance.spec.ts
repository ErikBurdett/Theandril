import { expect, test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { serializeGame, stateHash } from '@theandril/sim';
import { CONTENT_HASH } from '@theandril/content';
import { exportSave } from '@theandril/persistence';
import { fullBattlefieldCampaign } from './battlefield-fixture';
import { openRealmAffairs, openSelectedOrders } from './ui-navigation';

test('authored twenty-versus-twenty battlefield measures real round playback with one shared renderer and bounded FX', async ({ page }, info) => {
  const state = fullBattlefieldCampaign(), serialized = serializeGame(state), originHash = stateHash(state);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByLabel('Import save file').setInputFiles({ name: 'twenty-versus-twenty.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serialized)) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()?.atlasPages)).toBe(1);
  const canvas = await page.getByTestId('map-container').locator('canvas').elementHandle();
  await openRealmAffairs(page); await page.getByRole('button', { name: 'Declare war on Reedbound Council', exact: true }).click();
  await openSelectedOrders(page);
  await page.getByRole('button', { name: 'Attack Reedbound Watch (army.4)', exact: true }).click();
  await expect(page.getByTestId('battle-panel')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()?.atlasPages)).toBe(2);
  const initial = await page.evaluate(() => ({ scene: window.__THEANDRIL__!.getBattleDiagnostics()!, metrics: window.__THEANDRIL__!.getPerformanceCounters() }));
  expect(initial.scene.formations.filter(item => item.side === 'attacker')).toHaveLength(20);
  expect(initial.scene.formations.filter(item => item.side === 'defender')).toHaveLength(20);
  expect(initial.scene.actors).toHaveLength(46);
  expect(initial.metrics.residentAtlasBytesEstimate).toBe(20 * 1024 * 1024);
  await expect(page.getByTestId('map-container').locator('canvas')).toHaveCount(1);
  expect(await page.evaluate(canvas => canvas === document.querySelector('[data-testid=map-container] canvas'), canvas)).toBe(true);
  const frame = initial.metrics.frameCount!;
  await page.waitForFunction(frame => window.__THEANDRIL__!.getPerformanceCounters().frameCount! >= frame + 60, frame);
  await page.getByRole('button', { name: 'Brace', exact: true }).click();
  await expect(page.getByTestId('battle-round')).toHaveText('1');
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getBattleDiagnostics()?.effects.some(effect => effect.assetId === 'effect.battle_melee' || effect.assetId === 'effect.battle_projectile'))).toBe(true);
  const commandHash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  const sample = await page.evaluate(async () => {
    const frames: number[] = [], cpu: number[] = [], effects = new Set<string>(), frameIds = new Set<string>();
    let previous = 0, maxEffects = 0, maxActors = 0, maxPool = 0, activeFrames = 0;
    for (let index = 0; index < 121; index++) {
      const time = await new Promise<number>(resolve => requestAnimationFrame(resolve));
      if (previous) frames.push(time - previous); previous = time;
      const scene = window.__THEANDRIL__!.getBattleDiagnostics()!, metrics = window.__THEANDRIL__!.getPerformanceCounters();
      cpu.push(metrics.renderCpuMs ?? 0); maxEffects = Math.max(maxEffects, scene.effects.length); maxActors = Math.max(maxActors, scene.actors.length); maxPool = Math.max(maxPool, scene.pooledEffects);
      if (scene.effects.length) activeFrames++;
      for (const effect of scene.effects) { effects.add(effect.assetId); frameIds.add(effect.frameId); }
    }
    const quantile = (values: number[], fraction: number) => [...values].sort((a, b) => a - b)[Math.min(values.length - 1, Math.floor(values.length * fraction))]!;
    return { frames: frames.length, frameMs: { p50: quantile(frames, .5), p95: quantile(frames, .95), max: Math.max(...frames) }, renderCpuMs: { p50: quantile(cpu, .5), p95: quantile(cpu, .95) }, activeFrames, maxEffects, maxActors, maxPool, effects: [...effects], frameIds: [...frameIds], scene: window.__THEANDRIL__!.getBattleDiagnostics()!, metrics: window.__THEANDRIL__!.getPerformanceCounters() };
  });
  expect(sample.frames).toBeGreaterThanOrEqual(120); expect(sample.activeFrames).toBeGreaterThan(0);
  expect(sample.maxActors).toBe(46); expect(sample.maxEffects).toBeGreaterThan(0); expect(sample.maxEffects).toBeLessThanOrEqual(12); expect(sample.maxPool).toBeLessThanOrEqual(12);
  expect(sample.scene.pooledActors).toBe(46); expect(sample.frameIds.length).toBeGreaterThan(1);
  expect(sample.metrics.chunkRebuilds).toBe(initial.metrics.chunkRebuilds);
  expect(sample.metrics.residentAtlasBytesEstimate).toBe(20 * 1024 * 1024);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(commandHash);
  await page.getByRole('button', { name: 'Pause actions', exact: true }).click();
  await page.getByTestId('map-container').screenshot({ path: info.outputPath('twenty-versus-twenty-battle.png') });
  await page.getByRole('button', { name: 'Skip animations', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getBattleDiagnostics()?.completed)).toBe(true);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(commandHash);
  // Query the actual existing context after timing; do not infer hardware or
  // software rendering merely from Chromium's optional SwiftShader flag.
  const graphics = await page.getByTestId('map-container').locator('canvas').evaluate(canvas => {
    const element = canvas as HTMLCanvasElement;
    const gl = element.getContext('webgl2') ?? element.getContext('webgl');
    if (!gl) return { backend: 'unknown' };
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    return { backend: gl.getParameter(gl.VERSION) as string,
      vendor: gl.getParameter(info ? info.UNMASKED_VENDOR_WEBGL : gl.VENDOR) as string,
      renderer: gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER) as string };
  });
  const report = { version: 1, measuredAt: new Date().toISOString(), workload: 'Authored funded veteran20vs20:40real formations,2marshals,2Waykeepers,2engineers; no injected battle outcomes. Real Brace command;120warmed animation frames. Not a campaign-growth benchmark.', isolation: 'One Playwright worker; host exclusivity must be confirmed by the coordinating run, not inferred by this test.', contentHash: CONTENT_HASH, originHash, commandHash, serializedBytes: Buffer.byteLength(serialized), graphics, initial, sample, errors };
  const raw = JSON.stringify(report, null, 2);
  await mkdir('docs/performance', { recursive: true }); await writeFile('docs/performance/0035-battle-render.json', raw);
  await writeFile(info.outputPath('battle-render.json'), raw); await info.attach('battle-render.json', { body: raw, contentType: 'application/json' });
  console.log('BATTLE_RENDER ' + JSON.stringify({ originHash, commandHash, frameMs: sample.frameMs, maxActors: sample.maxActors, maxEffects: sample.maxEffects, atlasBytes: sample.metrics.residentAtlasBytesEstimate }));
  expect(errors).toEqual([]);
});
