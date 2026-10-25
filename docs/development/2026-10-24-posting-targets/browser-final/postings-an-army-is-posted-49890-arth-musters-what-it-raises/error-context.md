# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: postings.spec.ts >> an army is posted from real controls, states where it stands, and a hearth musters what it raises
- Location: tests/gameplay/postings.spec.ts:28:1

# Error details

```
Test timeout of 45000ms exceeded.
```

```
Error: locator.click: Test timeout of 45000ms exceeded.
Call log:
  - waiting for getByTestId('army-posting').getByRole('button', { name: 'Post army', exact: true })
    - locator resolved to <button disabled class="primary wide" aria-describedby="posting-choice-army.2">Post army</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
      - waiting 100ms
    82 × waiting for element to be visible, enabled and stable
       - element is not enabled
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
          - strong [ref=e20]: 2000 coin
        - generic [ref=e21]:
          - generic [ref=e22]: KNOWLEDGE
          - strong [ref=e23]: "0"
        - generic [ref=e24]:
          - generic [ref=e25]: HEARTHS
          - strong [ref=e26]: "1"
    - navigation "Campaign navigation" [ref=e27]:
      - generic [ref=e28]:
        - text: Standard pace ·
        - generic [ref=e29]: 1 realms
      - generic [ref=e30]: Partial archive · earlier history unavailable
    - group [ref=e31]:
      - generic "Campaign & settings" [ref=e32] [cursor=pointer]
  - main [ref=e33]:
    - region "Strategic map" [ref=e34]:
      - generic: SEED 17 · 48 × 32Legacy geography
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
        - paragraph [ref=e78]: Wayfinder
      - button "Close Selected orders" [ref=e79] [cursor=pointer]: ×
    - region "Selected entity orders" [ref=e81]:
      - button "Show on map" [ref=e82] [cursor=pointer]
      - group [ref=e83]:
        - generic [ref=e84]:
          - img "Ashen Compact army banner · approved faction artwork" [ref=e85]
          - heading "Wayfinder" [level=2] [ref=e86]
        - paragraph [ref=e87]: Wayfinder · cell 991
        - generic [ref=e88]:
          - generic [ref=e89]:
            - strong [ref=e90]: "5"
            - generic [ref=e91]: Movement
          - generic [ref=e92]:
            - strong [ref=e93]: "20"
            - generic [ref=e94]: Strength
        - paragraph [ref=e95]: Supplied from Muster Hearth.
        - region "Army commander and agents" [ref=e96]:
          - paragraph [ref=e97]: "Commander: No marshal assigned"
          - paragraph [ref=e98]: "Command: 1 / 12 formations. Unled detachment: twelve-formation command capacity."
          - paragraph [ref=e99]: "Agents: None attached"
          - button "Manage characters for Wayfinder" [ref=e100] [cursor=pointer]: Manage army characters
        - generic [ref=e101]:
          - button "Survey for an arcane seam · 24 coin" [ref=e102] [cursor=pointer]
          - paragraph [ref=e103]: Ashfall glass marks ground worth surveying. A survey spends this company’s movement and reveals any seam within two hexes; holding one inside your borders draws ashglass and allows Arcane Theory.
        - region "Map movement orders" [ref=e104]:
          - heading "Paths & marching orders" [level=3] [ref=e105]
          - paragraph [ref=e106]: 60 highlighted destinations within current movement. Click a reachable hex to move, or a reachable hostile army to attack. Dragging only pans.
          - generic [ref=e107]:
            - checkbox "Add waypoint mode" [ref=e108]
            - text: Add waypoint mode
          - paragraph [ref=e109]: Shift-click adds a waypoint. For longer journeys, review a target and queue its route. Escape clears selection.
          - generic [ref=e110]:
            - generic [ref=e111]:
              - text: Destination hex
              - spinbutton "Destination hex" [ref=e112]
            - button "Review route" [ref=e113] [cursor=pointer]
          - status [ref=e114]: Choose a highlighted hex to move; hover to preview the known route.
        - group [ref=e115]:
          - generic "Standing posting none" [active] [ref=e116] [cursor=pointer]:
            - text: Standing posting
            - generic [ref=e117]: none
          - paragraph [ref=e118]: A posted army marches to its hex under an ordinary travel order and then holds it, or joins the force standing there. A travel order you give yourself always comes first, and the posting waits.
          - generic [ref=e119]:
            - text: Posted to
            - combobox "Posted to" [invalid] [ref=e120]:
              - option "Choose a destination" [selected]
              - option "Where it stands · hex 991"
              - option "Muster Hearth · hex 991"
          - paragraph [ref=e121]: Choose a destination from the current list before posting. No posting has been issued.
          - paragraph [ref=e122]: Where it stands uses the army’s position when you post it. A hearth choice stays at that hex.
          - generic [ref=e123]:
            - text: On arrival
            - combobox "On arrival" [ref=e124]:
              - option "Join the force there"
              - option "Hold the hex" [selected]
          - button "Post army" [disabled] [ref=e125]
        - group [ref=e126]:
          - generic "Two-point patrol none" [ref=e127] [cursor=pointer]:
            - text: Two-point patrol
            - generic [ref=e128]: none
          - option "Choose a position" [selected]
          - option "Where this army stands · hex 991"
          - option "Choose a position" [selected]
          - option "Where this army stands · hex 991"
        - generic [ref=e129]:
          - button "Raise a supply depot · 40 coin" [disabled] [ref=e130]
          - paragraph [ref=e131]: A hearth already supplies this ground.
        - group [ref=e132]:
          - generic "Army composition 1 / 12 formations" [ref=e133] [cursor=pointer]:
            - text: Army composition
            - generic [ref=e134]: 1 / 12 formations
          - option "No other owned army here" [selected]
        - heading "Single-step shortcuts" [level=3] [ref=e135]
        - paragraph [ref=e136]: "Optional: move one neighboring hex using the buttons below. For complete routes and attacks, use the map or Paths & marching orders above."
        - generic [ref=e137]:
          - button "Move to cell 992" [ref=e138] [cursor=pointer]:
            - text: Plains
            - generic [ref=e139]: Hex 992
          - button "Move to cell 1039" [ref=e140] [cursor=pointer]:
            - text: Plains
            - generic [ref=e141]: Hex 1039
          - button "Move to cell 1038" [ref=e142] [cursor=pointer]:
            - text: Plains
            - generic [ref=e143]: Hex 1038
          - button "Move to cell 990" [ref=e144] [cursor=pointer]:
            - text: Plains
            - generic [ref=e145]: Hex 990
          - button "Move to cell 942" [ref=e146] [cursor=pointer]:
            - text: Plains
            - generic [ref=e147]: Hex 942
          - button "Move to cell 943" [ref=e148] [cursor=pointer]:
            - text: Plains
            - generic [ref=e149]: Hex 943
        - region "Settlement siege orders" [ref=e150]:
          - heading "Walls & blockades" [level=3] [ref=e151]
          - paragraph [ref=e152]: No neighboring foreign settlements are in sight.
        - region "Nearby enemy forces" [ref=e153]:
          - heading "Field engagement" [level=3] [ref=e154]
          - paragraph [ref=e155]: "Your force: 20 strength · 55 morale · 0 fatigue."
          - paragraph [ref=e156]: No neighboring foreign land armies are in sight.
        - generic [ref=e157]:
          - generic [ref=e158]: Selected hex 991
          - paragraph [ref=e159]: Marsh · Plains · fertility 80 · in sight
        - paragraph [ref=e160]: Claimed land · Ashen Compact · Muster Hearth
  - contentinfo [ref=e161]:
    - generic [ref=e164]:
      - generic [ref=e165]: Selected army
      - strong [ref=e166]: Wayfinder
      - generic [ref=e167]: 1 / 12 formations · 20 strength · 5 movement
      - generic [ref=e168]:
        - button "Show selected orders" [ref=e169] [cursor=pointer]
        - button "Show on map" [ref=e170] [cursor=pointer]
    - region "Next-action navigation" [ref=e171]:
      - paragraph [ref=e172]: 1 needing orders · 1 idle settlements
      - generic [ref=e173]:
        - button "Previous army needing orders" [ref=e174] [cursor=pointer]: ‹
        - button "Next army needing orders" [ref=e175] [cursor=pointer]: Next army N
        - button "Previous idle settlement" [ref=e176] [cursor=pointer]: ‹
        - button "Next idle settlement" [ref=e177] [cursor=pointer]: Next town S
      - paragraph [ref=e178]: "Labor: 1 unassigned household · 1 settlement"
      - generic [ref=e179]:
        - button "Previous settlement with unassigned households" [ref=e180] [cursor=pointer]: ‹
        - button "Next settlement with unassigned households" [ref=e181] [cursor=pointer]: Review households
      - group [ref=e182]:
        - generic "What wants a decision 3 kinds" [ref=e183] [cursor=pointer]:
          - text: What wants a decision
          - generic [ref=e184]: 3 kinds
      - status
    - generic [ref=e185]:
      - generic [ref=e186]:
        - generic [ref=e187]: AGE OF FRACTURE
        - strong [ref=e188]: Turn 1
      - button "End turn" [ref=e189] [cursor=pointer]:
        - text: End turn
        - generic [ref=e190]: E
    - status [ref=e191]:
      - generic [aria-hidden] [ref=e192]: ◆
      - text: "Imported campaign. Partial archive: earlier campaign history was not recorded in this save."
  - generic [ref=e193]:
    - button "Art Lab" [ref=e194] [cursor=pointer]
    - generic [ref=e195]: Development asset inspector
```

# Test source

```ts
  1  | import { expect, test, type Page } from '@playwright/test';
  2  | import { applyCommand, createGame, deserializeGame, serializeGame, type GameCommand, type GameState } from '@theandril/sim';
  3  | import { exportSave } from '@theandril/persistence';
  4  | import { cellsWithin } from '../../packages/sim/src/visibility';
  5  | import { closeManagement, openRegistry, openSelectedOrders, selectFromRegistry } from './ui-navigation';
  6  | 
  7  | function issue(state: GameState, command: GameCommand) { const result = applyCommand(state, command); if (!result.ok) throw new Error(result.error); }
  8  | /** Two hearths on clear ground, so a muster point has somewhere to name. */
  9  | function musterScene(): GameState {
  10 |   const state = createGame({ generatorVersion: 4, seed: 17, size: 'tiny', factionCount: 1, pace: 'standard' });
  11 |   const origin = state.armies['army.1']!.cell;
  12 |   for (const cell of cellsWithin(state, origin, 5)) {
  13 |     state.world.terrain[cell] = 1; state.world.biome[cell] = 7; state.world.waterDepth[cell] = 0; state.world.fertility[cell] = 80;
  14 |     delete state.resources.deposits[cell];
  15 |   }
  16 |   issue(state, { type: 'found', factionId: state.turnOwnerId, armyId: 'army.1', name: 'Muster Hearth' });
  17 |   state.factions[0]!.treasury = 2000;
  18 |   return deserializeGame(serializeGame(state));
  19 | }
  20 | async function endTurn(page: Page) {
  21 |   const turn = await page.evaluate(() => window.__THEANDRIL__!.getTurn());
  22 |   await closeManagement(page);
  23 |   await page.getByRole('button', { name: 'End turn', exact: true }).click();
  24 |   await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getTurn())).toBe(turn + 1);
  25 |   await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  26 | }
  27 | 
  28 | test('an army is posted from real controls, states where it stands, and a hearth musters what it raises', async ({ page }) => {
  29 |   const errors: string[] = [];
  30 |   page.on('pageerror', error => errors.push(error.message));
  31 |   await page.goto('/');
  32 |   await page.locator('input[type=file]').setInputFiles({ name: 'postings.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(musterScene()))) });
  33 |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  34 | 
  35 |   await openRegistry(page, 'armies');
  36 |   await selectFromRegistry(page, 'armies', /Wayfinder/);
  37 |   await openSelectedOrders(page);
  38 |   const posting = page.getByTestId('army-posting');
  39 |   await posting.locator(':scope > summary').click();
  40 |   await expect(posting).toContainText('A travel order you give yourself always comes first');
  41 |   await expect(posting.locator(':scope > summary')).toContainText('none');
  42 | 
  43 |   // The company stands on the realm's only hearth, so that hex is its one rally
  44 |   // point; the panel names it rather than showing a bare number.
  45 |   await posting.getByLabel('Posted to').selectOption({ index: 0 });
  46 |   await posting.getByLabel('On arrival').selectOption('hold');
> 47 |   await posting.getByRole('button', { name: 'Post army', exact: true }).click();
     |                                                                         ^ Error: locator.click: Test timeout of 45000ms exceeded.
  48 |   await expect(posting.locator(':scope > summary')).toContainText('Hold · Muster Hearth');
  49 |   await expect(posting).toContainText(/Standing at its posting\.|Marching to its posting\./);
  50 | 
  51 |   // The hearth names a muster point, and says what that means for what it raises.
  52 |   await closeManagement(page);
  53 |   await openRegistry(page, 'settlements');
  54 |   await selectFromRegistry(page, 'settlements', /Muster Hearth/);
  55 |   await openSelectedOrders(page);
  56 |   const muster = page.getByTestId('settlement-muster');
  57 |   await muster.locator(':scope > summary').click();
  58 |   await expect(muster).toContainText('posted to the muster point the turn it forms');
  59 |   await muster.getByRole('button', { name: 'Set muster point', exact: true }).click();
  60 |   await expect(muster.locator(':scope > summary')).toContainText('Muster Hearth');
  61 | 
  62 |   await endTurn(page);
  63 |   await selectFromRegistry(page, 'settlements', /Muster Hearth/);
  64 |   await openSelectedOrders(page);
  65 |   const kept = page.getByTestId('settlement-muster');
  66 |   await kept.locator(':scope > summary').click();
  67 |   await expect(kept.locator(':scope > summary')).toContainText('Muster Hearth');
  68 |   await kept.getByRole('button', { name: 'Clear muster point', exact: true }).click();
  69 |   await expect(kept.locator(':scope > summary')).toContainText('none');
  70 |   expect(errors).toEqual([]);
  71 | });
  72 | 
```