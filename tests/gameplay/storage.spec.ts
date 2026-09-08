import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { deserializeCampaign, importSave } from '@theandril/persistence';
import { replayArchive } from '@theandril/chronicle';
import { stateHash } from '@theandril/sim';
import { closeCampaignOptions, closeManagement, openRegistry, openSelectedOrders, selectFromRegistry } from './ui-navigation';

interface Generation { id: number; kind: 'auto' | 'manual'; type: 'chunks' | 'legacy'; turn: number; manifestDigest: string; originDigest: string; headDigest: string | null; legacyId: number | null }
interface StoredBlob { digest: string; type: 'origin' | 'chunk' | 'fragment'; previousDigest: string | null; refs: number; byteLength: number; from: number; to: number }
interface DatabaseImage { version: number; generations: Generation[]; manifests: { generationId: number; payload: string }[]; blobs: StoredBlob[]; payloads: { digest: string; replica: number; payload: string }[]; legacy: unknown[] }

/** Read persisted browser artifacts, never campaign internals or worker mutation helpers. */
async function databaseImage(page: Page): Promise<DatabaseImage> {
  return page.evaluate(() => new Promise<DatabaseImage>((resolve, reject) => {
    const request = indexedDB.open('theandril-campaigns');
    request.onupgradeneeded = () => { request.transaction?.abort(); reject(new Error('Expected the real campaign database to exist.')); };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tables = ['campaignGenerations', 'campaignManifests', 'campaignBlobs', 'campaignPayloads', 'saves'];
      const transaction = db.transaction(tables, 'readonly');
      const rows = tables.map(table => transaction.objectStore(table).getAll());
      transaction.onerror = () => { db.close(); reject(transaction.error); };
      transaction.oncomplete = () => {
        const result = { version: db.version, generations: rows[0]!.result, manifests: rows[1]!.result, blobs: rows[2]!.result, payloads: rows[3]!.result, legacy: rows[4]!.result } as DatabaseImage;
        db.close(); resolve(result);
      };
    };
  }));
}

async function settings(page: Page): Promise<void> {
  await closeManagement(page);
  const section = page.locator('.campaign-options');
  if (!await section.evaluate(element => (element as HTMLDetailsElement).open)) await section.locator('summary').click();
}
async function save(page: Page): Promise<void> {
  await settings(page);
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
}
async function endTurn(page: Page, turn: number): Promise<void> {
  await closeManagement(page);
  await closeCampaignOptions(page);
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${turn}`);
  await expect(page.getByTestId('feedback')).toContainText('Autosaved.');
}

test('incremental browser saves share journal chunks and recover an older manifest with exact exported replay', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('textbox', { name: 'World seed', exact: true }).fill('20260905');
  await page.getByRole('combobox', { name: 'World size', exact: true }).selectOption('tiny');
  await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 1');
  await selectFromRegistry(page, 'armies', /Hearth caravan/);
  await openSelectedOrders(page);
  await page.getByRole('textbox', { name: 'Settlement name', exact: true }).fill('Ledger Hearth');
  await page.getByRole('button', { name: 'Found settlement', exact: true }).click();
  await openRegistry(page, 'settlements');
  await expect(page.getByTestId('settlement-registry')).toContainText('Ledger Hearth');
  await endTurn(page, 2);
  await save(page);
  const firstHash = await page.evaluate(() => window.__THEANDRIL__?.getStateHash());
  const first = await databaseImage(page);
  expect(first.version).toBe(20); // Dexie schema version2 uses native IndexedDB version20.
  expect(first.legacy).toEqual([]);
  expect(first.generations).toHaveLength(2);
  expect(first.generations.every(item => item.type === 'chunks' && !('text' in item) && !('payload' in item))).toBe(true);
  expect(first.blobs.filter(item => item.type === 'origin')).toHaveLength(1);
  expect(first.blobs.filter(item => item.type === 'chunk').length).toBeGreaterThan(0);
  expect(first.generations[0]!.headDigest).toBe(first.generations[1]!.headDigest);
  expect(first.generations[0]!.originDigest).toBe(first.generations[1]!.originDigest);
  expect(first.payloads).toHaveLength(first.blobs.length * 3);
  for (const blob of first.blobs) {
    const replicas = first.payloads.filter(item => item.digest === blob.digest).sort((a, b) => a.replica - b.replica);
    expect(replicas.map(item => item.replica)).toEqual([0, 1, 2]);
    expect(new Set(replicas.map(item => item.payload)).size).toBe(1);
  }
  expect(first.manifests.every(item => !item.payload.includes('"format":"theandril-campaign"') && !item.payload.includes('"records":['))).toBe(true);
  await save(page); // No new command: a new slot generation must reuse the same immutable journal data.
  const unchanged = await databaseImage(page);
  expect(unchanged.blobs.map(item => item.digest).sort()).toEqual(first.blobs.map(item => item.digest).sort());
  expect(unchanged.payloads).toEqual(first.payloads);
  await endTurn(page, 3);
  await save(page);
  const newestHash = await page.evaluate(() => window.__THEANDRIL__?.getStateHash());
  expect(newestHash).not.toBe(firstHash);
  const newer = await databaseImage(page);
  expect(newer.blobs.length).toBeGreaterThan(first.blobs.length);
  expect(newer.blobs.filter(item => item.type === 'origin')).toHaveLength(1);
  for (const payload of first.payloads) expect(newer.payloads).toContainEqual(payload);
  expect(newer.legacy).toEqual([]);
  const manual = newer.generations.filter(item => item.kind === 'manual').sort((a, b) => a.id - b.id);
  const newest = manual.at(-1)!;
  expect(newest.turn).toBe(3);
  expect(manual.at(-2)!.turn).toBe(2);

  // Explicit corruption fixture: alter one persisted manifest, not live/canonical campaign state.
  await page.evaluate(generationId => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('theandril-campaigns');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result, transaction = db.transaction('campaignManifests', 'readwrite');
      const table = transaction.objectStore('campaignManifests'), read = table.get(generationId);
      read.onsuccess = () => table.put({ ...read.result, payload: '{"corrupted":"browser recovery fixture"}' });
      transaction.onerror = () => { db.close(); reject(transaction.error); };
      transaction.oncomplete = () => { db.close(); resolve(); };
    };
  }), newest.id);
  await page.reload();
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 2');
  expect(await page.evaluate(() => window.__THEANDRIL__?.getStateHash())).toBe(firstHash);
  await settings(page);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export campaign', exact: true }).click();
  const path = await (await downloadPromise).path();
  if (!path) throw new Error('Restored campaign export did not produce a download.');
  const buffer = await readFile(path);
  const exported = deserializeCampaign(await importSave(buffer));
  expect(stateHash(exported.game)).toBe(firstHash);
  expect(exported.archive.coverage).toBe('complete');
  expect(exported.archive.records.some(record => (record.command as { type: string }).type === 'found')).toBe(true);
  expect(exported.archive.records.filter(record => record.ok && (record.command as { type: string }).type === 'endTurn')).toHaveLength(1);
  expect(stateHash(replayArchive(exported.archive))).toBe(firstHash);
  await endTurn(page, 3);
  await page.locator('input[type=file]').setInputFiles({ name: 'recovered-journal.theandril', mimeType: 'application/gzip', buffer });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign.');
  expect(await page.evaluate(() => window.__THEANDRIL__?.getStateHash())).toBe(firstHash);
  await testInfo.attach('incremental-storage.json', { body: JSON.stringify({ first: { generations: first.generations.length, blobs: first.blobs.length, payloads: first.payloads.length }, afterNewTurn: { generations: newer.generations.length, blobs: newer.blobs.length, payloads: newer.payloads.length }, restoredHash: firstHash, exportedOrders: exported.archive.records.length, compressedExportBytes: buffer.byteLength }, null, 2), contentType: 'application/json' });
  expect(errors).toEqual([]);
});
