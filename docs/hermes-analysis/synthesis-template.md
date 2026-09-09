# Theandril — premium 1.0 readiness audit

**Final audit disposition: NO — do not ship Theandril 1.0 today.**

Baseline: `b0a4cd86cdb30cd9e2d3a1f0c8a78da38f7987cd`, `/home/telephoneheater/Work/Theandril`; evidence collected 2026-09-09. This is a completed audit, **not** completed remediation or release certification. Production source/assets and the project's root README were not edited; nothing was committed or pushed. Audit-owned documentation, harnesses, captures and generated test evidence are retained.

## 1. Executive Summary

Theandril is a real, integrated fantasy strategy game with deterministic campaign rules, legal AI opponents, paid economic development, persistent companies, ships, conquest and an actual victory. It is not merely disconnected menus. Its strongest assets are the simulation boundaries, the land-development loop, replayable consequences and a substantial original pixel-art library.

It is nevertheless much closer to an **integrated development build than a premium release candidate**. Campaign safety is broken in ordinary legal play, one legal stack configuration defeats combat entirely, and the late campaign cannot sustain the strategic variety promised by the world and product brief.

### Would I ship today? **NO. Five strongest reasons**

1. **Player progress is not reliably saveable.** Accepted trained-unit battle outcomes can produce unloadable state/history. Independently, a valid Standard/24-realm Long campaign reaches victory with a 93,161,744-byte logical archive, beyond the 67,108,864-byte limit. Exact replays do not negate either defect. R01/R02; [QA persistence evidence](qa/report.md#2-release-blocking-persistence-findings).
2. **Legal military growth can make an enemy unattackable.** Twenty-one defending formations refuse field battle and assault; ordinary paid mustering reaches that count by turn 52. Supply depletion does not remove the real garrison. R03; [asserted probes](verification/probe-results.json).
3. **The endgame and opposition lose purpose.** Only Prosperity is terminal. In Epic seed99, research is saturated by turn 146, the last battle/capture is turn 297, and victory arrives at turn 808; one army makes 720 A→B→A returns. Sparse first contact also misses an unchanged release test. R04–R06; [campaign findings](campaigns/findings.md).
4. **The fantasy strategy promise exceeds current mechanics.** Twenty-four cultures share the decisive roster, research, caster aptitudes and victory rules; two battle spells are not a strategic magic pillar. Diplomacy, material uses, independent powers and authored discoveries lack the needed interactions. R08/R09/R12/R15/R25; [executable catalog](systems/catalog.md).
5. **The player-facing layer is not yet premium-complete.** Unused labor goes unnoticed, empire comparison and ongoing history require excess navigation, onboarding does not teach a complete loop, audio is absent, and specific art bindings/context need repair. Real-GPU and wider-browser certification are missing. R07/R16–R24; [UI](ui/findings.md), [art](art/art-report.md), [QA](qa/report.md).

These are five reasons, not five equal-sized tasks. The single next implementation task is specified in section 19.

## 2. Current State

`packages/sim` owns canonical rules; AI/UI issue commands and consume observations. React/Vite supplies the shell, PixiJS the map/battle presentation, and a worker runs simulation. Content, map generation, persistence, chronicles and art processing remain separate packages. Preserve these boundaries rather than rewrite the game.

| State | Examples and evidence |
|---|---|
| Integrated, functioning foundations | Generated geography/fog, founding/claims/workers, paid queues and works, growth, recruitment, company identity/merge/split, transport, conquest aftermath, skills, actual spells, timed peace, Prosperity and replay. [Systems report](systems/report.md#4-system-depth-and-actual-loop-connections) |
| Functional but shallow | Culture rule asymmetry, materials/trade, research breadth, diplomacy, long-term AI, character identity, endgame. Larger counts alone will not fix them. |
| Broken | Battle-boundary save validity, mature full-archive capacity, over-cap defender contestability, bounded sparse-contact gate and repeated-load DOM identity. |
| Designed, not implemented | Strategic rituals/summons/artifice/sacred/occult pillars, independent powers/interactive legendary sites, branching events/quests and additional terminal victory paths. [Actual versus declared scope](systems/catalog.md#summary) |
| Present but not proof of completion | Reserved monster/map images without mechanics; historical review approvals without fresh all-frame playback; successful smoke tests without campaign-safe persistence. |

Current art registry and runtime evidence override obsolete documentation describing twelve cultures or static-only battlefield output. The audit baseline is unchanged at final verification; only the two audit paths are untracked. The earlier setup session's dirty-tree observation is not evidence of changes made by this audit.

## 3. Overall 1.0 Readiness Score

**{{SCORE_ROUNDED}}/100**, an editorial player-facing quality index, **not** the percentage of code finished, predicted sales, or measured probability of a successful launch. Equal-weight mean before whole-point rounding: {{SCORE_EXACT}}/100 (shown to one decimal) across {{AREA_COUNT}} areas. The requested premium target is **90+/100 plus zero unresolved P0s and passed release gates**. Scores diagnose gaps; they cannot override a failed save invariant.

The targets below are per-area quality floors, not a guarantee that merely reaching every floor yields 90. Scores are deliberately conservative about absent pillars and unverified scale. Final art/animation scores credit the actual validated library and genuine motion, correcting provisional assumptions about missing poses.

## 4. Major Strengths

- **Real connected investment:** charted/owned land → suitable paid work → assigned households → output/materials → development and expansion. Campaign A and the grain UI fixture exercise this rather than infer it from files.
- **Persistent consequences:** actual casualties, retreat destinations, earned formation experience, occupation/sack/raze/liberation and hull/cargo relationships. The save defect does not erase these implemented rules.
- **Deterministic, inspectable design:** eight primary ordinary-command campaigns, 125,150 accepted commands and eight exact full replays; retained hashes, command traces and minimal reproducers.
- **AI actually participates:** it founds, researches, develops, organizes forces, transports, fights and wins. The problem is long-horizon purpose and consistency, not total absence of AI.
- **Substantial original production art:** 545 approved assets, 1,427 frames, 662 clips, 432 qualified assets across 24 cultures; all 13 shared battlefield roles animate. No wholesale art restart is justified.
- **Useful existing usability and engineering:** prices/blockers, search/sort/filter, next/previous controls, keyboard help, narrow text scaling, source provenance, validators and reproducible production outputs.

## 5. Major Weaknesses

The loop is strongest at **explore → invest → expand**, thinner at **encounter → adapt → specialize**, and weakest at **long-term payoff**. Early lack of contact is not universal: Campaign A is one route, while Standard24 shows all seats in contact by turn 72. The stronger pacing defect is the measured late-game saturation and inactive strategic trajectories.

Current decisions are not all fake: food versus industry, navigation, paid cultivation, mutually exclusive institution/doctrine choices and combined-arms roles matter. But many later bonuses are additive, major systems share the same access rules, and material geography seldom denies a capability. Economically focused C policies grew stronger economies than B in these seeds, but neither policy won its controlled faction; this is **not proof of an optimal build, universal faction balance or a dominant strategy**.

The world offers real physical constraints but few independent discoveries that redirect a campaign. Full history records facts more successfully than the current UI helps the player remember them. Increasing map size, prices or turn limits magnifies those gaps.

{{CORE_LOOP_DETAIL}}

## 6. P0 Release Blockers

| ID | Reproducible failure | Required correction | Effort / impact |
|---|---|---|---|
| R01 | Valid turn-236 checkpoint hash `602413fe` + accepted attack/autoresolve fails strict round trip. Same-turn repeated combat can also leave invalid retained reports. | One canonical strategic-morale model; temporary battle bonuses applied once; version-correct survivor/history reconciliation and battle-boundary regressions. Do not merely relax validation. | M / Transformative |
| R02 | Standard/24/Long seed748291: victory 446; valid state 10,912,745 B, archive 93,161,744 B > limit 67,108,864 B. | Bounded playable saves plus a deliberate complete-history capacity/export policy; preserve atomic recovery and truthful history coverage. Demonstrate full restore/replay of retained failure. | L / Transformative |
| R03 | Save-valid 21-formation defenders cannot be attacked or assaulted; paid natural muster reaches 21 by turn 52. | Bounded participants/reserves or another explicit stacking rule that keeps every valid force contestable without deleting troops. Same policy for UI and AI. | L / High |

**Severity reconciliation:** the systems sub-audit called over-cap stacks P1. The final release taxonomy promotes it to **P0** because normal recruitment can create an immune garrison/project host and invalidate core warfare. This is a change in release judgment, not conflicting probe results. Morale's immediate-state and retained-history manifestations are **one root cause**, not two separately ranked bugs. Archive capacity is independent.

The prior valid save slot survived an invalid write in the tested fake-indexeddb adapter probe. That is useful recovery protection, **not** a claim that new progress is safe or disk durability is certified. See [parent rerun logs](verification/parent-checks.json) and [QA details](qa/report.md#2-release-blocking-persistence-findings).

## 7. P1 Requirements

The ranked list contains {{P1_COUNT}} P1 entries, grouped here to avoid an unlimited feature list:

- **Different viable campaign plans:** terminal objectives/counterplay, meaningful faction differences, a strategic magical loop, research that changes capabilities, consequential materials and discovery, bounded diplomatic obligations.
- **Purposeful campaign opposition:** honest contact gates, persistent progress toward operations, safe economic planning, execution of the AI's existing enemy-project awareness and late escalation.
- **Manageable player decisions:** attention/forecasting, cancellable/reorderable production, deliberate deployment, empire comparison/history, onboarding and a readable supported-scale experience.
- **Complete core presentation and release practice:** original audio, current-role binding/identity repairs, targeted terrain/battle refinement, current-scope performance and recovery/migration tests.

Written content targets remain unmet; reducing them is a **scope decision requiring explicit adoption**, not something this audit silently does. Conversely, a target such as “250 magical effects” does not justify 250 interchangeable damage spells. Prove interacting mechanics and a small contrast cohort before scaling content.

**High-value small work:** Waykeeper fallback is S/high value with zero new images; unique sibling keys are S/medium; unused-labor attention and queue correction are M/high. These can run alongside deeper work but are not substitutes for R01–R03. No P0 is currently estimated XXL; R02/R03 have L architectural risk that should be reduced with bounded prototypes. R09 is an XXL pillar and must be delivered through integrated slices, not a large speculative rewrite.

## 8. Top 25 Priorities

Priority is the user's release taxonomy: **P0 cannot ship; P1 target-quality required; P2 high-value optional polish; P3 post-1.0**. Effort is relative: XS/S localized, M a bounded cross-layer slice, L substantial multi-system work, XL a pillar, XXL multiple integrated pillars. These are not staffing or calendar estimates. Dependencies describe implementation ordering, not permission to edit production during this audit.

{{TOP_25}}

Full evidence, rationale, proposed solution, acceptance, files and dependencies are retained in [top-25.json](top-25.json) and the detailed `hermes-analysis` document. There are exactly {{ISSUE_COUNT}} ranked issues: {{P0_COUNT}} P0, {{P1_COUNT}} P1, {{P2_COUNT}} P2. P3 ideas are deliberately outside the most-important current-release issue ranking and appear in sections 12/17.

## 9. System Scorecard

{{SCORE_TABLE}}

{{SYSTEM_DIMENSIONS}}

The eight-dimension diagnostic covers completeness, depth, usability, strategic importance, content breadth, AI competence, polish and readiness for each of 16 major gameplay systems. It is separate from the equal-weight 19-area overall index; importance is not another completion weight. Full reasoning: [systems/report.md](systems/report.md), [system-dimensions.json](system-dimensions.json), and the detailed audit.

{{SYSTEM_DETAIL}}

## 10. Campaign Simulation Findings

### A — natural UI play

Ashen Compact, seed **20260909**, Small **256×160**, 12 realms, Continents, Standard pace. Ordinary UI play reached **turn 30** with two founded settlements, paid construction/recruitment/land improvement, two practical technologies, one Arcane discovery, Charter compact and a paid attached Waykeeper. Final: 153 coin, 50 knowledge, 836 explored cells. Save/load hash matched **`7997b20a`**.

No natural foreign contact/battle occurred on this route. Initial four idle scout turns were a **pointer-harness error**, corrected at turn 5, so the route is not clean quantitative early-contact evidence. The two-settlement opening is not a complete natural campaign or a recruited new-player study.

Separate UI-imported authored scenarios exercised war/peace assessment, a 120-soldier battle, Brace and autoresolve, 25/33 losses, real retreat and 3 earned XP spent with 8 coin on training. The grain fixture exercised paid extraction and a real sale: 3→2 grain and 71→73 coin. **Those events did not organically occur in Campaign A.** [UI timeline and screenshots](ui/findings.md).

### B/C/D — primary generated campaigns

{{CAMPAIGN_TABLE}}

All primary campaigns use current rules/save schema 16, generator 7, roster 4, generated resources and ordinary starting conditions. B/C control Ashen using distinct observation-only policies; opponents are unchanged production AI. D uses unchanged AI at every seat. Policies honor real victory; the Standard24 run ends at 227 rather than disabling victory to reach its 300-round bound.

- **125,150 commands, zero rejections, eight exact full replays, seven actual Prosperity victories.** These totals exclude two disclosed pilot attempts.
- **Seven midpoint continuations and seven final saves pass.** Standard24 midpoint 101 and B74 final 252 fail loading. Exact replay can reproduce exact invalid bytes.
- At turn 100, C74 has 8 towns/59 population/2,323 coin versus B74's 3/22/310; C99 has 7/49/1,012 versus B99's 3/21/660. Policies are exercised, not claimed optimal; neither B nor C wins its controlled seat.
- C actually earns magic. C99 battle80, turn37 includes paid discovery, appointment/attachment, both genuine spell uses and caster strain10. This is not a grant-injected demonstration.
- Count **substantive outcomes**, not only event volume: B99 has 273 unique battles but 263 ordered withdrawals and only 106 battles with strength loss. Standard24 has 582 battles, 559 withdrawals, 330 with loss.
- Epic seed99 runs to 808, but the last battle/capture is 297; practical research is complete by 146; 172,421 knowledge remains at the end. One army has 720 A→B→A returns. Late duration is not proof of depth.
- Sparse Standard/4/Long seed748291 reaches turn301 without victory, no captures and no Ashen battles. Ashen first contact137 misses the unchanged100-turn expectation; all factions end with zero material extraction.

### E — explicit stress workloads

Fresh QA covers generated Huge/Legendary growth, authored populated worlds, composed formations, a genuine turn-200 checkpoint and a real 2,240-soldier battlefield. Synthetic populations, deferred victory in scale benchmarks and snapshot-only browser imports are explicitly identified rather than counted as organic complete campaigns. See section15 and [QA report](qa/report.md#4-campaign-e-performance-and-stress).

## 11. Art Audit

**Preserve the existing aesthetic:** serious inhabited dark-medieval fantasy, deliberate modern-retro pixel clusters, readable material/value groups, warm wood/aged metal/linen against cool iron and subdued terrain. Retain distinct equipment/architecture, not merely faction tints. Use fixed screen-upper-left lighting, restrained local highlights and darker local-color separation rather than universal black outlines. Preserve the unresolved Ashfall; art must not invent new powers or canonical consumers.

- **545 approvals / 1,427 frames / 662 clips; 519 static and 26 multiframe assets.** 432 qualified assets across 24 cultures. All 18 improvements, five civic buildings and eight deposits already exist.
- **All 13 shared battle sets genuinely animate:** two directions, five states, 64 frames/10 clips each; 832 frames/130 clips. Strategic stills, caster/effect one-shots and weighted unit rigs are different capabilities.
- Fresh validators pass all approvals and 19 retained Blender source imports. Native/runtime pixels match; no missing live catalog IDs. Technical integrity is not a new all-assets aesthetic approval.
- Representative inspection opened 15 sheets: 164 distinct subjects/236 frames plus contextual images. Parent independently checked overlapping guard/biome/battle sheets. **Not every frame, direction, loop or background was visually approved.**
- **Waykeeper is a binding defect, not a missing image.** The UI rejects an unregistered qualified role before the existing shared fallback. Immediate correction needs zero new images.
- Four strategic specialists reuse another role's artwork; four shared pilots are justified. The common culture kit is not missing. Battle foot silhouettes are thin/plainer than strategic units; desert/alpine originals visibly differ from muted variants. Refine pilots before multiplying assets.

### Factory reality

The supplied `/projects/BlenderArtFactory` and `/pixel-art-factory` paths do not exist. Their actual inspected checkouts are `/home/telephoneheater/Projects/BlenderArtFactory` and `/home/telephoneheater/Projects/pixel-art-factory`.

Blender 5.2.1 LTS, Aseprite 1.3.18.3-x64 and real Pixel Snapper 1.0.0 are discoverable. **MCP connection was refused**, but background Blender is independent. Optional generator access is unconfigured/unverified; no provider call or new render was needed for this audit.

The stock Blender 2D profile is an eight-static-facing shrine study, not arbitrary animated content. The game already has a stronger game-native rig/render/import extension. `paf pixelate` performs nearest resizing/palette processing, **not generative pixel authorship**; `paf source/export` does not replace the game's frame/tag/pivot/provenance gates. New arbitrary subjects need recipes/contracts; non-square illustrations need a CLI/export-route extension.

Use: **consumer contract → deliberate Blender rig/reference or native pixel source → fixed camera/anchor render → exact palette/alpha and native cleanup → real Snapper/Aseprite processing → source/native validation → individual visual review → approved game import/binding → runtime playback/fog/performance review**. Existing motion should be reused; simple icons/masks favor direct pixel editing. Neither factory supplies game Foley/music production.

{{FACTORY_DETAIL}}

## 12. Missing Art Inventory

[Full JSON](art/art-backlog.json) and [CSV](art/art-backlog.csv) retain existing IDs, gap kind, quantities, native resolutions, motion requirements, Blender/Pixel Factory applicability, cleanup/review, dependencies and acceptance. **27 rows: 11 P1, 11 P2, five P3.** “Missing dedicated identity,” “binding defect,” “quality revision” and “future consumer” are separate categories, not a single invented missing-asset total.

{{ART_BACKLOG}}

Core production order: binding/contracts first; four shared specialist identities and guard/cavalry/transport/biome/interface pilots next; scale only visually accepted families. Optional portraits, expanded housing, illustrations and all-culture motion must not delay a zero-image binding fix.

**Audio:** bounded source/file searches found no production assets or playback system. No listening test is claimed. Proposed starter scope is **one runtime subsystem plus 93 principal outputs**: 10 UI cues, 24 campaign variations, 48 battle/effect variations, six ambience beds and five original compositions. These are planning assumptions with different costs, not delivered files or a mandatory first batch. First validate controls, fog-safe authoritative event routing, bounded voices, pause/skip/mute behavior and a small sound/music sample; then commission the accepted scope. Retain masters, source projects, rights, hashes and loop/export metadata. Voice acting is P3.

## 13. UI/UX Findings

| Player question | Current result | Concrete next-quality requirement |
|---|---|---|
| What needs attention? | Armies/orders and empty production are visible; town growth can leave unassigned households unnoticed. Turn9 shows0/3 workers. | Categorized labor/forecast/threat queue, locate/action, optional explicit assignment policies preserving manual locks. R07 |
| What will this choice do? | Exact prices/blockers are often good; long improvement/research catalogs obscure comparisons. | Applicable-first works, before/after outputs, downstream unlocks, turns-to-afford. Keep instant research truthful. R14 |
| How do I correct a plan? | Five-slot FIFO production, prepaid coin, no cancel/reorder command. | Canonical reorder/cancel with explicit sunk-cost/refund rules and exploit-safe replay. R10 |
| Where is the object and its context? | Search/sort exist; another town's orders take registry→entry→Show selected orders. | Comparable economic/military tables with direct row actions and retained selection; measure2/10/40-town tasks. R20 |
| What happened and why? | Battle status is brief; substantial report is in Journal. Turn26 journal has eight recent entries dominated by movement. | Concise aftermath and paginated, filtered fog-safe ongoing history, not a bigger full-state observation. R19/R20/R24 |
| Can I use a small display? | Inspected390px views and130% research text do not horizontally overflow; density remains high. | Reduce repeated chrome and verify physical touch, focus, accessible targets and sustained large-empire workflows. R16/R21 |

Campaign replacement is a real P2 lifecycle bug: independent dev/production loads/imports grow controls1→9; reload resets to one. Canvas and sampled attached listeners remain stable. `main.tsx:713` uses duplicate sibling keys. Do not label this a proven GPU/worker leak. The Waykeeper fallback at `faction-art.tsx:68–82,137–151` is a separate P1 consumer repair.

All major shell/progression/registry/diplomacy/battle/help/save screens were covered through direct UI or named browser scenarios. Physical-phone testing, exhaustive keyboard/focus/screen-reader review and measured40-town human task throughput remain unverified. [Detailed observations](ui/findings.md), [browser suites and limitations](qa/report.md).

## 14. AI Findings

| AI layer | Demonstrated capability | Gap and evidence |
|---|---|---|
| Strategic/contact | Legal observation-based plans; all24 seats contact in the dense run. | Sparse player's contact137 misses100; no saved multi-turn operational agenda. R06 |
| Economic | Paid founding/workers/buildings/research and real growth to269 towns in Standard24. | Common build/institution rails, weak supply penalties, inconsistent material extraction; no claim of general balance. R08/R11/R25 |
| Diplomatic | Evaluates actual peace payments, duration, pressure and grievances. | Saved trust/respect extremes produce the same current assessment; no alliances/clients/coalition system. R12 |
| Army/logistics | Merge/transport/war/siege/capture execute through the ordinary API. | Long exact movement loops; defending over-cap stacks block plans; many withdrawal encounters. R03/R06 |
| Tactical | Actual combat/ability kernel, combined-arms rules, legal outcomes. | Side-wide orders and creation-ID deployment limit composition intent. Tiny and20-vs20 probes do not establish expert tactical play. R13 |
| Victory/threat | AI evaluates host safety and can target observed enemy projects; actual winners exist. | Epic project goes uncontested while units loop. Improve execution of existing awareness, not invent a claim that awareness is absent. R04/R06 |
| Personality/research |19 recruitment-weight vectors, ecological cultures; real unlocks. | Mostly shared capabilities and static policy structure; no separate difficulty setting. R08/R14 |

The right response is bounded intent/progress/counterplay and regression scenarios, **not omniscient cheats, wall-clock timeout inflation or replacing the command architecture**. Neither automated B/C policy is a substitute for skilled human balance trials.

## 15. Performance Findings

{{QA_GATE_TABLE}}

The full unit/property result is **1,603/1,604 tests, 183/184 files**; the single failing contact test is independently reproducible. **149/149 gameplay and4/4 production smoke pass.** Default chronicle certification fails. QA retained43 named commands:31 exit0/12 exit1, separated into product failures, successful diagnostics that detect defects, and superseded harness errors. A shell chain's last exit does not mean every command passed.

### Measured scale, with workload boundaries

| Workload | Fresh result | Qualification |
|---|---|---|
| Generated Huge,100 turns |530 armies/836 formations/230 towns; mean complete turn244.215ms; serialize99.616ms/load266.356ms | CPU benchmark includes AI, excludes browser/autosave; victory proposals deferred for scale |
| Generated Legendary,100 turns |668 armies/1,010 formations/278 towns; complete turn305.531ms; serialize106.478ms/load442.550ms | Same qualification; not a Long/Epic finished archive |
| Authored composed Legendary |4,000 armies/25,760 formations; idle end-turn p50/p95 **8.195/12.250 ms** | No AI planning/battles in these measured turns; not comparable with complete AI turn cost |
| Browser genuine Standard turn200 |470 armies/913 formations/250 towns; import→art1,814.7ms, saves461.0–536.2ms, load1,094.6ms, export1,374.5ms | Snapshot-only imported checkpoint, not full original archive |
| Browser artificial Legendary |4,000 army containers; import2,704.8ms, saves813.2–879.1ms, load2,196.4ms, export2,108.5ms | Globally populated; near views have only two visible sprites under fog/stack aggregation |
| Actual20-vs20 battle |2,240 soldiers,46 actors,six officers; frame p50/p95 **50.0/66.7 ms** | **SwiftShader software rendering**, not physical GPU certification;120 warmed intervals |
| Map views, three workloads |p50 **16.7 ms**; stage p95 **16.7–16.8 ms**;2,700 sampled intervals | One software-rendered host, not thousands of simultaneous visible army sprites |
| Standard/Long storage prefix261 |47,177,713B logical envelope; incremental-save median575.319ms vs whole-envelope2,185.598ms; replay29,161.306ms | fake-indexeddb, not browser disk; does not solve archive446 failure |

Host evidence identifies i9-13900K,32 logical CPUs,31GiB RAM, Node26.7.0, pnpm10.32.1 and Chromium152.0.7977.82. Initial workloads overlap; final map/battle probes have lower QA concurrency but other desktop applications remain active. These are not exclusive-host timings. RAF intervals, render CPU, heap samples, logical save bytes and decoded atlas estimates measure different things.

The real completed archive at446 is the demonstrated capacity cliff. Map throughput is encouraging; thousands-soldier battle smoothness is **not certified**. Startup is measured as import-to-art-ready here, not cold network startup. The unchanged browser suites and build test other flows but do not fill that measurement gap.

Clean offline-store build reproduced **26 output files /8,836,874 bytes with identical SHA-256**. It used Node26; CI declares Node22. Still needed: supported physical GPU/min-spec/mobile, Firefox/WebKit, clean online Node22 release build/deployed subpath smoke, long Huge/Legendary full archives, quota/failure recovery and sustained resource profiling. [Raw results](qa/checks.json), [performance report](qa/report.md#4-campaign-e-performance-and-stress).

## 16. Content Gaps

{{CONTENT_TABLE}}

Full entries, costs, requirements and all24 culture differences are in [catalog.md](systems/catalog.md) and [content.json](systems/content.json). Important distinctions: culture is not a race registry; art variants are not unique mechanical units; naval strength is hull durability; Arcane discoveries are not extra spells; a character name combination is not an authored biography; a razed ruin is not an interactive legendary-site template.

**Mechanics first:** alternate endings/defeat, strategic magic, obligation-based diplomacy, meaningful deficit/supply consequences, competing material uses, independent discovery/event consequences, faction access differences and role-aware deployment. More rows before these links exist will multiply shallow choices.

**Content on existing foundations:** carefully differentiated unit/counter variants, branching development unlocked by real constraints, context-specific mission/event writing after its runtime exists, faction architecture/specialist identity, and exact current-role animation refinement. Pilot contrasting cultures before multiplying24 complete kits of new mechanics.

Declared master scope includes100+ units/variants,40+ resources,80+ technologies,48 independent templates,24+ sites and150+ events; major magic targets are also far larger. These are existing promises, not quantities invented by this audit. They are not met today, and blind bulk generation is not the solution. A smaller coherent release scope must be explicitly ratified if chosen.

## 17. Premium Polish Opportunities

- **P2:** richer veteran/office stories tied to actual facts, restrained milestone/aftermath presentation, focused icons/portraits/housing/illustrations, additional strategic idles and optional battle ground pieces. Existing source rigs and culture designs should survive refinement.
- **P2 but inexpensive:** repeated-load key/DOM repair should be bundled while its regression is fresh; shippable in theory does not mean worth postponing.
- **P3:** all24×13 culture battle sets (312 sets/19,968 frames if commissioned), unconsumed strategic facings/actions, full voice/culture chants, cinematic campaigns and broad political-life simulation. New magic VFX quantities wait for accepted mechanics; art for future magic is not a current missing-binding claim.

Reference lessons are design judgments, not fresh competitor playtests: combinatorial constraints and counterplay; understandable next opportunities; armies that visually express role/faction fantasy; a consistent pixel/audio/milestone language; specialization that unlocks different solutions. The authoritative-page evidence and non-copying recommendations are in [comparison.md](references/comparison.md). No other title's DLC scale, art, terminology or RTS architecture is a mandatory template.

{{COMPARISON_DETAIL}}

## 18. 1.0 Roadmap

This is an implementation dependency sequence, not arbitrary calendar months. Every phase ends with a playable/verified slice. P1 scope is refined by design decisions, but no missing written requirement is silently declared complete.

{{ROADMAP}}

**Parallel lanes:** after the battle-state contract is fixed, archive engineering and over-cap warfare can proceed with separate ownership. Attention/queue UI work can prototype against existing quotes while canonical commands are implemented. Waykeeper binding, contract cleanup, art-direction pilots and audio infrastructure can run alongside gameplay work; new content visuals wait for accepted IDs/mechanics. AI accompanies each feature slice, then receives focused cross-system campaign review. Art bulk production waits for approved pilots, not the other way around.

**Do not do:** engine/framework replacement without a measured need; reauthor545 assets; fabricate faction “depth” with recolors/stat inflation; hide red gates; raise save limits without bounded memory/quota policy; postpone all AI or usability until every content row exists.

## 19. Recommended Next Development Task

### R01 — Make every accepted battle transition save/load safe

This is the **single highest-value next implementation task**. Fix canonical morale and temporary training-bonus reconciliation at battle entry/aftermath, preserving valid historical semantics, then prove round-trip safety through the player persistence flow.

**Why first:** it is a small-enough, reproducible M-sized intervention into a P0 trust failure. It protects progress during ordinary warfare and makes subsequent reserves, tactical, magic, AI and balance work safer. Adding another faction, ritual or polished portrait cannot compensate for losing a campaign after a legal battle. Archive capacity is a separate subsequent task, not silently bundled into this one.

**Start with the already-red reproducer:**

```sh
node --import tsx docs/hermes-analysis/qa/minimal-save-repro.mjs
```

It starts from a valid turn236 checkpoint, applies two accepted commands and currently exits1 with `Invalid save: invalid formation definition, morale or strength`. Parent reran it; [exact log](verification/morale-roundtrip.log).

**Implementation boundary:** `packages/sim/src/warfare.ts:55–65,199–227`, `packages/sim/src/save.ts:674–679,827–828`; related morale/development/character/replay tests. Determine canonical strategic versus effective tactical morale before editing. Preserve temporary skill/rally/development effects as appropriate, and explicitly migrate/version changed historical rules instead of quietly rewriting archived battle facts.

**Acceptance for this one task:**

1. Promote the retained valid-checkpoint/two-command case into a regression. The original failure becomes green with the validator still meaningful.
2. Cover manual/autoresolve, retreat, assault, trained/rally/developed survivors and two engagements in the same turn. Validate pending/aftermath/end-turn and retained-report states, not only the final turn.
3. Retained B74 final252 and Standard24 midpoint101 become version-correct loadable/continuable; preserve exact replay expectations or explicit documented version boundaries.
4. Real browser save/autosave/export/import round-trips the result, restores identical supported-version state/events and protects the prior valid slot on rejected writes.
5. Run relevant unit/property, gameplay/production and current-rules benchmarks; run the full gates and report unrelated R02/contact failures separately rather than claiming they are fixed.

**Not implemented in this audit.** No production remediation was authorized or attempted.

## 20. Appendix / Evidence

{{EVIDENCE_INDEX}}

### Evidence and certification rules

- **Observed:** real commands, browser interactions, measured state, actual image inspection and fresh test output. **Implementation:** inspected source/exports, not proof of enjoyment or balance. **Proposal:** suggested new mechanics/assets/quality targets. **Historical:** attributed prior captures/approvals. **Unverified:** explicit unexecuted coverage.
- Parent reproduced the two-command save failure, retained-report diagnosis, stack/economy probe groups and one successful independent campaign replay. The other retained campaign traces and QA/art reports were aggregated and their artifact identities checked; subagent summaries alone are not treated as a release certificate.
- Preserve all failed attempts. Superseded audit problems include the B pilot recruitment quote, early map pointer sequence, initial production webServer/cwd configuration, initial battle property lookup, lifecycle locator and already-invalid candidate checkpoint. None are reported as game defects; corrected runs retain different names.
- No exhaustive faction-balance study, physical-mobile/real-GPU certification, all-assets/all-frames playback review, multiplayer validation, worker/browser/GPU crash injection, disk power-loss test or complete Long/Epic Huge/Legendary archive certification is claimed. “Many simultaneous battles” is bounded by the current sequential pending-battle model; many archived engagements and one large active battle do not prove multiple concurrent battle viewers.
- Persistent memory/skill work is separate from game implementation: the reusable `deterministic-campaign-audit` workflow and corrected browser-QA guidance are recorded in the active default Hermes profile. See [skill recommendation](skill-recommendation.md); no background recurring job was created.

Owned audit servers on4173/4174/5191 were stopped; the pre-existing user server on5173 remains available with HTTP200. [Final cleanup evidence](verification/cleanup.log). No recurring audit job or active simulation was left behind.

**Audit complete; remediation outstanding; release decision remains NO.**
