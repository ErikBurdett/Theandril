# Personal land budgets and faster history reconstruction

## Prompt

“continue”, retaining the standing instruction to commit and deploy each feature
or fix while progressing toward 1.0.

## Delivered

- Save, update, recall and delete named land improvement/budget presets across
  campaigns and browser reloads. Recall fills the form; explicit Apply purchases
  ordinary work. Campaign saves and personal browser preferences stay separate.
- Faster exact changelog reconstruction: bounded concurrent Git batches preserve
  complete historical output, authored notes and the existing test deadline.

## Changed

- Persistence: separate version-one personal template database, strict rows,
  transactional unique names/capacity, corruption/future-version rejection.
- Web: lazy template library, shared command/storage locks, explicit recovery,
  settled writes on navigation and responsive keyboard controls.
- Tooling: bounded 32-commit batches, at most two stat processes, stable ordering,
  complete rejection on read failure, independent legacy oracle/capacity tests.
- Evidence/status: two work packets, independent reviews, canonical status and
  roadmap updates, source-pinned developer dispatch retained in draft.

## Verified

- [Final full suite](../2026-10-28-land-budget-templates/tests-final.log): 2,519
  tests / 305 files, 118.74s; typecheck, lint and production build pass.
- [Full local production browser suite](../2026-10-28-land-budget-templates/browser-full.log):
  81 cases pass first attempt, 6.1 minutes. Focused runs overlap this coverage.
- [Template review](../2026-10-28-land-budget-templates/review.md): independent
  code and native desktop/narrow/recovery image review, with exact hashes.
- [History evidence](../2026-10-28-changelog-batching/README.md): all baseline
  116 entries / 91,905 bytes match; final median 4.867s versus 7.880s, about 38%
  faster on this workstation/history. Processes fall from 117 to five. A review
  finding about aggregate output capacity was fixed and regression-tested.
- Tooling **d60bdcb05736201cf2f918d6aff7755ed4be7191** deployed separately.
  [Both workflows](../2026-10-28-changelog-batching/actions.json) and
  [public readback](../2026-10-28-changelog-batching/public-readback/readback.json)
  pass against the exact downloaded Pages artifact; this was not an independent
  local tooling-only rebuild. Three live home/history journeys pass.
- Feature **906138fe0d9de262f3186f9381b71f9b1b0774a0** deployed separately.
  [Both workflows](../2026-10-28-land-budget-templates/actions.json) and
  [public readback](../2026-10-28-land-budget-templates/public-readback/readback.json)
  pass against the exact local feature build. [Seven live gameplay cases](../2026-10-28-land-budget-templates/public-browser.log)
  pass first attempt: templates, group commissions/failure recovery and filters.
  A generated campaign pays 22 coin, retains 53 allowance and restores/replays
  exactly; CRUD/recall and denied-storage recovery issue no campaign orders.
- The user's primary checkout is `master` at the published feature commit and
  synced with `origin/master` before this evidence-only commit. Publication of
  the final evidence commit is checked separately without recursively committing
  a report about itself.

## Not done / blocked / caveats

No canonical rule, campaign schema, content or AI change: rules/save 37 and content
015468d1 remain. No pacing rerun was warranted. Chromium/early generated realms
and authored scale fixtures do not establish mature-realm or cross-browser
acceptance. Builds retain the existing bundle-size warning. The dispatch remains
[an unpublished draft](../../updates/drafts/2026-10-28-land-budget-templates.md);
the public journal remains edition 23, not a description of these new templates.
ACT-32/M3 remains partial; DH-021, R06 and all fifteen release gates remain open.
No tracked issue is claimed closed. Tracker live activity sees both commits and
workflows; its dated editorial catalogue is not current release acceptance.

## Follow-ups

Continue paid land strategy with deliberate cultivation choices and explicit
budgets; prove combined governor controls in a mature generated realm. Broader
whole-realm priorities and existing campaign pacing findings remain separate work.
