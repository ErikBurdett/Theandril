import { expect, test, type Page } from '@playwright/test';
import { closeManagement, openRegistry, openSelectedOrders, selectFromRegistry } from '../gameplay/ui-navigation';

async function begin(page: Page) {
  await page.getByRole('textbox', { name: 'World seed', exact: true }).fill('20260905');
  await page.getByRole('combobox', { name: 'World size', exact: true }).selectOption('tiny');
  await page.getByRole('spinbutton', { name: 'Faction count', exact: true }).fill('2');
  await page.getByRole('spinbutton', { name: 'City-states', exact: true }).fill('0');
  await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Begin campaign', exact: true })).not.toBeVisible();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 1');
}

async function found(page: Page, name: string) {
  await selectFromRegistry(page, 'armies', /Hearth caravan/);
  await openSelectedOrders(page);
  await page.getByRole('textbox', { name: 'Settlement name', exact: true }).fill(name);
  await page.getByRole('button', { name: 'Found settlement', exact: true }).click();
  await openRegistry(page, 'settlements');
  await expect(page.getByTestId('settlement-registry')).toContainText(name);
}

async function settings(page: Page) {
  await closeManagement(page);
  const menu = page.getByTestId('campaign-menu');
  if (await menu.getAttribute('open') === null) await menu.locator(':scope > summary').click();
}

async function save(page: Page) {
  await settings(page);
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
}

async function templates(page: Page) {
  const details = page.getByTestId('charter-templates');
  if (await details.getAttribute('open') === null) await details.locator(':scope > summary').click();
  return details;
}

test('production charter templates cross campaigns and browser reloads before explicit application and saved restoration', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await begin(page);
  expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
  await found(page, 'First Template Hearth');
  const group = page.getByTestId('group-charters');
  await group.getByRole('button', { name: 'Select matching hearths', exact: true }).click();
  const focus = group.getByRole('combobox', { name: 'Charter focus', exact: true });
  const ceiling = group.getByRole('spinbutton', { name: 'Coin ceiling per hearth', exact: true });
  await focus.selectOption('wealth');
  await ceiling.fill('24');
  const library = await templates(page);
  const saved = library.getByRole('combobox', { name: 'Saved charter template', exact: true });
  await library.getByRole('textbox', { name: 'Template name', exact: true }).fill('Market works');
  await library.getByRole('button', { name: 'Save new template', exact: true }).click();
  await expect(saved.getByRole('option', { name: /Market works/ })).toHaveCount(1);
  const templateId = await saved.getByRole('option', { name: /Market works/ }).getAttribute('value');
  expect(templateId).toBeTruthy();
  await selectFromRegistry(page, 'settlements', 'First Template Hearth');
  await openSelectedOrders(page);
  await expect(page.getByTestId('settlement-charter').locator(':scope > summary')).toContainText('none');

  // The library belongs to this browser, so a genuinely new campaign can use it
  // without importing a campaign archive or issuing any template command.
  await settings(page);
  await page.getByRole('button', { name: 'New campaign', exact: true }).click();
  await begin(page);
  await found(page, 'Second Template Hearth');
  await save(page);
  await page.reload();
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  await openRegistry(page, 'settlements');
  await expect(page.getByTestId('settlement-registry')).toContainText('Second Template Hearth');
  await group.getByRole('button', { name: 'Select matching hearths', exact: true }).click();
  await templates(page);
  await expect(saved.getByRole('option', { name: /Market works/ })).toHaveCount(1);
  await saved.selectOption(templateId!);
  await expect(focus).toHaveValue('works');
  await library.getByRole('button', { name: 'Recall template', exact: true }).click();
  await expect(focus).toHaveValue('wealth');
  await expect(ceiling).toHaveValue('24');
  await group.getByRole('button', { name: 'Apply charters (1)', exact: true }).click();
  await expect(page.getByTestId('group-charter-results')).toContainText('1 orders accepted · 0 refused');
  await selectFromRegistry(page, 'settlements', 'Second Template Hearth');
  await openSelectedOrders(page);
  await expect(page.getByTestId('settlement-charter').locator(':scope > summary')).toContainText('Wealth · 24 coin');
  await save(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await openRegistry(page, 'settlements');
  await group.getByRole('button', { name: 'Select matching hearths', exact: true }).click();
  await group.getByRole('button', { name: 'Revoke charters (1)', exact: true }).click();
  await expect(page.getByTestId('group-charter-results')).toContainText('1 orders accepted · 0 refused');
  await selectFromRegistry(page, 'settlements', 'Second Template Hearth');
  await openSelectedOrders(page);
  await expect(page.getByTestId('settlement-charter').locator(':scope > summary')).toContainText('none');
  await settings(page);
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  await selectFromRegistry(page, 'settlements', 'Second Template Hearth');
  await openSelectedOrders(page);
  await expect(page.getByTestId('settlement-charter').locator(':scope > summary')).toContainText('Wealth · 24 coin');
  await page.screenshot({ path: testInfo.outputPath('production-template-charter-restored-narrow.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
