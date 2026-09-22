# Campaign verification cost — 2026-09-21

This is local development on `fix/campaign-verification-cost`, based on deployed
revision **`4ce95aedab25536e24a0b34b3803a6cd3c9a5ad5`**. The user's “okay go ahead”
continues the existing **ACT-18 / DH-015 / M0** priority. Rules/save remain **17**,
content remains **`b79c78ed`**, and no dependency, timeout, worker configuration,
campaign activity requirement, assertion, workflow or historical seal changes.

## Implemented and reviewed

| Change | Evidence and limits |
| --- | --- |
| Movement query inputs | One copied terrain/depth index, fewer road probes and per-query canonical capability derivation. Complete query/preview comparisons preserve paths, costs, blockers and search budgets; nineteen new regressions cover canonical commands and copied inputs. [Method, paired measurements and 109/109 focused checks](movement/README.md); [independent review](hash/movement-independent-review.md). |
| Visibility publication | Reuse the already-computed ordered local disk while retaining separate visibility, land and road phases. Thirty-nine new cases cover captured lifecycles, publication gates and remembered information. [Method, paired measurements and 83/83 focused checks](visibility/README.md); [independent review](hash/visibility-independent-review.md). |
| AI destination selection | Select the minimum in linear time for finite scored candidates without a comparator callback; retain native sort for callbacks and nonfinite inputs. Twenty-one new cases preserve destinations, callback traces, reservations and expansion counts. [Method, mixed measurements and 91/91 focused checks](navigation/README.md); [independent review](hash/navigation-independent-review.md). |

These focused counts overlap the full suite and must not be added together.
The **79 new regressions** preserve existing output contracts; authored fixtures
and historical rule contexts are labelled separately from genuine old saves and
organic campaigns. The improvements are local operation measurements, not a
claimed percentage improvement for all campaigns or browsers.

## Profile and rejected alternatives

The [baseline manifest](baseline.json) records the deployed source before edits.
The unchanged isolated Epic case took **51.29 seconds** under the profiler;
its Short sibling was unselected by the focused invocation, not disabled.
[Profile log](profile/epic-before.log), [CPU profile](profile/epic-before.cpuprofile)
and [attribution](profile/summary.json) retain the measurement. Inclusive costs
overlap: state hashing ~15.69 seconds, naval planning ~9.47, movement previews
~5.03 and visibility updates ~2.27. An isolated pass does not clear the full gate.

Official Zod compilation was evaluated without changing dependencies. Primitive
cases offered little benefit and changed schema-sensitive error behavior; whole
objects changed getter validation semantics. No compiled validator was adopted.
[Compatibility probes and complete-operation timings](hash/README.md).
Completed report caching also has no safe bounded implementation under the
existing mutable report/accessor contract; there is no already-frozen report
workload to reuse. [Read-only feasibility assessment](hash/completed-report-feasibility.md).

A final query-local neighbor-buffer prototype preserved all captured visibility
results but regressed complete modern radius-three sight updates by 8–9%.
It was rejected; production keeps its original neighbor enumeration.
[Retained candidate, measurements and disposition](visibility/disk-README.md).

## Full-suite integration results

All runs use Node **22.23.2**, the existing lockfile and unchanged **`pnpm test`**.
No competing agent benchmark ran during the outside-sandbox full runs.

| Run | Candidate and result |
| --- | --- |
| [A](full-headless-a.log) | Movement + visibility. Sandbox run: 1,910/1,917. Epic 61.844 s / 60 s, plus six Git/browser subprocess permission failures. The environment failures prompted an outside-sandbox rerun; they are not six product regressions. |
| [B](full-headless-b.log) | Same movement + visibility candidate, outside sandbox: **1,916/1,917**, 222/223 files, 85.33 s overall. Sole failure: **Epic 62.830 s / 60 s**. |
| [C](full-headless-c.log) | Adds reviewed navigation selection: **1,937/1,938**, 223/224 files, 82.48 s overall. Sole failure: **Epic 60.606 s / 60 s**. Navigation's corrected-source focused checks finished over thirteen seconds before this invocation started. |

These are separate observed runs, not a controlled campaign speedup percentage.
The timing limit remains a failure even when it is narrowly exceeded. ACT-18
requires two consecutive full local passes and complete hosted verification;
neither an isolated run nor a development Pages deployment substitutes for it.

The [final source manifest](source-manifest.json) confirms that only the three
named tracked runtime files differ from the deployed baseline. It also seals
the three new regression files and their evidence helpers. Final
[typecheck](typecheck-final.log), [lint](lint-final.log),
[content validation](content-final.log), [asset validation](art-final.log) and
the [production Pages build](build.log) pass. Content/art's earlier sandbox
attempts were blocked by the TypeScript runner's local IPC socket; the final
logs are the successful outside-sandbox checks. Existing bundle-size and
upstream annotation warnings remain.

Final [affected Chromium gameplay](browser-gameplay.log) passes **25/25** in
2.4 minutes. The rebuilt [production Pages suite](browser-pages.log) passes
**27/27** in 28.0 seconds at `/Theandril/`. These are scoped local browser
journeys, not the complete gameplay, cross-browser or hosted gates. Two exact
current captures were inspected and retained with [provenance](screens/provenance.json).
The [verification manifest](verification.json) seals all eight final check logs.
The independent [final factual and visual review](hash/final-factual-review.md)
found no blocking issue in this bounded checkpoint: it verifies all source
hashes, the current image bytes and the documented limits. It does not clear
the Epic failure or authorize publication.

DHARMA's ACT-18 is now **doing** and DH-015 stays **open**. The
[tracker receipt](tracker-update.json) records the two targeted progress/history
updates and direct local rebuild under its timer lock. Existing deployment
facts and unrelated records were preserved; no weekly writer, inventory,
notification or external publication was run. The project-trackers skill guided
the context read and progress update.

## Status and next work

**DH-015, M0 and all fifteen whole release gates remain open.** The public game
continues to use the prior release; this local branch has not been published.
The existing [roadmap](../../1.0-DEVELOPMENT.md#active-development-roadmap) keeps
M1 client contracts and contestable unification after the campaign foundation,
then M2 magic and M3 empire delegation. No new roadmap or gameplay scope is added.
The [draft developer packet](../../updates/campaign-verification-work-packet.md)
uses inspected current browser captures and leaves published history intact.
