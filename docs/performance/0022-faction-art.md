# Twelve-culture art: matched publication measurements

Measured 2026-09-06 on the same development host. Current canonical identity is schema/rules 10, content `4c2fed32`, roster 3, physical generator 4. Artwork does not enter the canonical state hash.

## Offline compiler

Both accepted measurements use the existing `node --import tsx scripts/benchmark-art.ts` workload: warm code/data, filesystem reads excluded, seven timed iterations for validation/build/decode and five for synthetic validation. All other agents were idle for the accepted compiler windows. A first expanded run overlapped a six-second menu test; its [contended output](0022-art-compile-expanded.json) is retained but excluded from this comparison.

| Work / output | Before: 134 assets, 152 frames | After: 224 assets, 242 frames |
|---|---:|---:|
| Pixel/approval validation median | 41.874 ms | 65.914 ms |
| Atlas build + PNG encoding median | 105.833 ms | 155.270 ms |
| PNG decode median | 49.785 ms | 55.978 ms |
| PNG bytes | 692,034 | 1,076,255 |
| Atlas dimensions / count | 2048×2048 / 1 | 2048×2048 / 1 |
| Decoded map-atlas bytes | 16,777,216 | 16,777,216 |
| Synthetic 1,000-frame validation median | 91.352 ms | 90.616 ms |
| Process peak RSS | 496.625 MiB | 537.289 MiB |

[Before output](0022-art-compile-baseline.json), [isolated expanded output](0022-art-compile-expanded-isolated.json). The synthetic workload repeats existing approved pixels with distinct candidate IDs; it is not 1,000 new assets or approvals. Peak RSS includes compiler temporaries and is not retained game memory. More assets increase validation/packing work; no optimization speedup is claimed.

The old atlas SHA-256 is `7a22a84c0c4623cea16327af27313e6796560024f38fbafde1491a0afe27ceb7`; the expanded atlas is `f9ac4d64680b436311cc6c27a0d253ced11a56fe2a440cb1fdd420a9e43c9d4b`. Both reverse-input builds reproduce the corresponding published pixels exactly. Original approved source frames remain unchanged; atlas rectangles legitimately move when new assets are inserted.

## Browser comparison and final art review

The [pre-publication baseline](0022-art-render-baseline.json) and [expanded full-suite checkpoint](0022-art-render-expanded-grid.json) use the same synthetic fully explored Huge save: 196,608 cells, 32 generated faction seats, 1,500 global armies and 32 towns. Actual fog still filters visible enemies. Neither test advances turns or measures strategic AI.

Both retain canonical seal `892b6614`, canvas geometry x260/y205/890×786, 1,970,720 initial transferred bytes including 1,769,695 packed-cell bytes, and zero land queries during camera interaction. Five camera stages draw 1,024–4,096 terrain cells; cached chunks grow from four to twenty-six. Maximum chunk bounds stay 837×712, with 104 MiB estimated power-of-two backing at the final stage, separate from the 16 MiB map atlas and potential separate 16 MiB DOM atlas decode. Texture-pool returns and other GPU allocations are not included.

Rolling frame p95 remains 16.7–16.8 ms in both runs. Near view draws 48 static entity sprites; the final strategic home view draws two aggregated heraldic sprites. Art load/first render CPU are 272.3/41.5 ms before and 252.8/39.1 ms in the expanded checkpoint. These are single browser runs with cache/host variance, not evidence that adding assets makes loading faster. Chromium uses the test configuration's SwiftShader allowance; these figures are not mainstream hardware-GPU or total-memory certification.

The expanded checkpoint passed all 71 functional Chromium scenarios in 3.7 minutes, but still showed a separate narrow-menu screenshot artifact. Its grid menu trial and initially obscured first-town gallery captures are not final visual signoff.

The [final native-disclosure run](0022-art-render-final.json) passes all **71 functional Chromium scenarios in 3.9 minutes**. The source also passes 802 tests across 80 files, typecheck, full lint, content validation, all 224 approval checks and production build. The final browser window ran alone, with no other browser, compiler or AI benchmark. It preserves the same `892b6614` seal, canvas geometry, transfer bytes, LOD/cell/chunk/pool counts and bounds. Frame p95 remains 16.7–16.8 ms; art load is 267.2 ms and first art render CPU is 38.9 ms. Compared with the 272.3/41.5 ms baseline, these single samples do not establish a loading speedup. All decoded-page/cache caveats above still apply.

Root inspected all eight retained gallery captures at original resolution: cohort one [units/villages](../screenshots/slice16-cohort-1-units-villages.png), [towns](../screenshots/slice16-cohort-1-towns.png), [cities](../screenshots/slice16-cohort-1-cities.png), [strategic heraldry](../screenshots/slice16-cohort-1-strategic.png); cohort two [units/villages](../screenshots/slice16-cohort-2-units-villages.png), [towns](../screenshots/slice16-cohort-2-towns.png), [cities](../screenshots/slice16-cohort-2-cities.png), [strategic heraldry](../screenshots/slice16-cohort-2-strategic.png). Escape clears the selected-army overlay and a real 275-pixel drag, at unchanged zoom, leaves the entire first town right of the title/neutral hint and the final town inside the canvas. An initial 260-pixel attempt failed its measured clearance by two pixels; the assertion was retained and actual framing corrected. No title/footer hiding, runtime mutation hook or art shrinking is used.

All twelve cultures select their own untinted role art, and an actually unseen army remains absent. Static faction poses are not reported as animation. The [twelve-culture narrow view](../screenshots/slice16-twelve-cultures-narrow.png), [public crests](../screenshots/slice16-twelve-public-crests.png), [saved Morrow economy](../screenshots/slice16-morrow-saved-economy.png), [narrow profile](../screenshots/slice16-faction-profile-narrow.png), [AI preferences](../screenshots/slice16-recruitment-preferences-narrow.png) and final [fully explored near](../screenshots/slice16-fully-explored-near.png)/[strategic](../screenshots/slice16-fully-explored-strategic.png) screenshots were also inspected. Faction roles remain correctly bound through ordinary founding, paid construction and portable-save restoration. Dense long army labels collide in the synthetic troop rows and terrain stamps remain conspicuously repetitive; these are retained production-readability limits.

This closes the expanded static-pack integration review, not every visual gate: the [narrow menu painting defect](0023-menu-paint.md) remains unresolved and reproduces with ordinary wheel scrolling. Functional control/geometry checks do not certify that presentation, and no headed/cross-browser confirmation is claimed. Thirty-six culture-qualified naval hull sprites, genuine faction animation and another twelve authored societies toward twenty-four remain future work. No game 1.0 gate is marked complete.
