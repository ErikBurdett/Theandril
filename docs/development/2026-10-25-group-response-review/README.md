# Posting and charter reply recovery

This follow-on fixes a demonstrated client recovery gap: a completed group posting or charter response could contain duplicate, missing or unrelated typed actor rows and still be reported as successful. Strict response correlation is integrated locally; the first corrected full Pages run passed **57 cases in 2.9 minutes**, including all six new recovery cases, and all twelve retained recovery exports replay exactly. Final broad acceptance and deployment remain separate parent-coordinated work at this review checkpoint.

This is a small transport/recovery fix following the group-patrol publication, not a new delegation policy or developer dispatch. Rules remain **35**. No canonical simulation/AI behavior, prices, saves, replay rules, protocol envelope or automatic turn behavior changes. No dispatch 19 or journal catalogue addition is part of this packet.

## Evidence and observed failure

- [Diagnosis](diagnosis.md) and [exact-source probe](probe.json): sixteen cases execute the old acceptance predicates and real ledgers. Typed missing-row, duplicate, wrong-actor, empty and extra-row arrays were accepted. Entirely absent result fields and malformed booleans already triggered recovery; they are controls, not newly discovered failures.
- [Two production fail-before cases](fail-before-review.md), [log](fail-before.log), [hashes/captured replies](fail-before-evidence.json): the frozen `5cb7dc84292bfddb876eb54e19046f7b97a77ad9` production build actually performed two ordinary commands, then accepted damaged presentation rows. Both tests failed at the intended restoration assertion, after retaining evidence, not on fixture or artifact setup.
- Posting duplicate: the native result correctly reported `army.10` and `army.9`, hash `782d91b7`; duplicating the first displayed two accepted while leaving one checked and End turn enabled.
- Charter wrong actor: the native result correctly reported `settlement.6` and `settlement.8`, hash `caafaa3d`; replacing the second actor displayed two accepted while leaving one checked and End turn enabled.

The fault injection alters only a completed worker reply's result array. No canonical state, hash, observation, command acceptance or archive is substituted. This establishes recovery behavior under presentation damage; it does not claim that the healthy worker spontaneously produces mismatched rows. Original probe, draft, before-run artifacts and logs are retained without rewriting them into successful evidence.

## Implemented scope

[Request wrappers](../../../apps/web/src/group-posting-requests.ts) retain the submitted faction and sorted actor IDs, then validate the corresponding state reply against that exact bounded cohort. Their shared private helper checks row count/order/identity, permitted row keys, boolean outcomes and meaningful bounded refusal/error text. It handles at most 128 actors. Partial results accompanied by an explicit recording error remain uncertain and require restoration.

[Main integration](../../../apps/web/src/main.tsx) validates both legacy reply kinds before adopting their state/render data, alongside the existing patrol/movement/production validation. A bad reply leaves its request pending for the existing recovery path: no success selection clearing, a clear restore instruction, released pending UI and blocked gameplay until restoration. The generic `GroupOrderRequests` request-ID primitive is unchanged for other consumers. This adds no simulation eligibility rules, world scans or per-turn work. Enqueue is O(k log k), validation and retained metadata O(k), bounded by 128.

[Implementation notes](requests-implementation.md), [source identity](requests-source.json), [focused log](requests-focused-first.log) and [scoped lint](requests-lint-first.log) record the first implementation checks: **24 tests across five files passed**, including normal mixed accepted/refused rows, all damaged identity cases, wrong factions, partial errors, reset/late/overlapping requests, mutable caller inputs and the 128-actor bound. These checks alone do not establish browser or release acceptance.

## Production acceptance under review

The promoted [six-case production test](../../../tests/production/group-response-recovery.spec.ts) covers posting/charter × missing-row/duplicate/wrong-actor. Each uses two ashore guards and two canonically founded hearths on explicitly authored infrastructure; the from-save archive starts at zero records, hash `1a71b4f1`. Before checking recovery, the test proves the native completed response equals the independent two-command expected hash/results and retains actual UI evidence.

Source review confirms the assertions match the new request/main boundary: require no success table, both actors still checked, settled pending status, disabled retry and End turn, then use public Load to restore the exact zero-record manual save. One normal retry must match the full expected two-record archive/state. Public exported files must replay exactly; armies/routes remain unchanged, and charter cases also preserve settlement/faction state including existing queues/treasury. Both pre-action-restored and retried exports are retained by each successful case.

The reviewer authored these tests, so this is a test-to-implementation consistency review rather than an independent review of test design. No scoped source mismatch or behavior blocker was found. The [corrected browser review](browser-review.md) records all six new cases passing in [pages.log](pages.log), entries 36–41, and independent exact replay of their twelve retained exports in [export-review.json](export-review.json). Every restored archive has zero records and hash `1a71b4f1`; every retry has exactly two ordinary records, hash `782d91b7` for postings or `caafaa3d` for charters. All six native fault screenshots were inspected, with the posting alert's off-screen framing limitation stated explicitly. No new browser run occurred during this review. The complete Pages log now confirms 57 passed in 2.9 minutes; final full checks and deployment remain parent-coordinated work.

This fix does not provide stale-hash intent protection for legacy posting/charter requests, new escort or multi-step operations, pacing improvements, or completion of M3/R06/DH-021 or the remaining 1.0 gates. Those remain separate work.

## Final local acceptance

The corrected source passes **2,352 tests across 286 files in 60.66 seconds**, four workers ([final log](full-tests-final.log)). The earlier full run passed the same count before typechecking exposed TS2345; its log and the original typecheck failure remain retained. A direct validated-record field read corrected that type error without weakening validation; focused tests, independent review, [typecheck](typecheck-corrected.log), [lint](lint.log) and [Pages build](build.log) pass. All **57 local Pages journeys pass in 2.9 minutes**. [Exact scope and identities](local-acceptance.json), [source hashes](source.json). Deployment and live acceptance are recorded separately.

## Published and verified

Fix **912b8736b1c417e203a30b617bc041f62659ff52** is deployed to GitHub Pages. Both [GitHub workflows](actions.json) succeed. The [exact public readback](live-readback/readback.json) matches HTML, chunks, worker, assets/provenance, generated ledger and the unchanged dispatch-18 pin/catalogue. All **eight targeted live journeys pass in 37.4 seconds** ([log](live-pages.log)): six damaged-reply recovery cases and the normal posting and charter save workflows. This is separate from the 57-case local run. [Deployment record](deployment.json). No release gate is closed.
