# Grouped hearth charters: independent integration review

Reviewed the local candidate after baseline
`f97009ddd776e91bf158f96893796a08afcc7c87` on 2026-09-24.
No blocking integration defect was found at this checkpoint.

The reviewer authored the new charter UI and registry changes. Independent
review therefore covers the separately authored
[`main.tsx`](../../../apps/web/src/main.tsx),
[`group-posting-requests.ts`](../../../apps/web/src/group-posting-requests.ts),
[`protocol.ts`](../../../apps/web/src/protocol.ts), and
[`simulation.worker.ts`](../../../apps/web/src/simulation.worker.ts) changes.
The UI selection and wording checks below are an author self-review, not a claim
of independent UI or visual acceptance.

## Main-thread and worker boundary

- Posting and charter submissions both check both pending-request ledgers. The
  ordinary command callback also refuses new commands while either group is
  pending. Request IDs distinguish the two result types; a wrong-kind terminal
  response cannot complete the pending request as a success.
- Both ledgers are rejected on campaign reset, worker failure, view unmount and
  unreadable map transfer. The state-handler final block rejects a matching
  request that remains unresolved after a rejected map revision, malformed or
  missing results, or a presentation exception. It reports that commands might
  have applied and locks further gameplay until a saved campaign is restored.
  The worker-instance check continues to discard replies from replaced workers.
- The worker validates the whole request before applying its first command:
  1–128 entries, the expected canonical command kind, current-seat faction,
  unique entity IDs, and ordinary command-schema bounds. A charter request
  cannot smuggle posting or unrelated commands into its batch.
- Commands are ordered by stable entity ID and enter the existing recorder
  individually. Canonical refusals are reported for their settlement while valid
  siblings continue. A recorder exception stops subsequent commands, publishes
  the actual partial state and requires restore. This is intentionally not an
  atomic transaction or a rollback guarantee.
- The extracted common batch loop retains the existing posting behavior. Each
  batch publishes one ordinary faction-filtered observation; no full canonical
  campaign or newly revealed map is returned. Result bytes are included once in
  the existing transfer accounting, under the matching batch kind.

## Selection and canonical semantics

The UI keeps separate checked-ID sets for armies and settlements. Tab changes
do not replace either set with the other entity kind; observation changes prune
missing or no-longer-owned entities from their respective set. Submission
captures the current permitted selection, and the completion callback removes
accepted IDs from its original set. Remounting the registry clears its temporary
selection, while unmounted order panels ignore late presentation updates.

The spending copy agrees with
[`resolveTurn`](../../../packages/sim/src/simulation.ts) and
[`advanceCharters`](../../../packages/sim/src/charters.ts): settlement yields and
existing production resolve first, maintenance is charged, and charters then
choose at most one new order per empty queue. Each ceiling is per work at one
hearth; the treasury and forty-coin reserve are shared. Granting a charter spends
no coin immediately. The panel makes no aggregate spending forecast.

Revocation uses the existing `setCharter` command with focus `none`. Its required
ceiling field comes from the current charter, so an unfinished or invalid grant
input does not prevent revocation. The command removes the charter and leaves
the current production queue intact, including work previously placed by that
charter. Future affordability, ownership and the charter-count limit remain
canonical decisions.

## Checks and limits

The reviewer ran:

```text
./node_modules/.bin/vitest run --project unit apps/web/src/group-charters.test.tsx apps/web/src/group-postings.test.tsx apps/web/src/realm-navigation.test.tsx
```

All **14 tests across three files passed**. These cover owned selection and the
128-order bound, retained posting regressions, the 25-row/40-hearth presentation
directory, real grant/revoke preservation of a paid manual queue and treasury,
and granting at the reserve while canonical affordability waits. Scoped ESLint
and `pnpm typecheck` also passed. The initial authored queue-preservation test
used a nonexistent `queueProduction` command; correcting the test to the existing
`queue` command resolved that test-authoring error without a runtime change.

Browser journeys are running separately under the parent agent; their results,
screenshots and transfer measurements are not claimed by this checkpoint.
Cross-browser certification, durable named groups, governor policies and wider
order templates remain outside this slice. No simulation rule, save version,
campaign pacing or release gate is accepted merely by this integration review.
