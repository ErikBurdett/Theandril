# Dispatch 22 draft — Give land work a budget

**DRAFT. Not published or accepted.** This packet follows
[the journal contract](../../updates/CONTRIBUTING.md). The implementation source
pin, final verification, image review and independent editorial review remain
required before any structured article enters the public catalogue.

## Identity

- Proposed title: **Give land work a budget**
- Stable slug: `land-commissions`
- Edition / sequence: `22`
- Topic: Engineering
- Tags: Settlement management, Governors, Land work, Resources, Saves
- Source revision: **TODO: exact verified implementation commit**
- Rules/save: **37**; content: **015468d1**, unchanged
- Subtitle: 25 October 2026 · Paid land-work commissions
- Proposed summary: Choose the improvement a hearth should build, set how much
  it may spend, and leave a treasury reserve while ordinary land work proceeds.

## Player problem and proposed article sections

### Give the hearth a bounded construction order

Worker priorities can keep households employed, but developing each worked tile
still takes a separate construction order. A land commission lets the player
choose one improvement for a hearth, a remaining total allowance and a treasury
reserve. It begins one eligible paid order immediately when possible, then checks
again after future turns' upkeep and production charters. New work still needs
its ordinary construction turns; the commission does not grant extra progress.

The allowance is permission to spend over time, not coin removed from the realm
in advance. Applying the form replaces the remaining allowance with the entered
amount rather than adding it. Zero allowance prevents new purchases. Every order
uses the ordinary quote and leaves the selected reserve, although other realm
orders remain able to spend that coin. Commissions sharing a treasury resolve in
stable hearth order.

Proposed takeaways:

1. Choose one improvement and a finite allowance; the first order can start now,
   with later orders checked after upkeep and charters.
2. Commissions use suitable worked, unimproved land, preserve existing sites and
   respect the deposit's matching extraction improvement.
3. Manual construction takes back control. Rules/save 37 preserves earlier
   history; this advances M3 without closing its broader governor or release gates.

### Keep sites, deposits and direct control

The commission considers existing worked land and builds only on unimproved
tiles. It picks the cheapest legal quote, then the lower hex number on a tie.
It does not buy claims, cultivate a biome, replace an existing site or assign a
worker. A resource deposit is eligible only for its own matching extraction
improvement. Worker stewardship remains a separate policy, so reallocating workers
can still change yields or stop material extraction.

Existing paid work finishes before another order can begin. Siege and occupation
pause the work; a lost or razed hearth loses the former owner's commission.
Ending the commission leaves already paid work underway. A successful direct
Build, Cultivate or Cancel order ends the commission. Failed direct orders leave
it intact; cancelled work is not refunded.

### Watch two paid works complete

The [new production case](../../../tests/production/land-policy.spec.ts)
uses generated seed 20260905 on a Tiny two-realm Short campaign. Ordinary founding,
Food stewardship and two food-funded turns produce population 2 on turn 3. An
ordinary manual worker order selects hexes 1100 and 1148 before a from-save
journal begins. No terrain, deposit, purse, population or completed site is
authored for this setup.

The browser workflow first protects all 70 treasury coin so the
commission waits. Replacing the allowance with 50 and reserve with zero pays 22
coin for the first Terraced fields order. The test saves that state, ends the
commission without cancelling paid work, restores it exactly, and advances four
ordinary UI turns. The second quote is 25 after existing cultivation
scaling, leaving 3 of the allowance after both sites complete on turn 7. Started
and restored hash `8ee96751` match exactly; the completed 15-record archive has
hash `075f0687`. The case passes in 5.0 seconds within the whole local Pages run.
[Actual result](browser-results/production-land-policy-a-g-f003a-ores-the-exact-saved-policy/completion.json)
and [reviewed pixels](browser-review.md) retain the result and its limits.

A separate keyboard journey at 390px / 130% text rejects invalid budget
inputs, cancels paid work without a refund, then gives an ordinary construction
order while a commission waits behind its reserve. Both manual actions end
the commission and preserve exact exported replay. The case passes in 3.3 seconds
with a four-record archive, final treasury 26 and hash `5add1cc4`. Its screenshot
shows the amount fields and Apply / End controls at that scroll position; the
improvement dropdown is above the viewport. The UI author reviewed those pixels
and disclosed that self-review; independent visual review remains separate.
[Manual result](browser-results/production-land-policy-lan-00366-row-width-with-exact-replay/manual.json).

### Preserve the ledger and the planner's purse

The simulation owns the policy, candidate choice, quotes, payment and ownership
cleanup. The normal summary contains compact owned policy data; only a selected
hearth's detail query scans its worked tiles for a next candidate. A preview is
rechecked before payment, and the form disables stale detail actions while a
fresh query is pending.

Before implementation, a genuine rules 36 generated seed 41 campaign was saved
with one completed site, another paid work order and worker priorities. Its
complete archive and raw save retain their original bytes and old seals from
baseline `657a4a55c8d1fabe0f64fd2544c422a90995bf21`. The capture's final turn is 9
and hash is `e9013c5e`; it contains no authored state mutation or AI commands.
Thirteen original records remain sealed. The final integration suite verifies
strict old-field rejection, old replay and mixed 36→37 continuation; a nonempty
commission registry cannot be silently serialized into an older envelope.
[Prechange metadata](prechange-metadata.json) and [full suite](tests-integration.log)
retain those results.

The AI preserves its strategic material, worker and funding decisions by using
a one-order allowance only when unchanged worker proposals and a complete view
of its worked cells prove that the commission chooses the same first improvement
as its existing planner. Otherwise the ordinary direct order stays. The exact
allowance is consumed immediately, so future spending needs a fresh strategic
plan. A zero commission reserve avoids counting earlier proposals twice against
an old observed treasury; the existing planning budget already protects those
obligations. Funded standing commissions remain respected.
[Independent AI review](ai-source-review.md) and [paired adoption tests](../../../packages/ai/src/land-policies.test.ts)
cover that narrow agreement.

At the same standard-map, twelve-realm seed 20260905 used by rules 36, headline
Standard, Long and Epic campaigns still finish on turns 219, 329 and 374. They
issue 18, 22 and 29 commission commands respectively, with zero submitted or
automatic refusals. [Pacing results](pacing-after.json) and [paired comparison](pacing-comparison.json)
retain the full scope. Equal finish turns are not identical full states or
all-seed equivalence. Long remains later than roughly 300 turns; prior adverse
seeds were not rerun. DH-021 stays open, and no price or proxy bound was changed.

### Another governor step, with wider proof still open

The integrated candidate passes [2,461 tests across 298 files](tests-integration.log)
in 67.00 seconds, plus [typecheck](typecheck.log), [lint](lint.log) and the
[production Pages build](build.log). Independent [simulation/AI](source-review.md)
and [UI source](ui-source-review.md) reviews find no blocker within their stated
scopes. Browser execution and displayed review remain separate evidence.
[All 74 local Pages cases](browser-full.log) pass in 5.3 minutes, including the
two new commission cases. Their counts overlap and are not additive.
**TODO: content/art validation, independent displayed image review, live and
publication results at the final exact source pin.**

[Three authored benchmark workloads](benchmark.json) separately measure actual
paid starts and fifteen sustained ordinary turns with exact saved mirrors.
After three warmups, twelve isolated paid-phase samples restore the same
validated waiting boundary outside the timing and actually charge/start work.
Paid-phase p95 is 0.463 ms for 32 Huge hearths, 1.591 ms for 40 Legendary hearths
and 3.488 ms for a Huge estate with 10,000 claims and 9,999 workers. Full-turn p95
is 10.281, 29.568 and 11.035 ms respectively. The sustained runs record
256/224, 320/280 and 8/7 starts/completions, including initial commissioned work.
Compact policy summaries are 6,433, 8,062 and 203 bytes.

These fixtures author ownership, population, purses and local plains, clearing
generated deposits only where geography is rewritten. They are not organic
empires. Hashing, restored-state validation and serialization remain outside
timings; there is no strategic AI or browser/disk measurement. Full authored
observations reach 2.20, 4.91 and 1.66 MB, so compact policy records do not certify
whole-worker transfer or the scale gate.

Retained initial failures include a test-only Chronicle import path, a
charter-precedence fixture that left enough money for both orders, and a benchmark
setup whose generated hearth lacked a researched suitable site. Corrections use
the existing relative import, an explicit reserve and clearly authored local
plains. Runtime eligibility and validation were not weakened.

This implements part of existing ACT-32/M3 governor scope. No new gameplay
obligation is added or cut. This first commission develops one chosen improvement
on worked tiles; purchasing land, cultivation decisions, replacing sites,
combined strategic governor choices and organic mature-realm acceptance remain
unfinished. The individual form does not claim group commission assignment.
DH-021, R06, M3 and all fifteen release gates remain open. Development deployment
does not establish 1.0 acceptance.

## Image plan

- Candidate: exact native `land-commission-summary-native.png` from the passing
  generated two-work completion case.
- Source: `browser-results/production-land-policy-a-g-f003a-ores-the-exact-saved-policy/land-commission-summary-native.png`.
- Native size: **806 × 45**; bytes: **14,026**; SHA256:
  `d92f139925dd68ed1c80615221427d19367f461f9316926de6ca15e861b239e7`.
- Proposed public path: `apps/web/public/updates/land-commission-summary.png`.
- Image id: `land-commission-summary`.
- Proposed caption: “Terraced fields with 3 coin left in the commission. The
  linked generated-campaign journey records two paid works costing 22 and 25
  coin. This strip shows the remaining allowance, not the complete turn history.”
- Proposed alt: “Land commission summary: Terraced fields, 3 coin left.”
- Preserve exact screenshot bytes; no resize, crop, re-encoding or invented UI.
- Current journal assets total 3,641,840 bytes under the unchanged 3,670,016-byte
  cap. Adding this native strip yields **3,655,866 bytes**, leaving **14,150**.
  Its source pixels were inspected in the disclosed author review; verify the
  copied public bytes and independent displayed review before publication.
- Mobile previews may need their readable caption and Inspect / Original links;
  review the actual displayed image at all four journal viewport/text settings.
- If the native candidate exceeds the budget or fails review, retain this draft
  until a truthful reviewed image decision exists; do not silently raise the cap.

## Existing catalogue update plan — no new roadmap

When the source is pinned and review complete:

- Update `libraryRevision` and `roadmapSnapshot` to the verified implementation,
  rules 37; retain published historical dispatch pins and text.
- Update existing `scopeLedger` entries `campaign-integrity`, `ai-integration`
  and `empire-delegation` with the bounded paid-work behavior and exact evidence.
- Prepend one delivered statement to the existing empire-delegation roadmap item
  and adjust its summary to distinguish paid improvements from still-open broader
  governor decisions. Keep its status in progress and all existing remaining
  obligations. Update associated save/AI/release-proof evidence where warranted
  by final tests, rather than adding a parallel item for every mechanic.
- Retain the 23 stable roadmap item IDs and all fifteen open gates. Recompute
  editorial delivered/remaining counts from the actual catalogue; do not turn
  them into a completion percentage.
- Add immutable links to this packet, ADR0055, prechange metadata, final AI
  review/pacing/benchmark, generated browser output and current status.
- Register the structured edition only after its factual and displayed reviews
  pass; update current-article tests and a new release-expectation file while
  keeping edition21's historical publication contract intact.

## Review and handoff

- Source review: independent simulation/AI, individual UI source and a separate
  AI budget/candidate review pass; see the linked verdicts above.
- Full integration and pacing: 2,461 tests / 298 files; 219/329/374 headline
  outcomes and 18/22/29 commission commands. All 74 local Pages cases pass in
  5.3 minutes.
- Local UI: eleven focused tests across the new commission and existing worker
  controls passed, with typecheck and scoped lint. Logs: `ui-tests.log`,
  `ui-typecheck.log`, `ui-lint.log`. These are not final integration totals.
- Both new production journeys pass (5.0 / 3.3 seconds) within the passing full
  suite; the UI author inspected desktop/narrow/source-strip pixels and disclosed
  self-review in `browser-review.md`. Independent visual review, copied public
  provenance and final editorial review remain TODO.
- Publication and public readback: TODO. No publication is claimed by this file.

Next useful work is coordinated commission management and broader governor
decisions with explicit paid budgets, material consequences and interruption
rules, followed by representative organic mature-campaign evidence. Preserve
the same ordinary command boundary, manual overrides and historical archives.
