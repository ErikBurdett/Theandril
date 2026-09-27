# Independent UI and integration source review

Date: 2026-09-26
Reviewer: `next_orders_assessment` subagent.
Authorship: reviewer authored the worker/protocol changes and worker tests/benchmark for this slice. Reviewer did not author `group-movement.tsx`, its presentation tests, registry/window/CSS changes, main-thread integration or request ledgers. This is an independent review of those UI/integration paths, not an independent review of the reviewer's worker implementation.

Scope: current uncommitted `apps/web/src/group-movement.tsx`, `group-movement.test.tsx`, `realm-navigation.tsx`, `realm-windows.tsx`, `realm-navigation.css`, `group-movement-requests.ts` and the travel-related `main.tsx` diff.

Result: no blocking source-level correctness finding in the reviewed UI/integration scope.

- Registry checks remain the existing bounded128 owned land armies ashore, retained across filters/pages and separate from hearth selections. Movement callbacks consume the same checks, including recalled saved groups.
- Destination entry only validates shape/world bounds. The worker supplies actual route costs, steps and refusals. Review is explicit; opening the panel, changing destination and recalling selection do not issue movement commands.
- A reviewed batch is tied to hash, faction, exact stable member list, target and append mode. Stale reviews are hidden during render and cleared on context changes. Main-thread ledgers validate response membership and consume superseded query replies separately from command responses.
- Apply dispatches ordinary queue commands for every reviewed member, with canonical refusals left for the actual worker. Resume chooses only selected paused routes; cancel chooses only selected existing routes. No UI path adds attack/war commands or changes canonical posting state.
- Player copy states immediate movement, stable order, possible arrival/pause, advisory previews, replacement versus append semantics and the consequence of preserving postings after cancellation. Accepted result rows render the newly returned factual canonical event message.
- Review and result lists paginate25 rows. Controls provide labels,44px minimum target height, narrow wrapping and visible keyboard focus for disclosure summaries. Pending review/orders lock registry checks, paging, filters and roster navigation; request-local in-flight guards prevent duplicate submissions before React rerenders.
- Main-thread failures after uncertain mutation require saved-campaign recovery. A malformed or stale read-only review does not falsely claim mutation or demand recovery by itself. Source swaps, campaign reset and worker teardown discard pending requests.

Verification limits: this review was read-only. It did not execute browser tests or inspect screenshots, and does not establish narrow viewport fit, focus behavior, pointer interaction, final-page reachability or the completed mature-realm acceptance journey. Parent-owned browser evidence and source-wide checks must cover those outcomes. The feature remains bounded coordinated travel; it does not deliver theater strategy, autonomous roles, synchronized arrival or reusable army-order templates.
