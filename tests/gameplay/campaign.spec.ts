import { openProduction } from './ui-navigation';
import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function begin(page: Page, size = 'tiny'): Promise<void> {
  await page.goto('/');
  await page.getByLabel('World seed').fill('20260905');
  await page.getByLabel('World size').selectOption(size);
  await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toContainText('1');
  await expect(page.locator('canvas')).toBeVisible();
}
async function endTurn(page: Page, expectedTurn: number): Promise<void> {
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toContainText(String(expectedTurn));
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
}

test('settle, grow, build, recruit, explore and resume the same campaign', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await begin(page);
  await page.getByTestId('army-registry').getByRole('button', { name: /Hearth caravan/ }).first().click();
  await page.getByLabel('Settlement name').fill('Emberwatch');
  await page.getByRole('button', { name: 'Found settlement', exact: true }).click();
  await page.getByRole('tab', { name: /Settlements/ }).click();
  await expect(page.getByTestId('settlement-registry')).toContainText('Emberwatch');
  await page.getByTestId('settlement-registry').getByRole('button', { name: /Emberwatch/ }).click();
  await page.getByRole('button', { name: /Build Root cellar/ }).click();
  for (let turn = 2; turn <= 4; turn++) await endTurn(page, turn);
  await expect(page.getByTestId('chronicle')).toContainText('completed Root cellar');
  await openProduction(page, 'land');
  await page.getByRole('button', { name: /Recruit Wayfinder/ }).click();
  for (let turn = 5; turn <= 7; turn++) await endTurn(page, turn);
  await page.getByRole('tab', { name: /Armies/ }).click();
  await expect(page.getByTestId('army-registry').getByRole('button', { name: /Wayfinder/ })).toHaveCount(2);
  await page.getByTestId('army-registry').getByRole('button', { name: /Wayfinder/ }).first().click();
  await page.getByRole('button', { name: /Move to cell/ }).filter({ hasText: /Plains|Forest|Hills/ }).first().click();
  await expect(page.getByTestId('feedback')).toContainText('explored hex');
  await page.getByText('Campaign & settings', { exact: true }).click();
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  const savedHash = await page.evaluate(() => window.__THEANDRIL__?.getStateHash());
  expect(savedHash).toMatch(/^[0-9a-f]+$/);
  await endTurn(page, 8);
  await page.reload();
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toContainText('7');
  expect(await page.evaluate(() => window.__THEANDRIL__?.getStateHash())).toBe(savedHash);
  await page.screenshot({ path: testInfo.outputPath('campaign.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('compressed export/import and corrupt-save handling use the real controls', async ({ page }) => {
  await begin(page);
  const hash = await page.evaluate(() => window.__THEANDRIL__?.getStateHash());
  await page.getByText('Campaign & settings', { exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export campaign', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.theandril$/);
  const path = await download.path();
  if (!path) throw new Error('Export did not produce a file');
  const buffer = await readFile(path);
  await endTurn(page, 2);
  await page.locator('input[type=file]').setInputFiles({ name: 'campaign.theandril', mimeType: 'application/gzip', buffer });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  expect(await page.evaluate(() => window.__THEANDRIL__?.getStateHash())).toBe(hash);
  await page.locator('input[type=file]').setInputFiles({ name: 'broken.theandril', mimeType: 'application/gzip', buffer: Buffer.from('broken') });
  await expect(page.getByTestId('feedback')).toContainText('Not a compressed');
  expect(await page.evaluate(() => window.__THEANDRIL__?.getStateHash())).toBe(hash);
});

test('Huge map pans and zooms with bounded visible geometry; layout remains usable', async ({ page }, testInfo) => {
  await begin(page, 'huge');
  const canvas = page.locator('canvas');
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error('Map has no size');
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  for (let i = 0; i < 8; i++) await page.mouse.wheel(0, i < 4 ? 180 : -180);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width / 2 + 120, bounds.y + bounds.height / 2 + 60, { steps: 12 });
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getPerformanceCounters().frameCount ?? 0)).toBeGreaterThan(60);
  await page.screenshot({ path: testInfo.outputPath('huge-map.png'), fullPage: true });
  const metrics = await page.evaluate(() => window.__THEANDRIL__?.getPerformanceCounters());
  await testInfo.attach('performance.json', { body: JSON.stringify(metrics, null, 2), contentType: 'application/json' });
  console.log('Huge starting-map measurements:', JSON.stringify(metrics));
  expect(metrics?.renderer).toBe('webgl');
  expect(metrics?.cachedChunks).toBeLessThanOrEqual(64);
  expect(metrics?.visibleCells).toBeLessThan(5000);
  expect(metrics?.transferBytes).toBeLessThan(20000);
  expect(metrics?.frameCount).toBeGreaterThan(60);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('narrow.png'), fullPage: true });
});
