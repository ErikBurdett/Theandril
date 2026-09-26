import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { applyCommand, createGame, serializeGame, stateHash } from '@theandril/sim';
import { deserializeCampaign, exportSave, importSave } from '@theandril/persistence';
import { cellTransferBytes, packCells } from '../../apps/web/src/cell-transfer';
import { empireLandCampaign } from '../../packages/test-fixtures/src/empire-land-fixture';
import { closeManagement, openRegistry, openSelectedOrders, selectFromRegistry } from './ui-navigation';

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

async function openTemplates(page: Page, keyboard = false) {
  const templates = page.getByTestId('charter-templates');
  if (await templates.getAttribute('open') === null) {
    const summary = templates.locator(':scope > summary');
    if (keyboard) { await summary.focus(); await page.keyboard.press('Enter'); }
    else await summary.click();
  }
  return templates;
}

async function snapshot(page: Page) {
  return page.evaluate(() => ({ hash: window.__THEANDRIL__!.getStateHash(), view: window.__THEANDRIL__!.getSummary()!, metrics: window.__THEANDRIL__!.getPerformanceCounters() }));
}

test('a saved charter template survives reload, changes no campaign until applied, and keeps forty hearths individually overridable', async ({ page }, testInfo) => {
  const game = empireLandCampaign('legendary');
  const towns = Object.values(game.settlements).filter(town => town.factionId === game.turnOwnerId).sort((a, b) => a.id < b.id ? -1 : 1);
  towns.forEach((town, index) => { town.name = `Template hearth ${String(index + 1).padStart(3, '0')}`; });
  expect(towns).toHaveLength(40);
  expect(Object.values(game.armies).filter(army => army.factionId === game.turnOwnerId)).toHaveLength(100);
  expect(applyCommand(game, { type: 'queue', factionId: game.turnOwnerId, settlementId: towns[0]!.id, itemId: 'building.granary' }).ok).toBe(true);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'charter-templates.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(game))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await save(page);
  await openRegistry(page, 'settlements');
  const group = page.getByTestId('group-charters');
  await group.getByRole('button', { name: 'Select matching hearths', exact: true }).click();
  await expect(group).toContainText('40 hearths selected');
  const before = await snapshot(page);
  const focus = group.getByRole('combobox', { name: 'Charter focus', exact: true });
  const ceiling = group.getByRole('spinbutton', { name: 'Coin ceiling per hearth', exact: true });
  const templates = await openTemplates(page);
  const library = templates.getByRole('combobox', { name: 'Saved charter template', exact: true });
  const name = templates.getByRole('textbox', { name: 'Template name', exact: true });
  await focus.selectOption('wealth');
  await ceiling.fill('24');
  await name.fill('Market charter');
  await templates.getByRole('button', { name: 'Save new template', exact: true }).click();
  await expect(library.getByRole('option', { name: /Market charter/ })).toHaveCount(1);
  const templateId = await library.getByRole('option', { name: /Market charter/ }).getAttribute('value');
  expect(templateId).toBeTruthy();
  await library.selectOption(templateId!);
  await focus.selectOption('learning');
  await ceiling.fill('32');
  await name.fill('Study charter');
  await templates.getByRole('button', { name: 'Update template', exact: true }).click();
  await expect(library.getByRole('option', { name: /Study charter/ })).toHaveCount(1);
  await expect(library.getByRole('option', { name: /Market charter/ })).toHaveCount(0);
  await focus.selectOption('works');
  await ceiling.fill('4');
  await templates.getByRole('button', { name: 'Recall template', exact: true }).click();
  await expect(focus).toHaveValue('learning');
  await expect(ceiling).toHaveValue('32');
  const prepared = await snapshot(page);
  expect(prepared.hash).toBe(before.hash);
  expect(prepared.metrics.totalTransferBytes).toBe(before.metrics.totalTransferBytes);
  expect(prepared.view.charters).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath('charter-templates-desktop.png') });

  // Export the real campaign after preference edits: no template or preference
  // action may enter its canonical snapshot or campaign journal.
  await settings(page);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export campaign', exact: true }).click();
  const downloadPath = await (await downloadPromise).path();
  expect(downloadPath).toBeTruthy();
  const exported = await importSave(await readFile(downloadPath!));
  const exportedCampaign = deserializeCampaign(exported);
  expect(stateHash(exportedCampaign.game)).toBe(before.hash);
  expect(exportedCampaign.archive.records).toHaveLength(0);
  expect(exported).not.toContain('Study charter');

  await page.reload();
  await restore(page);
  expect((await snapshot(page)).hash).toBe(before.hash);
  await openRegistry(page, 'settlements');
  await group.getByRole('button', { name: 'Select matching hearths', exact: true }).focus();
  await page.keyboard.press('Enter');
  await openTemplates(page, true);
  await expect(library.getByRole('option', { name: /Study charter/ })).toHaveCount(1);
  await library.selectOption(templateId!);
  // Merely choosing a saved row is not Recall and must not change the policy form.
  await expect(focus).toHaveValue('works');
  await expect(ceiling).toHaveValue('24');
  const recalledFrom = await snapshot(page);
  await templates.getByRole('button', { name: 'Recall template', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(focus).toHaveValue('learning');
  await expect(ceiling).toHaveValue('32');
  const recalled = await snapshot(page);
  expect(recalled.hash).toBe(recalledFrom.hash);
  expect(recalled.metrics.totalTransferBytes).toBe(recalledFrom.metrics.totalTransferBytes);
  await page.setViewportSize({ width: 390, height: 844 });
  await templates.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('charter-templates-narrow.png') });
  const detailPng = await templates.screenshot({ path: testInfo.outputPath('charter-templates-controls.png') });
  await testInfo.attach('template-capture.json', { body: JSON.stringify({ authored: 'Legendary/gen4/seed20260905, 40 owned hearths, 100 owned armies, 4000 total armies; one real paid manual queue', viewport: { width: 390, height: 844 }, locator: '[data-testid="charter-templates"]', boundingBox: await templates.boundingBox(), bytes: detailPng.byteLength, stage: 'Study charter recalled after browser reload; Learning/32 form awaits explicit Apply; no canonical charter yet', transformations: 'none; direct Playwright locator PNG' }, null, 2), contentType: 'application/json' });

  await group.getByRole('button', { name: 'Apply charters (40)', exact: true }).click();
  await expect(page.getByTestId('group-charter-results')).toContainText('40 orders accepted · 0 refused');
  const applied = await snapshot(page);
  expect(applied.view.charters).toHaveLength(40);
  expect(applied.view.charters.every(charter => charter.focus === 'learning' && charter.ceiling === 32)).toBe(true);
  expect(applied.view.ownSettlements.map(town => town.queue)).toEqual(before.view.ownSettlements.map(town => town.queue));
  expect(applied.view.treasury).toBe(before.view.treasury);
  expect(applied.view.exploredCells).toBe(before.view.exploredCells);
  expect(applied.metrics.cellTransferBytes).toBe(cellTransferBytes(packCells([])));
  expect(applied.metrics.totalTransferBytes - recalled.metrics.totalTransferBytes).toBe(applied.metrics.transferBytes);
  await save(page);
  await selectFromRegistry(page, 'settlements', towns[0]!.name);
  await openSelectedOrders(page);
  const charter = page.getByTestId('settlement-charter');
  await charter.locator(':scope > summary').click();
  await charter.getByRole('combobox', { name: 'Focus', exact: true }).selectOption('wealth');
  await charter.getByRole('button', { name: 'Update charter', exact: true }).click();
  await expect.poll(async () => (await snapshot(page)).view.charters.filter(item => item.focus === 'wealth').length).toBe(1);
  expect((await snapshot(page)).view.charters.filter(item => item.focus === 'learning')).toHaveLength(39);
  await restore(page);
  expect((await snapshot(page)).hash).toBe(applied.hash);

  await openRegistry(page, 'settlements');
  await group.getByRole('button', { name: 'Select matching hearths', exact: true }).click();
  await openTemplates(page);
  await library.selectOption(templateId!);
  const beforeDelete = await snapshot(page);
  await templates.getByRole('button', { name: 'Delete template', exact: true }).click();
  await expect(library.getByRole('option', { name: /Study charter/ })).toHaveCount(0);
  const deleted = await snapshot(page);
  expect(deleted.hash).toBe(beforeDelete.hash);
  expect(deleted.metrics.totalTransferBytes).toBe(beforeDelete.metrics.totalTransferBytes);
  expect(deleted.view.charters).toEqual(applied.view.charters);
  await page.reload();
  await restore(page);
  await openRegistry(page, 'settlements');
  await group.getByRole('button', { name: 'Select matching hearths', exact: true }).click();
  await openTemplates(page);
  await expect(library.getByRole('option', { name: /Study charter/ })).toHaveCount(0);
  expect((await snapshot(page)).hash).toBe(applied.hash);
  expect(errors).toEqual([]);
});

for (const failure of ['denied', 'transient-denial', 'malformed'] as const) {
  test(`a ${failure} template library reports failure without blocking ordinary charter orders or overwriting stored rows`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    if (failure !== 'malformed') await page.addInitScript(({ transient }) => {
      const open = IDBFactory.prototype.open;
      let denied = false;
      IDBFactory.prototype.open = function (name: string, version?: number) {
        if (name === 'theandril-preferences' && (!transient || !denied)) {
          denied = true;
          throw new DOMException('Template storage denied by the browser fixture.', 'SecurityError');
        }
        return version === undefined ? open.call(this, name) : open.call(this, name, version);
      };
    }, { transient: failure === 'transient-denial' });
    const game = createGame({ seed: 17, size: 'tiny', factionCount: 2 });
    expect(applyCommand(game, { type: 'found', factionId: game.turnOwnerId, armyId: 'army.1', name: 'Template Recovery' }).ok).toBe(true);
    await page.goto('/');
    if (failure === 'malformed') await page.evaluate(() => new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('theandril-preferences', 10);
      request.onupgradeneeded = () => {
        const store = request.result.createObjectStore('charterTemplates', { keyPath: 'id' });
        store.createIndex('nameKey', 'nameKey', { unique: true });
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction('charterTemplates', 'readwrite');
        transaction.objectStore('charterTemplates').put({ id: 'broken-template', version: 999, name: 'Keep this invalid row', nameKey: 'keep this invalid row', focus: 'wealth', ceiling: 24 });
        transaction.oncomplete = () => { db.close(); resolve(); };
        transaction.onerror = () => { db.close(); reject(transaction.error); };
      };
    }));
    await page.locator('input[type=file]').setInputFiles({ name: 'template-recovery.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(game))) });
    await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
    await openRegistry(page, 'settlements');
    const group = page.getByTestId('group-charters');
    await group.getByRole('button', { name: 'Select matching hearths', exact: true }).click();
    const before = await snapshot(page);
    const templates = await openTemplates(page);
    await expect(templates.getByRole('alert')).toContainText('Charter templates could not be loaded.');
    await expect(templates.getByRole('button', { name: 'Save new template', exact: true })).toBeDisabled();
    await expect(group.getByRole('button', { name: 'Apply charters (1)', exact: true })).toBeEnabled();
    await templates.getByRole('button', { name: 'Retry templates', exact: true }).click();
    if (failure === 'transient-denial') {
      await expect(templates.getByRole('alert')).toHaveCount(0);
      await templates.getByRole('textbox', { name: 'Template name', exact: true }).fill('Recovered policy');
      await templates.getByRole('button', { name: 'Save new template', exact: true }).click();
      await expect(templates.getByRole('option', { name: /Recovered policy/ })).toHaveCount(1);
    } else await expect(templates.getByRole('alert')).toContainText('Charter templates could not be loaded.');
    const failed = await snapshot(page);
    expect(failed.hash).toBe(before.hash);
    expect(failed.metrics.totalTransferBytes).toBe(before.metrics.totalTransferBytes);
    await expect(group.getByRole('button', { name: 'Apply charters (1)', exact: true })).toBeEnabled();
    await group.getByRole('button', { name: 'Apply charters (1)', exact: true }).click();
    await expect(page.getByTestId('group-charter-results')).toContainText('1 orders accepted · 0 refused');
    expect((await snapshot(page)).view.charters).toHaveLength(1);
    if (failure === 'malformed') {
      const rows = await page.evaluate(() => new Promise<unknown[]>((resolve, reject) => {
        const request = indexedDB.open('theandril-preferences');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction('charterTemplates', 'readonly');
          const rows = transaction.objectStore('charterTemplates').getAll();
          transaction.oncomplete = () => { db.close(); resolve(rows.result); };
          transaction.onerror = () => { db.close(); reject(transaction.error); };
        };
      }));
      expect(rows).toEqual([{ id: 'broken-template', version: 999, name: 'Keep this invalid row', nameKey: 'keep this invalid row', focus: 'wealth', ceiling: 24 }]);
    }
    expect(errors).toEqual([]);
  });
}
