# Movement search allocation — 2026-09-21

This is an incremental change from the preceding continuation's frozen movement source `055e490457a30c376511f513d34f1f9e8a7bbf6e832aa7345ef796c9a8e0ab77`. That baseline already includes the earlier cost pruning and target-preview API. It is retained in `movement-before.ts.txt`; the map geometry source is retained in `mapgen-before.ts.txt`. Comparing this pass only with Git HEAD would incorrectly include both prior prompts.

## Implemented

`neighborsInto` uses the original coordinate predicate and clockwise topology writer with a caller-owned array. A movement search owns one such buffer and reuses it after consuming each node's neighbors. It does not retain that array in the heap, results or state. The existing allocating `neighbors` API and generation callers are unchanged.

Range-only searches omit the predecessor map because they never reconstruct a target path. Targeted searches keep every original predecessor update. Both searches still insert/pop the same heap nodes, charge the same shared budget, inspect the same fog/occupancy/terrain and return the same complete results. No topology, travel rule, tie order or schema changes.

Temporary neighbor storage is bounded by six entries per search, replacing one small allocation per expanded node. Range searches also avoid predecessor entries proportional to discovered nodes. This is an allocation argument, not a measured whole-process peak-memory improvement.

## Paired evidence

`benchmark.ts` loads the retained original module without replacing runtime source. Five warmups and forty alternating sample pairs cover the original 22 detached 64×64 charts through **both** full queries and target previews. Each complete output matches the original serialized result; input nonmutation is checked. Setup, equality and encoding are outside timing. [Raw allocation-only samples](benchmark-allocations.json) and [the matching initial result](benchmark.json) retain Node 22.23.2, CPU and source hashes.

| Synthetic chart / query | Original median | Candidate median |
| --- | ---: | ---: |
| Movement 5, full query | 0.1075 ms | 0.1071 ms |
| Movement 5, target preview | 0.0242 ms | 0.0222 ms |
| Movement 200, shared-budget full query | 2.8608 ms | 2.7733 ms |
| Movement 200, shared-budget target preview | 1.0212 ms | 0.9631 ms |
| Disconnected fog, target preview | 0.5295 ms | 0.5279 ms |
| Deep-water route, target preview | 0.0231 ms | 0.0213 ms |

These are modest query-level gains, not campaign or renderer performance. The initial harness imported the movement leaf before the simulation barrel and hit an existing module-initialization cycle; importing the public simulation entry first corrected the tool harness. No production import order was changed to accommodate it.

An additional parallel-array heap was evaluated only in the temporary benchmark module. [Candidate source](movement-heap-candidate.ts.txt) and [samples](benchmark-heap.json) remain retained. Its small/noisy incremental gains did not justify replacing the production heap. **It is not imported by the game.** The generic harness can reproduce that experiment with `MOVEMENT_CANDIDATE=movement-heap-candidate.ts.txt`; the normal invocation measures production.

```sh
/home/telephoneheater/.local/share/mise/installs/node/22.23.2/bin/node --import tsx docs/development/2026-09-21-epic-baseline/movement/benchmark.ts
pnpm exec vitest run packages/mapgen/src/neighbors-into.test.ts packages/sim/src/movement-search-equivalence.test.ts packages/sim/src/movement-preview.test.ts packages/sim/src/movement.test.ts packages/sim/src/naval.test.ts
```

## Verification

The focused run passes **92/92 across five files** in 940 ms: [raw log](focused.log). It includes complete captured old movement results, preview equivalence, shared-budget exhaustion, paid naval behavior, and all hex boundaries/parities on narrow and larger grids. Invalid dimensions/cells clear reused buffers exactly as the allocating API returns an empty array. These tests overlap broader integration and are not additive.

The [independent source review](../review/movement.md) found no blocker in the incremental change. Full-suite timing, browser integration and final factual acceptance remain parent-owned checks; neither this benchmark nor its focused pass closes M0.
