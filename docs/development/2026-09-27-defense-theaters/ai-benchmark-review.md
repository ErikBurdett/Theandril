# AI adoption planner measurement readback

Author/readback: `/root/next_orders_assessment`, 27 September 2026. This agent
implemented the AI planner and harness; this is an authored evidence readback,
not an independent code review or release-gate acceptance.

The bounded reachability fix adds ordinary canonical movement previews before
the AI delegates spare companies. The measurement exercises that work through
the actual pure planner, with no preview stub or replacement routing rule.
The [harness](../../../scripts/benchmark-theater-adoption.ts),
[final JSON](ai-benchmark-final.json) and [complete output](ai-benchmark-final.log)
retain the inputs, exact samples, source-file SHA-256 values and assertions.
Rules/save version is 33; content hash remains `015468d1`.

## Accepted quiet run

The final run completed successfully from 18:40:42.456 to 18:40:49.291 UTC
(log creation/final-write times). Root and the UI agent explicitly held other
builds, tests and browsers during this window. Each case used one warmup and
three measured samples, with a fresh permitted observation for every sample.

| Case | Planner median (ms) | Canonical previews per sample | Target-search nodes per sample | Proposed / accepted automatic orders |
| --- | ---: | ---: | ---: | ---: |
| Huge, reachable | 0.348 | 3 | 25 | 1 / 2 |
| Huge, island fallback | 1.966 | 8 | 4,942 | 1 / 2 |
| Huge, all blocked | 2.082 | 8 | 6,504 | 0 / 0 |
| Legendary, reachable | 0.162 | 3 | 25 | 1 / 2 |
| Legendary, island fallback | 1.635 | 8 | 4,942 | 1 / 2 |
| Legendary, all blocked | 2.074 | 8 | 6,504 | 0 / 0 |

“Proposed” means one ordinary `setTheater` command. The automatic count comes
from applying the proposal and an ordinary End turn to an independent strict
save copy after measurement. Both member routes were accepted in every
adopting case. The fallback assertions require the reachable alternative hearth
alone; every island-only case declines adoption and reserves no army.

All six cases prove unchanged canonical hashes, unchanged permitted observations,
and identical proposals and query diagnostics across independent samples.
Three samples support these literal medians; they do not establish a reliable
tail-latency percentile or a general scaling curve.

## Scope and bounds

Each authored case has four candidate hearths, 100 own combat companies plus
one scout, and 841 observed cells. Huge retains 1,554 global armies across 32
realms and 196,608 cells; Legendary retains 4,001 across 40 realms and 307,200
cells. The generated mature populations are retained, while geography is
explicitly replaced by flat land with local island barriers and foreign
positions relocated away from the test area. These are controlled workloads,
not naturally developed campaigns.

Timing includes only `planDefenseTheater`. Preparation, observation generation,
serialization, hashing, command application and automatic-movement proofs are
outside the interval. Each new observation identity requires its own route-query
indexes; samples cannot reuse the preceding observation's planner cache. There
is no measured pre-fix baseline or claimed speedup. Full AI turns, concurrent
realms, browser/worker transfers and physical storage are not measured.

At most two selected spares and four candidate hearths permit eight previews.
`getMovementPreview` first computes reachable range and then its target search
within one shared canonical `MAX_PATH_NODES` budget of 4,096. The reported
`targetSearchExpandedNodes` counts only target expansions. The combined range
and target upper bound is therefore **32,768 expansions**, imported from the
canonical constant and multiplied by the AI call bound. The observed 6,504
target nodes in blocked cases do not demonstrate saturation of that bound.
Already-stationed guards need no route query; historical observations without
theater capability return before this work.

## Retained overlapping sample

The earlier [JSON](ai-benchmark-overlapped.json) and
[output](ai-benchmark-overlapped.log) passed their correctness assertions but
are excluded from timing conclusions. A queued browser capture approval resumed
at approximately 18:39:32.743 UTC and completed at 18:39:42.143 UTC, overlapping
the first benchmark's 18:39:33.445–18:39:41.981 UTC file interval. Both agents
confirmed the overlap, retained the initial artifacts and reran the unchanged
harness only after the browser exited. The final table uses the quiet rerun.

## Campaign consequences remain separate

The [fixed pacing comparison](pacing-fixed-comparison.json) reproduces frozen
rules-32 hashes and complete command/result traces, then measures current 33:
Standard 234 → 233, Long 342 → 311 and Epic 379 → 349. Each current campaign
accepted twelve one-member/one-hearth adoptions and three automatic routes,
with zero automatic or submitted-command refusals. This proves modest real
delegation and removes the diagnosed island refusal loop; it does not prove
threat-responsive defense or broad balance acceptance. Standard and Long remain
above their approximate targets, and Epic is one turn below its nominal
350–400 band. DH-021 and all fifteen release gates remain open.
