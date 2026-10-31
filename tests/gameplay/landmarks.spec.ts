import { expect, test } from '@playwright/test';
import { landmarks, serializeGame } from '@theandril/sim';
import { landmarkKind } from '@theandril/content';
import { hexDistance } from '@theandril/mapgen';
import { exportSave } from '@theandril/persistence';
import { attunementCampaign } from '../../packages/test-fixtures/src/victory-fixture';
import { openCampaignJournal, openRealmAffairs, openSelectedOrders, selectFromRegistry } from './ui-navigation';

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

/** Rules 52: an event of the old places is offered at a hearth whose borders
 * hold a landmark and answered from Realm affairs like any other. */
test('answer a landmark event from Realm affairs and read its coin in the treasury and the journal', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const state = attunementCampaign(), player = state.turnOwnerId;
  const host = Object.values(state.settlements).find(town => town.factionId === player)!;
  state.factions.find(item => item.id === player)!.treasury = 100;
  state.hearthEvents.pending = [{ id: `event.${state.turn}.1`, factionId: player, settlementId: host.id, templateId: 'event.pilgrims_at_the_place', turn: state.turn, expiresTurn: state.turn + 5 }];
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type=file]').setInputFiles({ name: 'pilgrims.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  const affairs = await openRealmAffairs(page);
  const panel = affairs.getByTestId('hearth-events');
  await expect(panel).toContainText('Pilgrims at the old place');
  await expect(panel).toContainText(`within the borders of ${host.name}`);
  await expect(panel).toContainText('+40 coin');
  await page.screenshot({ path: test.info().outputPath('landmark-event-offered.png') });
  await panel.getByRole('button', { name: `Charge a toll: Pilgrims at the old place at ${host.name}` }).click();
  await expect(panel).toHaveCount(0);
  await expect(page.getByText(/\b140\b.*coin|coin.*\b140\b/).first()).toBeVisible();
  const journal = await openCampaignJournal(page);
  await expect(journal).toContainText('Pilgrims at the old place at');
  await expect(journal).toContainText('charge a toll');
  expect(errors).toEqual([]);
});
