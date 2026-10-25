import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { createJournal, replayArchive } from '@theandril/chronicle';
import { exportSave, serializeCampaign } from '@theandril/persistence';
import { serializeGame, stateHash } from '@theandril/sim';
import { theaterCampaign } from '../../packages/test-fixtures/src/theater-fixture';
import { exportedTravel } from '../gameplay/group-movement-fixture';
import { openRegistry } from '../gameplay/ui-navigation';

for (const kind of ['posting', 'charter'] as const) {
  test(`production stale group ${kind} keeps the selection and allows a reviewed retry`, async ({ page }, testInfo) => {
    mkdirSync(testInfo.outputDir, { recursive: true });
    const game = theaterCampaign(2), initial = serializeGame(game);
    const archive = createJournal(game, { mode: 'player', coverage: 'from-save' }).materialize();
    // Controlled transport fault: replace only the first outgoing intent hash.
    // The actual production worker performs validation and all game mutations.
    await page.addInitScript(({ type, initialHash }) => {
      const NativeWorker = window.Worker;
      let altered = false;
      window.Worker = class extends NativeWorker {
        override postMessage(message: unknown, options?: StructuredSerializeOptions | Transferable[]) {
          const request = message as Record<string, unknown>;
          if (!altered && request.type === type) {
            altered = true;
            (window as unknown as { __INTENT_HASH__: unknown }).__INTENT_HASH__ = request.expectedHash;
            super.postMessage({ ...request, expectedHash: initialHash === 'ffffffff' ? '00000000' : 'ffffffff' }, Array.isArray(options) ? { transfer: options } : options);
          } else super.postMessage(message, Array.isArray(options) ? { transfer: options } : options);
        }
      };
    }, { type: kind === 'posting' ? 'groupPosting' : 'groupCharter', initialHash: stateHash(game) });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('./');
    expect(await page.evaluate(() => '__THEANDRIL__' in window)).toBe(false);
    await page.getByLabel('Import save file').setInputFiles({ name: 'intent.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeCampaign(game, archive))) });
    await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
    await openRegistry(page, kind === 'posting' ? 'armies' : 'settlements');
    const panel = page.getByTestId(kind === 'posting' ? 'group-postings' : 'group-charters');
    await panel.getByRole('button', { name: kind === 'posting' ? 'Select matching armies' : 'Select matching hearths', exact: true }).click();
    if (kind === 'charter') {
      await panel.getByRole('combobox', { name: 'Charter focus', exact: true }).selectOption('wealth');
      await panel.getByLabel('Coin ceiling per hearth', { exact: true }).fill('24');
    }
    const submit = panel.getByRole('button', { name: kind === 'posting' ? 'Post selected armies (2)' : 'Apply charters (2)', exact: true });
    await submit.click();
    expect(await page.evaluate(() => (window as unknown as { __INTENT_HASH__: unknown }).__INTENT_HASH__)).toBe(stateHash(game));
    await expect(panel.getByRole('alert')).toContainText(/campaign changed/i);
    await expect(panel).toContainText(kind === 'posting' ? '2 armies selected' : '2 hearths selected');
    await expect(submit).toBeEnabled();
    await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
    if (kind === 'charter') await expect(panel.getByRole('combobox', { name: 'Charter focus', exact: true })).toHaveValue('wealth');
    await page.screenshot({ path: testInfo.outputPath(`${kind}-stale.png`) });
    const rejected = await exportedTravel(page);
    expect(serializeGame(rejected.game)).toBe(initial);
    expect(rejected.archive).toEqual(archive);
    await openRegistry(page, kind === 'posting' ? 'armies' : 'settlements');
    // Export closes the registry, so explicitly reselect after reopening.
    await panel.getByRole('button', { name: kind === 'posting' ? 'Select matching armies' : 'Select matching hearths', exact: true }).click();
    if (kind === 'charter') await panel.getByRole('combobox', { name: 'Charter focus', exact: true }).selectOption('wealth');
    await submit.click();
    await expect(page.getByTestId(kind === 'posting' ? 'group-posting-results' : 'group-charter-results')).toContainText('2 orders accepted · 0 refused');
    const retried = await exportedTravel(page);
    expect(retried.archive.records).toHaveLength(2);
    expect(serializeGame(replayArchive(retried.archive))).toBe(serializeGame(retried.game));
    expect(retried.game.armies).toEqual(game.armies);
    expect(retried.game.routes).toEqual(game.routes);
    writeFileSync(testInfo.outputPath(`${kind}-intent.json`), JSON.stringify({ initialHash: stateHash(game), rejectedHash: stateHash(rejected.game), rejectedRecords: rejected.archive.records.length, retryHash: stateHash(retried.game), retryRecords: retried.archive.records.length }, null, 2) + '\n');
    expect(errors).toEqual([]);
  });
}
