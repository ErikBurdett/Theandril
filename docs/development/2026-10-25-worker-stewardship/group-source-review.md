# Group worker-policy source review

Reviewed the uncommitted worker-stewardship diff against primary checkout
`47174209f633a92930b8076b0b1ce7db13c3e38e` on 2026-10-25. This is an independent
source review by the simulation agent; it is not a review of a published commit
or a replacement for browser verification.

No blocking defect found in the new batch path:

- `apps/web/src/simulation.worker.ts`: the full request shape, dense 1–128
  commands, distinct actors, current faction, common policy focus and reviewed
  state hash are checked before the first canonical command. Ordinary refusals
  continue in stable settlement order. Recording failure stops subsequent orders;
  publication failure after execution requires restoration. Stale preflight
  rejection does not enter recording or recovery mode.
- `apps/web/src/group-posting-requests.ts`: the new worker-policy request uses
  the existing strict correlation ledger. Faction, exact submitted actor IDs,
  result count/order, accepted flags and refusal messages are checked before
  main-thread state adoption. Partial error responses reject the promise and
  require restoration rather than pretending that the omitted actors succeeded.
- `apps/web/src/main.tsx`: the new request is included in enqueue guards,
  cross-group busy guards, state-response validation, unexpected-response
  recovery, worker crash, campaign replacement, map-transfer failure, component
  disposal and pending-request reset paths. `expectedHash` is checked again
  before posting to the worker. Accepted result rows alone clear selected IDs.
- `apps/web/src/group-worker-policies.tsx` and `realm-navigation.tsx`: group
  pending state disables selection and competing controls; failed submission
  preserves checks. A new submission snapshots hearth names and resets its
  receipt. Named, filtered and paged receipts reuse `group-policy-results.tsx`.
  Removal explicitly limits its command set to selected hearths that currently
  have policies and discloses unchanged selections.

The review also read the new worker regressions in
`apps/web/src/worker-queries.test.ts`: stale/malformed envelopes, partial ordinary
refusals, recorder interruption, publication interruption and restoration are
exercised against the actual worker module. Their execution results belong to
the accompanying test logs, not this source-only review.

A minor copy observation was reported: the generic `applyGroupCommands` fallback
refusal text calls a non-posting command a charter. Canonical worker-policy
refusals currently always supply their own reason, so this fallback is not an
observed player defect. No source change was made during this review.

Limits: no malicious-worker threat model, no physical browser storage failure
simulation, no live deployment or visual acceptance was established by reading
these files. The legacy posting/charter batch path has no immediate autosave;
worker policies deliberately inherit that behavior. Saving and replay remain
separately verified campaign operations.
