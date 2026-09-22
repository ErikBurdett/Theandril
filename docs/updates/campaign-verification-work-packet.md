# Keeping campaign decisions exact while reducing repeated work

## Identity

- Stable entry slug: `campaign-verification-cost`.
- Publication state: **draft; not published**.
- Started: 2026-09-21, following the user's instruction to begin the next development work.
- Base revision: `4ce95aedab25536e24a0b34b3803a6cd3c9a5ad5`; working branch `fix/campaign-verification-cost`.
- Rules/save: **17**. Content: **`b79c78ed`**. No migration or gameplay scope change.
- Categories: campaign performance, regression verification.

## The player's problem

Long campaigns repeat movement previews, visibility updates and AI destination
selection many times. Reducing that repeated work should preserve the same
orders, fog memory and saved history. The current development release also has
an unresolved Epic archive timing gate; a faster individual operation cannot
establish that the full campaign now meets its budget.

## What changed

- Movement queries build one copied terrain/depth index per observation and
  avoid repeated capability and unnecessary road-direction work within a
  query. The same passenger, coast, ocean and road rules still decide where an
  army may travel. Complete queries and previews retain paths, blockers, costs
  and search counts. [Evidence and measured limits](../development/2026-09-21-verification-cost/movement/README.md).
- A positive visibility update reuses its ordered local hex area for remembered
  land and roads. Overlapping armies still keep cells visible until the final
  source leaves; departing armies retain remembered information. Visibility,
  land and road publication still occur in their original phases.
  [Evidence and measured limits](../development/2026-09-21-verification-cost/visibility/README.md).
- AI destination selection scans for the best candidate when its numeric scores
  define a stable ordering and no comparator callback is supplied. Callback
  and nonfinite cases retain the original sort. Reservations and frontier work
  budgets are unchanged. Gains mainly affect large reachable ranges; small
  generated examples and some fallback cases are flat or slightly slower.
  [Evidence and measured limits](../development/2026-09-21-verification-cost/navigation/README.md).

Save-validator compilation and completed-report caching were investigated but
not adopted. Their compatibility or benefit did not justify a production
change. [Retained findings](../development/2026-09-21-verification-cost/hash/README.md).

### Continuation — 22 September 2026 (draft, unreviewed)

- **Fewer wasted route searches.** When a fleet looks for a landing or rendezvous that its
  known water cannot reach, the planner now answers from the first search that proved
  this, instead of searching again for every candidate shore.
- **Cheaper campaign seals.** Remembered land and finished battle reports are sealed
  without being re-validated from scratch at every end of turn. Battle reports become
  frozen history once they are recorded.
- **Unchanged results.** Nine generated campaigns, 125,026 AI orders in total, produce
  identical orders, turn seals and save files. The Epic archive check now passes the
  full local suite in 42–48 seconds. The test suite now runs in 47 seconds instead of 81.

This is a local result only. Hosted verification remains open. See the
[evidence](../development/2026-09-22-campaign-cost/README.md).

## Gameplay illustration

![Saved expedition landing controls at 390 pixels](../development/2026-09-21-verification-cost/screens/transport-landing-390.png)

**Current local candidate, unchanged interface:** this authored naval browser
scenario shows a passenger's legal landing controls after restoring a paid,
researched voyage. It illustrates the movement/save workflow protected here;
it is not an organic AI colony. The scenario completes landing and saves again.

![A generated campaign's actual technical chronicle](../development/2026-09-21-verification-cost/screens/technical-ledger.png)

**Current local candidate:** the generated Short AI-watch campaign with seed
20260905 reaches victory after saved continuation. Its technical chronicle shows
real accepted orders and the complete JSON download. This is not Epic timing
acceptance. Both captures retain exact Playwright bytes and inspected
[provenance](../development/2026-09-21-verification-cost/screens/provenance.json).
No new artwork or image transformation is included.

## Scope ledger and road to 1.0

This work advances the existing **M0 / ACT-18 / DH-015** campaign verification
task. It adds no gameplay feature and defers no existing acceptance requirement.
Gates A and C remain open; save/replay and military regressions support the
bounded work without completing Gates E or F. **All fifteen whole release gates
remain open.** The [existing roadmap](../1.0-DEVELOPMENT.md#active-development-roadmap)
still places M1 client contracts and a contestable unification victory after
M0, followed by M2 magic and M3 empire delegation.

## Verification and handoff

The [evidence index](../development/2026-09-21-verification-cost/README.md) records
the final candidate, passing checks, unsuccessful runs, benchmark scope and
independent reviews. The full unchanged Epic archive test must pass twice locally
and hosted verification must finish before ACT-18 can be called complete.
Historical isolated passes and operation-level timings do not satisfy that gate.

Source ownership remains `packages/sim` for movement and visibility, and
`packages/ai` for observation-only destination selection. No worker cap, timeout,
campaign activity threshold, schema, dependency or workflow gate was changed.

## Review and publication record

Independent source reviews cover [movement](../development/2026-09-21-verification-cost/hash/movement-independent-review.md),
[visibility](../development/2026-09-21-verification-cost/hash/visibility-independent-review.md)
and [navigation](../development/2026-09-21-verification-cost/hash/navigation-independent-review.md).
The public journal retains its published source pins; this draft is not added
as a delivered public entry. Candidate integration and factual-review results
are retained in the evidence index. No publication or hosted result is claimed
for this draft.

The [final factual and visual review](../development/2026-09-21-verification-cost/hash/final-factual-review.md)
found no blocking issue in the bounded local claims, source manifest, logs or
current imagery. Its approval preserves the failed Epic result and all open
gates; this packet remains unpublished.
