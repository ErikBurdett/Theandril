import { expect, test } from '@playwright/test';

test('game exposes the developer journal without discarding campaign setup', async ({ page, baseURL }) => {
  const mount = new URL('./', baseURL);
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Establish your campaign', exact: true })).toBeVisible();
  await page.getByLabel('World seed', { exact: true }).fill('74');
  const link = page.locator('.opening').getByRole('link', { name: 'Developer updates' });
  await expect(link).toHaveAttribute('href', `${mount.pathname}updates/`);
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  const originalUrl = page.url();
  const journalUrl = new URL('updates/', mount).href;
  const [openingPopup] = await Promise.all([page.waitForEvent('popup'), link.click()]);
  await expect(openingPopup).toHaveURL(journalUrl);
  await expect(openingPopup).toHaveTitle(/Theandril.*Dispatches|Dispatches.*Theandril/i);
  await openingPopup.close();
  await expect(page).toHaveURL(originalUrl);
  await expect(page.getByLabel('World seed', { exact: true })).toHaveValue('74');

  await page.getByTestId('campaign-menu').locator('summary').click();
  const settingsLink = page.getByTestId('campaign-menu').getByRole('link', { name: 'Developer updates' });
  await expect(settingsLink).toHaveAttribute('href', `${mount.pathname}updates/`);
  const [settingsPopup] = await Promise.all([page.waitForEvent('popup'), settingsLink.click()]);
  await expect(settingsPopup).toHaveURL(journalUrl);
  await expect(settingsPopup).toHaveTitle(/Theandril.*Dispatches|Dispatches.*Theandril/i);
  await settingsPopup.close();
  await expect(page).toHaveURL(originalUrl);
  await expect(page.getByLabel('World seed', { exact: true })).toHaveValue('74');
});
