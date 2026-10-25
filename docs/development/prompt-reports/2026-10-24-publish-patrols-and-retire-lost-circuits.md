# Publish patrols and continue with captured-hearth cleanup

## Prompt

“okay commit this and deploy it on the github.io deployment, then continue towards 1.0”

## Delivered

- Committed the reviewed posting templates, saved land patrols and interrupted
  patrol recovery as `dee74cf9c4e2d153f9c5f5cfdbd9221798205481`.
- Published the game and reviewed dispatch 14, **Keep the watch moving**, as
  `04d17762033bd5d0978a117b592272e1b72ec62f` to
  [GitHub Pages](https://erikburdett.github.io/Theandril/). Both exact GitHub
  workflows succeed. The journal and roadmap retain source pins, real imagery,
  unresolved pacing and all fifteen open release gates.
- Continued locally with AI retirement of a stranded home patrol whose target
  hearth is visibly foreign. Ordinary cleanup preserves current travel and the
  current batch's army reservation. A fresh AI decision can use the company
  again. Actual Watch controls demonstrate cleanup followed by movement and
  exact saved recovery. This follow-up is **not committed or deployed**.

## Changed

- Publication: `apps/web/src/updates/`, two native public screenshots and their
  provenance, journal/roadmap/home browser expectations. The measured journal
  image inventory grows by 327,562 bytes to 3,473,083 bytes, with an explicitly
  documented 3.5 MiB ceiling. Gameplay budgets and historical image bytes remain
  unchanged.
- Local AI: `packages/ai/src/patrol-recovery.ts` and `patrols.ts`, a new retirement
  regression suite, production Watch journey and fully charted benchmark script.
  Rules/save remain 35 and content remains `015468d1`; no canonical rule or
  schema migration is introduced.
- Evidence/status: publication, readiness and retirement packets;
  `docs/IMPLEMENTATION_STATUS.md`, `docs/1.0-DEVELOPMENT.md`,
  `docs/PERFORMANCE.md`, and a draft follow-up dispatch. The readiness review
  rejected unsupported funding-starvation and invalid adjacent-town hypotheses
  before reproducing the captured-hearth defect in a genuine saved campaign.

## Verified

Publication evidence is in the [publication packet](../2026-10-24-patrol-publication/README.md):

- [2,218 tests / 275 files](../2026-10-24-patrol-publication/full-tests.log),
  typecheck, lint, content/art validation and production build.
- [38 local Pages journeys](../2026-10-24-patrol-publication/local-pages.log) and
  the [same 38 live journeys](../2026-10-24-patrol-publication/live-pages.log).
  Exact public HTML/game/worker/image bytes, source links and catalogue counts
  pass [live readback](../2026-10-24-patrol-publication/live-readback-final/readback.json).
- [Independent live review](../2026-10-24-patrol-publication/live-review.md)
  confirms the published identity and evidence scopes. The initial stale
  13-dispatch test expectation and readback helper's origin-favicon diagnosis
  remain retained alongside their corrections.

The newer local [retirement packet](../2026-10-24-patrol-retirement/README.md) records:

- [2,242 tests / 276 files in 60.78 seconds](../2026-10-24-patrol-retirement/full-tests.log),
  plus passing typecheck/lint/build. Counts overlap the published suite.
- [Three production journeys](../2026-10-24-patrol-retirement/browser-first.log)
  in 19.6 seconds, including exact replay/recovery of the new 179-record
  from-save Watch archive. All 32 final built HTML/JS/CSS artifacts match the
  browser-tested build after a source-comment clarification.
- [Six scale cases](../2026-10-24-patrol-retirement/retirement-benchmark.json)
  with 196,608/307,200 charted cells and 128 owned policies. Visible foreign
  targets yield four accepted clears, zero queries and exact route/save/replay
  preservation. Isolated planner medians are 1.832 ms Huge and 2.794 ms Legendary;
  hidden/owned controls issue no commands. Whole turns and rendering are excluded.
- [Nine full campaigns](../2026-10-24-patrol-retirement/pacing-comparison.json)
  finish through prosperity at Standard 219/194/201, Long 329/309/287 and Epic
  374/332/327. No submitted commands or theater routes are refused. One automatic
  patrol-route refusal remains separately disclosed. Prices and bounds are fixed.
- Independent policy, factual and image reviews find no scoped blocker. All
  seventeen final source identities and ten benchmark source hashes match.

## Not done / caveats

This is a development deployment, not 1.0 acceptance. DH-021, ACT-32/M3 and all
fifteen release gates remain open. The original Long seed is seven turns faster
than the published recovery build, but eighteen later than retained rules34;
two Epic seeds remain below 350–400. Patrol origins are not recorded: identical
manual configurations may be reviewed under explicit AI control. Broader
obsolete routes, missing/hidden/both-lost endpoints, escorts, longer programs,
governors and organic mature-realm acceptance remain unfinished.

The primary checkout is on `master` at the published `04d1776`, equal to
`origin/master` (zero commits ahead/behind). New retirement work, final deployment
records and this report are local working-tree changes. No second deployment was
performed for them, and the follow-up dispatch remains draft.

## Follow-ups

Reproduce reachable victory-project counterplay with ordinary legal commands and
filtered observations; retain the present multi-seed pacing comparison before
any deliberate repricing. Extend obsolete patrol handling only with positive
observable evidence, direct-order priority and the same saved-history boundaries.
