# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: naval-art.spec.ts >> all twenty-four cultures show three distinct approved naval hulls, stable strategic badges and canonical fog without duplicate passengers
- Location: tests/gameplay/naval-art.spec.ts:22:1

# Error details

```
Test timeout of 45000ms exceeded.
```

```
Error: locator.click: Test timeout of 45000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Zoom out', exact: true })

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
        - generic [ref=e29]: 24 realms
      - generic [ref=e30]: Partial archive · earlier history unavailable
    - group [ref=e31]:
      - generic "Campaign & settings" [ref=e32] [cursor=pointer]
  - main [ref=e33]:
    - region "Strategic map" [ref=e34]:
      - generic: SEED 20260905 · 256 × 160Legacy geography
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
        - button "Zoom out" [active] [ref=e68] [cursor=pointer]: −
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
      - paragraph [ref=e84]: 31 needing orders · 0 idle settlements
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
  16  |   await page.locator('input[type=file]').setInputFiles({ name: 'twenty-four-culture-navies.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(SAVE)) });
  17  |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  18  |   await selectArmy(page, `${NAVAL_ART_COHORTS[0]!.label} harbor survey`);
  19  |   await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics()?.state)).toBe('ready');
  20  | }
  21  | 
  22  | test('all twenty-four cultures show three distinct approved naval hulls, stable strategic badges and canonical fog without duplicate passengers', { tag: '@scale' }, async ({ page }, testInfo) => {
  23  |   const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  24  |   await loadGallery(page);
  25  |   const hash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  26  |   const summary = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!);
  27  |   expect(summary.factions).toHaveLength(24);
  28  |   expect(summary.armies.filter(army => army.domain === 'naval')).toHaveLength(72);
  29  |   expect(summary.armies.some(army => army.name === NAVAL_ART_HIDDEN_NAME)).toBe(false);
  30  |   const cargoId = summary.ownArmies.find(army => army.name === NAVAL_ART_CARGO_NAME)!.id;
  31  |   const covered = new Set<string>(), inspections: unknown[] = [];
  32  |   await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  33  |   for (const [index, cohort] of NAVAL_ART_COHORTS.entries()) {
  34  |     if (index) for (let step = 0; step < 4; step++) await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  35  |     await selectArmy(page, `${cohort.label} harbor survey`);
  36  |     await page.keyboard.press('Escape');
  37  |     const expected = cohort.families.flatMap(family => NAVAL_ART_ROLES.map(role => `${role}.${family}`));
  38  |     const canvas = await page.getByTestId('map-container').locator('canvas').boundingBox();
  39  |     if (!canvas) throw new Error('Naval gallery requires the real map canvas.');
  40  |     const beforePan = await page.evaluate(ids => {
  41  |       const api = window.__THEANDRIL__!, view = api.getSummary()!;
  42  |       const canvas = document.querySelector('[data-testid="map-container"] canvas')!.getBoundingClientRect();
  43  |       const title = document.querySelector('.map-title')?.getBoundingClientRect();
  44  |       if (!title) throw new Error('The real map title is required for gallery clearance.');
  45  |       const hint = document.querySelector('.map-order-hint')?.getBoundingClientRect();
  46  |       // Use every required observed army, including one whose anchor is visible
  47  |       // but whose larger native canvas might currently extend beyond the viewport.
  48  |       const hulls = view.armies.filter(army => {
  49  |         const definition = view.factions.find(faction => faction.id === army.factionId)?.definitionId;
  50  |         return definition && ids.includes(`${army.unitId}.${definition.slice('faction.'.length)}`);
  51  |       }).map(army => {
  52  |         const point = api.getCellScreenPoint(army.cell)!, right = api.getCellScreenPoint(army.cell + 1)!, down = api.getCellScreenPoint(army.cell + view.width)!;
  53  |         const scaleX = (right.x - point.x) / 56, scaleY = (down.y - point.y) / 48;
  54  |         return { left: point.x - 48 * scaleX, right: point.x + 48 * scaleX, top: point.y - 80 * scaleY, bottom: point.y + 16 * scaleY };
  55  |       });
  56  |       return { hulls, zoom: api.getPerformanceCounters().zoom,
  57  |         minDx: Math.max(canvas.left, title.right, hint?.right ?? -Infinity) + 8 - Math.min(...hulls.map(hull => hull.left)),
  58  |         maxDx: canvas.right - 8 - Math.max(...hulls.map(hull => hull.right)),
  59  |         minDy: canvas.top + 8 - Math.min(...hulls.map(hull => hull.top)),
  60  |         maxDy: canvas.bottom - 8 - Math.max(...hulls.map(hull => hull.bottom)) };
  61  |     }, expected);
  62  |     expect(beforePan.hulls).toHaveLength(18);
  63  |     expect(beforePan.minDx).toBeLessThanOrEqual(beforePan.maxDx);
  64  |     expect(beforePan.minDy).toBeLessThanOrEqual(beforePan.maxDy);
  65  |     const pan = { x: (beforePan.minDx + beforePan.maxDx) / 2, y: (beforePan.minDy + beforePan.maxDy) / 2 };
  66  |     expect(Math.abs(pan.x)).toBeLessThan(canvas.width - 32); expect(Math.abs(pan.y)).toBeLessThan(canvas.height - 32);
  67  |     // Center all full canvases within the measured available rectangle using
  68  |     // an ordinary drag. No zoom change, CSS hiding or sprite-bound relaxation.
  69  |     const start = { x: canvas.x + canvas.width / 2 - pan.x / 2, y: canvas.y + canvas.height / 2 - pan.y / 2 };
  70  |     if (Math.hypot(pan.x, pan.y) > 5) {
  71  |       await page.mouse.move(start.x, start.y); await page.mouse.down();
  72  |       await page.mouse.move(start.x + pan.x, start.y + pan.y, { steps: 10 }); await page.mouse.up();
  73  |     }
  74  |     await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()?.visibleAssetIds)).toEqual(expect.arrayContaining(expected));
  75  |     const near = await page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!);
  76  |     expect(near.lod).toBe('near-sprites'); expect(near.warnings).toEqual([]);
  77  |     // Shore observers can use the one approved faction idle animation; the
  78  |     // seventy-two hulls remain static and never inherit a land-unit clip.
  79  |     const animatedScouts = near.visibleEntityArt.filter(entity => entity.assetId === 'unit.scout.ashen_compact');
  80  |     expect(near.visibleAnimationFrames).toHaveLength(animatedScouts.length);
  81  |     for (const animation of near.visibleAnimationFrames) expect(animation).toEqual({ contentId: 'unit.scout.ashen_compact', frameId: expect.stringMatching(/^unit\.scout\.ashen_compact\/idle\/se\/[0-3]$/) });
  82  |     expect(near.visibleEntityArt.some(entity => entity.entityId === cargoId)).toBe(false);
  83  |     const hulls = near.visibleEntityArt.filter(entity => expected.includes(entity.assetId ?? ''));
  84  |     expect(hulls).toHaveLength(18);
  85  |     for (const hull of hulls) {
  86  |       expect(hull.assetId).toBe(factionArtId(hull.role, hull.definitionId!));
  87  |       expect(hull).toMatchObject({ presentation: 'faction', nativeWidth: 96, nativeHeight: 96, tint: 0xffffff });
  88  |       covered.add(hull.assetId!);
  89  |     }
  90  |     const framing = await page.evaluate(ids => {
  91  |       const api = window.__THEANDRIL__!, diagnostics = api.getArtDiagnostics()!, view = api.getSummary()!;
  92  |       const canvas = document.querySelector('[data-testid="map-container"] canvas')!.getBoundingClientRect();
  93  |       const title = document.querySelector('.map-title')?.getBoundingClientRect();
  94  |       const hint = document.querySelector('.map-order-hint')?.getBoundingClientRect();
  95  |       return { canvas: { left: canvas.left, right: canvas.right, top: canvas.top, bottom: canvas.bottom }, overlayRight: Math.max(title?.right ?? 0, hint?.right ?? 0),
  96  |         hulls: diagnostics.visibleEntityArt.filter(art => ids.includes(art.assetId ?? '')).map(art => {
  97  |           const army = view.armies.find(army => army.id === art.entityId)!;
  98  |           const point = api.getCellScreenPoint(army.cell)!, right = api.getCellScreenPoint(army.cell + 1)!, down = api.getCellScreenPoint(army.cell + view.width)!;
  99  |           const scaleX = (right.x - point.x) / 56, scaleY = (down.y - point.y) / 48;
  100 |           return { assetId: art.assetId, left: point.x - 48 * scaleX, right: point.x + 48 * scaleX, top: point.y - 80 * scaleY, bottom: point.y + 16 * scaleY };
  101 |         }) };
  102 |     }, expected);
  103 |     expect(await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().zoom)).toBe(beforePan.zoom);
  104 |     for (const hull of framing.hulls) {
  105 |       expect(hull.left).toBeGreaterThan(Math.max(framing.canvas.left, framing.overlayRight) + 2);
  106 |       expect(hull.right).toBeLessThan(framing.canvas.right - 2);
  107 |       expect(hull.top).toBeGreaterThan(framing.canvas.top + 2);
  108 |       expect(hull.bottom).toBeLessThan(framing.canvas.bottom - 2);
  109 |     }
  110 |     await page.screenshot({ path: testInfo.outputPath(`${cohort.label}-all-three-hulls-near.png`), fullPage: true });
  111 |     // Art anchors never replace the canonical hex hit target.
  112 |     const target = navalArtCell(cohort.offset + 20, 12), point = await page.evaluate(cell => window.__THEANDRIL__!.getCellScreenPoint(cell), target);
  113 |     expect(point?.inViewport).toBe(true); await page.mouse.click(point!.x, point!.y);
  114 |     await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSelection().cell)).toBe(target);
  115 |     await page.keyboard.press('Escape');
> 116 |     for (let step = 0; step < 4; step++) await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
      |                                                                                                            ^ Error: locator.click: Test timeout of 45000ms exceeded.
  117 |     await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()?.lod)).toBe('strategic-glyphs');
  118 |     const badges = cohort.families.map(family => `ui.badge.${family}`);
  119 |     await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()?.visibleAssetIds)).toEqual(expect.arrayContaining(badges));
  120 |     const far = await page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!);
  121 |     const fleetBadges = far.visibleEntityArt.filter(entity => NAVAL_ART_ROLES.some(role => role === entity.role));
  122 |     expect(fleetBadges.length).toBeGreaterThanOrEqual(18);
  123 |     expect(fleetBadges.every(entity => entity.assetId === factionArtId('ui.badge', entity.definitionId!) && entity.presentation === 'strategic' && entity.nativeWidth === 32 && entity.tint === 0xffffff)).toBe(true);
  124 |     expect(far.visibleEntityArt.some(entity => entity.entityId === cargoId)).toBe(false);
  125 |     await page.screenshot({ path: testInfo.outputPath(`${cohort.label}-naval-strategic.png`), fullPage: true });
  126 |     inspections.push({ cohort: cohort.label, pan, beforePan, near, framing, far });
  127 |   }
  128 |   expect(covered.size).toBe(72);
  129 |   expect([...covered].sort()).toEqual(NAVAL_ART_COHORTS.flatMap(cohort => cohort.families.flatMap(family => NAVAL_ART_ROLES.map(role => `${role}.${family}`))).sort());
  130 |   await page.setViewportSize({ width: 390, height: 844 });
  131 |   const transportName = summary.ownArmies.find(army => army.unitId === 'unit.transport')!.name;
  132 |   await selectArmy(page, transportName);
  133 |   await openSelectedOrders(page);
  134 |   await page.getByTestId('army-composition').locator(':scope > summary').click();
  135 |   const frame = page.locator('.formation-choice [data-art-id="unit.transport.ashen_compact"]');
  136 |   await expect(frame).toHaveAttribute('data-art-state', 'ready');
  137 |   await expect(frame).toHaveAttribute('data-art-rendered-id', 'unit.transport.ashen_compact');
  138 |   expect(await frame.evaluate(element => ({ width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height }))).toEqual({ width: 96, height: 96 });
  139 |   await frame.scrollIntoViewIfNeeded(); await page.screenshot({ path: testInfo.outputPath('approved-transport-roster-narrow.png') });
  140 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  141 |   expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);
  142 |   const evidence = testInfo.outputPath('naval-art-inspection.json');
  143 |   await writeFile(evidence, JSON.stringify({ covered: [...covered].sort(), inspections, notes: ['Authored placement and shallow geography, validated by canonical save import; actual existing hull definitions.', 'A real embark command carries the guard; cargo remains in its observed army read model but never receives a duplicate map marker.', 'Four six-culture galleries retain native96 framing; all72 hulls use one static southeast pose. Only approved Ashen scout observers animate.', 'Fog-hidden reserve never entered the renderer. Camera/selection/resizing left canonical state unchanged.'] }, null, 2));
  144 |   await testInfo.attach('naval-art-inspection.json', { path: evidence, contentType: 'application/json' });
  145 |   expect(errors).toEqual([]);
  146 | });
  147 | 
  148 | test('an absent approved naval variant falls back to a ship marker, never another culture or a land unit', async ({ page }) => {
  149 |   const missingId = 'unit.coastal_warship.reedbound_council';
  150 |   await page.route('**/art/catalog.json', async route => {
  151 |     const response = await route.fetch(), catalog = await response.json() as RuntimeCatalog;
  152 |     const missing = catalog.assets.find(asset => asset.id === missingId), atlas = catalog.atlases.find(atlas => atlas.id === missing?.atlasId);
  153 |     if (!missing || !atlas) throw new Error('Naval missing-variant check requires the published approved asset.');
  154 |     await page.route(`**${atlas.jsonUrl}`, async atlasRoute => {
  155 |       const response = await atlasRoute.fetch(), metadata = await response.json();
  156 |       for (const frame of missing.frames) delete metadata.frames[frame.id];
  157 |       for (const clip of missing.clips) delete metadata.animations[clip.id];
  158 |       await atlasRoute.fulfill({ response, json: metadata });
  159 |     });
  160 |     catalog.assets = catalog.assets.filter(asset => asset.id !== missingId);
  161 |     await route.fulfill({ response, json: catalog });
  162 |   });
  163 |   await loadGallery(page);
  164 |   const hash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  165 |   await expect(page.getByTestId('art-runtime-status')).toContainText('partial pixel pack');
  166 |   await expect(page.getByTestId('art-runtime-status')).toHaveAttribute('title', new RegExp(missingId));
  167 |   await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()?.visibleEntityArt.find(entity => entity.role === 'unit.coastal_warship' && entity.definitionId === 'faction.reedbound_council'))).toMatchObject({ assetId: null, presentation: 'procedural-coastal-warship', nativeWidth: null });
  168 |   const art = await page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()!);
  169 |   expect(art.visibleAssetIds).not.toContain(missingId);
  170 |   expect(art.visibleAssetIds).toContain('unit.coastal_warship.glass_tide');
  171 |   expect(art.visibleAssetIds).not.toContain('unit.coastal_warship');
  172 |   expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);
  173 | });
  174 | 
```