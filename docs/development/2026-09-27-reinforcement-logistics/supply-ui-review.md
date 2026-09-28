# Independent supply UI and worker review

Reviewer: supply simulation/AI implementation agent, independently reviewing the parent-authored UI, response guard, main-thread handling and worker integration. This reviewer authored supply rules/AI and the separate production supply test, but did not author or edit the UI/worker changes reviewed here. Source and native image inspection are read-only; no duplicate browser/worker tests were run for this review.

Reviewed: `apps/web/src/supply-access.tsx`, `supply-access-response.ts`, its response tests, `diplomacy.tsx`, relevant `main.tsx` state/command handling, `simulation.worker.ts` publication/autosave paths and the supply cases in `worker-group-movement.test.ts`.

## Publication recovery finding — corrected and verified

The initial direct human-provider acceptance path set `delegationApplied = 'supply agreement'` after its canonical command, so a subsequent publication exception correctly locked the campaign. The ordinary human-buyer path accepted through the AI loop while handling `endTurn`; the request's final command cleared that flag to false. A successful AI payment followed by failed state publication therefore could omit `recoveryRequired` when recording itself succeeded. The same defect affected `watchRound`. Canonical state and autosave could advance while the UI retained its old view.

Parent was notified immediately. A separate worker-test author reproduced both paths in [the initial log](supply-ai-worker-recovery-initial.log). The parent then added request-local `issueCommand`, which latches any accepted supply proposal, response or termination across both AI loops and the player command. Final End turn preserves the latch; the existing catch therefore locks subsequent orders after uncertain publication. I inspected that correction and the retained results.

Both unchanged regressions pass in [the corrected run](supply-ai-worker-recovery-corrected.log): 2/2 in 1.88 seconds, with the other 15 file cases filtered for the focused comparison. All five affected worker/response files then pass 54/54, without skips, in [17.88 seconds](supply-ai-worker-recovery-affected.log). These counts overlap. Tests prove actual AI acceptance, exact payment through archive prefixes, one autosave, matching uninterrupted/replayed state, retry/save/export locks, exact auto restoration and no second payment on the next round. [The independent worker report](worker-recovery-review.md) records the full scope. The finding is closed; these are headless worker checks, not browser fault recovery or full release acceptance.

## Native visual review

Viewed both original PNGs directly, without cropping, resizing or re-encoding:

| Capture | Exact file | SHA-256 |
| --- | --- | --- |
| [Contracted harbor, desktop](browser-evidence/supply-role-fixed/supply-access-negotiate-fo-47f93-over-with-a-saved-agreement/contracted-harbor-desktop.png) | 794 × 703, 235,608 bytes | `72405086f98ac4f615e187083c7e884bfc840b47d6d270fc7454338a47a95e8c` |
| [Pending request, narrow](browser-evidence/supply-role-fixed/supply-access-negotiate-fo-47f93-over-with-a-saved-agreement/supply-request-narrow.png) | 328 × 849, 144,812 bytes; 390-pixel browser viewport | `a2b76b0f659fa24606c25fb7f9a6ec4493cc0d6650696fdf4204acf25c28b9b3` |

The desktop panel has a clear title, named and labelled controls, readable payment/expiry/disruption text, the named supplier, the exact 20-coin payment and the termination button's no-refund consequence. The narrow panel wraps the explanation and promised-coin notice without visible horizontal clipping. The unavailable source and review/send controls correctly appear disabled after this source already has a request or agreement. The narrow capture ends before the pending request card; its lower portion includes the surrounding dark area. It is evidence of the visible form and pending-fee notice, not an approved full-card or full-dialog illustration. No visual blocker appears in the shown regions. Contrast ratios, screen-reader behavior and global-provider saturation were not measured by inspecting these pixels.

[The two actual Chromium journeys](supply-browser-role-fixed.log) pass in 13.8 seconds. The buyer journey obtains AI acceptance, feeds fleet/cargo/land, ends the agreement, observes land strength loss and stores falling to seven, renegotiates, returns stores to eight, and preserves the exact save/archive on restoration. The provider journey accepts by keyboard and receives one payment. The [initial buyer failure](supply-browser-initial.log) was an exact-label lookup on a select containing option text; using its actual combobox role corrected the lookup without weakening assertions. These journeys use an explicitly authored naval fixture and development observation hooks; the separately authored production test still needs its own built-game result.

## Other findings

- The panel gets terms and source facts from the permitted observation. Review uses the canonical pure assessment, and the reviewed signature plus state hash invalidates stale edits. No competing reach or acceptance rules are implemented in the UI.
- The selector excludes existing own requests/imports and known war partners. Fee/term form bounds and canonical assessment govern submission; mutation still passes through the ordinary command API. Explicit text describes the upfront payment, expiry, disruption, no-refund termination and absence of movement/passage grants.
- Participant offers/agreements display immutable disclosed source facts. The panel distinguishes last-known map coverage from actual own-army supply. It does not refresh hidden source names, captors, harbor state or blockade positions.
- The response guard strictly parses bounded record shapes, verifies seat participation, stable order, unique record IDs and buyer/source references, and enforces the per-buyer limits before rendering. Main-thread parsing failures lock gameplay and require restoring a saved campaign.
- Ordinary commands reject the wrong seat in the worker, record through the journal, and attempt one autosave before publication. Autosave failure remains visible while preserving the accepted in-memory state and prior save. Worker tests now cover direct and AI acceptance, malformed/repeated refusal, payment publication failure and failed autosave.
- The panel renders all participant cards. A provider can accumulate substantially more cards than the buyer's eight-import cap. No global-provider saturation/UI performance acceptance is established by this source review or the one-buyer benchmark; retain that boundary in M4 status.

No unresolved blocker was found in this bounded supply review. It does not approve the separate integrated M3 journey, final production build, pacing, benchmark, deployment or 1.0 release gates.
