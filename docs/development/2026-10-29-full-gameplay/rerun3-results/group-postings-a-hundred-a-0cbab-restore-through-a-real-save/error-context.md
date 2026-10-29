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
  - waiting for getByRole('button', { name: 'Save campaign', exact: true })

```

# Page snapshot

```yaml
- generic [ref=f1e3]:
  - button "Import save file"
  - generic [ref=f1e4]:
    - banner [ref=f1e5]:
      - generic [ref=f1e11]:
        - generic [ref=f1e12]: The age of fracture
        - heading "Theandril" [level=1] [ref=f1e13]
    - group [ref=f1e14]:
      - generic "Campaign & settings" [active] [ref=f1e15] [cursor=pointer]
      - generic [ref=f1e16]:
        - link "Developer updates (opens in a new tab)" [ref=f1e17] [cursor=pointer]:
          - /url: /updates/
          - text: Developer updates
          - generic [aria-hidden] [ref=f1e18]: ↗
        - generic [ref=f1e19]:
          - checkbox "Map click menus" [checked] [ref=f1e20]
          - text: Map click menus
        - paragraph [ref=f1e21]: Click an army, town, or tile for local actions. Turn this off to use full orders from the command tray; Open map actions remains available.
        - generic [ref=f1e22]:
          - text: Text scale
          - combobox "Text scale" [ref=f1e23]:
            - option "100%" [selected]
            - option "115%"
            - option "130%"
        - generic [ref=f1e24]:
          - text: End turn shortcut
          - textbox "End turn shortcut" [ref=f1e25]: e
        - generic [ref=f1e26]:
          - text: Next army shortcut
          - textbox "Next army shortcut" [ref=f1e27]: "n"
        - generic [ref=f1e28]:
          - text: Next settlement shortcut
          - textbox "Next settlement shortcut" [ref=f1e29]: s
  - main [ref=f1e30]:
    - generic [ref=f1e31]:
      - generic [ref=f1e32]: Keep the hearth. Keep the oath.
      - heading "From the ashes, a new dominion." [level=2] [ref=f1e33]: From the ashes,a new dominion.
      - paragraph [ref=f1e34]: "The old roads end in wilderness. Lead your chosen people beyond their last milestones: chart the forests, raise a settlement, and give your people a future."
      - paragraph [ref=f1e36]: Found a hearth. Work its land.Send wayfinders into the unknown.
      - paragraph [ref=f1e37]:
        - link "Developer updates (opens in a new tab)" [ref=f1e38] [cursor=pointer]:
          - /url: /updates/
          - text: Developer updates
          - generic [aria-hidden] [ref=f1e39]: ↗
    - generic [ref=f1e40]:
      - generic [ref=f1e41]: A chronicle begins
      - heading "Establish your campaign" [level=2] [ref=f1e42]
      - generic [ref=f1e45]:
        - heading "Ashen Compact" [level=3] [ref=f1e46]
        - paragraph [ref=f1e47]: Your chosen player seat
      - generic [ref=f1e48]:
        - region "Player culture" [ref=f1e49]:
          - generic [ref=f1e50]:
            - text: Player faction
            - combobox "Player faction" [ref=f1e51]:
              - option "Ashen Compact" [selected]
              - option "Reedbound Council"
              - option "Cinder March"
              - option "Glass Tide"
              - option "Iron Covenant"
              - option "Sepulchral Synod"
              - option "Mire Courts"
              - option "Saltwind Remnant"
              - option "Wardhall Remnant"
              - option "Rimehorn Clans"
              - option "Sable Steppe"
              - option "Morrow Spore"
              - option "Cistern Assembly"
              - option "Unsealed Companies"
              - option "Lantern Hospices"
              - option "Cairnwing Concord"
              - option "Red Sluice Directorate"
              - option "Velvet Meridian"
              - option "Brine Choir"
              - option "Emberwake Convocation"
              - option "Underhush Exchange"
              - option "Vesper Court"
              - option "Manytrack Moot"
              - option "Margin Observance"
          - paragraph [ref=f1e52]: Keep the hearth. Keep the oath.
          - generic [ref=f1e53]:
            - paragraph [ref=f1e54]: Public hearth councils rebuild reliable workshops while frontier households contest their share of the common grain.
            - paragraph [ref=f1e55]:
              - strong [ref=f1e56]: Worked-land strengths & drawbacks
            - list "Biome affinities" [ref=f1e57]:
              - listitem [ref=f1e58]:
                - strong [ref=f1e59]: Temperate grassland
                - text: ": +1 food per worked tile"
              - listitem [ref=f1e60]:
                - strong [ref=f1e61]: Temperate forest
                - text: ": +1 industry per worked tile"
              - listitem [ref=f1e62]:
                - strong [ref=f1e63]: Tundra
                - text: ": −1 food per worked tile"
              - listitem [ref=f1e64]:
                - strong [ref=f1e65]: Desert
                - text: ": −1 food per worked tile"
            - paragraph [ref=f1e66]: Unlisted biomes are neutral. These contributions modify worked tiles, not movement or combat.
            - paragraph [ref=f1e67]: "Cultivation traditions: Temperate grassland, Temperate forest. Cultivation is paid work, not free conversion."
            - group [ref=f1e68]:
              - generic "Recruitment tendencies" [ref=f1e69] [cursor=pointer]
        - generic [ref=f1e70]:
          - text: World seed
          - textbox "World seed" [ref=f1e71]:
            - /placeholder: Random for each new campaign
        - paragraph [ref=f1e72]: Leave blank for a fresh random world. Enter a seed to revisit a world; its seed is shown above the map.
        - generic [ref=f1e73]:
          - text: World size
          - combobox "World size" [ref=f1e74]:
            - option "Tiny · 1,536 hexes · 4 realms"
            - option "Small · 19,360 hexes · 8 realms"
            - option "Standard · 31,360 hexes · 12 realms" [selected]
            - option "Large · 51,840 hexes · 16 realms"
            - option "Huge · 77,440 hexes · 20 realms"
        - generic [ref=f1e75]:
          - text: Faction count
          - spinbutton "Faction count" [ref=f1e76]: "12"
        - generic [ref=f1e77]:
          - text: City-states
          - spinbutton "City-states" [ref=f1e78]: "8"
        - paragraph [ref=f1e79]: "Independent single-city powers that settle the land between realms and can be conquered like any neighbour. Recommended here: 8. They borrow a culture's art under their own banner colour."
        - paragraph [ref=f1e80]: "Recommended for this size: 12 realms. Changing world size resets this recommendation; you can override it. 24 introductory faction templates are authored. Additional seats are generated variants, not additional authored nations. Extreme crowding is not balanced."
        - generic [ref=f1e81]:
          - text: Map type
          - combobox "Map type" [ref=f1e82]:
            - option "Continents" [selected]
            - option "Pangaea"
            - option "Fractal"
            - option "Islands"
            - option "Archipelago"
            - option "Earth-like"
            - option "Inland Sea"
        - paragraph [ref=f1e83]: Two or three large continents separated by open ocean, with offshore islands.
        - generic [ref=f1e84]:
          - text: Campaign pace
          - combobox "Campaign pace" [ref=f1e85]:
            - option "Short · test/skirmish"
            - option "Standard · about 200 turns" [selected]
            - option "Long · about 300 turns"
            - option "Epic · about 350–400 turns"
        - paragraph [ref=f1e86]: A full campaign aiming for about two hundred turns, with a twenty-turn window to oppose public projects. Actual length depends on play. Pace changes economic costs and the public response window, not AI strength. Campaign length varies with play.
        - generic [ref=f1e87]:
          - text: Campaign mode
          - combobox "Campaign mode" [ref=f1e88]:
            - option "Lead a realm" [selected]
            - option "AI watch"
        - paragraph [ref=f1e89]: The same seed, size, map type and faction count create the same world within a generator version. Larger maps need more realms to create nearby rivals; terrain can still separate them.
        - button "Begin campaign" [ref=f1e90] [cursor=pointer]:
          - text: Begin campaign
          - generic [aria-hidden] [ref=f1e91]: →
      - generic [ref=f1e92]:
        - button "Load campaign" [ref=f1e93] [cursor=pointer]
        - button "Restore autosave" [ref=f1e94] [cursor=pointer]
        - button "Import campaign" [ref=f1e95] [cursor=pointer]
    - region [ref=f1e96]:
      - heading "Introductory cultures" [level=3] [ref=f1e97]
      - paragraph [ref=f1e98]: Public culture reference, not a player-seat selector. Generated realms reuse these traditions; their locations and forces must still be discovered.
      - generic [ref=f1e99]:
        - article [ref=f1e100]:
          - img "Ashen Compact crest · approved faction artwork" [ref=f1e101]
          - generic [ref=f1e102]:
            - heading "Ashen Compact" [level=4] [ref=f1e103]
            - paragraph [ref=f1e104]: Keep the hearth. Keep the oath.
        - article [ref=f1e105]:
          - img "Reedbound Council crest · approved faction artwork" [ref=f1e106]
          - generic [ref=f1e107]:
            - heading "Reedbound Council" [level=4] [ref=f1e108]
            - paragraph [ref=f1e109]: No river belongs to one shore.
        - article [ref=f1e110]:
          - img "Cinder March crest · approved faction artwork" [ref=f1e111]
          - generic [ref=f1e112]:
            - heading "Cinder March" [level=4] [ref=f1e113]
            - paragraph [ref=f1e114]: We hold what the fire spared.
        - article [ref=f1e115]:
          - img "Glass Tide crest · approved faction artwork" [ref=f1e116]
          - generic [ref=f1e117]:
            - heading "Glass Tide" [level=4] [ref=f1e118]
            - paragraph [ref=f1e119]: Every horizon is a promise.
        - article [ref=f1e120]:
          - img "Iron Covenant crest · approved faction artwork" [ref=f1e121]
          - generic [ref=f1e122]:
            - heading "Iron Covenant" [level=4] [ref=f1e123]
            - paragraph [ref=f1e124]: The hold endures. The valley is owed.
        - article [ref=f1e125]:
          - img "Sepulchral Synod crest · approved faction artwork" [ref=f1e126]
          - generic [ref=f1e127]:
            - heading "Sepulchral Synod" [level=4] [ref=f1e128]
            - paragraph [ref=f1e129]: No measure ends at the grave.
        - article [ref=f1e130]:
          - img "Mire Courts crest · approved faction artwork" [ref=f1e131]
          - generic [ref=f1e132]:
            - heading "Mire Courts" [level=4] [ref=f1e133]
            - paragraph [ref=f1e134]: The season returns. The court remembers.
        - article [ref=f1e135]:
          - img "Saltwind Remnant crest · approved faction artwork" [ref=f1e136]
          - generic [ref=f1e137]:
            - heading "Saltwind Remnant" [level=4] [ref=f1e138]
            - paragraph [ref=f1e139]: A keel is pledged only once.
        - article [ref=f1e140]:
          - img "Wardhall Remnant crest · approved faction artwork" [ref=f1e141]
          - generic [ref=f1e142]:
            - heading "Wardhall Remnant" [level=4] [ref=f1e143]
            - paragraph [ref=f1e144]: Let the work stand witness.
        - article [ref=f1e145]:
          - img "Rimehorn Clans crest · approved faction artwork" [ref=f1e146]
          - generic [ref=f1e147]:
            - heading "Rimehorn Clans" [level=4] [ref=f1e148]
            - paragraph [ref=f1e149]: Share the shelter. Answer the horn.
        - article [ref=f1e150]:
          - img "Sable Steppe crest · approved faction artwork" [ref=f1e151]
          - generic [ref=f1e152]:
            - heading "Sable Steppe" [level=4] [ref=f1e153]
            - paragraph [ref=f1e154]: The road moves with the camp.
        - article [ref=f1e155]:
          - img "Morrow Spore crest · approved faction artwork" [ref=f1e156]
          - generic [ref=f1e157]:
            - heading "Morrow Spore" [level=4] [ref=f1e158]
            - paragraph [ref=f1e159]: What falls shall feed what follows.
        - article [ref=f1e160]:
          - img "Cistern Assembly crest · approved faction artwork" [ref=f1e161]
          - generic [ref=f1e162]:
            - heading "Cistern Assembly" [level=4] [ref=f1e163]
            - paragraph [ref=f1e164]: Read the measure. Share the draw.
        - article [ref=f1e165]:
          - img "Unsealed Companies crest · approved faction artwork" [ref=f1e166]
          - generic [ref=f1e167]:
            - heading "Unsealed Companies" [level=4] [ref=f1e168]
            - paragraph [ref=f1e169]: The living make their own terms.
        - article [ref=f1e170]:
          - img "Lantern Hospices crest · approved faction artwork" [ref=f1e171]
          - generic [ref=f1e172]:
            - heading "Lantern Hospices" [level=4] [ref=f1e173]
            - paragraph [ref=f1e174]: Keep a place beside the lamp.
        - article [ref=f1e175]:
          - img "Cairnwing Concord crest · approved faction artwork" [ref=f1e176]
          - generic [ref=f1e177]:
            - heading "Cairnwing Concord" [level=4] [ref=f1e178]
            - paragraph [ref=f1e179]: No ledge stands without the lift.
        - article [ref=f1e180]:
          - img "Red Sluice Directorate crest · approved faction artwork" [ref=f1e181]
          - generic [ref=f1e182]:
            - heading "Red Sluice Directorate" [level=4] [ref=f1e183]
            - paragraph [ref=f1e184]: Count the harvest. Answer the banks.
        - article [ref=f1e185]:
          - img "Velvet Meridian crest · approved faction artwork" [ref=f1e186]
          - generic [ref=f1e187]:
            - heading "Velvet Meridian" [level=4] [ref=f1e188]
            - paragraph [ref=f1e189]: A measure is not the final word.
        - article [ref=f1e190]:
          - img "Brine Choir crest · approved faction artwork" [ref=f1e191]
          - generic [ref=f1e192]:
            - heading "Brine Choir" [level=4] [ref=f1e193]
            - paragraph [ref=f1e194]: Let every shore be heard.
        - article [ref=f1e195]:
          - img "Emberwake Convocation crest · approved faction artwork" [ref=f1e196]
          - generic [ref=f1e197]:
            - heading "Emberwake Convocation" [level=4] [ref=f1e198]
            - paragraph [ref=f1e199]: Keep the seed. Account for the fire.
        - article [ref=f1e200]:
          - img "Underhush Exchange crest · approved faction artwork" [ref=f1e201]
          - generic [ref=f1e202]:
            - heading "Underhush Exchange" [level=4] [ref=f1e203]
            - paragraph [ref=f1e204]: Leave room for those who dwell.
        - article [ref=f1e205]:
          - img "Vesper Court crest · approved faction artwork" [ref=f1e206]
          - generic [ref=f1e207]:
            - heading "Vesper Court" [level=4] [ref=f1e208]
            - paragraph [ref=f1e209]: Hospitality must have an ending.
        - article [ref=f1e210]:
          - img "Manytrack Moot crest · approved faction artwork" [ref=f1e211]
          - generic [ref=f1e212]:
            - heading "Manytrack Moot" [level=4] [ref=f1e213]
            - paragraph [ref=f1e214]: Unlike tracks may share a road.
        - article [ref=f1e215]:
          - img "Margin Observance crest · approved faction artwork" [ref=f1e216]
          - generic [ref=f1e217]:
            - heading "Margin Observance" [level=4] [ref=f1e218]
            - paragraph [ref=f1e219]: Keep the gap beside the record.
  - contentinfo [ref=f1e220]:
    - status [ref=f1e221]:
      - generic [aria-hidden] [ref=f1e222]: ◆
      - text: A world of broken oaths awaits a new beginning.
  - generic [ref=f1e223]:
    - button "Art Lab" [ref=f1e224] [cursor=pointer]
    - generic [ref=f1e225]: Development asset inspector
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
> 48  |   await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
      |                                                                          ^ Error: locator.click: Test timeout of 45000ms exceeded.
  49  |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  50  |   await selectFromRegistry(page, 'armies', own[0]!.name);
  51  |   await openSelectedOrders(page);
  52  |   const posting = page.getByTestId('army-posting');
  53  |   await posting.locator(':scope > summary').click();
  54  |   await posting.getByLabel('On arrival').selectOption('join');
  55  |   await posting.getByRole('button', { name: 'Update posting', exact: true }).click();
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