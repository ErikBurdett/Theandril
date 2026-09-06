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

