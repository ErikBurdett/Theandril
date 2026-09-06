# Slice 12 — Integrated territory campaign measurements

Measured 2026-09-06 on Node 26.7.0, Intel i9-13900K, Linux, schema 9,
generator 4, content `9418e598`. Each measurement window excludes concurrent
browser, image-processing and other benchmark work. These are development-host
results, not mainstream-hardware release certification.

## Canonical giant-map campaigns

Reproduce with `node --import tsx scripts/benchmark.ts`. [Raw measurements](0016-territory-scale.json).
Each scenario runs all 32/40 factions through 100 rounds of real AI commands.
Every final save and all 50 rounds resumed from a midpoint match uninterrupted
play, with zero rejected orders. Terminal project proposals are explicitly
deferred for this fixed workload; complete victory is a separate measurement.
This window preceded the final refusal-text cleanup: content and accepted-command
state seals are unchanged; the dedicated territory rerun below records final quote
payload sizes rather than treating prose-only bytes as identical.

| Scenario | Full round mean | AI plus observations | End-turn phases | Orders | Final towns / formations | Hash |
|---|---:|---:|---:|---:|---:|---|
| Huge young | 106.754 ms | 81.871 ms | 3.204 ms | 25,274 | 197 / 638 | `5146212d` |
| Huge mature | 78.901 ms | 63.239 ms | 3.538 ms | 25,971 | 168 / 1,531 | `0eb5f7a9` |
| Legendary young | 137.785 ms | 105.915 ms | 3.909 ms | 33,642 | 257 / 837 | `b8e116c8` |
| Legendary mature | 162.484 ms | 133.584 ms | 6.192 ms | 49,989 | 204 / 4,038 | `87cd9e6f` |

Full rounds include all factions' planning, commands and end-turn phases, not
one faction's proposal. They exclude persistence, archive recording, mirrors,
hashing and browser rendering. Mature initial conditions are explicitly authored
1,500/4,000 single-formation armies with treasury; subsequent land development,
growth and battles use real rules. Six cultures are reused across the seats.

| Scenario | Canonical bytes | Seat observation bytes | Save / strict load |
|---|---:|---:|---:|
| Huge young | 3,857,342 | 1,292,900 | 82.608 / 171.146 ms |
| Huge mature | 3,079,113 | 790,455 | 61.410 / 143.332 ms |
| Legendary young | 5,576,562 | 1,645,671 | 118.334 / 260.096 ms |
| Legendary mature | 4,767,909 | 1,099,319 | 97.479 / 227.033 ms |

The expanded legal land quotes increase observation work and payloads. These
full diagnostic observations are not per-frame traffic; the worker retains
cell deltas. Compared with slice 11, full-round means rise in all four cases;
new economic outcomes and command mixes prevent attributing the difference
solely to one function. Bounded local quotes are not yet a packed or virtualized
large-empire land UI. Raw sampled heaps span 30–283 MiB, including a resumed
mirror and without forced collection; this is not retained-memory evidence.

## Independent movement and warfare regressions

Both 512-army queued-route workloads preserve twenty exact resumed rounds.
Huge/Legendary active travel phases have medians 73.484/75.960 ms; idle rounds
are reported separately in the raw data. The queries retain their explicit
4,096-node refusal boundary. They do not claim hierarchical or ocean routing
performance.

The unchanged twelve-versus-twelve battle workload measures 0.398 ms median /
0.858 ms p95 across 200 resolutions. Fifty real blockade, militia assault,
occupation, paid peace and treaty-expiry scenarios retain their saved capture
mirrors at `3587bb50`; assault median/p95 is 0.260/0.322 ms. Twenty-formation
and loaded-fleet workloads remain separately documented in slice 11.

## Worked territory and many-town observations

The [dedicated territory report](0015-territory.md) retains its full reproducible
workload, final rerun and strict assertions. A generated six-culture campaign
executes 3,362 commands over 100 rounds, including 38 improvements, five cultivations,
139 battle resolutions and 23 captures. All 1,838 commands after a turn-51 save and
a separate complete replay match at `45417088`.

Explicitly authored mature Huge/Legendary cohorts buy 960/1,200 additional claims
and complete 59/69 improvement/cultivation works through real paid commands.
Physical geography seals never change. Their twenty end-turn means are 1.504/3.137 ms;
these stationary phase workloads exclude AI planning and must not be compared with
the complete AI rounds above as an optimization claim.

One-town land observations cost approximately 0.23 ms, but a separate authored
32/40-own-town concentration exposes scale debt: land reads average 6.291/7.363 ms
and 3,933,631/4,930,516 bytes. Full observations average 33.130/86.524 ms and
5,615,340/8,962,356 bytes. The full cost includes army/character and other options,
not just land. Repeated detailed quote prose needs lazy/compact read models;
these diagnostic sizes are not measured per-frame worker traffic.

## Complete Epic victory, portable save and chronicles

Reproduce with `node --import tsx scripts/benchmark-chronicle.ts --seed=20260905 --size=tiny --pace=epic --factions=4 --limit=1400`.
[Raw complete-archive measurement](0016-territory-chronicle.json). This is ordinary
generated play with all four factions controlled by the actual AI, no terminal
suppression, no injected resources and no minimum-turn victory lock.

Prosperity victory occurs on **turn 863** (862 elapsed rounds): 18,935 orders,
54,448 events, 888 archived battles, zero rejected commands, 34 winning towns,
37 appointed characters, 87 promotions and 506 completed field missions. Complete
technical replay and compressed envelope restore agree at **`177160fb`**. The
independent headless test additionally resumes turn 500, compares both complete
documents, and replays the uninterrupted and resumed histories.

| Operation / output | Measured result |
|---|---:|
| Game execution with archive checkpoints | 18,901.351 ms total / 21.927 ms per round |
| Serialize / strict envelope load | 85.923 / 213.568 ms |
| Compressed export / import | 454.932 / 329.936 ms |
| Generate both complete logs | 424.231 ms |
| Replay all technical evidence | 7,049.817 ms |
| Full envelope / compressed bytes | 16,991,736 / 1,475,486 |
| Technical / history bytes | 27,796,134 / 1,308,675 |
| History chapters | 865 |

The sampled heap is 277 MiB with archive/replay temporaries and no forced GC;
this is not retained-memory evidence. Earlier 75,000-coin economics ended on
turn 557. The retained [240,000-coin counterfactual](0016-territory-price-counterfactual.json)
records an experiment, not the final content seal. The final modern commitments
are Standard 18,000, Long 80,000 and Epic 240,000 coin. Knowledge costs, active
response windows and genuine rules 4–8 replays retain their original semantics.
Four Standard/Epic seed-duration/mirror tests pass. These are pacing samples,
not completed difficulty, strategic-variety or universal duration guarantees.

## Reviewed art and browser rendering

Reproduce offline with `node --import tsx scripts/benchmark-art.ts`.
[Raw compilation measurement](0016-territory-art.json). All 134 approved assets /
152 frames validate, with seven warm iterations excluding filesystem reads.
Validation median is 42.839 ms, deterministic atlas build 108.507 ms, PNG decode
49.641 ms. The single 2048² page is 692,034 compressed bytes / 16 MiB decoded RGBA,
SHA-256 `7a22a84c0c4623cea16327af27313e6796560024f38fbafde1491a0afe27ceb7`.
Reversed input produces the same pack. The 1,000-frame synthetic validation case
reuses real pixels under test IDs and remains a candidate, not new approved art.
Its median is 93.090 ms; process peak RSS of 499.727 MiB includes compilation and
synthetic allocations, not runtime map residency.

All **54 Chromium gameplay scenarios pass** in 2.8 minutes. The dedicated browser
sample uses a synthetic fully explored Huge map, 32 factions, 1,500 global armies
and 32 towns; current fog still limits visible entities. It does not advance turns.
[Raw browser observations](0016-territory-browser.json).

| Stage | Visible terrain cells / chunks | Cached chunks | Estimated chunk backing | Frame p95 |
|---|---:|---:|---:|---:|
| Near home | 1,024 / 4 | 4 | 16 MiB | 16.8 ms |
| After six drags | 1,024 / 4 | 10 | 40 MiB | 16.7 ms |
| Far | 4,096 / 16 | 18 | 72 MiB | 16.8 ms |
| Far, return home | 4,096 / 16 | 26 | 104 MiB | 16.7 ms |

Near view renders 48 static entity sprites; far home uses two aggregate heraldic
sprites. Initial observation transfer is 16,554,000 bytes and camera interaction
preserves `cff84c09`. Art load is 239.9 ms, first art-render CPU 41.9 ms and steady
render CPU 0.1–0.2 ms. A separate fog-limited Huge starting view has 61 cells,
10,971 bytes and 16.8 ms p95; it is not the fully explored measurement.

The first integrated browser review found **black terrain from inflated chunk
bounds**, not just timing noise. An empty border Graphics at world origin expanded
a distant chunk's bounds toward (0,0); Pixi then cached an oversized texture.
Omitting empty border/terrain leaves fixes it. Actual Pixi bounds tests reproduce
the failure and preserve genuine translated borders/props. The final measured
maximum is **837×712 pixels**; browser assertions guard dimensions and backing.
The [rejected image](../screenshots/slice12-rejected-empty-border-cache.png) and
inspected [corrected near](../screenshots/slice12-fully-explored-near.png) and
[far](../screenshots/slice12-fully-explored-strategic.png) images retain the evidence.

Chunk backing estimates round up to power-of-two RGBA dimensions and are **separate**
from the 16 MiB map atlas and potential 16 MiB DOM decode. They exclude returned
texture-pool resources and other GPU allocations; 26 observed chunks do not prove
the full 64-entry saturation budget or retained memory. The new affinity-based
home lies near chunk boundaries and shows 16 far chunks, not the older nine;
viewport dimensions remain 890×786. Terrain repetition, dense labels, static
poses, first-render cost, packed world transfers and large-town option payloads
remain explicit follow-up work.

Final typecheck, full lint, content validation, production build and **638 tests
across 70 files** pass with no skipped tests. Nothing here proves a thousand-turn,
forty-faction mature empire's memory, performance or strategic variety.
