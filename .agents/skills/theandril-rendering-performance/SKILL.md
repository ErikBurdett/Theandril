---
name: theandril-rendering-performance
description: Use when modifying PixiJS map rendering, camera/zoom, chunk layers, labels, effects, fog, selection, hit testing, asset loading, sprite batching, or browser frame-time performance.
---

# Theandril Rendering & Performance

Use the installed official PixiJS Agent Skills in addition to this repository skill. Repository rules win on conflict.

## Ownership

Pixi renders a view of state. Pixi objects are never canonical gameplay entities.

React owns DOM UI and must not own one component/state atom per map cell or army.

## Render only what matters

Use:
- viewport culling;
- chunk-level visibility;
- LOD;
- cached static chunk layers;
- dirty rebuilds;
- sprite/object pooling;
- atlases;
- batching;
- BitmapText where appropriate;
- spatial index for picking.

At far zoom, aggregate:
- armies;
- labels;
- resource icons;
- minor visual detail.

Keep figure scale separate from the nonuniform terrain-to-hex transform. Use
uniform, bounded screen sizing for units and far heraldry; fit town/improvement
opaque silhouettes to their inset hex at detailed zoom. Source-canvas padding
must not determine the visible size. Near tile footprints and far screen-space
markers have different containment contracts; report them honestly in diagnostics.
Separate co-located town/army markers at far zoom and hide all marker ground
layers when switching to the world-overview raster.

Hearth layouts rebuild only on observation changes, using the claim index and
linear walks over actual claims. Claims are uncapped in modern rules; avoid
repeated array shifts, global claim scans per town, or hard housing limits.
Cache static district artwork with terrain; invalidate
affected chunks when buildings, work, ownership or visibility change. Never
recompute districts or scan all claimed cells on every camera frame.

## Main-thread rules

Never:
- scan all map cells per frame;
- rebuild all borders every frame;
- allocate thousands of temporary objects per frame;
- send entire simulation snapshots to renderer every animation frame;
- trigger React rerenders from map camera movement unless UI actually needs it.

## Profiling

For a render change:
1. capture baseline using named huge-map scenario;
2. make change;
3. measure frame time, visible objects, chunk rebuilds, and transfer size;
4. retain the change only if it improves the intended behavior without breaking visual correctness.

Production baseline is WebGL. WebGPU is optional/feature-flagged until tested against supported browsers.

## Political overview and individual battles

Political overview colors only supplied, permitted cell ownership. Remembered
territory remains dimmed by fog; filtering a faction never reveals unseen cells.
Update its raster on observation or filter changes, not camera frames, and retain
one bounded world raster. Normal and reveal-all permissions require separate tests.

Individual battle anchors use recorded forward/lateral positions. Place living
soldiers by their canonical stable original slots; casualties leave holes and
never recenter survivors. Reconstruct movement, cohesion deltas and exact killed
IDs from facts, retain killed actors for one-shot death playback, and interpolate
presentation without advancing simulation. Scale initial slot grids at narrow
widths while retaining every member identity; ships remain one hull per formation.
