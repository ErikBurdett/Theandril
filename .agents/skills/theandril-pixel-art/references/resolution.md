# Native resolution and asset families

These production starting points cover Theandril's dense strategic hex map, small tactical formations, readable illustrated UI, and 196k–307k-cell worlds. Many families are now published; consult the current catalog and art status for exact sizes and coverage. Confirm changes in a representative scene before mass production.

## One pixel has one scale within a scene

Author at native resolution. A 64×64 frame contains 4,096 source pixels regardless of device pixel ratio. Export 1× PNG with transparency, not a pre-enlarged sheet; use nearest-neighbor integer enlargement for review. Do not enlarge one 32-pixel figure beside a natively drawn 64-pixel figure and pretend they share a pixel density. Tactical art may use a distinct camera/detail scale, but that whole scene must be consistent.

| Family | Native source canvas | Anchor / use |
| --- | --- | --- |
| Strategic ground / biome tile | 64×64 | Center (32,32); 56×64 pointy-top logical footprint below |
| Coast/river/road/border transition | 64×64 | Same center and six edge indices as ground; separate overlays |
| Trees, rock, resource, improvement | 64×64; tall 64×96 | Ground anchor (32,48), or (32,80) for tall frames; ground artwork surrounds its own anchor |
| Strategic humanoid/caravan | 64×64 | Feet (32,56); standing humanoid silhouette roughly 28–40 px tall, plus equipment |
| Strategic mount, siege engine, large creature | 96×96 | Ground (48,80); logical occupied cell stays canonical |
| Strategic village/town/fort | 96×96 | Ground (48,80); crop-safe roof space |
| Exceptional landmark/capital | 128×128, up to 192×192 if reviewed | Explicit ground anchor and overhang/occlusion test; not every town |
| Far/mid army or town glyph | 16×16 / 32×32 | Separate hand-simplified LOD; do not shrink detailed units to noise |
| Tactical humanoid | 96×96 | Feet (48,80); standing figure approximately 44–56 px tall, room for weapon arcs |
| Tactical cavalry / wide creature | 128×128 | Ground (64,112); do not stretch humanoid texture |
| Tactical exceptional monster | 192×192 | Reviewed silhouette and ground anchor, only for real content |
| Battlefield ground patch / obstacle | 64×64 / 128×128 | Repeatable surface or explicit footprint; separate from strategic geography |
| Small world/tactical impact, spark, projectile | 32×32 / 64×64 | Explicit impact or trajectory anchor; 128×128 for substantial spell effect |
| Large localized spell/weather effect | 256×256 maximum baseline | Tile/pool pieces when possible; never a full-world transparent sheet |
| Character bust / roster portrait | 128×160 | Compose face for 64×80 thumbnail; author simplified thumbnail when needed |
| Major character / diplomacy portrait | 192×240 | Display at 1×/2× when space permits; static, loaded on demand |
| Faction crest / banner | 64×64 / 32×64 | Separate 16×16 or 24×24 insignia for registries |
| Resource/status/action icon | 16×16, 24×24, or 32×32 | Choose the actual UI slot; create another native variant when needed |
| Technology, building, unit card illustration | 96×96 | Optional 48×48 simplified catalog version |
| UI frame/corner/button ornament | 16×16 pieces or 48×48 nine-slice source | Fixed integer border widths; stretch only texture-safe center/edges |
| Cursor / selection ornament | 32×32 cursor; 64×64 hex ornament | Explicit hotspot; actual controls retain larger accessible hit areas |
| Chronicle chapter vignette | 384×216; narrow variant 256×144 | Static 16:9; native or integer display/crop, never render historical text into it |
| Menu / victory backdrop | 640×360 | 3× at 1920×1080; crop/letterbox as needed, responsive DOM UI separately |
| Wide parallax background layer | 640×360 or 1280×360 strip | Seamless only if it actually scrolls; load only on that screen |

Dimensions are canvas bounds, not forced visible body size. Keep silhouettes/anchors stable throughout each action. Transparent space may be packed away while metadata retains the original canvas. A tiny trinket does not need its own 64×64 GPU allocation when packed, and a portrait should not be animated into dozens of high-resolution frames without a specific need.

## Future pixel hex layout

Proposed integer presentation grid: a pointy-top hex with polygon boundary coordinates `(32,0), (60,16), (60,48), (32,64), (4,48), (4,16)` within the 64×64 source canvas. Cell centers are 56 px apart horizontally, 48 px per row, with odd rows shifted 28 px. Adjacent boundary edges meet exactly; leave non-footprint pixels transparent. Boundary coordinates are geometric edges, not an instruction to write outside the last pixel index (63).

This intentionally approximates a regular hex on an integer lattice. The **current** procedural renderer uses radius 29, width `sqrt(3) × 29`, row step 43.5. Do not silently mix the two grids. A later conversion must change projection, picking, camera focus, chunk bounds, route/range overlays and tests together, leaving canonical odd-row cell indices/neighbors unchanged. Until that conversion, treat the new tile geometry as a specification, not a drop-in runtime atlas.

Ground anchors for props/units/towns need not equal the ground tile's texture center. Current detailed town/improvement artwork fits its opaque frame union within its own inset hex; transparent canvas corners may extend beyond it. Neighborhood sprawl uses separate occupied claimed tiles rather than enlarging the central sprite across neighbors. Unit groups and screen-sized far markers retain deliberate overhang. Sprites never define movement, terrain, collision, or selection ownership: pick the canonical hex/observed entity and preserve a clear base/banner.

Index overlay edges in canonical neighbor order `e, se, sw, w, nw, ne`. Number the polygon vertices above 0–5: those edges are respectively `(1,2), (2,3), (3,4), (4,5), (5,0), (0,1)`. Author six edge treatments and their joining corner caps against this template; test two-edge and three-biome junctions. Derive coast masks from known physical water, vegetation transitions from known biome IDs. Resolve shared corners in a fixed layer/order so neighboring tiles do not double-darken the seam or leave gaps.

## Displays and zoom

Review desktop at 1920×1080 and 1366×768, the established gameplay viewport 1440×1000, and narrow 390×844, including device scale factors 1 and 2. Keep DOM UI typography and controls responsive and crisp. Do not shrink the entire app into a low-resolution framebuffer to achieve pixel art.

The current chronicle dialog's inner content is narrower than 384 px on a 390 px screen. Use the 256×144 native vignette there, deliberately crop a composition with a marked safe area, or omit the optional ornament; do not force a 384 px image into horizontal overflow or crop the historical text.

Near zoom: crisp detailed sprites at native/integer effective screen scale. Mid zoom: simplified props, banners, fewer animations. Far zoom: cached biome mass, coastlines, ownership and aggregated icons. Continuous camera zoom is still useful; use reviewed LOD changes rather than claiming `nearest` filtering makes arbitrary fractional scales pixel-perfect. Camera settling/snap is a presentation decision and must not make panning, pointer picking or touch zoom jump unpredictably.
