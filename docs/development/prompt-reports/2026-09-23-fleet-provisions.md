# Fleet provisions with an AI that plans the return — 2026-09-23

## Prompt

“Look at file:///home/telephoneheater/Projects/DHARMA/dharma-tracker/site/projects/Theandril/index.html and continue Theandril's development towards 1.0.”

## Delivered

Implemented tracker **ACT-35** locally, advancing **M4 / ACT-33**. Fleets carry
eight turns of stores beyond friendly harbour supply. After their last ration,
hulls and passengers share attrition until returning to replenish. The selected
fleet/passenger panel shows remaining stores. Split/merge operations cannot
refresh endurance; foreign stores remain private.

AI fleets plan legal returns using observed supply, stop for replenishment,
finish immediate safe landings and fund nearby owned staging harbours. Review
found and fixed shallow hulls choosing unreachable deep-water resupply targets.

Rules/save **31** preserves six independently captured rules30 saves and
archives, with exact historical bytes, seals and replay. Modern continuation,
mixed histories, IndexedDB and compressed export/import retain fleet stores.
Content remains **`015468d1`**; campaign prices are unchanged.

## Changed

- Simulation: supply resolution, private supply observation, army composition,
  versioned commands, current save format and frozen historical schemas.
- AI: naval return/staging policy, depth-aware return targets and exclusion of
  fleets from land-depot proposals.
- Player controls: accessible stores meter and refill guidance in selected
  fleet/passenger orders; real browser voyage regression.
- Evidence: independent historical fixtures, compatibility/storage tests,
  generated and synthetic benchmarks, screenshots, reviews, architecture/status
  updates and a draft developer dispatch.
- Local DHARMA tracker: ACT-35 is marked done with the verified local evidence;
  ACT-33 and M4 remain in progress. The rebuilt project page distinguishes
  published rules30 from the uncommitted rules31 candidate and keeps published
  acceptance-point totals unchanged. [Readback](../2026-09-23-fleet-provisions/tracker-readback.json).

## Verified

All counts link to the retained [evidence index](../2026-09-23-fleet-provisions/README.md):

- [Full local tests](../2026-09-23-fleet-provisions/tests-final.log): **1,861/1,861**
  across 232 files. [Nine affected browser journeys](../2026-09-23-fleet-provisions/browser-final.log)
  pass; desktop and 390px screenshots are inspected.
- Typecheck, lint, content validation and production build under `/Theandril/`
  pass. [Independent sim/AI review](../2026-09-23-fleet-provisions/code-review.md)
  and [independent persistence review](../2026-09-23-fleet-provisions/persistence-review.md)
  record no unresolved finding in the reviewed slice.
- [Factual review](../2026-09-23-fleet-provisions/factual-review.md) verifies the
  reported results, source manifest and original screenshot hashes.
- [Final pacing](../2026-09-23-fleet-provisions/pacing-final.log): headline Epic
  **379 turns**, inside 350–400, versus 388 under rules30. All seven measured
  headline/proxy campaigns reach victory with zero refused orders.
- [Generated island play and separate scale timings](../2026-09-23-fleet-provisions/benchmark-fleet-supply.json):
  2,819 accepted commands, 86 refills, six landings and two transported foundings
  over 100 rounds; 2,477 saved-mirror commands match. One fleet and its passengers
  each suffer one attrition turn. Huge/Legendary supply medians 5.81/10.42ms;
  naval planning 41.89/79.53ms, an increase over 33.77/63.04ms without provisions.

The original test timeouts and pacing bounds are unchanged. Sandbox-blocked
repository checks and a subsequent history-feed timeout during overlapping work
were rerun successfully after other workloads finished. Initial browser wording
and authored test-ID mistakes were corrected; their logs are retained.

## Not done / caveats

The implementation remains **uncommitted on the primary `master` checkout**;
nothing was pushed, published or deployed. The public catalogue keeps its
historical source pins; the [draft dispatch](../../updates/fleet-provisions-work-packet.md)
records its eventual update. No primary-checkout synchronization was needed.

Long 342 improves on prior 367 but remains above its about 300 target. Standard 234
versus prior 223 remains above about 200. No price was tuned to hide those results.
The bounded return heuristic does not guarantee every harbour chain or prevent
all losses. Synthetic single-realm throughput is not sustained giant-campaign,
renderer or cross-browser release evidence. All fifteen release gates stay open.

## Follow-ups

Continue M4 with material supply costs and paid trade/treaty access, carrying AI,
controls, save/replay and headline pacing through the same verification loop.
Keep Standard/Long pacing and broader disrupted-port/obstructed-route recovery
explicit in that work. Authoritative multiplayer, remaining progression/content
depth, empire coordination and final release proof retain their existing scope.
