# Unapplied registry integration review

24 October 2026. Read the draft helper, registry component, two future test files,
integration patch, design and manifest. No application source, discovered test,
browser or heavy check was changed/run for this review. This reviewer authored
the earlier pure projection draft: this is an independent review of the subsequent
registry integration/test design, not independent author separation for that
helper. The parent has separately reviewed the helper.

## Source disposition

One concrete compatibility correction was requested: the initial draft changed
the existing **Route interrupted** phrase to **Travel paused**, and its tests
expected the replacement. Retain the original phrase in the expanded row and
draft tests; do not rewrite the existing movement regression to accept the new
phrase. This preserves established terminology/selectors while the distinct
**Patrol policy: paused** row explains the policy. The owner corrected the draft
renderer, test expectations and patch; this reviewer confirmed all five manifest
hashes and independently ran successful `git apply --check` without applying it.
The original movement regression remains unchanged. **No scoped source blocker
remains in the corrected unapplied integration.** This is not completed runtime
or browser acceptance.

No other scoped source blocker was identified. The helper copies permitted own
posting/patrol/route facts into a presentation index and does not inspect cells,
canonical state, hidden geography, path search or command eligibility. Foreign
and missing army IDs are excluded; posting/patrol faction IDs are also checked.
Route ownership follows the existing owned-actor index. Nonempty route waypoints
are a canonical observation invariant, not a new UI rule. Hex 0 remains numeric.
No stale patrol lastError is promoted into a current blocker.

Postings and patrols includes disabled policies; Orders waiting unions canonical
posting blockers, enabled patrol waiting status and interrupted travel; Paused
patrols means disabled policy regardless of movement/route. These describe supplied
facts, not defect priority, retirement eligibility or a second attention queue.
Posting, patrol and route facts render independently so one does not overwrite
another's reason. Existing next-action priorities and command paths are unchanged.

The component indexes once per observation while showing armies. Existing
search/domain/sort produces the base cohort, counts use that entire cohort, the
order filter narrows it, and pagination renders at most 25 rows. Counts do not
shrink to the currently selected order cohort or page. The new work is linear
in observed actors/order records plus the existing sorting; no per-row global
scan or worker query is introduced. This source estimate is not a measured
whole-world performance result.

Checked IDs remain in their existing independent state. They are pruned only by
the existing availability rules, not the new filter. Matching IDs derive from
the final cohort; additive Select matching retains checked actors outside it,
and the existing group form displays that outside-filter count. The selection
cap, group callbacks and accepted-command removal remain unchanged. Filter
changes reset page, not selected army or checked IDs. The existing locked value
includes busy, selection-group, production, movement and theater pending states
and now disables the order select as well. This needs real interaction proof;
source wiring alone does not prove pending-state transitions.

The order filter is local `useState('all')`, deliberately resetting when the
registry unmounts. Integration notes and the browser design disclose this and
supersede the original persistent-filter proposal. No new main/worker plumbing
is implied. The settlement registry omits the control and ignores order filtering.
An empty filtered cohort asks the user to clear search/filter rather than falsely
suggesting recruitment. Existing selected-ID page following remains unchanged.

## Test interpretation and outstanding acceptance

The future helper tests distinguish ordinary canonical reports from deliberately
authored observation contracts. They cover owned-only projection, copied facts,
no geography access, disabled patrol plus zero movement/active travel, paused
route union, ignored stale errors, historical patrol absence and deduplicated
counts. The registry tests verify last-page lookup before pagination, composed
counts, initial 25 rows/four labels, group helper semantics, static busy lock and
exact independent row reasons.

These are pure/static tests; they have not yet run as discovered application
tests and do not assert React selection transitions, filter lifetime, keyboard
or true pending review locks. Applying the draft, typecheck/lint/unit checks and
the actual browser fixture/design remain required. Real browser resolution must
issue the existing Resume/Clear/etc. command explicitly and prove exact saved
history and current-route preservation. Narrow enlarged-text pixels, honest
empty states, same-campaign import and production hooks-absent behavior remain
separate acceptance. Do not count this draft as completed M3 or release work.

## Corrected draft identity

| Artifact | SHA-256 |
| --- | --- |
| `army-order-status.ts.txt` | `185e20c505a11e93ead7f48aafb108e0a8e2cee6504a378f5c861c73c8be628d` |
| `realm-navigation.tsx.txt` | `814611d31790c4ac9eeddcc2219682398cab8174f5d50c812b0bf86e788f1fc0` |
| `army-order-status.test.ts.txt` | `55d12f99d9dfb5c0649de2b20b0ae380f220c0151773d28cf9bfcf0b4ac3ce1c` |
| `realm-order-filter.test.tsx.txt` | `9823c19d5e0ff62332eb2c58d0aa12023544064ae2471299e6b85ff883942d8c` |
| `registry-integration.patch` | `f89105671c70d0d18d05282351c34284c0ecb4d99347129690d20e2bb7643a31` |
