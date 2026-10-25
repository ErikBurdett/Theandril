import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { deserializeGame, getObservation, stateHash } from '@theandril/sim';
import { createArchive, type ArchiveRecord } from '@theandril/chronicle';
import { exportSave, serializeCampaign } from '@theandril/persistence';
import { campaignMenu, exportedTravel } from '../gameplay/group-movement-fixture';

const armyId = 'army.408', factionId = 'faction.wardhall_remnant';
const armyOrder = (record: ArchiveRecord, type: string) => {
  const command = record.command;
  return command && typeof command === 'object' && 'type' in command && command.type === type
    && 'armyId' in command && command.armyId === armyId && 'factionId' in command && command.factionId === factionId;
};

test('production AI watch retires a genuinely captured hearth patrol and saves its subsequent ordinary movement', async ({ page }, testInfo) => {
  const snapshot = readFileSync(new URL('../../docs/development/2026-10-24-patrol-recovery/diagnosis-recovered/snapshot-3-turn-150.json', import.meta.url), 'utf8');
  const snapshotSha256 = createHash('sha256').update(snapshot).digest('hex');
  expect(snapshotSha256).toBe('e8b68f936e8f7042f04465f879e669ef038cc27a9c927781fe368075a9e92b25');
  const game = deserializeGame(snapshot), initialHash = stateHash(game);
  expect(initialHash).toBe('4f60f2e3');
  expect(game.patrols.find(patrol => patrol.armyId === armyId)).toMatchObject({ enabled: true, pauseOnWar: false, firstCell: 8431, secondCell: 9108, target: 'second' });
  expect(game.routes[armyId]).toMatchObject({ status: 'paused', waypoints: [9108] });
  const view = getObservation(game, factionId);
  expect(view.settlements.find(town => town.cell === 9108)).toMatchObject({ id: 'settlement.517', factionId: 'faction.ashen_compact' });
  expect(view.cells.find(cell => cell.cell === 9108)?.visible).toBe(true);
  expect(view.settlements.find(town => town.cell === 8431)?.factionId).toBe(factionId);
  const initialCell = game.armies[armyId]!.cell;
  expect(initialCell).toBe(8659);
  // This genuine campaign snapshot was captured mid-round. Import starts a new
  // full Watch planning round and records history from this save, not before it.
  const bytes = await exportSave(serializeCampaign(game, createArchive(game, { mode: 'watch', coverage: 'from-save' })));
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
  await page.getByLabel('Import save file').setInputFiles({ name: 'captured-hearth-watch.theandril', mimeType: 'application/gzip', buffer: Buffer.from(bytes) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await expect(page.getByTestId('watch-controls')).toContainText('AI watch paused');
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 150');
  await page.getByRole('button', { name: 'Step one round', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 151');
  await expect(page.getByRole('button', { name: 'Step one round', exact: true })).toBeEnabled();
  let retired = await exportedTravel(page);
  const clear = retired.archive.records.find(record => armyOrder(record, 'clearPatrol'));
  expect(clear).toMatchObject({ ok: true, error: null });
  expect(retired.game.patrols.some(patrol => patrol.armyId === armyId)).toBe(false);
  const rounds = [{ turn: retired.game.turn, cell: retired.game.armies[armyId]?.cell, hash: stateHash(retired.game) }];
  const movement = () => retired.archive.records.find(record => armyOrder(record, 'moveTo') && record.ok && record.sequence > clear!.sequence);
  // The cleanup batch retains its reservation. Let subsequent real Watch rounds
  // observe the released army and issue ordinary orders; never inject a move.
  for (let round = 0; round < 2 && (!movement() || retired.game.armies[armyId]?.cell === initialCell); round++) {
    await page.getByTestId('campaign-menu').locator(':scope > summary').click();
    await page.getByRole('button', { name: 'Step one round', exact: true }).click();
    await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${152 + round}`);
    await expect(page.getByRole('button', { name: 'Step one round', exact: true })).toBeEnabled();
    retired = await exportedTravel(page);
    rounds.push({ turn: retired.game.turn, cell: retired.game.armies[armyId]?.cell, hash: stateHash(retired.game) });
  }
  expect(movement()).toBeTruthy();
  expect(retired.game.armies[armyId]).toBeDefined();
  expect(retired.game.armies[armyId]!.cell).not.toBe(initialCell);
  expect(retired.game.patrols.some(patrol => patrol.armyId === armyId)).toBe(false);
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  await page.reload();
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('watch-controls')).toContainText('AI watch paused');
  const restored = await exportedTravel(page);
  expect(restored.archive).toEqual(retired.archive);
  expect(stateHash(restored.game)).toBe(stateHash(retired.game));
  writeFileSync(testInfo.outputPath('production-watch-patrol-retired.theandril'), restored.bytes);
  writeFileSync(testInfo.outputPath('production-watch-patrol-retirement.json'), `${JSON.stringify({ snapshotSha256, initialHash, initialCell,
    coverage: restored.archive.coverage, rounds, clear, movement: movement(), finalHash: stateHash(restored.game), records: restored.archive.records.length }, null, 2)}\n`);
  await campaignMenu(page);
  await page.getByTestId('campaign-menu').locator(':scope > summary').click();
  // The visible realm is the Ashen observer; the exported archive proves the
  // Wardhall orders. This screenshot is not a claim to reveal foreign controls.
  await page.screenshot({ path: testInfo.outputPath('production-watch-patrol-retired.png') });
  expect(errors).toEqual([]);
});
