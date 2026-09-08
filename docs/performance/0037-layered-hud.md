# Layered HUD and opaque town fitting — slice 25

2026-09-07, inspected worktree at `b17900d`. This changes presentation and browser navigation, not campaign rules, schema 14, roster 4, generator 7 or content `b6e3bce2`.

## Workload and comparison boundaries

`tests/gameplay/art-performance.spec.ts` imports the same strict Huge fixture before and after: 196,608 cells, 1,500 global singleton armies, 32 towns, fully explored terrain but ordinary observed-entity fog. State hash is `b14aa18a`, packed cells 1,769,695 bytes, complete transfer 1,974,826 bytes. Five warmed near/pan/far stages use actual canvas input; no turns or simulation optimization is measured. Rolling 240-frame p95 is not an independent per-stage tail distribution.

At the same 1440×1000 browser viewport, replacing side panels changes the actual canvas from 890×786 to 1440×696. Different aspect/visible neighborhoods mean this is an unchanged-state presentation comparison, **not** a matched-camera speedup claim. The before sample has rolling p95 16.7–16.8 ms, maximum 26 cached chunks and 104 MiB estimated power-of-two backing. [Raw before](0037-map-before.json).

The final quiet single-worker renderer run retains **16.7–16.8 ms** rolling p95, with **18 chunks / 72 MiB** maximum cache backing for the changed viewport. First-art CPU is 63.3→61.6 ms and art-load time 296.8→340.8 ms; single samples are not robust startup percentiles or a startup-speedup claim. The state hash and both transfer-byte counts remain exact. No other benchmark/build ran concurrently; the two navigation cases followed this measurement, not alongside it. [Raw after](0037-map-after.json), [actual three-case invocation](0037-browser-last.txt).

Both published PNGs are unchanged: 506 approved assets / 569 frames; the map's 2048² atlas is 16 MiB decoded and the lazy battle page adds 4 MiB. Three separate Card Shop DOM materials add 68,784 download bytes and potentially 2.0625 MiB decoded RGBA. These estimates exclude other textures, pools, browser DOM decodes and GPU allocations. Cached opaque town geometry is calculated once per asset, not by scanning pixels for each town or frame.

## Verification record

Whole typecheck and ESLint pass after the explicit map-focus corrections. Content validation passes with unchanged `b6e3bce2`. The final headless run passes **1,434/1,437 across 154 files**, zero skips, **68.28 seconds**. Its three failures retain the unchanged Standard/four-seat contact target, Huge/32-seat target (31/32) and Epic's 60-second parallel archive budget (63.680 seconds actual). [Final headless output](0037-headless-final.txt), [first checkpoint](0037-headless-full.txt).

The production build passes in 2.932 seconds: main JS 913.12 kB / 281.10 kB gzip; CSS 95.37 kB / 18.88 kB gzip; worker 606.86 kB. The existing >500 kB chunk advisory and upstream Zod annotation warnings remain visible, not suppressed. These are bundler-reported decimal sizes, not measured network latency. [Exact build output](0037-build.txt).

The retained broad Chromium checkpoint passes 114/125 in 11.8 minutes. [Complete raw run](0037-browser-checkpoint.txt). Its failures were investigated rather than suppressed: two interrupted pages during development-server source reload, two genuine focus-restoration paths, stale window/title inspection assumptions, a same-ID import completion race, and an opaque-body versus external-contour diagnostic mismatch. The all-culture visual case reached its final cohort before its unchanged 45-second case limit; it is now four independently imported six-culture cases using the same complete 24-culture/72-town world, preserving all art/fog/hash assertions. No global timeout, paid-action assertion or world fixture was reduced.

The new dedicated HUD cases cover full-width layout, a 320-pixel compact army popup, unchanged 420-pixel town actions, one current town-detail consumer and 390×844 at 130% text. Native-window focus checks include a removed popup opener, a still-connected tray opener, registry selection, real arrow-key map panning and character Locate from a nested window. Browser commands continue to go through actual UI controls, with no debug state mutation.

The corrected UI/movement/faction/land/battle follow-up passes **51/52 in 4.2 minutes**; the remaining large-empire test reached its final map-return button and exposed an ambiguous locator matching both the modal and tray controls. Scoping that one locator to the actual modal then passes both registry cases; the final renderer/registry invocation is **3/3 in 33.2 seconds**, with no runtime change between these last two runs. The 114/125 broad checkpoint plus these follow-ups cover every current **129** scenario (one broad gallery became four cases, and nested-character Locate adds one), but this is **not one 129/129 invocation**. [UI follow-up](0037-browser-final-ui.txt), [final correction and render](0037-browser-last.txt).

The actual built bundle passes **3/3 in 9.3 seconds**: real paid map construction and cancellation/save restoration, exact saved battlefield/manual-ability outcomes and watch-only fog controls, all without development hooks. [Production output](0037-production.txt).

## Limits

The [dense 1,500-army/18,000-formation synthetic case](0037-army-stacks.json) retains all containers while drawing 273 representative figures for 91 groups; some frame samples remain around 33.4 ms. The [20-versus-20 battlefield](0037-battle-render.json) passes its functional/boundedness check with at most 46 actors/five effects and 20 MiB of atlas residency, but frame p95 remains 33.4 ms. These are not universal 60 fps or physical-GPU signoffs. Large-map contact, full-parallel Epic timing, mature long-campaign balance and the broader 1.0 scope remain open.

[Architecture](../architecture/0032-layered-campaign-hud.md), [visual review and retained correction](../art/reviews/slice25-hud-and-towns.md), [status](../IMPLEMENTATION_STATUS.md).
