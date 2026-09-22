# Navigation destination selection cost — 2026-09-21

The deployed source is retained in `navigation-before.ts.txt` (SHA-256 `51b5e54c26caa6f7ae3fcb3fa24abcfe015f07d8bf0a599a0c747f68d3c799fa`). This is a separate incremental optimization after the movement/visibility candidates; the benchmark shares their current dependencies on both sides. It does not attribute their gains to navigation.

## Change and equivalence boundary

`destination` previously sorted every scored reachable cell to consume only the first candidate. The new implementation extracts that same comparator unchanged, then scans for its minimum when there is no `explorationTieBreak` callback and each cached score component plus their sum is finite. This is O(R) selection rather than O(R log R) sorting for R candidates.

The original range, visibility filters, information gains, candidate construction and strategic/exploration callback evaluation order are untouched. The comparator still orders combined score, optional exploration tie, cost, salted cell tie and cell ID. A minimum scan updates only for a strictly earlier candidate, preserving the original stable winner on equality.

Optional comparator callbacks retain native sort, including their original invocation count and order. Only null/undefined count as absent; malformed falsy inputs retain the original call-and-throw behavior. NaN, infinities and finite-component sum overflow also retain native sort: these comparisons may not define the total numeric order required for a minimum scan. The additional finite checks read only already computed candidate values.

The secondary frontier approach still runs its original distance/cost/cell sort. Its comparator ends in unique canonical reachable cell IDs, so its selected minimum is independent of the first sort's prior ordering. Shared reservations, 1,024 per-army/8,192 per-plan frontier node budgets and every search expansion remain unchanged. No weights, commands, naval policy, callback contract or canonical state changes.

Independent reconnaissance warships currently supply `explorationTieBreak`, so their sorting is deliberately unchanged. This optimization mainly helps larger land/transport destination ranges; it is not an Epic timing-gate solution by itself.

## Complete destination measurements

`benchmark.ts` imports the retained original and candidate as independent temporary modules. The 18-scenario corpus contains three genuinely generated initial observations, the existing authored naval campaign and detached frontier charts. Each sample creates a fresh navigation object and executes the complete sequence of destinations with changing reservations. Navigation construction, movement queries, scoring callbacks, destination selection and frontier work are timed. Input creation, encoding and equality checks are outside timing.

Every complete destination sequence, cumulative node count and information gain matches the original. Complete strategic/exploration/tie callback traces are checked outside timing; callback counts and their effect on returned scores remain checked inside timing. Twenty warmups and 50 alternating pairs retain raw samples, Node 22.23.2, CPU and both source hashes in `benchmark.json`.

| Complete destination batch | Original median (ms) | Candidate median (ms) | Reduction |
| --- | ---: | ---: | ---: |
| Generated seed 74 | 0.14970 | 0.14955 | 0.1% |
| Generated seed 99 | 0.13087 | 0.13413 | -2.5% |
| Generated seed 748291 | 0.14606 | 0.14333 | 1.9% |
| Authored naval strategic | 0.19117 | 0.19043 | 0.4% |
| Frontier, ordinary exploration | 0.44152 | 0.41891 | 5.1% |
| Frontier, strategic callback | 0.42875 | 0.41099 | 4.1% |
| Frontier, exploration utility callback | 0.43571 | 0.41007 | 5.9% |
| Secondary frontier approach | 0.63729 | 0.62827 | 1.4% |
| All 8,192 frontier expansions | 2.22498 | 2.28496 | -2.7% |
| Large reachable objective range | 7.66982 | 6.83497 | 10.9% |

Required callback/nonfinite sort cases are up to 3.7% slower in this run, and the full frontier-budget case is 2.7% slower. The small generated-observation results are also effectively flat. Retain these limits: the measured improvement applies to larger finite-score candidate ranges, not every destination or the whole AI plan. No claimed campaign-wide gain or hosted gate acceptance follows from this table. The first candidate and measurement remain in the two `before-nullish-review` files. Independent review then tightened absence detection to null/undefined and added three malformed-callback error tests; the table above is the final measured source.

```sh
node --import tsx docs/development/2026-09-21-verification-cost/navigation/benchmark.ts
pnpm exec vitest run packages/ai/src/navigation-selection.test.ts packages/ai/src/navigation-performance.test.ts packages/ai/src/navigation.test.ts packages/ai/src/naval.test.ts packages/ai/src/naval-publication-equivalence.test.ts
```

## Regression evidence

`baseline.json` extracts the independently executed original `captured` results from `benchmark.json`, preserving the original source hash. It includes stateful tie callbacks, interleaved strategic/utility callbacks, NaN/Infinity/overflow, custom local identity, secondary frontier fallback, changing reservations and all frontier limits. Do not regenerate this expected capture to accept a changed decision.

The new `navigation-selection.test.ts` compares all 18 complete sequences and traces, verifies input nonmutation and explicitly checks the full expansion-budget sequence. Existing historical navigation tests independently compare earlier default-policy results and topology calls. Existing naval publication tests retain proposal and voyage behavior.

`focused.log`: **91/91 tests in five files**, including the 21 new regressions and 37 existing naval publication cases. The earlier four-file `focused-initial.log` is overlapping evidence and is not additive. Root owns final combined typecheck/lint, full campaign suite and browser acceptance.

Final scoped measurement window (America/Chicago): the benchmark's empty stderr redirection was created/truncated at 21:44:04.176 on September 21; benchmark JSON completed at 21:44:06.830. The focused log reports start 21:44:07 and duration 1.47 seconds, with final write at 21:44:08.637. Parent full-suite run C began afterward (first output at 21:44:22.277); no scoped CPU work continued into that full run. These filesystem timestamps bracket the tool work, rather than claiming finer process instrumentation.

Final runtime source SHA-256: `853b83434be741254140743e64cb20b08ee792dc3838329178c48ae3e04b9fbc`.

Regression source SHA-256: `624c1b3256dc9553a711a537ef29f681dc6a220537428b361e430360915c6b07`.

Original full-result capture SHA-256: `860cf1b62b4e43a96baa41cc9ce6fe864ceee83dfa741df0ea3e387fd603361c`.
