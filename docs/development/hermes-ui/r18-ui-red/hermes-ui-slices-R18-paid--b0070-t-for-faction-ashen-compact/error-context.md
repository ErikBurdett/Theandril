# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: hermes-ui-slices.spec.ts >> R18 paid Waykeeper resolves shared art for faction.ashen_compact
- Location: tests/gameplay/hermes-ui-slices.spec.ts:17:3

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  getByRole('dialog', { name: 'Characters & agents', exact: true }).locator('[data-art-content-id="character.waykeeper"]').first()
Expected: "shared"
Received: "fallback"
Timeout:  5000ms

Call log:
  - Expect "toHaveAttribute" getByRole('dialog', { name: 'Characters & agents', exact: true }).locator('[data-art-content-id="character.waykeeper"]').first() with timeout 5000ms
  - waiting for getByRole('dialog', { name: 'Characters & agents', exact: true }).locator('[data-art-content-id="character.waykeeper"]').first()
    14 × locator resolved to <span aria-hidden="true" data-art-state="fallback" class="faction-art faction-art--fallback" data-art-content-id="character.waykeeper" data-art-id="character.waykeeper.unbound" data-art-definition="faction.ashen_compact" title="Aven Ashwell, Waykeeper · generic presentation. No approved visual family is bound to this faction definition.">…</span>
       - unexpected value "fallback"

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
          - strong [ref=e20]: 1960 coin
        - generic [ref=e21]:
          - generic [ref=e22]: KNOWLEDGE
          - strong [ref=e23]: "0"
        - generic [ref=e24]:
          - generic [ref=e25]: HEARTHS
          - strong [ref=e26]: "1"
    - navigation "Campaign navigation" [ref=e27]:
      - generic [ref=e28]:
        - text: Standard pace ·
        - generic [ref=e29]: 2 realms
      - generic [ref=e30]: Partial archive · earlier history unavailable
    - group [ref=e31]:
      - generic "Campaign & settings" [ref=e32] [cursor=pointer]
  - main [ref=e33]:
    - region "Strategic map" [ref=e34]:
      - generic: SEED 20260905 · 48 × 32Legacy geography
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
        - paragraph [ref=e78]: Ashen Hearth
      - button "Close Selected orders" [ref=e79] [cursor=pointer]: ×
    - region "Selected entity orders" [ref=e81]:
      - button "Show on map" [ref=e82] [cursor=pointer]
      - group [ref=e83]:
        - heading "Ashen Hearth" [level=2] [ref=e84]
        - paragraph [ref=e85]: A hearth of the Ashen Compact · cell 488
        - generic [ref=e86]:
          - generic [ref=e87]:
            - strong [ref=e88]: "1"
            - generic [ref=e89]: Population
          - generic [ref=e90]:
            - strong [ref=e91]: "0"
            - generic [ref=e92]: Stored food
        - heading "Production queue" [level=3] [ref=e93]
        - paragraph [ref=e94]: The hearth is idle. Choose a project below.
        - generic "Settlement production" [ref=e95]:
          - group [ref=e96]:
            - generic "Construction 3 available" [ref=e97] [cursor=pointer]:
              - text: Construction
              - generic [ref=e98]: 3 available
            - generic [ref=e99]:
              - article [ref=e100]:
                - generic [ref=e102]:
                  - heading "Root cellar" [level=4] [ref=e103]
                  - paragraph [ref=e104]: 18 industry · 8 coin
                  - paragraph [ref=e105]: +4 food each turn
                - button "Build Root cellar" [ref=e106] [cursor=pointer]
              - article [ref=e107]:
                - generic [ref=e109]:
                  - heading "Cinder workshop" [level=4] [ref=e110]
                  - paragraph [ref=e111]: 24 industry · 12 coin
                  - paragraph [ref=e112]: +4 industry each turn
                - button "Build Cinder workshop" [ref=e113] [cursor=pointer]
              - article [ref=e114]:
                - generic [ref=e116]:
                  - heading "Charter market" [level=4] [ref=e117]
                  - paragraph [ref=e118]: 24 industry · 10 coin
                  - paragraph [ref=e119]: +5 coin each turn
                - button "Build Charter market" [ref=e120] [cursor=pointer]
              - article [ref=e121]:
                - generic [ref=e123]:
                  - heading "Witness archive" [level=4] [ref=e124]
                  - paragraph [ref=e125]: 24 industry · 12 coin
                  - paragraph [ref=e126]: +4 knowledge each turn
                - paragraph [ref=e127]: That building is already built or queued.
                - button "Build Witness archive" [disabled] [ref=e128]
              - article [ref=e129]:
                - generic [ref=e131]:
                  - heading "Charter harbor" [level=4] [ref=e132]
                  - paragraph [ref=e133]: 36 industry · 20 coin
                  - paragraph [ref=e134]: +2 coin each turn
                - paragraph [ref=e135]: Research Coastal navigation first.
                - button "Build Charter harbor" [disabled] [ref=e136]
          - group [ref=e137]:
            - generic "Recruit land forces 6 available" [ref=e138] [cursor=pointer]:
              - text: Recruit land forces
              - generic [ref=e139]: 6 available
          - group [ref=e140]:
            - generic "Recruit fleet hulls 0 available" [ref=e141] [cursor=pointer]:
              - text: Recruit fleet hulls
              - generic [ref=e142]: 0 available
        - region "Settlement territory" [ref=e143]:
          - heading "Land & stewardship" [level=3] [ref=e144]
          - group [ref=e145]:
            - generic "Road connections" [ref=e146] [cursor=pointer]
          - paragraph [ref=e147]: colony · Capital
          - paragraph [ref=e148]: "Colony: 1–2 people · Settlement: 3–7 · City: 8+. Capital is a separate designation."
          - paragraph [ref=e149]: 7 claimed tiles · 0 / 1 assigned workers · reach 2
          - paragraph [ref=e150]: Connected territory and population can keep growing. Each person can work one additional tile. Larger hearths need more food, investment and civic upkeep.
          - paragraph [ref=e151]: "Next person: 0 / 12 food · consumption 2 food per turn · civic upkeep 1 coin (1 population, 0 territory, 0 administration)."
          - paragraph [ref=e152]: "Realm coin per turn: 7 income − 13 upkeep = -6. Queued formations add 0 upkeep when completed."
          - region "Border growth" [ref=e153]:
            - paragraph [ref=e154]:
              - strong [ref=e155]: "Border growth:"
              - text: 0 / 40 civic progress · +2 per active turn
            - progressbar "Civic progress toward next border" [ref=e156]
            - paragraph [ref=e157]: "Next expansion: hex 391. About 20 active turns at this rate. Larger populations, markets, archives and Surveyed estates support growth."
            - paragraph [ref=e158]: Expansion claims one connected, charted tile at a time. It does not assign workers or build improvements. Siege and occupation pause growth; conquest resets its progress. Buying a tile is immediate and increases the next expansion threshold.
          - paragraph [ref=e159]: The center is worked for free. Borders do not block travel. Only worked tiles contribute their yields; natural features remain after cultivation.
          - paragraph [ref=e160]: Map borders mark the realm perimeter. Select tiles to inspect this town’s individual claims. Dim land shows remembered ownership, not live information beyond sight.
          - paragraph [ref=e161]:
            - strong [ref=e162]: "Land yields:"
            - text: +1 food, +2 coin, +1 knowledge
          - paragraph [ref=e163]: Includes the center, assigned tiles and any capital bonus; buildings and other economy effects are separate.
          - group [ref=e164]:
            - generic "Culture & economy · Ashen Compact" [ref=e165] [cursor=pointer]
          - paragraph [ref=e166]: Select a tile on the map to inspect this settlement’s land. Army movement is off while a settlement is selected.
          - button "Select tiles" [ref=e167] [cursor=pointer]
          - region "Land hex 488" [ref=e168]:
            - heading "Hex 488 · Steppe" [level=4] [ref=e169]
            - paragraph [ref=e170]: Settlement center · automatically worked
            - paragraph [ref=e171]:
              - strong [ref=e172]: "Natural features:"
            - list [ref=e173]:
              - listitem [ref=e174]:
                - strong [ref=e175]: Waterlogged ground
                - text: · −1 industry
                - generic [ref=e176]: Saturated ground slows ordinary extraction and field drainage.
              - listitem [ref=e177]:
                - strong [ref=e178]: Peat bed
                - text: · +1 industry
                - generic [ref=e179]: Wet organic beds supply modest fuel; reedworks can use them more effectively.
            - table [ref=e180]:
              - caption [ref=e181]: Yield breakdown per worked turn
              - rowgroup [ref=e182]:
                - row [ref=e183]:
                  - columnheader "Source" [ref=e184]
                  - columnheader "Contribution" [ref=e185]
              - rowgroup [ref=e186]:
                - row [ref=e187]:
                  - rowheader "Biome" [ref=e188]
                  - cell "+1 food, +1 coin" [ref=e189]
                - row [ref=e190]:
                  - rowheader "Features" [ref=e191]
                  - cell "No change" [ref=e192]
                - row [ref=e193]:
                  - rowheader "Faction affinity" [ref=e194]
                  - cell "No change" [ref=e195]
                - row [ref=e196]:
                  - rowheader "Improvement" [ref=e197]
                  - cell "No change" [ref=e198]
                - row [ref=e199]:
                  - rowheader "Feature interactions" [ref=e200]
                  - cell "No change" [ref=e201]
                - row [ref=e202]:
                  - rowheader "Final tile yield" [ref=e203]
                  - cell "+1 food, +1 coin" [ref=e204]
            - paragraph [ref=e205]: Construction replaces any existing improvement only on completion. Its benefits require an assigned worker; cancelling unfinished work does not refund its cost.
            - group [ref=e206]:
              - generic "Tile improvements" [ref=e207] [cursor=pointer]
            - group [ref=e208]:
              - generic "Cultivate biome" [ref=e209] [cursor=pointer]
        - region "Settlement condition" [ref=e210]:
          - generic [ref=e211]:
            - generic [ref=e212]:
              - text: Devastation
              - strong [ref=e213]: 0/100
            - generic [ref=e214]:
              - text: Occupation
              - strong [ref=e215]: 0 turns
        - group [ref=e216]:
          - generic "Appoint characters & officers" [ref=e217] [cursor=pointer]
          - paragraph [ref=e218]: Appoint a named specialist here, then attach them to an army at this hex. A commander and agents are people with their own assignments, not unit formations.
          - generic [ref=e219]:
            - button "Appoint Hearth marshal" [ref=e220] [cursor=pointer]:
              - generic [ref=e223]:
                - strong [ref=e224]: Hearth marshal
                - generic [ref=e225]: Marshal · 32 coin · 2 upkeep
                - generic [ref=e226]: An appointed field commander. Leads the attached army, rallies shaken formations once per battle, and earns experience from its outcomes.
            - button "Appoint Road witness" [ref=e227] [cursor=pointer]:
              - generic [ref=e230]:
                - strong [ref=e231]: Road witness
                - generic [ref=e232]: Surveyor · 20 coin · 1 upkeep
                - generic [ref=e233]: A travelling surveyor who charts terrain from an escorted camp. Surveys preserve geographic knowledge, not the positions of unseen foreign troops.
            - button "Appoint March engineer" [ref=e234] [cursor=pointer]:
              - generic [ref=e237]:
                - strong [ref=e238]: March engineer
                - generic [ref=e239]: Engineer · 28 coin · 2 upkeep
                - generic [ref=e240]: A field specialist who must travel with an army. Refits replenish real formation losses; siege sabotage trades coin and exposure for damage to defenses.
            - button "Appoint Waykeeper" [ref=e241] [cursor=pointer]:
              - generic [ref=e242]:
                - generic [aria-hidden] [ref=e243]:
                  - generic [aria-hidden] [ref=e244]: ♟
                  - generic [aria-hidden] [ref=e245]: Generic
                - generic [ref=e246]:
                  - strong [ref=e247]: Waykeeper
                  - generic [ref=e248]: Waykeeper · 40 coin · 3 upkeep
                  - generic [ref=e249]: A paid travelling practitioner with personal Flame and Rune aptitude. Researched Cinder thread and Bound ward consume limited battle strain. Occupies a companion slot, not an army command.
          - button "Open character roster" [ref=e250] [cursor=pointer]
        - button "Manage Aven Ashwell · ready" [ref=e251] [cursor=pointer]
        - generic [ref=e252]:
          - generic [ref=e253]: Selected hex 488
          - paragraph [ref=e254]: Steppe · Plains · fertility 75 · in sight
        - paragraph [ref=e255]: Claimed land · Ashen Compact · Ashen Hearth
  - contentinfo [ref=e256]:
    - generic [ref=e259]:
      - generic [ref=e260]: Selected settlement
      - strong [ref=e261]: Ashen Hearth
      - generic [ref=e262]: 1 people · 0 queued projects
      - generic [ref=e263]:
        - button "Show selected orders" [ref=e264] [cursor=pointer]
        - button "Show on map" [ref=e265] [cursor=pointer]
    - region "Next-action navigation" [ref=e266]:
      - paragraph [ref=e267]: 2 needing orders · 1 idle settlements
      - generic [ref=e268]:
        - button "Previous army needing orders" [ref=e269] [cursor=pointer]: ‹
        - button "Next army needing orders" [ref=e270] [cursor=pointer]: Next army N
        - button "Previous idle settlement" [ref=e271] [cursor=pointer]: ‹
        - button "Next idle settlement" [ref=e272] [cursor=pointer]: Next town S
      - status
    - generic [ref=e273]:
      - generic [ref=e274]:
        - generic [ref=e275]: AGE OF FRACTURE
        - strong [ref=e276]: Turn 1
      - button "End turn" [ref=e277] [cursor=pointer]:
        - text: End turn
        - generic [ref=e278]: E
    - status [ref=e279]:
      - generic [aria-hidden] [ref=e280]: ◆
      - text: Aven Ashwell was appointed Waykeeper for 40 coin. Autosaved.
  - dialog [ref=e281]:
    - generic [ref=e282]:
      - generic [ref=e283]:
        - generic [ref=e284]: Those who carry the oath
        - heading "Characters & agents" [level=2] [ref=e285]
      - button "Close characters" [ref=e286] [cursor=pointer]: Close ×
    - generic [ref=e287]:
      - generic [ref=e288]:
        - text: Search characters
        - searchbox "Search characters" [ref=e289]
      - generic [ref=e290]:
        - text: Character status
        - combobox "Character status" [ref=e291]:
          - option "All statuses" [selected]
          - option "Ready"
          - option "On mission"
          - option "Wounded"
          - option "Memorials"
      - generic [ref=e292]:
        - text: Character role
        - combobox "Character role" [ref=e293]:
          - option "All roles" [selected]
          - option "Marshal"
          - option "Surveyor"
          - option "Engineer"
          - option "Waykeeper"
    - generic [ref=e294]:
      - generic [ref=e295]:
        - navigation "Character roster" [ref=e296]:
          - button "Inspect Aven Ashwell (character.10)" [active] [pressed] [ref=e297] [cursor=pointer]:
            - generic [aria-hidden] [ref=e298]:
              - generic [aria-hidden] [ref=e299]: ♟
              - generic [aria-hidden] [ref=e300]: Generic
            - strong [ref=e301]: Aven Ashwell
            - generic [ref=e302]: Waykeeper · ready · rank 1
            - generic [ref=e303]: Ashen Hearth
        - generic [ref=e304]:
          - button "Previous characters" [disabled] [ref=e305]: Previous
          - generic [ref=e306]: 1 records · 1 / 1
          - button "Next characters" [disabled] [ref=e307]: Next
      - region "Selected character" [ref=e308]:
        - generic [ref=e309]:
          - generic [ref=e310]:
            - img "Aven Ashwell, Waykeeper · generic presentation. No approved visual family is bound to this faction definition." [ref=e311]:
              - generic [aria-hidden] [ref=e312]: ♟
              - generic [aria-hidden] [ref=e313]: Generic
            - generic [ref=e314]:
              - heading "Aven Ashwell" [level=3] [ref=e315]
              - paragraph [ref=e316]: Waykeeper · character.10Ashen Hearth · hex 488
          - button "Locate character" [ref=e317] [cursor=pointer]
        - generic [ref=e318]:
          - generic [ref=e319]:
            - term [ref=e320]: Condition
            - definition [ref=e321]: ready
          - generic [ref=e322]:
            - term [ref=e323]: Available experience
            - definition [ref=e324]: 0 · rank 1
          - generic [ref=e325]:
            - term [ref=e326]: Specialization
            - definition [ref=e327]: Not chosen
        - region "Personal magical aptitude" [ref=e328]:
          - heading "Personal paths" [level=4] [ref=e329]
          - paragraph [ref=e330]: Flame 1 · Rune 1
          - paragraph [ref=e331]: National research does not grant these personal paths.
          - paragraph [ref=e332]: "Known workings: None researched for this practitioner."
        - heading "Army attachment" [level=4] [ref=e333]
        - paragraph [ref=e334]: Appointments and transfers normally require the same hex. Officers can board an adjacent owned fleet from a harbor when the listed permission allows it, spending fleet movement. An army or fleet has one marshal and up to two agents. Review the destination and any restriction before changing an assignment.
        - generic [ref=e335]:
          - generic [ref=e336]:
            - generic [ref=e337]:
              - text: Assign to army
              - combobox "Assign to army" [ref=e338]:
                - option "Witness column · army.2" [selected]
                - option "Reserve escort · army.9"
            - button "Assign character" [ref=e339] [cursor=pointer]
          - generic [ref=e340]:
            - generic [ref=e341]:
              - text: Return to settlement
              - combobox "Return to settlement" [ref=e342]:
                - option "Ashen Hearth" [selected]
            - paragraph [ref=e343]: This character is not attached to an army.
            - button "Return character" [disabled] [ref=e344]
    - status [ref=e345]: Aven Ashwell was appointed Waykeeper for 40 coin. Autosaved.
  - generic [ref=e346]:
    - button "Art Lab" [ref=e347] [cursor=pointer]
    - generic [ref=e348]: Development asset inspector
```

# Test source

```ts
  1  | import { expect, test, type Page, type TestInfo } from '@playwright/test';
  2  | import { readFile } from 'node:fs/promises';
  3  | import { deserializeGame, serializeGame, type GameState } from '@theandril/sim';
  4  | import { exportSave } from '@theandril/persistence';
  5  | import { characterCampaign, CHARACTER_FIXTURE as C } from '../../packages/test-fixtures/src/character-fixture';
  6  | import { closeCampaignOptions, closeManagement, openSelectedOrders, selectFromRegistry } from './ui-navigation';
  7  | 
  8  | async function importCampaign(page: Page, state: GameState) {
  9  |   await page.locator('input[type=file]').setInputFiles({ name: 'hermes-ui-slice.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  10 |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  11 | }
  12 | async function evidence(info: TestInfo, name: string, value: unknown) {
  13 |   await info.attach(name, { body: JSON.stringify(value, null, 2), contentType: 'application/json' });
  14 | }
  15 | 
  16 | for (const definitionId of ['faction.ashen_compact', 'faction.reedbound_council']) {
  17 |   test(`R18 paid Waykeeper resolves shared art for ${definitionId}`, async ({ page }, info) => {
  18 |     const consoleMessages: string[] = [], errors: string[] = [], requests: string[] = [];
  19 |     page.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') consoleMessages.push(message.text()); });
  20 |     page.on('pageerror', error => errors.push(error.message));
  21 |     page.on('request', request => { if (/\/art\/.*\.png/.test(request.url())) requests.push(new URL(request.url()).pathname); });
  22 |     // Authored funded/infrastructure fixture, not a natural campaign. Appointment,
  23 |     // attachment and all inspection below use public controls; no debug mutations.
  24 |     const game = characterCampaign();
  25 |     game.factions[0]!.definitionId = definitionId;
  26 |     game.settlements[C.homeId]!.buildings.push('building.archive');
  27 |     const validated = deserializeGame(serializeGame(game));
  28 |     const catalog = JSON.parse(await readFile('apps/web/public/art/catalog.json', 'utf8'));
  29 |     const asset = catalog.assets.find((item: { id: string }) => item.id === 'character.waykeeper');
  30 |     const atlas = catalog.atlases.find((item: { id: string }) => item.id === asset.atlasId);
  31 |     expect(atlas.width * atlas.height * 4).toBe(4 * 1024 * 1024);
  32 |     await page.goto('/'); await importCampaign(page, validated);
  33 |     await selectFromRegistry(page, 'settlements', C.homeName); await openSelectedOrders(page);
  34 |     await page.getByTestId('character-appointments').locator('summary').click();
  35 |     const before = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.treasury);
  36 |     await page.getByRole('button', { name: 'Appoint Waykeeper', exact: true }).click();
  37 |     await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.characters.filter(item => item.definitionId === 'character.waykeeper').length)).toBe(1);
  38 |     expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.treasury)).toBe(before - 40);
  39 |     await page.getByRole('button', { name: 'Open character roster', exact: true }).click();
  40 |     const caster = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.characters.find(item => item.definitionId === 'character.waykeeper')!);
  41 |     const roster = page.getByRole('dialog', { name: 'Characters & agents', exact: true });
  42 |     await roster.getByRole('button', { name: `Inspect ${caster.name} (${caster.id})`, exact: true }).click();
  43 |     const art = roster.locator('[data-art-content-id="character.waykeeper"]');
  44 |     await expect(art).toHaveCount(2);
  45 |     for (const icon of await art.all()) {
> 46 |       await expect(icon).toHaveAttribute('data-art-state', 'shared');
     |                          ^ Error: expect(locator).toHaveAttribute(expected) failed
  47 |       await expect(icon).toHaveAttribute('data-art-rendered-id', 'character.waykeeper');
  48 |       await expect(icon).toHaveAccessibleName(/shared Waykeeper silhouette/);
  49 |       await expect(icon).not.toContainText('Generic');
  50 |     }
  51 |     await roster.screenshot({ path: info.outputPath('waykeeper-paid-desktop.png') });
  52 |     const hash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  53 |     await page.setViewportSize({ width: 390, height: 844 });
  54 |     await roster.getByRole('combobox', { name: 'Assign to army', exact: true }).selectOption(C.armyId);
  55 |     await roster.getByRole('button', { name: 'Assign character', exact: true }).click();
  56 |     await expect.poll(() => page.evaluate(id => window.__THEANDRIL__!.getSummary()!.characters.find(item => item.id === id)?.location, caster.id)).toEqual({ kind: 'army', armyId: C.armyId });
  57 |     expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).not.toBe(hash);
  58 |     expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  59 |     await roster.screenshot({ path: info.outputPath('waykeeper-assigned-390.png') });
  60 |     await roster.getByRole('button', { name: 'Close characters', exact: true }).click();
  61 |     await closeManagement(page); await closeCampaignOptions(page);
  62 |     await page.getByRole('button', { name: 'Characters & agents', exact: true }).click();
  63 |     await expect(roster.locator('[data-art-content-id="character.waykeeper"][data-art-state="shared"]').first()).toBeVisible();
  64 |     expect(requests.filter(url => url === atlas.imageUrl)).toHaveLength(1);
  65 |     const otherBattlePages = catalog.atlases.filter((item: { id: string }) => item.id.startsWith('battle') && item.id !== atlas.id);
  66 |     for (const other of otherBattlePages) expect(requests).not.toContain(other.imageUrl);
  67 |     expect(errors).toEqual([]);
  68 |     await evidence(info, 'waykeeper-evidence', { definitionId, caster, paidCoin: 40, atlas, requests, consoleMessages, errors });
  69 |   });
  70 | }
  71 | 
```