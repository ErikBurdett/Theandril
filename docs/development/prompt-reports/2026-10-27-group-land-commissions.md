# Group land commissions, deployed — 2026-10-27

## Prompt

“Continue.” Standing instruction: develop toward 1.0, commit and deploy each
feature or fix to the GitHub Pages development site.

## Delivered

Checked hearths and saved groups can receive or end land commissions together.
Choose one exact improvement, a remaining allowance per hearth and a shared
treasury reserve. The panel shows exact aggregate permission, including selections
outside the current filter. Permission is not escrow or guaranteed immediate work.
Each ordinary command sees the purse left by earlier orders; individual receipts
clear only confirmed acceptances. Ending permission preserves paid work.

Uncertain or mismatched replies lock further orders until saved restoration,
including failures after actual payment. Reapplying replaces the allowance.
Transport batches support up to 128 hearths; larger requests are rejected whole,
not silently truncated. This is not a campaign hearth limit.

Feature `cfd660c` and reviewed journal `d65b016` are separately deployed and
publicly verified. [Play](https://erikburdett.github.io/Theandril/) ·
[Give several hearths a land budget](https://erikburdett.github.io/Theandril/updates/dispatches/?dispatch=group-land-commissions).
Existing ACT-32/M3 advances; no tracked issue or release gate is closed.

## Changed

- `apps/web`: group commission form and receipts, compact registry summaries,
  whole-envelope worker validation, stable ordinary command execution, strict
  reply correlation and saved recovery through root lifecycle paths.
- UI/worker/correlation tests and real production browser journeys cover shared
  money, partial outcomes, removal, saved replay and damaged paid replies.
- ADR0056, canonical implementation status, 1.0 development notes and reviewed
  journal with exact native screenshot provenance and retained historical content.
- Canonical simulation, AI, persistence and chronicle rules are unchanged:
  rules/save 37 and content 015468d1. No new pacing measurement was needed for this
  client-only coordination of existing ordinary commands.

## Verified

[Implementation packet](../2026-10-26-group-land-commissions/README.md) and
[publication packet](../2026-10-26-group-land-commissions-publication/README.md):

- [Final full suite](../2026-10-26-group-land-commissions-publication/tests.log):
  **2,488 tests / 300 files pass in 135.33 seconds**, with two workers.
  Typecheck, lint, content/art validation and the production Pages build pass.
- [Whole local Pages run](../2026-10-26-group-land-commissions/browser-full.log)
  passes 76 cases and fails two test expectations; the corrected
  [seven-case run](../2026-10-26-group-land-commissions/browser-final.log) passes.
  Thus **78 distinct local cases** have passing results across retained runs.
  The changes correct an old journal count and center a new form capture while
  retaining all target-size and viewport-bound assertions.
- Journal integration has **26 distinct affected local cases** passing across
  [25-pass/stale-source-link failure](../2026-10-26-group-land-commissions-publication/browser.log)
  and the corrected [seven-roadmap-case run](../2026-10-26-group-land-commissions-publication/browser-roadmap-final.log).
  These scopes overlap; counts are not additive.
- Both exact-commit workflows and exact public build/feed/source/image comparisons
  pass for the feature and reviewed journal. The feature's
  [four live journeys](../2026-10-26-group-land-commissions-publication/source-live.log)
  pass without retries.
- **26 distinct live publication cases** pass across the retained
  [21-pass/five-failure run](../2026-10-26-group-land-commissions-publication/live.log),
  unchanged [four-pass/one-failure recovery](../2026-10-26-group-land-commissions-publication/live-recovery.log)
  and unchanged [final roadmap pass](../2026-10-26-group-land-commissions-publication/live-roadmap-final.log).
  Every failed attempt has trace evidence of ERR_NETWORK_CHANGED during navigation
  or asset loading. No runtime, assertions, timeouts or browser settings changed.
- The authored thirty-hearth, 128-army, two-war scenario spends 88 of 100 coin on
  four real works; 26 commissions wait. Removal and restoration preserve exact
  61-record replay. Three generated-hearth cases damage native worker replies
  after actual payment and verify saved recovery and one explicit retry.
- Independent [code](../2026-10-26-group-land-commissions/code-review.md),
  [visual](../2026-10-26-group-land-commissions/visual-review.md),
  [editorial](../2026-10-26-group-land-commissions-publication/editorial-review.md)
  and [sixteen-capture reader](../2026-10-26-group-land-commissions-publication/layout-review.md)
  reviews pass. Exact narrow form bounds, captures and exported replay remain
  with their evidence. Historical articles and artwork are preserved.

Initial typecheck, test expectation, concurrent Git-history timeout and browser
failures are retained and explained in the packets. No assertion or timeout was
weakened. Deep verification ran locally; hosted workflows remain build-only.

## Not done / blocked / caveats

The mature-realm scenario authors ownership, markets, positions, frontier and a
finite purse; it is not an organically played empire. Broader paid land/cultivation
strategy and combined delegation acceptance remain open. The native journal strip
illustrates permission wording; its caption and inspection links carry the mobile
explanation. It does not prove completed work or payment.

ACT-32/M3, DH-021, R06 and all fifteen release gates remain open. A successful live
rerun does not establish recovery from interrupted asset loads. Deployment is
development availability, not 1.0 acceptance.

The user's primary checkout `/home/telephoneheater/Work/Theandril` is on `master`,
synchronized with published `d65b016` before this final evidence/report commit.
The final commit contains documentation and retained verification only; its
workflow and exact public-byte readback are checked after publication.

## Follow-ups

Broaden paid land/cultivation decisions and whole-realm funding priorities, then
measure combined delegation in organically developed mature realms. Preserve
explicit spending permissions, material consequences and manual overrides. Keep
pacing and release gates open until their acceptance evidence exists.
