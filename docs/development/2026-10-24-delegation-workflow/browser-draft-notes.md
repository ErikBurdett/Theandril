# Prepared production journey and genuine fixture

24 October 2026. Drafts only: no application or discovered-test files changed and no browser/build run occurred. Future destinations are `tests/gameplay/army-order-filter-fixture.ts` and `tests/production/army-order-filter.spec.ts`. The two `.txt` files are ready for integration after the publication boundary. The packet `.draft.ts` copy adjusts fixture imports solely so its canonical setup can be checked locally.

## Concrete fixture guards

[Fixture evidence](browser-fixture-evidence.json) records canonical hash **aa8eb3f5**, a strict-loadable [save](browser-fixture.theandril), and an exact [eight-record archive](browser-fixture-archive.json). Infrastructure, treasury and 101 own companies come from the explicitly authored `theaterCampaign(101)`; names and one foreign guard are authored before the archive. Nothing claims these armies were recruited organically.

All order state and exhausted movement are then established by ordinary commands:

1. Enable a patrol for the second-last own actor and queue its route to hex 510. Its three movement points are actually spent reaching hex 498; the next step is verified as 499.
2. Move the authored foreign guard from 547 to 499 through the real `move` command. End turn once. Canonical route advancement pauses with **Another faction now blocks the next step.** Its enabled patrol reports `waiting` from that actual interrupted route.
3. Post the first actor to its current cell 495, and another to hex 0. The latter's canonical report supplies **No safe route to the posting is known; the army is waiting.** No fabricated blocker enters the fixture.
4. Configure the last stable-ID actor (`army.99`, **Registry company 101**) with a disabled patrol, then issue ordinary queued travel to 510. Canonical pathfinding goes around the occupied cell and spends all three movement points. Its route remains active with remaining waypoints/path, while its patrol policy remains disabled. Both survive strict save/load and exact archive replay.

The canonical counts are **101 All forces / 4 Postings and patrols / 2 Orders waiting / 1 Paused patrols**. The enabled waiting patrol and paused route belong to one actor and count only once. All own forces are land armies ashore, so the fleet filter honestly yields zero. Zero movement is produced by actual travel; this supersedes the browser design's optional suggestion to author movement exhaustion. No command, movement status or blocker is assigned directly after the recording boundary.

The first fixture attempt used a nonnumeric authored runtime entity ID and failed strict loading. [That failure](browser-fixture-first.log) remains retained. The corrected setup allocates a numeric ID from `nextId`; no loader/schema validation was weakened. [Final fixture verification](browser-fixture-final.log) succeeds.

## One browser scenario

[army-order-filter.spec.ts.txt](army-order-filter.spec.ts.txt) contains one production journey. It imports the portable archive publicly and verifies development hooks are absent. It checks the 25-row cap/fifth-page actor, native keyboard filter operation, exact search/domain counts, both canonical waiting reasons, and checked IDs retained outside a narrowed cohort. It uses existing Select matching semantics rather than a new bulk action.

A deliberate public group-route review is separate from filter-only browsing. A DOM-only MutationObserver watches the actual selector's transient disabled state; it does not intercept/delay worker traffic, inject commands or manufacture pending state. After completion, changing only the order filter preserves the checked IDs and the existing reviewed destination. The journey never applies the reviewed routes. Current group review is transient; there is no invented persistent-review Cancel control. This corrects that optional suggestion in the earlier design.

Export/replay then proves the entire campaign and eight-record archive unchanged. Selecting the paused row opens actual Selected orders and shows disabled policy alongside Route active; another export proves navigation did not issue an order. The registry resets its local order filter to All forces when reopened. A 390px viewport and the public 130% Text scale setting exercise the actual waiting reasons and existing patrol controls, retaining native screenshots for later visual review.

Only afterward does the test deliberately activate **Resume patrol**, which issues exactly one ordinary `setPatrolEnabled(enabled:true)` command. It requires the army, zero movement and full existing route to remain identical. No End turn is pressed. The paused cohort must then be honestly empty. Manual save/reload and export must preserve the exact nine-record archive and final state. Army filters are absent from the settlement registry.

## Verification and remaining acceptance

The actual fixture command sequence, strict loader and exact replay have run. A [read-only compiler overlay](verify-registry-drafts.mjs) checks all six future source/unit/browser/fixture files at their intended module paths without writing them there; [final typecheck](registry-draft-typecheck-final.log) passes. Initial draft type failures are retained: one local variable shadowed the browser `window`, then the standalone overlay lacked the app's global development-hook declaration. Renaming the locator and testing property absence with `in window` corrected these preparation errors. Both future browser files pass scoped stdin ESLint ([fixture](browser-fixture-lint.log), [journey](browser-spec-lint.log)). The unapplied source patch still passes `git apply --check` and retains the existing **Route interrupted** wording, adding target/reason rather than renaming it.

No unit test or browser journey is claimed executed. After integration, collect and run the production case against the correct frozen bundle, review screenshots, and retain any first failures. The native pending-lock observation and responsive layout remain unverified browser expectations. Exact archives prove commands/state; they do not expose worker query/transfer counters. The browser draft therefore makes no zero-query or performance-counter claim from export alone. Source review establishes that filters do not request movement queries; the separate explicit review necessarily does.

This authored directory workflow does not establish organic mature-empire acceptance, full rendering/worker budgets, M3 completion or 1.0 readiness.
