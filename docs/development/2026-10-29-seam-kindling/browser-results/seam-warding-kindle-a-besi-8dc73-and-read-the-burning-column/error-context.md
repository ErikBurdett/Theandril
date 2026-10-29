# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: seam-warding.spec.ts >> kindle a besieged hearth from a Flame seam and read the burning column
- Location: tests/gameplay/seam-warding.spec.ts:110:1

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 6
+ Received  + 1

- Array [
-   Array [
-     20,
-     true,
-   ],
- ]
+ Array []
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
          - strong [ref=e20]: 261 coin
        - generic [ref=e21]:
          - generic [ref=e22]: KNOWLEDGE
          - strong [ref=e23]: "266"
        - generic [ref=e24]:
          - generic [ref=e25]: HEARTHS
          - strong [ref=e26]: "1"
    - navigation "Campaign navigation" [ref=e27]:
      - generic [ref=e28]:
        - text: Short pace ·
        - generic [ref=e29]: 2 realms
      - generic [ref=e30]: Partial archive · earlier history unavailable
    - group [ref=e31]:
      - generic "Campaign & settings" [ref=e32] [cursor=pointer]
  - main [ref=e33]:
    - region "Strategic map" [ref=e34]:
      - generic: SEED 20260906 · 48 × 32Continents
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
  - contentinfo [ref=e73]:
    - generic [ref=e76]:
      - generic [ref=e77]: Selected army
      - strong [ref=e78]: Wayfinder
      - generic [ref=e79]: 1 / 12 formations · 20 strength · 5 movement
      - generic [ref=e80]:
        - button "Show selected orders" [ref=e81] [cursor=pointer]
        - button "Show on map" [ref=e82] [cursor=pointer]
    - region "Next-action navigation" [ref=e83]:
      - paragraph [ref=e84]: 1 needing orders · 1 idle settlements
      - generic [ref=e85]:
        - button "Previous army needing orders" [ref=e86] [cursor=pointer]: ‹
        - button "Next army needing orders" [ref=e87] [cursor=pointer]: Next army N
        - button "Previous idle settlement" [ref=e88] [cursor=pointer]: ‹
        - button "Next idle settlement" [ref=e89] [cursor=pointer]: Next town S
      - paragraph [ref=e90]: "Labor: 1 unassigned household · 1 settlement"
      - generic [ref=e91]:
        - button "Previous settlement with unassigned households" [ref=e92] [cursor=pointer]: ‹
        - button "Next settlement with unassigned households" [ref=e93] [cursor=pointer]: Review households
      - group [ref=e94]:
        - generic "What wants a decision 3 kinds" [ref=e95] [cursor=pointer]:
          - text: What wants a decision
          - generic [ref=e96]: 3 kinds
      - status
    - generic [ref=e97]:
      - generic [ref=e98]:
        - generic [ref=e99]: AGE OF FRACTURE
        - strong [ref=e100]: Turn 2
      - button "End turn" [ref=e101] [cursor=pointer]:
        - text: End turn
        - generic [ref=e102]: E
    - status [ref=e103]:
      - generic [aria-hidden] [ref=e104]: ◆
      - text: "Turn 2: orders are ready. Autosaved."
  - generic [ref=e105]:
    - button "Art Lab" [ref=e106] [cursor=pointer]
    - generic [ref=e107]: Development asset inspector
```

# Test source

```ts
  51  |   await expect(ledger).toContainText('30 · warded');
  52  |   await ledger.screenshot({ path: testInfo.outputPath('warded-ledger.png') });
  53  |   await closeManagement(page);
  54  |   await page.getByRole('button', { name: 'End turn', exact: true }).click();
  55  |   await expect(page.getByTestId('turn-counter')).toHaveText('Turn 2');
  56  |   expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.sieges.length)).toBe(0);
  57  |   expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.wards?.map(ward => ward.remainingTurns))).toEqual([9]);
  58  |   expect(errors).toEqual([]);
  59  | });
  60  | 
  61  | /** Rules 41: the besieger's riding Rune caster breaks the ward on its turn; the
  62  |  * player reads the broken ward, the jarred caster and the resumed works. */
  63  | test('a besieger breaks the ward on its turn and the holder is jarred', async ({ page }, testInfo) => {
  64  |   const errors: string[] = [];
  65  |   page.on('pageerror', error => errors.push(error.message));
  66  |   const state = attunementCampaign(), player = state.turnOwnerId, rival = state.factions[1]!;
  67  |   const host = Object.values(state.settlements).find(town => town.factionId === player)!;
  68  |   const caster = Object.values(state.characters).find(item => item.factionId === player && item.definitionId === 'character.waykeeper')!;
  69  |   state.resources.stockpiles[player]!['resource.ashglass'] = 20;
  70  |   const column = Object.values(state.armies).find(army => army.factionId === rival.id)!;
  71  |   column.cell = neighbors(host.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell] ?? 0) && Object.values(state.armies).every(army => army.cell !== cell))!;
  72  |   column.movement = 3; refreshAuthoredSight(state);
  73  |   expect(applyCommand(state, { type: 'declareWar', factionId: rival.id, targetFactionId: player })).toMatchObject({ ok: true });
  74  |   expect(applyCommand(state, { type: 'besiege', factionId: rival.id, armyId: column.id, settlementId: host.id })).toMatchObject({ ok: true });
  75  |   const hearth = Object.values(state.settlements).find(town => town.factionId === rival.id)!;
  76  |   rival.treasury += 200; state.resources.stockpiles[rival.id] = { ...state.resources.stockpiles[rival.id], 'resource.ashglass': 10 };
  77  |   expect(applyCommand(state, { type: 'recruitCharacter', factionId: rival.id, settlementId: hearth.id, definitionId: 'character.waykeeper' })).toMatchObject({ ok: true });
  78  |   const breaker = Object.values(state.characters).find(item => item.factionId === rival.id && item.definitionId === 'character.waykeeper')!;
  79  |   breaker.aptitudes = { 'path.flame': 1, 'path.rune': 2 }; breaker.location = { kind: 'army', armyId: column.id };
  80  |   state.arcaneResearch[rival.id] = [...new Set([...(state.arcaneResearch[rival.id] ?? []), 'arcane.rune_binding', 'arcane.unbinding'])];
  81  |   await page.goto('/');
  82  |   await page.waitForLoadState('networkidle');
  83  |   await page.locator('input[type=file]').setInputFiles({ name: 'contested-ward.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  84  |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  85  |   await closeManagement(page);
  86  |   await page.getByRole('button', { name: 'Characters & agents', exact: true }).click();
  87  |   await roster(page).getByRole('searchbox', { name: 'Search characters', exact: true }).fill(caster.name);
  88  |   await roster(page).getByRole('button', { name: `Inspect ${caster.name} (${caster.id})`, exact: true }).click();
  89  |   const rites = roster(page).getByTestId('strategic-rites');
  90  |   await rites.getByRole('button', { name: 'Perform Seam warding', exact: true }).click();
  91  |   await expect(rites.getByTestId(`ward-${host.id}`)).toContainText('10 turns remaining');
  92  |   await roster(page).getByRole('button', { name: 'Close characters', exact: true }).click();
  93  | 
  94  |   await page.getByRole('button', { name: 'End turn', exact: true }).click();
  95  |   await expect(page.getByTestId('turn-counter')).toHaveText('Turn 2');
  96  |   expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.wards?.length ?? 0)).toBe(0);
  97  |   expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.sieges.map(siege => [siege.defenses, siege.warded ?? false]))).toEqual([[20, false]]);
  98  |   await page.getByRole('button', { name: 'Characters & agents', exact: true }).click();
  99  |   await roster(page).getByRole('searchbox', { name: 'Search characters', exact: true }).fill(caster.name);
  100 |   await roster(page).getByRole('button', { name: `Inspect ${caster.name} (${caster.id})`, exact: true }).click();
  101 |   await expect(roster(page).getByTestId('character-sheet')).toContainText('wounded · 1 turns');
  102 |   await expect(rites.getByTestId(`ward-${host.id}`)).toHaveCount(0);
  103 |   await expect(rites).toContainText('This caster must recover from wounds.');
  104 |   await rites.screenshot({ path: testInfo.outputPath('ward-broken.png') });
  105 |   expect(errors).toEqual([]);
  106 | });
  107 | 
  108 | /** Rules 42: a Flame caster kindles the hearth; the besieging column burns
  109 |  * each turn while the works still wear the walls, and the ledger says so. */
  110 | test('kindle a besieged hearth from a Flame seam and read the burning column', async ({ page }, testInfo) => {
  111 |   const errors: string[] = [];
  112 |   page.on('pageerror', error => errors.push(error.message));
  113 |   const state = attunementCampaign(), player = state.turnOwnerId, rival = state.factions[1]!.id;
  114 |   const host = Object.values(state.settlements).find(town => town.factionId === player)!;
  115 |   const caster = Object.values(state.characters).find(item => item.factionId === player && item.definitionId === 'character.waykeeper')!;
  116 |   caster.aptitudes = { 'path.flame': 2 };
  117 |   state.resources.stockpiles[player]!['resource.ashglass'] = 20;
  118 |   const column = Object.values(state.armies).find(army => army.factionId === rival)!;
  119 |   column.cell = neighbors(host.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell] ?? 0) && Object.values(state.armies).every(army => army.cell !== cell))!;
  120 |   // Shaken ranks: too strong to lift the siege for a kindling, too shaken to assault, so the column stands and burns.
  121 |   column.movement = 3; for (const formation of column.formations) formation.morale = 30;
  122 |   refreshAuthoredSight(state);
  123 |   expect(applyCommand(state, { type: 'declareWar', factionId: rival, targetFactionId: player })).toMatchObject({ ok: true });
  124 |   expect(applyCommand(state, { type: 'besiege', factionId: rival, armyId: column.id, settlementId: host.id })).toMatchObject({ ok: true });
  125 |   const strengthBefore = column.formations.reduce((total, formation) => total + formation.strength, 0);
  126 |   await page.goto('/');
  127 |   await page.waitForLoadState('networkidle');
  128 |   await page.locator('input[type=file]').setInputFiles({ name: 'kindled-hearth.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  129 |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  130 |   await closeManagement(page);
  131 |   await page.getByRole('button', { name: 'Characters & agents', exact: true }).click();
  132 |   await roster(page).getByRole('searchbox', { name: 'Search characters', exact: true }).fill(caster.name);
  133 |   await roster(page).getByRole('button', { name: `Inspect ${caster.name} (${caster.id})`, exact: true }).click();
  134 |   const rites = roster(page).getByTestId('strategic-rites');
  135 |   await expect(rites.getByTestId('rite-rite.seam_warding')).toContainText('This Waykeeper lacks the personal path for the rite.');
  136 |   await expect(rites.getByRole('button', { name: 'Perform Seam warding', exact: true })).toBeDisabled();
  137 |   await rites.getByRole('button', { name: 'Perform Seam kindling', exact: true }).click();
  138 |   await expect(rites.getByTestId(`ward-${host.id}`)).toContainText('Seam kindling');
  139 |   await rites.screenshot({ path: testInfo.outputPath('kindling-performed.png') });
  140 |   await roster(page).getByRole('button', { name: 'Close characters', exact: true }).click();
  141 | 
  142 |   await openRealmAffairs(page);
  143 |   const ledger = page.getByLabel('Known sieges', { exact: true });
  144 |   await expect(ledger).toContainText('30 · kindled');
  145 |   await ledger.screenshot({ path: testInfo.outputPath('kindled-ledger.png') });
  146 |   await closeManagement(page);
  147 |   await page.getByRole('button', { name: 'End turn', exact: true }).click();
  148 |   await expect(page.getByTestId('turn-counter')).toHaveText('Turn 2');
  149 |   // The column stood before the kindled walls and burned while the works wore the walls.
  150 |   const summary = await page.evaluate(() => { const view = window.__THEANDRIL__!.getSummary()!; return { sieges: view.sieges.map(siege => [siege.defenses, siege.kindled ?? false]), wards: view.wards?.length ?? 0, enemyStrength: view.armies.filter(army => army.factionId !== view.factionId).reduce((total, army) => total + army.strength, 0) }; });
> 151 |   expect(summary.sieges).toEqual([[20, true]]);
      |                          ^ Error: expect(received).toEqual(expected) // deep equality
  152 |   expect(summary.wards).toBe(1);
  153 |   expect(summary.enemyStrength).toBe(strengthBefore - 8);
  154 |   await openRealmAffairs(page);
  155 |   await expect(page.getByLabel('Known sieges', { exact: true })).toContainText('20 · kindled');
  156 |   expect(errors).toEqual([]);
  157 | });
  158 | 
```