# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: production-sequences.spec.ts >> forty hearths recall a personal ordered sequence, pay for one batch, retain individual control and restore saved queues
- Location: tests/gameplay/production-sequences.spec.ts:117:1

# Error details

```
Error: Test timeout of 45000ms exceeded
```

# Page snapshot

```yaml
- generic [ref=f2e3]:
  - button "Import save file"
  - generic [ref=f2e4]:
    - banner [ref=f2e5]:
      - heading "Theandril" [level=1] [ref=f2e8]
      - generic [ref=f2e9]:
        - generic [ref=f2e10]:
          - generic [ref=f2e11]: TREASURY
          - strong [ref=f2e12]: 249560 coin
        - generic [ref=f2e13]:
          - generic [ref=f2e14]: KNOWLEDGE
          - strong [ref=f2e15]: "0"
    - navigation "Campaign navigation" [ref=f2e16]:
      - generic [ref=f2e17]:
        - text: Standard pace ·
        - generic [ref=f2e18]: 40 realms
    - group [ref=f2e19]:
      - generic "Campaign & settings" [ref=f2e20] [cursor=pointer]
  - main [ref=f2e21]:
    - region "Strategic map" [ref=f2e22]:
      - generic "World map. Select an army then click a highlighted hex to move or an enemy to attack. Hover to preview routes. Drag to pan; scroll to zoom all the way to world overview. Arrow keys pan; plus and minus zoom. Focus selection returns to local detail. Enter opens map actions for the selection. Escape closes map actions before clearing selection. The army panel has keyboard and touch route controls." [ref=f2e23]
      - navigation "Map management" [ref=f2e25]:
        - button "Armies & fleets" [ref=f2e26] [cursor=pointer]
        - button "Settlements" [ref=f2e30] [cursor=pointer]
        - button "Characters & agents" [ref=f2e34] [cursor=pointer]:
          - generic [ref=f2e37]: Characters
        - button "Realm progression" [ref=f2e38] [cursor=pointer]:
          - generic [ref=f2e41]: Research
        - button "Realm affairs" [ref=f2e42] [cursor=pointer]:
          - generic [ref=f2e45]: Diplomacy
        - button "Campaign journal" [ref=f2e46] [cursor=pointer]
        - button "World overview" [ref=f2e50] [cursor=pointer]
      - generic [ref=f2e54]:
        - button "Zoom in" [ref=f2e55] [cursor=pointer]: +
        - button "Zoom out" [ref=f2e56] [cursor=pointer]: −
        - button "Focus selection" [ref=f2e57] [cursor=pointer]
        - button "Open map actions" [ref=f2e58] [cursor=pointer]
        - button "Map guide" [ref=f2e59] [cursor=pointer]: "?"
      - group:
        - generic "World map · Terrain" [ref=f2e60] [cursor=pointer]
  - dialog [ref=f2e61]:
    - banner [ref=f2e62]:
      - generic [ref=f2e63]:
        - generic [ref=f2e64]: The realm's ledgers
        - heading "Realm registry" [level=2] [ref=f2e65]
        - paragraph [ref=f2e66]: Ashen Compact
      - button "Close Realm registry" [ref=f2e67] [cursor=pointer]: ×
    - generic [ref=f2e69]:
      - generic [ref=f2e70]:
        - img "Ashen Compact crest · approved faction artwork" [ref=f2e71]
        - generic [ref=f2e72]:
          - generic [ref=f2e73]: Your people
          - heading "Ashen Compact" [level=3] [ref=f2e74]
      - generic [ref=f2e76]:
        - tablist "Realm registry" [ref=f2e77]:
          - tab "Armies 100" [ref=f2e78] [cursor=pointer]
          - tab "Settlements 40" [selected] [ref=f2e79] [cursor=pointer]
        - button "Characters & agents" [ref=f2e80] [cursor=pointer]: Characters 0
      - generic [ref=f2e81]:
        - text: Search your realm
        - searchbox "Search your realm" [ref=f2e82]
      - tabpanel "Settlements 40" [ref=f2e83]:
        - generic [ref=f2e84]:
          - generic [ref=f2e86]:
            - text: Settlement orders
            - combobox "Settlement orders" [ref=f2e87]:
              - option "All hearths (40)" [selected]
              - option "No production (0)"
              - option "Without charters (38)"
              - option "Charters waiting (0)"
          - generic [ref=f2e89]:
            - text: Land commission status
            - combobox "Land commission status" [ref=f2e90]:
              - option "All hearths (40)" [selected]
              - option "With commissions (0)"
              - option "Without commissions (40)"
              - option "Zero allowance (0)"
              - option "Reported waits (0)"
          - group [ref=f2e91]:
            - generic "How these filters work" [ref=f2e92] [cursor=pointer]
          - generic [ref=f2e93]:
            - generic [ref=f2e94]:
              - text: Registry order
              - combobox "Registry order" [ref=f2e95]:
                - option "Stable order" [selected]
                - option "Name A–Z"
            - generic [ref=f2e96]: 40 towns
          - group [ref=f2e97]:
            - generic "Saved hearth groups" [ref=f2e98] [cursor=pointer]
            - paragraph [ref=f2e99]: Groups belong to this campaign and are included in its saves and exports. Recall replaces this tab’s checked selection; apply postings or charters separately.
            - generic [ref=f2e100]:
              - generic [ref=f2e101]:
                - text: Saved hearth group
                - combobox "Saved hearth group" [ref=f2e102]:
                  - option "Choose a saved hearth group"
                  - option "All workshop hearths" [selected]
              - button "Recall group" [ref=f2e103] [cursor=pointer]
              - paragraph [ref=f2e104]: 40 saved members · Only currently owned hearths can be checked for orders.
              - status [ref=f2e105]: "Recalled group “All workshop hearths”: 40 hearths selected. 0 skipped (0 embarked, 0 unavailable or no longer owned). Existing orders are unchanged."
            - generic [ref=f2e106]:
              - text: Group name
              - textbox "Group name" [ref=f2e107]: All workshop hearths
            - paragraph [ref=f2e108]: Save up to 128 checked hearths per group. Names can use 40 characters and must be unique among hearth groups. This realm has 1 of 24 saved groups across both tabs.
            - paragraph [ref=f2e109]: Update group replaces all saved members with the 40 currently checked hearths. Unchecked hearths are removed from the group.
            - generic [ref=f2e110]:
              - button "Save new group" [ref=f2e111] [cursor=pointer]
              - button "Update group" [ref=f2e112] [cursor=pointer]
              - button "Delete group" [ref=f2e113] [cursor=pointer]
          - region "Group hearth charters" [ref=f2e114]:
            - generic [ref=f2e115]:
              - button "Select matching hearths" [disabled] [ref=f2e116]
              - button "Clear hearth selection" [ref=f2e117] [cursor=pointer]
            - status [ref=f2e118]: 40 hearths selected
            - paragraph [ref=f2e119]: Check hearths to give them standing charters together. Select up to 128 at a time; page, search and registry changes keep your selection.
            - generic [ref=f2e120]:
              - generic [ref=f2e121]:
                - text: Charter focus
                - combobox "Charter focus" [ref=f2e122]:
                  - option "Works" [selected]
                  - option "Wealth"
                  - option "Learning"
                  - option "Muster"
              - generic [ref=f2e123]:
                - text: Coin ceiling per hearth
                - spinbutton "Coin ceiling per hearth" [ref=f2e124]: "24"
            - paragraph [ref=f2e125]: Applying charters spends no coin now. Each hearth may spend up to its ceiling on one work whenever its queue is empty, once per turn after upkeep. All charters share your treasury and leave 40 coin in reserve.
            - paragraph [ref=f2e126]: Works, Wealth and Learning prioritize buildings; Muster raises land companies that add upkeep. Existing production orders stay in place. Revoking a charter stops future orders and keeps its current queue.
            - paragraph [ref=f2e127]: 40 selected hearths already have production queued; those orders come first.
            - group [ref=f2e128]:
              - generic "Charter templates" [ref=f2e129] [cursor=pointer]
            - generic [ref=f2e130]:
              - button "Apply charters (40)" [ref=f2e131] [cursor=pointer]
              - button "Revoke charters (2)" [ref=f2e132] [cursor=pointer]
            - paragraph [ref=f2e133]: Revocation leaves the 38 selected hearths without charters unchanged.
          - group [ref=f2e134]:
            - generic "Worker policies" [ref=f2e135]
            - option "Balanced" [selected]
            - option "Food"
            - option "Industry"
            - option "Coin"
            - option "Knowledge"
          - group [ref=f2e136]:
            - generic "Land commissions" [ref=f2e137] [cursor=pointer]
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
          - group [ref=f2e138]:
            - generic "Production sequences" [ref=f2e139] [cursor=pointer]
            - paragraph [ref=f2e140]: Use the checked hearths above or recall a saved hearth group. Build a list of 1–5 projects, then explicitly apply it to up to 128 hearths.
            - paragraph [ref=f2e141]: "40 hearths selected for production · Treasury: 249560 coin."
            - generic [ref=f2e142]:
              - text: Production item
              - combobox "Production item" [ref=f2e143]:
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
            - button "Add project" [ref=f2e144] [cursor=pointer]
            - paragraph [ref=f2e145]: Construction entries appear once per sequence; recruitment may repeat. Recruitment adds its normal upkeep after completion.
            - group [ref=f2e146]:
              - generic "Current blockers for Root cellar" [ref=f2e147] [cursor=pointer]
            - list
            - paragraph [ref=f2e148]: No projects in this sequence yet.
            - paragraph [ref=f2e149]: "Nominal cost: 0 coin per hearth · 0 coin across this selection. All hearths share the current treasury."
            - paragraph [ref=f2e150]: "Existing queues: 122 projects across 40 selected hearths. Those orders come first. Accepted projects append to those queues and spend coin immediately."
            - group [ref=f2e151]:
              - generic "Review existing queues" [ref=f2e152] [cursor=pointer]
            - paragraph [ref=f2e153]: Hearths run in stable ID order; each list runs in your chosen order. A refusal stops the remaining items for that hearth, then the next hearth is processed. Accepted prefixes stay paid and queued; there is no rollback or automatic retry.
            - paragraph [ref=f2e154]: Nominal costs do not promise eligibility. Buildings do not finish while appending a sequence, so a queued prerequisite cannot unlock a later project immediately. Existing queues and charters are preserved.
            - group [ref=f2e155]:
              - generic "Production templates" [active] [ref=f2e156] [cursor=pointer]
              - paragraph [ref=f2e157]: Your personal template library stays in this browser across campaigns and sessions. It is separate from campaign saves and is not included in campaign exports. Saving, selecting, updating, recalling or deleting a template issues no game orders.
              - generic [ref=f2e158]:
                - generic [ref=f2e159]:
                  - text: Saved production template
                  - combobox "Saved production template" [ref=f2e160]:
                    - option "Choose a saved template"
                    - option "Realm watch" [selected]
                - paragraph [ref=f2e161]: "Saved sequence: Oath guard → Cinder workshop → Oath guard. Recall it to fill the editor."
                - generic [ref=f2e162]:
                  - text: Production template name
                  - textbox "Production template name" [ref=f2e163]: Realm watch
                - paragraph [ref=f2e164]: Save or update using the current ordered list. Choose a unique name, up to 40 characters. Up to 24 templates fit in this library.
                - generic [ref=f2e165]:
                  - button "Save production template" [disabled] [ref=f2e166]
                  - button "Update production template" [disabled] [ref=f2e167]
                  - button "Recall production template" [ref=f2e168] [cursor=pointer]
                  - button "Delete production template" [ref=f2e169] [cursor=pointer]
                - paragraph [ref=f2e170]: Add a valid sequence above to save or update. Recalling and deleting saved templates remain available.
            - button "Apply production (40)" [disabled] [ref=f2e171]
          - generic [ref=f2e172]:
            - generic [ref=f2e173]:
              - checkbox "Select Sequence hearth 001 for group orders" [checked] [ref=f2e175]
              - button "Sequence hearth 001 8 people · Root cellar Works charter · 24 coin per work · Current queue comes first." [ref=f2e176] [cursor=pointer]:
                - generic [aria-hidden] [ref=f2e177]: ⌂
                - generic [ref=f2e178]:
                  - strong [ref=f2e179]: Sequence hearth 001
                  - generic [ref=f2e180]: 8 people · Root cellar
                  - generic [ref=f2e181]: Works charter · 24 coin per work · Current queue comes first.
                - generic [aria-hidden] [ref=f2e182]: ›
            - generic [ref=f2e183]:
              - checkbox "Select Sequence hearth 002 for group orders" [checked] [ref=f2e185]
              - button "Sequence hearth 002 8 people · Oath guard Works charter · 24 coin per work · Current queue comes first." [ref=f2e186] [cursor=pointer]:
                - generic [aria-hidden] [ref=f2e187]: ⌂
                - generic [ref=f2e188]:
                  - strong [ref=f2e189]: Sequence hearth 002
                  - generic [ref=f2e190]: 8 people · Oath guard
                  - generic [ref=f2e191]: Works charter · 24 coin per work · Current queue comes first.
                - generic [aria-hidden] [ref=f2e192]: ›
            - generic [ref=f2e193]:
              - checkbox "Select Sequence hearth 003 for group orders" [checked] [ref=f2e195]
              - button "Sequence hearth 003 8 people · Oath guard Direct orders · No charter." [ref=f2e196] [cursor=pointer]:
                - generic [aria-hidden] [ref=f2e197]: ⌂
                - generic [ref=f2e198]:
                  - strong [ref=f2e199]: Sequence hearth 003
                  - generic [ref=f2e200]: 8 people · Oath guard
                  - generic [ref=f2e201]: Direct orders · No charter.
                - generic [aria-hidden] [ref=f2e202]: ›
            - generic [ref=f2e203]:
              - checkbox "Select Sequence hearth 004 for group orders" [checked] [ref=f2e205]
              - button "Sequence hearth 004 8 people · Oath guard Direct orders · No charter." [ref=f2e206] [cursor=pointer]:
                - generic [aria-hidden] [ref=f2e207]: ⌂
                - generic [ref=f2e208]:
                  - strong [ref=f2e209]: Sequence hearth 004
                  - generic [ref=f2e210]: 8 people · Oath guard
                  - generic [ref=f2e211]: Direct orders · No charter.
                - generic [aria-hidden] [ref=f2e212]: ›
            - generic [ref=f2e213]:
              - checkbox "Select Sequence hearth 005 for group orders" [checked] [ref=f2e215]
              - button "Sequence hearth 005 8 people · Oath guard Direct orders · No charter." [ref=f2e216] [cursor=pointer]:
                - generic [aria-hidden] [ref=f2e217]: ⌂
                - generic [ref=f2e218]:
                  - strong [ref=f2e219]: Sequence hearth 005
                  - generic [ref=f2e220]: 8 people · Oath guard
                  - generic [ref=f2e221]: Direct orders · No charter.
                - generic [aria-hidden] [ref=f2e222]: ›
            - generic [ref=f2e223]:
              - checkbox "Select Sequence hearth 006 for group orders" [checked] [ref=f2e225]
              - button "Sequence hearth 006 8 people · Oath guard Direct orders · No charter." [ref=f2e226] [cursor=pointer]:
                - generic [aria-hidden] [ref=f2e227]: ⌂
                - generic [ref=f2e228]:
                  - strong [ref=f2e229]: Sequence hearth 006
                  - generic [ref=f2e230]: 8 people · Oath guard
                  - generic [ref=f2e231]: Direct orders · No charter.
                - generic [aria-hidden] [ref=f2e232]: ›
            - generic [ref=f2e233]:
              - checkbox "Select Sequence hearth 007 for group orders" [checked] [ref=f2e235]
              - button "Sequence hearth 007 8 people · Oath guard Direct orders · No charter." [ref=f2e236] [cursor=pointer]:
                - generic [aria-hidden] [ref=f2e237]: ⌂
                - generic [ref=f2e238]:
                  - strong [ref=f2e239]: Sequence hearth 007
                  - generic [ref=f2e240]: 8 people · Oath guard
                  - generic [ref=f2e241]: Direct orders · No charter.
                - generic [aria-hidden] [ref=f2e242]: ›
            - generic [ref=f2e243]:
              - checkbox "Select Sequence hearth 008 for group orders" [checked] [ref=f2e245]
              - button "Sequence hearth 008 8 people · Oath guard Direct orders · No charter." [ref=f2e246] [cursor=pointer]:
                - generic [aria-hidden] [ref=f2e247]: ⌂
                - generic [ref=f2e248]:
                  - strong [ref=f2e249]: Sequence hearth 008
                  - generic [ref=f2e250]: 8 people · Oath guard
                  - generic [ref=f2e251]: Direct orders · No charter.
                - generic [aria-hidden] [ref=f2e252]: ›
            - generic [ref=f2e253]:
              - checkbox "Select Sequence hearth 009 for group orders" [checked] [ref=f2e255]
              - button "Sequence hearth 009 8 people · Oath guard Direct orders · No charter." [ref=f2e256] [cursor=pointer]:
                - generic [aria-hidden] [ref=f2e257]: ⌂
                - generic [ref=f2e258]:
                  - strong [ref=f2e259]: Sequence hearth 009
                  - generic [ref=f2e260]: 8 people · Oath guard
                  - generic [ref=f2e261]: Direct orders · No charter.
                - generic [aria-hidden] [ref=f2e262]: ›
            - generic [ref=f2e263]:
              - checkbox "Select Sequence hearth 010 for group orders" [checked] [ref=f2e265]
              - button "Sequence hearth 010 8 people · Oath guard Direct orders · No charter." [ref=f2e266] [cursor=pointer]:
                - generic [aria-hidden] [ref=f2e267]: ⌂
                - generic [ref=f2e268]:
                  - strong [ref=f2e269]: Sequence hearth 010
                  - generic [ref=f2e270]: 8 people · Oath guard
                  - generic [ref=f2e271]: Direct orders · No charter.
                - generic [aria-hidden] [ref=f2e272]: ›
            - generic [ref=f2e273]:
              - checkbox "Select Sequence hearth 011 for group orders" [checked] [ref=f2e275]
              - button "Sequence hearth 011 8 people · Oath guard Direct orders · No charter." [ref=f2e276] [cursor=pointer]:
                - generic [aria-hidden] [ref=f2e277]: ⌂
                - generic [ref=f2e278]:
                  - strong [ref=f2e279]: Sequence hearth 011
                  - generic [ref=f2e280]: 8 people · Oath guard
                  - generic [ref=f2e281]: Direct orders · No charter.
                - generic [aria-hidden] [ref=f2e282]: ›
            - generic [ref=f2e283]:
              - checkbox "Select Sequence hearth 012 for group orders" [checked] [ref=f2e285]
              - button "Sequence hearth 012 8 people · Oath guard Direct orders · No charter." [ref=f2e286] [cursor=pointer]:
                - generic [aria-hidden] [ref=f2e287]: ⌂
                - generic [ref=f2e288]:
                  - strong [ref=f2e289]: Sequence hearth 012
                  - generic [ref=f2e290]: 8 people · Oath guard
                  - generic [ref=f2e291]: Direct orders · No charter.
                - generic [aria-hidden] [ref=f2e292]: ›
            - generic [ref=f2e293]:
              - checkbox "Select Sequence hearth 013 for group orders" [checked] [ref=f2e295]
              - button "Sequence hearth 013 8 people · Oath guard Direct orders · No charter." [ref=f2e296] [cursor=pointer]:
                - generic [aria-hidden] [ref=f2e297]: ⌂
                - generic [ref=f2e298]:
                  - strong [ref=f2e299]: Sequence hearth 013
                  - generic [ref=f2e300]: 8 people · Oath guard
                  - generic [ref=f2e301]: Direct orders · No charter.
                - generic [aria-hidden] [ref=f2e302]: ›
            - generic [ref=f2e303]:
              - checkbox "Select Sequence hearth 014 for group orders" [checked] [ref=f2e305]
              - button "Sequence hearth 014 8 people · Oath guard Direct orders · No charter." [ref=f2e306] [cursor=pointer]:
                - generic [aria-hidden] [ref=f2e307]: ⌂
                - generic [ref=f2e308]:
                  - strong [ref=f2e309]: Sequence hearth 014
                  - generic [ref=f2e310]: 8 people · Oath guard
                  - generic [ref=f2e311]: Direct orders · No charter.
                - generic [aria-hidden] [ref=f2e312]: ›
            - generic [ref=f2e313]:
              - checkbox "Select Sequence hearth 015 for group orders" [checked] [ref=f2e315]
              - button "Sequence hearth 015 8 people · Oath guard Direct orders · No charter." [ref=f2e316] [cursor=pointer]:
                - generic [aria-hidden] [ref=f2e317]: ⌂
                - generic [ref=f2e318]:
                  - strong [ref=f2e319]: Sequence hearth 015
                  - generic [ref=f2e320]: 8 people · Oath guard
                  - generic [ref=f2e321]: Direct orders · No charter.
                - generic [aria-hidden] [ref=f2e322]: ›
            - generic [ref=f2e323]:
              - checkbox "Select Sequence hearth 016 for group orders" [checked] [ref=f2e325]
              - button "Sequence hearth 016 8 people · Oath guard Direct orders · No charter." [ref=f2e326] [cursor=pointer]:
                - generic [aria-hidden] [ref=f2e327]: ⌂
                - generic [ref=f2e328]:
                  - strong [ref=f2e329]: Sequence hearth 016
                  - generic [ref=f2e330]: 8 people · Oath guard
                  - generic [ref=f2e331]: Direct orders · No charter.
                - generic [aria-hidden] [ref=f2e332]: ›
            - generic [ref=f2e333]:
              - checkbox "Select Sequence hearth 017 for group orders" [checked] [ref=f2e335]
              - button "Sequence hearth 017 8 people · Oath guard Direct orders · No charter." [ref=f2e336] [cursor=pointer]:
                - generic [aria-hidden] [ref=f2e337]: ⌂
                - generic [ref=f2e338]:
                  - strong [ref=f2e339]: Sequence hearth 017
                  - generic [ref=f2e340]: 8 people · Oath guard
                  - generic [ref=f2e341]: Direct orders · No charter.
                - generic [aria-hidden] [ref=f2e342]: ›
            - generic [ref=f2e343]:
              - checkbox "Select Sequence hearth 018 for group orders" [checked] [ref=f2e345]
              - button "Sequence hearth 018 8 people · Oath guard Direct orders · No charter." [ref=f2e346] [cursor=pointer]:
                - generic [aria-hidden] [ref=f2e347]: ⌂
                - generic [ref=f2e348]:
                  - strong [ref=f2e349]: Sequence hearth 018
                  - generic [ref=f2e350]: 8 people · Oath guard
                  - generic [ref=f2e351]: Direct orders · No charter.
                - generic [aria-hidden] [ref=f2e352]: ›
            - generic [ref=f2e353]:
              - checkbox "Select Sequence hearth 019 for group orders" [checked] [ref=f2e355]
              - button "Sequence hearth 019 8 people · Oath guard Direct orders · No charter." [ref=f2e356] [cursor=pointer]:
                - generic [aria-hidden] [ref=f2e357]: ⌂
                - generic [ref=f2e358]:
                  - strong [ref=f2e359]: Sequence hearth 019
                  - generic [ref=f2e360]: 8 people · Oath guard
                  - generic [ref=f2e361]: Direct orders · No charter.
                - generic [aria-hidden] [ref=f2e362]: ›
            - generic [ref=f2e363]:
              - checkbox "Select Sequence hearth 020 for group orders" [checked] [ref=f2e365]
              - button "Sequence hearth 020 8 people · Oath guard Direct orders · No charter." [ref=f2e366] [cursor=pointer]:
                - generic [aria-hidden] [ref=f2e367]: ⌂
                - generic [ref=f2e368]:
                  - strong [ref=f2e369]: Sequence hearth 020
                  - generic [ref=f2e370]: 8 people · Oath guard
                  - generic [ref=f2e371]: Direct orders · No charter.
                - generic [aria-hidden] [ref=f2e372]: ›
            - generic [ref=f2e373]:
              - checkbox "Select Sequence hearth 021 for group orders" [checked] [ref=f2e375]
              - button "Sequence hearth 021 8 people · Oath guard Direct orders · No charter." [ref=f2e376] [cursor=pointer]:
                - generic [aria-hidden] [ref=f2e377]: ⌂
                - generic [ref=f2e378]:
                  - strong [ref=f2e379]: Sequence hearth 021
                  - generic [ref=f2e380]: 8 people · Oath guard
                  - generic [ref=f2e381]: Direct orders · No charter.
                - generic [aria-hidden] [ref=f2e382]: ›
            - generic [ref=f2e383]:
              - checkbox "Select Sequence hearth 022 for group orders" [checked] [ref=f2e385]
              - button "Sequence hearth 022 8 people · Oath guard Direct orders · No charter." [ref=f2e386] [cursor=pointer]:
                - generic [aria-hidden] [ref=f2e387]: ⌂
                - generic [ref=f2e388]:
                  - strong [ref=f2e389]: Sequence hearth 022
                  - generic [ref=f2e390]: 8 people · Oath guard
                  - generic [ref=f2e391]: Direct orders · No charter.
                - generic [aria-hidden] [ref=f2e392]: ›
            - generic [ref=f2e393]:
              - checkbox "Select Sequence hearth 023 for group orders" [checked] [ref=f2e395]
              - button "Sequence hearth 023 8 people · Oath guard Direct orders · No charter." [ref=f2e396] [cursor=pointer]:
                - generic [aria-hidden] [ref=f2e397]: ⌂
                - generic [ref=f2e398]:
                  - strong [ref=f2e399]: Sequence hearth 023
                  - generic [ref=f2e400]: 8 people · Oath guard
                  - generic [ref=f2e401]: Direct orders · No charter.
                - generic [aria-hidden] [ref=f2e402]: ›
            - generic [ref=f2e403]:
              - checkbox "Select Sequence hearth 024 for group orders" [checked] [ref=f2e405]
              - button "Sequence hearth 024 8 people · Oath guard Direct orders · No charter." [ref=f2e406] [cursor=pointer]:
                - generic [aria-hidden] [ref=f2e407]: ⌂
                - generic [ref=f2e408]:
                  - strong [ref=f2e409]: Sequence hearth 024
                  - generic [ref=f2e410]: 8 people · Oath guard
                  - generic [ref=f2e411]: Direct orders · No charter.
                - generic [aria-hidden] [ref=f2e412]: ›
            - generic [ref=f2e413]:
              - checkbox "Select Sequence hearth 025 for group orders" [checked] [ref=f2e415]
              - button "Sequence hearth 025 8 people · Oath guard Direct orders · No charter." [ref=f2e416] [cursor=pointer]:
                - generic [aria-hidden] [ref=f2e417]: ⌂
                - generic [ref=f2e418]:
                  - strong [ref=f2e419]: Sequence hearth 025
                  - generic [ref=f2e420]: 8 people · Oath guard
                  - generic [ref=f2e421]: Direct orders · No charter.
                - generic [aria-hidden] [ref=f2e422]: ›
          - navigation "Registry pages" [ref=f2e423]:
            - button "Previous registry page" [disabled] [ref=f2e424]: ←
            - generic [ref=f2e425]: Page 1 of 2
            - button "Next registry page" [ref=f2e426] [cursor=pointer]: →
      - paragraph [ref=f2e427]: Choose an entry to locate it on the map. Use the bottom command tray for its orders.
  - contentinfo [ref=f2e428]:
    - generic [ref=f2e430]:
      - generic [ref=f2e431]: Selected army
      - strong [ref=f2e432]: Oath guard
      - generic [ref=f2e433]: 1 / 12 formations · 60 strength · 3 movement
      - button "Show selected orders" [ref=f2e435] [cursor=pointer]
    - region "Next-action navigation" [ref=f2e436]:
      - generic [ref=f2e437]:
        - button "Previous army needing orders" [ref=f2e438] [cursor=pointer]: ‹
        - button "Next army needing orders" [ref=f2e439] [cursor=pointer]: Next army N
        - button "Previous idle settlement" [disabled] [ref=f2e440]: ‹
        - button "Next idle settlement" [disabled] [ref=f2e441]: Next town S
      - paragraph [ref=f2e442]: "Labor: 134 unassigned households · 40 settlements"
      - generic [ref=f2e443]:
        - button "Previous settlement with unassigned households" [ref=f2e444] [cursor=pointer]: ‹
        - button "Next settlement with unassigned households" [ref=f2e445] [cursor=pointer]: Review households
      - group [ref=f2e446]:
        - generic "What wants a decision 2 kinds" [ref=f2e447] [cursor=pointer]:
          - text: What wants a decision
          - generic [ref=f2e448]: 2 kinds
    - generic [ref=f2e449]:
      - strong [ref=f2e451]: Turn 1
      - button "End turn" [ref=f2e452] [cursor=pointer]:
        - text: End turn
        - generic [ref=f2e453]: E
    - status [ref=f2e454]:
      - generic [aria-hidden] [ref=f2e455]: ◆
      - text: "Campaign restored. Partial archive: earlier campaign history was not recorded in this save."
  - generic [ref=f2e456]:
    - button "Art Lab" [ref=f2e457] [cursor=pointer]
    - generic [ref=f2e458]: Development asset inspector
```

# Test source

```ts
  1   | import { readFile, writeFile } from 'node:fs/promises';
  2   | import { expect, test, type Locator, type Page } from '@playwright/test';
  3   | import { applyCommand, deserializeGame, getObservation, serializeGame, stateHash, type Charter, type GameState } from '@theandril/sim';
  4   | import { deserializeCampaign, exportSave, importSave } from '@theandril/persistence';
  5   | import { cellTransferBytes, packCells } from '../../apps/web/src/cell-transfer';
  6   | import { empireLandCampaign } from '../../packages/test-fixtures/src/empire-land-fixture';
  7   | import { closeManagement, openProduction, openRegistry, selectFromRegistry } from './ui-navigation';
  8   | 
  9   | // Authored acceptance scenario, not earned conquest. This test author also
  10  | // authored personal template storage; parent browser execution/review is separate.
  11  | const sequenceIds = ['unit.guard', 'building.workshop', 'unit.guard'];
  12  | type RequestTrace = { id?: number; type?: string; armyId?: string; target?: number; append?: boolean };
  13  | type ResponseTrace = { id?: number; type?: string; hash?: string; movementJsonBytes?: number };
  14  | type Traffic = { sent: number; received: number; states: number; groups: number; pending: number; requestTypes: Record<string, number>; responseTypes: Record<string, number>; requests: RequestTrace[]; responses: ResponseTrace[] };
  15  | const charterPolicies = (charters: readonly Charter[]) => charters.map(({ settlementId, factionId, focus, ceiling }) => ({ settlementId, factionId, focus, ceiling }));
  16  | const countDelta = (after: Record<string, number>, before: Record<string, number>) => Object.fromEntries(Object.entries(after).map(([type, count]) => [type, count - (before[type] ?? 0)] as const).filter(([, count]) => count !== 0));
  17  | 
  18  | async function observeTraffic(page: Page) {
  19  |   await page.addInitScript(() => {
  20  |     const trace: Traffic = { sent: 0, received: 0, states: 0, groups: 0, pending: 0, requestTypes: {}, responseTypes: {}, requests: [], responses: [] };
  21  |     (window as unknown as { __PRODUCTION_TRAFFIC__: typeof trace }).__PRODUCTION_TRAFFIC__ = trace;
  22  |     const NativeWorker = window.Worker;
  23  |     // Observe the real transport; forward every request/response unchanged.
  24  |     window.Worker = class extends NativeWorker {
  25  |       private readonly waiting = new Set<number>();
  26  |       constructor(url: string | URL, options?: WorkerOptions) {
  27  |         super(url, options);
  28  |         this.addEventListener('message', event => {
  29  |           const data = event.data as { id?: number; type?: string; hash?: string };
  30  |           trace.received++;
  31  |           trace.responseTypes[data.type ?? 'missing'] = (trace.responseTypes[data.type ?? 'missing'] ?? 0) + 1;
  32  |           trace.responses.push({ id: data.id, type: data.type, hash: data.hash,
  33  |             ...(data.type === 'movementQuery' ? { movementJsonBytes: new TextEncoder().encode(JSON.stringify(data)).byteLength } : {}) });
  34  |           if (data.type === 'state') trace.states++;
  35  |           if (typeof data.id === 'number' && data.type !== 'progress') this.waiting.delete(data.id);
  36  |           trace.pending = this.waiting.size;
  37  |         });
  38  |       }
  39  |       override postMessage(message: unknown, options?: Transferable[] | StructuredSerializeOptions) {
  40  |         const data = message as RequestTrace;
  41  |         trace.sent++;
  42  |         trace.requestTypes[data.type ?? 'missing'] = (trace.requestTypes[data.type ?? 'missing'] ?? 0) + 1;
  43  |         trace.requests.push({ id: data.id, type: data.type, armyId: data.armyId, target: data.target, append: data.append });
  44  |         if (data.type === 'groupProduction') trace.groups++;
  45  |         if (typeof data.id === 'number') this.waiting.add(data.id);
  46  |         trace.pending = this.waiting.size;
  47  |         if (Array.isArray(options)) super.postMessage(message, options);
  48  |         else super.postMessage(message, options);
  49  |       }
  50  |     };
  51  |   });
  52  | }
  53  | 
  54  | async function traffic(page: Page): Promise<Traffic> {
> 55  |   await expect.poll(() => page.evaluate(() => (window as unknown as { __PRODUCTION_TRAFFIC__: Traffic }).__PRODUCTION_TRAFFIC__.pending)).toBe(0);
      |                                                                                                                                           ^ Error: Test timeout of 45000ms exceeded
  56  |   return page.evaluate(() => ({ ...(window as unknown as { __PRODUCTION_TRAFFIC__: Traffic }).__PRODUCTION_TRAFFIC__ }));
  57  | }
  58  | 
  59  | async function snapshot(page: Page) {
  60  |   return page.evaluate(() => ({ hash: window.__THEANDRIL__!.getStateHash(), view: window.__THEANDRIL__!.getSummary()!, metrics: window.__THEANDRIL__!.getPerformanceCounters(), selection: window.__THEANDRIL__!.getSelection() }));
  61  | }
  62  | 
  63  | async function importCampaign(page: Page, game: GameState) {
  64  |   await page.goto('/');
  65  |   await page.locator('input[type=file]').setInputFiles({ name: 'production-sequences.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(game))) });
  66  |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  67  | }
  68  | 
  69  | async function settings(page: Page) {
  70  |   await closeManagement(page);
  71  |   const menu = page.getByTestId('campaign-menu');
  72  |   if (await menu.getAttribute('open') === null) await menu.locator(':scope > summary').click();
  73  | }
  74  | 
  75  | async function save(page: Page) {
  76  |   await settings(page);
  77  |   await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  78  |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  79  | }
  80  | 
  81  | async function restoreAfterReload(page: Page) {
  82  |   await page.reload();
  83  |   await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  84  |   await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  85  | }
  86  | 
  87  | async function disclose(page: Page, id: string, keyboard = false): Promise<Locator> {
  88  |   const panel = page.getByTestId(id);
  89  |   if (await panel.getAttribute('open') === null) {
  90  |     const summary = panel.locator(':scope > summary');
  91  |     if (keyboard) { await summary.focus(); await page.keyboard.press('Enter'); }
  92  |     else await summary.click();
  93  |   }
  94  |   return panel;
  95  | }
  96  | 
  97  | async function recallHearths(page: Page, keyboard = false) {
  98  |   await openRegistry(page, 'settlements');
  99  |   const groups = await disclose(page, 'selection-groups', keyboard);
  100 |   await groups.getByRole('combobox', { name: 'Saved hearth group', exact: true }).selectOption({ label: 'All workshop hearths' });
  101 |   if (keyboard) { await groups.getByRole('button', { name: 'Recall group', exact: true }).focus(); await page.keyboard.press('Enter'); }
  102 |   else await groups.getByRole('button', { name: 'Recall group', exact: true }).click();
  103 |   await expect(page.getByTestId('group-charters')).toContainText('40 hearths selected');
  104 | }
  105 | 
  106 | async function addItem(panel: Locator, itemId: string) {
  107 |   await panel.getByRole('combobox', { name: 'Production item', exact: true }).selectOption(itemId);
  108 |   await panel.getByRole('button', { name: 'Add project', exact: true }).click();
  109 | }
  110 | 
  111 | async function removeAll(panel: Locator) {
  112 |   const rows = panel.getByTestId('production-sequence-item');
  113 |   for (let remaining = await rows.count(); remaining > 0; remaining--) await rows.first().getByRole('button', { name: /^Remove item / }).click();
  114 |   await expect(rows).toHaveCount(0);
  115 | }
  116 | 
  117 | test('forty hearths recall a personal ordered sequence, pay for one batch, retain individual control and restore saved queues', { tag: '@scale' }, async ({ page }, testInfo) => {
  118 |   const game = empireLandCampaign('legendary');
  119 |   const towns = Object.values(game.settlements).filter(town => town.factionId === game.turnOwnerId).sort((a, b) => a.id < b.id ? -1 : 1);
  120 |   towns.forEach((town, index) => { town.name = `Sequence hearth ${String(index + 1).padStart(3, '0')}`; });
  121 |   expect(towns).toHaveLength(40);
  122 |   expect(Object.values(game.armies).filter(army => army.factionId === game.turnOwnerId)).toHaveLength(100);
  123 |   expect(applyCommand(game, { type: 'queue', factionId: game.turnOwnerId, settlementId: towns[0]!.id, itemId: 'building.granary' }).ok).toBe(true);
  124 |   // Real standing policies make preservation meaningful; their next-item quotes
  125 |   // may legitimately change when ordinary production fills their queues.
  126 |   for (const town of towns.slice(0, 2)) expect(applyCommand(game, { type: 'setCharter', factionId: game.turnOwnerId, settlementId: town.id, focus: 'works', ceiling: 24 }).ok).toBe(true);
  127 |   expect(applyCommand(game, { type: 'setSelectionGroup', factionId: game.turnOwnerId, kind: 'settlements', name: 'All workshop hearths', memberIds: towns.map(town => town.id) }).ok).toBe(true);
  128 |   const errors: string[] = [];
  129 |   page.on('pageerror', error => errors.push(error.message));
  130 |   await observeTraffic(page);
  131 |   await importCampaign(page, game);
  132 |   await save(page);
  133 |   await openRegistry(page, 'armies');
  134 |   await page.getByTestId('army-registry').getByRole('checkbox').first().check();
  135 |   await openRegistry(page, 'settlements');
  136 |   const beforeRecall = await snapshot(page), recallTraffic = await traffic(page);
  137 |   await recallHearths(page, true);
  138 |   expect((await snapshot(page)).hash).toBe(beforeRecall.hash);
  139 |   expect(await traffic(page)).toEqual(recallTraffic);
  140 |   const panel = await disclose(page, 'group-production');
  141 |   await removeAll(panel);
  142 |   const beforePreferences = await snapshot(page), preferenceTraffic = await traffic(page);
  143 |   await addItem(panel, 'building.workshop');
  144 |   await addItem(panel, 'unit.guard');
  145 |   await addItem(panel, 'unit.scout');
  146 |   await addItem(panel, 'unit.guard');
  147 |   const rows = panel.getByTestId('production-sequence-item');
  148 |   await rows.nth(1).getByRole('button', { name: /^Move item .* up$/ }).click();
  149 |   await rows.nth(2).getByRole('button', { name: /^Remove item / }).click();
  150 |   await expect(rows).toHaveCount(3);
  151 |   await expect(rows.nth(0)).toContainText('Oath guard');
  152 |   await expect(rows.nth(1)).toContainText('Cinder workshop');
  153 |   await expect(rows.nth(2)).toContainText('Oath guard');
  154 |   const templates = await disclose(page, 'production-templates');
  155 |   const library = templates.getByRole('combobox', { name: 'Saved production template', exact: true });
```