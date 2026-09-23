import { expect, test } from '@playwright/test';
import { applyCommand, createArmyFormation, createGame, deserializeGame, DEPOT_COIN, serializeGame, SUPPLY_ATTRITION, type GameCommand, type GameState } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { cellsWithin, rebuildIndexes } from '../../packages/sim/src/visibility';
import { closeManagement, openRegistry, openSelectedOrders, selectFromRegistry } from './ui-navigation';

function issue(state: GameState, command: GameCommand) { const result = applyCommand(state, command); if (!result.ok) throw new Error(result.error); }
/** A three-company force standing well beyond the reach of its only hearth. */
function starvingScene(): GameState {
  const state = createGame({ generatorVersion: 4, seed: 17, size: 'standard', factionCount: 1, pace: 'standard' });
  const origin = state.armies['army.1']!.cell;
  for (const cell of cellsWithin(state, origin, 9)) {
    state.world.terrain[cell] = 1; state.world.biome[cell] = 7; state.world.waterDepth[cell] = 0; state.world.fertility[cell] = 80;
    delete state.resources.deposits[cell];
  }
  state.explored[state.turnOwnerId] = new Set(state.world.terrain.keys());
  issue(state, { type: 'found', factionId: state.turnOwnerId, armyId: 'army.1', name: 'Supply Hearth' });
  const townCell = Object.values(state.settlements)[0]!.cell;
  const distant = [...cellsWithin(state, townCell, 7)].find(cell => !cellsWithin(state, townCell, 4).includes(cell))!;
  const armyId = `army.${state.nextId++}`;
  state.armies[armyId] = { id: armyId, factionId: state.turnOwnerId, name: 'Far column', cell: distant, movement: 2,
    formations: ['unit.guard', 'unit.spearman', 'unit.heavy_infantry'].map(unitId => ({ ...createArmyFormation(armyId, unitId), id: `formation.${state.nextId++}` })) };
  rebuildIndexes(state);
  return deserializeGame(serializeGame(state));
}

test('a force outside supply says what it costs, is named in the turn list, and can raise a depot to feed itself', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'supply.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(starvingScene()))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');

  // The grouped turn list names supply ahead of ordinary idleness.
  const causes = page.getByTestId('next-action-causes');
  await causes.locator(':scope > summary').click();
  await causes.getByRole('button', { name: '1 company out of supply', exact: true }).click();
  await expect(page.getByTestId('next-action-notice')).toContainText('Out of supply');

  await openRegistry(page, 'armies');
  await selectFromRegistry(page, 'armies', /Far column/);
  await openSelectedOrders(page);
  await expect(page.getByTestId('army-supply')).toContainText(`loses ${SUPPLY_ATTRITION} strength a turn`);

  // Rules 28: the same column raises a depot where it stands and is fed by it.
  const depot = page.getByTestId('build-depot');
  await expect(depot).toContainText('feeds the ground two hexes around it');
  await depot.getByRole('button', { name: `Raise a supply depot · ${DEPOT_COIN} coin`, exact: true }).click();
  await expect(page.getByTestId('army-supply')).toContainText('Supplied from the depot at hex');
  // Standing on its own depot, the panel offers to pull it down instead.
  await expect(depot).toContainText('Pulling it down stops its upkeep at once');
  // The supply overlay draws the ground the realm can feed, and can be turned off.
  await closeManagement(page);
  await page.getByRole('button', { name: 'Map guide', exact: true }).click();
  const supplyToggle = page.getByTestId('toggle-supply');
  await expect(supplyToggle).toHaveAttribute('aria-pressed', 'true');
  await supplyToggle.click();
  await expect(supplyToggle).toHaveAttribute('aria-pressed', 'false');
  await expect(supplyToggle).toContainText('Show supply overlay');
  await closeManagement(page);

  await openRegistry(page, 'armies');
  await selectFromRegistry(page, 'armies', /Far column/);
  await openSelectedOrders(page);
  await page.getByTestId('build-depot').getByRole('button', { name: 'Pull down this depot', exact: true }).click();
  await expect(page.getByTestId('army-supply')).toContainText('Out of supply');

  // The company standing in the hearth is fed, and the panel names the hearth.
  await selectFromRegistry(page, 'armies', /Wayfinder/);
  await openSelectedOrders(page);
  await expect(page.getByTestId('army-supply')).toContainText('Supplied from Supply Hearth');
  expect(errors).toEqual([]);
});
