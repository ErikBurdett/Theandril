# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: hermes-ui-slices.spec.ts >> R23 repeated public loads and cross-size imports retain one responsive map control and canvas
- Location: tests/gameplay/hermes-ui-slices.spec.ts:22:1

# Error details

```
Test timeout of 90000ms exceeded.
```

```
Error: page.waitForEvent: Test timeout of 90000ms exceeded.
=========================== logs ===========================
waiting for event "download"
============================================================
```

# Page snapshot

```yaml
- generic [ref=f14e3]:
  - button "Import save file"
  - generic [ref=f14e4]:
    - banner [ref=f14e5]:
      - generic [ref=f14e11]:
        - generic [ref=f14e12]: The age of fracture
        - heading "Theandril" [level=1] [ref=f14e13]
    - group [ref=f14e14]:
      - generic "Campaign & settings" [ref=f14e15] [cursor=pointer]
  - main [ref=f14e16]:
    - generic [ref=f14e17]:
      - generic [ref=f14e18]: Keep the hearth. Keep the oath.
      - heading "From the ashes, a new dominion." [level=2] [ref=f14e19]: From the ashes,a new dominion.
      - paragraph [ref=f14e20]: "The old roads end in wilderness. Lead your chosen people beyond their last milestones: chart the forests, raise a settlement, and give your people a future."
      - paragraph [ref=f14e22]: Found a hearth. Work its land.Send wayfinders into the unknown.
    - generic [ref=f14e23]:
      - generic [ref=f14e24]: A chronicle begins
      - heading "Establish your campaign" [level=2] [ref=f14e25]
      - generic [ref=f14e28]:
        - heading "Ashen Compact" [level=3] [ref=f14e29]
        - paragraph [ref=f14e30]: Your chosen player seat
      - generic [ref=f14e31]:
        - region "Player culture" [ref=f14e32]:
          - generic [ref=f14e33]:
            - text: Player faction
            - combobox "Player faction" [ref=f14e34]:
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
          - paragraph [ref=f14e35]: Keep the hearth. Keep the oath.
          - generic [ref=f14e36]:
            - paragraph [ref=f14e37]: Public hearth councils rebuild reliable workshops while frontier households contest their share of the common grain.
            - paragraph [ref=f14e38]:
              - strong [ref=f14e39]: Worked-land strengths & drawbacks
            - list "Biome affinities" [ref=f14e40]:
              - listitem [ref=f14e41]:
                - strong [ref=f14e42]: Temperate grassland
                - text: ": +1 food per worked tile"
              - listitem [ref=f14e43]:
                - strong [ref=f14e44]: Temperate forest
                - text: ": +1 industry per worked tile"
              - listitem [ref=f14e45]:
                - strong [ref=f14e46]: Tundra
                - text: ": −1 food per worked tile"
              - listitem [ref=f14e47]:
                - strong [ref=f14e48]: Desert
                - text: ": −1 food per worked tile"
            - paragraph [ref=f14e49]: Unlisted biomes are neutral. These contributions modify worked tiles, not movement or combat.
            - paragraph [ref=f14e50]: "Cultivation traditions: Temperate grassland, Temperate forest. Cultivation is paid work, not free conversion."
            - group [ref=f14e51]:
              - generic "Recruitment tendencies" [ref=f14e52] [cursor=pointer]
        - generic [ref=f14e53]:
          - text: World seed
          - textbox "World seed" [ref=f14e54]:
            - /placeholder: Random for each new campaign
        - paragraph [ref=f14e55]: Leave blank for a fresh random world. Enter a seed to revisit a world; its seed is shown above the map.
        - generic [ref=f14e56]:
          - text: World size
          - combobox "World size" [ref=f14e57]:
            - option "Tiny · 1,536 hexes · quick campaign"
            - option "Small · 40,960 hexes" [selected]
            - option "Standard · 98,304 hexes"
            - option "Huge · 196,608 hexes"
            - option "Legendary · 307,200 hexes"
        - generic [ref=f14e58]:
          - text: Faction count
          - spinbutton "Faction count" [ref=f14e59]: "12"
        - generic [ref=f14e60]:
          - text: World layout
          - combobox "World layout" [ref=f14e61]:
            - option "Continents · broad landmasses" [selected]
            - option "Islands · separated shores"
            - option "Archipelago · scattered islands"
        - paragraph [ref=f14e62]: "Recommended for this size: 12 realms. Changing world size resets this recommendation; you can override it. 24 introductory faction templates are authored. Additional seats are generated variants, not additional authored nations. Extreme crowding is not balanced."
        - generic [ref=f14e63]:
          - text: Campaign pace
          - combobox "Campaign pace" [ref=f14e64]:
            - option "Short · test/skirmish"
            - option "Standard · hundreds of turns" [selected]
            - option "Long · extended campaign"
            - option "Epic · longest campaign"
        - paragraph [ref=f14e65]: A full campaign aiming for hundreds of turns, with greater late economic investment and time to oppose public projects. Actual length depends on play. Pace changes economic costs and the public response window, not AI strength. Campaign length varies with play.
        - generic [ref=f14e66]:
          - text: Campaign mode
          - combobox "Campaign mode" [ref=f14e67]:
            - option "Lead a realm" [selected]
            - option "AI watch"
        - paragraph [ref=f14e68]: The same seed, size, layout and faction count create the same world within a generator version. Giant maps need enough realms to create nearby rivals; terrain can still separate them.
        - button "Begin campaign" [ref=f14e69] [cursor=pointer]:
          - text: Begin campaign
          - generic [aria-hidden] [ref=f14e70]: →
      - generic [ref=f14e71]:
        - button "Load campaign" [ref=f14e72] [cursor=pointer]
        - button "Restore autosave" [ref=f14e73] [cursor=pointer]
        - button "Import campaign" [ref=f14e74] [cursor=pointer]
    - region [ref=f14e75]:
      - heading "Introductory cultures" [level=3] [ref=f14e76]
      - paragraph [ref=f14e77]: Public culture reference, not a player-seat selector. Generated realms reuse these traditions; their locations and forces must still be discovered.
      - generic [ref=f14e78]:
        - article [ref=f14e79]:
          - img "Ashen Compact crest · approved faction artwork" [ref=f14e80]
          - generic [ref=f14e81]:
            - heading "Ashen Compact" [level=4] [ref=f14e82]
            - paragraph [ref=f14e83]: Keep the hearth. Keep the oath.
        - article [ref=f14e84]:
          - img "Reedbound Council crest · approved faction artwork" [ref=f14e85]
          - generic [ref=f14e86]:
            - heading "Reedbound Council" [level=4] [ref=f14e87]
            - paragraph [ref=f14e88]: No river belongs to one shore.
        - article [ref=f14e89]:
          - img "Cinder March crest · approved faction artwork" [ref=f14e90]
          - generic [ref=f14e91]:
            - heading "Cinder March" [level=4] [ref=f14e92]
            - paragraph [ref=f14e93]: We hold what the fire spared.
        - article [ref=f14e94]:
          - img "Glass Tide crest · approved faction artwork" [ref=f14e95]
          - generic [ref=f14e96]:
            - heading "Glass Tide" [level=4] [ref=f14e97]
            - paragraph [ref=f14e98]: Every horizon is a promise.
        - article [ref=f14e99]:
          - img "Iron Covenant crest · approved faction artwork" [ref=f14e100]
          - generic [ref=f14e101]:
            - heading "Iron Covenant" [level=4] [ref=f14e102]
            - paragraph [ref=f14e103]: The hold endures. The valley is owed.
        - article [ref=f14e104]:
          - img "Sepulchral Synod crest · approved faction artwork" [ref=f14e105]
          - generic [ref=f14e106]:
            - heading "Sepulchral Synod" [level=4] [ref=f14e107]
            - paragraph [ref=f14e108]: No measure ends at the grave.
        - article [ref=f14e109]:
          - img "Mire Courts crest · approved faction artwork" [ref=f14e110]
          - generic [ref=f14e111]:
            - heading "Mire Courts" [level=4] [ref=f14e112]
            - paragraph [ref=f14e113]: The season returns. The court remembers.
        - article [ref=f14e114]:
          - img "Saltwind Remnant crest · approved faction artwork" [ref=f14e115]
          - generic [ref=f14e116]:
            - heading "Saltwind Remnant" [level=4] [ref=f14e117]
            - paragraph [ref=f14e118]: A keel is pledged only once.
        - article [ref=f14e119]:
          - img "Wardhall Remnant crest · approved faction artwork" [ref=f14e120]
          - generic [ref=f14e121]:
            - heading "Wardhall Remnant" [level=4] [ref=f14e122]
            - paragraph [ref=f14e123]: Let the work stand witness.
        - article [ref=f14e124]:
          - img "Rimehorn Clans crest · approved faction artwork" [ref=f14e125]
          - generic [ref=f14e126]:
            - heading "Rimehorn Clans" [level=4] [ref=f14e127]
            - paragraph [ref=f14e128]: Share the shelter. Answer the horn.
        - article [ref=f14e129]:
          - img "Sable Steppe crest · approved faction artwork" [ref=f14e130]
          - generic [ref=f14e131]:
            - heading "Sable Steppe" [level=4] [ref=f14e132]
            - paragraph [ref=f14e133]: The road moves with the camp.
        - article [ref=f14e134]:
          - img "Morrow Spore crest · approved faction artwork" [ref=f14e135]
          - generic [ref=f14e136]:
            - heading "Morrow Spore" [level=4] [ref=f14e137]
            - paragraph [ref=f14e138]: What falls shall feed what follows.
        - article [ref=f14e139]:
          - img "Cistern Assembly crest · approved faction artwork" [ref=f14e140]
          - generic [ref=f14e141]:
            - heading "Cistern Assembly" [level=4] [ref=f14e142]
            - paragraph [ref=f14e143]: Read the measure. Share the draw.
        - article [ref=f14e144]:
          - img "Unsealed Companies crest · approved faction artwork" [ref=f14e145]
          - generic [ref=f14e146]:
            - heading "Unsealed Companies" [level=4] [ref=f14e147]
            - paragraph [ref=f14e148]: The living make their own terms.
        - article [ref=f14e149]:
          - img "Lantern Hospices crest · approved faction artwork" [ref=f14e150]
          - generic [ref=f14e151]:
            - heading "Lantern Hospices" [level=4] [ref=f14e152]
            - paragraph [ref=f14e153]: Keep a place beside the lamp.
        - article [ref=f14e154]:
          - img "Cairnwing Concord crest · approved faction artwork" [ref=f14e155]
          - generic [ref=f14e156]:
            - heading "Cairnwing Concord" [level=4] [ref=f14e157]
            - paragraph [ref=f14e158]: No ledge stands without the lift.
        - article [ref=f14e159]:
          - img "Red Sluice Directorate crest · approved faction artwork" [ref=f14e160]
          - generic [ref=f14e161]:
            - heading "Red Sluice Directorate" [level=4] [ref=f14e162]
            - paragraph [ref=f14e163]: Count the harvest. Answer the banks.
        - article [ref=f14e164]:
          - img "Velvet Meridian crest · approved faction artwork" [ref=f14e165]
          - generic [ref=f14e166]:
            - heading "Velvet Meridian" [level=4] [ref=f14e167]
            - paragraph [ref=f14e168]: A measure is not the final word.
        - article [ref=f14e169]:
          - img "Brine Choir crest · approved faction artwork" [ref=f14e170]
          - generic [ref=f14e171]:
            - heading "Brine Choir" [level=4] [ref=f14e172]
            - paragraph [ref=f14e173]: Let every shore be heard.
        - article [ref=f14e174]:
          - img "Emberwake Convocation crest · approved faction artwork" [ref=f14e175]
          - generic [ref=f14e176]:
            - heading "Emberwake Convocation" [level=4] [ref=f14e177]
            - paragraph [ref=f14e178]: Keep the seed. Account for the fire.
        - article [ref=f14e179]:
          - img "Underhush Exchange crest · approved faction artwork" [ref=f14e180]
          - generic [ref=f14e181]:
            - heading "Underhush Exchange" [level=4] [ref=f14e182]
            - paragraph [ref=f14e183]: Leave room for those who dwell.
        - article [ref=f14e184]:
          - img "Vesper Court crest · approved faction artwork" [ref=f14e185]
          - generic [ref=f14e186]:
            - heading "Vesper Court" [level=4] [ref=f14e187]
            - paragraph [ref=f14e188]: Hospitality must have an ending.
        - article [ref=f14e189]:
          - img "Manytrack Moot crest · approved faction artwork" [ref=f14e190]
          - generic [ref=f14e191]:
            - heading "Manytrack Moot" [level=4] [ref=f14e192]
            - paragraph [ref=f14e193]: Unlike tracks may share a road.
        - article [ref=f14e194]:
          - img "Margin Observance crest · approved faction artwork" [ref=f14e195]
          - generic [ref=f14e196]:
            - heading "Margin Observance" [level=4] [ref=f14e197]
            - paragraph [ref=f14e198]: Keep the gap beside the record.
  - contentinfo [ref=f14e199]:
    - status [ref=f14e200]:
      - generic [aria-hidden] [ref=f14e201]: ◆
      - text: A world of broken oaths awaits a new beginning.
  - generic [ref=f14e202]:
    - button "Art Lab" [ref=f14e203] [cursor=pointer]
    - generic [ref=f14e204]: Development asset inspector
```

# Test source

```ts
  1   | import { expect, test, type Page, type TestInfo } from '@playwright/test';
  2   | import { readFile, writeFile } from 'node:fs/promises';
  3   | import { deserializeGame, serializeGame, type GameState } from '@theandril/sim';
  4   | import { exportSave } from '@theandril/persistence';
  5   | import { FACTIONS } from '@theandril/content';
  6   | import { characterCampaign, CHARACTER_FIXTURE as C } from '../../packages/test-fixtures/src/character-fixture';
  7   | import { borderBattleCampaign } from '../../packages/test-fixtures/src/combat-fixture';
  8   | import { closeCampaignOptions, closeManagement, openRealmAffairs, openSelectedOrders, selectFromRegistry } from './ui-navigation';
  9   | 
  10  | async function importCampaign(page: Page, state: GameState) {
  11  |   await page.locator('input[type=file]').setInputFiles({ name: 'hermes-ui-slice.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  12  |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  13  | }
  14  | async function evidence(info: TestInfo, name: string, value: unknown) {
  15  |   await info.attach(name, { body: JSON.stringify(value, null, 2), contentType: 'application/json' });
  16  | }
  17  | async function settings(page: Page) {
  18  |   const menu = page.getByTestId('campaign-menu');
  19  |   if (await menu.getAttribute('open') === null) await menu.locator(':scope > summary').click();
  20  | }
  21  | 
  22  | test('R23 repeated public loads and cross-size imports retain one responsive map control and canvas', async ({ page, browser }, info) => {
  23  |   const consoleMessages: string[] = [], errors: string[] = [], records: unknown[] = [];
  24  |   page.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') consoleMessages.push(message.text()); });
  25  |   page.on('pageerror', error => errors.push(error.message));
  26  |   const cdp = await page.context().newCDPSession(page);
  27  |   const saveEvidence = () => writeFile(info.outputPath('lifecycle.json'), JSON.stringify({ browser: browser.version(), consoleMessages, errors, records }, null, 2));
  28  |   let initialListeners: Record<string, number> | undefined;
  29  |   const capture = async (stage: string) => {
  30  |     await expect(page.getByRole('button', { name: 'Save campaign', exact: true, includeHidden: true })).toBeEnabled();
  31  |     const dom = await page.evaluate(() => ({ controls: document.querySelectorAll('[data-testid=faction-overview-control]').length, canvases: document.querySelectorAll('canvas').length, mapNodes: document.querySelector('[data-testid=map-container]')!.querySelectorAll('*').length, debugHookPresent: Boolean(window.__THEANDRIL__) }));
  32  |     const listeners: Record<string, number> = {};
  33  |     for (const expression of ['window', 'document', 'document.querySelector("canvas")']) {
  34  |       const { result } = await cdp.send('Runtime.evaluate', { expression });
  35  |       if (result.objectId) {
  36  |         listeners[expression] = (await cdp.send('DOMDebugger.getEventListeners', { objectId: result.objectId })).listeners.length;
  37  |         await cdp.send('Runtime.releaseObject', { objectId: result.objectId });
  38  |       }
  39  |     }
  40  |     records.push({ stage, ...dom, listeners }); await saveEvidence();
  41  |     console.log(JSON.stringify({ stage, ...dom, listeners }));
  42  |     expect.soft(dom.controls, stage).toBe(1); expect.soft(dom.canvases, stage).toBe(1);
  43  |     initialListeners ??= listeners;
  44  |     expect.soft(listeners, `${stage} attached listener counts`).toEqual(initialListeners);
  45  |   };
  46  |   try {
  47  |     await page.goto('/');
  48  |     await page.getByRole('textbox', { name: 'World seed', exact: true }).fill('20260909');
  49  |     await page.getByRole('combobox', { name: 'World size', exact: true }).selectOption('small');
  50  |     await page.getByRole('spinbutton', { name: 'Faction count', exact: true }).fill('12');
  51  |     await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
  52  |     await expect(page.getByTestId('turn-counter')).toHaveText('Turn 1');
  53  |     const canvas = await page.locator('canvas').elementHandle();
  54  |     await capture('generated-small12'); await settings(page);
  55  |     await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  56  |     await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
> 57  |     const downloading = page.waitForEvent('download');
      |                              ^ Error: page.waitForEvent: Test timeout of 90000ms exceeded.
  58  |     await page.getByRole('button', { name: 'Export save file', exact: true }).click();
  59  |     const download = await downloading, downloadedPath = await download.path();
  60  |     if (!downloadedPath) throw new Error('Missing exported Small campaign');
  61  |     const small = await readFile(downloadedPath);
  62  |     for (let index = 1; index <= 4; index++) {
  63  |       await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  64  |       await expect(page.getByTestId('feedback')).toContainText('Campaign restored');
  65  |       await capture(`load-${index}`);
  66  |     }
  67  |     const tiny = Buffer.from(await exportSave(serializeGame(borderBattleCampaign())));
  68  |     for (let index = 1; index <= 4; index++) {
  69  |       await page.locator('input[type=file]').setInputFiles({ name: `replacement-${index}.theandril`, mimeType: 'application/gzip', buffer: index % 2 ? small : tiny });
  70  |       await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  71  |       await capture(`import-${index}-${index % 2 ? 'small' : 'tiny'}`);
  72  |     }
  73  |     await page.locator('input[type=file]').setInputFiles({ name: 'corrupt.theandril', mimeType: 'application/gzip', buffer: Buffer.from('not a save') });
  74  |     await expect(page.getByTestId('feedback')).toHaveClass(/error/);
  75  |     await capture('failed-import');
  76  |     await closeCampaignOptions(page);
  77  |     // Use the newest actual control even during RED, so all replacement counts
  78  |     // are retained instead of stopping at the first duplicate locator error.
  79  |     const control = page.getByTestId('faction-overview-control').last();
  80  |     await control.locator(':scope > summary').click();
  81  |     await control.getByRole('button', { name: 'Realms', exact: true }).click();
  82  |     await expect(control.getByRole('button', { name: 'Realms', exact: true })).toHaveAttribute('aria-pressed', 'true');
  83  |     await control.getByRole('button', { name: 'Clear realms', exact: true }).click();
  84  |     for (const checkbox of await control.getByRole('checkbox').all()) await expect(checkbox).not.toBeChecked();
  85  |     await control.getByRole('button', { name: 'All known realms', exact: true }).click();
  86  |     for (const checkbox of await control.getByRole('checkbox').all()) await expect(checkbox).toBeChecked();
  87  |     await control.locator(':scope > summary').click();
  88  |     await openRealmAffairs(page);
  89  |     await page.getByRole('button', { name: 'Declare war on Reedbound Council', exact: true }).click();
  90  |     await openSelectedOrders(page);
  91  |     await page.getByRole('button', { name: 'Attack Reedbound Watch (army.4)', exact: true }).click();
  92  |     await expect(page.getByTestId('battle-panel')).toBeVisible();
  93  |     await expect(control).toBeHidden();
  94  |     await page.getByRole('button', { name: 'Auto-resolve battle', exact: true }).click();
  95  |     await expect(page.getByTestId('battle-panel')).toHaveCount(0);
  96  |     await expect(control.locator(':scope > summary')).toContainText('Realms');
  97  |     await capture('after-battle');
  98  |     expect(await canvas!.evaluate(element => element === document.querySelector('canvas'))).toBe(true);
  99  |     await page.getByRole('button', { name: 'Focus selection', exact: true }).click();
  100 |     await page.getByTestId('map-container').focus(); await page.keyboard.press('Enter');
  101 |     await expect(page.getByRole('dialog', { name: 'Map orders', exact: true })).toBeVisible();
  102 |     await page.keyboard.press('Escape');
  103 |     await page.screenshot({ path: info.outputPath('lifecycle-after-battle.png') });
  104 |     await page.setViewportSize({ width: 390, height: 844 });
  105 |     await control.locator(':scope > summary').click();
  106 |     await control.getByRole('button', { name: 'Terrain', exact: true }).click();
  107 |     await expect(control.getByRole('button', { name: 'Terrain', exact: true })).toHaveAttribute('aria-pressed', 'true');
  108 |     expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  109 |     await page.screenshot({ path: info.outputPath('lifecycle-controls-390.png') });
  110 |     expect.soft(consoleMessages.filter(message => /same key|Encountered two children/.test(message))).toEqual([]);
  111 |     expect(errors).toEqual([]);
  112 |   } finally { await saveEvidence(); await cdp.detach(); }
  113 | });
  114 | 
  115 | for (const definitionId of ['faction.ashen_compact', 'faction.reedbound_council']) {
  116 |   test(`R18 paid Waykeeper resolves shared art for ${definitionId}`, async ({ page }, info) => {
  117 |     const consoleMessages: string[] = [], errors: string[] = [], requests: string[] = [];
  118 |     page.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') consoleMessages.push(message.text()); });
  119 |     page.on('pageerror', error => errors.push(error.message));
  120 |     page.on('request', request => { if (/\/art\/.*\.png/.test(request.url())) requests.push(new URL(request.url()).pathname); });
  121 |     // Authored funded/infrastructure fixture, not a natural campaign. Appointment,
  122 |     // attachment and all inspection below use public controls; no debug mutations.
  123 |     const game = characterCampaign();
  124 |     game.factions[0]!.definitionId = definitionId;
  125 |     game.factions[0]!.color = FACTIONS.find(faction => faction.id === definitionId)!.color;
  126 |     game.settlements[C.homeId]!.buildings.push('building.archive');
  127 |     const validated = deserializeGame(serializeGame(game));
  128 |     const catalog = JSON.parse(await readFile('apps/web/public/art/catalog.json', 'utf8'));
  129 |     const asset = catalog.assets.find((item: { id: string }) => item.id === 'character.waykeeper');
  130 |     const atlas = catalog.atlases.find((item: { id: string }) => item.id === asset.atlasId);
  131 |     expect(atlas.width * atlas.height * 4).toBe(4 * 1024 * 1024);
  132 |     await page.goto('/'); await importCampaign(page, validated);
  133 |     await selectFromRegistry(page, 'settlements', C.homeName); await openSelectedOrders(page);
  134 |     await page.getByTestId('character-appointments').locator('summary').click();
  135 |     const before = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.treasury);
  136 |     await page.getByRole('button', { name: 'Appoint Waykeeper', exact: true }).click();
  137 |     await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.characters.filter(item => item.definitionId === 'character.waykeeper').length)).toBe(1);
  138 |     expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.treasury)).toBe(before - 40);
  139 |     await page.getByRole('button', { name: 'Open character roster', exact: true }).click();
  140 |     const caster = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.characters.find(item => item.definitionId === 'character.waykeeper')!);
  141 |     const roster = page.getByRole('dialog', { name: 'Characters & agents', exact: true });
  142 |     await roster.getByRole('button', { name: `Inspect ${caster.name} (${caster.id})`, exact: true }).click();
  143 |     const art = roster.locator('[data-art-content-id="character.waykeeper"]');
  144 |     await expect(art).toHaveCount(2);
  145 |     for (const icon of await art.all()) {
  146 |       await expect(icon).toHaveAttribute('data-art-state', 'shared');
  147 |       await expect(icon).toHaveAttribute('data-art-rendered-id', 'character.waykeeper');
  148 |       await expect(icon).toHaveAttribute('title', /shared Waykeeper silhouette/);
  149 |       await expect(icon).not.toContainText('Generic');
  150 |     }
  151 |     await expect(roster.getByRole('img', { name: /shared Waykeeper silhouette/ })).toHaveCount(1);
  152 |     await roster.screenshot({ path: info.outputPath('waykeeper-paid-desktop.png') });
  153 |     const hash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  154 |     await page.setViewportSize({ width: 390, height: 844 });
  155 |     await roster.getByRole('combobox', { name: 'Assign to army', exact: true }).selectOption(C.armyId);
  156 |     await roster.getByRole('button', { name: 'Assign character', exact: true }).click();
  157 |     await expect.poll(() => page.evaluate(id => window.__THEANDRIL__!.getSummary()!.characters.find(item => item.id === id)?.location, caster.id)).toEqual({ kind: 'army', armyId: C.armyId });
```