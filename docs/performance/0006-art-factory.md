# Slice 6 — reviewed pixel art and renderer measurements

Measured 2026-09-05, integrated working tree from `59c6dbe`; Linux 7.1.9-arch1-2, i9-13900K, Node 26.7.0, pnpm 10.32.1. Chromium 151.0.7922.173 / WebGL with the repository's software-assisted test launch configuration, 1440×1000 desktop and 390×844 responsive inspection. This is not mainstream-device, hardware-GPU-only or cross-browser release evidence. [Prior baseline and fixture definitions](0005-travel-biomes.md).

Reproduce with `pnpm bench:art`, `pnpm bench`, `pnpm bench:chronicles`, `pnpm art:verify-tools`, and `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium pnpm test:gameplay`. Browser and headless performance runs were serialized. All 25 integrated gameplay scenarios pass; no turn/save/content rules changed (save 5 / archive 2 / generator 2 / content `3139d4e7`).

## Offline art compiler

[Complete JSON](art-factory-20260905.json). Actual published pack: 37 reviewed assets, 55 distinct frame IDs, one 1024² atlas, 217,073 PNG bytes / 4,194,304 decoded RGBA bytes. SHA-256 `8886caf97516bcdb12971b4e861a1c842b3766df2c1f0abc5938437805388982`. Reversed asset input order reproduces both exact PNG and catalog hashes. Timings below exclude disk reads and native-tool startup; code/data were warmed once first.

| Work | Samples | Median | p95 |
|---|---:|---:|---:|
| Validate all retained published approvals | 7 | 14.96 ms | 19.02 ms |
| Validate, pack and PNG-encode atlas | 7 | 33.05 ms | 37.59 ms |
| Strict decode actual atlas PNG | 7 | 10.96 ms | 16.60 ms |
| Synthetic 1,000-frame candidate validation | 5 | 96.76 ms | 99.59 ms |

The 1,000-frame case repeats approved guard pixel buffers under distinct in-memory test IDs, status CANDIDATE, no review and no publication. It measures validation throughput, not 1,000 newly generated assets or renderer FPS. Whole-process peak RSS is 323.48 MiB across the run, including synthetic buffers/compiler work; it is not retained browser texture memory. Native Aseprite/Snapper smoke checks verify actual tags/durations and repeated export equality separately. Source generation took approximately 49–57 seconds per original sheet; cost/model/seed were not exposed and are not guessed. No comparative live-paid-provider timings exist.

## Fully explored Huge browser

[Complete browser JSON](art-browser-20260905.json). The test builds the existing synthetic mature Huge fixture (196,608 cells / 32 factions / 1,500 global armies / 32 towns), marks all terrain explored for the player and imports the canonical snapshot through the real validated compressed-save UI. Current enemy visibility is **not** overridden. The initial camera has 47 own armies stacked at the founding area plus one town; this is a rendering load, not a readable 47-army deployment or organically played late-game world. No end turn occurs. Camera/animation/inspection preserve hash `e811a425`.

| Camera sample | Zoom | Chunk cells / cached chunks | Visible figures / animated | Sprite pool total | Frame p95 / sampled CPU |
|---|---:|---:|---:|---:|---:|
| Initial static | 1.00 | 2,304 / 9 | 48 / 0 | 2,352 | 16.8 / 0.10 ms |
| Near idle | 1.25 | 2,304 / 9 | 48 / 47 | 2,352 | 16.8 / 0.10 ms |
| After six camera drags | 1.25 | 1,024 / 11 | 0 / 0 | 2,864 | 16.8 / 0.10 ms |
| Far strategic | 0.512 | 2,304 / 16 | 0 / 0 | 4,144 | 16.8 / 0.10 ms |

The static terrain remains cached at far zoom; entity sprites/animations collapse into strategic markers. Visible-cell counts include complete intersecting 16×16 chunks, not exact on-screen hexes. The pooled count includes retained terrain chunk sprites and hidden reusable figures; its growth across new terrain is bounded cache use, not a leak proof. The tested trajectory reaches 16 of the 64 allowed chunks, not a saturated-cache or prolonged-session test. Each stage waits at least 60 further frames. Frame p95 uses the renderer's rolling sample; a single coarse sampled CPU value does not capture every pan/chunk rebuild stall.

One approved atlas stays resident, estimated 4 MiB RGBA. Runtime art download accounting reports 341,764 bytes for PNG plus parsed JSON/canonical catalog accounting; it is not compressed wire traffic. Art load was 320.1 ms, first art-render CPU 34.9 ms. The initial explored-world worker update is **13,361,070 bytes**, unchanged through camera navigation. This substantial import/index/transfer cost is measured openly and still needs packed/chunked streaming; viewport-bounded rendering does not solve full-observation construction or initial synchronization. Cached render textures, framebuffers, browser objects and driver allocations are **not** included in the 4 MiB atlas estimate.

The regular hex grid still fits authored sprites with fractional scales (~0.897 X / 0.906 Y); gameplay zoom is not pixel-perfect. Native Lab 1/2/4/8× is exact integer nearest. Repeated terrain stamps/bevels remain visually obvious even without interior alpha cracks. [Retained review screenshots](../art/ART_IMPLEMENTATION_STATUS.md#review-evidence-and-next-production-work).

## Starting-fog comparison and production weight

The unchanged named Huge starting-camera test reveals 61 cells, has 2 figures, 1 cached chunk / 63 pooled sprites, and transfers 7,477 bytes. Final run: generation 118.2 ms, 75-frame sample, p95 16.8 ms, sampled CPU 0.10 ms, art load 154.6 ms / first art-render CPU 10.5 ms. The preceding integrated run measured generation 104.1 ms, art load 145.5 ms / first render 7.6 ms and the same 16.8 ms p95. Prior pre-art sample was generation 100.8 ms / p95 16.8 ms / CPU 0.10 ms. There is no demonstrated render-speed improvement; new cold art costs and host variability are retained.

Production main JS is 669.68 kB / gzip 205.33 kB, versus the previous pre-art 643.71 / 197.13 kB. Worker remains 329.48 kB. CSS is 40.24 kB / gzip 8.21 kB. Art Lab code/catalog and debug hook are absent from production output; approved runtime PNG/JSON remain. Vite's >500 kB main-chunk and upstream Zod annotation warnings remain non-fatal. Source/native tooling dependencies are not imported into the browser.

## Campaign, movement and saved continuation

All four fixed 100-turn Huge/Legendary AI fixtures complete with zero rejected proposals and identical 50-turn midpoint/restored hashes. They still defer only terminal project proposals, exclude archive/save/hash/render work from turn means, and encounter no field battles. Mature initial armies/treasury are synthetic. No art module is imported by the simulation; timings are remeasurement variability, not evidence that art sped up/slowed the headless kernel.

| Fixture | Mean complete turn | Save / load | Final hash, unchanged from slice 5 |
|---|---:|---:|---|
| Huge young | 6.574 ms | 28.46 / 72.15 ms | `9151c968` |
| Huge mature | 18.100 ms | 24.76 / 74.51 ms | `471deeea` |
| Legendary young | 7.923 ms | 36.61 / 102.16 ms | `948f1b67` |
| Legendary mature | 47.580 ms | 43.53 / 138.88 ms | `4d54f029` |

Prior turn means were 6.059 / 17.172 / 7.959 / 48.240 ms. Saved byte counts, final army/town counts and order counts remain identical. Mature raw heap samples range 46–111 MiB Huge and 65–197 MiB Legendary, include midpoint mirrors and uncontrolled GC, and are not leak/peak proofs.

Fully explored movement range+route p95 is 0.145 ms Huge / 0.125 ms Legendary; cold query including index is 10.85 / 32.18 ms. Five active 512-army queued travel phases have median 69.53 / 70.94 ms and maximum 70.87 / 82.60 ms; the 15 subsequent idle phases are not used to imply fast active travel. All 20 saved-continuation turns match `c74d557a` / `935f3449`. These remain stacked same-destination/no-hostile fixtures, not giant invasions.

Combat kernel (200 battles after 20 warmups): median 0.459 / p95 0.755 ms. Conquest assault (50 after 5 warmups): median 0.267 / p95 0.695 ms. Paid peace package including mirror commands: median 0.0275 / p95 0.0433 ms. Pending-capture and 11-turn mirrors match `bf0ed74f`.

## Complete archived victories

Generated seed 20260905; ordinary AI for every faction, no deferred projects, zero rejected orders. Every case verifies full technical replay, final envelope restore and gzip export/import. Mean rounds include recording/end-turn checksums but exclude storage, compression, renderer and final document generation. These are the same real-victory workloads as slice 5, not synthetic terminal states.

| World / pace / factions | Victory turn | Mean recorded round | Envelope save / load | Both logs / full replay | Unchanged hash |
|---|---:|---:|---:|---:|---|
| Tiny / Short / 4 | 46 | 1.215 ms | 1.69 / 19.57 ms | 12.58 / 36.02 ms | `f74ac17f` |
| Huge / Short / 32 | 45 | 30.849 ms | 43.93 / 308.14 ms | 206.96 / 1,727.51 ms | `31e10e82` |
| Legendary / Short / 40 | 45 | 44.952 ms | 57.62 / 469.86 ms | 322.09 / 2,333.90 ms | `de959b06` |
| Tiny / Standard / 4 | 233 | 1.789 ms | 9.57 / 38.87 ms | 78.21 / 393.53 ms | `0e6d326a` |
| Tiny / Epic / 4 | 1,006 | 2.316 ms | 43.79 / 134.45 ms | 341.34 / 1,748.04 ms | `04e10fd5` |

Prior mean recorded rounds were 1.110 / 27.582 / 42.961 / 1.718 / 2.172 ms. No simulation/art coupling or causal slowdown is inferred from this independent timing sample. All victory turns, order/event/battle counts, final hashes and serialized document sizes are unchanged. Epic retains 26,163 commands, 37,843 events, 1,491 battles and 1,008 history chapters: envelope 13,806,251 bytes / gzip 943,668 bytes; technical log 22,696,167 bytes / history 665,919 bytes. Epic export/import is 341.17 / 294.14 ms. The full unit suite also repeats the turn-500 archive continuation test and compares complete final logs.

Post-case heaps of 32 / 233 / 390 / 147 / 336 MiB include transient decoded saves, documents and replay; not a retained-memory claim. Short giant runs do not prove 1,000-turn mature giant support. The 64 MiB whole-envelope budget and future chunked storage/streaming remain real scale limits.

## Remaining acceptance

Further gates include mainstream-device/Firefox/WebKit runs, saturated chunk-cache/residency/leak profiling, true directional combat and faction art, variation/transition production, packed explored-world transfers, chunked archives and long mature mixed-system campaigns. The single-page compiler and current scene do not establish full 1.0 art/content/performance readiness.
