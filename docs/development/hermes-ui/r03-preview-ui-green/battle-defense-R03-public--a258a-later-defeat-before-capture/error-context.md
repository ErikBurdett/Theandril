# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: battle-defense.spec.ts >> R03 public siege shows reserves at 390px and requires their later defeat before capture
- Location: tests/gameplay/battle-defense.spec.ts:63:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 1
Received: undefined
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - button "Import save file"
  - generic [ref=e4]:
    - banner [ref=e5]:
      - heading "Theandril" [level=1] [ref=e8]
      - generic [ref=e9]:
        - generic [ref=e10]:
          - generic [ref=e11]: TREASURY
          - strong [ref=e12]: 6 coin
        - generic [ref=e13]:
          - generic [ref=e14]: KNOWLEDGE
          - strong [ref=e15]: "6"
    - navigation "Campaign navigation" [ref=e16]:
      - generic [ref=e17]:
        - text: Standard pace ·
        - generic [ref=e18]: 2 realms
    - group [ref=e19]:
      - generic "Campaign & settings" [ref=e20] [cursor=pointer]
  - main [ref=e21]:
    - region "Strategic map" [ref=e22]:
      - generic "World map. Select an army then click a highlighted hex to move or an enemy to attack. Hover to preview routes. Drag to pan; scroll to zoom all the way to world overview. Arrow keys pan; plus and minus zoom. Focus selection returns to local detail. Enter opens map actions for the selection. Escape closes map actions before clearing selection. The army panel has keyboard and touch route controls." [ref=e23]
      - navigation "Map management" [ref=e25]:
        - button "Armies & fleets" [ref=e26] [cursor=pointer]
        - button "Settlements" [ref=e30] [cursor=pointer]
        - button "Characters & agents" [ref=e34] [cursor=pointer]:
          - generic [ref=e37]: Characters
        - button "Realm progression" [ref=e38] [cursor=pointer]:
          - generic [ref=e41]: Research
        - button "Realm affairs" [ref=e42] [cursor=pointer]:
          - generic [ref=e45]: Diplomacy
        - button "Campaign journal" [ref=e46] [cursor=pointer]
        - button "World overview" [ref=e50] [cursor=pointer]
      - generic [ref=e54]:
        - button "Zoom in" [ref=e55] [cursor=pointer]: +
        - button "Zoom out" [ref=e56] [cursor=pointer]: −
        - button "Focus selection" [ref=e57] [cursor=pointer]
        - button "Open map actions" [ref=e58] [cursor=pointer]
        - button "Map guide" [ref=e59] [cursor=pointer]: "?"
      - group:
        - generic "World map · Terrain" [ref=e60] [cursor=pointer]
  - dialog [ref=e61]:
    - banner [ref=e62]:
      - generic [ref=e63]:
        - generic [ref=e64]: The realm's ledgers
        - heading "Selected orders" [active] [level=2] [ref=e65]
        - paragraph [ref=e66]: Ashen Vanguard
      - button "Close Selected orders" [ref=e67] [cursor=pointer]: ×
    - region "Selected entity orders" [ref=e69]:
      - button "Show on map" [ref=e70] [cursor=pointer]
      - group [ref=e71]:
        - generic [ref=e72]:
          - img "Ashen Compact army banner · approved faction artwork" [ref=e73]
          - heading "Ashen Vanguard" [level=2] [ref=e74]
        - paragraph [ref=e75]: 12 formations together · cell 537
        - generic [ref=e76]:
          - generic [ref=e77]:
            - strong [ref=e78]: "3"
            - generic [ref=e79]: Movement
          - generic [ref=e80]:
            - strong [ref=e81]: "720"
            - generic [ref=e82]: Strength
        - region "Army commander and agents" [ref=e83]:
          - paragraph [ref=e84]: "Commander: No marshal assigned"
          - paragraph [ref=e85]: "Command: 12 / 12 formations. Unled detachment: twelve-formation command capacity."
          - paragraph [ref=e86]: "Agents: None attached"
          - button "Manage characters for Ashen Vanguard" [ref=e87] [cursor=pointer]: Manage army characters
        - region "Map movement orders" [ref=e88]:
          - heading "Paths & marching orders" [level=3] [ref=e89]
          - paragraph [ref=e90]: 0 highlighted destinations within current movement. Click a reachable hex to move, or a reachable hostile army to attack. Dragging only pans.
          - generic [ref=e91]:
            - checkbox "Add waypoint mode" [ref=e92]
            - text: Add waypoint mode
          - paragraph [ref=e93]: Shift-click adds a waypoint. For longer journeys, review a target and queue its route. Escape clears selection.
          - generic [ref=e94]:
            - generic [ref=e95]:
              - text: Destination hex
              - spinbutton "Destination hex" [ref=e96]
            - button "Review route" [ref=e97] [cursor=pointer]
          - status [ref=e98]: Choose a highlighted hex to move; hover to preview the known route.
        - group [ref=e99]:
          - generic "Army composition 12 / 12 formations" [ref=e100] [cursor=pointer]:
            - text: Army composition
            - generic [ref=e101]: 12 / 12 formations
          - option "No other owned army here" [selected]
        - heading "Single-step shortcuts" [level=3] [ref=e102]
        - paragraph [ref=e103]: "Optional: move one neighboring hex using the buttons below. For complete routes and attacks, use the map or Paths & marching orders above."
        - generic [ref=e104]:
          - button "Move to cell 538" [ref=e105] [cursor=pointer]:
            - text: Hills
            - generic [ref=e106]: Hex 538
          - button "Move to cell 586" [ref=e107] [cursor=pointer]:
            - text: Plains
            - generic [ref=e108]: Hex 586
          - button "Move to cell 585" [ref=e109] [cursor=pointer]:
            - text: Hills
            - generic [ref=e110]: Hex 585
          - button "Move to cell 536" [ref=e111] [cursor=pointer]:
            - text: Plains
            - generic [ref=e112]: Hex 536
          - button "Move to cell 489" [ref=e113] [cursor=pointer]:
            - text: Plains
            - generic [ref=e114]: Hex 489
          - button "Move to cell 490" [ref=e115] [cursor=pointer]:
            - text: Mountains
            - generic [ref=e116]: Hex 490
        - region "Settlement siege orders" [ref=e117]:
          - heading "Walls & blockades" [level=3] [ref=e118]
          - generic [ref=e119]:
            - strong [ref=e120]: Besieging Reedwatch
            - generic [ref=e121]:
              - generic [ref=e122]:
                - term [ref=e123]: Defenses
                - definition [ref=e124]: "0"
              - generic [ref=e125]:
                - term [ref=e126]: Supplies
                - definition [ref=e127]: "0"
              - generic [ref=e128]:
                - term [ref=e129]: Defending strength
                - definition [ref=e130]: "20"
            - button "Assault Reedwatch" [ref=e131] [cursor=pointer]: Assault settlement
            - button "Lift siege of Reedwatch" [ref=e132] [cursor=pointer]: Lift siege
            - paragraph [ref=e133]: End turns to maintain the blockade. An assault commits your army to a battle with the defenders and militia.
        - region "Nearby enemy forces" [ref=e134]:
          - heading "Field engagement" [level=3] [ref=e135]
          - paragraph [ref=e136]: "Your force: 720 strength · 75 morale · 0 fatigue."
          - generic [ref=e137]:
            - strong [ref=e138]: Reserve defender 1
            - generic [ref=e139]: Reedbound Council · hex 538
            - paragraph [ref=e140]: 6 strength · 31 morale · 0 fatigue
            - paragraph [ref=e141]: Hills · 20 defending formations
            - button "Attack Reserve defender 1 (army.19)" [ref=e142] [cursor=pointer]: Attack Reserve defender 1
          - generic [ref=e143]:
            - strong [ref=e144]: Reserve defender 7
            - generic [ref=e145]: Reedbound Council · hex 538
            - paragraph [ref=e146]: 1 strength · 31 morale · 0 fatigue
            - paragraph [ref=e147]: Hills · 20 defending formations
            - button "Attack Reserve defender 7 (army.25)" [ref=e148] [cursor=pointer]: Attack Reserve defender 7
          - generic [ref=e149]:
            - strong [ref=e150]: Reserve defender 8
            - generic [ref=e151]: Reedbound Council · hex 538
            - paragraph [ref=e152]: 1 strength · 31 morale · 0 fatigue
            - paragraph [ref=e153]: Hills · 20 defending formations
            - button "Attack Reserve defender 8 (army.26)" [ref=e154] [cursor=pointer]: Attack Reserve defender 8
          - generic [ref=e155]:
            - strong [ref=e156]: Reserve defender 9
            - generic [ref=e157]: Reedbound Council · hex 538
            - paragraph [ref=e158]: 1 strength · 31 morale · 0 fatigue
            - paragraph [ref=e159]: Hills · 20 defending formations
            - button "Attack Reserve defender 9 (army.27)" [ref=e160] [cursor=pointer]: Attack Reserve defender 9
          - generic [ref=e161]:
            - strong [ref=e162]: Reserve defender 10
            - generic [ref=e163]: Reedbound Council · hex 538
            - paragraph [ref=e164]: 1 strength · 31 morale · 0 fatigue
            - paragraph [ref=e165]: Hills · 20 defending formations
            - button "Attack Reserve defender 10 (army.28)" [ref=e166] [cursor=pointer]: Attack Reserve defender 10
          - generic [ref=e167]:
            - strong [ref=e168]: Reserve defender 11
            - generic [ref=e169]: Reedbound Council · hex 538
            - paragraph [ref=e170]: 1 strength · 31 morale · 0 fatigue
            - paragraph [ref=e171]: Hills · 20 defending formations
            - button "Attack Reserve defender 11 (army.29)" [ref=e172] [cursor=pointer]: Attack Reserve defender 11
          - generic [ref=e173]:
            - strong [ref=e174]: Reserve defender 12
            - generic [ref=e175]: Reedbound Council · hex 538
            - paragraph [ref=e176]: 1 strength · 31 morale · 0 fatigue
            - paragraph [ref=e177]: Hills · 20 defending formations
            - button "Attack Reserve defender 12 (army.30)" [ref=e178] [cursor=pointer]: Attack Reserve defender 12
          - generic [ref=e179]:
            - strong [ref=e180]: Reserve defender 13
            - generic [ref=e181]: Reedbound Council · hex 538
            - paragraph [ref=e182]: 1 strength · 31 morale · 0 fatigue
            - paragraph [ref=e183]: Hills · 20 defending formations
            - button "Attack Reserve defender 13 (army.31)" [ref=e184] [cursor=pointer]: Attack Reserve defender 13
          - generic [ref=e185]:
            - strong [ref=e186]: Reserve defender 14
            - generic [ref=e187]: Reedbound Council · hex 538
            - paragraph [ref=e188]: 1 strength · 31 morale · 0 fatigue
            - paragraph [ref=e189]: Hills · 20 defending formations
            - button "Attack Reserve defender 14 (army.32)" [ref=e190] [cursor=pointer]: Attack Reserve defender 14
          - generic [ref=e191]:
            - strong [ref=e192]: Reserve defender 15
            - generic [ref=e193]: Reedbound Council · hex 538
            - paragraph [ref=e194]: 1 strength · 31 morale · 0 fatigue
            - paragraph [ref=e195]: Hills · 20 defending formations
            - button "Attack Reserve defender 15 (army.33)" [ref=e196] [cursor=pointer]: Attack Reserve defender 15
          - generic [ref=e197]:
            - strong [ref=e198]: Reserve defender 16
            - generic [ref=e199]: Reedbound Council · hex 538
            - paragraph [ref=e200]: 1 strength · 31 morale · 0 fatigue
            - paragraph [ref=e201]: Hills · 20 defending formations
            - button "Attack Reserve defender 16 (army.34)" [ref=e202] [cursor=pointer]: Attack Reserve defender 16
          - generic [ref=e203]:
            - strong [ref=e204]: Reserve defender 17
            - generic [ref=e205]: Reedbound Council · hex 538
            - paragraph [ref=e206]: 1 strength · 31 morale · 0 fatigue
            - paragraph [ref=e207]: Hills · 20 defending formations
            - button "Attack Reserve defender 17 (army.35)" [ref=e208] [cursor=pointer]: Attack Reserve defender 17
          - generic [ref=e209]:
            - strong [ref=e210]: Reserve defender 18
            - generic [ref=e211]: Reedbound Council · hex 538
            - paragraph [ref=e212]: 1 strength · 31 morale · 0 fatigue
            - paragraph [ref=e213]: Hills · 20 defending formations
            - button "Attack Reserve defender 18 (army.36)" [ref=e214] [cursor=pointer]: Attack Reserve defender 18
          - generic [ref=e215]:
            - strong [ref=e216]: Reserve defender 19
            - generic [ref=e217]: Reedbound Council · hex 538
            - paragraph [ref=e218]: 1 strength · 31 morale · 0 fatigue
            - paragraph [ref=e219]: Hills · 20 defending formations
            - button "Attack Reserve defender 19 (army.37)" [ref=e220] [cursor=pointer]: Attack Reserve defender 19
          - generic [ref=e221]:
            - strong [ref=e222]: Reserve defender 20
            - generic [ref=e223]: Reedbound Council · hex 538
            - paragraph [ref=e224]: 1 strength · 31 morale · 0 fatigue
            - paragraph [ref=e225]: Hills · 20 defending formations
            - button "Attack Reserve defender 20 (army.38)" [ref=e226] [cursor=pointer]: Attack Reserve defender 20
          - paragraph [ref=e227]: The battle includes every defending land formation at that hex. Forests provide cover and hills favor defenders. Command each round or let your officers resolve the engagement.
        - generic [ref=e228]:
          - generic [ref=e229]: Selected hex 537
          - paragraph [ref=e230]: Steppe · Plains · fertility 77 · in sight
        - paragraph [ref=e231]: Claimed land · Reedbound Council · Reedwatch
  - contentinfo [ref=e232]:
    - generic [ref=e234]:
      - generic [ref=e235]: Selected army
      - strong [ref=e236]: Ashen Vanguard
      - generic [ref=e237]: 12 / 12 formations · 720 strength · 3 movement
      - button "Show selected orders" [ref=e239] [cursor=pointer]
    - region "Next-action navigation" [ref=e240]:
      - generic [ref=e241]:
        - button "Previous army needing orders" [disabled] [ref=e242]: ‹
        - button "Next army needing orders" [disabled] [ref=e243]: Next army N
        - button "Previous idle settlement" [disabled] [ref=e244]: ‹
        - button "Next idle settlement" [disabled] [ref=e245]: Next town S
      - paragraph [ref=e246]: "Labor: 2 unassigned households · 1 settlement"
      - generic [ref=e247]:
        - button "Previous settlement with unassigned households" [ref=e248] [cursor=pointer]: ‹
        - button "Next settlement with unassigned households" [ref=e249] [cursor=pointer]: Review households
    - generic [ref=e250]:
      - strong [ref=e252]: Turn 4
      - button "End turn" [ref=e253] [cursor=pointer]:
        - text: End turn
        - generic [ref=e254]: E
    - status [ref=e255]:
      - generic [aria-hidden] [ref=e256]: ◆
      - text: "Turn 4: orders are ready. Autosaved."
  - generic [ref=e257]:
    - button "Art Lab" [ref=e258] [cursor=pointer]
    - generic [ref=e259]: Development asset inspector
```

# Test source

```ts
  1   | import { expect, test, type Page, type Locator } from '@playwright/test';
  2   | import { createArmyFormation, deserializeGame, serializeGame, type GameState } from '@theandril/sim';
  3   | import { exportSave } from '@theandril/persistence';
  4   | import { borderBattleCampaign } from '../../packages/test-fixtures/src/combat-fixture';
  5   | import { conquestCampaign, CONQUEST_FIXTURE as C } from '../../packages/test-fixtures/src/conquest-fixture';
  6   | import { refreshAuthoredSight } from '../../packages/test-fixtures/src/authored-land';
  7   | import { closeManagement, openRealmAffairs, openSelectedOrders } from './ui-navigation';
  8   | 
  9   | /** Authored full-container reserve stress fixture; no naturally earned force-size claim.
  10  |  * Uses the same setup as the parent's canonical frontage regression tests. */
  11  | function reserveCampaign(siege: boolean): GameState {
  12  |   const state = siege ? conquestCampaign() : borderBattleCampaign();
  13  |   const town = state.settlements[C.settlementId]!;
  14  |   if (siege) {
  15  |     const attackers = state.armies[C.playerArmyId]!;
  16  |     attackers.formations = Array.from({ length: 12 }, (_, index) => createArmyFormation(index === 0 ? attackers.id : `army.${state.nextId++}`, 'unit.guard')).sort((a, b) => a.id < b.id ? -1 : 1);
  17  |   }
  18  |   for (let index = 0; index < 21; index++) {
  19  |     const id = !siege && index === 0 ? 'army.4' : `army.${state.nextId++}`;
  20  |     const original = state.armies['army.4'];
  21  |     state.armies[id] = { id, name: `Reserve defender ${index}`, factionId: town.factionId,
  22  |       cell: siege ? town.cell : original!.cell, movement: 0,
  23  |       formations: [{ ...createArmyFormation(id, 'unit.scout'), strength: 1, morale: 1 }] };
  24  |   }
  25  |   refreshAuthoredSight(state);
  26  |   return deserializeGame(serializeGame(state));
  27  | }
  28  | async function importAndDeclare(page: Page, game: GameState) {
  29  |   await page.goto('/');
  30  |   await page.locator('input[type=file]').setInputFiles({ name: 'reserve-contingent.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(game))) });
  31  |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  32  |   await openRealmAffairs(page);
  33  |   await page.getByRole('button', { name: 'Declare war on Reedbound Council', exact: true }).click();
  34  |   await openSelectedOrders(page);
  35  | }
  36  | async function assertQuote(panel: Locator, quote: { engagedFormations: number; engagedStrength: number; reserveFormations: number; reserveStrength: number }) {
  37  |   await expect(panel).toContainText(`Committed defense: ${quote.engagedFormations} formations · ${quote.engagedStrength} strength`);
  38  |   await expect(panel).toContainText(`Reserves: ${quote.reserveFormations} formation · ${quote.reserveStrength} strength`);
  39  |   await expect(panel).toContainText('Reserves defend in later engagements');
  40  | }
  41  | 
  42  | test('R03 public attack previews the canonical contingent and leaves its reserve on the map', async ({ page }, info) => {
  43  |   const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  44  |   await importAndDeclare(page, reserveCampaign(false));
  45  |   const target = page.locator('.attack-target').filter({ has: page.getByRole('button', { name: 'Attack Reserve defender 0 (army.4)', exact: true }) });
  46  |   const before = await page.evaluate(() => { const api = window.__THEANDRIL__!, view = api.getSummary()!; return { hash: api.getStateHash(), army: view.ownArmies.find(army => army.id === 'army.2')!, target: view.armies.find(army => army.id === 'army.4')! }; });
  47  |   expect(before.target.battleDefense).toBeDefined();
  48  |   await assertQuote(target.getByTestId('battle-defense-preview'), before.target.battleDefense!);
  49  |   await target.screenshot({ path: info.outputPath('field-defense-desktop.png') });
  50  |   expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(before.hash);
  51  |   await target.getByRole('button', { name: 'Attack Reserve defender 0 (army.4)', exact: true }).click();
  52  |   await expect(page.getByTestId('battle-panel')).toBeVisible();
  53  |   expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.battle!.combat.defender.length)).toBe(before.target.battleDefense!.engagedFormations);
  54  |   await page.getByRole('button', { name: 'Auto-resolve battle', exact: true }).click();
  55  |   await expect(page.getByTestId('battle-panel')).toHaveCount(0);
  56  |   const after = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!);
  57  |   expect(after.ownArmies.find(army => army.id === before.army.id)!.cell).toBe(before.army.cell);
  58  |   expect(after.armies.filter(army => army.cell === before.target.cell && army.factionId === before.target.factionId)).toHaveLength(1);
  59  |   await info.attach('field-defense', { body: JSON.stringify({ before, afterArmies: after.armies, errors }, null, 2), contentType: 'application/json' });
  60  |   expect(errors).toEqual([]);
  61  | });
  62  | 
  63  | test('R03 public siege shows reserves at 390px and requires their later defeat before capture', async ({ page }, info) => {
  64  |   const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  65  |   await importAndDeclare(page, reserveCampaign(true));
  66  |   await page.getByRole('button', { name: 'Besiege Reedwatch', exact: true }).click();
  67  |   for (let turn = 2; turn <= 4; turn++) {
  68  |     await closeManagement(page);
  69  |     await page.getByRole('button', { name: 'End turn', exact: true }).click();
  70  |     await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${turn}`);
  71  |   }
  72  |   await openSelectedOrders(page); await page.setViewportSize({ width: 390, height: 844 });
  73  |   const card = page.getByTestId(`siege-${C.settlementId}`);
  74  |   const before = await page.evaluate(() => ({ hash: window.__THEANDRIL__!.getStateHash(), siege: window.__THEANDRIL__!.getSummary()!.sieges[0]! }));
> 75  |   expect(before.siege.battleDefense?.reserveFormations).toBe(1);
      |                                                         ^ Error: expect(received).toBe(expected) // Object.is equality
  76  |   await assertQuote(card.getByTestId('battle-defense-preview'), before.siege.battleDefense!);
  77  |   await card.screenshot({ path: info.outputPath('siege-defense-390.png') });
  78  |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  79  |   expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(before.hash);
  80  |   await page.getByRole('button', { name: 'Assault Reedwatch', exact: true }).click();
  81  |   await expect(page.getByTestId('battle-panel')).toBeVisible();
  82  |   await page.getByRole('button', { name: 'Auto-resolve battle', exact: true }).click();
  83  |   await expect(page.getByTestId('battle-panel')).toHaveCount(0);
  84  |   await expect(page.getByTestId('capture-panel')).toHaveCount(0);
  85  |   const contested = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!);
  86  |   expect(contested.sieges).toHaveLength(1); expect(contested.pendingCapture).toBeNull();
  87  |   await closeManagement(page);
  88  |   await page.getByRole('button', { name: 'End turn', exact: true }).click();
  89  |   await expect(page.getByTestId('turn-counter')).toHaveText('Turn 5');
  90  |   await openSelectedOrders(page);
  91  |   await expect(card.getByTestId('battle-defense-preview')).toHaveCount(0);
  92  |   await page.getByRole('button', { name: 'Assault Reedwatch', exact: true }).click();
  93  |   await expect(page.getByTestId('battle-panel')).toBeVisible();
  94  |   await page.getByRole('button', { name: 'Auto-resolve battle', exact: true }).click();
  95  |   await expect(page.getByTestId('capture-panel')).toBeVisible();
  96  |   await page.getByRole('button', { name: 'Occupy settlement', exact: true }).click();
  97  |   await expect(page.getByTestId('capture-panel')).toHaveCount(0);
  98  |   expect(await page.evaluate(id => window.__THEANDRIL__!.getSummary()!.ownSettlements.some(town => town.id === id), C.settlementId)).toBe(true);
  99  |   await info.attach('siege-defense', { body: JSON.stringify({ before, contestedSieges: contested.sieges, errors }, null, 2), contentType: 'application/json' });
  100 |   expect(errors).toEqual([]);
  101 | });
  102 | 
```