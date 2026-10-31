import { expect, test } from '@playwright/test';
import { landmarks, serializeGame } from '@theandril/sim';
import { landmarkKind } from '@theandril/content';
import { hexDistance } from '@theandril/mapgen';
import { exportSave } from '@theandril/persistence';
import { attunementCampaign } from '../../packages/test-fixtures/src/victory-fixture';
import { openSelectedOrders, selectFromRegistry } from './ui-navigation';

/** Rules 51: a landmark on explored ground is named on its hex, with what it
 * yields to the hearth that works it. */
test('select a landmark hex and read its name, story and yield in the hex inspector', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const state = attunementCampaign(), player = state.turnOwnerId;
  const host = Object.values(state.settlements).find(town => town.factionId === player)!;
  const site = landmarks(state.world).filter(item => state.explored[player]!.has(item.cell)).sort((a, b) => hexDistance(a.cell, host.cell, state.world.width) - hexDistance(b.cell, host.cell, state.world.width))[0]!;
  const kind = landmarkKind(site.kindId)!;
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type=file]').setInputFiles({ name: 'landmark.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await selectFromRegistry(page, 'settlements', host.name);
  await page.getByTestId('map-container').scrollIntoViewIfNeeded();
  const point = await page.evaluate(cell => window.__THEANDRIL__!.getCellScreenPoint(cell), site.cell);
  expect(point?.inViewport).toBe(true);
  await page.mouse.click(point!.x, point!.y);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSelection().cell)).toBe(site.cell);
  // The hex inspector lives in the selected-orders window.
  const orders = await openSelectedOrders(page);
  const inspector = orders.getByTestId('landmark');
  await expect(inspector).toContainText(kind.name);
  await expect(inspector).toContainText(kind.description.slice(0, 40));
  await expect(inspector).toContainText('Worked by the hearth that claims it');
  await page.screenshot({ path: test.info().outputPath('landmark-inspector.png') });
  expect(errors).toEqual([]);
});
