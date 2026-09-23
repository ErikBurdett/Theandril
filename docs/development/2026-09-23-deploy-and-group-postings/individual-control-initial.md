# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: group-postings.spec.ts >> a hundred armies receive one group posting, retain individual overrides and restore through a real save
- Location: tests/gameplay/group-postings.spec.ts:8:1

# Error details

```
Test timeout of 45000ms exceeded.
```

```
Error: locator.click: Test timeout of 45000ms exceeded.
Call log:
  - waiting for getByTestId('army-posting').getByRole('button', { name: 'Post army', exact: true })

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
          - strong [ref=e20]: 251016 coin
        - generic [ref=e21]:
          - generic [ref=e22]: KNOWLEDGE
          - strong [ref=e23]: "0"
        - generic [ref=e24]:
          - generic [ref=e25]: HEARTHS
          - strong [ref=e26]: "40"
    - navigation "Campaign navigation" [ref=e27]:
      - generic [ref=e28]:
        - text: Standard pace ·
        - generic [ref=e29]: 40 realms
      - generic [ref=e30]: Partial archive · earlier history unavailable
    - group [ref=e31]:
      - generic "Campaign & settings" [ref=e32] [cursor=pointer]
  - main [ref=e33]:
    - region "Strategic map" [ref=e34]:
      - generic: SEED 20260905 · 640 × 480Legacy geography
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
        - paragraph [ref=e78]: Registry company 001
      - button "Close Selected orders" [ref=e79] [cursor=pointer]: ×
    - region "Selected entity orders" [ref=e81]:
      - button "Show on map" [ref=e82] [cursor=pointer]
      - group [ref=e83]:
        - generic [ref=e84]:
          - img "Ashen Compact army banner · approved faction artwork" [ref=e85]
          - heading "Registry company 001" [level=2] [ref=e86]
        - paragraph [ref=e87]: Oath guard · cell 134018
        - generic [ref=e88]:
          - generic [ref=e89]:
            - strong [ref=e90]: "3"
            - generic [ref=e91]: Movement
          - generic [ref=e92]:
            - strong [ref=e93]: "60"
            - generic [ref=e94]: Strength
        - paragraph [ref=e95]: Supplied from Ashen Compact Hold.
        - region "Army commander and agents" [ref=e96]:
          - paragraph [ref=e97]: "Commander: No marshal assigned"
          - paragraph [ref=e98]: "Command: 1 / 12 formations. Unled detachment: twelve-formation command capacity."
          - paragraph [ref=e99]: "Agents: None attached"
          - button "Manage characters for Registry company 001" [ref=e100] [cursor=pointer]: Manage army characters
        - generic [ref=e101]:
          - button "Survey for an arcane seam · 24 coin" [ref=e102] [cursor=pointer]
          - paragraph [ref=e103]: Ashfall glass marks ground worth surveying. A survey spends this company’s movement and reveals any seam within two hexes; holding one inside your borders draws ashglass and allows Arcane Theory.
        - region "Map movement orders" [ref=e104]:
          - heading "Paths & marching orders" [level=3] [ref=e105]
          - paragraph [ref=e106]: 32 highlighted destinations within current movement. Click a reachable hex to move, or a reachable hostile army to attack. Dragging only pans.
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
          - generic "Standing posting Hold · Ashen Compact Hold" [active] [ref=e116] [cursor=pointer]:
            - text: Standing posting
            - generic [ref=e117]: Hold · Ashen Compact Hold
          - paragraph [ref=e118]: A posted army marches to its hex under an ordinary travel order and then holds it, or joins the force standing there. A travel order you give yourself always comes first, and the posting waits.
          - paragraph [ref=e119]: Standing at its posting.
          - generic [ref=e120]:
            - text: Posted to
            - combobox "Posted to" [ref=e121]:
              - option "Where it stands · hex 134018" [selected]
              - option "Emberwake Convocation Hold · hex 109924"
              - option "Underhush Exchange Hold · hex 212059"
              - option "Vesper Court Hold · hex 222206"
              - option "Manytrack Moot Hold · hex 94679"
              - option "Margin Observance Hold · hex 100237"
              - option "Free Ashen Compact Hold · hex 143504"
              - option "Free Reedbound Council Hold · hex 191115"
              - option "Free Cinder March Hold · hex 42448"
              - option "Free Glass Tide Hold · hex 152261"
              - option "Free Iron Covenant Hold · hex 55968"
              - option "Free Sepulchral Synod Hold · hex 211124"
              - option "Free Mire Courts Hold · hex 138554"
              - option "Free Saltwind Remnant Hold · hex 190997"
              - option "Free Wardhall Remnant Hold · hex 156379"
              - option "Free Rimehorn Clans Hold · hex 242728"
              - option "Free Sable Steppe Hold · hex 112207"
              - option "Free Morrow Spore Hold · hex 226397"
              - option "Free Cistern Assembly Hold · hex 86557"
              - option "Free Unsealed Companies Hold · hex 243612"
              - option "Free Lantern Hospices Hold · hex 177147"
              - option "Free Cairnwing Concord Hold · hex 264844"
              - option "Reedbound Council Hold · hex 160643"
              - option "Cinder March Hold · hex 43364"
              - option "Glass Tide Hold · hex 87069"
              - option "Iron Covenant Hold · hex 41070"
              - option "Sepulchral Synod Hold · hex 95701"
              - option "Mire Courts Hold · hex 154056"
              - option "Saltwind Remnant Hold · hex 97544"
              - option "Wardhall Remnant Hold · hex 113827"
              - option "Rimehorn Clans Hold · hex 60541"
              - option "Sable Steppe Hold · hex 123530"
              - option "Morrow Spore Hold · hex 94812"
              - option "Cistern Assembly Hold · hex 192801"
              - option "Unsealed Companies Hold · hex 77239"
              - option "Lantern Hospices Hold · hex 139276"
              - option "Cairnwing Concord Hold · hex 53673"
              - option "Red Sluice Directorate Hold · hex 139587"
              - option "Velvet Meridian Hold · hex 207440"
              - option "Brine Choir Hold · hex 193915"
          - generic [ref=e122]:
            - text: On arrival
            - combobox "On arrival" [ref=e123]:
              - option "Join the force there" [selected]
              - option "Hold the hex"
          - button "Update posting" [ref=e124] [cursor=pointer]
          - button "Clear posting" [ref=e125] [cursor=pointer]
        - generic [ref=e126]:
          - button "Raise a supply depot · 40 coin" [disabled] [ref=e127]
          - paragraph [ref=e128]: A hearth already supplies this ground.
        - group [ref=e129]:
          - generic "Army composition 1 / 12 formations" [ref=e130] [cursor=pointer]:
            - text: Army composition
            - generic [ref=e131]: 1 / 12 formations
          - option "Registry company 002 · army.1041" [selected]
          - option "Registry company 003 · army.1081"
          - option "Registry company 004 · army.1121"
          - option "Registry company 005 · army.1161"
          - option "Registry company 006 · army.1201"
          - option "Registry company 007 · army.121"
          - option "Registry company 008 · army.1241"
          - option "Registry company 009 · army.1281"
          - option "Registry company 010 · army.1321"
          - option "Registry company 011 · army.1361"
          - option "Registry company 012 · army.1401"
          - option "Registry company 013 · army.1441"
          - option "Registry company 014 · army.1481"
          - option "Registry company 015 · army.1521"
          - option "Registry company 016 · army.1561"
          - option "Registry company 017 · army.1601"
          - option "Registry company 018 · army.161"
          - option "Registry company 019 · army.1641"
          - option "Registry company 020 · army.1681"
          - option "Registry company 021 · army.1721"
          - option "Registry company 022 · army.1761"
          - option "Registry company 023 · army.1801"
          - option "Registry company 024 · army.1841"
          - option "Registry company 025 · army.1881"
        - heading "Single-step shortcuts" [level=3] [ref=e132]
        - paragraph [ref=e133]: "Optional: move one neighboring hex using the buttons below. For complete routes and attacks, use the map or Paths & marching orders above."
        - generic [ref=e134]:
          - button "Move to cell 134019" [ref=e135] [cursor=pointer]:
            - text: Plains
            - generic [ref=e136]: Hex 134019
          - button "Move to cell 134659" [ref=e137] [cursor=pointer]:
            - text: Plains
            - generic [ref=e138]: Hex 134659
          - button "Move to cell 134658" [ref=e139] [cursor=pointer]:
            - text: Plains
            - generic [ref=e140]: Hex 134658
          - button "Move to cell 134017" [ref=e141] [cursor=pointer]:
            - text: Plains
            - generic [ref=e142]: Hex 134017
          - button "Move to cell 133378" [ref=e143] [cursor=pointer]:
            - text: Plains
            - generic [ref=e144]: Hex 133378
          - button "Move to cell 133379" [ref=e145] [cursor=pointer]:
            - text: Plains
            - generic [ref=e146]: Hex 133379
        - region "Settlement siege orders" [ref=e147]:
          - heading "Walls & blockades" [level=3] [ref=e148]
          - paragraph [ref=e149]: No neighboring foreign settlements are in sight.
        - region "Nearby enemy forces" [ref=e150]:
          - heading "Field engagement" [level=3] [ref=e151]
          - paragraph [ref=e152]: "Your force: 60 strength · 75 morale · 0 fatigue."
          - paragraph [ref=e153]: No neighboring foreign land armies are in sight.
        - generic [ref=e154]:
          - generic [ref=e155]: Selected hex 134018
          - paragraph [ref=e156]: Temperate grassland · Plains · fertility 76 · in sight
        - paragraph [ref=e157]: Claimed land · Ashen Compact · Ashen Compact Hold
  - contentinfo [ref=e158]:
    - generic [ref=e161]:
      - generic [ref=e162]: Selected army
      - strong [ref=e163]: Registry company 001
      - generic [ref=e164]: 1 / 12 formations · 60 strength · 3 movement
      - generic [ref=e165]:
        - button "Show selected orders" [ref=e166] [cursor=pointer]
        - button "Show on map" [ref=e167] [cursor=pointer]
    - region "Next-action navigation" [ref=e168]:
      - paragraph [ref=e169]: 0 needing orders · 40 idle settlements
      - generic [ref=e170]:
        - button "Previous army needing orders" [disabled] [ref=e171]: ‹
        - button "Next army needing orders" [disabled] [ref=e172]: Next army N
        - button "Previous idle settlement" [ref=e173] [cursor=pointer]: ‹
        - button "Next idle settlement" [ref=e174] [cursor=pointer]: Next town S
      - paragraph [ref=e175]: "Labor: 134 unassigned households · 40 settlements"
      - generic [ref=e176]:
        - button "Previous settlement with unassigned households" [ref=e177] [cursor=pointer]: ‹
        - button "Next settlement with unassigned households" [ref=e178] [cursor=pointer]: Review households
      - group [ref=e179]:
        - generic "What wants a decision 2 kinds" [ref=e180] [cursor=pointer]:
          - text: What wants a decision
          - generic [ref=e181]: 2 kinds
      - status
    - generic [ref=e182]:
      - generic [ref=e183]:
        - generic [ref=e184]: AGE OF FRACTURE
        - strong [ref=e185]: Turn 1
      - button "End turn" [ref=e186] [cursor=pointer]:
        - text: End turn
        - generic [ref=e187]: E
    - status [ref=e188]:
      - generic [aria-hidden] [ref=e189]: ◆
      - text: Campaign saved.
  - generic [ref=e190]:
    - button "Art Lab" [ref=e191] [cursor=pointer]
    - generic [ref=e192]: Development asset inspector
```

# Test source

```ts
  1   | import { expect, test } from '@playwright/test';
  2   | import { createGame, serializeGame } from '@theandril/sim';
  3   | import { exportSave } from '@theandril/persistence';
  4   | import { cellTransferBytes, packCells } from '../../apps/web/src/cell-transfer';
  5   | import { empireLandCampaign } from '../../packages/test-fixtures/src/empire-land-fixture';
  6   | import { closeManagement, openRegistry, openSelectedOrders, selectFromRegistry } from './ui-navigation';
  7   | 
  8   | test('a hundred armies receive one group posting, retain individual overrides and restore through a real save', async ({ page }, testInfo) => {
  9   |   const game = empireLandCampaign('legendary');
  10  |   const own = Object.values(game.armies).filter(army => army.factionId === game.turnOwnerId).sort((a, b) => a.id < b.id ? -1 : 1);
  11  |   own.forEach((army, index) => { army.name = `Registry company ${String(index + 1).padStart(3, '0')}`; });
  12  |   expect(own).toHaveLength(100);
  13  |   const errors: string[] = [];
  14  |   page.on('pageerror', error => errors.push(error.message));
  15  |   await page.goto('/');
  16  |   await page.locator('input[type=file]').setInputFiles({ name: 'group-postings.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(game))) });
  17  |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  18  |   const before = await page.evaluate(() => ({ hash: window.__THEANDRIL__!.getStateHash(), metrics: window.__THEANDRIL__!.getPerformanceCounters(), explored: window.__THEANDRIL__!.getSummary()!.exploredCells }));
  19  |   await openRegistry(page, 'armies');
  20  |   const registry = page.getByTestId('army-registry'), group = page.getByTestId('group-postings');
  21  |   await expect(registry.getByRole('button')).toHaveCount(25);
  22  |   await registry.getByRole('checkbox').first().focus(); await page.keyboard.press('Space');
  23  |   await page.getByRole('button', { name: 'Next registry page', exact: true }).click();
  24  |   await registry.getByRole('checkbox').first().check();
  25  |   const search = page.getByRole('searchbox', { name: 'Search your realm' });
  26  |   await search.fill('Registry company 100');
  27  |   await expect(group).toContainText('2 armies selected · 2 outside this filter');
  28  |   await group.getByRole('button', { name: 'Select matching armies', exact: true }).click();
  29  |   await expect(group).toContainText('3 armies selected · 2 outside this filter');
  30  |   await search.fill('');
  31  |   await group.getByRole('button', { name: 'Select matching armies', exact: true }).click();
  32  |   await expect(group).toContainText('100 armies selected');
  33  |   expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(before.hash);
  34  |   expect(await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().totalTransferBytes)).toBe(before.metrics.totalTransferBytes);
  35  |   await group.getByRole('button', { name: 'Post selected armies (100)', exact: true }).click();
  36  |   await expect(page.getByTestId('group-posting-results')).toContainText('100 orders accepted · 0 refused');
  37  |   await expect(group).toContainText('0 armies selected');
  38  |   const after = await page.evaluate(() => ({ view: window.__THEANDRIL__!.getSummary()!, hash: window.__THEANDRIL__!.getStateHash(), metrics: window.__THEANDRIL__!.getPerformanceCounters() }));
  39  |   expect(after.view.postings).toHaveLength(100);
  40  |   expect(after.view.postings.every(posting => posting.mode === 'hold' && posting.arrived)).toBe(true);
  41  |   expect(after.view.exploredCells).toBe(before.explored);
  42  |   expect(after.metrics.cellTransferBytes).toBe(cellTransferBytes(packCells([])));
  43  |   expect(after.metrics.totalTransferBytes - before.metrics.totalTransferBytes).toBe(after.metrics.transferBytes);
  44  |   await testInfo.attach('group-transfer.json', { body: JSON.stringify({ authored: 'Legendary, 40 owned hearths, 100 owned armies, 4000 total armies', commandMs: after.metrics.commandMs, transferBytes: after.metrics.transferBytes, cellTransferBytes: after.metrics.cellTransferBytes, publishedStates: 1, beforeHash: before.hash, afterHash: after.hash }, null, 2), contentType: 'application/json' });
  45  |   await page.screenshot({ path: testInfo.outputPath('group-postings-desktop.png') });
  46  |   await closeManagement(page);
  47  |   await page.getByTestId('campaign-menu').locator(':scope > summary').click();
  48  |   await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  49  |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  50  |   await selectFromRegistry(page, 'armies', own[0]!.name);
  51  |   await openSelectedOrders(page);
  52  |   const posting = page.getByTestId('army-posting');
  53  |   await posting.locator(':scope > summary').click();
  54  |   await posting.getByLabel('On arrival').selectOption('join');
> 55  |   await posting.getByRole('button', { name: 'Post army', exact: true }).click();
      |                                                                         ^ Error: locator.click: Test timeout of 45000ms exceeded.
  56  |   await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.postings.filter(item => item.mode === 'join').length)).toBe(1);
  57  |   expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.postings.filter(item => item.mode === 'hold').length)).toBe(99);
  58  |   await page.setViewportSize({ width: 390, height: 844 });
  59  |   await openRegistry(page, 'armies');
  60  |   await search.fill('');
  61  |   await group.getByRole('button', { name: 'Select matching armies', exact: true }).click();
  62  |   await expect(group).toContainText('100 armies selected');
  63  |   await group.scrollIntoViewIfNeeded();
  64  |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  65  |   await page.screenshot({ path: testInfo.outputPath('group-postings-narrow.png') });
  66  |   await group.getByRole('button', { name: 'Clear selected postings (100)', exact: true }).click();
  67  |   await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.postings.length)).toBe(0);
  68  |   await expect(page.getByTestId('group-posting-results')).toContainText('100 orders accepted · 0 refused');
  69  |   await closeManagement(page);
  70  |   await page.getByTestId('campaign-menu').locator(':scope > summary').click();
  71  |   await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  72  |   await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  73  |   expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(after.hash);
  74  |   await openRegistry(page, 'armies');
  75  |   await expect(group).toContainText('0 armies selected');
  76  |   expect(errors).toEqual([]);
  77  | });
  78  | 
  79  | test('a partly refused group reports the canonical limit and retains only refused armies', async ({ page }) => {
  80  |   const game = createGame({ seed: 17, size: 'tiny', factionCount: 2 });
  81  |   const army = game.armies['army.1']!;
  82  |   // Authored boundary fixture: old lost-army postings are valid until the next
  83  |   // turn prunes them. Foreign records occupy the limit without exposing them.
  84  |   game.postings = [{ armyId: army.id, factionId: army.factionId, cell: army.cell, mode: 'hold' },
  85  |     ...Array.from({ length: 8191 }, (_, index) => ({ armyId: `army.expired.${String(index).padStart(4, '0')}`, factionId: game.factions[1]!.id, cell: game.world.starts[1]!, mode: 'hold' as const }))];
  86  |   await page.goto('/');
  87  |   await page.locator('input[type=file]').setInputFiles({ name: 'limited-group-postings.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(game))) });
  88  |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  89  |   await openRegistry(page, 'armies');
  90  |   const group = page.getByTestId('group-postings');
  91  |   await group.getByRole('button', { name: 'Select matching armies', exact: true }).click();
  92  |   await group.getByRole('button', { name: /^Post selected armies/ }).click();
  93  |   await expect(page.getByTestId('group-posting-results')).toContainText('1 orders accepted · 1 refused');
  94  |   await expect(page.getByTestId('group-posting-results')).toContainText('as many postings as it may');
  95  |   await expect(group).toContainText('1 armies selected');
  96  |   await expect(page.getByTestId('group-posting-results')).toContainText('Refused armies remain selected for review');
  97  |   await expect(group.getByRole('button', { name: /^Post selected armies/ })).toBeEnabled();
  98  |   expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.postings.length)).toBe(1);
  99  | });
  100 | 
```