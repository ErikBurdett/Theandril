---
name: theandril-sprite-animation
description: Use for animated units, characters, monsters, directional sets, frame tags, pivots, attack/cast/walk cycles, PerfectPixel integration, and animation QA.
---

# Sprite Animation

Select a source workflow that can produce the requested motion. PerfectPixel
and other raster generators remain candidate providers; the current battle
roster uses original weighted Blender rigs, independently rendered native frames,
real Pixel Snapper processing and editable Aseprite exports. Read
`tools/art/blender-battle/units/README.md` before extending that family.

Production requirements:
- stable identity;
- stable pivot;
- consistent equipment;
- consistent palette;
- correct frame count;
- actual motion;
- readable silhouettes.

Default humanoid:
- idle 4–6;
- walk 6–8;
- attack 6–10;
- ranged 6–10 when needed;
- cast 6–10 when needed.

Use 8 directions only when the game benefits.

Mirroring is allowed only when asymmetrical weapons/armor do not make it incorrect.

Run:
- identity comparison;
- histogram/perceptual checks;
- pivot variance;
- frame count;
- palette checks;
- loop checks.

Aseprite should package approved animation states into deterministic sheet/tag exports.

The implemented shared battle contract has 13 role IDs `battle.unit.<role>`,
two separately rendered east/west facings and five states per facing. Foot
canvases are 64×64 with pivot (32,56); mounted/hulls are 96×96 with pivot
(48,80). Idle is four 200ms frames; walk/attack/death are eight 100ms frames;
hit is four 100ms frames. Hulls use sail/fire/sink names. Do not silently substitute
strategic culture sprites or claim shared role art as 312 culture originals.

Keep one camera scale, canvas and ground anchor for the entire motion union.
Validate relative limb/weapon motion against the actual recorded rig: translating
a frozen figure, horse or boat does not satisfy articulation. Validate hooves
relative to the horse, oars/sail panels/launcher relative to the hull, and real
grounded collapse or waterline sinking. Inspect every frame at 1× and enlarged
nearest-neighbor scale; importer checks alone are not visual approval.

`sourceClips` owns the complete state/direction matrix. Aseprite tags use
`state.direction`, with exact durations and stable frame IDs. Wide exports use
the bounded row grid; do not request a 6144px strip or trim frames independently.
Large per-frame processing logs live in a retained, SHA-256 bound receipt;
review and validation must include that receipt and the real editable export.

The battle renderer pools one sprite per canonical living member slot and one
per naval hull. Use only recorded movement, participant and killed-soldier IDs;
hold the exact death/sink pose through packet completion. Sprite animation cannot
apply damage, choose targets or mutate state. Check pause, skip, reduced motion,
resize and replay hashes in an actual browser. Load battle pages only on demand;
the world residency remains 17 MiB, with all five current pages totaling 53 MiB.
