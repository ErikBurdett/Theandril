import { expect, test } from '@playwright/test';
import { closeManagement, openRegistry, openSelectedOrders, selectFromRegistry } from '../gameplay/ui-navigation';

test('production group charters reach the real worker and survive a narrow revoke and manual save restoration', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await page.getByLabel('World seed', { exact: true }).fill('20260905');
  await page.getByRole('combobox', { name: 'World size', exact: true }).selectOption('tiny');
  await page.getByLabel('Faction count', { exact: true }).fill('2');
  await page.getByRole('spinbutton', { name: 'City-states', exact: true }).fill('0');
  await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 1');
  expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');

  // Found the first hearth through ordinary controls in the generated campaign.
  await selectFromRegistry(page, 'armies', /Hearth caravan/);
  await openSelectedOrders(page);
  await page.getByLabel('Settlement name', { exact: true }).fill('Charter Crossing');
  await page.getByRole('button', { name: 'Found settlement', exact: true }).click();
  await openRegistry(page, 'settlements');
  await expect(page.getByTestId('settlement-registry')).toContainText('Charter Crossing');
  const group = page.getByTestId('group-charters');
  await group.getByRole('button', { name: 'Select matching hearths', exact: true }).click();
  await group.getByRole('combobox', { name: 'Charter focus', exact: true }).selectOption('wealth');
  await group.getByLabel('Coin ceiling per hearth', { exact: true }).fill('24');
  await group.getByRole('button', { name: 'Apply charters (1)', exact: true }).click();
  await expect(page.getByTestId('group-charter-results')).toContainText('1 orders accepted · 0 refused');
  await selectFromRegistry(page, 'settlements', 'Charter Crossing');
  await openSelectedOrders(page);
  await expect(page.getByTestId('settlement-charter').locator(':scope > summary')).toContainText('Wealth · 24 coin');
  await page.screenshot({ path: testInfo.outputPath('production-group-charter-granted.png') });
  await closeManagement(page);
  await page.getByTestId('campaign-menu').locator(':scope > summary').click();
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');

  await page.setViewportSize({ width: 390, height: 844 });
  await openRegistry(page, 'settlements');
  await group.getByRole('button', { name: 'Select matching hearths', exact: true }).click();
  await group.getByRole('button', { name: 'Revoke charters (1)', exact: true }).click();
  await expect(page.getByTestId('group-charter-results')).toContainText('1 orders accepted · 0 refused');
  await selectFromRegistry(page, 'settlements', 'Charter Crossing');
  await openSelectedOrders(page);
  await expect(page.getByTestId('settlement-charter').locator(':scope > summary')).toContainText('none');
  await closeManagement(page);
  await page.getByTestId('campaign-menu').locator(':scope > summary').click();
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  await openRegistry(page, 'settlements');
  await expect(group).toContainText('0 hearths selected');
  await selectFromRegistry(page, 'settlements', 'Charter Crossing');
  await openSelectedOrders(page);
  await expect(page.getByTestId('settlement-charter').locator(':scope > summary')).toContainText('Wealth · 24 coin');
  await page.screenshot({ path: testInfo.outputPath('production-group-charter-restored-narrow.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
