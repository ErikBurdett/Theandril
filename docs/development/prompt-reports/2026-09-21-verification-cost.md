# Campaign verification performance continuation — 2026-09-21

## Prompt

“okay go ahead” — begin the next development priority after the deployment and
branch reconciliation: ACT-18 / DH-015 campaign verification performance.

## Delivered

Implemented three reviewed performance changes that preserve game behavior:
cheaper movement-query inputs, reuse of a sight update's local area, and linear
selection of an AI destination where its comparator permits it. Saved routes,
naval transport, fog memories and recorded decisions retain their captured
results. This is a local development checkpoint; the Epic timing issue is not
resolved. DHARMA now records ACT-18 as doing and DH-015 as open.

## Changed

- Runtime: `packages/sim/src/movement.ts`, `packages/sim/src/visibility.ts`,
  `packages/ai/src/navigation.ts`.
- Regression coverage: three new test files with **79 cases**; independent
  original captures and benchmarks under
  [`2026-09-21-verification-cost`](../2026-09-21-verification-cost/README.md).
- Status and review: canonical implementation status, a new draft developer
  packet, current browser imagery with provenance, this report and index.
- Tracker: only ACT-18 and DH-015 progress/history, followed by a locked local
  rebuild. [Receipt](../2026-09-21-verification-cost/tracker-update.json).

## Verified

- Final typecheck, lint, content/art validation and production build pass.
  [Evidence index and individual logs](../2026-09-21-verification-cost/README.md).
- Unchanged full headless suite: **1,937/1,938**, 223/224 files, 82.48 seconds.
  Epic is the sole failure: **60.606 seconds against 60**.
  [Raw result](../2026-09-21-verification-cost/full-headless-c.log).
- **25/25** affected Chromium gameplay journeys, 2.4 minutes.
  [Raw result](../2026-09-21-verification-cost/browser-gameplay.log).
- **27/27** rebuilt production Pages checks, 28.0 seconds.
  [Raw result](../2026-09-21-verification-cost/browser-pages.log).
- Independent source reviews found no remaining blocker in
  [movement](../2026-09-21-verification-cost/hash/movement-independent-review.md),
  [visibility](../2026-09-21-verification-cost/hash/visibility-independent-review.md)
  or [navigation](../2026-09-21-verification-cost/hash/navigation-independent-review.md).
  Focused checks overlap the full suite and are not added to its count.
- The independent [final factual/visual review](../2026-09-21-verification-cost/hash/final-factual-review.md)
  verifies the source manifest, actual logs and current screenshots without
  claiming whole-gate acceptance.
- [Source manifest](../2026-09-21-verification-cost/source-manifest.json) retains
  696 hashes; only the three named tracked runtime files differ from the deployed
  baseline. Original assertions, budgets, workflow and historical seals remain.

## Not done / caveats

Two consecutive full local passes and a complete hosted Verify campaign pass
are still missing. **ACT-18, DH-015, M0 and all fifteen whole release gates remain
open.** Operation benchmarks do not establish a campaign-wide percentage gain;
small navigation cases are mixed. Compiled validation, completed-report caching
and an additional neighbor buffer were rejected for compatibility or measured
cost. Original experiments and failed runs remain retained.

Rules/save remain **17**, content **`b79c78ed`**. No schema, gameplay, art,
dependency, worker-cap or timeout change. No commit, push, PR, deployment or new
hosted run occurred during this prompt. The user's primary checkout holds the
local changes on `fix/campaign-verification-cost`; local `master` and the public
site remain at `4ce95ae`. The previously preserved release worktree and recovery
bundle were not touched. Published journal entries retain their source pins;
the new [developer packet](../../updates/campaign-verification-work-packet.md)
remains draft.

## Follow-ups

Continue the measured Epic archive workload investigation, focusing on the
remaining hash/validation and complete AI planning costs while preserving error,
callback and mutation semantics. Require repeatable complete-operation gains
before integration, then the two unchanged full local passes and authorized
hosted verification. Follow the existing roadmap into M1 client contracts and
contestable unification after that foundation; M2 magic and M3 empire delegation
remain next dependencies.
