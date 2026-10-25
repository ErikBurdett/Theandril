# Land-work commissions — 2026-10-25

Rules/save **37**, content **015468d1** unchanged. This advances ACT-32/M3 with
individual paid improvement commissions; it does not close M3 or a release gate.
[Canonical contract](../../architecture/0055-land-commissions.md).

## Delivered behavior

Choose an existing improvement, a total remaining coin allowance and a treasury
reserve. Applying can start one ordinary paid order immediately; subsequent
orders start after upkeep and existing production charters. Every start pays its
current quote and consumes exactly that much allowance. New work receives no
free progress. Reapplying replaces the allowance; funds are not escrowed.

Only currently worked, legal, charted, unimproved claims qualify. Selection uses
the cheapest affordable quote, then numeric cell. Existing improvements remain;
resource deposits require their matching extraction site. Claims, cultivation,
replacements and worker assignment remain separate. A commission waits behind
active work, siege/occupation, research, allowance or reserve restrictions.

Successful direct construction, cultivation or cancellation ends the commission;
failed commands preserve policy and hash. Removing a commission keeps already
paid work. Ownership loss removes it immediately, preserving ordinary no-refund
cancellation. Worker changes can alter future choices without cancelling work.

The selected hearth form shows authoritative next-choice detail and current
allowance. Ordinary summaries carry compact owned metadata without tile scans.
No group commission assignment is added in this slice.

## Verification

- [Full integration suite](tests-integration.log): **2,461 tests / 298 files pass
  in 67.00 seconds**. [Typecheck](typecheck.log), [lint](lint.log) and
  [production Pages build](build.log) pass.
- [Independent sim/AI source review](source-review.md),
  [independent UI source review](ui-source-review.md) and the separate
  [AI review](ai-source-review.md) find no blocking issue. Scope and exact file
  hashes are recorded. Source review does not substitute for displayed review.
- [Prechange metadata](prechange-metadata.json) records pristine source
  `657a4a55c8d1fabe0f64fd2544c422a90995bf21`: generated rules-36 seed 41, ordinary
  worker priorities, two paid improvement orders and eight turns. Thirteen
  records retain original initial `852ddbd7` and final `e9013c5e` seals, final
  turn 9, one completed site and one active paid order. Original bytes remain in
  the repository fixtures. Strict old-field rejection, old replay and mixed
  36-to-37 continuation pass; new policies cannot be silently dropped into old
  envelopes. Synthetic v0–v3 test builders strip only empty future fields.
- Canonical tests cover repeated payments, shared purse/reserve, charter
  precedence, arbitrary bounded budgets, both manual work kinds, failed orders,
  changing workers, occupied/sieged hearths, actual capture/raze, hidden metadata,
  off-page selection, generated grain extraction and exact save/replay.

## AI and pacing

The AI uses a one-job commission only when unchanged worker allocation and full
worked-cell quotes prove the identical choice to its existing strategic planner.
An exact allowance funds that immediate job and reaches zero, requiring a fresh
strategic plan before further spending. Reserve zero avoids double-counting
earlier proposals against an old observed treasury; the existing planner budget
already protects its strategic reserves. Replacements, incomplete views and
changing workers retain direct orders. Funded existing commissions are respected.

[Headline pacing](pacing-after.json) and [comparison](pacing-comparison.json)
retain Standard/Long/Epic **219/329/374** turns on the same standard-map,
twelve-realm seed 20260905 as prior rules 36. The AI issues 18/22/29 commission
commands respectively, with no refused or automatic-refused orders. This is
turn-outcome comparison, not identical entire states or all-seed equivalence.
DH-021 remains open: Long 329 is late against roughly 300; earlier adverse seeds
were not rerun here. No prices, pacing bands or proxy assertions were changed.

## Performance scope

[Benchmark](benchmark.json) and [script](../../../scripts/benchmark-land-policies.ts)
measure three warmups plus twelve actual paid-phase samples and fifteen sustained
ordinary turns. Each isolated sample starts real paid work on a restored waiting
policy state; restoration/hash/validation are outside timings. Separate sustained
runs install policies through ordinary commands and verify exact saved mirrors.

| Authored workload | Paid-phase p95 ms | Full-turn p95 ms | Sustained starts / completions |
| --- | ---: | ---: | ---: |
| Huge, 32 hearths | 0.463 | 10.281 | 256 / 224 |
| Legendary, 40 hearths | 1.591 | 29.568 | 320 / 280 |
| Huge, 10,000 claims / 9,999 workers | 3.488 | 11.035 | 8 / 7 |

Ownership, population, purse and local plains are authored; only rewritten
claims lose their generated deposits. These are not organic mature campaigns.
Policy summaries peak at 6,433/8,062/203 bytes. Full authored observations are
2.20/4.91/1.66 MB: this CPU measurement is not worker-transfer, browser, disk,
full-world single-estate or complete scale-gate acceptance.

## Retained corrections and remaining verification

The first AI-only run could not resolve a test import of `@theandril/chronicle`;
the test now uses its existing relative source path. Forty prior AI checks passed
in that run; the corrected three new cases pass separately and in the full suite.
The first new charter-precedence test incorrectly allowed enough money for both
orders; an explicit reserve demonstrates the intended wait. Runtime behavior did
not change. The first scale setup found a generated hearth without a researched
suitable site; the corrected fixture explicitly authors its local plains rather
than changing eligibility. Initial logs remain alongside the passing evidence.

The [whole local Pages suite](browser-full.log) passes **all 74 cases in 5.3
minutes**, without retries. The two new cases are included, not an additional
count. Their retained [artifacts](browser-results/) prove a generated two-person
hearth spending 22 then 25 coin, completing both sites at turn 7 with 3 coin left,
and restoring the active commission at exactly `8ee96751`. Completion is
`075f0687` with 15 records, including real other-realm AI turns. The narrow
390px/130% keyboard case rejects invalid amounts, cancels without a refund and
manually builds while a commission waits: four records, final `5add1cc4`, 26 coin.
[Displayed review](browser-review.md) distinguishes the full desktop panel,
scrolled narrow controls and native summary strip. Existing unrelated full-suite
captures remain local temporary outputs; new feature artifacts are retained here.
Publication and public readback will be recorded after the verified commit.
Broader governors, paid claims/cultivation/replacements, coordinated commissions,
organic mature-realm acceptance, DH-021, R06 and all fifteen gates remain open.
