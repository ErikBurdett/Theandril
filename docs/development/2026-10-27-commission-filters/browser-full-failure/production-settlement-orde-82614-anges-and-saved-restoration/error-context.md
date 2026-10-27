# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: production/settlement-order-filters.spec.ts >> production settlement orders locate waiting charters across thirty hearths and preserve queues through explicit group changes and saved restoration
- Location: tests/production/settlement-order-filters.spec.ts:10:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('How these filters work', { exact: true }).locator('..').locator('p')
Expected: visible
Error: strict mode violation: getByText('How these filters work', { exact: true }).locator('..').locator('p') resolved to 2 elements:
    1) <p>Counts overlap and follow your search. No product…</p> aka getByText('Counts overlap and follow')
    2) <p>Land commission counts follow your search and Set…</p> aka getByText('Land commission counts follow')

Call log:
  - Expect "toBeVisible" getByText('How these filters work', { exact: true }).locator('..').locator('p') with timeout 5000ms
  - waiting for getByText('How these filters work', { exact: true }).locator('..').locator('p')

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
          - strong [ref=e20]: 3940 coin
        - generic [ref=e21]:
          - generic [ref=e22]: KNOWLEDGE
          - strong [ref=e23]: "31"
        - generic [ref=e24]:
          - generic [ref=e25]: HEARTHS
          - strong [ref=e26]: "30"
    - navigation "Campaign navigation" [ref=e27]:
      - generic [ref=e28]:
        - text: Standard pace ·
        - generic [ref=e29]: 32 realms
      - generic [ref=e30]: Partial archive · earlier history unavailable
    - group [ref=e31]:
      - generic "Campaign & settings" [ref=e32] [cursor=pointer]
  - main [ref=e33]:
    - region "Strategic map" [ref=e34]:
      - generic: SEED 20260905 · 512 × 384Legacy geography
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
          - tab "Armies 128" [ref=e90] [cursor=pointer]
          - tab "Settlements 30" [selected] [ref=e91] [cursor=pointer]
        - button "Characters & agents" [ref=e92] [cursor=pointer]: Characters 0
      - generic [ref=e93]:
        - text: Search your realm
        - searchbox "Search your realm" [ref=e94]
      - tabpanel "Settlements 30" [ref=e95]:
        - generic [ref=e96]:
          - generic [ref=e98]:
            - text: Settlement orders
            - combobox "Settlement orders" [ref=e99]:
              - option "All hearths (30)" [selected]
              - option "No production (24)"
              - option "Without charters (10)"
              - option "Charters waiting (5)"
          - generic [ref=e101]:
            - text: Land commission status
            - combobox "Land commission status" [ref=e102]:
              - option "All hearths (30)" [selected]
              - option "With commissions (0)"
              - option "Without commissions (30)"
              - option "Zero allowance (0)"
              - option "Reported waits (0)"
          - group [ref=e103]:
            - generic "How these filters work" [active] [ref=e104] [cursor=pointer]
            - paragraph [ref=e105]: Counts overlap and follow your search. No production includes hearths waiting for a charter’s next turn; Without charters can include queued work. Charters waiting includes budget limits and completed building programs, not just problems. Current queues come first; next-work candidates share the treasury and are not guaranteed purchases.
            - paragraph [ref=e106]: Land commission counts follow your search and Settlement orders filter. Zero allowance includes hearths with paid work still underway. Reported waits includes pauses such as paid work already underway; it does not list every affordability or land-suitability limit. No reported wait does not guarantee an affordable or suitable job. Select a hearth for its exact commission details.
          - generic [ref=e107]:
            - generic [ref=e108]:
              - text: Registry order
              - combobox "Registry order" [ref=e109]:
                - option "Stable order" [selected]
                - option "Name A–Z"
            - generic [ref=e110]: 30 towns
          - group [ref=e111]:
            - generic "Saved hearth groups" [ref=e112] [cursor=pointer]
            - option "Choose a saved hearth group" [selected]
            - option "Frontier works"
            - option "Realm works"
          - region "Group hearth charters" [ref=e113]:
            - generic [ref=e114]:
              - button "Select matching hearths" [ref=e115] [cursor=pointer]
              - button "Clear hearth selection" [disabled] [ref=e116]
            - status [ref=e117]: 0 hearths selected
            - paragraph [ref=e118]: Check hearths to give them standing charters together. Select up to 128 at a time; page, search and registry changes keep your selection.
          - group [ref=e119]:
            - generic "Worker policies" [ref=e120]
            - option "Balanced" [selected]
            - option "Food"
            - option "Industry"
            - option "Coin"
            - option "Knowledge"
          - group [ref=e121]:
            - generic "Land commissions" [ref=e122] [cursor=pointer]
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
          - group [ref=e123]:
            - generic "Production sequences" [ref=e124] [cursor=pointer]
            - option "Root cellar · 8 coin" [selected]
            - option "Cinder workshop · 12 coin"
            - option "Charter market · 10 coin"
            - option "Witness archive · 12 coin"
            - option "Charter harbor · 20 coin"
            - option "Hearth caravan · 16 coin"
            - option "Wayfinder · 8 coin"
            - option "Oath guard · 12 coin"
            - option "Ash pike company · 10 coin"
            - option "Cinder plate cohort · 22 coin"
            - option "Charter outriders · 18 coin"
            - option "Charter transport · 24 coin"
            - option "Coastwatch galley · 30 coin"
            - option "Deepwake warship · 48 coin"
            - option "Reed skirmishers · 14 coin"
            - option "Witness arbalesters · 22 coin"
            - option "Kiln halberdiers · 28 coin"
            - option "Road lancers · 32 coin"
          - generic [ref=e125]:
            - generic [ref=e126]:
              - checkbox "Select Frontier reserve for group orders" [ref=e128]
              - button "Frontier reserve 9 people · Root cellar Direct orders · No charter." [ref=e129] [cursor=pointer]:
                - generic [aria-hidden] [ref=e130]: ⌂
                - generic [ref=e131]:
                  - strong [ref=e132]: Frontier reserve
                  - generic [ref=e133]: 9 people · Root cellar
                  - generic [ref=e134]: Direct orders · No charter.
                - generic [aria-hidden] [ref=e135]: ›
            - generic [ref=e136]:
              - checkbox "Select Frontier west for group orders" [ref=e138]
              - button "Frontier west 9 people · Oath guard Direct orders · No charter." [ref=e139] [cursor=pointer]:
                - generic [aria-hidden] [ref=e140]: ⌂
                - generic [ref=e141]:
                  - strong [ref=e142]: Frontier west
                  - generic [ref=e143]: 9 people · Oath guard
                  - generic [ref=e144]: Direct orders · No charter.
                - generic [aria-hidden] [ref=e145]: ›
            - generic [ref=e146]:
              - checkbox "Select Frontier east for group orders" [ref=e148]
              - button "Frontier east 9 people · No production Direct orders · No charter." [ref=e149] [cursor=pointer]:
                - generic [aria-hidden] [ref=e150]: ⌂
                - generic [ref=e151]:
                  - strong [ref=e152]: Frontier east
                  - generic [ref=e153]: 9 people · No production
                  - generic [ref=e154]: Direct orders · No charter.
                - generic [aria-hidden] [ref=e155]: ›
            - generic [ref=e156]:
              - checkbox "Select Delegated hearth 04 for group orders" [ref=e158]
              - button "Delegated hearth 04 9 people · No production Direct orders · No charter." [ref=e159] [cursor=pointer]:
                - generic [aria-hidden] [ref=e160]: ⌂
                - generic [ref=e161]:
                  - strong [ref=e162]: Delegated hearth 04
                  - generic [ref=e163]: 9 people · No production
                  - generic [ref=e164]: Direct orders · No charter.
                - generic [aria-hidden] [ref=e165]: ›
            - generic [ref=e166]:
              - checkbox "Select Delegated hearth 05 for group orders" [ref=e168]
              - button "Delegated hearth 05 9 people · No production Direct orders · No charter." [ref=e169] [cursor=pointer]:
                - generic [aria-hidden] [ref=e170]: ⌂
                - generic [ref=e171]:
                  - strong [ref=e172]: Delegated hearth 05
                  - generic [ref=e173]: 9 people · No production
                  - generic [ref=e174]: Direct orders · No charter.
                - generic [aria-hidden] [ref=e175]: ›
            - generic [ref=e176]:
              - checkbox "Select Delegated hearth 06 for group orders" [ref=e178]
              - button "Delegated hearth 06 9 people · No production Direct orders · No charter." [ref=e179] [cursor=pointer]:
                - generic [aria-hidden] [ref=e180]: ⌂
                - generic [ref=e181]:
                  - strong [ref=e182]: Delegated hearth 06
                  - generic [ref=e183]: 9 people · No production
                  - generic [ref=e184]: Direct orders · No charter.
                - generic [aria-hidden] [ref=e185]: ›
            - generic [ref=e186]:
              - checkbox "Select Delegated hearth 07 for group orders" [ref=e188]
              - button "Delegated hearth 07 9 people · No production Direct orders · No charter." [ref=e189] [cursor=pointer]:
                - generic [aria-hidden] [ref=e190]: ⌂
                - generic [ref=e191]:
                  - strong [ref=e192]: Delegated hearth 07
                  - generic [ref=e193]: 9 people · No production
                  - generic [ref=e194]: Direct orders · No charter.
                - generic [aria-hidden] [ref=e195]: ›
            - generic [ref=e196]:
              - checkbox "Select Delegated hearth 08 for group orders" [ref=e198]
              - button "Delegated hearth 08 9 people · No production Direct orders · No charter." [ref=e199] [cursor=pointer]:
                - generic [aria-hidden] [ref=e200]: ⌂
                - generic [ref=e201]:
                  - strong [ref=e202]: Delegated hearth 08
                  - generic [ref=e203]: 9 people · No production
                  - generic [ref=e204]: Direct orders · No charter.
                - generic [aria-hidden] [ref=e205]: ›
            - generic [ref=e206]:
              - checkbox "Select Delegated hearth 09 for group orders" [ref=e208]
              - button "Delegated hearth 09 9 people · No production Direct orders · No charter." [ref=e209] [cursor=pointer]:
                - generic [aria-hidden] [ref=e210]: ⌂
                - generic [ref=e211]:
                  - strong [ref=e212]: Delegated hearth 09
                  - generic [ref=e213]: 9 people · No production
                  - generic [ref=e214]: Direct orders · No charter.
                - generic [aria-hidden] [ref=e215]: ›
            - generic [ref=e216]:
              - checkbox "Select Delegated hearth 10 for group orders" [ref=e218]
              - button "Delegated hearth 10 9 people · No production Direct orders · No charter." [ref=e219] [cursor=pointer]:
                - generic [aria-hidden] [ref=e220]: ⌂
                - generic [ref=e221]:
                  - strong [ref=e222]: Delegated hearth 10
                  - generic [ref=e223]: 9 people · No production
                  - generic [ref=e224]: Direct orders · No charter.
                - generic [aria-hidden] [ref=e225]: ›
            - generic [ref=e226]:
              - checkbox "Select Delegated hearth 11 for group orders" [ref=e228]
              - button "Delegated hearth 11 9 people · Oath guard Muster charter · 24 coin per work · Current queue comes first." [ref=e229] [cursor=pointer]:
                - generic [aria-hidden] [ref=e230]: ⌂
                - generic [ref=e231]:
                  - strong [ref=e232]: Delegated hearth 11
                  - generic [ref=e233]: 9 people · Oath guard
                  - generic [ref=e234]: Muster charter · 24 coin per work · Current queue comes first.
                - generic [aria-hidden] [ref=e235]: ›
            - generic [ref=e236]:
              - checkbox "Select Delegated hearth 12 for group orders" [ref=e238]
              - button "Delegated hearth 12 9 people · Oath guard Muster charter · 24 coin per work · Current queue comes first." [ref=e239] [cursor=pointer]:
                - generic [aria-hidden] [ref=e240]: ⌂
                - generic [ref=e241]:
                  - strong [ref=e242]: Delegated hearth 12
                  - generic [ref=e243]: 9 people · Oath guard
                  - generic [ref=e244]: Muster charter · 24 coin per work · Current queue comes first.
                - generic [aria-hidden] [ref=e245]: ›
            - generic [ref=e246]:
              - checkbox "Select Delegated hearth 13 for group orders" [ref=e248]
              - button "Delegated hearth 13 9 people · Oath guard Muster charter · 24 coin per work · Current queue comes first." [ref=e249] [cursor=pointer]:
                - generic [aria-hidden] [ref=e250]: ⌂
                - generic [ref=e251]:
                  - strong [ref=e252]: Delegated hearth 13
                  - generic [ref=e253]: 9 people · Oath guard
                  - generic [ref=e254]: Muster charter · 24 coin per work · Current queue comes first.
                - generic [aria-hidden] [ref=e255]: ›
            - generic [ref=e256]:
              - checkbox "Select Delegated hearth 14 for group orders" [ref=e258]
              - button "Delegated hearth 14 9 people · Oath guard Muster charter · 24 coin per work · Current queue comes first." [ref=e259] [cursor=pointer]:
                - generic [aria-hidden] [ref=e260]: ⌂
                - generic [ref=e261]:
                  - strong [ref=e262]: Delegated hearth 14
                  - generic [ref=e263]: 9 people · Oath guard
                  - generic [ref=e264]: Muster charter · 24 coin per work · Current queue comes first.
                - generic [aria-hidden] [ref=e265]: ›
            - generic [ref=e266]:
              - checkbox "Select Delegated hearth 15 for group orders" [ref=e268]
              - 'button "Delegated hearth 15 9 people · No production Muster charter · 24 coin per work · Next candidate: Cinder plate cohort." [ref=e269] [cursor=pointer]':
                - generic [aria-hidden] [ref=e270]: ⌂
                - generic [ref=e271]:
                  - strong [ref=e272]: Delegated hearth 15
                  - generic [ref=e273]: 9 people · No production
                  - generic [ref=e274]: "Muster charter · 24 coin per work · Next candidate: Cinder plate cohort."
                - generic [aria-hidden] [ref=e275]: ›
            - generic [ref=e276]:
              - checkbox "Select Delegated hearth 16 for group orders" [ref=e278]
              - 'button "Delegated hearth 16 9 people · No production Muster charter · 24 coin per work · Next candidate: Cinder plate cohort." [ref=e279] [cursor=pointer]':
                - generic [aria-hidden] [ref=e280]: ⌂
                - generic [ref=e281]:
                  - strong [ref=e282]: Delegated hearth 16
                  - generic [ref=e283]: 9 people · No production
                  - generic [ref=e284]: "Muster charter · 24 coin per work · Next candidate: Cinder plate cohort."
                - generic [aria-hidden] [ref=e285]: ›
            - generic [ref=e286]:
              - checkbox "Select Delegated hearth 17 for group orders" [ref=e288]
              - 'button "Delegated hearth 17 9 people · No production Muster charter · 24 coin per work · Next candidate: Cinder plate cohort." [ref=e289] [cursor=pointer]':
                - generic [aria-hidden] [ref=e290]: ⌂
                - generic [ref=e291]:
                  - strong [ref=e292]: Delegated hearth 17
                  - generic [ref=e293]: 9 people · No production
                  - generic [ref=e294]: "Muster charter · 24 coin per work · Next candidate: Cinder plate cohort."
                - generic [aria-hidden] [ref=e295]: ›
            - generic [ref=e296]:
              - checkbox "Select Delegated hearth 18 for group orders" [ref=e298]
              - 'button "Delegated hearth 18 9 people · No production Muster charter · 24 coin per work · Next candidate: Cinder plate cohort." [ref=e299] [cursor=pointer]':
                - generic [aria-hidden] [ref=e300]: ⌂
                - generic [ref=e301]:
                  - strong [ref=e302]: Delegated hearth 18
                  - generic [ref=e303]: 9 people · No production
                  - generic [ref=e304]: "Muster charter · 24 coin per work · Next candidate: Cinder plate cohort."
                - generic [aria-hidden] [ref=e305]: ›
            - generic [ref=e306]:
              - checkbox "Select Delegated hearth 19 for group orders" [ref=e308]
              - 'button "Delegated hearth 19 9 people · No production Muster charter · 24 coin per work · Next candidate: Cinder plate cohort." [ref=e309] [cursor=pointer]':
                - generic [aria-hidden] [ref=e310]: ⌂
                - generic [ref=e311]:
                  - strong [ref=e312]: Delegated hearth 19
                  - generic [ref=e313]: 9 people · No production
                  - generic [ref=e314]: "Muster charter · 24 coin per work · Next candidate: Cinder plate cohort."
                - generic [aria-hidden] [ref=e315]: ›
            - generic [ref=e316]:
              - checkbox "Select Delegated hearth 20 for group orders" [ref=e318]
              - 'button "Delegated hearth 20 9 people · No production Muster charter · 24 coin per work · Next candidate: Cinder plate cohort." [ref=e319] [cursor=pointer]':
                - generic [aria-hidden] [ref=e320]: ⌂
                - generic [ref=e321]:
                  - strong [ref=e322]: Delegated hearth 20
                  - generic [ref=e323]: 9 people · No production
                  - generic [ref=e324]: "Muster charter · 24 coin per work · Next candidate: Cinder plate cohort."
                - generic [aria-hidden] [ref=e325]: ›
            - generic [ref=e326]:
              - checkbox "Select Delegated hearth 21 for group orders" [ref=e328]
              - 'button "Delegated hearth 21 9 people · No production Muster charter · 24 coin per work · Next candidate: Cinder plate cohort." [ref=e329] [cursor=pointer]':
                - generic [aria-hidden] [ref=e330]: ⌂
                - generic [ref=e331]:
                  - strong [ref=e332]: Delegated hearth 21
                  - generic [ref=e333]: 9 people · No production
                  - generic [ref=e334]: "Muster charter · 24 coin per work · Next candidate: Cinder plate cohort."
                - generic [aria-hidden] [ref=e335]: ›
            - generic [ref=e336]:
              - checkbox "Select Delegated hearth 22 for group orders" [ref=e338]
              - 'button "Delegated hearth 22 9 people · No production Muster charter · 24 coin per work · Next candidate: Cinder plate cohort." [ref=e339] [cursor=pointer]':
                - generic [aria-hidden] [ref=e340]: ⌂
                - generic [ref=e341]:
                  - strong [ref=e342]: Delegated hearth 22
                  - generic [ref=e343]: 9 people · No production
                  - generic [ref=e344]: "Muster charter · 24 coin per work · Next candidate: Cinder plate cohort."
                - generic [aria-hidden] [ref=e345]: ›
            - generic [ref=e346]:
              - checkbox "Select Delegated hearth 23 for group orders" [ref=e348]
              - 'button "Delegated hearth 23 9 people · No production Muster charter · 24 coin per work · Next candidate: Cinder plate cohort." [ref=e349] [cursor=pointer]':
                - generic [aria-hidden] [ref=e350]: ⌂
                - generic [ref=e351]:
                  - strong [ref=e352]: Delegated hearth 23
                  - generic [ref=e353]: 9 people · No production
                  - generic [ref=e354]: "Muster charter · 24 coin per work · Next candidate: Cinder plate cohort."
                - generic [aria-hidden] [ref=e355]: ›
            - generic [ref=e356]:
              - checkbox "Select Delegated hearth 24 for group orders" [ref=e358]
              - 'button "Delegated hearth 24 9 people · No production Muster charter · 24 coin per work · Next candidate: Cinder plate cohort." [ref=e359] [cursor=pointer]':
                - generic [aria-hidden] [ref=e360]: ⌂
                - generic [ref=e361]:
                  - strong [ref=e362]: Delegated hearth 24
                  - generic [ref=e363]: 9 people · No production
                  - generic [ref=e364]: "Muster charter · 24 coin per work · Next candidate: Cinder plate cohort."
                - generic [aria-hidden] [ref=e365]: ›
            - generic [ref=e366]:
              - checkbox "Select Delegated hearth 25 for group orders" [ref=e368]
              - 'button "Delegated hearth 25 9 people · No production Muster charter · 24 coin per work · Next candidate: Cinder plate cohort." [ref=e369] [cursor=pointer]':
                - generic [aria-hidden] [ref=e370]: ⌂
                - generic [ref=e371]:
                  - strong [ref=e372]: Delegated hearth 25
                  - generic [ref=e373]: 9 people · No production
                  - generic [ref=e374]: "Muster charter · 24 coin per work · Next candidate: Cinder plate cohort."
                - generic [aria-hidden] [ref=e375]: ›
          - navigation "Registry pages" [ref=e376]:
            - button "Previous registry page" [disabled] [ref=e377]: ←
            - generic [ref=e378]: Page 1 of 2
            - button "Next registry page" [ref=e379] [cursor=pointer]: →
      - paragraph [ref=e380]: Choose an entry to locate it on the map. Use the bottom command tray for its orders.
  - contentinfo [ref=e381]:
    - generic [ref=e384]:
      - generic [ref=e385]: Selected army
      - strong [ref=e386]: Northern relief interrupted
      - generic [ref=e387]: 1 / 12 formations · 60 strength · 2 movement
      - generic [ref=e388]:
        - button "Show selected orders" [ref=e389] [cursor=pointer]
        - button "Show on map" [ref=e390] [cursor=pointer]
    - region "Next-action navigation" [ref=e391]:
      - paragraph [ref=e392]: 15 needing orders · 13 idle settlements
      - generic [ref=e393]:
        - button "Previous army needing orders" [ref=e394] [cursor=pointer]: ‹
        - button "Next army needing orders" [ref=e395] [cursor=pointer]: Next army N
        - button "Previous idle settlement" [ref=e396] [cursor=pointer]: ‹
        - button "Next idle settlement" [ref=e397] [cursor=pointer]: Next town S
      - paragraph [ref=e398]: "Labor: 270 unassigned households · 30 settlements"
      - generic [ref=e399]:
        - button "Previous settlement with unassigned households" [ref=e400] [cursor=pointer]: ‹
        - button "Next settlement with unassigned households" [ref=e401] [cursor=pointer]: Review households
      - group [ref=e402]:
        - generic "What wants a decision 5 kinds" [ref=e403] [cursor=pointer]:
          - text: What wants a decision
          - generic [ref=e404]: 5 kinds
      - status
    - generic [ref=e405]:
      - generic [ref=e406]:
        - generic [ref=e407]: AGE OF FRACTURE
        - strong [ref=e408]: Turn 2
      - button "End turn" [ref=e409] [cursor=pointer]:
        - text: End turn
        - generic [ref=e410]: E
    - status [ref=e411]:
      - generic [aria-hidden] [ref=e412]: ◆
      - text: "Imported campaign. Partial archive: earlier campaign history was not recorded in this save."
```

# Test source

```ts
  1   | import { mkdirSync, writeFileSync } from 'node:fs';
  2   | import { expect, test } from '@playwright/test';
  3   | import { resumeJournal } from '@theandril/chronicle';
  4   | import { deserializeGame, serializeGame, stateHash, type GameCommand } from '@theandril/sim';
  5   | import { exportSave, serializeCampaign } from '@theandril/persistence';
  6   | import { settlementOrderScene } from '../gameplay/settlement-order-fixture';
  7   | import { campaignMenu, exportedTravel } from '../gameplay/group-movement-fixture';
  8   | import { openRegistry, openSelectedOrders } from '../gameplay/ui-navigation';
  9   | 
  10  | test('production settlement orders locate waiting charters across thirty hearths and preserve queues through explicit group changes and saved restoration', async ({ page }, testInfo) => {
  11  |   mkdirSync(testInfo.outputDir, { recursive: true });
  12  |   const fixture = settlementOrderScene();
  13  |   const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  14  |   await page.goto('./');
  15  |   expect(await page.evaluate(() => '__THEANDRIL__' in window)).toBe(false);
  16  |   await page.getByLabel('Import save file').setInputFiles({
  17  |     name: 'authored-thirty-hearth-orders.theandril', mimeType: 'application/gzip',
  18  |     buffer: Buffer.from(await exportSave(serializeCampaign(fixture.game, fixture.archive))),
  19  |   });
  20  |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  21  |   let window = await openRegistry(page, 'settlements');
  22  |   const filter = page.getByRole('combobox', { name: 'Settlement orders', exact: true });
  23  |   const registry = page.getByTestId('settlement-registry'), group = page.getByTestId('group-charters');
  24  |   const search = page.getByRole('searchbox', { name: 'Search your realm', exact: true });
  25  |   const firstWaiting = fixture.waiting[0]!, queuedDirect = fixture.direct[0]!;
  26  |   const waitingRow = registry.getByRole('button', { name: new RegExp(firstWaiting.name) });
  27  |   await expect(filter).toHaveValue('all');
  28  |   await expect(filter.locator('option')).toHaveText(['All hearths (30)', 'No production (24)', 'Without charters (10)', 'Charters waiting (5)']);
  29  |   const help = page.getByText('How these filters work', { exact: true });
  30  |   await expect(help.locator('..')).not.toHaveAttribute('open', '');
  31  |   await help.focus(); await page.keyboard.press('Enter');
  32  |   await expect(help.locator('..')).toHaveAttribute('open', '');
  33  |   await expect(help.locator('..')).toContainText('Counts overlap');
  34  |   await expect(help.locator('..')).toContainText('not guaranteed purchases');
> 35  |   await expect(help.locator('..').locator('p')).toBeVisible();
      |                                                 ^ Error: expect(locator).toBeVisible() failed
  36  |   await page.keyboard.press('Enter');
  37  |   await expect(help.locator('..')).not.toHaveAttribute('open', '');
  38  |   // The last five stable-ID rows really lie beyond the first registry page.
  39  |   await filter.selectOption('empty'); await filter.selectOption('all');
  40  |   await expect(registry.getByRole('button')).toHaveCount(25);
  41  |   await expect(waitingRow).toHaveCount(0);
  42  |   await page.getByRole('button', { name: 'Next registry page', exact: true }).click();
  43  |   await expect(page.getByRole('navigation', { name: 'Registry pages', exact: true })).toContainText('Page 2 of 2');
  44  |   await expect(registry.getByRole('button')).toHaveCount(5);
  45  |   await expect(waitingRow).toBeVisible();
  46  | 
  47  |   // Native keyboard changes the cohort, retaining selection outside its rows.
  48  |   await filter.focus(); await page.keyboard.press('End'); await page.keyboard.press('Enter');
  49  |   await expect(filter).toHaveValue('waiting');
  50  |   await expect(registry.getByRole('button')).toHaveCount(5);
  51  |   await expect(registry).toContainText(fixture.waitingReason);
  52  |   await group.getByRole('button', { name: 'Select matching hearths', exact: true }).click();
  53  |   await expect(group).toContainText('5 hearths selected');
  54  |   await filter.selectOption('unchartered');
  55  |   await expect(registry.getByRole('button')).toHaveCount(10);
  56  |   await expect(group).toContainText('5 hearths selected · 5 outside this filter');
  57  |   await registry.getByRole('checkbox', { name: `Select ${queuedDirect.name} for group orders`, exact: true }).check();
  58  |   await filter.selectOption('waiting');
  59  |   await expect(group).toContainText('6 hearths selected · 1 outside this filter');
  60  |   await expect(registry.getByRole('checkbox', { checked: true })).toHaveCount(5);
  61  |   await waitingRow.scrollIntoViewIfNeeded();
  62  |   await page.screenshot({ path: testInfo.outputPath('settlement-waiting-desktop.png') });
  63  | 
  64  |   await search.fill(firstWaiting.name);
  65  |   await expect(filter.locator('option')).toHaveText(['All hearths (1)', 'No production (1)', 'Without charters (0)', 'Charters waiting (1)']);
  66  |   await expect(registry.getByRole('button')).toHaveCount(1);
  67  |   await expect(group).toContainText('6 hearths selected · 5 outside this filter');
  68  |   await search.fill('No such authored hearth');
  69  |   await expect(filter.locator('option')).toHaveText(['All hearths (0)', 'No production (0)', 'Without charters (0)', 'Charters waiting (0)']);
  70  |   await expect(registry).toContainText('No matching entries. Clear your search or filter.');
  71  |   await search.fill('');
  72  |   await page.getByRole('combobox', { name: 'Registry order', exact: true }).selectOption('name');
  73  |   await expect(registry.getByRole('button')).toHaveCount(5);
  74  |   await expect(group).toContainText('6 hearths selected · 1 outside this filter');
  75  |   await filter.selectOption('empty');
  76  |   await expect(registry.getByRole('button')).toHaveCount(24);
  77  |   // Empty production includes a charter's current candidate. It is not a
  78  |   // promise that shared funds will purchase that work on the next turn.
  79  |   await expect(registry.getByRole('button', { name: new RegExp(fixture.ready[0]!.name) })).toContainText(fixture.candidate);
  80  |   await expect(registry.getByRole('button', { name: new RegExp(queuedDirect.name) })).toHaveCount(0);
  81  |   await filter.selectOption('all');
  82  |   await search.fill(fixture.queuedCharters[0]!.name);
  83  |   const queuedCharter = registry.getByRole('button', { name: new RegExp(fixture.queuedCharters[0]!.name) });
  84  |   await expect(queuedCharter).toContainText('Current queue comes first.');
  85  |   await search.fill('');
  86  |   await filter.selectOption('waiting'); await waitingRow.click();
  87  |   await expect(window).toHaveCount(0);
  88  |   await expect(page.getByTestId('current-selection')).toContainText(firstWaiting.name);
  89  |   await openSelectedOrders(page);
  90  |   const charter = page.getByTestId('settlement-charter');
  91  |   await charter.locator(':scope > summary').click();
  92  |   await expect(charter).toContainText(fixture.waitingReason);
  93  |   const browsed = await exportedTravel(page);
  94  |   expect(stateHash(browsed.game)).toBe(fixture.hash);
  95  |   expect(browsed.archive).toEqual(fixture.archive);
  96  |   expect(serializeGame(browsed.game)).toBe(serializeGame(fixture.game));
  97  | 
  98  |   await campaignMenu(page);
  99  |   await page.getByRole('combobox', { name: 'Text scale', exact: true }).selectOption('1.3');
  100 |   await page.setViewportSize({ width: 390, height: 844 });
  101 |   window = await openRegistry(page, 'settlements');
  102 |   await expect(filter).toHaveValue('all');
  103 |   await filter.selectOption('unchartered');
  104 |   await registry.getByRole('checkbox', { name: `Select ${queuedDirect.name} for group orders`, exact: true }).check();
  105 |   await filter.selectOption('waiting');
  106 |   await group.getByRole('button', { name: 'Select matching hearths', exact: true }).click();
  107 |   await expect(group).toContainText('6 hearths selected · 1 outside this filter');
  108 |   await filter.scrollIntoViewIfNeeded();
  109 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  110 |   await page.screenshot({ path: testInfo.outputPath('settlement-waiting-narrow-130.png') });
  111 |   await filter.locator('..').screenshot({ path: testInfo.outputPath('settlement-order-selector-native.png') });
  112 |   await group.getByRole('combobox', { name: 'Charter focus', exact: true }).selectOption('muster');
  113 |   await group.getByRole('spinbutton', { name: 'Coin ceiling per hearth', exact: true }).fill('24');
  114 |   const locked = filter.evaluate(element => new Promise<boolean>((resolve, reject) => {
  115 |     const select = element as HTMLSelectElement;
  116 |     const observer = new MutationObserver(() => {
  117 |       if (select.disabled) { observer.disconnect(); clearTimeout(timeout); resolve(true); }
  118 |     });
  119 |     const timeout = setTimeout(() => { observer.disconnect(); reject(new Error('The settlement filter never reflected the real pending charter lock.')); }, 3000);
  120 |     observer.observe(select, { attributes: true, attributeFilter: ['disabled'] });
  121 |   }));
  122 |   await group.getByRole('button', { name: 'Apply charters (6)', exact: true }).click();
  123 |   expect(await locked).toBe(true);
  124 |   await expect(page.getByTestId('group-charter-results')).toContainText('6 orders accepted · 0 refused');
  125 |   await expect(filter).toBeEnabled();
  126 |   await expect(filter.locator('option')).toHaveText(['All hearths (30)', 'No production (24)', 'Without charters (9)', 'Charters waiting (0)']);
  127 |   await expect(group).toContainText('0 hearths selected');
  128 |   await expect(registry).toContainText('No matching entries. Clear your search or filter.');
  129 |   await filter.selectOption('empty');
  130 |   await expect(waitingRow).toContainText(fixture.candidate);
  131 |   await waitingRow.scrollIntoViewIfNeeded();
  132 |   await page.screenshot({ path: testInfo.outputPath('settlement-charters-ready-narrow-130.png') });
  133 |   const changed = await exportedTravel(page);
  134 |   const expected = deserializeGame(serializeGame(fixture.game)), expectedJournal = resumeJournal(expected, fixture.archive);
  135 |   const submittedIds = [queuedDirect.id, ...fixture.waiting.map(town => town.id)].sort();
```