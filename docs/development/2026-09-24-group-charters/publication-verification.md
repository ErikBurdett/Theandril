# Group charters publication verification

The implementation and its original evidence are committed at
`f78ed07d04ffbc3310d05e0124aa6d8f9d5a09e9`. Edition 07, **One charter policy for
forty hearths**, pins that revision. Earlier articles and media retain their
original records. Rules/save 31 and content `015468d1` are unchanged.

- [Final headless suite](publication-tests.log): **1,891/1,891 tests across 235
  files**, 75.05 seconds. The original implementation checkpoint passed 1,889;
  the publication adds two factual content/roadmap checks. These totals overlap.
- Final [typecheck](publication-typecheck.log), [lint](publication-lint.log),
  [history-feed generation](publication-changelog.log) and
  [Pages-subpath build](publication-build.log) pass. The implementation's
  content/art validation and 12 affected gameplay journeys remain applicable:
  publication changes only journal content, styling, metadata and their checks.
- [Independent publication review](publication-review.md) verifies actual pinned
  evidence paths, historical preservation, policy semantics, scope and exact
  image bytes. The twelve journal images total 3,037,452 bytes, within the
  unchanged 3 MiB budget. No artwork was generated or altered.
- [Reader layout evidence](publication-layout/) retains desktop, narrow and 130%
  text captures and runtime image/error facts. Parent inspected the desktop
  heading and narrow enlarged-text illustration/caption; keyboard image
  enlargement, search, permanent links and history navigation run in the Pages
  suite. The charter image is intentionally an invalid unsubmitted grant form
  with revocation still available.

## Environment failures retained

The first final headless attempt hit an OS write-quota error before 140 test
files could load: [raw result](publication-tests-write-quota.log). A targeted
storage check passed 8 tests with an ignored project temporary directory, then
the whole suite passed with the same directory and four workers. No test was
skipped, assertion weakened or timeout increased.

Using that long temporary path for Chromium exceeded its Unix socket path limit,
so the first complete Pages invocation failed at browser launch:
[raw result](publication-pages-socket-path.log). The corrected invocation uses
the shorter ignored `node_modules/.tmp` directory. No game or browser-test
behavior was changed to address either environment issue.

The successful [Pages run](publication-pages.log) passes **29/29 journeys in
51.9 seconds**, including the actual production group-charter journey.
Deployment and public readback are recorded separately after the authorized push;
neither these checks nor publication accept any of the 15 open release gates.
