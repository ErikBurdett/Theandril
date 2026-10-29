# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: geography-performance.spec.ts >> Huge generated archipelago spectator geography stays bounded through reveal, river inspection, pan, overview and restored fog
- Location: tests/gameplay/geography-performance.spec.ts:8:1

# Error details

```
Test timeout of 45000ms exceeded.
```

```
Error: locator.click: Test timeout of 45000ms exceeded.
Call log:
  - waiting for getByTestId('army-registry').getByRole('button').first()
    - locator resolved to <button disabled class="registry-item ">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
      - waiting 100ms
    67 × waiting for element to be visible, enabled and stable
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
          - strong [ref=e20]: 60 coin
        - generic [ref=e21]:
          - generic [ref=e22]: KNOWLEDGE
          - strong [ref=e23]: "0"
        - generic [ref=e24]:
          - generic [ref=e25]: HEARTHS
          - strong [ref=e26]: "0"
    - navigation "Campaign navigation" [ref=e27]:
      - generic [ref=e28]:
        - text: Short pace ·
        - generic [ref=e29]: 32 realms
      - region "AI watch controls" [ref=e30]:
        - generic [ref=e31]: AI watch paused
        - button "Resume AI watch" [ref=e32] [cursor=pointer]
        - button "Step one round" [ref=e33] [cursor=pointer]
        - button "Reveal spectator map" [ref=e34] [cursor=pointer]
        - generic [ref=e35]: Map follows your realm’s sight. AI always uses its own faction sight. Changing fog pauses AI watch; resume when ready.
      - generic [ref=e36]: Recording the full campaign
    - group [ref=e37]:
      - generic "Campaign & settings" [ref=e38] [cursor=pointer]
  - main [ref=e39]:
    - region "Strategic map" [ref=e40]:
      - generic: SEED 74 · 288 × 180Archipelago
      - generic "World map. Select an army then click a highlighted hex to move or an enemy to attack. Hover to preview routes. Drag to pan; scroll to zoom all the way to world overview. Arrow keys pan; plus and minus zoom. Focus selection returns to local detail. Enter opens map actions for the selection. Escape closes map actions before clearing selection. The army panel has keyboard and touch route controls." [ref=e41]
      - navigation "Map management" [ref=e43]:
        - button "Armies & fleets" [ref=e44] [cursor=pointer]
        - button "Settlements" [ref=e48] [cursor=pointer]
        - button "Characters & agents" [ref=e52] [cursor=pointer]:
          - generic [ref=e55]: Characters
        - button "Realm progression" [ref=e56] [cursor=pointer]:
          - generic [ref=e59]: Research
        - button "Realm affairs" [ref=e60] [cursor=pointer]:
          - generic [ref=e63]: Diplomacy
        - button "Campaign journal" [ref=e64] [cursor=pointer]
        - button "World overview" [ref=e68] [cursor=pointer]
      - generic [ref=e72]:
        - button "Zoom in" [ref=e73] [cursor=pointer]: +
        - button "Zoom out" [ref=e74] [cursor=pointer]: −
        - button "Focus selection" [ref=e75] [cursor=pointer]
        - button "Open map actions" [ref=e76] [cursor=pointer]
        - button "Map guide" [ref=e77] [cursor=pointer]: "?"
      - group:
        - generic "World map · Terrain" [ref=e78] [cursor=pointer]
  - dialog [ref=e79]:
    - banner [ref=e80]:
      - generic [ref=e81]:
        - generic [ref=e82]: The realm's ledgers
        - heading "Realm registry" [active] [level=2] [ref=e83]
        - paragraph [ref=e84]: Ashen Compact
      - button "Close Realm registry" [ref=e85] [cursor=pointer]: ×
    - generic [ref=e87]:
      - generic [ref=e88]:
        - img "Ashen Compact crest · approved faction artwork" [ref=e89]
        - generic [ref=e90]:
          - generic [ref=e91]: Your people
          - heading "Ashen Compact" [level=3] [ref=e92]
      - generic [ref=e94]:
        - tablist "Realm registry" [ref=e95]:
          - tab "Armies 2" [disabled] [selected] [ref=e96]
          - tab "Settlements 0" [disabled] [ref=e97]
        - button "Characters & agents" [disabled] [ref=e98]: Characters 0
      - generic [ref=e99]:
        - text: Search your realm
        - searchbox "Search your realm" [disabled] [ref=e100]
      - tabpanel "Armies 2" [ref=e101]:
        - generic [ref=e102]:
          - text: Force type
          - combobox "Force type" [disabled] [ref=e103]:
            - option "All armies & fleets" [selected]
            - option "Land armies ashore"
            - option "Fleets"
            - option "Embarked armies"
        - generic [ref=e104]:
          - generic [ref=e106]:
            - text: Army orders
            - combobox "Army orders" [disabled] [ref=e107]:
              - option "All forces (2)" [selected]
              - option "Postings and patrols (0)"
              - option "Orders waiting (0)"
              - option "Paused patrols (0)"
          - generic [ref=e108]:
            - generic [ref=e109]:
              - text: Registry order
              - combobox "Registry order" [disabled] [ref=e110]:
                - option "Stable order" [selected]
                - option "Name A–Z"
            - generic [ref=e111]: 2 forces
          - group [ref=e112]:
            - generic "Saved army groups" [ref=e113] [cursor=pointer]
            - option "Choose a saved army group" [selected]
          - region "Group army postings" [ref=e114]:
            - generic [ref=e115]:
              - button "Select matching armies" [disabled] [ref=e116]
              - button "Clear group selection" [disabled] [ref=e117]
            - status [ref=e118]: 0 armies selected
            - paragraph [ref=e119]: Check land armies ashore to give them a standing posting together. Select up to 128 at a time; page and search changes keep your selection.
          - group [ref=e120]:
            - generic "Group travel" [ref=e121] [cursor=pointer]
            - option "Selected map hex · 17716" [selected]
            - option "Enter a hex number"
            - option "Replace route" [selected]
            - option "Append waypoint"
          - group [ref=e122]:
            - generic "Group patrols" [ref=e123] [cursor=pointer]
            - option "Choose an owned hearth" [selected]
            - option "Choose an owned hearth" [selected]
          - group [ref=e124]:
            - generic "Defensive theaters" [ref=e125] [cursor=pointer]
            - option "New theater" [selected]
            - option "Choose a known map hex or owned hearth" [disabled] [selected]
            - option "1 army" [selected]
            - option "2 armies"
            - option "3 armies"
            - option "4 armies"
            - option "Off" [selected]
            - option "Up to 1 extra army"
            - option "Up to 2 extra armies"
            - option "Up to 3 extra armies"
            - option "Up to 4 extra armies"
          - generic [ref=e126]:
            - generic [ref=e127]:
              - checkbox "Select Hearth caravan for group orders" [disabled] [ref=e129]
              - button "Hearth caravan 1 formation · 3 movement · 10 strength" [disabled] [ref=e130]:
                - generic [aria-hidden] [ref=e131]: △
                - generic [ref=e132]:
                  - strong [ref=e133]: Hearth caravan
                  - generic [ref=e134]: 1 formation · 3 movement · 10 strength
                - generic [aria-hidden] [ref=e135]: ›
            - generic [ref=e136]:
              - checkbox "Select Wayfinder for group orders" [disabled] [ref=e138]
              - button "Wayfinder 1 formation · 5 movement · 20 strength" [disabled] [ref=e139]:
                - generic [aria-hidden] [ref=e140]: △
                - generic [ref=e141]:
                  - strong [ref=e142]: Wayfinder
                  - generic [ref=e143]: 1 formation · 5 movement · 20 strength
                - generic [aria-hidden] [ref=e144]: ›
      - paragraph [ref=e145]: Choose an entry to locate it on the map. Use the bottom command tray for its orders.
  - contentinfo [ref=e146]:
    - generic [ref=e149]:
      - generic [ref=e150]: Your realm
      - strong [ref=e151]: Select a force or hearth
      - generic [ref=e152]: Explore the map or open a roster.
      - generic [ref=e153]:
        - button "Show selected orders" [ref=e154] [cursor=pointer]
        - button "Show on map" [ref=e155] [cursor=pointer]
    - region "Next-action navigation" [ref=e156]:
      - paragraph [ref=e157]: 2 needing orders · 0 idle settlements
      - generic [ref=e158]:
        - button "Previous army needing orders" [disabled] [ref=e159]: ‹
        - button "Next army needing orders" [disabled] [ref=e160]: Next army N
        - button "Previous idle settlement" [disabled] [ref=e161]: ‹
        - button "Next idle settlement" [disabled] [ref=e162]: Next town S
      - paragraph [ref=e163]: "Labor: 0 unassigned households · 0 settlements"
      - generic [ref=e164]:
        - button "Previous settlement with unassigned households" [disabled] [ref=e165]: ‹
        - button "Next settlement with unassigned households" [disabled] [ref=e166]: Review households
      - group [ref=e167]:
        - generic "What wants a decision 1 kind" [ref=e168] [cursor=pointer]:
          - text: What wants a decision
          - generic [ref=e169]: 1 kind
      - status
    - generic [ref=e170]:
      - generic [ref=e171]:
        - generic [ref=e172]: AGE OF FRACTURE
        - strong [ref=e173]: Turn 1
      - button "End turn" [disabled] [ref=e174]:
        - text: End turn
        - generic [ref=e175]: E
    - status [ref=e176]:
      - generic [aria-hidden] [ref=e177]: ◆
      - text: Fog of war restored to your realm’s sight.
  - generic [ref=e178]:
    - button "Art Lab" [ref=e179] [cursor=pointer]
    - generic [ref=e180]: Development asset inspector
```

# Test source

```ts
  23  |   await page.getByRole('combobox', { name: 'World size', exact: true }).selectOption('huge');
  24  |   await page.getByRole('spinbutton', { name: 'Faction count', exact: true }).fill('32');
  25  |   await page.getByRole('combobox', { name: 'Map type', exact: true }).selectOption('archipelago');
  26  |   await page.getByRole('combobox', { name: 'Campaign pace', exact: true }).selectOption('short');
  27  |   await page.getByRole('combobox', { name: 'Campaign mode', exact: true }).selectOption('watch');
  28  |   await page.getByRole('spinbutton', { name: 'City-states', exact: true }).fill('0');
  29  |   await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
  30  |   await expect(page.getByTestId('turn-counter')).toHaveText('Turn 1');
  31  |   await expect(page.getByTestId('watch-controls')).toContainText('AI watch paused');
  32  |   await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()?.state)).toBe('ready');
  33  |   const initial = await page.evaluate(() => {
  34  |     const api = window.__THEANDRIL__!, view = api.getSummary()!;
  35  |     return { hash: api.getStateHash(), selection: api.getSelection(), cells: view.exploredCells,
  36  |       factions: view.factions.map(faction => faction.id), armies: view.armies.map(army => army.id), turn: view.turn };
  37  |   });
  38  |   expect(initial.cells).toBe(61);
  39  |   const samples: { stage: string; warmedFrames: number; metrics: Awaited<ReturnType<typeof counters>> }[] = [];
  40  |   const sample = async (stage: string) => {
  41  |     const frame = (await counters(page)).frameCount ?? 0;
  42  |     await page.waitForFunction(frame => (window.__THEANDRIL__!.getPerformanceCounters().frameCount ?? 0) >= frame + 75, frame);
  43  |     const metrics = await counters(page);
  44  |     expect(metrics.cachedChunks).toBeLessThanOrEqual(64);
  45  |     expect(metrics.maxCachedChunkWidth).toBeLessThanOrEqual(900);
  46  |     expect(metrics.maxCachedChunkHeight).toBeLessThanOrEqual(760);
  47  |     expect(metrics.cachedTextureBytesEstimate).toBeLessThanOrEqual(64 * 4 * 1024 * 1024);
  48  |     expect(metrics.residentAtlasBytesEstimate).toBeLessThanOrEqual(17 * 1024 * 1024);
  49  |     expect(metrics.landQueryCount).toBe(0);
  50  |     if (!metrics.overview) expect(metrics.visibleCells).toBeLessThan(10000);
  51  |     expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(initial.hash);
  52  |     expect(await page.evaluate(() => window.__THEANDRIL__!.getTurn())).toBe(1);
  53  |     samples.push({ stage, warmedFrames: (metrics.frameCount ?? 0) - frame, metrics });
  54  |     return metrics;
  55  |   };
  56  |   const normal = await sample('normal-faction-sight');
  57  |   // A fresh sight patch with no hydrology/roads legitimately uses compact v1
  58  |   // (nine bytes per row). Revealing the actual river-bearing world below uses v2.
  59  |   expect(normal.cellTransferBytes).toBeGreaterThan(61 * 9);
  60  |   expect(normal.cellTransferBytes).toBeLessThan(4096);
  61  |   const reveal = await page.evaluate(async () => {
  62  |     const started = performance.now(), result = await window.theandril!.setWatchFog(false);
  63  |     return { ...result, acknowledgementMs: performance.now() - started };
  64  |   });
  65  |   expect(reveal).toMatchObject({ enabled: false, hash: initial.hash });
  66  |   await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.exploredCells)).toBe(cellCount);
  67  |   const revealedTransfer = await counters(page);
  68  |   expect(revealedTransfer.cellTransferBytes).toBeGreaterThan(cellCount * 11);
  69  |   expect(revealedTransfer.cellTransferBytes).toBeLessThan(3 * 1024 * 1024);
  70  |   expect(revealedTransfer.transferBytes).toBeLessThan(4 * 1024 * 1024);
  71  | 
  72  |   // Overview picking and Focus selection are normal controls, not a camera or
  73  |   // state mutator. The observation hook returns screen coordinates only.
  74  |   await page.getByRole('button', { name: 'World overview', exact: true }).click();
  75  |   await expect.poll(() => counters(page).then(metrics => metrics.overview)).toBe(true);
  76  |   const point = await page.evaluate(cell => window.__THEANDRIL__!.getCellScreenPoint(cell), river);
  77  |   expect(point?.inViewport).toBe(true);
  78  |   await page.mouse.click(point!.x, point!.y);
  79  |   await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSelection().cell)).toBe(river);
  80  |   await page.getByRole('button', { name: 'Focus selection', exact: true }).click();
  81  |   const near = await sample('revealed-river-near');
  82  |   expect(near.overview).toBe(false); expect(near.riverSegments).toBeGreaterThan(0);
  83  |   const riverArt = await page.evaluate(cell => window.__THEANDRIL__!.getTerrainArt(cell), river);
  84  |   expect(riverArt?.hydrology).toBe(world.hydrology[river]);
  85  |   expect(riverArt?.riverCurves.length).toBeGreaterThan(0);
  86  |   await page.getByTestId('map-container').screenshot({ path: testInfo.outputPath('huge-archipelago-rivers-near.png') });
  87  | 
  88  |   const canvas = await page.getByTestId('map-container').locator('canvas').boundingBox();
  89  |   if (!canvas) throw new Error('Missing map canvas');
  90  |   for (let index = 0; index < 3; index++) {
  91  |     const x = canvas.x + canvas.width * .65, y = canvas.y + canvas.height * .55;
  92  |     await page.mouse.move(x, y); await page.mouse.down();
  93  |     await page.mouse.move(x - 220, y - 80, { steps: 10 }); await page.mouse.up();
  94  |   }
  95  |   await sample('three-local-camera-drags');
  96  |   await page.getByRole('button', { name: 'Zoom out', exact: true }).click({ clickCount: 4, delay: 60 });
  97  |   const far = await sample('revealed-strategic-zoom');
  98  |   expect(far.overview).toBe(false); expect(far.zoom).toBeLessThan(.65); expect(far.roadSegments).toBe(0);
  99  |   await page.getByRole('button', { name: 'World overview', exact: true }).click();
  100 |   const overview = await sample('revealed-whole-world-overview');
  101 |   expect(overview.overview).toBe(true); expect(overview.visibleCells).toBe(cellCount);
  102 |   expect(overview.visibleChunks).toBe(0); expect(overview.visibleSprites).toBe(1);
  103 |   expect(overview.terrainSpriteCells).toBe(0); expect(overview.visibleEntities).toBe(0);
  104 |   expect(overview.roadSegments).toBe(0);
  105 |   expect(overview.overviewTextureBytes).toBe((world.width * 2 + 1) * world.height * 2 * 4);
  106 |   expect(overview.overviewTextureBytes).toBeLessThan(4 * 1024 * 1024);
  107 |   await page.getByTestId('map-container').screenshot({ path: testInfo.outputPath('huge-archipelago-whole-world-overview.png') });
  108 | 
  109 |   const restore = await page.evaluate(async () => {
  110 |     const started = performance.now(), result = await window.theandril!.setWatchFog(true);
  111 |     return { ...result, acknowledgementMs: performance.now() - started };
  112 |   });
  113 |   expect(restore).toMatchObject({ enabled: true, hash: initial.hash });
  114 |   await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.exploredCells)).toBe(61);
  115 |   await expect.poll(() => counters(page).then(metrics => metrics.visibleCells)).toBe(61);
  116 |   const restoredOverview = await counters(page);
  117 |   expect(restoredOverview.overview).toBe(true); expect(restoredOverview.visibleChunks).toBe(0);
  118 |   expect(restoredOverview.cellTransferBytes).toBe(normal.cellTransferBytes);
  119 |   expect(await page.evaluate(cell => window.__THEANDRIL__!.getTerrainArt(cell), river)).toBeUndefined();
  120 |   // Registry selection returns to genuine own sight, then ordinary focus exits
  121 |   // overview without retaining the remote spectator geography or giant ring.
  122 |   await openRegistry(page, 'armies');
> 123 |   await page.getByTestId('army-registry').getByRole('button').first().click();
      |                                                                       ^ Error: locator.click: Test timeout of 45000ms exceeded.
  124 |   await page.getByRole('button', { name: 'Focus selection', exact: true }).click();
  125 |   const restored = await sample('restored-faction-sight-focused');
  126 |   expect(restored.overview).toBe(false);
  127 |   // The fog-safe overview texture remains cached for reopening; exiting the
  128 |   // overview does not claim that its allocation was destroyed.
  129 |   expect(restored.overviewTextureBytes).toBe(restoredOverview.overviewTextureBytes);
  130 |   expect(restored.visibleCells).toBeLessThanOrEqual(61);
  131 |   expect(await page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!.overlays.selectionBounds.width)).toBeLessThan(61);
  132 |   const final = await page.evaluate(() => {
  133 |     const view = window.__THEANDRIL__!.getSummary()!;
  134 |     return { hash: window.__THEANDRIL__!.getStateHash(), cells: view.cells,
  135 |       factions: view.factions.map(faction => faction.id), armies: view.armies.map(army => army.id), watch: view.watch };
  136 |   });
  137 |   expect(final).toMatchObject({ hash: initial.hash, cells: [], factions: initial.factions, armies: initial.armies, watch: { running: false, fogEnabled: true } });
  138 |   const report = { workload: 'Real new-game worker; Huge archipelago, seed 74, 32 factions, Short pace, paused AI watch, 1440×1000. No turn advancement, imports or canonical mutations.',
  139 |     measurementNotes: 'Each sampled phase waits at least 75 renderer frames. frameP95Ms is the renderer rolling 240-frame percentile, not an independent phase percentile. Acknowledgement timings include worker projection, transfer and main-thread handling, not completed GPU presentation. Packed transfer bytes are the actual worker metric. Chunk cache estimates are separate from the map atlas, overview texture, DOM atlas decoder and other GPU allocations. Timing is reported rather than asserted against host-dependent thresholds.',
  140 |     seed: 74, factionCount: 32, cellCount, normalCells: initial.cells, hash: initial.hash, river, canvas,
  141 |     reveal, restore, revealedTransfer, restoredOverview, samples };
  142 |   const reportPath = testInfo.outputPath('geography-performance.json');
  143 |   await writeFile(reportPath, JSON.stringify(report, null, 2));
  144 |   await testInfo.attach('geography-performance.json', { path: reportPath, contentType: 'application/json' });
  145 |   console.log('Huge generated geography measurements:', JSON.stringify(report));
  146 |   expect(errors).toEqual([]);
  147 | });
  148 | 
```