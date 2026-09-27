# Final independent implementation and evidence review

27 September 2026. **No blocking canonical or AI finding in the reviewed candidate.** The live-readback edition defect found during this review has been corrected; its source-image checks have also been strengthened. Publication, live execution and tracker application remain separate steps.

This review independently covers the final AI reachability policy, canonical allocator, new AI measurement harness, pacing evidence and parent-authored live-readback helper. The reviewer authored the save/schema extraction, historical compatibility work, lifecycle tests, recovery browser tests and tracker updater; review of those pieces here is a self-audit, not a claim of independent authorship review. No tests, builds, browsers or measurements were launched during the quiet measurement window. JSON/log reads and source fingerprints support the conclusions below.

## AI and canonical behavior

`packages/ai/src/theaters.ts` considers at most two spare single-company armies and four distance-ranked owned hearths. It invokes at most eight ordinary permitted-observation movement previews, caches repeated army/target decisions within the proposal, and requires a queueable movement result. A guard already at the candidate hearth needs no route. Failed alternatives neither manufacture connectivity nor reserve an unassigned actor. Stable sorting and the observed theater capability preserve deterministic and historical behavior.

The two strongest ordinary military containers, scouts, founders, commanders, attached agents, carried forces, postings, routes, sieges and blocked work are excluded from new spare selection as applicable. Proposed and existing enabled members stay reserved in the relevant later actor planners. Existing custom, paused or empty theaters are not rewritten or refilled. The four-candidate bound can decline a possible distant alternative; this is a bounded adoption policy, not a complete connectivity search or threat planner. Changing observations or later route interruptions can still cause canonical refusals.

The canonical allocator remains the authority. It runs after travel and postings, counts eligible own nonmembers for coverage, commands only explicit members, distinguishes active incoming destinations from physical guards, and protects a physical guard floor. Existing routes and postings, cargo, missions and sieges prevent reassignment. Each theater attempts at most sixteen ordinary routes, including failed attempts; rotation distributes later opportunities. Detach, pause and delete preserve routes already issued. No automatic attack or war declaration is introduced. Lost members are pruned while unavailable hearth references retain the documented fog boundary.

The implementation scans owned observations and performs sorting before its bounded route queries. Each preview shares its normal 4,096-node allowance between range and target search; eight calls bound their combined search expansions at 32,768. This does not bound the complete planner's indexing, sorting or whole-turn costs to a constant.

## Final pacing evidence

The [fixed ordinary pacing log](pacing-fixed.log), [paired report](pacing-fixed-comparison.json), [raw comparison log](pacing-fixed-comparison.log), and updated [README](README.md) agree:

| Pace | Frozen rules 32 | Final rules 33 | Difference | Accepted automatic routes | Blocked automatic attempts | Refused submitted commands |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Standard | 234 | 233 | −1 | 3 | 0 | 0 |
| Long | 342 | 311 | −31 | 3 | 0 | 0 |
| Epic | 379 | 349 | −30 | 3 | 0 | 0 |

Every case is the standard-map, twelve-realm, seed-20260905 headline setup with generator 8. All six finish through Prosperity and retain strict final save roundtrips. The three frozen32 final hashes and complete command/result trace hashes exactly match the earlier retained comparison. Every fingerprint in the final report matches the current source tree at review time.

Each current campaign creates twelve real one-member, one-hearth watches at turns 23–45. Ending membership is twelve for Standard and eleven for Long/Epic. The three later automatic journeys per case demonstrate actual use, with no remaining stranded-island refusal loop in this sample; they do not demonstrate comprehensive defensive strategy. The original 242/336/384 turns and 210/304/352 blocked attempts remain explicitly rejected pre-fix diagnostics.

**Standard 233 and Long 311 still exceed their approximate 200/300 targets. Epic 349 is one turn below the nominal 350–400 band.** No claim that Epic is inside that band is approved. DH-021 and all fifteen release gates remain open. One seed per pace and a command-trace comparison do not establish multi-seed balance acceptance or full campaign archive replay. Instrumented comparison durations are not allocator benchmarks.

The retained final headless log reports 2,075 tests across 258 files in 61.02s. This review reads that result; it does not claim an independent rerun. Browser counts and production checks retain their separate scopes in the README and [UI review](independent-ui-review.md).

## New AI measurement harness

`scripts/benchmark-theater-adoption.ts` separates preparation, observation construction, hashing, saves and canonical command proofs from the timed planner call. One warmup precedes three measured samples with fresh observation identities. The reachable, island-fallback and all-blocked cases assert deterministic proposals, unchanged observations and canonical state, query limits, ordinary command acceptance and subsequent accepted automatic movement where adoption occurs.

The source clearly identifies flat authored geography, one hundred owned combat companies and four candidate hearths within Huge/Legendary entity populations. Reported expanded nodes count target searches; the theoretical bound includes range and target work. This is a sound bounded planner measurement design, with no before/after speedup, natural-geography, worst-case search, complete AI-turn, worker or rendering claim. Its quiet-window measurement was still being completed during this review; no new timing result is endorsed here.

## Publication and tracker helper review

The parent-authored `/tmp/theandril-defense-theaters-live-readback.mjs` initially checked Dispatch 12 but wrote `checks.dispatch.edition: 11`. This concrete mismatch was reported and corrected to `story.sequence`. It now checks native public image bytes against the pinned source bytes, source hash and byte count before launching the public readback. Its later checks compare exact built game/worker assets, the live ledger revision, article/evidence/image pins, every structured roadmap record and all open gates. It uses a fresh context and blocks non-GET/HEAD page requests. Workflow success is deliberately verified separately; the helper does not assert build attestation or campaign completion.

The prepared tracker updater derives final turns/refusals from the fixed report and validates the paired historical setup, current source fingerprints and raw logs. It has no hardcoded passing pace band. Submitted refusals and automatic blocks remain distinct. Its default mode is read-only; the unverified template does not imply release success. A later apply requires exact source/publication inputs, retained successful workflow/readback evidence, matching suite identities, explicit tracker hashes and a reviewed proposal hash. It preserves unrelated records and previous histories, keeps ACT-32/M3 in progress and DH-021 open, and guards ACT-36 done/DH-020 resolved. Replacements have backups and rollback guards; three files are not a single filesystem transaction. Building is a separate explicit step.

One deliberate updater precondition remains: the featured native image must come from this feature at P1. If the article instead reuses historical Recall imagery, that guard must be explicitly adapted to its historical source pin before apply. It will currently refuse such a fallback rather than record incorrect provenance. No tracker changes or build were performed in this review.

## Reviewed source seals

| File | SHA-256 |
| --- | --- |
| `packages/ai/src/theaters.ts` | `01532bd3d1b1737cd9b3359cc880f92cc28a42a6c21116efeccd314899feb518` |
| `packages/sim/src/theaters.ts` | `d53afd72ecc3d9028fbe7feab2d21f8c975f1d4325e5a236a0465016677c6014` |
| `scripts/benchmark-theater-adoption.ts` | `6a0744bf766461943ef7b153f40606d545d325f4d8f24b8c74ed80ef1f4afa5f` |
| `scripts/compare-theater-pacing.ts` | `4fd53694278c9a4cc0de8d9647d22f9224ce1d00679c033407fa71110c469305` |
| `pacing-fixed-comparison.json` | `af859f2e521ff3003ab5bc08b3a4bf6368048b0d61a15be871ed70f8bfbb84cf` |
| `pacing-fixed.log` | `8bc4ce5176c9e80e5a489365d74552abb261f04e5a9c61d9a46a72ab42f11d33` |

The final implementation commit, journal/publication verification, fresh final-build production journey, live checks and actual tracker application are not attested by these source-review seals. M3 remains partial; threat response, patrol/escort, invasion strategy, army templates, broader governor decisions and combined mature-realm acceptance remain open.

## Completed quiet AI benchmark readback

Addendum after the measurement finished, 27 September 2026. The reviewer independently compared [the accepted JSON](ai-benchmark-final.json) with its [raw output](ai-benchmark-final.log), recalculated the median/minimum/maximum from each three-sample array, and checked all three measured source-file hashes against the reviewed source. They agree exactly. No benchmark was rerun by this reviewer.

| Case order: reachable / island fallback / all blocked | Planner medians (ms) | Previews per sample | Target-only expanded nodes |
| --- | --- | --- | --- |
| Huge | 0.348 / 1.966 / 2.082 | 3 / 8 / 8 | 25 / 4,942 / 6,504 |
| Legendary | 0.162 / 1.635 / 2.074 | 3 / 8 / 8 | 25 / 4,942 / 6,504 |

All six rows record unchanged canonical hashes and observations and exact repeated plans. The four adopting cases each accept one ordinary configuration and two subsequent automatic routes; the two blocked cases propose neither. The JSON/log and [README](README.md) correctly disclose authored geography, one hundred companies plus one scout, four candidate hearths, 841 observed cells, and one adoption-capable realm. The target-node counters exclude range search; the shared per-preview cap still bounds range plus target expansions at 32,768 across eight calls. No speedup, tail percentile, worst-case saturation, whole-turn, worker or rendering claim follows from these six workloads.

The overlapped first sample remains excluded from timing conclusions, as documented in [the measurement readback](ai-benchmark-review.md). The accepted JSON SHA-256 is `f62cfb5ef0cc13c67168bb033b69cf6abfc3e1079b72b35b9defdac56fe34216`; the accepted raw-log SHA-256 is `dc5117f50607cc89e480d829bfe7265b8b7bf2dd82a9603e3bfdb63b43790211`. This addendum was written after implementation commit `0ecd2d1767f613942cf9f22315da624164cc4055`; the underlying measurements and their authored readback already exist at that pin.
