# AI supply acceptance: worker recovery regression

2026-09-27. Two new cases in `apps/web/src/worker-group-movement.test.ts` exercise the production worker handler, simulation, AI planner, IndexedDB persistence adapter and archive recorder. The only injected fault is failure of worker state publication after a completed round. The authored shared supply fixture gives a player buyer a genuinely recorded pending offer; neither the acceptance command nor payment is injected.

One case submits ordinary player End turn, letting the provider AI accept. The other imports an AI-watch journal and submits `watchRound`. Both first obtain the uninterrupted actual-worker result from the exact same origin. Archive prefixes immediately before and after the recorded AI acceptance prove the exact debit and credit, independently of the round's subsequent economy. Full archive replay matches the published final hash.

## Initial reproduction

`supply-ai-worker-recovery-initial.log` retains two selected failures (the other 15 file tests were filtered, not disabled). Both reached the same assertion: expected `recoveryRequired: true`, received `undefined`. Before failing, each confirmed the actual AI acceptance, matching failed-publication and uninterrupted hashes, and exactly one autosave. This reproduces the missing recovery latch in both paths identified by the independent supply UI review.

After correction, the assertions additionally require retry, save and export to stay locked; auto restore to return the exact completed campaign text and archive; and another ordinary round to retain exactly one acceptance of the consumed offer. No timeout or assertion has been weakened. `supply-ai-worker-recovery-lint.log` reports a clean scoped ESLint run.

## Correction and verification

The parent added a request-local `issueCommand` wrapper in `simulation.worker.ts`. An accepted supply proposal, response or termination latches `delegationApplied = 'supply agreement'`. Both AI loops and the top-level player command use the wrapper. The final player End turn preserves this latch rather than replacing it with `false`; a watch round likewise retains it until publication. Existing catch handling therefore marks recovery required if publication fails after the AI payment. Recorder failures still use the separate existing recording-failure guard.

Independently inspected the correction and reran the unchanged tests:

- `supply-ai-worker-recovery-corrected.log`: both previously failing cases pass, 2/2 in a 1.88-second run. The other 15 tests were filtered for this focused comparison.
- `supply-ai-worker-recovery-affected.log`: all 54 tests in five files pass in a 17.88-second run, with no filtered or skipped cases. Scope: `worker-queries.test.ts`, `worker-group-movement.test.ts`, `supply-access-response.test.ts`, `theater-response.test.ts`, and `selection-group-response.test.ts`.

The passing cases require the actual accepted auto save, exact restored campaign text/archive, preserved player/watch mode, retry/save/export recovery locks, and one payment only across the restored next round. The focused two are included in the 54; counts are not additive. Verdict: the reported AI supply-publication recovery defect is closed. These tests are actual headless worker evidence, not browser recovery, full repository acceptance, benchmark or pacing results.
