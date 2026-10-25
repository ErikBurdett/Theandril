import { expect, test, type Page } from '@playwright/test';
import { serializeGame, stateHash, type GameState } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { theaterCampaign } from '../../packages/test-fixtures/src/theater-fixture';
import { campaignMenu, exportedTravel, matureTravel } from './group-movement-fixture';
import { closeManagement, openSelectedOrders, selectFromRegistry } from './ui-navigation';

async function load(page: Page, game: GameState) {
  await page.goto('/');
  await page.getByLabel('Import save file').setInputFiles({ name: 'patrol.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(game))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
}
async function panel(page: Page, name = 'Watch company 1') {
  await selectFromRegistry(page, 'armies', name); await openSelectedOrders(page);
  const patrol = page.getByTestId('army-patrol');
  if (await patrol.getAttribute('open') === null) await patrol.locator(':scope > summary').click();
  return patrol;
}
async function nextTurn(page: Page) {
  const turn = await page.evaluate(() => window.__THEANDRIL__!.getTurn());
  await closeManagement(page);
  const menu = page.getByTestId('campaign-menu');
  if (await menu.getAttribute('open') !== null) await menu.locator(':scope > summary').click();
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getTurn())).toBe(turn + 1);
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
}
async function snapshot(page: Page) {
  return page.evaluate(() => {
    const view = window.__THEANDRIL__!.getSummary()!;
    return { hash: window.__THEANDRIL__!.getStateHash(), patrols: view.patrols!, routes: view.routes,
      armies: view.ownArmies.map(({ id, cell }) => ({ id, cell })) };
  });
}

test('a two-point patrol makes both legs through End turn and survives manual and portable recovery with exact replay', async ({ page }) => {
  const game = theaterCampaign(1), army = Object.values(game.armies)[0]!;
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await load(page, game);
  const patrol = await panel(page);
  await expect(patrol.getByRole('button', { name: 'Start patrol', exact: true })).toBeDisabled();
  await expect(patrol.getByRole('checkbox', { name: 'Pause when war begins', exact: true })).not.toBeChecked();
  const before = await snapshot(page);
  await patrol.getByRole('spinbutton', { name: 'Second patrol point', exact: true }).fill('497');
  expect((await snapshot(page)).hash).toBe(before.hash);
  await patrol.getByRole('button', { name: 'Start patrol', exact: true }).focus(); await page.keyboard.press('Enter');
  await expect(patrol.locator(':scope > summary')).toContainText('Enabled · 495 ↔ 497');
  expect((await snapshot(page)).armies.find(item => item.id === army.id)!.cell).toBe(495);
  await nextTurn(page);
  expect((await snapshot(page)).armies.find(item => item.id === army.id)!.cell).toBe(497);
  expect((await snapshot(page)).patrols[0]!.targetCell).toBe(495);
  await nextTurn(page);
  expect((await snapshot(page)).armies.find(item => item.id === army.id)!.cell).toBe(495);
  const active = await snapshot(page);
  await campaignMenu(page);
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  const exported = await exportedTravel(page);
  expect(stateHash(exported.game)).toBe(active.hash);
  expect(exported.archive.records.some(record => record.command && typeof record.command === 'object' && 'type' in record.command && record.command.type === 'setPatrol')).toBe(true);
  await panel(page);
  await patrol.getByRole('button', { name: 'Pause patrol', exact: true }).click();
  await expect(patrol.locator(':scope > summary')).toContainText('Paused');
  await patrol.getByRole('checkbox', { name: 'Pause when war begins', exact: true }).check();
  await patrol.getByRole('button', { name: 'Update patrol', exact: true }).click();
  await expect.poll(async () => (await snapshot(page)).patrols[0]).toMatchObject({ pauseOnWar: true, enabled: false });
  await nextTurn(page);
  expect((await snapshot(page)).armies.find(item => item.id === army.id)!.cell).toBe(495);
  await panel(page);
  await patrol.getByRole('button', { name: 'Resume patrol', exact: true }).click();
  await nextTurn(page);
  expect((await snapshot(page)).armies.find(item => item.id === army.id)!.cell).toBe(497);
  await campaignMenu(page);
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  expect((await snapshot(page)).hash).toBe(active.hash);
  await page.reload();
  await page.getByLabel('Import save file').setInputFiles({ name: 'patrol-recovered.theandril', mimeType: 'application/gzip', buffer: exported.bytes });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  expect((await snapshot(page)).hash).toBe(active.hash);
  await panel(page);
  await patrol.getByRole('button', { name: 'Remove patrol', exact: true }).click();
  await expect(patrol.locator(':scope > summary')).toContainText('none');
  expect((await snapshot(page)).patrols).toEqual([]);
  expect(errors).toEqual([]);
});

test('standing postings override patrols and removing a patrol retains its already-issued route until Cancel route', async ({ page }) => {
  const game = theaterCampaign(1), army = Object.values(game.armies)[0]!;
  await load(page, game);
  const patrol = await panel(page);
  const posting = page.getByTestId('army-posting');
  await posting.locator(':scope > summary').click();
  await posting.getByRole('combobox', { name: 'Posted to', exact: true }).selectOption('495');
  await posting.getByRole('combobox', { name: 'On arrival', exact: true }).selectOption('hold');
  await posting.getByRole('button', { name: 'Post army', exact: true }).click();
  await patrol.getByRole('spinbutton', { name: 'Second patrol point', exact: true }).fill('510');
  await patrol.getByRole('button', { name: 'Start patrol', exact: true }).click();
  await nextTurn(page);
  expect((await snapshot(page)).armies.find(item => item.id === army.id)!.cell).toBe(495);
  await panel(page);
  await expect(patrol.getByTestId('patrol-status')).toContainText(/posting/i);
  if (await posting.getAttribute('open') === null) await posting.locator(':scope > summary').click();
  await posting.getByRole('button', { name: 'Clear posting', exact: true }).click();
  await nextTurn(page);
  const marching = await snapshot(page);
  expect(marching.armies.find(item => item.id === army.id)!.cell).not.toBe(495);
  expect(marching.routes.find(route => route.armyId === army.id)?.status).toBe('active');
  await panel(page);
  await patrol.getByRole('button', { name: 'Pause patrol', exact: true }).click();
  await expect(patrol.locator(':scope > summary')).toContainText('Paused');
  expect((await snapshot(page)).routes).toEqual(marching.routes);
  await patrol.getByRole('button', { name: 'Remove patrol', exact: true }).click();
  await expect(patrol.locator(':scope > summary')).toContainText('none');
  expect((await snapshot(page)).routes).toEqual(marching.routes);
  await page.getByTestId('queued-route').getByRole('button', { name: 'Cancel route', exact: true }).click();
  await expect(page.getByTestId('queued-route')).toHaveCount(0);
  expect((await snapshot(page)).routes).toEqual([]);
  const stopped = (await snapshot(page)).armies.find(item => item.id === army.id)!.cell;
  await nextTurn(page);
  expect((await snapshot(page)).armies.find(item => item.id === army.id)!.cell).toBe(stopped);
});

test('the last of one hundred armies can receive a patrol from the registry at desktop and narrow sizes', async ({ page }, testInfo) => {
  const { game, own, origin } = matureTravel(), selected = own.at(-1)!;
  await load(page, game);
  const patrol = await panel(page, selected.name);
  await patrol.getByRole('spinbutton', { name: 'First patrol point', exact: true }).fill(String(origin));
  await patrol.getByRole('spinbutton', { name: 'Second patrol point', exact: true }).fill(String(origin + 2));
  await patrol.getByRole('checkbox', { name: 'Pause when war begins', exact: true }).check();
  await patrol.getByRole('button', { name: 'Start patrol', exact: true }).click();
  await expect(patrol.getByRole('button', { name: 'Pause patrol', exact: true })).toBeEnabled();
  const saved = await snapshot(page);
  expect(saved.patrols).toHaveLength(1);
  expect(saved.patrols[0]!.armyId).toBe(selected.id);
  expect(saved.patrols[0]!.pauseOnWar).toBe(true);
  await patrol.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('patrol-desktop.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await patrol.getByRole('spinbutton', { name: 'Second patrol point', exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('patrol-narrow-points.png') });
  await patrol.getByRole('button', { name: 'Remove patrol', exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('patrol-narrow-actions.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const exported = await exportedTravel(page);
  expect(stateHash(exported.game)).toBe(saved.hash);
  expect(exported.game.patrols[0]!.armyId).toBe(selected.id);
  expect(exported.game.patrols[0]!.pauseOnWar).toBe(true);
  await panel(page, selected.name);
  await expect(patrol.getByRole('checkbox', { name: 'Pause when war begins', exact: true })).toBeChecked();
});
