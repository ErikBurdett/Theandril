# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: gameplay/home.spec.ts >> dispatches remain refresh-safe at their new path
- Location: tests/gameplay/home.spec.ts:18:1

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  locator('.dispatch-row')
Expected: 11
Received: 12
Timeout:  5000ms

Call log:
  - Expect "toHaveCount" locator('.dispatch-row') with timeout 5000ms
  - waiting for locator('.dispatch-row')
    14 × locator resolved to 12 elements
       - unexpected value "12"

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
          - paragraph [ref=e28]: Featured dispatch · 12
          - generic [ref=e30]: Reviewed checkpoint
          - heading "Give your hearths a standing watch" [level=2] [ref=e31]
          - paragraph [ref=e32]: 27 September 2026 · Defensive theaters
          - paragraph [ref=e33]: Choose the hearths to protect, assign their watch companies and name a reserve. Idle members fill guard gaps on later turns while your direct routes and standing postings keep priority.
          - link "Read the featured dispatch" [ref=e34] [cursor=pointer]:
            - /url: /Theandril/updates/dispatches/?dispatch=defense-theaters
            - text: Read the dispatch
            - generic [aria-hidden] [ref=e35]: →
          - paragraph [ref=e36]: Source checkpoint 0ecd2d1 · Not a 1.0 release.
        - figure [ref=e37]:
          - button "Enlarge defense-theater-summary image" [ref=e38]:
            - 'img "Theater summary: zero missing guards, four incoming, ninety-five in reserve and one direct override." [ref=e39]'
            - generic [aria-hidden] [ref=e40]: Inspect image ↗
          - generic [ref=e41]:
            - text: "Native 406 × 19 desktop text capture from the authored 100-army, two-hearth regression fixture at turn 2: zero missing guards includes four incoming armies, with 95 in reserve and one direct override. The incoming armies have not arrived. Only the summary is shown; exact PNG bytes without later transformation."
            - link "Original image ↗" [ref=e42] [cursor=pointer]:
              - /url: https://github.com/ErikBurdett/Theandril/blob/0ecd2d1767f613942cf9f22315da624164cc4055/docs/development/2026-09-27-defense-theaters/browser-evidence/text-capture/defense-theaters-a-hundred-2ca15-age-while-postings-override/defense-theater-summary-text.png
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
        - status [ref=e64]: 12 dispatches
        - generic [ref=e65]:
          - article [ref=e66]:
            - link [aria-hidden] [ref=e67] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=defense-theaters
            - generic [ref=e68]:
              - paragraph [ref=e69]: Engineering / Defensive theaters · ACT-32
              - heading [level=3] [ref=e70]:
                - link "Give your hearths a standing watch" [ref=e71] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=defense-theaters
              - paragraph [ref=e72]: Choose the hearths to protect, assign their watch companies and name a reserve. Idle members fill guard gaps on later turns while your direct routes and standing postings keep priority.
              - generic [ref=e73]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e74]:
              - text: "12"
              - generic [ref=e75]: ↗
          - article [ref=e76]:
            - link [aria-hidden] [ref=e77] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=group-travel
            - generic [ref=e78]:
              - paragraph [ref=e79]: Engineering / Group travel · ACT-32
              - heading [level=3] [ref=e80]:
                - link "Give your armies a shared destination" [ref=e81] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=group-travel
              - paragraph [ref=e82]: Recall a saved army group, review their separate routes and send them toward one destination. Ordinary travel keeps its costs, interruptions and individual controls, with results for every army.
              - generic [ref=e83]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e84]:
              - text: "11"
              - generic [ref=e85]: ↗
          - article [ref=e86]:
            - link [aria-hidden] [ref=e87] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=production-sequences
            - generic [ref=e88]:
              - paragraph [ref=e89]: Engineering / Production sequences · ACT-32
              - heading [level=3] [ref=e90]:
                - link "Queue a plan across your hearths" [ref=e91] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=production-sequences
              - paragraph [ref=e92]: Arrange a short production list, recall the hearths that need it and see which projects were paid for. Personal templates keep useful plans ready while every order still uses the existing queues.
              - generic [ref=e93]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e94]:
              - text: "10"
              - generic [ref=e95]: ↗
          - article [ref=e96]:
            - link [aria-hidden] [ref=e97] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=selection-groups
            - generic [ref=e98]:
              - paragraph [ref=e99]: Engineering / Saved realm groups · rules 32
              - heading [level=3] [ref=e100]:
                - link "Recall a group, then give the order" [ref=e101] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=selection-groups
              - paragraph [ref=e102]: Remember the armies guarding a frontier or the hearths sharing a policy. Named groups now travel with the campaign, ready to recall, inspect and order through the existing registry.
              - generic [ref=e103]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e104]:
              - text: "09"
              - generic [ref=e105]: ↗
          - article [ref=e106]:
            - link [aria-hidden] [ref=e107] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=charter-templates
            - generic [ref=e108]:
              - paragraph [ref=e109]: Engineering / Charter templates · ACT-32
              - heading [level=3] [ref=e110]:
                - link "Keep a charter worth repeating" [ref=e111] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=charter-templates
              - paragraph [ref=e112]: Save a useful charter policy by name, recall it in another campaign, then choose which hearths should receive it. A personal browser library keeps repeated setup apart from the orders already governing a realm.
              - generic [ref=e113]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e114]:
              - text: "08"
              - generic [ref=e115]: ↗
          - article [ref=e116]:
            - link [aria-hidden] [ref=e117] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=group-charters
            - generic [ref=e118]:
              - paragraph [ref=e119]: Engineering / Group hearth charters · ACT-32
              - heading [level=3] [ref=e120]:
                - link "One charter policy for forty hearths" [ref=e121] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=group-charters
              - paragraph [ref=e122]: Give selected hearths the same standing charter, keep their queued work intact, and inspect each result. Shared controls now explain what every hearth may spend from the realm’s treasury.
              - generic [ref=e123]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e124]:
              - text: "07"
              - generic [ref=e125]: ↗
          - article [ref=e126]:
            - link [aria-hidden] [ref=e127] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=group-postings
            - generic [ref=e128]:
              - paragraph [ref=e129]: Engineering / Group postings · ACT-32
              - heading [level=3] [ref=e130]:
                - link "One posting for a hundred armies" [ref=e131] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=group-postings
              - paragraph [ref=e132]: Select armies across the registry, give them standing postings together, and keep control of each member. One bounded request now returns one campaign update with a clear result for every order.
              - generic [ref=e133]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e134]:
              - text: "06"
              - generic [ref=e135]: ↗
          - article [ref=e136]:
            - link [aria-hidden] [ref=e137] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=fleet-provisions
            - generic [ref=e138]:
              - paragraph [ref=e139]: Engineering / Fleet provisions · rules 31
              - heading [level=3] [ref=e140]:
                - link "A voyage needs stores for the way home" [ref=e141] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=fleet-provisions
              - paragraph [ref=e142]: Fleets and their passengers now share finite stores. Sailors need a route back to harbor supply, the AI plans for that return, and a saved voyage keeps the supplies it actually has.
              - generic [ref=e143]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e144]:
              - text: "05"
              - generic [ref=e145]: ↗
          - article [ref=e146]:
            - link [aria-hidden] [ref=e147] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=campaign-foundation-and-development-order
            - generic [ref=e148]:
              - paragraph [ref=e149]: Engineering / Campaign foundation · rules 17
              - heading [level=3] [ref=e150]:
                - link "A funded expedition and a practical route to 1.0" [ref=e151] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=campaign-foundation-and-development-order
              - paragraph [ref=e152]: An island realm now counts the harbor it has already paid for. Fleet planning, explored land and campaign records take less repeated work, while the remaining Epic timing failure stays visible.
              - generic [ref=e153]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e154]:
              - text: "04"
              - generic [ref=e155]: ↗
          - article [ref=e156]:
            - link [aria-hidden] [ref=e157] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=r17-campaign-safety
            - generic [ref=e158]:
              - paragraph [ref=e159]: Engineering / Audit remediation · rule 17
              - heading [level=3] [ref=e160]:
                - link "A campaign worth keeping" [ref=e161] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=r17-campaign-safety
              - paragraph [ref=e162]: Training should not break a save. A crowded garrison should not make a town untouchable. This checkpoint repairs both, without rewriting the history of older campaigns.
              - generic [ref=e163]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e164]:
              - text: "01"
              - generic [ref=e165]: ↗
          - article [ref=e166]:
            - link [aria-hidden] [ref=e167] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=keeping-the-record
            - generic [ref=e168]:
              - paragraph [ref=e169]: Archives / Archive capacity · durability follow-up
              - heading [level=3] [ref=e170]:
                - link "Keeping the whole record" [ref=e171] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=keeping-the-record
              - paragraph [ref=e172]: A long campaign is more than its final snapshot. The archive work preserves the orders, battles and provenance needed to tell its history—and replay it.
              - generic [ref=e173]: Bounded verification
            - generic [aria-hidden] [ref=e174]:
              - text: "02"
              - generic [ref=e175]: ↗
          - article [ref=e176]:
            - link [aria-hidden] [ref=e177] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=twenty-four-cultures
            - generic [ref=e178]:
              - paragraph [ref=e179]: World & culture / Roster 4 · slices 22–27
              - heading [level=3] [ref=e180]:
                - link "Twenty-four ways to keep a hearth" [ref=e181] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=twenty-four-cultures
              - paragraph [ref=e182]: A culture is a political bargain, not a recolored banner. The current roster connects authored societies to real names, ecological choices and distinct approved art.
              - generic [ref=e183]: Playable baseline
            - generic [aria-hidden] [ref=e184]:
              - text: "03"
              - generic [ref=e185]: ↗
      - region [ref=e186]:
        - generic [ref=e187]:
          - generic [ref=e188]:
            - paragraph [ref=e189]: The promise & the remaining work
            - heading "Road to 1.0" [level=2] [ref=e190]
          - paragraph [ref=e191]: Selected gates and decisions. Not a complete release report or a completion percentage.
        - paragraph [ref=e192]: The agreed scope stays put. The evidence changes. A scoped approval moves a piece of the game forward; it does not clear every gate around it.
        - paragraph [ref=e193]:
          - link "Open the full roadmap →" [ref=e194] [cursor=pointer]:
            - /url: /Theandril/updates/roadmap/
          - text: Browse checked completed checkpoints, in-progress systems and pending features with evidence and remaining acceptance. The selected decisions below use the current roadmap snapshot; historical dispatches retain their own evidence.
        - generic [ref=e195]:
          - generic [ref=e196]:
            - term [ref=e197]:
              - generic [ref=e198]: Accepted scope
              - heading "The agreed game, not a moving finish line" [level=3] [ref=e199]
            - definition [ref=e200]:
              - paragraph [ref=e201]: The canonical scope still calls for long single-player campaigns, online human campaigns, deep progression, multiple victory paths and authored world content. No scope cuts or new gameplay obligations are adopted by these dispatches.
              - link "Read the source for The agreed game, not a moving finish line" [ref=e202] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/0ecd2d1767f613942cf9f22315da624164cc4055/GAME_1_0_SCOPE.md
                - text: Read the source
                - generic [ref=e203]: for The agreed game, not a moving finish line
                - text: ↗
          - generic [ref=e204]:
            - term [ref=e205]:
              - generic [ref=e206]: Current / partial
              - heading "Gates E & F · Save integrity and combat" [level=3] [ref=e207]
            - definition [ref=e208]:
              - paragraph [ref=e209]: Rules/save 33 adds canonical defensive theaters. Seven genuine rules 32 saves and archives retain exact historical bytes and replay; three old continuations, mixed history, portable transfer and reopened storage pass. The focused 100-check compatibility run overlaps the full suite. Whole save, combat and release gates remain open.
              - link "Read the source for Gates E & F · Save integrity and combat" [ref=e210] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/0ecd2d1767f613942cf9f22315da624164cc4055/docs/development/2026-09-27-defense-theaters/README.md
                - text: Read the source
                - generic [ref=e211]: for Gates E & F · Save integrity and combat
                - text: ↗
          - generic [ref=e212]:
            - term [ref=e213]:
              - generic [ref=e214]: Current / partial
              - heading "Gates B, F2 & J · A playable foundation" [level=3] [ref=e215]
            - definition [ref=e216]:
              - paragraph [ref=e217]: Twenty-four cultures, resource economies, development branches and individual soldier battles are playable. Waykeepers are a first paid caster role, not complete magic. Content depth, campaign counterplay and the full progression targets remain partial.
              - link "Read the source for Gates B, F2 & J · A playable foundation" [ref=e218] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/0ecd2d1767f613942cf9f22315da624164cc4055/docs/IMPLEMENTATION_STATUS.md
                - text: Read the source
                - generic [ref=e219]: for Gates B, F2 & J · A playable foundation
                - text: ↗
          - generic [ref=e220]:
            - term [ref=e221]:
              - generic [ref=e222]: Open gate
              - heading "Gate C & integration · Remaining campaign proof" [level=3] [ref=e223]
            - definition [ref=e224]:
              - paragraph [ref=e225]: The defensive-theater implementation passes 2,075 headless tests across 258 files and 33 affected Chromium journeys; one generated-production journey passes separately. Twelve realms each adopt a one-army home watch in measured campaigns, with three successful automatic journeys and no routing refusals per campaign. Headline pacing is Standard 233, Long 311 and Epic 349; DH-021 stays open. Fleet attrition remains separately dated evidence. These scopes precede dispatch publication; M0 and overall integration remain open.
              - link "Read the source for Gate C & integration · Remaining campaign proof" [ref=e226] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/0ecd2d1767f613942cf9f22315da624164cc4055/docs/development/2026-09-27-defense-theaters/README.md
                - text: Read the source
                - generic [ref=e227]: for Gate C & integration · Remaining campaign proof
                - text: ↗
          - generic [ref=e228]:
            - term [ref=e229]:
              - generic [ref=e230]: Current / partial
              - heading "Gate I · Orders across a large realm" [level=3] [ref=e231]
            - definition [ref=e232]:
              - paragraph [ref=e233]: Named defensive theaters fill hearth guard floors and gather idle assigned armies at a reserve. Existing routes and postings take priority; pause, delete and detach stop future assignments while travel continues. Saved groups, explicit group travel, production sequences and personal charter/production templates remain available. Broader theater strategy, patrol/escort roles, army templates, governors and combined mature-empire acceptance remain open.
              - link "Read the source for Gate I · Orders across a large realm" [ref=e234] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/0ecd2d1767f613942cf9f22315da624164cc4055/docs/development/2026-09-27-defense-theaters/README.md
                - text: Read the source
                - generic [ref=e235]: for Gate I · Orders across a large realm
                - text: ↗
          - generic [ref=e236]:
            - term [ref=e237]:
              - generic [ref=e238]: Open gate
              - heading "Gates D, K & L · Scale and browser confidence" [level=3] [ref=e239]
            - definition [ref=e240]:
              - paragraph [ref=e241]: Storage publication performs O(prefix bytes) reads; queued-GC proof scans the store. Large-store GC, sustained memory, real quota/process-kill durability and cross-browser certification still need separate evidence. A still image is not a frame-time result.
              - link "Read the source for Gates D, K & L · Scale and browser confidence" [ref=e242] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/0ecd2d1767f613942cf9f22315da624164cc4055/docs/development/review-fix-2/persistence-REPORT.md
                - text: Read the source
                - generic [ref=e243]: for Gates D, K & L · Scale and browser confidence
                - text: ↗
          - generic [ref=e244]:
            - term [ref=e245]:
              - generic [ref=e246]: Proposal / deferred
              - heading "Suggested follow-ups, not new release promises" [level=3] [ref=e247]
            - definition [ref=e248]:
              - paragraph [ref=e249]: Promoting the temporary storage probes to permanent regressions and separately profiling large-store GC are review suggestions. They require a bounded work packet and acceptance criteria. This journal does not authorize blocked probes or turn every suggestion into scope.
              - link "Read the source for Suggested follow-ups, not new release promises" [ref=e250] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/0ecd2d1767f613942cf9f22315da624164cc4055/docs/development/post-fix-review/persistence.verdict.json
                - text: Read the source
                - generic [ref=e251]: for Suggested follow-ups, not new release promises
                - text: ↗
          - generic [ref=e252]:
            - term [ref=e253]:
              - generic [ref=e254]: Not this update
              - heading "Gate M, full magic and a 1.0 announcement" [level=3] [ref=e255]
            - definition [ref=e256]:
              - paragraph [ref=e257]: No online multiplayer service, complete magic system, new art production or overall 1.0 signoff is delivered here. Online play and full magical depth remain accepted release scope—not silently deferred out of 1.0. This journal adds a review surface, not those game systems.
              - link "Read the source for Gate M, full magic and a 1.0 announcement" [ref=e258] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/0ecd2d1767f613942cf9f22315da624164cc4055/DEFINITION_OF_DONE.md
                - text: Read the source
                - generic [ref=e259]: for Gate M, full magic and a 1.0 announcement
                - text: ↗
        - link "Read all release gates →" [ref=e260] [cursor=pointer]:
          - /url: https://github.com/ErikBurdett/Theandril/blob/0ecd2d1767f613942cf9f22315da624164cc4055/DEFINITION_OF_DONE.md
      - region [ref=e261]:
        - generic [ref=e262]:
          - generic [ref=e263]:
            - paragraph [ref=e264]: Read further
            - heading "The reference shelf" [level=2] [ref=e265]
          - paragraph [ref=e266]: The documents behind the dispatches. Snapshot links preserve the reviewed source revision.
        - list [ref=e267]:
          - listitem [ref=e268]:
            - generic [aria-hidden] [ref=e269]: "01"
            - generic [ref=e270]:
              - link "Start playing & run locally" [ref=e271] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/0ecd2d1767f613942cf9f22315da624164cc4055/README.md
              - paragraph [ref=e272]: Controls, setup, save transfer and the actual single-player development build.
          - listitem [ref=e273]:
            - generic [aria-hidden] [ref=e274]: "02"
            - generic [ref=e275]:
              - link "Implementation status" [ref=e276] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/0ecd2d1767f613942cf9f22315da624164cc4055/docs/IMPLEMENTATION_STATUS.md
              - paragraph [ref=e277]: Implemented, partial, blocked and historical work. The source of truth behind the headlines.
          - listitem [ref=e278]:
            - generic [aria-hidden] [ref=e279]: "03"
            - generic [ref=e280]:
              - link "Agreed 1.0 scope" [ref=e281] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/0ecd2d1767f613942cf9f22315da624164cc4055/GAME_1_0_SCOPE.md
              - paragraph [ref=e282]: The accepted game and content targets. A feature only counts when it is integrated.
          - listitem [ref=e283]:
            - generic [aria-hidden] [ref=e284]: "04"
            - generic [ref=e285]:
              - link "Definition of done" [ref=e286] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/0ecd2d1767f613942cf9f22315da624164cc4055/DEFINITION_OF_DONE.md
              - paragraph [ref=e287]: Named release gates, required evidence and the final signoff contract.
          - listitem [ref=e288]:
            - generic [aria-hidden] [ref=e289]: "05"
            - generic [ref=e290]:
              - link "Development workflow" [ref=e291] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/0ecd2d1767f613942cf9f22315da624164cc4055/docs/1.0-DEVELOPMENT.md
              - paragraph [ref=e292]: Canonical M0–M10 development sequence, with dependencies and acceptance for the existing scope.
          - listitem [ref=e293]:
            - generic [aria-hidden] [ref=e294]: "06"
            - generic [ref=e295]:
              - link "World & faction bible" [ref=e296] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/0ecd2d1767f613942cf9f22315da624164cc4055/docs/lore/FACTION_BIBLE.md
              - paragraph [ref=e297]: Twenty-four societies, disputed history and the boundary between lore and runtime.
          - listitem [ref=e298]:
            - generic [aria-hidden] [ref=e299]: "07"
            - generic [ref=e300]:
              - link "Art status & provenance" [ref=e301] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/0ecd2d1767f613942cf9f22315da624164cc4055/docs/art/ART_IMPLEMENTATION_STATUS.md
              - paragraph [ref=e302]: Reviewed pixels, real bindings, animation scope and unresolved production limits.
          - listitem [ref=e303]:
            - generic [aria-hidden] [ref=e304]: "08"
            - generic [ref=e305]:
              - link "Campaign-safety architecture" [ref=e306] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/0ecd2d1767f613942cf9f22315da624164cc4055/docs/architecture/0037-campaign-safety.md
              - paragraph [ref=e307]: Canonical ownership, morale correction, reserves and historical compatibility.
          - listitem [ref=e308]:
            - generic [aria-hidden] [ref=e309]: "09"
            - generic [ref=e310]:
              - link "Defensive theater architecture" [ref=e311] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/0ecd2d1767f613942cf9f22315da624164cc4055/docs/architecture/0045-defense-theaters.md
              - paragraph [ref=e312]: Canonical saved watches, bounded ordinary movement, direct overrides and observed AI adoption.
          - listitem [ref=e313]:
            - generic [aria-hidden] [ref=e314]: "10"
            - generic [ref=e315]:
              - link "Group travel architecture" [ref=e316] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/0ecd2d1767f613942cf9f22315da624164cc4055/docs/architecture/0044-group-travel.md
              - paragraph [ref=e317]: Explicit bounded route reviews and ordinary movement, retained postings, partial outcomes and recovery.
          - listitem [ref=e318]:
            - generic [aria-hidden] [ref=e319]: "11"
            - generic [ref=e320]:
              - link "Production sequences architecture" [ref=e321] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/0ecd2d1767f613942cf9f22315da624164cc4055/docs/architecture/0043-production-sequences.md
              - paragraph [ref=e322]: Explicit ordered batches over ordinary paid queues, partial prefixes and a separate personal template library.
          - listitem [ref=e323]:
            - generic [aria-hidden] [ref=e324]: "12"
            - generic [ref=e325]:
              - link "Saved groups architecture" [ref=e326] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/0ecd2d1767f613942cf9f22315da624164cc4055/docs/architecture/0042-selection-groups.md
              - paragraph [ref=e327]: Campaign-owned selection groups, explicit recall, loss reconciliation, bounded metadata and historical saves.
          - listitem [ref=e328]:
            - generic [aria-hidden] [ref=e329]: "13"
            - generic [ref=e330]:
              - link "Charter templates architecture" [ref=e331] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/0ecd2d1767f613942cf9f22315da624164cc4055/docs/architecture/0041-charter-templates.md
              - paragraph [ref=e332]: Browser-local named policies, explicit recall and assignment, bounded preferences and visible storage failures.
          - listitem [ref=e333]:
            - generic [aria-hidden] [ref=e334]: "14"
            - generic [ref=e335]:
              - link "Group charters architecture" [ref=e336] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/0ecd2d1767f613942cf9f22315da624164cc4055/docs/architecture/0040-group-charters.md
              - paragraph [ref=e337]: Shared policy controls, existing production precedence, per-work budgets and one final worker response.
          - listitem [ref=e338]:
            - generic [aria-hidden] [ref=e339]: "15"
            - generic [ref=e340]:
              - link "Group postings architecture" [ref=e341] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/0ecd2d1767f613942cf9f22315da624164cc4055/docs/architecture/0039-group-postings.md
              - paragraph [ref=e342]: Bounded ordinary-command batches, per-army results, interrupted recording and transfer measurements.
          - listitem [ref=e343]:
            - generic [aria-hidden] [ref=e344]: "16"
            - generic [ref=e345]:
              - link "Fleet provisions architecture" [ref=e346] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/0ecd2d1767f613942cf9f22315da624164cc4055/docs/architecture/0038-fleet-provisions.md
              - paragraph [ref=e347]: Canonical stores, shared passenger outcomes, naval staging and versioned persistence.
      - region [ref=e348]:
        - paragraph [ref=e349]: Leave a useful record
        - heading "Bring a change to the table" [level=2] [ref=e350]
        - paragraph [ref=e351]: Start with a bounded problem, a failing regression and a player-visible result. Record the decision, the exact evidence and the work still open. A proposal is not a delivered feature.
        - list [ref=e352]:
          - listitem [ref=e353]:
            - strong [ref=e354]: Draft before publishing.
            - text: Use the template in your work branch. Drafts stay out of the public catalog until reviewed; this journal has no private draft route or CMS.
          - listitem [ref=e355]:
            - strong [ref=e356]: Attach evidence, not a green total.
            - text: Link actual source and results; label authored examples versus organic campaigns. Keep blocked checks blocked.
          - listitem [ref=e357]:
            - strong [ref=e358]: Check the reading experience.
            - text: Add typed content, inspect owned pixels and verify the permalink, keyboard, narrow layout and deployment base.
        - generic [ref=e359]:
          - link "Authoring guide" [ref=e360] [cursor=pointer]:
            - /url: https://github.com/ErikBurdett/Theandril/blob/master/docs/updates/CONTRIBUTING.md
          - link "Dispatch template" [ref=e361] [cursor=pointer]:
            - /url: https://github.com/ErikBurdett/Theandril/blob/master/docs/updates/TEMPLATE.md
          - link "Report a problem ↗" [ref=e362] [cursor=pointer]:
            - /url: https://github.com/ErikBurdett/Theandril/issues/new?title=Journal%20feedback%3A%20
        - paragraph [ref=e363]: "Useful next packet: document one specific player journey with source links and acceptance criteria. Propose scope changes explicitly; no paid tools, generated art or blocked AI probes are required to improve a dispatch."
  - contentinfo [ref=e364]:
    - paragraph [ref=e365]:
      - strong [ref=e366]: Theandril
      - text: · A world in the making.Single-player development build. Not Theandril 1.0.
    - generic [ref=e367]:
      - link "Current implementation status ↗" [ref=e368] [cursor=pointer]:
        - /url: https://github.com/ErikBurdett/Theandril/blob/master/docs/IMPLEMENTATION_STATUS.md
      - link "Image provenance ↗" [ref=e369] [cursor=pointer]:
        - /url: /Theandril/updates/provenance.json
      - link "Hearth & Card roadmap ↗" [ref=e370] [cursor=pointer]:
        - /url: https://erikburdett.github.io/theandril-hearth-and-card/updates/roadmap/
      - link "Source repository ↗" [ref=e371] [cursor=pointer]:
        - /url: https://github.com/ErikBurdett/Theandril
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | 
  3  | test('home provides the public routes and generated ledger', async ({ page }) => {
  4  |   const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  5  |   await page.goto('updates/');
  6  |   await expect(page.getByRole('heading', { name: 'Theandril', exact: true })).toBeVisible();
  7  |   await expect(page.getByRole('heading', { name: 'The change ledger' })).toBeVisible();
  8  |   await expect(page.locator('.commit-entry')).toHaveCount(8);
  9  |   await expect(page.getByRole('button', { name: /Show .* older commits/ })).toBeVisible();
  10 |   await page.getByRole('button', { name: /Show .* older commits/ }).click();
  11 |   expect(await page.locator('.commit-entry').count()).toBeGreaterThan(8);
  12 |   await page.setViewportSize({ width: 390, height: 844 });
  13 |   await page.evaluate(() => { document.documentElement.style.fontSize = '130%'; });
  14 |   expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  15 |   expect(errors).toEqual([]);
  16 | });
  17 | 
  18 | test('dispatches remain refresh-safe at their new path', async ({ page }) => {
  19 |   await page.goto('updates/dispatches/');
> 20 |   await expect(page.locator('.dispatch-row')).toHaveCount(11);
     |                                               ^ Error: expect(locator).toHaveCount(expected) failed
  21 |   await page.locator('.dispatch-row a').first().click();
  22 |   await expect(page).toHaveURL(/updates\/dispatches\/\?dispatch=/);
  23 | });
  24 | 
  25 | test('a permalink to a commit beyond the first page reveals it and scrolls to it', async ({ page }) => {
  26 |   await page.goto('updates/?commit=588d79a');
  27 |   const entry = page.locator('#commit-588d79a');
  28 |   await expect(entry).toBeVisible();
  29 |   await expect(entry).toBeInViewport();
  30 |   expect(await page.locator('.commit-entry').count()).toBeGreaterThan(8);
  31 | });
  32 | 
```