# Art direction: the weathered hearthlands

The world is old, dangerous, inhabited, and worth rebuilding. Favor broken witness-stones, salt-scoured masonry, repaired mail, peat-black timber, tarnished brass, patched banners, bone-colored vellum, wet reeds, and low ember light. Avoid making every biome black or every person a skull-armored villain. Civilian work and fragile settlements give the darkness meaning.

## Readable grit

- Use clustered pixels and broad value masses: dark recess, readable midtone body, restrained worn edge/light. Texture follows material and planes; isolated bright noise is not detail.
- Start with roughly 12–20 opaque colors per humanoid, 6–10 per small terrain variant, and 24–32 per portrait. These are review heuristics, not a global color ceiling. Share material ramps across related assets.
- World palette anchors: soot `#202328`, peat `#343B33`, wet slate `#536368`, ash `#929184`, old linen `#C1B597`, rust `#84533F`, dull brass `#A38B55`, ember `#C77845`. These are starting swatches; check against the actual terrain and overlays. Reserve near-black for separation and the brightest values for cues/highlights.
- Use a consistent upper-left diffuse light. Emitters may add localized warm light, but ordinary units remain readable without bloom. Keep most sprite silhouettes opaque; reserve graded alpha for purposeful smoke/mist/effects, not accidental antialiasing.
- Favor selective outlines against terrain and readable negative spaces around weapons. Damage, fatigue, and occupation must retain their textual/icon cues; art alone is not authoritative status.
- Unit roles must differ at thumbnail size: caravan load/harness, wayfinder's travel kit and open silhouette, oathguard's shield/close armor. Draw original equipment; these are roles, not fixed costume licenses.
- Keep faction colors on a separated banner/tabard/shield plane. Do not globally tint skin, steel, wounds, and vegetation into the faction color. Pair color with original insignia/shape; hostile, neutral, friendly, selected, and queued states must be distinguishable without hue.

## Biome vocabulary

Use the canonical biome list in `packages/mapgen`, not an independent artist-defined gameplay enum. The same physical hills can carry different vegetation/surface treatments.

Temperate grassland has worn straw and low weeds; forest has moss and irregular broadleaf crowns; taiga has narrow dark conifers; tundra has low frost and exposed stone; steppe has sparse ochre tufts; desert has scoured sand and dark rock; marsh has reeds, peat pools and broken reflections; rainforest has broad layered leaves and humid shadows; alpine has fractured pale ridges; open water uses muted bands of reflected sky. If current biome IDs differ, map these visual concepts explicitly rather than inventing new IDs in the renderer.

Avoid a single repeated stamp: begin with 4 ground variants per biome, 3 vegetation silhouettes where relevant, and distinct adjacency treatments. Variation is deterministic from presentation seed/cell coordinates and does not consume the simulation RNG. Rivers, roads, ruins and landmarks are overlays, not biome replacements. Never draw a bridge, road, resource, or usable site that the observation does not actually expose.

## Shared world, distinct cultures

Read lore before defining faction kits. Introductory cues: Ashen Compact—repaired craft tools and oath-marked cloth; Reedbound Council—woven reeds and water-weathered wood; Cinder March—upland stone and patched defensive iron; Glass Tide—salt wear, charter seals and coastal rigging. Avoid treating these four preliminary identities as a completed faction roster or inventing canonical religions/history through costumes alone.

Portraits, settlement roofs, unit cloth, technology illustrations, and the history tome should share these material ramps. UI remains legible DOM text with restrained pixel ornament, not a raster screenshot scaled to fit.

## Provenance

For each accepted asset record a stable asset ID, associated content IDs, source path, output paths, creator/tool and version where known, origin/license or generation prompt/reference IDs, modification notes, native dimensions, palette family, and approval state. Keep user-provided references identified as references rather than licenses. Prefer a repo asset manifest once actual assets are produced; do not fabricate entries or author names for future placeholders.
