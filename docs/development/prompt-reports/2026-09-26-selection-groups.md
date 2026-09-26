# Saved realm groups and verified deployment — 26 September 2026

## Prompt

“Continue development,” following “Deploy the changes, and continue development.”
Continued the interrupted Theandril work toward 1.0 using the existing authorization.

## Delivered

- Save up to 24 named army/hearth groups per realm, with up to 128 members each.
  Create, rename, replace membership and delete through the registry. Recall
  restores eligible checks; applying postings or charters remains explicit.
  Groups travel with campaign saves, replay and exports. Empty groups survive;
  temporarily carried armies remain members, while permanent losses are pruned.
- Repaired the research-register save limit for the existing 64-seat campaign
  capacity (**DH-020**). Current rules/save 32 accept 64 rows; older strict
  schemas remain frozen and unrepresentable historical exports are refused.
- Published [dispatch 09](https://erikburdett.github.io/Theandril/updates/dispatches/?dispatch=selection-groups)
  and updated the existing roadmap with exact source evidence and reviewed pixels.
  Eight prior articles and thirteen prior image records remain unchanged.

## Changed

- `packages/sim`, `packages/chronicle`, `packages/persistence`: canonical group
  commands/state, lifecycle reconciliation, own-only observations, bounded
  dedicated IDs, strict historical compatibility and genuine prechange fixtures.
- `apps/web/src`: registry controls, worker/main response and recovery handling,
  instruction guide, and journal/current-roadmap content. Personal charter
  templates retain their separate browser-local storage boundary.
- `scripts`, unit/property/browser scenarios: representative metadata benchmark,
  preserved historical checkpoints and ordinary-control production/live checks.
- Canonical implementation status, architecture 0042, M3 development record,
  performance report, reviewed dispatch and this prompt report. CI remains build-only.

Implementation: **`0d26fa3c34ac89164637f515e95671420400a841`**.
Published game/journal: **`676d56471cb806fb007fc0207ea16b0b638c467c`**.
Rules/save32; unchanged content `015468d1`.

## Verified

[Full evidence and failures](../2026-09-25-selection-groups/README.md).
These are separate, overlapping scopes, not additive totals:

- [Final full suite](../2026-09-25-selection-groups/publication-tests.log):
  **1,943 tests / 243 files**, 55.54s. Final date-only metadata correction passes
  [24 focused tests](../2026-09-25-selection-groups/publication-final-date-tests.log).
  Typecheck, lint, content/art validation and production Pages build pass.
- [Affected gameplay](../2026-09-25-selection-groups/browser-final.log): **20**
  Chromium journeys. [Local Pages](../2026-09-25-selection-groups/publication-pages.log):
  **31**, 54.5s. [Live Pages](../2026-09-25-selection-groups/live-pages.log): **31**, 1.2m.
- Separate real generated 40-major/24-city-state first-turn campaign:
  [local](../2026-09-25-selection-groups/local-64-seat.log) 10.26s and
  [live](../2026-09-25-selection-groups/live-64-seat.log) 13.535s. Three actual
  downloads retain identical 911,896-byte canonical snapshots, hash `838191d9`,
  exact archive and public replay, and all 64 faction-owned research rows.
  Manual Save/reload/Load and portable Import/Export use ordinary controls.
- Four genuine rules 31 checkpoints retain exact historical bytes and replay;
  mixed-history modern continuation, migration isolation and rejection are tested.
- [Synthetic benchmark](../2026-09-25-selection-groups/benchmark.json):
  saturated 48/64-realm group registers, 147,456/196,608 member references;
  isolated loss reconciliation about 3.3/4.2ms median. Own groups add about 36.5 KB
  to observation JSON. This is not a full-turn, renderer or organic-scale result.
- Independent [integration](../2026-09-25-selection-groups/integration-review.md),
  [publication](../2026-09-25-selection-groups/publication-review.md),
  [64-seat verifier](../2026-09-25-selection-groups/64-seat-browser-review.md) and
  [live](../2026-09-25-selection-groups/live-review.md) reviews pass with authorship
  boundaries disclosed. Final pixels include desktop, laptop, narrow and enlarged text.
- Both exact-revision GitHub workflows and
  [live commit/source/image readback](../2026-09-25-selection-groups/live-readback.json)
  pass. [Deployment records](../2026-09-25-selection-groups/deployment.json).

## Tracker and checkout

The guarded [tracker update](../2026-09-25-selection-groups/tracker-apply.log)
resolves DH-020 and advances ACT-32/M3; both broader records stay in progress.
[Generated-page readback](../2026-09-25-selection-groups/tracker-readback.json)
confirms 59 delivered/49 remaining editorial bullets, 6 completed catalogue
checkpoints of 23, and all 15 release gates open. Those counts are not fixed-scope
completion percentages. Unrelated tracker records and existing histories remain.
ACT-36 stays doing until the final documentation/evidence commit is pushed,
clean on master and live-verified; its guarded closure is the final operation.

Publication was performed from the primary checkout
`/home/telephoneheater/Work/Theandril`, on `master`, synchronized with
`origin/master` at the published game/journal revision. This report and the live
artifacts form a documentation-only follow-up commit; its exact final identity
is available from Git history and the public build ledger. No secondary checkout
or background development job was created.

## Not done / blocked / caveats

No remaining blocker for this bounded slice. All 15 release gates remain open.
Theaters, patrol/escort roles, army-order templates, production sequences,
broader governor decisions and combined mature-realm acceptance remain.
The 64-seat browser proof covers one first-turn Chromium campaign, not sustained
large-world play or other browsers. Existing large-bundle build warnings remain.

Retained failures include the browser waits that observed a campaign before
world generation completed, the discovered 48-row save defect, and the source-pin
check denied a Git subprocess by the sandbox. The standalone 64-seat runner
initially failed on Chromium’s implicit root favicon 404; exact CDP/console
correlation established it as a browser icon request. That warning remains
recorded; all other application/console/HTTP/CDP errors remain fatal. Assertions
were not relaxed to hide game failures.

No new campaign pacing result is claimed: organizational metadata uses separate
IDs and preserves projected gameplay; AI policy and prices are unchanged. The
prior Standard 234/Long 342/Epic 379 headline measurements remain dated evidence,
with Standard and Long above their approximate targets (**DH-021/ACT-38**).

## Follow-ups

Continue ACT-32/M3 from the saved groups with bounded coordinated orders or
broader delegation, preserving explicit application and individual overrides.
Measure headline pacing if subsequent rules or AI behavior can change campaign
outcomes. Preserve the existing release gates and honest scale/cross-browser limits.
