# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: faction-art.spec.ts >> all 12 observed cultures select distinct untinted role art and bounded strategic heraldry without changing canonical input or fog
- Location: tests/gameplay/faction-art.spec.ts:85:1

# Error details

```
Test timeout of 45000ms exceeded.
```

```
Error: locator.click: Test timeout of 45000ms exceeded.
Call log:
  - waiting for getByTestId('army-registry').getByRole('button', { name: /culture-cohort-2 unit survey/ })

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - button "Import save file"
  - banner [ref=e4]:
    - generic [ref=e10]:
      - generic [ref=e11]: The age of fracture
      - heading "Theandril" [level=1] [ref=e12]
    - generic [ref=e13]: CAMPAIGN FOUNDATION 0.1
    - generic [ref=e14]:
      - generic [ref=e15]:
        - generic [ref=e16]: TREASURY
        - strong [ref=e17]: 60 coin
      - generic [ref=e18]:
        - generic [ref=e19]: KNOWLEDGE
        - strong [ref=e20]: "0"
      - generic [ref=e21]:
        - generic [ref=e22]: YOUR REALM
        - strong [ref=e23]: 3 hearths
  - navigation "Campaign navigation" [ref=e24]:
    - generic [ref=e25]:
      - generic [ref=e26]:
        - tablist "Realm registry" [ref=e27]:
          - tab "Armies 47" [selected] [ref=e28] [cursor=pointer]
          - tab "Settlements 3" [ref=e29] [cursor=pointer]
        - button "Characters & agents" [ref=e30] [cursor=pointer]: Characters 0
      - generic [ref=e31]:
        - generic [ref=e32]:
          - generic [ref=e33]: Selected army
          - strong [ref=e34]: culture-cohort-1 unit survey
        - button "Show on map" [ref=e35] [cursor=pointer]
        - button "Show selected orders" [ref=e36] [cursor=pointer]
    - generic [ref=e37]:
      - text: Short pace ·
      - generic [ref=e38]: 12 realms
    - button "Realm progression" [ref=e39] [cursor=pointer]
    - generic [ref=e40]: Partial archive · earlier history unavailable
  - group [ref=e41]:
    - generic "Campaign & settings" [ref=e42] [cursor=pointer]
    - option "100%" [selected]
    - option "115%"
    - option "130%"
  - main [ref=e43]:
    - complementary [ref=e44]:
      - generic [ref=e45]:
        - img "Ashen Compact crest · approved faction artwork" [ref=e46]
        - generic [ref=e47]:
          - generic [ref=e48]: Your people
          - heading "Ashen Compact" [level=2] [ref=e49]
      - generic [ref=e50]:
        - text: Search your realm
        - searchbox "Search your realm" [ref=e51]
      - region "Next-action navigation" [ref=e52]:
        - paragraph [ref=e53]: 0 armies needing orders · 3 idle settlements with available production
        - generic [ref=e54]:
          - button "Previous army needing orders" [disabled] [ref=e55]: ←
          - button "Next army needing orders" [disabled] [ref=e56]: Army needing orders N
          - button "Previous idle settlement" [ref=e57] [cursor=pointer]: ←
          - button "Next idle settlement" [ref=e58] [cursor=pointer]: Idle town S
        - group [ref=e59]:
          - generic "Navigation rules & shortcuts" [ref=e60]
        - status
      - tabpanel "Armies 47" [ref=e61]:
        - generic [ref=e62]:
          - text: Force type
          - combobox "Force type" [ref=e63]:
            - option "All armies & fleets" [selected]
            - option "Land armies ashore"
            - option "Fleets"
            - option "Embarked armies"
        - generic [ref=e64]:
          - generic [ref=e65]:
            - generic [ref=e66]:
              - text: Registry order
              - combobox "Registry order" [ref=e67]:
                - option "Stable order" [selected]
                - option "Name A–Z"
            - generic [ref=e68]: 47 forces
          - generic [ref=e69]:
            - button "Gallery observer 1 formation · 0 movement · 20 strength" [ref=e70] [cursor=pointer]:
              - generic [aria-hidden] [ref=e71]: △
              - generic [ref=e72]:
                - strong [ref=e73]: Gallery observer
                - generic [ref=e74]: 1 formation · 0 movement · 20 strength
              - generic [aria-hidden] [ref=e75]: ›
            - button "Gallery observer 1 formation · 0 movement · 20 strength" [ref=e76] [cursor=pointer]:
              - generic [aria-hidden] [ref=e77]: △
              - generic [ref=e78]:
                - strong [ref=e79]: Gallery observer
                - generic [ref=e80]: 1 formation · 0 movement · 20 strength
              - generic [aria-hidden] [ref=e81]: ›
            - button "Gallery observer 1 formation · 0 movement · 20 strength" [ref=e82] [cursor=pointer]:
              - generic [aria-hidden] [ref=e83]: △
              - generic [ref=e84]:
                - strong [ref=e85]: Gallery observer
                - generic [ref=e86]: 1 formation · 0 movement · 20 strength
              - generic [aria-hidden] [ref=e87]: ›
            - button "Gallery observer 1 formation · 0 movement · 20 strength" [ref=e88] [cursor=pointer]:
              - generic [aria-hidden] [ref=e89]: △
              - generic [ref=e90]:
                - strong [ref=e91]: Gallery observer
                - generic [ref=e92]: 1 formation · 0 movement · 20 strength
              - generic [aria-hidden] [ref=e93]: ›
            - button "Gallery observer 1 formation · 0 movement · 20 strength" [ref=e94] [cursor=pointer]:
              - generic [aria-hidden] [ref=e95]: △
              - generic [ref=e96]:
                - strong [ref=e97]: Gallery observer
                - generic [ref=e98]: 1 formation · 0 movement · 20 strength
              - generic [aria-hidden] [ref=e99]: ›
            - button "culture-cohort-1 unit survey 1 formation · 0 movement · 20 strength" [ref=e100] [cursor=pointer]:
              - generic [aria-hidden] [ref=e101]: △
              - generic [ref=e102]:
                - strong [ref=e103]: culture-cohort-1 unit survey
                - generic [ref=e104]: 1 formation · 0 movement · 20 strength
              - generic [aria-hidden] [ref=e105]: ›
            - button "Town observer 1 formation · 0 movement · 20 strength" [ref=e106] [cursor=pointer]:
              - generic [aria-hidden] [ref=e107]: △
              - generic [ref=e108]:
                - strong [ref=e109]: Town observer
                - generic [ref=e110]: 1 formation · 0 movement · 20 strength
              - generic [aria-hidden] [ref=e111]: ›
            - button "Town observer 1 formation · 0 movement · 20 strength" [ref=e112] [cursor=pointer]:
              - generic [aria-hidden] [ref=e113]: △
              - generic [ref=e114]:
                - strong [ref=e115]: Town observer
                - generic [ref=e116]: 1 formation · 0 movement · 20 strength
              - generic [aria-hidden] [ref=e117]: ›
            - button "Town observer 1 formation · 0 movement · 20 strength" [ref=e118] [cursor=pointer]:
              - generic [aria-hidden] [ref=e119]: △
              - generic [ref=e120]:
                - strong [ref=e121]: Town observer
                - generic [ref=e122]: 1 formation · 0 movement · 20 strength
              - generic [aria-hidden] [ref=e123]: ›
            - button "Town observer 1 formation · 0 movement · 20 strength" [ref=e124] [cursor=pointer]:
              - generic [aria-hidden] [ref=e125]: △
              - generic [ref=e126]:
                - strong [ref=e127]: Town observer
                - generic [ref=e128]: 1 formation · 0 movement · 20 strength
              - generic [aria-hidden] [ref=e129]: ›
            - button "Town observer 1 formation · 0 movement · 20 strength" [ref=e130] [cursor=pointer]:
              - generic [aria-hidden] [ref=e131]: △
              - generic [ref=e132]:
                - strong [ref=e133]: Town observer
                - generic [ref=e134]: 1 formation · 0 movement · 20 strength
              - generic [aria-hidden] [ref=e135]: ›
            - button "Town observer 1 formation · 0 movement · 20 strength" [ref=e136] [cursor=pointer]:
              - generic [aria-hidden] [ref=e137]: △
              - generic [ref=e138]:
                - strong [ref=e139]: Town observer
                - generic [ref=e140]: 1 formation · 0 movement · 20 strength
              - generic [aria-hidden] [ref=e141]: ›
            - button "Town observer 1 formation · 0 movement · 20 strength" [ref=e142] [cursor=pointer]:
              - generic [aria-hidden] [ref=e143]: △
              - generic [ref=e144]:
                - strong [ref=e145]: Town observer
                - generic [ref=e146]: 1 formation · 0 movement · 20 strength
              - generic [aria-hidden] [ref=e147]: ›
            - button "Town observer 1 formation · 0 movement · 20 strength" [ref=e148] [cursor=pointer]:
              - generic [aria-hidden] [ref=e149]: △
              - generic [ref=e150]:
                - strong [ref=e151]: Town observer
                - generic [ref=e152]: 1 formation · 0 movement · 20 strength
              - generic [aria-hidden] [ref=e153]: ›
            - button "culture-cohort-1 stage-2 survey 1 formation · 0 movement · 20 strength" [ref=e154] [cursor=pointer]:
              - generic [aria-hidden] [ref=e155]: △
              - generic [ref=e156]:
                - strong [ref=e157]: culture-cohort-1 stage-2 survey
                - generic [ref=e158]: 1 formation · 0 movement · 20 strength
              - generic [aria-hidden] [ref=e159]: ›
            - button "Town observer 1 formation · 0 movement · 20 strength" [ref=e160] [cursor=pointer]:
              - generic [aria-hidden] [ref=e161]: △
              - generic [ref=e162]:
                - strong [ref=e163]: Town observer
                - generic [ref=e164]: 1 formation · 0 movement · 20 strength
              - generic [aria-hidden] [ref=e165]: ›
            - button "Town observer 1 formation · 0 movement · 20 strength" [ref=e166] [cursor=pointer]:
              - generic [aria-hidden] [ref=e167]: △
              - generic [ref=e168]:
                - strong [ref=e169]: Town observer
                - generic [ref=e170]: 1 formation · 0 movement · 20 strength
              - generic [aria-hidden] [ref=e171]: ›
            - button "Town observer 1 formation · 0 movement · 20 strength" [ref=e172] [cursor=pointer]:
              - generic [aria-hidden] [ref=e173]: △
              - generic [ref=e174]:
                - strong [ref=e175]: Town observer
                - generic [ref=e176]: 1 formation · 0 movement · 20 strength
              - generic [aria-hidden] [ref=e177]: ›
            - button "Town observer 1 formation · 0 movement · 20 strength" [ref=e178] [cursor=pointer]:
              - generic [aria-hidden] [ref=e179]: △
              - generic [ref=e180]:
                - strong [ref=e181]: Town observer
                - generic [ref=e182]: 1 formation · 0 movement · 20 strength
              - generic [aria-hidden] [ref=e183]: ›
            - button "culture-cohort-1 stage-3 survey 1 formation · 0 movement · 20 strength" [ref=e184] [cursor=pointer]:
              - generic [aria-hidden] [ref=e185]: △
              - generic [ref=e186]:
                - strong [ref=e187]: culture-cohort-1 stage-3 survey
                - generic [ref=e188]: 1 formation · 0 movement · 20 strength
              - generic [aria-hidden] [ref=e189]: ›
            - button "Gallery observer 1 formation · 0 movement · 20 strength" [ref=e190] [cursor=pointer]:
              - generic [aria-hidden] [ref=e191]: △
              - generic [ref=e192]:
                - strong [ref=e193]: Gallery observer
                - generic [ref=e194]: 1 formation · 0 movement · 20 strength
              - generic [aria-hidden] [ref=e195]: ›
            - button "Gallery observer 1 formation · 0 movement · 20 strength" [ref=e196] [cursor=pointer]:
              - generic [aria-hidden] [ref=e197]: △
              - generic [ref=e198]:
                - strong [ref=e199]: Gallery observer
                - generic [ref=e200]: 1 formation · 0 movement · 20 strength
              - generic [aria-hidden] [ref=e201]: ›
            - button "Gallery observer 1 formation · 0 movement · 20 strength" [ref=e202] [cursor=pointer]:
              - generic [aria-hidden] [ref=e203]: △
              - generic [ref=e204]:
                - strong [ref=e205]: Gallery observer
                - generic [ref=e206]: 1 formation · 0 movement · 20 strength
              - generic [aria-hidden] [ref=e207]: ›
            - button "Gallery observer 1 formation · 0 movement · 20 strength" [ref=e208] [cursor=pointer]:
              - generic [aria-hidden] [ref=e209]: △
              - generic [ref=e210]:
                - strong [ref=e211]: Gallery observer
                - generic [ref=e212]: 1 formation · 0 movement · 20 strength
              - generic [aria-hidden] [ref=e213]: ›
            - button "Gallery observer 1 formation · 0 movement · 20 strength" [ref=e214] [cursor=pointer]:
              - generic [aria-hidden] [ref=e215]: △
              - generic [ref=e216]:
                - strong [ref=e217]: Gallery observer
                - generic [ref=e218]: 1 formation · 0 movement · 20 strength
              - generic [aria-hidden] [ref=e219]: ›
          - navigation "Registry pages" [ref=e220]:
            - button "Previous registry page" [disabled] [ref=e221]: ←
            - generic [ref=e222]: Page 1 of 2
            - button "Next registry page" [ref=e223] [cursor=pointer]: →
      - group [ref=e224]:
        - generic "Realm affairs 11 contacts · 0 wars" [ref=e225] [cursor=pointer]:
          - text: Realm affairs
          - generic [ref=e226]: 11 contacts · 0 wars
      - group [ref=e227]:
        - generic "Chronicle 2" [ref=e228] [cursor=pointer]:
          - text: Chronicle
          - generic [ref=e229]: "2"
    - region "Strategic map" [ref=e230]:
      - generic: SEED 20260905 · 256 × 160
      - generic "World map. Select an army then click a highlighted hex to move or an enemy to attack. Hover to preview routes. Drag to pan; scroll to zoom. Arrow keys pan; plus and minus zoom. Escape clears selection. The army panel has keyboard and touch route controls." [ref=e231]
      - generic [aria-hidden]:
        - generic: "N"
        - text: ✧
      - generic [ref=e233]:
        - button "Zoom in" [active] [ref=e234] [cursor=pointer]: +
        - button "Zoom out" [ref=e235] [cursor=pointer]: −
        - button "Focus selection" [ref=e236] [cursor=pointer]
      - generic [ref=e237]:
        - generic [ref=e238]: ⌂ Settlement
        - generic [ref=e239]: △ Army
        - generic [ref=e240]: ◆ Your realm
        - generic [ref=e241]: "Dim terrain: explored"
        - generic "Approved pixel atlases loaded." [ref=e242]: "Art: approved pixel pack"
    - complementary "Selected entity orders" [ref=e243]:
      - group [ref=e244]:
        - generic [ref=e245]: Orders & stewardship
        - generic [ref=e246]:
          - img "Ashen Compact army banner · approved faction artwork" [ref=e247]
          - heading "culture-cohort-1 unit survey" [level=2] [ref=e248]
        - paragraph [ref=e249]: Wayfinder · cell 3862
        - generic [ref=e250]:
          - generic [ref=e251]:
            - strong [ref=e252]: "0"
            - generic [ref=e253]: Movement
          - generic [ref=e254]:
            - strong [ref=e255]: "20"
            - generic [ref=e256]: Strength
        - region "Army commander and agents" [ref=e257]:
          - paragraph [ref=e258]: "Commander: No marshal assigned"
          - paragraph [ref=e259]: "Command: 1 / 12 formations. Unled detachment: twelve-formation command capacity."
          - paragraph [ref=e260]: "Agents: None attached"
          - button "Manage characters for culture-cohort-1 unit survey" [ref=e261] [cursor=pointer]: Manage army characters
        - region "Map movement orders" [ref=e262]:
          - heading "Paths & marching orders" [level=3] [ref=e263]
          - paragraph [ref=e264]: 0 highlighted destinations within current movement. Click a reachable hex to move, or a reachable hostile army to attack. Dragging only pans.
          - generic [ref=e265]:
            - checkbox "Add waypoint mode" [ref=e266]
            - text: Add waypoint mode
          - paragraph [ref=e267]: Shift-click adds a waypoint. For longer journeys, review a target and queue its route. Escape clears selection.
          - generic [ref=e268]:
            - generic [ref=e269]:
              - text: Destination hex
              - spinbutton "Destination hex" [ref=e270]
            - button "Review route" [ref=e271] [cursor=pointer]
          - status [ref=e272]: No movement remains. Queue a future route or end the turn.
        - group [ref=e273]:
          - generic "Army composition 1 / 12 formations" [ref=e274] [cursor=pointer]:
            - text: Army composition
            - generic [ref=e275]: 1 / 12 formations
          - option "No other owned army here" [selected]
        - heading "Single-step shortcuts" [level=3] [ref=e276]
        - paragraph [ref=e277]: "Optional: move one neighboring hex using the buttons below. For complete routes and attacks, use the map or Paths & marching orders above."
        - generic [ref=e278]:
          - button "Move to cell 3863" [ref=e279] [cursor=pointer]:
            - text: Plains
            - generic [ref=e280]: Hex 3863
          - button "Move to cell 4119" [ref=e281] [cursor=pointer]:
            - text: Plains
            - generic [ref=e282]: Hex 4119
          - button "Move to cell 4118" [ref=e283] [cursor=pointer]:
            - text: Plains
            - generic [ref=e284]: Hex 4118
          - button "Move to cell 3861" [ref=e285] [cursor=pointer]:
            - text: Plains
            - generic [ref=e286]: Hex 3861
          - button "Move to cell 3606" [ref=e287] [cursor=pointer]:
            - text: Plains
            - generic [ref=e288]: Hex 3606
          - button "Move to cell 3607" [ref=e289] [cursor=pointer]:
            - text: Plains
            - generic [ref=e290]: Hex 3607
        - region "Settlement siege orders" [ref=e291]:
          - heading "Walls & blockades" [level=3] [ref=e292]
          - paragraph [ref=e293]: No neighboring foreign settlements are in sight.
        - region "Nearby enemy forces" [ref=e294]:
          - heading "Field engagement" [level=3] [ref=e295]
          - paragraph [ref=e296]: "Your force: 20 strength · 55 morale · 0 fatigue."
          - generic [ref=e297]:
            - strong [ref=e298]: cinder_march heavy_infantry
            - generic [ref=e299]: Cinder March · hex 3607
            - paragraph [ref=e300]: 85 strength · 85 morale · 0 fatigue
            - paragraph [ref=e301]: Plains · 1 defending formations
            - paragraph [ref=e302]: Declare war from the encountered factions list before attacking.
          - generic [ref=e303]:
            - strong [ref=e304]: glass_tide heavy_infantry
            - generic [ref=e305]: Glass Tide · hex 4119
            - paragraph [ref=e306]: 85 strength · 85 morale · 0 fatigue
            - paragraph [ref=e307]: Plains · 1 defending formations
            - paragraph [ref=e308]: Declare war from the encountered factions list before attacking.
          - paragraph [ref=e309]: The battle includes every defending land formation at that hex. Forests provide cover and hills favor defenders. Command each round or let your officers resolve the engagement.
        - generic [ref=e310]:
          - generic [ref=e311]: Selected hex 3862
          - paragraph [ref=e312]: Temperate grassland · Plains · fertility 60 · in sight
  - contentinfo [ref=e313]:
    - status [ref=e314]:
      - generic [aria-hidden] [ref=e315]: ◆
      - text: "Imported campaign. Partial archive: earlier campaign history was not recorded in this save."
    - generic [ref=e316]:
      - generic [ref=e317]: AGE OF FRACTURE
      - strong [ref=e318]: Turn 1
    - button "End turn" [ref=e319] [cursor=pointer]:
      - text: End turn
      - generic [ref=e320]: E
  - generic [ref=e321]:
    - button "Art Lab" [ref=e322] [cursor=pointer]
    - generic [ref=e323]: Development asset inspector
```

# Test source

```ts
  50  |   }
  51  |   addArmy(state.turnOwnerId, 'unit.guard', cell(19, 10), 'Co-located hearth reserve');
  52  |   // The same authored family also has a genuine unseen army, never sent to the renderer.
  53  |   addArmy(state.factions[3]!.id, 'unit.guard', 0, HIDDEN_ARMY_NAME);
  54  |   for (const faction of state.factions) state.explored[faction.id] = new Set();
  55  |   function reveal(factionId: string, origin: number, radius: number): void {
  56  |     const seen = new Set([origin]); let frontier = [origin];
  57  |     for (let distance = 0; distance < radius; distance++) {
  58  |       const next: number[] = [];
  59  |       for (const origin of frontier) for (const adjacent of neighbors(origin, state.world.width, state.world.height)) if (!seen.has(adjacent)) { seen.add(adjacent); next.push(adjacent); }
  60  |       frontier = next;
  61  |     }
  62  |     for (const origin of seen) state.explored[factionId]!.add(origin);
  63  |   }
  64  |   for (const army of Object.values(state.armies)) reveal(army.factionId, army.cell, 4);
  65  |   for (const town of Object.values(state.settlements)) reveal(town.factionId, town.cell, 3);
  66  |   rebaseAuthoredLand(state);
  67  |   const restored = deserializeGame(serializeGame(state)), view = getObservation(restored, restored.turnOwnerId, { landDetails: 'none' });
  68  |   if (view.factions.length !== FACTION_ART_FAMILIES.length || view.settlements.length !== FACTION_ART_FAMILIES.length * TOWN_ROLES.length || view.armies.some(army => army.name === HIDDEN_ARMY_NAME)) throw new Error('Gallery must expose every culture/town but not its genuinely unseen army');
  69  |   for (const faction of state.factions) for (const role of ROLES) if (!view.armies.some(army => army.factionId === faction.id && army.unitId === role)) throw new Error(`Gallery sight misses ${faction.definitionId}/${role}`);
  70  |   return restored;
  71  | }
  72  | 
  73  | // Construct once even during --list: validates the authored save and actual fog before a browser run.
  74  | const GALLERY_SAVE = serializeGame(factionGallery());
  75  | 
  76  | async function loadGallery(page: Page): Promise<void> {
  77  |   await page.setViewportSize({ width: 1680, height: 1320 });
  78  |   await page.goto('/');
  79  |   await page.locator('input[type=file]').setInputFiles({ name: `${FACTION_ART_FAMILIES.length}-observed-cultures.theandril`, mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(GALLERY_SAVE)) });
  80  |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  81  |   await page.getByTestId('army-registry').getByRole('button', { name: new RegExp(`${COHORTS[0]!.label} unit survey`) }).click();
  82  |   await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics()?.state)).toBe('ready');
  83  | }
  84  | 
  85  | test(`all ${FACTION_ART_FAMILIES.length} observed cultures select distinct untinted role art and bounded strategic heraldry without changing canonical input or fog`, async ({ page }, testInfo) => {
  86  |   const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  87  |   await loadGallery(page);
  88  |   await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  89  |   const hash = await page.evaluate(() => window.__THEANDRIL__?.getStateHash());
  90  |   const summary = await page.evaluate(() => window.__THEANDRIL__?.getSummary());
  91  |   expect(summary?.factions.map(faction => faction.definitionId)).toEqual(FACTION_ART_FAMILIES.map(family => `faction.${family}`));
  92  |   expect(summary?.armies.some(army => army.name === HIDDEN_ARMY_NAME)).toBe(false);
  93  |   const inspections: unknown[] = [], allNearAssets = new Set<string>(), allFarAssets = new Set<string>();
  94  |   const inspectNear = async (label: string, expected: string[]) => {
  95  |     // Real player camera input, not hidden CSS: clear the tall selected-army
  96  |     // overlay, then move the first town right of the retained map title/hint.
  97  |     // At this viewport/zoom +275px clears the map title (and any active hint)
  98  |     // and keeps even the rightmost 128px city inside with a measured margin.
  99  |     const zoomBefore = await page.evaluate(() => window.__THEANDRIL__?.getPerformanceCounters()?.zoom);
  100 |     await page.keyboard.press('Escape');
  101 |     await expect(page.getByTestId('map-route-preview')).toHaveCount(0);
  102 |     const canvas = await page.getByTestId('map-container').locator('canvas').boundingBox();
  103 |     if (!canvas) throw new Error('Gallery camera requires the real map canvas');
  104 |     const start = { x: canvas.x + canvas.width * .42, y: canvas.y + Math.min(canvas.height * .55, 600) };
  105 |     await page.mouse.move(start.x, start.y);
  106 |     await page.mouse.down();
  107 |     await page.mouse.move(start.x + 275, start.y, { steps: 10 });
  108 |     await page.mouse.up();
  109 |     await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics()?.visibleAssetIds)).toEqual(expect.arrayContaining(expected));
  110 |     const framing = await page.evaluate(expectedIds => {
  111 |       const diagnostics = window.__THEANDRIL__?.getArtDiagnostics(), view = window.__THEANDRIL__?.getSummary();
  112 |       const canvas = document.querySelector('[data-testid="map-container"] canvas')?.getBoundingClientRect();
  113 |       const title = document.querySelector('.map-title')?.getBoundingClientRect();
  114 |       const hint = document.querySelector('.map-order-hint')?.getBoundingClientRect();
  115 |       const towns = (diagnostics?.visibleEntityArt ?? []).filter(art => art.role.startsWith('settlement.') && art.assetId && expectedIds.includes(art.assetId)).map(art => {
  116 |         const town = view?.settlements.find(town => town.id === art.entityId);
  117 |         const point = town && window.__THEANDRIL__?.getCellScreenPoint(town.cell);
  118 |         const adjacent = town && window.__THEANDRIL__?.getCellScreenPoint(town.cell + 1);
  119 |         if (!point || !adjacent || !art.nativeWidth) throw new Error('Missing observed town projection');
  120 |         // The approved centered native canvas uses the renderer's 56px tile
  121 |         // width fit; infer live zoom/spacing from adjacent projected hexes.
  122 |         const half = art.nativeWidth * (adjacent.x - point.x) / 56 / 2;
  123 |         return { assetId: art.assetId, left: point.x - half, right: point.x + half };
  124 |       });
  125 |       return { panPixels: 275, zoom: window.__THEANDRIL__?.getPerformanceCounters()?.zoom, titleRight: title?.right, hintRight: hint?.right, canvasRight: canvas?.right, towns };
  126 |     }, expected);
  127 |     expect(framing.zoom).toBe(zoomBefore);
  128 |     expect(framing.towns).toHaveLength(expected.filter(id => id.startsWith('settlement.')).length);
  129 |     expect(framing.titleRight).toBeDefined();
  130 |     // The title remains mandatory. The removed neutral hint has no rectangle
  131 |     // to clear; a real active hint, when present, still constrains every town.
  132 |     expect(Math.min(...framing.towns.map(town => town.left))).toBeGreaterThan(Math.max(framing.titleRight ?? Infinity, framing.hintRight ?? -Infinity) + 2);
  133 |     expect(Math.max(...framing.towns.map(town => town.right))).toBeLessThan((framing.canvasRight ?? -Infinity) - 4);
  134 |     expect(await page.evaluate(() => window.__THEANDRIL__?.getSelection()?.armyId)).toBeUndefined();
  135 |     const near = await page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics());
  136 |     expect(near?.lod).toBe('near-sprites'); expect(near?.warnings).toEqual([]);
  137 |     expect(near?.visibleAnimationFrames).toEqual([]); // Approved faction poses are static, not a fabricated idle cycle.
  138 |     for (const entity of near?.visibleEntityArt ?? []) {
  139 |       expect(entity.assetId).toBe(factionArtId(entity.role, entity.definitionId!));
  140 |       expect(entity.tint).toBe(0xffffff);
  141 |       expect(entity.nativeWidth).toBe(entity.role === 'settlement.city' ? 128 : entity.role.startsWith('settlement.') || entity.role === 'unit.cavalry' ? 96 : 64);
  142 |       expect(entity.nativeHeight).toBe(entity.nativeWidth);
  143 |     }
  144 |     for (const id of near?.visibleAssetIds ?? []) allNearAssets.add(id);
  145 |     inspections.push({ label, near, framing });
  146 |     await page.screenshot({ path: testInfo.outputPath(`${label}-near.png`), fullPage: true });
  147 |   };
  148 |   for (const [index, cohort] of COHORTS.entries()) {
  149 |     if (index > 0) for (let zoom = 0; zoom < 4; zoom++) await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
> 150 |     await page.getByTestId('army-registry').getByRole('button', { name: new RegExp(`${cohort.label} unit survey`) }).click();
      |                                                                                                                      ^ Error: locator.click: Test timeout of 45000ms exceeded.
  151 |     await inspectNear(`${cohort.label}-units-and-villages`, cohort.families.flatMap(family => [...ROLES, TOWN_ROLES[0]!].map(role => `${role}.${family}`)));
  152 |     if (index === 0) {
  153 |       // A sprite's larger visual canvas does not replace the canonical hex hit target.
  154 |       await page.keyboard.press('Escape');
  155 |       const target = cell(19, 12);
  156 |       const point = await page.evaluate(cell => window.__THEANDRIL__?.getCellScreenPoint(cell), target);
  157 |       if (!point?.inViewport) throw new Error('Visible Reedbound guard is not on the real map canvas');
  158 |       await page.mouse.click(point.x, point.y);
  159 |       await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getSelection()?.cell)).toBe(target);
  160 |     }
  161 |     // Keep every development stage at the same native camera scale, not squeezed into one giant screenshot.
  162 |     for (let stage = 1; stage < TOWN_ROLES.length; stage++) {
  163 |       await page.getByTestId('army-registry').getByRole('button', { name: new RegExp(`${cohort.label} stage-${stage + 1} survey`) }).click();
  164 |       await inspectNear(`${cohort.label}-stage-${stage + 1}`, cohort.families.map(family => `${TOWN_ROLES[stage]}.${family}`));
  165 |     }
  166 |     await page.getByTestId('army-registry').getByRole('button', { name: new RegExp(`${cohort.label} unit survey`) }).click();
  167 |     for (let zoom = 0; zoom < 4; zoom++) await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
  168 |     await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics()?.lod)).toBe('strategic-glyphs');
  169 |     const expectedFar = cohort.families.flatMap(family => [`ui.badge.${family}`, `ui.banner.${family}`]);
  170 |     await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics()?.visibleAssetIds)).toEqual(expect.arrayContaining(expectedFar));
  171 |     const far = await page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics());
  172 |     expect(far?.visibleAnimationFrames).toEqual([]);
  173 |     expect(far?.visibleEntityArt.every(entity => entity.presentation === 'strategic' && entity.tint === 0xffffff)).toBe(true);
  174 |     expect(far?.visibleEntityArt.every(entity => entity.nativeWidth === (entity.role.startsWith('settlement.') ? 64 : 32))).toBe(true);
  175 |     const metrics = await page.evaluate(() => window.__THEANDRIL__?.getPerformanceCounters());
  176 |     expect(metrics?.visibleSprites).toBeLessThanOrEqual(metrics?.visibleEntities ?? 0);
  177 |     if (index === 0) expect(metrics?.visibleSprites).toBeLessThan(metrics?.visibleEntities ?? 0); // Actual co-located reserve grouping.
  178 |     for (const id of far?.visibleAssetIds ?? []) allFarAssets.add(id);
  179 |     inspections.push({ label: cohort.label, far, metrics });
  180 |     await page.screenshot({ path: testInfo.outputPath(`${cohort.label}-far.png`), fullPage: true });
  181 |   }
  182 |   expect([...allNearAssets]).toEqual(expect.arrayContaining(FACTION_ART_FAMILIES.flatMap(family => [...ROLES, ...TOWN_ROLES].map(role => `${role}.${family}`))));
  183 |   expect([...allFarAssets]).toEqual(expect.arrayContaining(FACTION_ART_FAMILIES.flatMap(family => [`ui.badge.${family}`, `ui.banner.${family}`])));
  184 |   await page.setViewportSize({ width: 390, height: 844 });
  185 |   await page.getByRole('button', { name: 'Focus selection', exact: true }).click();
  186 |   await page.getByTestId('map-container').scrollIntoViewIfNeeded();
  187 |   await page.screenshot({ path: testInfo.outputPath(`${FACTION_ART_FAMILIES.length}-cultures-narrow.png`) });
  188 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  189 |   expect(await page.evaluate(() => window.__THEANDRIL__?.getStateHash())).toBe(hash);
  190 |   await testInfo.attach('faction-art-inspection.json', { body: JSON.stringify({ inspections, coveredNearAssetIds: [...allNearAssets].sort(), coveredStrategicAssetIds: [...allFarAssets].sort(), notes: ['Authored Small-map placement imported through validated save boundary; no runtime mutation hooks.', 'Two separate six-culture unit cohorts plus same-scale village/town/city cameras; all twelve families covered across screenshots, never by shrinking native art.', 'Only actually visible enemies supplied art metadata; an off-gallery army remains genuinely unseen.', 'Static one-pose faction art; native 32px badges and 64px banners use exact nearest 2:1 reduction at strategic zoom.', 'Selection, zoom and narrow resizing did not alter canonical state.'] }, null, 2), contentType: 'application/json' });
  191 |   expect(errors).toEqual([]);
  192 | });
  193 | 
  194 | test('a missing approved culture variant uses its generic role and explicit warning, never a different culture', async ({ page }) => {
  195 |   const missingId = 'unit.guard.reedbound_council';
  196 |   await page.route('**/art/catalog.json', async route => {
  197 |     const response = await route.fetch(); const catalog = await response.json() as RuntimeCatalog;
  198 |     const missing = catalog.assets.find(asset => asset.id === missingId);
  199 |     const atlas = catalog.atlases.find(atlas => atlas.id === missing?.atlasId);
  200 |     if (!missing || !atlas) throw new Error('Missing-variant test requires the real approved Reedbound guard asset');
  201 |     // Simulate an incomplete deployment without forging pixels, approvals or hashes.
  202 |     await page.route(`**${atlas.jsonUrl}`, async atlasRoute => {
  203 |       const response = await atlasRoute.fetch(); const metadata = await response.json();
  204 |       for (const frame of missing.frames) delete metadata.frames[frame.id];
  205 |       for (const clip of missing.clips) delete metadata.animations[clip.id];
  206 |       await atlasRoute.fulfill({ response, json: metadata });
  207 |     });
  208 |     catalog.assets = catalog.assets.filter(asset => asset.id !== missingId);
  209 |     await route.fulfill({ response, json: catalog });
  210 |   });
  211 |   await loadGallery(page);
  212 |   await expect(page.getByTestId('art-runtime-status')).toContainText('partial pixel pack');
  213 |   await expect(page.getByTestId('art-runtime-status')).toHaveAttribute('title', new RegExp(missingId));
  214 |   const art = await page.evaluate(() => window.__THEANDRIL__?.getArtDiagnostics());
  215 |   const guard = art?.visibleEntityArt.find(entity => entity.role === 'unit.guard' && entity.definitionId === 'faction.reedbound_council');
  216 |   expect(guard).toMatchObject({ assetId: 'unit.guard', presentation: 'generic', nativeWidth: 64, tint: 0xffffff });
  217 |   expect(art?.visibleAssetIds).not.toContain(missingId);
  218 |   expect(art?.visibleAssetIds).toContain('unit.guard.glass_tide');
  219 | });
  220 | 
```