import { expect, test } from '@playwright/test';
import { applyCommand, createGame, serializeGame } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { openRegistry } from './ui-navigation';

// Author-owned storage fault scenarios. They alter only the personal preference
// database; campaign state still enters through a validated scenario import.
for (const failure of ['denied', 'transient-denial', 'malformed'] as const) {
  test(`a ${failure} production-template library preserves stored rows and keeps explicit paid production usable`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    if (failure !== 'malformed') await page.addInitScript(({ transient }) => {
      const open = IDBFactory.prototype.open;
      let denied = false;
      IDBFactory.prototype.open = function (name: string, version?: number) {
        if (name === 'theandril-production-preferences' && (!transient || !denied)) {
          denied = true;
          throw new DOMException('Production template storage denied by the browser fixture.', 'SecurityError');
        }
        return version === undefined ? open.call(this, name) : open.call(this, name, version);
      };
    }, { transient: failure === 'transient-denial' });
    const game = createGame({ seed: 17, size: 'tiny', factionCount: 2 });
    expect(applyCommand(game, { type: 'found', factionId: game.turnOwnerId, armyId: 'army.1', name: 'Production Recovery' }).ok).toBe(true);
    await page.goto('/');
    const badRow = { id: 'broken-production-template', version: 999, name: 'Preserve this sequence', nameKey: 'preserve this sequence', itemIds: ['unit.future'] };
    if (failure === 'malformed') await page.evaluate(row => new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('theandril-production-preferences', 10);
      request.onupgradeneeded = () => {
        const store = request.result.createObjectStore('productionTemplates', { keyPath: 'id' });
        store.createIndex('nameKey', 'nameKey', { unique: true });
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result, transaction = db.transaction('productionTemplates', 'readwrite');
        transaction.objectStore('productionTemplates').put(row);
        transaction.oncomplete = () => { db.close(); resolve(); };
        transaction.onerror = () => { db.close(); reject(transaction.error); };
      };
    }), badRow);
    await page.locator('input[type=file]').setInputFiles({ name: 'production-template-recovery.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(game))) });
    await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
    await openRegistry(page, 'settlements');
    await page.getByTestId('group-charters').getByRole('button', { name: 'Select matching hearths', exact: true }).click();
    const panel = page.getByTestId('group-production');
    await panel.locator(':scope > summary').click();
    await panel.getByRole('combobox', { name: 'Production item', exact: true }).selectOption('unit.guard');
    await panel.getByRole('button', { name: 'Add project', exact: true }).click();
    const before = await page.evaluate(() => ({ hash: window.__THEANDRIL__!.getStateHash(), view: window.__THEANDRIL__!.getSummary()!, bytes: window.__THEANDRIL__!.getPerformanceCounters().totalTransferBytes }));
    const templates = page.getByTestId('production-templates');
    await templates.locator(':scope > summary').click();
    await expect(templates.getByRole('alert')).toContainText('Production templates could not be loaded.');
    await expect(templates.getByRole('button', { name: 'Save production template', exact: true })).toBeDisabled();
    await expect(panel.getByRole('button', { name: 'Apply production (1)', exact: true })).toBeEnabled();
    await templates.getByRole('button', { name: 'Retry production templates', exact: true }).click();
    if (failure === 'transient-denial') {
      await expect(templates.getByRole('alert')).toHaveCount(0);
      await templates.getByRole('textbox', { name: 'Production template name', exact: true }).fill('Recovered production');
      await templates.getByRole('button', { name: 'Save production template', exact: true }).click();
      await expect(templates.getByRole('option', { name: /Recovered production/ })).toHaveCount(1);
    } else await expect(templates.getByRole('alert')).toContainText('Production templates could not be loaded.');
    expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(before.hash);
    expect(await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().totalTransferBytes)).toBe(before.bytes);
    // Direct editor and Apply remain usable after failed library operations.
    await panel.getByRole('combobox', { name: 'Production item', exact: true }).selectOption('unit.scout');
    await panel.getByRole('button', { name: 'Add project', exact: true }).click();
    await panel.getByRole('button', { name: 'Apply production (1)', exact: true }).click();
    await expect(page.getByTestId('group-production-results')).toContainText('2 orders accepted · 0 refused.');
    await expect(page.getByTestId('group-charters')).toContainText('0 hearths selected');
    const after = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!);
    expect(after.ownSettlements[0]!.queue.map(item => item.itemId)).toEqual(['unit.guard', 'unit.scout']);
    expect(after.treasury).toBe(before.view.treasury - 20);
    if (failure === 'malformed') {
      const rows = await page.evaluate(() => new Promise<unknown[]>((resolve, reject) => {
        const request = indexedDB.open('theandril-production-preferences');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result, transaction = db.transaction('productionTemplates', 'readonly');
          const rows = transaction.objectStore('productionTemplates').getAll();
          transaction.oncomplete = () => { db.close(); resolve(rows.result); };
          transaction.onerror = () => { db.close(); reject(transaction.error); };
        };
      }));
      expect(rows).toEqual([badRow]);
    }
    expect(errors).toEqual([]);
  });
}
