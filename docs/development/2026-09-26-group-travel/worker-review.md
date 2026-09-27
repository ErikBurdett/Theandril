# Group travel worker review

Reviewer: the UI subagent, independently reviewing the worker/protocol agent’s implementation. The reviewer authored the group travel React component and roster integration; this is not an independent review of those UI files. No worker or protocol source was edited during this review.

## Scope and current verdict

Inspected `simulation.worker.ts`, `protocol.ts`, `worker-group-movement.test.ts`, and `worker-movement.benchmark.ts`, including the existing canonical movement functions, journal wrapper, observation cache, publication path and serialized request queue that they use.

No new blocking authority, hidden-information, command ordering, save or recovery defects were found in the inspected worker implementation. The worker agent’s accepted-outcome and benchmark-evidence corrections were inspected in the final source readback. This is a source review, not a completed benchmark or browser acceptance claim.

Final source SHA-256 values:

- `simulation.worker.ts`: `041e34b5ce5daa3ad541cc22d0e5b265e921912323cafadb2518b33be399d0f2`.
- `protocol.ts`: `17abe3d1b6b59581fb41c54fadfe52c7da70f69d58253fb101bb1d52c5e046b4`.
- `worker-group-movement.test.ts`: `e58b5045e023f0989191e687f23ef7bb594e2dfa9ee44fa50decb36c2d3323ee`.
- `worker-movement.benchmark.ts`: `ac07446c6c4ac3105291db70d3a21a5f258e0aa71d50c82215fa735a40eeb5e3`.

## Authority and disclosure

- The complete preview or command envelope is checked before commands execute: request shape, bounded count, dense arrays, distinct army IDs, controlled faction, consistent action/destination/append choice and reviewed hash. Canonical ownership and travel eligibility remain in simulation.
- Accepted envelope entries run through the existing journal wrapper, in stable army ID order, with no second movement implementation. Foreign or missing army IDs receive the normal private ownership refusal.
- Preview rows derive from the permitted player observation through `getMovementPreview`, never spectator state or direct hidden geography. Rows expose cost, steps, availability, blocker and bounded search counters; paths and reachable-cell overlays are omitted.
- A visible attack preview becomes an unavailable queued-travel row with an explicit explanation. The only accepted batch command types are queue, resume and cancel; none invokes direct attack or war declaration. The canonical queue/resume functions continue to stop on obstruction or new hostile sightings.
- The preview observation cache is invalidated by canonical command execution and campaign replacement. The review’s hash identifies the fixed observation; the batch checks the canonical hash again before its first command.

## Mutation, saves and recovery

- Applying the batch is synchronous. The existing outer promise chain awaits autosave and final publication before handling another worker request, so a save/import or following command cannot interleave within the batch.
- Ordinary refusals remain individual recorded outcomes and do not stop later armies. A recorder exception stops the remaining batch, reports only the certain completed prefix, omits autosave, and leaves the worker’s recovery flag set. Save/export remain blocked until an explicit restore.
- A publication exception after batch start also requires restore. No rollback is promised for a partially mutated campaign.
- Successful accepted batches perform one autosave and one final state publication. Storage failure is reported as an autosave failure while preserving the accepted canonical outcomes and allowing export. An all-refused batch does not falsely claim an autosave.
- Append retains paused status; resume is explicit; cancellation deletes travel orders while retaining standing postings. These behaviors come from the unchanged canonical commands.
- Accepted rows now carry the final canonical event message, so an immediate arrival, interruption, cancellation or movement step is described factually rather than promising an active route. The new worker test exercises arrival, hostile-sighting interruption without battle, and cancellation.
- No modifications to canonical rules, save schema, content or AI source were present in the reviewed diff.

## Test inspection

The actual-worker harness imports the production module and substitutes only the message transport, using real structured cloning and the repository’s IndexedDB test backing. The inspected tests exercise malformed and stale envelopes, missing/foreign members, hidden occupants, unexplored destinations, visible attack refusal, the 128-member ceiling, stable ordering, one publication/autosave, exact serial command archives, replay, immediate save/restore and later continuation. They also cover paused append/resume/cancel with retained postings and failure after recording, publication or autosave.

Tests were inspected without rerunning during the parent’s reserved CPU window. The worker agent’s [final focused log](worker-final.log) records 10 tests passing. The [initial outcome-test failure](worker-outcomes-initial-failure.log) is retained: its authored fixture attempted war before visible contact; the fixture now establishes contact through ordinary observation before declaring war, then places the hidden threat. The assertions were retained. Full-suite and browser evidence remains the parent’s responsibility.

## Benchmark interpretation

The harness uses the existing synthetic mature Huge and Legendary fixtures, plus separately labeled 128-army expansions. Geography is generated; army counts and treasury are authored. It selects a legal destination from the permitted observation and does not claim an earned mature campaign or maximum route-search workload.

Each case is one sample. Query elapsed time includes worker handler/structured-clone overhead; query time is the worker’s own measurement. Batch elapsed time includes autosave and final publication, while setup/import/export/replay are outside the timed interval. There is no browser, renderer or percentile measurement. The query byte count measures the compact review payload, excluding the response ID/type/metrics envelope; result and state byte counters likewise follow the existing worker payload accounting rather than measuring transport framing.

The initial benchmark asserted unchanged map revision and absence of spectator output, but labeled the result `fogPreserved: true` without directly comparing the transferred cells to permitted observations. The parent had already requested a correction. The corrected harness reconstructs the delivered map from the initial packed cells plus the batch delta, compares every resulting cell with the final permitted observation, and compares the complete observation summary. Its output now says `permittedFogMatches: true` only after those assertions. This resolves the evidence-label issue at source level; final timing values must come from a clean completed run.
