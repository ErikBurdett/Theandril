# Army order filters: integrated local candidate

24 October 2026. Implements the reviewed [delegation-workflow draft](../2026-10-24-delegation-workflow/registry-integration-notes.md) after the counterplay publication boundary. This is a local uncommitted UI continuation, not part of published counterplay commit `a48755bbb3b1aaf075d1a668922270365dc380f9`. No simulation, AI, protocol, save-schema, content or campaign-pace behavior changes.

## Player workflow

The existing army registry gains four order cohorts: **All forces**, **Postings and patrols**, **Orders waiting**, and **Paused patrols**. Counts compose with search/domain filters before order filtering and the existing 25-row pages. Default is All forces. The filter lives with the registry's local sort/page state and resets when the registry closes/reopens; existing search/domain lifetime is unchanged.

Posting target and exact canonical reason, patrol policy status/target/reason, and queued travel target/reason appear independently. The existing **Route interrupted** wording remains. A disabled policy remains discoverable with zero movement and active travel; finding it does not resume/cancel either policy or route. This is a directory of supplied order facts, not a new eligibility engine or a replacement for attention priority. Defense theaters are deliberately not included in “Postings and patrols.”

Existing checked-ID state, availability pruning, group limits, pending flags and callbacks remain intact. The new filter narrows the matching cohort used by existing Select matching and outside-filter notices; it does not clear checked IDs outside that cohort. The order selector shares the existing registry lock. No bulk resume or other new canonical action is added.

## Implementation and cost scope

`apps/web/src/army-order-status.ts` projects only observed own armies and their supplied posting, patrol and route reports. Missing/foreign actors and mismatched order owners are excluded. The index copies small display facts rather than mutable order references. Historical patrol absence is supported. It never reads world cells, requests paths, inspects hidden state, issues commands, or hashes the game.

One index build costs **O(observed armies + postings + patrols + routes)** and stores **O(owned armies)** records. `RealmRegistry` memoizes it for the current observation and armies tab. Search/domain/stable-sort processing remains the existing registry behavior; count aggregation adds a linear pass over the resulting matching cohort, then the order filter adds another linear pass before paging. Changing only the order filter reuses the index and the already sorted search/domain cohort. Rendered army rows remain bounded to 25. These are source-level complexity bounds, not timing measurements or whole-world rendering/worker-transfer claims.

## Integrated tests and genuine fixture

The exact focused invocation is retained here because terse Vitest logs omit the file list:

```sh
./node_modules/.bin/vitest run apps/web/src/army-order-status.test.ts apps/web/src/realm-order-filter.test.tsx apps/web/src/realm-navigation.test.tsx apps/web/src/group-postings.test.tsx apps/web/src/group-movement.test.tsx apps/web/src/selection-groups.test.tsx
```

[First focused result](focused-first.log): **36 tests / six files pass in 1.06 seconds**, including the 12 new projection/filter tests and existing registry/group presentation tests. This does not substitute for actual browser interaction. [Scoped ESLint](lint.log) passes for all six changed source/test/fixture/journey files. [Production collection](browser-collection.log) finds the single new journey. [Full typecheck](typecheck.log) passes.

The promoted `armyOrderFilterScene()` preserves the [proved draft fixture](../2026-10-24-delegation-workflow/browser-fixture-evidence.json): canonical hash **aa8eb3f5**, eight ordinary setup records, exact strict save/replay, 101 own forces and cohort counts **101/4/2/1**. Open land, two hearths, treasury, army population/names and one foreign guard are explicitly authored. Actual queued travel spends movement; an ordinary foreign move followed by endTurn causes the enabled patrol's route interruption. The last stable-ID actor has a disabled policy, actual zero movement and an active alternate route. No blocker/status/movement exhaustion is fabricated. The original invalid authored-ID failure and corrected proof remain in the draft packet.

The promoted production journey imports through public controls with development hooks absent. It exercises keyboard selection, fifth-page discovery, checked IDs/outside-filter notices, actual group-review locking, exact export comparisons after browsing/navigation, 390px/130% text, real Selected orders, and one deliberate Resume patrol preserving the existing route and army. It then requires exact save/reload/export. Native screenshots include the order-selector detail for a possible compact journal image; no pixel transforms or production wrapper changes were added.

## Integrated local acceptance

Parent [full-suite verification](full-tests.log) passes **2,318 tests / 282 files in 75.04 seconds**, with [integration typecheck](typecheck-integration.log) and [integration lint](lint-integration.log). The [registry production build](build.log) followed preservation of the separate frozen counterplay bundle for its own live readback.

The actual registry journey used the Pages configuration to match the `/Theandril/` build base:

```sh
./node_modules/.bin/playwright test --config playwright.pages.config.ts tests/production/army-order-filter.spec.ts --output docs/development/2026-10-24-army-order-filters/browser-results
```

[First production run](browser-first.log): **one test passed**, 9.5 seconds for the case / 10.5 seconds overall. No assertion or application change was needed. These durations are functional-test metadata, not performance measurements. [Browser evidence](browser-evidence.json) pins the six unchanged source/test/fixture files and native image bytes.

The real pending group-review lock was observed on the DOM selector during a public worker query; filtering afterward retained both checked IDs and the reviewed destination. Browsing and locating the army preserved initial hash `aa8eb3f5` and the entire eight-record archive. The only additional command was sequence 9, turn 2: ordinary `setPatrolEnabled(enabled:true)` for `army.99`. It produced hash `099f7ee4`, kept the full active route and zero-movement army identical, and survived exact export/replay and manual save/reload. No End turn or reviewed group-movement order was submitted.

Native imagery includes a 1,440×1,000 desktop workflow view, two 390×844 enlarged-text views and an **806×66 / 8,755-byte** selector detail. The latter shows only the selected Paused patrols cohort, suitable for an honestly captioned compact journal image; the full views and archive prove the surrounding workflow. No image resizing, pixel transformation, wrapper insertion or catalogue-budget increase was used. The source owner inspected the selector and narrow captures; independent UI image review is recorded separately.

Representative read-model timing, final journal integration and publication remain parent-owned. Exact exports establish state/commands, not worker query counters. No organic mature-empire, whole-world rendering/transfer budget, M3 completion or 1.0 readiness is claimed.
