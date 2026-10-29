# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: patrol-recovery.spec.ts >> production AI watch reviews a genuinely stalled patrol and preserves the resumed history through save recovery
- Location: tests/production/patrol-recovery.spec.ts:8:1

# Error details

```
Error: locator.click: Target crashed 
Call log:
  - waiting for getByRole('button', { name: 'Load campaign', exact: true })
    - locator resolved to <button>Load campaign</button>
  - attempting click action
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed

```

# Test source

```ts
  1  | import { readFileSync } from 'node:fs';
  2  | import { expect, test } from '@playwright/test';
  3  | import { deserializeGame, stateHash, stateHashForVersion } from '@theandril/sim';
  4  | import { createArchive } from '@theandril/chronicle';
  5  | import { exportSave, serializeCampaign } from '@theandril/persistence';
  6  | import { campaignMenu, exportedTravel } from '../gameplay/group-movement-fixture';
  7  | 
  8  | test('production AI watch reviews a genuinely stalled patrol and preserves the resumed history through save recovery', async ({ page }, testInfo) => {
  9  |   const game = deserializeGame(readFileSync(new URL('../../docs/development/2026-10-24-patrol-recovery/diagnosis-long/snapshot-1-turn-58.json', import.meta.url), 'utf8'));
  10 |   expect(stateHashForVersion(game, 35)).toBe('17c538ce');
  11 |   // The generated snapshot is captured mid-round; watch explicitly starts a new
  12 |   // full planning round from it. This is not a claim of the original full history.
  13 |   const bytes = await exportSave(serializeCampaign(game, createArchive(game, { mode: 'watch', coverage: 'from-save' })));
  14 |   const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  15 |   await page.goto('./');
  16 |   expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
  17 |   await page.getByLabel('Import save file').setInputFiles({ name: 'stalled-watch.theandril', mimeType: 'application/gzip', buffer: Buffer.from(bytes) });
  18 |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  19 |   await expect(page.getByTestId('watch-controls')).toContainText('AI watch paused');
  20 |   await expect(page.getByTestId('turn-counter')).toHaveText('Turn 58');
  21 |   await page.getByRole('button', { name: 'Step one round', exact: true }).click();
  22 |   await expect(page.getByTestId('turn-counter')).toHaveText('Turn 59');
  23 |   await expect(page.getByRole('button', { name: 'Step one round', exact: true })).toBeEnabled();
  24 |   const resumed = await exportedTravel(page);
  25 |   const recovery = resumed.archive.records.find(record => {
  26 |     const command = record.command;
  27 |     return command && typeof command === 'object' && 'type' in command && command.type === 'resumeMovement'
  28 |       && 'armyId' in command && command.armyId === 'army.198';
  29 |   });
  30 |   expect(recovery).toBeTruthy();
  31 |   expect(resumed.game.patrols.find(patrol => patrol.armyId === 'army.198')).toMatchObject({ enabled: true, pauseOnWar: false, firstCell: 10368, secondCell: 10149 });
  32 |   expect(resumed.game.armies['army.198']?.cell).not.toBe(10146);
  33 |   await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  34 |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  35 |   await page.reload();
> 36 |   await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
     |                                                                          ^ Error: locator.click: Target crashed 
  37 |   await expect(page.getByTestId('watch-controls')).toContainText('AI watch paused');
  38 |   const restored = await exportedTravel(page);
  39 |   expect(restored.archive).toEqual(resumed.archive);
  40 |   expect(stateHash(restored.game)).toBe(stateHash(resumed.game));
  41 |   await campaignMenu(page);
  42 |   await page.getByTestId('campaign-menu').locator(':scope > summary').click();
  43 |   await page.screenshot({ path: testInfo.outputPath('production-watch-patrol-recovered.png') });
  44 |   expect(errors).toEqual([]);
  45 | });
  46 | 
```