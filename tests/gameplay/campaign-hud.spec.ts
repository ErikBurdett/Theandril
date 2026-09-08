import { expect, test, type Page } from '@playwright/test';
import { serializeGame, stateHash } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { characterCampaign, CHARACTER_FIXTURE as C } from '../../packages/test-fixtures/src/character-fixture';
import { closeManagement, openRegistry, openSelectedOrders, selectFromRegistry } from './ui-navigation';

async function load(page: Page) {
  const game = characterCampaign(100);
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'hud.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(game))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().frameCount ?? 0)).toBeGreaterThan(2);
  return game;
}
async function clickSelection(page: Page) {
  const point = await page.evaluate(() => window.__THEANDRIL__!.getCellScreenPoint(window.__THEANDRIL__!.getSelection().cell!));
  expect(point?.inViewport).toBe(true);
  expect(await page.evaluate(point => document.elementFromPoint(point!.x, point!.y)?.tagName, point)).toBe('CANVAS');
  await page.mouse.click(point!.x, point!.y);
  await expect(page.getByTestId('map-actions')).toBeVisible();
}

test('the full-width map has top/bottom HUD, working floating windows and a compact unit menu', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  const game = await load(page);
  const box = (await page.getByTestId('map-container').boundingBox())!;
  expect(box.width).toBeGreaterThan(page.viewportSize()!.width * .96);
  expect(await page.locator('.campaign > aside').count()).toBe(0);
  await selectFromRegistry(page, 'armies', C.armyName);
  await expect(page.getByTestId('map-container')).toBeFocused();
  await expect(page.getByTestId('current-selection')).toContainText(C.armyName);
  await clickSelection(page);
  const popup = page.getByTestId('map-actions');
  await popup.getByRole('combobox', { name: 'Inspect at this location', exact: true }).selectOption(C.armyId);
  expect((await popup.boundingBox())!.width).toBe(320);
  expect((await popup.boundingBox())!.height).toBeLessThan(480);
  await expect(popup.getByRole('button', { name: 'Move on map', exact: true })).toBeVisible();
  await expect(popup.getByTestId('army-composition')).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('hud-compact-unit-desktop.png') });
  await popup.getByRole('button', { name: 'Plan a route', exact: true }).click();
  await expect(popup.getByRole('tab', { name: 'Route', exact: true })).toHaveAttribute('aria-selected', 'true');
  await popup.getByRole('button', { name: 'Open full orders', exact: true }).click();
  const orders = page.getByRole('dialog', { name: 'Selected orders', exact: true });
  await expect(orders).toBeVisible(); await expect(orders.getByTestId('army-composition')).toHaveCount(1);
  await expect(popup).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('hud-army-orders-desktop.png') });
  await page.keyboard.press('Escape'); await expect(orders).toHaveCount(0);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSelection().armyId)).toBe(C.armyId);
  for (const [launcher, title] of [['Realm affairs', 'Realm affairs'], ['Campaign journal', 'Campaign journal'], ['Map guide', 'Map guide']] as const) {
    await page.getByRole('button', { name: launcher, exact: true }).click();
    await expect(page.getByRole('dialog', { name: title, exact: true })).toBeVisible();
    await closeManagement(page);
  }
  // A connected tray opener must not reclaim keyboard focus from an explicit
  // Show on map action after native dialog teardown.
  await openSelectedOrders(page);
  await orders.getByRole('button', { name: 'Show on map', exact: true }).click();
  await expect(orders).toHaveCount(0);
  await expect(page.getByTestId('map-container')).toBeFocused();
  const beforePan = await page.evaluate(() => window.__THEANDRIL__!.getCellScreenPoint(window.__THEANDRIL__!.getSelection().cell!));
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getCellScreenPoint(window.__THEANDRIL__!.getSelection().cell!)?.x)).not.toBe(beforePan!.x);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(stateHash(game));
  expect(errors).toEqual([]);
});

test('town popup retains production and land actions while full orders and roster stay separate', async ({ page }, info) => {
  const game = await load(page);
  await selectFromRegistry(page, 'settlements', C.homeName);
  // The co-located army is intentionally the first click target; location picker
  // provides explicit access to its town without an ambiguous paid command.
  await clickSelection(page);
  const popup = page.getByTestId('map-actions');
  await popup.getByRole('combobox', { name: 'Inspect at this location', exact: true }).selectOption(C.homeId);
  expect((await popup.boundingBox())!.width).toBe(420);
  await expect(popup.getByRole('tab', { name: 'Build & recruit', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(popup.getByTestId('production-building')).toHaveCount(1);
  await popup.getByRole('tab', { name: 'Land & tiles', exact: true }).click();
  await expect(popup.getByTestId('land-panel')).toHaveAttribute('data-query-state', 'ready');
  await expect(page.getByTestId('land-panel')).toHaveCount(1);
  await page.screenshot({ path: info.outputPath('hud-town-land-desktop.png') });
  await page.keyboard.press('Escape');
  await openSelectedOrders(page);
  await expect(page.getByTestId('land-panel')).toHaveCount(1);
  await closeManagement(page);
  const registry = await openRegistry(page, 'settlements');
  await expect(registry.getByTestId('settlement-registry')).toContainText(C.homeName);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(stateHash(game));
});

test('390px enlarged-text HUD and modal controls stay readable and close without clearing selection', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const game = await load(page);
  const options = page.getByTestId('campaign-menu');
  await options.locator(':scope > summary').click();
  await page.getByRole('combobox', { name: 'Text scale', exact: true }).selectOption('1.3');
  await options.locator(':scope > summary').click();
  await selectFromRegistry(page, 'armies', C.armyName);
  await clickSelection(page);
  const popup = page.getByTestId('map-actions');
  await popup.getByRole('combobox', { name: 'Inspect at this location', exact: true }).selectOption(C.armyId);
  const bounds = (await popup.boundingBox())!;
  const top = (await page.locator('.campaign-topbar').boundingBox())!;
  const bottom = (await page.locator('.command-bar').boundingBox())!;
  expect(bounds.y).toBeGreaterThanOrEqual(top.y + top.height);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(bottom.y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({ path: info.outputPath('hud-compact-unit-390-130.png') });
  await popup.getByRole('button', { name: 'Open full orders', exact: true }).click();
  const orders = page.getByRole('dialog', { name: 'Selected orders', exact: true });
  const close = orders.getByRole('button', { name: 'Close Selected orders', exact: true });
  const closeBox = (await close.boundingBox())!;
  expect(closeBox.width).toBeGreaterThanOrEqual(44); expect(closeBox.height).toBeGreaterThanOrEqual(44);
  await page.screenshot({ path: info.outputPath('hud-orders-390-130.png') });
  await close.click(); await expect(orders).toHaveCount(0);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSelection().armyId)).toBe(C.armyId);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(stateHash(game));
});
