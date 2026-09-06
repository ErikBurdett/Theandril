# Pixel integration and acceptance

## Version-aware Pixi integration

Inspect the lockfile and installed types before coding. The initial skill was checked against local PixiJS 8.20.1. Sprite/assets subskills may not be installed; use the Pixi skill router and official docs for missing API guidance, not v7 examples. As checked locally, filtering belongs to the shared `TextureSource` (`texture.source.scaleMode = 'nearest'`), and source mip generation is configurable with `autoGenerateMipmaps`. Avoid obsolete `BaseTexture`/global `SCALE_MODES` recipes. [Pixi v8 migration reference](https://pixijs.com/8.x/guides/migrations/v8).

For pixel layers start with nearest sampling, no automatic mipmaps on packed detailed sheets, and antialias disabled for their render target. Use independently authored/cached LOD for minification. `roundPixels` or snapping the final presentation position helps alignment but cannot correct fractional scale or mismatched native grids. Test CSS size, backing-buffer resolution, device-pixel ratio, camera scale and atlas sampling together. Keep UI text at native responsive DOM resolution.

No pipeline flag can repair badly registered frames or inconsistent art scale. Avoid blanket blur, glow, full-screen grain or color grading that destroys faction cues. Keep selection/range/path/attack indicators in a clean top layer, with shape and text equivalents. Masking/fog must not reveal unrevealed units, landmarks, roads or resources through translucent art overhangs.

## Keep the existing scale architecture

World assets stay in culled chunks and visible pooled markers; React keeps panels and compact read models. Do not instantiate a sprite per world cell or update thousands of offscreen animation frames. Static terrain variants are baked/cached per dirty chunk; animate only visible water/effects where valuable. Sort only dirty visible groups, not the entire empire each frame. Destroy pooled instances without destroying shared atlas textures; unload atlas pages when their last scene/consumer releases them.

Use spatial indexes for picking and stable observation-derived IDs for instances. Terrain, ownership overlays, ranges, travel paths, entities, labels and effects have explicit render order. Chunk caches must be rebuilt when relevant art/fog/biome data changes; hovering a destination must not rebake the terrain atlas.

## Initial budgets, then measure

The engineering frame guardrails remain `docs/PERFORMANCE_BUDGETS.md`: ordinary interaction aims for 16.7 ms and avoids sustained frames over 33 ms. A starting resident **asset atlas** target is 128 MiB desktop / 64 MiB narrow-device profile, excluding framebuffer and terrain caches; these are proposed allocation budgets, not measurements or guaranteed device capacities. Count caches and render targets separately in the total. Prefer reduced scene residency and LOD before degrading DOM readability.

RGBA8 page storage without mipmaps is width × height × 4 bytes: 1024² = 4 MiB, 2048² = 16 MiB, 4096² = 64 MiB. PNG download size does not indicate GPU residency. Mip chains add approximately one third if enabled; duplicated sources and chunk render targets add further storage. Check runtime texture limits rather than assuming every device accepts the largest page. Load tactical kits and portraits on demand; do not preload a future full faction roster into the strategic map.

Before/after evidence must include p50/p95 frame interval and render CPU, visible chunks/entities/labels, chunk rebuilds, draw calls/batches where measured, atlas page/resident-byte estimates, transfer bytes, cold upload and warm pan/zoom. Name hardware, renderer/backend, browser, viewport/DPR, zoom, map seed and entity population. A fog-limited starting viewport is not proof of fully explored mature-empire performance. Separate asset-size estimates from measured GPU memory and note unavailable counters.

## Ship a coherent slice

For the future conversion, begin with one scene containing at least grass/forest/coast transitions, a town, caravan, wayfinder, guard, foreign banner, fog edge, selected range, queued path and interrupted-route marker. Check native, 2×, mid and far LOD; color-vision/grayscale separation; desktop/narrow; pointer, keyboard and touch; reduced motion. Confirm click targets still match the canonical cells when figures overhang them.

Run typecheck, lint, relevant unit tests, Playwright gameplay and screenshot review, deterministic movement/combat/save/replay checks, and the named Huge rendering scenario. For atlas/importer code add malformed-frame, out-of-bounds, missing-key and invalid-duration tests. No visual change may alter victory timing or archived command results. Update status to separate shipped sprite families, procedural fallbacks and unbuilt art. Do not count this skill or a contact sheet as a completed visual overhaul.
