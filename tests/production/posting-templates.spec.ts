import { expect, test, type Page } from '@playwright/test';
import { closeManagement, openRegistry } from '../gameplay/ui-navigation';

async function begin(page: Page) {
  await page.getByRole('textbox', { name: 'World seed', exact: true }).fill('20260905');
  await page.getByRole('combobox', { name: 'World size', exact: true }).selectOption('tiny');
  await page.getByRole('spinbutton', { name: 'Faction count', exact: true }).fill('2');
  await page.getByRole('spinbutton', { name: 'City-states', exact: true }).fill('0');
  await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 1');
}

async function settings(page: Page) {
  await closeManagement(page);
  const menu = page.getByTestId('campaign-menu');
  if (await menu.getAttribute('open') === null) await menu.locator(':scope > summary').click();
}

async function chooseArmies(page: Page) {
  await openRegistry(page, 'armies');
  const group = page.getByTestId('group-postings');
  await group.getByRole('button', { name: 'Select matching armies', exact: true }).click();
  return group;
}

async function templates(page: Page) {
  const library = page.getByTestId('posting-templates');
  if (await library.getAttribute('open') === null) await library.locator(':scope > summary').click();
  return library;
}

test('production posting templates cross campaigns and reloads, with explicit orders and saved restoration', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await begin(page);
  expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
  const group = await chooseArmies(page), library = await templates(page);
  const mode = group.getByRole('combobox', { name: 'Group arrival order', exact: true });
  const saved = library.getByRole('combobox', { name: 'Saved posting template', exact: true });
  await mode.selectOption('join');
  await library.getByRole('textbox', { name: 'Template name', exact: true }).fill('Join at each position');
  await library.getByRole('button', { name: 'Save new template', exact: true }).click();
  await expect(saved.getByRole('option', { name: 'Join at each position', exact: true })).toHaveCount(1);
  const id = await saved.getByRole('option', { name: 'Join at each position', exact: true }).getAttribute('value');
  expect(id).toBeTruthy();
  await expect(group.getByRole('button', { name: 'Clear selected postings (0)', exact: true })).toBeDisabled();
  await settings(page);
  await page.getByRole('button', { name: 'New campaign', exact: true }).click();
  await begin(page);
  await settings(page);
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  await page.reload();
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  await chooseArmies(page);
  await templates(page);
  await saved.selectOption(id!);
  await expect(mode).toHaveValue('hold');
  await library.getByRole('button', { name: 'Recall template', exact: true }).click();
  await expect(mode).toHaveValue('join');
  await expect(group.getByRole('combobox', { name: 'Group destination', exact: true })).toHaveValue('current');
  await expect(group.getByRole('button', { name: 'Clear selected postings (0)', exact: true })).toBeDisabled();
  await group.getByRole('button', { name: 'Post selected armies (2)', exact: true }).click();
  await expect(page.getByTestId('group-posting-results')).toContainText('2 orders accepted · 0 refused');
  await settings(page);
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  await chooseArmies(page);
  await group.getByRole('button', { name: 'Clear selected postings (2)', exact: true }).click();
  await expect(page.getByTestId('group-posting-results')).toContainText('2 orders accepted · 0 refused');
  await settings(page);
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  await chooseArmies(page);
  await expect(group.getByRole('button', { name: 'Clear selected postings (2)', exact: true })).toBeEnabled();
  await page.setViewportSize({ width: 390, height: 844 });
  await templates(page);
  await library.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('production-posting-templates-restored.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await settings(page);
  await page.getByRole('combobox', { name: 'Text scale', exact: true }).selectOption('1.3');
  await chooseArmies(page);
  await templates(page);
  await library.scrollIntoViewIfNeeded();
  await library.screenshot({ path: testInfo.outputPath('production-posting-templates-text-scale.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await saved.selectOption(id!);
  await library.getByRole('button', { name: 'Recall template', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(mode).toHaveValue('join');
  const remove = library.getByRole('button', { name: 'Delete template', exact: true });
  await remove.scrollIntoViewIfNeeded();
  expect(await remove.evaluate(button => {
    const bounds = button.getBoundingClientRect();
    const viewport = button.closest('.campaign-window-body')!.getBoundingClientRect();
    return bounds.top >= viewport.top && bounds.bottom <= viewport.bottom && bounds.left >= viewport.left && bounds.right <= viewport.right;
  })).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('production-posting-templates-text-scale-actions.png') });
  await remove.click();
  await expect(saved.getByRole('option', { name: 'Join at each position', exact: true })).toHaveCount(0);
  await expect(group.getByRole('button', { name: 'Clear selected postings (2)', exact: true })).toBeEnabled();
  expect(errors).toEqual([]);
});
