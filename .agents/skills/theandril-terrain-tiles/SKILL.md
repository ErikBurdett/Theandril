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

## Hearth development

Derive neighborhood occupation from observed population, buildings and claimed
cells. Reserve real improved tiles and active tile-work targets; never populate
unclaimed land, water, peaks or unseen enemy territory using a current town's
state. A previously seen claim is not current building/construction knowledge.
Private production and land-work queues stay private in spectator projections.

Use the existing district selector and dirty chunk cache. Ground clearing,
housing, civic artwork and work-in-progress scaffolds are presentation; district
lanes do not create movement roads or yields. Keep their counters separate.
Prefer a sparse street hierarchy and muted broken ground over a high-contrast
line between every neighboring district. Review a developed town at equal zoom:
flat civic icons can pass visibility tests while visibly clashing with the
published pixel art. Use the approved architectural family where available.

Check actual paid construction, cancellation, saved restoration, completion,
population growth and fog changes, then inspect normal/near/far/narrow images.

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
