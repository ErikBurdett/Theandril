# Dispatch work packet — Give several hearths a land budget

## Identity

- Title: Give several hearths a land budget
- Stable entry slug: group-land-commissions; edition 23
- Publication state: **source-pinned structured candidate; publication review pending**
- Publication date: not yet published
- Source revision: `cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5`
- Structured candidate: `apps/web/src/updates/group-land-commissions-dispatch.ts`
- Campaign/save/content: rules/save 37 and content 015468d1 unchanged
- Change categories: settlement management, governors, paid land work, saves

## The player's problem

A land commission can develop a hearth without ordering every tile. A realm with
many hearths still needed the same allowance and reserve entered separately.
Checked hearths and saved groups now provide one explicit group order, with the
total permission and shared treasury consequences visible.

## What changed

### Give each checked hearth a bounded allowance

**Before → now.** The settlement registry gains Land commissions. Choose one
existing improvement, an allowance per hearth and one treasury reserve, then
apply to the checked hearths. Outside-filter checks remain counted. The exact
aggregate uses BigInt; each individual amount remains a safe nonnegative integer.
Each allowance replaces remaining permission rather than adding to it. It is not
escrow, a recurring budget or a purchase quote.

**Gameplay example.** The authored Huge fixture has thirty hearths, 128 armies,
two wars and a finite 100-coin purse. Thirty 100-coin permissions and a 10-coin
reserve let four ordinary 22-coin works start: 88 spent, 12 left, twenty-six
commissions waiting. All thirty policies are accepted. The 3,000 displayed total
is not an invoice. Ordinary worker commands choose legal claims; ownership,
infrastructure and purse are explicitly authored, not organically earned.

**Image.** Actual unprocessed Playwright element screenshot:
`docs/development/2026-10-26-group-land-commissions/browser-results/production-group-land-poli-a2d26-val-and-restoration-at-130-/group-land-budget-native.png`.
Candidate public copy: `apps/web/public/updates/group-land-budget.png`.
Native **780×28**, **6,426 bytes**, SHA-256
`a26079a6ffbba7cba1f75fb945f99305d009f7b57122d13aef558313958c5876`.
Captured from `.group-land-total` at 1440×1000 and 130% text before Apply.
No crop, resize, recompression or generated imagery. It shows only “100 coin per
hearth × 30 = 3000 coin total permission.” The caption distinguishes permission
from the authored 100-coin purse; reserve, payments and receipt require the linked
full captures/exports. Exact provenance is in `apps/web/src/updates/media.json`
and the public provenance copy. Independent source-image review is retained in
`docs/development/2026-10-26-group-land-commissions/visual-review.md`.
Twenty-seven journal images total 3,662,292 bytes, leaving 7,724 below the unchanged
3,670,016-byte cap. All historical image records and bytes remain unchanged.

**Developer note.** Whole-request/hash validation precedes mutation. The worker
sorts IDs and records existing `setLandPolicy` commands; simulation alone selects
and prices work. It publishes one final state with per-hearth receipts and does
not implicitly save. The 128-command cap bounds one UI action, not empire size.
No canonical rule, AI, chronicle, persistence or content change is introduced.

**Evidence.** Fifteen immutable paths are pinned in the structured candidate and
`docs/updates/group-land-commissions-release-expectations.json`. The implementation
packet records 2,486 tests / 300 files in 127.49 seconds with two local workers,
typecheck, lint and the Pages build. All 78 distinct local Pages cases have passing
results across the full 76-pass/two-failure run and seven-case affected rerun
(32.8 seconds). The four new cases separately pass in 56.1 seconds; scopes overlap.

The first unit run had one changelog timeout alongside concurrent browser work;
its unchanged isolated six-case rerun and then the full bounded-concurrency run
pass. Browser corrections replace an obsolete home article count with the actual
catalogue and center the existing form before unchanged input visibility/44px
assertions. No assertion threshold, timeout or runtime rule changed. Original
failures remain retained. Journal integration checks are separate from the source
results; initial focused journal verification had 44 passes and one stale
latest-entry test, corrected to select unchanged historical edition 22 by ID.
The final focused journal run passes all 45 cases across four files.

**Limit.** The same allowance and reserve apply to each selected hearth. This is
not one shared allowance allocator, an atomic purchase across the group or a
preview of every future quote. Accepted permission can wait for suitable work.

### Keep a receipt and retain control

Confirmed accepted hearths leave the checked set; refusals remain for review.
Receipts filter and page every result without retrying orders. The thirty-hearth
journey reaches its last five results, removes policies by keyboard at 390px/130%
while retaining paid work, replays the exact 61-record archive and restores its
31-record manual grant save. Initial selective removal leaves 29 checks; saved
recall restores 30, including 27 outside a Frontier search.

Three generated-campaign cases damage only a native result after an actual paid
commission: missing results, wrong hearth ID or worker failure. All preserve
selection, lock further orders and require restoration before a single explicit
retry. They are injected recovery regressions, not observed spontaneous defects
or a general network-recovery certification.

## Scope ledger

- Existing scope: ACT-32/M3 governor and coordinated empire-management controls.
- New gameplay scope: none added or removed.
- Deferred: broader paid land/cultivation/claim decisions, funding priorities and
  combined delegation in organically developed mature realms.
- Open: DH-021, R06 and all fifteen release gates. No new pacing run is claimed
  because simulation and AI are unchanged; earlier headline data remains dated.

## Road to 1.0

This advances Gate I's management workflow and exercises Gate E's saved-command
boundary without closing either. The catalogue retains 23 stable items: six
completed, thirteen in progress and four pending, with 94 delivered and 49 remaining
editorial statements. These are not completion percentages. Development deployment
is not 1.0 acceptance. Full publication integration, independently inspected reader
layouts and exact public readback remain required.

## Contributor handoff

Measure combined delegation in a naturally developed mature realm, then broaden
paid land decisions while preserving shared-purse ordering, exact replay and
manual control. Start with `group-land-policies.tsx`, `simulation.worker.ts`,
`tests/production/group-land-policies.spec.ts` and ADR0056. Canonical status and the
existing structured roadmap remain the only completion ledger.

## Review and publication record

- Independent code, UI source and gameplay-image reviews: implementation packet.
- UI author's own source review: disclosed separately in `ui-review.md`.
- Journal editorial review: assigned independently; final verdict pending.
- Reader desktop/narrow/text-scale/keyboard: parent publication integration pending.
- Exact public build/image/feed readback and Actions: parent-owned publication step.
