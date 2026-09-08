# Map-first management and contained tile artwork — slice 24

Measured 2026-09-07 against the inspected repository at `b17900d`, preserving its existing uncommitted development. This slice changes presentation and input orchestration, not canonical content, rules, generation, saves or AI. Content remains `b6e3bce2`, schema/rules 14, roster 4, generator 7.

## Functional verification

- Whole typecheck, lint, content validation and production build pass. The existing large-chunk and upstream Zod annotation build warnings remain visible.
- [Final headless run](0036-headless-final.txt): **1,418/1,421**, 152 files, zero skips, 69.12 seconds. The only failures are the previously recorded Standard/four-seat contact, Huge/32-seat contact (31/32) and Epic's unchanged 60-second full-archive budget (64.264 seconds in this parallel invocation). No contact requirement, replay assertion or timeout was relaxed. [Earlier checkpoint](0036-headless.txt): 1,416/1,419 before two additional presentation regressions.
- [Full Chromium checkpoint](0036-browser-full.txt): **117/122**, 8.8 minutes. The five failures identified old menu/tab-count and popup-dismissal assumptions. Tests now explicitly inspect the new checkbox, use Move on map before targeting terrain covered by the popup, and verify that Escape first closes the popup without clearing the army. Existing canonical hashes, route costs, fog and geometry assertions remain.
- [Final focused Chromium run](0036-browser-followup.txt): **19/19**, 57.7 seconds. It covers all five earlier failures, all six new scenarios, interrupted journeys, actual multi-step attacks and naval transport/combat. The final runtime adjustment defers route-confirmation focus until the popup finishes initializing, cancelling obsolete inspector focus. Thus every one of the 122 scenarios has passing evidence across the two runs; this is not a single 122/122 invocation.
- [Actual production bundle](0036-production.txt): **3/3**, 10.4 seconds. Map-driven Root cellar and Quarry orders pay real prices; save → cancel without refund → load restores production, work, yields, treasury, knowledge and turn. The browser exposes no development mutation/inspection hook. Existing battlefield saved-outcome and watch-only fog checks also pass.

The new map scenarios use actual pointer clicks and normal commands. They verify successful founding, exact offline command/hash mirrors, a hundred co-located army choices, native character-dialog focus, a paid appointment, keyboard tab reset, read-only foreign land through a war declaration, 390×844 at 130% text, current-hash tile quotes and saved route waypoint focus. Only one land inspector is mounted; a paid worker change increments its query counter exactly once. This is functional/query boundedness evidence, not a measured popup-latency percentile.

## Matched Huge-map rendering

The [before](0036-map-before.json) and [after](0036-map-after.json) captures run the same named `art-performance.spec.ts` workload, separately from builds, headless tests and other browser jobs. Both isolated invocations pass in 16.9 seconds. The authored Huge fixture contains 196,608 explored cells, 1,500 global singleton armies and 32 towns; ordinary entity fog limits the currently observed entities to 48 in the home samples. This is not 1,500 simultaneously visible units or a mature turn/AI benchmark.

Both snapshots have exact campaign hash **`b14aa18a`**, canvas **890×786**, cell transfer **1,769,695 bytes**, total worker transfer **1,974,826 bytes**, and no land queries. The frame metric is a rolling 240-frame percentile following each warmed stage, not an independent per-stage GPU timer.

| Stage | Before frame p95 | After frame p95 |
| --- | ---: | ---: |
| Static home view | 16.8 ms | 16.8 ms |
| Near faction poses | 16.7 ms | 16.7 ms |
| Six camera drags | 16.8 ms | 16.7 ms |
| Far strategic view | 16.8 ms | 16.7 ms |
| Far home aggregates | 16.7 ms | 16.7 ms |

Both runs retain at most **26 cached chunks / 104 MiB estimated backing**, with 837×711 maximum chunk dimensions. The foundation atlas remains **16 MiB**, separately from chunk textures, DOM decodes and other allocations. The exact foundation PNG is unchanged: 2,628,301 bytes, SHA-256 `e32c73be1b8789f8c554eea7c6b7204d40fae20e3347be36ccbd76de8a9740de`. The battle page is unchanged and stays lazy. The complete published pack remains 506 approved assets / 569 frames, not a newly generated pack.

First-art CPU samples are 61.3→58.6 ms and load samples 313.8→318.5 ms. These single startup captures do not establish a speedup or a reliable startup percentile. The stable settled measurements show no observed frame-time regression in this workload. Chromium uses the repository's WebGL/software-rendering-capable test configuration; no physical-GPU or universal-device performance signoff follows. [Raw final invocation](0036-render-after.txt).

## Visual acceptance and limits

[Retained tile review](../art/reviews/slice24-tile-footprints.md) covers the actual ten paid improvements, equal-zoom city/town/camp comparison, far banners, narrow layout and remembered foreign field. Full declared sprite canvases are uniformly fitted into radius-29 hexes with inset 2; village/town/city caps are 26/30/34 world units, improvement 30 and ruin 28. Every published settlement variant and retained alpha bound is checked. No texture crop, body tint, canonical footprint change or army shrink is used.

[Retained map-management review](../art/reviews/slice24-map-management.md) records the corrected 680-pixel desktop cap, real narrow footer clearance, readable control widths and remaining clutter. The main integrator also inspected the [built paid-land screen](../art/reviews/slice24/production-map-paid-land.png).

Five advanced works still use distinct procedural glyphs, not finished bitmap props. Small far banners can blend into warm terrain. Native artwork loses fine detail when minified; this slice does not repaint it or claim pixel-perfect fractional scaling. Compact lists still spend too much space on disabled options, and narrow map controls obscure some adjacent terrain until panned. Full culture/background readability, large-campaign contact, the parallel Epic budget, physical-GPU battlefield performance and the remaining 1.0 scope stay open.

No commit, deployment or user-server shutdown was performed.
