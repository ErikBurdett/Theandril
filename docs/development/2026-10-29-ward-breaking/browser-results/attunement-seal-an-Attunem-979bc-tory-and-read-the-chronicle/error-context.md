# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: attunement.spec.ts >> seal an Attunement through its qualified caster, sustain it to victory and read the chronicle
- Location: tests/gameplay/attunement.spec.ts:9:1

# Error details

```
Error: page.evaluate: Target crashed 
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | import { serializeGame } from '@theandril/sim';
  3  | import { exportSave } from '@theandril/persistence';
  4  | import { attunementCampaign, ATTUNEMENT_FIXTURE } from '../../packages/test-fixtures/src/victory-fixture';
  5  | 
  6  | /** Rules 38: a realm at the brink of a sealed working seals it through the
  7  |  * real Victory controls, sustains it through the short pace's five-turn window
  8  |  * and reads the chronicle that closes the book on the third path. */
  9  | test('seal an Attunement through its qualified caster, sustain it to victory and read the chronicle', async ({ page }, testInfo) => {
  10 |   const errors: string[] = [];
  11 |   page.on('pageerror', error => errors.push(error.message));
  12 |   const state = attunementCampaign();
  13 |   const responseWindow = state.pace === 'short' ? 5 : 0;
  14 |   expect(responseWindow).toBe(5);
  15 |   await page.goto('/');
  16 |   await page.locator('input[type=file]').setInputFiles({ name: 'sealed-working.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  17 |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  18 | 
  19 |   const dialog = page.getByRole('dialog', { name: 'Realm progression' });
  20 |   await page.getByRole('button', { name: 'Realm progression', exact: true }).click();
  21 |   await dialog.getByRole('tab', { name: 'Victory', exact: true }).click();
  22 |   const status = dialog.getByTestId('attunement-status');
  23 |   await expect(status).toContainText('A third path to victory');
  24 |   await expect(status).toContainText('Arcane Theory: 3 of 3 discoveries researched.');
  25 |   await expect(status).toContainText('Flame seam: held inside your borders.');
  26 |   await expect(status).toContainText('Rune seam: held inside your borders.');
  27 |   await expect(status).toContainText('ready to seal the working');
  28 |   await expect(status.getByLabel('Working host')).toHaveValue(ATTUNEMENT_FIXTURE.hostId);
  29 |   await expect(status.getByLabel('Sealing caster')).toContainText('degree');
  30 |   await status.screenshot({ path: testInfo.outputPath('attunement-ready.png') });
  31 |   const knowledge = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.knowledge);
  32 |   await status.getByRole('button', { name: 'Seal the Attunement', exact: true }).click();
> 33 |   await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.projects.length)).toBe(1);
     |                                ^ Error: page.evaluate: Target crashed 
  34 |   expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.knowledge)).toBe(knowledge - 60);
  35 |   await expect(dialog.getByTestId(`attunement-${state.turnOwnerId}`)).toContainText('active · 0/5 active turns');
  36 |   await expect(status).toContainText('This faction already has an ongoing Attunement.');
  37 |   await page.screenshot({ path: testInfo.outputPath('attunement-started.png'), fullPage: true });
  38 |   await page.keyboard.press('Escape');
  39 |   await expect(dialog).toHaveCount(0);
  40 | 
  41 |   for (let turn = 1; turn <= responseWindow; turn++) {
  42 |     await page.getByRole('button', { name: 'End turn', exact: true }).click();
  43 |     await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${turn + 1}`);
  44 |   }
  45 |   await expect(page.getByTestId('victory-result')).toContainText('achieved Attunement');
  46 |   await expect(page.getByTestId('victory-result')).toContainText('sealed working');
  47 |   expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.victory?.path)).toBe('attunement');
  48 |   await page.screenshot({ path: testInfo.outputPath('attunement-victory.png'), fullPage: true });
  49 |   await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeDisabled();
  50 | 
  51 |   // The chronicle names the third path in its epilogue.
  52 |   const chronicles = page.getByRole('dialog', { name: 'Campaign chronicles', exact: true });
  53 |   await expect(chronicles).toBeVisible();
  54 |   const chapters = chronicles.getByLabel('History chapter', { exact: true });
  55 |   await chapters.selectOption(String((await chapters.locator('option').count()) - 1));
  56 |   await expect(page.getByTestId('history-chapter')).toContainText('Epilogue — The seal of the witnesses');
  57 |   await expect(page.getByTestId('history-chapter')).toContainText('achieved Attunement, sealing the working');
  58 |   await page.screenshot({ path: testInfo.outputPath('attunement-chronicle.png'), fullPage: true });
  59 |   expect(errors).toEqual([]);
  60 | });
  61 | 
  62 | test('the Victory tab explains an unqualified caster and keeps the working closed at 390px with larger text', async ({ page }, testInfo) => {
  63 |   const state = attunementCampaign();
  64 |   const caster = Object.values(state.characters).find(character => character.definitionId === 'character.waykeeper')!;
  65 |   caster.aptitudes = { 'path.flame': 1, 'path.rune': 1 };
  66 |   caster.learnedSkillIds = [];
  67 |   await page.setViewportSize({ width: 390, height: 844 });
  68 |   await page.goto('/');
  69 |   await page.locator('input[type=file]').setInputFiles({ name: 'unready-working.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  70 |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  71 |   await page.evaluate(() => { document.documentElement.style.fontSize = '130%'; });
  72 |   const dialog = page.getByRole('dialog', { name: 'Realm progression' });
  73 |   await page.getByRole('button', { name: 'Realm progression', exact: true }).click();
  74 |   await dialog.getByRole('tab', { name: 'Victory', exact: true }).focus();
  75 |   await page.keyboard.press('Enter');
  76 |   const status = dialog.getByTestId('attunement-status');
  77 |   await expect(status).toContainText('This Waykeeper has not reached the second degree of any path.');
  78 |   await expect(status).toContainText('Before the working can be sealed');
  79 |   await expect(status.getByRole('button', { name: 'Seal the Attunement', exact: true })).toBeDisabled();
  80 |   const box = await status.boundingBox();
  81 |   expect(box!.width).toBeLessThanOrEqual(390);
  82 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  83 |   await status.screenshot({ path: testInfo.outputPath('attunement-narrow-130.png') });
  84 |   expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.projects.length)).toBe(0);
  85 | });
  86 | 
```