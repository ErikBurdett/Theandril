# Geography, roads and spectator watch — slice 19

2026-09-06, inspected starting commit `b17900d`; schema/rules 12, physical generator 5 checkpoint (superseded for new campaigns by the generator6 follow-up), roster 3, content `3c54fb02`. This is a development checkpoint, not 1.0 acceptance. No new assets, cultures or multiplayer implementation are claimed.

## Generation

[Final raw generation measurements](../../packages/mapgen/diagnostics/v5-geography-final.json) supersede the retained [provisional measurements](../../packages/mapgen/diagnostics/v5-geography-benchmark.json). One warm reference precedes five complete generation samples for each size/layout, with normal allocation/GC and strict hydrology validation included. Diagnostic descriptions, equality/hash comparisons and a second topology validation are outside the timed interval. Node 26.7.0, Intel i9-13900K; host window reserved, no concurrent agent benchmarks or browser runs.

| Size | Continents mean ms | Islands mean ms | Archipelago mean ms |
| --- | ---: | ---: | ---: |
| Tiny | 3.905 | 3.870 | 3.346 |
| Small | 69.691 | 68.776 | 62.695 |
| Huge | 288.714 | 298.741 | 292.291 |
| Legendary | 462.679 | 452.510 | 455.581 |

All 60 final repeated fingerprints agree. Review found that the initial dense Tiny archipelago could merge its plates into one landmass (seed 74), so the pre-release generator now preserves actual sea straits between joining island plates. The independent property checks count physical nonwater components, not regions artificially separated only by impassable mountains. Seed 74 now has eight real islands; four seats start on four of them. A 160-seed Tiny/48-seat sweep had no start failures; formal full-range/property cases retain viability, fresh water and separation checks. Only the provisional Tiny archipelago geometry changed; all eleven other measured size/layout fingerprints match the retained draft. The new shared validator additionally rejects multiple-spill or non-inland freshwater lake bodies.

The five canonical Uint8Array buffers total 983,040 bytes on Huge and 1,536,000 on Legendary. These are not peak memory: generation has temporary relief, drainage and component buffers. Whole-map inspected diagnostic strips remain under `packages/mapgen/diagnostics/`; they are code-native geography evidence, not production-art approval or live renderer measurements.

Sixteen pre-change generator-1–4 array/start/feature SHA256 seals remain exact. Fourteen independently captured genuine schema-11 saves/archives retain every original save byte and full command replay seal. Migration adds empty hydrology/roads without rewriting old terrain. New-world complete archives regenerate their actual layout and reject cross-layout origins. Checksummed but malformed hydrology/road snapshots are rejected, not repaired.

## Sparse roads

[Raw road measurements](0027-roads.json), reproduced with `node --import tsx scripts/benchmark-roads.ts --output`, deliberately author identical twelve-segment hill corridors at two global map sizes. Extra initial caravans are authored; both towns per faction are founded through ordinary commands. No roads or completed work are injected. These are 64/80-town synthetic infrastructure workloads, not developed 32/40-town empires or whole-campaign benchmarks.

| Workload | Towns / active roads | Survey + first work mean / p95 ms | Active road phase mean / p95 ms |
| --- | ---: | ---: | ---: |
| Huge, 32 factions | 64 / 32 | 1.346 / 2.372 | 0.086 / 0.460 |
| Legendary, 32 factions | 64 / 32 | 1.630 / 7.993 | 0.072 / 0.196 |
| Legendary, 40 factions | 80 / 40 | 1.982 / 7.934 | 0.086 / 0.259 |

Surveying uses three warmups and twenty fresh strict-loaded snapshots per case, so later samples do not silently time an already-surveyed world. Active work times twenty production phase calls with all projects active; these are **not twenty full turns** and the turn counter stays fixed. Setup, validation, saved mirrors, hashing, final paid order and final full-turn continuation are outside the phase timers. All phases match their strict-loaded mirrors, and the ordinary final acceleration deducts its actual quoted 21 coin. Nearby thirteen-cell paths do not establish saturated 4,096-node-search throughput.

All-faction quote mean/p95 values are0.119/0.222,0.115/0.190 and0.169/0.211ms respectively. The two Legendary survey outliers around8ms remain in the raw samples; no blanket speedup is claimed. Final road JSON uses12,202/12,202/15,258bytes; complete saves use2,314,527/3,531,046/3,568,705bytes with seals `6399fd71`/`502727bc`/`5fed9789`. This final isolated run follows the attack-cost/shared-edge fixes and preserves their exact prior workload seals. [Earlier provisional run](0027-roads-provisional.json) is retained separately.

## Integration and remaining verification

The initial seven real-browser scenarios passed in 16 seconds: reversible watch fog through UI and production console API, unchanged exported history/save bytes, actual layout/river/lake inspection, bounded Huge narrow overview, player-mode rejection and paid-road saved continuation. Screenshot review prompted quieter curved river paths and continuous lake shading, replacing bright lines and repeated lake disks; the functional suite is being rerun on that source.

The first broad draft run passed1,030/1,040 tests. Genuine issues included naval spending starving victory savings and unfinished large-world exploration. Authored terrain fixtures were explicitly pinned to their historical generator instead of retaining invalid overwritten modern drainage. All89 subsequent Chromium scenarios passed in5.3minutes on frozen source. Independent review then reproduced and fixed road-assisted attack/assault disagreement with movement previews and duplicate payment on shared segments. Three failing-before regressions now pass; reuse costs nothing and waits for the next actual road phase. A separate siege regression verifies the shared cost and saved battle continuation.

The following broad run passed 1,053/1,054 tests: Epic reached 1400 before finishing its project, a real strategic failure rather than a timeout. Exact generator-5 diagnostics found it had already paid at 1368 and had 33/60 active turns at 1401. Bounded goal-aware worker allocation fixes idle developed towns favoring unused industry over actual coin savings. The final queue-aware correction produces victory from that same origin at turn 1086, with 16,038 accepted orders, 702 battles and 68 captures; this supersedes the intermediate turn-1180 experiment. Neither diagnostic run replaces the final full archived test. Generator-6 geography, continuous zoom and army grouping have separate browser/pacing measurements in the [follow-up report](0028-world-scale-readability.md). The [pre-change generated Huge rendering baseline](0028-geography-before.json) retains explicit timing/memory scope.
