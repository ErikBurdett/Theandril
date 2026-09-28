# Independent next-action review

Reviewed 2026-09-27: `apps/web/src/next-action.ts`, `next-action.test.ts`, `realm-navigation.tsx`, and `realm-windows.tsx`, with the parent-owned `main.tsx`/`DefenseTheaters` focus endpoints for context. Verdict: no blocking source finding. No source changes, test execution, or browser run were performed by this reviewer.

The enabled-owned-theater set is bounded by the canonical eight-theater limit. Its member set suppresses only the final generic idle-movement candidate. Existing eligibility checks remain in place; starvation, a stalled posting, and a paused direct route are considered before the delegation suppression. A paused route with a healthy standing posting now remains explicitly actionable. Disabled or foreign theaters do not hide an owned army's idle prompt, and observations without theaters retain the historical navigation behavior.

The new attention rows use canonical missing counts, refused dispatches, unavailable hearths and empty membership. They neither calculate threats/routes nor equate an accepted dispatch with arrival. Stable ID sorting and `nextAction` wrapping remain intact. The theater group sorts ahead of the other groups, whose previous count/label ordering remains intact. Each row retains a concrete report-derived reason.

`theaterFocus` passes unchanged through the roster and registry to the army-tab theater control. The parent endpoint opens the registry, selects the stable theater ID and focuses its summary; the nonce allows a repeated request to refocus the same theater. It issues no gameplay command and preserves the existing shared busy-state guards. Campaign replacement clears the focus and remounts the registry.

The two new unit cases check direct-order exceptions, historical/foreign/disabled exclusions, report-only attention, wrapping, group priority and observation nonmutation. `next-action-tests-final.log` reports 13 passing tests; this review did not rerun them. The real integrated journey remains separate evidence: `integrated-acceptance.md` discloses its authored geography/state and the retained initial selector timeout. No visual or completed M3/1.0 acceptance is inferred from this source review.

## Browser qualification

The subsequent real integrated journey exposed an effect-ordering defect that source inspection did not catch. The requested theater was selected and expanded, but `CampaignWindow` ran its parent `showModal`/heading-focus effect after the child summary-focus effect and stole keyboard focus. `integrated-browser-role-fixed.log` and its narrow failure screenshot retain this failed browser attempt. Thus the source finding about the intended focus endpoint is not proof that keyboard focus reached it in the browser. The assertion remains required.

The parent's correction was independently inspected after it landed: selection and disclosure opening remain immediate, while summary focus/scroll run in `requestAnimationFrame`, after the parent dialog-opening effect. Cleanup cancels a stale frame on a changed request or unmount. This addresses the observed effect-ordering race without arbitrary sleeps or a weakened assertion. Successful browser verification is still pending. No runtime edit or browser rerun was made by this reviewer.
