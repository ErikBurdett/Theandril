# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: production/battlefield.spec.ts >> built battlefield loads its exact approved battle page and preserves real manual abilities and saved outcomes without development hooks
- Location: tests/production/battlefield.spec.ts:9:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByTestId('feedback')
Expected substring: "Imported campaign"
Received string:    "◆Resolving… A world of broken oaths awaits a new beginning."
Timeout: 5000ms

Call log:
  - Expect "toContainText" getByTestId('feedback') with timeout 5000ms
  - waiting for getByTestId('feedback')
    14 × locator resolved to <div role="status" class="feedback " aria-live="polite" data-testid="feedback">…</div>
       - unexpected value "◆Resolving… A world of broken oaths awaits a new beginning."

```

```yaml
- status: Resolving… A world of broken oaths awaits a new beginning.
```

# Test source

```ts
  1  | import { createHash } from 'node:crypto';
  2  | import { readFile } from 'node:fs/promises';
  3  | import { expect, test } from '@playwright/test';
  4  | import { serializeGame } from '@theandril/sim';
  5  | import { exportSave } from '@theandril/persistence';
  6  | import { borderBattleCampaign } from '../../packages/test-fixtures/src/combat-fixture';
  7  | import { closeCampaignOptions, closeManagement, openCampaignJournal, openRealmAffairs, openSelectedOrders } from '../gameplay/ui-navigation';
  8  | 
  9  | test('built battlefield loads its exact approved battle page and preserves real manual abilities and saved outcomes without development hooks', async ({ page, baseURL }, info) => {
  10 |   const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  11 |   const catalog = JSON.parse(await readFile(new URL('../../assets/art/runtime/catalog.json', import.meta.url), 'utf8')) as { atlases: { id: string; sha256: string }[] };
  12 |   const approved = catalog.atlases.find(atlas => atlas.id === 'battle')!;
  13 |   await page.goto('./');
  14 |   expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
  15 |   await page.getByLabel('Import save file').setInputFiles({ name: 'production-battle.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(borderBattleCampaign()))) });
> 16 |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
     |                                              ^ Error: expect(locator).toContainText(expected) failed
  17 |   await openRealmAffairs(page);
  18 |   await page.getByRole('button', { name: 'Declare war on Reedbound Council', exact: true }).click();
  19 |   await openSelectedOrders(page);
  20 |   const battleUrl = new URL('art/battle.png', baseURL).href;
  21 |   const loaded = page.waitForResponse(response => response.url() === battleUrl);
  22 |   await page.getByRole('button', { name: 'Attack Reedbound Watch (army.4)', exact: true }).click();
  23 |   const image = await loaded; expect(image.ok()).toBe(true);
  24 |   expect(createHash('sha256').update(await image.body()).digest('hex')).toBe(approved.sha256);
  25 |   const battle = page.getByTestId('battle-panel');
  26 |   await expect(battle).toBeVisible();
  27 |   await expect(page.getByRole('checkbox', { name: /^Automatic Set shields/ })).toBeChecked();
  28 |   await page.getByRole('button', { name: /^Set shields \(/ }).click();
  29 |   await page.getByRole('combobox', { name: 'Inspect formation or officer', exact: true }).selectOption('formation.2');
  30 |   await expect(battle).toContainText('6 ward');
  31 |   await expect(page.getByTestId('battle-round')).toHaveText('0');
  32 |   await page.getByRole('button', { name: 'Step one battle round', exact: true }).click();
  33 |   await expect(page.getByTestId('battle-round')).toHaveText('1');
  34 |   await page.getByTestId('map-container').screenshot({ path: info.outputPath('production-battlefield.png') });
  35 |   const menu = page.getByTestId('campaign-menu');
  36 |   if (!await menu.evaluate(element => (element as HTMLDetailsElement).open)) await menu.locator('summary').click();
  37 |   await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  38 |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  39 |   await closeCampaignOptions(page);
  40 |   await page.getByRole('button', { name: 'Auto-resolve battle', exact: true }).click();
  41 |   await openCampaignJournal(page);
  42 |   await expect(page.getByTestId('battle-report')).toBeVisible();
  43 |   // Compare all account text, including the closed formation/round disclosure;
  44 |   // innerText instead applies CSS capitalization and omits that hidden account.
  45 |   const outcome = await page.getByTestId('battle-report').textContent();
  46 |   expect(outcome).toBeTruthy();
  47 |   await closeManagement(page);
  48 |   if (!await menu.evaluate(element => (element as HTMLDetailsElement).open)) await menu.locator('summary').click();
  49 |   await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  50 |   await expect(page.getByTestId('battle-round')).toHaveText('1');
  51 |   await closeCampaignOptions(page);
  52 |   await page.getByRole('button', { name: 'Auto-resolve battle', exact: true }).click();
  53 |   await openCampaignJournal(page);
  54 |   await expect(page.getByTestId('battle-report')).toHaveText(outcome!);
  55 |   expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
  56 |   expect(errors).toEqual([]);
  57 | });
  58 | 
```