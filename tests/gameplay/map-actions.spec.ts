import { expect, test, type Locator, type Page } from '@playwright/test';
import { applyCommand, createGame, getObservation, serializeGame, stateHash, type GameState } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { characterCampaign, CHARACTER_FIXTURE } from '../../packages/test-fixtures/src/character-fixture';
import { roadsCampaign } from '../../packages/test-fixtures/src/roads-fixture';
import { borderBattleCampaign } from '../../packages/test-fixtures/src/combat-fixture';
import { closeManagement } from './ui-navigation';

async function load(page: Page, game: GameState) {
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'map-actions.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(game))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().frameCount ?? 0)).toBeGreaterThan(2);
}
async function canvasClick(page: Page, cell: number) {
  await page.getByTestId('map-container').scrollIntoViewIfNeeded();
  const point = await page.evaluate(cell => window.__THEANDRIL__!.getCellScreenPoint(cell), cell);
  expect(point?.inViewport).toBe(true);
  expect(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.tagName, point!)).toBe('CANVAS');
  await page.mouse.click(point!.x, point!.y);
  await expect(page.getByTestId('map-actions')).toBeVisible();
}
async function settings(page: Page, open = true) {
  const menu = page.getByTestId('campaign-menu');
  if ((await menu.getAttribute('open') !== null) !== open) await menu.locator(':scope > summary').click();
}
async function expanded(details: Locator) {
  if (await details.getAttribute('open') === null) await details.locator(':scope > summary').click();
}
async function currentLand(page: Page, townId: string) {
  const land = page.getByTestId('map-actions').getByTestId('land-panel');
  await expect(land).toHaveAttribute('data-settlement-id', townId);
  await expect(land).toHaveAttribute('data-query-state', 'ready');
  await expect(land).toHaveAttribute('data-query-hash', await page.evaluate(() => window.__THEANDRIL__!.getStateHash()));
  await expect(page.getByTestId('land-panel')).toHaveCount(1);
}
async function mapControlsFit(page: Page) {
  const controls = await page.locator('.map-controls > button').evaluateAll(buttons => buttons.map(button => {
    const rect = button.getBoundingClientRect();
    const label = button.getAttribute('aria-label') ?? button.textContent;
    return { icon: label?.startsWith('Zoom ') || label === 'Map guide', label, width: rect.width, height: rect.height, clientWidth: button.clientWidth, scrollWidth: button.scrollWidth };
  }));
  expect(controls.length).toBeGreaterThanOrEqual(5);
  for (const control of controls) {
    expect(control.scrollWidth, control.label ?? 'map control').toBeLessThanOrEqual(control.clientWidth);
    if (control.icon) { expect(control.width).toBeGreaterThanOrEqual(44); expect(control.height).toBeGreaterThanOrEqual(44); }
    else expect(control.width, control.label ?? 'map control').toBeGreaterThan(44);
  }
}

test('a real canvas caravan founds, builds and continues in the same full-orders controls without issuing inspection orders', async ({ page }, info) => {
  const game = createGame({ generatorVersion: 4, seed: 17, size: 'tiny', pace: 'short', factionCount: 2 });
  const start = game.armies['army.1']!.cell;
  await load(page, game); await mapControlsFit(page); await canvasClick(page, start);
  const popup = page.getByTestId('map-actions');
  await popup.getByRole('combobox', { name: 'Inspect at this location', exact: true }).selectOption('army.1');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(stateHash(game));
  await popup.getByRole('textbox', { name: 'Settlement name', exact: true }).fill('Map Hearth');
  await popup.getByRole('button', { name: 'Found settlement', exact: true }).click();
  expect(applyCommand(game, { type: 'found', factionId: game.turnOwnerId, armyId: 'army.1', name: 'Map Hearth' }).ok).toBe(true);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(stateHash(game));
  await expect(popup.getByRole('tab', { name: 'Build & recruit', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByTestId('production-building')).toHaveCount(1);
  const before = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.treasury);
  await popup.getByRole('button', { name: 'Build Root cellar', exact: true }).click();
  expect(applyCommand(game, { type: 'queue', factionId: game.turnOwnerId, settlementId: 'settlement.5', itemId: 'building.granary' }).ok).toBe(true);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(stateHash(game));
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.treasury)).toBeLessThan(before);
  await expect(popup.getByRole('tab', { name: 'Build & recruit', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(popup.locator('.production-queue')).toContainText('Root cellar');
  const selected = await page.evaluate(() => window.__THEANDRIL__!.getSelection());
  expect((await popup.boundingBox())!.height).toBeLessThanOrEqual(680);
  await page.screenshot({ path: info.outputPath('map-founded-production-desktop.png') });
  await popup.getByRole('button', { name: 'Open full orders', exact: true }).click();
  await expect(popup).toHaveCount(0);
  const orders = page.getByRole('dialog', { name: 'Selected orders', exact: true });
  await expect(orders).toBeVisible();
  await expect(orders.getByRole('heading', { name: 'Selected orders', exact: true })).toBeFocused();
  await expect(orders.locator('.production-queue')).toContainText('Root cellar');
  await expect(page.getByTestId('production-building')).toHaveCount(1);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSelection())).toEqual(selected);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(stateHash(game));
  await closeManagement(page);
  await expect(page.getByTestId('map-container')).toBeFocused();
  const opener = page.getByRole('button', { name: 'Open map actions', exact: true });
  await opener.focus(); await page.keyboard.press('Enter'); await expect(popup).toBeVisible();
  await page.keyboard.press('Escape'); await expect(popup).toHaveCount(0);
  await expect(page.getByTestId('map-container')).toBeFocused();
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSelection())).toEqual(selected);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(stateHash(game));
});

test('a hundred co-located armies retain all choices, local keyboard tabs and native-modal focus across paid saved orders', async ({ page }, info) => {
  const game = characterCampaign(100), view = getObservation(game, game.turnOwnerId);
  const army = game.armies[CHARACTER_FIXTURE.armyId]!, home = game.settlements[CHARACTER_FIXTURE.homeId]!;
  const armies = Object.values(game.armies).filter(item => item.factionId === game.turnOwnerId && item.cell === home.cell);
  const cost = view.characterRecruitment.find(item => item.settlementId === home.id && item.definitionId === 'character.marshal')!.coinCost;
  await load(page, game); await canvasClick(page, army.cell);
  const popup = page.getByTestId('map-actions'), chooser = popup.getByRole('combobox', { name: 'Inspect at this location', exact: true });
  await expect(chooser.locator('option')).toHaveCount(102);
  for (const item of armies) await expect(chooser.locator(`option[value="${item.id}"]`)).toHaveCount(1);
  await chooser.selectOption(armies.at(-1)!.id);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSelection().armyId)).toBe(armies.at(-1)!.id);
  await chooser.selectOption(army.id);
  const tabs = popup.getByRole('tablist', { name: 'Selected entity management', exact: true });
  await tabs.getByRole('tab', { name: 'Actions', exact: true }).focus();
  await page.keyboard.press('ArrowRight'); await expect(tabs.getByRole('tab', { name: 'Composition', exact: true })).toBeFocused();
  await expect(popup.getByTestId('army-composition')).toHaveCount(1);
  await page.keyboard.press('ArrowRight'); await expect(tabs.getByRole('tab', { name: 'Officers', exact: true })).toBeFocused();
  await expect(popup.getByTestId('army-composition')).toHaveCount(0);
  const manage = popup.getByRole('button', { name: `Manage characters for ${army.name}`, exact: true });
  await manage.click();
  await expect(page.getByRole('dialog', { name: 'Characters & agents', exact: true })).toBeVisible();
  await expect(popup).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Characters & agents', exact: true })).toHaveCount(0);
  await expect(popup).toBeVisible(); await expect(manage).toBeFocused();
  await expect(tabs.getByRole('tab', { name: 'Officers', exact: true })).toHaveAttribute('aria-selected', 'true');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(stateHash(game));
  await chooser.selectOption(home.id);
  await expect(tabs.getByRole('tab', { name: 'Build & recruit', exact: true })).toHaveAttribute('aria-selected', 'true');
  await chooser.selectOption(army.id);
  await expect(tabs.getByRole('tab', { name: 'Actions', exact: true })).toHaveAttribute('aria-selected', 'true');
  await chooser.selectOption(home.id);
  await tabs.getByRole('tab', { name: 'Officers', exact: true }).click();
  await expanded(popup.getByTestId('character-appointments'));
  await popup.getByRole('button', { name: 'Appoint Hearth marshal', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.characters.length)).toBe(1);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.treasury)).toBe(view.treasury - cost);
  await expect(tabs.getByRole('tab', { name: 'Officers', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(popup.getByTestId('character-appointments')).toHaveAttribute('open');
  await chooser.selectOption(army.id);
  await expect(tabs.getByRole('tab', { name: 'Actions', exact: true })).toHaveAttribute('aria-selected', 'true');
  const selection = await page.evaluate(() => window.__THEANDRIL__!.getSelection());
  const hash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  await page.screenshot({ path: info.outputPath('hundred-army-location-menu.png') });
  await popup.getByRole('button', { name: 'Move on map', exact: true }).click();
  await expect(popup).toHaveCount(0); expect(await page.evaluate(() => window.__THEANDRIL__!.getSelection())).toEqual(selection);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);
  await settings(page); await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.characters.length)).toBe(1);
});

test('map-only diplomacy uses the one real encountered-faction consumer and ordinary war command', async ({ page }) => {
  const game = borderBattleCampaign(), view = getObservation(game, game.turnOwnerId);
  const opponent = view.factions.find(faction => faction.id !== view.factionId)!;
  const foreignCell = view.armies.find(army => army.factionId === opponent.id)!.cell;
  expect(opponent).toBeTruthy();
  await load(page, game);
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSelection())).toEqual({});
  await canvasClick(page, foreignCell);
  const popup = page.getByTestId('map-actions');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSelection())).toEqual({ cell: foreignCell });
  await expect(popup.getByRole('tab')).toHaveCount(2);
  await expect(popup.getByRole('tab', { name: 'Hex', exact: true })).toHaveAttribute('aria-selected', 'true');
  await popup.getByRole('tab', { name: 'Diplomacy', exact: true }).click();
  await expect(page.getByTestId('faction-encounters')).toHaveCount(1);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(stateHash(game));
  await popup.getByRole('button', { name: `Declare war on ${opponent.name}`, exact: true }).click();
  expect(applyCommand(game, { type: 'declareWar', factionId: game.turnOwnerId, targetFactionId: opponent.id }).ok).toBe(true);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(stateHash(game));
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSelection())).toEqual({ cell: foreignCell });
  await expect(popup.getByRole('tab')).toHaveCount(2);
  await expect(popup.getByRole('tab', { name: 'Hex', exact: true })).toBeVisible();
  await expect(popup.getByRole('tab', { name: 'Diplomacy', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(popup.getByRole('button', { name: `Negotiate peace with ${opponent.name}`, exact: true })).toBeEnabled();
});

test('390px map-only land actions inherit 130% text, reveal current paid quotes and remain above the real footer', async ({ page }, info) => {
  const game = roadsCampaign(), view = getObservation(game, game.turnOwnerId), town = view.settlements.find(item => item.name === 'Old Hearth')!;
  const tile = view.land.settlements.find(item => item.settlementId === town.id)!.cells.find(item => item.canWork && item.improvementOptions.some(option => option.improvementId === 'improvement.quarry' && option.canStart))!;
  const quote = tile.improvementOptions.find(option => option.improvementId === 'improvement.quarry')!;
  await page.setViewportSize({ width: 390, height: 844 }); await load(page, game);
  await settings(page); await page.getByRole('combobox', { name: 'Text scale', exact: true }).selectOption('1.3');
  await settings(page, false);
  await mapControlsFit(page);
  await canvasClick(page, town.cell);
  const popup = page.getByTestId('map-actions');
  await popup.getByRole('combobox', { name: 'Inspect at this location', exact: true }).selectOption(town.id);
  await page.keyboard.press('Escape'); await expect(popup).toHaveCount(0);
  await canvasClick(page, tile.cell);
  await expect(popup.getByRole('tab', { name: 'Land & tiles', exact: true })).toHaveAttribute('aria-selected', 'true');
  await currentLand(page, town.id);
  await expect(popup.getByTestId('land-cell')).toContainText(`Hex ${tile.cell}`);
  expect(await popup.evaluate(element => getComputedStyle(element).getPropertyValue('--text-scale').trim())).toBe('1.3');
  const beforeCount = await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().landQueryCount);
  await popup.getByRole('button', { name: 'Assign worker', exact: true }).click(); await currentLand(page, town.id);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().landQueryCount)).toBe(beforeCount + 1);
  const improvements = popup.locator('.land-options').filter({ has: page.locator('summary', { hasText: 'Tile improvements' }) });
  await expanded(improvements);
  const build = popup.getByRole('button', { name: `Build ${quote.name}`, exact: true });
  await build.scrollIntoViewIfNeeded();
  const geometry = await build.evaluate(element => {
    const control = element.getBoundingClientRect(), surface = element.closest('.map-actions')!.getBoundingClientRect();
    const footer = document.querySelector('.command-bar')!.getBoundingClientRect();
    const hit = document.elementFromPoint(control.x + control.width / 2, control.y + control.height / 2);
    return { left: surface.left, right: surface.right, top: surface.top, bottom: surface.bottom, footerTop: footer.top, viewport: { width: innerWidth, height: innerHeight }, height: control.height, hit: hit === element || element.contains(hit) };
  });
  expect(geometry.left).toBeGreaterThanOrEqual(7); expect(geometry.right).toBeLessThanOrEqual(geometry.viewport.width - 7);
  expect(geometry.top).toBeGreaterThanOrEqual(7); expect(geometry.bottom).toBeLessThanOrEqual(Math.min(geometry.viewport.height, geometry.footerTop) - 7);
  expect(geometry.height).toBeGreaterThanOrEqual(44); expect(geometry.hit).toBe(true);
  await page.screenshot({ path: info.outputPath('map-land-quarry-390-text130.png') });
  const coin = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.treasury);
  await build.click(); await currentLand(page, town.id);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.treasury)).toBe(coin - quote.coinCost);
  await expect(popup.getByTestId('land-work')).toContainText(`${quote.coinCost} coin paid`);
  const hash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  await page.keyboard.press('Escape'); await expect(popup).toHaveCount(0); await expect(page.getByTestId('map-container')).toBeFocused();
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await settings(page); await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.land.settlements.find(item => item.settlementId === 'settlement.3')!.work?.coinCost)).toBe(quote.coinCost);
  await settings(page, false);
  // Queue a genuine longer journey, then inspect its remote town waypoint.
  // This camera action must retain the travelling army and issue no extra order.
  await page.getByRole('button', { name: 'Open map actions', exact: true }).click();
  await popup.getByRole('combobox', { name: 'Inspect at this location', exact: true }).selectOption('army.2');
  await popup.getByRole('button', { name: 'Plan a route', exact: true }).click();
  await expect(popup.getByRole('tab', { name: 'Route', exact: true })).toHaveAttribute('aria-selected', 'true');
  await popup.getByRole('spinbutton', { name: 'Destination hex', exact: true }).fill('498');
  await popup.getByRole('button', { name: 'Review route', exact: true }).click();
  await expect(popup.getByRole('button', { name: 'Queue route', exact: true })).toBeEnabled();
  await popup.getByRole('button', { name: 'Queue route', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.routes.some(route => route.armyId === 'army.2'))).toBe(true);
  await page.getByRole('button', { name: 'Open map actions', exact: true }).click();
  await popup.getByRole('tab', { name: 'Route', exact: true }).click();
  const travelling = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.ownArmies.find(army => army.id === 'army.2')!);
  const routeHash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  await popup.getByRole('button', { name: 'Focus waypoint 1 at hex 498', exact: true }).click();
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSelection())).toEqual({ armyId: 'army.2', cell: 498 });
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.ownArmies.find(army => army.id === 'army.2'))).toEqual(travelling);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(routeHash);
  await expect(popup.getByTestId('queued-route')).toContainText('hex 498');
});
