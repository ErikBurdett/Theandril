# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: battle-defense.spec.ts >> R03 public siege shows reserves at 390px and requires their later defeat before capture
- Location: tests/gameplay/battle-defense.spec.ts:79:1

# Error details

```
Test timeout of 90000ms exceeded.
```

```
Error: locator.click: Test timeout of 90000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Occupy settlement', exact: true })
    - locator resolved to <button class="wide" aria-label="Occupy settlement">Occupy</button>
  - attempting click action
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <button aria-haspopup="dialog" aria-label="Characters & agents">…</button> from <nav class="hud-tools" aria-label="Map management">…</nav> subtree intercepts pointer events
  - retrying click action
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <canvas width="390" height="399" aria-hidden="true"></canvas> from <div tabindex="0" class="map-host" data-testid="map-container" aria-label="World map. Select an army then click a highlighted hex to move or an enemy to attack. Hover to preview routes. Drag to pan; scroll to zoom all the way to world overview. Arrow keys pan; plus and minus zoom. Focus selection returns to local detail. Enter opens map actions for the selection. Escape closes map actions before clearing selection. The army panel has keyboard and touch route controls.">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <button aria-haspopup="dialog" aria-label="Characters & agents">…</button> from <nav class="hud-tools" aria-label="Map management">…</nav> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    39 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <button aria-haspopup="dialog" aria-label="Characters & agents">…</button> from <nav class="hud-tools" aria-label="Map management">…</nav> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <canvas width="390" height="399" aria-hidden="true"></canvas> from <div tabindex="0" class="map-host" data-testid="map-container" aria-label="World map. Select an army then click a highlighted hex to move or an enemy to attack. Hover to preview routes. Drag to pan; scroll to zoom all the way to world overview. Arrow keys pan; plus and minus zoom. Focus selection returns to local detail. Enter opens map actions for the selection. Escape closes map actions before clearing selection. The army panel has keyboard and touch route controls.">…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <button aria-haspopup="dialog" aria-label="Characters & agents">…</button> from <nav class="hud-tools" aria-label="Map management">…</nav> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <button aria-haspopup="dialog" aria-label="Characters & agents">…</button> from <nav class="hud-tools" aria-label="Map management">…</nav> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <button aria-haspopup="dialog" aria-label="Characters & agents">…</button> from <nav class="hud-tools" aria-label="Map management">…</nav> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <canvas width="390" height="399" aria-hidden="true"></canvas> from <div tabindex="0" class="map-host" data-testid="map-container" aria-label="World map. Select an army then click a highlighted hex to move or an enemy to attack. Hover to preview routes. Drag to pan; scroll to zoom all the way to world overview. Arrow keys pan; plus and minus zoom. Focus selection returns to local detail. Enter opens map actions for the selection. Escape closes map actions before clearing selection. The army panel has keyboard and touch route controls.">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms
  - element was detached from the DOM, retrying

```

# Page snapshot

```yaml
- generic [ref=f1e3]:
  - button "Import save file"
  - generic [ref=f1e4]:
    - banner [ref=f1e5]:
      - heading "Theandril" [level=1] [ref=f1e8]
    - group [ref=f1e9]:
      - generic "Campaign & settings" [ref=f1e10] [cursor=pointer]
  - main [ref=f1e11]:
    - generic [ref=f1e12]:
      - generic [ref=f1e13]: Keep the hearth. Keep the oath.
      - heading "From the ashes, a new dominion." [level=2] [ref=f1e14]: From the ashes,a new dominion.
      - paragraph [ref=f1e15]: "The old roads end in wilderness. Lead your chosen people beyond their last milestones: chart the forests, raise a settlement, and give your people a future."
    - generic [ref=f1e16]:
      - generic [ref=f1e17]: A chronicle begins
      - heading "Establish your campaign" [level=2] [ref=f1e18]
      - generic [ref=f1e21]:
        - heading "Ashen Compact" [level=3] [ref=f1e22]
        - paragraph [ref=f1e23]: Your chosen player seat
      - generic [ref=f1e24]:
        - region "Player culture" [ref=f1e25]:
          - generic [ref=f1e26]:
            - text: Player faction
            - combobox "Player faction" [ref=f1e27]:
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
          - paragraph [ref=f1e28]: Keep the hearth. Keep the oath.
          - generic [ref=f1e29]:
            - paragraph [ref=f1e30]: Public hearth councils rebuild reliable workshops while frontier households contest their share of the common grain.
            - paragraph [ref=f1e31]:
              - strong [ref=f1e32]: Worked-land strengths & drawbacks
            - list "Biome affinities" [ref=f1e33]:
              - listitem [ref=f1e34]:
                - strong [ref=f1e35]: Temperate grassland
                - text: ": +1 food per worked tile"
              - listitem [ref=f1e36]:
                - strong [ref=f1e37]: Temperate forest
                - text: ": +1 industry per worked tile"
              - listitem [ref=f1e38]:
                - strong [ref=f1e39]: Tundra
                - text: ": −1 food per worked tile"
              - listitem [ref=f1e40]:
                - strong [ref=f1e41]: Desert
                - text: ": −1 food per worked tile"
            - paragraph [ref=f1e42]: Unlisted biomes are neutral. These contributions modify worked tiles, not movement or combat.
            - paragraph [ref=f1e43]: "Cultivation traditions: Temperate grassland, Temperate forest. Cultivation is paid work, not free conversion."
            - group [ref=f1e44]:
              - generic "Recruitment tendencies" [ref=f1e45] [cursor=pointer]
        - generic [ref=f1e46]:
          - text: World seed
          - textbox "World seed" [ref=f1e47]:
            - /placeholder: Random for each new campaign
        - paragraph [ref=f1e48]: Leave blank for a fresh random world. Enter a seed to revisit a world; its seed is shown above the map.
        - generic [ref=f1e49]:
          - text: World size
          - combobox "World size" [ref=f1e50]:
            - option "Tiny · 1,536 hexes · quick campaign"
            - option "Small · 40,960 hexes" [selected]
            - option "Standard · 98,304 hexes"
            - option "Huge · 196,608 hexes"
            - option "Legendary · 307,200 hexes"
        - generic [ref=f1e51]:
          - text: Faction count
          - spinbutton "Faction count" [ref=f1e52]: "12"
        - generic [ref=f1e53]:
          - text: World layout
          - combobox "World layout" [ref=f1e54]:
            - option "Continents · broad landmasses" [selected]
            - option "Islands · separated shores"
            - option "Archipelago · scattered islands"
        - paragraph [ref=f1e55]: "Recommended for this size: 12 realms. Changing world size resets this recommendation; you can override it. 24 introductory faction templates are authored. Additional seats are generated variants, not additional authored nations. Extreme crowding is not balanced."
        - generic [ref=f1e56]:
          - text: Campaign pace
          - combobox "Campaign pace" [ref=f1e57]:
            - option "Short · test/skirmish"
            - option "Standard · hundreds of turns" [selected]
            - option "Long · extended campaign"
            - option "Epic · longest campaign"
        - paragraph [ref=f1e58]: A full campaign aiming for hundreds of turns, with greater late economic investment and time to oppose public projects. Actual length depends on play. Pace changes economic costs and the public response window, not AI strength. Campaign length varies with play.
        - generic [ref=f1e59]:
          - text: Campaign mode
          - combobox "Campaign mode" [ref=f1e60]:
            - option "Lead a realm" [selected]
            - option "AI watch"
        - paragraph [ref=f1e61]: The same seed, size, layout and faction count create the same world within a generator version. Giant maps need enough realms to create nearby rivals; terrain can still separate them.
        - button "Begin campaign" [ref=f1e62] [cursor=pointer]:
          - text: Begin campaign
          - generic [aria-hidden] [ref=f1e63]: →
      - generic [ref=f1e64]:
        - button "Load campaign" [ref=f1e65] [cursor=pointer]
        - button "Restore autosave" [ref=f1e66] [cursor=pointer]
        - button "Import campaign" [ref=f1e67] [cursor=pointer]
    - region [ref=f1e68]:
      - heading "Introductory cultures" [level=3] [ref=f1e69]
      - paragraph [ref=f1e70]: Public culture reference, not a player-seat selector. Generated realms reuse these traditions; their locations and forces must still be discovered.
      - generic [ref=f1e71]:
        - article [ref=f1e72]:
          - img "Ashen Compact crest · approved faction artwork" [ref=f1e73]
          - generic [ref=f1e74]:
            - heading "Ashen Compact" [level=4] [ref=f1e75]
            - paragraph [ref=f1e76]: Keep the hearth. Keep the oath.
        - article [ref=f1e77]:
          - img "Reedbound Council crest · approved faction artwork" [ref=f1e78]
          - generic [ref=f1e79]:
            - heading "Reedbound Council" [level=4] [ref=f1e80]
            - paragraph [ref=f1e81]: No river belongs to one shore.
        - article [ref=f1e82]:
          - img "Cinder March crest · approved faction artwork" [ref=f1e83]
          - generic [ref=f1e84]:
            - heading "Cinder March" [level=4] [ref=f1e85]
            - paragraph [ref=f1e86]: We hold what the fire spared.
        - article [ref=f1e87]:
          - img "Glass Tide crest · approved faction artwork" [ref=f1e88]
          - generic [ref=f1e89]:
            - heading "Glass Tide" [level=4] [ref=f1e90]
            - paragraph [ref=f1e91]: Every horizon is a promise.
        - article [ref=f1e92]:
          - img "Iron Covenant crest · approved faction artwork" [ref=f1e93]
          - generic [ref=f1e94]:
            - heading "Iron Covenant" [level=4] [ref=f1e95]
            - paragraph [ref=f1e96]: The hold endures. The valley is owed.
        - article [ref=f1e97]:
          - img "Sepulchral Synod crest · approved faction artwork" [ref=f1e98]
          - generic [ref=f1e99]:
            - heading "Sepulchral Synod" [level=4] [ref=f1e100]
            - paragraph [ref=f1e101]: No measure ends at the grave.
        - article [ref=f1e102]:
          - img "Mire Courts crest · approved faction artwork" [ref=f1e103]
          - generic [ref=f1e104]:
            - heading "Mire Courts" [level=4] [ref=f1e105]
            - paragraph [ref=f1e106]: The season returns. The court remembers.
        - article [ref=f1e107]:
          - img "Saltwind Remnant crest · approved faction artwork" [ref=f1e108]
          - generic [ref=f1e109]:
            - heading "Saltwind Remnant" [level=4] [ref=f1e110]
            - paragraph [ref=f1e111]: A keel is pledged only once.
        - article [ref=f1e112]:
          - img "Wardhall Remnant crest · approved faction artwork" [ref=f1e113]
          - generic [ref=f1e114]:
            - heading "Wardhall Remnant" [level=4] [ref=f1e115]
            - paragraph [ref=f1e116]: Let the work stand witness.
        - article [ref=f1e117]:
          - img "Rimehorn Clans crest · approved faction artwork" [ref=f1e118]
          - generic [ref=f1e119]:
            - heading "Rimehorn Clans" [level=4] [ref=f1e120]
            - paragraph [ref=f1e121]: Share the shelter. Answer the horn.
        - article [ref=f1e122]:
          - img "Sable Steppe crest · approved faction artwork" [ref=f1e123]
          - generic [ref=f1e124]:
            - heading "Sable Steppe" [level=4] [ref=f1e125]
            - paragraph [ref=f1e126]: The road moves with the camp.
        - article [ref=f1e127]:
          - img "Morrow Spore crest · approved faction artwork" [ref=f1e128]
          - generic [ref=f1e129]:
            - heading "Morrow Spore" [level=4] [ref=f1e130]
            - paragraph [ref=f1e131]: What falls shall feed what follows.
        - article [ref=f1e132]:
          - img "Cistern Assembly crest · approved faction artwork" [ref=f1e133]
          - generic [ref=f1e134]:
            - heading "Cistern Assembly" [level=4] [ref=f1e135]
            - paragraph [ref=f1e136]: Read the measure. Share the draw.
        - article [ref=f1e137]:
          - img "Unsealed Companies crest · approved faction artwork" [ref=f1e138]
          - generic [ref=f1e139]:
            - heading "Unsealed Companies" [level=4] [ref=f1e140]
            - paragraph [ref=f1e141]: The living make their own terms.
        - article [ref=f1e142]:
          - img "Lantern Hospices crest · approved faction artwork" [ref=f1e143]
          - generic [ref=f1e144]:
            - heading "Lantern Hospices" [level=4] [ref=f1e145]
            - paragraph [ref=f1e146]: Keep a place beside the lamp.
        - article [ref=f1e147]:
          - img "Cairnwing Concord crest · approved faction artwork" [ref=f1e148]
          - generic [ref=f1e149]:
            - heading "Cairnwing Concord" [level=4] [ref=f1e150]
            - paragraph [ref=f1e151]: No ledge stands without the lift.
        - article [ref=f1e152]:
          - img "Red Sluice Directorate crest · approved faction artwork" [ref=f1e153]
          - generic [ref=f1e154]:
            - heading "Red Sluice Directorate" [level=4] [ref=f1e155]
            - paragraph [ref=f1e156]: Count the harvest. Answer the banks.
        - article [ref=f1e157]:
          - img "Velvet Meridian crest · approved faction artwork" [ref=f1e158]
          - generic [ref=f1e159]:
            - heading "Velvet Meridian" [level=4] [ref=f1e160]
            - paragraph [ref=f1e161]: A measure is not the final word.
        - article [ref=f1e162]:
          - img "Brine Choir crest · approved faction artwork" [ref=f1e163]
          - generic [ref=f1e164]:
            - heading "Brine Choir" [level=4] [ref=f1e165]
            - paragraph [ref=f1e166]: Let every shore be heard.
        - article [ref=f1e167]:
          - img "Emberwake Convocation crest · approved faction artwork" [ref=f1e168]
          - generic [ref=f1e169]:
            - heading "Emberwake Convocation" [level=4] [ref=f1e170]
            - paragraph [ref=f1e171]: Keep the seed. Account for the fire.
        - article [ref=f1e172]:
          - img "Underhush Exchange crest · approved faction artwork" [ref=f1e173]
          - generic [ref=f1e174]:
            - heading "Underhush Exchange" [level=4] [ref=f1e175]
            - paragraph [ref=f1e176]: Leave room for those who dwell.
        - article [ref=f1e177]:
          - img "Vesper Court crest · approved faction artwork" [ref=f1e178]
          - generic [ref=f1e179]:
            - heading "Vesper Court" [level=4] [ref=f1e180]
            - paragraph [ref=f1e181]: Hospitality must have an ending.
        - article [ref=f1e182]:
          - img "Manytrack Moot crest · approved faction artwork" [ref=f1e183]
          - generic [ref=f1e184]:
            - heading "Manytrack Moot" [level=4] [ref=f1e185]
            - paragraph [ref=f1e186]: Unlike tracks may share a road.
        - article [ref=f1e187]:
          - img "Margin Observance crest · approved faction artwork" [ref=f1e188]
          - generic [ref=f1e189]:
            - heading "Margin Observance" [level=4] [ref=f1e190]
            - paragraph [ref=f1e191]: Keep the gap beside the record.
  - contentinfo [ref=f1e192]:
    - status [ref=f1e193]:
      - generic [aria-hidden] [ref=f1e194]: ◆
      - text: A world of broken oaths awaits a new beginning.
  - generic [ref=f1e195]:
    - button "Art Lab" [ref=f1e196] [cursor=pointer]
    - generic [ref=f1e197]: Development asset inspector
```

# Test source

```ts
  7   | import { closeManagement, openRealmAffairs, openSelectedOrders } from './ui-navigation';
  8   | 
  9   | /** Authored full-container reserve stress fixture; no naturally earned force-size claim.
  10  |  * Uses the same setup as the parent's canonical frontage regression tests.
  11  |  * Siege preparation uses three simulation ticks without AI scheduling; browser
  12  |  * AI turns can legally change this deliberately fragile 21-defender setup.
  13  |  * Assaults, autoresolve, the later live AI turn and capture use public controls. */
  14  | function reserveCampaign(siege: boolean): GameState {
  15  |   let state = siege ? conquestCampaign() : borderBattleCampaign();
  16  |   const town = state.settlements[C.settlementId]!;
  17  |   if (siege) {
  18  |     const attackers = state.armies[C.playerArmyId]!;
  19  |     attackers.formations = Array.from({ length: 12 }, (_, index) => createArmyFormation(index === 0 ? attackers.id : `army.${state.nextId++}`, 'unit.guard')).sort((a, b) => a.id < b.id ? -1 : 1);
  20  |   }
  21  |   for (let index = 0; index < 21; index++) {
  22  |     const id = !siege && index === 0 ? 'army.4' : `army.${state.nextId++}`;
  23  |     const original = state.armies['army.4'];
  24  |     state.armies[id] = { id, name: `Reserve defender ${index}`, factionId: town.factionId,
  25  |       cell: siege ? town.cell : original!.cell, movement: 0,
  26  |       formations: [{ ...createArmyFormation(id, 'unit.scout'), strength: 1, morale: 1 }] };
  27  |   }
  28  |   refreshAuthoredSight(state);
  29  |   state = deserializeGame(serializeGame(state));
  30  |   if (siege) {
  31  |     const factionId = state.turnOwnerId;
  32  |     const issue = (command: GameCommand) => {
  33  |       const result = applyCommand(state, command);
  34  |       if (!result.ok) throw new Error(`Reserve fixture ${command.type}: ${result.error}`);
  35  |     };
  36  |     issue({ type: 'declareWar', factionId, targetFactionId: town.factionId });
  37  |     issue({ type: 'besiege', factionId, armyId: C.playerArmyId, settlementId: town.id });
  38  |     for (let turn = 0; turn < 3; turn++) issue({ type: 'endTurn', factionId });
  39  |   }
  40  |   return deserializeGame(serializeGame(state));
  41  | }
  42  | async function importAndDeclare(page: Page, game: GameState) {
  43  |   await page.goto('/');
  44  |   await page.locator('input[type=file]').setInputFiles({ name: 'reserve-contingent.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(game))) });
  45  |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  46  |   if (!Object.keys(game.sieges).length) {
  47  |     await openRealmAffairs(page);
  48  |     await page.getByRole('button', { name: 'Declare war on Reedbound Council', exact: true }).click();
  49  |   }
  50  |   await openSelectedOrders(page);
  51  | }
  52  | async function assertQuote(panel: Locator, quote: { engagedFormations: number; engagedStrength: number; reserveFormations: number; reserveStrength: number }) {
  53  |   await expect(panel).toContainText(`Committed defense: ${quote.engagedFormations} formations · ${quote.engagedStrength} strength`);
  54  |   await expect(panel).toContainText(`Reserves: ${quote.reserveFormations} formation · ${quote.reserveStrength} strength`);
  55  |   await expect(panel).toContainText('Reserves defend in later engagements');
  56  | }
  57  | 
  58  | test('R03 public attack previews the canonical contingent and leaves its reserve on the map', async ({ page }, info) => {
  59  |   const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  60  |   await importAndDeclare(page, reserveCampaign(false));
  61  |   const target = page.locator('.attack-target').filter({ has: page.getByRole('button', { name: 'Attack Reserve defender 0 (army.4)', exact: true }) });
  62  |   const before = await page.evaluate(() => { const api = window.__THEANDRIL__!, view = api.getSummary()!; return { hash: api.getStateHash(), army: view.ownArmies.find(army => army.id === 'army.2')!, target: view.armies.find(army => army.id === 'army.4')! }; });
  63  |   expect(before.target.battleDefense).toBeDefined();
  64  |   await assertQuote(target.getByTestId('battle-defense-preview'), before.target.battleDefense!);
  65  |   await target.screenshot({ path: info.outputPath('field-defense-desktop.png') });
  66  |   expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(before.hash);
  67  |   await target.getByRole('button', { name: 'Attack Reserve defender 0 (army.4)', exact: true }).click();
  68  |   await expect(page.getByTestId('battle-panel')).toBeVisible();
  69  |   expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.battle!.combat.defender.length)).toBe(before.target.battleDefense!.engagedFormations);
  70  |   await page.getByRole('button', { name: 'Auto-resolve battle', exact: true }).click();
  71  |   await expect(page.getByTestId('battle-panel')).toHaveCount(0);
  72  |   const after = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!);
  73  |   expect(after.ownArmies.find(army => army.id === before.army.id)!.cell).toBe(before.army.cell);
  74  |   expect(after.armies.filter(army => army.cell === before.target.cell && army.factionId === before.target.factionId)).toHaveLength(1);
  75  |   await info.attach('field-defense', { body: JSON.stringify({ before, afterArmies: after.armies, errors }, null, 2), contentType: 'application/json' });
  76  |   expect(errors).toEqual([]);
  77  | });
  78  | 
  79  | test('R03 public siege shows reserves at 390px and requires their later defeat before capture', async ({ page }, info) => {
  80  |   const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  81  |   await importAndDeclare(page, reserveCampaign(true));
  82  |   await expect(page.getByTestId('turn-counter')).toHaveText('Turn 4');
  83  |   await openSelectedOrders(page); await page.setViewportSize({ width: 390, height: 844 });
  84  |   const card = page.getByTestId(`siege-${C.settlementId}`);
  85  |   const before = await page.evaluate(() => ({ hash: window.__THEANDRIL__!.getStateHash(), siege: window.__THEANDRIL__!.getSummary()!.sieges[0]! }));
  86  |   expect(before.siege.battleDefense?.reserveFormations).toBe(1);
  87  |   await assertQuote(card.getByTestId('battle-defense-preview'), before.siege.battleDefense!);
  88  |   await card.screenshot({ path: info.outputPath('siege-defense-390.png') });
  89  |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  90  |   expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(before.hash);
  91  |   await page.getByRole('button', { name: 'Assault Reedwatch', exact: true }).click();
  92  |   await expect(page.getByTestId('battle-panel')).toBeVisible();
  93  |   await page.getByRole('button', { name: 'Auto-resolve battle', exact: true }).click();
  94  |   await expect(page.getByTestId('battle-panel')).toHaveCount(0);
  95  |   await expect(page.getByTestId('capture-panel')).toHaveCount(0);
  96  |   const contested = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!);
  97  |   expect(contested.sieges).toHaveLength(1); expect(contested.pendingCapture).toBeNull();
  98  |   await closeManagement(page);
  99  |   await page.getByRole('button', { name: 'End turn', exact: true }).click();
  100 |   await expect(page.getByTestId('turn-counter')).toHaveText('Turn 5');
  101 |   await openSelectedOrders(page);
  102 |   await expect(card.getByTestId('battle-defense-preview')).toHaveCount(0);
  103 |   await page.getByRole('button', { name: 'Assault Reedwatch', exact: true }).click();
  104 |   await expect(page.getByTestId('battle-panel')).toBeVisible();
  105 |   await page.getByRole('button', { name: 'Auto-resolve battle', exact: true }).click();
  106 |   await expect(page.getByTestId('capture-panel')).toBeVisible();
> 107 |   await page.getByRole('button', { name: 'Occupy settlement', exact: true }).click();
      |                                                                              ^ Error: locator.click: Test timeout of 90000ms exceeded.
  108 |   await expect(page.getByTestId('capture-panel')).toHaveCount(0);
  109 |   expect(await page.evaluate(id => window.__THEANDRIL__!.getSummary()!.ownSettlements.some(town => town.id === id), C.settlementId)).toBe(true);
  110 |   await info.attach('siege-defense', { body: JSON.stringify({ before, contestedSieges: contested.sieges, errors }, null, 2), contentType: 'application/json' });
  111 |   expect(errors).toEqual([]);
  112 | });
  113 | 
```