# Independent naval stabilization review — 2026-09-21

**Verdict: approve the two bounded P2 corrections at the source images below.**
No new correctness or security finding was identified in this review. This is
independent source/evidence review, not fresh execution of the tests, full AI
approval, contact certification or a cleared release gate. The parent owns the
current integrated run and exclusive benchmark window.

## Reviewed scope and source identity

- `packages/ai/src/naval.ts`: SHA-256
  `897dffd55c5edf0ee67400a6728a4931f90e181bf98b87e87e6839d0057b2d07`.
- `packages/ai/src/naval-outlets.test.ts`: SHA-256
  `4c0e65b99e7f2ab4b3a3df2b87ba8afc1702dc5907eeb07426600a8ed0f44b81`.
- Retained pre-change source: SHA-256
  `b2ac26e4a45a27e9354d318d1354ff36b9823453b65c77228c19be1bf228845c`.
- Retained `naval/focused-final.txt`: SHA-256
  `5db44b37ccb17994528f25f8d2a8f70202aa71b7d087b1029ef9b33f3792ad85`.

Inspected the working diff, complete added test file, original
[`integrated-review/ai.verdict.json`](../../integrated-review/ai.verdict.json),
retained failing/passing output, naval evidence README and paired benchmark source.
Traced consumers through `planTurnWithReasons`, `needsNavalInvestment`,
`oceanScoutReserve`, sea-knowledge budgeting, observation filtering and canonical
production charging. Read the core, QA, AI and armies/fleets contracts.

## Findings and disposition

### Original P2: a queued second harbor was not counted as funded

**Addressed:** `packages/ai/src/naval.ts:62`–`69` counts each owned town once when
its harbor is built or queued, before current port eligibility excludes
occupation/siege. After two funded commitments, only those funded towns remain
eligible in the isolated sparse policy. The center/basin ordering can no longer
select an unfunded third harbor just because it became more attractive.

Queueing really charges `definition.coinCost` in
`packages/sim/src/simulation.ts:442`–`453`; treating a queued harbor as committed
money is consistent with canonical rules. Current usable-port exclusions remain
in force, so a besieged/occupied port is counted as sunk investment without being
used for production. The broader, non-isolated policy is unchanged.

The regression at `naval-outlets.test.ts:14` supplies a legally available third
harbor quote, pays the second harbor's exact 20-coin cost, proves no third harbor
proposal and no unnecessary `needsNavalInvestment` reserve, applies proposals to
save mirrors and checks final commitments/hashes. This directly exercises the
old finding rather than merely asserting a helper's implementation.

### Original P2: each cargo founder rebuilt the observed chart

**Addressed:** `packages/ai/src/naval.ts:185`–`207` selects the single sparse outlet
candidate and indexes saved routes before any new chart construction. The cargo
filter at `naval.ts:286`–`291` uses one assessment closure and the existing
`planNaval` cell index/sea knowledge. Other waiting founders exit before site
geography work. Saved route destinations exit before selection and remain
protected from unrelated ferry boarding. The cache lives for one planning call,
so it cannot reuse stale observations across turns.

The bounded sea-knowledge object remains conservative when its shared node budget
is exhausted; uncertainty is not promoted to connectivity. Existing four retained
site candidates, route queries and local search cap are unchanged. Selection and
observation iteration retain their existing deterministic order. No canonical
state or hidden geography is imported into the planner.

The regression at `naval-outlets.test.ts:63` measures all numeric observed-cell
reads, not only a particular `.map` call, for 1/8/32/128 founders at two chart
sizes and sparse/dense seat counts. It also checks no command and no observation
mutation. This is suitable evidence for removal of the specific multiplied chart
scan. It does not prove that total AI planning is linear: town/route/army scans,
other planner phases and repeated public-wrapper calls remain separate costs.

## Payment, route and evidence claims

- The harbor test authors treasury, founders and the first completed harbor. Its
  three founding actions and second harbor construction use ordinary commands.
  The evidence accurately calls it a generated-geography fixture with authored
  setup, not an organically funded campaign.
- The second-basin reserve test at `naval-outlets.test.ts:116` authors the chart,
  starting hull and completed harbors, but obtains a real ocean-scout quote, issues
  its proposed command and checks the exact 48-coin deduction. The saved alternate
  branch fills the queue using five actual paid production commands and checks the
  canonical full-queue blocker before the reserve drops to zero.
- The lifecycle test at `naval-outlets.test.ts:145` creates an actual saved land
  route, runs ordinary end turns, verifies route retention against nearby ferry
  proposals, saves/reloads mid-route and pays the final AI-proposed founding action.
  It intentionally does not apply unrelated economy proposals; both the source
  comment and README disclose that limit. Its equal hashes prove this continuation,
  not a complete campaign-history replay or organic AI soak.
- Retained `failing-before.txt` shows both original regressions failing. Retained
  `focused-final.txt` reports **40/40 tests across seven files passed**. These are
  implementation-agent execution records read by this reviewer, not rerun results.
- The paired benchmark script separates observed-cell work counts from timings,
  clones observations outside timing, alternates before/after order and identifies
  synthetic idle-founder scope. No timing result is approved merely from reading
  that script; the parent must retain actual isolated output.

## Remaining acceptance

No review-driven code change is requested. Keep the unchanged generated contact
tests, full-suite timeout diagnosis, deterministic integrated acceptance and actual
exclusive benchmark results separate from this scoped approval. No save/schema,
combat-rule, contact threshold or timeout change is part of the reviewed naval diff.
Any edit to the hashed source after this review requires checking the affected
claims again. The original failed verdict remains historical evidence.
