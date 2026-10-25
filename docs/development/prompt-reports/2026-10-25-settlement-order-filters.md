# Settlement order filters deployed

## Prompt

“continue”, with standing authorization to continue toward 1.0 and deploy each feature or fix.

## Delivered

The [live settlement registry](https://erikburdett.github.io/Theandril/) now filters **All hearths**, **No production**, **Without charters** and **Charters waiting**. Overlapping counts follow search before 25-row paging. Checked hearths remain selected across filters, and group controls disclose checks outside the current view before explicit application.

Rows preserve the distinction between current queues, canonical waiting reasons and next-work candidates. A completed building program or deliberate limit can be a normal wait. Keyboard-accessible expandable guidance keeps this explanation available without crowding narrow controls; the Map guide also explains it.

Implementation `5da6b62` and publication `4e2c678` are committed and deployed. Reviewed dispatch 19, **Find empty queues and waiting charters**, includes an exact native selector image and source evidence. Prior eighteen dispatches and twenty-one images remain unchanged. [Deployment proof](../2026-10-25-settlement-publication/deployment.json).

## Changed

- Presentation: detached own-only settlement-order index, registry filters/counts, policy explanations and scoped disclosure styling. No simulation eligibility or automatic purchase rules are duplicated.
- Verification: pure and registry tests, authored Huge production fixture, actual controls, strict exports/replay, source review and native desktop/narrow captures.
- Publication: journal content, image provenance, existing catalogue/status/M3 records and this report. No competing roadmap or new release promise was introduced.

## Verified

The publication passes **2,364 tests across 288 files in 63.73 seconds**, four workers, plus typecheck, lint, content/art validation and Pages build. [Acceptance scope](../2026-10-25-settlement-publication/local-acceptance.json).

All **58 distinct local Pages journeys pass across two runs**: the initial run had 57 passes and one stale test expectation for the previous article's 2,339 count. The page correctly showed the pinned implementation's 2,362. Correcting that exact expectation produced ten passing journal cases in 13.1 seconds. Runtime and assets were unchanged; the original failure, screenshot and trace are retained. This is not presented as one all-green 58-case invocation.

The new workflow uses authored infrastructure: thirty owned hearths, 128 armies and two wars. Browsing preserves its exact 30-record archive at 503329a2. Six explicit charter changes yield 36 records at bb648af6, with counts 30/24/10/5 becoming 30/24/9/0. Queues, treasury, settlements, armies, routes, postings and patrols remain exact. All three final exports independently replay; [browser/export review](../2026-10-25-settlement-order-filters/browser-review.md).

All four final gameplay captures and twelve reader captures were inspected. The 340×71 selector image preserves exact source bytes; its caption identifies authored infrastructure and excludes selection/results proof. The narrow inline raster text is small; the caption and native inspection links provide context. [Publication reviews](../2026-10-25-settlement-publication/review-source.md).

Both GitHub workflows succeed. Exact public HTML/chunks/worker/image/provenance, ledger, article pin and catalogue match the local publication build. **Three targeted live journeys pass in 37.7 seconds**: new settlement filtering, normal group charters and army filtering. This is separate from local full-suite coverage; [live log](../2026-10-25-settlement-publication/live-pages.log).

At completed feature verification, the primary checkout `/home/telephoneheater/Work/Theandril` on `master`, `origin/master` and the live revision all equal `4e2c678d45a2d621ed8aaa4bd19223a717f7896c`. The subsequent documentation commit records these completed outcomes without changing application, test or workflow code.

## Not done / blocked / caveats

ACT-32/M3, R06, DH-021 and all fifteen release gates remain open. Rules/save 35 and content 015468d1 are unchanged. No AI policy, pricing, pacing, new worker query or per-frame behavior changed; no new pacing or performance measurement is claimed. Source-level linear complexity is not a timing result. Authored scale is not organic mature-realm acceptance.

## Follow-ups

Continue the existing [M3 plan](../../1.0-DEVELOPMENT.md) with mobile escort lifecycle and coordinated movement, broader governors/programs, and organic mature-realm evidence. Keep pacing and wider strategic counterplay work distinct. The [canonical status](../../IMPLEMENTATION_STATUS.md) and existing release gates remain authoritative.
