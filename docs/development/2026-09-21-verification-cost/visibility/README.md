# Reuse a sight update's local disk

The positive sight update already computes an ordered local hex disk before
refreshing remembered land and roads. It now passes that same array to both
refresh phases, eliminating two identical breadth-first traversals for modern
rules. All visibility changes still finish before all land changes, followed by
all road changes. Negative updates and the rules-9/rules-12 publication gates
retain their behavior. No persistent cache or schema change is introduced.

[`visibility-before.ts.txt`](visibility-before.ts.txt) retains the original source.
[`capture.ts`](capture.ts) and [`corpus.ts`](corpus.ts) produced the frozen
[`baseline.json`](baseline.json) before the runtime edit. The regression compares
32 complete visibility lifecycles across eight rule versions, four positions and
radii, overlapping arrivals and separate departures. It checks source counters,
explored cells, memories and serialized save bytes. These are generated modern
worlds under historical update gates, not historical saves or earned campaigns.
The frozen corpus has empty memory maps; five additional authored overlay cases
exercise land/road publication, retained departing memories and later refresh.
One bounded-work case checks that radius-three publication traverses the disk
once. Missing owners still reject without publishing changes.

The final [focused verification](focused-verified.log) passes **83/83 tests in
five files**, including existing observation, land and road scenarios. Earlier
[`focused.log`](focused.log) and [`focused-final.log`](focused-final.log) retain
the corrected import-path error and empty-fixture expectation failure. They are
not passing evidence. The independent [review](../hash/visibility-independent-review.md)
found no remaining blocker after the fixture correction.

[`benchmark.ts`](benchmark.ts) compares the complete positive/negative sight
pair in the original and candidate modules. It uses independent generated Tiny
games with authored biome/road overlays, 100 warmups and 20 alternating pairs of
200 lifecycles. Serialized bytes and visibility counters are equal after every
case. [Raw samples](benchmark.json) show rules-17 radius-three median
**0.009499 → 0.006305 ms** and radius-one **0.001356 → 0.001119 ms**.
The rules-4 radius-three sample regresses **0.004498 → 0.004780 ms**; those rules
do not perform either memory refresh. These are small local measurements and do
not establish a whole-campaign improvement or clear the Epic gate.

Reproduce from the repository root with Node 22.23.2:

```sh
pnpm exec vitest run packages/sim/src/visibility-publication-equivalence.test.ts packages/sim/src/legacy-growth-visibility.test.ts packages/sim/src/observation-publication-equivalence.test.ts packages/sim/src/land-queries.test.ts packages/sim/src/roads.test.ts
pnpm exec tsx docs/development/2026-09-21-verification-cost/visibility/benchmark.ts
```

Use the exact file list in `focused-verified.log` if test filenames move. Do not
regenerate the frozen baseline with the candidate implementation.
