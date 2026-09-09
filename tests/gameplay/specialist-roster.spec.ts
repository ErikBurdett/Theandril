import { expect, test } from '@playwright/test';
import { UNITS } from '@theandril/content';
import { SHARED_UNIT_ART } from '@theandril/art-pipeline/runtime';
import { applyCommand, createGame, serializeGame, stateHash, type GameCommand, type GameState } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { closeManagement, openProduction, selectFromRegistry } from './ui-navigation';

function issue(state: GameState, command: GameCommand) { const result = applyCommand(state, command); if (!result.ok) throw new Error(result.error); }
/** Earned setup: ordinary founding, paid buildings and elapsed production/knowledge. */
function preparedHearth() {
  const state = createGame({ seed: 20260908, size: 'tiny', factionCount: 1, pace: 'epic' }), factionId = state.turnOwnerId;
  issue(state, { type: 'found', factionId, armyId: 'army.1', name: 'Long hearth' });
  const town = Object.values(state.settlements)[0]!;
  for (const itemId of ['building.granary', 'building.workshop', 'building.market', 'building.archive']) issue(state, { type: 'queue', factionId, settlementId: town.id, itemId });
  for (let turn = 0; (town.queue.length || state.factions[0]!.knowledge < 180 || state.factions[0]!.treasury < 96) && turn < 100; turn++) issue(state, { type: 'endTurn', factionId });
  expect(town.queue).toHaveLength(0); expect(state.factions[0]!.knowledge).toBeGreaterThanOrEqual(180);
  return state;
}

test('research and paid specialist recruits survive save/load with honest shared silhouettes at desktop and narrow sizes', async ({ page }, testInfo) => {
  const state = preparedHearth(), factionId = state.turnOwnerId, town = Object.values(state.settlements)[0]!;
  const specialists = UNITS.filter(unit => unit.introducedInRules === 15);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'earned-specialist-hearth.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await selectFromRegistry(page, 'settlements', town.name); await openProduction(page, 'land');
  for (const unit of specialists) await expect(page.getByRole('button', { name: `Recruit ${unit.name}`, exact: true })).toBeDisabled();
  await closeManagement(page);
  await page.getByRole('button', { name: 'Realm progression', exact: true }).click();
  const progression = page.getByRole('dialog', { name: 'Realm progression', exact: true });
  for (const [technologyId, name] of [['technology.cinder_masonry', 'Cinder masonry'], ['technology.stewardship', 'Seasonal stewardship'], ['technology.quarry_cranes', 'Counterweighted cranes'], ['technology.surveyed_estates', 'Surveyed estates']]) {
    await progression.getByRole('button', { name: `Research ${name}`, exact: true }).click();
    issue(state, { type: 'research', factionId, technologyId: technologyId! });
    await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(stateHash(state));
  }
  await page.keyboard.press('Escape'); await openProduction(page, 'land');
  for (const unit of specialists) {
    const card = page.getByTestId(`production-card-${unit.id}`), art = card.locator('.faction-art');
    await card.scrollIntoViewIfNeeded();
    await expect(art).toHaveAttribute('data-art-state', 'shared');
    await expect(art).toHaveAttribute('data-art-rendered-id', `${SHARED_UNIT_ART[unit.id]!.role}.ashen_compact`);
    await expect(art).toHaveAttribute('title', /shared .* silhouette/);
    await page.getByRole('button', { name: `Recruit ${unit.name}`, exact: true }).click();
    issue(state, { type: 'queue', factionId, settlementId: town.id, itemId: unit.id });
    await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(stateHash(state));
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByTestId('production-card-unit.lancer').scrollIntoViewIfNeeded();
  await expect(page.getByRole('button', { name: 'Recruit Road lancers', exact: true })).toBeInViewport();
  await page.screenshot({ path: testInfo.outputPath('specialist-recruitment-narrow.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await closeManagement(page);
  await page.getByTestId('campaign-menu').locator('summary').click();
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  await page.reload(); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(stateHash(state));
  await page.setViewportSize({ width: 1440, height: 1000 });
  const menu = page.getByTestId('campaign-menu'); if (await menu.getAttribute('open') !== null) await menu.locator('summary').click();
  for (let turns = 0; town.queue.length && turns < 30; turns++) {
    await page.getByRole('button', { name: 'End turn', exact: true }).click();
    issue(state, { type: 'endTurn', factionId });
    await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(stateHash(state));
  }
  expect(town.queue).toHaveLength(0);
  for (const unit of specialists) {
    const army = Object.values(state.armies).find(army => army.formations[0]?.unitId === unit.id)!;
    expect(army).toBeDefined();
    await selectFromRegistry(page, 'armies', army.name);
    await page.getByRole('button', { name: 'Focus selection', exact: true }).click();
    await expect.poll(() => page.evaluate(id => window.__THEANDRIL__!.getArtDiagnostics()!.visibleEntityArt.find(item => item.entityId === id), army.id)).toMatchObject({ role: unit.id, assetId: `${SHARED_UNIT_ART[unit.id]!.role}.ashen_compact`, presentation: 'shared', tint: 0xffffff });
    await page.getByTestId('map-container').screenshot({ path: testInfo.outputPath(`${unit.id}-map.png`) });
  }
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(stateHash(state));
  expect(errors).toEqual([]);
});
