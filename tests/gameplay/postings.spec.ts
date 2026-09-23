import { expect, test, type Page } from '@playwright/test';
import { applyCommand, createGame, deserializeGame, serializeGame, type GameCommand, type GameState } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { cellsWithin } from '../../packages/sim/src/visibility';
import { closeManagement, openRegistry, openSelectedOrders, selectFromRegistry } from './ui-navigation';

function issue(state: GameState, command: GameCommand) { const result = applyCommand(state, command); if (!result.ok) throw new Error(result.error); }
/** Two hearths on clear ground, so a muster point has somewhere to name. */
function musterScene(): GameState {
  const state = createGame({ generatorVersion: 4, seed: 17, size: 'tiny', factionCount: 1, pace: 'standard' });
  const origin = state.armies['army.1']!.cell;
  for (const cell of cellsWithin(state, origin, 5)) {
    state.world.terrain[cell] = 1; state.world.biome[cell] = 7; state.world.waterDepth[cell] = 0; state.world.fertility[cell] = 80;
    delete state.resources.deposits[cell];
  }
  issue(state, { type: 'found', factionId: state.turnOwnerId, armyId: 'army.1', name: 'Muster Hearth' });
  state.factions[0]!.treasury = 2000;
  return deserializeGame(serializeGame(state));
}
async function endTurn(page: Page) {
  const turn = await page.evaluate(() => window.__THEANDRIL__!.getTurn());
  await closeManagement(page);
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getTurn())).toBe(turn + 1);
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
}

test('an army is posted from real controls, states where it stands, and a hearth musters what it raises', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'postings.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(musterScene()))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');

  await openRegistry(page, 'armies');
  await selectFromRegistry(page, 'armies', /Wayfinder/);
  await openSelectedOrders(page);
  const posting = page.getByTestId('army-posting');
  await posting.locator(':scope > summary').click();
  await expect(posting).toContainText('A travel order you give yourself always comes first');
  await expect(posting.locator(':scope > summary')).toContainText('none');

  // The company stands on the realm's only hearth, so that hex is its one rally
  // point; the panel names it rather than showing a bare number.
  await posting.getByLabel('Posted to').selectOption({ index: 0 });
  await posting.getByLabel('On arrival').selectOption('hold');
  await posting.getByRole('button', { name: 'Post army', exact: true }).click();
  await expect(posting.locator(':scope > summary')).toContainText('Hold · Muster Hearth');
  await expect(posting).toContainText(/Standing at its posting\.|Marching to its posting\./);

  // The hearth names a muster point, and says what that means for what it raises.
  await closeManagement(page);
  await openRegistry(page, 'settlements');
  await selectFromRegistry(page, 'settlements', /Muster Hearth/);
  await openSelectedOrders(page);
  const muster = page.getByTestId('settlement-muster');
  await muster.locator(':scope > summary').click();
  await expect(muster).toContainText('posted to the muster point the turn it forms');
  await muster.getByRole('button', { name: 'Set muster point', exact: true }).click();
  await expect(muster.locator(':scope > summary')).toContainText('Muster Hearth');

  await endTurn(page);
  await selectFromRegistry(page, 'settlements', /Muster Hearth/);
  await openSelectedOrders(page);
  const kept = page.getByTestId('settlement-muster');
  await kept.locator(':scope > summary').click();
  await expect(kept.locator(':scope > summary')).toContainText('Muster Hearth');
  await kept.getByRole('button', { name: 'Clear muster point', exact: true }).click();
  await expect(kept.locator(':scope > summary')).toContainText('none');
  expect(errors).toEqual([]);
});
