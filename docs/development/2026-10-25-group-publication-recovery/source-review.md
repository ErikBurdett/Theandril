# Independent source review: group-policy publication recovery

Date: 2026-10-25. Reviewer: `/root/patrol_draft_review`, independent of this fix's implementation. Reviewed against parent HEAD `64b5d9ef1583d672944b1a5c0a836dae8f845ed5` plus the working-tree patch identified below. No tests or builds were run by this reviewer.

## Verdict

**Source review passes, with runtime acceptance still owned by the parent.** The small worker change closes the demonstrated post-mutation publication gap for both group postings and group charters. It does not change canonical commands, normal partial refusals, campaign hashes, saved schemas, pacing or autosave policy. No blocking source defect found.

## Boundary inspection

- `handle` starts its local `groupPolicyStarted` marker as false. Campaign existence, the existing global recovery lock, watch/victory/battle/capture guards, full request/command validation and the expected-hash comparison all precede marking the policy batch started. Missing/malformed/stale hashes therefore remain ordinary pre-mutation rejections, with no new recovery lock. Existing four stale grant/removal worker regressions assert unchanged export, zero recorder/save calls and successful fresh retry.
- The marker is set immediately before `applyGroupCommands`, and remains set through metrics/result construction and `publish`. An exception anywhere after that boundary sets the existing global `recordingFailed` lock and reports that orders may have applied, rather than presenting the result as an ordinary refusal. This is appropriately conservative even if every canonical order refused: those attempts still belong to the journal and the caller did not receive their receipt.
- Normal canonical refusals return rows and continue the group; they do not throw, so they do not enter the new failure path. No success or refusal semantics were changed.
- Existing recorder failure protection is preserved: `applyCommand` sets `recordingFailed` before rethrowing; `applyGroupCommands` stops after the completed prefix, exposes an explicit interruption and attempts one partial publication. A publication failure at that stage now also receives the policy-specific recovery message. Existing posting and charter recorder regressions cover mutation on the second attempt, no third attempt, manual restoration and exact retry replay.
- New/load/loadAuto/import are handled before the global lock. A successfully decoded/resumed campaign replaces state/journal and explicitly clears `recordingFailed`; a failed import does not first clear it. The new regression restores the manual save and proves zero restored records followed by exactly two successful retry records. Import-reset correctness here is source-inspected, not a new browser claim.
- The posting/charter branch still calls `publish` directly and still does not call `autosave`. The new unit tests spy on `SaveStore.saveCampaign`, assert zero calls during mutation/publication failure and zero calls during refused save/export/retry attempts. Existing manual data remains the recovery source.
- Main-thread response correlation and error/recovery adoption are unchanged. The error carries `recoveryRequired: true` only through the existing global flag. UI controls can therefore use the established recovery path rather than accepting a stale observation.

## Fault-injection fidelity

The browser test creates a module worker wrapper around the **actual built production worker URL**. It temporarily buffers inbound messages during dynamic-import startup and delivers each unchanged after the production listener is installed. Its sole fault is a one-shot throw from worker-global `postMessage` when the production worker publishes a state containing the relevant group result array. This occurs after the real command/journal execution and observation/hash computation, before sending that state to the page.

The wrapper does not fabricate accepted rows, substitute state, reorder group commands, mutate the game, or manufacture the outer-catch error. The thrown message records the real attempted publication's hash and rows; the main-thread listener only observes the resulting real error. The test compares that evidence against an independently executed canonical two-command journal. Retry uses the same worker after the one-shot fault and actual manual restoration. Blob URLs are revoked when the worker terminates.

This proves recovery under an authored publication interruption, not the frequency of such failures in ordinary play, an actual browser crash, or every possible transfer failure. It specifically tests the useful previously missing boundary: canonical mutation succeeded but its result could not be delivered.

## Evidence inspected

- `old-worker-tests.log`: both targeted regressions failed because `recoveryRequired` was undefined, after the preceding two accepted rows / changed hash / two recorder calls checks.
- `old-browser.log`: both production journeys failed at the missing restore guidance assertion. The test writes actual mutation/error evidence and screenshots before that assertion.
- New worker tests assert the persistent lock rejects repeated batch/save/export, preserves the manual save, then restores and replays exactly.
- New browser tests require no false result receipt, retained selection, disabled submission/end turn, real manual restoration, exact replay and exactly two successful retry commands.

These inspected failures are retained as fail-before evidence. They are not passing acceptance. Parent must run the patched focused/full tests and both production journeys, inspect screenshots, and verify deployment before reporting delivery.

## Exact reviewed files (SHA-256)

- `apps/web/src/simulation.worker.ts`: `5bea224c278219be11b36f3667b8f26678d6f672ef87bc7493ddf84ddfe2c153`
- `apps/web/src/worker-queries.test.ts`: `b656581c933829b20b275642032686abfc98d1d7ca0d771fa5ded02ae98c5728`
- `tests/production/group-publication-recovery.spec.ts`: `ea0bf3cf78225d7fb1fb2f08d5fa3a63f5303ff84690ea2f91b4ece9aecb2a0a`
