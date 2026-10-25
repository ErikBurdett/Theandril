# Group patrol UI: implemented scope and cost

24 October 2026. Owned files: `apps/web/src/group-patrols.tsx`, its test, `realm-navigation.tsx`, `realm-windows.tsx`, and the group-patrol integration case in `realm-order-filter.test.tsx`. No simulation, AI, main application, worker or protocol edit was made by this UI owner. Parent and simulation owner supply those independent integration boundaries.

## Actual controls

A collapsed **Group patrols** disclosure shares existing checked owned land-army IDs ashore. Its buttons are **Pause enabled patrols (N)**, **Resume paused patrols (N)** and **Remove selected patrols (N)**. The counts reflect observed own existing policies; no-policy and already-desired-state entries are omitted from the submitted batch and remain checked. The text explicitly includes checked armies outside the current filter. Only confirmed accepted IDs are removed from selection; refused and skipped IDs remain. A caller-supplied selection above 128 is rejected as a whole with no commands, never silently truncated to a prefix.

The panel states that existing travel continues, Resume does not resume a paused route, and Group travel cancellation is separate. It warns when paused selected policies have Pause when war begins enabled, and that removing a policy discards its points and war option. Administrative eligibility is not redefined from movement, supply, current posting or override reports; simulation decides each submitted command.

The component requires a campaign hash, snapshots the intended action and display names on click, uses an immediate in-flight guard against repeated submission, reports pending upward and clears it on normal completion or unmount. The registry adds patrol to its combined pending flag, locking rows, checks, paging, order filter, sibling group controls and parent roster search/domain/tab navigation. Campaign replacement already remounts the roster by registry epoch; old completion cannot update an unmounted panel. Worker/result validation and saved-restoration recovery are independent request/main responsibilities.

Results use a live accepted/refused/skipped summary. Refused rows appear first and their result disclosure opens automatically; accepted rows remain available in the same bounded paged list. At most 25 results render per page, with labelled previous/next controls. A new submission clears prior results before awaiting the response. A rejected promise leaves selection intact and displays its actual error rather than pretending that no command could have applied.

## Source-level work bound

For `A` observed armies, `P` observed patrol records, `K` checked selectable armies and `B` submitted results:

- Selection reuses `groupPostingArmies`: an `O(A)` pass and stable sort of the checked actors, `O(K log K)`. Valid UI selections have `K ≤ 128`; an oversized external selection produces no commands.
- One `O(P)` own-policy map plus one `O(K)` pass builds pause/resume/remove arrays, each bounded to 128. No world cells, paths, simulation clone or per-army global policy search is used.
- Outside-filter counts, names and result grouping are `O(K)` / `O(B)`. Results and names are bounded to the batch; rendered result rows stay at 25.

This is render-time presentation work using existing observations. It makes no new path query and introduces no canonical per-turn loop. These are complexity bounds, not measured milliseconds, worker payload or full-scale latency acceptance.

## Focused verification

```sh
./node_modules/.bin/vitest run apps/web/src/group-patrols.test.tsx apps/web/src/realm-order-filter.test.tsx apps/web/src/realm-navigation.test.tsx apps/web/src/group-postings.test.tsx apps/web/src/group-movement.test.tsx
```

[Final bounded run](ui-focused-bounded.log): **34 tests across five files pass in 1.03 seconds**. [Scoped lint](ui-lint-bounded.log) passes. Seven new component/helper tests cover a canonical hundred-policy roster, actual command effects and strict saves preserving issued travel/spent movement, explicit observation privacy/domain contracts, whole-selection oversize refusal, historical absence, exact counts/help/locks and 25-row refusal-first results. The registry test checks optional army-only controls and the shared busy lock. Static rendering does not prove asynchronous interaction; real pending, response damage, selection retention, keyboard and narrow controls require the coordinated browser journeys.

The [first focused run](ui-focused-first.log) retains one test-only failure and 33 passes: the test assumed Watch company 1 occupied the first stable-ID page. The actual ordering placed other numeric IDs first. The corrected check verifies that all 25 rendered checkboxes are disabled, without relying on a fixture name appearing on that page. A subsequent review strengthened the oversized-selection contract from a capped prefix to no batch; `ui-focused-final.log` precedes that strengthening and is not the final guard evidence.

Source is frozen for parent integration. Full checks, worker failures, actual browser interaction and native image review remain separate acceptance. This does not complete M3, organically developed mature-realm workflows or any whole release gate.
