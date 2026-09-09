import { closeManagement, openRegistry, selectFromRegistry, openSelectedOrders, openRealmAffairs, openCampaignJournal, openProduction } from './ui-navigation';
import { expect, test, type Page } from '@playwright/test';
import { applyCommand, createArmyFormation, deserializeGame, serializeGame, stateHash, type GameCommand, type GameState } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { navalCampaign, NAVAL_FIXTURE as N } from '../../packages/test-fixtures/src/naval-fixture';
import { refreshAuthoredSight } from '../../packages/test-fixtures/src/authored-land';

function issue(state: GameState, command: GameCommand) { const result = applyCommand(state, command); if (!result.ok) throw new Error(`Naval scenario ${command.type}: ${result.error}`); }
async function importCampaign(page: Page, state: GameState) {
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'witness-seas.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
}
async function selectArmy(page: Page, name: string) {
  await openRegistry(page, 'armies');
  await selectFromRegistry(page, 'armies', new RegExp(`^${name} `)); await openSelectedOrders(page);
}
async function review(page: Page, cell: number) {
  await openSelectedOrders(page);
  await page.getByRole('spinbutton', { name: 'Destination hex', exact: true }).fill(String(cell));
  await page.getByRole('button', { name: 'Review route', exact: true }).click();
  await expect(page.getByTestId('route-preview')).toContainText(`hex ${cell}`);
}
async function endTurn(page: Page) {
  const turn = await page.evaluate(() => window.__THEANDRIL__!.getTurn());
  await closeManagement(page);
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getTurn())).toBe(turn + 1);
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
}
async function research(page: Page, name: string) {
  await closeManagement(page);
  await page.getByRole('button', { name: 'Realm progression', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Realm progression', exact: true });
  await dialog.getByRole('button', { name: `Research ${name}`, exact: true }).click();
  await expect(dialog.getByRole('button', { name: `Research ${name}`, exact: true })).toBeDisabled();
  await dialog.getByRole('button', { name: 'Close realm progression', exact: true }).click();
}
async function saveReload(page: Page) {
  await closeManagement(page);
  const options = page.locator('.campaign-options');
  if (!await options.evaluate(element => (element as HTMLDetailsElement).open)) await options.locator('summary').click();
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  const hash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  await page.reload(); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);
}

test('an embarked expedition crosses researched deep ocean by a saved queued voyage, with no duplicate passenger marker', async ({ page }, testInfo) => {
  const state = navalCampaign({ enemyFleet: false }), cargoIds = state.armies[N.cargoId]!.formations.map(item => item.id);
  await importCampaign(page, state); await selectArmy(page, N.cargoName);
  await expect(page.getByTestId('naval-transport')).toContainText('can drown passengers');
  await page.getByRole('button', { name: 'Embark army', exact: true }).click();
  await openSelectedOrders(page);
  await expect(page.getByRole('button', { name: 'Review route', exact: true })).toBeDisabled();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.ownArmies.find(army => army.id === 'army.9')!.carrierId)).toBe(N.fleetId);
  await page.getByRole('button', { name: 'Select carrying fleet', exact: true }).click();
  await openSelectedOrders(page);
  await expect(page.getByTestId('transport-capacity')).toHaveText('Passengers: 2 / 24 formation spaces');
  await review(page, N.deepCell);
  await expect(page.getByTestId('route-preview')).toContainText('Deep ocean requires Ocean navigation');
  await expect(page.getByRole('button', { name: 'Queue route', exact: true })).toBeDisabled();
  await research(page, 'Ocean navigation');
  await selectArmy(page, N.coastalName); await review(page, N.deepCell);
  await expect(page.getByTestId('route-preview')).toContainText('ocean-capable hull');
  await selectArmy(page, N.fleetName);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()?.visibleEntityArt.find(item => item.entityId === 'army.2'))).toMatchObject({ assetId: 'unit.transport.ashen_compact', role: 'unit.transport', presentation: 'faction', nativeWidth: 96, nativeHeight: 96, tint: 0xffffff });
  expect(await page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.visibleEntityArt.some(item => item.entityId === 'army.9'))).toBe(false);
  expect(await page.evaluate(cell => window.__THEANDRIL__!.getTerrainArt(cell), N.shallowCell)).toMatchObject({ waterDepth: 1, waterPresentation: 'shallows' });
  expect(await page.evaluate(cell => window.__THEANDRIL__!.getTerrainArt(cell), N.deepCell)).toMatchObject({ waterDepth: 2, waterPresentation: 'deep' });
  await closeManagement(page);
  await page.getByTestId('map-container').scrollIntoViewIfNeeded();
  const point = await page.evaluate(cell => window.__THEANDRIL__!.getCellScreenPoint(cell), N.fleetCell);
  expect(point?.inViewport).toBe(true);
  await page.keyboard.press('Escape'); await page.mouse.click(point!.x, point!.y);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSelection().armyId)).toBe(N.fleetId);
  await page.screenshot({ path: testInfo.outputPath('coastal-depths-and-approved-fleets.png') });
  await review(page, N.landingWaterCell); await page.getByRole('button', { name: 'Queue route', exact: true }).click();
  await openSelectedOrders(page);
  await expect(page.getByTestId('queued-route')).toBeVisible();
  await saveReload(page);
  for (let round = 0; round < 5; round++) {
    const fleet = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.ownArmies.find(army => army.id === 'army.2')!);
    if (fleet.cell === N.landingWaterCell && fleet.movement > 0) break;
    await endTurn(page);
  }
  const arrived = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.ownArmies);
  expect(arrived.find(army => army.id === N.fleetId)?.cell).toBe(N.landingWaterCell);
  expect(arrived.find(army => army.id === N.cargoId)).toMatchObject({ cell: N.landingWaterCell, carrierId: N.fleetId, movement: 0 });
  await page.setViewportSize({ width: 390, height: 844 });
  await selectArmy(page, N.cargoName);
  await page.getByRole('combobox', { name: 'Landing shore', exact: true }).selectOption(String(N.landingCell));
  const land = page.getByRole('button', { name: 'Disembark army', exact: true });
  await land.evaluate(element => element.scrollIntoView({ block: 'center' }));
  expect(await land.evaluate(element => { const bounds = element.getBoundingClientRect(); const hit = document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2); return hit === element || element.contains(hit); })).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('transport-landing-narrow.png') });
  await land.click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.ownArmies.find(army => army.id === 'army.9')!.carrierId)).toBe(null);
  const cargo = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.ownArmies.find(army => army.id === 'army.9')!);
  expect(cargo).toMatchObject({ cell: N.landingCell, movement: 0 }); expect(cargo.formations.map(item => item.id)).toEqual(cargoIds);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await saveReload(page);
});

test('harbor recruitment launches real hulls and an adjacent harbor marshal takes command of a fleet', async ({ page }, testInfo) => {
  await importCampaign(page, navalCampaign({ enemyFleet: false }));
  await openRegistry(page, 'settlements');
  await selectFromRegistry(page, 'settlements', new RegExp(N.homeName)); await openSelectedOrders(page);
  await openProduction(page, 'naval');
  const production = page.getByTestId('production-naval');
  await expect(production.getByRole('button', { name: 'Recruit Deepwake warship', exact: true })).toBeDisabled();
  await expect(production).toContainText('Research Ocean navigation first');
  await production.getByRole('button', { name: 'Recruit Charter transport', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.ownSettlements.find(town => town.id === 'settlement.5')!.queue[0]?.itemId)).toBe('unit.transport');
  const initialIds = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.ownArmies.map(army => army.id));
  for (let round = 0; round < 8; round++) {
    if (await page.evaluate(ids => window.__THEANDRIL__!.getSummary()!.ownArmies.some(army => !ids.includes(army.id) && army.domain === 'naval'), initialIds)) break;
    await endTurn(page);
  }
  const launched = await page.evaluate(ids => window.__THEANDRIL__!.getSummary()!.ownArmies.find(army => !ids.includes(army.id) && army.domain === 'naval'), initialIds);
  expect(launched).toBeTruthy(); expect(launched?.formations[0]?.unitId).toBe('unit.transport');
  expect(await page.evaluate(cell => window.__THEANDRIL__!.getTerrainArt(cell!)?.terrain, launched?.cell)).toBe(0);
  await selectArmy(page, N.fleetName);
  const before = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.ownArmies.find(army => army.id === 'army.2')!.movement);
  await page.getByRole('button', { name: `Manage characters for ${N.fleetName}`, exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Characters & agents', exact: true });
  await dialog.getByRole('combobox', { name: 'Assign to army', exact: true }).selectOption(N.fleetId);
  await dialog.getByRole('button', { name: 'Assign character', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.ownArmies.find(army => army.id === 'army.2')!.formationCapacity)).toBe(16);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.ownArmies.find(army => army.id === 'army.2')!.movement)).toBe(before - 1);
  const fleetSelection = await page.evaluate(() => window.__THEANDRIL__!.getSelection());
  expect(fleetSelection).toMatchObject({ armyId: N.fleetId, cell: N.fleetCell });
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSelection())).toEqual(fleetSelection);
  await expect(page.getByRole('button', { name: `Manage characters for ${N.fleetName}`, exact: true })).toBeFocused();
  await page.getByRole('region', { name: 'Army commander and agents', exact: true }).screenshot({ path: testInfo.outputPath('marshal-led-transport-fleet.png') });
  await saveReload(page);
});

test('a saved naval battle resolves exact transport casualties without deploying its passengers as ships', async ({ page }, testInfo) => {
  let state = navalCampaign();
  const fleet = state.armies[N.fleetId]!, enemy = state.armies[N.enemyFleetId]!;
  for (const formation of fleet.formations) { formation.strength = 4; formation.morale = 30; }
  enemy.cell = N.shallowCell;
  enemy.formations = Array.from({ length: 6 }, () => createArmyFormation(`army.${state.nextId++}`, 'unit.ocean_warship')).sort((a, b) => a.id < b.id ? -1 : 1);
  refreshAuthoredSight(state);
  state = deserializeGame(serializeGame(state));
  const expected = deserializeGame(serializeGame(state));
  const orders: GameCommand[] = [
    { type: 'embarkArmy', factionId: state.turnOwnerId, armyId: N.cargoId, fleetId: N.fleetId },
    { type: 'declareWar', factionId: state.turnOwnerId, targetFactionId: state.factions[1]!.id },
    { type: 'attack', factionId: state.turnOwnerId, armyId: N.fleetId, targetArmyId: N.enemyFleetId },
  ];
  orders.forEach(command => issue(expected, command));
  issue(expected, { type: 'battleOrder', factionId: state.turnOwnerId, order: 'brace' });
  const expectedRound = expected.battle?.combat.round ?? null;
  if (expected.battle) issue(expected, { type: 'autoResolveBattle', factionId: state.turnOwnerId });
  expect(expected.battleReports.at(-1)!.transportAftermath).toEqual([expect.objectContaining({ armyId: N.cargoId, outcome: 'lost' })]);
  await importCampaign(page, state); await selectArmy(page, N.cargoName);
  await page.getByRole('button', { name: 'Embark army', exact: true }).click();
  await page.getByRole('button', { name: 'Select carrying fleet', exact: true }).click();
  await openSelectedOrders(page);
  await openRealmAffairs(page);
  await page.getByRole('button', { name: `Declare war on ${state.factions[1]!.name}`, exact: true }).click();
  await openSelectedOrders(page);
  await page.getByRole('button', { name: `Attack ${N.enemyFleetName} (${N.enemyFleetId})`, exact: true }).click();
  const battle = page.getByTestId('battle-panel');
  await expect(battle.getByRole('heading', { name: /Naval battle/ })).toBeVisible();
  await battle.locator('summary').filter({ hasText: 'Formation details & round account' }).click();
  await expect(battle.getByRole('table', { name: 'Attacking formations', exact: true }).locator('tbody tr')).toHaveCount(3);
  await expect(battle).not.toContainText('Hearth caravan');
  await saveReload(page);
  await battle.screenshot({ path: testInfo.outputPath('saved-naval-battle.png') });
  await page.getByRole('button', { name: 'Brace', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.battle?.combat.round ?? null)).toBe(expectedRound);
  if (expectedRound !== null) await page.getByRole('button', { name: 'Auto-resolve battle', exact: true }).click();
  await openCampaignJournal(page);
  await expect(page.getByTestId('transport-aftermath').first()).toContainText('the entire army');
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(stateHash(expected));
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.ownArmies.some(army => army.id === 'army.9'))).toBe(false);
  await page.getByTestId('battle-report').first().screenshot({ path: testInfo.outputPath('actual-passenger-losses.png') });
});
