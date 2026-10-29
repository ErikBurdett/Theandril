# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: posting-targets.spec.ts >> production saved muster at an unavailable hex requires a fresh owned choice and remains clearable with exact saved history
- Location: tests/production/posting-targets.spec.ts:89:1

# Error details

```
Error: page.screenshot: Protocol error (Page.captureScreenshot): Unable to capture screenshot
Call log:
  - taking page screenshot
  - waiting for fonts to load...
  - fonts loaded

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
        - paragraph [ref=e78]: Target Hearth
      - button "Close Selected orders" [ref=e79] [cursor=pointer]: ×
    - region "Selected entity orders" [ref=e81]:
      - button "Show on map" [ref=e82] [cursor=pointer]
      - group [ref=e83]:
        - heading "Target Hearth" [level=2] [ref=e84]
        - paragraph [ref=e85]: A hearth of the Ashen Compact · cell 490
        - generic [ref=e86]:
          - generic [ref=e87]:
            - strong [ref=e88]: "1"
            - generic [ref=e89]: Population
          - generic [ref=e90]:
            - strong [ref=e91]: "0"
            - generic [ref=e92]: Stored food
        - heading "Production queue" [level=3] [ref=e93]
        - paragraph [ref=e94]: The hearth is idle. Choose a project below.
        - group [ref=e95]:
          - generic "Muster point hex 0" [active] [ref=e96] [cursor=pointer]:
            - text: Muster point
            - generic [ref=e97]: hex 0
          - paragraph [ref=e98]: Every company this hearth raises is posted to the muster point the turn it forms, marches there under an ordinary travel order and joins the force it finds. Clearing the muster point leaves companies where they are raised.
          - generic [ref=e99]:
            - text: Muster at
            - combobox "Muster at" [invalid] [ref=e100]:
              - option "Choose a destination" [selected]
              - option "Target Hearth · hex 490"
          - paragraph [ref=e101]: Choose a destination from the current list before setting a muster point. The existing muster point at hex 0 remains unchanged and can still be cleared.
          - button "Move muster point" [disabled] [ref=e102]
          - button "Clear muster point" [ref=e103] [cursor=pointer]
        - generic "Settlement production" [ref=e104]:
          - group [ref=e105]:
            - generic "Standing charter none" [ref=e106] [cursor=pointer]:
              - text: Standing charter
              - generic [ref=e107]: none
            - option "Works" [selected]
            - option "Wealth"
            - option "Learning"
            - option "Muster"
          - group [ref=e108]:
            - generic "Construction 4 available" [ref=e109] [cursor=pointer]:
              - text: Construction
              - generic [ref=e110]: 4 available
            - generic [ref=e111]:
              - article [ref=e112]:
                - generic [ref=e114]:
                  - heading "Root cellar" [level=4] [ref=e115]
                  - paragraph [ref=e116]: 18 industry · 8 coin
                  - paragraph [ref=e117]: +4 food each turn
                - button "Build Root cellar" [ref=e118] [cursor=pointer]
              - article [ref=e119]:
                - generic [ref=e121]:
                  - heading "Cinder workshop" [level=4] [ref=e122]
                  - paragraph [ref=e123]: 24 industry · 12 coin
                  - paragraph [ref=e124]: +4 industry each turn
                - button "Build Cinder workshop" [ref=e125] [cursor=pointer]
              - article [ref=e126]:
                - generic [ref=e128]:
                  - heading "Charter market" [level=4] [ref=e129]
                  - paragraph [ref=e130]: 24 industry · 10 coin
                  - paragraph [ref=e131]: +5 coin each turn
                - button "Build Charter market" [ref=e132] [cursor=pointer]
              - article [ref=e133]:
                - generic [ref=e135]:
                  - heading "Witness archive" [level=4] [ref=e136]
                  - paragraph [ref=e137]: 24 industry · 12 coin
                  - paragraph [ref=e138]: +4 knowledge each turn
                - button "Build Witness archive" [ref=e139] [cursor=pointer]
              - article [ref=e140]:
                - generic [ref=e142]:
                  - heading "Charter harbor" [level=4] [ref=e143]
                  - paragraph [ref=e144]: 36 industry · 20 coin
                  - paragraph [ref=e145]: +2 coin each turn
                - paragraph [ref=e146]: Research Coastal navigation first.
                - button "Build Charter harbor" [disabled] [ref=e147]
          - group [ref=e148]:
            - generic "Recruit land forces 6 available" [ref=e149] [cursor=pointer]:
              - text: Recruit land forces
              - generic [ref=e150]: 6 available
          - group [ref=e151]:
            - generic "Recruit fleet hulls 0 available" [ref=e152] [cursor=pointer]:
              - text: Recruit fleet hulls
              - generic [ref=e153]: 0 available
        - region "Settlement territory" [ref=e154]:
          - heading "Land & stewardship" [level=3] [ref=e155]
          - group [ref=e156]:
            - generic "Worker policy Manual control" [ref=e157] [cursor=pointer]:
              - text: Worker policy
              - generic [ref=e158]: Manual control
            - option "Balanced" [selected]
            - option "Food"
            - option "Industry"
            - option "Coin"
            - option "Knowledge"
          - group [ref=e159]:
            - generic "Land commission Direct construction" [ref=e160] [cursor=pointer]:
              - text: Land commission
              - generic [ref=e161]: Direct construction
            - option "Terraced fields" [selected]
            - option "Managed woodlot"
            - option "Measured quarry"
            - option "Reedworks"
            - option "Shore fishery"
            - option "Spring garden"
            - option "Polder"
            - option "Grove archive"
            - option "Oreworks"
            - option "Tide observatory"
            - option "Hearthgrain grange"
            - option "Ironstone mine"
            - option "Copper mine"
            - option "Salt house"
            - option "Heartwood yard"
            - option "Remount yard"
            - option "Silver mine"
            - option "Ashglass refinery"
          - group [ref=e162]:
            - generic "Road connections" [ref=e163] [cursor=pointer]
          - paragraph [ref=e164]: colony · Capital
          - paragraph [ref=e165]: "Colony: 1–2 people · Settlement: 3–7 · City: 8+. Capital is a separate designation."
          - paragraph [ref=e166]: 7 claimed tiles · 0 / 1 assigned workers · reach 2
          - paragraph [ref=e167]: Connected territory and population can keep growing. Each person can work one additional tile. Larger hearths need more food, investment and civic upkeep.
          - paragraph [ref=e168]: "Next person: 0 / 12 food · consumption 2 food per turn · civic upkeep 1 coin (1 population, 0 territory, 0 administration)."
          - paragraph [ref=e169]: "Realm coin per turn: 6 income − 2 upkeep = 4. Queued formations add 0 upkeep when completed."
          - region "Border growth" [ref=e170]:
            - paragraph [ref=e171]:
              - strong [ref=e172]: "Border growth:"
              - text: 0 / 8 civic progress · +1 per active turn
            - progressbar "Civic progress toward next border" [ref=e173]
            - paragraph [ref=e174]: "Next expansion: hex 393. About 8 active turns at this rate. Larger populations, markets, archives and Surveyed estates support growth."
            - paragraph [ref=e175]: Expansion claims one connected, charted tile at a time. It does not build improvements. Workers remain under manual control unless you choose a worker policy. Siege and occupation pause growth; conquest resets its progress. Buying a tile is immediate and increases the next expansion threshold.
          - paragraph [ref=e176]: The center is worked for free. Borders do not block travel. Only worked tiles contribute their yields; natural features remain after cultivation.
          - paragraph [ref=e177]: Map borders mark the realm perimeter. Select tiles to inspect this town’s individual claims. Dim land shows remembered ownership, not live information beyond sight.
          - paragraph [ref=e178]:
            - strong [ref=e179]: "Land yields:"
            - text: +3 food, +1 coin, +1 knowledge
          - paragraph [ref=e180]: Includes the center, assigned tiles and any capital bonus; buildings and other economy effects are separate.
          - group [ref=e181]:
            - generic "Culture & economy · Ashen Compact" [ref=e182] [cursor=pointer]
          - paragraph [ref=e183]: Select a tile on the map to inspect this settlement’s land. Army movement is off while a settlement is selected.
          - button "Select tiles" [ref=e184] [cursor=pointer]
          - region "Land hex 490" [ref=e185]:
            - heading "Hex 490 · Temperate grassland" [level=4] [ref=e186]
            - paragraph [ref=e187]: Settlement center · automatically worked
            - paragraph [ref=e188]:
              - strong [ref=e189]: "Natural features:"
              - text: None
            - table [ref=e190]:
              - caption [ref=e191]: Yield breakdown per worked turn
              - rowgroup [ref=e192]:
                - row [ref=e193]:
                  - columnheader "Source" [ref=e194]
                  - columnheader "Contribution" [ref=e195]
              - rowgroup [ref=e196]:
                - row [ref=e197]:
                  - rowheader "Biome" [ref=e198]
                  - cell "+2 food" [ref=e199]
                - row [ref=e200]:
                  - rowheader "Features" [ref=e201]
                  - cell "No change" [ref=e202]
                - row [ref=e203]:
                  - rowheader "Faction affinity" [ref=e204]
                  - cell "+1 food" [ref=e205]
                - row [ref=e206]:
                  - rowheader "Improvement" [ref=e207]
                  - cell "No change" [ref=e208]
                - row [ref=e209]:
                  - rowheader "Feature interactions" [ref=e210]
                  - cell "No change" [ref=e211]
                - row [ref=e212]:
                  - rowheader "Final tile yield" [ref=e213]
                  - cell "+3 food" [ref=e214]
            - paragraph [ref=e215]: Construction replaces any existing improvement only on completion. Its benefits require an assigned worker; cancelling unfinished work does not refund its cost.
            - group [ref=e216]:
              - generic "Tile improvements" [ref=e217] [cursor=pointer]
            - group [ref=e218]:
              - generic "Cultivate biome" [ref=e219] [cursor=pointer]
        - region "Settlement condition" [ref=e220]:
          - generic [ref=e221]:
            - generic [ref=e222]:
              - text: Devastation
              - strong [ref=e223]: 0/100
            - generic [ref=e224]:
              - text: Occupation
              - strong [ref=e225]: 0 turns
        - group [ref=e226]:
          - generic "Appoint characters & officers" [ref=e227] [cursor=pointer]
        - generic [ref=e228]:
          - generic [ref=e229]: Selected hex 490
          - paragraph [ref=e230]: Temperate grassland · Plains · fertility 60 · in sight
        - paragraph [ref=e231]: Claimed land · Ashen Compact · Target Hearth
  - contentinfo [ref=e232]:
    - generic [ref=e235]:
      - generic [ref=e236]: Selected settlement
      - strong [ref=e237]: Target Hearth
      - generic [ref=e238]: 1 people · 0 queued projects
      - generic [ref=e239]:
        - button "Show selected orders" [ref=e240] [cursor=pointer]
        - button "Show on map" [ref=e241] [cursor=pointer]
    - region "Next-action navigation" [ref=e242]:
      - paragraph [ref=e243]: 1 needing orders · 1 idle settlements
      - generic [ref=e244]:
        - button "Previous army needing orders" [ref=e245] [cursor=pointer]: ‹
        - button "Next army needing orders" [ref=e246] [cursor=pointer]: Next army N
        - button "Previous idle settlement" [ref=e247] [cursor=pointer]: ‹
        - button "Next idle settlement" [ref=e248] [cursor=pointer]: Next town S
      - paragraph [ref=e249]: "Labor: 1 unassigned household · 1 settlement"
      - generic [ref=e250]:
        - button "Previous settlement with unassigned households" [ref=e251] [cursor=pointer]: ‹
        - button "Next settlement with unassigned households" [ref=e252] [cursor=pointer]: Review households
      - group [ref=e253]:
        - generic "What wants a decision 3 kinds" [ref=e254] [cursor=pointer]:
          - text: What wants a decision
          - generic [ref=e255]: 3 kinds
      - status
    - generic [ref=e256]:
      - generic [ref=e257]:
        - generic [ref=e258]: AGE OF FRACTURE
        - strong [ref=e259]: Turn 1
      - button "End turn" [ref=e260] [cursor=pointer]:
        - text: End turn
        - generic [ref=e261]: E
    - status [ref=e262]:
      - generic [aria-hidden] [ref=e263]: ◆
      - text: "Imported campaign. Partial archive: earlier campaign history was not recorded in this save."
```

# Test source

```ts
  2   | import { serializeGame, stateHash, type GameState } from '@theandril/sim';
  3   | import { exportSave } from '@theandril/persistence';
  4   | import { campaignMenu, exportedTravel } from '../gameplay/group-movement-fixture';
  5   | import { openSelectedOrders, selectFromRegistry } from '../gameplay/ui-navigation';
  6   | import { postingTargetsScene } from '../gameplay/posting-targets-fixture';
  7   | 
  8   | async function importTravel(page: Page, game: GameState) {
  9   |   await page.goto('./');
  10  |   expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
  11  |   await page.getByLabel('Import save file').setInputFiles({ name: 'posting-targets.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(game))) });
  12  |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  13  | }
  14  | 
  15  | async function openPosting(page: Page) {
  16  |   await selectFromRegistry(page, 'armies', 'Target scouts');
  17  |   await openSelectedOrders(page);
  18  |   const posting = page.getByTestId('army-posting');
  19  |   await posting.locator(':scope > summary').click();
  20  |   return posting;
  21  | }
  22  | 
  23  | async function restoreExact(page: Page, expected: Awaited<ReturnType<typeof exportedTravel>>) {
  24  |   await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  25  |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  26  |   await page.reload();
  27  |   await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  28  |   await expect(page.getByTestId('feedback')).toContainText('Campaign restored');
  29  |   const restored = await exportedTravel(page);
  30  |   expect(restored.archive).toEqual(expected.archive);
  31  |   expect(stateHash(restored.game)).toBe(stateHash(expected.game));
  32  | }
  33  | 
  34  | test('production where it stands posts to the displayed current position after real movement in the mounted inspector', async ({ page }, testInfo) => {
  35  |   const fixture = postingTargetsScene('moving');
  36  |   await importTravel(page, fixture.game);
  37  |   const posting = await openPosting(page);
  38  |   await posting.getByLabel('Posted to').selectOption({ label: `Where it stands · hex ${fixture.initialCell}` });
  39  |   await posting.getByLabel('On arrival').selectOption('hold');
  40  |   // Keep the same inspector and posting component mounted while its sibling
  41  |   // movement controls issue a real command and replace the army observation.
  42  |   const movement = page.getByTestId('map-orders');
  43  |   await movement.getByLabel('Destination hex', { exact: true }).fill(String(fixture.initialCell + 1));
  44  |   await movement.getByRole('button', { name: 'Review route', exact: true }).click();
  45  |   await movement.getByRole('button', { name: 'Move now', exact: true }).click();
  46  |   await expect(posting.getByRole('button', { name: 'Post army', exact: true })).toBeEnabled();
  47  |   await expect(posting.getByLabel('Posted to').locator('option:checked')).toHaveText(`Where it stands · hex ${fixture.initialCell + 1}`);
  48  |   await posting.getByRole('button', { name: 'Post army', exact: true }).click();
  49  |   await expect(posting.locator(':scope > summary')).toContainText(`Hold · hex ${fixture.initialCell + 1}`);
  50  |   await posting.scrollIntoViewIfNeeded();
  51  |   await page.screenshot({ path: testInfo.outputPath('posting-current-after-movement.png') });
  52  |   const posted = await exportedTravel(page);
  53  |   expect(posted.game.armies[fixture.armyId]!.cell).toBe(fixture.initialCell + 1);
  54  |   expect(posted.game.postings.find(order => order.armyId === fixture.armyId)).toMatchObject({ cell: fixture.initialCell + 1, mode: 'hold' });
  55  |   await restoreExact(page, posted);
  56  | });
  57  | 
  58  | test('production unavailable saved posting stays explicit and clearable without changing its existing route at narrow text scale', async ({ page }, testInfo) => {
  59  |   const fixture = postingTargetsScene('posting'), route = structuredClone(fixture.game.routes[fixture.armyId]);
  60  |   await importTravel(page, fixture.game);
  61  |   await campaignMenu(page);
  62  |   await page.getByRole('combobox', { name: 'Text scale', exact: true }).selectOption('1.3');
  63  |   await page.setViewportSize({ width: 390, height: 844 });
  64  |   const posting = await openPosting(page);
  65  |   await expect(posting.locator(':scope > summary')).toContainText('Hold · hex 0');
  66  |   await expect(posting.getByLabel('Posted to')).toHaveValue('');
  67  |   await expect(posting.getByRole('button', { name: 'Update posting', exact: true })).toBeDisabled();
  68  |   await expect(posting.getByLabel('Posted to')).toHaveAttribute('aria-describedby', /.+/);
  69  |   const clear = posting.getByRole('button', { name: 'Clear posting', exact: true });
  70  |   await expect(clear).toBeEnabled();
  71  |   await clear.scrollIntoViewIfNeeded();
  72  |   await page.screenshot({ path: testInfo.outputPath('posting-unavailable-narrow.png') });
  73  |   await clear.focus(); await page.keyboard.press('Enter');
  74  |   await expect(posting.locator(':scope > summary')).toContainText('none');
  75  |   const cleared = await exportedTravel(page);
  76  |   expect(cleared.game.postings.some(order => order.armyId === fixture.armyId)).toBe(false);
  77  |   expect(cleared.game.routes[fixture.armyId]).toEqual(route);
  78  |   const fresh = await openPosting(page);
  79  |   await fresh.getByLabel('Posted to').selectOption({ label: `Where it stands · hex ${fixture.initialCell}` });
  80  |   await fresh.getByLabel('On arrival').selectOption('hold');
  81  |   await fresh.getByRole('button', { name: 'Post army', exact: true }).click();
  82  |   const posted = await exportedTravel(page);
  83  |   expect(posted.game.postings.find(order => order.armyId === fixture.armyId)?.cell).toBe(fixture.initialCell);
  84  |   expect(posted.game.routes[fixture.armyId]).toEqual(route);
  85  |   await restoreExact(page, posted);
  86  |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  87  | });
  88  | 
  89  | test('production saved muster at an unavailable hex requires a fresh owned choice and remains clearable with exact saved history', async ({ page }, testInfo) => {
  90  |   const fixture = postingTargetsScene('muster');
  91  |   await importTravel(page, fixture.game);
  92  |   await selectFromRegistry(page, 'settlements', 'Target Hearth');
  93  |   await openSelectedOrders(page);
  94  |   const muster = page.getByTestId('settlement-muster');
  95  |   await muster.locator(':scope > summary').click();
  96  |   await expect(muster.locator(':scope > summary')).toContainText('hex 0');
  97  |   await expect(muster.getByLabel('Muster at')).toHaveValue('');
  98  |   await expect(muster.getByRole('button', { name: 'Move muster point', exact: true })).toBeDisabled();
  99  |   await expect(muster.getByLabel('Muster at')).toHaveAttribute('aria-describedby', /.+/);
  100 |   await expect(muster.getByRole('button', { name: 'Clear muster point', exact: true })).toBeEnabled();
  101 |   await muster.scrollIntoViewIfNeeded();
> 102 |   await page.screenshot({ path: testInfo.outputPath('muster-unavailable-desktop.png') });
      |              ^ Error: page.screenshot: Protocol error (Page.captureScreenshot): Unable to capture screenshot
  103 |   // Clearing must not require inventing a valid replacement destination.
  104 |   await muster.getByRole('button', { name: 'Clear muster point', exact: true }).focus(); await page.keyboard.press('Enter');
  105 |   await expect(muster.locator(':scope > summary')).toContainText('none');
  106 |   await muster.getByLabel('Muster at').selectOption(String(fixture.hearthCell));
  107 |   await muster.getByRole('button', { name: 'Set muster point', exact: true }).click();
  108 |   await expect(muster.locator(':scope > summary')).toContainText('Target Hearth');
  109 |   const saved = await exportedTravel(page);
  110 |   expect(saved.game.musters.find(order => order.settlementId === fixture.settlementId)?.cell).toBe(fixture.hearthCell);
  111 |   await restoreExact(page, saved);
  112 | });
  113 | 
```