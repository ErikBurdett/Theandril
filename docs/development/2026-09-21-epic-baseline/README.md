# Epic baseline continuation — 21 September 2026

This prompt retains two modest production optimizations while investigating the unchanged Epic archive gate. **The full default run still fails only Epic's timing limit; M0 remains open.** Rules/save remain **17** and content remains **`b79c78ed`**. No gameplay policy, activity, search budget, historical seal or test timeout was relaxed.

The [starting manifest](baseline.json) identifies the already modified working tree at base revision `f07024fe23ad3386874656d48fbbc33a5380d979`. Earlier work remains documented in [roadmap start](../2026-09-21-roadmap-start/README.md) and [campaign continuation](../2026-09-21-campaign-continuation/README.md); comparing this prompt only with Git HEAD would incorrectly count those prior changes again. No commit, publication or deployment is included here.

## Retained production changes

| Change | Exact scope and evidence | Verification |
| --- | --- | --- |
| Movement search allocations | One search-local neighbor scratch array via `neighborsInto`; omit the unused predecessor map for targetless range search. Preserve topology, heap order, routes and shared node charging. [Implementation/method](movement/README.md), [44 paired complete-query/preview results](movement/benchmark-allocations.json). Query gains are modest and mixed; no whole-campaign or peak-memory claim. | [92/92 tests, five files](movement/focused.log); [independent review: no blocker](review/movement.md). |
| Lazy naval preparation | Build shoreline, home-land, navigation and coastal-frontier knowledge only when consumed within one plan; return after funding/research when no eligible fleet exists. No persistent cache or policy change. [Implementation/method](ai/README.md), [final paired results](ai/benchmark-final.json). Sum of 36 case medians: 36.391 → 34.730 ms; late passenger cases are mixed. | [60/60 tests, five files](ai/focused-final.log); [36 complete real-checkpoint plans](ai/complete-proposals-before.json), [91 prior proposal variants](ai/naval-proposals-verify.log), [eight-turn/22-command paid voyage](ai/naval-campaign-verify.log); [independent review: no blocker](review/naval.md). |

Focused test counts overlap and must not be added. Both reviews checked frozen source hashes and retained evidence without running competing benchmarks. The naval evidence preserves the initially caught comparator-transplant error and its correction; passing results use the original unchanged proposal seals.

## Investigations not adopted

| Candidate | Disposition and evidence |
| --- | --- |
| Save/hash kernels | No production change. Unrolled checksum loops regressed complete hashes; guarded typed-array copies had insufficient Epic benefit. A later successful-primitive-validation wrapper changed path-sensitive error formatting and was rejected before timing. [Methods, complete-operation timings and compatibility failures](hash/README.md). The previous encoded-projection cache remains rejected. |
| Parallel-array movement heap | No production change. Small/noisy incremental gains did not justify replacing the existing heap. [Retained candidate/results and rejection](movement/README.md); [raw samples](movement/benchmark-heap.json). |
| Archive validation/command reuse | Deferred without a throughput claim. Public accessors/proxies, mutation between parses and detached-command provenance prevent assuming the first parse can replace the second. Complete replay, checkpoint, refusal, event and battle validation remain intact. [Read-only investigation](archive/inspection.md). |
| Shared preview session | Not introduced. The real checkpoint sample had 17 repeated queries but only 996 repeated range expansions versus 20,204 target expansions; added API/cache complexity was not justified. [Per-plan counts](ai/preview-counts.json). |

## Verification boundary and runner decision

The [unchanged isolated Epic profile](profile/epic-before.log) passed its selected case in **52.46 seconds**; the other case was unselected by the profiling invocation, not disabled. [CPU profile](profile/epic-before.cpuprofile) and [attribution](profile/summary.json) identify overlapping costs, not additive stage timings. An isolated pass is not the complete default-suite gate.

[Final typecheck](typecheck-final.log), [final lint](lint-final.log), [content validation](content.log), [art validation](art.log) and the [production Pages build](build.log) pass on Node 22.23.2. The existing bundle-size warning remains. [Affected Chromium gameplay](browser-gameplay.log) passes **25/25** in 2.6 minutes; [rebuilt production Pages](browser-pages.log) passes **27/27** in 28.9 seconds. These are scoped gameplay coverage and the complete Pages suite, not complete gameplay, cross-browser, hosted-CI or whole release acceptance.

[Runner analysis](runner/analysis.md) documents the installed defaults, host/resource limits, cache/order caveats and the default/eight/four-worker experiment. [The measurement harness](runner/measure.mjs) checks [frozen source identity](runner/source-manifest.json), records full results and preserves every existing file/assertion/timeout. The first wrapper attempt failed because `/usr/bin/time` was absent; [that tool failure](runner/default-a.summary.json) is retained and is not a test or timing result. The corrected wrapper uses Bash timing and makes no memory measurement.

| Complete suite, same source | Tests / files passing | Vitest wall time | Epic against 60 s | Process CPU, user + system |
| --- | --- | ---: | ---: | ---: |
| [Existing default](runner/default-b.summary.json), up to 31 workers | 1,857/1,858; 220/221 | 87.84 s | 64.779 s, fails | 731.052 s |
| [Eight-worker diagnostic](runner/eight-a.summary.json) | 1,857/1,858; 220/221 | 86.91 s | 64.474 s, fails | 593.415 s |
| [Four-worker diagnostic](runner/four-a.summary.json) | 1,857/1,858; 220/221 | 100.67 s | 63.069 s, fails | 545.104 s |

All three runs have zero pending tests and the same sole failed case. Standard/24 contact, Huge/32 contact and Epic seed-74 pacing pass in the complete default run. Lower concurrency reduced CPU consumption in these single samples but did not resolve Epic; four workers slowed the complete suite. Epic overlaps the pacing file throughout both initial runs. File intervals cannot identify core scheduling or CPU causation. These are diagnostics, not statistically confirmed worker-policy or game-speedup claims. No reversed-order confirmation was pursued because neither candidate cleared the gate.

**Decision: retain the existing runner configuration and budgets. M0 and all fifteen whole release gates remain open.** [Runner review and evidence integrity](review/runner.md). No additional unchanged retry is counted as progress.

## Browser evidence and final source

The compendium browser test formerly wrote each run's screenshots over historical documentation evidence. It now uses `testInfo.outputPath` for both images. Assertions, viewport steps, full-page captures and timeouts are unchanged. The final Pages run exercises the corrected test and leaves both historical images unchanged; final typecheck/lint were rerun afterward. This is a test-output correction, not a game feature.

The [final source manifest](source-manifest.json) records all 614 paths in the runner manifest and identifies that one later browser-test change. Production and headless sources still match the timed runs exactly. [Two current screenshots and provenance](screens/provenance.json) retain exact Playwright bytes: the generated Short campaign's technical ledger and the authored naval voyage's landing controls at 390 pixels. Both were visually inspected. They illustrate actual save/route/chronicle journeys, not Epic timing or a new visual design.

The [independent final review](review/final.md) found no blocker in these bounded changes, source identities, factual claims or current imagery. It explicitly preserves the failed Epic result and open M0/release gates. The reviewer assessed retained results rather than rerunning tests.

Reproduce browser verification with Node 22.23.2 and `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium`:

```sh
./node_modules/.bin/playwright test tests/gameplay/contact.spec.ts tests/gameplay/movement.spec.ts tests/gameplay/naval.spec.ts tests/gameplay/chronicles.spec.ts tests/gameplay/battle-defense.spec.ts tests/gameplay/land-query.spec.ts tests/gameplay/land.spec.ts tests/gameplay/diplomacy.spec.ts --output=test-results/epic-baseline-gameplay
./node_modules/.bin/playwright test --config playwright.pages.config.ts --output=test-results/epic-baseline-pages
```

## Prepared next interface work

The read-only [web/AI clientage handoff](m1-client-plan.md) and [save/replay handoff](m1-save-plan.md) prepare M1a without changing runtime rules. They follow the parent decision for top-level `GameState.clientage`, optional rules-18 observation data and three clientage commands. These notes do not implement clientage, unification or another victory path and do not replace the canonical roadmap.
