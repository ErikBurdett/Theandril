# Give every hearth a standing brief

## Identity and publication boundary

- Proposed slug: `group-charters`; planned edition **07**, topic **Engineering**.
- **Draft.** Implementation source is not yet committed or pinned. Browser results, retained imagery and final checks are pending. Do not add this draft to the public catalog yet.
- Existing scope: **ACT-32 / M3**, extending settlement delegation. No new release obligation or scope cut.
- Rules/save remain **31** and content remains **`015468d1`**. Simulation rules, AI decisions, canonical state, save formats and campaign prices are unchanged.

## Candidate article

A growing realm needs a way to give several hearths the same standing brief without opening every settlement panel. The registry now selects up to 128 owned hearths across its existing 25-row pages. Search and registry changes keep that selection, independently of selected armies. Choose Works, Wealth, Learning or Muster and a coin ceiling, then apply the existing charter policy to the group. The resulting charters remain individual saved orders that can be changed at one hearth later; the selection and shared form are temporary conveniences, not durable named templates.

The form explains the financial commitment before submission. Assignment spends no coin immediately. A charter can place one work when its hearth’s queue is empty, once per turn after upkeep, within its own ceiling. Every hearth draws from the same treasury and leaves the existing forty-coin reserve. The ceiling applies to each work; it is not a pooled budget for the whole selected group. Muster can recruit land companies with their own upkeep. Existing production comes first, and revoking charters keeps work already queued.

Accepted hearths leave the selection. Refused hearths remain checked with the simulation’s reason, so the player can correct them without guessing which orders succeeded. Revocation skips hearths without charters and uses each existing charter’s ceiling; an invalid, unsubmitted grant value does not prevent cancellation. Rows show the observed policy and blockers. The UI submits ordinary `setCharter` commands and does not decide competing production or affordability rules.

The worker validates the entire request before changing the campaign, applies commands in stable settlement-ID order and records each normal result. It publishes one final permitted observation. Refusals do not cancel earlier accepted commands. A recording interruption can leave actual partial changes: processing stops, the UI shows the returned state and requires restoring a saved campaign. Missing or unreadable group responses also settle pending work and require recovery. This is a sequence of commands, not an atomic transaction.

An authored forty-hearth worker comparison produces identical grouped and serial archives, replay and final hash `e204a0e9`. The grouped response transfers **193,929 bytes**, compared with **7,409,845 bytes** across forty serial responses: one final state instead of forty. Queues, treasury and fog remain unchanged at assignment, and saved continuation is checked. This is a synthetic worker workload on a Small map. Any retained elapsed times are single illustrative samples, not browser frame-time distributions or whole-campaign performance claims.

The browser work uses different evidence: an authored Legendary realm with forty owned hearths and one hundred owned armies, plus generated-campaign production controls and two damaged-response scenarios. Their final results and inspected screenshots must be attached before describing those journeys as verified delivery. The intended checks cover selection, queue preservation, individual override, revocation, partial refusal and restoration through actual player controls.

This advances M3 without completing it. Durable named groups and reusable templates, theaters, patrol and escort roles, broader governor decisions and combined mature-campaign delegation remain open. No release gate is closed by this draft or by a later successful deployment.

## Evidence and publication handoff

[Architecture 0040](../architecture/0040-group-charters.md) records the boundary and cost. Implementation lives in `apps/web/src/group-charters.tsx`, the realm registry, `main.tsx`, the shared group request ledger, protocol and worker. The focused worker handoff reports **18 passing checks, including six new charter checks**; these are one execution scope, not 18 plus six, and must not be added to a later full-suite count.

The actual-worker comparison is in [worker-queries.test.ts](../../apps/web/src/worker-queries.test.ts). Browser sources are [group-charters.spec.ts](../../tests/gameplay/group-charters.spec.ts), [group-charter-recovery.spec.ts](../../tests/gameplay/group-charter-recovery.spec.ts) and [the production journey](../../tests/production/group-charters.spec.ts). The first browser attempt exposed an exact-label selector assumption; the test now selects the real combobox by accessible role/name. Retain that failed log beside the final rerun; no runtime rule or acceptance bound changed.

Before publication: commit and resolve the implementation SHA; reconcile final checks and independent reviews; retain and inspect real desktop/narrow captures with original pixels, hashes, viewports, authored setup and capture command; verify the journal image budget; then prepare the public entry, current roadmap update and production-subpath reader checks. Keep all six preceding dispatches and their source pins unchanged. Final publication and public readback belong to the parent’s authorized deployment workflow.

## Completed local implementation checks

The source pin is assigned after the implementation commit. At this checkpoint,
1,889 tests across 235 files pass with four local workers, 12 affected gameplay
journeys pass, and the built production charter journey passes without debug
hooks. Typecheck, lint, content/art validation and the Pages-subpath build pass.
[Evidence](../development/2026-09-24-group-charters/README.md) retains failed
selector attempts, sandbox subprocess refusals, a concurrency timeout and their
scoped corrections. Desktop and 390px original screenshots were inspected; narrow
revocation remains available with an invalid unsubmitted grant ceiling.
Independent integration/client reviews found no actionable defect. Publication
still needs the pinned article, catalog/layout review and live readback.
