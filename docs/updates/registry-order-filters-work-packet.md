# Find waiting orders in a crowded roster

**Dispatch 17 publication preparation.** ID `registry-order-filters`, implementation pin `da12978fb596a73a7fddcfb8e914efb7924efbc2`. The reviewed story and exact selector PNG are now integrated into the journal for coordinated publication checks; no publication or live outcome is claimed here. The earlier design sections below are retained as preparation history and are superseded by the verified checkpoint and current publication packet. See `docs/development/2026-10-24-registry-publication/README.md` for final claims, source identities, image budget and pending checks.

## Player problem and proposed story

A paused patrol can sit beyond the first page of a large army roster. Its company may have no movement left while an ordinary route remains active. Searching only for idle companies can miss the saved policy, and reading “patrol paused” as “travel stopped” gives the wrong answer.

The proposed army registry adds four choices: **All forces**, **Postings and patrols**, **Orders waiting**, and **Paused patrols**. Search and land/fleet filters still apply. Counts cover that matching roster before the selected order filter and the existing 25-row pagination. A player can find the relevant company, read its actual posting, patrol and travel facts separately, then use the existing Selected orders controls to make a deliberate change.

This is a way to inspect and select existing orders. It introduces no automatic recovery, bulk resume, new AI policy or competing rule for whether a company may move. A disabled patrol can still have active travel; a paused route can exist without a posting or patrol. “Orders waiting” includes actual posting blockers, enabled patrols reported waiting and paused routes. It preserves each supplied reason rather than inventing a new diagnosis from movement points or an old error.

## Browsing preserves player intent

Changing the order filter resets its page and preserves checked army IDs. Existing outside-filter notices explain retained checks, and Select matching adds the visible matching cohort through the existing group controls. A pending group request keeps the filter locked under the same rules as sorting and pagination. The existing route review is transient; there is no invented persistent-review Cancel control, and the drafted journey never applies its reviewed routes.

The proposed filter is local to the open registry. Closing and reopening it returns to All forces; this is not a saved campaign preference. The settlement registry does not acquire an army-order filter. Postings and patrols is named precisely: it does not claim to collect every defense-theater assignment or all delegated work.

## Authority and scale

The presentation index consumes only owned-army facts already supplied by the observation. It copies posting, patrol and route fields, excludes foreign or missing actors, preserves hex zero and tolerates historical observations without patrol records. It does not inspect geography, compute routes, decide command eligibility or send new worker queries.

The intended cost is one pass over observed armies plus their supplied posting, patrol and route records, with owned-army storage and constant-time row lookup. This complexity description is not a measured latency claim. New timing numbers require an isolated measurement and exact source identity; no worker, renderer or whole-turn budget follows from a small helper timing.

## Verification paragraph to complete after actual acceptance

The prepared browser fixture contains 101 owned armies on explicitly authored terrain/infrastructure. Orders and exhausted movement are established through ordinary commands and strict saving. It is not an organically recruited or played mature realm. Its last sorted company begins beyond the first page with a disabled patrol, zero movement actually spent by ordinary queued travel, and an active remaining route. The prepared strict save has hash aa8eb3f5 and an eight-record ordinary-command archive; those are fixture-preparation facts, not browser acceptance.

Required acceptance: find that company through Paused patrols; inspect distinct policy/travel facts; locate it without issuing movement; resume only through the real existing button; prove current travel survives; export/replay and manually restore the exact campaign history. Separate interaction should retain checked IDs across filters, compose search/domain counts, show an honest empty cohort, respect pending review and keep keyboard/390px/130%-text controls usable. Filter-only interactions must preserve the campaign hash and archive. Public export proves state and recorded orders, not worker query counters; source review establishes that the filter itself requests no path query. The separate deliberate route review does query movement. A production journey must use public import/export and prove development hooks absent.

**Do not fill in pass counts, durations, final hashes, claimed browser outcomes or source pin until their actual logs exist.** Distinguish pure read-model/component checks, real browser interaction and separate scale measurements. Retain initial failures and explain their corrections without calling draft parsing or collection a passing gameplay scenario.

## Illustration plan

Prefer one native Playwright locator capture of the implemented registry's order-filter controls, counts and meaningful matching row when they fit naturally together. Capture at the actual tested viewport/text scale, with no post-capture crop, resize, re-encoding, compositing or generated content. The caption must state the authored 101-army fixture and distinguish a locator capture from a complete viewport. If it shows a paused policy and active route, describe both correctly.

The current journal image inventory is **3,473,083 bytes** within a **3,670,016-byte (3.5 MiB)** cap: **196,933 bytes remain**. This is a hard existing budget for this preparation, not authorization to expand it. Measure the exact native PNG after capture. A useful, legible image that fits can be copied byte-for-byte only after inspection and provenance review. If it does not fit, reuse an existing approved image with an explicit historical-context caption and link the actual new native capture as source-pinned evidence. Do not shrink pixels to make the budget appear satisfied.

Required provenance: actual source path and implementation pin, screenshot test/case, observer/fixture identity, viewport, device scale, text scale, locator, source/output dimensions and byte lengths, SHA-256 for both identical files, PNG metadata, transform “None”, factual alt/caption and visual-review path. No generator/model applies to a real browser screenshot. Preserve historical image entries and bytes; keep shared decorative materials outside the asset inventory.

## Scope and remaining work

This advances the existing empire-management and UX-at-scale work; it does not add a new gameplay obligation or remove an agreed requirement. Broader governor decisions, coordinated strategy, mobile escorts, multi-step programs, accessible critical canvas alternatives and organically developed mature-realm acceptance remain open. The army registry filter is not a replacement for next-action priority. M3 and all fifteen release gates remain open unless independently established otherwise; this narrow workflow does not establish their completion.

Expected source/evidence links after pinning: `army-order-status.ts`, `realm-navigation.tsx`, the applied component/read-model tests, actual browser test and fixture, final fixture construction/replay evidence, native image review, and final verification report. Current preparation lives under `docs/development/2026-10-24-delegation-workflow/`. Counterplay publication and its live checks remain a separate checkpoint.

## Verified local checkpoint, awaiting source pin

The feature has now been applied and verified locally in `docs/development/2026-10-24-army-order-filters/`. The parent full suite passes **2,318 tests across 282 files in 75.04 seconds**, with typecheck, lint and production build passing. The real Pages-base production journey passed on its first run: **one case, 10.5 seconds overall**. This is functional execution metadata, not a performance result. Final source pin and separate read-model timing remain pending; these local facts do not establish publication.

Filtering and registry-to-inspector navigation preserve canonical hash `aa8eb3f5` and the entire eight-record setup archive. The real public Resume patrol action alone adds sequence 9 at turn 2, `setPatrolEnabled(enabled:true)` for `army.99`, yielding `099f7ee4`. Its complete active route and zero-movement army remain identical. Export/replay and manual save/reload preserve the final nine-record archive. No End turn or reviewed group travel is submitted. The actual transient group-request lock is observed without delaying or faking worker traffic.

All four native captures were inspected. The selected publication candidate is the **806×66 / 8,755-byte** original selector-detail PNG: SHA-256 `acb57af1c12389be669b41d27ab47d6f31dd99c90573739a88514a9744bfbad8`. It shows only Army orders and Paused patrols (1), so the caption must describe a control detail. Its original desktop and 390px/130%-text context images remain linked evidence. Proposed inventory becomes **3,481,838 bytes**, leaving **188,178** below the unchanged cap. The image review and full proposed provenance record are `image-review.md` and `image-publication-candidate.json` in the feature packet. No public image or journal source has changed yet.
