# Independent source review — group posting and charter intent

Reviewed on 2026-10-25 against the working-tree round-one diff, before publication. This review inspected implementation and test source; the reviewer did not run builds or tests concurrently with the main verification job.

## Findings

No blocking correctness issue found in the intent-guard change.

- `protocol.ts` requires an `expectedHash` on both legacy batch requests. `realm-navigation.tsx` supplies the registry's observed hash to both forms; their submit handlers and buttons refuse missing hashes for assignment and removal alike.
- Each form passes the same captured hash alongside the commands composed from its rendered observation. `main.tsx` compares it with the latest hash before enqueuing or setting busy state. A changed view cannot silently acquire a newer hash at dispatch.
- `simulation.worker.ts` validates the hash's exact eight-character lowercase hexadecimal shape as part of envelope validation, then compares it with canonical `stateHash(state)` before `applyGroupCommands`. That path performs no simulation command, journal recording or autosave before rejection.
- A stale request produces the ordinary error reply. The unchanged client error handler rejects the outstanding batch and clears busy state; selection removal occurs only after successful per-actor results. Rejection does not set `recordingFailed` or require saved restoration.
- Fresh requests retain existing stable actor ordering and per-command canonical refusals. Existing result identity/faction correlation still runs before state adoption. Recorder interruption and uncertain-response recovery paths were not weakened or bypassed by the diff.
- Test source covers stale assignments and removals for both families after a real intervening policy command. It compares complete exported archives, spies on recording and saving, verifies no recovery lock, then retries with the current hash and checks the resulting recorded command and replay. Missing/malformed hashes and form submission availability have separate coverage. Existing partial-refusal and recorder-recovery tests now supply current hashes rather than bypassing the guard.

## Scope and limits

This protects a submitted batch against a changed canonical state; it is not a new policy, command, save schema or campaign pacing change. The eight-character hash retains the project's existing state-hash contract. Source review does not replace the parent's runtime/browser verification or establish organic large-realm acceptance. The reviewed tests' execution results are recorded separately in this directory.

Group production does not gain an intent guard in this slice. Group patrol assignment work remains isolated outside the tracked source tree for the subsequent round.
