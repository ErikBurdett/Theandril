# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: empire-delegation.spec.ts >> a mature realm resolves joined budget and frontier exceptions while preserving delegated work through saved continuation
- Location: tests/gameplay/empire-delegation.spec.ts:74:1

# Error details

```
Error: expect(received).toHaveLength(expected)

Expected length: 13
Received length: 14
Received array:  ["army.1089", "army.1121", "army.1153", "army.1185", "army.1217", "army.1249", "army.1281", "army.129", "army.1313", "army.1345", …]
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - button "Import save file"
  - generic [ref=e4]:
    - banner [ref=e5]:
      - heading "Theandril" [level=1] [ref=e8]
      - generic [ref=e9]:
        - generic [ref=e10]:
          - generic [ref=e11]: TREASURY
          - strong [ref=e12]: 0 coin
        - generic [ref=e13]:
          - generic [ref=e14]: KNOWLEDGE
          - strong [ref=e15]: "35"
    - navigation "Campaign navigation" [ref=e16]:
      - generic [ref=e17]:
        - text: Standard pace ·
        - generic [ref=e18]: 32 realms
    - group [ref=e19]:
      - generic "Campaign & settings" [ref=e20] [cursor=pointer]
  - main [ref=e21]:
    - region "Strategic map" [ref=e22]:
      - generic "World map. Select an army then click a highlighted hex to move or an enemy to attack. Hover to preview routes. Drag to pan; scroll to zoom all the way to world overview. Arrow keys pan; plus and minus zoom. Focus selection returns to local detail. Enter opens map actions for the selection. Escape closes map actions before clearing selection. The army panel has keyboard and touch route controls." [ref=e23]
      - navigation "Map management" [ref=e25]:
        - button "Armies & fleets" [ref=e26] [cursor=pointer]
        - button "Settlements" [ref=e30] [cursor=pointer]
        - button "Characters & agents" [ref=e34] [cursor=pointer]:
          - generic [ref=e37]: Characters
        - button "Realm progression" [ref=e38] [cursor=pointer]:
          - generic [ref=e41]: Research
        - button "Realm affairs" [ref=e42] [cursor=pointer]:
          - generic [ref=e45]: Diplomacy
        - button "Campaign journal" [ref=e46] [cursor=pointer]
        - button "World overview" [ref=e50] [cursor=pointer]
      - generic [ref=e54]:
        - button "Zoom in" [ref=e55] [cursor=pointer]: +
        - button "Zoom out" [ref=e56] [cursor=pointer]: −
        - button "Focus selection" [ref=e57] [cursor=pointer]
        - button "Open map actions" [ref=e58] [cursor=pointer]
        - button "Map guide" [ref=e59] [cursor=pointer]: "?"
      - group:
        - generic "World map · Terrain" [ref=e60] [cursor=pointer]
  - dialog [ref=e61]:
    - banner [ref=e62]:
      - generic [ref=e63]:
        - generic [ref=e64]: The realm's ledgers
        - heading "Realm registry" [level=2] [ref=e65]
        - paragraph [ref=e66]: Ashen Compact
      - button "Close Realm registry" [ref=e67] [cursor=pointer]: ×
    - generic [ref=e69]:
      - generic [ref=e70]:
        - img "Ashen Compact crest · approved faction artwork" [ref=e71]
        - generic [ref=e72]:
          - generic [ref=e73]: Your people
          - heading "Ashen Compact" [level=3] [ref=e74]
      - generic [ref=e76]:
        - tablist "Realm registry" [ref=e77]:
          - tab "Armies 128" [selected] [ref=e78] [cursor=pointer]
          - tab "Settlements 30" [ref=e79] [cursor=pointer]
        - button "Characters & agents" [ref=e80] [cursor=pointer]: Characters 0
      - generic [ref=e81]:
        - text: Search your realm
        - searchbox "Search your realm" [ref=e82]
      - tabpanel "Armies 128" [ref=e83]:
        - generic [ref=e84]:
          - text: Force type
          - combobox "Force type" [ref=e85]:
            - option "All armies & fleets" [selected]
            - option "Land armies ashore"
            - option "Fleets"
            - option "Embarked armies"
        - generic [ref=e86]:
          - generic [ref=e87]:
            - generic [ref=e88]:
              - text: Registry order
              - combobox "Registry order" [ref=e89]:
                - option "Stable order" [selected]
                - option "Name A–Z"
            - generic [ref=e90]: 128 forces
          - group [ref=e91]:
            - generic "Saved army groups" [ref=e92] [cursor=pointer]
            - option "Choose a saved army group" [selected]
            - option "Northern relief"
            - option "Northern watch"
          - region "Group army postings" [ref=e93]:
            - generic [ref=e94]:
              - button "Select matching armies" [ref=e95] [cursor=pointer]
              - button "Clear group selection" [disabled] [ref=e96]
            - status [ref=e97]: 0 armies selected
            - paragraph [ref=e98]: Check land armies ashore to give them a standing posting together. Select up to 128 at a time; page and search changes keep your selection.
          - group [ref=e99]:
            - generic "Group travel" [ref=e100] [cursor=pointer]
            - option "Selected map hex · 10788" [selected]
            - option "Frontier reserve · hex 10776"
            - option "Frontier west · hex 10788"
            - option "Frontier east · hex 10800"
            - option "Delegated hearth 04 · hex 34975"
            - option "Delegated hearth 05 · hex 164271"
            - option "Delegated hearth 06 · hex 62183"
            - option "Delegated hearth 07 · hex 101677"
            - option "Delegated hearth 08 · hex 45591"
            - option "Delegated hearth 09 · hex 71450"
            - option "Delegated hearth 10 · hex 21108"
            - option "Delegated hearth 11 · hex 74764"
            - option "Delegated hearth 12 · hex 62426"
            - option "Delegated hearth 13 · hex 85635"
            - option "Delegated hearth 14 · hex 83647"
            - option "Delegated hearth 15 · hex 95123"
            - option "Delegated hearth 16 · hex 113375"
            - option "Delegated hearth 17 · hex 83286"
            - option "Delegated hearth 18 · hex 95715"
            - option "Delegated hearth 19 · hex 27714"
            - option "Delegated hearth 20 · hex 133506"
            - option "Delegated hearth 21 · hex 118436"
            - option "Delegated hearth 22 · hex 121274"
            - option "Delegated hearth 23 · hex 138851"
            - option "Delegated hearth 24 · hex 127514"
            - option "Delegated hearth 25 · hex 131881"
            - option "Delegated hearth 26 · hex 100425"
            - option "Delegated hearth 27 · hex 29071"
            - option "Delegated hearth 28 · hex 150699"
            - option "Delegated hearth 29 · hex 32990"
            - option "Delegated hearth 30 · hex 63563"
            - option "Enter a hex number"
            - option "Replace route" [selected]
            - option "Append waypoint"
          - group [ref=e101]:
            - generic "Defensive theaters" [ref=e102] [cursor=pointer]
            - paragraph [ref=e103]: Assign armies to protect named hearths and gather surplus at a reserve hex. Allocation runs on the next End turn and never attacks automatically. Active or paused direct routes and standing postings override theater dispatch.
            - paragraph [ref=e104]: Each theater attempts at most 16 new routes per turn. Unfilled garrison gaps remain visible for later allocation.
            - generic [ref=e105]:
              - text: Defensive theater
              - combobox "Defensive theater" [ref=e106]:
                - option "New theater"
                - option "Northern watch · Enabled · 0 missing guards" [selected]
            - paragraph [ref=e107]: 1 / 8 theaters. Guards are whole armies, not formations or soldiers.
            - region "Edit defensive theater" [ref=e108]:
              - generic [ref=e109]:
                - text: Theater name
                - textbox "Theater name" [ref=e110]: Northern watch
              - paragraph [ref=e111]: Use a unique name of up to 40 characters. A hearth or army belongs to only one theater.
              - generic [ref=e112]:
                - text: Reserve destination
                - combobox "Reserve destination" [ref=e113]:
                  - option "Choose a known map hex or owned hearth" [disabled]
                  - option "Frontier west · hex 10788"
                  - option "Frontier reserve · hex 10776" [selected]
                  - option "Frontier east · hex 10800"
                  - option "Delegated hearth 04 · hex 34975"
                  - option "Delegated hearth 05 · hex 164271"
                  - option "Delegated hearth 06 · hex 62183"
                  - option "Delegated hearth 07 · hex 101677"
                  - option "Delegated hearth 08 · hex 45591"
                  - option "Delegated hearth 09 · hex 71450"
                  - option "Delegated hearth 10 · hex 21108"
                  - option "Delegated hearth 11 · hex 74764"
                  - option "Delegated hearth 12 · hex 62426"
                  - option "Delegated hearth 13 · hex 85635"
                  - option "Delegated hearth 14 · hex 83647"
                  - option "Delegated hearth 15 · hex 95123"
                  - option "Delegated hearth 16 · hex 113375"
                  - option "Delegated hearth 17 · hex 83286"
                  - option "Delegated hearth 18 · hex 95715"
                  - option "Delegated hearth 19 · hex 27714"
                  - option "Delegated hearth 20 · hex 133506"
                  - option "Delegated hearth 21 · hex 118436"
                  - option "Delegated hearth 22 · hex 121274"
                  - option "Delegated hearth 23 · hex 138851"
                  - option "Delegated hearth 24 · hex 127514"
                  - option "Delegated hearth 25 · hex 131881"
                  - option "Delegated hearth 26 · hex 100425"
                  - option "Delegated hearth 27 · hex 29071"
                  - option "Delegated hearth 28 · hex 150699"
                  - option "Delegated hearth 29 · hex 32990"
                  - option "Delegated hearth 30 · hex 63563"
              - generic [ref=e114]:
                - text: Guards per hearth
                - combobox "Guards per hearth" [ref=e115]:
                  - option "1 army" [selected]
                  - option "2 armies"
                  - option "3 armies"
                  - option "4 armies"
              - generic [ref=e116]:
                - text: Extra guards when threatened
                - combobox "Extra guards when threatened" [ref=e117]:
                  - option "Off"
                  - option "Up to 1 extra army" [selected]
                  - option "Up to 2 extra armies"
                  - option "Up to 3 extra armies"
                  - option "Up to 4 extra armies"
              - paragraph [ref=e118]: Visible wartime combat land armies within three hexes request one extra guard each, up to this limit. Extra guards hold through one quiet turn. Only idle assigned members can respond; minimum garrisons and direct orders keep priority. Army counts do not predict battle strength.
              - generic [ref=e119]:
                - checkbox "Enable dispatch on the next End turn" [checked] [ref=e120]
                - text: Enable dispatch on the next End turn
              - group "Protected hearths · 2 / 16" [ref=e121]:
                - generic [ref=e123]:
                  - text: Find protected hearths
                  - searchbox "Find protected hearths" [ref=e124]
                - list [ref=e125]:
                  - listitem [ref=e126]:
                    - generic [ref=e127]:
                      - checkbox "Frontier reserve · hex 10776" [ref=e128]
                      - generic [ref=e129]: Frontier reserve · hex 10776
                  - listitem [ref=e130]:
                    - generic [ref=e131]:
                      - checkbox "Frontier west · hex 10788" [checked] [ref=e132]
                      - generic [ref=e133]: Frontier west · hex 10788
                  - listitem [ref=e134]:
                    - generic [ref=e135]:
                      - checkbox "Frontier east · hex 10800" [checked] [ref=e136]
                      - generic [ref=e137]: Frontier east · hex 10800
                  - listitem [ref=e138]:
                    - generic [ref=e139]:
                      - checkbox "Delegated hearth 04 · hex 34975" [ref=e140]
                      - generic [ref=e141]: Delegated hearth 04 · hex 34975
                  - listitem [ref=e142]:
                    - generic [ref=e143]:
                      - checkbox "Delegated hearth 05 · hex 164271" [ref=e144]
                      - generic [ref=e145]: Delegated hearth 05 · hex 164271
                  - listitem [ref=e146]:
                    - generic [ref=e147]:
                      - checkbox "Delegated hearth 06 · hex 62183" [ref=e148]
                      - generic [ref=e149]: Delegated hearth 06 · hex 62183
                  - listitem [ref=e150]:
                    - generic [ref=e151]:
                      - checkbox "Delegated hearth 07 · hex 101677" [ref=e152]
                      - generic [ref=e153]: Delegated hearth 07 · hex 101677
                  - listitem [ref=e154]:
                    - generic [ref=e155]:
                      - checkbox "Delegated hearth 08 · hex 45591" [ref=e156]
                      - generic [ref=e157]: Delegated hearth 08 · hex 45591
                  - listitem [ref=e158]:
                    - generic [ref=e159]:
                      - checkbox "Delegated hearth 09 · hex 71450" [ref=e160]
                      - generic [ref=e161]: Delegated hearth 09 · hex 71450
                  - listitem [ref=e162]:
                    - generic [ref=e163]:
                      - checkbox "Delegated hearth 10 · hex 21108" [ref=e164]
                      - generic [ref=e165]: Delegated hearth 10 · hex 21108
                  - listitem [ref=e166]:
                    - generic [ref=e167]:
                      - checkbox "Delegated hearth 11 · hex 74764" [ref=e168]
                      - generic [ref=e169]: Delegated hearth 11 · hex 74764
                  - listitem [ref=e170]:
                    - generic [ref=e171]:
                      - checkbox "Delegated hearth 12 · hex 62426" [ref=e172]
                      - generic [ref=e173]: Delegated hearth 12 · hex 62426
                  - listitem [ref=e174]:
                    - generic [ref=e175]:
                      - checkbox "Delegated hearth 13 · hex 85635" [ref=e176]
                      - generic [ref=e177]: Delegated hearth 13 · hex 85635
                  - listitem [ref=e178]:
                    - generic [ref=e179]:
                      - checkbox "Delegated hearth 14 · hex 83647" [ref=e180]
                      - generic [ref=e181]: Delegated hearth 14 · hex 83647
                  - listitem [ref=e182]:
                    - generic [ref=e183]:
                      - checkbox "Delegated hearth 15 · hex 95123" [ref=e184]
                      - generic [ref=e185]: Delegated hearth 15 · hex 95123
                  - listitem [ref=e186]:
                    - generic [ref=e187]:
                      - checkbox "Delegated hearth 16 · hex 113375" [ref=e188]
                      - generic [ref=e189]: Delegated hearth 16 · hex 113375
                  - listitem [ref=e190]:
                    - generic [ref=e191]:
                      - checkbox "Delegated hearth 17 · hex 83286" [ref=e192]
                      - generic [ref=e193]: Delegated hearth 17 · hex 83286
                  - listitem [ref=e194]:
                    - generic [ref=e195]:
                      - checkbox "Delegated hearth 18 · hex 95715" [ref=e196]
                      - generic [ref=e197]: Delegated hearth 18 · hex 95715
                  - listitem [ref=e198]:
                    - generic [ref=e199]:
                      - checkbox "Delegated hearth 19 · hex 27714" [ref=e200]
                      - generic [ref=e201]: Delegated hearth 19 · hex 27714
                  - listitem [ref=e202]:
                    - generic [ref=e203]:
                      - checkbox "Delegated hearth 20 · hex 133506" [ref=e204]
                      - generic [ref=e205]: Delegated hearth 20 · hex 133506
                  - listitem [ref=e206]:
                    - generic [ref=e207]:
                      - checkbox "Delegated hearth 21 · hex 118436" [ref=e208]
                      - generic [ref=e209]: Delegated hearth 21 · hex 118436
                  - listitem [ref=e210]:
                    - generic [ref=e211]:
                      - checkbox "Delegated hearth 22 · hex 121274" [ref=e212]
                      - generic [ref=e213]: Delegated hearth 22 · hex 121274
                  - listitem [ref=e214]:
                    - generic [ref=e215]:
                      - checkbox "Delegated hearth 23 · hex 138851" [ref=e216]
                      - generic [ref=e217]: Delegated hearth 23 · hex 138851
                  - listitem [ref=e218]:
                    - generic [ref=e219]:
                      - checkbox "Delegated hearth 24 · hex 127514" [ref=e220]
                      - generic [ref=e221]: Delegated hearth 24 · hex 127514
                  - listitem [ref=e222]:
                    - generic [ref=e223]:
                      - checkbox "Delegated hearth 25 · hex 131881" [ref=e224]
                      - generic [ref=e225]: Delegated hearth 25 · hex 131881
                - navigation "protected hearths pages" [ref=e226]:
                  - button "Previous protected hearths page" [disabled] [ref=e227]: ←
                  - generic [ref=e228]: Page 1 of 2
                  - button "Next protected hearths page" [ref=e229] [cursor=pointer]: →
              - paragraph [ref=e230]: 13 draft member armies · 0 eligible checked armies. 0 unavailable or noncombat · 0 assigned to another theater.
              - button "Use checked armies (0)" [ref=e231] [cursor=pointer]
              - paragraph [ref=e232]: Use checked armies replaces the draft membership; it issues no order. Only owned combat land armies ashore can be added. Existing member armies stay assigned while other settings are edited.
              - paragraph [ref=e233]: Saving replaces the theater configuration. 0 existing member armies will be removed and 0 added. Removed armies keep existing travel routes.
              - button "Save theater changes" [ref=e234] [cursor=pointer]
              - button "Reset theater draft" [ref=e235] [cursor=pointer]
            - paragraph [ref=e236]: Pause, delete and detach stop future theater dispatch only. Existing routes continue; cancel travel separately when needed. Captured hearths remain listed but are not staffed. Lost member armies are pruned.
            - generic [ref=e237]:
              - button "Pause theater" [ref=e238] [cursor=pointer]
              - button "Delete theater" [ref=e239] [cursor=pointer]
            - region "Northern watch defense report" [ref=e240]:
              - heading "Northern watch · Enabled" [level=4] [ref=e241]
              - paragraph [ref=e242]: 0 missing guards · 1 incoming · 9 in reserve · 2 direct overrides.
              - heading "Protected hearths" [level=5] [ref=e243]
              - list [ref=e244]:
                - listitem [ref=e245]:
                  - strong [ref=e246]: Frontier west
                  - text: · 0 stationed · 2 incoming · 2 required · 0 missing · hex 10788
                  - generic [ref=e247]: · 1 visible enemy armies nearby · 1 extra guards requested
                - listitem [ref=e248]:
                  - strong [ref=e249]: Frontier east
                  - text: · 0 stationed · 2 incoming · 1 required · 0 missing · hex 10800
                  - generic [ref=e250]: · 0 visible enemy armies nearby · 0 extra guards requested
              - heading "Member armies" [level=5] [ref=e251]
              - list [ref=e252]:
                - listitem [ref=e253]:
                  - strong [ref=e254]: Stranded reserve
                  - generic [ref=e255]: ready · hex 13862
                  - button "Detach Stranded reserve from theater" [ref=e256] [cursor=pointer]: Detach army
                - listitem [ref=e257]:
                  - strong [ref=e258]: Direct watch override
                  - generic [ref=e259]: overridden · hex 10776
                  - generic [ref=e260]: A standing posting takes priority. Clear it to delegate this army.
                  - button "Detach Direct watch override from theater" [ref=e261] [cursor=pointer]: Detach army
                - listitem [ref=e262]:
                  - strong [ref=e263]: Northern watch 01
                  - generic [ref=e264]: overridden · hex 10781 · assigned hex 10776
                  - generic [ref=e265]: Existing travel takes priority until it finishes.
                  - button "Detach Northern watch 01 from theater" [ref=e266] [cursor=pointer]: Detach army
                - listitem [ref=e267]:
                  - strong [ref=e268]: Northern watch 02
                  - generic [ref=e269]: reserve · hex 10776
                  - button "Detach Northern watch 02 from theater" [ref=e270] [cursor=pointer]: Detach army
                - listitem [ref=e271]:
                  - strong [ref=e272]: Northern watch 04
                  - generic [ref=e273]: incoming · hex 10778 · assigned hex 10788
                  - generic [ref=e274]: Existing travel takes priority until it finishes.
                  - button "Detach Northern watch 04 from theater" [ref=e275] [cursor=pointer]: Detach army
                - listitem [ref=e276]:
                  - strong [ref=e277]: Northern watch 05
                  - generic [ref=e278]: reserve · hex 10776
                  - button "Detach Northern watch 05 from theater" [ref=e279] [cursor=pointer]: Detach army
                - listitem [ref=e280]:
                  - strong [ref=e281]: Northern watch 06
                  - generic [ref=e282]: reserve · hex 10776
                  - button "Detach Northern watch 06 from theater" [ref=e283] [cursor=pointer]: Detach army
                - listitem [ref=e284]:
                  - strong [ref=e285]: Northern watch 07
                  - generic [ref=e286]: reserve · hex 10776
                  - button "Detach Northern watch 07 from theater" [ref=e287] [cursor=pointer]: Detach army
                - listitem [ref=e288]:
                  - strong [ref=e289]: Northern watch 08
                  - generic [ref=e290]: reserve · hex 10776
                  - button "Detach Northern watch 08 from theater" [ref=e291] [cursor=pointer]: Detach army
                - listitem [ref=e292]:
                  - strong [ref=e293]: Northern watch 09
                  - generic [ref=e294]: reserve · hex 10776
                  - button "Detach Northern watch 09 from theater" [ref=e295] [cursor=pointer]: Detach army
                - listitem [ref=e296]:
                  - strong [ref=e297]: Northern watch 10
                  - generic [ref=e298]: reserve · hex 10776
                  - button "Detach Northern watch 10 from theater" [ref=e299] [cursor=pointer]: Detach army
                - listitem [ref=e300]:
                  - strong [ref=e301]: Northern watch 11
                  - generic [ref=e302]: reserve · hex 10776
                  - button "Detach Northern watch 11 from theater" [ref=e303] [cursor=pointer]: Detach army
                - listitem [ref=e304]:
                  - strong [ref=e305]: Northern watch 12
                  - generic [ref=e306]: reserve · hex 10776
                  - button "Detach Northern watch 12 from theater" [ref=e307] [cursor=pointer]: Detach army
              - group [ref=e308]:
                - generic "Last theater dispatches" [ref=e309] [cursor=pointer]
                - paragraph [ref=e310]: Actual attempts from the last theater allocation, not a route preview. Accepted travel may have arrived or paused.
                - paragraph [ref=e311]: No dispatch attempts recorded.
            - status [ref=e312]: Saved defensive theater “Northern watch”. Idle members receive assignments next turn. Existing travel and postings continue. Autosaved.
          - generic [ref=e313]:
            - generic [ref=e314]:
              - checkbox "Select Northern relief interrupted for group orders" [ref=e316]
              - button "Northern relief interrupted 1 formation · 0 movement · 60 strength ↝ Travel queued" [ref=e317] [cursor=pointer]:
                - generic [aria-hidden] [ref=e318]: △
                - generic [ref=e319]:
                  - strong [ref=e320]: Northern relief interrupted
                  - generic [ref=e321]: 1 formation · 0 movement · 60 strength
                  - generic [ref=e322]: ↝ Travel queued
                - generic [aria-hidden] [ref=e323]: ›
            - generic [ref=e324]:
              - checkbox "Select Northern relief ready for group orders" [ref=e326]
              - button "Northern relief ready 1 formation · 0 movement · 60 strength ↝ Travel queued" [ref=e327] [cursor=pointer]:
                - generic [aria-hidden] [ref=e328]: △
                - generic [ref=e329]:
                  - strong [ref=e330]: Northern relief ready
                  - generic [ref=e331]: 1 formation · 0 movement · 60 strength
                  - generic [ref=e332]: ↝ Travel queued
                - generic [aria-hidden] [ref=e333]: ›
            - generic [ref=e334]:
              - checkbox "Select Stranded reserve for group orders" [ref=e336]
              - button "Stranded reserve 1 formation · 2 movement · 60 strength" [ref=e337] [cursor=pointer]:
                - generic [aria-hidden] [ref=e338]: △
                - generic [ref=e339]:
                  - strong [ref=e340]: Stranded reserve
                  - generic [ref=e341]: 1 formation · 2 movement · 60 strength
                - generic [aria-hidden] [ref=e342]: ›
            - generic [ref=e343]:
              - checkbox "Select Direct watch override for group orders" [ref=e345]
              - button "Direct watch override 1 formation · 2 movement · 60 strength" [ref=e346] [cursor=pointer]:
                - generic [aria-hidden] [ref=e347]: △
                - generic [ref=e348]:
                  - strong [ref=e349]: Direct watch override
                  - generic [ref=e350]: 1 formation · 2 movement · 60 strength
                - generic [aria-hidden] [ref=e351]: ›
            - generic [ref=e352]:
              - checkbox "Select Northern watch 01 for group orders" [ref=e354]
              - button "Northern watch 01 1 formation · 0 movement · 60 strength ↝ Travel queued" [ref=e355] [cursor=pointer]:
                - generic [aria-hidden] [ref=e356]: △
                - generic [ref=e357]:
                  - strong [ref=e358]: Northern watch 01
                  - generic [ref=e359]: 1 formation · 0 movement · 60 strength
                  - generic [ref=e360]: ↝ Travel queued
                - generic [aria-hidden] [ref=e361]: ›
            - generic [ref=e362]:
              - checkbox "Select Northern watch 02 for group orders" [ref=e364]
              - button "Northern watch 02 1 formation · 2 movement · 60 strength" [ref=e365] [cursor=pointer]:
                - generic [aria-hidden] [ref=e366]: △
                - generic [ref=e367]:
                  - strong [ref=e368]: Northern watch 02
                  - generic [ref=e369]: 1 formation · 2 movement · 60 strength
                - generic [aria-hidden] [ref=e370]: ›
            - generic [ref=e371]:
              - checkbox "Select Northern watch 03 for group orders" [ref=e373]
              - button "Northern watch 03 1 formation · 0 movement · 60 strength ↝ Travel queued" [ref=e374] [cursor=pointer]:
                - generic [aria-hidden] [ref=e375]: △
                - generic [ref=e376]:
                  - strong [ref=e377]: Northern watch 03
                  - generic [ref=e378]: 1 formation · 0 movement · 60 strength
                  - generic [ref=e379]: ↝ Travel queued
                - generic [aria-hidden] [ref=e380]: ›
            - generic [ref=e381]:
              - checkbox "Select Northern watch 04 for group orders" [ref=e383]
              - button "Northern watch 04 1 formation · 0 movement · 60 strength ↝ Travel queued" [ref=e384] [cursor=pointer]:
                - generic [aria-hidden] [ref=e385]: △
                - generic [ref=e386]:
                  - strong [ref=e387]: Northern watch 04
                  - generic [ref=e388]: 1 formation · 0 movement · 60 strength
                  - generic [ref=e389]: ↝ Travel queued
                - generic [aria-hidden] [ref=e390]: ›
            - generic [ref=e391]:
              - checkbox "Select Northern watch 05 for group orders" [ref=e393]
              - button "Northern watch 05 1 formation · 2 movement · 60 strength" [ref=e394] [cursor=pointer]:
                - generic [aria-hidden] [ref=e395]: △
                - generic [ref=e396]:
                  - strong [ref=e397]: Northern watch 05
                  - generic [ref=e398]: 1 formation · 2 movement · 60 strength
                - generic [aria-hidden] [ref=e399]: ›
            - generic [ref=e400]:
              - checkbox "Select Northern watch 06 for group orders" [ref=e402]
              - button "Northern watch 06 1 formation · 2 movement · 60 strength" [ref=e403] [cursor=pointer]:
                - generic [aria-hidden] [ref=e404]: △
                - generic [ref=e405]:
                  - strong [ref=e406]: Northern watch 06
                  - generic [ref=e407]: 1 formation · 2 movement · 60 strength
                - generic [aria-hidden] [ref=e408]: ›
            - generic [ref=e409]:
              - checkbox "Select Northern watch 07 for group orders" [ref=e411]
              - button "Northern watch 07 1 formation · 2 movement · 60 strength" [ref=e412] [cursor=pointer]:
                - generic [aria-hidden] [ref=e413]: △
                - generic [ref=e414]:
                  - strong [ref=e415]: Northern watch 07
                  - generic [ref=e416]: 1 formation · 2 movement · 60 strength
                - generic [aria-hidden] [ref=e417]: ›
            - generic [ref=e418]:
              - checkbox "Select Northern watch 08 for group orders" [ref=e420]
              - button "Northern watch 08 1 formation · 2 movement · 60 strength" [ref=e421] [cursor=pointer]:
                - generic [aria-hidden] [ref=e422]: △
                - generic [ref=e423]:
                  - strong [ref=e424]: Northern watch 08
                  - generic [ref=e425]: 1 formation · 2 movement · 60 strength
                - generic [aria-hidden] [ref=e426]: ›
            - generic [ref=e427]:
              - checkbox "Select Northern watch 09 for group orders" [ref=e429]
              - button "Northern watch 09 1 formation · 2 movement · 60 strength" [ref=e430] [cursor=pointer]:
                - generic [aria-hidden] [ref=e431]: △
                - generic [ref=e432]:
                  - strong [ref=e433]: Northern watch 09
                  - generic [ref=e434]: 1 formation · 2 movement · 60 strength
                - generic [aria-hidden] [ref=e435]: ›
            - generic [ref=e436]:
              - checkbox "Select Northern watch 10 for group orders" [ref=e438]
              - button "Northern watch 10 1 formation · 2 movement · 60 strength" [ref=e439] [cursor=pointer]:
                - generic [aria-hidden] [ref=e440]: △
                - generic [ref=e441]:
                  - strong [ref=e442]: Northern watch 10
                  - generic [ref=e443]: 1 formation · 2 movement · 60 strength
                - generic [aria-hidden] [ref=e444]: ›
            - generic [ref=e445]:
              - checkbox "Select Northern watch 11 for group orders" [ref=e447]
              - button "Northern watch 11 1 formation · 2 movement · 60 strength" [ref=e448] [cursor=pointer]:
                - generic [aria-hidden] [ref=e449]: △
                - generic [ref=e450]:
                  - strong [ref=e451]: Northern watch 11
                  - generic [ref=e452]: 1 formation · 2 movement · 60 strength
                - generic [aria-hidden] [ref=e453]: ›
            - generic [ref=e454]:
              - checkbox "Select Northern watch 12 for group orders" [ref=e456]
              - button "Northern watch 12 1 formation · 2 movement · 60 strength" [ref=e457] [cursor=pointer]:
                - generic [aria-hidden] [ref=e458]: △
                - generic [ref=e459]:
                  - strong [ref=e460]: Northern watch 12
                  - generic [ref=e461]: 1 formation · 2 movement · 60 strength
                - generic [aria-hidden] [ref=e462]: ›
            - generic [ref=e463]:
              - checkbox "Select Home guard 017 for group orders" [ref=e465]
              - button "Home guard 017 1 formation · 2 movement · 60 strength" [ref=e466] [cursor=pointer]:
                - generic [aria-hidden] [ref=e467]: △
                - generic [ref=e468]:
                  - strong [ref=e469]: Home guard 017
                  - generic [ref=e470]: 1 formation · 2 movement · 60 strength
                - generic [aria-hidden] [ref=e471]: ›
            - generic [ref=e472]:
              - checkbox "Select Home guard 018 for group orders" [ref=e474]
              - button "Home guard 018 1 formation · 2 movement · 60 strength" [ref=e475] [cursor=pointer]:
                - generic [aria-hidden] [ref=e476]: △
                - generic [ref=e477]:
                  - strong [ref=e478]: Home guard 018
                  - generic [ref=e479]: 1 formation · 2 movement · 60 strength
                - generic [aria-hidden] [ref=e480]: ›
            - generic [ref=e481]:
              - checkbox "Select Home guard 019 for group orders" [ref=e483]
              - button "Home guard 019 1 formation · 2 movement · 60 strength" [ref=e484] [cursor=pointer]:
                - generic [aria-hidden] [ref=e485]: △
                - generic [ref=e486]:
                  - strong [ref=e487]: Home guard 019
                  - generic [ref=e488]: 1 formation · 2 movement · 60 strength
                - generic [aria-hidden] [ref=e489]: ›
            - generic [ref=e490]:
              - checkbox "Select Home guard 020 for group orders" [ref=e492]
              - button "Home guard 020 1 formation · 2 movement · 60 strength" [ref=e493] [cursor=pointer]:
                - generic [aria-hidden] [ref=e494]: △
                - generic [ref=e495]:
                  - strong [ref=e496]: Home guard 020
                  - generic [ref=e497]: 1 formation · 2 movement · 60 strength
                - generic [aria-hidden] [ref=e498]: ›
            - generic [ref=e499]:
              - checkbox "Select Home guard 021 for group orders" [ref=e501]
              - button "Home guard 021 1 formation · 2 movement · 60 strength" [ref=e502] [cursor=pointer]:
                - generic [aria-hidden] [ref=e503]: △
                - generic [ref=e504]:
                  - strong [ref=e505]: Home guard 021
                  - generic [ref=e506]: 1 formation · 2 movement · 60 strength
                - generic [aria-hidden] [ref=e507]: ›
            - generic [ref=e508]:
              - checkbox "Select Home guard 022 for group orders" [ref=e510]
              - button "Home guard 022 1 formation · 2 movement · 60 strength" [ref=e511] [cursor=pointer]:
                - generic [aria-hidden] [ref=e512]: △
                - generic [ref=e513]:
                  - strong [ref=e514]: Home guard 022
                  - generic [ref=e515]: 1 formation · 2 movement · 60 strength
                - generic [aria-hidden] [ref=e516]: ›
            - generic [ref=e517]:
              - checkbox "Select Home guard 023 for group orders" [ref=e519]
              - button "Home guard 023 1 formation · 2 movement · 60 strength" [ref=e520] [cursor=pointer]:
                - generic [aria-hidden] [ref=e521]: △
                - generic [ref=e522]:
                  - strong [ref=e523]: Home guard 023
                  - generic [ref=e524]: 1 formation · 2 movement · 60 strength
                - generic [aria-hidden] [ref=e525]: ›
            - generic [ref=e526]:
              - checkbox "Select Home guard 024 for group orders" [ref=e528]
              - button "Home guard 024 1 formation · 2 movement · 60 strength" [ref=e529] [cursor=pointer]:
                - generic [aria-hidden] [ref=e530]: △
                - generic [ref=e531]:
                  - strong [ref=e532]: Home guard 024
                  - generic [ref=e533]: 1 formation · 2 movement · 60 strength
                - generic [aria-hidden] [ref=e534]: ›
            - generic [ref=e535]:
              - checkbox "Select Home guard 025 for group orders" [ref=e537]
              - button "Home guard 025 1 formation · 2 movement · 60 strength" [ref=e538] [cursor=pointer]:
                - generic [aria-hidden] [ref=e539]: △
                - generic [ref=e540]:
                  - strong [ref=e541]: Home guard 025
                  - generic [ref=e542]: 1 formation · 2 movement · 60 strength
                - generic [aria-hidden] [ref=e543]: ›
          - navigation "Registry pages" [ref=e544]:
            - button "Previous registry page" [disabled] [ref=e545]: ←
            - generic [ref=e546]: Page 1 of 6
            - button "Next registry page" [ref=e547] [cursor=pointer]: →
      - paragraph [ref=e548]: Choose an entry to locate it on the map. Use the bottom command tray for its orders.
  - contentinfo [ref=e549]:
    - generic [ref=e551]:
      - generic [ref=e552]: Selected settlement
      - strong [ref=e553]: Frontier west
      - generic [ref=e554]: 10 people · 1 queued projects
      - button "Show selected orders" [ref=e556] [cursor=pointer]
    - region "Next-action navigation" [ref=e557]:
      - generic [ref=e558]:
        - button "Previous army needing orders" [disabled] [ref=e559]: ‹
        - button "Next army needing orders" [disabled] [ref=e560]: Next army N
        - button "Previous idle settlement" [disabled] [ref=e561]: ‹
        - button "Next idle settlement" [disabled] [ref=e562]: Next town S
      - paragraph [ref=e563]: "Labor: 300 unassigned households · 30 settlements"
      - generic [ref=e564]:
        - button "Previous settlement with unassigned households" [ref=e565] [cursor=pointer]: ‹
        - button "Next settlement with unassigned households" [ref=e566] [cursor=pointer]: Review households
      - group [ref=e567]:
        - generic "What wants a decision 1 kind" [ref=e568] [cursor=pointer]:
          - text: What wants a decision
          - generic [ref=e569]: 1 kind
        - button "30 hearths with unassigned households" [ref=e570] [cursor=pointer]
    - generic [ref=e571]:
      - strong [ref=e573]: Turn 3
      - button "End turn" [ref=e574] [cursor=pointer]:
        - text: End turn
        - generic [ref=e575]: E
    - status [ref=e576]:
      - generic [aria-hidden] [ref=e577]: ◆
      - text: Saved defensive theater “Northern watch”. Idle members receive assignments next turn. Existing travel and postings continue. Autosaved.
  - generic [ref=e578]:
    - button "Art Lab" [ref=e579] [cursor=pointer]
    - generic [ref=e580]: Development asset inspector
```

# Test source

```ts
  152 |   await templates.getByRole('button', { name: 'Save production template', exact: true }).click();
  153 |   await expect(templates.getByRole('option', { name: /Frontier relief kit/ })).toHaveCount(1);
  154 |   for (let count = fixture.sequence.length; count > 0; count--) await production.getByTestId('production-sequence-item').first().getByRole('button', { name: /^Remove item/ }).click();
  155 |   const beforeRecall = await snapshot(page);
  156 |   await templates.getByRole('button', { name: 'Recall production template', exact: true }).click();
  157 |   expect((await snapshot(page)).hash).toBe(beforeRecall.hash);
  158 |   await production.getByRole('button', { name: 'Apply production (3)', exact: true }).click();
  159 |   const results = page.getByTestId('group-production-results');
  160 |   await expect(results).toContainText('1 hearth complete · 2 partial or refused. 3 orders accepted · 2 refused.');
  161 |   await expect(charters).toContainText('2 hearths selected');
  162 |   await results.locator(':scope > details > summary').click();
  163 |   await expect(results).toContainText('Paid and queued'); await expect(results).toContainText('Refused:');
  164 |   const paid = await snapshot(page);
  165 |   expect(paid.treasury).toBe(8);
  166 |   expect(paid.queues.find(town => town.id === fixture.frontier[0]!.id)!.queue.map(item => item.itemId)).toEqual(['building.granary', ...fixture.sequence]);
  167 |   expect(paid.queues.find(town => town.id === fixture.frontier[1]!.id)!.queue.map(item => item.itemId)).toEqual([fixture.sequence[0]]);
  168 |   expect(paid.queues.find(town => town.id === fixture.frontier[2]!.id)!.queue).toEqual([]);
  169 |   expect(paid.charters.map(({ settlementId, focus, ceiling }) => ({ settlementId, focus, ceiling }))).toEqual(policy.charters.map(({ settlementId, focus, ceiling }) => ({ settlementId, focus, ceiling })));
  170 |   await results.scrollIntoViewIfNeeded();
  171 |   await page.screenshot({ path: testInfo.outputPath('joined-budget-refusals-desktop.png') });
  172 |   stage('production template and partial shared-budget batch');
  173 | 
  174 |   await recall(page, 'armies', 'Northern relief');
  175 |   const travel = await disclose(page, 'group-movement');
  176 |   await travel.getByRole('combobox', { name: 'Travel destination', exact: true }).selectOption('hex');
  177 |   await travel.getByRole('spinbutton', { name: 'Destination hex', exact: true }).fill(String(fixture.frontier[2]!.cell));
  178 |   const beforeReview = await snapshot(page);
  179 |   await travel.getByRole('button', { name: 'Review routes', exact: true }).click();
  180 |   await expect(page.getByTestId('group-movement-preview')).toContainText('2 can queue · 1 unavailable');
  181 |   const reviewed = await snapshot(page);
  182 |   expect(reviewed.hash).toBe(beforeReview.hash);
  183 |   expect(reviewed.traffic.slice(beforeReview.traffic.length)).toEqual(['groupMovementPreview']);
  184 |   await travel.getByRole('button', { name: 'Apply reviewed routes (3)', exact: true }).click();
  185 |   await expect(page.getByTestId('group-movement-results')).toContainText('2 orders accepted · 1 refused');
  186 |   await expect(page.getByTestId('group-postings')).toContainText('1 armies selected');
  187 |   const rerouted = await snapshot(page);
  188 |   expect(rerouted.wars).toEqual(initial.wars); expect(rerouted.battle).toBe(false);
  189 |   expect(rerouted.postings).toEqual(initial.postings);
  190 |   expect(rerouted.routes.find(route => route.armyId === fixture.interruptedId)?.status).not.toBe('paused');
  191 |   stage('explicit group route review and partial application');
  192 | 
  193 |   await recall(page, 'armies', 'Northern watch');
  194 |   const theater = await disclose(page, 'defense-theaters', true);
  195 |   await theater.getByLabel('Theater name', { exact: true }).fill('Northern watch');
  196 |   await theater.getByRole('combobox', { name: 'Reserve destination', exact: true }).selectOption(String(fixture.reserve));
  197 |   await theater.getByRole('combobox', { name: 'Guards per hearth', exact: true }).selectOption('1');
  198 |   await theater.getByRole('combobox', { name: 'Extra guards when threatened', exact: true }).selectOption('1');
  199 |   await theater.getByRole('searchbox', { name: 'Find protected hearths', exact: true }).fill('Frontier');
  200 |   for (const town of fixture.frontier.slice(1)) await theater.getByRole('checkbox', { name: `${town.name} · hex ${town.cell}`, exact: true }).check();
  201 |   await theater.getByRole('button', { name: 'Use checked armies (14)', exact: true }).click();
  202 |   await page.setViewportSize({ width: 390, height: 844 });
  203 |   await theater.getByRole('combobox', { name: 'Extra guards when threatened', exact: true }).scrollIntoViewIfNeeded();
  204 |   await page.screenshot({ path: testInfo.outputPath('joined-reinforcement-controls-narrow.png') });
  205 |   const create = theater.getByRole('button', { name: 'Create theater', exact: true });
  206 |   await create.scrollIntoViewIfNeeded(); await expect(create).toBeInViewport();
  207 |   await page.screenshot({ path: testInfo.outputPath('joined-watch-controls-narrow.png') });
  208 |   await create.focus(); await page.keyboard.press('Enter');
  209 |   await expect(page.getByTestId('theater-report')).toContainText('Northern watch · Enabled');
  210 |   const created = (await snapshot(page)).theaters!.find(row => row.name === 'Northern watch')!;
  211 |   await closeManagement(page);
  212 |   await disclose(page, 'next-action-causes', true);
  213 |   await page.getByTestId('next-action-causes').getByRole('button', { name: 'Defensive theaters need attention · 1', exact: true }).focus();
  214 |   await page.keyboard.press('Enter');
  215 |   await expect(page.getByRole('dialog', { name: 'Realm registry', exact: true })).toBeVisible();
  216 |   await expect(theater).toHaveAttribute('open');
  217 |   await expect(theater.getByRole('combobox', { name: 'Defensive theater', exact: true })).toHaveValue(created.id);
  218 |   await expect(theater.locator(':scope > summary')).toBeFocused();
  219 |   await expect(theater.locator(':scope > summary')).toBeInViewport();
  220 |   await page.screenshot({ path: testInfo.outputPath('joined-attention-focus-narrow.png') });
  221 |   await endTurn(page);
  222 |   const allocated = await snapshot(page), report = allocated.theaters!.find(row => row.id === created.id)!;
  223 |   expect(report.enabled).toBe(true); expect(report.armyIds).toHaveLength(14);
  224 |   expect(report.reinforcementLimit).toBe(1);
  225 |   expect(report.hearths.find(hearth => hearth.settlementId === fixture.frontier[1]!.id)).toMatchObject({
  226 |     required: 2, reinforcement: { visibleEnemies: 1, extraGuards: 1 },
  227 |   });
  228 |   expect(report.members.find(member => member.armyId === fixture.overrideId)?.status).toBe('overridden');
  229 |   expect(report.lastDispatches.some(dispatch => !dispatch.accepted && dispatch.armyId === fixture.strandedId)).toBe(true);
  230 |   expect(report.lastDispatches.some(dispatch => dispatch.accepted)).toBe(true);
  231 |   expect(allocated.wars).toEqual(expect.arrayContaining(initial.wars)); expect(allocated.battle).toBe(false);
  232 |   expect(allocated.charters).toHaveLength(30);
  233 |   // This finite purse is exhausted by the mature realm's ordinary upkeep.
  234 |   // Delegation must explain its funding stop and preserve already-paid work.
  235 |   expect(allocated.treasury).toBe(0);
  236 |   expect(allocated.charters.filter(charter => charter.blocker === 'The treasury is within 40 coin of its reserve; the charter is waiting.')).toHaveLength(28);
  237 |   expect(allocated.queues.filter(town => town.queue.length).map(town => town.id)).toEqual(paid.queues.filter(town => town.queue.length).map(town => town.id));
  238 |   expect(allocated.queues.find(town => town.id === fixture.frontier[0]!.id)!.queue[0]!.progress).toBeGreaterThan(paid.queues.find(town => town.id === fixture.frontier[0]!.id)!.queue[0]!.progress);
  239 |   await disclose(page, 'next-action-causes');
  240 |   await page.getByTestId('next-action-causes').getByRole('button', { name: 'Defensive theaters need attention · 1', exact: true }).click();
  241 |   await expect(theater.getByRole('combobox', { name: 'Defensive theater', exact: true })).toHaveValue(created.id);
  242 |   await page.getByTestId('theater-report').getByRole('heading', { name: 'Northern watch · Enabled', exact: true }).scrollIntoViewIfNeeded();
  243 |   await page.screenshot({ path: testInfo.outputPath('joined-watch-report-narrow.png') });
  244 |   await theater.locator('.theater-dispatches > summary').click();
  245 |   await expect(page.getByTestId('theater-dispatch-report')).toContainText('Refused:');
  246 |   await page.getByTestId('theater-dispatch-report').getByRole('listitem').first().scrollIntoViewIfNeeded();
  247 |   await page.screenshot({ path: testInfo.outputPath('joined-watch-dispatches-narrow.png') });
  248 |   const incoming = report.members.find(member => member.status === 'incoming')!; expect(incoming).toBeTruthy();
  249 |   const incomingName = await page.evaluate(id => window.__THEANDRIL__!.getSummary()!.ownArmies.find(army => army.id === id)!.name, incoming.armyId);
  250 |   await theater.getByRole('button', { name: `Detach ${incomingName} from theater`, exact: true }).click();
  251 |   const detached = await snapshot(page);
> 252 |   expect(detached.theaters!.find(row => row.id === created.id)!.armyIds).toHaveLength(13);
      |                                                                          ^ Error: expect(received).toHaveLength(expected)
  253 |   expect(detached.theaters!.find(row => row.id === created.id)!.enabled).toBe(true);
  254 |   expect(detached.routes).toEqual(allocated.routes); expect(detached.postings).toEqual(allocated.postings);
  255 |   expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  256 |   stage('narrow theater setup, exception focus, turn allocation and detachment');
  257 | 
  258 |   await menu(page); await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  259 |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  260 |   const saved = await exported(page);
  261 |   expect(saved.archive.records.length).toBeGreaterThan(30);
  262 |   expect(saved.game.selectionGroups).toEqual(fixture.game.selectionGroups);
  263 |   const declarations = saved.archive.records.filter(record => record.command.type === 'declareWar').map(record => record.command);
  264 |   expect(declarations.every(command => command.factionId !== fixture.owner)).toBe(true);
  265 |   expect(declarations.filter(command => command.type === 'declareWar' && command.targetFactionId === fixture.owner)).toHaveLength(allocated.wars.length - initial.wars.length);
  266 |   // Use the real UI continuation as the reference: End turn includes ordinary
  267 |   // faction AI proposals as well as the canonical phase command.
  268 |   await endTurn(page, true); const firstFuture = await exported(page), beforeReload = await snapshot(page);
  269 |   await page.reload(); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  270 |   await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  271 |   expect((await snapshot(page)).hash).toBe(stateHash(saved.game));
  272 |   await endTurn(page, true); const manualFuture = await exported(page), restored = await snapshot(page);
  273 |   expect(serializeGame(manualFuture.game)).toBe(serializeGame(firstFuture.game));
  274 |   await page.reload();
  275 |   await page.getByLabel('Import save file').setInputFiles({ name: 'delegated-watch-continuation.theandril', mimeType: 'application/gzip', buffer: saved.bytes });
  276 |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  277 |   expect((await snapshot(page)).hash).toBe(stateHash(saved.game));
  278 |   await endTurn(page, true);
  279 |   const continued = await exported(page);
  280 |   expect(serializeGame(continued.game)).toBe(serializeGame(firstFuture.game));
  281 |   const continuedView = await snapshot(page);
  282 |   stage('manual restore, portable restore, replay and exact future continuation');
  283 |   await writeFile(testInfo.outputPath('integrated-acceptance.json'), JSON.stringify({ authored: fixture.authored, patch: fixture.patch,
  284 |     ownedArmies: initial.armies.length, ownedHearths: initial.queues.length, wars: initial.wars, initialEvents: initial.events,
  285 |     initialHash: initial.hash, budget: { before: policy.treasury, after: paid.treasury, paid: 3, refused: 2, afterUpkeep: allocated.treasury, chartersWaitingForReserve: allocated.charters.filter(charter => charter.blocker?.includes('reserve')).length },
  286 |     foreignDeclarations: declarations, continuationOutcome: { turn: continued.game.turn, pendingBattle: Boolean(continued.game.battle) },
  287 |     routeReviewRequests: reviewed.traffic.slice(beforeReview.traffic.length), theater: { id: created.id, dispatches: report.lastDispatches, detachedArmy: incoming.armyId },
  288 |     savedHash: stateHash(saved.game), continuedHash: stateHash(continued.game), archiveCommands: continued.archive.records.length,
  289 |     observationalCost: { stages, totalMs: performance.now() - started,
  290 |       sessions: [{ name: 'original', costs: beforeReload.costs }, { name: 'manual restore', costs: restored.costs }, { name: 'portable continuation', costs: continuedView.costs }],
  291 |       limits: 'Single correctness journey with assertions, screenshots and neighboring development work; wall-clock observations, not quiet benchmarks or performance gates. Roundtrips include worker queueing, execution, cloning and delivery. Only numeric worker metrics and request/reply metadata are retained; no extra gameplay query is issued.',
  292 |     },
  293 |     limits: 'Synthetic mature state; local Chromium controls and exact canonical continuation. Not organic growth, campaign pacing, planner/frame-time measurement or release acceptance.',
  294 |   }, null, 2));
  295 |   expect(errors).toEqual([]);
  296 | });
  297 | 
```