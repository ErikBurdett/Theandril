# Individual posting and muster destination choices

24 October 2026. Scoped UI correction after retirement publication `27a44f1`.
No canonical rules, schemas, AI policy or pace prices change.

## Reproduced failure

Both forms stored a numeric destination while deriving their option list from
the latest owned hearths. Removing a selected hearth left a controlled select
with no matching option. A browser can display a different first option while
the submission closure still contains the previous number. The army's “Where
it stands” option also stored its then-current numeric position, so moving with
the form mounted could display the new position but issue the old one.

The original seven focused component contracts retained in
[fail-before.log](fail-before.log) produce five failures and two passing controls.
They cover a removed army destination, changed muster ownership, arbitrary-hex
saved postings/musters absent from the dropdown, and moving current-position
intent. The original source SHA-256 is
`19797cf930fc69af357bc447273115ab38448a8b3062206d6d0d4aa307f8ed9d`.

For the separately authored browser fail-before run, the fixed file was preserved
outside the worktree and this exact HEAD source temporarily restored under parent
coordination. No build or distribution output was changed. Browser evidence and
its own authored-fixture limitations are recorded separately by that reviewer.

## Correction

The selected value is now explicitly unresolved when it is absent from the
form's current choices. Both forms display “Choose a destination”, connect an
explanation through `aria-describedby`, mark the choice with `aria-invalid`, and
disable new/update actions until a listed choice is made. The handler also
refuses submission when unresolved or busy.

This is a presentation choice boundary, **not a new legality rule**. Canonical
postings and musters may target an explored arbitrary hex, including one absent
from the current owned-hearth dropdown. Their saved summary and actual blocker
remain visible, rendering issues no commands, and Clear remains usable. Its
command uses the actual saved posting cell or the ordinary null muster target;
an unresolved replacement draft cannot prevent revocation. Existing travel is
governed by the unchanged canonical command semantics.

The army form gives “Where it stands” a separate `current` draft value, resolved
to the latest army position at submission. A named hearth remains a fixed numeric
choice, including when it shares the army's present cell. A saved fixed hearth
posting is never silently converted into dynamic current-position intent. A
blank choice remains distinct from legal hex zero.

No new query, worker field, effect, turn scan or canonical state is introduced.
The form continues to read the permitted observation it already receives. The
small destination membership check is over its existing owned-hearth choices.

## Verification boundaries

The focused component tests invoke the actual components, preserve their
`useState` slots with an explicit test harness across new props, inspect their
rendered trees and execute their actual event handlers. Canonical arbitrary-hex
orders are created through ordinary commands; render and form-handler inspection
do not mutate those states. Authored observation changes isolate ownership/list
and movement updates. This is not represented as browser DOM or played-conquest
evidence; the separate Playwright work exercises real selects and controls.

The first fixed run passes twelve tests across the new seven contracts and five
existing group-posting controls. The final [focused run](component-tests-final.log)
passes **15 tests in two files** (ten individual-form contracts and five group
controls) in 828 ms. Added coverage includes fixed/current coincidence, explicit
blank versus hex-zero muster, empty-list revocation and busy-handler guards.
[Typecheck](typecheck-final.log), [scoped lint](component-lint-final.log) and
`git diff --check` pass.

The browser reviewer reports all three fail-before cases reproduced against the
original source, including actual submission and storage of Hold at hex 500 while
the form displayed the moved army at hex 501. The original saved arbitrary-hex
posting and muster cases displayed different fallback values as well. The fixed
source was then restored byte for byte for browser acceptance. This report does
not substitute those initial failures for a passing final browser run.

Frozen final source SHA-256:

- `apps/web/src/postings.tsx`:
  `b2fdf89debffc05217d16d66ec0f7b2521d22797e5ae67cf1a009c17963c5a03`
- `apps/web/src/postings.test.tsx`:
  `e098ba4b43a4d4e95cb707adf69da93b57e4b8e05df92ae4f311ce75f2798c2a`

The temporary source restoration changed neither file's final identity. The
parent owns full integration, production builds, publication and live readback.

This corrects an individual form mismatch. It does not provide the proposed
standing-order registry filters, complete ACT-32/M3, or close any release gate.

## Integrated acceptance

Full suite: **2,253 tests / 277 files, 67.65 seconds** ([log](full-tests.log)).
[Typecheck](typecheck-integration.log), [lint](lint.log), [build](build.log) pass.
Four development journeys pass in 20.6 seconds ([log](browser-verified.log));
five production journeys pass in 25.8 seconds ([log](production.log)), including
all three new cases and existing group/template controls. The production run's
default `test-results` directory was copied byte-for-byte to `production-results`
immediately after successful completion; native captures remain unchanged.
Rules/save, AI, prices and canonical legality are unchanged; no pacing rerun.
This correction is authorized for its own deployment; live results follow.
