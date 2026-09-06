# Slice 5 measurements — movement, biomes and versioned archives

Measured 2026-09-05, integrated working tree from `59c6dbe`; save 5, archive/technical 2, generator 2, content `3139d4e7`. Intel i9-13900K, Linux 7.1.9-arch1-2, Node v26.7.0. Reproduce using `pnpm bench`, `pnpm bench:chronicles` and Chromium gameplay tests. These are development-machine samples, not mainstream-device release promises. [Previous baseline](../PERFORMANCE.md).

## Campaign scale and saved continuation

All four fixed 100-turn AI fixtures completed with zero rejected proposals, identical final save/load hashes, and an identical 50-turn midpoint mirror. As before, these workloads explicitly defer the terminal victory project and exclude archive/hash/storage work from turn timings. Mature initial positions contain synthetic 1,500/4,000 armies and ample treasury; subsequent commands use real rules. No field battles occur in these geographically separated workloads. Four introductory content definitions supply the stress-faction roster; these are not authored 32/40-faction releases.

| Fixture | Final armies/towns | Mean AI / commands / phases ms | Mean complete turn ms | Save / load ms | Save bytes / full observation bytes | Final hash |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Huge young, 196,608 cells / 32 factions | 287 / 127 | 3.946 / 1.904 / 0.209 | 6.059 | 25.8 / 68.1 | 1,488,000 / 40,044 | `9151c968` |
| Huge mature | 1,503 / 125 | 12.055 / 4.627 / 0.490 | 17.172 | 30.2 / 75.2 | 1,721,036 / 58,904 | `471deeea` |
| Legendary young, 307,200 cells / 40 factions | 359 / 159 | 5.483 / 2.275 / 0.200 | 7.959 | 35.3 / 99.9 | 2,257,986 / 47,665 | `948f1b67` |
| Legendary mature | 4,002 / 157 | 35.233 / 11.794 / 1.213 | 48.240 | 43.9 / 136.4 | 2,950,113 / 86,737 | `4d54f029` |

AI time includes observation construction. Complete turn excludes separately executed resumed-copy checks, saves, hashing and rendering. Full observations are diagnostic, not per-frame traffic. Prior complete-turn means were 6.141/17.422/7.730/46.357 ms: mature Huge is close and mature Legendary is about 4% higher in this sample. A first integrated sample was 17.462/46.709 ms; timing variance is retained rather than selecting only the faster result.

Mature Huge mean phases (ms): siege 0.0026, settlements 0.0830, upkeep 0.1835, movement refresh 0.2059, empty travel 0.0010, diplomacy 0.0005, progression 0.0012. Legendary: 0.0029/0.0998/0.5075/0.5816/0.0017/0.0011/0.0013. Empty phases are not loaded-system proofs. Generation was 68.1/87.7 ms Huge/Legendary; synthetic mature setup plus validated import 146.8/241.6 ms. Additional biome serialization increases canonical save size by about 393/614 kB respectively.

Mature heap samples were 82/105/42/58/69 MiB Huge and 133/32/72/70/83 MiB Legendary, including a second campaign after turn 50, without forced GC. These are not peak/retained-memory leak proofs.

Combat kernel: 200 seeded 12-versus-12 battles after 20 warmups, median 0.417 ms, p95 1.282, maximum 2.925. Conquest/peace: 50 runs after five warmups, real blockade/assault/capture/paid peace/expiry; assault+autoresolve median/p95 0.246/0.378 ms, peace package including mirror commands 0.024/0.032 ms; every capture-decision save and 11-turn mirror agrees, hash `bf0ed74f`.

## Fully explored movement queries and queued travel

`scripts/benchmark-movement.ts` is part of `pnpm bench`. It uses explicitly synthetic fully explored two-faction Huge/Legendary worlds, without AI or hostile interference. The short destination is connected and 18 edges away. Range and preview share one 4,096-expanded-node budget. Full observation construction and first index build are separated from repeated cached queries; 20 warmups precede 120 samples. Route timings include a result equality check.

| Work | Huge | Legendary |
| --- | ---: | ---: |
| Full permitted observation construction | 6.45 ms | 11.20 ms |
| First query, including full observation index | 16.55 ms | 36.80 ms |
| Cached range median / p95 | 0.074 / 0.157 ms | 0.074 / 0.082 ms |
| Cached range+route median / p95 | 0.090 / 0.178 ms | 0.091 / 0.098 ms |
| Range destinations / combined expanded nodes | 84 / 104 | 90 / 110 |
| Far request, exactly 4,096 nodes; reports limit | 2.59 ms | 2.44 ms |
| Issue 512 stacked guards' queues | 143.0 ms | 120.3 ms |
| Active travel phase median / maximum, five turns | 71.05 / 78.10 ms | 67.05 / 70.08 ms |
| Pending-route save bytes | 2,756,431 | 4,245,842 |
| 20-turn continuation final hash | `c74d557a` | `935f3449` |

The 512 guards share one destination, initially stack, and arrive after five active travel turns following the immediate budget. All 20 total turns match a restored mirror in results and hashes; the other 15 are post-arrival idle and are **not** used to imply a sub-millisecond active-travel median. Full end-turn maximum was 78.60/70.39 ms. This deliberate stack workload stresses repeated local occupant checks; it does not prove 4,000 simultaneous long-distance invasions. The largest cached-route sample was 8.68 ms Huge / 1.72 ms Legendary, so p95 is not a claim of no GC tails.

Cold indexes run in the worker and are retained across hover requests until state changes; these measured cold costs are a reason not to rebuild full explored observations every pointer event. The pathfinder is bounded A*, not hierarchical routing. Observation construction remains O(explored cells), and cold giant-state queries need continued optimization.

## Real victory and complete archives

Generated seed 20260905, ordinary AI for every faction, no deferred project proposals. Every run verifies full replay, envelope restore and gzip export/import. Mean rounds include passive recording and end-turn checksums but exclude periodic storage, compression, rendering and final documents. Envelope save/load are serialization/validation, not IndexedDB transactions. Short giant runs are separate from long Tiny pacing tests.

| World / pace / factions | Victory turn | Orders / events / battles | Mean recorded round ms | Envelope save / load ms | Both logs / full replay ms |
| --- | ---: | ---: | ---: | ---: | ---: |
| Tiny / Short / 4 | 46 | 827 / 1,154 / 0 | 1.110 | 1.5 / 17.5 | 12.0 / 35.4 |
| Huge / Short / 32 | 45 | 5,994 / 12,081 / 0 | 27.582 | 36.6 / 309.0 | 192.4 / 1,587.6 |
| Legendary / Short / 40 | 45 | 7,499 / 16,605 / 0 | 42.961 | 58.0 / 476.2 | 293.9 / 2,222.5 |
| Tiny / Standard / 4 | 233 | 6,757 / 8,596 / 176 | 1.718 | 9.9 / 36.2 | 74.3 / 372.9 |
| Tiny / Epic / 4 | 1,006 | 26,163 / 37,843 / 1,491 | 2.172 | 33.7 / 127.4 | 329.6 / 1,703.0 |

| Fixture | Envelope / gzip bytes | Technical / historical bytes | Export / import ms | Hash |
| --- | ---: | ---: | ---: | --- |
| Tiny Short | 419,352 / 29,963 | 631,812 / 17,927 | 23.9 / 20.7 | `f74ac17f` |
| Huge Short | 6,048,320 / 314,393 | 12,945,149 / 86,948 | 377.1 / 318.5 | `31e10e82` |
| Legendary Short | 8,636,050 / 399,732 | 19,008,720 / 107,175 | 577.5 / 484.3 | `de959b06` |
| Tiny Standard | 3,115,759 / 203,610 | 5,007,817 / 106,634 | 79.6 / 68.2 | `0e6d326a` |
| Tiny Epic | 13,806,251 / 943,668 | 22,696,167 / 665,919 | 313.1 / 273.7 | `04e10fd5` |

The Epic tome still has 1,008 chapters and the independent turn-500 save test retains identical complete logs. Biomes preserve physical geography/economy, so victory timing/order/event counts remain unchanged. New hashes are expected for the versioned state. A legacy-rules golden separately reproduces old Short seal `a7a7b987` exactly.

Costs are not hidden: recorded giant-round means rose from 21.893/29.961 ms to 27.582/42.961 ms (about 26%/43%). Added canonical biome serialization/checksumming and explicit record-version metadata enlarge envelopes; this is consistent with the higher measured save/hash costs, not a controlled attribution of every millisecond. Tiny long runs remain close. Whole-envelope archives still cap at 64 MiB UTF-8, never truncate silently, and need chunking/streamed export before claiming 1,000-turn mature giant support. Post-case heaps 32/300/356/147/336 MiB include temporary documents, decoded saves and replay; they are not measured retained memory.

## Browser and remaining gates

The final sequential 20-scenario Chromium suite passed in 46.5 seconds after the inspector reorder; interruption controls are explicitly checked in the desktop viewport. Chromium 151.0.7922.173, WebGL, 1440×1000; actual touch context and screenshots at 390×844. Named Huge starting camera: 100.8 ms generation, 7,477-byte initial update, 72-frame sample with 16.8 ms frame p95 and 0.10 ms sampled render CPU; 61 visible cells, one cached/visible chunk, two entities and 36 highlighted destinations. Pre-change same named workload: 71.8 ms generation, 6,855 bytes, p95 16.8 ms, CPU 0.20 ms. CPU readings are individual coarse samples, not a demonstrated 2× rendering speedup. The added climate generation increases startup work; the preview overlay stays bounded without rebaking terrain.

The authored movement/browser scene is a small, deliberately flattened map imported through the validated save boundary, with visible biome samples and actual foreign commands. It is not a claim of natural climate coverage or mature-world rendering. Generator tests separately check the real seeded Huge/Legendary maps, all ten classes, connected fertile starts and versioned physical-map parity.

UI/graphics asset budget work remains specified, not measured sprite residency: actual sprites/atlases and the tactical sprite camera are unbuilt. Hierarchical routing, virtualized registries, chunked archives, fully explored giant browser rendering, mainstream hardware, Firefox/WebKit and mixed late-game supply/magic/crisis loads remain release requirements. Performance and completeness of long campaigns are separate concerns.
