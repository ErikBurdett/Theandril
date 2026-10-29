# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: patrols.spec.ts >> standing postings override patrols and removing a patrol retains its already-issued route until Cancel route
- Location: tests/gameplay/patrols.spec.ts:88:1

# Error details

```
Test timeout of 45000ms exceeded.
```

```
Error: locator.selectOption: Test timeout of 45000ms exceeded.
Call log:
  - waiting for getByTestId('army-posting').getByRole('combobox', { name: 'Posted to', exact: true })
    - locator resolved to <select>…</select>
  - attempting select option action
    2 × waiting for element to be visible and enabled
      - did not find some options
    - retrying select option action
    - waiting 20ms
    2 × waiting for element to be visible and enabled
      - did not find some options
    - retrying select option action
      - waiting 100ms
    92 × waiting for element to be visible and enabled
       - did not find some options
     - retrying select option action
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
          - strong [ref=e20]: 99989 coin
        - generic [ref=e21]:
          - generic [ref=e22]: KNOWLEDGE
          - strong [ref=e23]: "0"
        - generic [ref=e24]:
          - generic [ref=e25]: HEARTHS
          - strong [ref=e26]: "2"
    - navigation "Campaign navigation" [ref=e27]:
      - generic [ref=e28]:
        - text: Standard pace ·
        - generic [ref=e29]: 2 realms
      - generic [ref=e30]: Partial archive · earlier history unavailable
    - group [ref=e31]:
      - generic "Campaign & settings" [ref=e32] [cursor=pointer]
  - main [ref=e33]:
    - region "Strategic map" [ref=e34]:
      - generic: SEED 20260927 · 48 × 32Legacy geography
      - generic "World map. Select an army then click a highlighted hex to move or an enemy to attack. Hover to preview routes. Drag to pan; scroll to zoom all the way to world overview. Arrow keys pan; plus and minus zoom. Focus selection returns to local detail. Enter opens map actions for the selection. Escape closes map actions before clearing selection. The army panel has keyboard and touch route controls." [ref=e35]
      - navigation "Map management" [ref=e37]:
        - button "Armies & fleets" [ref=e38] [cursor=pointer]
        - button "Settlements" [ref=e42] [cursor=pointer]
        - button "Characters & agents" [ref=e46] [cursor=pointer]:
          - generic [ref=e49]: Characters
        - button "Realm progression" [ref=e50] [cursor=pointer]:
          - generic [ref=e53]: Research
        - button "Realm affairs" [ref=e54] [cursor=pointer]:
          - generic [ref=e57]: Diplomacy
        - button "Campaign journal" [ref=e58] [cursor=pointer]
        - button "World overview" [ref=e62] [cursor=pointer]
      - generic [ref=e66]:
        - button "Zoom in" [ref=e67] [cursor=pointer]: +
        - button "Zoom out" [ref=e68] [cursor=pointer]: −
        - button "Focus selection" [ref=e69] [cursor=pointer]
        - button "Open map actions" [ref=e70] [cursor=pointer]
        - button "Map guide" [ref=e71] [cursor=pointer]: "?"
      - group:
        - generic "World map · Terrain" [ref=e72] [cursor=pointer]
  - dialog [ref=e73]:
    - banner [ref=e74]:
      - generic [ref=e75]:
        - generic [ref=e76]: The realm's ledgers
        - heading "Selected orders" [level=2] [ref=e77]
        - paragraph [ref=e78]: Watch company 1
      - button "Close Selected orders" [ref=e79] [cursor=pointer]: ×
    - region "Selected entity orders" [ref=e81]:
      - button "Show on map" [ref=e82] [cursor=pointer]
      - group [ref=e83]:
        - generic [ref=e84]:
          - img "Ashen Compact army banner · approved faction artwork" [ref=e85]
          - heading "Watch company 1" [level=2] [ref=e86]
        - paragraph [ref=e87]: Oath guard · cell 495
        - generic [ref=e88]:
          - generic [ref=e89]:
            - strong [ref=e90]: "3"
            - generic [ref=e91]: Movement
          - generic [ref=e92]:
            - strong [ref=e93]: "60"
            - generic [ref=e94]: Strength
        - paragraph [ref=e95]: A force of fewer than 3 companies, or one escorting a caravan, forages for itself.
        - region "Army commander and agents" [ref=e96]:
          - paragraph [ref=e97]: "Commander: No marshal assigned"
          - paragraph [ref=e98]: "Command: 1 / 12 formations. Unled detachment: twelve-formation command capacity."
          - paragraph [ref=e99]: "Agents: None attached"
          - button "Manage characters for Watch company 1" [ref=e100] [cursor=pointer]: Manage army characters
        - generic [ref=e101]:
          - button "Survey for an arcane seam · 24 coin" [ref=e102] [cursor=pointer]
          - paragraph [ref=e103]: No Ashfall glass is visible underfoot; a survey here is a bet.
          - paragraph [ref=e104]: Ashfall glass marks ground worth surveying. A survey spends this company’s movement and reveals any seam within two hexes; holding one inside your borders draws ashglass and allows Arcane Theory.
        - region "Map movement orders" [ref=e105]:
          - heading "Paths & marching orders" [level=3] [ref=e106]
          - paragraph [ref=e107]: 36 highlighted destinations within current movement. Click a reachable hex to move, or a reachable hostile army to attack. Dragging only pans.
          - generic [ref=e108]:
            - checkbox "Add waypoint mode" [ref=e109]
            - text: Add waypoint mode
          - paragraph [ref=e110]: Shift-click adds a waypoint. For longer journeys, review a target and queue its route. Escape clears selection.
          - generic [ref=e111]:
            - generic [ref=e112]:
              - text: Destination hex
              - spinbutton "Destination hex" [ref=e113]
            - button "Review route" [ref=e114] [cursor=pointer]
          - status [ref=e115]: Choose a highlighted hex to move; hover to preview the known route.
        - group [ref=e116]:
          - generic "Standing posting none" [active] [ref=e117] [cursor=pointer]:
            - text: Standing posting
            - generic [ref=e118]: none
          - paragraph [ref=e119]: A posted army marches to its hex under an ordinary travel order and then holds it, or joins the force standing there. A travel order you give yourself always comes first, and the posting waits.
          - generic [ref=e120]:
            - text: Posted to
            - combobox "Posted to" [ref=e121]:
              - option "Choose a destination"
              - option "Where it stands · hex 495"
              - option "West watch · hex 500" [selected]
              - option "East watch · hex 510"
          - paragraph [ref=e122]: Where it stands uses the army’s position when you post it. A hearth choice stays at that hex.
          - generic [ref=e123]:
            - text: On arrival
            - combobox "On arrival" [ref=e124]:
              - option "Join the force there" [selected]
              - option "Hold the hex"
          - button "Post army" [ref=e125] [cursor=pointer]
        - group [ref=e126]:
          - generic "Two-point patrol none" [ref=e127] [cursor=pointer]:
            - text: Two-point patrol
            - generic [ref=e128]: none
          - paragraph [ref=e129]: Patrol between two explored hexes using ordinary travel. Direct travel orders, standing postings, voyages, missions and sieges come first. A patrol never starts a battle automatically.
          - generic [ref=e130]:
            - text: First patrol point
            - spinbutton "First patrol point" [ref=e131]: "495"
          - generic [ref=e132]:
            - text: First point shortcut
            - combobox "First point shortcut" [ref=e133]:
              - option "Choose a position" [selected]
              - option "Where this army stands · hex 495"
              - option "West watch · hex 500"
              - option "East watch · hex 510"
          - generic [ref=e134]:
            - text: Second patrol point
            - spinbutton "Second patrol point" [ref=e135]
          - generic [ref=e136]:
            - text: Second point shortcut
            - combobox "Second point shortcut" [ref=e137]:
              - option "Choose a position" [selected]
              - option "Where this army stands · hex 495"
              - option "West watch · hex 500"
              - option "East watch · hex 510"
          - paragraph [ref=e138]: "Enter two different known hex numbers or choose positions above. Current position: hex 495. The order will explain any unexplored or unavailable destination."
          - generic [ref=e139]:
            - checkbox "Pause when war begins" [ref=e140]
            - text: Pause when war begins
          - paragraph [ref=e141]: When enabled, war involving your realm pauses future patrol assignments on the next turn. Existing travel continues. Resuming while still at war pauses the patrol again next turn; turn this option off and update the patrol to keep patrolling through war.
          - paragraph [ref=e142]: Choose two different hexes inside this world before saving the patrol.
          - button "Start patrol" [disabled] [ref=e143]
          - paragraph [ref=e144]: Pausing or removing a patrol stops future assignments. Travel already issued continues; use Cancel route in the movement controls to stop that route too. Updating points preserves whether the patrol is paused.
        - generic [ref=e145]:
          - button "Raise a supply depot · 40 coin" [ref=e146] [cursor=pointer]
          - paragraph [ref=e147]: A depot feeds the ground two hexes around it, or four along a road, so an army can be supplied where no hearth reaches. It spends this company’s movement, costs upkeep every turn, must stand apart from your other depots, and is pulled down by any enemy that walks onto it.
        - group [ref=e148]:
          - generic "Army composition 1 / 12 formations" [ref=e149] [cursor=pointer]:
            - text: Army composition
            - generic [ref=e150]: 1 / 12 formations
          - option "No other owned army here" [selected]
        - heading "Single-step shortcuts" [level=3] [ref=e151]
        - paragraph [ref=e152]: "Optional: move one neighboring hex using the buttons below. For complete routes and attacks, use the map or Paths & marching orders above."
        - generic [ref=e153]:
          - button "Move to cell 496" [ref=e154] [cursor=pointer]:
            - text: Plains
            - generic [ref=e155]: Hex 496
          - button "Move to cell 543" [ref=e156] [cursor=pointer]:
            - text: Plains
            - generic [ref=e157]: Hex 543
          - button "Move to cell 542" [ref=e158] [cursor=pointer]:
            - text: Plains
            - generic [ref=e159]: Hex 542
          - button "Move to cell 494" [ref=e160] [cursor=pointer]:
            - text: Plains
            - generic [ref=e161]: Hex 494
          - button "Move to cell 446" [ref=e162] [cursor=pointer]:
            - text: Plains
            - generic [ref=e163]: Hex 446
          - button "Move to cell 447" [ref=e164] [cursor=pointer]:
            - text: Plains
            - generic [ref=e165]: Hex 447
        - region "Settlement siege orders" [ref=e166]:
          - heading "Walls & blockades" [level=3] [ref=e167]
          - paragraph [ref=e168]: No neighboring foreign settlements are in sight.
        - region "Nearby enemy forces" [ref=e169]:
          - heading "Field engagement" [level=3] [ref=e170]
          - paragraph [ref=e171]: "Your force: 60 strength · 75 morale · 0 fatigue."
          - paragraph [ref=e172]: No neighboring foreign land armies are in sight.
        - generic [ref=e173]:
          - generic [ref=e174]: Selected hex 495
          - paragraph [ref=e175]: Temperate grassland · Plains · fertility 60 · in sight
  - contentinfo [ref=e176]:
    - generic [ref=e179]:
      - generic [ref=e180]: Selected army
      - strong [ref=e181]: Watch company 1
      - generic [ref=e182]: 1 / 12 formations · 60 strength · 3 movement
      - generic [ref=e183]:
        - button "Show selected orders" [ref=e184] [cursor=pointer]
        - button "Show on map" [ref=e185] [cursor=pointer]
    - region "Next-action navigation" [ref=e186]:
      - paragraph [ref=e187]: 1 needing orders · 2 idle settlements
      - generic [ref=e188]:
        - button "Previous army needing orders" [ref=e189] [cursor=pointer]: ‹
        - button "Next army needing orders" [ref=e190] [cursor=pointer]: Next army N
        - button "Previous idle settlement" [ref=e191] [cursor=pointer]: ‹
        - button "Next idle settlement" [ref=e192] [cursor=pointer]: Next town S
      - paragraph [ref=e193]: "Labor: 2 unassigned households · 2 settlements"
      - generic [ref=e194]:
        - button "Previous settlement with unassigned households" [ref=e195] [cursor=pointer]: ‹
        - button "Next settlement with unassigned households" [ref=e196] [cursor=pointer]: Review households
      - group [ref=e197]:
        - generic "What wants a decision 3 kinds" [ref=e198] [cursor=pointer]:
          - text: What wants a decision
          - generic [ref=e199]: 3 kinds
      - status
    - generic [ref=e200]:
      - generic [ref=e201]:
        - generic [ref=e202]: AGE OF FRACTURE
        - strong [ref=e203]: Turn 1
      - button "End turn" [ref=e204] [cursor=pointer]:
        - text: End turn
        - generic [ref=e205]: E
    - status [ref=e206]:
      - generic [aria-hidden] [ref=e207]: ◆
      - text: "Imported campaign. Partial archive: earlier campaign history was not recorded in this save."
  - generic [ref=e208]:
    - button "Art Lab" [ref=e209] [cursor=pointer]
    - generic [ref=e210]: Development asset inspector
```

# Test source

```ts
  1   | import { expect, test, type Page } from '@playwright/test';
  2   | import { serializeGame, stateHash, type GameState } from '@theandril/sim';
  3   | import { exportSave } from '@theandril/persistence';
  4   | import { theaterCampaign } from '../../packages/test-fixtures/src/theater-fixture';
  5   | import { campaignMenu, exportedTravel, matureTravel } from './group-movement-fixture';
  6   | import { closeManagement, openSelectedOrders, selectFromRegistry } from './ui-navigation';
  7   | 
  8   | async function load(page: Page, game: GameState) {
  9   |   await page.goto('/');
  10  |   await page.getByLabel('Import save file').setInputFiles({ name: 'patrol.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(game))) });
  11  |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  12  | }
  13  | async function panel(page: Page, name = 'Watch company 1') {
  14  |   await selectFromRegistry(page, 'armies', name); await openSelectedOrders(page);
  15  |   const patrol = page.getByTestId('army-patrol');
  16  |   if (await patrol.getAttribute('open') === null) await patrol.locator(':scope > summary').click();
  17  |   return patrol;
  18  | }
  19  | async function nextTurn(page: Page) {
  20  |   const turn = await page.evaluate(() => window.__THEANDRIL__!.getTurn());
  21  |   await closeManagement(page);
  22  |   const menu = page.getByTestId('campaign-menu');
  23  |   if (await menu.getAttribute('open') !== null) await menu.locator(':scope > summary').click();
  24  |   await page.getByRole('button', { name: 'End turn', exact: true }).click();
  25  |   await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getTurn())).toBe(turn + 1);
  26  |   await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  27  | }
  28  | async function snapshot(page: Page) {
  29  |   return page.evaluate(() => {
  30  |     const view = window.__THEANDRIL__!.getSummary()!;
  31  |     return { hash: window.__THEANDRIL__!.getStateHash(), patrols: view.patrols!, routes: view.routes,
  32  |       armies: view.ownArmies.map(({ id, cell }) => ({ id, cell })) };
  33  |   });
  34  | }
  35  | 
  36  | test('a two-point patrol makes both legs through End turn and survives manual and portable recovery with exact replay', async ({ page }) => {
  37  |   const game = theaterCampaign(1), army = Object.values(game.armies)[0]!;
  38  |   const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  39  |   await load(page, game);
  40  |   const patrol = await panel(page);
  41  |   await expect(patrol.getByRole('button', { name: 'Start patrol', exact: true })).toBeDisabled();
  42  |   await expect(patrol.getByRole('checkbox', { name: 'Pause when war begins', exact: true })).not.toBeChecked();
  43  |   const before = await snapshot(page);
  44  |   await patrol.getByRole('spinbutton', { name: 'Second patrol point', exact: true }).fill('497');
  45  |   expect((await snapshot(page)).hash).toBe(before.hash);
  46  |   await patrol.getByRole('button', { name: 'Start patrol', exact: true }).focus(); await page.keyboard.press('Enter');
  47  |   await expect(patrol.locator(':scope > summary')).toContainText('Enabled · 495 ↔ 497');
  48  |   expect((await snapshot(page)).armies.find(item => item.id === army.id)!.cell).toBe(495);
  49  |   await nextTurn(page);
  50  |   expect((await snapshot(page)).armies.find(item => item.id === army.id)!.cell).toBe(497);
  51  |   expect((await snapshot(page)).patrols[0]!.targetCell).toBe(495);
  52  |   await nextTurn(page);
  53  |   expect((await snapshot(page)).armies.find(item => item.id === army.id)!.cell).toBe(495);
  54  |   const active = await snapshot(page);
  55  |   await campaignMenu(page);
  56  |   await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  57  |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  58  |   const exported = await exportedTravel(page);
  59  |   expect(stateHash(exported.game)).toBe(active.hash);
  60  |   expect(exported.archive.records.some(record => record.command && typeof record.command === 'object' && 'type' in record.command && record.command.type === 'setPatrol')).toBe(true);
  61  |   await panel(page);
  62  |   await patrol.getByRole('button', { name: 'Pause patrol', exact: true }).click();
  63  |   await expect(patrol.locator(':scope > summary')).toContainText('Paused');
  64  |   await patrol.getByRole('checkbox', { name: 'Pause when war begins', exact: true }).check();
  65  |   await patrol.getByRole('button', { name: 'Update patrol', exact: true }).click();
  66  |   await expect.poll(async () => (await snapshot(page)).patrols[0]).toMatchObject({ pauseOnWar: true, enabled: false });
  67  |   await nextTurn(page);
  68  |   expect((await snapshot(page)).armies.find(item => item.id === army.id)!.cell).toBe(495);
  69  |   await panel(page);
  70  |   await patrol.getByRole('button', { name: 'Resume patrol', exact: true }).click();
  71  |   await nextTurn(page);
  72  |   expect((await snapshot(page)).armies.find(item => item.id === army.id)!.cell).toBe(497);
  73  |   await campaignMenu(page);
  74  |   await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  75  |   await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  76  |   expect((await snapshot(page)).hash).toBe(active.hash);
  77  |   await page.reload();
  78  |   await page.getByLabel('Import save file').setInputFiles({ name: 'patrol-recovered.theandril', mimeType: 'application/gzip', buffer: exported.bytes });
  79  |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  80  |   expect((await snapshot(page)).hash).toBe(active.hash);
  81  |   await panel(page);
  82  |   await patrol.getByRole('button', { name: 'Remove patrol', exact: true }).click();
  83  |   await expect(patrol.locator(':scope > summary')).toContainText('none');
  84  |   expect((await snapshot(page)).patrols).toEqual([]);
  85  |   expect(errors).toEqual([]);
  86  | });
  87  | 
  88  | test('standing postings override patrols and removing a patrol retains its already-issued route until Cancel route', async ({ page }) => {
  89  |   const game = theaterCampaign(1), army = Object.values(game.armies)[0]!;
  90  |   await load(page, game);
  91  |   const patrol = await panel(page);
  92  |   const posting = page.getByTestId('army-posting');
  93  |   await posting.locator(':scope > summary').click();
> 94  |   await posting.getByRole('combobox', { name: 'Posted to', exact: true }).selectOption('495');
      |                                                                           ^ Error: locator.selectOption: Test timeout of 45000ms exceeded.
  95  |   await posting.getByRole('combobox', { name: 'On arrival', exact: true }).selectOption('hold');
  96  |   await posting.getByRole('button', { name: 'Post army', exact: true }).click();
  97  |   await patrol.getByRole('spinbutton', { name: 'Second patrol point', exact: true }).fill('510');
  98  |   await patrol.getByRole('button', { name: 'Start patrol', exact: true }).click();
  99  |   await nextTurn(page);
  100 |   expect((await snapshot(page)).armies.find(item => item.id === army.id)!.cell).toBe(495);
  101 |   await panel(page);
  102 |   await expect(patrol.getByTestId('patrol-status')).toContainText(/posting/i);
  103 |   if (await posting.getAttribute('open') === null) await posting.locator(':scope > summary').click();
  104 |   await posting.getByRole('button', { name: 'Clear posting', exact: true }).click();
  105 |   await nextTurn(page);
  106 |   const marching = await snapshot(page);
  107 |   expect(marching.armies.find(item => item.id === army.id)!.cell).not.toBe(495);
  108 |   expect(marching.routes.find(route => route.armyId === army.id)?.status).toBe('active');
  109 |   await panel(page);
  110 |   await patrol.getByRole('button', { name: 'Pause patrol', exact: true }).click();
  111 |   await expect(patrol.locator(':scope > summary')).toContainText('Paused');
  112 |   expect((await snapshot(page)).routes).toEqual(marching.routes);
  113 |   await patrol.getByRole('button', { name: 'Remove patrol', exact: true }).click();
  114 |   await expect(patrol.locator(':scope > summary')).toContainText('none');
  115 |   expect((await snapshot(page)).routes).toEqual(marching.routes);
  116 |   await page.getByTestId('queued-route').getByRole('button', { name: 'Cancel route', exact: true }).click();
  117 |   await expect(page.getByTestId('queued-route')).toHaveCount(0);
  118 |   expect((await snapshot(page)).routes).toEqual([]);
  119 |   const stopped = (await snapshot(page)).armies.find(item => item.id === army.id)!.cell;
  120 |   await nextTurn(page);
  121 |   expect((await snapshot(page)).armies.find(item => item.id === army.id)!.cell).toBe(stopped);
  122 | });
  123 | 
  124 | test('the last of one hundred armies can receive a patrol from the registry at desktop and narrow sizes', async ({ page }, testInfo) => {
  125 |   const { game, own, origin } = matureTravel(), selected = own.at(-1)!;
  126 |   await load(page, game);
  127 |   const patrol = await panel(page, selected.name);
  128 |   await patrol.getByRole('spinbutton', { name: 'First patrol point', exact: true }).fill(String(origin));
  129 |   await patrol.getByRole('spinbutton', { name: 'Second patrol point', exact: true }).fill(String(origin + 2));
  130 |   await patrol.getByRole('checkbox', { name: 'Pause when war begins', exact: true }).check();
  131 |   await patrol.getByRole('button', { name: 'Start patrol', exact: true }).click();
  132 |   await expect(patrol.getByRole('button', { name: 'Pause patrol', exact: true })).toBeEnabled();
  133 |   const saved = await snapshot(page);
  134 |   expect(saved.patrols).toHaveLength(1);
  135 |   expect(saved.patrols[0]!.armyId).toBe(selected.id);
  136 |   expect(saved.patrols[0]!.pauseOnWar).toBe(true);
  137 |   await patrol.scrollIntoViewIfNeeded();
  138 |   await page.screenshot({ path: testInfo.outputPath('patrol-desktop.png') });
  139 |   await page.setViewportSize({ width: 390, height: 844 });
  140 |   await patrol.getByRole('spinbutton', { name: 'Second patrol point', exact: true }).scrollIntoViewIfNeeded();
  141 |   await page.screenshot({ path: testInfo.outputPath('patrol-narrow-points.png') });
  142 |   await patrol.getByRole('button', { name: 'Remove patrol', exact: true }).scrollIntoViewIfNeeded();
  143 |   await page.screenshot({ path: testInfo.outputPath('patrol-narrow-actions.png') });
  144 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  145 |   const exported = await exportedTravel(page);
  146 |   expect(stateHash(exported.game)).toBe(saved.hash);
  147 |   expect(exported.game.patrols[0]!.armyId).toBe(selected.id);
  148 |   expect(exported.game.patrols[0]!.pauseOnWar).toBe(true);
  149 |   await panel(page, selected.name);
  150 |   await expect(patrol.getByRole('checkbox', { name: 'Pause when war begins', exact: true })).toBeChecked();
  151 | });
  152 | 
```