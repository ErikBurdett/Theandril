# Epic baseline continuation — 2026-09-21

## Prompt

“Continue development.” Continue the existing authorized roadmap work while preserving the earlier uncommitted changes.

## Delivered

Movement queries reuse temporary neighbor storage and avoid an unused predecessor map during range searches. Naval AI delays geography/navigation preparation until a plan needs it. Captured routes, node budgets, complete proposals and the paid saved voyage retain their original results. These are modest performance changes, with mixed query-level results; no whole-campaign speedup is claimed.

The compendium browser test now saves screenshots with each test run instead of overwriting historical review images. Its assertions and viewport coverage remain intact. The canonical roadmap, implementation status and existing draft developer packet record this checkpoint and the remaining Epic failure.

## Changed

- Runtime: `packages/mapgen/src/index.ts`, `packages/sim/src/movement.ts`, `packages/ai/src/naval.ts`.
- Regression coverage: `packages/mapgen/src/neighbors-into.test.ts` and `packages/ai/src/naval-publication-equivalence.test.ts`, with 39 new cases. Browser evidence correction: `tests/gameplay/compendium.spec.ts`.
- Evidence: [Epic baseline index](../2026-09-21-epic-baseline/README.md), including paired measurements, original-output captures, rejected experiments, full-suite diagnostics, current screenshots and independent reviews.
- Status: [implementation status](../../IMPLEMENTATION_STATUS.md), [existing M0–M10 roadmap](../../1.0-DEVELOPMENT.md#active-development-roadmap), [draft developer packet](../../updates/campaign-foundation-work-packet.md).

The [final manifest](../2026-09-21-epic-baseline/source-manifest.json) records 614 source/config/input paths at base commit `f07024fe23ad3386874656d48fbbc33a5380d979` plus the preserved working changes. Only the later compendium screenshot-path correction differs from the frozen timing manifest; it is outside the headless test selection. Rules/save remain 17 and content remains `b79c78ed`. No migration, new gameplay rule or art change was made.

## Verified

All checks use Node 22.23.2; browser checks use installed Chromium.

| Check | Result and evidence |
| --- | --- |
| Typecheck and lint, including the final browser-test correction | Pass: [typecheck](../2026-09-21-epic-baseline/typecheck-final.log), [lint](../2026-09-21-epic-baseline/lint-final.log). |
| Content, art and production build | Pass: [content](../2026-09-21-epic-baseline/content.log), [art](../2026-09-21-epic-baseline/art.log), [Pages build](../2026-09-21-epic-baseline/build.log). Existing bundle-size warning remains. |
| Complete default headless suite | **1,857/1,858 tests**, **220/221 files**, 87.84 seconds. Epic alone fails at **64.779 seconds against 60**. [Raw log](../2026-09-21-epic-baseline/runner/default-b.log). |
| Focused movement and naval verification | **92/92** and **60/60**, overlapping the full suite: [movement](../2026-09-21-epic-baseline/movement/focused.log), [naval](../2026-09-21-epic-baseline/ai/focused-final.log). Original paid voyage retains 22 accepted commands and hash `fa29672f`. [Voyage comparison](../2026-09-21-epic-baseline/ai/naval-campaign-verify.log). |
| Affected gameplay browser scenarios | **25/25**, 2.6 minutes: [log](../2026-09-21-epic-baseline/browser-gameplay.log). |
| Rebuilt production Pages suite | **27/27**, 28.9 seconds: [log](../2026-09-21-epic-baseline/browser-pages.log). Historical compendium captures remain unchanged. |
| Independent review | Bounded movement/naval changes and final source, factual claims and current image provenance have no blocking findings. [Final review](../2026-09-21-epic-baseline/review/final.md). Reviews do not override Epic's failure. |

Eight-worker and four-worker diagnostics use the same source, files, assertions and budgets. Both fail Epic, at 64.474 and 63.069 seconds; four workers also increases total suite time to 100.67 seconds. No worker policy is adopted. These single-case diagnostics measure wall and CPU time, not memory or universal performance. [Analysis and retained results](../2026-09-21-epic-baseline/runner/analysis.md). The missing `/usr/bin/time` wrapper attempt is retained separately as a tooling failure before tests ran.

## Not done / blocked / caveats

M0 and all fifteen whole release gates remain open. The scoped browser suites are not complete gameplay or cross-browser certification, and no new hosted-CI result is claimed. Neither test timeouts nor activity/assertion requirements were relaxed. Hash kernels, a validation wrapper and an alternate movement heap were rejected; archive command reuse and a shared preview session were not introduced.

Client states and unification are not implemented. Read-only M1 integration notes now resolve concrete offer-conflict, contact, payment-overflow and separation-truce decisions; those notes are preparation, not delivered gameplay.

No commit, push, publication or deployment occurred. Work remains in the user's primary checkout on `master`; no published-checkout sync was needed. Earlier changes and failed evidence are preserved. All test processes started for this pass have finished.

## Follow-ups

Resolve the actual Epic archive runtime before clearing M0. The measured worker caps did not solve it; avoid another unchanged retry. Use the retained profile and concurrent Epic/pacing timings to select the next bounded implementation change while preserving full archive validation and historical output.

Then carry M1a negotiated client contracts through canonical commands, filtered observations, human controls, AI budgets and historical save/replay compatibility using the retained rules-17 fixture. Settlement transfer, client capture and contestable unification remain explicit M1 follow-ups.
