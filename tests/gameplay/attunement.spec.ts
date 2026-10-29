import { expect, test } from '@playwright/test';
import { serializeGame } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { attunementCampaign, ATTUNEMENT_FIXTURE } from '../../packages/test-fixtures/src/victory-fixture';

/** Rules 38: a realm at the brink of a sealed working seals it through the
 * real Victory controls, sustains it through the short pace's five-turn window
 * and reads the chronicle that closes the book on the third path. */
test('seal an Attunement through its qualified caster, sustain it to victory and read the chronicle', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const state = attunementCampaign();
  const responseWindow = state.pace === 'short' ? 5 : 0;
  expect(responseWindow).toBe(5);
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'sealed-working.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');

  const dialog = page.getByRole('dialog', { name: 'Realm progression' });
  await page.getByRole('button', { name: 'Realm progression', exact: true }).click();
  await dialog.getByRole('tab', { name: 'Victory', exact: true }).click();
  const status = dialog.getByTestId('attunement-status');
  await expect(status).toContainText('A third path to victory');
  await expect(status).toContainText('Arcane Theory: 3 of 3 discoveries researched.');
  await expect(status).toContainText('Flame seam: held inside your borders.');
  await expect(status).toContainText('Rune seam: held inside your borders.');
  await expect(status).toContainText('ready to seal the working');
  await expect(status.getByLabel('Working host')).toHaveValue(ATTUNEMENT_FIXTURE.hostId);
  await expect(status.getByLabel('Sealing caster')).toContainText('degree');
  await status.screenshot({ path: testInfo.outputPath('attunement-ready.png') });
  const knowledge = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.knowledge);
  await status.getByRole('button', { name: 'Seal the Attunement', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.projects.length)).toBe(1);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.knowledge)).toBe(knowledge - 60);
  await expect(dialog.getByTestId(`attunement-${state.turnOwnerId}`)).toContainText('active · 0/5 active turns');
  await expect(status).toContainText('This faction already has an ongoing Attunement.');
  await page.screenshot({ path: testInfo.outputPath('attunement-started.png'), fullPage: true });
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);

  for (let turn = 1; turn <= responseWindow; turn++) {
    await page.getByRole('button', { name: 'End turn', exact: true }).click();
    await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${turn + 1}`);
  }
  await expect(page.getByTestId('victory-result')).toContainText('achieved Attunement');
  await expect(page.getByTestId('victory-result')).toContainText('sealed working');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.victory?.path)).toBe('attunement');
  await page.screenshot({ path: testInfo.outputPath('attunement-victory.png'), fullPage: true });
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeDisabled();

  // The chronicle names the third path in its epilogue.
  const chronicles = page.getByRole('dialog', { name: 'Campaign chronicles', exact: true });
  await expect(chronicles).toBeVisible();
  const chapters = chronicles.getByLabel('History chapter', { exact: true });
  await chapters.selectOption(String((await chapters.locator('option').count()) - 1));
  await expect(page.getByTestId('history-chapter')).toContainText('Epilogue — The seal of the witnesses');
  await expect(page.getByTestId('history-chapter')).toContainText('achieved Attunement, sealing the working');
  await page.screenshot({ path: testInfo.outputPath('attunement-chronicle.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('the Victory tab explains an unqualified caster and keeps the working closed at 390px with larger text', async ({ page }, testInfo) => {
  const state = attunementCampaign();
  const caster = Object.values(state.characters).find(character => character.definitionId === 'character.waykeeper')!;
  caster.aptitudes = { 'path.flame': 1, 'path.rune': 1 };
  caster.learnedSkillIds = [];
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'unready-working.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await page.evaluate(() => { document.documentElement.style.fontSize = '130%'; });
  const dialog = page.getByRole('dialog', { name: 'Realm progression' });
  await page.getByRole('button', { name: 'Realm progression', exact: true }).click();
  await dialog.getByRole('tab', { name: 'Victory', exact: true }).focus();
  await page.keyboard.press('Enter');
  const status = dialog.getByTestId('attunement-status');
  await expect(status).toContainText('This Waykeeper has not reached the second degree of any path.');
  await expect(status).toContainText('Before the working can be sealed');
  await expect(status.getByRole('button', { name: 'Seal the Attunement', exact: true })).toBeDisabled();
  const box = await status.boundingBox();
  expect(box!.width).toBeLessThanOrEqual(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await status.screenshot({ path: testInfo.outputPath('attunement-narrow-130.png') });
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.projects.length)).toBe(0);
});
