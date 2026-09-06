# Territory, cultural cultivation and worked-land measurements

Measured 2026-09-06 in a reserved sequential CPU window, beginning at **06:00:27.702 UTC**, with other agents' browser, test and native-art workloads paused. Node v26.7.0; Linux 7.1.9-arch1-2; Intel Core i9-13900K, 32 logical CPUs, 33,317,580,800 bytes installed RAM. Save schema **9**, generator **4**, content **`9418e598`**. These are development-machine results, not mainstream-device release claims.

Reproduce with `node --import tsx scripts/benchmark-territory.ts --output`. The script refuses a different schema/content seal. `--smoke` exercises the same verification on a smaller cohort and cannot overwrite the retained report. See the [benchmark source](../../scripts/benchmark-territory.ts) and [complete raw results](0015-territory.json), including every paid quote, result seal, final worked-site yield breakdown and geography seal. Typecheck, scoped lint, smoke and the complete run passed; no commands were rejected.

This final rerun follows the fog-safe refusal-ordering and wording fix. Accepted command/result seals, state hashes, counts and save sizes match the earlier run. Revised quote prose adds 440/540 bytes to the concentrated Huge/Legendary observations; the tables below use the final outputs. Timing differences are fresh measurements, not an optimization claim.

## Generated six-culture campaign

Seed 20260905, Tiny 48×32, six factions, Epic pace. All six cultures begin through ordinary generation. No resources, population, diplomacy or geography are authored; no victory proposals are suppressed. The planner runs once per faction per round, with actual shared-rule autoresolve/capture decisions handled in a bounded loop.

The run completes **100 rounds, ending on turn 101**, not a victory. It issues 3,362 commands, including 28 founding orders, 38 improvements, five cultivations, 12 claims and 232 worker assignments. Land orders spend 2,198 coin. There are 41 completed land works and two still active at the end. The final world has 28 towns, 208 claimed tiles, 159 worked tiles, 36 improvements, five cultivated overrides, 57 army containers and 115 formations. Real military activity includes 139 battle resolutions, 23 capture decisions, 22 embarkations and 19 disembarkations. Participant-specific event notices are not additional battles or captures.

| Timed component per round | Mean | Reported p95 |
|---|---:|---:|
| Six initial faction plans, including observations | 8.837 ms | 13.372 ms |
| Submitted commands, including battle/capture resolution | 2.669 ms | 4.413 ms |
| End-turn resolution | 0.468 ms | 0.650 ms |
| Sum of those timed components | 11.974 ms | 17.636 ms |

This sum excludes duplicate deterministic-planner checks, **capture-decision replanning**, history cloning, JSON comparisons, hashes, separately executed mirrors and full replay. It is not a timer around the entire diagnostic loop or browser watch cadence. Initial campaign rounds are included without warmup removal.

A turn-51 snapshot of 246,240 bytes resumes the final 50 rounds: 1,838 subsequent commands return identical results/events, with matching hashes after every round. A separate replay executes all 3,362 commands from the original snapshot and compares every result. Final save/load also matches: **`45417088`**, 307,221 bytes, 4.634 ms serialization and 9.488 ms load. The retained SHA-256 command/result seal is `8e7fdf17b75d6e9ccffc8db9a706028144ab054f48d226309e82afd613e2e4a7`.

## Mature-map paid-work cohorts

The existing `matureCampaign` fixture provides 1,500/4,000 singleton armies, 32/40 public founding commands and 100,000 authored coin per faction. This benchmark explicitly authors population 8 and food 1,000 per town, then crosses the strict schema-9 save boundary. Physical geography is untouched. Claims, worker assignments, improvements and cultivation thereafter use only public commands and current authoritative quotes.

Every town buys all 30 additional legal claims and assigns six workers. Initial improvement orders use suitable existing sites; cultivation later targets a distinct suitable worked site. Unsupported sites and already adapted land are not artificially changed to fill a quota. Huge has 32 improvement and 27 cultivation opportunities; Legendary has 36 and 33. Four Legendary towns lack an initial improvement site. Five/seven towns respectively lack a distinct legal cultivation target. Every issued paid work completes.

| Workload | Huge | Legendary |
|---|---:|---:|
| Cells / factions / authored cultures | 196,608 / 32 / 6 | 307,200 / 40 / 6 |
| Army containers / formations, initial and final | 1,500 / 1,500 | 4,000 / 4,000 |
| Towns / claimed tiles / worked tiles | 32 / 1,184 / 192 | 40 / 1,480 / 240 |
| Paid claims / improvements / cultivations | 960 / 32 / 27 | 1,200 / 36 / 33 |
| Coin paid for claims / improvements / cultivation | 22,508 / 1,108 / 1,593 | 28,280 / 1,262 / 1,943 |
| Completed works / final active works | 59 / 0 | 69 / 0 |
| Final population | 477 | 596 |
| Final state hash | `be55c6dc` | `0d144e22` |

Claims cost 20–28 coin, improvements 22–44; cultivation costs 55–67 on Huge and 51–67 on Legendary. The difference reflects actual distance, source affinity and completed-work surcharges, not an invented uniform cost. The cohorts collectively exercise all five improvements: Huge has 14 fields, two woodlots, seven quarries and nine fisheries; Legendary has 13 fields, four woodlots, nine quarries, two reedworks and eight fisheries. Huge alone does **not** measure an active reedworks.

Twenty real end turns run after setup. Work is active on six turns and absent on 14; after turn 8 no work remains. Normal upkeep, movement refresh, growth and settlement yields still execute on idle turns. No invasion AI runs in these mature cohorts.

| End-turn component | Huge mean / p95 | Legendary mean / p95 |
|---|---:|---:|
| All 20 full end turns | 1.504 / 1.873 ms | 3.137 / 3.901 ms |
| Six turns with active work | 1.609 / 1.873 ms | 3.520 / 3.901 ms |
| Fourteen turns without active work | 1.459 / 1.641 ms | 2.973 / 3.788 ms |
| Settlement phase, all 20 turns | 0.318 / 0.366 ms | 0.393 / 0.471 ms |

Settlement-phase time includes economy, growth and land work, not an isolated land-only kernel. All fixture preparation, paid orders, mirrors and validation comparisons are excluded. The small active/idle sample sets and GC/timing noise do not establish that idle work is inherently slower or faster. The script's reported p95 selects sorted index `floor(0.95 × sampleCount)`; for 20 samples this is the maximum.

The first active-work snapshot resumes 19 further turns plus all later cultivation commands: 46 commands on Huge, 52 on Legendary. Those exact suffixes are also replayed independently. Midpoint saves are 2,211,479 and 3,720,389 bytes. Every price is checked against the treasury debit and every completed improvement/override against canonical state. All yield components are summed with their signs before the final zero clamp.

Examples from the retained outputs: Huge's waterlogged Reedbound rainforest woodlot at hex 115031 produces four food/two industry, including the -1 waterlogging industry penalty. Legendary's Reedbound woodlot at hex 41808 combines old growth and Ashfall glass: zero food, three industry and three knowledge after all bonuses and penalties. These are real worked-site outputs, not UI-only demonstrations.

## Read models, saves and observation scale

Four warmups precede each set of 20 identical-state samples. Serialization/load use complete canonical snapshots, not campaign archives or IndexedDB. Load timings include validation. Hash comparisons, output JSON encoding and detached-load comparisons are outside the timers. The active samples are taken after initial paid work orders, before their first end turn.

| One-town read state | Land mean / p95 | Full observation mean / p95 | Land / full observation bytes |
|---|---:|---:|---:|
| Huge idle | 0.232 / 0.266 ms | 1.545 / 2.052 ms | 123,765 / 331,315 |
| Huge active | 0.194 / 0.251 ms | 1.403 / 1.706 ms | 121,240 / 328,991 |
| Legendary idle | 0.232 / 0.270 ms | 3.102 / 4.141 ms | 123,495 / 551,163 |
| Legendary active | 0.208 / 0.315 ms | 3.073 / 3.912 ms | 121,306 / 549,177 |

Each queried seat owns one town with 37 candidate cells, against the complete 32/40-town registry. These are not all-town query timings. Other observed entities and ordinary production/character/naval options remain in the full observation.

| Snapshot | Bytes | Serialize mean / p95 | Load mean / p95 |
|---|---:|---:|---:|
| Huge idle | 2,207,014 | 44.616 / 47.831 ms | 115.501 / 127.745 ms |
| Huge active | 2,212,758 | 46.120 / 58.882 ms | 117.213 / 128.435 ms |
| Legendary idle | 3,715,798 | 71.637 / 79.789 ms | 182.518 / 194.847 ms |
| Legendary active | 3,722,106 | 71.581 / 83.433 ms | 180.274 / 190.221 ms |

A **separate authored concentration** assigns all existing towns to the first faction, clears former capitals, relocates foreign garrisons onto legal adjacent hexes, rebuilds sight/memory and strictly reloads. It does not claim earned conquest or execute any turns. All armies and formations remain present. This isolates a 32/40-own-town observation workload.

| Concentrated read | Huge, 32 own towns | Legendary, 40 own towns |
|---|---:|---:|
| Visible candidate / worked cells | 1,184 / 192 | 1,480 / 240 |
| Land observation mean / p95 | 6.291 / 14.934 ms | 7.363 / 8.054 ms |
| Full observation mean / p95 | 33.130 / 42.071 ms | 86.524 / 100.599 ms |
| Land observation bytes | 3,933,631 | 4,930,516 |
| Full observation bytes | 5,615,340 | 8,962,356 |
| Read-only state hash | `4757c208` | `ecf8cfbc` |

These payloads identify concrete scale debt: detailed options repeat substantial text per candidate tile, and full observations additionally include the numerous visible garrisons and their other read models. The 86.5 ms Legendary full query must not be attributed entirely to its 7.4 ms land selector. Lazy detail queries/compact option encoding and representative worker-transfer measurements remain needed. These byte counts are diagnostic JSON sizes, not measured per-frame browser traffic. The Huge land query's 14.934 ms maximum is retained in its reported p95; its median is 5.827 ms, and the small sample does not establish a sustained latency regression.

## Integrity and limits

Both mature worlds retain exact SHA-256 geography seals across all commands: terrain, fertility, depth, base biome, starts, dimensions, seed and generator version. Cultivation changes only the canonical sparse overlay. All repeated selectors preserve state hashes.

One foreign last-seen hex is explicitly authored before the strict fixture load; it is not a full-map reveal. Huge hex 48959 changes forest→grassland for its owner while the unseen rival continues to remember forest. Legendary hex 136633 changes chalkland→marsh while its unseen observer still sees chalkland. Both low-level land reads and the full faction observation retain the old biome without rewriting memory. These claims concern actual fogged cells in the unchanged sight index.

Compact land-state JSON grows to 148,873/187,254 bytes on Huge/Legendary. Process heap samples before claims/after claims/final are approximately 99/79/104 MiB and 246/109/185 MiB; RSS is 404/397/327 MiB and 494/400/427 MiB. Samples include validation allocations, earlier cohorts and mirrors, without forced GC. They are not land-only object sizes, peak memory, retained-memory guarantees or a leak proof.

This report does not measure rendering, asset residency, multiplayer, archive storage, a thousand-turn giant campaign, thousands of settlements, or wartime land capture at mature giant scale. The generated Tiny run supplies real combat and land behavior; the mature cases supply bounded stationary paid-work/load stress. Do not compare their 20-turn end-phase means with earlier full AI-round means as an optimization claim. The separate [integrated 100-turn scale results](0016-territory-scale.json) cover the wider giant-map AI workload; [the prior military report](0014-integrated-military-campaigns.md) remains historical schema-8 evidence.
