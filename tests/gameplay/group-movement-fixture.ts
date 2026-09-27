import { readFile } from 'node:fs/promises';
import { expect, type Page } from '@playwright/test';
import { applyCommand, createGame, deserializeGame, serializeGame, type GameCommand, type GameState } from '@theandril/sim';
import { deserializeCampaign, exportSave, importSave } from '@theandril/persistence';
import { replayArchive } from '@theandril/chronicle';
import { empireLandCampaign } from '../../packages/test-fixtures/src/empire-land-fixture';
import { refreshAuthoredSight } from '../../packages/test-fixtures/src/authored-land';
import { closeManagement, openRegistry } from './ui-navigation';

export function order(game: GameState, command: GameCommand) {
  const result = applyCommand(game, command);
  if (!result.ok) throw new Error(`Invalid group travel setup: ${result.error}`);
}

/** Authored ownership/position, not earned conquest. Preserve the generated world
 * outside one empty local corridor; remove deposits only in rewritten cells. */
export function matureTravel() {
  let game = empireLandCampaign('legendary');
  const owner = game.turnOwnerId, width = game.world.width;
  const own = Object.values(game.armies).filter(army => army.factionId === owner).sort((a, b) => a.id < b.id ? -1 : 1);
  const occupied = new Set([
    ...Object.values(game.armies).filter(army => army.factionId !== owner).map(army => army.cell),
    ...Object.values(game.land.settlements).flatMap(land => land.claimed),
  ]);
  let patch: number[] = [], origin = -1;
  for (let row = 8; row < game.world.height - 8 && origin < 0; row += 8) {
    const candidate = Array.from({ length: 9 }, (_, y) => Array.from({ length: 32 }, (_, x) => (row + y) * width + 20 + x)).flat();
    if (candidate.some(cell => occupied.has(cell))) continue;
    patch = candidate; origin = (row + 4) * width + 24;
  }
  if (origin < 0 || own.length !== 100) throw new Error('The mature travel fixture needs an empty corridor and 100 owned armies.');
  for (const cell of patch) {
    game.world.terrain[cell] = 1; game.world.biome[cell] = 1;
    game.world.waterDepth[cell] = 0; game.world.fertility[cell] = 60;
    delete game.resources.deposits[cell];
    game.explored[owner]!.add(cell);
  }
  own.forEach((army, index) => { army.cell = origin; army.name = `Travel company ${String(index + 1).padStart(3, '0')}`; });
  refreshAuthoredSight(game);
  game = deserializeGame(serializeGame(game));
  for (const army of own.slice(0, 3)) order(game, { type: 'setPosting', factionId: owner, armyId: army.id, cell: origin, mode: 'hold' });
  order(game, { type: 'setSelectionGroup', factionId: owner, kind: 'armies', name: 'Roadward hundred', memberIds: own.map(army => army.id) });
  return { game, own: own.map(army => ({ id: army.id, name: army.name })), origin, target: origin + 14, appendTarget: origin + 20, patch };
}

/** This tiny gallery replaces its whole geography, so its complete deposit layer
 * is explicitly empty. Imported state still crosses the real strict loader. */
export function smallTravel(options: { refused?: boolean; paused?: boolean } = {}) {
  let game = createGame({ generatorVersion: 4, seed: 20260905, size: 'tiny', pace: 'short', factionCount: 2 });
  const origin = 500, target = origin + 8;
  game.world.terrain.fill(1); game.world.biome.fill(1); game.world.waterDepth.fill(0); game.world.fertility.fill(60);
  game.resources.deposits = {};
  Object.assign(game.armies['army.1']!, { cell: options.refused ? target : origin, name: 'Travel caravan' });
  Object.assign(game.armies['army.2']!, { cell: origin, name: 'Travel scouts' });
  delete game.armies['army.3'];
  if (options.paused) Object.assign(game.armies['army.4']!, { cell: origin + 54, name: 'Blocking patrol' });
  else delete game.armies['army.4'];
  for (const faction of game.factions) game.explored[faction.id] = new Set(game.world.terrain.keys());
  refreshAuthoredSight(game);
  game = deserializeGame(serializeGame(game));
  if (options.paused) {
    order(game, { type: 'queueMovement', factionId: game.turnOwnerId, armyId: 'army.2', target });
    order(game, { type: 'move', factionId: game.factions[1]!.id, armyId: 'army.4', target: origin + 6 });
    order(game, { type: 'endTurn', factionId: game.turnOwnerId });
    if (game.routes['army.2']?.status !== 'paused') throw new Error('The real foreign move must interrupt the scout route.');
  }
  order(game, { type: 'setPosting', factionId: game.turnOwnerId, armyId: 'army.2', cell: origin, mode: 'hold' });
  return { game, origin, target };
}

export async function importTravel(page: Page, game: GameState) {
  await page.goto('/');
  await page.getByLabel('Import save file').setInputFiles({ name: 'group-travel.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(game))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
}
export async function campaignMenu(page: Page) {
  await closeManagement(page);
  const menu = page.getByTestId('campaign-menu');
  if (await menu.getAttribute('open') === null) await menu.locator(':scope > summary').click();
}
export async function exportedTravel(page: Page) {
  await campaignMenu(page);
  const next = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export campaign', exact: true }).click();
  const path = await (await next).path(); expect(path).toBeTruthy();
  const bytes = await readFile(path!), text = await importSave(bytes), campaign = deserializeCampaign(text);
  expect(serializeGame(replayArchive(campaign.archive))).toBe(serializeGame(campaign.game));
  return { bytes, text, ...campaign };
}
export async function travelPanel(page: Page, selectAll = false, keyboard = false) {
  await openRegistry(page, 'armies');
  if (selectAll) {
    await page.getByRole('searchbox', { name: 'Search your realm' }).fill('');
    await page.getByTestId('group-postings').getByRole('button', { name: 'Select matching armies', exact: true }).click();
  }
  const panel = page.getByTestId('group-movement');
  if (await panel.getAttribute('open') === null) {
    if (keyboard) { await panel.locator(':scope > summary').focus(); await page.keyboard.press('Enter'); }
    else await panel.locator(':scope > summary').click();
  }
  return panel;
}
export async function reviewTravel(page: Page, target: number, append = false) {
  const panel = await travelPanel(page);
  await panel.getByRole('combobox', { name: 'Travel destination', exact: true }).selectOption('hex');
  await panel.getByRole('spinbutton', { name: 'Destination hex', exact: true }).fill(String(target));
  await panel.getByRole('combobox', { name: 'Route mode', exact: true }).selectOption(append ? 'append' : 'replace');
  await panel.getByRole('button', { name: 'Review routes', exact: true }).click();
  await expect(page.getByTestId('group-movement-preview')).toContainText(`Destination hex ${target}`);
  return panel;
}
