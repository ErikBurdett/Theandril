# Campaign timing investigation

These measurements use Node 22.23.2 on an Intel Core i9-13900K. They are local evidence, not hosted CI or release acceptance. The original campaign timeouts and assertions remain unchanged.

## Original campaign profile

Command from the repository root:

```sh
/home/telephoneheater/.local/share/mise/installs/node/22.23.2/bin/node --cpu-prof --cpu-prof-dir=docs/development/2026-09-21-roadmap-start/performance --cpu-prof-name=epic-baseline.cpuprofile --import tsx scripts/benchmark-chronicle.ts --size=tiny --pace=epic --factions=4 --limit=1400
```

[Raw metrics](epic-baseline.json) and [V8 CPU profile](epic-baseline.cpuprofile) were captured before the movement and naval fixes. The real seeded campaign reached Prosperity at turn 910 after 22,914 orders, 249 archived battles and zero rejected commands. Final state hash: `1e4534db`.

| Stage | Time |
| --- | ---: |
| Campaign, including archives | 32.443 s |
| AI planning | 17.675 s |
| Observations | 7.501 s |
| Commands and archive checkpoints | 7.212 s |
| Complete archive replay | 7.571 s |

Sampled inclusive stacks identify naval planning (12.321 s), movement queries called by naval planning (8.497 s), and their path searches (6.384 s) as the largest planning costs. Land observations account for another 3.279 s. Sampled inclusive stacks overlap; they must not be summed as separate stages.

## Movement search pruning

The bounded search now skips a neighboring edge when even its minimum cost of one cannot improve the previously discovered cost. A node already at the finite movement-range limit needs no outgoing edge probes. Both changes leave heap insertions, tie order, predecessor selection, popped-node charges and the shared 4,096-node budget unchanged. There is no new persistent cache, rules version, canonical state field or hash format.

The original `packages/sim/src/movement.ts` SHA-256 was `1921dc7560b362fae0d91b9f734799e163eef67302a43f613b4fcec894d0c60e`.

[Before](movement-before.json) and [after](movement-after.json) cover 22 synthetic detached-chart scenarios with ten warmups and forty measured reads per case. The entire query SHA-256 matches in every scenario, including all reachable cells/costs, exact routes, blockers and node counts. Fixtures cover weighted terrain, roads, route ties, naval depth, hostile armies/towns, append/pause, unknown geography, and budget exhaustion. Setup, JSON equivalence checks and hashing are outside timings.

The self-contained [microbenchmark](movement-microbench.ts) retains the measured corpus. Run it from the repository root with Node 22 and `--import tsx`; run the same source against the earlier revision to reproduce the baseline. The [regression test](../../../../packages/sim/src/movement-search-equivalence.test.ts) separately retains the captured pre-change SHA-256 results, so regenerating benchmark output does not redefine the acceptance values.

| Scenario | Before median | After median |
| --- | ---: | ---: |
| Disconnected destination, 4,096-node cap | 3.155 ms | 1.616 ms |
| Range exhausts the shared preview budget | 5.380 ms | 3.909 ms |
| Equal-cost route ties | 0.212 ms | 0.158 ms |
| Weighted route | 0.200 ms | 0.188 ms |

These are microbenchmarks of the search change; they do not by themselves prove campaign timeout resolution. Targeted tests passed after the change: movement/naval/roads (50 tests across three files), then query equivalence, frontage and historical archive compatibility (57 tests across four files). Scoped ESLint and whitespace checks also passed.

## Combined campaign follow-up

The same generated Epic campaign was profiled after movement pruning and the separate naval-planning fixes. [Metrics](epic-after.json) and [CPU profile](epic-after.cpuprofile) retain that run. Use the original command above with `--cpu-prof-name=epic-after.cpuprofile` to repeat it.

| Stage | Before | After |
| --- | ---: | ---: |
| Campaign, including archives | 32.443 s | 27.161 s |
| AI planning | 17.675 s | 12.749 s |
| Observations | 7.501 s | 7.316 s |
| Commands and archive checkpoints | 7.212 s | 7.047 s |
| Complete archive replay | 7.571 s | 7.365 s |

The final state hash (`1e4534db`), victory turn (910), orders (22,914), events (52,393), battles (249), rejection count (zero), and save/chronicle byte counts are unchanged. The benchmark independently verifies final save restoration, compressed export/import and complete archive replay. Sampled movement-query time fell from 8.497 s to 4.228 s and search time from 6.384 s to 2.929 s.

This is one local before/after campaign sample per version, with profiling overhead. It measures the combined integrated changes; only the microbenchmark isolates movement pruning. The original hosted timeout failures still require the unchanged CI workload to pass. Full-suite and browser integration verification belong to the parent task; no release gate is closed by this measurement.

## Replay comparison follow-up

The parent's first unchanged default Node 22 suite passed 1,743 of 1,744 tests; the Epic archive integration case alone exceeded its original 60-second limit (66.537 seconds). The other three previously recorded timeout cases passed in that local run. That failure remains recorded in [`full-headless-before-replay-optimization.log`](../full-headless-before-replay-optimization.log).

Replay compared every event and battle tree by sorting/copying its objects and encoding both complete trees. The follow-up changes only that equality check: plain replay objects compare by keys and values, arrays retain their order, absent/undefined optionals retain JSON omission semantics, and array holes/undefined retain JSON null semantics. Negative zero and nonfinite numbers preserve the earlier JSON comparison result. Custom conversions use the original renderer, including conversions that omit the parent key. The original `stableJson` renderer moved verbatim to the internal helper and remains the renderer for technical export bytes. Archive parsing, corruption validation and historical seals remain in place.

The [paired microbenchmark](chronicle-comparison.ts) uses retained real rule-15 battle/event records with reversed object-key insertion. It compares the exact original algorithm and the new one in alternating order, with four warmups and twenty measured samples. [Results](chronicle-comparison.json): 400 comparisons per sample, median **4.127 → 0.692 ms**; corpus SHA-256 `22b92d213644ce1001e9a4d1895b237dd1006ff107d266b9597d56fcf32113e1`. This measures equality work, not complete replay throughput. It verifies the original and retained technical renderer produce identical bytes.

The [new regression suite](../../../../packages/chronicle/src/json-equivalence.test.ts) passes 25 cases/tests, including 500 seeded generated JSON pairs, reordered objects, optional values, array order, the custom-omission review finding, and actual historical replay that rejects forged event/battle text. The initially affected chronicle and development-compatibility suites also passed. This helper is internal to replay; the optimization makes no new promise about arbitrary JavaScript objects with side effects.

The unchanged Epic integration test passed in **52.03 seconds** (52.64 seconds including Vitest startup) with CPU profiling enabled and the original 60-second limit. Retained [test log](epic-integration-comparison.log) and [CPU profile](epic-integration-comparison.cpuprofile). Command:

```sh
/home/telephoneheater/.local/share/mise/installs/node/22.23.2/bin/node node_modules/vitest/vitest.mjs run tests/headless/chronicle-victory.test.ts -t 'generated-start epic' --execArgv=--cpu-prof --execArgv=--cpu-prof-dir=docs/development/2026-09-21-roadmap-start/performance --execArgv=--cpu-prof-name=epic-integration-comparison.cpuprofile
```

The `-t` selection isolates Epic for this diagnostic; the short case was unselected and remains enabled in the unchanged full suite. This isolated result does not establish default parallel-suite or hosted CI recovery. The parent owns that remaining integrated disposition.

The final unchanged default suite passed **1,768/1,769 tests across 215/216 files**
in 98.44 seconds. The same Epic archive case took **66.351 seconds**, exceeding
its unchanged 60-second budget; Standard/24 contact, Huge/32 contact and Epic
seed-74 pacing passed locally. [Final full-suite log](../full-headless.log).
The default-suite timing gate remains open. The comparison microbenchmark and
isolated pass are useful scoped results, not a reason to relabel this run green.

Final reviewed-candidate source SHA-256 values:

- `packages/chronicle/src/index.ts`: `8b3972dd0313d379cb7fff07a6869e59216e5abb287de6ae5061a7a249d68809`
- `packages/chronicle/src/json-equivalence.ts`: `ae0bfd997ec0602a5c9b0303ec75debaadee6566ab1b74e85cec5dab62914c0c`
- `packages/chronicle/src/json-equivalence.test.ts`: `f2923788623f13e36b47486644a93c69d00943c658a6dcc93c00a9ebd28c61f4`
