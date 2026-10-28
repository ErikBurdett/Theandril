# Personal land budget templates — 2026-10-28

Work packet, baseline 7c003a0. Local integration and separate feature publication are verified.

## Acceptance

Save, rename/update, recall and delete named improvement/allowance/reserve presets
across campaigns and browser reloads. Recalling only fills the group commission
form; ordinary explicit Apply orders still decide eligibility and pay real costs.
No template operation changes campaign hashes or history. Deleting a template
must not revoke an installed commission or alter paid work; loading a campaign
must not restore deleted personal preferences.

## Boundaries and ownership

The new version 1 personal IndexedDB database is separate from campaign storage
and existing preference databases. It permits 24 templates with unique trimmed,
case-insensitive names up to 40 characters. Inputs/rows use strict schemas, known
improvements and safe whole nonnegative coin values. Unknown/corrupt/future data
is rejected without repair or deletion. Transactional caps/name checks handle
concurrent connections. UUIDs remain personal identifiers outside simulation.

The library opens lazily, aggregates its pending state with ordinary paid command
locks, allows explicit retry after storage denial and lets an already-started
write settle after unmount. Failure after a successful write is distinguished
from an unsaved change. Recall and selection never issue orders. Manual commission
editing remains available after a failed library load.

Storage and UI were implemented by separate agents with disjoint paths; the
parent owns production journeys and integration. An independent agent reviews
both code and native displayed captures. No canonical command/rules/AI/content,
worker protocol or campaign schema changes. Rules/save 37, content 015468d1 remain.

## Evidence so far

[Initial production run](browser-initial.log): both journeys pass first attempt
in 14.1 seconds. Two genuinely generated UI-started campaigns cover founding and
Food workers, create/update/recall, cross-campaign persistence and reload, an
explicit 22 coin commission, exact replay/restoration, and deletion without
campaign mutation. The separate denied-storage journey recovers through Retry
without any campaign order. [Native captures and JSON](browser-results/) disclose
all setup and hashes. The appended real-write shared-lock observation passes in the
[final two-journey run](browser-locked.log), 13.2 seconds. It observes native storage
disabling and re-enabling Apply and the registry filter, without delaying or
mocking any game operation.

[Independent review](review.md) records exact source/capture hashes and limits.
Full integration and publication outcomes are recorded below. This advances
existing ACT-32/M3; every release gate, DH-021 and R06 remain open. Personal
presets do not implement broader automatic land strategy or organic-scale proof.


## Final local static and simulation integration

The [full final suite](tests-final.log) passes **2,519 tests / 305 files in 118.74
seconds**, including the unchanged history-check timeout and added capacity test.
[Typecheck](typecheck-final.log), [lint](lint-final.log) and [Pages build](build-final.log)
pass. The earlier [integration run](tests.log) passes 2,518 tests before the extra
history-capacity regression was added; these are overlapping runs, not additive.
The [complete production browser suite](browser-full.log) passes **81 cases in
6.1 minutes**, first attempt. The two focused cases above overlap this suite.
Separate feature publication follows the verified tooling deployment, as recorded below.

## Published feature

Feature `906138fe0d9de262f3186f9381b71f9b1b0774a0` is deployed on
[GitHub Pages](https://erikburdett.github.io/Theandril/). Both [workflows](actions.json)
pass: Verify 40706870535 and Pages 40706871238. The exact source was rebuilt locally
with its regenerated history feed ([feed](feed-feature-906138f.log),
[build](build-feature-906138f.log)); the tracked fallback feed was restored afterward.
[Live readback](public-readback/readback.json) matches the revision and local built
HTML/JS/CSS/worker assets. The existing journal remains edition 23/source cfd660c;
the new feature's source-pinned developer dispatch remains an unpublished draft.

All **seven scoped live gameplay cases pass first attempt in 1.1 minutes**:
[log](public-browser.log), [native evidence](public-browser-results/). These include
the two template journeys, all four group-commission journeys and the commission
filter journey. Generated early campaigns prove template behavior; the 30-hearth
commission scenarios are authored scale fixtures, not organically grown realms.
The public results overlap the local 81-case suite and are not additive coverage.
Rules/save 37 and content 015468d1 remain unchanged. No issue or release gate closes.
