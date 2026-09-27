# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: production-sequences.spec.ts >> forty hearths recall a personal ordered sequence, pay for one batch, retain individual control and restore saved queues
- Location: tests/gameplay/production-sequences.spec.ts:108:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 1
Received: 2
```

# Page snapshot

```yaml
- generic [ref=f1e3]:
  - button "Import save file"
  - generic [ref=f1e4]:
    - banner [ref=f1e5]:
      - heading "Theandril" [level=1] [ref=f1e8]
      - generic [ref=f1e9]:
        - generic [ref=f1e10]:
          - generic [ref=f1e11]: TREASURY
          - strong [ref=f1e12]: 249568 coin
        - generic [ref=f1e13]:
          - generic [ref=f1e14]: KNOWLEDGE
          - strong [ref=f1e15]: "0"
    - navigation "Campaign navigation" [ref=f1e16]:
      - generic [ref=f1e17]:
        - text: Standard pace ·
        - generic [ref=f1e18]: 40 realms
    - group [ref=f1e19]:
      - generic "Campaign & settings" [ref=f1e20] [cursor=pointer]
  - main [ref=f1e21]:
    - region "Strategic map" [ref=f1e22]:
      - generic "World map. Select an army then click a highlighted hex to move or an enemy to attack. Hover to preview routes. Drag to pan; scroll to zoom all the way to world overview. Arrow keys pan; plus and minus zoom. Focus selection returns to local detail. Enter opens map actions for the selection. Escape closes map actions before clearing selection. The army panel has keyboard and touch route controls." [ref=f1e23]
      - navigation "Map management" [ref=f1e25]:
        - button "Armies & fleets" [ref=f1e26] [cursor=pointer]
        - button "Settlements" [ref=f1e30] [cursor=pointer]
        - button "Characters & agents" [ref=f1e34] [cursor=pointer]:
          - generic [ref=f1e37]: Characters
        - button "Realm progression" [ref=f1e38] [cursor=pointer]:
          - generic [ref=f1e41]: Research
        - button "Realm affairs" [ref=f1e42] [cursor=pointer]:
          - generic [ref=f1e45]: Diplomacy
        - button "Campaign journal" [ref=f1e46] [cursor=pointer]
        - button "World overview" [ref=f1e50] [cursor=pointer]
      - generic [ref=f1e54]:
        - button "Zoom in" [ref=f1e55] [cursor=pointer]: +
        - button "Zoom out" [ref=f1e56] [cursor=pointer]: −
        - button "Focus selection" [ref=f1e57] [cursor=pointer]
        - button "Open map actions" [ref=f1e58] [cursor=pointer]
        - button "Map guide" [ref=f1e59] [cursor=pointer]: "?"
      - group:
        - generic "World map · Terrain" [ref=f1e60] [cursor=pointer]
  - dialog [ref=f1e61]:
    - banner [ref=f1e62]:
      - generic [ref=f1e63]:
        - generic [ref=f1e64]: The realm's ledgers
        - heading "Realm registry" [level=2] [ref=f1e65]
        - paragraph [ref=f1e66]: Ashen Compact
      - button "Close Realm registry" [ref=f1e67] [cursor=pointer]: ×
    - generic [ref=f1e69]:
      - generic [ref=f1e70]:
        - img "Ashen Compact crest · approved faction artwork" [ref=f1e71]
        - generic [ref=f1e72]:
          - generic [ref=f1e73]: Your people
          - heading "Ashen Compact" [level=3] [ref=f1e74]
      - generic [ref=f1e76]:
        - tablist "Realm registry" [ref=f1e77]:
          - tab "Armies 100" [ref=f1e78] [cursor=pointer]
          - tab "Settlements 40" [selected] [ref=f1e79] [cursor=pointer]
        - button "Characters & agents" [ref=f1e80] [cursor=pointer]: Characters 0
      - generic [ref=f1e81]:
        - text: Search your realm
        - searchbox "Search your realm" [ref=f1e82]
      - tabpanel "Settlements 40" [ref=f1e83]:
        - generic [ref=f1e84]:
          - generic [ref=f1e85]:
            - generic [ref=f1e86]:
              - text: Registry order
              - combobox "Registry order" [ref=f1e87]:
                - option "Stable order" [selected]
                - option "Name A–Z"
            - generic [ref=f1e88]: 40 towns
          - group [ref=f1e89]:
            - generic "Saved hearth groups" [ref=f1e90] [cursor=pointer]
            - paragraph [ref=f1e91]: Groups belong to this campaign and are included in its saves and exports. Recall replaces this tab’s checked selection; apply postings or charters separately.
            - generic [ref=f1e92]:
              - generic [ref=f1e93]:
                - text: Saved hearth group
                - combobox "Saved hearth group" [ref=f1e94]:
                  - option "Choose a saved hearth group"
                  - option "All workshop hearths" [selected]
              - button "Recall group" [ref=f1e95] [cursor=pointer]
              - paragraph [ref=f1e96]: 40 saved members · Only currently owned hearths can be checked for orders.
              - status [ref=f1e97]: "Recalled group “All workshop hearths”: 40 hearths selected. 0 skipped (0 embarked, 0 unavailable or no longer owned). Existing orders are unchanged."
            - generic [ref=f1e98]:
              - text: Group name
              - textbox "Group name" [ref=f1e99]: All workshop hearths
            - paragraph [ref=f1e100]: Save up to 128 checked hearths per group. Names can use 40 characters and must be unique among hearth groups. This realm has 1 of 24 saved groups across both tabs.
            - paragraph [ref=f1e101]: Update group replaces all saved members with the 0 currently checked hearths. Unchecked hearths are removed from the group.
            - paragraph [ref=f1e102]: Updating will remove 40 saved members that are not checked. This leaves an empty group that you can refill or delete later.
            - generic [ref=f1e103]:
              - button "Save new group" [disabled] [ref=f1e104]
              - button "Update group" [ref=f1e105] [cursor=pointer]
              - button "Delete group" [ref=f1e106] [cursor=pointer]
            - paragraph [ref=f1e107]: Check at least one hearth to save a new group. An existing group may be updated to an empty selection.
          - region "Group hearth charters" [ref=f1e108]:
            - generic [ref=f1e109]:
              - button "Select matching hearths" [ref=f1e110] [cursor=pointer]
              - button "Clear hearth selection" [disabled] [ref=f1e111]
            - status [ref=f1e112]: 0 hearths selected
            - paragraph [ref=f1e113]: Check hearths to give them standing charters together. Select up to 128 at a time; page, search and registry changes keep your selection.
          - group [ref=f1e114]:
            - generic "Production sequences" [ref=f1e115] [cursor=pointer]
            - paragraph [ref=f1e116]: Use the checked hearths above or recall a saved hearth group. Build a list of 1–5 projects, then explicitly apply it to up to 128 hearths.
            - paragraph [ref=f1e117]: "0 hearths selected for production · Treasury: 249568 coin."
            - generic [ref=f1e118]:
              - text: Production item
              - combobox "Production item" [ref=f1e119]:
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
            - button "Add project" [ref=f1e120] [cursor=pointer]
            - paragraph [ref=f1e121]: Construction entries appear once per sequence; recruitment may repeat. Recruitment adds its normal upkeep after completion.
            - list [ref=f1e122]:
              - listitem [ref=f1e123]:
                - generic [ref=f1e124]:
                  - strong [ref=f1e125]: 1. Oath guard
                  - generic [ref=f1e126]: 12 coin · 24 industry
                - generic [ref=f1e127]:
                  - button "Move item 1 up" [disabled] [ref=f1e128]: ↑
                  - button "Move item 1 down" [ref=f1e129] [cursor=pointer]: ↓
                  - button "Remove item 1" [ref=f1e130] [cursor=pointer]: Remove
              - listitem [ref=f1e131]:
                - generic [ref=f1e132]:
                  - strong [ref=f1e133]: 2. Cinder workshop
                  - generic [ref=f1e134]: 12 coin · 24 industry
                - generic [ref=f1e135]:
                  - button "Move item 2 up" [ref=f1e136] [cursor=pointer]: ↑
                  - button "Move item 2 down" [ref=f1e137] [cursor=pointer]: ↓
                  - button "Remove item 2" [ref=f1e138] [cursor=pointer]: Remove
              - listitem [ref=f1e139]:
                - generic [ref=f1e140]:
                  - strong [ref=f1e141]: 3. Oath guard
                  - generic [ref=f1e142]: 12 coin · 24 industry
                - generic [ref=f1e143]:
                  - button "Move item 3 up" [ref=f1e144] [cursor=pointer]: ↑
                  - button "Move item 3 down" [disabled] [ref=f1e145]: ↓
                  - button "Remove item 3" [ref=f1e146] [cursor=pointer]: Remove
            - paragraph [ref=f1e147]: "Nominal cost: 36 coin per hearth · 0 coin across this selection. All hearths share the current treasury."
            - paragraph [ref=f1e148]: "Existing queues: 0 projects across 0 selected hearths. Those orders come first. Accepted projects append to those queues and spend coin immediately."
            - paragraph [ref=f1e149]: Hearths run in stable ID order; each list runs in your chosen order. A refusal stops the remaining items for that hearth, then the next hearth is processed. Accepted prefixes stay paid and queued; there is no rollback or automatic retry.
            - paragraph [ref=f1e150]: Nominal costs do not promise eligibility. Buildings do not finish while appending a sequence, so a queued prerequisite cannot unlock a later project immediately. Existing queues and charters are preserved.
            - group [ref=f1e151]:
              - generic "Production templates" [ref=f1e152] [cursor=pointer]
              - paragraph [ref=f1e153]: Your personal template library stays in this browser across campaigns and sessions. It is separate from campaign saves and is not included in campaign exports. Saving, selecting, updating, recalling or deleting a template issues no game orders.
              - generic [ref=f1e154]:
                - generic [ref=f1e155]:
                  - text: Saved production template
                  - combobox "Saved production template" [ref=f1e156]:
                    - option "Choose a saved template"
                    - option "Realm watch" [selected]
                - paragraph [ref=f1e157]: "Saved sequence: Oath guard → Cinder workshop → Oath guard. Recall it to fill the editor."
                - generic [ref=f1e158]:
                  - text: Production template name
                  - textbox "Production template name" [ref=f1e159]: Realm watch
                - paragraph [ref=f1e160]: Save or update using the current ordered list. Choose a unique name, up to 40 characters. Up to 24 templates fit in this library.
                - generic [ref=f1e161]:
                  - button "Save production template" [ref=f1e162] [cursor=pointer]
                  - button "Update production template" [ref=f1e163] [cursor=pointer]
                  - button "Recall production template" [ref=f1e164] [cursor=pointer]
                  - button "Delete production template" [ref=f1e165] [cursor=pointer]
                - status [ref=f1e166]: Recalled template “Realm watch”. Review the sequence, then choose Apply production to issue orders.
            - button "Apply production (0)" [disabled] [ref=f1e167]
            - generic [ref=f1e168]:
              - status [ref=f1e169]: 40 hearths complete · 0 partial or refused. 120 orders accepted · 0 refused.
              - group [ref=f1e170]:
                - generic "Review production results" [ref=f1e171] [cursor=pointer]
          - generic [ref=f1e172]:
            - generic [ref=f1e173]:
              - checkbox "Select Sequence hearth 001 for group orders" [ref=f1e175]
              - button "Sequence hearth 001 8 people · Root cellar" [ref=f1e176] [cursor=pointer]:
                - generic [aria-hidden] [ref=f1e177]: ⌂
                - generic [ref=f1e178]:
                  - strong [ref=f1e179]: Sequence hearth 001
                  - generic [ref=f1e180]: 8 people · Root cellar
                - generic [aria-hidden] [ref=f1e181]: ›
            - generic [ref=f1e182]:
              - checkbox "Select Sequence hearth 002 for group orders" [ref=f1e184]
              - button "Sequence hearth 002 8 people · Oath guard" [ref=f1e185] [cursor=pointer]:
                - generic [aria-hidden] [ref=f1e186]: ⌂
                - generic [ref=f1e187]:
                  - strong [ref=f1e188]: Sequence hearth 002
                  - generic [ref=f1e189]: 8 people · Oath guard
                - generic [aria-hidden] [ref=f1e190]: ›
            - generic [ref=f1e191]:
              - checkbox "Select Sequence hearth 003 for group orders" [ref=f1e193]
              - button "Sequence hearth 003 8 people · Oath guard" [ref=f1e194] [cursor=pointer]:
                - generic [aria-hidden] [ref=f1e195]: ⌂
                - generic [ref=f1e196]:
                  - strong [ref=f1e197]: Sequence hearth 003
                  - generic [ref=f1e198]: 8 people · Oath guard
                - generic [aria-hidden] [ref=f1e199]: ›
            - generic [ref=f1e200]:
              - checkbox "Select Sequence hearth 004 for group orders" [ref=f1e202]
              - button "Sequence hearth 004 8 people · Oath guard" [ref=f1e203] [cursor=pointer]:
                - generic [aria-hidden] [ref=f1e204]: ⌂
                - generic [ref=f1e205]:
                  - strong [ref=f1e206]: Sequence hearth 004
                  - generic [ref=f1e207]: 8 people · Oath guard
                - generic [aria-hidden] [ref=f1e208]: ›
            - generic [ref=f1e209]:
              - checkbox "Select Sequence hearth 005 for group orders" [ref=f1e211]
              - button "Sequence hearth 005 8 people · Oath guard" [ref=f1e212] [cursor=pointer]:
                - generic [aria-hidden] [ref=f1e213]: ⌂
                - generic [ref=f1e214]:
                  - strong [ref=f1e215]: Sequence hearth 005
                  - generic [ref=f1e216]: 8 people · Oath guard
                - generic [aria-hidden] [ref=f1e217]: ›
            - generic [ref=f1e218]:
              - checkbox "Select Sequence hearth 006 for group orders" [ref=f1e220]
              - button "Sequence hearth 006 8 people · Oath guard" [ref=f1e221] [cursor=pointer]:
                - generic [aria-hidden] [ref=f1e222]: ⌂
                - generic [ref=f1e223]:
                  - strong [ref=f1e224]: Sequence hearth 006
                  - generic [ref=f1e225]: 8 people · Oath guard
                - generic [aria-hidden] [ref=f1e226]: ›
            - generic [ref=f1e227]:
              - checkbox "Select Sequence hearth 007 for group orders" [ref=f1e229]
              - button "Sequence hearth 007 8 people · Oath guard" [ref=f1e230] [cursor=pointer]:
                - generic [aria-hidden] [ref=f1e231]: ⌂
                - generic [ref=f1e232]:
                  - strong [ref=f1e233]: Sequence hearth 007
                  - generic [ref=f1e234]: 8 people · Oath guard
                - generic [aria-hidden] [ref=f1e235]: ›
            - generic [ref=f1e236]:
              - checkbox "Select Sequence hearth 008 for group orders" [ref=f1e238]
              - button "Sequence hearth 008 8 people · Oath guard" [ref=f1e239] [cursor=pointer]:
                - generic [aria-hidden] [ref=f1e240]: ⌂
                - generic [ref=f1e241]:
                  - strong [ref=f1e242]: Sequence hearth 008
                  - generic [ref=f1e243]: 8 people · Oath guard
                - generic [aria-hidden] [ref=f1e244]: ›
            - generic [ref=f1e245]:
              - checkbox "Select Sequence hearth 009 for group orders" [ref=f1e247]
              - button "Sequence hearth 009 8 people · Oath guard" [ref=f1e248] [cursor=pointer]:
                - generic [aria-hidden] [ref=f1e249]: ⌂
                - generic [ref=f1e250]:
                  - strong [ref=f1e251]: Sequence hearth 009
                  - generic [ref=f1e252]: 8 people · Oath guard
                - generic [aria-hidden] [ref=f1e253]: ›
            - generic [ref=f1e254]:
              - checkbox "Select Sequence hearth 010 for group orders" [ref=f1e256]
              - button "Sequence hearth 010 8 people · Oath guard" [ref=f1e257] [cursor=pointer]:
                - generic [aria-hidden] [ref=f1e258]: ⌂
                - generic [ref=f1e259]:
                  - strong [ref=f1e260]: Sequence hearth 010
                  - generic [ref=f1e261]: 8 people · Oath guard
                - generic [aria-hidden] [ref=f1e262]: ›
            - generic [ref=f1e263]:
              - checkbox "Select Sequence hearth 011 for group orders" [ref=f1e265]
              - button "Sequence hearth 011 8 people · Oath guard" [ref=f1e266] [cursor=pointer]:
                - generic [aria-hidden] [ref=f1e267]: ⌂
                - generic [ref=f1e268]:
                  - strong [ref=f1e269]: Sequence hearth 011
                  - generic [ref=f1e270]: 8 people · Oath guard
                - generic [aria-hidden] [ref=f1e271]: ›
            - generic [ref=f1e272]:
              - checkbox "Select Sequence hearth 012 for group orders" [ref=f1e274]
              - button "Sequence hearth 012 8 people · Oath guard" [ref=f1e275] [cursor=pointer]:
                - generic [aria-hidden] [ref=f1e276]: ⌂
                - generic [ref=f1e277]:
                  - strong [ref=f1e278]: Sequence hearth 012
                  - generic [ref=f1e279]: 8 people · Oath guard
                - generic [aria-hidden] [ref=f1e280]: ›
            - generic [ref=f1e281]:
              - checkbox "Select Sequence hearth 013 for group orders" [ref=f1e283]
              - button "Sequence hearth 013 8 people · Oath guard" [ref=f1e284] [cursor=pointer]:
                - generic [aria-hidden] [ref=f1e285]: ⌂
                - generic [ref=f1e286]:
                  - strong [ref=f1e287]: Sequence hearth 013
                  - generic [ref=f1e288]: 8 people · Oath guard
                - generic [aria-hidden] [ref=f1e289]: ›
            - generic [ref=f1e290]:
              - checkbox "Select Sequence hearth 014 for group orders" [ref=f1e292]
              - button "Sequence hearth 014 8 people · Oath guard" [ref=f1e293] [cursor=pointer]:
                - generic [aria-hidden] [ref=f1e294]: ⌂
                - generic [ref=f1e295]:
                  - strong [ref=f1e296]: Sequence hearth 014
                  - generic [ref=f1e297]: 8 people · Oath guard
                - generic [aria-hidden] [ref=f1e298]: ›
            - generic [ref=f1e299]:
              - checkbox "Select Sequence hearth 015 for group orders" [ref=f1e301]
              - button "Sequence hearth 015 8 people · Oath guard" [ref=f1e302] [cursor=pointer]:
                - generic [aria-hidden] [ref=f1e303]: ⌂
                - generic [ref=f1e304]:
                  - strong [ref=f1e305]: Sequence hearth 015
                  - generic [ref=f1e306]: 8 people · Oath guard
                - generic [aria-hidden] [ref=f1e307]: ›
            - generic [ref=f1e308]:
              - checkbox "Select Sequence hearth 016 for group orders" [ref=f1e310]
              - button "Sequence hearth 016 8 people · Oath guard" [ref=f1e311] [cursor=pointer]:
                - generic [aria-hidden] [ref=f1e312]: ⌂
                - generic [ref=f1e313]:
                  - strong [ref=f1e314]: Sequence hearth 016
                  - generic [ref=f1e315]: 8 people · Oath guard
                - generic [aria-hidden] [ref=f1e316]: ›
            - generic [ref=f1e317]:
              - checkbox "Select Sequence hearth 017 for group orders" [ref=f1e319]
              - button "Sequence hearth 017 8 people · Oath guard" [ref=f1e320] [cursor=pointer]:
                - generic [aria-hidden] [ref=f1e321]: ⌂
                - generic [ref=f1e322]:
                  - strong [ref=f1e323]: Sequence hearth 017
                  - generic [ref=f1e324]: 8 people · Oath guard
                - generic [aria-hidden] [ref=f1e325]: ›
            - generic [ref=f1e326]:
              - checkbox "Select Sequence hearth 018 for group orders" [ref=f1e328]
              - button "Sequence hearth 018 8 people · Oath guard" [ref=f1e329] [cursor=pointer]:
                - generic [aria-hidden] [ref=f1e330]: ⌂
                - generic [ref=f1e331]:
                  - strong [ref=f1e332]: Sequence hearth 018
                  - generic [ref=f1e333]: 8 people · Oath guard
                - generic [aria-hidden] [ref=f1e334]: ›
            - generic [ref=f1e335]:
              - checkbox "Select Sequence hearth 019 for group orders" [ref=f1e337]
              - button "Sequence hearth 019 8 people · Oath guard" [ref=f1e338] [cursor=pointer]:
                - generic [aria-hidden] [ref=f1e339]: ⌂
                - generic [ref=f1e340]:
                  - strong [ref=f1e341]: Sequence hearth 019
                  - generic [ref=f1e342]: 8 people · Oath guard
                - generic [aria-hidden] [ref=f1e343]: ›
            - generic [ref=f1e344]:
              - checkbox "Select Sequence hearth 020 for group orders" [ref=f1e346]
              - button "Sequence hearth 020 8 people · Oath guard" [ref=f1e347] [cursor=pointer]:
                - generic [aria-hidden] [ref=f1e348]: ⌂
                - generic [ref=f1e349]:
                  - strong [ref=f1e350]: Sequence hearth 020
                  - generic [ref=f1e351]: 8 people · Oath guard
                - generic [aria-hidden] [ref=f1e352]: ›
            - generic [ref=f1e353]:
              - checkbox "Select Sequence hearth 021 for group orders" [ref=f1e355]
              - button "Sequence hearth 021 8 people · Oath guard" [ref=f1e356] [cursor=pointer]:
                - generic [aria-hidden] [ref=f1e357]: ⌂
                - generic [ref=f1e358]:
                  - strong [ref=f1e359]: Sequence hearth 021
                  - generic [ref=f1e360]: 8 people · Oath guard
                - generic [aria-hidden] [ref=f1e361]: ›
            - generic [ref=f1e362]:
              - checkbox "Select Sequence hearth 022 for group orders" [ref=f1e364]
              - button "Sequence hearth 022 8 people · Oath guard" [ref=f1e365] [cursor=pointer]:
                - generic [aria-hidden] [ref=f1e366]: ⌂
                - generic [ref=f1e367]:
                  - strong [ref=f1e368]: Sequence hearth 022
                  - generic [ref=f1e369]: 8 people · Oath guard
                - generic [aria-hidden] [ref=f1e370]: ›
            - generic [ref=f1e371]:
              - checkbox "Select Sequence hearth 023 for group orders" [ref=f1e373]
              - button "Sequence hearth 023 8 people · Oath guard" [ref=f1e374] [cursor=pointer]:
                - generic [aria-hidden] [ref=f1e375]: ⌂
                - generic [ref=f1e376]:
                  - strong [ref=f1e377]: Sequence hearth 023
                  - generic [ref=f1e378]: 8 people · Oath guard
                - generic [aria-hidden] [ref=f1e379]: ›
            - generic [ref=f1e380]:
              - checkbox "Select Sequence hearth 024 for group orders" [ref=f1e382]
              - button "Sequence hearth 024 8 people · Oath guard" [ref=f1e383] [cursor=pointer]:
                - generic [aria-hidden] [ref=f1e384]: ⌂
                - generic [ref=f1e385]:
                  - strong [ref=f1e386]: Sequence hearth 024
                  - generic [ref=f1e387]: 8 people · Oath guard
                - generic [aria-hidden] [ref=f1e388]: ›
            - generic [ref=f1e389]:
              - checkbox "Select Sequence hearth 025 for group orders" [ref=f1e391]
              - button "Sequence hearth 025 8 people · Oath guard" [ref=f1e392] [cursor=pointer]:
                - generic [aria-hidden] [ref=f1e393]: ⌂
                - generic [ref=f1e394]:
                  - strong [ref=f1e395]: Sequence hearth 025
                  - generic [ref=f1e396]: 8 people · Oath guard
                - generic [aria-hidden] [ref=f1e397]: ›
          - navigation "Registry pages" [ref=f1e398]:
            - button "Previous registry page" [disabled] [ref=f1e399]: ←
            - generic [ref=f1e400]: Page 1 of 2
            - button "Next registry page" [ref=f1e401] [cursor=pointer]: →
      - paragraph [ref=f1e402]: Choose an entry to locate it on the map. Use the bottom command tray for its orders.
  - contentinfo [ref=f1e403]:
    - generic [ref=f1e405]:
      - generic [ref=f1e406]: Selected army
      - strong [ref=f1e407]: Oath guard
      - generic [ref=f1e408]: 1 / 12 formations · 60 strength · 3 movement
      - button "Show selected orders" [ref=f1e410] [cursor=pointer]
    - region "Next-action navigation" [ref=f1e411]:
      - generic [ref=f1e412]:
        - button "Previous army needing orders" [ref=f1e413] [cursor=pointer]: ‹
        - button "Next army needing orders" [ref=f1e414] [cursor=pointer]: Next army N
        - button "Previous idle settlement" [disabled] [ref=f1e415]: ‹
        - button "Next idle settlement" [disabled] [ref=f1e416]: Next town S
      - paragraph [ref=f1e417]: "Labor: 134 unassigned households · 40 settlements"
      - generic [ref=f1e418]:
        - button "Previous settlement with unassigned households" [ref=f1e419] [cursor=pointer]: ‹
        - button "Next settlement with unassigned households" [ref=f1e420] [cursor=pointer]: Review households
      - group [ref=f1e421]:
        - generic "What wants a decision 2 kinds" [ref=f1e422] [cursor=pointer]:
          - text: What wants a decision
          - generic [ref=f1e423]: 2 kinds
    - generic [ref=f1e424]:
      - strong [ref=f1e426]: Turn 1
      - button "End turn" [ref=f1e427] [cursor=pointer]:
        - text: End turn
        - generic [ref=f1e428]: E
    - status [ref=f1e429]:
      - generic [aria-hidden] [ref=f1e430]: ◆
      - text: 120 production orders accepted; 0 hearth sequences stopped.
  - generic [ref=f1e431]:
    - button "Art Lab" [ref=f1e432] [cursor=pointer]
    - generic [ref=f1e433]: Development asset inspector
```

# Test source

```ts
  106 | }
  107 | 
  108 | test('forty hearths recall a personal ordered sequence, pay for one batch, retain individual control and restore saved queues', async ({ page }, testInfo) => {
  109 |   const game = empireLandCampaign('legendary');
  110 |   const towns = Object.values(game.settlements).filter(town => town.factionId === game.turnOwnerId).sort((a, b) => a.id < b.id ? -1 : 1);
  111 |   towns.forEach((town, index) => { town.name = `Sequence hearth ${String(index + 1).padStart(3, '0')}`; });
  112 |   expect(towns).toHaveLength(40);
  113 |   expect(Object.values(game.armies).filter(army => army.factionId === game.turnOwnerId)).toHaveLength(100);
  114 |   expect(applyCommand(game, { type: 'queue', factionId: game.turnOwnerId, settlementId: towns[0]!.id, itemId: 'building.granary' }).ok).toBe(true);
  115 |   expect(applyCommand(game, { type: 'setSelectionGroup', factionId: game.turnOwnerId, kind: 'settlements', name: 'All workshop hearths', memberIds: towns.map(town => town.id) }).ok).toBe(true);
  116 |   const errors: string[] = [];
  117 |   page.on('pageerror', error => errors.push(error.message));
  118 |   await observeTraffic(page);
  119 |   await importCampaign(page, game);
  120 |   await save(page);
  121 |   await openRegistry(page, 'armies');
  122 |   await page.getByTestId('army-registry').getByRole('checkbox').first().check();
  123 |   await openRegistry(page, 'settlements');
  124 |   const beforeRecall = await snapshot(page), recallTraffic = await traffic(page);
  125 |   await recallHearths(page, true);
  126 |   expect((await snapshot(page)).hash).toBe(beforeRecall.hash);
  127 |   expect(await traffic(page)).toEqual(recallTraffic);
  128 |   const panel = await disclose(page, 'group-production');
  129 |   await removeAll(panel);
  130 |   const beforePreferences = await snapshot(page), preferenceTraffic = await traffic(page);
  131 |   await addItem(panel, 'building.workshop');
  132 |   await addItem(panel, 'unit.guard');
  133 |   await addItem(panel, 'unit.scout');
  134 |   await addItem(panel, 'unit.guard');
  135 |   const rows = panel.getByTestId('production-sequence-item');
  136 |   await rows.nth(1).getByRole('button', { name: /^Move item .* up$/ }).click();
  137 |   await rows.nth(2).getByRole('button', { name: /^Remove item / }).click();
  138 |   await expect(rows).toHaveCount(3);
  139 |   await expect(rows.nth(0)).toContainText('Oath guard');
  140 |   await expect(rows.nth(1)).toContainText('Cinder workshop');
  141 |   await expect(rows.nth(2)).toContainText('Oath guard');
  142 |   const templates = await disclose(page, 'production-templates');
  143 |   const library = templates.getByRole('combobox', { name: 'Saved production template', exact: true });
  144 |   const name = templates.getByRole('textbox', { name: 'Production template name', exact: true });
  145 |   await name.fill('Workshop watch');
  146 |   await templates.getByRole('button', { name: 'Save production template', exact: true }).click();
  147 |   await expect(library.getByRole('option', { name: /Workshop watch/ })).toHaveCount(1);
  148 |   const templateId = await library.getByRole('option', { name: /Workshop watch/ }).getAttribute('value');
  149 |   expect(templateId).toBeTruthy();
  150 |   await name.fill('Realm watch');
  151 |   await templates.getByRole('button', { name: 'Update production template', exact: true }).click();
  152 |   await expect(library.getByRole('option', { name: /Realm watch/ })).toHaveAttribute('value', templateId!);
  153 |   await expect(library.getByRole('option', { name: /Workshop watch/ })).toHaveCount(0);
  154 |   await removeAll(panel);
  155 |   await library.selectOption(templateId!);
  156 |   await expect(rows).toHaveCount(0);
  157 |   await templates.getByRole('button', { name: 'Recall production template', exact: true }).click();
  158 |   await expect(rows).toHaveCount(3);
  159 |   expect((await snapshot(page)).hash).toBe(beforePreferences.hash);
  160 |   expect((await snapshot(page)).view.ownSettlements.map(town => town.queue)).toEqual(beforePreferences.view.ownSettlements.map(town => town.queue));
  161 |   expect(await traffic(page)).toEqual(preferenceTraffic);
  162 |   await expect(page.getByTestId('group-charters')).toContainText('40 hearths selected');
  163 |   await expect(panel.getByTestId('production-sequence-cost')).toContainText('36 coin per hearth · 1440 coin across this selection');
  164 |   await page.screenshot({ path: testInfo.outputPath('production-sequences-desktop.png') });
  165 |   await openRegistry(page, 'armies');
  166 |   await expect(page.getByTestId('group-postings')).toContainText('1 armies selected');
  167 |   await openRegistry(page, 'settlements');
  168 |   await expect(page.getByTestId('group-charters')).toContainText('40 hearths selected');
  169 | 
  170 |   await settings(page);
  171 |   const downloadPromise = page.waitForEvent('download');
  172 |   await page.getByRole('button', { name: 'Export campaign', exact: true }).click();
  173 |   const downloaded = await (await downloadPromise).path();
  174 |   expect(downloaded).toBeTruthy();
  175 |   const exported = await importSave(await readFile(downloaded!)), campaign = deserializeCampaign(exported);
  176 |   expect(stateHash(campaign.game)).toBe(beforePreferences.hash);
  177 |   expect(campaign.archive.records).toHaveLength(0);
  178 |   expect(exported).not.toContain('Realm watch');
  179 |   expect(exported).not.toContain('Workshop watch');
  180 |   expect(campaign.game.selectionGroups).toEqual(game.selectionGroups);
  181 | 
  182 |   await restoreAfterReload(page);
  183 |   await recallHearths(page, true);
  184 |   await disclose(page, 'group-production', true);
  185 |   await removeAll(panel);
  186 |   await disclose(page, 'production-templates', true);
  187 |   await expect(library.getByRole('option', { name: /Realm watch/ })).toHaveCount(1);
  188 |   const beforeTemplateRecall = await snapshot(page), beforeTemplateTraffic = await traffic(page);
  189 |   await library.selectOption(templateId!);
  190 |   await expect(rows).toHaveCount(0);
  191 |   await templates.getByRole('button', { name: 'Recall production template', exact: true }).focus();
  192 |   await page.keyboard.press('Enter');
  193 |   await expect(rows).toHaveCount(3);
  194 |   expect((await snapshot(page)).hash).toBe(beforeTemplateRecall.hash);
  195 |   expect(await traffic(page)).toEqual(beforeTemplateTraffic);
  196 |   await page.setViewportSize({ width: 390, height: 844 });
  197 |   await panel.scrollIntoViewIfNeeded();
  198 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  199 |   await page.screenshot({ path: testInfo.outputPath('production-sequences-narrow.png') });
  200 |   const before = await snapshot(page), beforeTraffic = await traffic(page);
  201 |   await panel.getByRole('button', { name: 'Apply production (40)', exact: true }).click();
  202 |   const results = page.getByTestId('group-production-results');
  203 |   await expect(results.locator(':scope > p').first()).toContainText('40 hearths complete · 0 partial or refused. 120 orders accepted · 0 refused.');
  204 |   await expect(page.getByTestId('group-charters')).toContainText('0 hearths selected');
  205 |   const afterTraffic = await traffic(page), applied = await snapshot(page);
> 206 |   expect(afterTraffic.sent - beforeTraffic.sent).toBe(1);
      |                                                  ^ Error: expect(received).toBe(expected) // Object.is equality
  207 |   expect(afterTraffic.received - beforeTraffic.received).toBe(1);
  208 |   expect(afterTraffic.states - beforeTraffic.states).toBe(1);
  209 |   expect(afterTraffic.groups - beforeTraffic.groups).toBe(1);
  210 |   const serial = deserializeGame(serializeGame(game));
  211 |   for (const town of towns) for (const itemId of sequenceIds) expect(applyCommand(serial, { type: 'queue', factionId: serial.turnOwnerId, settlementId: town.id, itemId }).ok).toBe(true);
  212 |   expect(applied.hash).toBe(stateHash(serial));
  213 |   expect(applied.view.treasury).toBe(before.view.treasury - 40 * 36);
  214 |   for (const town of applied.view.ownSettlements) expect(town.queue.map(item => item.itemId)).toEqual([...(town.id === towns[0]!.id ? ['building.granary'] : []), ...sequenceIds]);
  215 |   expect(applied.view.charters).toEqual(before.view.charters);
  216 |   expect(applied.view.selectionGroups).toEqual(before.view.selectionGroups);
  217 |   expect(applied.view.exploredCells).toBe(before.view.exploredCells);
  218 |   expect(applied.metrics.cellTransferBytes).toBe(cellTransferBytes(packCells([])));
  219 |   expect(applied.metrics.totalTransferBytes - before.metrics.totalTransferBytes).toBe(applied.metrics.transferBytes);
  220 |   const summary = results.locator(':scope > p').first();
  221 |   await summary.scrollIntoViewIfNeeded();
  222 |   const png = await summary.screenshot({ path: testInfo.outputPath('production-sequence-results.png') });
  223 |   const capture = { authored: 'Legendary/gen4/seed20260905; 40 owned hearths, 100 owned armies, 4000 total armies; paid initial granary queue; saved hearth-group command', viewport: { width: 390, height: 844 }, locator: '[data-testid="group-production-results"] > p:first-child', boundingBox: await summary.boundingBox(), bytes: png.byteLength, stage: 'Explicit three-item list completed for forty hearths:120 paid queue commands, preserving the existing granary. Capture shows the actual result summary only.', transformations: 'none; direct Playwright locator PNG', publishedStates: afterTraffic.states - beforeTraffic.states, transferBytes: applied.metrics.transferBytes, cellTransferBytes: applied.metrics.cellTransferBytes, commandMs: applied.metrics.commandMs, beforeHash: before.hash, afterHash: applied.hash };
  224 |   await writeFile(testInfo.outputPath('production-sequence-capture.json'), JSON.stringify(capture, null, 2));
  225 |   await testInfo.attach('production-sequence-capture.json', { body: JSON.stringify(capture, null, 2), contentType: 'application/json' });
  226 | 
  227 |   await selectFromRegistry(page, 'settlements', towns[0]!.name);
  228 |   await openProduction(page, 'land');
  229 |   await page.getByRole('button', { name: 'Recruit Wayfinder', exact: true }).click();
  230 |   await expect.poll(async () => (await snapshot(page)).view.ownSettlements.find(town => town.id === towns[0]!.id)?.queue.map(item => item.itemId)).toEqual(['building.granary', ...sequenceIds, 'unit.scout']);
  231 |   const overridden = await snapshot(page);
  232 |   expect(overridden.view.treasury).toBe(applied.view.treasury - 8);
  233 |   expect(overridden.view.ownSettlements.filter(town => town.id !== towns[0]!.id).map(town => town.queue)).toEqual(applied.view.ownSettlements.filter(town => town.id !== towns[0]!.id).map(town => town.queue));
  234 |   await save(page);
  235 |   await restoreAfterReload(page);
  236 |   expect((await snapshot(page)).hash).toBe(overridden.hash);
  237 |   await recallHearths(page);
  238 |   await disclose(page, 'group-production');
  239 |   await disclose(page, 'production-templates');
  240 |   await library.selectOption(templateId!);
  241 |   const beforeDelete = await snapshot(page), deleteTraffic = await traffic(page);
  242 |   await templates.getByRole('button', { name: 'Delete production template', exact: true }).click();
  243 |   await expect(library.getByRole('option', { name: /Realm watch/ })).toHaveCount(0);
  244 |   expect((await snapshot(page)).hash).toBe(beforeDelete.hash);
  245 |   expect(await traffic(page)).toEqual(deleteTraffic);
  246 |   expect(errors).toEqual([]);
  247 | });
  248 | 
  249 | test('shared coin and ordinary duplicate, full-queue and prerequisite refusals retain paid prefixes in stable hearth order', async ({ page }) => {
  250 |   const game = empireLandCampaign('legendary');
  251 |   const towns = Object.values(game.settlements).filter(town => town.factionId === game.turnOwnerId).sort((a, b) => a.id < b.id ? -1 : 1);
  252 |   towns.forEach((town, index) => { town.name = `Refusal hearth ${String(index + 1).padStart(3, '0')}`; });
  253 |   expect(applyCommand(game, { type: 'queue', factionId: game.turnOwnerId, settlementId: towns[0]!.id, itemId: 'building.granary' }).ok).toBe(true);
  254 |   for (let index = 0; index < 4; index++) expect(applyCommand(game, { type: 'queue', factionId: game.turnOwnerId, settlementId: towns[1]!.id, itemId: 'unit.guard' }).ok).toBe(true);
  255 |   // Authored budget after real paid setup:12+12+(12+8), then the fourth hearth cannot pay.
  256 |   game.factions.find(faction => faction.id === game.turnOwnerId)!.treasury = 44;
  257 |   const errors: string[] = [];
  258 |   page.on('pageerror', error => errors.push(error.message));
  259 |   await importCampaign(page, game);
  260 |   await openRegistry(page, 'settlements');
  261 |   const registry = page.getByTestId('settlement-registry');
  262 |   for (let index = 3; index >= 0; index--) await registry.getByRole('checkbox').nth(index).check();
  263 |   const panel = await disclose(page, 'group-production');
  264 |   await removeAll(panel);
  265 |   for (const itemId of ['unit.guard', 'building.granary', 'unit.transport']) await addItem(panel, itemId);
  266 |   await panel.getByRole('button', { name: 'Apply production (4)', exact: true }).click();
  267 |   const results = page.getByTestId('group-production-results');
  268 |   await expect(results.locator(':scope > p').first()).toContainText('0 hearths complete · 4 partial or refused. 4 orders accepted · 4 refused.');
  269 |   await expect(results).toContainText('already built or queued');
  270 |   await expect(results).toContainText('queue is full');
  271 |   await expect(results).toContainText('Coastal navigation');
  272 |   await expect(results).toContainText('Not enough coin');
  273 |   await expect(page.getByTestId('group-charters')).toContainText('4 hearths selected');
  274 |   const after = await snapshot(page), queue = (id: string) => after.view.ownSettlements.find(town => town.id === id)!.queue.map(item => item.itemId);
  275 |   expect(after.view.treasury).toBe(0);
  276 |   expect(queue(towns[0]!.id)).toEqual(['building.granary', 'unit.guard']);
  277 |   expect(queue(towns[1]!.id)).toEqual(Array(5).fill('unit.guard'));
  278 |   expect(queue(towns[2]!.id)).toEqual(['unit.guard', 'building.granary']);
  279 |   expect(queue(towns[3]!.id)).toEqual([]);
  280 |   expect(after.view.ownSettlements.filter(town => !towns.slice(0, 4).some(selected => selected.id === town.id)).every(town => town.queue.length === 0)).toBe(true);
  281 |   for (let index = 0; index < 4; index++) await expect(registry.getByRole('checkbox').nth(index)).toBeChecked();
  282 |   expect(errors).toEqual([]);
  283 | });
  284 | 
```