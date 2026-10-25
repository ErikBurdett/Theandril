# Settlement order integration source review

Read-only review on 25 October 2026 against baseline `58d9a6e87718a0dadfb95ddbc2d490adc04b3c3d`. **No blocking source finding was identified in the reviewed parent integration.** This reviewer authored the settlement-order projection and its six pure tests; review of that projection is not independent authorship review. Parent-authored registry integration, four integration test cases and the Map guide addition were independently reviewed. No tests, typecheck, lint, build or browser execution occurred during this review.

## Source identity

| File | SHA-256 |
| --- | --- |
| `apps/web/src/realm-navigation.tsx` | `8985ba3f5a1129e6841b7b9b53ca90c4cf730411eb3e1290c5389e50f6641321` |
| `apps/web/src/realm-settlement-filter.test.tsx` | `17f198fbf80bcd522041d57699855c26ec7fe5c56b2c1d30e5f56530440d1bad` |
| `apps/web/src/settlement-order-status.ts` | `c2dc2e9dfa16788b94e78c6fa84c3cf4b1cb1887ccb41c0857ef035770c25c27` |
| `apps/web/src/settlement-order-status.test.ts` | `21b664bf8f01107736874b9a411b18974f50f0bfec916a13f1f2e161e1abb578` |
| `apps/web/src/main.tsx` | `2654614bdcd4afadeba44153aadde65f952210b2f1aef50227bacfe22dcdbc18` |

The roster wrapper, protocol and worker were byte-compared against the baseline and remain unchanged. The main-client difference is an explanatory Map guide paragraph only. Registry changes add a local settlement filter, a presentation index and row text. They add no canonical command, request, rule, save field or automatic turn work.

## Search, counts and paging

The existing base directory still restricts entries to the observed faction, then applies name/stable-ID search and stable/name sorting. Force-domain filtering still applies only to armies: a retained naval/embarked choice cannot hide towns. Settlement counts derive from the entire searched directory before the selected cohort and the 25-row page slice. The categories overlap, as the help text states; they are not summed into an attention total.

The new local filter starts at `all`. Its changes join the existing registry/search/force/sort page-reset effect. Rendering also clamps a stale page index to the last available page when an updated observation shrinks the cohort. The existing selected-entity effect follows a newly selected matching entity without jumping on every observation or pagination click. A selected entity outside the cohort does not silently clear the filter or its group check. Closing the registry unmounts its existing roster, so reopening resets the local filter; campaign resets also replace the existing keyed instance.

The army filtering path and labels remain separate. Settlement controls appear only for the settlement registry. An empty filtered cohort uses the clear-search/filter message instead of claiming that the realm has no settlements.

## Selection and locks

Checked towns remain in the existing `townGroupIds` state. Cohort changes do not prune them: availability cleanup only removes towns that are no longer observed and owned. `matchingGroupIds` now follows the filtered directory, so Select matching hearths adds the complete filtered cohort across pages while retaining prior checks elsewhere. Existing group-charter text discloses the outside-filter count. Accepted-ID removal is unchanged; filtering itself neither issues orders nor alters queues.

The new filter uses the same `locked` state as sorting, pagination, row navigation and checkboxes. It covers parent command busy and pending selection-group, production, movement, theater and patrol work. Search/tab controls retain the wrapper lock. This does not claim that every personal-template storage operation is a globally locked campaign order; those pre-existing local controls are outside this change.

## Canonical facts and wording

The index contains only owned observed towns, attaching matching-faction charters only when their town remains present. Foreign, mismatched-owner and orphaned charter rows cannot supply displayed metadata. It retains scalar copies, not queue or source-charter references.

No production means an empty queue, including towns whose charters have a next-turn candidate. Without charters may include queued work. Charters waiting requires an empty queue and a canonical non-null blocker. The UI does not parse reason text into severity or eligibility. Completed buildings, chosen budget ceilings and reserve limits can be ordinary reasons to wait.

Row details state direct orders when no charter exists. For an attached charter, current queue precedence takes priority even over contradictory supplied blocker metadata. Otherwise the exact canonical blocker or **Next candidate** name is shown. Help text explains that candidates share the treasury and do not guarantee a purchase. The Map guide accurately repeats these distinctions and warns that checked towns remain selected outside the active filter.

## Cost and evidence limits

The memoized projection is O(observed towns + supplied charters), retaining O(owned towns) small records. Counting and cohort filtering are linear directory passes; existing sorting and 25-row pagination remain. The projection rebuilds on changed supplied observation or registry kind, not per frame. No geography scan, path search, eligibility query or expanded worker transfer is added. These are source complexity bounds, not measured browser latency or mature-empire performance acceptance.

The four parent integration cases inspect actual server-rendered markup, searched counts, owned-only presentation, a last-page identity, queue/candidate/reason wording, outside-filter group selection and busy select/checkbox attributes. Static rendering uses callbacks that throw on actions and compares observation/campaign snapshots. These contracts do not execute React filter transitions, pagination effects, modal reopen, asynchronous work or public save restoration. Real browser checks and screenshot inspection remain parent-owned acceptance. No release gate is closed by this review.

## Progressive-disclosure follow-up

The parent’s first native 390px/130% capture showed the approximately 65-word explanation consuming roughly 180px above the order controls. In the revised source, the same explanatory text is inside a native `details.registry-filter-help` element, closed by default, with the summary **How these filters work**. The scoped CSS gives that summary a minimum 44px height and vertical padding. There is no new event handler, request, filter predicate or command: expanding the explanation only discloses text. The explanation remains reachable through the native keyboard-operable summary, and its meaning is unchanged. No new source blocker was found.

These hashes supersede the earlier navigation hash for the presentation follow-up:

| File | SHA-256 |
| --- | --- |
| `apps/web/src/realm-navigation.tsx` | `ba42347bf4f03c76e8044a10f604e6734113c132d9cf7dddf25599fc4b4d3dfe` |
| `apps/web/src/realm-navigation.css` | `345b70f634e4ff1b98ddd57ec94e3a720f4ab5ed0c18f036961c31a7c43cd846` |

The parent’s initial browser logs retain three affected journeys passing in 31.5 seconds (`browser.log`) and the separate army-registry regression passing in 13 seconds (`army-regression.log`). Those results predate the disclosure change and are not presented as its final browser verification. Final source checks and a rebuilt production journey/capture remain parent-owned. This follow-up is source/CSS review; this reviewer did not run checks or independently inspect the stated initial capture.
