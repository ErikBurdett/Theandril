import { expect, test, type Page } from '@playwright/test';
import { applyCommand, createGame, deserializeGame, serializeGame, type GameCommand, type GameState } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { empireLandCampaign } from '../../packages/test-fixtures/src/empire-land-fixture';
import { characterCampaign } from '../../packages/test-fixtures/src/character-fixture';
import { navalCampaign, NAVAL_FIXTURE } from '../../packages/test-fixtures/src/naval-fixture';

const nextArmy = (page: Page) => page.getByRole('button', { name: 'Next army needing orders', exact: true });
const previousArmy = (page: Page) => page.getByRole('button', { name: 'Previous army needing orders', exact: true });
const nextTown = (page: Page) => page.getByRole('button', { name: 'Next idle settlement', exact: true });
const previousTown = (page: Page) => page.getByRole('button', { name: 'Previous idle settlement', exact: true });
async function importCampaign(page: Page, state: GameState) {
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'next-orders.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
}
async function selectedArmy(page: Page, id: string) { await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSelection().armyId)).toBe(id); }
async function selectedTown(page: Page, id: string) {
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSelection().settlementId)).toBe(id);
  await expect(page.getByTestId('land-panel')).toHaveAttribute('data-settlement-id', id);
  await expect(page.getByTestId('land-panel')).toHaveAttribute('data-query-state', 'ready');
}
function order(state: GameState, command: GameCommand) {
  const result = applyCommand(state, command);
  if (!result.ok) throw new Error(`Next-action fixture ${command.type}: ${result.error}`);
}
function routeCampaign(paused: boolean): GameState {
  let state = createGame({ seed: 20260905, size: 'tiny', pace: 'short', factionCount: 2 });
  state.world.terrain.fill(1); state.world.biome.fill(1); state.world.fertility.fill(60); state.world.waterDepth.fill(0);
  delete state.armies['army.1']; delete state.armies['army.3'];
  state.armies['army.2']!.cell = 500; state.armies['army.2']!.name = 'Interrupted wayfinders';
  state.armies['army.4']!.cell = 554;
  if (!paused) delete state.armies['army.4'];
  for (const faction of state.factions) state.explored[faction.id] = new Set(Array.from({ length: state.world.terrain.length }, (_, cell) => cell));
  state = deserializeGame(serializeGame(state));
  order(state, { type: 'queueMovement', factionId: state.turnOwnerId, armyId: 'army.2', target: 508 });
  if (paused) {
    order(state, { type: 'move', factionId: state.factions[1]!.id, armyId: 'army.4', target: 506 });
    order(state, { type: 'endTurn', factionId: state.turnOwnerId });
    expect(state.routes['army.2']!.status).toBe('paused');
  } else expect(state.routes['army.2']!.status).toBe('active');
  return deserializeGame(serializeGame(state));
}

test('hundred-army forty-town navigation wraps, clears filters and respects typing and modal ownership without issuing orders', async ({ page }, testInfo) => {
  const state = empireLandCampaign('legendary');
  await importCampaign(page, state);
  const view = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!);
  expect(view.ownArmies).toHaveLength(100); expect(view.ownSettlements).toHaveLength(40);
  const armies = view.ownArmies.map(army => army.id).sort(), towns = view.ownSettlements.map(town => town.id).sort();
  const hash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  await expect(page.getByTestId('next-action-counts')).toContainText('100 armies needing orders · 40 idle settlements');
  await page.getByRole('searchbox', { name: 'Search your realm' }).fill('no matching army');
  await page.getByRole('combobox', { name: 'Force type' }).selectOption('naval');
  await page.getByTestId('map-container').focus(); await page.keyboard.press('Escape');
  await previousArmy(page).click(); await selectedArmy(page, armies.at(-1)!);
  await expect(page.getByRole('searchbox', { name: 'Search your realm' })).toHaveValue('');
  await expect(page.getByRole('combobox', { name: 'Force type' })).toHaveValue('all');
  await nextArmy(page).click(); await selectedArmy(page, armies[0]!);
  await page.getByTestId('map-container').focus(); await page.keyboard.press('n'); await selectedArmy(page, armies[1]!);
  await page.keyboard.press('Shift+N'); await selectedArmy(page, armies[0]!);
  await nextTown(page).click(); await selectedTown(page, towns[0]!);
  await previousTown(page).click(); await selectedTown(page, towns.at(-1)!);
  await nextTown(page).click(); await selectedTown(page, towns[0]!);
  const selection = await page.evaluate(() => window.__THEANDRIL__!.getSelection());
  const search = page.getByRole('searchbox', { name: 'Search your realm' });
  await search.fill('n'); await search.press('s'); await search.press('Shift+N');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSelection())).toEqual(selection);
  await page.getByRole('button', { name: 'Realm progression', exact: true }).click();
  await page.keyboard.press('n'); await page.keyboard.press('Shift+S');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSelection())).toEqual(selection);
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.land.settlements.every(town => town.cells.length === 0))).toBe(true);
  await page.getByTestId('next-action-navigation').scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('large-empire-next-orders.png') });
});

test('paused routes need attention while standing journeys, stationary missions and embarked troops are skipped', async ({ page }) => {
  await importCampaign(page, routeCampaign(true));
  const hash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  await nextArmy(page).click(); await selectedArmy(page, 'army.2');
  await expect(page.getByTestId('next-action-notice')).toContainText('Route interrupted');
  await expect(page.getByTestId('queued-route')).toContainText('Another faction now blocks the next step');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);
  await page.getByRole('button', { name: 'Cancel route', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.routes.length)).toBe(0);
  await expect(page.getByTestId('next-action-notice')).toHaveText('');
  await importCampaign(page, routeCampaign(false));
  await expect(nextArmy(page)).toBeDisabled(); await expect(previousArmy(page)).toBeDisabled();
  await expect(nextTown(page)).toBeDisabled();
  const marchingHash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  await page.getByTestId('map-container').focus(); await page.keyboard.press('n');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(marchingHash);

  const mission = characterCampaign();
  order(mission, { type: 'recruitCharacter', factionId: mission.turnOwnerId, settlementId: 'settlement.5', definitionId: 'character.engineer' });
  const engineer = Object.values(mission.characters).find(character => character.definitionId === 'character.engineer')!;
  order(mission, { type: 'assignCharacter', factionId: mission.turnOwnerId, characterId: engineer.id, armyId: 'army.2' });
  order(mission, { type: 'startCharacterMission', factionId: mission.turnOwnerId, characterId: engineer.id, missionId: 'mission.refit' });
  await importCampaign(page, deserializeGame(serializeGame(mission)));
  await expect(page.getByTestId('next-action-counts')).toContainText('1 army needing orders');
  await nextArmy(page).click();
  const reserve = Object.values(mission.armies).find(army => army.name === 'Reserve escort')!;
  await selectedArmy(page, reserve.id);

  const sea = navalCampaign({ enemyFleet: false });
  order(sea, { type: 'embarkArmy', factionId: sea.turnOwnerId, armyId: NAVAL_FIXTURE.cargoId, fleetId: NAVAL_FIXTURE.fleetId });
  await importCampaign(page, deserializeGame(serializeGame(sea)));
  await expect(page.getByTestId('next-action-counts')).toContainText('2 armies needing orders');
  await nextArmy(page).click();
  const first = await page.evaluate(() => window.__THEANDRIL__!.getSelection().armyId);
  await nextArmy(page).click();
  const second = await page.evaluate(() => window.__THEANDRIL__!.getSelection().armyId);
  expect(new Set([first, second])).toEqual(new Set([NAVAL_FIXTURE.fleetId, NAVAL_FIXTURE.coastalId]));
});

test('remapped shortcuts persist and previous/next touch controls remain usable at narrow width', async ({ browser }, testInfo) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await context.newPage();
  try {
    const state = characterCampaign(); await importCampaign(page, state);
    await page.locator('.campaign-options > summary').click();
    await page.getByRole('textbox', { name: 'Next army shortcut', exact: true }).fill('e');
    await expect(page.getByText('That shortcut is already assigned. Choose a different key.')).toBeVisible();
    await page.getByRole('textbox', { name: 'Next army shortcut', exact: true }).fill('g');
    await page.getByRole('textbox', { name: 'Next settlement shortcut', exact: true }).fill('h');
    await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
    await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
    const hash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
    await page.reload(); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
    await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);
    await expect(nextArmy(page)).toHaveAttribute('aria-keyshortcuts', 'G');
    await expect(nextTown(page)).toHaveAttribute('aria-keyshortcuts', 'H');
    const initial = await page.evaluate(() => window.__THEANDRIL__!.getSelection());
    await page.getByTestId('map-container').focus(); await page.keyboard.press('n');
    expect(await page.evaluate(() => window.__THEANDRIL__!.getSelection())).toEqual(initial);
    await page.keyboard.press('g');
    const next = await page.evaluate(() => window.__THEANDRIL__!.getSelection().armyId);
    expect(next).not.toBe(initial.armyId);
    await page.keyboard.press('Shift+G'); await selectedArmy(page, initial.armyId!);
    await nextArmy(page).tap(); await selectedArmy(page, next!);
    await previousArmy(page).tap(); await selectedArmy(page, initial.armyId!);
    await nextTown(page).tap(); await selectedTown(page, 'settlement.5');
    await previousTown(page).tap(); await selectedTown(page, 'settlement.5');
    expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByTestId('next-action-navigation').scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath('next-orders-touch-narrow.png') });
  } finally { await context.close(); }
});
