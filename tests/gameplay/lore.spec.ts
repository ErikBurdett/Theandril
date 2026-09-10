import { expect, test } from '@playwright/test';

test('lore shelf, chapter journey, search and narrow layout work without errors', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('updates/lore/');
  await expect(page.getByRole('heading', { name: 'The lore shelf' })).toBeVisible();
  for (const title of ['The Book of Broken Roads', 'Foundations', 'Faction Bible', 'Cohort Notes']) await expect(page.getByRole('link', { name: title, exact: true }).first()).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('lore-desktop.png') });
  await page.getByRole('link', { name: 'The oath culture', exact: true }).click();
  await expect(page).toHaveURL(/book=broken-roads&chapter=ii-the-age-of-first-oaths/);
  await expect(page.getByRole('heading', { level: 1, name: 'The oath culture' })).toBeVisible();
  const wiki = page.locator('.lore-body a[href*="book=broken-roads"]').first();
  await expect(wiki).toBeVisible(); await wiki.click();
  await expect(page).toHaveURL(/chapter=/); await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.goto('updates/lore/');
  await page.getByRole('searchbox', { name: 'Search all lore' }).fill('Written Fire');
  await expect(page.getByRole('link', { name: 'The War of Written Fire — RR 2291–2298', exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '130%'; });
  await page.screenshot({ path: testInfo.outputPath('lore-mobile-390-130.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
