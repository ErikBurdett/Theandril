# Final patrol packet factual review

Date: 2026-10-24. Scope: the packet README, prompt report
`../prompt-reports/2026-10-24-land-patrols.md`, draft dispatch and their retained
evidence. This reviewer authored the AI implementation and the earlier independent
simulation/history review. This is a factual documentation review, not an
independent endorsement of the reviewer's AI code or release acceptance. No
application source was changed and no heavy checks were rerun.

## Verdict

No new implementation blocker was identified by this packet review. The major
verification and adverse pacing claims agree with the retained artifacts. The
documentation corrections below were reconciled by the parent and read back by
this reviewer. No outstanding factual blocker remains in this scoped review;
publication and 1.0 acceptance remain outside this verdict.

## Evidence checked

- `full-tests-final.log`: 2,206 passing tests across 273 passing files,
  56.85 seconds, invoked with four workers. The summary reports no failed or
  skipped cases.
- `production.log`: three named production journeys pass in 11.3 seconds.
  `tests/production/patrols.spec.ts` explicitly checks absent development hooks,
  actual arrival and next target, exact restored state hash/archive, keyboard
  pause, a 390px viewport and 130% text scale. These support the described patrol
  scenario; they do not establish universal accessibility or browser coverage.
- The initial gameplay log contains ten passes and one failure; the failed
  lifecycle passes in `browser-fixed.log` and its revised policy case passes in
  `browser-policy.log`. These are eleven distinct journeys across runs, not
  thirteen distinct tests. The failure trace shows a second Vite connection and
  module load at about 22:37:52 UTC, and its error context shows the start screen.
  This supports the reload diagnosis. The exact triggering source edit is
  session evidence, not a filename identified by the terse test log.
- Typecheck and lint logs contain their commands and no diagnostic output;
  the parent reports successful exit. The production build records success with
  remaining bundle warnings. `content.log` reports hash `015468d1`.
- `compatibility.log` reports 25 passes across four files. The earlier source
  review covers the strict historical schemas and sealed captures; this review
  does not repeat that implementation audit.
- `benchmark.json`: recomputed medians from the three retained samples agree
  with 4.588/6.281 ms allocation and 0.591/1.785 ms all-realm observation for
  Huge/Legendary. Their 1,500/4,000 patrol counts, 256/320 attempts, zero refusals
  and identical per-world hashes agree with the packet. The authored short-route
  scope and excluded costs are stated appropriately.
- `pacing-final.json`: Standard/Long/Epic finish at 236/335/374 turns, all Saltwind
  Remnant prosperity, with zero submitted, automatic and patrol-route refusals.
  Patrol orders/attempts are respectively 11/767, 11/521 and 12/526. Against
  233/311/349, the differences are +3/+24/+25. The historical readback lists
  exact comparisons of turns, path, winner, refusals, hash, commands and events.
- Initial persistent patrol and final results match on campaign turns, winners,
  war/battle counts and route attempts. The rejected war-pause experiment records
  243/375/427, changes Long/Epic winners to Glass Tide, and increases declaration
  and autoresolve counts. The packet correctly avoids claiming these observations
  establish one causal explanation. DH-021 and the adverse Long result remain
  explicit; no broad balance acceptance is justified by one seed.

## Documentation corrections and dispositions

1. `integration-review.md` attributes its 29-test/two-file log to particular
   suites. The retained `patrol-war-policy-final.log` contains no invocation or
   filenames, so the file identities are **unknown from that artifact**. Remove
   that attribution or provide a retained exact invocation; do not infer file
   identities solely from the counts. Its closing pending browser/full-suite/
   pacing statements should be marked as review-time status or reconciled with
   the final evidence.
   **Resolved:** the suite attribution is removed, the artifact's filename
   limitation is explicit, and pending verification is now historical with a
   reference to the parent's final packet.
2. The README says both endpoints are previewed from the current position.
   `planPatrol` accepts an endpoint equal to the army's current cell without
   issuing a route query. More exact wording is: each endpoint must be the
   current cell or pass an ordinary preview from it. The four-query bound and
   later-leg routing limitation remain correctly stated.
   **Resolved:** the README uses that precise current-cell exception.
3. The draft's phrase “continue defending their circuit” can suggest automatic
   combat. “Continue patrolling their circuit” describes the actual behavior
   precisely and agrees with its existing no-automatic-fighting explanation.
   **Resolved:** the draft now says “patrolling” and includes the final
   236/335/374 remeasurement and final full-suite/production evidence.

The README also distinguishes the session's server evidence for the triggering
AI edit from the retained trace's second Vite connection. This resolves the
reload-attribution precision concern without erasing the original failure.

These are evidence-attribution and wording corrections, not reproduced gameplay
defects. The parent's final records should retain the rejected experiment,
initial failures and unresolved pacing rather than treating the successful
checks as completion of ACT-32/M3 or the fifteen release gates.
