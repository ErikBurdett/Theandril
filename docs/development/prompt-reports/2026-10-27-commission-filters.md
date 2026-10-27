# Find and revise land commissions by status — 2026-10-27

## Prompt

“'Continue”. Standing authorization: continue development toward 1.0, commit and
deploy each feature or fix to GitHub Pages.

## Delivered

The hearth registry can now filter land commissions independently of production
orders. Find hearths with or without commissions, zero allowances and reported
waits, combined with search. Counts follow the search/production cohort before
paging; checked hearths remain checked outside a filter and are disclosed by the
group panel. Existing group controls revise those explicitly selected budgets.

Zero allowance can coexist with paid work. A missing reported wait does not mean
a job is affordable or suitable: selecting a hearth still supplies its exact
canonical land detail. Historical observations without commissions hide and
bypass the selector. Shared pending locks prevent changing it during paid orders.

Feature **dd8736d** is deployed and publicly verified.
[Play](https://erikburdett.github.io/Theandril/). Existing ACT-32/M3 advances;
no tracked issue or release gate is declared closed.

## Changed

- `apps/web/src/land-commission-status.ts`: detached, owned-observation indexing,
  filter composition and overlapping cohort counts.
- `realm-navigation.tsx`: selector, help, page reset, selection matching, shared
  lock and row-summary reuse. No extra simulation queries or price calculation.
- New index/static-UI tests and a production journey; the existing charter-filter
  test now verifies both help paragraphs rather than assuming there is only one.
- Canonical status, 1.0 notes, retained evidence and an unpublished follow-up
  dispatch draft. Public historical journal entries and artwork are unchanged.

Rules/save 37, content 015468d1, canonical commands, AI and persistence are unchanged.
No pacing measurement was required for this presentation-only filter change.

## Verified

[Work packet](../2026-10-27-commission-filters/README.md):

- [Full unit/campaign/repository run](../2026-10-27-commission-filters/tests.log)
  passes 2,496 tests and hits the existing 20-second Git-history test limit once.
  The unchanged [isolated file](../2026-10-27-commission-filters/changelog-isolated.log)
  passes all six tests in 16.75 seconds. **All 2,497 distinct tests across 302 files**
  have passing results across these runs, not one uninterrupted full-suite pass.
- [Full local Pages run](../2026-10-27-commission-filters/browser-full.log)
  passes 78 cases and fails the old single-paragraph help locator. The correction
  asserts exactly two paragraphs, both visible, with exact new help text.
  Both [affected journeys](../2026-10-27-commission-filters/browser-final.log)
  pass in 51.7 seconds: **all 79 distinct local browser cases** have passing results
  across the retained runs. No runtime, assertion threshold or timeout changed.
- Final typecheck, lint and production build pass. Deep tests remain local;
  hosted workflows only typecheck/build and publish.
- [Independent code/displayed review](../2026-10-27-commission-filters/review.md)
  passes, with exact source and native-image hashes. The 390px/130% selector is
  340×44px, inside all four window edges with no page overflow. Native keyboard
  changes and pending locks are exercised by the real journey.
- [Both exact-commit workflows](../2026-10-27-commission-filters/actions.json)
  and [public-file comparison](../2026-10-27-commission-filters/public-readback/readback.json)
  pass. [All five live cases](../2026-10-27-commission-filters/live.log) pass on
  the first attempt in 48.7 seconds, covering public links and both registry flows.
- The authored 30-hearth/128-army/two-war realm has eleven commissions, five zero
  allowances and eight reported waits. Browsing preserves hash 6c3dffa5 and the
  archive. Five explicit replacements spend 48 coin from 78, preserve existing paid
  work and produce exact saved/replayed hash 7dbe8a11 with five recorded commands.

## Not done / blocked / caveats

Ownership, markets, army positions, a frontier patch and finite purse are authored;
actual workers, commissions and purchases use ordinary commands. This is not an
organically matured realm. Reported waits deliberately omit detailed candidate
eligibility; no summary result promises a purchase. Screenshots show closed native
selectors, not their popup or an expanded-help visual review.

The Git-history timeout remains documented. Its exact unchanged checks pass alone;
batching per-commit Git reads is a tooling follow-up as history grows. No timeout
was increased and no historical output was discarded.

The public journal remains edition 23; the new dispatch is an unpublished draft
for a later editorial/catalogue review. ACT-32/M3, DH-021, R06 and all fifteen
release gates remain open. Deployment is development availability, not 1.0 acceptance.

The primary checkout `/home/telephoneheater/Work/Theandril` is on `master`, synced
with published `dd8736d` before this final evidence/report commit. That final commit
contains documentation/evidence only; its workflow and exact public readback are
checked after publication.

## Follow-ups

Broaden paid land/cultivation decisions and whole-realm funding priorities, then
measure combined delegation in organically developed mature realms. Preserve
explicit budgets, exact quotes, paid consequences and manual override. Keep
the existing pacing and release gates open until their acceptance is evidenced.
