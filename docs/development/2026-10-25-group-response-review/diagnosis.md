# Legacy group reply correlation: confirmed narrow recovery gap

Read-only application investigation, prepared during group-patrol publication. No application, simulation, worker, discovered test or production bundle changed. No browser ran. [probe.ts](probe.ts) executes the exact acceptance expressions extracted from current `main.tsx` and the actual request-ledger classes; [probe.json](probe.json) retains sixteen cases and source SHA-256 values.

## Concrete behavior

`main.tsx:472` accepts any `groupPostingResults` array whose rows have a string `armyId`, boolean `accepted` and optional string `message`. `main.tsx:480` uses the equivalent check for `groupCharterResults`/`settlementId`. Neither expression compares the result set with the submitted commands. Their requests retain only a numeric request ID (`group-posting-requests.ts:5–21`); `issueGroupPosting` and `issueGroupCharter` enqueue only that ID (`main.tsx:566`, `579`).

For an intended two-actor batch, both actual ledgers resolve all these typed result arrays successfully:

| Damaged result | Accepted count shown by existing component formula | Consequence |
| --- | ---: | --- |
| Empty array | 0 | No actor cleared; action nevertheless completes without recovery |
| Only actor A | 1 | B remains checked; missing result is not treated as uncertain |
| A, A | 2 | Count says two accepted; only A clears |
| A, unrelated actor | 2 | Count says two accepted; B remains checked |
| A, B, unrelated actor | 3 | Count exceeds the submitted batch |

The component code consumes these arrays directly: `group-postings.tsx:70–71,95` and `group-charters.tsx:55–56,79`. It counts rows and clears the set of accepted IDs. The request is already finished, so `main.tsx:494` no longer sees it pending and does not enter the existing uncertain-result recovery path. This last recovery/selection consequence is a direct source trace, not a claim that this probe mounted React.

Important control: an entirely **missing result field**, or a row with a non-boolean `accepted`, fails the existing shape check. The request stays pending and the `finally` guard already sends it through recovery. “Missing row in a typed array” is the demonstrated gap; do not claim all missing replies are unhandled.

The normal worker validates unique submitted actors and emits complete, deterministically sorted result rows (`simulation.worker.ts:64–99,472–484`). This investigation does not establish that healthy worker execution spontaneously produces duplicates or wrong IDs. The demonstrated defect is the client accepting a damaged or mismatched completed presentation reply as a trustworthy outcome, contrary to its newer patrol/movement/production handling.

## Proposed bounded follow-on

After the first group-patrol deployment, give posting and charter request ledgers the submitted faction and exact sorted actor IDs. Validate their corresponding final state replies **before** updating the view, parallel to the existing `groupPatrolRequests.validate` call. Require exactly one well-formed row for each submitted actor in canonical order, with bounded count and meaningful refusal/error text. Wrong faction, duplicate, omitted, extra, wrong-actor, malformed or absent results must retain uncertainty and invoke the existing restore-before-retry path. A recorder error remains an uncertain partial batch, not a set of completed successes.

Keep `GroupOrderRequests` as the generic request-ID primitive used by other clients, or add an independently bounded wrapper; do not silently change selection-group semantics. Preserve unrelated reply handling, reset/old-response behavior, normal mixed accepted/refused results, and no-overlap guards. This requires no canonical rules, prices, save fields, worker command order or simulation changes. Adding stale-hash intent protection to legacy posting/charter requests is a separate scope; it is not needed to establish or fix this result-correlation bug.

## Production experiment and acceptance

Use a public save import of a two-army/two-hearth authored infrastructure fixture, strict saveable with a recorded origin. Save explicitly before the action. For postings, select two owned ashore companies and submit legal current-position postings. For charters, select two owned hearths and submit legal standing charters. No queue, route, movement or blocker values should be fabricated for the fault itself.

Wrap the native production worker exactly at the completed state-reply boundary, after its real ordinary command execution. Retain the original response and verify it against an independently applied ordinary command sequence. Alter **only** the relevant result array, once: duplicate a row, drop a row, or replace one actor ID. Preserve the actual observation, hash, archive and normal worker execution. First retain a fail-before browser result showing the current false completion; then require corrected behavior:

- no success report or accepted-selection clearing from the uncertain batch;
- clear restore-before-retry feedback, settled pending UI and locked End turn/retry;
- public Load restores the exact explicit pre-action snapshot/archive;
- an ordinary retry succeeds exactly once, preserving routes/armies for postings and existing queues/treasury for charters;
- public exports replay exactly, with the expected post-restore command count;
- native valid accepted/refused results remain usable, including actor-specific refusal reasons and retained refused selection.

Cover all damaged array shapes cheaply in focused ledger tests for both kinds; browser cases should establish the real shared boundary with at least one posting and one charter mismatch plus normal controls. The current missing-field control should stay covered, but is not a newly discovered failure. Production fault experiments, source implementation, builds and broader tests remain pending parent authorization after publication.
