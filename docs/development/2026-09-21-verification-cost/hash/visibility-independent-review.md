# Independent visibility review

Reviewer: hash-cost subagent, separate from the parent implementation author.
Read-only review of `packages/sim/src/visibility.ts` against
`../visibility/visibility-before.ts.txt`, plus the captured lifecycle corpus,
unit test and paired benchmark harness. No tests were run during the parent's
measurement window.

**No runtime correctness blocker found.** `changeSight` already constructs the
ordered local disk; returning that array and reusing it inside the same call
removes two identical breadth-first traversals on modern positive updates. The
array is neither stored nor exposed to another operation. There is no new cache,
cross-turn dependency or full-world scan.

The phase order remains: finish every visibility/exploration update, then finish
every land-memory update, then finish every road-memory update. These loops were
not combined, so relative publication and exception ordering stay intact. The
land/road helpers read geography and update only remembered records; neither
changes world dimensions, radius, origin or disk membership. Negative updates
still change only source counters. The version-9 and version-12 publication
gates, transported-source exclusions, claim sight and missing-owner rejection
are unchanged. `rebuildIndexes` ignores the newly returned array and otherwise
retains its original behavior.

The 32 captured lifecycle cases cover eight historical update gates, corners,
edges, zero radius and interior disks, including duplicate positive sources and
their separate departures. They compare canonical save bytes and visible source
counts in addition to explored and memory maps. Their scope is correctly labeled
as modern generated geography under old update gates, not genuine old saves.
The benchmark compares complete positive/negative update pairs with equal final
save bytes and visible counters; it does not time just the removed disk helper.

**Coverage correction resolved.** `makeGame()` initially has no towns, biome
overrides or roads, so the original 32 captured cases exercise empty land/road
memory maps. The author preserved these frozen captures and corrected the
additional traversal test by creating explicit nondefault biome and road
overlays. Five new cases at rules 8, 9, 11, 12 and 17 verify the publication
boundaries: overlapping positive sight gains remember the permitted layers,
removing the underlying overlays and departing preserves the old memories,
exploration remains recorded, and a later arrival refreshes/deletes those
memories. These are honestly labeled helper fixtures; existing road/territory
scenarios own paid construction legality. The retained
[`focused-verified.log`](../visibility/focused-verified.log) passes **83/83 tests
in five files**. The earlier failure logs remain as historical evidence.

The complete positive/negative sight-pair benchmark reports modern radius-three
median **0.009499 → 0.006305 ms**, and radius-one **0.001356 → 0.001119 ms**.
It also discloses the legacy rules-4 radius-three sample's small regression,
**0.004498 → 0.004780 ms**; rules 4 perform no land/road refresh and therefore
avoid no repeated disks. No broad campaign claim follows from these small
isolated samples. Exact sample arrays and final state/counter equality are in
[`benchmark.json`](../visibility/benchmark.json).

Final review disposition: **no blocking finding after the fixture correction**.
Parent integration still owns typecheck, lint, broad historical verification
and the unchanged full-suite performance gate.
