# Dispatch work packet — Give several hearths a land budget

## Identity

- Title: Give several hearths a land budget
- Stable entry slug: group-land-commissions
- Publication state: **draft; integration and factual review pending**
- Publication date: not yet published
- Source revision: pending the verified implementation commit; baseline `bc62e10`
- Campaign/save/content: rules/save 37 and content 015468d1 unchanged
- Change categories: settlement management, governors, paid land work, saves

## The player's problem

A land commission can develop a hearth without ordering every tile. A realm with
many hearths still needs the same allowance and reserve entered one settlement
at a time. Checked hearths and saved hearth groups now provide a way to give that
permission together, while making the total permission and shared purse explicit.

## What changed

### Give every checked hearth a bounded allowance

**Before → now.** The settlement registry gains Land commissions. Choose an
existing improvement, an allowance per hearth and one treasury reserve, then
apply to the checked hearths. Hidden-by-filter selections remain counted. The
form shows exact total permission even when its sum exceeds the safe integer
range of an individual order. Each allowance replaces that hearth's remaining
permission; it is neither an addition nor money removed in advance.

Each first eligible order can spend immediately in stable hearth order. Every
purchase must leave the chosen reserve in the shared treasury; it is not a
separate reserve for each settlement. Other realm orders can still spend it.
Later commissions may therefore wait even when the whole batch was accepted.
Accepted means permission was recorded, not that construction started.

**Gameplay example for integration review.** An explicitly authored thirty-hearth
fixture gives the realm 100 coin. With 100 permission per hearth and a 10-coin
reserve, four ordinary 22-coin orders start, spending 88 and leaving 12; the other
twenty-six commissions wait. The displayed 3,000 permission is not a 3,000-coin
invoice. The completed browser export is retained under the implementation packet’s
`browser-results/production-group-land-poli-a2d26-val-and-restoration-at-130-/`
directory with `group-land-policies-evidence.json` and its portable campaign. It is not an organically earned thirty-hearth campaign.

**Image.** New actual Playwright element screenshot, unchanged native PNG:
`docs/development/2026-10-26-group-land-commissions/browser-results/production-group-land-poli-a2d26-val-and-restoration-at-130-/group-land-budget-native.png`.
Proposed public path: `apps/web/public/updates/group-land-budget.png` (not installed
by this draft). Width 780px, height 28px, 6,426 bytes; SHA-256
`a26079a6ffbba7cba1f75fb945f99305d009f7b57122d13aef558313958c5876`.
Captured directly from `.group-land-total` at the initial desktop 1440×1000
viewport and 130% text in the thirty-hearth browser journey, before Apply. No
crop, resize, recompression or generated imagery. It shows only “100 coin per
hearth × 30 = 3000 coin total permission.” Caption: “Thirty checked hearths,
100 coin each: 3,000 coin of total permission. The shared treasury still contains
only 100 coin before Apply; this is not an invoice or an escrow balance.”
Alt: “100 coin per hearth times 30 equals 3000 coin total permission.”
The strip does not show the reserve, receipts or actual payments; linked full
captures and exported campaigns supply those details. UI-author inspection sees
a readable native strip; independent source-image and final displayed journal
review remain separate. It adds 6,426 bytes within the remaining 14,150-byte
journal image budget; no cap increase is proposed.

**Developer note.** The worker validates one bounded request against the reviewed
campaign hash, then records ordinary `setLandPolicy` commands. Simulation remains
sole owner of eligibility, quotes, payments, work and interruptions. No rules,
AI, content or save-schema change is introduced. The 128-hearth batch ceiling
bounds one interface action; it does not limit empire size. A batch publishes
one final result with per-hearth receipts and does not implicitly save.

**Evidence.** UI mapping/receipt/registry checks: 25 tests across three files pass;
full typecheck passes. These are scoped checks, not a completed integration or
release claim. `docs/development/2026-10-26-group-land-commissions/ui-tests.log`,
`ui-typecheck.log` and `ui-review.md` retain exact scope and source hashes.
The initial test-fixture type errors and their correction remain recorded.
The four new production browser cases pass in 56.1 seconds: a real shared-purse
batch, keyboard removal/restoration at 130% text, and three injected reply/worker
failures after real paid commission installation. `browser-initial.log` retains
the scope. Missing results, the wrong hearth ID and a worker error require
restoration without losing the checked selection or automatically retrying.
The first full-suite run had 2,485 passes and a feed test timeout during concurrent
browser work; its isolated six-case feed rerun passes. A full rerun with bounded
parallelism and the complete Pages suite are underway; no final integrated count
is claimed yet. All evidence will be pinned once the source commit exists.

**Limit.** A batch gives one exact improvement and the same budget values to each
selected hearth. It does not allocate one common allowance among hearths, preview
all future prices, coordinate paid claims/cultivation or make purchases atomic
across the group. The policy can be accepted while waiting for suitable work.

### Keep a receipt and retain direct control

Every submitted hearth has a receipt. Accepted hearths leave the checked set;
refusals remain checked for review. The receipt can filter accepted/refused rows
and paginate all results without retrying orders. An uncertain recording or
worker reply requires restoration rather than an automatic retry that could
replace permissions or spend again.

End land commissions affects only selected hearths with existing commissions
and does not depend on invalid values in the unapplied form. Paid work continues.
The existing manual override, site/deposit protection, siege/occupation waits and
ownership-loss cleanup still apply. Current registry rows show the owned
commission, remaining permission, reserve and available summary wait reason;
they do not request detailed prices for every hearth.

## Scope ledger

- In agreed scope: ACT-32/M3 governor and coordinated empire-management controls.
- Newly proposed: **none; no new gameplay obligation added or removed**.
- Deferred: broader paid land/cultivation/claim decisions and combined delegation
  in organically developed mature realms. This batch control does not supply that
  strategic or organic-scale proof.
- Open issues: DH-021 pacing, R06 and all fifteen release gates. No new pacing
  result is claimed because rules and AI are unchanged; prior measurements remain
  dated evidence, not a fresh campaign run.

## Road to 1.0

This advances Gate I's management workflow and exercises Gate E's saved-command
boundaries without closing either gate. Strict transport checks and ordinary
canonical command recording support determinism, but full acceptance includes
more than this selected batch. The four focused browser cases verify desktop/narrow keyboard behavior, failure
recovery and exact replay. Full integration, independent displayed review and
public readback remain publication requirements. Deployment is development availability, not 1.0 acceptance.

## Contributor handoff

Next, measure combined worker, charter and land delegation in a naturally grown
realm, then extend paid land/cultivation decisions with explicit consequences.
Preserve shared-purse ordering, exact replay and manual control. Start with
`group-land-policies.tsx`, `simulation.worker.ts`, `tests/production/group-land-policies.spec.ts` and ADR0055's canonical commission boundaries. Keep canonical status and
the existing roadmap together; do not introduce a second completion percentage.

## Review and publication record

- UI author source review: retained; explicitly not independent visual approval.
- Independent code review: parent packet, final hash reconciliation pending.
- Desktop/narrow/text-scale/keyboard: four focused production journeys pass;
  independent capture review and full-suite integration remain pending.
- Image provenance: actual new 780×28 native budget strip inspected by UI author;
  independent source-image and displayed journal review pending.
- Full checks, exact source commit, Actions and Pages/public readback: pending.
