import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { expect, test, type Response } from '@playwright/test';
import type { RuntimeCatalog } from '@theandril/art-pipeline/runtime';
import { closeManagement, openRegistry } from '../gameplay/ui-navigation';

test('built game loads verified map art, UI materials and its real worker inside the configured deployment base', async ({ page, baseURL }, info) => {
  expect(baseURL).toBeTruthy();
  const mount = new URL('./', baseURL);
  const localUrl = (path: string) => new URL(path.replace(/^\//, ''), mount).href;
  const requests: { url: string; type: string }[] = [];
  const responses = new Map<string, Response>();
  const workers: string[] = [];
  const errors: string[] = [];
  page.on('request', request => requests.push({ url: request.url(), type: request.resourceType() }));
  page.on('response', response => responses.set(response.url(), response));
  page.on('worker', worker => workers.push(worker.url()));
  page.on('pageerror', error => errors.push(error.message));

  const approvedBytes = await readFile(new URL('../../assets/art/runtime/catalog.json', import.meta.url));
  const approved = JSON.parse(approvedBytes.toString('utf8')) as RuntimeCatalog;
  const foundation = approved.atlases.find(atlas => atlas.id === 'foundation')!;
  expect(foundation).toBeDefined();
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Establish your campaign', exact: true })).toBeVisible();
  expect(new URL(page.url()).pathname).toBe(mount.pathname);
  expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
  await expect(page.getByRole('button', { name: 'Art Lab', exact: true })).toHaveCount(0);
  await expect(page.locator('.setup .faction-card .faction-art')).toHaveAttribute('data-art-state', 'ready');

  // These are computed, actually used CSS backgrounds, not source-code strings
  // or extra fetches that could hide a broken stylesheet base rewrite.
  const wood = await page.locator('.setup').evaluate(element => getComputedStyle(element).backgroundImage);
  const parchment = await page.locator('.setup .faction-card').evaluate(element => getComputedStyle(element).backgroundImage);
  expect(wood).toContain(localUrl('/ui/hearth-card/wood.webp'));
  expect(parchment).toContain(localUrl('/ui/hearth-card/parchment.webp'));
  await page.getByRole('combobox', { name: 'World size', exact: true }).selectOption('tiny');
  await page.getByLabel('Faction count', { exact: true }).fill('2');
  await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 1');
  await expect(page.getByTestId('map-container').locator('canvas')).toBeVisible();
  await expect(page.getByTestId('art-runtime-status')).toHaveText('Art: approved pixel pack');

  const registry = await openRegistry(page, 'armies');
  const corner = await registry.locator(':scope > .campaign-window-header').evaluate(element => getComputedStyle(element).backgroundImage);
  expect(corner).toContain(localUrl('/ui/hearth-card/ornament.corner-idle.webp'));
  await closeManagement(page);

  const expectedDownloads = ['/art/catalog.json', foundation.jsonUrl, foundation.imageUrl,
    '/ui/hearth-card/wood.webp', '/ui/hearth-card/parchment.webp', '/ui/hearth-card/ornament.corner-idle.webp'];
  for (const path of expectedDownloads) {
    const url = localUrl(path);
    await expect.poll(() => responses.has(url), { message: `Actual browser request for ${url}` }).toBe(true);
    const response = responses.get(url)!;
    expect(response.ok(), `Successful asset download: ${url}`).toBe(true);
    const bytes = await response.body();
    expect(bytes.byteLength).toBeGreaterThan(0);
    if (path === '/art/catalog.json') expect(bytes.equals(approvedBytes)).toBe(true);
    if (path === foundation.imageUrl) expect(createHash('sha256').update(bytes).digest('hex')).toBe(foundation.sha256);
    if (path.startsWith('/ui/')) {
      const original = await readFile(new URL(`../../apps/web/public${path}`, import.meta.url));
      expect(bytes.equals(original), `Unchanged reviewed UI bytes: ${path}`).toBe(true);
    }
  }

  const scripts = await page.locator('script[type="module"][src]').evaluateAll(elements => elements.map(element => (element as HTMLScriptElement).src));
  const stylesheets = await page.locator('link[rel="stylesheet"]').evaluateAll(elements => elements.map(element => (element as HTMLLinkElement).href));
  expect(scripts.length).toBeGreaterThan(0);
  expect(stylesheets.length).toBeGreaterThan(0);
  expect(workers.some(url => /\/assets\/simulation\.worker-[^/]+\.js$/.test(new URL(url).pathname))).toBe(true);
  for (const url of [...scripts, ...stylesheets, ...workers]) {
    expect(new URL(url).origin).toBe(mount.origin);
    expect(new URL(url).pathname.startsWith(mount.pathname), `Bundled URL stays under ${mount.pathname}: ${url}`).toBe(true);
  }
  // Ignore browser-owned requests such as favicon.ico, but include every game
  // public asset plus all scripts/styles/fonts, even an incorrectly rooted one.
  const runtimeRequests = requests.filter(request => {
    const url = new URL(request.url);
    return url.origin === mount.origin && (/\/(?:art|ui|assets)\//.test(url.pathname) || ['script', 'stylesheet', 'font'].includes(request.type));
  });
  expect(runtimeRequests.length).toBeGreaterThan(0);
  expect(runtimeRequests.filter(request => !new URL(request.url).pathname.startsWith(mount.pathname))).toEqual([]);
  expect(runtimeRequests.some(request => /\/art\/lab-catalog\.json$/.test(new URL(request.url).pathname))).toBe(false);
  expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
  expect(errors).toEqual([]);
  const evidence = { base: mount.href, approvedAssets: approved.assets.length, approvedFrames: approved.assets.reduce((sum, asset) => sum + asset.frames.length, 0), foundationSha256: foundation.sha256, scripts, stylesheets, workers, css: { wood, parchment, corner }, runtimeRequests };
  const evidencePath = info.outputPath('deployment-assets.json');
  await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  await info.attach('deployment-assets', { path: evidencePath, contentType: 'application/json' });
  await page.screenshot({ path: info.outputPath('deployment-new-campaign.png') });
});
