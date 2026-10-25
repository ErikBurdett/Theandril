# Independent main/worker integration source review

24 October 2026. Reviewer authored the UI component and registry wiring, not `main.tsx`, `protocol.ts`, `group-patrol-requests.ts` or `simulation.worker.ts`. This review is independent for those four integration files only. Their inspected hashes are in [ui-main-review-sources.json](ui-main-review-sources.json). This is source review, not a claim that the pending production recovery journeys have already passed.

## Findings

No blocking source finding was found in the inspected group-patrol integration:

- Main rejects commands while another exclusive group operation, route preview, campaign fault, worker replacement, Watch control, victory, battle or capture decision blocks them. The supplied expected hash must match the current view before posting.
- The worker validates the complete request before canonical work: dense nonempty array of at most 128 commands, distinct army IDs, the current seat's faction, one action and one enabled value, allowed canonical command types and the expected current hash. There is no command for creating/changing endpoints in this batch API. Stable ID order is explicit.
- Each item executes through the existing recorded canonical command path. Ordinary refusals remain individual results; recording/publication failures remain uncertain execution rather than synthetic refusals. One final observation/result state is published, with a single autosave for an accepted, otherwise successful batch.
- The request ledger retains the exact sorted submitted IDs and faction. Results require complete ordered coverage, exact allowed row keys, boolean acceptance and bounded nonempty messages for refusals. Main validates them before adopting the observation/hash. Missing, duplicated, foreign, reordered or malformed result rows cannot become success callbacks.
- Main handles a group error, malformed reply, map decode failure, undeliverable state and worker crash by rejecting the pending action and preserving the existing saved-restoration recovery lock. It does not automatically retry or remove selections on an uncertain response. A recorder failure also protects the worker against continued writes.
- The new request ledger participates in campaign-reset and unmount cleanup, worker-crash handling, other group issuers' exclusion guards and the ordinary-command guard. Main passes the current hash and callback through `RealmRoster`; the existing registry epoch remount handles campaign replacement.

The component intentionally trusts this strict issue boundary for response shape. Its own guard prevents double submission before a React pending update; its unmount guard prevents late local result/selection updates. Static component tests and source inspection do not replace actual worker/DOM error-path acceptance. Parent-owned missing-results, wrong-army and post-batch crash journeys remain the required observable proof, alongside the real 101-army normal workflow.
