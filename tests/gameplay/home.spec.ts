import { expect, test } from '@playwright/test';

test('home provides the public routes and generated ledger', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('updates/');
  await expect(page.getByRole('heading', { name: 'Theandril', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'The change ledger' })).toBeVisible();
  await expect(page.locator('.commit-entry')).toHaveCount(8);
  await expect(page.getByRole('button', { name: /Show .* older commits/ })).toBeVisible();
  await page.getByRole('button', { name: /Show .* older commits/ }).click();
  expect(await page.locator('.commit-entry').count()).toBeGreaterThan(8);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '130%'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});

test('dispatches remain refresh-safe at their new path', async ({ page }) => {
  await page.goto('updates/dispatches/');
  await expect(page.locator('.dispatch-row')).toHaveCount(6);
  await page.locator('.dispatch-row a').first().click();
  await expect(page).toHaveURL(/updates\/dispatches\/\?dispatch=/);
});

test('a permalink to a commit beyond the first page reveals it and scrolls to it', async ({ page }) => {
  await page.goto('updates/?commit=588d79a');
  const entry = page.locator('#commit-588d79a');
  await expect(entry).toBeVisible();
  await expect(entry).toBeInViewport();
  expect(await page.locator('.commit-entry').count()).toBeGreaterThan(8);
});
