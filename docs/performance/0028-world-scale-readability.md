# World-scale readability and generator 6 — slice 20

Development checkpoint based on `b17900d`, schema/rules 12, generator 6, roster 3, content `3c54fb02`. This extends the [geography/roads slice](0026-geography-roads-watch.md); it is not a release signoff. Geography, camera, representative groups and dense-stack correction are implemented and measured. Remaining AI acceptance and archive-timing gates are recorded below.

## Geography and compatibility

Generator6 adds independent offshore groups to all layouts, asymmetric mainland/island lobes, deeper bays and peninsulas, irregular enclosed seas, more qualifying upland lake basins and gently graded mountain saddles. Land shapes are kept away from the rectangular boundary on normal-sized worlds. Existing hydrology records real connected catchment flow and single lake outlets, not disconnected decorative river marks.

Biomes respond to continuous relief, prevailing ocean-fed moisture, leeward drying and a two-cell freshwater gradient. The twelve existing biome identities and physical artwork constraints remain; no new raster assets or canonical climate arrays are added. Temperature/moisture are relative indices, not a physical weather simulation. Diagnostic fields are detached and never handed wholesale to a fog-limited player or AI.

The generator-only suite passes 93 tests, including 360 seeded/density property cases and three additional directional-metric checks; a separate 384-case Tiny/48-seat sweep also passed. Source review and all nine Small overview panels were inspected. Sixteen pre-geography seals, all twelve retained generator5 benchmark worlds and six newly captured schema12/generator5 origin/developed histories remain exact. The latter preserve complete ordinary-command replays and appended continuation, not merely final snapshots. Old maps are not regenerated. The generator version changes independently because schema12's canonical shape remains valid.

### Isolated generation measurements

`node --import tsx scripts/benchmark-world-geography.ts --v6 --output` retains [all raw samples and paired geography](../../packages/mapgen/diagnostics/v6-geography-climate.json). Node26.7.0, Intel i9-13900K, one reserved benchmark window. A warm reference precedes five complete generation samples per size/layout, including allocation/GC and strict hydrology validation; diagnostic descriptions, hashes and repeated equality checks are outside timing. All60 measured outputs reproduce exactly.

| Size | Continents mean | Islands mean | Archipelago mean |
| --- | ---: | ---: | ---: |
| Tiny | 4.551 ms | 4.532 ms | 3.742 ms |
| Small | 90.767 ms | 73.156 ms | 79.124 ms |
| Huge | 351.609 ms | 338.600 ms | 352.382 ms |
| Legendary | 534.465 ms | 532.158 ms | 543.956 ms |

Generator6 costs more than the simpler [generator5 checkpoint](../../packages/mapgen/diagnostics/v5-geography-final.json); these are separate reserved runs, not interleaved same-workload timings. The expanded shape and climate work is bounded to a fixed number of passes/plates. The five canonical byte arrays still use983,040 bytes on Huge and1,536,000 on Legendary. Final process RSS233,529,344 bytes includes temporary generation/diagnostic work and is not peak or retained-memory evidence.

The measured seed20260905 worlds illustrate actual scale and diversity, not guarantees for every seed:

| World | Layout | Physical land bodies | Fresh lake bodies | Enclosed seas | Longest connected major trunk |
| --- | --- | ---: | ---: | ---: | ---: |
| Small | Continents | 15 | 8 | 3 | 20 cells |
| Small | Islands | 20 | 15 | 2 | 15 cells |
| Small | Archipelago | 23 | 22 | 1 | 9 cells |
| Huge | Continents | 19 | 12 | 4 | 75 cells |
| Huge | Islands | 25 | 22 | 2 | 42 cells |
| Huge | Archipelago | 22 | 26 | 1 | 27 cells |
| Legendary | Continents | 20 | 17 | 4 | 93 cells |
| Legendary | Islands | 28 | 24 | 2 | 53 cells |
| Legendary | Archipelago | 24 | 28 | 1 | 32 cells |

Land-body totals include small islets, not that many major continents. Normal-sized sampled maps retain 82–91% matching biome identities across east–west, same-row land pairs. This is not an all-six-neighbor cohesion metric; a follow-up metadata clarification and three directional/exclusion tests document the exact retained calculation without rewriting prior measurements. Tiny is a compressed test geography: no major-river trunks or sea-sized enclosed bodies occur in this measured seed, and its climate is less spatially coherent. Not every metric increases: new basins can split drainage and shorten some trunks. Pass diagnostics require a passable opening with nearby opposing mountain barriers and a separate open axis; they do not prove that every saddle is a globally decisive route.

Inspected overview strips show Continents / Islands / Archipelago from left to right: [seed42](../../packages/mapgen/diagnostics/v6-overview-42.png), [seed74](../../packages/mapgen/diagnostics/v6-overview-74.png), [seed20260905](../../packages/mapgen/diagnostics/v6-overview-20260905.png). These code-native diagrams are geography evidence, not published pixel-art approvals.

## Camera and army presentation

Wheel/minus now reaches a true viewport-derived world fit. A bounded cartographic raster takes over before detailed visible chunks can grow excessively; zooming back is continuous and Focus selection restores local control. Overview clicks inspect, not issue coarse movement commands. Unknown cells remain unknown. Near groups use existing approved artwork at unchanged native scale: one figure for one formation, two for two–five, three for six-plus. Far faction badges stay aggregated. A co-located selected army draws last, and cargo is filtered before grouping. Spectator maps expose only the count needed for these groups, never private rosters.

The [pre-change Huge baseline](0028-geography-before.json) preserves selected exact measurements and explicitly labels the absent full raw console record. It uses a genuine paused Huge/32/archipelago campaign, not a synthetic fully revealed army stress fixture. The rolling frame p95 was 16.8 ms, with one 3,148,800-byte overview texture and at most 20 cached chunks/80 MiB estimated backing during its six sampled phases, separate from the 16 MiB map atlas. Each phase waits 75 frames; the percentile spans the renderer's rolling 240-frame window and is not an independent per-phase percentile. Reveal/restore acknowledgement timing excludes completed GPU presentation.

The final [complete after report](0028-geography-after.json) passes the same generated-world workflow with current generator 6 and seal `56f03d11`: 61 normal cells, 1,024–4,096 local detail cells, and all 196,608 cells in one 3,148,800-byte overview texture. Six rolling frame p95 samples remain 16.7–16.8 ms, with at most 22 cached chunks/88 MiB estimated backing and up to 232 drawn river segments. Restore returns to 61 permitted cells/two chunks/1 MiB backing; the safe overview texture remains cached. Actual packed traffic is 589 bytes for the local river-free v1 view and 2,162,732 bytes for the revealed v2 world. Reveal/restore acknowledgements are 250.9/52.0 ms. Browser worker generation is 730.8 ms, art loading 162.2 ms and first-render CPU 27.3 ms; these are individual cold-path samples, not warm distributions. The changed physical geography and selected river mean cache/route counts are not a pure optimization comparison. Inspected screenshots: [whole Huge archipelago](../screenshots/slice20-huge-archipelago-final.png), [connected river mouth](../screenshots/slice20-rivers-final.png).

The first targeted Chromium run passed 8/9 scenarios in 24.8 seconds: every world/road/fog scenario and the real 1/3/12-formation split/save/narrow flow passed. The fleet test's unanchored selector matched both the ship and a passenger's carrier label; exact army-name selection fixes it, and it passes in both subsequent complete runs. Main-agent screenshot review confirms visibly different representative groups and fitted narrow whole-world maps. Repetitive terrain stamps, fractional pixel scaling, directional animation and remaining UI-painting defects are not declared solved.

### Measured dense-stack correction

The deliberately crowded fixture preserves the exact canonical seal `436e19c5`, 1,500 actual armies, 18,000 guard formations, 91 occupied cells and all camera phases before and after. [Before](0030-army-stacks-before.json), [after](0030-army-stacks-after.json). Every army was authored into the player's nearby fully explored Huge neighborhood before strict save/import; none are injected or deleted at runtime. This is not the older fog-limited global-singleton workload.

The initial implementation redundantly drew 4,500 identical overlapping figures, yielding 116.8 ms near rolling frame p95 and 83.4 ms after restored focus. The correction groups only co-located observed forces of the same realm/domain: selected army first, otherwise largest with stable-ID ties, still showing its own one/two/three-figure size. A near-only ×N badge and contextual selected name explain the separate-army count. Original observations and input indexes retain every army; real canvas clicks cycle the saved five/seven-formation split with unchanged hash. Fleets remain separate and cargo is never duplicated.

The same stress view now draws **273 figures plus one town and 91 count badges**; diagnostics still total all 1,500 armies/18,000 formations. Initial near rolling p95 is 33.3 ms (including prior startup frames), and the sampled frame is 16.6 ms. Restored-focus rolling p95 is 16.8 ms, with a 16.6 ms sampled frame. Far aggregation remains 91 army badges plus the town; overview remains one sprite. Do not describe initial near p95 as 60 fps or interpret the carry-over far percentile as an independent distribution. Figure/terrain pool maximum falls from 8,597 to 4,370; count text has a separately tracked 91-object pool. Cache maximum stays 16 chunks/64 MiB, map atlas 16 MiB, and overview 3,148,800 bytes. Actual transfer remains exactly 10,299,100 bytes, including 1,769,695 packed cell bytes: this is a renderer optimization, not a roster-payload reduction or total-GPU-memory measurement.

Main-agent-inspected screenshots retain [before overdraw](../screenshots/slice20-army-stress-before.png), [after aggregation](../screenshots/slice20-army-stress-after.png), and [selected split stack at 390 pixels](../screenshots/slice20-army-groups-final-narrow.png). All 24 focused renderer tests and whole typecheck pass after the correction. No approved art, content, canonical rules or saved state changed.

## Integration checkpoint

The first generator6 broad run passed 1,087/1,091 tests across 119 files. The pre-density checkpoint passed 1,102/1,105 tests; final frozen-source broad verification passes **1,106/1,109 tests across 123 files** in 69.05 seconds, including the additional stack invariants. Full typecheck/lint, 260 candidate-asset validations and current content validation pass. Enclosed-sea expansion is fixed through real ferry/land/founding commands. The old generator-5 Standard seed-99 pacing floor remains a separate passing 200–400-turn case; new generator-6 seed 99 uses the same 150–400 range as Standard seed 74, with the existing eight-town/battle/capture earned-conquest guard required before 200. No prices, artificial waiting or old acceptance bounds were changed to conceal the intentional new geography.

Three final broad gates remain open: Standard/24 and Huge/32 entity contact reach 22/24 and 30/32 factions by turn 60, and Epic's complete archive test takes 64.961 seconds against its unchanged 60-second runtime limit under parallel load (66.024 seconds at the preceding checkpoint). The isolated Short/Epic file passes both tests in 57.47 seconds total (56.81 seconds combined test time); this proves the long campaign, turn-500 continuation and complete replays, but does not close the parallel timing gate. Standard/4 now reaches all four factions within its original 100-turn limit. Saltwind and Rimehorn seats account for the remaining dense-map misses; they build actual ports/fleets and expand, but discovery is still too slow. Discarded shoreline-gradient and scout-merge experiments regressed the sparse case and are not shipped.

The first complete generator-6 Chromium run passed 92/93 scenarios in 6.1 minutes. The geography performance scenario incorrectly required eleven bytes per initial cell when this seed's river-free local view legally uses compact v1, nine bytes per cell. The corrected test retains the valid v1 lower bound and still requires the river-bearing revealed world to use the wider format. Its stress case also exposed genuine near-view overdraw, subsequently corrected and measured above.

The final runtime's complete Chromium run passes 92/93 scenarios in 5.9 minutes, including both performance workloads, saved stack cycling, fleets, all geography layouts, roads, real AI-watch contact and victory chronicles. The sole failure was the older Art Lab scenario demanding both co-located starter sprites simultaneously. It now selects each actual army through the registry, verifies that army's approved asset and full stack counts, and checks the hash remains unchanged; all four Art Lab scenarios pass in the focused 11.6-second rerun. No runtime source changed after the complete run. Every one of the 93 final gameplay scenarios therefore has passing evidence across the complete run and that explicit correction/rerun; this is not claimed as a single 93/93 invocation.

Final production build, full typecheck and full lint pass. The actual built preview on port 4174 passes its watch-only fog API/no-development-hook smoke test (1/1, 1.8 seconds). All ten emitted JavaScript chunks exclude Art Lab and `__THEANDRIL__`; the public `window.theandril` watch controls remain available. Main bundle is 813.28 kB / 248.72 kB gzip, worker 562.92 kB, and CSS 67.70 kB / 13.20 kB gzip. Existing upstream Zod annotation and large-chunk warnings remain non-fatal. Chromium coverage is not Firefox/WebKit release signoff. Test servers did not replace or stop the user's port-5173 server.

## Genuine overseas campaigns

[Three final raw voyage reports](0029-overseas-ai.json) retain untouched generator-6 starts, ordinary four-faction Epic planning, paid research/harbors/hulls/passengers and colonies on physically separate landmasses. Tiny and Small Islands (seed 20260905) establish deep-water colonies on turns 38 and 41; Tiny Archipelago (seed 74) establishes a separate-island colony on turn 33 with a shallow route permitted. All 1,893 orders are accepted and completely replayed from the original generated saves, with exact transported-journey mirrors and final save bytes. Seals are `e09abb30`, `fb2bc6df` and `50837eea`.

The reserved sequential runs report per-faction observation-plus-plan p95 of 2.80/3.39/1.70 ms and complete four-faction round p95 of 20.13/21.26/12.42 ms. Round timing includes actual commands, result recording and the saved mirror, but excludes final replay. These are successive samples within three bounded voyages, not repeated campaign distributions, large-map discovery proof or thousand-turn giant-empire measurements.

## Hundred-turn giant campaigns and movement

`node --import tsx scripts/benchmark.ts --output` retains [the complete final scale report](0029-campaign-scale.json), including workload identity and actual command counts. Four sequential 100-round workloads all have zero rejected orders, exact final save/load seals and 50-round midpoint continuations. The young campaigns use real generator-6 Continents; the mature setups deliberately retain authored generator-4 terrain and begin with 1,500/4,000 singleton armies. They are not matched before/after campaigns, and faction seats reuse the twelve authored cultures. Victory-project proposals are deferred only in these fixed-length scale workloads; the separate actual-victory runs do not defer them.

| Workload | Accepted non-End-turn orders | Final armies / formations / towns | Mean complete round* | Final seal |
| --- | ---: | ---: | ---: | --- |
| Huge, generated | 24,544 | 506 / 863 / 231 | 160.981 ms | `c96d701c` |
| Huge, synthetic mature | 32,874 | 723 / 1,576 / 189 | 120.403 ms | `a31be1d1` |
| Legendary, generated | 32,323 | 651 / 987 / 265 | 208.395 ms | `3c4c9ab3` |
| Legendary, synthetic mature | 61,873 | 1,784 / 4,098 / 220 | 217.116 ms | `f8c2b07e` |

*Includes production-scoped AI observations/planning, actual command resolution and End turn; excludes separate mirror/save/hash/archive/browser work. Canonical End-turn means are 5.84–9.27 ms. Final save/load samples range 64.0–107.3 / 204.8–332.1 ms; heap samples are not peak or retained-memory proofs. Array, economy and activity differences preclude a pure optimization comparison with older slices.

Both giant synthetic fully explored movement workloads complete all 512 ordinary queued journeys and 20 mirrored turns. Warm route p95 is 0.085/0.088 ms; cold observation-indexed queries cost 52.75/44.18 ms. Far queries stop at the unchanged 4,096-node limit. Huge uses five active travel phases at 77.73 ms median; Legendary uses sixteen at 46.00 ms median because its eighteen-edge route costs 35 movement rather than 18. Subsequent idle turns remain separately reported. These runs contain no hostile AI or archive work. Two hundred 12-versus-12 kernel battles have 0.385 ms median / 0.471 ms p95; fifty actual siege/occupation/paid-peace sequences retain exact saved continuation.

## Actual long-form victory and complete logs

The final reserved `node --import tsx scripts/benchmark-chronicle.ts --seed=20260905 --size=tiny --pace=epic --factions=4 --limit=1400` uses current schema 12/generator 6/content `3c54fb02`, without authored grants or deferred victory. [Exact emitted report](0031-epic-geography.json). Reedbound Council wins Prosperity on turn **1061**, holding 15 towns, after 24,782 accepted orders, 66,428 recorded events and 871 actual archived battles. The final seal `61b6aee7` survives envelope restoration, compressed import and complete replay. The 578 conquest notifications are participant-level notifications, not 578 unique conquests.

Recorded play takes 26.82 seconds, averaging 25.30 ms per four-faction round with archival work. Final envelope save/load is 138.97/334.99 ms for 21,115,295 bytes; compressed export/import is 548.51/503.32 ms for 1,803,062 bytes. Both documents take 561.81 ms to generate (technical 34,208,690 bytes; history 1,784,910 bytes, 1,063 chapters). Full replay takes 10.61 seconds. The final 496 MiB heap sample is not peak or retained-memory evidence. This benchmark restores at the final state; the separate unchanged integration test supplies the turn-500 mirror and second complete replay. A successful thousand-turn Tiny campaign does not prove the corresponding giant-map archive or strategic-variety release gates.

Rivers currently supply freshwater identity/yields and presentation, not navigable river ships, bridges or ford costs. Roads and passes use existing authoritative movement costs. More realistic geography is not yet a complete trade, resource, supply or geopolitical AI system.
