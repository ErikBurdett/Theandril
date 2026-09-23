# Independent review: grouped standing postings

Reviewed the group-posting request ledger, `main.tsx` integration, protocol and
actual worker boundary. The reviewer authored the registry UI, so this report
does **not** count as independent review of that UI. The baseline fleet commit
is `b623c2c`; review covers the subsequent local group-posting changes.

The worker validates the entire bounded envelope before applying any command,
accepts only ordinary `setPosting` commands for the current seat, sorts stable
army IDs, journals accepted and refused commands, and publishes one permitted
observation. Partial recorder failure publishes the actual resulting state,
stops the remaining commands and requires restoring a saved campaign. The main
thread correlates results by request ID and rejects old worker instances.
No canonical-rule, command-ordering or fog-disclosure defect was found in this
scope. Fourteen request-ledger and actual-worker tests passed independently.

## Finding and correction

**P2 — a failed group response could leave the request pending indefinitely.**
The previous main-thread state handler could return after rejecting the map
revision, throw during renderer update, or reach its end without group results.
React's general busy state was cleared, but the group request remained pending:
the registry displayed “Applying group orders…” and later individual orders
silently stopped behind the pending-group guard.

The handler now uses `try/catch/finally`. Its final block rejects a matching
request that was not completed, reports that orders might have applied, and
locks further campaign actions until a saved campaign is restored. Invalid
result arrays do not complete the request; campaign reset, worker failure and
unmount also reject outstanding work.

`tests/gameplay/group-posting-recovery.spec.ts` exercises two faults through
ordinary player controls: rejected map-revision metadata and missing group
results. Its Worker wrapper lets the real simulation apply the player's batch,
then changes only the first response's presentation metadata. Each journey
checks that the pending state ends, the recovery warning and command lock appear,
the real manual save restores the original hash, and a subsequent group succeeds.
This is fault injection, not a fabricated simulation or production debug API.

Browser execution is pending at this review checkpoint; add its exact results
after the coordinated browser run. Rendering exceptions are covered by the same
reviewed final block but are not separately injected by these two journeys.

Parent integration result: both damaged-response browser journeys passed in the seven-test run retained in `browser-final.log`; the100-army override/save/load and partial-refusal journeys also passed.
