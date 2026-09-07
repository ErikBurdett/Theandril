# Civic borders and researched tile construction — slice 17

Measured 2026-09-06 against the actual working tree following `404bc9d`. Current rules/save schema 11, content `3c54fb02`, roster 3, generator 4. Node v26.7.0, Linux 7.1.9-arch1-2, i9-13900K (32 logical CPUs), 33,317,580,800 installed RAM bytes. Twelve playable cultures; twenty-four base-lore entries do not constitute twenty-four playable/art-complete cultures.

## Workload and pre-change evidence

The [runner](../../scripts/benchmark-city-research.ts) uses generated Tiny/Epic seed 20260906, twelve seats and 100 actual all-faction AI rounds. No resources or completed buildings are granted and no victory command is deferred. Every proposal, battle/capture decision and End turn passes through the simulation. It mirrors every order after the turn-51 save and replays all command results from the initial snapshot. Current planning samples include the production AI's scoped observation plus planner; End-turn samples exclude archival checkpoints, persistence and rendering. Read distributions use four warmups and twenty repetitions of an unchanged final state. Reproduce with `node --import tsx scripts/benchmark-city-research.ts`; the script prints its complete JSON report.

The [genuine pre-change run](0024-city-research-before.json) used schema 10/content `4c2fed32`: turn 101, 5,686 accepted commands, zero refusals, 2,996 mirrored suffix commands, 48 towns, 355 claimed cells, 274 worked cells and 94 retained improvements. Final seal `c4c5c0c8`; save 636,877 bytes. End-turn median/p95 0.783/1.072 ms; observation-plus-plan median/p95 1.036/2.851 ms. Summary/full/single-town read medians 0.634/1.037/0.087 ms. That baseline checked exact command results and final hashes; the current runner additionally compares whole final save strings for restore/replay. Changed growth/research/AI economics can change the command mix and campaign outcome, so a cross-rules comparison is not a pure optimization benchmark.

## Schema-11 generated 100-round checkpoint

The [retained after-run](0024-city-research-after.json) reaches turn 101 with **6,102 accepted commands and zero refusals**, including 49 foundings, 35 paid claims, 84 improvement orders, seven cultivation orders and 109 research orders. Battle decisions include 259 field attacks and 52 assaults, followed by 311 autoresolutions and 41 capture choices. These are submitted command counts, not all completed construction or unique participant notifications. Final state: 49 towns, 655 claimed and 287 worked cells, with 81 retained improvements. Of the five newly researched improvements, this generated run retains five polders and one spring garden; it does not establish naturally generated completion of all five new types.

Every one of the 3,178 post-midpoint commands matches the saved mirror. All 6,102 commands/results replay from the initial snapshot, and restored/replayed final save strings match the **956,318-byte** canonical save exactly, seal **`8d7bd333`**. No victory occurs within these 100 rounds.

| Measured interval | Samples | Median | p95 | Maximum |
|---|---:|---:|---:|---:|
| One faction's scoped observation + plan | 1,200 | 1.096 ms | 2.749 ms | 4.712 ms |
| End-turn command/phases | 100 | 1.242 ms | 1.852 ms | 3.586 ms |
| Final player summary observation | 20 | 0.479 ms | 0.652 ms | 0.652 ms |
| Final player full observation | 20 | 0.606 ms | 0.799 ms | 0.799 ms |
| Final player AI-scoped observation | 20 | 0.594 ms | 3.018 ms | 3.018 ms |
| Selected-town query | 20 | 0.130 ms | 0.205 ms | 0.205 ms |

Planning intervals exclude the separately executed saved mirror, command replay, disk persistence, archive recording and rendering. They are **per faction**, not an all-faction round total, and do not include separate capture-decision plans. With twenty read samples the p95 index selects the maximum. The final player owns only one town: both its full and scoped observations contain the same 37 detailed cells and produce the same plan. This final-player sample alone cannot demonstrate the benefit of an eight-town window on a large empire.

## Bounded read work and strict save work

Detailed land quotes now derive owner context once per read, town context once per town and physical features once per candidate cell. A 37-cell town still offers all 370 improvement quotes; tests assert exactly 37 feature derivations and one faction lookup. There is no persistent cache to invalidate or global world scan. Five independently captured pre-optimization query byte/SHA seals cover current/historical rules, fog, insufficient funds and active work. A separate transport cleanup moves the shared replacement/worker caveat to one selected-tile paragraph; tests restore only this known suffix when comparing the original current-rule byte seals. Historical-rule text stays unchanged. Current selected-town data remains below its original 200,000-byte browser limit.

The simulation's optional detail selector also supports a generic bounded circular town window. It keeps every owned summary in the original lexicographic order, supplies detailed quotes only for selected towns and never changes the default full observation. Both AI land planners and the worker's AI read request now share the existing eight-town rotation policy; the planner still receives only observations, not canonical state. This eliminates construction quotes the AI never used, without reducing its planning budget. The Epic and scale runners use the same production option. Window tests cover empty/small/wrapping registries, invalid and maximum-safe inputs, exact full/subset equivalence, fog and detached data; separate AI tests compare whole commands/reasons and saved continuation.

Canonical land serialization no longer sorts/stringifies/parses the entire land graph before strict validation. It still rejects unknown fields, invalid prototypes, non-finite numbers and executable serialization hooks, retains Zod's detached validated data, and sorts only the dynamic ID dictionaries that need canonical ordering. Captured current seals, property-based equivalence and all historical archive fixtures protect exact serialization behavior.

Envelope assembly now stringifies each validated payload once, calculates its existing payload checksum, and inserts those exact bytes after the normally escaped, fixed-order JSON header. The state checksum and whole-envelope seal remain distinct and both are still calculated. Twenty-four tests compare pre-edit captured whole outputs for schemas 4–11, including quotes, controls, Unicode and lone surrogates; verify exact load/save and both checksums; count one payload traversal; and retain strict malformed-state rejection. These small capture campaigns are explicitly synthetic serializer fixtures, not historical user files. Earlier focused save/replay verification passed all 168 tests; it does not supersede the broader integration timing result below.

A proposed 1,024-entry call-local cache for duplicate land-memory validation was tested and **rejected**, not shipped. Although its exact projection hashes matched, the structural safety checks and wrapper overhead made all measured cases slower: duplicate tuples about 17%, unique tuples about 60%, and cache overflow about 15% versus the initial baseline. A restored-baseline repeat confirmed the direction. [Full synthetic projection measurements and limitations](0024-known-cache-rejected.json). Strict original land parsing remains in production.

Navigation reuses only within-plan topology and entry-cost/domain facts, with separate caches capped at the existing 8,192-node faction budget. It still charges every expansion, including cache hits, and retains the 1,024-node per-army budget. It never caches destination/reservation decisions. Seventeen comparisons against a frozen pre-edit algorithm verify exact destinations, strategic callback order, counters, fog, ocean/cargo rules, cache saturation and exhausted searches. This is reduced repeated computation, not less scouting work or a new routing algorithm.

Explored-cell serialization keeps its single copied JavaScript array and skips sorting only when an adjacent-number scan proves it is already ordered. Every other case uses the original numeric sort, including malformed values/coercion errors; no typed conversion or precision change is involved. [Whole-copy microbenchmarks](0024-explored-sort.json) show roughly 65–70% lower cost for ordered sets at 512/4,096/200,000 entries, with effectively unchanged shuffled/nearly sorted cases. This is not a whole-campaign speedup percentage. The first typed-array alternative was rejected because it made ordered/restored inputs substantially slower. Current/legacy full-save byte fixtures, huge/legendary origin seals and malformed-input comparisons remain exact.

## Same-state large-empire detail windows

`node --import tsx scripts/benchmark-ai-land-window.ts` measures the [synthetic empire fixture](../../packages/test-fixtures/src/empire-land-fixture.ts), not a mature empire earned through gameplay. Ownership, population and army distribution are authored; additional claims and worker assignments use ordinary commands before measurement. The [raw report](0024-ai-land-window.json) alternates full/scoped read order, performs four warmups and twenty samples per mode, and excludes fixture creation, plan execution, elapsed turns, archives, persistence and rendering. Complete AI commands/reasons and unchanged save bytes are checked outside the timed reads. These are warm same-state measurements, not a cold or whole-process performance claim.

| World / cells / global armies | Owned towns: full → scoped detail | Detailed cells: full → scoped | Full read median / p95 | Scoped read median / p95 | Full → scoped diagnostic JSON bytes |
|---|---:|---:|---:|---:|---:|
| Huge / 196,608 / 1,500 | 32 → 8 | 1,184 → 296 | 26.775 / 31.883 ms | 24.029 / 27.689 ms | 7,314,658 → 3,131,873 |
| Legendary / 307,200 / 4,000 | 40 → 8 | 1,480 → 296 | 73.019 / 79.952 ms | 70.038 / 78.894 ms | 11,079,186 → 5,501,733 |

All 32/40 owned town summaries remain present; only unused quote detail is omitted. Huge produces 58 identical proposed commands/reasons and retains seal `5347045a`; Legendary produces 89 and retains `953a4ff2`. The large remaining read cost is real: the full observation still contains the other army, diplomacy, production and entity information. JSON byte counts are diagnostic object sizes, **not packed worker traffic**. Neither fixture advances a campaign turn or proves a thousand-turn giant game.

## Long-campaign investigation

The first [schema-11 Epic run](0024-epic-before-optimization.json) reaches actual Prosperity victory on turn 1,244: 27,843 orders, 73,630 events, 1,331 archived completed battles, zero refusals and replay seal `c62e5459`. Its independent turn-500 mirror/two-replay integration exceeded the unchanged 60-second limit. Neither the 800–1,400 turn gate nor replay assertions were relaxed.

Intermediate broad verification after one-pass envelopes passed 899/900 tests, with only this integration timing out at 67.838 seconds. Adding the production AI detail window reduced its targeted runtime to 62.652 seconds but did not yet pass the gate; that targeted run briefly overlapped a finishing typecheck at startup and is not reported as an isolated benchmark. Subsequent optimization must preserve the recorded campaign and original assertions, not merely raise this limit.

A subsequent [CPU profile of the same seed/size/pace/seats/counts/seal](0024-epic-profile.json) identified canonical save/hash work as the main replay cost, not history prose generation. About 10.32 of 14.01 sampled replay seconds were inside state hashing; serialization re-traversed the payload after checksumming it. The profile overlapped browser verification and is diagnostic sampling, not an isolated final benchmark or a speedup claim.

### Retained post-optimization Epic run; integration budget still open

`node --import tsx scripts/benchmark-chronicle.ts --seed=20260905 --size=tiny --pace=epic --factions=4 --limit=1400` produces the [after report](0024-epic-after.json): actual victory on **turn 1,244 after 1,243 rounds**, won by Cinder March with 20 towns. All 27,843 orders, 73,630 events, 1,331 archived battles, zero refusals and final seal **`c62e5459`** match the pre-optimization outcome. Envelope, gzip, technical/history byte counts and the 1,246 chapter count also match that earlier report exactly. This supports a pure-performance change rather than altered gameplay, pricing, exploration budgets or archive output.

Recorded play takes **25,729.968 ms**, mean **20.700 ms per round with recording**. Instrumented observation, AI planning and command/recording intervals total 7,171.710 / 6,653.267 / 11,559.248 ms respectively; they exclude some loop work such as separate capture-decision reads/plans and are not an exact partition. Generation precedes the campaign timer; periodic storage, compression, final logs and browser rendering are excluded.

| Final operation | Time | Payload / verification |
|---|---:|---|
| Serialize / deserialize campaign envelope | 146.033 / 310.906 ms | 25,076,089 bytes; exact restored state seal |
| Compressed export / import | 596.145 / 555.167 ms | 2,193,968 bytes; restored seal matches |
| Generate technical log and factual history | 638.714 ms | 41,283,686 / 2,138,688 bytes |
| Complete archive replay | 12,113.899 ms | Final seal `c62e5459` |

This run briefly overlapped five asset-processing operations for approximately one second. It is **not a reserved isolated whole-run comparison**, and no whole-campaign speedup percentage is claimed. The 559 MiB final heap includes archive/document/restoration/replay allocations; no forced-GC, peak or retained-memory proof is implied. The benchmark restores its final envelope and replays once: **it does not perform a turn-500 saved mirror or the integration test's second technical replay**.

The unchanged [Epic integration test](../../tests/headless/chronicle-victory.test.ts) remains over its **60-second** gate. The latest broad run passed **941/942 tests**, with Epic at **66.387 seconds**; a serial-suite repeat still took **61.556 seconds** for Epic (179.140 seconds for the whole serial suite). No assertion, campaign-length requirement or timeout was relaxed. A successful standalone archive benchmark does not close this more demanding saved-mirror/two-replay gate.

## Player and visual evidence

New browser scenarios use real research, paid construction, work turns, worker assignments and saved continuation. The border scenario imports explicitly authored initial funding/population, then advances actual civic progress across a saved turn and verifies the newly claimed tile has neither an automatic worker nor an improvement. The gallery separately builds all five new sites through ordinary commands; it is an authored coverage fixture, not a naturally generated AI city or production-art approval.

Retained, inspected screenshots: [actual expansion](../screenshots/slice17-city-expansion.png), [390-pixel civic progress](../screenshots/slice17-city-growth-narrow.png), [five distinct map identifiers](../screenshots/slice17-five-researched-sites.png), [research branches](../screenshots/slice17-research-tree.png), [narrow research](../screenshots/slice17-research-narrow.png), [commander roadmap](../screenshots/slice17-commander-roadmap.png), and [engineer branches](../screenshots/slice17-engineer-tree.png).

The five new improvement identifiers are explicit procedural fallbacks; approved atlas pixels and its 16 MiB map-page allocation are unchanged. The initial fallback-warning callback was corrected so an asynchronously loaded existing pack cannot erase a still-visible missing-prop warning. Original approved props have independent coverage. The prior [narrow campaign-menu painting defect](0023-menu-paint.md) remains open.

Slice 17's civic growth, research branches and five distinct procedural identifiers are implemented, with the retained correctness and timing evidence above. Verification is not an all-green release: the last 77-scenario browser attempt passed 76 and had one hot-reload-interrupted failure, requiring a clean full rerun during slice 18. Final slice-18 renderer/art publication and browser measurements are separate work, not retroactive evidence here. The Epic integration timing gate and narrow-menu visual issue remain open; no 1.0 release gate is declared complete.
