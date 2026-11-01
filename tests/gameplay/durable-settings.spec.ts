import { expect, test, type Page } from '@playwright/test';

const menu = (page: Page) => page.getByTestId('campaign-menu');
async function openMenu(page: Page) { if (await menu(page).getAttribute('open') === null) await menu(page).locator('summary').click(); }

/** The text scale and the Reduce motion choice survive a reload through the
 * browser's own storage; a storage that cannot be read reports itself in
 * Campaign & settings and the defaults stand. */
test('text scale and reduced motion persist across a reload and an unreadable store reports itself', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await openMenu(page);
  const scale = menu(page).getByRole('combobox', { name: 'Text scale', exact: true });
  const motion = menu(page).getByRole('checkbox', { name: 'Reduce motion', exact: true });
  await expect(scale).toHaveValue('1');
  await expect(motion).not.toBeChecked();
  await scale.selectOption('1.3');
  await motion.check();
  await expect(page.locator('.application')).toHaveAttribute('data-reduce-motion', 'true');
  expect(await page.evaluate(() => localStorage.getItem('theandril.settings.v1'))).toBe('{"textScale":"1.3","reduceMotion":true}');
  await page.reload();
  await page.waitForLoadState('networkidle');
  await openMenu(page);
  await expect(menu(page).getByRole('combobox', { name: 'Text scale', exact: true })).toHaveValue('1.3');
  await expect(menu(page).getByRole('checkbox', { name: 'Reduce motion', exact: true })).toBeChecked();
  await expect(page.locator('.application')).toHaveAttribute('data-reduce-motion', 'true');
  await expect(page.locator('.application')).toHaveCSS('--text-scale', '1.3');
  await page.screenshot({ path: test.info().outputPath('settings-persisted.png') });
  // An unreadable store: the defaults stand and the menu says why.
  await page.evaluate(() => localStorage.setItem('theandril.settings.v1', '{"textScale":"9"}'));
  await page.reload();
  await page.waitForLoadState('networkidle');
  await openMenu(page);
  await expect(menu(page).getByRole('combobox', { name: 'Text scale', exact: true })).toHaveValue('1');
  await expect(menu(page).getByTestId('settings-error')).toContainText('Saved settings could not be read');
  await page.evaluate(() => localStorage.removeItem('theandril.settings.v1'));
  expect(errors).toEqual([]);
});
