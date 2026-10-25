# Four development rounds, individually deployed — 2026-10-25

## Prompt

“Continue. Then continue again 3 times.” Standing instruction: commit and deploy
each feature or fix to the GitHub Pages development site.

## Delivered

| Round | Player outcome | Verified deployment |
| --- | --- | --- |
| 1 | Outdated posting/charter batches reject before mutation, retaining checks for review and retry | `6c77de4` — [evidence](../2026-10-25-group-intent/README.md) |
| 2 | Assign shared patrol points to checked armies while preserving paused policies, routes and postings | `64b5d9e` — [evidence](../2026-10-25-group-patrol-assignment/README.md) |
| 3 | Require saved restoration when real group orders apply but worker publication fails | `47e130f` — [evidence](../2026-10-25-group-publication-recovery/README.md) |
| 4 | Review every named posting/charter result with counted filters and 25-row pages | `670a18a` — [evidence](../2026-10-25-group-policy-results/README.md) |

The reviewed [developer dispatch](https://erikburdett.github.io/Theandril/updates/dispatches/?dispatch=group-orders-and-receipts)
was separately published as `1edc07f`. It pins implementation 670a18a, preserves
historical entries/images and adds two exact native illustrations within the
existing byte budget. ACT-32/M3 advances; this is not 1.0 acceptance.

## Changed

- Group policy forms, request protocol, main-thread hash checks and worker
  publication recovery; ordinary canonical commands remain authoritative.
- Bulk patrol assignment UI and transport validation, using existing `setPatrol`.
- Shared posting/charter result component, filters and pagination.
- Actual-worker regressions, production browser journeys and retained failure,
  save/replay, layout and deployment evidence.
- Existing status/roadmap catalogue, journal content/provenance and this report.

No canonical simulation rules, saved fields, AI behavior, prices or turn processing
changed. Rules/save 35 and content 015468d1 remain compatible.

## Verified

[Publication packet](../2026-10-25-four-round-publication/README.md):

- **2,395 tests / 290 files** pass locally in 61.93 seconds; pinned implementation
  has 2,394 tests, with one additional journal-contract test in publication.
- **All 66 local Pages cases pass in one 4.2-minute run**. Typecheck, lint, content
  validation, art validation and production build pass.
- Independent source review validates 11 pinned links and historical preservation.
  Independent displayed review inspects 20 captures across four viewport/text
  settings, plus two native images; no blocking layout/caption defect found.
- Every round has successful exact-commit workflows, public asset readback and
  scoped live journeys. The final journal passes all ten live reader cases in
 27.8 seconds. Round-specific tests overlap; their counts are not added together.
- The 101-army patrol journey preserves 50 paused policies and the exact 206-record
  saved result. A generated campaign travels out/back on turns 2/3. Result review
  covers 96 real accepted / 32 refused postings and thirty charter grants/revocations,
  with unchanged selections/history while browsing and exact saved replay.

Initial label/locator/fixture/assertion failures and corrections are retained,
as are genuine fail-before worker/browser witnesses. A round-three live charter
attempt encountered ERR_NETWORK_CHANGED before page load; the unchanged two-case
rerun passed. No source test was disabled or gameplay validation weakened.

## Not done / caveats

M3, DH-021, R06 and all fifteen release gates remain open. Authored large-realm
fixtures do not prove organic mature-campaign acceptance. No new pacing or
sustained-performance result is claimed. Small mobile raster previews rely on
readable captions and inspection/original links for detail. Broader governors,
programs, escorts, scale and wider browser acceptance remain unfinished.

## Follow-ups and checkout

Continue the existing M3 roadmap with deeper delegation and organically developed
mature-realm evidence, then dependency-ready M4 logistics. Preserve canonical
commands, inspectable refusals, explicit overrides and exact history.

At report authoring, the primary checkout `/home/telephoneheater/Work/Theandril`
was clean on `master`, with HEAD and origin/master both at the verified journal
publication 1edc07f0bd45ce3d0677ced871809789f2905c2f. This report and final deployment
proof are a documentation-only follow-up; the four feature/fix deployments and
journal are already verified. Final checkout/readback are confirmed in the turn's
completion response rather than inventing a self-referential commit pin here.
