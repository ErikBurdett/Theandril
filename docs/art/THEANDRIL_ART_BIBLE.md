# Theandril visual bible

Production direction for the original setting; read alongside [native asset standards](../../ART_STYLE_STANDARD.md), the repository pixel-art skill and [measured implementation status](ART_IMPLEMENTATION_STATUS.md). These standards describe intended assets, not proof that every animation or gameplay system exists.

## Mood and readability

Weathered dark fantasy inhabited by practical people: repaired iron, linen, timber, stone and deliberate traces of fire. Use adult proportions and clear equipment silhouettes. Grim does not mean uniformly black: keep readable medium-value bodies and reserve the deepest local-color outlines for separation. Light comes softly from upper left. Avoid glossy gradients, antialiasing, random single-pixel noise, enormous heads and symbols or costumes copied from other games.

The original `theandril-master-v1` palette has 64 colors in material ramps. Native runtime sprites use that exact palette and hard alpha. Generation supplies source designs; explicit geometric extraction, nearest fitting, palette normalization, real Pixel Snapper processing and editable Aseprite export produce candidates. Machine-valid pixels still require native/enlarged visual review and actual gameplay inspection.

## Authored cultures

Generated campaign seats inherit their actual stable faction definition. Player-edited realm names, numeric seat IDs and owner colors must never determine art identity.

| Culture | Materials and silhouette | Original heraldry |
| --- | --- | --- |
| Ashen Compact | Repaired charcoal iron, ochre/bone cloth, dull brass, square bucklers, aprons, patched cloaks, kiln-brick chimneys and low gabled workshops | Open square hearth with central ember diamond |
| Reedbound Council | Woven oval shields, weathered green cloth, reed/straw roofs, raised timber dwellings and river-working equipment | Three upright reeds within an open oval |
| Cinder March | Broad angular iron, rust-red cloth, squared shields, stepped masonry, practical watchtowers and forge hearths | Stepped watch-wall around a single ember |
| Glass Tide | Slate-blue and salt-linen cloth, curved shields, light stone, rigging details, blue gables and beacon towers | Hollow sail diamond above two broad horizontal bars |

Identity belongs in equipment, buildings and heraldry, not a whole-body tint that recolors skin and steel. Separate ownership outlines, selection rings, faction labels and accessible UI remain authoritative interaction cues. Public culture reference cards reveal no campaign locations or armies.

## First complete culture kit

Each of the four implemented cultures needs six current troop roles, three real character roles, three presentation-only settlement stages, crest, banner and badge: **15 assets per culture / 60 qualified assets**. A static first-facing kit is not a complete animation set. Future roster art must remain marked as future until a canonical consumer exists.

| Asset role | Native canvas | Anchor |
| --- | --- | --- |
| Colonist, scout, guard, spearman, heavy infantry; marshal, surveyor, engineer | 64×64 | Ground `(32,56)` |
| Cavalry; village and town | 96×96 | Ground `(48,80)` |
| City | 128×128 | Ground `(64,112)` |
| Crest | 64×64 | Center `(32,32)` |
| Banner, including pole foot | 64×64 | Ground `(32,56)` |
| Strategic badge | 32×32 | Center `(16,16)` |

Humanoid strategic figures may use approximately 50 painted pixels of height for readability; this is the foundation's explicit exception to the proposed smaller body target. Wider civilians/carts fit by whole-silhouette scale rather than stretching anatomy. Keep tips, poles, hooves and buildings enclosed in transparent native padding. Source sheets are not guaranteed to honor their requested grid: source-hash-bound, visually reviewed explicit rectangles are preferable to silently cutting off parts or including a neighbor. Never erase a painted background by treating a visible checkerboard as transparency.

## Animation, terrain and integration

Keep original source, revision/rejection reasons, exact prompt, unavailable model/seed fields, extraction bounds, processing hashes, Aseprite tags/timings and individual review evidence. New pixels invalidate review. Do not invent animation by repeating one frame or mirror asymmetric weapons/heraldry without explicit review. Future walk/attack/hurt/death and additional facings retain the same canvas, anchors and directional conventions; review each clip's actual motion.

Existing ten biome tiles use 64×64 native hex masks. Terrain variations, shore/river/road junctions and transition families remain separate production work. Buildings may deliberately overhang a hex; their ground anchors, ownership cues and selection hit regions must remain stable. Art never alters topology or canonical movement rules.

UI icons use native or exact half-size nearest-neighbor sampling. Art Lab uses integer 1/2/4/8× previews. The current world camera still fits art fractionally to its regular hex geometry: do not call it pixel-perfect. Far view groups actual observed armies into small faction badges and uses town banners; hidden enemies must never acquire render objects. Measure viewport/chunk pools and map atlas residency separately from the DOM's verified image cache. Publication is approved-only; missing assets retain explicit playable fallbacks.
