import { expect, test, type Page } from '@playwright/test';
import { CHARTER_RESERVE, applyCommand, createGame, deserializeGame, serializeGame, type GameCommand, type GameState } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { cellsWithin } from '../../packages/sim/src/visibility';
import { closeManagement, openRegistry, openSelectedOrders, selectFromRegistry } from './ui-navigation';

function issue(state: GameState, command: GameCommand) { const result = applyCommand(state, command); if (!result.ok) throw new Error(result.error); }
/** One hearth with an empty queue and coin to spend, so the journey measures the charter. */
function charterScene(): GameState {
  const state = createGame({ generatorVersion: 4, seed: 17, size: 'tiny', factionCount: 1, pace: 'standard' });
  const origin = state.armies['army.1']!.cell;
  for (const cell of cellsWithin(state, origin, 3)) {
    state.world.terrain[cell] = 1; state.world.biome[cell] = 7; state.world.waterDepth[cell] = 0; state.world.fertility[cell] = 80;
    delete state.resources.deposits[cell];
  }
  issue(state, { type: 'found', factionId: state.turnOwnerId, armyId: 'army.1', name: 'Charter Hearth' });
  state.factions[0]!.treasury = 400;
  return deserializeGame(serializeGame(state));
}
async function endTurn(page: Page) {
  const turn = await page.evaluate(() => window.__THEANDRIL__!.getTurn());
  await closeManagement(page);
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getTurn())).toBe(turn + 1);
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
}

test('a standing charter keeps a hearth building, states its next work, and is revoked from the same panel', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'charters.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(charterScene()))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await openRegistry(page, 'settlements');
  await selectFromRegistry(page, 'settlements', /Charter Hearth/);
  await openSelectedOrders(page);

  // The panel explains the bargain before anything is granted.
  const charter = page.getByTestId('settlement-charter');
  await charter.locator(':scope > summary').click();
  await expect(charter).toContainText('never replaces an order you place yourself');
  await expect(charter).toContainText(`${CHARTER_RESERVE} coin in the treasury`);
  await expect(charter.locator(':scope > summary')).toContainText('none');

  await charter.getByLabel('Focus').selectOption('wealth');
  await charter.getByLabel('Coin ceiling').fill('24');
  await charter.getByRole('button', { name: 'Grant charter', exact: true }).click();
  await expect(charter.locator(':scope > summary')).toContainText('Wealth · 24 coin');
  // A Wealth charter reaches past the cheap works for the coin building.
  await expect(charter).toContainText('Next: Charter market.');

  await endTurn(page);
  // The charter placed a real order, recorded like any other, and now waits for
  // the queue it filled: its next work is the hearth's next unbuilt building.
  await closeManagement(page);
  await page.getByRole('button', { name: 'Campaign journal', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Campaign journal' })).toContainText('Wealth charter ordered Charter market for 10 coin');
  await closeManagement(page);
  await selectFromRegistry(page, 'settlements', /Charter Hearth/);
  await openSelectedOrders(page);

  const revoked = page.getByTestId('settlement-charter');
  await revoked.locator(':scope > summary').click();
  await revoked.getByRole('button', { name: 'Revoke charter', exact: true }).click();
  await expect(revoked.locator(':scope > summary')).toContainText('none');
  expect(errors).toEqual([]);
});
