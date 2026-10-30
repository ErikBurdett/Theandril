# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: terrain-art.spec.ts >> all twelve approved biome tiles remain distinct beneath compact hills relief and actual troop sprites
- Location: tests/gameplay/terrain-art.spec.ts:45:1

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 6
+ Received  + 1

- Array [
-   Object {
-     "contentId": "unit.scout.ashen_compact",
-     "frameId": StringMatching /^unit\.scout\.ashen_compact\/idle\/se\/[0-3]$/,
-   },
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
          - strong [ref=e20]: 60 coin
        - generic [ref=e21]:
          - generic [ref=e22]: KNOWLEDGE
          - strong [ref=e23]: "0"
        - generic [ref=e24]:
          - generic [ref=e25]: HEARTHS
          - strong [ref=e26]: "0"
    - navigation "Campaign navigation" [ref=e27]:
      - generic [ref=e28]:
        - text: Standard pace ·
        - generic [ref=e29]: 2 realms
      - generic [ref=e30]: Partial archive · earlier history unavailable
    - group [ref=e31]:
      - generic "Campaign & settings" [ref=e32] [cursor=pointer]
  - main [ref=e33]:
    - region "Strategic map" [ref=e34]:
      - generic: SEED 20260905 · 48 × 32Legacy geography
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
        - button "Zoom in" [active] [ref=e67] [cursor=pointer]: +
        - button "Zoom out" [ref=e68] [cursor=pointer]: −
        - button "Focus selection" [ref=e69] [cursor=pointer]
        - button "Open map actions" [ref=e70] [cursor=pointer]
        - button "Map guide" [ref=e71] [cursor=pointer]: "?"
      - group:
        - generic "World map · Terrain" [ref=e72] [cursor=pointer]
  - contentinfo [ref=e73]:
    - generic [ref=e76]:
      - generic [ref=e77]: Your realm
      - strong [ref=e78]: Select a force or hearth
      - generic [ref=e79]: Explore the map or open a roster.
      - generic [ref=e80]:
        - button "Show selected orders" [ref=e81] [cursor=pointer]
        - button "Show on map" [ref=e82] [cursor=pointer]
    - region "Next-action navigation" [ref=e83]:
      - paragraph [ref=e84]: 1 needing orders · 0 idle settlements
      - generic [ref=e85]:
        - button "Previous army needing orders" [ref=e86] [cursor=pointer]: ‹
        - button "Next army needing orders" [ref=e87] [cursor=pointer]: Next army N
        - button "Previous idle settlement" [disabled] [ref=e88]: ‹
        - button "Next idle settlement" [disabled] [ref=e89]: Next town S
      - paragraph [ref=e90]: "Labor: 0 unassigned households · 0 settlements"
      - generic [ref=e91]:
        - button "Previous settlement with unassigned households" [disabled] [ref=e92]: ‹
        - button "Next settlement with unassigned households" [disabled] [ref=e93]: Review households
      - group [ref=e94]:
        - generic "What wants a decision 1 kind" [ref=e95] [cursor=pointer]:
          - text: What wants a decision
          - generic [ref=e96]: 1 kind
      - status
    - generic [ref=e97]:
      - generic [ref=e98]:
        - generic [ref=e99]: AGE OF FRACTURE
        - strong [ref=e100]: Turn 1
      - button "End turn" [ref=e101] [cursor=pointer]:
        - text: End turn
        - generic [ref=e102]: E
    - status [ref=e103]:
      - generic [aria-hidden] [ref=e104]: ◆
      - text: "Imported campaign. Partial archive: earlier campaign history was not recorded in this save."
  - generic [ref=e105]:
    - button "Art Lab" [ref=e106] [cursor=pointer]
    - generic [ref=e107]: Development asset inspector
```

# Test source

```ts
  1   | import { expect, test, type Page } from '@playwright/test';
  2   | import { selectFromRegistry } from './ui-navigation';
  3   | import { BIOME_NAMES, neighbors } from '@theandril/mapgen';
  4   | import { IMPROVEMENTS } from '@theandril/content';
  5   | import { applyCommand, createArmyFormation, createGame, deserializeGame, serializeGame, type GameState } from '@theandril/sim';
  6   | import { exportSave } from '@theandril/persistence';
  7   | import { refreshAuthoredSight } from '../../packages/test-fixtures/src/authored-land';
  8   | 
  9   | const ORIGIN = 500;
  10  | const SAMPLES = [-98, -97, -96, -95, -94, -50, -49, -48, -47, -46, -2, -1].map(offset => ORIGIN + offset);
  11  | function climateGallery(): GameState {
  12  |   const state = createGame({ generatorVersion: 4, seed: 20260905, size: 'tiny', factionCount: 2 });
  13  |   state.world.terrain.fill(1); state.world.biome.fill(1); state.world.fertility.fill(60); state.world.waterDepth.fill(0);
  14  |   state.resources.deposits = {}; // This gallery replaces the entire generated terrain/resource layer.
  15  |   delete state.armies['army.1']; delete state.armies['army.3']; delete state.armies['army.4'];
  16  |   state.armies['army.2']!.cell = ORIGIN;
  17  |   state.armies['army.2']!.name = 'Climate survey';
  18  |   SAMPLES.forEach((cell, biome) => {
  19  |     state.world.biome[cell] = biome;
  20  |     state.world.terrain[cell] = biome === 0 ? 0 : biome === 9 ? 4 : [5, 6].includes(biome) ? 3 : [2, 3, 8].includes(biome) ? 2 : 1;
  21  |     state.world.waterDepth[cell] = biome === 0 ? 1 : 0;
  22  |   });
  23  |   ['unit.spearman', 'unit.heavy_infantry', 'unit.cavalry'].forEach((unitId, index) => {
  24  |     const id = `army.${state.nextId++}`;
  25  |     state.armies[id] = { id, name: ['Pike survey escort', 'Plate survey escort', 'Mounted survey escort'][index]!, factionId: state.turnOwnerId, cell: ORIGIN + index + 1, movement: 0, formations: [createArmyFormation(id, unitId)] };
  26  |   });
  27  |   for (const faction of state.factions) state.explored[faction.id] = new Set(Array.from({ length: state.world.width * state.world.height }, (_, cell) => cell));
  28  |   return deserializeGame(serializeGame(state));
  29  | }
  30  | async function loadGallery(page: Page): Promise<void> {
  31  |   await page.goto('/');
  32  |   await page.locator('input[type=file]').setInputFiles({ name: 'observed-climate-gallery.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(climateGallery()))) });
  33  |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  34  |   await selectFromRegistry(page, 'armies', 'Climate survey');
  35  |   await expect(page.getByTestId('map-container').locator('canvas')).toBeVisible();
  36  | }
  37  | async function inspectCell(page: Page, cell: number): Promise<void> {
  38  |   await page.keyboard.press('Escape');
  39  |   await page.getByTestId('map-container').scrollIntoViewIfNeeded();
  40  |   const point = await page.evaluate(cell => window.__THEANDRIL__?.getCellScreenPoint(cell), cell);
  41  |   if (!point?.inViewport) throw new Error('The climate sample is outside the actual map viewport');
  42  |   await page.mouse.click(point.x, point.y);
  43  | }
  44  | 
  45  | test('all twelve approved biome tiles remain distinct beneath compact hills relief and actual troop sprites', { tag: '@scale' }, async ({ page }, testInfo) => {
  46  |   const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  47  |   await loadGallery(page);
  48  |   await expect(page.getByTestId('art-runtime-status')).toContainText('approved pixel pack');
  49  |   await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics()?.visibleAssetIds ?? [])).toEqual(expect.arrayContaining(['unit.spearman.ashen_compact', 'unit.heavy_infantry.ashen_compact', 'unit.cavalry.ashen_compact']));
  50  |   const hash = await page.evaluate(() => window.__THEANDRIL__?.getStateHash());
  51  |   const tiles = await page.evaluate(cells => cells.map(cell => window.__THEANDRIL__?.getTerrainArt(cell)), SAMPLES);
  52  |   tiles.forEach((tile, biome) => expect(tile).toMatchObject({ cell: SAMPLES[biome], biome, approved: true }));
  53  |   expect(new Set(tiles.map(tile => tile?.assetId)).size).toBe(12);
  54  |   expect(tiles[5]).toMatchObject({ terrain: 3, relief: 'hill-ridges', baseId: 'terrain.desert' });
  55  |   expect(tiles[6]).toMatchObject({ terrain: 3, relief: 'hill-ridges', baseId: 'terrain.steppe' });
  56  |   expect(tiles[9]).toMatchObject({ terrain: 4, relief: 'pixel-mountains', baseId: 'terrain.alpine' });
  57  |   expect(tiles[10]).toMatchObject({ terrain: 1, baseId: 'terrain.ash_scrub' });
  58  |   expect(tiles[11]).toMatchObject({ terrain: 1, baseId: 'terrain.chalkland' });
  59  |   await inspectCell(page, SAMPLES[5]!);
  60  |   await expect(page.locator('.hex-inspector')).toContainText('Desert · Hills');
  61  |   await page.getByRole('button', { name: 'Close map actions', exact: true }).click();
  62  |   await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  63  |   await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics()?.lod)).toBe('near-sprites');
> 64  |   expect(await page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics()?.visibleAnimationFrames)).toEqual([{ contentId: 'unit.scout.ashen_compact', frameId: expect.stringMatching(/^unit\.scout\.ashen_compact\/idle\/se\/[0-3]$/) }]);
      |                                                                                                        ^ Error: expect(received).toEqual(expected) // deep equality
  65  |   await page.screenshot({ path: testInfo.outputPath('biome-hills-and-alpine.png'), fullPage: true });
  66  |   await page.setViewportSize({ width: 390, height: 844 });
  67  |   await page.getByRole('button', { name: 'Focus selection', exact: true }).click();
  68  |   await page.getByTestId('map-container').scrollIntoViewIfNeeded();
  69  |   await page.screenshot({ path: testInfo.outputPath('biome-hills-narrow.png') });
  70  |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  71  |   expect(await page.evaluate(() => window.__THEANDRIL__?.getStateHash())).toBe(hash);
  72  |   await testInfo.attach('terrain-art-review.json', { body: JSON.stringify({ annotations: ['Native approved raster art is unchanged.', 'Physical desert/steppe hills retain a small lower-edge double ridge, revealing the biome pixels previously hidden by an opaque triangle.', 'Canonical alpine mountains use their approved raster relief without a second triangle.', 'The three new role sprites belong to real observed armies; no future-only objects were spawned.', 'Inspection, zoom and narrow resizing preserve canonical state.'], samples: tiles.map((tile, biome) => ({ ...tile, name: BIOME_NAMES[biome] })), metrics: await page.evaluate(() => window.__THEANDRIL__?.getPerformanceCounters()) }, null, 2), contentType: 'application/json' });
  73  |   expect(errors).toEqual([]);
  74  | });
  75  | 
  76  | test('missing approved terrain art keeps explicit physical hill and mountain fallbacks without pretending tiles loaded', async ({ page }) => {
  77  |   await page.route('**/art/catalog.json', route => route.fulfill({ status: 503, body: 'Unavailable approved catalog' }));
  78  |   await loadGallery(page);
  79  |   await expect(page.getByTestId('art-runtime-status')).toContainText('procedural fallback');
  80  |   const tiles = await page.evaluate(cells => cells.map(cell => window.__THEANDRIL__?.getTerrainArt(cell)), SAMPLES);
  81  |   expect(tiles[5]).toMatchObject({ biome: 5, terrain: 3, approved: false, assetId: null, relief: 'procedural-peak' });
  82  |   expect(tiles[9]).toMatchObject({ biome: 9, terrain: 4, approved: false, assetId: null, relief: 'procedural-peak' });
  83  |   await inspectCell(page, SAMPLES[5]!);
  84  |   await expect(page.locator('.hex-inspector')).toContainText('Desert · Hills');
  85  |   await page.getByRole('button', { name: 'Close map actions', exact: true }).click();
  86  |   await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  87  | });
  88  | 
  89  | function improvedLandGallery() {
  90  |   const state = createGame({ generatorVersion: 4, seed: 17, size: 'tiny', factionCount: 2 }), origin = state.armies['army.1']!.cell;
  91  |   const cells = neighbors(origin, state.world.width, state.world.height).slice(0, 5);
  92  |   const biomes = [1, 2, 11, 7, 0], terrain = [1, 2, 3, 1, 0];
  93  |   // Authored terrain isolates all five legal sites. Each improvement below is
  94  |   // paid for and completed through public commands, never painted into a save.
  95  |   cells.forEach((cell, index) => { state.world.terrain[cell] = terrain[index]!; state.world.biome[cell] = biomes[index]!; state.world.waterDepth[cell] = index === 4 ? 1 : 0; delete state.resources.deposits[cell]; });
  96  |   state.armies['army.2']!.cell = origin;
  97  |   refreshAuthoredSight(state);
  98  |   expect(applyCommand(state, { type: 'found', factionId: state.turnOwnerId, armyId: 'army.1', name: 'Five works' }).ok).toBe(true);
  99  |   const town = Object.values(state.settlements)[0]!;
  100 |   town.population = 6; state.factions[0]!.treasury = 5000;
  101 |   expect(applyCommand(state, { type: 'setWorkedTiles', factionId: state.turnOwnerId, settlementId: town.id, cells }).ok).toBe(true);
  102 |   // This gallery owns the five approved original props. Research-gated sites
  103 |   // have separate real-command and procedural-only coverage in city-growth.
  104 |   IMPROVEMENTS.slice(0, 5).forEach((definition, index) => {
  105 |     expect(applyCommand(state, { type: 'improveTile', factionId: state.turnOwnerId, settlementId: town.id, cell: cells[index]!, improvementId: definition.id }).ok).toBe(true);
  106 |     for (let turn = 0; turn < definition.turns; turn++) expect(applyCommand(state, { type: 'endTurn', factionId: state.turnOwnerId }).ok).toBe(true);
  107 |   });
  108 |   return { state: deserializeGame(serializeGame(state)), cells };
  109 | }
  110 | 
  111 | for (const fallback of [false, true]) test(`all five completed land works retain ${fallback ? 'distinct explicit fallback glyphs' : 'approved prop artwork'} and borders`, async ({ page }, testInfo) => {
  112 |   const { state, cells } = improvedLandGallery();
  113 |   if (fallback) await page.route('**/art/catalog.json', route => route.fulfill({ status: 503, body: 'Diagnostic missing approved art' }));
  114 |   await page.goto('/');
  115 |   await page.locator('input[type=file]').setInputFiles({ name: 'five-paid-works.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  116 |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  117 |   await expect(page.getByTestId('art-runtime-status')).toContainText(fallback ? 'procedural fallback' : 'approved pixel pack');
  118 |   await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().improvementProps)).toBe(5);
  119 |   expect(await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().territoryEdges)).toBeGreaterThan(0);
  120 |   const hash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  121 |   const tiles = await page.evaluate(cells => cells.map(cell => window.__THEANDRIL__!.getTerrainArt(cell)), cells);
  122 |   tiles.forEach((tile, index) => expect(tile).toMatchObject({ improvementId: IMPROVEMENTS[index]!.id, improvementPresentation: fallback ? 'procedural' : 'approved', factionId: state.turnOwnerId }));
  123 |   await page.getByTestId('map-container').scrollIntoViewIfNeeded();
  124 |   await page.screenshot({ path: testInfo.outputPath(fallback ? 'five-works-fallback.png' : 'five-works-approved.png') });
  125 |   await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  126 |   await page.setViewportSize({ width: 390, height: 844 });
  127 |   await page.getByRole('button', { name: 'Focus selection', exact: true }).click();
  128 |   await page.getByTestId('map-container').scrollIntoViewIfNeeded();
  129 |   await page.screenshot({ path: testInfo.outputPath(fallback ? 'five-works-fallback-narrow.png' : 'five-works-approved-narrow.png') });
  130 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  131 |   expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);
  132 | });
  133 | 
```