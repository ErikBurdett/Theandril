// Standalone Campaign E probe: observations only; all actions use actual UI.
import { chromium, expect } from '@playwright/test';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { matureCampaign } from '../../../packages/test-fixtures/src/index.ts';
import { deserializeGame, serializeGame, stateHash } from '@theandril/sim';
import { exportSave, importSave, deserializeCampaign } from '@theandril/persistence';

const out = '/home/telephoneheater/Work/Theandril/docs/hermes-analysis/qa/map-probe';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--enable-unsafe-swiftshader'] });
const results = [];
try {
  for (const size of ['huge', 'legendary', 'mature-standard']) {
    const generated = performance.now();
    let saved, source;
    if (size === 'mature-standard') {
      const path = '/home/telephoneheater/Work/Theandril/docs/hermes-analysis/campaigns/runs/D-standard24-seed74-300/turn-200.json.gz';
      const input = await readFile(path);
      saved = gunzipSync(input).toString('utf8');
      source = { path, compressedSha256: createHash('sha256').update(input).digest('hex'), synthetic: false, note: 'Read-only checkpoint from campaign agent ordinary AI run; this probe did not grow that campaign or alter exploration.' };
    } else {
      const fixture = matureCampaign(size), cells = fixture.world.terrain.length;
      fixture.explored[fixture.turnOwnerId] = new Set(Array.from({ length: cells }, (_, cell) => cell));
      saved = serializeGame(fixture);
      source = { synthetic: true, note: 'Synthetic generator4 armies and funded towns; terrain fully explored, live entity fog retained.' };
    }
    const state = deserializeGame(saved), hash = stateHash(state), cells = state.world.terrain.length;
    const bytes = await exportSave(saved), fixturePreparationMs = performance.now() - generated;
    const counts = { cells, factions: state.factions.length, armies: Object.keys(state.armies).length,
      formations: Object.values(state.armies).reduce((n, army) => n + army.formations.length, 0), settlements: Object.keys(state.settlements).length };
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
    const page = await context.newPage();
    const errors = [], consoleErrors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    await page.addInitScript(() => {
      window.__qa = { draws: 0, requests: [], responses: [] };
      for (const type of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
        if (!type) continue;
        for (const name of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced']) {
          if (!Object.hasOwn(type.prototype, name)) continue;
          const original = type.prototype[name];
          type.prototype[name] = function (...args) { window.__qa.draws++; return original.apply(this, args); };
        }
      }
      const OriginalWorker = window.Worker;
      window.Worker = class extends OriginalWorker {
        constructor(...args) {
          super(...args);
          this.addEventListener('message', event => window.__qa.responses.push({ id: event.data.id, type: event.data.type, at: performance.now(), message: event.data.message }));
        }
        postMessage(message, ...args) { window.__qa.requests.push({ id: message.id, type: message.type, at: performance.now() }); return super.postMessage(message, ...args); }
      };
    });
    const navStart = performance.now();
    await page.goto('http://127.0.0.1:4173/');
    const navigationMs = performance.now() - navStart;
    const importStart = performance.now();
    await page.getByLabel('Import save file').setInputFiles({ name: `${size}.theandril`, mimeType: 'application/gzip', buffer: Buffer.from(bytes) });
    await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
    await page.waitForFunction(() => window.__THEANDRIL__?.getArtDiagnostics()?.state === 'ready');
    const importToArtReadyMs = performance.now() - importStart;
    assert.equal(await page.evaluate(() => window.__THEANDRIL__.getStateHash()), hash);
    const graphics = await page.locator('canvas').first().evaluate(canvas => {
      const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
      const info = gl.getExtension('WEBGL_debug_renderer_info');
      return { version: gl.getParameter(gl.VERSION), renderer: gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER), vendor: gl.getParameter(info ? info.UNMASKED_VENDOR_WEBGL : gl.VENDOR), maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE), userAgent: navigator.userAgent, devicePixelRatio, hardwareConcurrency: navigator.hardwareConcurrency };
    });
    const samples = [];
    const sample = async stage => {
      const current = await page.evaluate(() => window.__THEANDRIL__.getPerformanceCounters().frameCount);
      await page.waitForFunction(current => window.__THEANDRIL__.getPerformanceCounters().frameCount >= current + 90, current);
      const value = await page.evaluate(async () => {
        const frames = [], cpu = [], draws = []; let previous = 0, previousDraws = window.__qa.draws;
        for (let i = 0; i < 181; i++) {
          const time = await new Promise(resolve => requestAnimationFrame(resolve));
          if (previous) { frames.push(time - previous); cpu.push(window.__THEANDRIL__.getPerformanceCounters().renderCpuMs); draws.push(window.__qa.draws - previousDraws); }
          previous = time; previousDraws = window.__qa.draws;
        }
        const stats = values => { const ordered = [...values].sort((a, b) => a - b); return { p50: ordered[Math.floor(ordered.length * .5)], p95: ordered[Math.floor(ordered.length * .95)], max: ordered.at(-1) }; };
        const mem = performance.memory;
        return { frameMs: stats(frames), renderCpuMs: stats(cpu), drawCallsPerRafInterval: stats(draws), rawFramesMs: frames, rawCpuMs: cpu, rawDrawCalls: draws,
          metrics: window.__THEANDRIL__.getPerformanceCounters(), hash: window.__THEANDRIL__.getStateHash(),
          heap: mem ? { usedJSHeapSize: mem.usedJSHeapSize, totalJSHeapSize: mem.totalJSHeapSize, jsHeapSizeLimit: mem.jsHeapSizeLimit } : null,
          observed: (() => { const view = window.__THEANDRIL__.getSummary(); return { armies: view.armies.length, ownArmies: view.ownArmies.length, settlements: view.settlements.length, exploredCells: view.exploredCells, reactCells: view.cells.length }; })() };
      });
      assert.equal(value.hash, hash); assert(value.metrics.cachedChunks <= 64); if (source.synthetic) assert.equal(value.observed.exploredCells, cells); assert.equal(value.observed.reactCells, 0);
      samples.push({ stage, ...value });
      await page.getByTestId('map-container').screenshot({ path: `${out}/${size}-${stage}.png` });
    };
    await sample('initial');
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
    await sample('near');
    const bounds = await page.getByTestId('map-container').boundingBox();
    for (let i = 0; i < 6; i++) {
      await page.mouse.move(bounds.x + bounds.width * .6, bounds.y + bounds.height * .5); await page.mouse.down();
      await page.mouse.move(bounds.x + bounds.width * .6 - 300, bounds.y + bounds.height * .5 - 100, { steps: 12 }); await page.mouse.up();
    }
    await sample('panned');
    await page.getByRole('button', { name: 'World overview', exact: true }).click();
    await sample('overview');
    await page.getByRole('button', { name: 'Focus selection', exact: true }).click();
    await sample('restored');
    const options = page.locator('.campaign-options');
    if (!await options.evaluate(element => element.open)) await options.locator('summary').click();
    const saves = [];
    for (let i = 0; i < 3; i++) {
      const baseline = await page.evaluate(() => window.__qa.requests.length);
      await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
      await page.waitForFunction(baseline => { const request = window.__qa.requests.slice(baseline).find(item => item.type === 'save'); return request && window.__qa.responses.some(item => item.id === request.id); }, baseline);
      const timing = await page.evaluate(baseline => { const request = window.__qa.requests.slice(baseline).find(item => item.type === 'save'); const response = window.__qa.responses.find(item => item.id === request.id); return { request, response, workerAcknowledgementMs: response.at - request.at }; }, baseline);
      await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
      saves.push(timing);
    }
    const exportStart = performance.now(), downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export campaign', exact: true }).click();
    const download = await downloadPromise, exportDownloadMs = performance.now() - exportStart;
    const exportPath = `${out}/${size}-export.theandril`; await download.saveAs(exportPath);
    const imported = deserializeCampaign(await importSave(new Uint8Array(await readFile(exportPath))));
    assert.equal(stateHash(imported.game), hash);
    const requestBaseline = await page.evaluate(() => window.__qa.requests.length);
    const loadStart = performance.now(); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
    await page.waitForFunction(baseline => { const request = window.__qa.requests.slice(baseline).find(item => item.type === 'load'); return request && window.__qa.responses.some(item => item.id === request.id); }, requestBaseline);
    await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
    const loadMs = performance.now() - loadStart;
    assert.equal(await page.evaluate(() => window.__THEANDRIL__.getStateHash()), hash);
    const result = { size, source, counts, turn: state.turn, stateHash: hash, browser: browser.version(), graphics, fixturePreparationMs, navigationMs, importToArtReadyMs, saveBytes: Buffer.byteLength(saved), compressedFixtureBytes: bytes.byteLength, samples, saves, exportDownloadMs, loadMs, exportHashVerified: true, errors, consoleErrors,
      scope: 'Source distinguishes synthetic giant fixtures from a genuinely grown Standard checkpoint. Snapshot-only save import records partial/from-save history, not the original full archive. 90 warmup plus180 sampled RAF intervals per stage, actual public UI pan/zoom/save/load/export. Browser WebGL draw entry points instrumented; not a driver/GPU timer. performance.memory is main-page JS heap, not worker/renderer/GPU or leak proof. Timings may overlap other agents; see host snapshots.' };
    results.push(result); await writeFile(`${out}/${size}.json`, JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify({ size, counts, hash, graphics, importToArtReadyMs, loadMs, stages: samples.map(s => ({ stage: s.stage, frameMs: s.frameMs, draws: s.drawCallsPerRafInterval })) }));
    assert.deepEqual(errors, []); await context.close();
  }
} finally { await browser.close(); }
await writeFile(`${out}/summary.json`, JSON.stringify(results.map(({ samples, ...result }) => ({ ...result, samples: samples.map(({ rawFramesMs, rawCpuMs, rawDrawCalls, ...sample }) => ({ ...sample, rawSamples: rawFramesMs.length, cpuSamples: rawCpuMs.length, drawSamples: rawDrawCalls.length })) })), null, 2) + '\n');
