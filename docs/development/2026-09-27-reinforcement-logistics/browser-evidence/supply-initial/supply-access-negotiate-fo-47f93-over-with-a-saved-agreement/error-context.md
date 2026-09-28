# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: supply-access.spec.ts >> negotiate foreign harbor service, sustain the convoy and field force, interrupt it and recover with a saved agreement
- Location: tests/gameplay/supply-access.spec.ts:27:1

# Error details

```
Test timeout of 45000ms exceeded.
```

```
Error: locator.selectOption: Test timeout of 45000ms exceeded.
Call log:
  - waiting for getByTestId('supply-access').getByLabel('Supply hearth or harbor', { exact: true })

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
      - generic "Campaign & settings" [ref=f1e15] [cursor=pointer]
  - main [ref=f1e16]:
    - generic [ref=f1e17]:
      - generic [ref=f1e18]: Keep the hearth. Keep the oath.
      - heading "From the ashes, a new dominion." [level=2] [ref=f1e19]: From the ashes,a new dominion.
      - paragraph [ref=f1e20]: "The old roads end in wilderness. Lead your chosen people beyond their last milestones: chart the forests, raise a settlement, and give your people a future."
      - paragraph [ref=f1e22]: Found a hearth. Work its land.Send wayfinders into the unknown.
      - paragraph [ref=f1e23]:
        - link "Developer updates (opens in a new tab)" [ref=f1e24] [cursor=pointer]:
          - /url: /updates/
          - text: Developer updates
          - generic [aria-hidden] [ref=f1e25]: ↗
    - generic [ref=f1e26]:
      - generic [ref=f1e27]: A chronicle begins
      - heading "Establish your campaign" [level=2] [ref=f1e28]
      - generic [ref=f1e31]:
        - heading "Ashen Compact" [level=3] [ref=f1e32]
        - paragraph [ref=f1e33]: Your chosen player seat
      - generic [ref=f1e34]:
        - region "Player culture" [ref=f1e35]:
          - generic [ref=f1e36]:
            - text: Player faction
            - combobox "Player faction" [ref=f1e37]:
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
          - paragraph [ref=f1e38]: Keep the hearth. Keep the oath.
          - generic [ref=f1e39]:
            - paragraph [ref=f1e40]: Public hearth councils rebuild reliable workshops while frontier households contest their share of the common grain.
            - paragraph [ref=f1e41]:
              - strong [ref=f1e42]: Worked-land strengths & drawbacks
            - list "Biome affinities" [ref=f1e43]:
              - listitem [ref=f1e44]:
                - strong [ref=f1e45]: Temperate grassland
                - text: ": +1 food per worked tile"
              - listitem [ref=f1e46]:
                - strong [ref=f1e47]: Temperate forest
                - text: ": +1 industry per worked tile"
              - listitem [ref=f1e48]:
                - strong [ref=f1e49]: Tundra
                - text: ": −1 food per worked tile"
              - listitem [ref=f1e50]:
                - strong [ref=f1e51]: Desert
                - text: ": −1 food per worked tile"
            - paragraph [ref=f1e52]: Unlisted biomes are neutral. These contributions modify worked tiles, not movement or combat.
            - paragraph [ref=f1e53]: "Cultivation traditions: Temperate grassland, Temperate forest. Cultivation is paid work, not free conversion."
            - group [ref=f1e54]:
              - generic "Recruitment tendencies" [ref=f1e55] [cursor=pointer]
        - generic [ref=f1e56]:
          - text: World seed
          - textbox "World seed" [ref=f1e57]:
            - /placeholder: Random for each new campaign
        - paragraph [ref=f1e58]: Leave blank for a fresh random world. Enter a seed to revisit a world; its seed is shown above the map.
        - generic [ref=f1e59]:
          - text: World size
          - combobox "World size" [ref=f1e60]:
            - option "Tiny · 1,536 hexes · 4 realms"
            - option "Small · 19,360 hexes · 8 realms"
            - option "Standard · 31,360 hexes · 12 realms" [selected]
            - option "Large · 51,840 hexes · 16 realms"
            - option "Huge · 77,440 hexes · 20 realms"
        - generic [ref=f1e61]:
          - text: Faction count
          - spinbutton "Faction count" [ref=f1e62]: "12"
        - generic [ref=f1e63]:
          - text: City-states
          - spinbutton "City-states" [ref=f1e64]: "8"
        - paragraph [ref=f1e65]: "Independent single-city powers that settle the land between realms and can be conquered like any neighbour. Recommended here: 8. They borrow a culture's art under their own banner colour."
        - paragraph [ref=f1e66]: "Recommended for this size: 12 realms. Changing world size resets this recommendation; you can override it. 24 introductory faction templates are authored. Additional seats are generated variants, not additional authored nations. Extreme crowding is not balanced."
        - generic [ref=f1e67]:
          - text: Map type
          - combobox "Map type" [ref=f1e68]:
            - option "Continents" [selected]
            - option "Pangaea"
            - option "Fractal"
            - option "Islands"
            - option "Archipelago"
            - option "Earth-like"
            - option "Inland Sea"
        - paragraph [ref=f1e69]: Two or three large continents separated by open ocean, with offshore islands.
        - generic [ref=f1e70]:
          - text: Campaign pace
          - combobox "Campaign pace" [ref=f1e71]:
            - option "Short · test/skirmish"
            - option "Standard · about 200 turns" [selected]
            - option "Long · about 300 turns"
            - option "Epic · about 350–400 turns"
        - paragraph [ref=f1e72]: A full campaign aiming for about two hundred turns, with a twenty-turn window to oppose public projects. Actual length depends on play. Pace changes economic costs and the public response window, not AI strength. Campaign length varies with play.
        - generic [ref=f1e73]:
          - text: Campaign mode
          - combobox "Campaign mode" [ref=f1e74]:
            - option "Lead a realm" [selected]
            - option "AI watch"
        - paragraph [ref=f1e75]: The same seed, size, map type and faction count create the same world within a generator version. Larger maps need more realms to create nearby rivals; terrain can still separate them.
        - button "Begin campaign" [ref=f1e76] [cursor=pointer]:
          - text: Begin campaign
          - generic [aria-hidden] [ref=f1e77]: →
      - generic [ref=f1e78]:
        - button "Load campaign" [ref=f1e79] [cursor=pointer]
        - button "Restore autosave" [ref=f1e80] [cursor=pointer]
        - button "Import campaign" [ref=f1e81] [cursor=pointer]
    - region [ref=f1e82]:
      - heading "Introductory cultures" [level=3] [ref=f1e83]
      - paragraph [ref=f1e84]: Public culture reference, not a player-seat selector. Generated realms reuse these traditions; their locations and forces must still be discovered.
      - generic [ref=f1e85]:
        - article [ref=f1e86]:
          - img "Ashen Compact crest · approved faction artwork" [ref=f1e87]
          - generic [ref=f1e88]:
            - heading "Ashen Compact" [level=4] [ref=f1e89]
            - paragraph [ref=f1e90]: Keep the hearth. Keep the oath.
        - article [ref=f1e91]:
          - img "Reedbound Council crest · approved faction artwork" [ref=f1e92]
          - generic [ref=f1e93]:
            - heading "Reedbound Council" [level=4] [ref=f1e94]
            - paragraph [ref=f1e95]: No river belongs to one shore.
        - article [ref=f1e96]:
          - img "Cinder March crest · approved faction artwork" [ref=f1e97]
          - generic [ref=f1e98]:
            - heading "Cinder March" [level=4] [ref=f1e99]
            - paragraph [ref=f1e100]: We hold what the fire spared.
        - article [ref=f1e101]:
          - img "Glass Tide crest · approved faction artwork" [ref=f1e102]
          - generic [ref=f1e103]:
            - heading "Glass Tide" [level=4] [ref=f1e104]
            - paragraph [ref=f1e105]: Every horizon is a promise.
        - article [ref=f1e106]:
          - img "Iron Covenant crest · approved faction artwork" [ref=f1e107]
          - generic [ref=f1e108]:
            - heading "Iron Covenant" [level=4] [ref=f1e109]
            - paragraph [ref=f1e110]: The hold endures. The valley is owed.
        - article [ref=f1e111]:
          - img "Sepulchral Synod crest · approved faction artwork" [ref=f1e112]
          - generic [ref=f1e113]:
            - heading "Sepulchral Synod" [level=4] [ref=f1e114]
            - paragraph [ref=f1e115]: No measure ends at the grave.
        - article [ref=f1e116]:
          - img "Mire Courts crest · approved faction artwork" [ref=f1e117]
          - generic [ref=f1e118]:
            - heading "Mire Courts" [level=4] [ref=f1e119]
            - paragraph [ref=f1e120]: The season returns. The court remembers.
        - article [ref=f1e121]:
          - img "Saltwind Remnant crest · approved faction artwork" [ref=f1e122]
          - generic [ref=f1e123]:
            - heading "Saltwind Remnant" [level=4] [ref=f1e124]
            - paragraph [ref=f1e125]: A keel is pledged only once.
        - article [ref=f1e126]:
          - img "Wardhall Remnant crest · approved faction artwork" [ref=f1e127]
          - generic [ref=f1e128]:
            - heading "Wardhall Remnant" [level=4] [ref=f1e129]
            - paragraph [ref=f1e130]: Let the work stand witness.
        - article [ref=f1e131]:
          - img "Rimehorn Clans crest · approved faction artwork" [ref=f1e132]
          - generic [ref=f1e133]:
            - heading "Rimehorn Clans" [level=4] [ref=f1e134]
            - paragraph [ref=f1e135]: Share the shelter. Answer the horn.
        - article [ref=f1e136]:
          - img "Sable Steppe crest · approved faction artwork" [ref=f1e137]
          - generic [ref=f1e138]:
            - heading "Sable Steppe" [level=4] [ref=f1e139]
            - paragraph [ref=f1e140]: The road moves with the camp.
        - article [ref=f1e141]:
          - img "Morrow Spore crest · approved faction artwork" [ref=f1e142]
          - generic [ref=f1e143]:
            - heading "Morrow Spore" [level=4] [ref=f1e144]
            - paragraph [ref=f1e145]: What falls shall feed what follows.
        - article [ref=f1e146]:
          - img "Cistern Assembly crest · approved faction artwork" [ref=f1e147]
          - generic [ref=f1e148]:
            - heading "Cistern Assembly" [level=4] [ref=f1e149]
            - paragraph [ref=f1e150]: Read the measure. Share the draw.
        - article [ref=f1e151]:
          - img "Unsealed Companies crest · approved faction artwork" [ref=f1e152]
          - generic [ref=f1e153]:
            - heading "Unsealed Companies" [level=4] [ref=f1e154]
            - paragraph [ref=f1e155]: The living make their own terms.
        - article [ref=f1e156]:
          - img "Lantern Hospices crest · approved faction artwork" [ref=f1e157]
          - generic [ref=f1e158]:
            - heading "Lantern Hospices" [level=4] [ref=f1e159]
            - paragraph [ref=f1e160]: Keep a place beside the lamp.
        - article [ref=f1e161]:
          - img "Cairnwing Concord crest · approved faction artwork" [ref=f1e162]
          - generic [ref=f1e163]:
            - heading "Cairnwing Concord" [level=4] [ref=f1e164]
            - paragraph [ref=f1e165]: No ledge stands without the lift.
        - article [ref=f1e166]:
          - img "Red Sluice Directorate crest · approved faction artwork" [ref=f1e167]
          - generic [ref=f1e168]:
            - heading "Red Sluice Directorate" [level=4] [ref=f1e169]
            - paragraph [ref=f1e170]: Count the harvest. Answer the banks.
        - article [ref=f1e171]:
          - img "Velvet Meridian crest · approved faction artwork" [ref=f1e172]
          - generic [ref=f1e173]:
            - heading "Velvet Meridian" [level=4] [ref=f1e174]
            - paragraph [ref=f1e175]: A measure is not the final word.
        - article [ref=f1e176]:
          - img "Brine Choir crest · approved faction artwork" [ref=f1e177]
          - generic [ref=f1e178]:
            - heading "Brine Choir" [level=4] [ref=f1e179]
            - paragraph [ref=f1e180]: Let every shore be heard.
        - article [ref=f1e181]:
          - img "Emberwake Convocation crest · approved faction artwork" [ref=f1e182]
          - generic [ref=f1e183]:
            - heading "Emberwake Convocation" [level=4] [ref=f1e184]
            - paragraph [ref=f1e185]: Keep the seed. Account for the fire.
        - article [ref=f1e186]:
          - img "Underhush Exchange crest · approved faction artwork" [ref=f1e187]
          - generic [ref=f1e188]:
            - heading "Underhush Exchange" [level=4] [ref=f1e189]
            - paragraph [ref=f1e190]: Leave room for those who dwell.
        - article [ref=f1e191]:
          - img "Vesper Court crest · approved faction artwork" [ref=f1e192]
          - generic [ref=f1e193]:
            - heading "Vesper Court" [level=4] [ref=f1e194]
            - paragraph [ref=f1e195]: Hospitality must have an ending.
        - article [ref=f1e196]:
          - img "Manytrack Moot crest · approved faction artwork" [ref=f1e197]
          - generic [ref=f1e198]:
            - heading "Manytrack Moot" [level=4] [ref=f1e199]
            - paragraph [ref=f1e200]: Unlike tracks may share a road.
        - article [ref=f1e201]:
          - img "Margin Observance crest · approved faction artwork" [ref=f1e202]
          - generic [ref=f1e203]:
            - heading "Margin Observance" [level=4] [ref=f1e204]
            - paragraph [ref=f1e205]: Keep the gap beside the record.
  - contentinfo [ref=f1e206]:
    - status [ref=f1e207]:
      - generic [aria-hidden] [ref=f1e208]: ◆
      - text: A world of broken oaths awaits a new beginning.
  - generic [ref=f1e209]:
    - button "Art Lab" [ref=f1e210] [cursor=pointer]
    - generic [ref=f1e211]: Development asset inspector
```

# Test source

```ts
  1  | import { expect, test, type Page } from '@playwright/test';
  2  | import { applyCommand, serializeGame, stateHash } from '@theandril/sim';
  3  | import { replayArchive } from '@theandril/chronicle';
  4  | import { supplyAccessCampaign } from '../../packages/test-fixtures/src/supply-access-fixture';
  5  | import { campaignMenu, exportedTravel, importTravel } from './group-movement-fixture';
  6  | import { closeManagement, openRealmAffairs } from './ui-navigation';
  7  | 
  8  | async function requestSupply(page: Page, sourceId: string, keyboard = false) {
  9  |   await openRealmAffairs(page);
  10 |   const panel = page.getByTestId('supply-access');
> 11 |   await panel.getByLabel('Supply hearth or harbor', { exact: true }).selectOption(sourceId);
     |                                                                      ^ Error: locator.selectOption: Test timeout of 45000ms exceeded.
  12 |   await panel.getByLabel('Supply fee', { exact: true }).fill('20');
  13 |   await panel.getByLabel('Supply term in turns', { exact: true }).fill('10');
  14 |   await panel.getByRole('button', { name: 'Review supply terms', exact: true }).click();
  15 |   await expect(panel.getByTestId('supply-assessment')).toContainText('appears likely');
  16 |   const send = panel.getByRole('button', { name: 'Send supply request', exact: true });
  17 |   if (keyboard) { await send.focus(); await page.keyboard.press('Enter'); } else await send.click();
  18 |   await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.supplyAccess!.offers.length)).toBe(1);
  19 | }
  20 | async function turn(page: Page) {
  21 |   const previous = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.turn);
  22 |   await closeManagement(page);
  23 |   await page.getByRole('button', { name: 'End turn', exact: true }).click();
  24 |   await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${previous + 1}`);
  25 | }
  26 | 
  27 | test('negotiate foreign harbor service, sustain the convoy and field force, interrupt it and recover with a saved agreement', async ({ page }, testInfo) => {
  28 |   const fixture = supplyAccessCampaign(), errors: string[] = [];
  29 |   page.on('pageerror', error => errors.push(error.message));
  30 |   await importTravel(page, fixture.state);
  31 |   const initial = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.supply);
  32 |   expect(initial.find(row => row.armyId === fixture.fleetId)).toMatchObject({ supplied: false, fleetProvisions: { remaining: 0 } });
  33 |   expect(initial.find(row => row.armyId === fixture.fieldId)?.supplied).toBe(false);
  34 |   await requestSupply(page, fixture.sourceId, true);
  35 |   await expect(page.getByTestId('supply-access')).toContainText('20 coin across 1 pending');
  36 |   await turn(page);
  37 |   await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.supplyAccess!.agreements.length)).toBe(1);
  38 |   const supplied = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.supply);
  39 |   for (const id of [fixture.fleetId, fixture.cargoId, fixture.fieldId]) expect(supplied.find(row => row.armyId === id)).toMatchObject({ supplied: true, sourceSettlementId: fixture.sourceId });
  40 |   expect(supplied.find(row => row.armyId === fixture.fleetId)?.fleetProvisions).toMatchObject({ remaining: 8, refilling: true });
  41 |   await openRealmAffairs(page);
  42 |   await page.getByTestId('supply-access').screenshot({ path: testInfo.outputPath('contracted-harbor-desktop.png') });
  43 |   const active = await exportedTravel(page), agreement = active.game.supplyAccess.agreements[0]!;
  44 |   const strength = active.game.armies[fixture.fieldId]!.formations.map(formation => formation.strength);
  45 |   await openRealmAffairs(page);
  46 |   await page.getByRole('button', { name: `End supply agreement ${agreement.id}`, exact: true }).click();
  47 |   await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.supplyAccess!.agreements.length)).toBe(0);
  48 |   await turn(page);
  49 |   const interrupted = await exportedTravel(page);
  50 |   expect(interrupted.game.armies[fixture.fieldId]!.formations.map(formation => formation.strength)).toEqual(strength.map(value => value - 4));
  51 |   expect(interrupted.game.armies[fixture.fleetId]!.provisions).toBe(7);
  52 |   await page.setViewportSize({ width: 390, height: 844 });
  53 |   await requestSupply(page, fixture.sourceId, true);
  54 |   await page.getByTestId('supply-access').screenshot({ path: testInfo.outputPath('supply-request-narrow.png') });
  55 |   await turn(page);
  56 |   const recovered = await exportedTravel(page);
  57 |   expect(recovered.game.armies[fixture.fieldId]!.formations.map(formation => formation.strength)).toEqual(interrupted.game.armies[fixture.fieldId]!.formations.map(formation => formation.strength));
  58 |   expect(recovered.game.armies[fixture.fleetId]!.provisions).toBe(8);
  59 |   expect(recovered.game.supplyAccess.agreements).toHaveLength(1);
  60 |   expect(stateHash(replayArchive(recovered.archive))).toBe(stateHash(recovered.game));
  61 |   await campaignMenu(page);
  62 |   await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  63 |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  64 |   const hash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  65 |   await page.reload();
  66 |   await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  67 |   await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getStateHash())).toBe(hash);
  68 |   const loaded = await exportedTravel(page);
  69 |   expect(serializeGame(loaded.game)).toBe(serializeGame(recovered.game));
  70 |   expect(loaded.archive).toEqual(recovered.archive);
  71 |   await openRealmAffairs(page);
  72 |   const panel = page.getByTestId('supply-access');
  73 |   await expect(panel).toContainText('20 coin paid');
  74 |   expect(await panel.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  75 |   expect(errors).toEqual([]);
  76 | });
  77 | 
  78 | test('a provider reviews a real incoming request and receives exactly one payment through keyboard acceptance', async ({ page }) => {
  79 |   const fixture = supplyAccessCampaign();
  80 |   expect(applyCommand(fixture.state, fixture.proposal).ok).toBe(true);
  81 |   fixture.state.turnOwnerId = fixture.providerId;
  82 |   const before = fixture.state.factions.find(faction => faction.id === fixture.providerId)!.treasury;
  83 |   const offerId = fixture.state.supplyAccess.offers[0]!.id;
  84 |   await importTravel(page, fixture.state);
  85 |   await openRealmAffairs(page);
  86 |   const accept = page.getByRole('button', { name: `Accept supply request ${offerId}`, exact: true });
  87 |   await accept.focus(); await page.keyboard.press('Enter');
  88 |   await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.treasury)).toBe(before + 20);
  89 |   await expect(accept).toHaveCount(0);
  90 |   expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.supplyAccess!.agreements.length)).toBe(1);
  91 |   const exported = await exportedTravel(page);
  92 |   expect(exported.archive.records.filter(record => typeof record.command === 'object' && record.command !== null && 'type' in record.command && record.command.type === 'respondSupplyAccess')).toHaveLength(1);
  93 |   expect(stateHash(replayArchive(exported.archive))).toBe(stateHash(exported.game));
  94 | });
  95 | 
```