# Slice 18 — realm navigation, map clarity and twelve-culture navies

This slice responds to the supplied crowded-map/long-sidebar screenshots. It does not claim a finished interface, terrain production pack, twenty-four playable cultures or game 1.0.

## Implemented presentation

- One header navigator for armies/settlements, the existing character dialog, current selection, and direct map/orders jumps. Keyboard tabs, stable selection and campaign-reset behavior use actual observed entities.
- A searchable, sorted, force-filtered registry with at most 25 rendered rows per page; tested workload has 100 own armies and 40 own towns. Pagination is presentation state, not a command or an alternative canonical store.
- Construction, land recruitment and naval recruitment use native disclosures above land detail. Actual prices, prerequisites, capacity and disabled reasons remain visible within the relevant category. Incoming diplomacy offers remain prominent while the general ledger/chronicle start compact.
- Realm outer perimeters replace internal claim strokes; the ambient grid is removed. Movement/attack/selection/hover remain contextual. Collision-filtered names are capped at 32, with complete names still available in the registry.

The interaction references were the [Total War Academy campaign selection/camera controls](https://academy.totalwar.com/campaign-keyboard-and-mouse-controls/) and official Civilization VII UI-change notes ([May](https://support.civilization.com/hc/en-us/articles/41630356903443-Civilization-VII-Patch-Notes-May-27-2025), [August](https://support.civilization.com/hc/en-us/articles/43845922146451-Civilization-VII-Patch-Notes-August-19-2025)). These informed registry-to-map navigation and clearer information grouping; no game artwork or branded interface was copied.

## Thirty-six original ships

Every registered culture has its own transport, coastal warship and ocean warship. There are twelve registered cultures, not twenty-four. Each ship is a static southeast 96×96 native frame at pivot (48,80). Near sprites and DOM troop/recruitment consumers resolve real faction definitions without owner tint; strategic views use existing faction badges. Missing qualified hulls produce an explicit ship marker, never another culture or infantry.

Thirty-seven actual built-in image calls yielded thirty-six selected originals. One Synod mast-edge clipping was rejected and a newly generated version 2 selected; the rejected source remains retained. [Selected prompts/source hashes](../../assets/art/source/faction-expansion/naval/generation.json), [rejection](../../assets/art/source/faction-expansion/naval/rejected-sources.json), [main reviewer decisions](../../assets/art/source/faction-expansion/naval/root-review-decisions.json) and [native approved contact sheet](../art/reviews/slice18-naval-all-1x.png) are the production evidence. Model/seed/itemized costs were unavailable, not invented. Real native fitting, palette normalization, Pixel Snapper and Aseprite exports precede individual exact-input approval.

## Matched offline compiler workload

Same `node --import tsx scripts/benchmark-art.ts` runner, warm code/data, seven samples after warmup, filesystem reads excluded, reserved host windows. [Before](0025-art-before.json) and [after](0025-art-after.json) retain raw counters. This is expansion cost, not a speedup or renderer benchmark.

| Workload | Before | After |
| --- | ---: | ---: |
| Approved assets / frames | 224 / 242 | 260 / 278 |
| PNG bytes | 1,076,255 | 1,333,608 |
| Validation median / p95 | 67.338 / 73.505 ms | 77.837 / 85.308 ms |
| Packing + encoding median / p95 | 152.911 / 157.512 ms | 178.700 / 190.123 ms |
| PNG decode median / p95 | 52.480 / 54.360 ms | 59.502 / 60.897 ms |
| Map atlas decoded bytes | 16,777,216 | 16,777,216 |
| Process peak RSS, entire compiler run | 518.492 MiB | 551.402 MiB |

The one 2048² page has SHA-256 `05a92bd0da46c4321138a075105cc941b278364d8ef0e6ca72584ad365b111fa`. Reversed-input compilation reproduces the published PNG/catalog exactly; all 260 retained approvals validate. The 1,000-frame candidate stress uses repeated existing pixels and does not create new production art.

## Browser rendering workload

[Raw first integrated renderer capture](0025-art-render.json) uses the same synthetic fully explored Huge world: 196,608 cells, 32 seats, 1,500 global armies and 32 towns, without advancing turns. Only observed entities are rendered. Its current schema-11 seal remains `9a97cc37` and worker transfer remains 1,973,594 bytes, including 1,769,695 packed-cell bytes.

The five camera stages draw 1,024–4,096 terrain cells, at most 48 near sprites and two home strategic heraldic aggregates. Rolling frame p95 remains 16.7–16.8 ms. The first run records 289.1 ms art load and 56.5 ms first-render CPU. The [final frozen-source capture](0025-art-render-final.json) retains the same bounds, transfer bytes, seal and rolling frame range, with 292.8 ms art load / 40.6 ms first-render CPU. These are single browser samples, not robust speedup comparisons. Names are one visible label in the dense home stack, and range/territory counters retain contextual geometry.

The separate fog-limited generated Huge startup capture reports 394.6 ms generation, 214 ms art load / 31 ms first-render CPU and **33.3 ms rolling frame p95** after 80 frames, with 61 observed cells and 9,232 transferred bytes. [Exact counters](0025-starting-map-final.json). That short startup sample is not the warmed fully explored workload, and its higher p95 is retained rather than replaced with the steadier value.

Maximum cached chunk bounds are 837×711 pixels, with at most 26 cached chunks and 104 MiB estimated power-of-two cache backing. Add the 16 MiB map atlas and a potential independent 16 MiB DOM decode; texture pools and other GPU allocations are not counted. A 16 MiB atlas is not a 16 MiB presentation budget. The Chromium launch allows SwiftShader, and this does not prove every user's GPU or thousand-turn giant-empire workload.

## Exact streamed envelope hashes

Current-schema hashing folds the same envelope header, payload and closing brace without allocating a joined outer-envelope string. Strict canonical validation, both FNV passes, UTF-16 behavior, save bytes and legacy paths remain unchanged. Three regression tests include arbitrary UTF-16/control/surrogate input, malformed state, executable-hook rejection and a single canonical traversal. [Forty-sample alternating microbenchmark](0025-envelope-hash.json) includes validation, projection, both checksums and ordinary GC; six warmups per path, no forced GC or concurrent browser.

Whole-hash medians are 32.220→31.140 ms for Huge/1,500 armies, 53.784→51.945 ms for Legendary/4,000 armies and 34.441→33.234 ms for Huge/32-own-town land: a modest 3.35–3.50% reduction. Tiny is 0.280→0.286 ms, not a measured benefit; Legendary p95 worsens 56.48→60.29 ms. All hashes, complete saves and strict roundtrips remain exact. These are authored turn-one scale fixtures, not earned Epic campaigns, and do not close the Epic integration time gate.

## Integration checkpoint and remaining gates

First full publication checkpoint: typecheck, lint, content validation and production build pass. Automated suite: 962/963 across 99 files, with the existing 60-second Epic integration budget failing at 67.819 seconds. Full browser pass: 77/82. Failures identified a removed-hint framing assumption, restored-tab test navigation, missing own-claim-to-town selection, cropped naval-gallery camera framing and actual narrow-footer occlusion of a recruitment button. Own observed claims now select their town only when no army is active, preserving friendly-army click priority and actual move/attack commands. Footer-aware scroll spacing tracks its measured height without hiding it or removing hit assertions. Corrected naval framing keeps the same zoom and strict full-canvas bounds.

The focused rerun passes 9/10, including both all-culture naval tests, every land-save query, map readability and both registry/navigation scenarios. Its remaining older gallery test needed real registry search for a paginated second-cohort surveyor; that test navigation is corrected without bypassing the 25-row cap. All new screenshots were inspected and retained: [quiet realm](../screenshots/slice18-quiet-realm-perimeter.png), [selected army range](../screenshots/slice18-selected-army-range.png), [narrow map](../screenshots/slice18-quiet-territory-narrow.png), [100-army/40-town registry](../screenshots/slice18-empire-navigation.png), [unobstructed narrow recruitment](../screenshots/slice18-production-narrow.png), [character navigation](../screenshots/slice18-character-navigation-narrow.png), [first-six navies](../screenshots/slice18-navies-first-six.png), [regional navies](../screenshots/slice18-navies-regional-six.png) and [native transport card](../screenshots/slice18-transport-roster-narrow.png).

Final frozen-source integration: **all 82 Chromium scenarios pass in 5.6 minutes, with no skips**. Full typecheck/lint/content validation/build pass. The broad suite passes 965/966 across 100 files; Epic still exceeds the unchanged 60-second limit at 71.133 seconds under parallel load. Its isolated file passes both Short and Epic in 61.13 seconds total / 60.28 seconds combined test time, retaining turn-500 continuation and both full replays; the reporter did not emit individual Epic elapsed time. This does not erase the broad-run timing failure. No timeout, turn-count, save/mirror/replay assertion or visual edge/hit gate was relaxed.

The final run retains machine-readable [36-hull ID/untinted/native-size/framing/fog evidence](0025-naval-art-inspection.json) and [quiet overlays / contextual labels / unchanged state](0025-map-overlays.json). Full explored-world screenshots are [near](../screenshots/slice18-fully-explored-near.png) and [strategic](../screenshots/slice18-fully-explored-strategic.png). The new all-culture art gallery uses shallow lanes; the separate actual naval voyage/combat scenarios verify researched deep-water transport and losses. These are scoped tests, not every possible biome/culture/naval battle presentation.

The existing /unlazy, UI-scale, renderer, simulation/QA and art-factory workflows required real player commands, frozen-source browser checks, exact replay/save evidence, native/in-game visual review and separate performance windows. The implementation remains incomplete in these respects: repetitive single-stamp terrain, fractional map pixel fit, five researched-site production sprite gaps, static ship/action/facing coverage, the previously observed narrow-menu painting artifact, fuller long-campaign strategy and the additional twelve proposed playable factions.
