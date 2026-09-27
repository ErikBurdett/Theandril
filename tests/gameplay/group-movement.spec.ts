import { writeFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { applyCommand, deserializeGame, serializeGame, stateHash, type GameCommand } from '@theandril/sim';
import { closeManagement, openRegistry, openSelectedOrders, selectFromRegistry } from './ui-navigation';
import { campaignMenu, exportedTravel, importTravel, matureTravel, order, reviewTravel, smallTravel, travelPanel } from './group-movement-fixture';

type RequestTrace = { id?: number; type?: string; armyId?: string; target?: number; append?: boolean };
type ReplyTrace = { id?: number; type?: string; hash?: string; bytes: number; observation: boolean; cells: boolean; map: boolean };
type Trace = { pending: number; requests: RequestTrace[]; responses: ReplyTrace[] };
async function observeTraffic(page: Page) {
  await page.addInitScript(() => {
    const trace: Trace = { pending: 0, requests: [], responses: [] };
    (window as unknown as { __TRAVEL_TRACE__: Trace }).__TRAVEL_TRACE__ = trace;
    const NativeWorker = window.Worker;
    window.Worker = class extends NativeWorker {
      private readonly waiting = new Set<number>();
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options);
        this.addEventListener('message', event => {
          const data = event.data as Record<string, unknown> & { id?: number; type?: string; hash?: string };
          trace.responses.push({ id: data.id, type: data.type, hash: data.hash,
            bytes: data.type === 'groupMovementPreview' ? new TextEncoder().encode(JSON.stringify(data)).byteLength : 0,
            observation: 'observation' in data, cells: 'cells' in data, map: 'map' in data });
          if (typeof data.id === 'number' && data.type !== 'progress') this.waiting.delete(data.id);
          trace.pending = this.waiting.size;
        });
      }
      override postMessage(message: unknown, options?: Transferable[] | StructuredSerializeOptions) {
        const data = message as RequestTrace;
        trace.requests.push({ id: data.id, type: data.type, armyId: data.armyId, target: data.target, append: data.append });
        if (typeof data.id === 'number') this.waiting.add(data.id);
        trace.pending = this.waiting.size;
        if (Array.isArray(options)) super.postMessage(message, options); else super.postMessage(message, options);
      }
    };
  });
}
async function trace(page: Page) {
  await expect.poll(() => page.evaluate(() => (window as unknown as { __TRAVEL_TRACE__: Trace }).__TRAVEL_TRACE__.pending)).toBe(0);
  return page.evaluate(() => (window as unknown as { __TRAVEL_TRACE__: Trace }).__TRAVEL_TRACE__);
}
async function snapshot(page: Page) {
  return page.evaluate(() => {
    const view = window.__THEANDRIL__!.getSummary()!;
    // Read only the asserted fields across the browser protocol. Copying the
    // giant settlement/development read model is not part of this scenario.
    return { hash: window.__THEANDRIL__!.getStateHash(), view: {
      exploredCells: view.exploredCells, routes: view.routes, postings: view.postings,
      ownArmies: view.ownArmies.map(({ id, cell }) => ({ id, cell })),
    }, metrics: window.__THEANDRIL__!.getPerformanceCounters() };
  });
}
async function recallHundred(page: Page, keyboard = false) {
  await openRegistry(page, 'armies');
  const groups = page.getByTestId('selection-groups');
  if (await groups.getAttribute('open') === null) await groups.locator(':scope > summary').click();
  await groups.getByRole('combobox', { name: 'Saved army group', exact: true }).selectOption({ label: 'Roadward hundred' });
  if (keyboard) { await groups.getByRole('button', { name: 'Recall group', exact: true }).focus(); await page.keyboard.press('Enter'); }
  else await groups.getByRole('button', { name: 'Recall group', exact: true }).click();
  await expect(page.getByTestId('group-postings')).toContainText('100 armies selected');
  await page.getByRole('searchbox', { name: 'Search your realm' }).fill('');
}

test('a hundred saved companies review compact routes and move through one exactly replayable canonical batch', async ({ page }, testInfo) => {
  const fixture = matureTravel(), { game, own, target, appendTarget } = fixture;
  const serial = deserializeGame(serializeGame(game));
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await observeTraffic(page); await importTravel(page, game);
  await selectFromRegistry(page, 'armies', own[0]!.name);
  await trace(page);
  const baseline = await snapshot(page);
  await openRegistry(page, 'armies');
  await page.getByRole('searchbox', { name: 'Search your realm' }).fill('');
  const registry = page.getByTestId('army-registry');
  await expect(registry.getByRole('checkbox')).toHaveCount(25);
  await registry.getByRole('checkbox').first().focus(); await page.keyboard.press('Space');
  await page.getByRole('button', { name: 'Next registry page', exact: true }).click();
  await registry.getByRole('checkbox').first().check();
  await page.getByRole('searchbox', { name: 'Search your realm' }).fill('Travel company 100');
  const beforeRecall = await trace(page);
  await recallHundred(page, true);
  expect((await snapshot(page)).hash).toBe(baseline.hash);
  expect(await trace(page)).toEqual(beforeRecall);

  const beforeReview = await trace(page);
  const panel = await reviewTravel(page, target);
  const preview = page.getByTestId('group-movement-preview');
  await expect(preview).toContainText('100 can queue · 0 unavailable');
  await expect(preview).toHaveAttribute('data-hash', baseline.hash);
  await expect(preview.getByRole('listitem')).toHaveCount(25);
  for (let index = 0; index < 3; index++) await preview.getByRole('button', { name: 'Next travel review page', exact: true }).click();
  await expect(preview).toContainText('Travel company 100');
  expect((await snapshot(page)).hash).toBe(baseline.hash);
  const reviewed = await trace(page);
  expect(reviewed.requests.slice(beforeReview.requests.length).map(item => item.type)).toEqual(['groupMovementPreview']);
  const queryReplies = reviewed.responses.slice(beforeReview.responses.length);
  expect(queryReplies).toHaveLength(1);
  expect(queryReplies[0]).toMatchObject({ type: 'groupMovementPreview', hash: baseline.hash, observation: false, cells: false, map: false });
  expect(queryReplies[0]!.bytes).toBeLessThan(64_000);
  expect((await snapshot(page)).view.exploredCells).toBe(baseline.view.exploredCells);

  // A different destination or route mode invalidates review before any order.
  await panel.getByRole('combobox', { name: 'Route mode', exact: true }).selectOption('append');
  await expect(preview).toHaveCount(0);
  await expect(panel.getByRole('button', { name: /^Apply reviewed routes/ })).toBeDisabled();
  await reviewTravel(page, target);
  await panel.getByRole('spinbutton', { name: 'Destination hex', exact: true }).fill(String(appendTarget));
  await expect(preview).toHaveCount(0);
  await expect(panel.getByRole('button', { name: /^Apply reviewed routes/ })).toBeDisabled();
  await reviewTravel(page, target);
  await panel.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('group-travel-desktop.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  // Review again through ordinary controls at the new width. The previous
  // immediate resize/scroll capture once caught an unpainted nested list.
  await reviewTravel(page, target);
  const narrowRow = preview.getByRole('listitem').first();
  await narrowRow.scrollIntoViewIfNeeded();
  await expect(narrowRow).toBeVisible();
  await expect(narrowRow).toBeInViewport();
  await expect(narrowRow).toContainText('Travel company 001');
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  const narrowReview = await preview.evaluate(element => {
    const list = element.querySelector('ul')!, row = list.querySelector('li')!;
    return { preview: element.getBoundingClientRect().toJSON(), firstRow: row.getBoundingClientRect().toJSON(), list: { clientHeight: list.clientHeight, scrollHeight: list.scrollHeight, scrollTop: list.scrollTop }, rowText: row.textContent };
  });
  await page.screenshot({ path: testInfo.outputPath('group-travel-narrow.png') });
  const narrowApply = panel.getByRole('button', { name: 'Apply reviewed routes (100)', exact: true });
  await narrowApply.scrollIntoViewIfNeeded();
  await expect(narrowApply).toBeInViewport();
  await expect(narrowApply).toBeEnabled();
  await expect(panel).toContainText('Travel preserves 3 selected postings.');
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await page.screenshot({ path: testInfo.outputPath('group-travel-controls-narrow.png') });
  const beforeApply = await trace(page);
  await panel.getByRole('button', { name: 'Apply reviewed routes (100)', exact: true }).focus(); await page.keyboard.press('Enter');
  const results = page.getByTestId('group-movement-results');
  await expect(results).toContainText('100 orders accepted · 0 refused');
  await expect(page.getByTestId('group-postings')).toContainText('0 armies selected');
  const after = await snapshot(page), appliedTrace = await trace(page);
  expect(appliedTrace.requests.slice(beforeApply.requests.length).map(item => item.type)).toEqual(['groupMovement', 'movementQuery']);
  expect(appliedTrace.responses.slice(beforeApply.responses.length).filter(item => item.type === 'state')).toHaveLength(1);
  const readRefreshes = appliedTrace.requests.slice(beforeApply.requests.length).filter(item => item.type === 'movementQuery');
  expect(readRefreshes).toHaveLength(1);
  for (const query of readRefreshes) {
    expect(query.target).toBeUndefined(); expect(query.append).toBeUndefined();
    expect(appliedTrace.responses.find(reply => reply.id === query.id)).toMatchObject({ type: 'movementQuery', hash: after.hash });
  }
  for (const army of own) order(serial, { type: 'queueMovement', factionId: game.turnOwnerId, armyId: army.id, target, append: false });
  expect(after.hash).toBe(stateHash(serial));
  expect(after.view.routes).toHaveLength(100);
  expect(after.view.ownArmies.every(army => army.cell !== fixture.origin)).toBe(true);
  expect(after.view.postings.map(({ armyId, factionId, cell, mode }) => ({ armyId, factionId, cell, mode }))).toEqual(game.postings);
  const paragraph = results.locator(':scope > p').first();
  await paragraph.scrollIntoViewIfNeeded();
  const bounds = await paragraph.boundingBox();
  await paragraph.screenshot({ path: testInfo.outputPath('group-travel-results.png') });
  const capture = { scenario: 'Authored Legendary/gen4/seed20260905, 40 owned hearths, 100 owned armies, 4000 total; local resource-consistent corridor', origin: fixture.origin, target, patch: fixture.patch, viewport: page.viewportSize(), deviceScaleFactor: 1, locator: '[data-testid="group-movement-results"] > p:first-child', bounds, narrowReview, transforms: 'none; direct native Playwright locator PNG', beforeHash: baseline.hash, afterHash: after.hash, queryBytes: queryReplies[0]!.bytes, stateTransferBytes: after.metrics.transferBytes, requests: appliedTrace.requests.slice(beforeApply.requests.length), responses: appliedTrace.responses.slice(beforeApply.responses.length) };
  await writeFile(testInfo.outputPath('group-travel-capture.json'), JSON.stringify(capture, null, 2));
  const applied = await exportedTravel(page);
  expect(serializeGame(applied.game)).toBe(serializeGame(serial));
  expect(applied.archive.records.map(record => record.command)).toEqual(own.map(army => ({ type: 'queueMovement', factionId: game.turnOwnerId, armyId: army.id, target, append: false })));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('a hundred existing journeys append waypoints, retain individual overrides and restore exact manual and portable saves', async ({ page }) => {
  const { game, own, target, appendTarget } = matureTravel();
  // Independent continuation fixture: canonical initial queue commands create
  // the import origin. The preceding journey proves those same100 orders
  // through the real UI; this test starts with their existing routes.
  for (const army of own) order(game, { type: 'queueMovement', factionId: game.turnOwnerId, armyId: army.id, target, append: false });
  const serial = deserializeGame(serializeGame(game));
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await importTravel(page, game); await page.setViewportSize({ width: 390, height: 844 });
  await recallHundred(page, true);
  const panel = await reviewTravel(page, appendTarget, true), results = page.getByTestId('group-movement-results');
  await panel.getByRole('button', { name: 'Apply reviewed routes (100)', exact: true }).click();
  await expect(results).toContainText('100 orders accepted · 0 refused');
  for (const army of own) order(serial, { type: 'queueMovement', factionId: game.turnOwnerId, armyId: army.id, target: appendTarget, append: true });
  const appended = await snapshot(page);
  expect(appended.hash).toBe(stateHash(serial));
  expect(appended.view.routes).toHaveLength(100);
  expect(appended.view.routes.every(route => JSON.stringify(route.waypoints) === JSON.stringify([target, appendTarget]))).toBe(true);
  await campaignMenu(page); await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  const saved = await exportedTravel(page);
  expect(serializeGame(saved.game)).toBe(serializeGame(serial));
  expect(saved.archive.records.map(record => record.command)).toEqual(own.map(army => ({ type: 'queueMovement', factionId: game.turnOwnerId, armyId: army.id, target: appendTarget, append: true })));
  await selectFromRegistry(page, 'armies', own[0]!.name); await openSelectedOrders(page);
  await page.getByRole('button', { name: 'Cancel route', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.routes.length)).toBe(99);
  await recallHundred(page); await travelPanel(page);
  await panel.getByRole('button', { name: 'Cancel travel routes (99)', exact: true }).click();
  await expect(results).toContainText('99 orders accepted · 0 refused');
  await expect(page.getByTestId('group-postings')).toContainText('1 armies selected');
  const cancelled = await snapshot(page);
  expect(cancelled.view.routes).toEqual([]);
  expect(cancelled.view.postings.map(({ armyId, factionId, cell, mode }) => ({ armyId, factionId, cell, mode }))).toEqual(game.postings);
  await page.reload(); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  expect((await snapshot(page)).hash).toBe(stateHash(saved.game));
  const restored = await exportedTravel(page); expect(restored.archive).toEqual(saved.archive);
  await page.reload();
  await page.getByLabel('Import save file').setInputFiles({ name: 'saved-roadward-hundred.theandril', mimeType: 'application/gzip', buffer: saved.bytes });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  expect((await snapshot(page)).hash).toBe(stateHash(saved.game));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('canonical destination refusals retain only the unavailable army for correction', async ({ page }) => {
  const { game, target, origin } = smallTravel({ refused: true });
  await importTravel(page, game); const panel = await travelPanel(page, true);
  const before = await snapshot(page); await reviewTravel(page, target);
  await expect(page.getByTestId('group-movement-preview')).toContainText('1 can queue · 1 unavailable');
  expect((await snapshot(page)).hash).toBe(before.hash);
  await panel.getByRole('button', { name: 'Apply reviewed routes (2)', exact: true }).click();
  await expect(page.getByTestId('group-movement-results')).toContainText('1 orders accepted · 1 refused');
  await expect(page.getByTestId('group-movement-results')).toContainText('Refused:');
  await expect(page.getByTestId('group-postings')).toContainText('1 armies selected');
  const accepted = await exportedTravel(page);
  const commands = accepted.archive.records.map(record => record.command as GameCommand);
  expect(commands.map(command => command.type)).toEqual(['queueMovement', 'queueMovement']);
  const serial = deserializeGame(serializeGame(game));
  // The rejected ordinary attempt remains in the real archive as well.
  for (const command of commands) {
    const beforeHash = stateHash(serial);
    const result = applyCommand(serial, command);
    if (!result.ok) expect(stateHash(serial)).toBe(beforeHash);
  }
  expect(serializeGame(accepted.game)).toBe(serializeGame(serial));
  await travelPanel(page);
  await page.getByRole('searchbox', { name: 'Search your realm' }).fill('Travel caravan');
  await page.getByTestId('group-postings').getByRole('button', { name: 'Select matching armies', exact: true }).click();
  await reviewTravel(page, origin + 12);
  await panel.getByRole('button', { name: 'Apply reviewed routes (1)', exact: true }).click();
  await expect(page.getByTestId('group-movement-results')).toContainText('1 orders accepted · 0 refused');
});

test('a real interrupted route stays paused when extended and explicitly resumes without clearing its posting', async ({ page }) => {
  const { game, origin, target } = smallTravel({ paused: true });
  await importTravel(page, game); const panel = await travelPanel(page, true, true);
  await expect(panel.getByRole('button', { name: 'Resume paused routes (1)', exact: true })).toBeEnabled();
  await reviewTravel(page, origin + 12, true);
  await panel.getByRole('button', { name: 'Apply reviewed routes (2)', exact: true }).click();
  await expect(page.getByTestId('group-movement-results')).toContainText('2 orders accepted · 0 refused');
  expect((await snapshot(page)).view.routes.find(route => route.armyId === 'army.2')).toMatchObject({ status: 'paused', waypoints: [target, origin + 12] });
  await travelPanel(page, true);
  await panel.getByRole('button', { name: 'Resume paused routes (1)', exact: true }).click();
  await expect(page.getByTestId('group-movement-results')).toContainText('1 orders accepted · 0 refused');
  const after = await exportedTravel(page);
  expect(after.game.armies['army.2']!.cell).not.toBe(game.armies['army.2']!.cell);
  expect(after.game.routes['army.2']?.status).not.toBe('paused');
  expect(after.game.postings).toEqual(game.postings);
  expect(after.game.wars).toEqual(game.wars);
  await closeManagement(page);
});
