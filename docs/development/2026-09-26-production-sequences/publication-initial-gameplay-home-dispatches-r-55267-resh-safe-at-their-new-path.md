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
Expected: 9
Received: 10
Timeout:  5000ms

Call log:
  - Expect "toHaveCount" locator('.dispatch-row') with timeout 5000ms
  - waiting for locator('.dispatch-row')
    14 × locator resolved to 10 elements
       - unexpected value "10"

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
          - paragraph [ref=e28]: Featured dispatch · 10
          - generic [ref=e30]: Reviewed checkpoint
          - heading "Queue a plan across your hearths" [level=2] [ref=e31]
          - paragraph [ref=e32]: 26 September 2026 · Production sequences
          - paragraph [ref=e33]: Arrange a short production list, recall the hearths that need it and see which projects were paid for. Personal templates keep useful plans ready while every order still uses the existing queues.
          - link "Read the featured dispatch" [ref=e34] [cursor=pointer]:
            - /url: /Theandril/updates/dispatches/?dispatch=production-sequences
            - text: Read the dispatch
            - generic [aria-hidden] [ref=e35]: →
          - paragraph [ref=e36]: Source checkpoint 420219d · Not a 1.0 release.
        - figure [ref=e37]:
          - button "Enlarge production-sequence-results image" [ref=e38]:
            - 'img "Production result: forty hearths complete, zero partial or refused; 120 orders accepted and zero refused." [ref=e39]'
            - generic [aria-hidden] [ref=e40]: Inspect image ↗
          - generic [ref=e41]:
            - text: Actual result summary from the authored forty-hearth regression fixture after Guard → Workshop → Guard:120 paid queue orders. Native318×39capture from a390px viewport; it shows only the result, not the full editor, an organically earned realm or whole-scale acceptance.
            - link "Original image ↗" [ref=e42] [cursor=pointer]:
              - /url: https://github.com/ErikBurdett/Theandril/blob/420219d278ae17f42a04871c6319ecf62a4af216/docs/development/2026-09-26-production-sequences/screenshots/production-sequence-results.png
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
        - status [ref=e64]: 10 dispatches
        - generic [ref=e65]:
          - article [ref=e66]:
            - link [aria-hidden] [ref=e67] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=production-sequences
            - generic [ref=e68]:
              - paragraph [ref=e69]: Engineering / Production sequences · ACT-32
              - heading [level=3] [ref=e70]:
                - link "Queue a plan across your hearths" [ref=e71] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=production-sequences
              - paragraph [ref=e72]: Arrange a short production list, recall the hearths that need it and see which projects were paid for. Personal templates keep useful plans ready while every order still uses the existing queues.
              - generic [ref=e73]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e74]:
              - text: "10"
              - generic [ref=e75]: ↗
          - article [ref=e76]:
            - link [aria-hidden] [ref=e77] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=selection-groups
            - generic [ref=e78]:
              - paragraph [ref=e79]: Engineering / Saved realm groups · rules 32
              - heading [level=3] [ref=e80]:
                - link "Recall a group, then give the order" [ref=e81] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=selection-groups
              - paragraph [ref=e82]: Remember the armies guarding a frontier or the hearths sharing a policy. Named groups now travel with the campaign, ready to recall, inspect and order through the existing registry.
              - generic [ref=e83]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e84]:
              - text: "09"
              - generic [ref=e85]: ↗
          - article [ref=e86]:
            - link [aria-hidden] [ref=e87] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=charter-templates
            - generic [ref=e88]:
              - paragraph [ref=e89]: Engineering / Charter templates · ACT-32
              - heading [level=3] [ref=e90]:
                - link "Keep a charter worth repeating" [ref=e91] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=charter-templates
              - paragraph [ref=e92]: Save a useful charter policy by name, recall it in another campaign, then choose which hearths should receive it. A personal browser library keeps repeated setup apart from the orders already governing a realm.
              - generic [ref=e93]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e94]:
              - text: "08"
              - generic [ref=e95]: ↗
          - article [ref=e96]:
            - link [aria-hidden] [ref=e97] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=group-charters
            - generic [ref=e98]:
              - paragraph [ref=e99]: Engineering / Group hearth charters · ACT-32
              - heading [level=3] [ref=e100]:
                - link "One charter policy for forty hearths" [ref=e101] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=group-charters
              - paragraph [ref=e102]: Give selected hearths the same standing charter, keep their queued work intact, and inspect each result. Shared controls now explain what every hearth may spend from the realm’s treasury.
              - generic [ref=e103]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e104]:
              - text: "07"
              - generic [ref=e105]: ↗
          - article [ref=e106]:
            - link [aria-hidden] [ref=e107] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=group-postings
            - generic [ref=e108]:
              - paragraph [ref=e109]: Engineering / Group postings · ACT-32
              - heading [level=3] [ref=e110]:
                - link "One posting for a hundred armies" [ref=e111] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=group-postings
              - paragraph [ref=e112]: Select armies across the registry, give them standing postings together, and keep control of each member. One bounded request now returns one campaign update with a clear result for every order.
              - generic [ref=e113]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e114]:
              - text: "06"
              - generic [ref=e115]: ↗
          - article [ref=e116]:
            - link [aria-hidden] [ref=e117] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=fleet-provisions
            - generic [ref=e118]:
              - paragraph [ref=e119]: Engineering / Fleet provisions · rules 31
              - heading [level=3] [ref=e120]:
                - link "A voyage needs stores for the way home" [ref=e121] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=fleet-provisions
              - paragraph [ref=e122]: Fleets and their passengers now share finite stores. Sailors need a route back to harbor supply, the AI plans for that return, and a saved voyage keeps the supplies it actually has.
              - generic [ref=e123]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e124]:
              - text: "05"
              - generic [ref=e125]: ↗
          - article [ref=e126]:
            - link [aria-hidden] [ref=e127] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=campaign-foundation-and-development-order
            - generic [ref=e128]:
              - paragraph [ref=e129]: Engineering / Campaign foundation · rules 17
              - heading [level=3] [ref=e130]:
                - link "A funded expedition and a practical route to 1.0" [ref=e131] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=campaign-foundation-and-development-order
              - paragraph [ref=e132]: An island realm now counts the harbor it has already paid for. Fleet planning, explored land and campaign records take less repeated work, while the remaining Epic timing failure stays visible.
              - generic [ref=e133]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e134]:
              - text: "04"
              - generic [ref=e135]: ↗
          - article [ref=e136]:
            - link [aria-hidden] [ref=e137] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=r17-campaign-safety
            - generic [ref=e138]:
              - paragraph [ref=e139]: Engineering / Audit remediation · rule 17
              - heading [level=3] [ref=e140]:
                - link "A campaign worth keeping" [ref=e141] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=r17-campaign-safety
              - paragraph [ref=e142]: Training should not break a save. A crowded garrison should not make a town untouchable. This checkpoint repairs both, without rewriting the history of older campaigns.
              - generic [ref=e143]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e144]:
              - text: "01"
              - generic [ref=e145]: ↗
          - article [ref=e146]:
            - link [aria-hidden] [ref=e147] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=keeping-the-record
            - generic [ref=e148]:
              - paragraph [ref=e149]: Archives / Archive capacity · durability follow-up
              - heading [level=3] [ref=e150]:
                - link "Keeping the whole record" [ref=e151] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=keeping-the-record
              - paragraph [ref=e152]: A long campaign is more than its final snapshot. The archive work preserves the orders, battles and provenance needed to tell its history—and replay it.
              - generic [ref=e153]: Bounded verification
            - generic [aria-hidden] [ref=e154]:
              - text: "02"
              - generic [ref=e155]: ↗
          - article [ref=e156]:
            - link [aria-hidden] [ref=e157] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=twenty-four-cultures
            - generic [ref=e158]:
              - paragraph [ref=e159]: World & culture / Roster 4 · slices 22–27
              - heading [level=3] [ref=e160]:
                - link "Twenty-four ways to keep a hearth" [ref=e161] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=twenty-four-cultures
              - paragraph [ref=e162]: A culture is a political bargain, not a recolored banner. The current roster connects authored societies to real names, ecological choices and distinct approved art.
              - generic [ref=e163]: Playable baseline
            - generic [aria-hidden] [ref=e164]:
              - text: "03"
              - generic [ref=e165]: ↗
      - region [ref=e166]:
        - generic [ref=e167]:
          - generic [ref=e168]:
            - paragraph [ref=e169]: The promise & the remaining work
            - heading "Road to 1.0" [level=2] [ref=e170]
          - paragraph [ref=e171]: Selected gates and decisions. Not a complete release report or a completion percentage.
        - paragraph [ref=e172]: The agreed scope stays put. The evidence changes. A scoped approval moves a piece of the game forward; it does not clear every gate around it.
        - paragraph [ref=e173]:
          - link "Open the full roadmap →" [ref=e174] [cursor=pointer]:
            - /url: /Theandril/updates/roadmap/
          - text: Browse checked completed checkpoints, in-progress systems and pending features with evidence and remaining acceptance. The selected decisions below use the current roadmap snapshot; historical dispatches retain their own evidence.
        - generic [ref=e175]:
          - generic [ref=e176]:
            - term [ref=e177]:
              - generic [ref=e178]: Accepted scope
              - heading "The agreed game, not a moving finish line" [level=3] [ref=e179]
            - definition [ref=e180]:
              - paragraph [ref=e181]: The canonical scope still calls for long single-player campaigns, online human campaigns, deep progression, multiple victory paths and authored world content. No scope cuts or new gameplay obligations are adopted by these dispatches.
              - link "Read the source for The agreed game, not a moving finish line" [ref=e182] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/420219d278ae17f42a04871c6319ecf62a4af216/GAME_1_0_SCOPE.md
                - text: Read the source
                - generic [ref=e183]: for The agreed game, not a moving finish line
                - text: ↗
          - generic [ref=e184]:
            - term [ref=e185]:
              - generic [ref=e186]: Current / partial
              - heading "Gates E & F · Save integrity and combat" [level=3] [ref=e187]
            - definition [ref=e188]:
              - paragraph [ref=e189]: Rules32 retains campaign groups with exact rules31 checkpoints and mixed-history saves and exports. A benchmark exposed a pre-existing sixty-four-realm research-save limit; current saves now support it while historical schemas remain frozen. Campaign-safety and fleet-store evidence remains historical; whole save, combat and release gates remain open.
              - link "Read the source for Gates E & F · Save integrity and combat" [ref=e190] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/420219d278ae17f42a04871c6319ecf62a4af216/docs/development/2026-09-25-selection-groups/integration-review.md
                - text: Read the source
                - generic [ref=e191]: for Gates E & F · Save integrity and combat
                - text: ↗
          - generic [ref=e192]:
            - term [ref=e193]:
              - generic [ref=e194]: Current / partial
              - heading "Gates B, F2 & J · A playable foundation" [level=3] [ref=e195]
            - definition [ref=e196]:
              - paragraph [ref=e197]: Twenty-four cultures, resource economies, development branches and individual soldier battles are playable. Waykeepers are a first paid caster role, not complete magic. Content depth, campaign counterplay and the full progression targets remain partial.
              - link "Read the source for Gates B, F2 & J · A playable foundation" [ref=e198] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/420219d278ae17f42a04871c6319ecf62a4af216/docs/IMPLEMENTATION_STATUS.md
                - text: Read the source
                - generic [ref=e199]: for Gates B, F2 & J · A playable foundation
                - text: ↗
          - generic [ref=e200]:
            - term [ref=e201]:
              - generic [ref=e202]: Open gate
              - heading "Gate C & integration · Remaining campaign proof" [level=3] [ref=e203]
            - definition [ref=e204]:
              - paragraph [ref=e205]: The production-sequence implementation passes 1,975 headless tests across 247 files before its dispatch publication. Thirty affected Chromium gameplay journeys and one separate built-production sequence journey pass; these overlapping scopes are reported separately. Ordinary queue commands still own paid work; rules/save32, AI policy and content prices remain unchanged. Fleet attrition and Standard/Long pacing limits remain separately dated evidence, not new measurements. M0 and overall integration remain open.
              - link "Read the source for Gate C & integration · Remaining campaign proof" [ref=e206] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/420219d278ae17f42a04871c6319ecf62a4af216/docs/development/2026-09-26-production-sequences/README.md
                - text: Read the source
                - generic [ref=e207]: for Gate C & integration · Remaining campaign proof
                - text: ↗
          - generic [ref=e208]:
            - term [ref=e209]:
              - generic [ref=e210]: Current / partial
              - heading "Gate I · Orders across a large realm" [level=3] [ref=e211]
            - definition [ref=e212]:
              - paragraph [ref=e213]: Named campaign groups recall army/hearth selections before explicit orders. Production sequences apply one to five ordinary projects to up to 128 owned hearths, preserving existing queues and paid prefixes; partial refusals remain selected for correction. Separate browser-local libraries hold up to 24 charter policies and 24 production templates, excluded from campaign exports. Theaters, army order templates, broader governors and combined mature-empire acceptance remain open.
              - link "Read the source for Gate I · Orders across a large realm" [ref=e214] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/420219d278ae17f42a04871c6319ecf62a4af216/docs/development/2026-09-26-production-sequences/README.md
                - text: Read the source
                - generic [ref=e215]: for Gate I · Orders across a large realm
                - text: ↗
          - generic [ref=e216]:
            - term [ref=e217]:
              - generic [ref=e218]: Open gate
              - heading "Gates D, K & L · Scale and browser confidence" [level=3] [ref=e219]
            - definition [ref=e220]:
              - paragraph [ref=e221]: Storage publication performs O(prefix bytes) reads; queued-GC proof scans the store. Large-store GC, sustained memory, real quota/process-kill durability and cross-browser certification still need separate evidence. A still image is not a frame-time result.
              - link "Read the source for Gates D, K & L · Scale and browser confidence" [ref=e222] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/420219d278ae17f42a04871c6319ecf62a4af216/docs/development/review-fix-2/persistence-REPORT.md
                - text: Read the source
                - generic [ref=e223]: for Gates D, K & L · Scale and browser confidence
                - text: ↗
          - generic [ref=e224]:
            - term [ref=e225]:
              - generic [ref=e226]: Proposal / deferred
              - heading "Suggested follow-ups, not new release promises" [level=3] [ref=e227]
            - definition [ref=e228]:
              - paragraph [ref=e229]: Promoting the temporary storage probes to permanent regressions and separately profiling large-store GC are review suggestions. They require a bounded work packet and acceptance criteria. This journal does not authorize blocked probes or turn every suggestion into scope.
              - link "Read the source for Suggested follow-ups, not new release promises" [ref=e230] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/420219d278ae17f42a04871c6319ecf62a4af216/docs/development/post-fix-review/persistence.verdict.json
                - text: Read the source
                - generic [ref=e231]: for Suggested follow-ups, not new release promises
                - text: ↗
          - generic [ref=e232]:
            - term [ref=e233]:
              - generic [ref=e234]: Not this update
              - heading "Gate M, full magic and a 1.0 announcement" [level=3] [ref=e235]
            - definition [ref=e236]:
              - paragraph [ref=e237]: No online multiplayer service, complete magic system, new art production or overall 1.0 signoff is delivered here. Online play and full magical depth remain accepted release scope—not silently deferred out of 1.0. This journal adds a review surface, not those game systems.
              - link "Read the source for Gate M, full magic and a 1.0 announcement" [ref=e238] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/420219d278ae17f42a04871c6319ecf62a4af216/DEFINITION_OF_DONE.md
                - text: Read the source
                - generic [ref=e239]: for Gate M, full magic and a 1.0 announcement
                - text: ↗
        - link "Read all release gates →" [ref=e240] [cursor=pointer]:
          - /url: https://github.com/ErikBurdett/Theandril/blob/420219d278ae17f42a04871c6319ecf62a4af216/DEFINITION_OF_DONE.md
      - region [ref=e241]:
        - generic [ref=e242]:
          - generic [ref=e243]:
            - paragraph [ref=e244]: Read further
            - heading "The reference shelf" [level=2] [ref=e245]
          - paragraph [ref=e246]: The documents behind the dispatches. Snapshot links preserve the reviewed source revision.
        - list [ref=e247]:
          - listitem [ref=e248]:
            - generic [aria-hidden] [ref=e249]: "01"
            - generic [ref=e250]:
              - link "Start playing & run locally" [ref=e251] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/420219d278ae17f42a04871c6319ecf62a4af216/README.md
              - paragraph [ref=e252]: Controls, setup, save transfer and the actual single-player development build.
          - listitem [ref=e253]:
            - generic [aria-hidden] [ref=e254]: "02"
            - generic [ref=e255]:
              - link "Implementation status" [ref=e256] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/420219d278ae17f42a04871c6319ecf62a4af216/docs/IMPLEMENTATION_STATUS.md
              - paragraph [ref=e257]: Implemented, partial, blocked and historical work. The source of truth behind the headlines.
          - listitem [ref=e258]:
            - generic [aria-hidden] [ref=e259]: "03"
            - generic [ref=e260]:
              - link "Agreed 1.0 scope" [ref=e261] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/420219d278ae17f42a04871c6319ecf62a4af216/GAME_1_0_SCOPE.md
              - paragraph [ref=e262]: The accepted game and content targets. A feature only counts when it is integrated.
          - listitem [ref=e263]:
            - generic [aria-hidden] [ref=e264]: "04"
            - generic [ref=e265]:
              - link "Definition of done" [ref=e266] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/420219d278ae17f42a04871c6319ecf62a4af216/DEFINITION_OF_DONE.md
              - paragraph [ref=e267]: Named release gates, required evidence and the final signoff contract.
          - listitem [ref=e268]:
            - generic [aria-hidden] [ref=e269]: "05"
            - generic [ref=e270]:
              - link "Development workflow" [ref=e271] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/420219d278ae17f42a04871c6319ecf62a4af216/docs/1.0-DEVELOPMENT.md
              - paragraph [ref=e272]: Canonical M0–M10 development sequence, with dependencies and acceptance for the existing scope.
          - listitem [ref=e273]:
            - generic [aria-hidden] [ref=e274]: "06"
            - generic [ref=e275]:
              - link "World & faction bible" [ref=e276] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/420219d278ae17f42a04871c6319ecf62a4af216/docs/lore/FACTION_BIBLE.md
              - paragraph [ref=e277]: Twenty-four societies, disputed history and the boundary between lore and runtime.
          - listitem [ref=e278]:
            - generic [aria-hidden] [ref=e279]: "07"
            - generic [ref=e280]:
              - link "Art status & provenance" [ref=e281] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/420219d278ae17f42a04871c6319ecf62a4af216/docs/art/ART_IMPLEMENTATION_STATUS.md
              - paragraph [ref=e282]: Reviewed pixels, real bindings, animation scope and unresolved production limits.
          - listitem [ref=e283]:
            - generic [aria-hidden] [ref=e284]: "08"
            - generic [ref=e285]:
              - link "Campaign-safety architecture" [ref=e286] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/420219d278ae17f42a04871c6319ecf62a4af216/docs/architecture/0037-campaign-safety.md
              - paragraph [ref=e287]: Canonical ownership, morale correction, reserves and historical compatibility.
          - listitem [ref=e288]:
            - generic [aria-hidden] [ref=e289]: "09"
            - generic [ref=e290]:
              - link "Production sequences architecture" [ref=e291] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/420219d278ae17f42a04871c6319ecf62a4af216/docs/architecture/0043-production-sequences.md
              - paragraph [ref=e292]: Explicit ordered batches over ordinary paid queues, partial prefixes and a separate personal template library.
          - listitem [ref=e293]:
            - generic [aria-hidden] [ref=e294]: "10"
            - generic [ref=e295]:
              - link "Saved groups architecture" [ref=e296] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/420219d278ae17f42a04871c6319ecf62a4af216/docs/architecture/0042-selection-groups.md
              - paragraph [ref=e297]: Campaign-owned selection groups, explicit recall, loss reconciliation, bounded metadata and historical saves.
          - listitem [ref=e298]:
            - generic [aria-hidden] [ref=e299]: "11"
            - generic [ref=e300]:
              - link "Charter templates architecture" [ref=e301] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/420219d278ae17f42a04871c6319ecf62a4af216/docs/architecture/0041-charter-templates.md
              - paragraph [ref=e302]: Browser-local named policies, explicit recall and assignment, bounded preferences and visible storage failures.
          - listitem [ref=e303]:
            - generic [aria-hidden] [ref=e304]: "12"
            - generic [ref=e305]:
              - link "Group charters architecture" [ref=e306] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/420219d278ae17f42a04871c6319ecf62a4af216/docs/architecture/0040-group-charters.md
              - paragraph [ref=e307]: Shared policy controls, existing production precedence, per-work budgets and one final worker response.
          - listitem [ref=e308]:
            - generic [aria-hidden] [ref=e309]: "13"
            - generic [ref=e310]:
              - link "Group postings architecture" [ref=e311] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/420219d278ae17f42a04871c6319ecf62a4af216/docs/architecture/0039-group-postings.md
              - paragraph [ref=e312]: Bounded ordinary-command batches, per-army results, interrupted recording and transfer measurements.
          - listitem [ref=e313]:
            - generic [aria-hidden] [ref=e314]: "14"
            - generic [ref=e315]:
              - link "Fleet provisions architecture" [ref=e316] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/420219d278ae17f42a04871c6319ecf62a4af216/docs/architecture/0038-fleet-provisions.md
              - paragraph [ref=e317]: Canonical stores, shared passenger outcomes, naval staging and versioned persistence.
      - region [ref=e318]:
        - paragraph [ref=e319]: Leave a useful record
        - heading "Bring a change to the table" [level=2] [ref=e320]
        - paragraph [ref=e321]: Start with a bounded problem, a failing regression and a player-visible result. Record the decision, the exact evidence and the work still open. A proposal is not a delivered feature.
        - list [ref=e322]:
          - listitem [ref=e323]:
            - strong [ref=e324]: Draft before publishing.
            - text: Use the template in your work branch. Drafts stay out of the public catalog until reviewed; this journal has no private draft route or CMS.
          - listitem [ref=e325]:
            - strong [ref=e326]: Attach evidence, not a green total.
            - text: Link actual source and results; label authored examples versus organic campaigns. Keep blocked checks blocked.
          - listitem [ref=e327]:
            - strong [ref=e328]: Check the reading experience.
            - text: Add typed content, inspect owned pixels and verify the permalink, keyboard, narrow layout and deployment base.
        - generic [ref=e329]:
          - link "Authoring guide" [ref=e330] [cursor=pointer]:
            - /url: https://github.com/ErikBurdett/Theandril/blob/master/docs/updates/CONTRIBUTING.md
          - link "Dispatch template" [ref=e331] [cursor=pointer]:
            - /url: https://github.com/ErikBurdett/Theandril/blob/master/docs/updates/TEMPLATE.md
          - link "Report a problem ↗" [ref=e332] [cursor=pointer]:
            - /url: https://github.com/ErikBurdett/Theandril/issues/new?title=Journal%20feedback%3A%20
        - paragraph [ref=e333]: "Useful next packet: document one specific player journey with source links and acceptance criteria. Propose scope changes explicitly; no paid tools, generated art or blocked AI probes are required to improve a dispatch."
  - contentinfo [ref=e334]:
    - paragraph [ref=e335]:
      - strong [ref=e336]: Theandril
      - text: · A world in the making.Single-player development build. Not Theandril 1.0.
    - generic [ref=e337]:
      - link "Current implementation status ↗" [ref=e338] [cursor=pointer]:
        - /url: https://github.com/ErikBurdett/Theandril/blob/master/docs/IMPLEMENTATION_STATUS.md
      - link "Image provenance ↗" [ref=e339] [cursor=pointer]:
        - /url: /Theandril/updates/provenance.json
      - link "Hearth & Card roadmap ↗" [ref=e340] [cursor=pointer]:
        - /url: https://erikburdett.github.io/theandril-hearth-and-card/updates/roadmap/
      - link "Source repository ↗" [ref=e341] [cursor=pointer]:
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
> 20 |   await expect(page.locator('.dispatch-row')).toHaveCount(9);
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