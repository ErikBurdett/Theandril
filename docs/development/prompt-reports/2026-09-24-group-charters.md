# Continue Theandril development — 2026-09-24

## Prompt

“okay continue”, continuing the request to develop toward 1.0 and the existing
authorization to deploy completed changes.

## Delivered

- Group settlement charters: select up to 128 owned hearths across search and
  registry pages, apply Works/Wealth/Learning/Muster with a per-work ceiling,
  or revoke existing charters. Separate army/hearth selections survive tab
  changes. Treasury, queued production and individual overrides are preserved;
  canonical refusals remain selected with their reasons.
- Published implementation `f78ed07d04ffbc3310d05e0124aa6d8f9d5a09e9` and reviewed
  dispatch 07/roadmap as **`ee12011edb9990e8a5948301174b039fbbb9c04d`**.
  [Play](https://erikburdett.github.io/Theandril/) and
  [read the dispatch](https://erikburdett.github.io/Theandril/updates/dispatches/?dispatch=group-charters).
- Rebuilt the requested DHARMA project page. ACT-32/M3 remains in progress.
  Existing tracker history and other action statuses are preserved.

## Changed

The web registry, main-thread request tracking and bounded worker transport use
ordinary `setCharter` commands in stable order, with one final permitted
observation. Recording/display interruption settles pending work and requires
saved-campaign recovery. Rules/save 31, content `015468d1`, AI and prices are
unchanged. Current status, architecture 0040, the existing public roadmap,
reviewed screenshot provenance and focused regression coverage were updated.

## Verified

- [Final local headless suite](../2026-09-24-group-charters/publication-tests.log):
  **1,891/1,891 tests**, 235 files, 75.05 seconds. Typecheck, lint, content/art
  validation and the actual Pages build pass.
- [Affected gameplay](../2026-09-24-group-charters/browser-final.log): **12/12**,
  including 40 owned hearths/100 owned armies, page/filter/tab/keyboard selection,
  independent override, preserved production, partial refusal, narrow controls,
  exact save restoration and damaged-response recovery.
- [Local Pages suite](../2026-09-24-group-charters/publication-pages.log):
  **29/29**, 51.9 seconds. Desktop, 390px and 130% text journal screenshots were
  inspected. These suites overlap and their counts are not summed.
- [Live suite](../2026-09-24-group-charters/live-pages.log): **28 passed, one
  failed** at the existing five-second crest-readiness assertion. Catalogue and
  atlas downloads returned HTTP 200 in 2,607.713ms and 2,248.691ms. The
  [unchanged focused rerun](../2026-09-24-group-charters/live-assets-recheck.log)
  **passes**. The exact network-delay cause is unproven; no timeout was widened.
  Live group-charter and saved-campaign journeys passed on their first run.
- Independent code/integration and publication reviews found no actionable
  defect. The authored 40-hearth worker comparison retains exact serial/batch
  archives, replay and hash while transferring 193,929 versus 7,409,845 bytes.
  This is a bounded fixture, not whole-campaign performance acceptance.
- [GitHub deployment](../2026-09-24-group-charters/deployment.json),
  [exact live readback](../2026-09-24-group-charters/live-readback.json) and
  [tracker readback](../2026-09-24-group-charters/tracker-readback.json) pass.
  Published imagery matches the reviewed bytes; earlier articles remain intact.

Work occurred in the primary checkout. `master` matches `origin/master` at the
verified release. This final documentation commit records results without
changing gameplay; it is pushed through the same authorized publication path.
All task-owned development/preview processes have stopped.

## Not done / caveats

This advances ACT-32; **all fifteen release gates remain open**. Durable named
groups, theaters/patrol/escort roles, saved reusable templates, broader governor
decisions and combined mature-campaign acceptance remain. Selection is temporary;
the resulting policies are saved. A group can partly succeed and is not atomic.

Failed validation attempts are retained: incorrect exact-label test selectors,
sandbox subprocess restrictions, Git-history contention, an OS write-quota
error, Chromium's temporary socket path limit and the live artwork-loading delay.
The final local suite used four workers and a project temporary directory;
Chromium used a shorter directory. No test was skipped or assertion weakened.

The existing tracker catalogue now counts 55/104 delivered/remaining bullets,
with six of 23 catalogue items complete. Editorial regrouping changes that
metric; it is not a fixed-scope release percentage. Latest pacing evidence
remains Standard 234, Long 342 and Epic 379; no rules/AI change required a rerun.

## Follow-ups

Use the updated ACT-32 prompt for the next bounded named-group, theater or policy
template slice. Preserve ordinary command authority, inspectable blockers,
individual override and deterministic save/replay. Broader asset-loading
latency remains part of performance/browser acceptance; this deployment does not
establish every network or device budget.
