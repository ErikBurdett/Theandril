# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: group-patrol-assignment.spec.ts >> a group-assigned patrol travels out and back in a generated campaign
- Location: tests/production/group-patrol-assignment.spec.ts:82:1

# Error details

```
Error: locator.click: Target crashed 
Call log:
  - waiting for getByTestId('campaign-menu').locator(':scope > summary')

```

# Test source

```ts
  1   | import { readFile } from 'node:fs/promises';
  2   | import { expect, type Page } from '@playwright/test';
  3   | import { applyCommand, createGame, deserializeGame, serializeGame, type GameCommand, type GameState } from '@theandril/sim';
  4   | import { deserializeCampaign, exportSave, importSave } from '@theandril/persistence';
  5   | import { replayArchive } from '@theandril/chronicle';
  6   | import { empireLandCampaign } from '../../packages/test-fixtures/src/empire-land-fixture';
  7   | import { refreshAuthoredSight } from '../../packages/test-fixtures/src/authored-land';
  8   | import { closeManagement, openRegistry } from './ui-navigation';
  9   | 
  10  | export function order(game: GameState, command: GameCommand) {
  11  |   const result = applyCommand(game, command);
  12  |   if (!result.ok) throw new Error(`Invalid group travel setup: ${result.error}`);
  13  | }
  14  | 
  15  | /** Authored ownership/position, not earned conquest. Preserve the generated world
  16  |  * outside one empty local corridor; remove deposits only in rewritten cells. */
  17  | export function matureTravel() {
  18  |   let game = empireLandCampaign('legendary');
  19  |   const owner = game.turnOwnerId, width = game.world.width;
  20  |   const own = Object.values(game.armies).filter(army => army.factionId === owner).sort((a, b) => a.id < b.id ? -1 : 1);
  21  |   const occupied = new Set([
  22  |     ...Object.values(game.armies).filter(army => army.factionId !== owner).map(army => army.cell),
  23  |     ...Object.values(game.land.settlements).flatMap(land => land.claimed),
  24  |   ]);
  25  |   let patch: number[] = [], origin = -1;
  26  |   for (let row = 8; row < game.world.height - 8 && origin < 0; row += 8) {
  27  |     const candidate = Array.from({ length: 9 }, (_, y) => Array.from({ length: 32 }, (_, x) => (row + y) * width + 20 + x)).flat();
  28  |     if (candidate.some(cell => occupied.has(cell))) continue;
  29  |     patch = candidate; origin = (row + 4) * width + 24;
  30  |   }
  31  |   if (origin < 0 || own.length !== 100) throw new Error('The mature travel fixture needs an empty corridor and 100 owned armies.');
  32  |   for (const cell of patch) {
  33  |     game.world.terrain[cell] = 1; game.world.biome[cell] = 1;
  34  |     game.world.waterDepth[cell] = 0; game.world.fertility[cell] = 60;
  35  |     delete game.resources.deposits[cell];
  36  |     game.explored[owner]!.add(cell);
  37  |   }
  38  |   own.forEach((army, index) => { army.cell = origin; army.name = `Travel company ${String(index + 1).padStart(3, '0')}`; });
  39  |   refreshAuthoredSight(game);
  40  |   game = deserializeGame(serializeGame(game));
  41  |   for (const army of own.slice(0, 3)) order(game, { type: 'setPosting', factionId: owner, armyId: army.id, cell: origin, mode: 'hold' });
  42  |   order(game, { type: 'setSelectionGroup', factionId: owner, kind: 'armies', name: 'Roadward hundred', memberIds: own.map(army => army.id) });
  43  |   return { game, own: own.map(army => ({ id: army.id, name: army.name })), origin, target: origin + 14, appendTarget: origin + 20, patch };
  44  | }
  45  | 
  46  | /** This tiny gallery replaces its whole geography, so its complete deposit layer
  47  |  * is explicitly empty. Imported state still crosses the real strict loader. */
  48  | export function smallTravel(options: { refused?: boolean; paused?: boolean } = {}) {
  49  |   let game = createGame({ generatorVersion: 4, seed: 20260905, size: 'tiny', pace: 'short', factionCount: 2 });
  50  |   const origin = 500, target = origin + 8;
  51  |   game.world.terrain.fill(1); game.world.biome.fill(1); game.world.waterDepth.fill(0); game.world.fertility.fill(60);
  52  |   game.resources.deposits = {};
  53  |   Object.assign(game.armies['army.1']!, { cell: options.refused ? target : origin, name: 'Travel caravan' });
  54  |   Object.assign(game.armies['army.2']!, { cell: origin, name: 'Travel scouts' });
  55  |   delete game.armies['army.3'];
  56  |   if (options.paused) Object.assign(game.armies['army.4']!, { cell: origin + 54, name: 'Blocking patrol' });
  57  |   else delete game.armies['army.4'];
  58  |   for (const faction of game.factions) game.explored[faction.id] = new Set(game.world.terrain.keys());
  59  |   refreshAuthoredSight(game);
  60  |   game = deserializeGame(serializeGame(game));
  61  |   if (options.paused) {
  62  |     order(game, { type: 'queueMovement', factionId: game.turnOwnerId, armyId: 'army.2', target });
  63  |     order(game, { type: 'move', factionId: game.factions[1]!.id, armyId: 'army.4', target: origin + 6 });
  64  |     order(game, { type: 'endTurn', factionId: game.turnOwnerId });
  65  |     if (game.routes['army.2']?.status !== 'paused') throw new Error('The real foreign move must interrupt the scout route.');
  66  |   }
  67  |   order(game, { type: 'setPosting', factionId: game.turnOwnerId, armyId: 'army.2', cell: origin, mode: 'hold' });
  68  |   return { game, origin, target };
  69  | }
  70  | 
  71  | export async function importTravel(page: Page, game: GameState) {
  72  |   await page.goto('/');
  73  |   await page.getByLabel('Import save file').setInputFiles({ name: 'group-travel.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(game))) });
  74  |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  75  | }
  76  | export async function campaignMenu(page: Page) {
  77  |   await closeManagement(page);
  78  |   const menu = page.getByTestId('campaign-menu');
> 79  |   if (await menu.getAttribute('open') === null) await menu.locator(':scope > summary').click();
      |                                                                                        ^ Error: locator.click: Target crashed 
  80  | }
  81  | export async function exportedTravel(page: Page) {
  82  |   await campaignMenu(page);
  83  |   const next = page.waitForEvent('download');
  84  |   await page.getByRole('button', { name: 'Export campaign', exact: true }).click();
  85  |   const path = await (await next).path(); expect(path).toBeTruthy();
  86  |   const bytes = await readFile(path!), text = await importSave(bytes), campaign = deserializeCampaign(text);
  87  |   expect(serializeGame(replayArchive(campaign.archive))).toBe(serializeGame(campaign.game));
  88  |   return { bytes, text, ...campaign };
  89  | }
  90  | export async function travelPanel(page: Page, selectAll = false, keyboard = false) {
  91  |   await openRegistry(page, 'armies');
  92  |   if (selectAll) {
  93  |     await page.getByRole('searchbox', { name: 'Search your realm' }).fill('');
  94  |     await page.getByTestId('group-postings').getByRole('button', { name: 'Select matching armies', exact: true }).click();
  95  |   }
  96  |   const panel = page.getByTestId('group-movement');
  97  |   if (await panel.getAttribute('open') === null) {
  98  |     if (keyboard) { await panel.locator(':scope > summary').focus(); await page.keyboard.press('Enter'); }
  99  |     else await panel.locator(':scope > summary').click();
  100 |   }
  101 |   return panel;
  102 | }
  103 | export async function reviewTravel(page: Page, target: number, append = false) {
  104 |   const panel = await travelPanel(page);
  105 |   await panel.getByRole('combobox', { name: 'Travel destination', exact: true }).selectOption('hex');
  106 |   await panel.getByRole('spinbutton', { name: 'Destination hex', exact: true }).fill(String(target));
  107 |   await panel.getByRole('combobox', { name: 'Route mode', exact: true }).selectOption(append ? 'append' : 'replace');
  108 |   await panel.getByRole('button', { name: 'Review routes', exact: true }).click();
  109 |   await expect(page.getByTestId('group-movement-preview')).toContainText(`Destination hex ${target}`);
  110 |   return panel;
  111 | }
  112 | 
```