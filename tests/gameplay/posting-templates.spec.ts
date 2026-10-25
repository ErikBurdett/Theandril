import { readFile, writeFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { replayArchive } from '@theandril/chronicle';
import { applyCommand, createGame, serializeGame, stateHash, type GameState } from '@theandril/sim';
import { deserializeCampaign, exportSave, importSave } from '@theandril/persistence';
import { empireLandCampaign } from '../../packages/test-fixtures/src/empire-land-fixture';
import { closeManagement, openRegistry } from './ui-navigation';

async function settings(page: Page) {
  await closeManagement(page);
  const menu = page.getByTestId('campaign-menu');
  if (await menu.getAttribute('open') === null) await menu.locator(':scope > summary').click();
}

async function save(page: Page) {
  await settings(page);
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
}

async function restore(page: Page) {
  if (await page.getByTestId('turn-counter').isVisible()) await settings(page);
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
}

async function importGame(page: Page, game: GameState) {
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'posting-templates.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(game))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
}

async function selectArmies(page: Page) {
  await openRegistry(page, 'armies');
  const group = page.getByTestId('group-postings');
  await group.getByRole('button', { name: 'Select matching armies', exact: true }).click();
  return group;
}

async function templates(page: Page, keyboard = false) {
  const library = page.getByTestId('posting-templates');
  if (await library.getAttribute('open') === null) {
    const summary = library.locator(':scope > summary');
    if (keyboard) { await summary.focus(); await page.keyboard.press('Enter'); }
    else await summary.click();
  }
  return library;
}

async function snapshot(page: Page) {
  return page.evaluate(() => ({ hash: window.__THEANDRIL__!.getStateHash(), view: window.__THEANDRIL__!.getSummary()!, metrics: window.__THEANDRIL__!.getPerformanceCounters() }));
}

async function exportedCampaign(page: Page) {
  await settings(page);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export campaign', exact: true }).click();
  const path = await (await download).path();
  expect(path).toBeTruthy();
  const text = await importSave(await readFile(path!));
  return { text, ...deserializeCampaign(text) };
}

test('posting template edits, recall, reload and deletion stay outside campaign history and require a fresh hearth choice', async ({ page }, testInfo) => {
  const game = createGame({ seed: 17, size: 'tiny', factionCount: 2 });
  expect(applyCommand(game, { type: 'found', factionId: game.turnOwnerId, armyId: 'army.1', name: 'Template Hearth' }).ok).toBe(true);
  const town = Object.values(game.settlements).find(town => town.factionId === game.turnOwnerId)!;
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await importGame(page, game);
  await save(page);
  const group = await selectArmies(page), library = await templates(page, true);
  const saved = library.getByRole('combobox', { name: 'Saved posting template', exact: true });
  const name = library.getByRole('textbox', { name: 'Template name', exact: true });
  const destination = group.getByRole('combobox', { name: 'Group destination', exact: true });
  const mode = group.getByRole('combobox', { name: 'Group arrival order', exact: true });
  const before = await snapshot(page);
  await name.fill('Hold the line');
  await library.getByRole('button', { name: 'Save new template', exact: true }).click();
  await expect(saved.getByRole('option', { name: 'Hold the line', exact: true })).toHaveCount(1);
  const id = await saved.getByRole('option', { name: 'Hold the line', exact: true }).getAttribute('value');
  expect(id).toBeTruthy();
  await destination.selectOption(String(town.cell));
  await mode.selectOption('join');
  await name.fill('Muster at a hearth');
  await library.getByRole('button', { name: 'Update template', exact: true }).click();
  await expect(saved.getByRole('option', { name: 'Muster at a hearth', exact: true })).toHaveCount(1);
  await expect(saved.getByRole('option', { name: 'Hold the line', exact: true })).toHaveCount(0);
  await mode.selectOption('hold');
  await destination.selectOption('current');
  await saved.selectOption('');
  await saved.selectOption(id!);
  await expect(mode).toHaveValue('hold');
  await expect(destination).toHaveValue('current');
  await library.getByRole('button', { name: 'Recall template', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(mode).toHaveValue('join');
  await expect(destination).toHaveValue('');
  await expect(group.getByRole('button', { name: /^Post selected armies/ })).toBeDisabled();
  await destination.selectOption(String(town.cell));
  await expect(group.getByRole('button', { name: /^Post selected armies/ })).toBeEnabled();
  // Even a second recall must ask again instead of reusing the previous hearth.
  await library.getByRole('button', { name: 'Recall template', exact: true }).click();
  await expect(destination).toHaveValue('');
  const recalled = await snapshot(page);
  expect(recalled.hash).toBe(before.hash);
  expect(recalled.metrics.totalTransferBytes).toBe(before.metrics.totalTransferBytes);
  expect(recalled.view.postings).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath('posting-template-fresh-destination.png') });
  const exported = await exportedCampaign(page);
  expect(stateHash(exported.game)).toBe(before.hash);
  expect(exported.archive.records).toHaveLength(0);
  expect(exported.text).not.toContain('Muster at a hearth');
  await page.reload();
  await restore(page);
  await selectArmies(page);
  await templates(page);
  await saved.selectOption(id!);
  await expect(mode).toHaveValue('hold');
  await expect(destination).toHaveValue('current');
  await library.getByRole('button', { name: 'Recall template', exact: true }).click();
  await expect(mode).toHaveValue('join');
  await expect(destination).toHaveValue('');
  const beforeDelete = await snapshot(page);
  await library.getByRole('button', { name: 'Delete template', exact: true }).click();
  await expect(saved.getByRole('option', { name: 'Muster at a hearth', exact: true })).toHaveCount(0);
  expect((await snapshot(page)).hash).toBe(beforeDelete.hash);
  expect((await snapshot(page)).metrics.totalTransferBytes).toBe(beforeDelete.metrics.totalTransferBytes);
  await page.reload();
  await restore(page);
  await selectArmies(page);
  await templates(page);
  await expect(saved.getByRole('option', { name: 'Muster at a hearth', exact: true })).toHaveCount(0);
  expect((await snapshot(page)).hash).toBe(before.hash);
  expect(errors).toEqual([]);
});

test('a hearth template recalled in another campaign requires its own destination while existing postings remain clearable', async ({ page }) => {
  const first = createGame({ seed: 17, size: 'tiny', factionCount: 2 });
  expect(applyCommand(first, { type: 'found', factionId: first.turnOwnerId, armyId: 'army.1', name: 'First Muster Hearth' }).ok).toBe(true);
  const firstTown = Object.values(first.settlements).find(town => town.factionId === first.turnOwnerId)!;
  await importGame(page, first);
  const group = await selectArmies(page), library = await templates(page);
  const destination = group.getByRole('combobox', { name: 'Group destination', exact: true });
  const mode = group.getByRole('combobox', { name: 'Group arrival order', exact: true });
  const saved = library.getByRole('combobox', { name: 'Saved posting template', exact: true });
  await destination.selectOption(String(firstTown.cell));
  await mode.selectOption('join');
  await library.getByRole('textbox', { name: 'Template name', exact: true }).fill('Reusable hearth muster');
  await library.getByRole('button', { name: 'Save new template', exact: true }).click();
  await expect(saved.getByRole('option', { name: 'Reusable hearth muster', exact: true })).toHaveCount(1);
  const id = await saved.getByRole('option', { name: 'Reusable hearth muster', exact: true }).getAttribute('value');
  expect(id).toBeTruthy();

  const second = createGame({ seed: 29, size: 'tiny', factionCount: 2 });
  expect(applyCommand(second, { type: 'found', factionId: second.turnOwnerId, armyId: 'army.1', name: 'Second Muster Hearth' }).ok).toBe(true);
  const secondTown = Object.values(second.settlements).find(town => town.factionId === second.turnOwnerId)!;
  const army = Object.values(second.armies).find(army => army.factionId === second.turnOwnerId)!;
  expect(secondTown.cell).not.toBe(firstTown.cell);
  expect(applyCommand(second, { type: 'setPosting', factionId: second.turnOwnerId, armyId: army.id, cell: army.cell, mode: 'hold' }).ok).toBe(true);
  await importGame(page, second);
  await selectArmies(page);
  await templates(page);
  await saved.selectOption(id!);
  const before = await snapshot(page);
  await library.getByRole('button', { name: 'Recall template', exact: true }).click();
  await expect(mode).toHaveValue('join');
  await expect(destination).toHaveValue('');
  await expect(group.getByRole('button', { name: 'Post selected armies (1)', exact: true })).toBeDisabled();
  await expect(group.getByRole('button', { name: 'Clear selected postings (1)', exact: true })).toBeEnabled();
  const recalled = await snapshot(page);
  expect(recalled.hash).toBe(before.hash);
  expect(recalled.metrics.totalTransferBytes).toBe(before.metrics.totalTransferBytes);
  await group.getByRole('button', { name: 'Clear selected postings (1)', exact: true }).click();
  await expect(page.getByTestId('group-posting-results')).toContainText('1 orders accepted · 0 refused');
  expect((await snapshot(page)).view.postings).toHaveLength(0);
  await group.getByRole('button', { name: 'Select matching armies', exact: true }).click();
  await templates(page);
  await saved.selectOption(id!);
  await library.getByRole('button', { name: 'Recall template', exact: true }).click();
  await expect(destination).toHaveValue('');
  await destination.selectOption(String(secondTown.cell));
  await group.getByRole('button', { name: 'Post selected armies (1)', exact: true }).click();
  await expect.poll(async () => (await snapshot(page)).view.postings).toMatchObject([{ armyId: army.id, cell: secondTown.cell, mode: 'join' }]);
});

test('a recalled posting template applies to one hundred armies through ordinary orders and survives saved recovery and replay', async ({ page }, testInfo) => {
  const game = empireLandCampaign('legendary');
  expect(Object.values(game.armies).filter(army => army.factionId === game.turnOwnerId)).toHaveLength(100);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await importGame(page, game);
  const group = await selectArmies(page), library = await templates(page);
  const mode = group.getByRole('combobox', { name: 'Group arrival order', exact: true });
  const before = await snapshot(page);
  await library.getByRole('textbox', { name: 'Template name', exact: true }).fill('Hold every position');
  await library.getByRole('button', { name: 'Save new template', exact: true }).click();
  await expect(library.getByRole('option', { name: 'Hold every position', exact: true })).toHaveCount(1);
  await mode.selectOption('join');
  await library.getByRole('button', { name: 'Recall template', exact: true }).click();
  await expect(mode).toHaveValue('hold');
  await expect(group).toContainText('100 armies selected');
  const recalled = await snapshot(page);
  expect(recalled.hash).toBe(before.hash);
  expect(recalled.metrics.totalTransferBytes).toBe(before.metrics.totalTransferBytes);
  await library.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('posting-templates-desktop.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await library.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('posting-templates-narrow.png') });
  await library.screenshot({ path: testInfo.outputPath('posting-templates-controls.png') });
  await group.getByRole('button', { name: 'Post selected armies (100)', exact: true }).click();
  await expect(page.getByTestId('group-posting-results')).toContainText('100 orders accepted · 0 refused');
  const applied = await snapshot(page);
  expect(applied.view.postings).toHaveLength(100);
  expect(applied.view.postings.every(posting => posting.mode === 'hold' && posting.arrived)).toBe(true);
  expect(applied.view.exploredCells).toBe(before.view.exploredCells);
  expect(applied.metrics.totalTransferBytes - recalled.metrics.totalTransferBytes).toBe(applied.metrics.transferBytes);
  const transferEvidence = JSON.stringify({ authored: 'Legendary/gen4/seed20260905, 40 owned hearths, 100 owned armies, 4000 total armies; purchased land in fixture', beforeHash: before.hash, afterHash: applied.hash, commandMs: applied.metrics.commandMs, transferBytes: applied.metrics.transferBytes, publishedStates: 1, screenshots: 'Native Playwright captures without image transformations' }, null, 2);
  await writeFile(testInfo.outputPath('posting-template-transfer.json'), transferEvidence);
  await testInfo.attach('posting-template-transfer.json', { body: transferEvidence, contentType: 'application/json' });
  await save(page);
  await selectArmies(page);
  await group.getByRole('button', { name: 'Clear selected postings (100)', exact: true }).click();
  await expect.poll(async () => (await snapshot(page)).view.postings.length).toBe(0);
  await restore(page);
  expect((await snapshot(page)).hash).toBe(applied.hash);
  const exported = await exportedCampaign(page);
  expect(stateHash(exported.game)).toBe(applied.hash);
  expect(exported.archive.records).toHaveLength(100);
  expect(stateHash(replayArchive(exported.archive))).toBe(applied.hash);
  expect(exported.text).not.toContain('Hold every position');
  expect(errors).toEqual([]);
});

for (const failure of ['denied', 'transient-denial', 'malformed'] as const) {
  test(`a ${failure} posting library preserves stored rows and leaves direct posting orders usable`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    if (failure !== 'malformed') await page.addInitScript(({ transient }) => {
      const open = IDBFactory.prototype.open;
      let denied = false;
      IDBFactory.prototype.open = function (name: string, version?: number) {
        if (name === 'theandril-posting-preferences' && (!transient || !denied)) {
          denied = true;
          throw new DOMException('Posting template storage denied by the browser fixture.', 'SecurityError');
        }
        return version === undefined ? open.call(this, name) : open.call(this, name, version);
      };
    }, { transient: failure === 'transient-denial' });
    await importGame(page, createGame({ seed: 17, size: 'tiny', factionCount: 2 }));
    const invalidRow = { id: 'broken-template', version: 999, name: 'Keep this invalid row', nameKey: 'keep this invalid row', mode: 'hold', destination: 'current' };
    if (failure === 'malformed') await page.evaluate(row => new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('theandril-posting-preferences', 10);
      request.onupgradeneeded = () => {
        const store = request.result.createObjectStore('postingTemplates', { keyPath: 'id' });
        store.createIndex('nameKey', 'nameKey', { unique: true });
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result, transaction = db.transaction('postingTemplates', 'readwrite');
        transaction.objectStore('postingTemplates').put(row);
        transaction.oncomplete = () => { db.close(); resolve(); };
        transaction.onerror = () => { db.close(); reject(transaction.error); };
      };
    }), invalidRow);
    const group = await selectArmies(page), before = await snapshot(page), library = await templates(page);
    await expect(library.getByRole('alert')).toContainText('Posting templates could not be loaded.');
    await expect(library.getByRole('button', { name: 'Save new template', exact: true })).toBeDisabled();
    await expect(group.getByRole('button', { name: 'Post selected armies (2)', exact: true })).toBeEnabled();
    await library.getByRole('button', { name: 'Retry templates', exact: true }).click();
    if (failure === 'transient-denial') {
      await expect(library.getByRole('alert')).toHaveCount(0);
      await library.getByRole('textbox', { name: 'Template name', exact: true }).fill('Recovered posting');
      await library.getByRole('button', { name: 'Save new template', exact: true }).click();
      await expect(library.getByRole('option', { name: 'Recovered posting', exact: true })).toHaveCount(1);
    } else await expect(library.getByRole('alert')).toContainText('Posting templates could not be loaded.');
    const failed = await snapshot(page);
    expect(failed.hash).toBe(before.hash);
    expect(failed.metrics.totalTransferBytes).toBe(before.metrics.totalTransferBytes);
    await group.getByRole('button', { name: 'Post selected armies (2)', exact: true }).click();
    await expect(page.getByTestId('group-posting-results')).toContainText('2 orders accepted · 0 refused');
    expect((await snapshot(page)).view.postings).toHaveLength(2);
    if (failure === 'malformed') {
      const rows = await page.evaluate(() => new Promise<unknown[]>((resolve, reject) => {
        const request = indexedDB.open('theandril-posting-preferences');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result, transaction = db.transaction('postingTemplates', 'readonly');
          const read = transaction.objectStore('postingTemplates').getAll();
          transaction.oncomplete = () => { db.close(); resolve(read.result); };
          transaction.onerror = () => { db.close(); reject(transaction.error); };
        };
      }));
      expect(rows).toEqual([invalidRow]);
    }
    expect(errors).toEqual([]);
  });
}
