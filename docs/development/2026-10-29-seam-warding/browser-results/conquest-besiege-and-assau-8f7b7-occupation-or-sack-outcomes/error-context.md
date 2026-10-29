# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: conquest.spec.ts >> besiege and assault a town, save the capture decision, and apply distinct occupation or sack outcomes
- Location: tests/gameplay/conquest.spec.ts:33:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('capture-panel')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByTestId('capture-panel') with timeout 5000ms
  - waiting for getByTestId('capture-panel')

```

```yaml
- button "Import save file"
- banner:
  - text: The age of fracture
  - heading "Theandril" [level=1]
- group: Campaign & settings
- main:
  - text: Keep the hearth. Keep the oath.
  - heading "From the ashes, a new dominion." [level=2]
  - paragraph: "The old roads end in wilderness. Lead your chosen people beyond their last milestones: chart the forests, raise a settlement, and give your people a future."
  - paragraph: Found a hearth. Work its land. Send wayfinders into the unknown.
  - paragraph:
    - link "Developer updates (opens in a new tab)":
      - /url: /updates/
      - text: Developer updates
  - text: A chronicle begins
  - heading "Establish your campaign" [level=2]
  - heading "Ashen Compact" [level=3]
  - paragraph: Your chosen player seat
  - region "Player culture":
    - text: Player faction
    - combobox "Player faction":
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
    - paragraph: Keep the hearth. Keep the oath.
    - paragraph: Public hearth councils rebuild reliable workshops while frontier households contest their share of the common grain.
    - paragraph:
      - strong: Worked-land strengths & drawbacks
    - list "Biome affinities":
      - listitem:
        - strong: Temperate grassland
        - text: ": +1 food per worked tile"
      - listitem:
        - strong: Temperate forest
        - text: ": +1 industry per worked tile"
      - listitem:
        - strong: Tundra
        - text: ": −1 food per worked tile"
      - listitem:
        - strong: Desert
        - text: ": −1 food per worked tile"
    - paragraph: Unlisted biomes are neutral. These contributions modify worked tiles, not movement or combat.
    - paragraph: "Cultivation traditions: Temperate grassland, Temperate forest. Cultivation is paid work, not free conversion."
    - group: Recruitment tendencies
  - text: World seed
  - textbox "World seed":
    - /placeholder: Random for each new campaign
  - paragraph: Leave blank for a fresh random world. Enter a seed to revisit a world; its seed is shown above the map.
  - text: World size
  - combobox "World size":
    - option "Tiny · 1,536 hexes · 4 realms"
    - option "Small · 19,360 hexes · 8 realms"
    - option "Standard · 31,360 hexes · 12 realms" [selected]
    - option "Large · 51,840 hexes · 16 realms"
    - option "Huge · 77,440 hexes · 20 realms"
  - text: Faction count
  - spinbutton "Faction count": "12"
  - text: City-states
  - spinbutton "City-states": "8"
  - paragraph: "Independent single-city powers that settle the land between realms and can be conquered like any neighbour. Recommended here: 8. They borrow a culture's art under their own banner colour."
  - paragraph: "Recommended for this size: 12 realms. Changing world size resets this recommendation; you can override it. 24 introductory faction templates are authored. Additional seats are generated variants, not additional authored nations. Extreme crowding is not balanced."
  - text: Map type
  - combobox "Map type":
    - option "Continents" [selected]
    - option "Pangaea"
    - option "Fractal"
    - option "Islands"
    - option "Archipelago"
    - option "Earth-like"
    - option "Inland Sea"
  - paragraph: Two or three large continents separated by open ocean, with offshore islands.
  - text: Campaign pace
  - combobox "Campaign pace":
    - option "Short · test/skirmish"
    - option "Standard · about 200 turns" [selected]
    - option "Long · about 300 turns"
    - option "Epic · about 350–400 turns"
  - paragraph: A full campaign aiming for about two hundred turns, with a twenty-turn window to oppose public projects. Actual length depends on play. Pace changes economic costs and the public response window, not AI strength. Campaign length varies with play.
  - text: Campaign mode
  - combobox "Campaign mode":
    - option "Lead a realm" [selected]
    - option "AI watch"
  - paragraph: The same seed, size, map type and faction count create the same world within a generator version. Larger maps need more realms to create nearby rivals; terrain can still separate them.
  - button "Begin campaign"
  - button "Load campaign"
  - button "Restore autosave"
  - button "Import campaign"
  - region "Introductory cultures":
    - heading "Introductory cultures" [level=3]
    - paragraph: Public culture reference, not a player-seat selector. Generated realms reuse these traditions; their locations and forces must still be discovered.
    - article:
      - img "Ashen Compact crest · approved faction artwork"
      - heading "Ashen Compact" [level=4]
      - paragraph: Keep the hearth. Keep the oath.
    - article:
      - img "Reedbound Council crest · approved faction artwork"
      - heading "Reedbound Council" [level=4]
      - paragraph: No river belongs to one shore.
    - article:
      - img "Cinder March crest · approved faction artwork"
      - heading "Cinder March" [level=4]
      - paragraph: We hold what the fire spared.
    - article:
      - img "Glass Tide crest · approved faction artwork"
      - heading "Glass Tide" [level=4]
      - paragraph: Every horizon is a promise.
    - article:
      - img "Iron Covenant crest · approved faction artwork"
      - heading "Iron Covenant" [level=4]
      - paragraph: The hold endures. The valley is owed.
    - article:
      - img "Sepulchral Synod crest · approved faction artwork"
      - heading "Sepulchral Synod" [level=4]
      - paragraph: No measure ends at the grave.
    - article:
      - img "Mire Courts crest · approved faction artwork"
      - heading "Mire Courts" [level=4]
      - paragraph: The season returns. The court remembers.
    - article:
      - img "Saltwind Remnant crest · approved faction artwork"
      - heading "Saltwind Remnant" [level=4]
      - paragraph: A keel is pledged only once.
    - article:
      - img "Wardhall Remnant crest · approved faction artwork"
      - heading "Wardhall Remnant" [level=4]
      - paragraph: Let the work stand witness.
    - article:
      - img "Rimehorn Clans crest · approved faction artwork"
      - heading "Rimehorn Clans" [level=4]
      - paragraph: Share the shelter. Answer the horn.
    - article:
      - img "Sable Steppe crest · approved faction artwork"
      - heading "Sable Steppe" [level=4]
      - paragraph: The road moves with the camp.
    - article:
      - img "Morrow Spore crest · approved faction artwork"
      - heading "Morrow Spore" [level=4]
      - paragraph: What falls shall feed what follows.
    - article:
      - img "Cistern Assembly crest · approved faction artwork"
      - heading "Cistern Assembly" [level=4]
      - paragraph: Read the measure. Share the draw.
    - article:
      - img "Unsealed Companies crest · approved faction artwork"
      - heading "Unsealed Companies" [level=4]
      - paragraph: The living make their own terms.
    - article:
      - img "Lantern Hospices crest · approved faction artwork"
      - heading "Lantern Hospices" [level=4]
      - paragraph: Keep a place beside the lamp.
    - article:
      - img "Cairnwing Concord crest · approved faction artwork"
      - heading "Cairnwing Concord" [level=4]
      - paragraph: No ledge stands without the lift.
    - article:
      - img "Red Sluice Directorate crest · approved faction artwork"
      - heading "Red Sluice Directorate" [level=4]
      - paragraph: Count the harvest. Answer the banks.
    - article:
      - img "Velvet Meridian crest · approved faction artwork"
      - heading "Velvet Meridian" [level=4]
      - paragraph: A measure is not the final word.
    - article:
      - img "Brine Choir crest · approved faction artwork"
      - heading "Brine Choir" [level=4]
      - paragraph: Let every shore be heard.
    - article:
      - img "Emberwake Convocation crest · approved faction artwork"
      - heading "Emberwake Convocation" [level=4]
      - paragraph: Keep the seed. Account for the fire.
    - article:
      - img "Underhush Exchange crest · approved faction artwork"
      - heading "Underhush Exchange" [level=4]
      - paragraph: Leave room for those who dwell.
    - article:
      - img "Vesper Court crest · approved faction artwork"
      - heading "Vesper Court" [level=4]
      - paragraph: Hospitality must have an ending.
    - article:
      - img "Manytrack Moot crest · approved faction artwork"
      - heading "Manytrack Moot" [level=4]
      - paragraph: Unlike tracks may share a road.
    - article:
      - img "Margin Observance crest · approved faction artwork"
      - heading "Margin Observance" [level=4]
      - paragraph: Keep the gap beside the record.
- contentinfo:
  - alert: "The campaign worker stopped: Unexpected worker error. Restore a saved campaign to recover."
- button "Art Lab"
- text: Development asset inspector
```

# Test source

```ts
  1   | import { closeManagement, openRegistry, selectFromRegistry, openSelectedOrders, openRealmAffairs, openCampaignJournal, openProduction } from './ui-navigation';
  2   | import { expect, test, type Page } from '@playwright/test';
  3   | import { serializeGame, type GameState } from '@theandril/sim';
  4   | import { exportSave } from '@theandril/persistence';
  5   | import { isPassable, neighbors } from '@theandril/mapgen';
  6   | import { CONQUEST_FIXTURE, conquestCampaign } from '../../packages/test-fixtures/src/conquest-fixture';
  7   | 
  8   | async function beginSiege(page: Page): Promise<GameState> {
  9   |   const fixture = conquestCampaign();
  10  |   await page.goto('/');
  11  |   await page.locator('input[type=file]').setInputFiles({ name: 'reedwatch.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(fixture))) });
  12  |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  13  |   await openRealmAffairs(page);
  14  |   await page.getByRole('button', { name: 'Declare war on Reedbound Council', exact: true }).click();
  15  |   await openSelectedOrders(page);
  16  |   await page.getByRole('button', { name: 'Besiege Reedwatch', exact: true }).click();
  17  |   await expect(page.getByTestId(`siege-${CONQUEST_FIXTURE.settlementId}`)).toContainText('Besieging Reedwatch');
  18  |   for (let turn = 2; turn <= 4; turn++) {
  19  |     await closeManagement(page);
  20  |     await page.getByRole('button', { name: 'End turn', exact: true }).click();
  21  |     await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${turn}`);
  22  |   }
  23  |   expect(await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.sieges[0]?.defenses)).toBe(0);
  24  |   await openSelectedOrders(page);
  25  |   await page.getByRole('button', { name: 'Assault Reedwatch', exact: true }).click();
  26  |   await expect(page.getByTestId('battle-panel')).toBeVisible();
  27  |   await page.getByRole('button', { name: 'Auto-resolve battle', exact: true }).click();
  28  |   await expect(page.getByTestId('capture-panel')).toContainText('Reedwatch has fallen');
  29  |   await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeDisabled();
  30  |   return fixture;
  31  | }
  32  | 
  33  | test('besiege and assault a town, save the capture decision, and apply distinct occupation or sack outcomes', async ({ page }, testInfo) => {
  34  |   const errors: string[] = [];
  35  |   page.on('pageerror', error => errors.push(error.message));
  36  |   await beginSiege(page);
  37  |   await page.screenshot({ path: testInfo.outputPath('capture-choices.png'), fullPage: true });
  38  |   await closeManagement(page);
  39  |   await page.getByText('Campaign & settings', { exact: true }).click();
  40  |   await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  41  |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  42  |   const decisionHash = await page.evaluate(() => window.__THEANDRIL__?.getStateHash());
  43  |   await page.getByRole('button', { name: 'Occupy settlement', exact: true }).click();
  44  |   await expect(page.getByTestId('capture-panel')).toHaveCount(0);
  45  |   const occupied = await page.evaluate(id => window.__THEANDRIL__?.getSummary()?.ownSettlements.find(town => town.id === id), CONQUEST_FIXTURE.settlementId);
  46  |   expect(occupied?.occupationTurns).toBe(3);
  47  |   expect(occupied?.devastation).toBe(20);
  48  |   expect(occupied?.buildings).toHaveLength(2);
  49  |   await page.reload();
  50  |   await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
> 51  |   await expect(page.getByTestId('capture-panel')).toBeVisible();
      |                                                   ^ Error: expect(locator).toBeVisible() failed
  52  |   expect(await page.evaluate(() => window.__THEANDRIL__?.getStateHash())).toBe(decisionHash);
  53  |   const before = await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.treasury);
  54  |   const loot = await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.pendingCapture?.options.find(option => option.outcome === 'sack')?.coinGain);
  55  |   await page.getByRole('button', { name: 'Sack settlement', exact: true }).click();
  56  |   await expect(page.getByTestId('capture-panel')).toHaveCount(0);
  57  |   const sacked = await page.evaluate(id => window.__THEANDRIL__?.getSummary()?.ownSettlements.find(town => town.id === id), CONQUEST_FIXTURE.settlementId);
  58  |   expect(sacked?.population).toBe(1);
  59  |   expect(sacked?.buildings).toHaveLength(1);
  60  |   expect(sacked?.devastation).toBe(60);
  61  |   expect(sacked?.occupationTurns).toBe(5);
  62  |   expect(await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.treasury)).toBe(before! + loot!);
  63  |   await openRegistry(page, 'settlements');
  64  |   await selectFromRegistry(page, 'settlements', /Reedwatch/); await openSelectedOrders(page);
  65  |   await expect(page.getByTestId('settlement-defense')).toContainText('60/100');
  66  |   await page.screenshot({ path: testInfo.outputPath('occupied-town.png'), fullPage: true });
  67  |   await page.setViewportSize({ width: 390, height: 844 });
  68  |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  69  |   await page.screenshot({ path: testInfo.outputPath('conquest-narrow.png'), fullPage: true });
  70  |   expect(errors).toEqual([]);
  71  | });
  72  | 
  73  | test('confirm razing and resettle the visible ruins with a normally recruited caravan', async ({ page }, testInfo) => {
  74  |   const fixture = await beginSiege(page);
  75  |   const ruinCell = fixture.settlements[CONQUEST_FIXTURE.settlementId]!.cell;
  76  |   const home = Object.values(fixture.settlements).find(town => town.factionId === fixture.turnOwnerId)!;
  77  |   await page.getByRole('button', { name: 'Raze settlement', exact: true }).click();
  78  |   await expect(page.getByRole('group', { name: 'Confirm settlement destruction' })).toBeVisible();
  79  |   await page.getByRole('button', { name: 'Keep settlement', exact: true }).click();
  80  |   await expect(page.getByTestId('capture-panel')).toBeVisible();
  81  |   await page.getByRole('button', { name: 'Raze settlement', exact: true }).click();
  82  |   await page.getByRole('button', { name: 'Confirm raze', exact: true }).click();
  83  |   await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getSummary()?.ruins.length)).toBe(1);
  84  |   await selectFromRegistry(page, 'armies', /Ashen Vanguard/); await openSelectedOrders(page);
  85  |   await expect(page.getByTestId('ruin-inspection')).toContainText('Reedwatch');
  86  |   await page.screenshot({ path: testInfo.outputPath('reedwatch-ruins.png'), fullPage: true });
  87  |   await openRegistry(page, 'settlements');
  88  |   await selectFromRegistry(page, 'settlements', /Ashen Hearth/); await openSelectedOrders(page);
  89  |   await openProduction(page, 'land');
  90  |   await page.getByRole('button', { name: 'Recruit Hearth caravan', exact: true }).click();
  91  |   let turn = 4;
  92  |   for (let i = 0; i < 5; i++) {
  93  |     await closeManagement(page);
  94  |     await page.getByRole('button', { name: 'End turn', exact: true }).click();
  95  |     await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${++turn}`);
  96  |   }
  97  |   await openRegistry(page, 'armies');
  98  |   await selectFromRegistry(page, 'armies', /Hearth caravan/); await openSelectedOrders(page);
  99  |   const paths = new Map<number, number[]>([[home.cell, []]]);
  100 |   const frontier = [home.cell];
  101 |   for (let cursor = 0; cursor < frontier.length && !paths.has(ruinCell); cursor++) {
  102 |     const current = frontier[cursor]!;
  103 |     for (const cell of neighbors(current, fixture.world.width, fixture.world.height)) {
  104 |       if (paths.has(cell) || !isPassable(fixture.world.terrain[cell]!)) continue;
  105 |       paths.set(cell, [...paths.get(current)!, cell]); frontier.push(cell);
  106 |     }
  107 |   }
  108 |   const route = paths.get(ruinCell);
  109 |   expect(route).toBeTruthy();
  110 |   for (const cell of route!) {
  111 |     const cost = [2, 3].includes(fixture.world.terrain[cell]!) ? 2 : 1;
  112 |     const movement = await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.ownArmies.find(army => army.unitId === 'unit.colonist')?.movement);
  113 |     if (movement! < cost) {
  114 |       await closeManagement(page);
  115 |       await page.getByRole('button', { name: 'End turn', exact: true }).click();
  116 |       await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${++turn}`);
  117 |     }
  118 |     await openSelectedOrders(page);
  119 |     await page.getByRole('button', { name: `Move to cell ${cell}`, exact: true }).click();
  120 |     await expect(page.getByTestId('feedback')).toContainText(`explored hex ${cell}`);
  121 |   }
  122 |   await closeManagement(page);
  123 |   await page.getByRole('button', { name: 'End turn', exact: true }).click();
  124 |   await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${++turn}`);
  125 |   await openSelectedOrders(page);
  126 |   await page.getByLabel('Settlement name', { exact: true }).fill('New Reedwatch');
  127 |   await page.getByRole('button', { name: 'Found settlement', exact: true }).click();
  128 |   await openRegistry(page, 'settlements');
  129 |   await expect(page.getByTestId('settlement-registry')).toContainText('New Reedwatch');
  130 |   expect(await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.ruins.length)).toBe(0);
  131 |   const rebuilt = await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.ownSettlements.find(town => town.name === 'New Reedwatch'));
  132 |   expect(rebuilt?.cell).toBe(ruinCell);
  133 |   expect(rebuilt?.founderFactionId).toBe(fixture.turnOwnerId);
  134 | });
  135 | 
  136 | test('defending a settlement pauses the AI assault and resolves the AI capture after human withdrawal', async ({ page }) => {
  137 |   const fixture = conquestCampaign();
  138 |   // Swap the human seat in this authored fixture; every siege/battle/capture remains a real order.
  139 |   fixture.turnOwnerId = CONQUEST_FIXTURE.enemyFactionId;
  140 |   await page.goto('/');
  141 |   await page.locator('input[type=file]').setInputFiles({ name: 'defend-reedwatch.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(fixture))) });
  142 |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  143 |   // Modern ranks retain braced cohesion behind walls. The ordinary-strength
  144 |   // besieger waits for three real siege ticks, then interrupts the fourth click
  145 |   // for the human's defense before the campaign round advances.
  146 |   for (let turn = 2; turn <= 4; turn++) {
  147 |     await closeManagement(page);
  148 |     await page.getByRole('button', { name: 'End turn', exact: true }).click();
  149 |     await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${turn}`);
  150 |     await expect(page.getByTestId('battle-panel')).toHaveCount(0);
  151 |   }
```