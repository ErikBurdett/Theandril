/** DH-020: real production UI, no debug hooks, storage reads or fabricated state.
 * Run with an already built local server or the deployed Pages site:
 * THEANDRIL_BASE_URL=http://127.0.0.1:4175/Theandril/ \
 * THEANDRIL_EVIDENCE_DIR=docs/development/2026-09-25-selection-groups/local-64-seat \
 * PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium \
 * TMPDIR=/tmp ./node_modules/.bin/tsx scripts/verify-sixty-four-seat-save.ts
 * Omit THEANDRIL_BASE_URL to verify the live site. The script starts no server.
 * THEANDRIL_DEPLOYED_REVISION optionally asserts the hosted ledger revision.
 * THEANDRIL_SOURCE_REVISION overrides the pinned canonical implementation SHA.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { chromium, expect, type Browser, type Page } from '@playwright/test';
import { replayArchive } from '@theandril/chronicle';
import { mapDimensions } from '@theandril/mapgen';
import { deserializeCampaign, importSave } from '@theandril/persistence';
import { isCityState, serializeGame, stateHash } from '@theandril/sim';
import { closeManagement, openSelectedOrders, selectFromRegistry } from '../tests/gameplay/ui-navigation';

const baseURL = process.env.THEANDRIL_BASE_URL ?? 'https://erikburdett.github.io/Theandril/';
const liveOrigin = 'https://erikburdett.github.io/Theandril/';
const startedOnLive = new URL(baseURL).href === liveOrigin;
const output = resolve(process.env.THEANDRIL_EVIDENCE_DIR ?? `docs/development/2026-09-25-selection-groups/${startedOnLive ? 'live-64-seat' : 'local-64-seat'}`);
const sourceRevision = process.env.THEANDRIL_SOURCE_REVISION ?? '0d26fa3c34ac89164637f515e95671420400a841';
const seed = 20260926;
const hearthName = 'Sixty Four Hearth';
// A bounded allowance for a genuine Legendary/gen8 world, initial publication
// and WebGL presentation. No AI rounds or turn-performance claim are involved.
const generationTimeoutMs = 180_000;
const operationTimeoutMs = 90_000;
const sha256 = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex');
const startedAt = new Date().toISOString();
const started = performance.now();
const browserErrors: string[] = [];
const consoleErrors: string[] = [];
const httpErrors: string[] = [];
const consoleDiagnostics: Array<{ text: string; location: { url: string; lineNumber: number; columnNumber: number } }> = [];
const networkDiagnostics: Array<{ requestId: string; url: string; status: number; resourceType: string; initiator: string | null }> = [];
const browserLogDiagnostics: Array<{ source: string; text: string; url: string | null; line: number | null; requestId: string | null }> = [];
const declaredIconURLs = new Set<string>();
const browserIconWarnings: Array<{ url: string; status: number; requestId: string; resourceType: string; initiator: string | null; message: string; classification: string }> = [];
const unclassifiedNetworkErrors: typeof networkDiagnostics = [];
const unclassifiedBrowserLogErrors: typeof browserLogDiagnostics = [];
const timingsMs: Record<string, number> = {};
const checks: Array<Record<string, unknown>> = [];
let stage = 'launch';
let browser: Browser | undefined;
let page: Page | undefined;
let failure: string | undefined;
let screenshotFailure: string | undefined;
let revision: string | undefined;
let manualSaveSucceeded = false;
let pageReloaded = false;
let resumedSavedCampaign = false;

async function campaignSettings(current: Page) {
  await closeManagement(current);
  const menu = current.getByTestId('campaign-menu');
  if (await menu.getAttribute('open') === null) await menu.locator(':scope > summary').click();
}

async function noDevelopmentHooks(current: Page) {
  // Read only the existence of the development hook; never inspect campaign
  // state through window, a worker shim or IndexedDB.
  assert.equal(await current.evaluate(() => '__THEANDRIL__' in window), false, 'Production must not expose development hooks.');
  await recordDeclaredIcons(current);
}

async function recordDeclaredIcons(current: Page) {
  for (const url of await current.locator('link[rel~="icon"]').evaluateAll(elements => elements.map(element => (element as HTMLLinkElement).href))) declaredIconURLs.add(url);
}

function classifyBrowserIconWarnings() {
  const iconURL = new URL('/favicon.ico', baseURL).href;
  const classifiedRequests = new Set<string>();
  const remainingConsoleErrors: string[] = [];
  for (const diagnostic of consoleDiagnostics) {
    const response = diagnostic.location.url === iconURL && !declaredIconURLs.has(iconURL)
      && /^Failed to load resource: the server responded with a status of 404 \([^)]*\)$/.test(diagnostic.text)
      ? networkDiagnostics.find(entry => entry.url === iconURL && entry.status === 404 && entry.resourceType === 'Other' && entry.initiator === 'other'
        && browserLogDiagnostics.some(log => log.source === 'network' && log.url === iconURL && log.requestId === entry.requestId && log.text === diagnostic.text)) : undefined;
    if (!response) { remainingConsoleErrors.push(diagnostic.text); continue; }
    classifiedRequests.add(response.requestId);
    browserIconWarnings.push({ ...response, message: diagnostic.text, classification: 'Browser-owned implicit same-origin /favicon.ico request: not a declared application icon; exact console URL and CDP network/log request ID agree on 404.' });
  }
  consoleErrors.splice(0, consoleErrors.length, ...remainingConsoleErrors);
  if (classifiedRequests.size) {
    // Preserve the exact event in raw diagnostics, whether or not Playwright
    // also exposed this browser-owned request through its response listener.
    for (let index = httpErrors.length - 1; index >= 0; index--) if (httpErrors[index] === `404 ${iconURL}`) httpErrors.splice(index, 1);
  }
  unclassifiedNetworkErrors.push(...networkDiagnostics.filter(entry => !classifiedRequests.has(entry.requestId)));
  unclassifiedBrowserLogErrors.push(...browserLogDiagnostics.filter(entry => !entry.requestId || !classifiedRequests.has(entry.requestId)
    || entry.source !== 'network' || entry.url !== iconURL || !browserIconWarnings.some(warning => warning.requestId === entry.requestId && warning.message === entry.text)));
}

async function exportAndVerify(current: Page, label: string, baseline?: { serialized: string; hash: string; archive: string }) {
  stage = label;
  const before = performance.now();
  await campaignSettings(current);
  const download = current.waitForEvent('download', { timeout: operationTimeoutMs });
  await current.getByRole('button', { name: 'Export campaign', exact: true }).click();
  const file = resolve(output, `${label}.theandril`);
  await (await download).saveAs(file);
  const bytes = await readFile(file);
  const { game, archive } = deserializeCampaign(await importSave(bytes));
  const serialized = serializeGame(game);
  const hash = stateHash(game);
  const archived = JSON.stringify(archive);
  const factionIds = game.factions.map(faction => faction.id).sort();
  const researchIds = Object.keys(game.arcaneResearch).sort();
  assert.equal(JSON.parse(serialized).version, 32, 'This proof targets the rules32 repair.');
  assert.equal(game.world.seed, seed);
  assert.equal(game.world.generatorVersion, 8);
  assert.deepEqual({ width: game.world.width, height: game.world.height }, mapDimensions('legendary', 8));
  assert.equal(game.factions.length, 64);
  assert.equal(game.factions.filter(faction => isCityState(faction.id)).length, 24);
  assert.equal(researchIds.length, 64);
  assert.deepEqual(researchIds, factionIds, 'Every realm must retain its research register.');
  assert.ok(Object.values(game.settlements).some(hearth => hearth.name === hearthName), 'The real founded hearth must survive.');
  assert.equal(archive.coverage, 'complete');
  assert.equal(archive.initialSaveVersion, 32, 'The actual exported origin must use rules32.');
  assert.equal(JSON.parse(archive.initialSave).contentHash, '015468d1');
  assert.ok(archive.records.every(record => record.rulesVersion === 32));
  assert.ok(archive.records.some(record => record.ok), 'The proof must contain a real accepted player command.');
  const replayed = replayArchive(archive);
  assert.ok(serializeGame(replayed) === serialized, 'Public chronicle replay must match exact canonical serialization.');
  assert.equal(stateHash(replayed), hash);
  if (baseline) {
    assert.ok(serialized === baseline.serialized, 'Canonical serialized state changed across storage restoration.');
    assert.equal(hash, baseline.hash, 'Canonical hash changed across storage restoration.');
    assert.ok(archived === baseline.archive, 'Recorded campaign history changed across storage restoration.');
  }
  await noDevelopmentHooks(current);
  timingsMs[label] = performance.now() - before;
  checks.push({ stage: label, file, path: `${label}.theandril`, bytes: bytes.length, sha256: sha256(bytes), stateHash: hash, compressedBytes: bytes.length, compressedSha256: sha256(bytes), canonicalBytes: Buffer.byteLength(serialized), canonicalSha256: sha256(serialized), hash, rulesVersion: 32, generatorVersion: game.world.generatorVersion, seed: game.world.seed, width: game.world.width, height: game.world.height, majorRealms: 40, cityStates: 24, totalSeats: game.factions.length, researchRows: researchIds.length, researchIds, turn: game.turn, archiveRecords: archive.records.length, archiveSha256: sha256(archived), replayExact: true, exactStateComparedWithBaseline: Boolean(baseline), exactArchiveComparedWithBaseline: Boolean(baseline), noDevelopmentHooks: true });
  return { serialized, hash, archive: archived, file };
}

await mkdir(output, { recursive: true });
try {
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, args: ['--enable-unsafe-swiftshader'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  page = await context.newPage();
  page.setDefaultTimeout(operationTimeoutMs);
  page.setDefaultNavigationTimeout(operationTimeoutMs);
  // Chromium can log browser-owned requests without exposing a Playwright
  // response event. Retain their exact URL/status before classifying any error.
  const diagnostics = await context.newCDPSession(page);
  const requestInitiators = new Map<string, string>();
  diagnostics.on('Network.requestWillBeSent', event => requestInitiators.set(event.requestId, event.initiator.type));
  diagnostics.on('Network.responseReceived', event => {
    if (event.response.status >= 400) networkDiagnostics.push({ requestId: event.requestId, url: event.response.url, status: event.response.status, resourceType: event.type, initiator: requestInitiators.get(event.requestId) ?? null });
    requestInitiators.delete(event.requestId);
  });
  diagnostics.on('Network.loadingFailed', event => requestInitiators.delete(event.requestId));
  diagnostics.on('Log.entryAdded', ({ entry }) => {
    if (entry.level === 'error') browserLogDiagnostics.push({ source: entry.source, text: entry.text, url: entry.url ?? null, line: entry.lineNumber ?? null, requestId: entry.networkRequestId ?? null });
  });
  await diagnostics.send('Network.enable');
  await diagnostics.send('Log.enable');
  page.on('pageerror', error => browserErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
      consoleDiagnostics.push({ text: message.text(), location: message.location() });
    }
  });
  page.on('response', response => { if (response.status() >= 400) httpErrors.push(`${response.status()} ${response.url()}`); });
  stage = 'identify-build';
  await page.goto(new URL('updates/', baseURL).href);
  const commitURL = await page.locator('.commit-entry').first().locator('a[href*="/commit/"]').getAttribute('href');
  revision = commitURL?.match(/\/commit\/([a-f0-9]{40})$/)?.[1];
  assert.ok(revision, 'The public build ledger must identify a full source revision.');
  if (process.env.THEANDRIL_DEPLOYED_REVISION) assert.equal(revision, process.env.THEANDRIL_DEPLOYED_REVISION, 'Hosted ledger differs from the deployment selected for verification.');
  await recordDeclaredIcons(page);
  await page.goto(baseURL);
  await noDevelopmentHooks(page);
  stage = 'generate';
  await page.getByRole('textbox', { name: 'World seed', exact: true }).fill(String(seed));
  await page.getByRole('combobox', { name: 'World size', exact: true }).selectOption('legendary');
  // The real setup permits at most 42 major seats and 24 city-states. This is
  // its supported 64-seat composition, not a DOM-attribute or state override.
  await page.getByRole('spinbutton', { name: 'Faction count', exact: true }).fill('40');
  await page.getByRole('spinbutton', { name: 'City-states', exact: true }).fill('24');
  await page.getByRole('combobox', { name: 'Map type', exact: true }).selectOption('continents');
  await page.getByRole('combobox', { name: 'Campaign pace', exact: true }).selectOption('standard');
  await page.getByRole('combobox', { name: 'Campaign mode', exact: true }).selectOption('player');
  await page.screenshot({ path: resolve(output, 'sixty-four-seat-setup.png'), fullPage: true });
  const generationStart = performance.now();
  await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Your people await a hearth.', { timeout: generationTimeoutMs });
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled({ timeout: generationTimeoutMs });
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 1');
  timingsMs.generationAndPresentation = performance.now() - generationStart;

  stage = 'found-hearth';
  await selectFromRegistry(page, 'armies', /Hearth caravan/);
  await openSelectedOrders(page);
  await page.getByRole('textbox', { name: 'Settlement name', exact: true }).fill(hearthName);
  await page.getByRole('button', { name: 'Found settlement', exact: true }).click();
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled({ timeout: operationTimeoutMs });
  const baseline = await exportAndVerify(page, 'before-manual-save');

  stage = 'manual-save';
  const saveStart = performance.now();
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved.', { timeout: operationTimeoutMs });
  manualSaveSucceeded = true;
  timingsMs.manualSave = performance.now() - saveStart;
  await page.screenshot({ path: resolve(output, 'sixty-four-seat-saved.png') });

  stage = 'reload-and-load';
  const loadStart = performance.now();
  await page.reload();
  pageReloaded = true;
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored.', { timeout: operationTimeoutMs });
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled({ timeout: operationTimeoutMs });
  resumedSavedCampaign = true;
  timingsMs.reloadAndLoad = performance.now() - loadStart;
  await page.screenshot({ path: resolve(output, 'sixty-four-seat-restored.png') });
  await exportAndVerify(page, 'after-manual-load', baseline);

  stage = 'portable-import';
  const importStart = performance.now();
  await page.reload();
  await page.locator('input[type=file]').setInputFiles(baseline.file);
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign', { timeout: operationTimeoutMs });
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled({ timeout: operationTimeoutMs });
  timingsMs.reloadAndPortableImport = performance.now() - importStart;
  await exportAndVerify(page, 'after-portable-import', baseline);
  await page.screenshot({ path: resolve(output, 'sixty-four-seat-portable-restored.png') });
  classifyBrowserIconWarnings();
  assert.deepEqual(browserErrors, [], 'Browser exceptions occurred.');
  assert.deepEqual(consoleErrors, [], 'Browser console errors occurred.');
  assert.deepEqual(httpErrors, [], 'HTTP errors occurred.');
  assert.deepEqual(unclassifiedNetworkErrors, [], 'Unclassified CDP network errors occurred.');
  assert.deepEqual(unclassifiedBrowserLogErrors, [], 'Unclassified CDP browser-log errors occurred.');
  stage = 'complete';
} catch (error) {
  failure = error instanceof Error ? error.stack ?? error.message : String(error);
  if (page) {
    try { await page.screenshot({ path: resolve(output, 'sixty-four-seat-failure.png') }); }
    catch (error) { screenshotFailure = String(error); }
  }
  process.exitCode = 1;
} finally {
  await browser?.close().catch(error => { failure ??= `Browser shutdown failed: ${String(error)}`; process.exitCode = 1; });
  const result = { issue: 'DH-020', passed: !failure, stage, startedAt, finishedAt: new Date().toISOString(), elapsedMs: performance.now() - started, baseURL, origin: new URL(baseURL).href, revision, revisionScope: 'Full revision observed in the build-generated public change ledger; deployment workflow identity is independently checked.', sourceRevision, rulesVersion: 32, contentHash: '015468d1', totalSeats: checks.length ? 64 : null, developmentHooks: checks.length ? false : null, startedOnLive, manualSaveSucceeded, pageReloaded, resumedSavedCampaign, beforeSave: checks.find(check => check.stage === 'before-manual-save'), afterReload: checks.find(check => check.stage === 'after-manual-load'), afterImport: checks.find(check => check.stage === 'after-portable-import'), errors: [...browserErrors, ...consoleErrors, ...httpErrors, ...unclassifiedNetworkErrors.map(entry => `${entry.status} ${entry.url}`), ...unclassifiedBrowserLogErrors.map(entry => `${entry.source}: ${entry.text} (${entry.url})`), ...(failure ? [failure] : [])], scriptSha256: sha256(await readFile(new URL(import.meta.url))), scope: 'One real generated Legendary/gen8 campaign, 40 major realms + 24 city-states, seed 20260926. Ordinary UI founding, manual save/reload/Load and portable import/export. Every downloaded archive is parsed and replayed through public APIs, retaining exact canonical-state and history comparisons. No development hooks, authored state, direct storage access, AI turns, pacing, sustained-memory or full release claim.', generationTimeoutMs, operationTimeoutMs, timingsMs, checks, browserErrors, consoleErrors, httpErrors, consoleDiagnostics, networkDiagnostics, browserLogDiagnostics, browserIconWarnings, declaredIconURLs: [...declaredIconURLs], unclassifiedNetworkErrors, unclassifiedBrowserLogErrors, browserIconLimit: 'Only correlated implicit same-origin root favicon404 requests are warnings; declared icons and all other console, HTTP, CDP network and CDP browser-log errors fail verification.', error: failure, screenshotFailure };
  const json = `${JSON.stringify(result, null, 2)}\n`;
  await writeFile(resolve(output, 'result.json'), json);
  await writeFile(resolve(output, startedOnLive ? 'live-64-seat.json' : 'local-64-seat.json'), json);
  if (result.passed && startedOnLive) console.log('LIVE_64_SEAT_SAVE_RELOAD_EXPORT_OK');
  console.log(JSON.stringify({ issue: result.issue, passed: result.passed, stage, output, elapsedMs: result.elapsedMs, exportsVerified: checks.length, error: failure }));
}
