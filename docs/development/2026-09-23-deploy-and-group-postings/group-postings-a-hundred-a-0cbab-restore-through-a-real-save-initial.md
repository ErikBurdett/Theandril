# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: group-postings.spec.ts >> a hundred armies receive one group posting, retain individual overrides and restore through a real save
- Location: tests/gameplay/group-postings.spec.ts:7:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 0
Received: 39
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
        - heading "Realm registry" [level=2] [ref=e77]
        - paragraph [ref=e78]: Ashen Compact
      - button "Close Realm registry" [ref=e79] [cursor=pointer]: ×
    - generic [ref=e81]:
      - generic [ref=e82]:
        - img "Ashen Compact crest · approved faction artwork" [ref=e83]
        - generic [ref=e84]:
          - generic [ref=e85]: Your people
          - heading "Ashen Compact" [level=3] [ref=e86]
      - generic [ref=e88]:
        - tablist "Realm registry" [ref=e89]:
          - tab "Armies 100" [selected] [ref=e90] [cursor=pointer]
          - tab "Settlements 40" [ref=e91] [cursor=pointer]
        - button "Characters & agents" [ref=e92] [cursor=pointer]: Characters 0
      - generic [ref=e93]:
        - text: Search your realm
        - searchbox "Search your realm" [ref=e94]
      - tabpanel "Armies 100" [ref=e95]:
        - generic [ref=e96]:
          - text: Force type
          - combobox "Force type" [ref=e97]:
            - option "All armies & fleets" [selected]
            - option "Land armies ashore"
            - option "Fleets"
            - option "Embarked armies"
        - generic [ref=e98]:
          - generic [ref=e99]:
            - generic [ref=e100]:
              - text: Registry order
              - combobox "Registry order" [ref=e101]:
                - option "Stable order" [selected]
                - option "Name A–Z"
            - generic [ref=e102]: 100 forces
          - region "Group army postings" [ref=e103]:
            - generic [ref=e104]:
              - button "Select matching armies" [ref=e105] [cursor=pointer]
              - button "Clear group selection" [disabled] [ref=e106]
            - status [ref=e107]: 0 armies selected
            - paragraph [ref=e108]: Check land armies ashore to give them a standing posting together. Select up to 128 at a time; page and search changes keep your selection.
            - status [ref=e110]: 100 orders accepted · 0 refused.
          - generic [ref=e111]:
            - generic [ref=e112]:
              - checkbox "Select Registry company 001 for group orders" [ref=e114]
              - button "Registry company 001 1 formation · 3 movement · 60 strength" [ref=e115] [cursor=pointer]:
                - generic [aria-hidden] [ref=e116]: △
                - generic [ref=e117]:
                  - strong [ref=e118]: Registry company 001
                  - generic [ref=e119]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e120]: ›
            - generic [ref=e121]:
              - checkbox "Select Registry company 002 for group orders" [ref=e123]
              - button "Registry company 002 1 formation · 3 movement · 60 strength" [ref=e124] [cursor=pointer]:
                - generic [aria-hidden] [ref=e125]: △
                - generic [ref=e126]:
                  - strong [ref=e127]: Registry company 002
                  - generic [ref=e128]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e129]: ›
            - generic [ref=e130]:
              - checkbox "Select Registry company 003 for group orders" [ref=e132]
              - button "Registry company 003 1 formation · 3 movement · 60 strength" [ref=e133] [cursor=pointer]:
                - generic [aria-hidden] [ref=e134]: △
                - generic [ref=e135]:
                  - strong [ref=e136]: Registry company 003
                  - generic [ref=e137]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e138]: ›
            - generic [ref=e139]:
              - checkbox "Select Registry company 004 for group orders" [ref=e141]
              - button "Registry company 004 1 formation · 3 movement · 60 strength" [ref=e142] [cursor=pointer]:
                - generic [aria-hidden] [ref=e143]: △
                - generic [ref=e144]:
                  - strong [ref=e145]: Registry company 004
                  - generic [ref=e146]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e147]: ›
            - generic [ref=e148]:
              - checkbox "Select Registry company 005 for group orders" [ref=e150]
              - button "Registry company 005 1 formation · 3 movement · 60 strength" [ref=e151] [cursor=pointer]:
                - generic [aria-hidden] [ref=e152]: △
                - generic [ref=e153]:
                  - strong [ref=e154]: Registry company 005
                  - generic [ref=e155]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e156]: ›
            - generic [ref=e157]:
              - checkbox "Select Registry company 006 for group orders" [ref=e159]
              - button "Registry company 006 1 formation · 3 movement · 60 strength" [ref=e160] [cursor=pointer]:
                - generic [aria-hidden] [ref=e161]: △
                - generic [ref=e162]:
                  - strong [ref=e163]: Registry company 006
                  - generic [ref=e164]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e165]: ›
            - generic [ref=e166]:
              - checkbox "Select Registry company 007 for group orders" [ref=e168]
              - button "Registry company 007 1 formation · 3 movement · 60 strength" [ref=e169] [cursor=pointer]:
                - generic [aria-hidden] [ref=e170]: △
                - generic [ref=e171]:
                  - strong [ref=e172]: Registry company 007
                  - generic [ref=e173]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e174]: ›
            - generic [ref=e175]:
              - checkbox "Select Registry company 008 for group orders" [ref=e177]
              - button "Registry company 008 1 formation · 3 movement · 60 strength" [ref=e178] [cursor=pointer]:
                - generic [aria-hidden] [ref=e179]: △
                - generic [ref=e180]:
                  - strong [ref=e181]: Registry company 008
                  - generic [ref=e182]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e183]: ›
            - generic [ref=e184]:
              - checkbox "Select Registry company 009 for group orders" [ref=e186]
              - button "Registry company 009 1 formation · 3 movement · 60 strength" [ref=e187] [cursor=pointer]:
                - generic [aria-hidden] [ref=e188]: △
                - generic [ref=e189]:
                  - strong [ref=e190]: Registry company 009
                  - generic [ref=e191]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e192]: ›
            - generic [ref=e193]:
              - checkbox "Select Registry company 010 for group orders" [ref=e195]
              - button "Registry company 010 1 formation · 3 movement · 60 strength" [ref=e196] [cursor=pointer]:
                - generic [aria-hidden] [ref=e197]: △
                - generic [ref=e198]:
                  - strong [ref=e199]: Registry company 010
                  - generic [ref=e200]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e201]: ›
            - generic [ref=e202]:
              - checkbox "Select Registry company 011 for group orders" [ref=e204]
              - button "Registry company 011 1 formation · 3 movement · 60 strength" [ref=e205] [cursor=pointer]:
                - generic [aria-hidden] [ref=e206]: △
                - generic [ref=e207]:
                  - strong [ref=e208]: Registry company 011
                  - generic [ref=e209]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e210]: ›
            - generic [ref=e211]:
              - checkbox "Select Registry company 012 for group orders" [ref=e213]
              - button "Registry company 012 1 formation · 3 movement · 60 strength" [ref=e214] [cursor=pointer]:
                - generic [aria-hidden] [ref=e215]: △
                - generic [ref=e216]:
                  - strong [ref=e217]: Registry company 012
                  - generic [ref=e218]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e219]: ›
            - generic [ref=e220]:
              - checkbox "Select Registry company 013 for group orders" [ref=e222]
              - button "Registry company 013 1 formation · 3 movement · 60 strength" [ref=e223] [cursor=pointer]:
                - generic [aria-hidden] [ref=e224]: △
                - generic [ref=e225]:
                  - strong [ref=e226]: Registry company 013
                  - generic [ref=e227]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e228]: ›
            - generic [ref=e229]:
              - checkbox "Select Registry company 014 for group orders" [ref=e231]
              - button "Registry company 014 1 formation · 3 movement · 60 strength" [ref=e232] [cursor=pointer]:
                - generic [aria-hidden] [ref=e233]: △
                - generic [ref=e234]:
                  - strong [ref=e235]: Registry company 014
                  - generic [ref=e236]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e237]: ›
            - generic [ref=e238]:
              - checkbox "Select Registry company 015 for group orders" [ref=e240]
              - button "Registry company 015 1 formation · 3 movement · 60 strength" [ref=e241] [cursor=pointer]:
                - generic [aria-hidden] [ref=e242]: △
                - generic [ref=e243]:
                  - strong [ref=e244]: Registry company 015
                  - generic [ref=e245]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e246]: ›
            - generic [ref=e247]:
              - checkbox "Select Registry company 016 for group orders" [ref=e249]
              - button "Registry company 016 1 formation · 3 movement · 60 strength" [ref=e250] [cursor=pointer]:
                - generic [aria-hidden] [ref=e251]: △
                - generic [ref=e252]:
                  - strong [ref=e253]: Registry company 016
                  - generic [ref=e254]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e255]: ›
            - generic [ref=e256]:
              - checkbox "Select Registry company 017 for group orders" [ref=e258]
              - button "Registry company 017 1 formation · 3 movement · 60 strength" [ref=e259] [cursor=pointer]:
                - generic [aria-hidden] [ref=e260]: △
                - generic [ref=e261]:
                  - strong [ref=e262]: Registry company 017
                  - generic [ref=e263]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e264]: ›
            - generic [ref=e265]:
              - checkbox "Select Registry company 018 for group orders" [ref=e267]
              - button "Registry company 018 1 formation · 3 movement · 60 strength" [ref=e268] [cursor=pointer]:
                - generic [aria-hidden] [ref=e269]: △
                - generic [ref=e270]:
                  - strong [ref=e271]: Registry company 018
                  - generic [ref=e272]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e273]: ›
            - generic [ref=e274]:
              - checkbox "Select Registry company 019 for group orders" [ref=e276]
              - button "Registry company 019 1 formation · 3 movement · 60 strength" [ref=e277] [cursor=pointer]:
                - generic [aria-hidden] [ref=e278]: △
                - generic [ref=e279]:
                  - strong [ref=e280]: Registry company 019
                  - generic [ref=e281]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e282]: ›
            - generic [ref=e283]:
              - checkbox "Select Registry company 020 for group orders" [ref=e285]
              - button "Registry company 020 1 formation · 3 movement · 60 strength" [ref=e286] [cursor=pointer]:
                - generic [aria-hidden] [ref=e287]: △
                - generic [ref=e288]:
                  - strong [ref=e289]: Registry company 020
                  - generic [ref=e290]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e291]: ›
            - generic [ref=e292]:
              - checkbox "Select Registry company 021 for group orders" [ref=e294]
              - button "Registry company 021 1 formation · 3 movement · 60 strength" [ref=e295] [cursor=pointer]:
                - generic [aria-hidden] [ref=e296]: △
                - generic [ref=e297]:
                  - strong [ref=e298]: Registry company 021
                  - generic [ref=e299]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e300]: ›
            - generic [ref=e301]:
              - checkbox "Select Registry company 022 for group orders" [ref=e303]
              - button "Registry company 022 1 formation · 3 movement · 60 strength" [ref=e304] [cursor=pointer]:
                - generic [aria-hidden] [ref=e305]: △
                - generic [ref=e306]:
                  - strong [ref=e307]: Registry company 022
                  - generic [ref=e308]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e309]: ›
            - generic [ref=e310]:
              - checkbox "Select Registry company 023 for group orders" [ref=e312]
              - button "Registry company 023 1 formation · 3 movement · 60 strength" [ref=e313] [cursor=pointer]:
                - generic [aria-hidden] [ref=e314]: △
                - generic [ref=e315]:
                  - strong [ref=e316]: Registry company 023
                  - generic [ref=e317]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e318]: ›
            - generic [ref=e319]:
              - checkbox "Select Registry company 024 for group orders" [ref=e321]
              - button "Registry company 024 1 formation · 3 movement · 60 strength" [ref=e322] [cursor=pointer]:
                - generic [aria-hidden] [ref=e323]: △
                - generic [ref=e324]:
                  - strong [ref=e325]: Registry company 024
                  - generic [ref=e326]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e327]: ›
            - generic [ref=e328]:
              - checkbox "Select Registry company 025 for group orders" [ref=e330]
              - button "Registry company 025 1 formation · 3 movement · 60 strength" [ref=e331] [cursor=pointer]:
                - generic [aria-hidden] [ref=e332]: △
                - generic [ref=e333]:
                  - strong [ref=e334]: Registry company 025
                  - generic [ref=e335]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e336]: ›
          - navigation "Registry pages" [ref=e337]:
            - button "Previous registry page" [disabled] [ref=e338]: ←
            - generic [ref=e339]: Page 1 of 4
            - button "Next registry page" [ref=e340] [cursor=pointer]: →
      - paragraph [ref=e341]: Choose an entry to locate it on the map. Use the bottom command tray for its orders.
  - contentinfo [ref=e342]:
    - generic [ref=e345]:
      - generic [ref=e346]: Selected army
      - strong [ref=e347]: Registry company 001
      - generic [ref=e348]: 1 / 12 formations · 60 strength · 3 movement
      - generic [ref=e349]:
        - button "Show selected orders" [ref=e350] [cursor=pointer]
        - button "Show on map" [ref=e351] [cursor=pointer]
    - region "Next-action navigation" [ref=e352]:
      - paragraph [ref=e353]: 0 needing orders · 40 idle settlements
      - generic [ref=e354]:
        - button "Previous army needing orders" [disabled] [ref=e355]: ‹
        - button "Next army needing orders" [disabled] [ref=e356]: Next army N
        - button "Previous idle settlement" [ref=e357] [cursor=pointer]: ‹
        - button "Next idle settlement" [ref=e358] [cursor=pointer]: Next town S
      - paragraph [ref=e359]: "Labor: 134 unassigned households · 40 settlements"
      - generic [ref=e360]:
        - button "Previous settlement with unassigned households" [ref=e361] [cursor=pointer]: ‹
        - button "Next settlement with unassigned households" [ref=e362] [cursor=pointer]: Review households
      - group [ref=e363]:
        - generic "What wants a decision 2 kinds" [ref=e364] [cursor=pointer]:
          - text: What wants a decision
          - generic [ref=e365]: 2 kinds
      - status
    - generic [ref=e366]:
      - generic [ref=e367]:
        - generic [ref=e368]: AGE OF FRACTURE
        - strong [ref=e369]: Turn 1
      - button "End turn" [ref=e370] [cursor=pointer]:
        - text: End turn
        - generic [ref=e371]: E
    - status [ref=e372]:
      - generic [aria-hidden] [ref=e373]: ◆
      - text: 100 postings accepted; 0 refused.
  - generic [ref=e374]:
    - button "Art Lab" [ref=e375] [cursor=pointer]
    - generic [ref=e376]: Development asset inspector
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | import { createGame, serializeGame } from '@theandril/sim';
  3  | import { exportSave } from '@theandril/persistence';
  4  | import { empireLandCampaign } from '../../packages/test-fixtures/src/empire-land-fixture';
  5  | import { closeManagement, openRegistry, openSelectedOrders, selectFromRegistry } from './ui-navigation';
  6  | 
  7  | test('a hundred armies receive one group posting, retain individual overrides and restore through a real save', async ({ page }, testInfo) => {
  8  |   const game = empireLandCampaign('legendary');
  9  |   const own = Object.values(game.armies).filter(army => army.factionId === game.turnOwnerId).sort((a, b) => a.id < b.id ? -1 : 1);
  10 |   own.forEach((army, index) => { army.name = `Registry company ${String(index + 1).padStart(3, '0')}`; });
  11 |   expect(own).toHaveLength(100);
  12 |   const errors: string[] = [];
  13 |   page.on('pageerror', error => errors.push(error.message));
  14 |   await page.goto('/');
  15 |   await page.locator('input[type=file]').setInputFiles({ name: 'group-postings.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(game))) });
  16 |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  17 |   const before = await page.evaluate(() => ({ hash: window.__THEANDRIL__!.getStateHash(), metrics: window.__THEANDRIL__!.getPerformanceCounters(), explored: window.__THEANDRIL__!.getSummary()!.exploredCells }));
  18 |   await openRegistry(page, 'armies');
  19 |   const registry = page.getByTestId('army-registry'), group = page.getByTestId('group-postings');
  20 |   await expect(registry.getByRole('button')).toHaveCount(25);
  21 |   await registry.getByRole('checkbox').first().focus(); await page.keyboard.press('Space');
  22 |   await page.getByRole('button', { name: 'Next registry page', exact: true }).click();
  23 |   await registry.getByRole('checkbox').first().check();
  24 |   const search = page.getByRole('searchbox', { name: 'Search your realm' });
  25 |   await search.fill('Registry company 100');
  26 |   await expect(group).toContainText('2 armies selected · 2 outside this filter');
  27 |   await group.getByRole('button', { name: 'Select matching armies', exact: true }).click();
  28 |   await expect(group).toContainText('3 armies selected · 2 outside this filter');
  29 |   await search.fill('');
  30 |   await group.getByRole('button', { name: 'Select matching armies', exact: true }).click();
  31 |   await expect(group).toContainText('100 armies selected');
  32 |   expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(before.hash);
  33 |   expect(await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().totalTransferBytes)).toBe(before.metrics.totalTransferBytes);
  34 |   await group.getByRole('button', { name: 'Post selected armies (100)', exact: true }).click();
  35 |   await expect(page.getByTestId('group-posting-results')).toContainText('100 orders accepted · 0 refused');
  36 |   await expect(group).toContainText('0 armies selected');
  37 |   const after = await page.evaluate(() => ({ view: window.__THEANDRIL__!.getSummary()!, hash: window.__THEANDRIL__!.getStateHash(), metrics: window.__THEANDRIL__!.getPerformanceCounters() }));
  38 |   expect(after.view.postings).toHaveLength(100);
  39 |   expect(after.view.postings.every(posting => posting.mode === 'hold' && posting.arrived)).toBe(true);
  40 |   expect(after.view.exploredCells).toBe(before.explored);
> 41 |   expect(after.metrics.cellTransferBytes).toBe(0);
     |                                           ^ Error: expect(received).toBe(expected) // Object.is equality
  42 |   expect(after.metrics.totalTransferBytes - before.metrics.totalTransferBytes).toBe(after.metrics.transferBytes);
  43 |   await testInfo.attach('group-transfer.json', { body: JSON.stringify({ authored: 'Legendary, 40 owned hearths, 100 owned armies, 4000 total armies', commandMs: after.metrics.commandMs, transferBytes: after.metrics.transferBytes, cellTransferBytes: after.metrics.cellTransferBytes, publishedStates: 1, beforeHash: before.hash, afterHash: after.hash }, null, 2), contentType: 'application/json' });
  44 |   await page.screenshot({ path: testInfo.outputPath('group-postings-desktop.png') });
  45 |   await closeManagement(page);
  46 |   await page.getByTestId('campaign-menu').locator(':scope > summary').click();
  47 |   await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  48 |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  49 |   await selectFromRegistry(page, 'armies', own[0]!.name);
  50 |   await openSelectedOrders(page);
  51 |   const posting = page.getByTestId('army-posting');
  52 |   await posting.locator(':scope > summary').click();
  53 |   await posting.getByLabel('On arrival').selectOption('join');
  54 |   await posting.getByRole('button', { name: 'Post army', exact: true }).click();
  55 |   await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.postings.filter(item => item.mode === 'join').length)).toBe(1);
  56 |   expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.postings.filter(item => item.mode === 'hold').length)).toBe(99);
  57 |   await page.setViewportSize({ width: 390, height: 844 });
  58 |   await openRegistry(page, 'armies');
  59 |   await search.fill('');
  60 |   await group.getByRole('button', { name: 'Select matching armies', exact: true }).click();
  61 |   await expect(group).toContainText('100 armies selected');
  62 |   await group.scrollIntoViewIfNeeded();
  63 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  64 |   await page.screenshot({ path: testInfo.outputPath('group-postings-narrow.png') });
  65 |   await group.getByRole('button', { name: 'Clear selected postings (100)', exact: true }).click();
  66 |   await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.postings.length)).toBe(0);
  67 |   await expect(page.getByTestId('group-posting-results')).toContainText('100 orders accepted · 0 refused');
  68 |   await closeManagement(page);
  69 |   await page.getByTestId('campaign-menu').locator(':scope > summary').click();
  70 |   await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  71 |   await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  72 |   expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(after.hash);
  73 |   await openRegistry(page, 'armies');
  74 |   await expect(group).toContainText('0 armies selected');
  75 |   expect(errors).toEqual([]);
  76 | });
  77 | 
  78 | test('historical rules refuse group postings with a reason and retain selection for review', async ({ page }) => {
  79 |   const game = createGame({ seed: 17, size: 'tiny', factionCount: 1, rulesVersion: 25 });
  80 |   await page.goto('/');
  81 |   await page.locator('input[type=file]').setInputFiles({ name: 'historical-group-postings.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(game))) });
  82 |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  83 |   const hash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  84 |   await openRegistry(page, 'armies');
  85 |   const group = page.getByTestId('group-postings');
  86 |   await group.getByRole('button', { name: 'Select matching armies', exact: true }).click();
  87 |   await group.getByRole('button', { name: /^Post selected armies/ }).click();
  88 |   await expect(page.getByTestId('group-posting-results')).toContainText('0 orders accepted');
  89 |   await expect(page.getByTestId('group-posting-results')).toContainText('Refused armies remain selected for review');
  90 |   await expect(group.getByRole('button', { name: /^Post selected armies/ })).toBeEnabled();
  91 |   expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);
  92 | });
  93 | 
```