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
Expected: 13
Received: 14
Timeout:  5000ms

Call log:
  - Expect "toHaveCount" locator('.dispatch-row') with timeout 5000ms
  - waiting for locator('.dispatch-row')
    14 × locator resolved to 14 elements
       - unexpected value "14"

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
          - paragraph [ref=e28]: Featured dispatch · 14
          - generic [ref=e30]: Reviewed checkpoint
          - heading "Keep the watch moving" [level=2] [ref=e31]
          - paragraph [ref=e32]: 24 October 2026 · Posting templates, patrols and interrupted orders
          - paragraph [ref=e33]: Remember a familiar posting policy, give an army a returning patrol, and let an AI-controlled watch review a safe interrupted leg. Saved orders keep their boundaries, while the campaign results keep the remaining balance work visible.
          - link "Read the featured dispatch" [ref=e34] [cursor=pointer]:
            - /url: /Theandril/updates/dispatches/?dispatch=patrol-orders
            - text: Read the dispatch
            - generic [aria-hidden] [ref=e35]: →
          - paragraph [ref=e36]: Source checkpoint dee74cf · Not a 1.0 release.
        - figure [ref=e37]:
          - button "Enlarge patrol-narrow-actions image" [ref=e38]:
            - img "Selected orders for Travel company 100, with Pause when war begins checked and Update patrol, Pause patrol and Remove patrol controls." [ref=e39]
            - generic [aria-hidden] [ref=e40]: Inspect image ↗
          - generic [ref=e41]:
            - text: Authored Legendary regression with one hundred owned armies, forty owned hearths and 4,000 total armies. Native 390 by 844 viewport capture of the scrolled lower patrol form; endpoint fields are above this view. The war option is saved and the patrol remains enabled. Exact reviewed PNG bytes, with no later crop, resize or re-encoding; not an organically grown realm or proof of a whole release gate.
            - link "Original image ↗" [ref=e42] [cursor=pointer]:
              - /url: https://github.com/ErikBurdett/Theandril/blob/dee74cf9c4e2d153f9c5f5cfdbd9221798205481/docs/development/2026-10-24-patrols/browser-results/patrols-the-last-of-one-hu-18a76-at-desktop-and-narrow-sizes/patrol-narrow-actions.png
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
        - status [ref=e64]: 14 dispatches
        - generic [ref=e65]:
          - article [ref=e66]:
            - link [aria-hidden] [ref=e67] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=patrol-orders
            - generic [ref=e68]:
              - paragraph [ref=e69]: Engineering / Posting policies and land patrols · rules 35
              - heading [level=3] [ref=e70]:
                - link "Keep the watch moving" [ref=e71] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=patrol-orders
              - paragraph [ref=e72]: Remember a familiar posting policy, give an army a returning patrol, and let an AI-controlled watch review a safe interrupted leg. Saved orders keep their boundaries, while the campaign results keep the remaining balance work visible.
              - generic [ref=e73]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e74]:
              - text: "14"
              - generic [ref=e75]: ↗
          - article [ref=e76]:
            - link [aria-hidden] [ref=e77] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=reinforcement-logistics
            - generic [ref=e78]:
              - paragraph [ref=e79]: Engineering / Reinforcement and supply access · rules 34
              - heading [level=3] [ref=e80]:
                - link "Hold the frontier, provision the crossing" [ref=e81] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=reinforcement-logistics
              - paragraph [ref=e82]: Let a standing watch respond to visible threats, and buy supplies from a foreign harbor. Joined empire controls keep shortages and blocked orders visible across a large realm.
              - generic [ref=e83]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e84]:
              - text: "13"
              - generic [ref=e85]: ↗
          - article [ref=e86]:
            - link [aria-hidden] [ref=e87] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=defense-theaters
            - generic [ref=e88]:
              - paragraph [ref=e89]: Engineering / Defensive theaters · ACT-32
              - heading [level=3] [ref=e90]:
                - link "Give your hearths a standing watch" [ref=e91] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=defense-theaters
              - paragraph [ref=e92]: Choose the hearths to protect, assign their watch companies and name a reserve. Idle members fill guard gaps on later turns while your direct routes and standing postings keep priority.
              - generic [ref=e93]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e94]:
              - text: "12"
              - generic [ref=e95]: ↗
          - article [ref=e96]:
            - link [aria-hidden] [ref=e97] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=group-travel
            - generic [ref=e98]:
              - paragraph [ref=e99]: Engineering / Group travel · ACT-32
              - heading [level=3] [ref=e100]:
                - link "Give your armies a shared destination" [ref=e101] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=group-travel
              - paragraph [ref=e102]: Recall a saved army group, review their separate routes and send them toward one destination. Ordinary travel keeps its costs, interruptions and individual controls, with results for every army.
              - generic [ref=e103]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e104]:
              - text: "11"
              - generic [ref=e105]: ↗
          - article [ref=e106]:
            - link [aria-hidden] [ref=e107] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=production-sequences
            - generic [ref=e108]:
              - paragraph [ref=e109]: Engineering / Production sequences · ACT-32
              - heading [level=3] [ref=e110]:
                - link "Queue a plan across your hearths" [ref=e111] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=production-sequences
              - paragraph [ref=e112]: Arrange a short production list, recall the hearths that need it and see which projects were paid for. Personal templates keep useful plans ready while every order still uses the existing queues.
              - generic [ref=e113]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e114]:
              - text: "10"
              - generic [ref=e115]: ↗
          - article [ref=e116]:
            - link [aria-hidden] [ref=e117] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=selection-groups
            - generic [ref=e118]:
              - paragraph [ref=e119]: Engineering / Saved realm groups · rules 32
              - heading [level=3] [ref=e120]:
                - link "Recall a group, then give the order" [ref=e121] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=selection-groups
              - paragraph [ref=e122]: Remember the armies guarding a frontier or the hearths sharing a policy. Named groups now travel with the campaign, ready to recall, inspect and order through the existing registry.
              - generic [ref=e123]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e124]:
              - text: "09"
              - generic [ref=e125]: ↗
          - article [ref=e126]:
            - link [aria-hidden] [ref=e127] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=charter-templates
            - generic [ref=e128]:
              - paragraph [ref=e129]: Engineering / Charter templates · ACT-32
              - heading [level=3] [ref=e130]:
                - link "Keep a charter worth repeating" [ref=e131] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=charter-templates
              - paragraph [ref=e132]: Save a useful charter policy by name, recall it in another campaign, then choose which hearths should receive it. A personal browser library keeps repeated setup apart from the orders already governing a realm.
              - generic [ref=e133]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e134]:
              - text: "08"
              - generic [ref=e135]: ↗
          - article [ref=e136]:
            - link [aria-hidden] [ref=e137] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=group-charters
            - generic [ref=e138]:
              - paragraph [ref=e139]: Engineering / Group hearth charters · ACT-32
              - heading [level=3] [ref=e140]:
                - link "One charter policy for forty hearths" [ref=e141] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=group-charters
              - paragraph [ref=e142]: Give selected hearths the same standing charter, keep their queued work intact, and inspect each result. Shared controls now explain what every hearth may spend from the realm’s treasury.
              - generic [ref=e143]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e144]:
              - text: "07"
              - generic [ref=e145]: ↗
          - article [ref=e146]:
            - link [aria-hidden] [ref=e147] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=group-postings
            - generic [ref=e148]:
              - paragraph [ref=e149]: Engineering / Group postings · ACT-32
              - heading [level=3] [ref=e150]:
                - link "One posting for a hundred armies" [ref=e151] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=group-postings
              - paragraph [ref=e152]: Select armies across the registry, give them standing postings together, and keep control of each member. One bounded request now returns one campaign update with a clear result for every order.
              - generic [ref=e153]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e154]:
              - text: "06"
              - generic [ref=e155]: ↗
          - article [ref=e156]:
            - link [aria-hidden] [ref=e157] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=fleet-provisions
            - generic [ref=e158]:
              - paragraph [ref=e159]: Engineering / Fleet provisions · rules 31
              - heading [level=3] [ref=e160]:
                - link "A voyage needs stores for the way home" [ref=e161] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=fleet-provisions
              - paragraph [ref=e162]: Fleets and their passengers now share finite stores. Sailors need a route back to harbor supply, the AI plans for that return, and a saved voyage keeps the supplies it actually has.
              - generic [ref=e163]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e164]:
              - text: "05"
              - generic [ref=e165]: ↗
          - article [ref=e166]:
            - link [aria-hidden] [ref=e167] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=campaign-foundation-and-development-order
            - generic [ref=e168]:
              - paragraph [ref=e169]: Engineering / Campaign foundation · rules 17
              - heading [level=3] [ref=e170]:
                - link "A funded expedition and a practical route to 1.0" [ref=e171] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=campaign-foundation-and-development-order
              - paragraph [ref=e172]: An island realm now counts the harbor it has already paid for. Fleet planning, explored land and campaign records take less repeated work, while the remaining Epic timing failure stays visible.
              - generic [ref=e173]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e174]:
              - text: "04"
              - generic [ref=e175]: ↗
          - article [ref=e176]:
            - link [aria-hidden] [ref=e177] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=r17-campaign-safety
            - generic [ref=e178]:
              - paragraph [ref=e179]: Engineering / Audit remediation · rule 17
              - heading [level=3] [ref=e180]:
                - link "A campaign worth keeping" [ref=e181] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=r17-campaign-safety
              - paragraph [ref=e182]: Training should not break a save. A crowded garrison should not make a town untouchable. This checkpoint repairs both, without rewriting the history of older campaigns.
              - generic [ref=e183]: Reviewed checkpoint
            - generic [aria-hidden] [ref=e184]:
              - text: "01"
              - generic [ref=e185]: ↗
          - article [ref=e186]:
            - link [aria-hidden] [ref=e187] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=keeping-the-record
            - generic [ref=e188]:
              - paragraph [ref=e189]: Archives / Archive capacity · durability follow-up
              - heading [level=3] [ref=e190]:
                - link "Keeping the whole record" [ref=e191] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=keeping-the-record
              - paragraph [ref=e192]: A long campaign is more than its final snapshot. The archive work preserves the orders, battles and provenance needed to tell its history—and replay it.
              - generic [ref=e193]: Bounded verification
            - generic [aria-hidden] [ref=e194]:
              - text: "02"
              - generic [ref=e195]: ↗
          - article [ref=e196]:
            - link [aria-hidden] [ref=e197] [cursor=pointer]:
              - /url: /Theandril/updates/dispatches/?dispatch=twenty-four-cultures
            - generic [ref=e198]:
              - paragraph [ref=e199]: World & culture / Roster 4 · slices 22–27
              - heading [level=3] [ref=e200]:
                - link "Twenty-four ways to keep a hearth" [ref=e201] [cursor=pointer]:
                  - /url: /Theandril/updates/dispatches/?dispatch=twenty-four-cultures
              - paragraph [ref=e202]: A culture is a political bargain, not a recolored banner. The current roster connects authored societies to real names, ecological choices and distinct approved art.
              - generic [ref=e203]: Playable baseline
            - generic [aria-hidden] [ref=e204]:
              - text: "03"
              - generic [ref=e205]: ↗
      - region [ref=e206]:
        - generic [ref=e207]:
          - generic [ref=e208]:
            - paragraph [ref=e209]: The promise & the remaining work
            - heading "Road to 1.0" [level=2] [ref=e210]
          - paragraph [ref=e211]: Selected gates and decisions. Not a complete release report or a completion percentage.
        - paragraph [ref=e212]: The agreed scope stays put. The evidence changes. A scoped approval moves a piece of the game forward; it does not clear every gate around it.
        - paragraph [ref=e213]:
          - link "Open the full roadmap →" [ref=e214] [cursor=pointer]:
            - /url: /Theandril/updates/roadmap/
          - text: Browse checked completed checkpoints, in-progress systems and pending features with evidence and remaining acceptance. The selected decisions below use the current roadmap snapshot; historical dispatches retain their own evidence.
        - generic [ref=e215]:
          - generic [ref=e216]:
            - term [ref=e217]:
              - generic [ref=e218]: Accepted scope
              - heading "The agreed game, not a moving finish line" [level=3] [ref=e219]
            - definition [ref=e220]:
              - paragraph [ref=e221]: The canonical scope still calls for long single-player campaigns, online human campaigns, deep progression, multiple victory paths and authored world content. No scope cuts or new gameplay obligations are adopted by these dispatches.
              - link "Read the source for The agreed game, not a moving finish line" [ref=e222] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/dee74cf9c4e2d153f9c5f5cfdbd9221798205481/GAME_1_0_SCOPE.md
                - text: Read the source
                - generic [ref=e223]: for The agreed game, not a moving finish line
                - text: ↗
          - generic [ref=e224]:
            - term [ref=e225]:
              - generic [ref=e226]: Current / partial
              - heading "Gates E & F · Save integrity and combat" [level=3] [ref=e227]
            - definition [ref=e228]:
              - paragraph [ref=e229]: Rules/save 35 retains two-point patrols and their policy through exact saves and replay. Six genuine pre-change rules 34 checkpoints preserve original bytes and continuations; strict old schemas reject future fields. Posting templates are separate browser preferences. Mixed history and reopened storage pass; whole save, combat and release gates remain open.
              - link "Read the source for Gates E & F · Save integrity and combat" [ref=e230] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/dee74cf9c4e2d153f9c5f5cfdbd9221798205481/docs/development/2026-10-24-patrols/README.md
                - text: Read the source
                - generic [ref=e231]: for Gates E & F · Save integrity and combat
                - text: ↗
          - generic [ref=e232]:
            - term [ref=e233]:
              - generic [ref=e234]: Current / partial
              - heading "Gates B, F2 & J · A playable foundation" [level=3] [ref=e235]
            - definition [ref=e236]:
              - paragraph [ref=e237]: Twenty-four cultures, resource economies, development branches and individual soldier battles are playable. Waykeepers are a first paid caster role, not complete magic. Content depth, campaign counterplay and the full progression targets remain partial.
              - link "Read the source for Gates B, F2 & J · A playable foundation" [ref=e238] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/dee74cf9c4e2d153f9c5f5cfdbd9221798205481/docs/IMPLEMENTATION_STATUS.md
                - text: Read the source
                - generic [ref=e239]: for Gates B, F2 & J · A playable foundation
                - text: ↗
          - generic [ref=e240]:
            - term [ref=e241]:
              - generic [ref=e242]: Open gate
              - heading "Gate C & integration · Remaining campaign proof" [level=3] [ref=e243]
            - definition [ref=e244]:
              - paragraph [ref=e245]: The corrected implementation passes 2,217 tests across 275 files and two affected built-production journeys. Three fixed seeds yield Standard 219/193/214, Long 336/304/286 and Epic 374/278/320. The original Long delay remains and two Epic seeds finish too early. No prices or proxy bounds changed; DH-021 and all fifteen release gates remain open.
              - link "Read the source for Gate C & integration · Remaining campaign proof" [ref=e246] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/dee74cf9c4e2d153f9c5f5cfdbd9221798205481/docs/development/2026-10-24-patrol-recovery/README.md
                - text: Read the source
                - generic [ref=e247]: for Gate C & integration · Remaining campaign proof
                - text: ↗
          - generic [ref=e248]:
            - term [ref=e249]:
              - generic [ref=e250]: Current / partial
              - heading "Gate I · Orders across a large realm" [level=3] [ref=e251]
            - definition [ref=e252]:
              - paragraph [ref=e253]: Personal posting templates recall a policy before explicit group orders. Saved two-point land patrols respect direct routes, postings, voyages, missions and sieges. An AI seat can review a safe interrupted home leg without enabling a disabled policy; player travel never resumes itself. Multi-step programs, escorts, broader governors and organic mature-empire acceptance remain unfinished.
              - link "Read the source for Gate I · Orders across a large realm" [ref=e254] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/dee74cf9c4e2d153f9c5f5cfdbd9221798205481/docs/development/2026-10-24-patrol-recovery/README.md
                - text: Read the source
                - generic [ref=e255]: for Gate I · Orders across a large realm
                - text: ↗
          - generic [ref=e256]:
            - term [ref=e257]:
              - generic [ref=e258]: Open gate
              - heading "Gates D, K & L · Scale and browser confidence" [level=3] [ref=e259]
            - definition [ref=e260]:
              - paragraph [ref=e261]: Storage publication performs O(prefix bytes) reads; queued-GC proof scans the store. Large-store GC, sustained memory, real quota/process-kill durability and cross-browser certification still need separate evidence. A still image is not a frame-time result.
              - link "Read the source for Gates D, K & L · Scale and browser confidence" [ref=e262] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/dee74cf9c4e2d153f9c5f5cfdbd9221798205481/docs/development/review-fix-2/persistence-REPORT.md
                - text: Read the source
                - generic [ref=e263]: for Gates D, K & L · Scale and browser confidence
                - text: ↗
          - generic [ref=e264]:
            - term [ref=e265]:
              - generic [ref=e266]: Proposal / deferred
              - heading "Suggested follow-ups, not new release promises" [level=3] [ref=e267]
            - definition [ref=e268]:
              - paragraph [ref=e269]: Promoting the temporary storage probes to permanent regressions and separately profiling large-store GC are review suggestions. They require a bounded work packet and acceptance criteria. This journal does not authorize blocked probes or turn every suggestion into scope.
              - link "Read the source for Suggested follow-ups, not new release promises" [ref=e270] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/dee74cf9c4e2d153f9c5f5cfdbd9221798205481/docs/development/post-fix-review/persistence.verdict.json
                - text: Read the source
                - generic [ref=e271]: for Suggested follow-ups, not new release promises
                - text: ↗
          - generic [ref=e272]:
            - term [ref=e273]:
              - generic [ref=e274]: Not this update
              - heading "Gate M, full magic and a 1.0 announcement" [level=3] [ref=e275]
            - definition [ref=e276]:
              - paragraph [ref=e277]: No online multiplayer service, complete magic system, new art production or overall 1.0 signoff is delivered here. Online play and full magical depth remain accepted release scope—not silently deferred out of 1.0. This journal adds a review surface, not those game systems.
              - link "Read the source for Gate M, full magic and a 1.0 announcement" [ref=e278] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/dee74cf9c4e2d153f9c5f5cfdbd9221798205481/DEFINITION_OF_DONE.md
                - text: Read the source
                - generic [ref=e279]: for Gate M, full magic and a 1.0 announcement
                - text: ↗
        - link "Read all release gates →" [ref=e280] [cursor=pointer]:
          - /url: https://github.com/ErikBurdett/Theandril/blob/dee74cf9c4e2d153f9c5f5cfdbd9221798205481/DEFINITION_OF_DONE.md
      - region [ref=e281]:
        - generic [ref=e282]:
          - generic [ref=e283]:
            - paragraph [ref=e284]: Read further
            - heading "The reference shelf" [level=2] [ref=e285]
          - paragraph [ref=e286]: The documents behind the dispatches. Snapshot links preserve the reviewed source revision.
        - list [ref=e287]:
          - listitem [ref=e288]:
            - generic [aria-hidden] [ref=e289]: "01"
            - generic [ref=e290]:
              - link "Patrol orders and recovery" [ref=e291] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/dee74cf9c4e2d153f9c5f5cfdbd9221798205481/docs/development/2026-10-24-patrol-recovery/README.md
              - paragraph [ref=e292]: Explicit AI recovery, exact generated evidence, nine pacing comparisons and unresolved release acceptance.
          - listitem [ref=e293]:
            - generic [aria-hidden] [ref=e294]: "02"
            - generic [ref=e295]:
              - link "Reusable posting policies" [ref=e296] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/dee74cf9c4e2d153f9c5f5cfdbd9221798205481/docs/development/2026-10-24-posting-templates/README.md
              - paragraph [ref=e297]: Personal preferences, explicit group application, fresh hearth targets and saved recovery.
          - listitem [ref=e298]:
            - generic [aria-hidden] [ref=e299]: "03"
            - generic [ref=e300]:
              - link "Start playing & run locally" [ref=e301] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/dee74cf9c4e2d153f9c5f5cfdbd9221798205481/README.md
              - paragraph [ref=e302]: Controls, setup, save transfer and the actual single-player development build.
          - listitem [ref=e303]:
            - generic [aria-hidden] [ref=e304]: "04"
            - generic [ref=e305]:
              - link "Implementation status" [ref=e306] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/dee74cf9c4e2d153f9c5f5cfdbd9221798205481/docs/IMPLEMENTATION_STATUS.md
              - paragraph [ref=e307]: Implemented, partial, blocked and historical work. The source of truth behind the headlines.
          - listitem [ref=e308]:
            - generic [aria-hidden] [ref=e309]: "05"
            - generic [ref=e310]:
              - link "Agreed 1.0 scope" [ref=e311] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/dee74cf9c4e2d153f9c5f5cfdbd9221798205481/GAME_1_0_SCOPE.md
              - paragraph [ref=e312]: The accepted game and content targets. A feature only counts when it is integrated.
          - listitem [ref=e313]:
            - generic [aria-hidden] [ref=e314]: "06"
            - generic [ref=e315]:
              - link "Definition of done" [ref=e316] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/dee74cf9c4e2d153f9c5f5cfdbd9221798205481/DEFINITION_OF_DONE.md
              - paragraph [ref=e317]: Named release gates, required evidence and the final signoff contract.
          - listitem [ref=e318]:
            - generic [aria-hidden] [ref=e319]: "07"
            - generic [ref=e320]:
              - link "Development workflow" [ref=e321] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/dee74cf9c4e2d153f9c5f5cfdbd9221798205481/docs/1.0-DEVELOPMENT.md
              - paragraph [ref=e322]: Canonical M0–M10 development sequence, with dependencies and acceptance for the existing scope.
          - listitem [ref=e323]:
            - generic [aria-hidden] [ref=e324]: "08"
            - generic [ref=e325]:
              - link "World & faction bible" [ref=e326] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/dee74cf9c4e2d153f9c5f5cfdbd9221798205481/docs/lore/FACTION_BIBLE.md
              - paragraph [ref=e327]: Twenty-four societies, disputed history and the boundary between lore and runtime.
          - listitem [ref=e328]:
            - generic [aria-hidden] [ref=e329]: "09"
            - generic [ref=e330]:
              - link "Art status & provenance" [ref=e331] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/dee74cf9c4e2d153f9c5f5cfdbd9221798205481/docs/art/ART_IMPLEMENTATION_STATUS.md
              - paragraph [ref=e332]: Reviewed pixels, real bindings, animation scope and unresolved production limits.
          - listitem [ref=e333]:
            - generic [aria-hidden] [ref=e334]: "10"
            - generic [ref=e335]:
              - link "Campaign-safety architecture" [ref=e336] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/dee74cf9c4e2d153f9c5f5cfdbd9221798205481/docs/architecture/0037-campaign-safety.md
              - paragraph [ref=e337]: Canonical ownership, morale correction, reserves and historical compatibility.
          - listitem [ref=e338]:
            - generic [aria-hidden] [ref=e339]: "11"
            - generic [ref=e340]:
              - link "Reinforcement and supply architecture" [ref=e341] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/dee74cf9c4e2d153f9c5f5cfdbd9221798205481/docs/architecture/0046-reinforcement-supply-access.md
              - paragraph [ref=e342]: Visible-threat reserve guards, paid source-specific supply, participant disclosures, bounded AI and rules 33 history.
          - listitem [ref=e343]:
            - generic [aria-hidden] [ref=e344]: "12"
            - generic [ref=e345]:
              - link "Reinforcement and logistics verification" [ref=e346] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/dee74cf9c4e2d153f9c5f5cfdbd9221798205481/docs/development/2026-09-27-reinforcement-logistics/README.md
              - paragraph [ref=e347]: Joined authored mature-realm acceptance, real treaty payment and recovery, paired three-seed pacing, retained failures and explicit limits.
          - listitem [ref=e348]:
            - generic [aria-hidden] [ref=e349]: "13"
            - generic [ref=e350]:
              - link "Defensive theater architecture" [ref=e351] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/dee74cf9c4e2d153f9c5f5cfdbd9221798205481/docs/architecture/0045-defense-theaters.md
              - paragraph [ref=e352]: Canonical saved watches, bounded ordinary movement, direct overrides and observed AI adoption.
          - listitem [ref=e353]:
            - generic [aria-hidden] [ref=e354]: "14"
            - generic [ref=e355]:
              - link "Group travel architecture" [ref=e356] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/dee74cf9c4e2d153f9c5f5cfdbd9221798205481/docs/architecture/0044-group-travel.md
              - paragraph [ref=e357]: Explicit bounded route reviews and ordinary movement, retained postings, partial outcomes and recovery.
          - listitem [ref=e358]:
            - generic [aria-hidden] [ref=e359]: "15"
            - generic [ref=e360]:
              - link "Production sequences architecture" [ref=e361] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/dee74cf9c4e2d153f9c5f5cfdbd9221798205481/docs/architecture/0043-production-sequences.md
              - paragraph [ref=e362]: Explicit ordered batches over ordinary paid queues, partial prefixes and a separate personal template library.
          - listitem [ref=e363]:
            - generic [aria-hidden] [ref=e364]: "16"
            - generic [ref=e365]:
              - link "Saved groups architecture" [ref=e366] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/dee74cf9c4e2d153f9c5f5cfdbd9221798205481/docs/architecture/0042-selection-groups.md
              - paragraph [ref=e367]: Campaign-owned selection groups, explicit recall, loss reconciliation, bounded metadata and historical saves.
          - listitem [ref=e368]:
            - generic [aria-hidden] [ref=e369]: "17"
            - generic [ref=e370]:
              - link "Charter templates architecture" [ref=e371] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/dee74cf9c4e2d153f9c5f5cfdbd9221798205481/docs/architecture/0041-charter-templates.md
              - paragraph [ref=e372]: Browser-local named policies, explicit recall and assignment, bounded preferences and visible storage failures.
          - listitem [ref=e373]:
            - generic [aria-hidden] [ref=e374]: "18"
            - generic [ref=e375]:
              - link "Group charters architecture" [ref=e376] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/dee74cf9c4e2d153f9c5f5cfdbd9221798205481/docs/architecture/0040-group-charters.md
              - paragraph [ref=e377]: Shared policy controls, existing production precedence, per-work budgets and one final worker response.
          - listitem [ref=e378]:
            - generic [aria-hidden] [ref=e379]: "19"
            - generic [ref=e380]:
              - link "Group postings architecture" [ref=e381] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/dee74cf9c4e2d153f9c5f5cfdbd9221798205481/docs/architecture/0039-group-postings.md
              - paragraph [ref=e382]: Bounded ordinary-command batches, per-army results, interrupted recording and transfer measurements.
          - listitem [ref=e383]:
            - generic [aria-hidden] [ref=e384]: "20"
            - generic [ref=e385]:
              - link "Fleet provisions architecture" [ref=e386] [cursor=pointer]:
                - /url: https://github.com/ErikBurdett/Theandril/blob/dee74cf9c4e2d153f9c5f5cfdbd9221798205481/docs/architecture/0038-fleet-provisions.md
              - paragraph [ref=e387]: Canonical stores, shared passenger outcomes, naval staging and versioned persistence.
      - region [ref=e388]:
        - paragraph [ref=e389]: Leave a useful record
        - heading "Bring a change to the table" [level=2] [ref=e390]
        - paragraph [ref=e391]: Start with a bounded problem, a failing regression and a player-visible result. Record the decision, the exact evidence and the work still open. A proposal is not a delivered feature.
        - list [ref=e392]:
          - listitem [ref=e393]:
            - strong [ref=e394]: Draft before publishing.
            - text: Use the template in your work branch. Drafts stay out of the public catalog until reviewed; this journal has no private draft route or CMS.
          - listitem [ref=e395]:
            - strong [ref=e396]: Attach evidence, not a green total.
            - text: Link actual source and results; label authored examples versus organic campaigns. Keep blocked checks blocked.
          - listitem [ref=e397]:
            - strong [ref=e398]: Check the reading experience.
            - text: Add typed content, inspect owned pixels and verify the permalink, keyboard, narrow layout and deployment base.
        - generic [ref=e399]:
          - link "Authoring guide" [ref=e400] [cursor=pointer]:
            - /url: https://github.com/ErikBurdett/Theandril/blob/master/docs/updates/CONTRIBUTING.md
          - link "Dispatch template" [ref=e401] [cursor=pointer]:
            - /url: https://github.com/ErikBurdett/Theandril/blob/master/docs/updates/TEMPLATE.md
          - link "Report a problem ↗" [ref=e402] [cursor=pointer]:
            - /url: https://github.com/ErikBurdett/Theandril/issues/new?title=Journal%20feedback%3A%20
        - paragraph [ref=e403]: "Useful next packet: document one specific player journey with source links and acceptance criteria. Propose scope changes explicitly; no paid tools, generated art or blocked AI probes are required to improve a dispatch."
  - contentinfo [ref=e404]:
    - paragraph [ref=e405]:
      - strong [ref=e406]: Theandril
      - text: · A world in the making.Single-player development build. Not Theandril 1.0.
    - generic [ref=e407]:
      - link "Current implementation status ↗" [ref=e408] [cursor=pointer]:
        - /url: https://github.com/ErikBurdett/Theandril/blob/master/docs/IMPLEMENTATION_STATUS.md
      - link "Image provenance ↗" [ref=e409] [cursor=pointer]:
        - /url: /Theandril/updates/provenance.json
      - link "Hearth & Card roadmap ↗" [ref=e410] [cursor=pointer]:
        - /url: https://erikburdett.github.io/theandril-hearth-and-card/updates/roadmap/
      - link "Source repository ↗" [ref=e411] [cursor=pointer]:
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
> 20 |   await expect(page.locator('.dispatch-row')).toHaveCount(13);
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