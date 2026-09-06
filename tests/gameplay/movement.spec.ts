import { expect, test, type Page } from '@playwright/test';
import { UNITS } from '@theandril/content';
import { applyCommand, createArmyFormation, createGame, deserializeGame, serializeGame, type GameCommand, type GameState } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';

const ORIGIN = 500;
function order(state: GameState, command: GameCommand): void {
  const result = applyCommand(state, command);
  if (!result.ok) throw new Error(`Invalid authored fixture order: ${result.error}`);
}
/** Authored local scenario, validated through the real save loader. No browser mutation hook. */
function frontier(options: { enemy?: number; war?: boolean; stack?: boolean } = {}): GameState {
  let state = createGame({ seed: 20260905, size: 'tiny', pace: 'short', factionCount: 2 });
  state.world.terrain.fill(1); state.world.biome.fill(1); state.world.fertility.fill(60);
  state.world.terrain[ORIGIN - 1] = 0; state.world.biome[ORIGIN - 1] = 0;
  // A visible climate sample preserves separate, passable physical terrain.
  [3, 4, 5, 6, 7, 8].forEach((biome, index) => { state.world.biome[ORIGIN - 48 + index] = biome; if (biome === 3 || biome === 8) state.world.terrain[ORIGIN - 48 + index] = 2; });
  const player = state.armies['army.2']!;
  Object.assign(player, { cell: ORIGIN, name: 'Roadward scouts' });
  const friend = state.armies['army.1']!;
  if (options.stack) Object.assign(friend, { cell: ORIGIN, name: 'Hearth caravan' });
  else delete state.armies[friend.id];
  delete state.armies['army.3'];
  if (options.enemy !== undefined) Object.assign(state.armies['army.4']!, { cell: options.enemy, name: 'Reedbound patrol' });
  else delete state.armies['army.4'];
  for (const faction of state.factions) state.explored[faction.id] = new Set(Array.from({ length: state.world.width * state.world.height }, (_, index) => index));
  state = deserializeGame(serializeGame(state));
  if (options.war) order(state, { type: 'declareWar', factionId: state.turnOwnerId, targetFactionId: state.factions[1]!.id });
  return state;
}
async function importFrontier(page: Page, state = frontier()): Promise<void> {
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'old-road.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await expect(page.locator('canvas')).toBeVisible();
  await page.getByTestId('army-registry').getByRole('button', { name: /Roadward scouts/ }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getMovement()?.reachable.length ?? 0)).toBeGreaterThan(1);
}
async function point(page: Page, cell: number): Promise<{ x: number; y: number }> {
  await page.getByTestId('map-container').scrollIntoViewIfNeeded();
  const value = await page.evaluate(cell => window.__THEANDRIL__?.getCellScreenPoint(cell), cell);
  if (!value?.inViewport) throw new Error(`Hex ${cell} is outside the actual canvas viewport`);
  return value;
}
async function clickCell(page: Page, cell: number, touch = false): Promise<void> {
  const { x, y } = await point(page, cell);
  if (touch) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y);
}
async function review(page: Page, cell: number): Promise<void> {
  await page.getByLabel('Destination hex', { exact: true }).fill(String(cell));
  await page.getByRole('button', { name: 'Review route', exact: true }).click();
  await expect(page.getByTestId('route-preview')).toContainText(`hex ${cell}`);
}
async function armyCell(page: Page): Promise<number | undefined> { return page.evaluate(() => window.__THEANDRIL__?.getSummary()?.ownArmies.find(army => army.id === 'army.2')?.cell); }

test('canvas selects and cycles friendly units, previews bounded multi-step movement, and distinguishes dragging from orders', async ({ page }, testInfo) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await importFrontier(page, frontier({ stack: true }));
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => window.__THEANDRIL__?.getSelection())).toEqual({});
  await clickCell(page, ORIGIN);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getSelection().armyId)).toBe('army.1');
  await clickCell(page, ORIGIN);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getSelection().armyId)).toBe('army.2');
  const { x, y } = await point(page, ORIGIN + 2);
  await page.mouse.move(x, y);
  await expect(page.getByTestId('map-route-preview')).toContainText('2 movement · 2 steps');
  const preview = await page.evaluate(() => window.__THEANDRIL__?.getMovement()?.preview);
  expect(preview).toMatchObject({ target: ORIGIN + 2, canMoveNow: true, action: 'move', path: [ORIGIN + 1, ORIGIN + 2] });
  expect(preview?.expandedNodes).toBeLessThanOrEqual(4096);
  await page.screenshot({ path: testInfo.outputPath('movement-preview.png'), fullPage: true });
  const originalHash = await page.evaluate(() => window.__THEANDRIL__?.getStateHash());
  await page.mouse.down(); await page.mouse.move(x + 100, y + 40, { steps: 8 }); await page.mouse.up();
  expect(await page.evaluate(() => window.__THEANDRIL__?.getStateHash())).toBe(originalHash);
  expect(await armyCell(page)).toBe(ORIGIN);
  await clickCell(page, ORIGIN + 2);
  await expect.poll(() => armyCell(page)).toBe(ORIGIN + 2);
  expect(await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.ownArmies.find(army => army.id === 'army.2')?.movement)).toBe(3);
  await clickCell(page, ORIGIN + 3);
  await expect.poll(() => armyCell(page)).toBe(ORIGIN + 3);
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getPerformanceCounters().highlightedCells)).toBe(0);
  expect(errors).toEqual([]);
});

test('map targeting refuses implicit war and impassable land, then executes a multi-step field attack without issuing locked orders', async ({ page }) => {
  await importFrontier(page, frontier({ enemy: ORIGIN + 3 }));
  const peacefulHash = await page.evaluate(() => window.__THEANDRIL__?.getStateHash());
  await clickCell(page, ORIGIN - 1);
  await expect(page.getByTestId('route-preview')).toContainText('Water and mountains are impassable');
  await expect(page.getByRole('button', { name: 'Queue route', exact: true })).toBeDisabled();
  await clickCell(page, ORIGIN + 3);
  await expect(page.getByTestId('route-preview')).toContainText('Declare war before attacking');
  expect(await page.evaluate(() => window.__THEANDRIL__?.getStateHash())).toBe(peacefulHash);
  await page.getByRole('button', { name: 'Declare war on Reedbound Council', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getSummary()?.wars.length)).toBe(1);
  await clickCell(page, ORIGIN + 3);
  await expect(page.getByTestId('battle-panel')).toBeVisible();
  expect(await armyCell(page)).toBe(ORIGIN + 2);
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeDisabled();
  const battleHash = await page.evaluate(() => window.__THEANDRIL__?.getStateHash());
  await page.getByTestId('map-container').focus(); await page.keyboard.press('ArrowLeft');
  expect(await page.evaluate(() => window.__THEANDRIL__?.getStateHash())).toBe(battleHash);
  await expect(page.getByRole('button', { name: 'Review route', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Auto-resolve battle', exact: true }).click();
  await expect(page.getByTestId('battle-report')).toBeVisible();
});

test('queued waypoints consume current movement, survive save/load, continue after the round, and cancel through the real controls', async ({ page }, testInfo) => {
  await importFrontier(page);
  await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
  await clickCell(page, ORIGIN + 8);
  await expect(page.getByTestId('route-preview')).toContainText(`hex ${ORIGIN + 8}`);
  await expect(page.getByRole('button', { name: 'Move now', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Queue route', exact: true }).click();
  await expect.poll(() => armyCell(page)).toBe(ORIGIN + 5);
  await expect(page.getByTestId('queued-route')).toContainText('3 known steps remaining');
  await expect(page.getByRole('button', { name: 'Resume route', exact: true })).toBeDisabled();
  await page.getByLabel('Add waypoint mode', { exact: true }).check();
  await review(page, ORIGIN + 12);
  await page.getByRole('button', { name: 'Add waypoint', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getSummary()?.routes[0]?.waypoints)).toEqual([ORIGIN + 8, ORIGIN + 12]);
  await page.getByLabel('Add waypoint mode', { exact: true }).uncheck();
  await page.getByText('Campaign & settings', { exact: true }).click();
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  const savedHash = await page.evaluate(() => window.__THEANDRIL__?.getStateHash());
  await page.reload(); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('queued-route')).toBeVisible();
  expect(await page.evaluate(() => window.__THEANDRIL__?.getStateHash())).toBe(savedHash);
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 2');
  expect(await armyCell(page)).toBe(ORIGIN + 10);
  await expect(page.getByTestId('queued-route')).toContainText('2 known steps remaining');
  await page.screenshot({ path: testInfo.outputPath('saved-waypoints.png'), fullPage: true });
  await page.getByRole('button', { name: 'Cancel route', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getSummary()?.routes.length)).toBe(0);
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 3');
  expect(await armyCell(page)).toBe(ORIGIN + 10);
});

test('map settlement targeting requires siege instead of bypassing defenses and inspection names the visible biome', async ({ page }) => {
  let state = frontier({ enemy: ORIGIN + 3 });
  const caravan = UNITS.find(unit => unit.id === 'unit.colonist')!;
  Object.assign(state.armies['army.4']!, { formations: [createArmyFormation('army.4', caravan.id)], movement: caravan.movement });
  state = deserializeGame(serializeGame(state));
  order(state, { type: 'found', factionId: state.factions[1]!.id, armyId: 'army.4', name: 'Roadgate' });
  await importFrontier(page, state);
  await page.getByRole('button', { name: 'Declare war on Reedbound Council', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getSummary()?.wars.length)).toBe(1);
  const before = await page.evaluate(() => window.__THEANDRIL__?.getStateHash());
  await clickCell(page, ORIGIN + 3);
  await expect(page.getByTestId('route-preview')).toContainText('Besiege this settlement and assault its defenses');
  await expect(page.getByRole('button', { name: 'Move now', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Queue route', exact: true })).toBeDisabled();
  expect(await page.evaluate(() => window.__THEANDRIL__?.getStateHash())).toBe(before);
  await page.keyboard.press('Escape');
  await clickCell(page, ORIGIN - 46);
  await expect(page.locator('.hex-inspector')).toContainText('Desert · Plains');
});

test('a saved route interrupted by a real foreign move retains its reason and safely replans on resume', async ({ page }, testInfo) => {
  const state = frontier({ enemy: ORIGIN + 54 });
  order(state, { type: 'queueMovement', factionId: state.turnOwnerId, armyId: 'army.2', target: ORIGIN + 8 });
  order(state, { type: 'move', factionId: state.factions[1]!.id, armyId: 'army.4', target: ORIGIN + 6 });
  order(state, { type: 'endTurn', factionId: state.turnOwnerId });
  expect(state.routes['army.2']?.status).toBe('paused');
  await importFrontier(page, state);
  await expect(page.getByTestId('queued-route')).toContainText('Another faction now blocks the next step');
  await expect(page.getByTestId('army-registry')).toContainText('Route interrupted');
  await expect(page.getByRole('button', { name: 'Resume route', exact: true })).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Cancel route', exact: true })).toBeInViewport();
  await page.screenshot({ path: testInfo.outputPath('interrupted-route.png'), fullPage: true });
  await page.getByRole('button', { name: 'Resume route', exact: true }).click();
  await expect.poll(() => armyCell(page)).toBe(ORIGIN + 8);
  expect(await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.routes.length)).toBe(0);
  expect(await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.wars.length)).toBe(0);
});

test('narrow touch map moves on taps and keyboard route controls remain usable without hover', async ({ browser }, testInfo) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await context.newPage();
  try {
    await importFrontier(page);
    await page.keyboard.press('Escape');
    await clickCell(page, ORIGIN, true);
    await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getSelection().armyId)).toBe('army.2');
    await clickCell(page, ORIGIN + 1, true);
    await expect.poll(() => armyCell(page)).toBe(ORIGIN + 1);
    await page.getByLabel('Destination hex', { exact: true }).fill(String(ORIGIN + 8));
    await page.getByLabel('Destination hex', { exact: true }).press('Enter');
    await expect(page.getByRole('group', { name: `Reviewed destination ${ORIGIN + 8}`, exact: true })).toBeFocused();
    await page.getByRole('button', { name: 'Queue route', exact: true }).click();
    await expect(page.getByTestId('queued-route')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('touch-route.png'), fullPage: true });
  } finally { await context.close(); }
});
