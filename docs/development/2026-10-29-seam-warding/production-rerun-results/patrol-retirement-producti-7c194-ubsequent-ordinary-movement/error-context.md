# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: patrol-retirement.spec.ts >> production AI watch retires a genuinely captured hearth patrol and saves its subsequent ordinary movement
- Location: tests/production/patrol-retirement.spec.ts:16:1

# Error details

```
Error: locator.click: Target crashed 
Call log:
  - waiting for getByRole('button', { name: 'Load campaign', exact: true })
    - locator resolved to <button>Load campaign</button>

```

# Test source

```ts
  1  | import { createHash } from 'node:crypto';
  2  | import { readFileSync, writeFileSync } from 'node:fs';
  3  | import { expect, test } from '@playwright/test';
  4  | import { deserializeGame, getObservation, stateHash, stateHashForVersion } from '@theandril/sim';
  5  | import { createArchive, type ArchiveRecord } from '@theandril/chronicle';
  6  | import { exportSave, serializeCampaign } from '@theandril/persistence';
  7  | import { campaignMenu, exportedTravel } from '../gameplay/group-movement-fixture';
  8  | 
  9  | const armyId = 'army.408', factionId = 'faction.wardhall_remnant';
  10 | const armyOrder = (record: ArchiveRecord, type: string) => {
  11 |   const command = record.command;
  12 |   return command && typeof command === 'object' && 'type' in command && command.type === type
  13 |     && 'armyId' in command && command.armyId === armyId && 'factionId' in command && command.factionId === factionId;
  14 | };
  15 | 
  16 | test('production AI watch retires a genuinely captured hearth patrol and saves its subsequent ordinary movement', async ({ page }, testInfo) => {
  17 |   const snapshot = readFileSync(new URL('../../docs/development/2026-10-24-patrol-recovery/diagnosis-recovered/snapshot-3-turn-150.json', import.meta.url), 'utf8');
  18 |   const snapshotSha256 = createHash('sha256').update(snapshot).digest('hex');
  19 |   expect(snapshotSha256).toBe('e8b68f936e8f7042f04465f879e669ef038cc27a9c927781fe368075a9e92b25');
  20 |   const game = deserializeGame(snapshot), initialHash = stateHash(game), historicalHash = stateHashForVersion(game, 35);
  21 |   expect(historicalHash).toBe('4f60f2e3');
  22 |   expect(game.patrols.find(patrol => patrol.armyId === armyId)).toMatchObject({ enabled: true, pauseOnWar: false, firstCell: 8431, secondCell: 9108, target: 'second' });
  23 |   expect(game.routes[armyId]).toMatchObject({ status: 'paused', waypoints: [9108] });
  24 |   const view = getObservation(game, factionId);
  25 |   expect(view.settlements.find(town => town.cell === 9108)).toMatchObject({ id: 'settlement.517', factionId: 'faction.ashen_compact' });
  26 |   expect(view.cells.find(cell => cell.cell === 9108)?.visible).toBe(true);
  27 |   expect(view.settlements.find(town => town.cell === 8431)?.factionId).toBe(factionId);
  28 |   const initialCell = game.armies[armyId]!.cell;
  29 |   expect(initialCell).toBe(8659);
  30 |   // This genuine campaign snapshot was captured mid-round. Import starts a new
  31 |   // full Watch planning round and records history from this save, not before it.
  32 |   const bytes = await exportSave(serializeCampaign(game, createArchive(game, { mode: 'watch', coverage: 'from-save' })));
  33 |   const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  34 |   await page.goto('./');
  35 |   expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
  36 |   await page.getByLabel('Import save file').setInputFiles({ name: 'captured-hearth-watch.theandril', mimeType: 'application/gzip', buffer: Buffer.from(bytes) });
  37 |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  38 |   await expect(page.getByTestId('watch-controls')).toContainText('AI watch paused');
  39 |   await expect(page.getByTestId('turn-counter')).toHaveText('Turn 150');
  40 |   await page.getByRole('button', { name: 'Step one round', exact: true }).click();
  41 |   await expect(page.getByTestId('turn-counter')).toHaveText('Turn 151');
  42 |   await expect(page.getByRole('button', { name: 'Step one round', exact: true })).toBeEnabled();
  43 |   let retired = await exportedTravel(page);
  44 |   const clear = retired.archive.records.find(record => armyOrder(record, 'clearPatrol'));
  45 |   expect(clear).toMatchObject({ ok: true, error: null });
  46 |   expect(retired.game.patrols.some(patrol => patrol.armyId === armyId)).toBe(false);
  47 |   const rounds = [{ turn: retired.game.turn, cell: retired.game.armies[armyId]?.cell, hash: stateHash(retired.game) }];
  48 |   const movement = () => retired.archive.records.find(record => armyOrder(record, 'moveTo') && record.ok && record.sequence > clear!.sequence);
  49 |   // The cleanup batch retains its reservation. Let subsequent real Watch rounds
  50 |   // observe the released army and issue ordinary orders; never inject a move.
  51 |   for (let round = 0; round < 2 && (!movement() || retired.game.armies[armyId]?.cell === initialCell); round++) {
  52 |     await page.getByTestId('campaign-menu').locator(':scope > summary').click();
  53 |     await page.getByRole('button', { name: 'Step one round', exact: true }).click();
  54 |     await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${152 + round}`);
  55 |     await expect(page.getByRole('button', { name: 'Step one round', exact: true })).toBeEnabled();
  56 |     retired = await exportedTravel(page);
  57 |     rounds.push({ turn: retired.game.turn, cell: retired.game.armies[armyId]?.cell, hash: stateHash(retired.game) });
  58 |   }
  59 |   expect(movement()).toBeTruthy();
  60 |   expect(retired.game.armies[armyId]).toBeDefined();
  61 |   expect(retired.game.armies[armyId]!.cell).not.toBe(initialCell);
  62 |   expect(retired.game.patrols.some(patrol => patrol.armyId === armyId)).toBe(false);
  63 |   await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  64 |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  65 |   await page.reload();
> 66 |   await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
     |                                                                          ^ Error: locator.click: Target crashed 
  67 |   await expect(page.getByTestId('watch-controls')).toContainText('AI watch paused');
  68 |   const restored = await exportedTravel(page);
  69 |   expect(restored.archive).toEqual(retired.archive);
  70 |   expect(stateHash(restored.game)).toBe(stateHash(retired.game));
  71 |   writeFileSync(testInfo.outputPath('production-watch-patrol-retired.theandril'), restored.bytes);
  72 |   writeFileSync(testInfo.outputPath('production-watch-patrol-retirement.json'), `${JSON.stringify({ snapshotSha256, historicalHash, initialHash, initialCell,
  73 |     coverage: restored.archive.coverage, rounds, clear, movement: movement(), finalHash: stateHash(restored.game), records: restored.archive.records.length }, null, 2)}\n`);
  74 |   await campaignMenu(page);
  75 |   await page.getByTestId('campaign-menu').locator(':scope > summary').click();
  76 |   // The visible realm is the Ashen observer; the exported archive proves the
  77 |   // Wardhall orders. This screenshot is not a claim to reveal foreign controls.
  78 |   await page.screenshot({ path: testInfo.outputPath('production-watch-patrol-retired.png') });
  79 |   expect(errors).toEqual([]);
  80 | });
  81 | 
```