# Independent movement scratch-storage review

Verdict: no blocking finding in the incremental candidate. The retained scoped run passes 92/92, and all 44 paired full-query/preview cases retain exact output. Query-level improvements are modest and mixed; this is not an Epic or release acceptance result.

## Exact scope

The comparison uses this prompt's retained [movement source](../movement/movement-before.ts.txt), SHA-256 `055e490457a30c376511f513d34f1f9e8a7bbf6e832aa7345ef796c9a8e0ab77`, matching [the starting manifest](../baseline.json) and the prior continuation's frozen source. Git HEAD predates earlier authorized work and is not this candidate's baseline. Existing cost pruning and the target-only preview API are already present in the retained baseline.

The incremental change exports `neighborsInto` from map generation, uses one search-local scratch array for neighbors, and omits the predecessor map when `target === undefined`. It adds no cache, budget adjustment, new route policy, campaign-state field or save migration.

Reviewed candidate hashes:

| File | SHA-256 |
| --- | --- |
| `packages/mapgen/src/index.ts` | `3edf13ec85b8f77600856263dd7563aad80b6d3c8c5f7e55c3389850ddea1f62` |
| `packages/sim/src/movement.ts` | `d136fa29fdd482a2e20c3dbacd48fa04e1c5b479a96cbc69b418a5acad8d53cc` |
| `packages/mapgen/src/neighbors-into.test.ts` | `0689c5ded438fc90509c2d51abdbcc592a701ed1e1067c000b439ee48b9e1a79` |
| `movement/benchmark.ts` (final harness, including optional evidence-only heap experiment) | `1568b2ab0b6a4aec22cfea34483b36c3f0207a777c7a1f3c1aa51d3127f66be1` |

## Correctness reasoning

- At `packages/mapgen/src/index.ts:112`, `neighborsInto` uses the same integer/range predicate and the same existing `writeNeighbors` implementation as `neighbors`. Clockwise order, row parity, nonwrapping edges and malformed-coordinate acceptance therefore agree. Invalid coordinates clear the supplied array. The original allocating API is unchanged.
- At `packages/sim/src/movement.ts:90`, the scratch buffer belongs to one `search` invocation. Neither the buffer nor its iterator is returned, stored on the knowledge object, or passed to terrain/occupant callbacks. Each loop consumes it before the next overwrite. A nested independent query has its own buffer. Returned routes and reachable results retain independently owned arrays.
- At `packages/sim/src/movement.ts:89`, the predecessor map is omitted only for a range search. Path reconstruction already requires `target !== undefined`; range callers consume costs and limits, not predecessors. Targeted and appended routes retain the original map writes and predecessor walk, including the 256-cell limit.
- Heap insertion, ties, current-cost checks, popped-node charging, shared range/preview budget and result construction are unchanged from the retained baseline. So are observed/canonical knowledge construction, fog restrictions, blockers, attack handling, road costs and historical rules. The pre-existing observation index remains as before; this candidate adds no result cache or new assumption about caller mutation.
- The scratch array retains at most six neighbor entries per search. Removing range predecessors eliminates an otherwise unused map proportional to the cells discovered. Costs and frontier storage are retained, with no reduction in visited work or node budgets.

## Evidence assessment and remaining checks

The new topology tests compare every cell over narrow and ordinary dimensions, both parities and all edges. They assert buffer identity, replacement of prior contents, independent results from the allocating API, and matching empty results for negative/out-of-range/fractional/NaN/infinite coordinates or dimensions.

The paired harness loads the exact retained movement module beside the candidate, sharing unchanged dependencies. It checks complete serialized output and input nonmutation for both APIs across the retained 22-case corpus, giving 44 comparisons. It excludes setup and JSON verification from timing and alternates invocation order after warmup. This is a synthetic detached-chart benchmark; it does not establish campaign throughput or browser frame time. Map generation's existing `neighbors` and `writeNeighbors` bodies are unchanged, so sharing that dependency does not substitute the new scratch API into the baseline.

The existing movement-search equivalence test separately retains pre-pruning complete-query goldens. The preview corpus covers budgets, weighted/road paths, fog gaps, hostile and peaceful occupants, foreign towns, movement blockers, appended/paused paths, and shallow/deep-water behavior. Ordinary movement/naval and historical replay tests remain necessary for integration; a synthetic corpus is not a paid campaign demonstration.

The parent-retained [focused log](../movement/focused.log) passes **92/92 across five files** in 940 ms. Its SHA-256 is `bb925e59a3ddfca25404ae266fba4179d4590917c9c7e16e383935c613f6d317`. The movement, mapgen and topology-test source hashes above remain unchanged after this run.

The [paired production results](../movement/benchmark-allocations.json) match [the initial result](../movement/benchmark.json) byte for byte, both SHA-256 `ee2d4471c9658a85901eff64140a960f918bd431ea7920bb2adfa98ca70b0fe4`. They record Node 22.23.2 and the exact baseline/candidate movement hashes above. All 44 cases have forty samples per side after warmup. For example, the movement-200 full-query median changes from 2.8608 to 2.7733 ms, and its preview from 1.0212 to 0.9631 ms. Movement-5 full-query medians are effectively unchanged (0.1075 to 0.1071 ms); movement-2 preview is slightly slower (0.0122 to 0.0131 ms). These bounded results support modest allocation-path improvements, not a universal speedup or measured whole-process memory saving.

The final harness uses the public simulation entry to avoid the initially encountered leaf-import initialization cycle. Its optional parallel-array heap candidate is confined to the evidence loader; the production source hash remains the reviewed allocation-only candidate. A read-only search found no imports of that experimental source in packages, apps, tests or scripts. The rejected experiment supplies no production performance claim.

No tests or benchmarks were executed by this reviewer during the reserved CPU windows; the results above were checked against retained parent-run artifacts. Full-suite timing, browser integration and final acceptance remain separate parent-owned checks.
