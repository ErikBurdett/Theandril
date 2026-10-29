# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: defense-theaters.spec.ts >> generated production adopts a defensive theater through ordinary controls and restores its exact saved campaign without development hooks
- Location: tests/production/defense-theaters.spec.ts:6:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByTestId('feedback')
Expected substring: "Imported campaign"
Received string:    "!The map could not start WebGL: TypeError: Failed to fetch dynamically imported module: http://127.0.0.1:4174/assets/WebGLRenderer-CvYmRMFw.js"
Timeout: 5000ms

Call log:
  - Expect "toContainText" getByTestId('feedback') with timeout 5000ms
  - waiting for getByTestId('feedback')
    3 × locator resolved to <div role="status" class="feedback " aria-live="polite" data-testid="feedback">…</div>
      - unexpected value "◆Resolving… A world of broken oaths awaits a new beginning."
    11 × locator resolved to <div role="alert" aria-live="polite" class="feedback error" data-testid="feedback">…</div>
       - unexpected value "!The map could not start WebGL: TypeError: Failed to fetch dynamically imported module: http://127.0.0.1:4174/assets/WebGLRenderer-CvYmRMFw.js"

```

```yaml
- alert: "The map could not start WebGL: TypeError: Failed to fetch dynamically imported module: http://127.0.0.1:4174/assets/WebGLRenderer-CvYmRMFw.js"
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | import { getObservation, serializeGame, stateHash } from '@theandril/sim';
  3  | import { campaignMenu, exportedTravel } from '../gameplay/group-movement-fixture';
  4  | import { closeManagement, openRegistry, openSelectedOrders, selectFromRegistry } from '../gameplay/ui-navigation';
  5  | 
  6  | test('generated production adopts a defensive theater through ordinary controls and restores its exact saved campaign without development hooks', async ({ page }, testInfo) => {
  7  |   const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  8  |   await page.goto('./');
  9  |   await page.getByRole('textbox', { name: 'World seed', exact: true }).fill('20260927');
  10 |   await page.getByRole('combobox', { name: 'World size', exact: true }).selectOption('tiny');
  11 |   await page.getByRole('spinbutton', { name: 'Faction count', exact: true }).fill('2');
  12 |   await page.getByRole('spinbutton', { name: 'City-states', exact: true }).fill('0');
  13 |   await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
  14 |   await expect(page.getByTestId('feedback')).toContainText('Your people await a hearth.');
  15 |   await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  16 |   expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
  17 |   await selectFromRegistry(page, 'armies', /Hearth caravan/); await openSelectedOrders(page);
  18 |   await page.getByRole('textbox', { name: 'Settlement name', exact: true }).fill('Watch Hearth');
  19 |   await page.getByRole('button', { name: 'Found settlement', exact: true }).click();
  20 |   await openRegistry(page, 'armies');
  21 |   await page.getByRole('searchbox', { name: 'Search your realm' }).fill('');
  22 |   await page.getByRole('button', { name: 'Select matching armies', exact: true }).click();
  23 |   const panel = page.getByTestId('defense-theaters'); await panel.locator(':scope > summary').click();
  24 |   await panel.getByRole('textbox', { name: 'Theater name', exact: true }).fill('Home defense');
  25 |   await panel.getByRole('checkbox', { name: /^Watch Hearth · hex / }).check();
  26 |   await panel.getByRole('button', { name: 'Use checked armies (1)', exact: true }).click();
  27 |   await panel.getByRole('combobox', { name: 'Extra guards when threatened', exact: true }).selectOption('1');
  28 |   await page.setViewportSize({ width: 390, height: 844 });
  29 |   await panel.getByRole('button', { name: 'Create theater', exact: true }).focus(); await page.keyboard.press('Enter');
  30 |   await expect(page.getByTestId('theater-report')).toContainText('Home defense · Enabled');
  31 |   const created = await exportedTravel(page), owner = created.game.turnOwnerId;
  32 |   expect(created.game.theaters[0]).toMatchObject({ name: 'Home defense', enabled: true, reinforcementLimit: 1, lastRunTurn: null, lastDispatches: [] });
  33 |   expect(created.game.theaters[0]!.armyIds).toHaveLength(1);
  34 |   await page.getByTestId('campaign-menu').locator(':scope > summary').click();
  35 |   await page.getByRole('button', { name: 'End turn', exact: true }).click();
  36 |   await expect(page.getByTestId('turn-counter')).toHaveText('Turn 2'); await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  37 |   const allocated = await exportedTravel(page), report = getObservation(allocated.game, owner).theaters![0]!;
  38 |   expect(report.lastRunTurn).toBe(2); expect(report.missingGuards).toBe(0);
  39 |   expect(report.hearths[0]!.stationed + report.hearths[0]!.incoming).toBe(1);
  40 |   await page.getByRole('button', { name: 'Save campaign', exact: true }).click(); await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  41 |   await openRegistry(page, 'armies'); await panel.locator(':scope > summary').click();
  42 |   await panel.getByRole('combobox', { name: 'Defensive theater', exact: true }).selectOption(report.id);
  43 |   await panel.getByRole('button', { name: 'Pause theater', exact: true }).click();
  44 |   await expect(page.getByTestId('theater-report')).toContainText('Home defense · Paused');
  45 |   await page.reload(); await page.getByRole('button', { name: 'Load campaign', exact: true }).click(); await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  46 |   const restored = await exportedTravel(page); expect(stateHash(restored.game)).toBe(stateHash(allocated.game)); expect(restored.archive).toEqual(allocated.archive);
  47 |   await page.reload(); await page.getByLabel('Import save file').setInputFiles({ name: 'generated-defense.theandril', mimeType: 'application/gzip', buffer: allocated.bytes });
> 48 |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
     |                                              ^ Error: expect(locator).toContainText(expected) failed
  49 |   const portable = await exportedTravel(page); expect(serializeGame(portable.game)).toBe(serializeGame(allocated.game)); expect(portable.archive).toEqual(allocated.archive);
  50 |   await openRegistry(page, 'armies'); await panel.locator(':scope > summary').focus(); await page.keyboard.press('Enter');
  51 |   await panel.getByRole('combobox', { name: 'Defensive theater', exact: true }).selectOption(report.id);
  52 |   await panel.getByRole('button', { name: 'Pause theater', exact: true }).scrollIntoViewIfNeeded();
  53 |   await expect(panel.getByRole('combobox', { name: 'Extra guards when threatened', exact: true })).toHaveValue('1');
  54 |   await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  55 |   await page.screenshot({ path: testInfo.outputPath('production-defense-theater-restored-narrow.png') });
  56 |   await closeManagement(page); await campaignMenu(page);
  57 |   expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
  58 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); expect(errors).toEqual([]);
  59 | });
  60 | 
```