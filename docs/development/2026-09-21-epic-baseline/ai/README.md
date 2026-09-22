# Naval planning work used only when needed

The unchanged Epic archive gate remains parent-owned. This slice removes unused planning work while retaining complete naval proposals. It changes only `packages/ai/src/naval.ts` and adds `naval-publication-equivalence.test.ts`; movement search, navigation policy, rules, activity and test scheduling are unchanged by this slice.

## Profile and bounded change

`fresh-profile.json` reads the retained [fresh Epic CPU profile](../profile/epic-before.cpuprofile). Its overlapping inclusive samples attribute approximately 9.424 seconds to `planNaval`, 5.049 seconds to `toward`, 3.466 seconds to navigation `destination`, and 1.249 seconds to `frontierStep`. These totals cannot be added. `retained-profile.json` records the earlier pre-preview profile for comparison; its source predates the target-only movement API. `read-profile.mjs` reproduces the attribution without executing a campaign.

Previously every applicable naval plan built the shoreline sample, flooded up to 4,096 home-land nodes, created navigation knowledge and derived the coastal frontier, even when a plan had no fleet or only needed production, merging, boarding or a direct route.

The final implementation:

- Returns after the existing research/production/reservation logic when there are no eligible water fleets.
- Builds the same shoreline list and 256-objective sample on first use.
- Floods the same home-land cells once when entering the first passenger branch; landing predicates retain their original direct Set reads.
- Creates navigation only for the first exploration request, retaining one shared navigation budget for all subsequent fleets in that plan.
- Builds the same coastal frontier only on its first scoring request.

All knowledge lives inside one synchronous plan. No persistent observation-identity cache was introduced. Shore ordering, fleet rotation, tie comparators, observed predicates and each applicable search budget remain unchanged. Existing observation-index assumptions elsewhere are unchanged.

## Complete proposal and command evidence

`naval-before.ts.txt` retains the original implementation before this change, SHA-256 `797310db2da52d41d4c9f7996f2462da8dd2f3b0f3f7eff7c1ffcfc57eec3220`.

`complete-proposals-before.json` seals 36 complete original public naval results from nine genuine Epic seed 99 checkpoints (turns 1, 30, 60, 100, 200, 300, 500, 800 and 808), all four faction seats. Each entry records the retained compressed save path/hash, observation hash, purse, commands, reasons, held and queued IDs, expenditure and interruption flag. The unchanged loader migrates these real v16 saves to current rules. Each naval call receives the observed full treasury; these calls do not reproduce the overall AI's intermediate reserve calculation, and this seed is distinct from the archive gate's seed 20260905.

The capture was made before changing production source. Repeated benchmark runs compare against the existing seal rather than overwrite it. The new regression file checks all 36 complete results plus same-view held-fleet/budget changes and result detachment. All input observations remain unchanged.

`focused-final.log`: **60/60 tests pass across five files** (37 new equivalence cases plus naval, paid outlet, funding and assembly coverage), 5.01 seconds total. The original movement-preview evidence scripts also pass against this runtime:

- `naval-proposals-verify.log`: all 91 previous observation variants, 35 research/production commands and 21 founder assessments remain exact; payload SHA-256 `ceebe5c9c62b0985c986a9ba4c7e7aad6d0ddd68f3591c3e3c92e5f85585a3d3`.
- `naval-campaign-verify.log`: the authored voyage retains all eight turns, 22 accepted commands, full command results, routes and saved-state hashes. Boarding, deep sailing, landing and founding remain present; final state hash `fa29672f`, turn payload SHA-256 `4f025ff509924559e7bd6bf3508bfcc29d59befaea223437372e168f46d33661`. The original inputs/scripts/seals are in [movement-preview evidence](../../2026-09-21-campaign-continuation/movement-preview/README.md). This authored voyage demonstrates paid command/save behavior, not naturally earned campaign pacing.

The first manual runtime transplant accidentally omitted part of the boarding comparator. Exact checkpoint comparison immediately rejected a changed turn-30 ferry target (`first-runtime-equivalence-failure.log`). The complete original comparator was restored; the original seal was preserved and every final comparison passes. The failed run is not timing evidence.

## Paired measurement

Run in an exclusive CPU window with Node 22.23.2:

```sh
/home/telephoneheater/.local/share/mise/installs/node/22.23.2/bin/node --import tsx docs/development/2026-09-21-epic-baseline/ai/benchmark.ts --runtime
```

`benchmark-final.json` compares the exact current runtime naval source with the retained original. The two modules share identical dependencies. Each real observation receives two warmups and eight alternating samples per side. Loading, independent complete-result checks, query instrumentation and JSON/hash work are outside timing. These are repeated observations, not campaign wall-clock results.

| Real checkpoint / faction | Fleet / passenger armies | Original median (ms) | Final median (ms) |
| --- | --- | ---: | ---: |
| Turn 30, Cinder March | 0 / 0 | 0.161 | 0.030 |
| Turn 30, Ashen Compact | 1 / 0 | 0.376 | 0.149 |
| Turn 30, Reedbound Council | 1 / 0 | 0.619 | 0.469 |
| Turn 30, Glass Tide | 1 / 0 | 0.214 | 0.065 |
| Turn 300, Reedbound Council | 2 / 1 | 2.981 | 3.443 |
| Turn 300, Cinder March | 4 / 2 | 1.602 | 1.532 |

The sum of the 36 case medians is 36.391 → 34.730 ms, a modest 4.6% decrease for this corpus, **not a campaign improvement percentage**. Early plans and those without passengers improve clearly. Late passenger cases are mixed, including the disclosed slower Reedbound case; no uniform per-plan speedup is claimed. The original tool-only prototype and its first measurement remain in `naval-lazy-first.ts.txt` and `benchmark-first.json`.

## Repeated target-query investigation

`preview-counts.json` retains tool-only per-plan/per-army counts, target cells and expanded nodes. Across these 36 plans there are 56 preview queries for 39 distinct plan/army pairs: 17 repeated queries. They repeat 996 preliminary range expansions out of 2,890 total range expansions; target searches expand another 20,204 nodes. Reusing those ranges could remove about 4.3% of total sampled range-plus-target expansions, before overhead. This evidence did not justify adding a more complex preview-session API in this slice. No runtime query cache was added.

The instrumentation performs one additional public range query per plan/army outside timing, and verifies its instrumented proposal equals the uninstrumented original. It is diagnostic only and does not alter canonical gameplay.

## Frozen evidence

| Artifact | SHA-256 |
| --- | --- |
| Final `packages/ai/src/naval.ts` | `fbefc7cbf38f58e84c8711a55dd9becee9b68774ce2ac4fde6b3da5005310cb6` |
| `naval-publication-equivalence.test.ts` | `2071a488603f338fdd47c713b62c4cecf9f752065235dbec8b8bc0ed2a883414` |
| `complete-proposals-before.json` | `771ffd41b4a3ee1a2784eba7fc3d4628722527b258942e63dfa7487c565ef1d4` |
| `benchmark-final.json` | `1815ccfe327afe15242b35b4b4821d522c7d7c78d2e7042e7443538c895cfa5d` |

Scoped whitespace checks pass. Parent integration owns typecheck/lint, unchanged generated contact gates, full suite, build, and the final Epic archive acceptance result. No claim here closes M0 or a broader 1.0 gate.
