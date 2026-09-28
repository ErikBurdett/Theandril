# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: empire-delegation.spec.ts >> a mature realm resolves joined budget and frontier exceptions while preserving delegated work through saved continuation
- Location: tests/gameplay/empire-delegation.spec.ts:58:1

# Error details

```
Test timeout of 45000ms exceeded.
```

```
Error: locator.selectOption: Test timeout of 45000ms exceeded.
Call log:
  - waiting for getByTestId('defense-theaters').getByLabel('Reserve destination', { exact: true })

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
          - strong [ref=e20]: 8 coin
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
          - tab "Armies 128" [selected] [ref=e90] [cursor=pointer]
          - tab "Settlements 30" [ref=e91] [cursor=pointer]
        - button "Characters & agents" [ref=e92] [cursor=pointer]: Characters 0
      - generic [ref=e93]:
        - text: Search your realm
        - searchbox "Search your realm" [ref=e94]
      - tabpanel "Armies 128" [ref=e95]:
        - generic [ref=e96]:
          - text: Force type
          - combobox "Force type" [ref=e97]:
            - option "All armies & fleets" [selected]
            - option "Land armies ashore"
            - option "Fleets"
            - option "Embarked armies"
        - generic [ref=e98]:
          - generic [ref=e99]:
            - generic [ref=e100]:
              - text: Registry order
              - combobox "Registry order" [ref=e101]:
                - option "Stable order" [selected]
                - option "Name A–Z"
            - generic [ref=e102]: 128 forces
          - group [ref=e103]:
            - generic "Saved army groups" [ref=e104] [cursor=pointer]
            - paragraph [ref=e105]: Groups belong to this campaign and are included in its saves and exports. Recall replaces this tab’s checked selection; apply postings or charters separately.
            - generic [ref=e106]:
              - generic [ref=e107]:
                - text: Saved army group
                - combobox "Saved army group" [ref=e108]:
                  - option "Choose a saved army group"
                  - option "Northern relief"
                  - option "Northern watch" [selected]
              - button "Recall group" [ref=e109] [cursor=pointer]
              - paragraph [ref=e110]: 14 saved members · Only owned land armies ashore can be checked for orders.
              - status [ref=e111]: "Recalled group “Northern watch”: 14 armies selected. 0 skipped (0 embarked, 0 unavailable or no longer owned). Existing orders are unchanged."
            - generic [ref=e112]:
              - text: Group name
              - textbox "Group name" [ref=e113]: Northern watch
            - paragraph [ref=e114]: Save up to 128 checked armies per group. Names can use 40 characters and must be unique among army groups. This realm has 4 of 24 saved groups across both tabs.
            - paragraph [ref=e115]: Update group replaces all saved members with the 14 currently checked armies. Unchecked members, including skipped embarked armies, are removed from the group.
            - generic [ref=e116]:
              - button "Save new group" [ref=e117] [cursor=pointer]
              - button "Update group" [ref=e118] [cursor=pointer]
              - button "Delete group" [ref=e119] [cursor=pointer]
          - region "Group army postings" [ref=e120]:
            - generic [ref=e121]:
              - button "Select matching armies" [ref=e122] [cursor=pointer]
              - button "Clear group selection" [ref=e123] [cursor=pointer]
            - status [ref=e124]: 14 armies selected
            - paragraph [ref=e125]: Check land armies ashore to give them a standing posting together. Select up to 128 at a time; page and search changes keep your selection.
            - generic [ref=e126]:
              - generic [ref=e127]:
                - text: Group destination
                - combobox "Group destination" [ref=e128]:
                  - option "Where each army stands" [selected]
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
              - generic [ref=e129]:
                - text: Group arrival order
                - combobox "Group arrival order" [ref=e130]:
                  - option "Hold the hex" [selected]
                  - option "Join the force there"
            - paragraph [ref=e131]: Each army receives its own posting. Existing travel orders come first. Routes, arrival and joining use the ordinary army rules; a stalled posting explains its reason in selected orders.
            - generic [ref=e132]:
              - button "Post selected armies (14)" [ref=e133] [cursor=pointer]
              - button "Clear selected postings (1)" [ref=e134] [cursor=pointer]
            - paragraph [ref=e135]: Clearing postings leaves the 13 selected armies without postings unchanged.
          - group [ref=e136]:
            - generic "Group travel" [ref=e137] [cursor=pointer]
            - paragraph [ref=e138]: Use checked land armies ashore or recall a saved army group. Review up to 128 armies together, then apply their individual travel orders.
            - paragraph [ref=e139]: 14 armies selected for travel.
            - generic [ref=e140]:
              - generic [ref=e141]:
                - text: Travel destination
                - combobox "Travel destination" [ref=e142]:
                  - option "Selected map hex · 10788"
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
                  - option "Enter a hex number" [selected]
              - generic [ref=e143]:
                - text: Route mode
                - combobox "Route mode" [ref=e144]:
                  - option "Replace route" [selected]
                  - option "Append waypoint"
            - generic [ref=e145]:
              - text: Destination hex
              - spinbutton "Destination hex" [ref=e146]: "10800"
            - paragraph [ref=e147]: Replace substitutes the current route with a journey to this destination.
            - paragraph [ref=e148]: Applying or resuming travel starts movement immediately, in stable army ID order. Each army may arrive or pause; travel never attacks or declares war automatically.
            - paragraph [ref=e149]: Reviews are advisory. Earlier orders can reveal terrain or change later routes. Changing the selection, destination, route mode or campaign requires a new review.
            - button "Review routes" [ref=e150] [cursor=pointer]
            - button "Apply reviewed routes (14)" [disabled] [ref=e151]
            - paragraph [ref=e152]: Travel preserves 1 selected posting. Posted armies may march again on the next turn after travel finishes or is cancelled. Use Clear selected postings above to remove those standing orders.
            - generic [ref=e153]:
              - button "Resume paused routes (0)" [disabled] [ref=e154]
              - button "Cancel travel routes (0)" [disabled] [ref=e155]
            - paragraph [ref=e156]: Review routes when the destination and checked armies are ready. Reviews never issue orders.
            - generic [ref=e157]:
              - status [ref=e158]: 2 orders accepted · 1 refused. Refused armies remain selected for review.
              - paragraph [ref=e159]: Accepted travel may have moved, arrived or paused. Check each army’s current route before issuing another order.
              - group [ref=e160]:
                - generic "Review travel results" [ref=e161] [cursor=pointer]
          - group [ref=e162]:
            - generic "Defensive theaters" [ref=e163] [cursor=pointer]
            - paragraph [ref=e164]: Assign armies to protect named hearths and gather surplus at a reserve hex. Allocation runs on the next End turn and never attacks automatically. Active or paused direct routes and standing postings override theater dispatch.
            - paragraph [ref=e165]: Each theater attempts at most 16 new routes per turn. Unfilled garrison gaps remain visible for later allocation.
            - generic [ref=e166]:
              - text: Defensive theater
              - combobox "Defensive theater" [ref=e167]:
                - option "New theater" [selected]
            - paragraph [ref=e168]: 0 / 8 theaters. Guards are whole armies, not formations or soldiers.
            - region "Create defensive theater" [ref=e169]:
              - generic [ref=e170]:
                - text: Theater name
                - textbox "Theater name" [active] [ref=e171]: Northern watch
              - paragraph [ref=e172]: Use a unique name of up to 40 characters. A hearth or army belongs to only one theater.
              - generic [ref=e173]:
                - text: Reserve destination
                - combobox "Reserve destination" [ref=e174]:
                  - option "Choose a known map hex or owned hearth" [disabled]
                  - option "Frontier west · hex 10788" [selected]
                  - option "Frontier reserve · hex 10776"
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
              - generic [ref=e175]:
                - text: Guards per hearth
                - combobox "Guards per hearth" [ref=e176]:
                  - option "1 army" [selected]
                  - option "2 armies"
                  - option "3 armies"
                  - option "4 armies"
              - generic [ref=e177]:
                - text: Extra guards when threatened
                - combobox "Extra guards when threatened" [ref=e178]:
                  - option "Off" [selected]
                  - option "Up to 1 extra army"
                  - option "Up to 2 extra armies"
                  - option "Up to 3 extra armies"
                  - option "Up to 4 extra armies"
              - paragraph [ref=e179]: Visible wartime combat land armies within three hexes request one extra guard each, up to this limit. Extra guards hold through one quiet turn. Only idle assigned members can respond; minimum garrisons and direct orders keep priority. Army counts do not predict battle strength.
              - generic [ref=e180]:
                - checkbox "Enable dispatch on the next End turn" [checked] [ref=e181]
                - text: Enable dispatch on the next End turn
              - group "Protected hearths · 0 / 16" [ref=e182]:
                - generic [ref=e184]:
                  - text: Find protected hearths
                  - searchbox "Find protected hearths" [ref=e185]
                - list [ref=e186]:
                  - listitem [ref=e187]:
                    - generic [ref=e188]:
                      - checkbox "Frontier reserve · hex 10776" [ref=e189]
                      - generic [ref=e190]: Frontier reserve · hex 10776
                  - listitem [ref=e191]:
                    - generic [ref=e192]:
                      - checkbox "Frontier west · hex 10788" [ref=e193]
                      - generic [ref=e194]: Frontier west · hex 10788
                  - listitem [ref=e195]:
                    - generic [ref=e196]:
                      - checkbox "Frontier east · hex 10800" [ref=e197]
                      - generic [ref=e198]: Frontier east · hex 10800
                  - listitem [ref=e199]:
                    - generic [ref=e200]:
                      - checkbox "Delegated hearth 04 · hex 34975" [ref=e201]
                      - generic [ref=e202]: Delegated hearth 04 · hex 34975
                  - listitem [ref=e203]:
                    - generic [ref=e204]:
                      - checkbox "Delegated hearth 05 · hex 164271" [ref=e205]
                      - generic [ref=e206]: Delegated hearth 05 · hex 164271
                  - listitem [ref=e207]:
                    - generic [ref=e208]:
                      - checkbox "Delegated hearth 06 · hex 62183" [ref=e209]
                      - generic [ref=e210]: Delegated hearth 06 · hex 62183
                  - listitem [ref=e211]:
                    - generic [ref=e212]:
                      - checkbox "Delegated hearth 07 · hex 101677" [ref=e213]
                      - generic [ref=e214]: Delegated hearth 07 · hex 101677
                  - listitem [ref=e215]:
                    - generic [ref=e216]:
                      - checkbox "Delegated hearth 08 · hex 45591" [ref=e217]
                      - generic [ref=e218]: Delegated hearth 08 · hex 45591
                  - listitem [ref=e219]:
                    - generic [ref=e220]:
                      - checkbox "Delegated hearth 09 · hex 71450" [ref=e221]
                      - generic [ref=e222]: Delegated hearth 09 · hex 71450
                  - listitem [ref=e223]:
                    - generic [ref=e224]:
                      - checkbox "Delegated hearth 10 · hex 21108" [ref=e225]
                      - generic [ref=e226]: Delegated hearth 10 · hex 21108
                  - listitem [ref=e227]:
                    - generic [ref=e228]:
                      - checkbox "Delegated hearth 11 · hex 74764" [ref=e229]
                      - generic [ref=e230]: Delegated hearth 11 · hex 74764
                  - listitem [ref=e231]:
                    - generic [ref=e232]:
                      - checkbox "Delegated hearth 12 · hex 62426" [ref=e233]
                      - generic [ref=e234]: Delegated hearth 12 · hex 62426
                  - listitem [ref=e235]:
                    - generic [ref=e236]:
                      - checkbox "Delegated hearth 13 · hex 85635" [ref=e237]
                      - generic [ref=e238]: Delegated hearth 13 · hex 85635
                  - listitem [ref=e239]:
                    - generic [ref=e240]:
                      - checkbox "Delegated hearth 14 · hex 83647" [ref=e241]
                      - generic [ref=e242]: Delegated hearth 14 · hex 83647
                  - listitem [ref=e243]:
                    - generic [ref=e244]:
                      - checkbox "Delegated hearth 15 · hex 95123" [ref=e245]
                      - generic [ref=e246]: Delegated hearth 15 · hex 95123
                  - listitem [ref=e247]:
                    - generic [ref=e248]:
                      - checkbox "Delegated hearth 16 · hex 113375" [ref=e249]
                      - generic [ref=e250]: Delegated hearth 16 · hex 113375
                  - listitem [ref=e251]:
                    - generic [ref=e252]:
                      - checkbox "Delegated hearth 17 · hex 83286" [ref=e253]
                      - generic [ref=e254]: Delegated hearth 17 · hex 83286
                  - listitem [ref=e255]:
                    - generic [ref=e256]:
                      - checkbox "Delegated hearth 18 · hex 95715" [ref=e257]
                      - generic [ref=e258]: Delegated hearth 18 · hex 95715
                  - listitem [ref=e259]:
                    - generic [ref=e260]:
                      - checkbox "Delegated hearth 19 · hex 27714" [ref=e261]
                      - generic [ref=e262]: Delegated hearth 19 · hex 27714
                  - listitem [ref=e263]:
                    - generic [ref=e264]:
                      - checkbox "Delegated hearth 20 · hex 133506" [ref=e265]
                      - generic [ref=e266]: Delegated hearth 20 · hex 133506
                  - listitem [ref=e267]:
                    - generic [ref=e268]:
                      - checkbox "Delegated hearth 21 · hex 118436" [ref=e269]
                      - generic [ref=e270]: Delegated hearth 21 · hex 118436
                  - listitem [ref=e271]:
                    - generic [ref=e272]:
                      - checkbox "Delegated hearth 22 · hex 121274" [ref=e273]
                      - generic [ref=e274]: Delegated hearth 22 · hex 121274
                  - listitem [ref=e275]:
                    - generic [ref=e276]:
                      - checkbox "Delegated hearth 23 · hex 138851" [ref=e277]
                      - generic [ref=e278]: Delegated hearth 23 · hex 138851
                  - listitem [ref=e279]:
                    - generic [ref=e280]:
                      - checkbox "Delegated hearth 24 · hex 127514" [ref=e281]
                      - generic [ref=e282]: Delegated hearth 24 · hex 127514
                  - listitem [ref=e283]:
                    - generic [ref=e284]:
                      - checkbox "Delegated hearth 25 · hex 131881" [ref=e285]
                      - generic [ref=e286]: Delegated hearth 25 · hex 131881
                - navigation "protected hearths pages" [ref=e287]:
                  - button "Previous protected hearths page" [disabled] [ref=e288]: ←
                  - generic [ref=e289]: Page 1 of 2
                  - button "Next protected hearths page" [ref=e290] [cursor=pointer]: →
              - paragraph [ref=e291]: 0 draft member armies · 14 eligible checked armies. 0 unavailable or noncombat · 0 assigned to another theater.
              - button "Use checked armies (14)" [ref=e292] [cursor=pointer]
              - paragraph [ref=e293]: Use checked armies replaces the draft membership; it issues no order. Only owned combat land armies ashore can be added. Existing member armies stay assigned while other settings are edited.
              - button "Create theater" [disabled] [ref=e294]
              - paragraph [ref=e295]: Choose a unique name, one to sixteen protected hearths and a reserve destination. New theaters need one to 128 member armies; existing theaters may have none.
            - paragraph [ref=e296]: Pause, delete and detach stop future theater dispatch only. Existing routes continue; cancel travel separately when needed. Captured hearths remain listed but are not staffed. Lost member armies are pruned.
          - generic [ref=e297]:
            - generic [ref=e298]:
              - checkbox "Select Northern relief interrupted for group orders" [ref=e300]
              - button "Northern relief interrupted 1 formation · 0 movement · 60 strength ↝ Travel queued" [ref=e301] [cursor=pointer]:
                - generic [aria-hidden] [ref=e302]: △
                - generic [ref=e303]:
                  - strong [ref=e304]: Northern relief interrupted
                  - generic [ref=e305]: 1 formation · 0 movement · 60 strength
                  - generic [ref=e306]: ↝ Travel queued
                - generic [aria-hidden] [ref=e307]: ›
            - generic [ref=e308]:
              - checkbox "Select Northern relief ready for group orders" [ref=e310]
              - button "Northern relief ready 1 formation · 0 movement · 60 strength ↝ Travel queued" [ref=e311] [cursor=pointer]:
                - generic [aria-hidden] [ref=e312]: △
                - generic [ref=e313]:
                  - strong [ref=e314]: Northern relief ready
                  - generic [ref=e315]: 1 formation · 0 movement · 60 strength
                  - generic [ref=e316]: ↝ Travel queued
                - generic [aria-hidden] [ref=e317]: ›
            - generic [ref=e318]:
              - checkbox "Select Stranded reserve for group orders" [checked] [ref=e320]
              - button "Stranded reserve 1 formation · 3 movement · 60 strength" [ref=e321] [cursor=pointer]:
                - generic [aria-hidden] [ref=e322]: △
                - generic [ref=e323]:
                  - strong [ref=e324]: Stranded reserve
                  - generic [ref=e325]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e326]: ›
            - generic [ref=e327]:
              - checkbox "Select Direct watch override for group orders" [checked] [ref=e329]
              - button "Direct watch override 1 formation · 3 movement · 60 strength" [ref=e330] [cursor=pointer]:
                - generic [aria-hidden] [ref=e331]: △
                - generic [ref=e332]:
                  - strong [ref=e333]: Direct watch override
                  - generic [ref=e334]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e335]: ›
            - generic [ref=e336]:
              - checkbox "Select Northern watch 01 for group orders" [checked] [ref=e338]
              - button "Northern watch 01 1 formation · 3 movement · 60 strength" [ref=e339] [cursor=pointer]:
                - generic [aria-hidden] [ref=e340]: △
                - generic [ref=e341]:
                  - strong [ref=e342]: Northern watch 01
                  - generic [ref=e343]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e344]: ›
            - generic [ref=e345]:
              - checkbox "Select Northern watch 02 for group orders" [checked] [ref=e347]
              - button "Northern watch 02 1 formation · 3 movement · 60 strength" [ref=e348] [cursor=pointer]:
                - generic [aria-hidden] [ref=e349]: △
                - generic [ref=e350]:
                  - strong [ref=e351]: Northern watch 02
                  - generic [ref=e352]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e353]: ›
            - generic [ref=e354]:
              - checkbox "Select Northern watch 03 for group orders" [checked] [ref=e356]
              - button "Northern watch 03 1 formation · 3 movement · 60 strength" [ref=e357] [cursor=pointer]:
                - generic [aria-hidden] [ref=e358]: △
                - generic [ref=e359]:
                  - strong [ref=e360]: Northern watch 03
                  - generic [ref=e361]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e362]: ›
            - generic [ref=e363]:
              - checkbox "Select Northern watch 04 for group orders" [checked] [ref=e365]
              - button "Northern watch 04 1 formation · 3 movement · 60 strength" [ref=e366] [cursor=pointer]:
                - generic [aria-hidden] [ref=e367]: △
                - generic [ref=e368]:
                  - strong [ref=e369]: Northern watch 04
                  - generic [ref=e370]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e371]: ›
            - generic [ref=e372]:
              - checkbox "Select Northern watch 05 for group orders" [checked] [ref=e374]
              - button "Northern watch 05 1 formation · 3 movement · 60 strength" [ref=e375] [cursor=pointer]:
                - generic [aria-hidden] [ref=e376]: △
                - generic [ref=e377]:
                  - strong [ref=e378]: Northern watch 05
                  - generic [ref=e379]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e380]: ›
            - generic [ref=e381]:
              - checkbox "Select Northern watch 06 for group orders" [checked] [ref=e383]
              - button "Northern watch 06 1 formation · 3 movement · 60 strength" [ref=e384] [cursor=pointer]:
                - generic [aria-hidden] [ref=e385]: △
                - generic [ref=e386]:
                  - strong [ref=e387]: Northern watch 06
                  - generic [ref=e388]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e389]: ›
            - generic [ref=e390]:
              - checkbox "Select Northern watch 07 for group orders" [checked] [ref=e392]
              - button "Northern watch 07 1 formation · 3 movement · 60 strength" [ref=e393] [cursor=pointer]:
                - generic [aria-hidden] [ref=e394]: △
                - generic [ref=e395]:
                  - strong [ref=e396]: Northern watch 07
                  - generic [ref=e397]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e398]: ›
            - generic [ref=e399]:
              - checkbox "Select Northern watch 08 for group orders" [checked] [ref=e401]
              - button "Northern watch 08 1 formation · 3 movement · 60 strength" [ref=e402] [cursor=pointer]:
                - generic [aria-hidden] [ref=e403]: △
                - generic [ref=e404]:
                  - strong [ref=e405]: Northern watch 08
                  - generic [ref=e406]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e407]: ›
            - generic [ref=e408]:
              - checkbox "Select Northern watch 09 for group orders" [checked] [ref=e410]
              - button "Northern watch 09 1 formation · 3 movement · 60 strength" [ref=e411] [cursor=pointer]:
                - generic [aria-hidden] [ref=e412]: △
                - generic [ref=e413]:
                  - strong [ref=e414]: Northern watch 09
                  - generic [ref=e415]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e416]: ›
            - generic [ref=e417]:
              - checkbox "Select Northern watch 10 for group orders" [checked] [ref=e419]
              - button "Northern watch 10 1 formation · 3 movement · 60 strength" [ref=e420] [cursor=pointer]:
                - generic [aria-hidden] [ref=e421]: △
                - generic [ref=e422]:
                  - strong [ref=e423]: Northern watch 10
                  - generic [ref=e424]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e425]: ›
            - generic [ref=e426]:
              - checkbox "Select Northern watch 11 for group orders" [checked] [ref=e428]
              - button "Northern watch 11 1 formation · 3 movement · 60 strength" [ref=e429] [cursor=pointer]:
                - generic [aria-hidden] [ref=e430]: △
                - generic [ref=e431]:
                  - strong [ref=e432]: Northern watch 11
                  - generic [ref=e433]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e434]: ›
            - generic [ref=e435]:
              - checkbox "Select Northern watch 12 for group orders" [checked] [ref=e437]
              - button "Northern watch 12 1 formation · 3 movement · 60 strength" [ref=e438] [cursor=pointer]:
                - generic [aria-hidden] [ref=e439]: △
                - generic [ref=e440]:
                  - strong [ref=e441]: Northern watch 12
                  - generic [ref=e442]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e443]: ›
            - generic [ref=e444]:
              - checkbox "Select Home guard 017 for group orders" [ref=e446]
              - button "Home guard 017 1 formation · 3 movement · 60 strength" [ref=e447] [cursor=pointer]:
                - generic [aria-hidden] [ref=e448]: △
                - generic [ref=e449]:
                  - strong [ref=e450]: Home guard 017
                  - generic [ref=e451]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e452]: ›
            - generic [ref=e453]:
              - checkbox "Select Home guard 018 for group orders" [ref=e455]
              - button "Home guard 018 1 formation · 3 movement · 60 strength" [ref=e456] [cursor=pointer]:
                - generic [aria-hidden] [ref=e457]: △
                - generic [ref=e458]:
                  - strong [ref=e459]: Home guard 018
                  - generic [ref=e460]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e461]: ›
            - generic [ref=e462]:
              - checkbox "Select Home guard 019 for group orders" [ref=e464]
              - button "Home guard 019 1 formation · 3 movement · 60 strength" [ref=e465] [cursor=pointer]:
                - generic [aria-hidden] [ref=e466]: △
                - generic [ref=e467]:
                  - strong [ref=e468]: Home guard 019
                  - generic [ref=e469]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e470]: ›
            - generic [ref=e471]:
              - checkbox "Select Home guard 020 for group orders" [ref=e473]
              - button "Home guard 020 1 formation · 3 movement · 60 strength" [ref=e474] [cursor=pointer]:
                - generic [aria-hidden] [ref=e475]: △
                - generic [ref=e476]:
                  - strong [ref=e477]: Home guard 020
                  - generic [ref=e478]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e479]: ›
            - generic [ref=e480]:
              - checkbox "Select Home guard 021 for group orders" [ref=e482]
              - button "Home guard 021 1 formation · 3 movement · 60 strength" [ref=e483] [cursor=pointer]:
                - generic [aria-hidden] [ref=e484]: △
                - generic [ref=e485]:
                  - strong [ref=e486]: Home guard 021
                  - generic [ref=e487]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e488]: ›
            - generic [ref=e489]:
              - checkbox "Select Home guard 022 for group orders" [ref=e491]
              - button "Home guard 022 1 formation · 3 movement · 60 strength" [ref=e492] [cursor=pointer]:
                - generic [aria-hidden] [ref=e493]: △
                - generic [ref=e494]:
                  - strong [ref=e495]: Home guard 022
                  - generic [ref=e496]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e497]: ›
            - generic [ref=e498]:
              - checkbox "Select Home guard 023 for group orders" [ref=e500]
              - button "Home guard 023 1 formation · 3 movement · 60 strength" [ref=e501] [cursor=pointer]:
                - generic [aria-hidden] [ref=e502]: △
                - generic [ref=e503]:
                  - strong [ref=e504]: Home guard 023
                  - generic [ref=e505]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e506]: ›
            - generic [ref=e507]:
              - checkbox "Select Home guard 024 for group orders" [ref=e509]
              - button "Home guard 024 1 formation · 3 movement · 60 strength" [ref=e510] [cursor=pointer]:
                - generic [aria-hidden] [ref=e511]: △
                - generic [ref=e512]:
                  - strong [ref=e513]: Home guard 024
                  - generic [ref=e514]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e515]: ›
            - generic [ref=e516]:
              - checkbox "Select Home guard 025 for group orders" [ref=e518]
              - button "Home guard 025 1 formation · 3 movement · 60 strength" [ref=e519] [cursor=pointer]:
                - generic [aria-hidden] [ref=e520]: △
                - generic [ref=e521]:
                  - strong [ref=e522]: Home guard 025
                  - generic [ref=e523]: 1 formation · 3 movement · 60 strength
                - generic [aria-hidden] [ref=e524]: ›
          - navigation "Registry pages" [ref=e525]:
            - button "Previous registry page" [disabled] [ref=e526]: ←
            - generic [ref=e527]: Page 1 of 6
            - button "Next registry page" [ref=e528] [cursor=pointer]: →
      - paragraph [ref=e529]: Choose an entry to locate it on the map. Use the bottom command tray for its orders.
  - contentinfo [ref=e530]:
    - generic [ref=e533]:
      - generic [ref=e534]: Selected settlement
      - strong [ref=e535]: Frontier west
      - generic [ref=e536]: 9 people · 1 queued projects
      - generic [ref=e537]:
        - button "Show selected orders" [ref=e538] [cursor=pointer]
        - button "Show on map" [ref=e539] [cursor=pointer]
    - region "Next-action navigation" [ref=e540]:
      - paragraph [ref=e541]: 13 needing orders · 28 idle settlements
      - generic [ref=e542]:
        - button "Previous army needing orders" [ref=e543] [cursor=pointer]: ‹
        - button "Next army needing orders" [ref=e544] [cursor=pointer]: Next army N
        - button "Previous idle settlement" [ref=e545] [cursor=pointer]: ‹
        - button "Next idle settlement" [ref=e546] [cursor=pointer]: Next town S
      - paragraph [ref=e547]: "Labor: 270 unassigned households · 30 settlements"
      - generic [ref=e548]:
        - button "Previous settlement with unassigned households" [ref=e549] [cursor=pointer]: ‹
        - button "Next settlement with unassigned households" [ref=e550] [cursor=pointer]: Review households
      - group [ref=e551]:
        - generic "What wants a decision 3 kinds" [ref=e552] [cursor=pointer]:
          - text: What wants a decision
          - generic [ref=e553]: 3 kinds
        - button "30 hearths with unassigned households" [ref=e554] [cursor=pointer]
        - button "28 hearths with a stalled charter" [ref=e555] [cursor=pointer]
        - button "13 companies with movement remaining" [ref=e556] [cursor=pointer]
      - status
    - generic [ref=e557]:
      - generic [ref=e558]:
        - generic [ref=e559]: AGE OF FRACTURE
        - strong [ref=e560]: Turn 2
      - button "End turn" [ref=e561] [cursor=pointer]:
        - text: End turn
        - generic [ref=e562]: E
    - status [ref=e563]:
      - generic [aria-hidden] [ref=e564]: ◆
      - text: 2 travel orders accepted; 1 refused. Autosaved.
  - generic [ref=e565]:
    - button "Art Lab" [ref=e566] [cursor=pointer]
    - generic [ref=e567]: Development asset inspector
```

# Test source

```ts
  54  |   await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${turn + 1}`);
  55  |   await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  56  | }
  57  | 
  58  | test('a mature realm resolves joined budget and frontier exceptions while preserving delegated work through saved continuation', async ({ page }, testInfo) => {
  59  |   const fixture = empireDelegationCampaign();
  60  |   const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  61  |   await page.addInitScript(() => {
  62  |     const traffic: string[] = [];
  63  |     (window as unknown as { __DELEGATION_TRAFFIC__: string[] }).__DELEGATION_TRAFFIC__ = traffic;
  64  |     const NativeWorker = window.Worker;
  65  |     window.Worker = class extends NativeWorker {
  66  |       override postMessage(message: unknown, options?: Transferable[] | StructuredSerializeOptions) {
  67  |         traffic.push((message as { type?: string }).type ?? 'unknown');
  68  |         if (Array.isArray(options)) super.postMessage(message, options); else super.postMessage(message, options);
  69  |       }
  70  |     };
  71  |   });
  72  |   await page.goto('/');
  73  |   await page.getByLabel('Import save file').setInputFiles({ name: 'authored-mature-delegation.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(fixture.game))) });
  74  |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  75  |   const initial = await snapshot(page);
  76  |   expect(initial.armies).toHaveLength(128); expect(initial.queues).toHaveLength(30); expect(initial.wars).toHaveLength(2); expect(initial.events).toBeGreaterThanOrEqual(32);
  77  |   await openRealmAffairs(page);
  78  |   await expect(page.locator('.war-state')).toHaveCount(2);
  79  |   await openCampaignJournal(page);
  80  |   await expect(page.getByTestId('chronicle').getByRole('listitem')).toHaveCount(16);
  81  |   await closeManagement(page);
  82  | 
  83  |   const causes = await disclose(page, 'next-action-causes', true);
  84  |   await causes.getByRole('button', { name: '1 company with an interrupted route', exact: true }).focus();
  85  |   await page.keyboard.press('Enter');
  86  |   await expect(page.getByTestId('current-selection')).toContainText('Northern relief interrupted');
  87  |   expect((await snapshot(page)).hash).toBe(initial.hash);
  88  |   await causes.getByRole('button', { name: /hearths with a stalled charter/ }).click();
  89  |   await openSelectedOrders(page);
  90  |   const stalled = await disclose(page, 'settlement-charter');
  91  |   await expect(stalled).toContainText('Nothing this charter builds costs 4 coin or less');
  92  | 
  93  |   await recall(page, 'settlements', 'Realm works');
  94  |   await expect(page.getByTestId('settlement-registry').getByRole('checkbox')).toHaveCount(25);
  95  |   const charters = page.getByTestId('group-charters');
  96  |   await charters.getByLabel('Charter focus').selectOption('works');
  97  |   await charters.getByLabel('Coin ceiling per hearth').fill('24');
  98  |   await charters.getByRole('button', { name: 'Apply charters (30)', exact: true }).click();
  99  |   await expect(page.getByTestId('group-charter-results')).toContainText('30 orders accepted · 0 refused');
  100 |   const policy = await snapshot(page);
  101 |   expect(policy.treasury).toBe(initial.treasury); expect(policy.queues).toEqual(initial.queues);
  102 |   expect(policy.charters.every(charter => charter.focus === 'works' && charter.ceiling === 24)).toBe(true);
  103 | 
  104 |   await recall(page, 'settlements', 'Frontier works');
  105 |   const production = await disclose(page, 'group-production');
  106 |   for (const item of fixture.sequence) {
  107 |     await production.getByRole('combobox', { name: 'Production item', exact: true }).selectOption(item);
  108 |     await production.getByRole('button', { name: 'Add project', exact: true }).click();
  109 |   }
  110 |   const templates = await disclose(page, 'production-templates');
  111 |   await templates.getByRole('textbox', { name: 'Production template name', exact: true }).fill('Frontier relief kit');
  112 |   await templates.getByRole('button', { name: 'Save production template', exact: true }).click();
  113 |   await expect(templates.getByRole('option', { name: /Frontier relief kit/ })).toHaveCount(1);
  114 |   for (let count = fixture.sequence.length; count > 0; count--) await production.getByTestId('production-sequence-item').first().getByRole('button', { name: /^Remove item/ }).click();
  115 |   const beforeRecall = await snapshot(page);
  116 |   await templates.getByRole('button', { name: 'Recall production template', exact: true }).click();
  117 |   expect((await snapshot(page)).hash).toBe(beforeRecall.hash);
  118 |   await production.getByRole('button', { name: 'Apply production (3)', exact: true }).click();
  119 |   const results = page.getByTestId('group-production-results');
  120 |   await expect(results).toContainText('1 hearth complete · 2 partial or refused. 3 orders accepted · 2 refused.');
  121 |   await expect(charters).toContainText('2 hearths selected');
  122 |   await results.locator(':scope > details > summary').click();
  123 |   await expect(results).toContainText('Paid and queued'); await expect(results).toContainText('Refused:');
  124 |   const paid = await snapshot(page);
  125 |   expect(paid.treasury).toBe(8);
  126 |   expect(paid.queues.find(town => town.id === fixture.frontier[0]!.id)!.queue.map(item => item.itemId)).toEqual(['building.granary', ...fixture.sequence]);
  127 |   expect(paid.queues.find(town => town.id === fixture.frontier[1]!.id)!.queue.map(item => item.itemId)).toEqual([fixture.sequence[0]]);
  128 |   expect(paid.queues.find(town => town.id === fixture.frontier[2]!.id)!.queue).toEqual([]);
  129 |   expect(paid.charters.map(({ settlementId, focus, ceiling }) => ({ settlementId, focus, ceiling }))).toEqual(policy.charters.map(({ settlementId, focus, ceiling }) => ({ settlementId, focus, ceiling })));
  130 |   await results.scrollIntoViewIfNeeded();
  131 |   await page.screenshot({ path: testInfo.outputPath('joined-budget-refusals-desktop.png') });
  132 | 
  133 |   await recall(page, 'armies', 'Northern relief');
  134 |   const travel = await disclose(page, 'group-movement');
  135 |   await travel.getByRole('combobox', { name: 'Travel destination', exact: true }).selectOption('hex');
  136 |   await travel.getByRole('spinbutton', { name: 'Destination hex', exact: true }).fill(String(fixture.frontier[2]!.cell));
  137 |   const beforeReview = await snapshot(page);
  138 |   await travel.getByRole('button', { name: 'Review routes', exact: true }).click();
  139 |   await expect(page.getByTestId('group-movement-preview')).toContainText('2 can queue · 1 unavailable');
  140 |   const reviewed = await snapshot(page);
  141 |   expect(reviewed.hash).toBe(beforeReview.hash);
  142 |   expect(reviewed.traffic.slice(beforeReview.traffic.length)).toEqual(['groupMovementPreview']);
  143 |   await travel.getByRole('button', { name: 'Apply reviewed routes (3)', exact: true }).click();
  144 |   await expect(page.getByTestId('group-movement-results')).toContainText('2 orders accepted · 1 refused');
  145 |   await expect(page.getByTestId('group-postings')).toContainText('1 armies selected');
  146 |   const rerouted = await snapshot(page);
  147 |   expect(rerouted.wars).toEqual(initial.wars); expect(rerouted.battle).toBe(false);
  148 |   expect(rerouted.postings).toEqual(initial.postings);
  149 |   expect(rerouted.routes.find(route => route.armyId === fixture.interruptedId)?.status).not.toBe('paused');
  150 | 
  151 |   await recall(page, 'armies', 'Northern watch');
  152 |   const theater = await disclose(page, 'defense-theaters', true);
  153 |   await theater.getByLabel('Theater name', { exact: true }).fill('Northern watch');
> 154 |   await theater.getByLabel('Reserve destination', { exact: true }).selectOption(String(fixture.reserve));
      |                                                                    ^ Error: locator.selectOption: Test timeout of 45000ms exceeded.
  155 |   await theater.getByLabel('Guards per hearth', { exact: true }).selectOption('1');
  156 |   await theater.getByLabel('Extra guards when threatened', { exact: true }).selectOption('1');
  157 |   await theater.getByRole('searchbox', { name: 'Find protected hearths', exact: true }).fill('Frontier');
  158 |   for (const town of fixture.frontier.slice(1)) await theater.getByRole('checkbox', { name: `${town.name} · hex ${town.cell}`, exact: true }).check();
  159 |   await theater.getByRole('button', { name: 'Use checked armies (14)', exact: true }).click();
  160 |   await page.setViewportSize({ width: 390, height: 844 });
  161 |   const create = theater.getByRole('button', { name: 'Create theater', exact: true });
  162 |   await create.scrollIntoViewIfNeeded(); await expect(create).toBeInViewport();
  163 |   await page.screenshot({ path: testInfo.outputPath('joined-watch-controls-narrow.png') });
  164 |   await create.focus(); await page.keyboard.press('Enter');
  165 |   await expect(page.getByTestId('theater-report')).toContainText('Northern watch · Enabled');
  166 |   const created = (await snapshot(page)).theaters!.find(row => row.name === 'Northern watch')!;
  167 |   await closeManagement(page);
  168 |   await disclose(page, 'next-action-causes', true);
  169 |   await page.getByTestId('next-action-causes').getByRole('button', { name: 'Defensive theaters need attention · 1', exact: true }).focus();
  170 |   await page.keyboard.press('Enter');
  171 |   await expect(page.getByRole('dialog', { name: 'Realm registry', exact: true })).toBeVisible();
  172 |   await expect(theater).toHaveAttribute('open');
  173 |   await expect(theater.getByRole('combobox', { name: 'Defensive theater', exact: true })).toHaveValue(created.id);
  174 |   await expect(theater.locator(':scope > summary')).toBeFocused();
  175 |   await endTurn(page);
  176 |   const allocated = await snapshot(page), report = allocated.theaters!.find(row => row.id === created.id)!;
  177 |   expect(report.enabled).toBe(true); expect(report.armyIds).toHaveLength(14);
  178 |   expect(report.members.find(member => member.armyId === fixture.overrideId)?.status).toBe('overridden');
  179 |   expect(report.lastDispatches.some(dispatch => !dispatch.accepted && dispatch.armyId === fixture.strandedId)).toBe(true);
  180 |   expect(report.lastDispatches.some(dispatch => dispatch.accepted)).toBe(true);
  181 |   expect(allocated.wars).toEqual(initial.wars); expect(allocated.battle).toBe(false);
  182 |   expect(allocated.charters).toHaveLength(30);
  183 |   expect(allocated.queues.filter(town => town.queue.length).length).toBeGreaterThan(paid.queues.filter(town => town.queue.length).length);
  184 |   await disclose(page, 'next-action-causes');
  185 |   await page.getByTestId('next-action-causes').getByRole('button', { name: 'Defensive theaters need attention · 1', exact: true }).click();
  186 |   await expect(theater.getByRole('combobox', { name: 'Defensive theater', exact: true })).toHaveValue(created.id);
  187 |   const incoming = report.members.find(member => member.status === 'incoming')!; expect(incoming).toBeTruthy();
  188 |   const incomingName = await page.evaluate(id => window.__THEANDRIL__!.getSummary()!.ownArmies.find(army => army.id === id)!.name, incoming.armyId);
  189 |   await theater.getByRole('button', { name: `Detach ${incomingName} from theater`, exact: true }).click();
  190 |   const detached = await snapshot(page);
  191 |   expect(detached.theaters!.find(row => row.id === created.id)!.armyIds).toHaveLength(13);
  192 |   expect(detached.theaters!.find(row => row.id === created.id)!.enabled).toBe(true);
  193 |   expect(detached.routes).toEqual(allocated.routes); expect(detached.postings).toEqual(allocated.postings);
  194 |   await page.getByTestId('theater-report').scrollIntoViewIfNeeded();
  195 |   await page.screenshot({ path: testInfo.outputPath('joined-watch-report-narrow.png') });
  196 |   expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  197 | 
  198 |   await menu(page); await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  199 |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  200 |   const saved = await exported(page), expected = deserializeGame(serializeGame(saved.game));
  201 |   expect(saved.archive.records.length).toBeGreaterThan(30);
  202 |   expect(saved.game.selectionGroups).toEqual(fixture.game.selectionGroups);
  203 |   expect(applyCommand(expected, { type: 'endTurn', factionId: fixture.owner }).ok).toBe(true);
  204 |   await endTurn(page); expect((await snapshot(page)).hash).toBe(stateHash(expected));
  205 |   await page.reload(); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  206 |   await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  207 |   expect((await snapshot(page)).hash).toBe(stateHash(saved.game));
  208 |   await page.reload();
  209 |   await page.getByLabel('Import save file').setInputFiles({ name: 'delegated-watch-continuation.theandril', mimeType: 'application/gzip', buffer: saved.bytes });
  210 |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  211 |   expect((await snapshot(page)).hash).toBe(stateHash(saved.game));
  212 |   await endTurn(page);
  213 |   const continued = await exported(page);
  214 |   expect(serializeGame(continued.game)).toBe(serializeGame(expected));
  215 |   await writeFile(testInfo.outputPath('integrated-acceptance.json'), JSON.stringify({ authored: fixture.authored, patch: fixture.patch,
  216 |     ownedArmies: initial.armies.length, ownedHearths: initial.queues.length, wars: initial.wars, initialEvents: initial.events,
  217 |     initialHash: initial.hash, budget: { before: policy.treasury, after: paid.treasury, paid: 3, refused: 2 },
  218 |     routeReviewRequests: reviewed.traffic.slice(beforeReview.traffic.length), theater: { id: created.id, dispatches: report.lastDispatches, detachedArmy: incoming.armyId },
  219 |     savedHash: stateHash(saved.game), continuedHash: stateHash(continued.game), archiveCommands: continued.archive.records.length,
  220 |     limits: 'Synthetic mature state; local Chromium controls and exact canonical continuation. Not organic growth, campaign pacing, planner/frame-time measurement or release acceptance.',
  221 |   }, null, 2));
  222 |   expect(errors).toEqual([]);
  223 | });
  224 | 
```