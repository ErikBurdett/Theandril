# Registry order filters — unapplied integration draft

Prepared 24 October 2026 while the project-counterplay candidate runs its separate acceptance checks. This packet changes no application source, test discovery, canonical state, worker protocol or published content. [registry-integration.patch](registry-integration.patch) contains two source files and two future test files. [registry-draft-source.json](registry-draft-source.json) identifies the exact existing registry source and draft bytes. `git apply --check` passed against that source; all four future TypeScript/TSX files parsed without syntax diagnostics. No draft unit test or browser acceptance has run yet. A later read-only compiler overlay now typechecks all six source/test/browser/fixture drafts; see [browser preparation](browser-draft-notes.md).

## Behavior and integration decisions

Use the existing owned observation projection from [the read-model design](read-model-design.md), with these final user-facing labels: **All forces**, **Postings and patrols**, **Orders waiting**, **Paused patrols**. The internal `standing` key retains the original helper contract; its label deliberately does not imply that defense theaters are included.

The registry owns a local `useState('all')` filter, matching its local sort/page lifetime. Changing the filter while the registry is mounted resets pagination and preserves checked IDs. Closing and reopening the registry resets the filter to All forces. This explicitly supersedes the original design's suggestion to preserve the filter across inspector navigation. No main/RealmWindows plumbing is required.

Search and domain filters run first. Counts cover that entire matching cohort, before the order filter and 25-row pagination. Applying an order filter does not permanently hide the counts for other cohorts. Settlement registries ignore army order filters. The order selector uses its own existing `registry-tools` row to avoid squeezing the sort/count row; 390px and 130% text remain browser checks.

The status index is memoized per observation while viewing armies. It walks observed armies and their supplied posting/patrol/route records once, without geography, pathfinding, command eligibility, state hashing or worker requests. The row renderer displays canonical posting mode/target/blocker, patrol policy status/target/blocker and travel status/final target/pause reason separately. Cell zero is retained. A disabled patrol with active travel displays both facts; movement points do not affect filter membership. Stale `lastError` does not determine waiting membership.

Existing checked-ID state, availability pruning, group limits, pending flags, selection recall and command handlers remain unchanged. The new cohort supplies the existing `matchingGroupIds`, preserving the existing outside-filter notice and additive Select matching behavior. The selector uses the same `locked` expression as sort, paging and row navigation. No new clear/resume/bulk action is introduced.

## Prepared tests and limits

[army-order-status.test.ts.txt](army-order-status.test.ts.txt) contains six future tests covering the canonical authored 101-army reports, no geography access, copied facts, disabled policy with zero movement and active travel, current waiting facts, route-only membership, foreign/missing actors, historical absence and deduplicated counts.

[realm-order-filter.test.tsx.txt](realm-order-filter.test.tsx.txt) contains six future tests covering the last-page paused policy before pagination, search/domain counts, the four labels/default/25-row bound, existing additive group selection/outside-filter text, the busy lock/settlement separation, and exact independent posting/travel reasons. The zero-movement/active-travel combination is explicitly an authored observation contract. It is not presented as an organically earned campaign or a strict save fixture.

These future tests use pure filtering and static rendering. They do not claim React interaction coverage. After approval and application, the browser acceptance must exercise:

1. A 101-army registry where the desired paused policy is last in stable order; use the actual select to find it with zero movement and active travel retained.
2. Check an army, narrow the cohort, confirm its outside-filter notice, add matching armies, return to All forces and confirm both checks. Verify pending group review locks the filter, preserves the review, and issues no accidental command.
3. Locate the army without issuing movement; return to the registry and confirm the documented All forces reset. Search/domain counts, an empty cohort, keyboard operation, 390px layout and 130% text remain usable.
4. Compare worker campaign hashes and command history around filter/navigation changes. An explicit ordinary follow-up order may resolve a chosen case, with exact save/replay verified separately; browsing/filtering itself must not do so.

This is a scoped directory workflow, not completion of M3 or the wider 1.0 gates. Source application, actual discovered unit/type/lint checks, real browser interaction, and any required measured large-roster cost remain pending. Read-only draft typecheck and browser-file lint have passed separately. No timing result is claimed while the parent owns the campaign-measurement window.
