# Group travel main-thread integration review

Reviewer: the UI subagent, independently inspecting the parent-authored main-thread integration and request ledgers. The reviewer authored `group-movement.tsx` and its roster wiring; this is not an independent review of those UI files.

Reviewed on 2026-09-26:

- `apps/web/src/main.tsx`: SHA-256 `65aaac8a074bd34a8a4afa3e2fb2119023f958fb94022a0c891d93e74f847b01`.
- `apps/web/src/group-movement-requests.ts`: SHA-256 `bfd318b22c0e6fbcfc5ad9c5a1cdb09d81a480ec5b8c7007f2e140fdb6fe5359`.
- `apps/web/src/group-movement-requests.test.ts`: SHA-256 `9843b667c25c729c65f9aa7110d4895a83dd9e0380110e28d7c0eb9bc0c5f1ac`.

## Finding submitted to the parent

The preview response branch consumes known superseded request IDs before ordinary command handling, but it honors `error.recoveryRequired` unconditionally after attempting to finish the preview ledger. A delayed error from an invalidated preview can therefore set the campaign recovery flag even when the ledger no longer recognizes that request. A current, successfully restored campaign should not inherit an obsolete preview's recovery state. Gate this handling on a live preview for the current worker/context. The reviewer did not edit parent-owned source files.

Resolved by the parent and reinspected: the branch now captures `active = source === worker.current && groupMovementPreviews.current.has(response.id)` before settling the ledger, and only honors the recovery flag for that active request. Superseded errors still terminate in the query branch and do not modify command locks or recovery state. Corrected `main.tsx` SHA-256: `0539a097f78e1b4129c13d0cae4140c30ce024ab0ba1ea7f1ef99bc0fac917ae`. The browser agent will exercise the delayed-error regression separately.

## Other checks

- Requests snapshot army membership; results must match the exact sorted submitted IDs and faction. Missing, duplicate, reordered, malformed and unexplained refusal rows are rejected before installing the campaign view.
- Preview responses contain bounded row summaries, with finite integer movement costs, bounded step and node counts, and explanatory unavailable rows. Hash, destination and append mode are correlated before resolving the query.
- Superseded ordinary preview replies return before the shared `setBusy(false)` path, so they cannot unlock a later mutating order.
- Unexpected mutating-order response types, malformed travel results, map decoding failures, incomplete result settlement and worker crashes during travel force recovery. They do not interpret uncertain outcomes as successful orders.
- Campaign reset, worker replacement and unmount reject outstanding travel promises. The request ledgers ignore stale IDs rather than consuming a later request.
- Group travel orders check the reviewed hash again before posting to the worker, share the current command locks, and block ordinary commands while the batch ledger is busy.

## Verification

The focused UI and ledger run passed 24 tests across four files: [ui-tests.log](ui-tests.log). Scoped ESLint and full repository TypeScript checks both exited 0; their no-output logs are [ui-lint.log](ui-lint.log) and [ui-typecheck.log](ui-typecheck.log). No initial failures occurred in these runs. Browser and performance evidence belongs to the parent integration run and is not claimed here.

Verdict: the stale recovery-flag finding is resolved. No remaining blocking findings in the inspected main-thread integration. This read review does not substitute for the parent’s browser recovery scenarios.
