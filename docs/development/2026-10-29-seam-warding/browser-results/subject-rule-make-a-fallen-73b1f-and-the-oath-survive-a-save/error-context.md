# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: subject-rule.spec.ts >> make a fallen capital a subject realm: peace, tribute and the oath survive a save
- Location: tests/gameplay/subject-rule.spec.ts:20:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByTestId('feedback')
Expected substring: "Imported campaign"
Received string:    "!The campaign worker stopped: Unexpected worker error. Restore a saved campaign to recover."
Timeout: 5000ms

Call log:
  - Expect "toContainText" getByTestId('feedback') with timeout 5000ms
  - waiting for getByTestId('feedback')
    - locator resolved to <div role="status" class="feedback " aria-live="polite" data-testid="feedback">…</div>
    - unexpected value "◆Resolving… A world of broken oaths awaits a new beginning."
    13 × locator resolved to <div role="alert" aria-live="polite" class="feedback error" data-testid="feedback">…</div>
       - unexpected value "!The campaign worker stopped: Unexpected worker error. Restore a saved campaign to recover."

```

```yaml
- alert: "The campaign worker stopped: Unexpected worker error. Restore a saved campaign to recover."
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | import { applyCommand, serializeGame, type GameCommand, type GameState } from '@theandril/sim';
  3  | import { exportSave } from '@theandril/persistence';
  4  | import { CONQUEST_FIXTURE, subjectCampaign } from '../../packages/test-fixtures/src/conquest-fixture';
  5  | import { closeManagement, openRealmAffairs } from './ui-navigation';
  6  | 
  7  | /** Rules 39: a fallen capital is handed back under an imposed oath through the real capture panel. */
  8  | function fallenCapital(): GameState {
  9  |   const state = subjectCampaign(), player = CONQUEST_FIXTURE.playerFactionId;
  10 |   const issue = (command: GameCommand) => { const result = applyCommand(state, command); if (!result.ok) throw new Error(result.error); };
  11 |   issue({ type: 'declareWar', factionId: player, targetFactionId: CONQUEST_FIXTURE.enemyFactionId });
  12 |   issue({ type: 'besiege', factionId: player, armyId: CONQUEST_FIXTURE.playerArmyId, settlementId: CONQUEST_FIXTURE.settlementId });
  13 |   for (let turn = 0; turn < 3; turn++) issue({ type: 'endTurn', factionId: player });
  14 |   issue({ type: 'assault', factionId: player, settlementId: CONQUEST_FIXTURE.settlementId });
  15 |   issue({ type: 'autoResolveBattle', factionId: player });
  16 |   if (!state.pendingCapture) throw new Error('The capital did not fall.');
  17 |   return state;
  18 | }
  19 | 
  20 | test('make a fallen capital a subject realm: peace, tribute and the oath survive a save', async ({ page }, testInfo) => {
  21 |   const errors: string[] = [];
  22 |   page.on('pageerror', error => errors.push(error.message));
  23 |   const state = fallenCapital();
  24 |   await page.goto('/');
  25 |   await page.locator('input[type=file]').setInputFiles({ name: 'fallen-reedwatch.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
> 26 |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
     |                                              ^ Error: expect(locator).toContainText(expected) failed
  27 |   const panel = page.getByTestId('capture-panel');
  28 |   await expect(panel).toContainText('Reedwatch has fallen');
  29 |   await expect(panel).toContainText('bind the realm as your subject');
  30 |   await panel.screenshot({ path: testInfo.outputPath('subject-offer.png') });
  31 |   await page.getByRole('button', { name: 'Make subject realm', exact: true }).click();
  32 |   await expect(panel).toHaveCount(0);
  33 |   await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getSummary()?.wars)).toEqual([]);
  34 |   await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getSummary()?.diplomacy.clients.length)).toBe(1);
  35 |   expect(await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.settlements.find(town => town.id === 'settlement.6')?.factionId)).toBe(CONQUEST_FIXTURE.enemyFactionId);
  36 |   await openRealmAffairs(page);
  37 |   await expect(page.getByText(/answers? to you/)).toBeVisible();
  38 |   await expect(page.getByRole('button', { name: 'Declare war on Reedbound Council', exact: true })).toBeDisabled();
  39 |   await page.screenshot({ path: testInfo.outputPath('subject-oath.png'), fullPage: true });
  40 |   await closeManagement(page);
  41 |   await page.getByText('Campaign & settings', { exact: true }).click();
  42 |   await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  43 |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  44 |   const hash = await page.evaluate(() => window.__THEANDRIL__?.getStateHash());
  45 |   await page.reload();
  46 |   await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  47 |   await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getStateHash())).toBe(hash);
  48 |   expect(await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.diplomacy.clients.length)).toBe(1);
  49 |   expect(errors).toEqual([]);
  50 | });
  51 | 
```