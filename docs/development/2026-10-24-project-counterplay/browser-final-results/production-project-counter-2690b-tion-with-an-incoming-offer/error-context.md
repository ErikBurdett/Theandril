# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: production/project-counterplay.spec.ts >> production watch sustains project interruption with an incoming offer
- Location: tests/production/project-counterplay.spec.ts:51:3

# Error details

```
Test timeout of 45000ms exceeded.
```

```
Error: locator.click: Test timeout of 45000ms exceeded.
Call log:
  - waiting for getByTestId('campaign-menu').locator(':scope > summary')
    - locator resolved to <summary>Campaign & settings</summary>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <dialog open="" class="chronicles-dialog" aria-labelledby="chronicles-title">…</dialog> intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <dialog open="" class="chronicles-dialog" aria-labelledby="chronicles-title">…</dialog> intercepts pointer events
    - retrying click action
      - waiting 100ms
    77 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <dialog open="" class="chronicles-dialog" aria-labelledby="chronicles-title">…</dialog> intercepts pointer events
     - retrying click action
       - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - button "Import save file"
  - generic [ref=e4]:
    - banner [ref=e5]:
      - generic [ref=e11]:
        - generic [ref=e12]: The age of fracture
        - heading "Theandril" [level=1] [ref=e13]
      - generic [ref=e14]:
        - generic [ref=e15]: Your realm
        - strong [ref=e16]: Ashen Compact
      - generic [ref=e17]:
        - generic [ref=e18]:
          - generic [ref=e19]: TREASURY
          - strong [ref=e20]: 275 coin
        - generic [ref=e21]:
          - generic [ref=e22]: KNOWLEDGE
          - strong [ref=e23]: "132"
        - generic [ref=e24]:
          - generic [ref=e25]: HEARTHS
          - strong [ref=e26]: "3"
    - navigation "Campaign navigation" [ref=e27]:
      - generic [ref=e28]:
        - text: Short pace ·
        - generic [ref=e29]: 2 realms
      - region "AI watch controls" [ref=e30]:
        - generic [ref=e31]: AI watch complete
        - button "Resume AI watch" [disabled] [ref=e32]
        - button "Step one round" [disabled] [ref=e33]
        - button "Reveal spectator map" [ref=e34] [cursor=pointer]
        - generic [ref=e35]: Map follows your realm’s sight. AI always uses its own faction sight. Changing fog pauses AI watch; resume when ready.
      - generic [ref=e36]: Partial archive · earlier history unavailable
      - button "Campaign chronicles" [ref=e37] [cursor=pointer]
    - group [ref=e38]:
      - generic "Campaign & settings" [ref=e39] [cursor=pointer]
  - region "Campaign result" [ref=e40]:
    - generic [ref=e41]: The witnesses seal the book
    - heading "Ashen Compact achieved Prosperity" [level=2] [ref=e42]
    - paragraph [ref=e43]: Turn 32 · The Hearth Exchange is complete. Campaign orders have ended.
    - button "Read campaign chronicles" [ref=e44] [cursor=pointer]
  - main [ref=e45]:
    - region "Strategic map" [ref=e46]:
      - generic: SEED 20260905 · 48 × 32Legacy geography
      - generic "World map. Select an army then click a highlighted hex to move or an enemy to attack. Hover to preview routes. Drag to pan; scroll to zoom all the way to world overview. Arrow keys pan; plus and minus zoom. Focus selection returns to local detail. Enter opens map actions for the selection. Escape closes map actions before clearing selection. The army panel has keyboard and touch route controls." [ref=e47]
      - navigation "Map management" [ref=e49]:
        - button "Armies & fleets" [ref=e50] [cursor=pointer]
        - button "Settlements" [ref=e54] [cursor=pointer]
        - button "Characters & agents" [ref=e58] [cursor=pointer]:
          - generic [ref=e61]: Characters
        - button "Realm progression" [ref=e62] [cursor=pointer]:
          - generic [ref=e65]: Research
        - button "Realm affairs" [ref=e66] [cursor=pointer]:
          - generic [ref=e69]: Diplomacy
        - button "Campaign journal" [ref=e70] [cursor=pointer]
        - button "World overview" [ref=e74] [cursor=pointer]
      - generic [ref=e78]:
        - button "Zoom in" [ref=e79] [cursor=pointer]: +
        - button "Zoom out" [ref=e80] [cursor=pointer]: −
        - button "Focus selection" [ref=e81] [cursor=pointer]
        - button "Open map actions" [ref=e82] [cursor=pointer]
        - button "Map guide" [ref=e83] [cursor=pointer]: "?"
      - group:
        - generic "World map · Terrain" [ref=e84] [cursor=pointer]
  - contentinfo [ref=e85]:
    - generic [ref=e88]:
      - generic [ref=e89]: Selected army
      - strong [ref=e90]: Wayfinder
      - generic [ref=e91]: 1 / 12 formations · 20 strength · 5 movement
      - generic [ref=e92]:
        - button "Show selected orders" [ref=e93] [cursor=pointer]
        - button "Show on map" [ref=e94] [cursor=pointer]
    - region "Next-action navigation" [ref=e95]:
      - paragraph [ref=e96]: 4 needing orders · 0 idle settlements
      - generic [ref=e97]:
        - button "Previous army needing orders" [disabled] [ref=e98]: ‹
        - button "Next army needing orders" [disabled] [ref=e99]: Next army N
        - button "Previous idle settlement" [disabled] [ref=e100]: ‹
        - button "Next idle settlement" [disabled] [ref=e101]: Next town S
      - paragraph [ref=e102]: "Labor: 1 unassigned household · 1 settlement"
      - generic [ref=e103]:
        - button "Previous settlement with unassigned households" [disabled] [ref=e104]: ‹
        - button "Next settlement with unassigned households" [disabled] [ref=e105]: Review households
      - group [ref=e106]:
        - generic "What wants a decision 3 kinds" [ref=e107] [cursor=pointer]:
          - text: What wants a decision
          - generic [ref=e108]: 3 kinds
      - status
    - generic [ref=e109]:
      - generic [ref=e110]:
        - generic [ref=e111]: AGE OF FRACTURE
        - strong [ref=e112]: Turn 32
      - button "End turn" [disabled] [ref=e113]:
        - text: End turn
        - generic [ref=e114]: E
    - status [ref=e115]:
      - generic [aria-hidden] [ref=e116]: ◆
      - text: The campaign has ended. Its two chronicles are ready to read. Autosaved.
  - dialog [ref=e117]:
    - generic [ref=e118]:
      - generic [ref=e119]:
        - generic [ref=e120]: The record of a realm
        - heading "Campaign chronicles" [level=2] [ref=e121]
      - button "Close campaign chronicles" [active] [ref=e122] [cursor=pointer]: Close ×
    - paragraph [ref=e123]: The campaign has ended. These records reveal every faction’s recorded commands and events, including those hidden during play.
    - tablist "Chronicle format" [ref=e124]:
      - tab "History tome" [selected] [ref=e125] [cursor=pointer]
      - tab "Technical log" [ref=e126] [cursor=pointer]
    - tabpanel "History tome" [ref=e127]:
      - generic [ref=e128]:
        - generic [ref=e129]: The history tome
        - heading "The Book of Rekindled Hearths" [level=3] [ref=e130]
        - paragraph [ref=e131]: A chronicle of world 20260905
        - paragraph [ref=e132]: "Partial record: this campaign was imported on turn 27. A complete earlier record is unavailable; no earlier history has been invented."
      - generic [ref=e133]:
        - generic [ref=e134]:
          - text: Chapter
          - combobox "History chapter" [ref=e135]:
            - option "1. Prologue — The scattered hearths" [selected]
            - option "2. Turn 27 — The annals of the realms"
            - option "3. Turn 28 — The annals of the realms"
            - option "4. Turn 29 — The annals of the realms"
            - option "5. Turn 30 — The annals of the realms"
            - option "6. Turn 31 — The reckoning of arms"
            - option "7. Turn 32 — The closing of the book"
            - option "8. Epilogue — The seal of the witnesses"
        - generic [ref=e136]:
          - button "Previous chapter" [disabled] [ref=e137]
          - button "Next chapter" [ref=e138] [cursor=pointer]
      - generic "History chapter text" [ref=e139]:
        - article [ref=e140]:
          - generic [ref=e141]: Chapter 1 of 8 · Turns 27–27
          - heading "Prologue — The scattered hearths" [level=4] [ref=e142]
          - paragraph [ref=e143]: The Witness Roads had failed, and distant bargains no longer bound the hearthlands. In this campaign, new communities set their claims upon the land.
          - paragraph [ref=e144]: The record opens with Ashen Compact, Reedbound Council. Its world bears the seed 20260905.
          - paragraph [ref=e145]: "Partial record: this campaign was imported on turn 27. A complete earlier record is unavailable; no earlier history has been invented."
      - generic [ref=e146]:
        - generic [ref=e147]: The full text contains every chapter.
        - button "Download history text" [ref=e148] [cursor=pointer]
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
      |                                                                                        ^ Error: locator.click: Test timeout of 45000ms exceeded.
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