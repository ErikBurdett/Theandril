# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: gameplay/updates.spec.ts >> readable journal at 1366px and 100% text
- Location: tests/gameplay/updates.spec.ts:6:3

# Error details

```
Error: page.screenshot: Protocol error (Page.captureScreenshot): Unable to capture screenshot
Call log:
  - taking page screenshot
  - waiting for fonts to load...
  - fonts loaded

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - link "Skip to content" [ref=e4] [cursor=pointer]:
    - /url: "#main"
  - banner [ref=e5]:
    - link "Theandril home" [ref=e6] [cursor=pointer]:
      - /url: /Theandril/updates/
      - generic [aria-hidden] [ref=e7]: T
      - generic [ref=e8]:
        - generic [ref=e9]: The age of fracture
        - strong [ref=e10]: Theandril
    - navigation "Main navigation" [ref=e11]:
      - link "Home" [ref=e12] [cursor=pointer]:
        - /url: /Theandril/updates/
      - link "Dispatches" [ref=e13] [cursor=pointer]:
        - /url: /Theandril/updates/dispatches/
      - link "Roadmap" [ref=e14] [cursor=pointer]:
        - /url: /Theandril/updates/roadmap/
      - link "Lore" [ref=e15] [cursor=pointer]:
        - /url: /Theandril/updates/lore/
      - link "Compendium" [ref=e16] [cursor=pointer]:
        - /url: /Theandril/updates/compendium/
      - link "Play development build" [ref=e17] [cursor=pointer]:
        - /url: /Theandril/
        - text: Play development build ↗
  - main [ref=e18]:
    - generic [ref=e19]:
      - region [ref=e20]:
        - generic [ref=e21]:
          - paragraph [ref=e22]: Developer journal / A world in the making
          - heading [level=1] [ref=e23]:
            - text: Theandril
            - emphasis [ref=e24]: Dispatches
        - paragraph [ref=e25]: The work. The world. The record.Substantial changes, their evidence, and the distance still to go.
      - region [ref=e26]:
        - generic [ref=e27]:
          - paragraph [ref=e28]: Featured dispatch · 23
          - generic [ref=e30]: Reviewed checkpoint
          - heading "Give several hearths a land budget" [level=2] [ref=e31]
          - paragraph [ref=e32]: 26 October 2026 · Coordinated land commissions
          - paragraph [ref=e33]: Choose checked hearths or recall a saved group, give each a construction allowance, and keep the shared treasury reserve explicit.
          - link "Read the featured dispatch" [ref=e34] [cursor=pointer]:
            - /url: /Theandril/updates/dispatches/?dispatch=group-land-commissions
            - text: Read the dispatch
            - generic [aria-hidden] [ref=e35]: →
          - paragraph [ref=e36]: Source checkpoint cfd660c · Not a 1.0 release.
        - figure [ref=e37]:
          - button "Enlarge group-land-budget image" [ref=e38]:
            - img "The group commission form reads 100 coin per hearth times 30 equals 3000 coin total permission." [ref=e39]
            - generic [aria-hidden] [ref=e40]: Inspect image ↗
          - generic [ref=e41]:
            - text: "Native 780-by-28 illustrative strip from the authored thirty-hearth regression, before Apply at desktop width and 130% text. It shows 100 coin per hearth times 30 equals 3000 coin total permission. The realm has only 100 treasury coin: this is permission, not an invoice or escrow. Reserve, actual payments and receipt are outside the strip; linked full captures and campaign exports establish those details."
            - link "Original image ↗" [ref=e42] [cursor=pointer]:
              - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/docs/development/2026-10-26-group-land-commissions/browser-results/production-group-land-poli-a2d26-val-and-restoration-at-130-/group-land-budget-native.png
      - complementary "Checkpoint scope" [ref=e43]:
        - strong [ref=e44]: A checkpoint, not a finish line.
        - paragraph [ref=e45]: The original naval findings have reviewed corrections. Epic archive timing, M0 and all fifteen whole release gates remain open. Test sets overlap; we do not add them into a release score.
      - region [ref=e46]:
        - generic [ref=e47]:
          - generic [ref=e48]:
            - paragraph [ref=e49]: Browse the record
            - heading "From the workbench" [level=2] [ref=e50]
          - paragraph [ref=e51]: Current review work, then the playable foundations. Not a release calendar.
        - generic [ref=e52]:
          - generic [ref=e53]:
            - generic [ref=e54]: Search dispatches
            - searchbox "Search dispatches" [ref=e55]
          - group "Filter by topic" [ref=e56]:
            - generic [ref=e58]:
              - button "All" [pressed] [ref=e59] [cursor=pointer]
              - button "Engineering" [ref=e60] [cursor=pointer]
              - button "World & culture" [ref=e61] [cursor=pointer]
              - button "Archives" [ref=e62] [cursor=pointer]
        - status [ref=e64]: 23 dispatches
        - generic [ref=e65]:
          - article [ref=e66]:
            - link [aria-hidden] [ref=e67] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=group-land-commissions
            - generic [ref=e68]:
              - paragraph [ref=e69]: Engineering / Group commissions · rules 37
              - heading [level=3] [ref=e70]:
                - link "Give several hearths a land budget" [ref=e71] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=group-land-commissions
              - paragraph [ref=e72]: Choose checked hearths or recall a saved group, give each a construction allowance, and keep the shared treasury reserve explicit.
              - generic [ref=e73]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e74]:
              - text: "23"
              - generic [ref=e75]: ↗
          - article [ref=e76]:
            - link [aria-hidden] [ref=e77] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=land-commissions
            - generic [ref=e78]:
              - paragraph [ref=e79]: Engineering / Land commissions · rules 37
              - heading [level=3] [ref=e80]:
                - link "Give land work a budget" [ref=e81] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=land-commissions
              - paragraph [ref=e82]: Choose the improvement a hearth should build, set how much it may spend, and leave a treasury reserve while ordinary land work proceeds.
              - generic [ref=e83]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e84]:
              - text: "22"
              - generic [ref=e85]: ↗
          - article [ref=e86]:
            - link [aria-hidden] [ref=e87] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=worker-stewardship
            - generic [ref=e88]:
              - paragraph [ref=e89]: Engineering / Worker stewardship · rules 36
              - heading [level=3] [ref=e90]:
                - link "Keep growing hearths at work" [ref=e91] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=worker-stewardship
              - paragraph [ref=e92]: Choose what a hearth’s workers should favor, let the policy revisit assignments as it grows, and take back manual control whenever a particular tile matters more.
              - generic [ref=e93]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e94]:
              - text: "21"
              - generic [ref=e95]: ↗
          - article [ref=e96]:
            - link [aria-hidden] [ref=e97] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=group-orders-and-receipts
            - generic [ref=e98]:
              - paragraph [ref=e99]: Engineering / Group order workflows · rules 35
              - heading [level=3] [ref=e100]:
                - link "Give the order, then review each result" [ref=e101] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=group-orders-and-receipts
              - paragraph [ref=e102]: Assign a shared patrol circuit while keeping paused armies paused. Review accepted and refused posting and charter orders by name, with clearer boundaries when the campaign or its response changes.
              - generic [ref=e103]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e104]:
              - text: "20"
              - generic [ref=e105]: ↗
          - article [ref=e106]:
            - link [aria-hidden] [ref=e107] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=settlement-order-filters
            - generic [ref=e108]:
              - paragraph [ref=e109]: Engineering / Settlement order inventory · rules 35
              - heading [level=3] [ref=e110]:
                - link "Find empty queues and waiting charters" [ref=e111] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=settlement-order-filters
              - paragraph [ref=e112]: Find empty production queues, hearths without charters and policies waiting on a reported limit. Keep checked hearths across filters, then apply a policy through the existing group controls.
              - generic [ref=e113]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e114]:
              - text: "19"
              - generic [ref=e115]: ↗
          - article [ref=e116]:
            - link [aria-hidden] [ref=e117] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=group-patrols
            - generic [ref=e118]:
              - paragraph [ref=e119]: Engineering / Group patrol controls · rules 35
              - heading [level=3] [ref=e120]:
                - link "Change patrol policies across the checked companies" [ref=e121] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=group-patrols
              - paragraph [ref=e122]: Pause, resume or remove existing patrol policies across the companies you checked. Issued travel stays intact, unaffected armies remain selected, and every accepted order keeps its saved history.
              - generic [ref=e123]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e124]:
              - text: "18"
              - generic [ref=e125]: ↗
          - article [ref=e126]:
            - link [aria-hidden] [ref=e127] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=registry-order-filters
            - generic [ref=e128]:
              - paragraph [ref=e129]: Engineering / Observed order filters · rules 35
              - heading [level=3] [ref=e130]:
                - link "Find waiting orders in a crowded roster" [ref=e131] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=registry-order-filters
              - paragraph [ref=e132]: Find a paused patrol or waiting order without paging through every company. The registry keeps policy, travel and selection facts distinct; changing an order still takes an explicit action.
              - generic [ref=e133]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e134]:
              - text: "17"
              - generic [ref=e135]: ↗
          - article [ref=e136]:
            - link [aria-hidden] [ref=e137] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=project-counterplay
            - generic [ref=e138]:
              - paragraph [ref=e139]: Engineering / Immediate and maintained project counterplay · rules 35
              - heading [level=3] [ref=e140]:
                - link "Before peace decides the race" [ref=e141] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=project-counterplay
              - paragraph [ref=e142]: When a rival is one turn from victory, a binding peace can end the race. An available company should keep its chance to interrupt the project before that turn advances.
              - generic [ref=e143]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e144]:
              - text: "16"
              - generic [ref=e145]: ↗
          - article [ref=e146]:
            - link [aria-hidden] [ref=e147] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=patrol-retirement
            - generic [ref=e148]:
              - paragraph [ref=e149]: Engineering / Observed patrol retirement · rules 35
              - heading [level=3] [ref=e150]:
                - link "When a home patrol loses its hearth" [ref=e151] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=patrol-retirement
              - paragraph [ref=e152]: An AI watch can now retire a home circuit whose destination has visibly changed hands, freeing its company for ordinary duties. A retained campaign shows the company moving again; the wider pacing work remains open.
              - generic [ref=e153]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e154]:
              - text: "15"
              - generic [ref=e155]: ↗
          - article [ref=e156]:
            - link [aria-hidden] [ref=e157] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=patrol-orders
            - generic [ref=e158]:
              - paragraph [ref=e159]: Engineering / Posting policies and land patrols · rules 35
              - heading [level=3] [ref=e160]:
                - link "Keep the watch moving" [ref=e161] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=patrol-orders
              - paragraph [ref=e162]: Remember a familiar posting policy, give an army a returning patrol, and let an AI-controlled watch review a safe interrupted leg. Saved orders keep their boundaries, while the campaign results keep the remaining balance work visible.
              - generic [ref=e163]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e164]:
              - text: "14"
              - generic [ref=e165]: ↗
          - article [ref=e166]:
            - link [aria-hidden] [ref=e167] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=reinforcement-logistics
            - generic [ref=e168]:
              - paragraph [ref=e169]: Engineering / Reinforcement and supply access · rules 34
              - heading [level=3] [ref=e170]:
                - link "Hold the frontier, provision the crossing" [ref=e171] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=reinforcement-logistics
              - paragraph [ref=e172]: Let a standing watch respond to visible threats, and buy supplies from a foreign harbor. Joined empire controls keep shortages and blocked orders visible across a large realm.
              - generic [ref=e173]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e174]:
              - text: "13"
              - generic [ref=e175]: ↗
          - article [ref=e176]:
            - link [aria-hidden] [ref=e177] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=defense-theaters
            - generic [ref=e178]:
              - paragraph [ref=e179]: Engineering / Defensive theaters · ACT-32
              - heading [level=3] [ref=e180]:
                - link "Give your hearths a standing watch" [ref=e181] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=defense-theaters
              - paragraph [ref=e182]: Choose the hearths to protect, assign their watch companies and name a reserve. Idle members fill guard gaps on later turns while your direct routes and standing postings keep priority.
              - generic [ref=e183]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e184]:
              - text: "12"
              - generic [ref=e185]: ↗
          - article [ref=e186]:
            - link [aria-hidden] [ref=e187] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=group-travel
            - generic [ref=e188]:
              - paragraph [ref=e189]: Engineering / Group travel · ACT-32
              - heading [level=3] [ref=e190]:
                - link "Give your armies a shared destination" [ref=e191] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=group-travel
              - paragraph [ref=e192]: Recall a saved army group, review their separate routes and send them toward one destination. Ordinary travel keeps its costs, interruptions and individual controls, with results for every army.
              - generic [ref=e193]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e194]:
              - text: "11"
              - generic [ref=e195]: ↗
          - article [ref=e196]:
            - link [aria-hidden] [ref=e197] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=production-sequences
            - generic [ref=e198]:
              - paragraph [ref=e199]: Engineering / Production sequences · ACT-32
              - heading [level=3] [ref=e200]:
                - link "Queue a plan across your hearths" [ref=e201] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=production-sequences
              - paragraph [ref=e202]: Arrange a short production list, recall the hearths that need it and see which projects were paid for. Personal templates keep useful plans ready while every order still uses the existing queues.
              - generic [ref=e203]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e204]:
              - text: "10"
              - generic [ref=e205]: ↗
          - article [ref=e206]:
            - link [aria-hidden] [ref=e207] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=selection-groups
            - generic [ref=e208]:
              - paragraph [ref=e209]: Engineering / Saved realm groups · rules 32
              - heading [level=3] [ref=e210]:
                - link "Recall a group, then give the order" [ref=e211] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=selection-groups
              - paragraph [ref=e212]: Remember the armies guarding a frontier or the hearths sharing a policy. Named groups now travel with the campaign, ready to recall, inspect and order through the existing registry.
              - generic [ref=e213]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e214]:
              - text: "09"
              - generic [ref=e215]: ↗
          - article [ref=e216]:
            - link [aria-hidden] [ref=e217] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=charter-templates
            - generic [ref=e218]:
              - paragraph [ref=e219]: Engineering / Charter templates · ACT-32
              - heading [level=3] [ref=e220]:
                - link "Keep a charter worth repeating" [ref=e221] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=charter-templates
              - paragraph [ref=e222]: Save a useful charter policy by name, recall it in another campaign, then choose which hearths should receive it. A personal browser library keeps repeated setup apart from the orders already governing a realm.
              - generic [ref=e223]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e224]:
              - text: "08"
              - generic [ref=e225]: ↗
          - article [ref=e226]:
            - link [aria-hidden] [ref=e227] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=group-charters
            - generic [ref=e228]:
              - paragraph [ref=e229]: Engineering / Group hearth charters · ACT-32
              - heading [level=3] [ref=e230]:
                - link "One charter policy for forty hearths" [ref=e231] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=group-charters
              - paragraph [ref=e232]: Give selected hearths the same standing charter, keep their queued work intact, and inspect each result. Shared controls now explain what every hearth may spend from the realm’s treasury.
              - generic [ref=e233]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e234]:
              - text: "07"
              - generic [ref=e235]: ↗
          - article [ref=e236]:
            - link [aria-hidden] [ref=e237] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=group-postings
            - generic [ref=e238]:
              - paragraph [ref=e239]: Engineering / Group postings · ACT-32
              - heading [level=3] [ref=e240]:
                - link "One posting for a hundred armies" [ref=e241] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=group-postings
              - paragraph [ref=e242]: Select armies across the registry, give them standing postings together, and keep control of each member. One bounded request now returns one campaign update with a clear result for every order.
              - generic [ref=e243]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e244]:
              - text: "06"
              - generic [ref=e245]: ↗
          - article [ref=e246]:
            - link [aria-hidden] [ref=e247] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=fleet-provisions
            - generic [ref=e248]:
              - paragraph [ref=e249]: Engineering / Fleet provisions · rules 31
              - heading [level=3] [ref=e250]:
                - link "A voyage needs stores for the way home" [ref=e251] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=fleet-provisions
              - paragraph [ref=e252]: Fleets and their passengers now share finite stores. Sailors need a route back to harbor supply, the AI plans for that return, and a saved voyage keeps the supplies it actually has.
              - generic [ref=e253]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e254]:
              - text: "05"
              - generic [ref=e255]: ↗
          - article [ref=e256]:
            - link [aria-hidden] [ref=e257] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=campaign-foundation-and-development-order
            - generic [ref=e258]:
              - paragraph [ref=e259]: Engineering / Campaign foundation · rules 17
              - heading [level=3] [ref=e260]:
                - link "A funded expedition and a practical route to 1.0" [ref=e261] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=campaign-foundation-and-development-order
              - paragraph [ref=e262]: An island realm now counts the harbor it has already paid for. Fleet planning, explored land and campaign records take less repeated work, while the remaining Epic timing failure stays visible.
              - generic [ref=e263]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e264]:
              - text: "04"
              - generic [ref=e265]: ↗
          - article [ref=e266]:
            - link [aria-hidden] [ref=e267] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=r17-campaign-safety
            - generic [ref=e268]:
              - paragraph [ref=e269]: Engineering / Audit remediation · rule 17
              - heading [level=3] [ref=e270]:
                - link "A campaign worth keeping" [ref=e271] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=r17-campaign-safety
              - paragraph [ref=e272]: Training should not break a save. A crowded garrison should not make a town untouchable. This checkpoint repairs both, without rewriting the history of older campaigns.
              - generic [ref=e273]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e274]:
              - text: "01"
              - generic [ref=e275]: ↗
          - article [ref=e276]:
            - link [aria-hidden] [ref=e277] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=keeping-the-record
            - generic [ref=e278]:
              - paragraph [ref=e279]: Archives / Archive capacity · durability follow-up
              - heading [level=3] [ref=e280]:
                - link "Keeping the whole record" [ref=e281] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=keeping-the-record
              - paragraph [ref=e282]: A long campaign is more than its final snapshot. The archive work preserves the orders, battles and provenance needed to tell its history—and replay it.
              - generic [ref=e283]: Bounded verification
            - generic [aria-hidden] [ref=e284]:
              - text: "02"
              - generic [ref=e285]: ↗
          - article [ref=e286]:
            - link [aria-hidden] [ref=e287] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=twenty-four-cultures
            - generic [ref=e288]:
              - paragraph [ref=e289]: World & culture / Roster 4 · slices 22–27
              - heading [level=3] [ref=e290]:
                - link "Twenty-four ways to keep a hearth" [ref=e291] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=twenty-four-cultures
              - paragraph [ref=e292]: A culture is a political bargain, not a recolored banner. The current roster connects authored societies to real names, ecological choices and distinct approved art.
              - generic [ref=e293]: Playable baseline
            - generic [aria-hidden] [ref=e294]:
              - text: "03"
              - generic [ref=e295]: ↗
      - region [ref=e296]:
        - generic [ref=e297]:
          - generic [ref=e298]:
            - paragraph [ref=e299]: The promise & the remaining work
            - heading "Road to 1.0" [level=2] [ref=e300]
          - paragraph [ref=e301]: Selected gates and decisions. Not a complete release report or a completion percentage.
        - paragraph [ref=e302]: The agreed scope stays put. The evidence changes. A scoped approval moves a piece of the game forward; it does not clear every gate around it.
        - paragraph [ref=e303]:
          - link "Open the full roadmap →" [ref=e304] [cursor=pointer]:
            - /url: /Theandril/updates/roadmap/
          - text: Browse checked completed checkpoints, in-progress systems and pending features with evidence and remaining acceptance. The selected decisions below use the current roadmap snapshot; historical dispatches retain their own evidence.
        - generic [ref=e305]:
          - generic [ref=e306]:
            - term [ref=e307]:
              - generic [ref=e308]: Accepted scope
              - heading "The agreed game, not a moving finish line" [level=3] [ref=e309]
            - definition [ref=e310]:
              - paragraph [ref=e311]: The canonical scope still calls for long single-player campaigns, online human campaigns, deep progression, multiple victory paths and authored world content. No scope cuts or new gameplay obligations are adopted by these dispatches.
              - link "Read the source for The agreed game, not a moving finish line" [ref=e312] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/GAME_1_0_SCOPE.md
                - text: Read the source
                - generic [ref=e313]: for The agreed game, not a moving finish line
                - text: ↗
          - generic [ref=e314]:
            - term [ref=e315]:
              - generic [ref=e316]: Current / partial
              - heading "Gates E & F · Save integrity and combat" [level=3] [ref=e317]
            - definition [ref=e318]:
              - paragraph [ref=e319]: Rules/save 37 records paid land commissions, preserves a genuine thirteen-record rules 36 archive and verifies mixed 36-to-37 continuation. Remaining allowance, protected commission reserve, manual work takeover and immediate ownership cleanup survive exact saves/replay. Rules/save 36 records owned worker policies and preserves genuine rules 35 raw bytes, fourteen historical records and mixed 35→36 continuation. Earlier loads receive no policy. Manual overrides, siege waits, capture/raze cleanup and exact replay are verified locally. Hash-bound group requests reject stale intent before mutation and require saved restoration after uncertain results; these batches do not create an immediate autosave. Earlier patrol, storage and combat evidence remains historical, and all save/combat release gates remain open.
              - link "Read the source for Gates E & F · Save integrity and combat" [ref=e320] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/docs/IMPLEMENTATION_STATUS.md
                - text: Read the source
                - generic [ref=e321]: for Gates E & F · Save integrity and combat
                - text: ↗
          - generic [ref=e322]:
            - term [ref=e323]:
              - generic [ref=e324]: Current / partial
              - heading "Gates B, F2 & J · A playable foundation" [level=3] [ref=e325]
            - definition [ref=e326]:
              - paragraph [ref=e327]: Twenty-four cultures, resource economies, development branches and individual soldier battles are playable. Waykeepers are a first paid caster role, not complete magic. Content depth, campaign counterplay and the full progression targets remain partial.
              - link "Read the source for Gates B, F2 & J · A playable foundation" [ref=e328] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/docs/IMPLEMENTATION_STATUS.md
                - text: Read the source
                - generic [ref=e329]: for Gates B, F2 & J · A playable foundation
                - text: ↗
          - generic [ref=e330]:
            - term [ref=e331]:
              - generic [ref=e332]: Open gate
              - heading "Gate C & integration · Remaining campaign proof" [level=3] [ref=e333]
            - definition [ref=e334]:
              - paragraph [ref=e335]: The group-commission source checkpoint passes 2,486 tests across 300 files in 127.49 seconds with two local test workers. All 78 distinct local Pages cases pass across a 76-pass/two-failure full run and seven-case corrected affected rerun; original failures remain retained. Canonical rules and AI are unchanged, so no new pacing run is claimed. The earlier land-commission checkpoint passed all 74 local Pages cases. Rules 37 AI uses an exact one-job allowance only when complete worked-cell quotes and unchanged worker proposals prove the same paid improvement as its strategic planner. Standard/Long/Epic headline outcomes remain 219/329/374 at twelve-realm seed 20260905, with 18/22/29 commission commands and no submitted or automatic refusals. These are turn-outcome comparisons, not identical full states or all-seed equivalence. Earlier adverse seeds were not rerun; Long remains late. DH-021 and all fifteen release gates remain open.
              - link "Read the source for Gate C & integration · Remaining campaign proof" [ref=e336] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/docs/IMPLEMENTATION_STATUS.md
                - text: Read the source
                - generic [ref=e337]: for Gate C & integration · Remaining campaign proof
                - text: ↗
          - generic [ref=e338]:
            - term [ref=e339]:
              - generic [ref=e340]: Current / partial
              - heading "Gate I · Orders across a large realm" [level=3] [ref=e341]
            - definition [ref=e342]:
              - paragraph [ref=e343]: Individual land commissions choose one improvement, a remaining total allowance and a treasury reserve. They can pay immediately, then answer after upkeep and charters; existing sites and mismatched extraction deposits stay protected. Successful direct construction/cultivation/cancellation ends a commission, while removal keeps already paid work. A generated two-worker hearth completes two paid fields by turn 7 with exact restoration. Group commission assignment now handles up to 128 checked hearths with exact per-hearth allowance totals, one shared treasury reserve and named receipts. Four ordinary 22-coin works spend 88 of an authored 100-coin purse while 26 commissions wait; permission is not a purchase quote. Removal retains paid work and the exact 61-record archive. Claims, cultivation and replacement strategy remain open. Worker stewardship adds Balanced, Food, Industry, Coin and Knowledge priorities for claimed land, immediate and post-growth allocation, explicit manual takeover and canonical waiting reasons. Up to 128 checked hearths can receive the same priority with named results; those worker priorities spend no coin and order no construction or land purchase. Checked land armies can receive shared patrol points while existing paused policies stay paused. Posting and charter requests bind to the reviewed campaign; uncertain publication requires saved restoration. Named receipts expose all accepted/refused actors through filtered 25-row pages without retrying orders or changing selection. Settlement order filters find empty queues, hearths without charters and waiting policies from supplied owned facts before 25-row paging, preserving checks outside the filter. Counts overlap; queued work comes first and a next-work candidate is not a guaranteed purchase. Six explicit charter changes restore an exact 36-record authored archive without altering queues or treasury. Group patrol controls pause, resume or remove existing policies across up to 128 checked land armies ashore, including checks outside the current filter. Issued travel is unchanged; unaffected and refused checks remain. Army registry order filters find postings, waiting reports and paused patrols before 25-row pagination while preserving checked IDs. Personal posting templates recall a policy before explicit group orders. Saved two-point land patrols respect direct routes, postings, voyages, missions and sieges. An AI seat can review a safe interrupted home leg or retire a narrowly observed captured-hearth circuit while preserving issued travel; player travel never resumes itself and ordinary player turns do not perform AI cleanup. Multi-step programs, escorts, broader governors and organic mature-empire acceptance remain unfinished.
              - link "Read the source for Gate I · Orders across a large realm" [ref=e344] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/docs/IMPLEMENTATION_STATUS.md
                - text: Read the source
                - generic [ref=e345]: for Gate I · Orders across a large realm
                - text: ↗
          - generic [ref=e346]:
            - term [ref=e347]:
              - generic [ref=e348]: Open gate
              - heading "Gates D, K & L · Scale and browser confidence" [level=3] [ref=e349]
            - definition [ref=e350]:
              - paragraph [ref=e351]: Storage publication performs O(prefix bytes) reads; queued-GC proof scans the store. Large-store GC, sustained memory, real quota/process-kill durability and cross-browser certification still need separate evidence. A still image is not a frame-time result.
              - link "Read the source for Gates D, K & L · Scale and browser confidence" [ref=e352] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/docs/development/review-fix-2/persistence-REPORT.md
                - text: Read the source
                - generic [ref=e353]: for Gates D, K & L · Scale and browser confidence
                - text: ↗
          - generic [ref=e354]:
            - term [ref=e355]:
              - generic [ref=e356]: Proposal / deferred
              - heading "Suggested follow-ups, not new release promises" [level=3] [ref=e357]
            - definition [ref=e358]:
              - paragraph [ref=e359]: Promoting the temporary storage probes to permanent regressions and separately profiling large-store GC are review suggestions. They require a bounded work packet and acceptance criteria. This journal does not authorize blocked probes or turn every suggestion into scope.
              - link "Read the source for Suggested follow-ups, not new release promises" [ref=e360] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/docs/development/post-fix-review/persistence.verdict.json
                - text: Read the source
                - generic [ref=e361]: for Suggested follow-ups, not new release promises
                - text: ↗
          - generic [ref=e362]:
            - term [ref=e363]:
              - generic [ref=e364]: Not this update
              - heading "Gate M, full magic and a 1.0 announcement" [level=3] [ref=e365]
            - definition [ref=e366]:
              - paragraph [ref=e367]: No online multiplayer service, complete magic system, new art production or overall 1.0 signoff is delivered here. Online play and full magical depth remain accepted release scope—not silently deferred out of 1.0. This journal adds a review surface, not those game systems.
              - link "Read the source for Gate M, full magic and a 1.0 announcement" [ref=e368] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/DEFINITION_OF_DONE.md
                - text: Read the source
                - generic [ref=e369]: for Gate M, full magic and a 1.0 announcement
                - text: ↗
        - link "Read all release gates →" [ref=e370] [cursor=pointer]:
          - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/DEFINITION_OF_DONE.md
      - region [ref=e371]:
        - generic [ref=e372]:
          - generic [ref=e373]:
            - paragraph [ref=e374]: Read further
            - heading "The reference shelf" [level=2] [ref=e375]
          - paragraph [ref=e376]: The documents behind the dispatches. Snapshot links preserve the reviewed source revision.
        - list [ref=e377]:
          - listitem [ref=e378]:
            - generic [aria-hidden] [ref=e379]: "01"
            - generic [ref=e380]:
              - link "Group land commission verification" [ref=e381] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/docs/development/2026-10-26-group-land-commissions/README.md
              - paragraph [ref=e382]: Per-hearth permission, shared-purse payments, explicit receipts and saved restoration.
          - listitem [ref=e383]:
            - generic [aria-hidden] [ref=e384]: "02"
            - generic [ref=e385]:
              - link "Land commission verification" [ref=e386] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/docs/development/2026-10-25-land-commissions/README.md
              - paragraph [ref=e387]: Paid improvement allowances, reserves, manual takeover, original history and bounded AI/scale evidence.
          - listitem [ref=e388]:
            - generic [aria-hidden] [ref=e389]: "03"
            - generic [ref=e390]:
              - link "Group order workflows" [ref=e391] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/docs/development/2026-10-25-group-policy-results/README.md
              - paragraph [ref=e392]: Named accepted/refused receipts, explicit browsing, exact history and the final four-round implementation checkpoint.
          - listitem [ref=e393]:
            - generic [aria-hidden] [ref=e394]: "04"
            - generic [ref=e395]:
              - link "Shared patrol assignment" [ref=e396] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/docs/development/2026-10-25-group-patrol-assignment/README.md
              - paragraph [ref=e397]: Shared endpoints, preserved pauses, authored scale and a separate generated out-and-back journey.
          - listitem [ref=e398]:
            - generic [aria-hidden] [ref=e399]: "05"
            - generic [ref=e400]:
              - link "Stale policy requests" [ref=e401] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/docs/development/2026-10-25-group-intent/README.md
              - paragraph [ref=e402]: Reject old campaign intent before applying any group posting or charter.
          - listitem [ref=e403]:
            - generic [aria-hidden] [ref=e404]: "06"
            - generic [ref=e405]:
              - link "Uncertain policy publication" [ref=e406] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/docs/development/2026-10-25-group-publication-recovery/README.md
              - paragraph [ref=e407]: Actual post-mutation publication faults lock further commands until saved restoration.
          - listitem [ref=e408]:
            - generic [aria-hidden] [ref=e409]: "07"
            - generic [ref=e410]:
              - link "Settlement order filters" [ref=e411] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/docs/development/2026-10-25-settlement-order-filters/README.md
              - paragraph [ref=e412]: Overlapping owned cohorts, retained checked hearths, exact six-charter changes and saved restoration.
          - listitem [ref=e413]:
            - generic [aria-hidden] [ref=e414]: "08"
            - generic [ref=e415]:
              - link "Group patrol controls" [ref=e416] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/docs/development/2026-10-24-group-patrols/README.md
              - paragraph [ref=e417]: Explicit policy batches, unchanged travel, exact saved history and damaged-response recovery.
          - listitem [ref=e418]:
            - generic [aria-hidden] [ref=e419]: "09"
            - generic [ref=e420]:
              - link "Army registry order filters" [ref=e421] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/docs/development/2026-10-24-army-order-filters/README.md
              - paragraph [ref=e422]: Owned order facts, preserved checked IDs, authored 101-army production workflow and exact explicit-resume history.
          - listitem [ref=e423]:
            - generic [aria-hidden] [ref=e424]: "10"
            - generic [ref=e425]:
              - link "Immediate and maintained project counterplay" [ref=e426] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/docs/development/2026-10-24-project-counterplay/README.md
              - paragraph [ref=e427]: Visible legal opportunities, fresh-offer siege maintenance, actual battle outcomes, ten isolated measurements and unchanged nine-campaign hashes.
          - listitem [ref=e428]:
            - generic [aria-hidden] [ref=e429]: "11"
            - generic [ref=e430]:
              - link "Captured-hearth patrol retirement" [ref=e431] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/docs/development/2026-10-24-patrol-retirement/README.md
              - paragraph [ref=e432]: Observed ordinary cleanup, genuine Watch reassignment, six bounded measurements and unresolved three-seed pacing.
          - listitem [ref=e433]:
            - generic [aria-hidden] [ref=e434]: "12"
            - generic [ref=e435]:
              - link "Patrol orders and recovery" [ref=e436] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/docs/development/2026-10-24-patrol-recovery/README.md
              - paragraph [ref=e437]: Explicit AI recovery, exact generated evidence, nine pacing comparisons and unresolved release acceptance.
          - listitem [ref=e438]:
            - generic [aria-hidden] [ref=e439]: "13"
            - generic [ref=e440]:
              - link "Reusable posting policies" [ref=e441] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/docs/development/2026-10-24-posting-templates/README.md
              - paragraph [ref=e442]: Personal preferences, explicit group application, fresh hearth targets and saved recovery.
          - listitem [ref=e443]:
            - generic [aria-hidden] [ref=e444]: "14"
            - generic [ref=e445]:
              - link "Start playing & run locally" [ref=e446] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/README.md
              - paragraph [ref=e447]: Controls, setup, save transfer and the actual single-player development build.
          - listitem [ref=e448]:
            - generic [aria-hidden] [ref=e449]: "15"
            - generic [ref=e450]:
              - link "Implementation status" [ref=e451] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/docs/IMPLEMENTATION_STATUS.md
              - paragraph [ref=e452]: Implemented, partial, blocked and historical work. The source of truth behind the headlines.
          - listitem [ref=e453]:
            - generic [aria-hidden] [ref=e454]: "16"
            - generic [ref=e455]:
              - link "Agreed 1.0 scope" [ref=e456] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/GAME_1_0_SCOPE.md
              - paragraph [ref=e457]: The accepted game and content targets. A feature only counts when it is integrated.
          - listitem [ref=e458]:
            - generic [aria-hidden] [ref=e459]: "17"
            - generic [ref=e460]:
              - link "Definition of done" [ref=e461] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/DEFINITION_OF_DONE.md
              - paragraph [ref=e462]: Named release gates, required evidence and the final signoff contract.
          - listitem [ref=e463]:
            - generic [aria-hidden] [ref=e464]: "18"
            - generic [ref=e465]:
              - link "Development workflow" [ref=e466] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/docs/1.0-DEVELOPMENT.md
              - paragraph [ref=e467]: Canonical M0–M10 development sequence, with dependencies and acceptance for the existing scope.
          - listitem [ref=e468]:
            - generic [aria-hidden] [ref=e469]: "19"
            - generic [ref=e470]:
              - link "World & faction bible" [ref=e471] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/docs/lore/FACTION_BIBLE.md
              - paragraph [ref=e472]: Twenty-four societies, disputed history and the boundary between lore and runtime.
          - listitem [ref=e473]:
            - generic [aria-hidden] [ref=e474]: "20"
            - generic [ref=e475]:
              - link "Art status & provenance" [ref=e476] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/docs/art/ART_IMPLEMENTATION_STATUS.md
              - paragraph [ref=e477]: Reviewed pixels, real bindings, animation scope and unresolved production limits.
          - listitem [ref=e478]:
            - generic [aria-hidden] [ref=e479]: "21"
            - generic [ref=e480]:
              - link "Campaign-safety architecture" [ref=e481] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/docs/architecture/0037-campaign-safety.md
              - paragraph [ref=e482]: Canonical ownership, morale correction, reserves and historical compatibility.
          - listitem [ref=e483]:
            - generic [aria-hidden] [ref=e484]: "22"
            - generic [ref=e485]:
              - link "Reinforcement and supply architecture" [ref=e486] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/docs/architecture/0046-reinforcement-supply-access.md
              - paragraph [ref=e487]: Visible-threat reserve guards, paid source-specific supply, participant disclosures, bounded AI and rules 33 history.
          - listitem [ref=e488]:
            - generic [aria-hidden] [ref=e489]: "23"
            - generic [ref=e490]:
              - link "Reinforcement and logistics verification" [ref=e491] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/docs/development/2026-09-27-reinforcement-logistics/README.md
              - paragraph [ref=e492]: Joined authored mature-realm acceptance, real treaty payment and recovery, paired three-seed pacing, retained failures and explicit limits.
          - listitem [ref=e493]:
            - generic [aria-hidden] [ref=e494]: "24"
            - generic [ref=e495]:
              - link "Defensive theater architecture" [ref=e496] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/docs/architecture/0045-defense-theaters.md
              - paragraph [ref=e497]: Canonical saved watches, bounded ordinary movement, direct overrides and observed AI adoption.
          - listitem [ref=e498]:
            - generic [aria-hidden] [ref=e499]: "25"
            - generic [ref=e500]:
              - link "Group travel architecture" [ref=e501] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/docs/architecture/0044-group-travel.md
              - paragraph [ref=e502]: Explicit bounded route reviews and ordinary movement, retained postings, partial outcomes and recovery.
          - listitem [ref=e503]:
            - generic [aria-hidden] [ref=e504]: "26"
            - generic [ref=e505]:
              - link "Production sequences architecture" [ref=e506] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/docs/architecture/0043-production-sequences.md
              - paragraph [ref=e507]: Explicit ordered batches over ordinary paid queues, partial prefixes and a separate personal template library.
          - listitem [ref=e508]:
            - generic [aria-hidden] [ref=e509]: "27"
            - generic [ref=e510]:
              - link "Saved groups architecture" [ref=e511] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/docs/architecture/0042-selection-groups.md
              - paragraph [ref=e512]: Campaign-owned selection groups, explicit recall, loss reconciliation, bounded metadata and historical saves.
          - listitem [ref=e513]:
            - generic [aria-hidden] [ref=e514]: "28"
            - generic [ref=e515]:
              - link "Charter templates architecture" [ref=e516] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/docs/architecture/0041-charter-templates.md
              - paragraph [ref=e517]: Browser-local named policies, explicit recall and assignment, bounded preferences and visible storage failures.
          - listitem [ref=e518]:
            - generic [aria-hidden] [ref=e519]: "29"
            - generic [ref=e520]:
              - link "Group charters architecture" [ref=e521] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/docs/architecture/0040-group-charters.md
              - paragraph [ref=e522]: Shared policy controls, existing production precedence, per-work budgets and one final worker response.
          - listitem [ref=e523]:
            - generic [aria-hidden] [ref=e524]: "30"
            - generic [ref=e525]:
              - link "Group postings architecture" [ref=e526] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/docs/architecture/0039-group-postings.md
              - paragraph [ref=e527]: Bounded ordinary-command batches, per-army results, interrupted recording and transfer measurements.
          - listitem [ref=e528]:
            - generic [aria-hidden] [ref=e529]: "31"
            - generic [ref=e530]:
              - link "Fleet provisions architecture" [ref=e531] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/docs/architecture/0038-fleet-provisions.md
              - paragraph [ref=e532]: Canonical stores, shared passenger outcomes, naval staging and versioned persistence.
      - region [ref=e533]:
        - paragraph [ref=e534]: Leave a useful record
        - heading "Bring a change to the table" [level=2] [ref=e535]
        - paragraph [ref=e536]: Start with a bounded problem, a failing regression and a player-visible result. Record the decision, the exact evidence and the work still open. A proposal is not a delivered feature.
        - list [ref=e537]:
          - listitem [ref=e538]:
            - strong [ref=e539]: Draft before publishing.
            - text: Use the template in your work branch. Drafts stay out of the public catalog until reviewed; this journal has no private draft route or CMS.
          - listitem [ref=e540]:
            - strong [ref=e541]: Attach evidence, not a green total.
            - text: Link actual source and results; label authored examples versus organic campaigns. Keep blocked checks blocked.
          - listitem [ref=e542]:
            - strong [ref=e543]: Check the reading experience.
            - text: Add typed content, inspect owned pixels and verify the permalink, keyboard, narrow layout and deployment base.
        - generic [ref=e544]:
          - link "Authoring guide" [ref=e545] [cursor=pointer]:
            - /url: https://github.com/ErikBurdett/Theandril/blob/master/docs/updates/CONTRIBUTING.md
          - link "Dispatch template" [ref=e546] [cursor=pointer]:
            - /url: https://github.com/ErikBurdett/Theandril/blob/master/docs/updates/TEMPLATE.md
          - link "Report a problem ↗" [ref=e547] [cursor=pointer]:
            - /url: https://github.com/ErikBurdett/Theandril/issues/new?title=Journal%20feedback%3A%20
        - paragraph [ref=e548]: "Useful next packet: document one specific player journey with source links and acceptance criteria. Propose scope changes explicitly; no paid tools, generated art or blocked AI probes are required to improve a dispatch."
  - contentinfo [ref=e549]:
    - paragraph [ref=e550]:
      - strong [ref=e551]: Theandril
      - text: · A world in the making.Single-player development build. Not Theandril 1.0.
    - generic [ref=e552]:
      - link "Current implementation status ↗" [ref=e553] [cursor=pointer]:
        - /url: https://github.com/ErikBurdett/Theandril/blob/master/docs/IMPLEMENTATION_STATUS.md
      - link "Image provenance ↗" [ref=e554] [cursor=pointer]:
        - /url: /Theandril/updates/provenance.json
      - link "Hearth & Card roadmap ↗" [ref=e555] [cursor=pointer]:
        - /url: https://erikburdett.github.io/theandril-hearth-and-card/updates/roadmap/
      - link "Source repository ↗" [ref=e556] [cursor=pointer]:
        - /url: https://github.com/ErikBurdett/Theandril
```

# Test source

```ts
  1   | import { writeFile } from 'node:fs/promises';
  2   | import { expect, test } from '@playwright/test';
  3   | import { dispatches } from '../../apps/web/src/updates/content';
  4   | 
  5   | for (const dimensions of [{ width: 1440, height: 1000, scale: 100 }, { width: 1366, height: 768, scale: 100 }, { width: 390, height: 844, scale: 100 }, { width: 390, height: 844, scale: 130 }]) {
  6   |   test(`readable journal at ${dimensions.width}px and ${dimensions.scale}% text`, async ({ page }, testInfo) => {
  7   |     const errors: string[] = [];
  8   |     const workers: string[] = [];
  9   |     page.on('pageerror', error => errors.push(error.message));
  10  |     page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  11  |     page.on('worker', worker => workers.push(worker.url()));
  12  |     await page.setViewportSize({ width: dimensions.width, height: dimensions.height });
  13  |     await page.emulateMedia({ reducedMotion: 'reduce' });
  14  |     await page.goto('updates/dispatches/');
  15  |     await page.evaluate(scale => { document.documentElement.style.fontSize = `${scale}%`; }, dimensions.scale);
  16  |     await page.getByRole('heading', { name: 'Theandril Dispatches', exact: true }).waitFor();
  17  |     // Exercise real lazy loading by scrolling to each visible image before the full-page capture.
  18  |     for (const image of await page.locator('img:visible').all()) {
  19  |       await image.scrollIntoViewIfNeeded();
  20  |       await image.evaluate(element => (element as HTMLImageElement).decode());
  21  |     }
  22  |     await page.evaluate(() => window.scrollTo(0, 0));
  23  |     await page.screenshot({ path: testInfo.outputPath('explore-top.png') });
> 24  |     await page.screenshot({ path: testInfo.outputPath('explore-full.png'), fullPage: true });
      |                ^ Error: page.screenshot: Protocol error (Page.captureScreenshot): Unable to capture screenshot
  25  |     await expect(page.locator('figure > figcaption').first()).toHaveCSS('font-size', /./);
  26  |     expect(await page.locator('figure > figcaption').first().evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(14);
  27  |     expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  28  |     await page.getByRole('searchbox', { name: 'Search dispatches' }).fill('no-such-dispatch');
  29  |     await page.getByRole('heading', { name: 'No dispatches found' }).scrollIntoViewIfNeeded();
  30  |     await page.screenshot({ path: testInfo.outputPath('no-results.png') });
  31  |     await page.getByRole('button', { name: 'Reset search & filters', exact: true }).click();
  32  |     await page.getByRole('link', { name: 'Read the featured dispatch' }).click();
  33  |     await page.evaluate(scale => { document.documentElement.style.fontSize = `${scale}%`; }, dimensions.scale);
  34  |     await expect(page.getByRole('heading', { level: 1, name: 'Give several hearths a land budget' })).toBeVisible();
  35  |     await page.screenshot({ path: testInfo.outputPath('reader-top.png') });
  36  |     for (const id of ['group-land-budget']) {
  37  |       await page.locator(`.illustration-${id}`).scrollIntoViewIfNeeded();
  38  |       await page.locator(`.illustration-${id} > button > img`).evaluate(image => (image as HTMLImageElement).decode());
  39  |       await page.locator(`.illustration-${id}`).screenshot({ path: testInfo.outputPath(`${id}-illustration.png`) });
  40  |     }
  41  |     await page.getByRole('heading', { name: 'Permission is not a purchase' }).evaluate(element => element.scrollIntoView({ block: 'start' }));
  42  |     await page.screenshot({ path: testInfo.outputPath('reader-chapter.png') });
  43  |     expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  44  |     const imageFacts = await page.locator('figure > button > img').evaluateAll(elements => elements.map(element => { const image = element as HTMLImageElement; return { src: image.currentSrc, width: image.naturalWidth, complete: image.complete }; }));
  45  |     expect(imageFacts.every(image => image.complete && image.width > 0)).toBe(true);
  46  |     expect(imageFacts.every(image => new URL(image.src).pathname.includes('/updates/'))).toBe(true);
  47  |     await writeFile(testInfo.outputPath('layout-evidence.json'), JSON.stringify({ dimensions, imageFacts, errors, workers }, null, 2));
  48  |     expect(errors).toEqual([]);
  49  |     expect(workers).toEqual([]);
  50  |   });
  51  | }
  52  | 
  53  | test('reading surfaces retain contrast without putting texture over the text', async ({ page }, testInfo) => {
  54  |   await page.goto('updates/dispatches/');
  55  |   await expect(page.getByRole('heading', { name: 'Theandril Dispatches', exact: true })).toBeVisible();
  56  |   const measurements = await page.evaluate(() => {
  57  |     const rgb = (value: string) => value.match(/[\d.]+/g)!.map(Number);
  58  |     const luminance = (color: number[]) => color.slice(0, 3).reduce((total, channel, index) => {
  59  |       const s = channel / 255;
  60  |       return total + (s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4) * [ .2126, .7152, .0722 ][index]!;
  61  |     }, 0);
  62  |     const ratio = (a: number[], b: number[]) => {
  63  |       const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  64  |       return (values[0]! + .05) / (values[1]! + .05);
  65  |     };
  66  |     return [
  67  |       ['.feature-summary', '.paper-content'], ['figure > figcaption', '.paper-content'],
  68  |       ['.scope-ledger dd', '.paper-content'], ['.contribution-note', '.contribute-section'],
  69  |       ['.plaque', '.plaque'], ['.site-header nav', '.journal-site'], ['.site-footer', '.journal-site'],
  70  |     ].map(([foregroundSelector, backgroundSelector]) => {
  71  |       const foreground = getComputedStyle(document.querySelector(foregroundSelector!)!).color;
  72  |       const background = getComputedStyle(document.querySelector(backgroundSelector!)!).backgroundColor;
  73  |       const fg = rgb(foreground), bg = rgb(background), alpha = bg[3] ?? 1;
  74  |       // Paper's translucent wash is bounded against black and white underneath.
  75  |       // Multiply-blended walnut cannot be brighter than its background color.
  76  |       const extremes = [0, 255].map(under => bg.slice(0, 3).map(channel => channel * alpha + under * (1 - alpha)));
  77  |       return { foregroundSelector, backgroundSelector, foreground, background, conservativeRatio: Math.min(...extremes.map(value => ratio(fg, value))) };
  78  |     });
  79  |   });
  80  |   await writeFile(testInfo.outputPath('contrast-evidence.json'), JSON.stringify(measurements, null, 2));
  81  |   for (const entry of measurements) expect(entry.conservativeRatio, entry.foregroundSelector).toBeGreaterThanOrEqual(4.5);
  82  | });
  83  | 
  84  | test('unknown dispatch links fail honestly and keyboard skip navigation works', async ({ page }) => {
  85  |   await page.goto('updates/dispatches/?dispatch=not-published');
  86  |   await expect(page.getByRole('heading', { name: 'That page is not in the journal' })).toBeVisible();
  87  |   await page.getByRole('link', { name: 'Browse published dispatches' }).click();
  88  |   await expect(page.getByRole('heading', { name: 'Theandril Dispatches', exact: true })).toBeVisible();
  89  |   await page.keyboard.press('Tab');
  90  |   await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  91  |   await page.keyboard.press('Enter');
  92  |   await expect(page.getByRole('main')).toBeFocused();
  93  | });
  94  | 
  95  | test('archive search combines topic filters, survives refresh and recovers from no results', async ({ page }) => {
  96  |   await page.goto('updates/dispatches/#archive');
  97  |   await page.getByRole('searchbox', { name: 'Search dispatches' }).fill('Vesper');
  98  |   await page.getByRole('button', { name: 'World & culture', exact: true }).click();
  99  |   await expect(page.getByRole('status')).toHaveText('1 dispatch');
  100 |   await expect(page.locator('.dispatch-row')).toHaveCount(1);
  101 |   await page.reload();
  102 |   await expect(page.getByRole('searchbox', { name: 'Search dispatches' })).toHaveValue('Vesper');
  103 |   await page.getByRole('button', { name: 'Engineering', exact: true }).click();
  104 |   await expect(page.getByRole('heading', { name: 'No dispatches found' })).toBeVisible();
  105 |   await page.getByRole('button', { name: 'Reset search & filters', exact: true }).click();
  106 |   await expect(page.getByRole('status')).toHaveText(`${dispatches.length} dispatches`);
  107 |   await expect(page.locator('.dispatch-row')).toHaveCount(dispatches.length);
  108 | });
  109 | 
  110 | test('scope ledger links real gates and a contributor can reach authoring guidance', async ({ page }) => {
  111 |   await page.goto('updates/dispatches/');
  112 |   await expect(page.getByRole('heading', { name: 'Road to 1.0', exact: true })).toBeVisible();
  113 |   const ledger = page.getByRole('region', { name: 'Road to 1.0' });
  114 |   await expect(ledger.getByText('Accepted scope', { exact: true })).toBeVisible();
  115 |   await expect(ledger.getByText('Current / partial', { exact: true }).first()).toBeVisible();
  116 |   await expect(ledger.getByText('Proposal / deferred', { exact: true })).toBeVisible();
  117 |   await expect(ledger.getByText('Not this update', { exact: true })).toBeVisible();
  118 |   await expect(ledger).toContainText('player travel never resumes itself');
  119 |   await expect(ledger).toContainText('2,486');
  120 |   await expect(page.getByRole('link', { name: 'Definition of done', exact: true })).toHaveAttribute('href', /DEFINITION_OF_DONE.md$/);
  121 |   await expect(page.getByRole('heading', { name: 'The reference shelf' })).toBeVisible();
  122 |   await expect(page.getByRole('link', { name: 'Authoring guide', exact: true })).toHaveAttribute('href', /docs\/updates\/CONTRIBUTING.md$/);
  123 |   await expect(page.getByRole('link', { name: 'Dispatch template', exact: true })).toHaveAttribute('href', /docs\/updates\/TEMPLATE.md$/);
  124 | });
```