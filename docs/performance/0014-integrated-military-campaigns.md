# Integrated generals, fleets and complete campaigns

Final canonical measurements: save schema **8**, content **`257e1e91`**, generator **3**, archive **2**. The [retained raw JSON](0014-integrated-military-campaigns.json) contains the sequential scale, geography and complete-campaign outputs, plus the rounded browser console summary. These supersede the hypothetical pricing seals in [the pacing investigation](0013-pacing-diagnostics.md); that investigation's failed trials remain evidence, not current balance claims.

Offline runs began at 04:10:00 / 04:11:15 / 04:11:18 UTC on 2026-09-06 (2026-09-05 locally). Hardware/runtime: Intel Core i9-13900K, Linux `7.1.9-arch1-2`, Node `v26.7.0`. The host was reserved: no browser or other test/benchmark workload ran concurrently. The later browser measurement had its own reserved window. This is a development workstation, not a mainstream-device release claim. GPU identity and retained-memory profiles were not captured by these offline scripts.

Reproduce from the repository root:

```sh
pnpm bench
node --import tsx scripts/benchmark-naval-geography.ts
pnpm bench:chronicles
```

The [scale runner](../../scripts/benchmark.ts), [movement runner](../../scripts/benchmark-movement.ts), [geography runner](../../scripts/benchmark-naval-geography.ts) and [archive runner](../../scripts/benchmark-chronicle.ts) define the timing boundaries below. Default seed is `20260905` throughout. No additional measurements were run while preparing this report.

## Four 100-round giant-map workloads

Huge is 196,608 cells / 32 factions; Legendary is 307,200 cells / 40 factions. Young cases begin at generation. Mature cases are explicitly synthetic: a founded town and 100,000 coin per seat, plus 1,500/4,000 co-located singleton armies, validated through save/load before ordinary commands begin. Four authored cultures are reused across the stress seats.

Each case executes 100 rounds, compares the final 50 rounds' command results/events with a midpoint save, and verifies the final state hash after canonical serialization. All proposals are legal: **zero rejected commands**. Terminal project proposals are deliberately deferred only in these fixed-length cases. Capture decisions use real `occupy` commands; they are not the full AI capture-choice benchmark. No archive, browser, compression or IndexedDB transaction is included.

| Setup | Initial armies / formations | Final armies / formations | Largest final army | Final towns | Timed non-end-turn commands | Scenario setup |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Huge young | 64 / 64 | 427 / 652 | 7 | 201 | 23,619 | 88.750 ms |
| Huge mature | 1,500 / 1,500 | 673 / 1,528 | 12 | 180 | 30,558 | 195.707 ms |
| Legendary young | 80 / 80 | 535 / 823 | 9 | 252 | 29,471 | 100.761 ms |
| Legendary mature | 4,000 / 4,000 | 1,706 / 4,034 | 13 | 219 | 62,564 | 322.952 ms |

Merging reduces containers without erasing their formations. The mature workload therefore does not remain 1,500/4,000 separate moving containers for all 100 rounds. Setup timing includes simulation/fixture construction and, for mature cases, the validation roundtrip; it is not pure map-generation time. The command-count column excludes the additional 100 end-turn commands.

| Setup | AI including observations, mean | Command resolution, mean | End turn, mean / maximum | Combined measured round, mean |
| --- | ---: | ---: | ---: | ---: |
| Huge young | 55.962 ms | 14.327 ms | 0.733 / 1.994 ms | 71.022 ms |
| Huge mature | 46.386 ms | 9.552 ms | 0.821 / 1.696 ms | 56.759 ms |
| Legendary young | 69.687 ms | 16.791 ms | 0.785 / 2.256 ms | 87.264 ms |
| Legendary mature | 119.662 ms | 19.209 ms | 1.690 / 3.270 ms | 140.561 ms |

These are means over 100 rounds, not p95 values. The combined column sums the measured AI/read-model, command-execution and end-turn intervals; it excludes separate mirror execution, periodic hashes, saves and surrounding harness work. AI/read-model construction dominates, especially in Legendary mature. The following instrumented phase means are nested inside end turn, not extra costs to add to the combined column:

| End-turn phase, mean ms | Huge young | Huge mature | Legendary young | Legendary mature |
| --- | ---: | ---: | ---: | ---: |
| Sieges | 0.0059 | 0.0035 | 0.0047 | 0.0032 |
| Settlements | 0.2506 | 0.1398 | 0.2657 | 0.1623 |
| Upkeep | 0.1085 | 0.1851 | 0.1046 | 0.4662 |
| Characters | 0.1854 | 0.1417 | 0.2196 | 0.1631 |
| Movement refresh | 0.1471 | 0.3186 | 0.1642 | 0.8635 |
| Queued travel | 0.0015 | 0.0017 | 0.0015 | 0.0018 |
| Diplomacy | 0.0046 | 0.0031 | 0.0032 | 0.0044 |
| Progression | 0.0022 | 0.0014 | 0.0015 | 0.0013 |

| Setup | Canonical save / load | Save bytes | Full one-seat observation bytes | Final seal |
| --- | ---: | ---: | ---: | --- |
| Huge young | 57.801 / 139.451 ms | 3,425,172 | 586,126 | `435c1882` |
| Huge mature | 47.885 / 124.009 ms | 2,990,337 | 538,161 | `6cbbb81e` |
| Legendary young | 91.869 / 198.512 ms | 4,971,489 | 762,019 | `0f01f3be` |
| Legendary mature | 80.439 / 194.579 ms | 4,780,603 | 689,636 | `a4122797` |

Save/load are single final canonical snapshot measurements, not archive-envelope or disk latency. One-seat observation sizes are JSON payload estimates, not measured browser transfer latency. Each case retains the normal 20-report HUD limit; total battles across these 100 rounds were not separately counted. Raw heap samples span 34–261 MiB, include resumed copies and uncollected temporaries, and establish neither peak nor retained-memory bounds.

Compared with [the schema-7 character checkpoint](0008-characters-and-missions.md), combined means rise from 54.671 / 50.073 / 66.831 / 120.315 ms to 71.022 / 56.759 / 87.264 / 140.561 ms: **29.9% / 13.4% / 30.6% / 16.8%**. These are real observed increases, not a performance improvement. New fleet/command rules, fuller observations, changed decisions, and different final container/formation/town counts mean this is not an isolated attribution to one code change. The strongest next profiling target is the AI/observation path; the report does not claim that changed workload explains away the regression.

## Path previews and 512 simultaneous journeys

These are separate, fully explored, two-faction giant worlds. A scout previews an 18-edge path; 512 authored guards then receive real queued-movement commands from the same origin to that destination. There is no enemy intervention or AI planning. Every guard arrives, every route clears, and all 20 subsequent end-turn results/events/hashes match a saved mirror.

| Measurement | Huge | Legendary |
| --- | ---: | ---: |
| Full observation construction | 8.923 ms | 12.135 ms |
| Cold path query | 25.063 ms | 40.001 ms |
| Cached range median / p95, 120 samples | 0.070 / 0.075 ms | 0.071 / 0.078 ms |
| Cached route median / p95, 120 samples | 0.088 / 0.094 ms | 0.089 / 0.101 ms |
| Reachable cells / route expanded nodes | 84 / 104 | 90 / 110 |
| Capped far query, 4,096 nodes | 3.083 ms | 2.811 ms |
| Submit 512 real queued orders | 132.540 ms | 128.774 ms |
| Active travel phase median / p95, five turns | 71.610 / 77.129 ms | 72.943 / 74.772 ms |
| Full end turn median / p95, all 20 turns | 0.197 / 77.586 ms | 0.247 / 75.122 ms |
| Saved queued-state bytes | 3,169,194 | 4,879,789 |
| Final seal | `82e79c7e` | `4de412c7` |

Only **five** of the 20 turns contain active routes. The all-turn travel medians of 0.0023/0.0025 ms mostly describe completed/idle travel and must not be presented as the active 512-army cost. The cached route timing includes its deterministic result comparison; range timing does not. Timed end turns exclude the separately executed mirror/hash checks. Far queries explicitly report the existing search limit rather than pretending to reach the other faction's start. This workload does not measure naval pathfinding or an invasion.

## Deterministic shallow/deep geography

Seven warmed samples after two warmups; correctness checks, component scans and JSON encoding are outside the timed generation/depth calls. The generic script's conservative “no claim of isolated host” text remains in the raw output; this particular run was performed in the reserved offline window recorded at the top of the combined JSON.

| Geography | Huge / 32 starts | Legendary / 40 starts |
| --- | ---: | ---: |
| Land / shallow / deep cells | 100,499 / 3,768 / 92,341 | 157,245 / 4,786 / 145,169 |
| Passable land adjacent to water | 1,952 | 2,498 |
| Whole generation median / p95 | 48.645 / 55.735 ms | 69.675 / 75.320 ms |
| Depth derivation median / p95 | 7.217 / 12.786 ms | 11.176 / 15.539 ms |
| Depth array / bounded queue bytes | 196,608 / 786,432 | 307,200 / 1,228,800 |
| JSON depth-array bytes | 393,217 | 614,401 |
| All-water components / largest | 2 / 96,052 cells | 2 / 149,711 cells |
| Shallow-only components / largest | 4 / 3,631 cells | 3 / 4,613 cells |
| Water-depth fingerprint | `cbbea0e5` | `c922fb2b` |

Version-1/2 terrain, fertility and starts remain identical; version-2 biomes also match version 3. The shelf is a bounded two-water-hex distance from physical land, not hydrology or real bathymetry. Multiple shallow components demonstrate that a coast-only fleet is not promised global access. These are geography measurements, not shipping throughput.

## Five actual archived victories

Every faction uses normal observation-only AI; no victory proposal is deferred. Each complete canonical campaign/envelope restores, compressed export/import retains identity, and full command replay reaches the same final seal. The archive runner begins at turn 1: **victory on turn 1,111 means 1,110 completed rounds**, not 1,111 end-turn operations. These cases are generated starts, not mature synthetic empires.

| World / pace / seats | Victory turn / rounds | Orders / events / archived battles | Mean recorded round | Winner towns | Final seal |
| --- | ---: | ---: | ---: | ---: | --- |
| Tiny Short / 4 | 44 / 43 | 567 / 1,616 / 9 | 5.049 ms | 4 | `6edfb093` |
| Huge Short / 32 | 42 / 41 | 4,565 / 17,130 / 7 | 58.342 ms | 4 | `2e4772f9` |
| Legendary Short / 40 | 42 / 41 | 5,771 / 22,300 / 3 | 80.587 ms | 5 | `5fdc3caa` |
| Tiny Standard / 4 | 251 / 250 | 5,225 / 14,718 / 275 | 9.772 ms | 8 | `7c4420a3` |
| Tiny Epic / 4 | 1,111 / 1,110 | 21,176 / 61,057 / 1,116 | 12.093 ms | 27 | `4e68cc88` |

All five have zero refused orders. Orders here include end-turn and tactical/capture decisions, unlike the fixed-length scale runner's non-end-turn count. Recorded-round timing includes actual commands, archive records/events/battles and end-turn hash checkpoints. It excludes final save/load, compression, log generation, full replay, disk operations and rendering. Main seat-planning timing components, divided by completed rounds, are:

| Case | AI planning | Observation construction | Commands and archive |
| --- | ---: | ---: | ---: |
| Tiny Short | 1.851 ms | 0.810 ms | 2.379 ms |
| Huge Short | 11.130 ms | 6.272 ms | 40.891 ms |
| Legendary Short | 13.128 ms | 7.884 ms | 59.520 ms |
| Tiny Standard | 4.699 ms | 1.605 ms | 3.353 ms |
| Tiny Epic | 5.735 ms | 1.939 ms | 4.293 ms |

The measured total also includes harness/control-loop work and fresh capture-choice planning; it is not defined as exactly the sum of these three columns. The full Epic campaign's measured loop is 13,423.049 ms, not a prediction of human or UI watch duration.

| Case | Envelope save / load | Gzip export / import | Both logs / full replay |
| --- | ---: | ---: | ---: |
| Tiny Short | 2.712 / 22.135 ms | 27.930 / 28.257 ms | 13.382 / 83.855 ms |
| Huge Short | 58.199 / 418.739 ms | 510.260 / 441.207 ms | 249.180 / 2,171.991 ms |
| Legendary Short | 83.609 / 583.114 ms | 771.804 / 664.331 ms | 392.916 / 3,219.384 ms |
| Tiny Standard | 17.495 / 57.143 ms | 121.715 / 80.121 ms | 105.344 / 878.268 ms |
| Tiny Epic | 80.147 / 211.579 ms | 480.580 / 408.644 ms | 495.634 / 4,606.334 ms |

| Case | Envelope / gzip bytes | Technical / history bytes | Chapters |
| --- | ---: | ---: | ---: |
| Tiny Short | 507,940 / 47,061 | 700,579 / 31,966 | 46 |
| Huge Short | 7,695,627 / 485,107 | 16,165,544 / 213,395 | 44 |
| Legendary Short | 10,837,357 / 614,777 | 23,667,927 / 261,261 | 44 |
| Tiny Standard | 4,543,527 / 390,496 | 7,249,545 / 316,948 | 253 |
| Tiny Epic | 19,801,442 / 1,690,022 | 33,360,327 / 1,384,215 | 1,113 |

Epic records 27 paid characters, 37 assignments, 448 mission starts, 427 completions, 69 earned promotions, 159 Rallies, 228 recoveries and five deaths; 22 living characters and five memorials remain. Its 630 conquest notifications are **not** 630 distinct captures: the retained exact-command diagnostic counts 315 captures. Public event delivery duplicates many warfare notifications by participant. The independent [headless archive regression](../../tests/headless/chronicle-victory.test.ts) additionally verifies turn-500 continuation and both complete-archive and downloaded-technical-record replay, with the unchanged 800–1,400-turn gate. The full canonical unit suite passed 560 tests across 59 files at this checkpoint.

Post-case raw heap samples are 62 / 198 / 468 / 451 / 335 MiB. They include documents, restored states and parsing/replay temporaries in one sequential process; no forced collection or retained-memory/peak proof was performed. Envelope timings do not benchmark incremental local autosave or browser disk latency. The 64 MiB portable campaign policy still applies.

**The thousand-turn result is Tiny/four factions. The giant archived victories are Short/41 rounds. Neither proves a 1,000-turn Huge/Legendary mature campaign.** Compared with schema 7's 868-turn Epic, the final case has different pricing, decisions, 1,110 rounds and larger logs; its higher mean recorded round and 19.8 MB envelope are not a like-for-like microbenchmark.

## Combat reference workloads

The unchanged 200-sample twelve-versus-twelve kernel case uses the original colonist/scout/guard trio: median 0.399 ms, p95 0.470 ms, maximum 1.347 ms. It is not the new twenty-versus-twenty or loaded-fleet workload; those separate final-content measurements and cargo conservation proof are in [the military cohort report](0012-armies-fleets.md).

Fifty real blockade/assault/capture/peace cases preserve a capture-decision save and 11-turn continuation: assault median/p95 0.245/0.296 ms; paid peace package 0.024/0.037 ms, including separately applied mirror commands. Final seal `1ef40987`. Setup is excluded from assault timing. These numbers do not substitute for campaign battle composition or naval-retreat tests.

## Separate browser renderer measurement

The final sealed-content Chromium `151.0.7922.173` suite passed **all 49 scenarios in 2.7 minutes**, including the separately measured renderer scenario and new general/fleet controls, with no reported browser errors. Reproduce the renderer workload with the real [art-performance scenario](../../tests/gameplay/art-performance.spec.ts):

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium pnpm exec playwright test tests/gameplay/art-performance.spec.ts
```

Workload: synthetic fully explored Huge, 196,608 cells, 32 factions, 1,500 global armies and 32 towns. Current entity visibility still obeys fog. No turn advances; this is not a mature strategic throughput test. Each stage waits for more than 60 additional rendered frames. All camera stages preserve `dbae7323`.

| Stage | Drawn terrain cells | Cached chunks | Visible entity sprites | Pooled sprites | Rolling frame p95 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Static | 2,304 | 9 | 48 | 2,352 | 16.8 ms |
| Near static faction poses | 2,304 | 9 | 48 | 2,352 | 16.8 ms |
| Six camera drags | 1,024 | 11 | 0 | 2,864 | 16.8 ms |
| Far panned view | 2,304 | 16 | 0 | 4,144 | 16.7 ms |
| Far home aggregates | 2,304 | 16 | 2 | 4,144 | 16.7 ms |

The single 1024² foundation page remains **4,194,304 RGBA bytes**; PNG SHA-256 `59bfd5e96f75f235bbe528b416a8bfb25e44f9965f7a002cb3440afd252e3b90` is unchanged. First art loading is 251.1 ms; first render CPU submission is 28.2 ms. These are distinct measurements, not added GPU frame time. Qualified faction poses are static; the far home view groups them into two heraldic markers.

Initial observed-world transfer is **16,499,620 bytes**, versus 13,375,621 in [the faction-art checkpoint](0010-faction-art.md): **3,123,999 bytes / 23.4% larger**. The new depth/read-model data have not solved the object-expanded transfer cost. Viewport bounds and rolling frame p95 remain stable in this sample, but it does not saturate the 64-chunk cache, measure DOM and GPU peak residency together, or establish mobile/cross-browser performance. The map's 4 MiB atlas estimate does not include a separately decoded DOM atlas, chunk textures or all renderer resources.

The retained JSON's browser section is the rounded console summary, not the full per-entity test attachment. Separate player-facing evidence includes the [twenty-formation battle](../screenshots/slice11-twenty-formation-battle.png), [wounded general at narrow width](../screenshots/slice11-wounded-general-narrow.png), [marshal-led fleet](../screenshots/slice11-marshal-led-fleet.png), [passenger losses](../screenshots/slice11-passenger-losses.png) and [narrow transport landing controls](../screenshots/slice11-transport-landing-narrow.png). These screenshots are functional/visual evidence, not added performance samples.

## Remaining scale and release limits

The evidence separates current strengths from unfinished gates: legal giant-map command loops and saved mirrors, actual long generated campaigns with complete factual logs, bounded queries and viewport rendering all work in these workloads. AI/read-model costs increased; initial giant observation transfer is still large; active shared-destination travel takes about 72 ms; full logs/replay allocate substantial temporary state. No sustained retained-memory proof, thousand-turn giant mature archive, hierarchical routing, persistent naval theater/invasion logistics, full difficulty behavior or cross-browser release coverage is established here. Longer funding and one Prosperity path do not prove sufficient long-campaign strategic variety or complete Theandril 1.0.
