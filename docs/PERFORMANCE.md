# Performance measurements

## Saved realm groups — local rules 32

[Saved-group evidence](development/2026-09-25-selection-groups/benchmark.json) uses current generator-8 Huge/Legendary geography (51,840/77,440 cells) with explicitly authored 48/64 realms and 6,144/8,192 land armies. Every realm holds twenty-four overlapping groups of 128 members: 147,456/196,608 membership references globally, 3,072 in the own-faction read model. This is metadata saturation, not organic empire growth or a full turn/frame measurement.

After three warmups, fifteen samples give retained-member reconciliation medians of 3.234/4.202 ms, and one removed entity per realm 3.274/4.205 ms (p95 4.136/4.910 ms). Detached own-group reading is 0.011/0.016 ms median. Reconciliation runs only after successful lifecycle commands; ordinary moves, reads and refusals do not scan memberships. The complete observation timings are single samples and support no speedup claim.

The saved groups add 36,518/36,590 bytes to the raw own-observation JSON (totals 643,105/642,803 bytes); these are not packed-worker timings or a new general transfer-budget claim. A separate illustration using 100-character member identifiers costs 319,312 bytes for the group array alone and is not a valid authored campaign. Strict save/load and hashes pass with saturated metadata. Initial benchmark attempts exposed an unsupported generator-4/64-seat setup and then the existing 48-row arcane-research save limit; the latter is repaired in rules 32 while historical schemas stay frozen. [Failure and scope notes](development/2026-09-25-selection-groups/README.md).

## Finite fleet stores and observed naval returns — local rules 31

[Fleet supply evidence](development/2026-09-23-fleet-provisions/README.md) separates supply resolution from observation and AI planning. Synthetic resource-free, fully charted island workloads use 128 harbours/64 loaded fleets on Huge 196,608 cells and 256/128 on Legendary 307,200 cells. Twelve samples follow three warmups and alternate explicit rules30/31 supply contexts and no-provisions/provision-aware planner observations; output seals repeat and strict saves roundtrip.

Supply resolution medians change 5.36→5.81ms (Huge), 10.18→10.42ms (Legendary). Naval planning changes 33.77→41.89ms and 63.04→79.53ms; Legendary current p95 is 108.85ms. The added return decisions increase planner cost on these charts. AI-scoped observation is separately 22.17/37.38ms median. Eight fleets/eight route queries remain configured caps, not measured query totals. No full-turn, renderer, multi-realm contested-network or retained-memory signoff follows from this synthetic measurement. [Raw workload/limits/timings](development/2026-09-23-fleet-provisions/benchmark-fleet-supply.json).

Separately, a generated Small/islands four-realm 100-round campaign issues 2,819 accepted orders with zero refusals, 289 return steps, 86 resupplies, six landings and two transported foundings. One fleet and one passenger army each suffer one attrition turn. The 2,477-command saved mirror matches exactly. The headline Standard-map twelve-realm Epic campaign ends at 379, inside 350–400, with unchanged prices; the other pace results and open balance limits are reported separately.

## Layered campaign HUD and larger visible towns — slice 25

The same Huge save (`b14aa18a`) and packed/total worker bytes (1,769,695/1,974,826) retain 16.7–16.8 ms rolling frame p95. Removing side panels changes the canvas from 890×786 to 1440×696 at the same browser viewport; maximum chunk backing becomes 18/72 MiB rather than 26/104 MiB. Different visible geometry prevents a matched-camera speedup claim. Map/battle atlases are unchanged; three separate DOM materials add 68,784 bytes and potentially 2.0625 MiB decoded. Full verification, raw before/after, production checks and open contact/Epic/battlefield gates are in the [slice-25 report](performance/0037-layered-hud.md).

## Map-first management and tile containment — slice 24

The matched isolated Huge before/after check retains exact state `b14aa18a`, the same 890×786 canvas and identical packed/total worker bytes. Rolling frame p95 stays 16.7–16.8 ms, at most 26 chunks/104 MiB estimated backing and a separate unchanged 16 MiB foundation atlas. The new map interface mounts only one active management pane and one current-hash land-query consumer. This is rendering/query boundedness evidence, not popup latency, late-game turn or physical-GPU signoff. [Full measurements, verification and explicit limits](performance/0036-map-management.md).

## Twenty-four-culture integration — slice 22

The current roster is 24 distinct definitions (roster 4, save/rules 13, content `07a58d4f`). The expanded approved pack is 500 assets / 521 frames, including 432 qualified culture assets and 72 ships. One 2048² atlas remains 16 MiB decoded; PNG 2,628,301 bytes, SHA256 `e32c73be1b8789f8c554eea7c6b7204d40fae20e3347be36ccbd76de8a9740de`. Do not substitute previous atlas hashes or call changed schema/roster campaign seals byte-identical fixtures.

[Seven warm compiler samples](performance/0034-art-factions.json) give median validation 148.745 ms, packing/encode 304.906 ms and decode 74.174 ms. The preceding 284-asset / 305-frame pack measured 88.960/195.120/59.365 ms in [0033](performance/0033-art-animation.json). PNG grows 1,520,156→2,628,301 bytes, while the decoded page stays 16 MiB. Original/native file reads are excluded; process max RSS 609.570 MiB includes synthetic validation work and is not GPU residency or retained-memory proof. The compiler validates all 500 approvals and reproduces the exact published atlas in both input orders.

The separate [isolated Huge browser run](performance/0034-art-render.json) passes 1/1: 196,608 cells, 1,500 global singleton armies, 32 towns, ordinary entity fog, five warmed near/pan/far stages. Rolling frame p95 is 16.7–16.8 ms; at most 26 cached chunks with 837×711 bounds and 104 MiB estimated backing, separate from the 16 MiB atlas. Actual packed/total worker bytes are 1,769,695/1,973,677. First-art CPU 52.8 ms and art-load 275.8 ms are single captures, not robust startup percentiles. Current seal `6effe876` differs from historical `cde1a697` after schema/roster expansion: authored physical placement/counts are comparable, not byte-identical saved campaigns. Terrain pools, DOM decoding and other GPU allocations are outside the atlas estimate.

The [generated Standard/24/Continents campaign](performance/0034-cohort24-campaign.json) runs100 ordinary AI rounds with17,282 accepted commands, zero refusals, exact full command/result replay, exact final save/load and14,853 mirrored commands after the turn31 checkpoint. Final seal is `a7fb3c16`, save2,646,796bytes. Contacts reach22/24 at60 rounds and all24 by observed turn76;133 unique battles and15 capture decisions are distinguished from paired faction-event notifications. There are32 paid landings,23 off the landing faction's homeland, and21 transported overseas colonies,18 with recorded deep-water passage. This does not mean23 unique islands or establish all-culture balance.

Campaign execution takes15.024s including history copies, checkpoint observations and mirrored commands; full replay takes1.935s, whole script18.022s. These are one correctness run, not per-turn percentiles, browser timings, victory/archive coverage or thousand-turn performance. The final525,545,472-byte RSS is a process sample, not peak or retained memory.

The first integrated [headless checkpoint](performance/0034-final-headless.txt) passes typecheck/lint/content and1,310 tests, with six failures plus five tests prevented by a setup-hook timeout. It retains all original stacks; subsequent fixes/runs are separate evidence, never a rewrite of the failed checkpoint.

The final [corrected full headless run](performance/0034-headless-corrected.txt) passes 1,318/1,321 with zero skipped cases; typecheck, lint and content validation pass. Exact Buffer byte comparisons remove the large recursive setup comparison without weakening publication equality. The remaining failures are Standard/four-seat contact, Huge/32-seat contact (31/32) and Epic's 62.280-second parallel execution versus its unchanged 60-second limit. Full Chromium is 109/111 followed by 10/10 corrected scenarios on unchanged runtime; together all 111 have passing evidence. A neutral passing army was genuinely observed at turn 47 before leaving sight during pause, and selected assets no longer promise a whole-hex outline. [Original browser checkpoint](performance/0034-browser-checkpoint.txt), [corrected run](performance/0034-browser-corrected.txt). Production build and watch-only fog/no-development-hook smoke pass.

The unchanged [Short/Epic archive file passes in isolation](performance/0034-epic-isolated.txt): 2/2, 58.66 seconds Vitest / 59.05 seconds process. Its actual turn-500 continuation and replay/log equality assertions pass under the original limit; this is not a pass of the full-parallel timing gate. The later 4/4 contact/land-gallery browser rerun persists the [actual contact witness](performance/0034-contact-witness.json) separately from [post-pause sight](performance/0034-contact-post-pause.json), and [all-culture land/strategic counters](performance/0034-faction-art-inspection.json). The corrected [18,000-formation stack workload](performance/0034-army-stacks.json) retains all 1,500 armies/273 representative figures; its initial rolling p95 is 33.3 ms and restored-focus p95 16.7 ms, with 10,299,100 total worker bytes. These remain synthetic rendering checks, not full-turn late-empire timings.

## Biome variation, large inland seas and selection — slice 21 historical checkpoint

Generator 7 preserves explicit worlds 1–6 and expands mainland-relative inland seas on Small and larger layouts. Sixty repeated isolated samples match exactly; mean Huge generation 338.538/346.188/356.616 ms and Legendary 525.828/532.355/560.420 ms for Continents/Islands/Archipelago. The five samples per size/layout are a bounded checkpoint, not a robust tail study. [Raw generation data](../packages/mapgen/diagnostics/v7-inland-seas.json), [compatibility/AI gate results and complete voyage JSON](performance/0032-headless-checkpoint.txt).

The biome-only publication grows 260→284 approved assets and 278→302 frames, while retaining one 2048²/16 MiB map atlas. PNG increases 1,333,608→1,511,898 bytes. Warm seven-sample median validation is 83.237→92.640 ms, packing/encode 189.517→194.908 ms and decode 53.295→62.433 ms. Source reads are excluded, and these are offline compiler measurements, not browser frame times. The named peakResidentMiB fields are process resource samples, not GPU residency. [Exact before](performance/0032-art-before.json), [exact after](performance/0032-art-after.json). The following scout-animation publication and final renderer evidence are tracked separately; do not apply this atlas hash to a later pack.

The initial headless run passed 1,177/1,182; the subsequent narrow unknown-port correction passes final 34/34 focused AI/pacing cases and 2/2 isolated Short/Epic replays. Standard/four-seat contact is now later on the larger-basin Standard map: all seats by turn 118 in a diagnostic, missing the unchanged 100-turn check. Dense contact and broad-run Epic timing also remain open. Three actual generator-7 voyages found paid colonies on turns 38/41/33, zero rejected orders, exact saved mirrors and complete replays. Thirteen targeted browser scenarios passed after biome publication and selection changes; final animation/browser/performance checks are recorded separately when complete. Earlier slices below are historical evidence.

## Geography and world-scale readability — slices 19–20

[Generator 6, continuous zoom and representative armies](performance/0028-world-scale-readability.md) separates geography, rendering and campaign checks. Isolated five-sample generation means are 338.6–352.4 ms on Huge and 532.2–544.0 ms on Legendary across three layouts; all 60 outputs reproduce exactly. Richer shapes and climate cost more than the retained generator-5 checkpoint, with the same five canonical byte arrays. [Full raw geography evidence](../packages/mapgen/diagnostics/v6-geography-climate.json).

[Final road microbenchmarks](performance/0026-geography-roads-watch.md#sparse-roads) exercise 32/40 active projects across 64/80 genuinely founded towns, fresh surveys, saved mirrors and real paid acceleration. Active-phase means are 0.072–0.086 ms; these are not full-turn/whole-campaign figures. Two approximately 8 ms survey outliers remain in the [raw evidence](performance/0027-roads.json).

Final Huge/32/archipelago rendering retains 16.7–16.8 ms rolling frame p95, a single 3,148,800-byte overview texture and at most 22 cached chunks/88 MiB estimated backing, separate from the 16 MiB map atlas. [Before](performance/0028-geography-before.json), [after](performance/0028-geography-after.json). The matched 1,500-army/18,000-formation dense-stack correction reduces 4,500 redundant figures to 273 representatives plus count badges without changing the save or actual transfer bytes. Restored near p95 improves 83.4→16.8 ms; initial near p95 remains 33.3 ms including startup frames. [Before](performance/0030-army-stacks-before.json), [after](performance/0030-army-stacks-after.json). These are scoped rendering measurements, not total GPU-memory or whole-campaign guarantees.

[Three genuine paid overseas colonies](performance/0029-overseas-ai.json) retain 1,893 accepted orders, exact transported-journey mirrors and full origin replay; two traverse deep ocean. [Four 100-turn Huge/Legendary workloads](performance/0029-campaign-scale.json) retain zero refusals and all 50-turn saved continuations, with complete-round means of 160.981/120.403 ms for Huge generated/synthetic-mature and 208.395/217.116 ms for Legendary. Actual formation/container counts and generation versions are distinct in the report. Saves, archives and browsers are excluded from these round means; fixed-length workloads defer victory-project proposals only.

[Final actual Epic victory](performance/0031-epic-geography.json) reaches turn 1061 with 24,782 legal orders and 871 archived battles, seal `61b6aee7`, a 21,115,295-byte envelope and 1,803,062-byte compressed export. Full replay and restored logs agree. Recorded rounds average 25.30 ms, complete replay takes 10.61 seconds; the final 496 MiB heap sample is not peak or retained memory. This is Tiny, not a thousand-turn giant mature empire.

Final broad verification is **1,106/1,109 tests**: dense contact still reaches only 22/24 and 30/32 factions by turn 60, and Epic archive integration takes 64.961 seconds against its unchanged 60-second parallel-run limit. Its isolated two-test file passes in 57.47 seconds total, preserving turn-500 continuation and both replays. All 93 gameplay scenarios have passing evidence across the 92/93 final-runtime full run and 4/4 corrected Art Lab rerun; this is not a single 93/93 invocation. Whole typecheck/lint/content, 260 asset validations, production build and the actual production fog-console/no-debug-hook scenario pass. Historical slice-18 evidence below is retained, not relabeled current.

## Slice 18 — navigation, quiet overlays and naval publication

[Current report](performance/0025-ui-navies.md) separates offline compiler cost, actual browser rendering and the exact-save hashing optimization. All twelve playable cultures now have three individually approved naval hulls; 260 assets / 278 frames fit the existing 2048² map page. The expanded PNG is 1,333,608 bytes; decoded map atlas remains 16 MiB, not total presentation memory. Warm median compiler validation/packing+encode/decode are 77.837/178.700/59.502 ms, compared with 67.338/152.911/52.480 ms for the prior 224 assets. [Before](performance/0025-art-before.json), [after](performance/0025-art-after.json).

The first integrated fully explored Huge rendering capture preserves schema-11 seal `9a97cc37` and 1,973,594 worker-transfer bytes. Its five camera stages retain 16.7–16.8 ms rolling frame p95, 1,024–4,096 drawn terrain cells, at most 48 near sprites/two home strategic heraldic aggregates and one contextual home label. The 26 cached chunks have maximum 837×711 bounds and 104 MiB estimated cache backing, separate from map/DOM atlases and uncounted GPU allocations. [Raw capture](performance/0025-art-render.json). This authored mature-entity world does not advance turns or prove a thousand-turn giant campaign.

[Streamed envelope measurements](performance/0025-envelope-hash.json) compare forty alternating complete hash operations per path after six warmups, with strict projection, JSON, both FNV checksums and ordinary GC included. Huge/Legendary synthetic-scale medians improve 3.35–3.50%; Tiny is unchanged within noise, while Legendary p95 worsens. Exact complete saves, checksums, strict restoration, arbitrary UTF-16 and historical seals remain verified. This is a modest allocation reduction, not a whole-campaign speedup claim.

Current automated checkpoint: 965/966 tests across 100 files; the Epic 60-second integration test still times out under parallel load (71.133 seconds). Its isolated file passes both Short and Epic, including turn-500 continuation and both full replays, in 61.13 seconds total / 60.28 seconds combined test time; the individual Epic elapsed time was not emitted by this reporter. The unchanged per-test limit is respected in isolation, but the broad-run timing gate remains open. Typecheck, lint, content validation and production build pass. **All 82 final frozen-source Chromium scenarios pass (5.6 minutes)**; earlier failures and concrete corrections remain recorded in the slice report. The [final renderer capture](performance/0025-art-render-final.json) retains 16.7–16.8 ms warmed rolling p95 with 292.8 ms art load / 40.6 ms first-render CPU. The separate [generated-start capture](performance/0025-starting-map-final.json) records 33.3 ms p95 after 80 frames; it is not substituted with the steadier fully explored sample.

**Preceding slice-17 checkpoint:** [slice 17 — civic borders, researched construction and bounded read/save work](performance/0024-city-research.md), with [generated 100-round results](performance/0024-city-research-after.json), [same-state AI detail windows](performance/0024-ai-land-window.json) and [schema-11 Epic archive](performance/0024-epic-after.json). The unchanged 60-second Epic saved-mirror/two-replay integration gate remains **open**. The slice-17 browser attempt was 76/77 with one hot-reload-interrupted failure; see the slice-18 checkpoint above for its replacement. Prior complete browser/art evidence: [twelve-culture matched publication and final 71-scenario run](performance/0022-faction-art.md), with a separately open [narrow-menu painting defect](performance/0023-menu-paint.md). Earlier headless evidence: [twelve-culture roster measurements](performance/0020-faction-roster.json) and [schema-10 Epic archive](performance/0021-roster-epic.json), preserved below. Previous integrated browser evidence: [slices 13–14 — large-empire UI](performance/0019-large-empire-ui.md), [next-action navigation](performance/0019-next-action.md), [scoped town details and Epic replay](performance/0018-read-models.md), with [matched packed-cell measurements](performance/0017-cell-transfer.md). Historical comparisons: [slice 12 — territory campaigns, six-culture art, Epic archives and corrected rendering](performance/0016-territory-integration.md), [dedicated paid-land and many-town observations](performance/0015-territory.md), [slice 11 — military campaigns and rendering](performance/0014-integrated-military-campaigns.md), [general-led armies and loaded voyages](performance/0012-armies-fleets.md), [pacing investigation](performance/0013-pacing-diagnostics.md), [slice 10 — four-culture art](performance/0010-faction-art.md), [slice 9 — incremental local storage](performance/0009-incremental-storage.md), and [slice 8 — named officers and missions](performance/0008-characters-and-missions.md). [Slice 7](performance/0007-contact-and-armies.md) retains the contact/composed-army comparison, [slice 6](performance/0006-art-factory.md) the reviewed-art baseline, and [slice 5](performance/0005-travel-biomes.md) the earlier movement/biome measurements. The separately labeled schema-4 tables remain historical, not current totals.

## Schema-11 civic research checkpoint — remaining gates open

Measured 2026-09-06, content `3c54fb02`, roster 3/generator 4; Node v26.7.0 on the i9-13900K development host. `node --import tsx scripts/benchmark-city-research.ts` starts generated Tiny/Epic seed 20260906 with twelve cultures and runs 100 ordinary all-faction rounds to turn 101. No treasury/building grants or deferred victories: 6,102 accepted commands, zero refusals, 49 towns, 655 claims, 287 worked cells and 81 retained improvements. All 3,178 commands after the turn-51 mirror match; all 6,102 commands/results replay from origin. Final restore/replay save strings match at **956,318 bytes**, seal **`8d7bd333`**. [Full scope, counts and raw evidence](performance/0024-city-research.md).

The 1,200 **per-faction** scoped-observation-plus-plan samples have median/p95 **1.096/2.749 ms**; 100 End-turn commands have **1.242/1.852 ms**. These exclude mirror/replay, persistence, archive recording and rendering, and are not whole-round totals. Final-player summary/full/AI-scoped/single-town query medians are **0.479/0.606/0.594/0.130 ms** after four warmups and twenty samples. That player owns one town, so full/scoped detail both cover 37 cells and do not represent the large-empire optimization benefit. Changed schema-10 versus schema-11 growth/research economics produce different campaigns; their timings are not a pure optimization comparison.

`node --import tsx scripts/benchmark-ai-land-window.ts` separately alternates full/scoped warm reads on unchanged synthetic turn-one empires. Population/ownership/army placement are authored; claims and worker assignments use paid/public commands before timing. All summaries remain, with eight towns receiving detailed quotes. No turns, planner execution, archival work, persistence or renderer work are timed. [Raw same-state measurements](performance/0024-ai-land-window.json).

| Synthetic workload | Full → scoped detailed cells | Full read median / p95 | Scoped read median / p95 | Diagnostic observation bytes: full → scoped |
|---|---:|---:|---:|---:|
| Huge, 1,500 global armies, 32 owned towns | 1,184 → 296 | 26.775 / 31.883 ms | 24.029 / 27.689 ms | 7,314,658 → 3,131,873 |
| Legendary, 4,000 global armies, 40 owned towns | 1,480 → 296 | 73.019 / 79.952 ms | 70.038 / 78.894 ms | 11,079,186 → 5,501,733 |

Twenty samples per mode follow four warmups. Outside timing, all commands/reasons match exactly (58/89 proposals) and save bytes remain unchanged, seals `5347045a`/`953a4ff2`. These JSON sizes are **not packed worker transfers**; other observation work still accounts for the substantial remaining cost.

The current [Epic benchmark](performance/0024-epic-after.json), reproduced with `node --import tsx scripts/benchmark-chronicle.ts --seed=20260905 --size=tiny --pace=epic --factions=4 --limit=1400`, reaches Cinder March victory on **turn 1,244 after 1,243 rounds**. It retains the genuine pre-optimization **27,843 orders / 73,630 events / 1,331 battles**, zero refusals and seal **`c62e5459`**. Envelope/gzip/technical/history sizes and 1,246 chapters also remain exact. Recorded play is **25.730 seconds**, mean **20.700 ms/round** with recording; observed read/plan/command-and-recording counters are **7.172/6.653/11.559 seconds**, excluding some loop work.

Final envelope save/load takes **146.033/310.906 ms** for **25,076,089 bytes**. Compressed export/import takes **596.145/555.167 ms** for **2,193,968 bytes**. Generating both documents takes **638.714 ms** (technical **41,283,686 bytes**, history **2,138,688 bytes**); complete archive replay takes **12,113.899 ms** and matches the final seal. The final 559 MiB heap sample is not peak/retained-memory proof. Five asset-processing operations briefly overlapped this run for approximately one second, so it is **not an isolated whole-run speedup measurement**. It verifies final envelope restoration and one complete replay, **not a turn-500 mirror or second technical replay**, and is not a thousand-turn giant-map campaign.

The independent integration test retains all saved-mirror/document/two-replay assertions and its original 60-second timeout. Latest broad verification is **941/942 passing**, with Epic at **66.387 seconds**; serial verification still records **61.556 seconds** for Epic (**179.140 seconds** for the complete suite). The timing gate is open, not hidden by successful standalone benchmarking. Slice-17 functionality and targeted evidence are implemented; the clean final browser run and slice-18 rendering/art measurements remain separate pending work. No 1.0 completion claim is made.

## Schema-10 twelve-culture roster: generated play and historical origins

Measured 2026-09-06 in reserved host windows: save/rules 10, content `4c2fed32`, roster 3, physical generator 4; Node v26.7.0, Linux 7.1.9-arch1-2, i9-13900K (32 logical CPUs), 33,317,580,800 bytes installed RAM. Reproduce the roster workload with `node --import tsx scripts/benchmark-faction-roster.ts`; the script prints JSON and asserts the exact schema/content/roster before work. `--smoke` is a smaller diagnostic, not these results. [Raw report](performance/0020-faction-roster.json), [runner](../scripts/benchmark-faction-roster.ts).

The generated Tiny/Epic campaign uses seed 748291 and all twelve distinct cultures. It executes **100 complete rounds, turn 1→101**, with no authored grants or deferred victory commands: 4,774 accepted commands, zero refusals, 343 battle resolutions and 32 capture decisions. Participant notifications are not unique conflicts: the corresponding battle-finished/capture event counts are 686/64. Every culture issues paid recruitment and land orders; recruitment counts describe queued orders, not completed troops. Four factions first observe a foreign army/town at turn 1, all twelve have such contact by turn 2, and the player first does at turn 2. Across the run all 66 unordered faction pairs make permitted entity contact; this dense Tiny fixture is not evidence for large-map contact times.

| Timed work per round | Mean | Median | p95 |
|---|---:|---:|---:|
| All-faction full observations, including battle/capture decision reads | 10.238 ms | 11.127 ms | 16.640 ms |
| Planning from those observations | 4.154 ms | 3.648 ms | 7.787 ms |
| Submitted commands excluding End turn | 3.680 ms | 3.380 ms | 6.297 ms |
| End-turn command/phases | 0.686 ms | 0.699 ms | 1.293 ms |
| Sum of the four measured intervals | 18.757 ms | 18.730 ms | 29.519 ms |

Each distribution contains 100 samples. These intervals exclude duplicate-plan checks, mirror/replay, history copying, save/hash verification and browser/worker work; their sum is not whole-process wall time. The complete script, including all origin workloads and verification, takes 11.754 seconds. End state: 108 armies / 182 formations, 40 towns, 50 character records, 316 claimed and 226 worked cells, 102 retained improvements and five cultivated cells. No victory is reached; the player has lost its towns, so this does not establish balanced success for every culture.

The exact midpoint at turn 51 (`2304af83`, 449,149-byte save) continues through 2,490 mirrored commands; all 4,774 commands/results also replay from the initial save to `c38e2946`. Final canonical save/load takes 9.859/16.347 ms, 572,991 bytes. The final player's full observation is 93,635 JSON bytes (709 permitted cells, nine observed armies, four observed towns), not actual packed worker traffic. Final process heap/RSS are 130,660,824/495,497,216 bytes across the whole script, without forced GC; neither figure is peak or retained-memory proof.

Historical checks use genuine pre-change schema-9 evidence (`9418e598`), not regenerated golden expectations. Explicit roster 2 regenerates byte-for-byte identical initial saves, physical arrays and starts for both sources; eight seats still reuse six cultures. Modern serialization has different identity metadata and therefore a different modern seal. This proves origin compatibility, not equivalence between old and current AI planning.

| Captured Tiny/Short origin | Selected culture | Exact schema-9 seal | Modern loaded seal |
|---|---|---|---|
| Seed 20260905, six seats | Reedbound Council | `1754cd12` | `bcb4b647` |
| Seed 74, eight seats | Sepulchral Synod | `58aa6b37` | `3a5cb55e` |

The raw report retains both original save SHA-256 values; the runner compares complete saved strings with the frozen [schema-9 fixture](../packages/chronicle/src/fixtures/v9-archives.json).

## Huge/Legendary roster costs: origins and freshly founded towns

The same report measures seed 20260905, Epic pace, twelve or twenty-four seats on 196,608/307,200 cells. **Every case has twelve authored cultures, not twenty-four**. Origin creation is one timed sample, followed by untimed exact regeneration and strict saves. The physical-array seal matches roster 2 at equal size/seed/seat count; modern faction-affinity start assignments are not claimed identical to roster 2.

Each faction then founds its first town through an ordinary command: 12/24 scouts and 12/24 towns remain, with 84/168 claims and no paid improvements, cultivation, characters or elapsed turns. Read/planning samples use this otherwise unmodified state. Four warmups and twenty timed repetitions run per seat; deterministic comparisons and actual proposal validation on a separate state are outside the timing intervals. Every view contains one owned town and army, 60–61 permitted cells, fourteen production options and ten currently legal options.

| World / seats | Origin generation* | Origin / founded save bytes | Full per-seat observation bytes | Per-seat median read range | Per-seat median plan range |
|---|---:|---:|---:|---:|---:|
| Huge / 12 | 57.670 ms | 1,711,288 / 1,724,398 | 34,073–36,975 | 0.054–0.064 ms | 0.051–0.200 ms |
| Huge / 24 | 53.363 ms | 1,727,398 / 1,754,003 | 34,062–36,904 | 0.058–0.071 ms | 0.048–0.161 ms |
| Legendary / 12 | 68.679 ms | 2,664,667 / 2,677,782 | 34,078–37,013 | 0.050–0.057 ms | 0.040–0.152 ms |
| Legendary / 24 | 70.394 ms | 2,680,933 / 2,707,567 | 34,073–37,133 | 0.054–0.066 ms | 0.036–0.143 ms |

*One generation operation per case, not a cold-process distribution or measured speedup. Read/plan ranges are minimum–maximum **per-seat medians**, not an aggregate all-faction round. Tails remain visible in the raw report: maximum read/plan samples are 0.557/5.511 ms, 0.119/0.217 ms, 0.142/0.828 ms and 0.131/0.171 ms in table order. With twenty samples, the runner's p95 index selects that seat's maximum sample. Initial player reads contain 61 cells and one known seat, at 10,971 bytes on Huge or 11,035 on Legendary.

Origin→first-town seals are `13735610`→`237b3c4e`, `537ab962`→`2c903076`, `d82dc992`→`b7a03be2`, and `80a3aa18`→`bd27c952`. Queries/planners leave these states unchanged; fresh plans execute legally on the separately validated copy. These are fresh-start production/read costs, **not mature empires, 100-turn giant campaigns, end-turn throughput, transport bytes or renderer measurements**.

## Schema-10 complete Epic archive

`node --import tsx scripts/benchmark-chronicle.ts --seed=20260905 --size=tiny --pace=epic --factions=4 --limit=1400` reaches actual Prosperity victory on **turn 863 after 862 rounds**, with 18,935 orders, 54,448 events, 888 archived battles and zero rejected commands. The Reedbound winner holds 34 towns. These outcome/activity counts, including all recorded character-activity counts, match the earlier [schema-9 run](performance/0016-territory-chronicle.json); the modern seal is **`a39584dc`**, not `177160fb`. This is a four-seat run of the original four cultures under current roster/schema rules, not a twelve-culture victory. [Current raw report](performance/0021-roster-epic.json), [runner](../scripts/benchmark-chronicle.ts).

Generation precedes the campaign timer. Recorded play takes 18.341 seconds, mean 21.278 ms/round including archive work and end-turn checkpoints; observation/planning/command-and-recording counters are 5.672/5.562/6.768 seconds. The counters do not partition every loop operation (capture decision reads/plans, for example, remain in total time). No periodic storage, compression, final logs or rendering is included in this round mean.

| Final operation | Time | Retained payload |
|---|---:|---:|
| Serialize / deserialize full campaign envelope | 80.424 / 206.815 ms | 17,011,577 bytes |
| Export / import compressed envelope | 448.852 / 344.781 ms | 1,475,600 bytes |
| Generate technical log and factual history | 427.065 ms | 27,815,983 / 1,308,675 bytes |
| Replay complete archive from origin | 6,818.774 ms | Exact final seal `a39584dc` |

Envelope restoration, compressed import and complete command replay all match the final state. This benchmark does **not** perform a turn-500 saved-resume comparison; earlier independently tested midpoint evidence is not relabeled as part of this run. Compared with schema 9, envelope/technical sizes increase by 19,841/19,849 bytes and gzip by 114 bytes, while history bytes and 865 chapters remain unchanged. The raw Epic format does not embed schema/content fields; run identity here is the verified current schema-10/content-`4c2fed32` checkpoint and explicit command, not an additional field claimed in that JSON.

The 381 MiB final heap sample includes complete archives, document strings, restored games and replay work; it is neither peak memory nor a leak proof. No twelve-/twenty-four-faction thousand-turn giant campaign, difficulty balance, worker/autosave performance or final expanded-art rendering is established by these headless measurements.

## Historical schema-4 baseline

Measured 2026-09-05 on the integrated progression/pacing/chronicle working tree (starting commit `59c6dbe`). Linux 7.1.9-arch1-2, Intel i9-13900K, Node v26.7.0, save schema 4, content `3139d4e7`. Reproduce with `pnpm bench` and `pnpm bench:chronicles`. These development-machine results are not mainstream-device release claims.

### Campaign measurements

Each fixture runs real AI, command validation, movement/visibility, economy, recruitment and recovery for 100 turns. Every fixture restores a midpoint save and verifies another 50 turns against uninterrupted execution, then checks the final save/load hash. There were zero rejected AI proposals. These fixed-length scale workloads explicitly defer `startVictoryProject` proposals so terminal victory does not truncate the measurement; separate complete-victory runs below do not defer any orders.

| Fixture | Cells / factions | Final armies / towns | Mean AI planning | Mean command execution | Mean phase resolution | Mean complete turn* | Save / load |
|---|---:|---:|---:|---:|---:|---:|---:|
| Huge young | 196,608 / 32 | 287 / 127 | 4.054 ms | 1.874 ms | 0.212 ms | 6.141 ms | 19.1 / 47.3 ms |
| Huge mature | 196,608 / 32 | 1,503 / 125 | 12.446 ms | 4.451 ms | 0.525 ms | 17.422 ms | 19.3 / 62.0 ms |
| Legendary young | 307,200 / 40 | 359 / 159 | 5.417 ms | 2.108 ms | 0.205 ms | 7.730 ms | 25.0 / 69.4 ms |
| Legendary mature | 307,200 / 40 | 4,002 / 157 | 34.130 ms | 11.000 ms | 1.227 ms | 46.357 ms | 31.4 / 111.6 ms |

*Complete turn includes planning, submitted commands and end-turn phases; it excludes persistence, hashing, rendering, and the separately executed resumed-copy validation. AI planning includes observation construction.

Mature setup is an explicitly synthetic valid snapshot with 1,500/4,000 armies and ample treasury. Four introductory content definitions are reused across 32/40 factions. The following turns use actual rules. No armies encountered field battles or sieges in these geographically separated 100-turn fixtures; conquest and peace are exercised separately below. These fixtures do not cover future magic, supply or world crises, nor a dense network of simultaneous sieges/treaties.

Mean mature Huge phases: siege maintenance 0.003 ms, settlement production/growth/reconstruction 0.098 ms, upkeep 0.197 ms, movement/morale/fatigue refresh 0.212 ms, diplomacy expiry 0.001 ms, progression 0.0015 ms. Mature Legendary: 0.003 / 0.099 / 0.526 / 0.580 / 0.001 / 0.002 ms. Empty siege/diplomacy and inactive-project phases are measured explicitly, not claimed as loaded-system timings. Young generation: 54.4/62.6 ms; mature setup including validated import: 104.5/184.6 ms.

| Fixture | Final save bytes | Full faction observation bytes | Final state hash |
|---|---:|---:|---|
| Huge young | 1,094,741 | 34,962 | `df6b00e3` |
| Huge mature | 1,327,777 | 51,992 | `c07b8fbd` |
| Legendary young | 1,643,543 | 41,473 | `c20e6c8b` |
| Legendary mature | 2,335,670 | 76,925 | `64dcc404` |

Full observations are diagnostic sizes, not per-frame traffic. The browser worker emits cell deltas after its initial update. Hashes intentionally change when content or save schemas change.

Raw heap samples across mature Huge: 60/66/111/116/119 MiB; mature Legendary: 38/63/143/137/156 MiB. These include a second resumed campaign after turn 50 and were not measured with forced GC. GC-timing noise requires a longer retained-memory investigation before release; this is not a leak proof. HUD events are capped at 200, HUD battle reports at 20, and diplomatic records at the supported faction-pair count. The separate full campaign archive is intentionally not represented in these canonical-only timings.

### Combat

The same benchmark script warms 20 battles, then measures 200 seeded 12-versus-12 formation battles using the production tactical/autoresolve kernel: median **0.444 ms**, p95 **1.347 ms**, maximum **3.600 ms**. Input validation, cloning and all rounds are included. Median is close to the prior 0.428 ms; tail latency is higher in this sample despite the unchanged kernel, so GC/host variance needs continued measurement. Browser gameplay scenarios separately prove tactical orders, AI intervention, strategic retreat and identical continuation from a saved battle round.

### Conquest and peace

After five warmups, 50 repeatable Reedwatch scenarios run a real three-turn blockade, militia assault, occupation, paid peace and treaty expiry. Assault command plus full autoresolve: median **0.258 ms**, p95 **0.438 ms**, excluding fixture setup. Proposal plus acceptance: median **0.025 ms**, p95 **0.039 ms**; this deliberately includes commands on the resumed mirror too. Every run reloads the pending capture decision and verifies subsequent capture/diplomacy and 11 resumed turns. Final hash: `7353c748`.

An additional unit scenario runs **100 AI-led frontier turns** with actual siege, capture and accepted peace events, no rejected commands, save/load verification every turn and an uninterrupted-versus-restored mirror for the last 50 turns. It also explicitly defers terminal project proposals. This complements the large, geographically separated fixtures; it is not a dense late-game diplomatic stress test.

### Complete campaigns and full archives

`pnpm bench:chronicles` starts generated worlds with seed 20260905, gives every faction ordinary AI control, records every command/event/completed battle, and runs to actual Prosperity victory. It verifies complete replay, final envelope restoration, and compressed export/import. No project is skipped in this benchmark.

| World / pace / factions | Victory turn | Orders / events / battles archived | Mean round with recording* | Envelope save / load | Generate both logs | Full replay |
|---|---:|---:|---:|---:|---:|---:|
| Tiny / Short / 4 | 46 | 827 / 1,154 / 0 | 1.159 ms | 1.6 / 17.1 ms | 12.4 ms | 32.8 ms |
| Huge / Short / 32 | 45 | 5,994 / 12,081 / 0 | 21.893 ms | 27.7 / 285.1 ms | 164.5 ms | 1,109.4 ms |
| Legendary / Short / 40 | 45 | 7,499 / 16,605 / 0 | 29.961 ms | 39.9 / 317.9 ms | 229.8 ms | 1,597.3 ms |
| Tiny / Standard / 4 | 233 | 6,757 / 8,596 / 176 | 1.747 ms | 8.3 / 31.3 ms | 70.0 ms | 318.3 ms |
| Tiny / Epic / 4 | 1,006 | 26,163 / 37,843 / 1,491 | 2.119 ms | 39.1 / 122.5 ms | 326.9 ms | 1,720.2 ms |

*Includes observation, planning, commands, passive recording and end-turn hash checkpoints; excludes periodic storage, compression, rendering and final log generation. Envelope save is serialization/size validation, not an IndexedDB transaction. Load includes archive validation and generated-start provenance verification. Native UI watch intentionally yields 250 ms between rounds and autosaves each round, so these headless means are not browser autoplay wall times. The large short runs are not evidence for a 1,000-turn, 40-faction mature game.

| Fixture | Envelope / gzip bytes | Full technical / history bytes | Export / import including validation | Final hash |
|---|---:|---:|---:|---|
| Tiny Short | 378,467 / 28,594 | 563,856 / 17,927 | 19.8 / 19.0 ms | `a7a7b987` |
| Huge Short | 5,010,130 / 293,693 | 10,041,568 / 86,948 | 298.0 / 248.1 ms | `33ea5b30` |
| Legendary Short | 7,092,282 / 373,766 | 14,580,153 / 107,175 | 428.8 / 349.3 ms | `310d5f18` |
| Tiny Standard | 2,826,375 / 199,060 | 4,596,482 / 106,634 | 74.3 / 48.3 ms | `956927a6` |
| Tiny Epic | 12,704,134 / 923,252 | 21,161,603 / 665,919 | 329.0 / 272.7 ms | `4e74ba32` |

The Epic tome contains 1,008 chapters, rendered one at a time; technical browsing likewise renders one issuance turn. A dedicated test resumes the entire Epic archive from turn 500 and compares the final technical/history documents with uninterrupted play, including reports beyond the 20-report HUD cap. The retained transcript makes the completed game reconstructable, not just its final snapshot.

Raw post-case process heaps were 26/144/127/208/313 MiB, including temporary decoded saves, full document strings and replay validation; no forced GC or peak/retained-memory proof. Archives grow with game activity and whole-envelope autosaves repeat serialization/validation. The 64 MiB UTF-8 save cap is consistently enforced without silent truncation. Chunked storage and streamed document export remain necessary scale work before claiming long mature giant campaigns are fully supported.

Duration calibration used generated four-AI Tiny games, three seeds per long profile: Standard **233–252**, Long **479–498**, Epic **996–1,021** turns, all with zero rejected commands. Standard is the default; Short is explicitly for regression/skirmish play. Four permanent Standard/Epic regressions verify midpoint continuation and continued late production. These profiles scale late knowledge/funding and a public response window; they do not implement difficulty behavior or prove sufficient long-campaign strategic variety.

### Browser map

Chromium 151.0.7922.173 on Arch Linux, WebGL, 1440×1000 viewport; 390×844 responsive layout also inspected. The Huge camera scenario generates 196,608 canonical cells but initially reveals only 61. After pan/zoom, the final 68-frame sample measured 16.7 ms latest frame and 16.8 ms rolling p95, 0.20 ms CPU update/render submission, one cached/visible chunk, two entities, and a 6,855-byte initial worker update including progression choices. Playwright checks WebGL selection, bounded geometry/cache/transfer and absence of horizontal overflow. Visible ruin glyphs reuse the existing chunk-indexed marker layer. The complete Short watch/download/replay/reader scenario took 15.7 seconds including intentional watch delays and UI assertions; all 14 browser scenarios took 35.6 seconds.

This short fog-limited, software-assisted Chromium result does not establish the frame budget of a fully explored mature empire.

### Remaining performance gates at that checkpoint

No hierarchical pathfinder exists; adjacent movement is bounded neighbor lookup, so long-distance route timings remain pending. Fully explored/mature giant browser fixtures, virtualized registries, mainstream hardware, Firefox/WebKit, multiplayer and mixed late-game battle/magic/diplomacy workloads are still required. Rendering and simulation budgets remain separate.

The prior conquest slice measured complete young turns of 5.34/6.85 ms versus current 6.14/7.73 ms; extra progression/visibility observation work increases that small baseline. Current mature means are lower (17.42/46.36 ms versus 26.12/66.16 ms), but changed AI economics and command mixes make this unsuitable as a pure optimization claim: current mature runs issue 76,402/196,748 commands and end with different settlement counts. Production output is a 629.12 kB main chunk (192.77 kB gzip), a 308.84 kB worker and 37.56 kB CSS. The large-main-chunk and upstream Zod annotation warnings remain documented, not suppressed.
