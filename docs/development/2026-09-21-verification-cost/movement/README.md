# Movement query input cost — 2026-09-21

The deployed movement source is retained verbatim in `movement-before.ts.txt`, SHA-256 `d136fa29fdd482a2e20c3dbacd48fa04e1c5b479a96cbc69b418a5acad8d53cc`. The unchanged isolated Epic profile in the sibling `profile/` directory attributes about 5.03 seconds to movement previews, including 4.54 seconds in search. Those overlapping sampled totals identify a target; they are not an acceptance result.

## Implemented

- Build the existing observation geometry index in one pass. One Map of copied terrain/depth records replaces two separate Maps and their temporary entry arrays. Roads remain a separate sparse Map, filled in the same pass. Duplicate-cell behavior stays exact: final terrain/depth wins, while the last truthy road mask survives a subsequent absent/zero mask.
- Check explored terrain and domain access from one indexed record during observed traversal. The authoritative `travelTerrainBlocker` still decides land, shallow water and deep ocean access. Target previews retain the same explanatory blockers.
- Skip road-direction calculations when terrain already costs one or no road mask exists. Historical rules before version 12 continue to ignore roads.
- Derive canonical army domain and ocean capability once during each synchronous planning query. No canonical mutation occurs during planning. Every subsequent query recomputes those inputs; historical rules before version 8 still use their original blocker and wording.

The existing WeakMap lifetime and copied-geometry contract remain unchanged. No world-sized scratch, persistent capability cache, search heap, neighbor topology, tie break, cost, path, shared node budget, canonical state, schema or command policy changes. `mayEnter` still checks foreign towns and armies after terrain, including the same explicit attack target exception.

Construction stays O(explored cells + observed entities), with fewer temporary arrays and geometry Map entries. Search remains bounded by the original 4,096 expanded nodes; each geometry lookup remains expected O(1). This is an allocation argument, not a measured whole-process memory claim.

## Paired complete-query evidence

`benchmark.ts` loads the original module without swapping production source. All 22 retained detached 64×64 charts are exercised through both full queries and previews: **44 complete outputs**, including reachable-cell costs, exact paths, action/blocker strings, limited flags and expanded-node counts. Encoding, equality and fixture construction are outside timing. Every timed result equals the original complete serialized result.

`benchmark-index-warm.json` uses 150 per-case warmups and 80 alternating pairs; the existing observation index is warm. `benchmark-index-cold.json` uses five warmups and 15 alternating pairs, with a fresh detached observation before every call: cloning is excluded, index construction is included. Both retain all raw samples, CPU/Node version and exact source hashes.

| Complete query | Warm original → candidate (ms) | Fresh-index original → candidate (ms) |
| --- | ---: | ---: |
| Movement 5, full | 0.0634 → 0.0588 | 0.4714 → 0.3128 |
| Movement 5, preview | 0.0209 → 0.0189 | 0.3617 → 0.2280 |
| Shared-budget exhaustion, full | 2.9326 → 2.7294 | 3.5416 → 3.0029 |
| Weighted route, full | 0.0730 → 0.0683 | 0.3999 → 0.2558 |
| Road route, full | 0.0353 → 0.0342 | 0.3649 → 0.3158 |
| Disconnected fog, preview | 0.5726 → 0.5166 | 0.8668 → 0.6696 |
| Ocean route, full | 0.0621 → 0.0560 | 0.4190 → 0.2532 |

These measurements support cheaper observation indexing and traversal. They do not predict a campaign-wide percentage or close Epic/hosted timing gates. Canonical fleet capability hoisting is covered for equivalence, without a separate canonical speed claim.

The initial road/capability-only candidate remains in `movement-candidate.ts.txt`. `benchmark.json` retains its five-warmup sample run, including pronounced run-order/tier-up effects; `benchmark-shortcuts-warm.json` retains the adequately warmed comparison. Its gains are small, mostly 1–8%, and warm road full queries are effectively level (0.0374 → 0.0376 ms). The stronger consolidated index is the production candidate, retained exactly in `movement-index-candidate.ts.txt`; no rejected heap replacement was retried.

```sh
MOVEMENT_CANDIDATE=movement-index-candidate.ts.txt MOVEMENT_WARMUPS=150 MOVEMENT_SAMPLES=80 node --import tsx docs/development/2026-09-21-verification-cost/movement/benchmark.ts
MOVEMENT_CANDIDATE=movement-index-candidate.ts.txt MOVEMENT_COLD=1 MOVEMENT_WARMUPS=5 MOVEMENT_SAMPLES=15 node --import tsx docs/development/2026-09-21-verification-cost/movement/benchmark.ts
```

Use Node 22.23.2 for these recorded comparisons.

## Regression evidence

`canonical-before.json` was produced by `capture.ts` from the retained original movement module. It records **17** full queue-command results, exact routes and full serialized-state SHA-256 digests across rules 7/8/11/12/17, odd/even road rows and coastal/ocean/mixed fleets. These authored current-schema states strictly load before use; historical execution contexts are selected explicitly. They are not historical-save fixtures or proof of naturally earned fleet creation. The first draft synthetic geography was discarded before the final capture because it did not strictly load; the retained corpus uses validated generator-v4 land and the existing authored naval campaign instead.

`movement-query-inputs.test.ts` verifies those captured results, routes, state digests and post-command strict round trips. It also changes ocean research, fleet composition, domain and historical rules between successive queries, and verifies copied geometry plus duplicate-cell semantics. Capture mode documents original generation; do not rerun it to accept different results.

`focused-final.log`: **109/109 tests in five files**, including 19 new query-input regressions, historical complete-query fingerprints, target-preview captures, canonical travel/route interruption and naval command coverage. The earlier `focused-initial.log` records the 90-test pass for the smaller candidate and is not additive. Root owns combined typecheck, lint, full-suite, browser and campaign verification.

Final production movement SHA-256: `64318e32476fc30a3cf73629a77394a87919468ad42ab90f176d9ae4c61bba04`.

Original canonical capture SHA-256: `cd38e6f409bf76c2a2295926796b5511532e29bcf89e489a07c8b2dab4526310`.
