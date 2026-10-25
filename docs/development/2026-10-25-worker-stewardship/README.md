# Worker stewardship — 25 October 2026

Source published as `97b248ed596c931f01d0df66d60fcf25f819eaef`; both workflows,
exact public readback and all six new live journeys pass. Developer dispatch
publication is recorded separately.
Baseline: `47174209f633a92930b8076b0b1ce7db13c3e38e`.

## Player outcome

A hearth can keep its growing workforce employed without individual tile clicks.
Five optional worker priorities apply immediately and after each turn's growth
and land completion, for the following harvest. Return to manual keeps existing
assignments; a successful individual worker order also ends the policy. Siege
and occupation pause allocation. Capture or razing removes the former policy.

The settlement registry applies one priority to up to128 checked hearths, using
existing saved groups, outside-filter checks, ordinary per-hearth results and
paged named receipts. Stale requests refuse before mutation; uncertain results
require saved restoration. This batch publishes once and adds no implicit save.

Policies use owned legal claims, including cells outside the displayed page.
They do not buy land, construct improvements, cultivate biomes or spend coin.
Production charters, queues and paid jobs stay independent. A priority can leave
a resource deposit unworked and stop extraction; the controls explain that cost.

## Rules, history and AI

Rules/save36, content015468d1. `packages/sim` owns policy state, allocation,
commands, observations and ownership lifecycle. [ADR0054](../../architecture/0054-worker-stewardship.md)
records timing, ranking, complexity and boundaries.

The [pre-change capture](prechange-metadata.json) is a generated rules35 campaign
with14ordinary commands and no authored state mutations. Original bytes, SHA256,
initial `cf953be6` and final `b3bb5875` seals remain intact. Tests verify exact
historical replay, raw envelope reproduction, migration with no policies and
mixed35→36 continuation. Historical envelopes cannot discard a nonempty policy.
Persistence accepts36 checkpoints.

AI delegates only fully quoted, non-resource, non-fiscal hearths with enough
workers for every legal claim. Scarce-worker choices, material demand, incomplete
windows and project funding retain direct management. Direct takeover explicitly
revokes a standing policy even when the chosen worker list is unchanged.

## Pacing

Local standard-map/twelve-realm seed20260905 campaigns, current pack frozen:

| Pace | Before35 | Final36 | New policy commands / allocations |
| --- | ---: | ---: | ---: |
| Standard |219|219|0 / 0|
| Long |329|329|0 / 0|
| Epic |374|374|3 / 6|

Every run ends in prosperity with zero refused orders and automatic refusals.
[Before](pacing-before.json), [final](pacing-after.json). Identical headline
turns are not identical full36 hashes and do not prove all-seed equivalence.
Long remains later than the approximate300-turn target; DH-021 remains open.
Prior adverse seeds have not been rerun for this checkpoint.

A retained [broad-adoption experiment](pacing-broad-adoption.json) ended at
233/346/385 instead of219/329/374. Its AI adopted policies while workers were
scarce, changing between-visit allocation choices. Final adoption retains that
strategic tradeoff in the existing planner and delegates full employment only.
No prices, campaign targets or proxy assertions were altered.

## Scale

[Benchmark](benchmark.json), [script](../../../scripts/benchmark-worker-policies.ts).
Three authored scenarios each resolve15ordinary turns with exact saved mirrors;
three warmups precede12measurements. They do not run strategic AI.

| Authored workload | Policy phase p95 | Full endTurn p95 | Policy JSON max |
| --- | ---: | ---: | ---: |
| Huge,32hearths |1.272ms|10.128ms|4,191bytes|
| Legendary,40hearths |1.493ms|28.955ms|5,262bytes|
| Huge,10,000claims,128people |8.349ms|9.227ms|133bytes|

The first two workloads use the existing empire-land fixture, whose land purchases
are real but ownership/population are authored. Their final claimed counts are
1,248 and1,560 after civic growth. The single-estate case authors a100×100plain
inside a generator4Huge world and its claims, population and purse. It measures
all10,000claims, not a24/64-cell window. Summaries remain read-only; every mirrored
turn and final save/load is exact. Hashing, mirror execution and serialization
are outside timings. These are Node measurements on one host, not browser frame,
physical storage, organic empire, or maximum350,000-claim acceptance.

The first benchmark fixture edited a modern river patch and failed hydrology
validation. [Failure retained](benchmark-initial.log). The corrected explicitly
authored terrain workload starts with generator4, which has no modern river/lake
outlet contract. Runtime validation was not relaxed.

## Verification and review

- [Canonical/AI source review](source-review.md): independent read review; no blocker.
- [Group transport review](group-source-review.md): independent read review; no blocker.
- Genuine historical35 archive, heap/property ranking, free assignment, generated
  growth, manual success/refusal, occupation, siege/capture/raze and fog tests.
- Paid grain extraction test: completed grange, Food harvests3grain, Coin unworks
  the deposit, following harvest adds0; improvement and exact replay survive.
- AI tests preserve resource/fiscal decisions and exercise policy takeover.
- Worker tests cover30real commands, exact replay, all-envelope preflight,
  common-focus/hash rejection, actor refusals, recorder/publication interruption.
- Full suite: **2,432tests /294files pass in65.00seconds** ([log](tests-final.log));
  typecheck, lint and Pages build pass.
- **12targeted production cases pass in1.4minutes** ([log](browser.log)), including
  six new cases and six overlapping posting/charter boundary/receipt regressions.
  The generated seed20260905 two-realm hearth grows on turn3, automatically
  employs its second person, and restores the exact9-record archive/hash
  `a046b260`. No population/treasury/AI activity was fabricated.
- Ordinary-founded seed17 changes Industry's hex704 to Food's hex753, then a
  real manual removal revokes the policy at390px/130% with exact3-record replay.
- Authored30hearth/128army/two-war workflow removes one policy while retaining29
  checks, assigns all30 across a search filter, browses25-row receipts, removes
  all30 by keyboard and restores the exact saved31-record state. Its complete
  removal archive has61records and hash`9932f7c3`.
- Three damaged-reply cases (missing results, wrong hearth, worker crash) follow
  actual canonical allocation, preserve checks, lock End turn, and restore/retry.
- [Browser and image review](browser-review.md) records actual displayed pixels;
  the native806×45summary illustrates only Food /2of2assigned, not a full workflow.
- [Publication evidence](../2026-10-25-worker-stewardship-publication/README.md):
  source97b248e passes both workflows, exact public readback and six live journeys
  in55.6seconds. These live cases overlap the twelve local cases, not extra coverage.

## Retained corrections and scope

The initial full suite passed2,396 and failed34 of2,430tests. Old snapshot tests
compared a current-version hash to a pinned35hash; they now explicitly request35
while keeping the original byte SHA and seal. Syntheticv0–v3test builders now
omit the empty modern field and reject discarding nonempty policies; strict
runtime schemas remain unchanged. A follow-up passed2,430 and failed2 due to a
missing import in the corrected assertions; that import is repaired. A browser
test typecheck required parsing the archive's unknown command field. These are
retained in the initial logs, not hidden by changing fixture seals.

M3/ACT-32 advances within existing governor scope. Paid land automation, broader
optimal governors, production programs, escorts, organic mature-empire acceptance
and broader browser coverage remain open. No new scope obligation or cut. DH-021,
R06 and all fifteen1.0release gates remain open. Deployment is development
publication, not release acceptance.
