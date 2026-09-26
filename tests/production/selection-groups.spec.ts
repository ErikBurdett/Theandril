import { expect, test, type Page } from '@playwright/test';
import { closeManagement, openRegistry, openSelectedOrders, selectFromRegistry } from '../gameplay/ui-navigation';

async function begin(page: Page, seed: string) {
  await page.getByRole('textbox', { name: 'World seed', exact: true }).fill(seed);
  await page.getByRole('combobox', { name: 'World size', exact: true }).selectOption('tiny');
  await page.getByRole('spinbutton', { name: 'Faction count', exact: true }).fill('2');
  await page.getByRole('spinbutton', { name: 'City-states', exact: true }).fill('0');
  await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toHaveText('◆Your people await a hearth. Select the caravan and found your first settlement.');
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 1');
  expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
}

async function settings(page: Page) {
  await closeManagement(page);
  const menu = page.getByTestId('campaign-menu');
  if (await menu.getAttribute('open') === null) await menu.locator(':scope > summary').click();
}

async function groups(page: Page, kind: 'armies' | 'settlements', keyboard = false) {
  await openRegistry(page, kind);
  const details = page.getByTestId('selection-groups');
  if (await details.getAttribute('open') === null) {
    const summary = details.locator(':scope > summary');
    if (keyboard) { await summary.focus(); await page.keyboard.press('Enter'); }
    else await summary.click();
  }
  return details;
}

test('production saved groups remain campaign-specific through founding, explicit orders, save, reload and portable import', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await begin(page, '20260905');
  await openRegistry(page, 'armies');
  const postings = page.getByTestId('group-postings');
  await postings.getByRole('button', { name: 'Select matching armies', exact: true }).click();
  await expect(postings).toContainText('2 armies selected');
  const armyGroups = await groups(page, 'armies');
  await armyGroups.getByRole('textbox', { name: 'Group name', exact: true }).fill('First expedition');
  await armyGroups.getByRole('button', { name: 'Save new group', exact: true }).click();
  await expect(armyGroups.getByRole('option', { name: 'First expedition', exact: true })).toHaveCount(1);
  await postings.getByRole('button', { name: 'Clear group selection', exact: true }).click();
  await armyGroups.getByRole('combobox', { name: 'Saved army group', exact: true }).selectOption({ label: 'First expedition' });
  await expect(postings).toContainText('0 armies selected');
  await armyGroups.getByRole('button', { name: 'Recall group', exact: true }).click();
  await expect(postings).toContainText('2 armies selected');
  await expect(page.getByTestId('group-posting-results')).toHaveCount(0);

  await selectFromRegistry(page, 'armies', /Hearth caravan/);
  await openSelectedOrders(page);
  await page.getByRole('textbox', { name: 'Settlement name', exact: true }).fill('Group Hearth');
  await page.getByRole('button', { name: 'Found settlement', exact: true }).click();
  await openRegistry(page, 'settlements');
  await page.getByRole('searchbox', { name: 'Search your realm' }).fill('');
  await expect(page.getByTestId('settlement-registry')).toContainText('Group Hearth');
  const charters = page.getByTestId('group-charters');
  await charters.getByRole('button', { name: 'Select matching hearths', exact: true }).click();
  const hearthGroups = await groups(page, 'settlements');
  await hearthGroups.getByRole('textbox', { name: 'Group name', exact: true }).fill('Home hearths');
  await hearthGroups.getByRole('button', { name: 'Save new group', exact: true }).click();
  await expect(hearthGroups.getByRole('option', { name: 'Home hearths', exact: true })).toHaveCount(1);
  await charters.getByRole('button', { name: 'Clear hearth selection', exact: true }).click();
  await hearthGroups.getByRole('combobox', { name: 'Saved hearth group', exact: true }).selectOption({ label: 'Home hearths' });
  await expect(charters).toContainText('0 hearths selected');
  await hearthGroups.getByRole('button', { name: 'Recall group', exact: true }).click();
  await expect(charters).toContainText('1 hearth selected');
  await expect(page.getByTestId('group-charter-results')).toHaveCount(0);
  await charters.getByRole('combobox', { name: 'Charter focus', exact: true }).selectOption('wealth');
  await charters.getByRole('spinbutton', { name: 'Coin ceiling per hearth', exact: true }).fill('24');
  await charters.getByRole('button', { name: 'Apply charters (1)', exact: true }).click();
  await expect(page.getByTestId('group-charter-results')).toContainText('1 orders accepted · 0 refused');

  await groups(page, 'armies');
  await page.getByRole('searchbox', { name: 'Search your realm' }).fill('');
  await armyGroups.getByRole('combobox', { name: 'Saved army group', exact: true }).selectOption({ label: 'First expedition' });
  await armyGroups.getByRole('button', { name: 'Recall group', exact: true }).click();
  await expect(postings).toContainText('1 armies selected');
  await postings.getByRole('button', { name: 'Post selected armies (1)', exact: true }).click();
  await expect(page.getByTestId('group-posting-results')).toContainText('1 orders accepted · 0 refused');
  await settings(page);
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export campaign', exact: true }).click();
  const downloaded = await (await downloadPromise).path();
  expect(downloaded).toBeTruthy();
  await page.reload();
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  await groups(page, 'armies');
  await expect(armyGroups.getByRole('option', { name: 'First expedition', exact: true })).toHaveCount(1);
  await groups(page, 'settlements');
  await expect(hearthGroups.getByRole('option', { name: 'Home hearths', exact: true })).toHaveCount(1);

  // A new generated campaign has its own group library. Importing the actual
  // downloaded campaign restores that campaign's groups and existing orders.
  await settings(page);
  await page.getByRole('button', { name: 'New campaign', exact: true }).click();
  await begin(page, '77');
  await groups(page, 'armies');
  await expect(armyGroups.getByRole('option', { name: 'First expedition', exact: true })).toHaveCount(0);
  await groups(page, 'settlements');
  await expect(hearthGroups.getByRole('option', { name: 'Home hearths', exact: true })).toHaveCount(0);
  await settings(page);
  await page.locator('input[type=file]').setInputFiles(downloaded!);
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await page.setViewportSize({ width: 390, height: 844 });
  await groups(page, 'settlements', true);
  await hearthGroups.getByRole('combobox', { name: 'Saved hearth group', exact: true }).selectOption({ label: 'Home hearths' });
  await hearthGroups.getByRole('button', { name: 'Recall group', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(charters).toContainText('1 hearth selected');
  await hearthGroups.getByTestId('selection-group-recall').scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('production-selection-group-restored-narrow.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await hearthGroups.getByRole('button', { name: 'Delete group', exact: true }).click();
  await expect(hearthGroups.getByRole('option', { name: 'Home hearths', exact: true })).toHaveCount(0);
  await selectFromRegistry(page, 'settlements', 'Group Hearth');
  await openSelectedOrders(page);
  await expect(page.getByTestId('settlement-charter').locator(':scope > summary')).toContainText('Wealth · 24 coin');
  await settings(page);
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  await groups(page, 'settlements');
  await expect(hearthGroups.getByRole('option', { name: 'Home hearths', exact: true })).toHaveCount(1);
  expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
  expect(errors).toEqual([]);
});
