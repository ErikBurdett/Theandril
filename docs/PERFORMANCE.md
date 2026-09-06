# Performance measurements

**Latest:** [slices 13–14 — integrated large-empire UI and browser evidence](performance/0019-large-empire-ui.md), [next-action navigation](performance/0019-next-action.md), [slice 13 — scoped town details and unchanged Epic replay](performance/0018-read-models.md), with [matched packed-cell measurements](performance/0017-cell-transfer.md). Historical comparisons: [slice 12 — territory campaigns, six-culture art, Epic archives and corrected rendering](performance/0016-territory-integration.md), [dedicated paid-land and many-town observations](performance/0015-territory.md), [slice 11 — military campaigns and rendering](performance/0014-integrated-military-campaigns.md), [general-led armies and loaded voyages](performance/0012-armies-fleets.md), [pacing investigation](performance/0013-pacing-diagnostics.md), [slice 10 — four-culture art](performance/0010-faction-art.md), [slice 9 — incremental local storage](performance/0009-incremental-storage.md), and [slice 8 — named officers and missions](performance/0008-characters-and-missions.md). [Slice 7](performance/0007-contact-and-armies.md) retains the contact/composed-army comparison, [slice 6](performance/0006-art-factory.md) the reviewed-art baseline, and [slice 5](performance/0005-travel-biomes.md) the earlier movement/biome measurements. The tables below remain the older pre-travel/schema-4 comparison, not current totals.

Measured 2026-09-05 on the integrated progression/pacing/chronicle working tree (starting commit `59c6dbe`). Linux 7.1.9-arch1-2, Intel i9-13900K, Node v26.7.0, save schema 4, content `3139d4e7`. Reproduce with `pnpm bench` and `pnpm bench:chronicles`. These development-machine results are not mainstream-device release claims.

## Current campaign measurements

Each fixture runs real AI, command validation, movement/visibility, economy, recruitment and recovery for 100 turns. Every fixture restores a midpoint save and verifies another 50 turns against uninterrupted execution, then checks the final save/load hash. There were zero rejected AI proposals. These fixed-length scale workloads explicitly defer `startVictoryProject` proposals so terminal victory does not truncate the measurement; separate complete-victory runs below do not defer any orders.

| Fixture | Cells / factions | Final armies / towns | Mean AI planning | Mean command execution | Mean phase resolution | Mean complete turn* | Save / load |
|---|---:|---:|---:|---:|---:|---:|---:|
| Huge young | 196,608 / 32 | 287 / 127 | 4.054 ms | 1.874 ms | 0.212 ms | 6.141 ms | 19.1 / 47.3 ms |
| Huge mature | 196,608 / 32 | 1,503 / 125 | 12.446 ms | 4.451 ms | 0.525 ms | 17.422 ms | 19.3 / 62.0 ms |
| Legendary young | 307,200 / 40 | 359 / 159 | 5.417 ms | 2.108 ms | 0.205 ms | 7.730 ms | 25.0 / 69.4 ms |
| Legendary mature | 307,200 / 40 | 4,002 / 157 | 34.130 ms | 11.000 ms | 1.227 ms | 46.357 ms | 31.4 / 111.6 ms |

*Complete turn includes planning, submitted commands and end-turn phases; it excludes persistence, hashing, rendering, and the separately executed resumed-copy validation. AI planning includes observation construction.

Mature setup is an explicitly synthetic valid snapshot with 1,500/4,000 armies and ample treasury. Four introductory content definitions are reused across 32/40 factions. The following turns use actual rules. No armies encountered field battles or sieges in these geographically separated 100-turn fixtures; conquest and peace are exercised separately below. These fixtures do not cover future magic, supply or world crises, nor a dense network of simultaneous sieges/treaties.

Mean mature Huge phases: siege maintenance 0.003 ms, settlement production/growth/reconstruction 0.098 ms, upkeep 0.197 ms, movement/morale/fatigue refresh 0.212 ms, diplomacy expiry 0.001 ms, progression 0.0015 ms. Mature Legendary: 0.003 / 0.099 / 0.526 / 0.580 / 0.001 / 0.002 ms. Empty siege/diplomacy and inactive-project phases are measured explicitly, not claimed as loaded-system timings. Young generation: 54.4/62.6 ms; mature setup including validated import: 104.5/184.6 ms.

| Fixture | Final save bytes | Full faction observation bytes | Final state hash |
|---|---:|---:|---|
| Huge young | 1,094,741 | 34,962 | `df6b00e3` |
| Huge mature | 1,327,777 | 51,992 | `c07b8fbd` |
| Legendary young | 1,643,543 | 41,473 | `c20e6c8b` |
| Legendary mature | 2,335,670 | 76,925 | `64dcc404` |

Full observations are diagnostic sizes, not per-frame traffic. The browser worker emits cell deltas after its initial update. Hashes intentionally change when content or save schemas change.

Raw heap samples across mature Huge: 60/66/111/116/119 MiB; mature Legendary: 38/63/143/137/156 MiB. These include a second resumed campaign after turn 50 and were not measured with forced GC. GC-timing noise requires a longer retained-memory investigation before release; this is not a leak proof. HUD events are capped at 200, HUD battle reports at 20, and diplomatic records at the supported faction-pair count. The separate full campaign archive is intentionally not represented in these canonical-only timings.

## Combat

The same benchmark script warms 20 battles, then measures 200 seeded 12-versus-12 formation battles using the production tactical/autoresolve kernel: median **0.444 ms**, p95 **1.347 ms**, maximum **3.600 ms**. Input validation, cloning and all rounds are included. Median is close to the prior 0.428 ms; tail latency is higher in this sample despite the unchanged kernel, so GC/host variance needs continued measurement. Browser gameplay scenarios separately prove tactical orders, AI intervention, strategic retreat and identical continuation from a saved battle round.

## Conquest and peace

After five warmups, 50 repeatable Reedwatch scenarios run a real three-turn blockade, militia assault, occupation, paid peace and treaty expiry. Assault command plus full autoresolve: median **0.258 ms**, p95 **0.438 ms**, excluding fixture setup. Proposal plus acceptance: median **0.025 ms**, p95 **0.039 ms**; this deliberately includes commands on the resumed mirror too. Every run reloads the pending capture decision and verifies subsequent capture/diplomacy and 11 resumed turns. Final hash: `7353c748`.

An additional unit scenario runs **100 AI-led frontier turns** with actual siege, capture and accepted peace events, no rejected commands, save/load verification every turn and an uninterrupted-versus-restored mirror for the last 50 turns. It also explicitly defers terminal project proposals. This complements the large, geographically separated fixtures; it is not a dense late-game diplomatic stress test.

## Complete campaigns and full archives

`pnpm bench:chronicles` starts generated worlds with seed 20260905, gives every faction ordinary AI control, records every command/event/completed battle, and runs to actual Prosperity victory. It verifies complete replay, final envelope restoration, and compressed export/import. No project is skipped in this benchmark.

| World / pace / factions | Victory turn | Orders / events / battles archived | Mean round with recording* | Envelope save / load | Generate both logs | Full replay |
|---|---:|---:|---:|---:|---:|---:|
| Tiny / Short / 4 | 46 | 827 / 1,154 / 0 | 1.159 ms | 1.6 / 17.1 ms | 12.4 ms | 32.8 ms |
| Huge / Short / 32 | 45 | 5,994 / 12,081 / 0 | 21.893 ms | 27.7 / 285.1 ms | 164.5 ms | 1,109.4 ms |
| Legendary / Short / 40 | 45 | 7,499 / 16,605 / 0 | 29.961 ms | 39.9 / 317.9 ms | 229.8 ms | 1,597.3 ms |
| Tiny / Standard / 4 | 233 | 6,757 / 8,596 / 176 | 1.747 ms | 8.3 / 31.3 ms | 70.0 ms | 318.3 ms |
| Tiny / Epic / 4 | 1,006 | 26,163 / 37,843 / 1,491 | 2.119 ms | 39.1 / 122.5 ms | 326.9 ms | 1,720.2 ms |

*Includes observation, planning, commands, passive recording and end-turn hash checkpoints; excludes periodic storage, compression, rendering and final log generation. Envelope save is serialization/size validation, not an IndexedDB transaction. Load includes archive validation and generated-start provenance verification. Native UI watch intentionally yields 250 ms between rounds and autosaves each round, so these headless means are not browser autoplay wall times. The large short runs are not evidence for a 1,000-turn, 40-faction mature game.

| Fixture | Envelope / gzip bytes | Full technical / history bytes | Export / import including validation | Final hash |
|---|---:|---:|---:|---|
| Tiny Short | 378,467 / 28,594 | 563,856 / 17,927 | 19.8 / 19.0 ms | `a7a7b987` |
| Huge Short | 5,010,130 / 293,693 | 10,041,568 / 86,948 | 298.0 / 248.1 ms | `33ea5b30` |
| Legendary Short | 7,092,282 / 373,766 | 14,580,153 / 107,175 | 428.8 / 349.3 ms | `310d5f18` |
| Tiny Standard | 2,826,375 / 199,060 | 4,596,482 / 106,634 | 74.3 / 48.3 ms | `956927a6` |
| Tiny Epic | 12,704,134 / 923,252 | 21,161,603 / 665,919 | 329.0 / 272.7 ms | `4e74ba32` |

The Epic tome contains 1,008 chapters, rendered one at a time; technical browsing likewise renders one issuance turn. A dedicated test resumes the entire Epic archive from turn 500 and compares the final technical/history documents with uninterrupted play, including reports beyond the 20-report HUD cap. The retained transcript makes the completed game reconstructable, not just its final snapshot.

Raw post-case process heaps were 26/144/127/208/313 MiB, including temporary decoded saves, full document strings and replay validation; no forced GC or peak/retained-memory proof. Archives grow with game activity and whole-envelope autosaves repeat serialization/validation. The 64 MiB UTF-8 save cap is consistently enforced without silent truncation. Chunked storage and streamed document export remain necessary scale work before claiming long mature giant campaigns are fully supported.

Duration calibration used generated four-AI Tiny games, three seeds per long profile: Standard **233–252**, Long **479–498**, Epic **996–1,021** turns, all with zero rejected commands. Standard is the default; Short is explicitly for regression/skirmish play. Four permanent Standard/Epic regressions verify midpoint continuation and continued late production. These profiles scale late knowledge/funding and a public response window; they do not implement difficulty behavior or prove sufficient long-campaign strategic variety.

## Browser map

Chromium 151.0.7922.173 on Arch Linux, WebGL, 1440×1000 viewport; 390×844 responsive layout also inspected. The Huge camera scenario generates 196,608 canonical cells but initially reveals only 61. After pan/zoom, the final 68-frame sample measured 16.7 ms latest frame and 16.8 ms rolling p95, 0.20 ms CPU update/render submission, one cached/visible chunk, two entities, and a 6,855-byte initial worker update including progression choices. Playwright checks WebGL selection, bounded geometry/cache/transfer and absence of horizontal overflow. Visible ruin glyphs reuse the existing chunk-indexed marker layer. The complete Short watch/download/replay/reader scenario took 15.7 seconds including intentional watch delays and UI assertions; all 14 browser scenarios took 35.6 seconds.

This short fog-limited, software-assisted Chromium result does not establish the frame budget of a fully explored mature empire.

## Remaining performance gates

No hierarchical pathfinder exists; adjacent movement is bounded neighbor lookup, so long-distance route timings remain pending. Fully explored/mature giant browser fixtures, virtualized registries, mainstream hardware, Firefox/WebKit, multiplayer and mixed late-game battle/magic/diplomacy workloads are still required. Rendering and simulation budgets remain separate.

The prior conquest slice measured complete young turns of 5.34/6.85 ms versus current 6.14/7.73 ms; extra progression/visibility observation work increases that small baseline. Current mature means are lower (17.42/46.36 ms versus 26.12/66.16 ms), but changed AI economics and command mixes make this unsuitable as a pure optimization claim: current mature runs issue 76,402/196,748 commands and end with different settlement counts. Production output is a 629.12 kB main chunk (192.77 kB gzip), a 308.84 kB worker and 37.56 kB CSS. The large-main-chunk and upstream Zod annotation warnings remain documented, not suppressed.
