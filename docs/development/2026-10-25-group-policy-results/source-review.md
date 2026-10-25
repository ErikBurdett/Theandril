# Independent round-four preintegration review

Reviewed candidate source, component tests, browser scenarios, integration copies, current stylesheet selectors and canonical posting validation on 2026-10-25. No tests/builds executed and no tracked source changed during this review.

## Result

No blocking source correctness defect identified. Both hashes in `integration-baseline.json` still match the tracked posting/charter files at review time. The candidate integration differences are limited to importing the shared receipt, removing the old refusal-only presentation calculation, and replacing the rendered receipt. The round-one expected-hash contract remains intact.

## Source and interaction checks

- Each row uses its actual actor ID as the React key. Existing request/result validation supplies distinct, stable, correlated actor IDs; the component does not fabricate results or infer acceptance.
- Filtering and paging mutate only local presentation state. All 128 results are retained; display pages have at most 25 rows and preserve incoming worker order. Empty filters, page clamping and counts are consistent.
- Both integrations snapshot names when submitting and clear `results` before awaiting the real asynchronous worker. That removes the prior receipt before a successful reply mounts a fresh receipt with default filter/page. Incidental selection/busy rerenders correctly preserve the current receipt view. The new browser charter scenario explicitly checks a second submission resets an old Refused filter and disclosure state. A future integration that replaces `rows` in-place without this unmount boundary would need an explicit receipt identity/reset contract; the standalone component does not reset on arbitrary prop replacement.
- An error after submission leaves no old success receipt visible. Existing selected-ID removal still happens only for confirmed accepted actors. Refused actors remain selected. The component receives the parent's full locked state, so its filter and both paging controls are disabled while relevant work is pending.
- Native disclosure/filter controls remain keyboard accessible, and focus-visible styling is inherited. In the actual registry dialog, `campaign-hud.css` applies a 44px minimum to all summaries, buttons, inputs and selects. `registry-pages` also independently applies 44px button dimensions. Both posting and charter receipt containers have `overflow-wrap:anywhere`; no new summary-size fix is required merely because this component has no dedicated selector.

## Browser fixture validity and evidence

The mixed-result fixture authors 8192 posting records: 96 existing own policies plus 8096 expired foreign policies. This is a valid disclosed boundary snapshot: `validatePostings` explicitly permits missing armies until allocation cleanup, requires existing factions/in-world cells and stable unique IDs, and the test round-trips the authored state through the strict loader. `setPosting` allows existing-policy replacement at capacity and canonically refuses new policies, yielding the intended 96 accepts / 32 refusals. No turn advances to prune expired policies. This is not an organically grown 8192-policy campaign.

The browser cases use actual submissions, canonical expected journals, exact exported snapshots/archive comparison and replay. They inspect checked names across registry pages after receipt browsing. The charter case exercises 30 grants and 30 revocations and requires exactly 60 new records. They do not use production debug mutation hooks or synthesize response rows.

One evidence improvement is recommended before screenshot acceptance: the receipt list inherits `max-height:200px; overflow-y:auto`. Assertions that a last row contains a name establish DOM reachability, but do not prove that row is visible inside the nested scrolling list. Scroll each last target row into view and assert viewport visibility before retaining the corresponding screenshot. The current screenshots scroll the pagination navigation into view, which can leave a named result clipped inside the list. This is a test/evidence limitation, not a demonstrated inaccessible row.

Production behavior still requires integration checks and the browser runs. Source review does not establish their pass status, physical display quality, organic-scale acceptance or release-gate completion.
