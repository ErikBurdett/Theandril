#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, expect } from '@playwright/test';

const usage = 'node scripts/verify-pages.mjs <publication-SHA> <game-base-URL> --expect=release-expectations.json [--out=NEW-DIRECTORY] [--dist=apps/web/dist]';
const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log(`${usage}\nRead-only public GET/browser verification. The output directory must not exist. Uses PLAYWRIGHT_CHROMIUM_EXECUTABLE or /usr/bin/chromium. Does not start a campaign, publish, or change remote state. Local dist must be the build being verified.`);
  process.exit(0);
}
const [revision, origin, ...options] = args;
assert.match(revision ?? '', /^[a-f0-9]{40}$/, usage);
assert.ok(origin, usage);
assert.ok(options.every(option => /^--(?:out|dist|expect)=.+/.test(option)), usage);
assert.equal(new Set(options.map(option => option.split('=')[0])).size, options.length, 'Duplicate option');
const base = new URL(origin);
assert.ok(['https:', 'http:'].includes(base.protocol), 'Use an HTTP(S) game base URL');
assert.ok(!base.username && !base.password && !base.search && !base.hash, 'Use a base URL without credentials, query or fragment');
if (!base.pathname.endsWith('/')) base.pathname += '/';
const scriptPath = fileURLToPath(import.meta.url), scriptDirectory = dirname(scriptPath), root = resolve(scriptDirectory, '..');
const option = key => options.find(value => value.startsWith(`--${key}=`))?.slice(key.length + 3);
const dist = resolve(root, option('dist') ?? 'apps/web/dist');
const started = new Date().toISOString();
const output = resolve(root, option('out') ?? `${scriptDirectory}/live-${revision.slice(0, 7)}-${started.replace(/[:.]/g, '-')}`);
assert.ok(option('expect'), 'An immutable release-expectations JSON file is required');
const expected = JSON.parse(await readFile(resolve(root, option('expect')), 'utf8'));
const sourceRevision = expected.sourceRevision;
assert.match(sourceRevision, /^[a-f0-9]{40}$/);
assert.match(expected.dispatchId, /^[a-z0-9-]+$/);
assert.ok(Number.isInteger(expected.edition) && expected.edition > 0);
assert.ok(typeof expected.title === 'string' && expected.title.length > 0);
const repository = 'https://github.com/ErikBurdett/Theandril';
const digest = data => createHash('sha256').update(data).digest('hex');
await mkdir(output); // Never overwrite a retained failed or successful readback.
const report = {
  revision, sourceRevision, roadmapSourceRevision: sourceRevision, origin: base.href, started, dist,
  scope: 'Public live readback: newest build-ledger SHA; exact local built HTML/JS/CSS/worker bytes; production game setup without development hooks; expected dispatch source/evidence/imagery; roadmap aggregate acceptance counts and open gates. No campaign, gameplay journey, deployment action or release acceptance.',
  revisionScope: 'Revision comes from the newest build-generated public ledger. Workflow/deployment identity must be verified separately; exact local asset comparison is not an independent build attestation.',
  noRemoteWrites: true, checks: {}, requests: [], errors: [], failedRequests: [], httpErrors: [], consoleErrors: [], browserDiagnostics: [], screenshots: [],
  passed: false, scriptSha256: digest(await readFile(scriptPath)),
};
let browser, page;
const live = relative => new URL(relative, base).href;
async function exactFile(relative) {
  assert.ok(relative && !relative.includes('..') && !relative.startsWith('/'), `Unsafe relative path: ${relative}`);
  const localPath = resolve(dist, relative);
  assert.ok(localPath.startsWith(dist + sep), `File outside dist: ${relative}`);
  const local = await readFile(localPath);
  const response = await fetch(live(relative), { headers: { 'cache-control': 'no-cache' }, signal: AbortSignal.timeout(30_000) });
  const body = Buffer.from(await response.arrayBuffer());
  const record = { path: relative, url: response.url, status: response.status, bytes: body.length, sha256: digest(body), localBytes: local.length, localSha256: digest(local) };
  report.requests.push(record);
  assert.equal(response.status, 200, `${relative}: HTTP ${response.status}`);
  assert.ok(body.equals(local), `${relative}: live bytes differ from local dist`);
  return { record, body };
}
async function capture(name) {
  await page.waitForLoadState('networkidle');
  const path = resolve(output, `${name}.png`);
  await page.screenshot({ path });
  const data = await readFile(path);
  report.screenshots.push({ path: `${name}.png`, bytes: data.length, sha256: digest(data), viewport: page.viewportSize(), transform: 'none; native Playwright viewport PNG' });
}
async function noDevelopmentHooks() {
  assert.equal(await page.evaluate(() => typeof window.__THEANDRIL__), 'undefined', 'Development hooks must be absent');
}

try {
  // Resolve assets from local built HTML, then compare the bytes actually served.
  // Include all four entry documents and their linked bundles, not only game JS.
  const htmlFiles = ['index.html', 'updates/index.html', 'updates/dispatches/index.html', 'updates/roadmap/index.html'];
  const assetFiles = new Set();
  report.checks.html = [];
  for (const file of htmlFiles) {
    const { record, body } = await exactFile(file);
    report.checks.html.push(record);
    for (const match of body.toString('utf8').matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)) {
      const url = new URL(match[1], live(file));
      assert.equal(url.origin, base.origin, 'Built bundle must use the deployment origin');
      assert.ok(url.pathname.startsWith(base.pathname), `Wrong built deployment base: ${url.pathname}`);
      assetFiles.add(decodeURIComponent(url.pathname.slice(base.pathname.length)));
    }
  }
  const workers = (await readdir(resolve(dist, 'assets'))).filter(name => /^simulation\.worker-[\w-]+\.js$/.test(name));
  assert.equal(workers.length, 1, 'Expected one simulation worker in a clean dist');
  assetFiles.add(`assets/${workers[0]}`);
  assert.ok([...assetFiles].some(path => /^assets\/game-[\w-]+\.js$/.test(path)), 'Game entry not found');
  assert.ok([...assetFiles].some(path => /^assets\/game-[\w-]+\.css$/.test(path)), 'Game CSS not found');
  report.checks.exactBuiltAssets = [];
  for (const path of [...assetFiles].sort()) report.checks.exactBuiltAssets.push((await exactFile(path)).record);

  const provenance = await exactFile('updates/provenance.json');
  const manifest = JSON.parse(provenance.body.toString('utf8'));
  assert.ok(manifest.totalJournalImageBytes <= manifest.journalImageBudgetBytes, 'Journal image budget exceeded');
  const imageHashes = Object.fromEntries(expected.imageIds.map(id => {
    const asset = manifest.assets.find(item => item.id === id);
    assert.ok(asset, `Missing expected image ${id}`);
    return [id, asset.sha256];
  }));
  report.checks.provenance = { ...provenance.record, totalJournalImageBytes: manifest.totalJournalImageBytes, journalImageBudgetBytes: manifest.journalImageBudgetBytes };
  report.checks.images = [];
  for (const [id, sha256] of Object.entries(imageHashes)) {
    const image = manifest.assets.find(asset => asset.id === id);
    assert.ok(image, `Missing image ${id}`);
    assert.match(image.sourceRevision, /^[a-f0-9]{40}$/);
    assert.equal(image.sha256, sha256);
    assert.equal(digest(await readFile(resolve(root, image.sourcePath))), image.sourceSha256, 'Original reviewed image differs from its provenance');
    const { record } = await exactFile(image.path);
    assert.equal(record.sha256, sha256); assert.equal(record.bytes, image.bytes);
    report.checks.images.push({ id, ...record, width: image.width, height: image.height });
  }

  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/usr/bin/chromium', args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  page = await context.newPage();
  page.setDefaultTimeout(30_000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), failure: request.failure()?.errorText }));
  page.on('response', response => { if (response.status() >= 400) report.httpErrors.push({ status: response.status(), url: response.url() }); });
  page.on('console', message => {
    if (message.type() !== 'error') return;
    const entry = { text: message.text(), location: message.location() };
    // Chromium requests the origin-root favicon when the game has no icon link.
    // The earlier publication packet retains independent CDP confirmation. Only this
    // exact 404 outside a subpath deployment is classified separately; favicon
    // failures inside the project and every other console/resource error fail.
    if (base.pathname !== '/' && entry.location.url === new URL('/favicon.ico', base).href
      && ['Failed to load resource: the server responded with a status of 404 (Not Found)',
        'Failed to load resource: the server responded with a status of 404 ()'].includes(entry.text)) {
      report.browserDiagnostics.push({ kind: 'automatic-origin-favicon-404', outsideDeploymentRoot: true, ...entry });
    } else report.consoleErrors.push(entry);
  });
  const pageWorkers = []; page.on('worker', worker => pageWorkers.push(worker.url()));

  await page.goto(live('updates/'), { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1, name: 'Theandril', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: expected.title, exact: true })).toBeVisible();
  const latestCommit = page.locator('.commit-ledger .commit-entry').first().locator(`a[href^="${repository}/commit/"]`);
  await expect(latestCommit).toHaveAttribute('href', `${repository}/commit/${revision}`);
  report.checks.latestLedgerRevision = (await latestCommit.getAttribute('href')).split('/').at(-1);
  await noDevelopmentHooks(); await capture('live-home');

  await page.goto(live(`updates/dispatches/?dispatch=${expected.dispatchId}`), { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1, name: expected.title, exact: true })).toBeVisible();
  await expect(page.locator('.article-header .eyebrow')).toContainText(`Dispatch ${expected.edition}`);
  await expect(page.locator('#source-notes code')).toHaveText(sourceRevision.slice(0, 7));
  const evidence = await page.locator('#source-notes li > a').evaluateAll(links => links.map(link => ({ label: link.textContent, href: link.href })));
  assert.equal(evidence.length, expected.evidenceCount);
  assert.ok(evidence.every(link => link.href.startsWith(`${repository}/blob/${sourceRevision}/`)), 'All article evidence must use the implementation pin');
  for (const path of expected.evidencePaths) assert.ok(evidence.some(link => link.href.endsWith(`/${path}`)), `Missing expected evidence ${path}`);
  report.checks.dispatch = { id: expected.dispatchId, edition: expected.edition, title: expected.title, source: sourceRevision, evidence };
  await capture('live-dispatch');
  for (const id of Object.keys(imageHashes)) {
    const image = page.locator(`.illustration-${id} > button > img`);
    await image.scrollIntoViewIfNeeded(); await image.evaluate(element => element.decode());
    const metadata = manifest.assets.find(asset => asset.id === id);
    assert.deepEqual(await image.evaluate(element => [element.naturalWidth, element.naturalHeight]), [metadata.width, metadata.height]);
  }

  await page.goto(live('updates/roadmap/'), { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1, name: 'Theandril Roadmap' })).toBeVisible();
  await expect(page.locator('.roadmap-item')).toHaveCount(expected.roadmap.items);
  await expect(page.locator('.roadmap-snapshot a')).toHaveAttribute('href', `${repository}/blob/${sourceRevision}/docs/IMPLEMENTATION_STATUS.md`);
  const records = await page.locator('.roadmap-item').evaluateAll(items => items.map(item => {
    const detail = title => [...item.querySelectorAll('.roadmap-details > div')].find(div => div.querySelector('h4')?.textContent === title);
    return { id: item.id, status: item.dataset.status,
      delivered: [...(detail('Delivered in this checkpoint')?.querySelectorAll('.roadmap-checklist > li') ?? [])].map(li => li.textContent),
      remaining: [...(detail('Remaining acceptance')?.querySelectorAll('.roadmap-checklist > li') ?? [])].map(li => li.textContent) };
  }));
  const counts = Object.fromEntries(['completed', 'in-progress', 'pending'].map(status => [status, records.filter(record => record.status === status).length]));
  assert.deepEqual(counts, expected.roadmap.statusCounts);
  const delivered = records.reduce((sum, record) => sum + record.delivered.length, 0), remaining = records.reduce((sum, record) => sum + record.remaining.length, 0);
  assert.equal(delivered, expected.roadmap.delivered); assert.equal(remaining, expected.roadmap.remaining);
  await expect(page.locator('.roadmap-gates > div')).toHaveCount(expected.roadmap.openGates);
  await expect(page.locator('.roadmap-gates .roadmap-status-completed')).toHaveCount(0);
  await expect(page.locator('.roadmap-introduction')).toContainText('No overall 1.0 gate is signed off.');
  report.checks.roadmap = { source: sourceRevision, itemCount: records.length, counts, deliveredAcceptancePoints: delivered, remainingAcceptancePoints: remaining, openReleaseGates: expected.roadmap.openGates, records };
  await capture('live-roadmap');
  assert.deepEqual(pageWorkers, [], 'Journal and roadmap must not boot gameplay workers');

  await page.goto(base.href, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('textbox', { name: 'World seed', exact: true })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'World size', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Begin campaign', exact: true })).toBeEnabled();
  await noDevelopmentHooks(); await capture('live-game-setup');
  report.checks.game = { productionSetup: true, noDevelopmentHooks: true, campaignStarted: false };
  assert.deepEqual(report.errors, [], 'Browser page errors');
  assert.deepEqual(report.failedRequests, [], 'Browser failed requests');
  assert.deepEqual(report.httpErrors, [], 'Browser HTTP errors');
  assert.deepEqual(report.consoleErrors, [], 'Browser console errors');
  report.passed = true;
} catch (error) {
  report.failure = { message: error.message, stack: error.stack };
  process.exitCode = 1;
  if (page && !page.isClosed()) await capture('failure').catch(captureError => { report.failure.screenshotError = captureError.message; });
} finally {
  if (browser) await browser.close().catch(error => { report.errors.push(`Browser close: ${error.message}`); report.passed = false; process.exitCode = 1; });
  report.finished = new Date().toISOString();
  await writeFile(resolve(output, 'readback.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, output, revision, sourceRevision, failure: report.failure?.message }, null, 2));
}
