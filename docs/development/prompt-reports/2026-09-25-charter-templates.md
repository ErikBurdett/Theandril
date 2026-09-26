# Continue Theandril: reusable charter templates and deployment

## Prompt

“okay continue”, followed after interruption by “you were interupted, continue”.
Earlier authorization to deploy changes and continue development remained active.

## Delivered

Players can keep up to 24 named charter policies in this browser, update or
delete them, and recall a focus and coin ceiling before explicitly applying it
to selected hearths. The library survives reload and campaign changes. Editing
a template leaves active charters unchanged; those orders remain in campaign
saves, while personal templates are excluded from campaign exports.

Published [edition 08, Keep a charter worth repeating](https://erikburdett.github.io/Theandril/updates/dispatches/?dispatch=charter-templates)
alongside the [game](https://erikburdett.github.io/Theandril/). Implementation:
`3ed4a6c456c3e4130fddf35b44dfdf51034cc269`. Verified release:
`1d256b09b5a7fe273d2e340b6c4014b722f9d49d`.

## Changed

- Persistence: separate bounded preferences database, strict versioned records,
  unique names, transactional capacity checks and preservation on failed writes.
- Interface: template controls in group hearth charters, keyboard/narrow layout,
  visible recovery errors, fresh-connection retry and an in-game guide entry.
- Evidence: storage/lifecycle tests, real authored and generated browser journeys,
  inspected original captures, independent code/factual/visual reviews, current
  implementation status and source-pinned journal/roadmap.
- DHARMA: ACT-32/M3 progress and history updated; local project page rebuilt and
  read back. Other actions, milestones and existing history were preserved.

## Verified

[Final publication evidence](../2026-09-25-charter-templates/publication-verification.md)
records **1,904 tests across 237 files**, **16 affected gameplay journeys** and
**30 local production Pages journeys**, plus passing typecheck, lint, content/art
validation and production build. These scopes overlap and are not additive.
The independent production template journey also passed separately.

[Deployment evidence](../2026-09-25-charter-templates/deployment.json) records
successful GitHub build/Pages Actions, **30/30 live Pages journeys**, exact commit
readback, source-link verification and identical published image bytes. The
live run passed on its first attempt. Storage denial/recovery, malformed-row
preservation, unchanged canonical hashes/worker totals for preference actions,
forty-hearth application, individual override and exact saved restoration pass.

Review caught and fixed a cached failed-open connection that prevented Retry.
Two verification-tool corrections are retained: an invalid TypeScript comparison
in a new roadmap test, and a readback helper that initially looked for text in a
collapsed disclosure. Final checks pass; no timeout or requirement was weakened.

## Not done / caveats

Rules/save remain 31, content `015468d1`; no simulation or AI change required a
new pacing run. Templates have no cross-device sync, standalone import/export or
live refresh of other tabs. Concurrent edits of one template use the last
committed write. The mature browser realm is authored; it is not organic
large-campaign acceptance. All fifteen 1.0 gates remain open.

## Follow-ups and checkout

ACT-32/M3 remains in progress: durable named groups, army order templates,
production sequences, theaters/patrol/escorts, broader governors and combined
mature-realm acceptance remain. DHARMA's catalogue totals are editorial bullet
counts, not a fixed-scope completion percentage.

Work was committed and published directly from the user's primary `master`
checkout at `/home/telephoneheater/Work/Theandril`. This final report and live
evidence are synchronized in a following documentation commit; runtime and tests
are unchanged from the verified release above.
