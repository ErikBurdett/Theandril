import { writeFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { serializeGame, stateHash } from '@theandril/sim';
import { theaterCampaign } from '../../packages/test-fixtures/src/theater-fixture';
import { campaignMenu, exportedTravel, importTravel, order } from './group-movement-fixture';
import { closeManagement, openRegistry, selectFromRegistry } from './ui-navigation';

async function theaters(page: Page, id?: string, keyboard = false) {
  await openRegistry(page, 'armies');
  const panel = page.getByTestId('defense-theaters');
  if (await panel.getAttribute('open') === null) {
    if (keyboard) { await panel.locator(':scope > summary').focus(); await page.keyboard.press('Enter'); }
    else await panel.locator(':scope > summary').click();
  }
  if (id) await panel.getByRole('combobox', { name: 'Defensive theater', exact: true }).selectOption(id);
  return panel;
}
async function snapshot(page: Page) {
  return page.evaluate(() => {
    const view = window.__THEANDRIL__!.getSummary()!;
    return { hash: window.__THEANDRIL__!.getStateHash(), theaters: view.theaters!, routes: view.routes,
      postings: view.postings.map(({ armyId, factionId, cell, mode }) => ({ armyId, factionId, cell, mode })),
      armies: view.ownArmies.map(({ id, cell }) => ({ id, cell })) };
  });
}
async function nextTurn(page: Page, turn: number) {
  await closeManagement(page);
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${turn}`);
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
}
async function painted(page: Page) { await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))); }

test('a hundred recalled armies create a defensive theater through keyboard controls and fill next-turn coverage while postings override', async ({ page }, testInfo) => {
  const game = theaterCampaign(100), owner = game.turnOwnerId;
  const own = Object.values(game.armies).filter(army => army.factionId === owner).sort((a, b) => a.id < b.id ? -1 : 1);
  order(game, { type: 'setSelectionGroup', factionId: owner, kind: 'armies', name: 'Defense hundred', memberIds: own.map(army => army.id) });
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await importTravel(page, game);
  await selectFromRegistry(page, 'armies', own[0]!.name);
  await openRegistry(page, 'armies');
  await page.getByTestId('army-registry').getByRole('checkbox').first().check();
  await page.getByRole('button', { name: 'Post selected armies (1)', exact: true }).click();
  await expect(page.getByTestId('group-posting-results')).toContainText('1 orders accepted · 0 refused');
  const groups = page.getByTestId('selection-groups');
  await groups.locator(':scope > summary').click();
  await groups.getByRole('combobox', { name: 'Saved army group', exact: true }).selectOption({ label: 'Defense hundred' });
  await groups.getByRole('button', { name: 'Recall group', exact: true }).focus(); await page.keyboard.press('Enter');
  await expect(page.getByTestId('group-postings')).toContainText('100 armies selected');
  const before = await snapshot(page), panel = await theaters(page, undefined, true);
  await panel.getByRole('textbox', { name: 'Theater name', exact: true }).fill('Border watch');
  await panel.getByRole('combobox', { name: 'Reserve destination', exact: true }).selectOption('495');
  await panel.getByRole('combobox', { name: 'Guards per hearth', exact: true }).selectOption('2');
  await panel.getByRole('checkbox', { name: /^West watch · hex 500$/ }).check();
  await panel.getByRole('checkbox', { name: /^East watch · hex 510$/ }).check();
  await panel.getByRole('button', { name: 'Use checked armies (100)', exact: true }).click();
  expect((await snapshot(page)).hash).toBe(before.hash);
  await page.setViewportSize({ width: 390, height: 844 });
  await panel.getByRole('textbox', { name: 'Theater name', exact: true }).scrollIntoViewIfNeeded(); await painted(page);
  await page.screenshot({ path: testInfo.outputPath('defense-theater-controls-narrow.png') });
  await panel.getByRole('button', { name: 'Create theater', exact: true }).focus(); await page.keyboard.press('Enter');
  await expect(page.getByTestId('theater-report')).toContainText('Border watch · Enabled');
  const created = await snapshot(page);
  expect(created.theaters[0]).toMatchObject({ name: 'Border watch', armyIds: own.map(army => army.id), reserveCell: 495, guardsPerSettlement: 2, enabled: true, lastRunTurn: null, lastDispatches: [], missingGuards: 4 });
  expect(created.routes).toEqual(before.routes); expect(created.armies).toEqual(before.armies); expect(created.postings).toEqual(before.postings);
  await expect(page.getByTestId('theater-member-report').getByRole('listitem')).toHaveCount(25);
  for (let pageIndex = 0; pageIndex < 3; pageIndex++) await panel.getByRole('button', { name: 'Next theater members page', exact: true }).click();
  await expect(page.getByTestId('theater-member-report')).toContainText(own.at(-1)!.name);
  await nextTurn(page, game.turn + 1);
  const allocated = await snapshot(page), row = allocated.theaters[0]!;
  expect(row.lastRunTurn).toBe(game.turn + 1); expect(row.missingGuards).toBe(0);
  expect(row.hearths.map(hearth => [hearth.stationed, hearth.incoming, hearth.required, hearth.deficit])).toEqual([[0, 2, 2, 0], [0, 2, 2, 0]]);
  expect(row.lastDispatches).toHaveLength(4); expect(row.lastDispatches.every(dispatch => dispatch.accepted && [500, 510].includes(dispatch.targetCell))).toBe(true);
  expect(row.lastDispatches.some(dispatch => dispatch.armyId === own[0]!.id)).toBe(false);
  expect(allocated.routes).toHaveLength(4); expect(allocated.postings).toEqual(before.postings);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await theaters(page, row.id);
  const report = page.getByTestId('theater-report');
  await report.scrollIntoViewIfNeeded(); await painted(page);
  await page.screenshot({ path: testInfo.outputPath('defense-theater-report-desktop.png') });
  const desktopSummary = report.locator(':scope > p').first();
  await expect(desktopSummary).toContainText('4 incoming'); await expect(desktopSummary).toBeInViewport();
  await desktopSummary.screenshot({ path: testInfo.outputPath('defense-theater-summary-desktop.png') });
  await writeFile(testInfo.outputPath('defense-theater-summary-desktop-capture.json'), JSON.stringify({
    scenario: 'Authored Tiny/generator4/seed20260927, two founded hearths and 100 combat armies; all-land geography and empty deposits',
    viewport: page.viewportSize(), deviceScaleFactor: 1, locator: '[data-testid="theater-report"] > p:first-of-type', bounds: await desktopSummary.boundingBox(),
    transforms: 'none; direct native Playwright locator PNG', turn: game.turn + 1, hash: allocated.hash,
    text: await desktopSummary.textContent(), scope: 'Current canonical coverage counts. Four incoming armies are not four arrived garrisons.',
  }, null, 2));
  const rangeBounds = await desktopSummary.evaluate(element => {
    const range = document.createRange(); range.selectNodeContents(element);
    const rect = range.getBoundingClientRect();
    return { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
  });
  const clip = { x: Math.max(0, Math.floor(rangeBounds.x) - 1), y: Math.max(0, Math.floor(rangeBounds.y) - 1), width: 0, height: 0 };
  clip.width = Math.min(page.viewportSize()!.width, Math.ceil(rangeBounds.right) + 1) - clip.x;
  clip.height = Math.min(page.viewportSize()!.height, Math.ceil(rangeBounds.bottom) + 1) - clip.y;
  await page.screenshot({ path: testInfo.outputPath('defense-theater-summary-text.png'), clip });
  await writeFile(testInfo.outputPath('defense-theater-summary-text-capture.json'), JSON.stringify({
    scenario: 'Authored Tiny/generator4/seed20260927, two founded hearths and 100 combat armies; all-land geography and empty deposits',
    viewport: page.viewportSize(), deviceScaleFactor: 1, locator: '[data-testid="theater-report"] > p:first-of-type', rangeBounds, clip,
    transforms: 'none; direct native Playwright page screenshot of DOM Range text bounds with one-pixel safety padding; no CSS change or post-capture transformation',
    turn: game.turn + 1, hash: allocated.hash, text: await desktopSummary.textContent(),
    scope: 'Current canonical coverage counts. Four incoming armies are not four arrived garrisons.',
  }, null, 2));
  await report.getByText('Last theater dispatches', { exact: false }).click();
  await expect(page.getByTestId('theater-dispatch-report')).toContainText('Accepted:');
  await page.setViewportSize({ width: 390, height: 844 });
  await report.getByRole('heading', { name: 'Border watch · Enabled', exact: true }).scrollIntoViewIfNeeded(); await painted(page);
  await page.screenshot({ path: testInfo.outputPath('defense-theater-report-narrow.png') });
  const summary = report.locator(':scope > p').first();
  await summary.scrollIntoViewIfNeeded(); await expect(summary).toContainText('4 incoming'); await expect(summary).toBeInViewport(); await painted(page);
  const bounds = await summary.boundingBox();
  await summary.screenshot({ path: testInfo.outputPath('defense-theater-summary.png') });
  await writeFile(testInfo.outputPath('defense-theater-summary-capture.json'), JSON.stringify({
    scenario: 'Authored Tiny/generator4/seed20260927, two founded hearths and 100 combat armies; all-land geography and empty deposits',
    viewport: page.viewportSize(), deviceScaleFactor: 1, locator: '[data-testid="theater-report"] > p:first-of-type', bounds,
    transforms: 'none; direct native Playwright locator PNG', turn: game.turn + 1, hash: allocated.hash,
    text: await summary.textContent(), scope: 'Current canonical coverage counts. Four incoming armies are not four arrived garrisons.',
  }, null, 2));
  const exported = await exportedTravel(page);
  expect(stateHash(exported.game)).toBe(allocated.hash);
  expect(exported.archive.records.map(record => record.command)).toEqual(expect.arrayContaining([
    expect.objectContaining({ type: 'setTheater' }), expect.objectContaining({ type: 'endTurn' }),
  ]));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); expect(errors).toEqual([]);
});

test('detach, pause and delete preserve existing travel and postings while manual and portable saves restore the whole theater', async ({ page }, testInfo) => {
  const game = theaterCampaign(100), owner = game.turnOwnerId, ids = Object.keys(game.armies).sort();
  order(game, { type: 'setPosting', factionId: owner, armyId: ids[0]!, cell: 495, mode: 'hold' });
  order(game, { type: 'setTheater', factionId: owner, name: 'Saved watch', settlementIds: Object.keys(game.settlements).sort(), armyIds: ids, reserveCell: 495, guardsPerSettlement: 2, enabled: true });
  order(game, { type: 'endTurn', factionId: owner });
  await importTravel(page, game);
  const baseline = await snapshot(page); expect(baseline.routes).toHaveLength(4);
  await campaignMenu(page); await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  const saved = await exportedTravel(page), theaterId = baseline.theaters[0]!.id;
  const panel = await theaters(page, theaterId);
  await panel.getByRole('textbox', { name: 'Theater name', exact: true }).fill('Unsaved name');
  await panel.getByRole('combobox', { name: 'Guards per hearth', exact: true }).selectOption('4');
  const detachedId = baseline.routes[0]!.armyId, detachedName = game.armies[detachedId]!.name;
  await panel.getByRole('button', { name: `Detach ${detachedName} from theater`, exact: true }).click();
  await expect(panel.getByRole('textbox', { name: 'Theater name', exact: true })).toHaveValue('Saved watch');
  const detached = await snapshot(page);
  expect(detached.theaters[0]).toMatchObject({ name: 'Saved watch', guardsPerSettlement: 2, enabled: true, armyIds: ids.filter(id => id !== detachedId) });
  expect(detached.routes).toEqual(baseline.routes); expect(detached.postings).toEqual(baseline.postings);
  await panel.getByRole('button', { name: 'Pause theater', exact: true }).click();
  await expect(page.getByTestId('theater-report')).toContainText('Saved watch · Paused');
  const paused = await snapshot(page); expect(paused.routes).toEqual(baseline.routes);
  await nextTurn(page, game.turn + 1);
  const continued = await snapshot(page);
  expect(continued.theaters[0]).toMatchObject({ enabled: false, lastRunTurn: null, lastDispatches: [] });
  expect(continued.armies.find(army => army.id === detachedId)!.cell).not.toBe(paused.armies.find(army => army.id === detachedId)!.cell);
  expect(continued.postings).toEqual(baseline.postings);
  await theaters(page, theaterId);
  await panel.getByRole('button', { name: 'Enable theater', exact: true }).click();
  await expect(page.getByTestId('theater-report')).toContainText('Saved watch · Enabled');
  await panel.getByRole('button', { name: 'Delete theater', exact: true }).click();
  await expect(page.getByTestId('theater-report')).toHaveCount(0);
  const deleted = await snapshot(page); expect(deleted.theaters).toEqual([]); expect(deleted.routes).toEqual(continued.routes); expect(deleted.postings).toEqual(baseline.postings);
  await page.reload(); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored.'); expect((await snapshot(page)).hash).toBe(baseline.hash);
  const restored = await exportedTravel(page); expect(restored.archive).toEqual(saved.archive); expect(serializeGame(restored.game)).toBe(serializeGame(saved.game));
  await page.reload(); await page.getByLabel('Import save file').setInputFiles({ name: 'saved-defense.theandril', mimeType: 'application/gzip', buffer: saved.bytes });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign'); expect((await snapshot(page)).hash).toBe(baseline.hash);
  await page.setViewportSize({ width: 390, height: 844 }); await theaters(page, theaterId, true);
  await panel.getByRole('button', { name: 'Pause theater', exact: true }).scrollIntoViewIfNeeded(); await painted(page);
  await page.screenshot({ path: testInfo.outputPath('defense-theater-restored-controls-narrow.png') });
  await page.getByTestId('army-registry').getByRole('checkbox').first().check();
  await panel.getByRole('button', { name: 'Use checked armies (1)', exact: true }).click();
  await expect(panel).toContainText('99 existing member armies will be removed and 0 added');
  expect((await snapshot(page)).hash).toBe(baseline.hash);
  await panel.getByRole('button', { name: 'Save theater changes', exact: true }).click();
  await expect.poll(async () => (await snapshot(page)).theaters[0]!.armyIds.length).toBe(1);
  const replaced = await snapshot(page); expect(replaced.theaters[0]!.enabled).toBe(true); expect(replaced.routes).toEqual(baseline.routes); expect(replaced.postings).toEqual(baseline.postings);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
