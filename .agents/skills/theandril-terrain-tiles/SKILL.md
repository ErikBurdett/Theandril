---
name: theandril-terrain-tiles
description: Use for terrain art, hex tiles, coastlines, rivers, roads, biome transitions, map objects, settlements, tile seam validation, and strategic-map visual layering.
---

# Terrain & Hex Tiles

Theandril uses a giant strategic hex world.

Inspect actual hex orientation before creating assets.

Do not force square-tile assumptions onto the renderer.

Use layered composition:

base biome
→ elevation
→ transition
→ coast
→ river
→ road
→ vegetation
→ resources
→ settlement
→ world-state/magic overlay.

Prefer reusable layers/masks over one bitmap per combination.

Strong provider candidate:
- PixelLab for terrain/map-object/hex workflows where available.

Validate:
- seamless repetition;
- edge compatibility;
- river continuity;
- road continuity;
- coast consistency;
- palette;
- pixel grid;
- randomized large-map previews.

