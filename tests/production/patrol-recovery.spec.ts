import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { deserializeGame, stateHash } from '@theandril/sim';
import { createArchive } from '@theandril/chronicle';
import { exportSave, serializeCampaign } from '@theandril/persistence';
import { campaignMenu, exportedTravel } from '../gameplay/group-movement-fixture';

test('production AI watch reviews a genuinely stalled patrol and preserves the resumed history through save recovery', async ({ page }, testInfo) => {
  const game = deserializeGame(readFileSync(new URL('../../docs/development/2026-10-24-patrol-recovery/diagnosis-long/snapshot-1-turn-58.json', import.meta.url), 'utf8'));
  expect(stateHash(game)).toBe('17c538ce');
  // The generated snapshot is captured mid-round; watch explicitly starts a new
  // full planning round from it. This is not a claim of the original full history.
  const bytes = await exportSave(serializeCampaign(game, createArchive(game, { mode: 'watch', coverage: 'from-save' })));
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
  await page.getByLabel('Import save file').setInputFiles({ name: 'stalled-watch.theandril', mimeType: 'application/gzip', buffer: Buffer.from(bytes) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await expect(page.getByTestId('watch-controls')).toContainText('AI watch paused');
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 58');
  await page.getByRole('button', { name: 'Step one round', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 59');
  await expect(page.getByRole('button', { name: 'Step one round', exact: true })).toBeEnabled();
  const resumed = await exportedTravel(page);
  const recovery = resumed.archive.records.find(record => {
    const command = record.command;
    return command && typeof command === 'object' && 'type' in command && command.type === 'resumeMovement'
      && 'armyId' in command && command.armyId === 'army.198';
  });
  expect(recovery).toBeTruthy();
  expect(resumed.game.patrols.find(patrol => patrol.armyId === 'army.198')).toMatchObject({ enabled: true, pauseOnWar: false, firstCell: 10368, secondCell: 10149 });
  expect(resumed.game.armies['army.198']?.cell).not.toBe(10146);
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  await page.reload();
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('watch-controls')).toContainText('AI watch paused');
  const restored = await exportedTravel(page);
  expect(restored.archive).toEqual(resumed.archive);
  expect(stateHash(restored.game)).toBe(stateHash(resumed.game));
  await campaignMenu(page);
  await page.getByTestId('campaign-menu').locator(':scope > summary').click();
  await page.screenshot({ path: testInfo.outputPath('production-watch-patrol-recovered.png') });
  expect(errors).toEqual([]);
});
