# Four-culture art integration

Measured 2026-09-05 on the existing i9-13900K / RTX 4080 / Node 26.7 setup. This extends the 37-asset generic pack with 60 individually approved static culture assets. It does not add canonical entities or prove full animation, mainstream-device or giant-campaign release performance.

## Offline compilation

`node --import tsx scripts/benchmark-art.ts`, isolated after the full gameplay run; warmed code/data, filesystem reads excluded, seven samples unless specified.

| Operation | Median | Sample p95 / maximum |
| --- | ---: | ---: |
| Validate all 97 approved assets / 115 frames | 33.63 ms | 41.32 ms |
| Deterministic atlas packing + PNG encoding | 68.60 ms | 78.37 ms |
| Decode published PNG | 14.04 ms | 21.05 ms |
| Validate 1,000 synthetic repeated-source frames (five samples) | 93.71 ms | 102.29 ms |

The synthetic frames remain candidates and are not additional generated/approved assets. The final pack fits one 1024×1024 page with two extruded and two clear padding pixels, no rotation/trimming. PNG: **492,790 bytes**, SHA-256 `59bfd5e96f75f235bbe528b416a8bfb25e44f9965f7a002cb3440afd252e3b90`. Reversed input ordering rebuilds identical PNG and catalog data. Peak process RSS was 342.59 MiB, including warm validation/encoding stress; this is not browser memory.

The original smaller pack's warmed validation/packing/decode medians were 14.96/33.05/10.96 ms. More validated frames predictably increase compiler cost; runtime atlas allocation stays 4 MiB. The DOM icon loader may independently decode another 4 MiB, so the Pixi-only diagnostic is not total presentation memory. Catalog and atlas metadata also consume CPU/memory beyond decoded RGBA.

## Final browser workload

The full 43-scenario Chromium run passed on WebGL with the repository's existing software-assisted test configuration. The fully explored Huge fixture contains 196,608 cells, 32 factions, 1,500 global armies and 32 towns. Its placement/knowledge are synthetic; current fog still hides foreign armies. The test advances no turns and makes no late-game strategic throughput claim.

The final complete run passes all 43 scenarios in 2.3 minutes after the narrow recruitment correction. At the first static sample, 48 observed entities and 2,304 terrain cells render from nine cached chunks; 2,352 pooled sprites, one 4 MiB map page. Frame p95 was 16.8 ms, first art render CPU 26.6 ms and verified pack load 282.1 ms. The preceding identical-pack checkpoint recorded 824,430 bytes of map-side catalog/atlas/image downloads. Initial observation is still **13,375,621 bytes**: adding public faction identity did not solve large explored-world transfer costs. Canonical hash remains `727da879` through pan, zoom and inspection.

| Final stage | Rolling frame p95 | Render CPU sample | Drawn terrain cells | Cached chunks | Entity sprites |
| --- | ---: | ---: | ---: | ---: | ---: |
| Fully explored, zoom 1 | 16.8 ms | 0.2 ms | 2,304 | 9 | 48 |
| Near static poses, zoom 1.25 | 16.8 ms | 0.2 ms | 2,304 | 9 | 48 |
| Six camera drags | 16.7 ms | 0.3 ms | 1,024 | 11 | 0 |
| Far view away from home | 16.7 ms | 0.1 ms | 2,304 | 16 | 0 |
| Far view at home | 16.7 ms | 0.1 ms | 2,304 | 16 | 2 |

At far home view, 48 currently observed entities aggregate to one army badge plus one town banner. The zero-sprite camera positions contain no currently visible entities; they are not evidence of skipped rendering. The largest sampled pool is 4,144 sprites. All five samples retain one 4 MiB map page. [Raw final metrics](data/0010-faction-art-browser.json) preserve the workload, counts, timings and immutable hash. The previous same-pack run measured 26.4 ms first-render CPU / 295.2 ms loading; these are individual runs, not a statistical cold-load claim. This fixture does not saturate the renderer cache.

Unlike the generic baseline, the new culture poses are static and therefore have zero active world idle clips. The independent generic Art Lab animation checks retain real changing pixels and frame timing; lower animation workload is disclosed, not misrepresented as an animation optimization. Terrain geometry/camera fitting remains fractional, and noisy repeated tiles plus dense labels are visible production-readability limits.

Screenshot review found a narrow two-column CSS override squeezing recruitment descriptions beside 96px cavalry art. The scoped selector correction and new computed-layout, minimum description-width and unobscured-hit checks pass in the final run. Retained screenshots show [readable recruitment](../art/screenshots/slice10-recruitment-narrow.png), [all public crests above the real footer](../art/screenshots/slice10-public-cultures-narrow.png), [native character controls](../art/screenshots/slice10-character-narrow.png), and the [near](../art/screenshots/slice10-cultures-near.png) / [far](../art/screenshots/slice10-cultures-far.png) four-culture map gallery. No sticky footer was hidden for evidence.

Final production build: main 723.51 kB / 221.19 kB gzip, worker 404.18 kB, CSS 49.60 kB / 9.86 kB gzip. Existing large-main-chunk and Zod annotation warnings remain non-fatal. All ten built JavaScript chunks exclude Art Lab/debug hooks; production art contains only the approved PNG/atlas/catalog. Full typecheck, lint and all 458 tests / 52 files pass after the CSS correction.

See [asset coverage](../art/FACTION_ASSET_CATALOG.md), [decision 0017](../architecture/0017-faction-art-families.md) and [current implementation status](../IMPLEMENTATION_STATUS.md). Storage and character/campaign measurements remain separate workloads.
