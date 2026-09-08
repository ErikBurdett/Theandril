# Reviewed asset catalog

Published 2026-09-07: **506 approved assets,569 frames,489 current map/UI/battle/fallback bindings** (including six reviewed battlefield consumers). This includes [432 distinct faction assets covering all24 authored cultures](FACTION_ASSET_CATALOG.md), including72 independent naval hulls, plus24 biome variants. All use `theandril-master-v1` (64 colors), exact hard alpha. The unchanged `foundation`2048×2048 atlas remains2,628,301 PNG bytes /16MiB decoded, SHA-256 `e32c73be1b8789f8c554eea7c6b7204d40fae20e3347be36ccbd76de8a9740de`. The lazy `battle`1024² page adds26,100 PNG bytes /4MiB decoded. DOM icons can separately decode another page; this is not total presentation memory. The24-culture in-game review is complete for retained unit/settlement, naval, strategic and UI scenarios; the six new battlefield clips also have actual temporal-cast and field/siege/naval review. [Battlefield review](reviews/slice23-battlefield.md), [gallery evidence](FACTION_ASSET_CATALOG.md#current-in-game-review) and [art status](ART_IMPLEMENTATION_STATUS.md) distinguish native approval, publication and scoped runtime acceptance; none establishes all-UI or game1.0 signoff.

Every row is `ATLASED`; **live** means an existing observation-derived renderer consumes it, directly or as an explicit generic fallback. The tables below retain the 37 generic foundation assets, seven slice-12 land assets and 24 biome variants; the separate faction catalog links all 432 culture assets. Seventeen foundation assets remain future-only. Future rows can be inspected in development Art Lab but do not create units, resources, roads or magic rules. Production loads the shared approved page; unused frame presence is not proof of gameplay integration. The [runtime catalog](../../assets/art/runtime/catalog.json) carries exact rectangles, clips, pivots, source provenance, review and report paths. Each linked approval retains editable Aseprite/PNG/JSON and hash-bound review evidence outside the disposable cache.

The preceding six-culture release remains documented in [art implementation status](ART_IMPLEMENTATION_STATUS.md): 134 assets / 152 frames, 692,034 PNG bytes, hash `7a22a84c0c4623cea16327af27313e6796560024f38fbafde1491a0afe27ceb7`. Its browser and texture measurements are historical, not automatically transferred to the current 24-culture publication. Current [506-asset offline measurements](../performance/0035-art-after.json), [Huge-world capture](../performance/0035-world-art-render.json) and [isolated battlefield diagnostics](../performance/0035-battle-render.json) provide separate evidence. The preceding [72 live-hull inspections](../performance/0034-naval-art-inspection.json) remain applicable to the unchanged hull artwork; [final measurement limits](../performance/0035-battlefield.md) distinguish the changed schema, workloads and memory categories.

| Stable ID / retained approval | Native px | Pivot | Clip | Consumer |
|---|---:|---:|---|---|
| [effect.battle_melee](../../assets/art/approved/effect.battle_melee.json) |64×64|32,32|8×100ms attack/SE one-shot|Battle: actual strike facts|
| [effect.battle_projectile](../../assets/art/approved/effect.battle_projectile.json) |64×64|32,32|8×100ms attack/SE one-shot|Battle: actual ranged facts|
| [effect.battle_ember](../../assets/art/approved/effect.battle_ember.json) |64×64|32,32|8×100ms cast/SE one-shot|Battle: Cinder thread|
| [effect.battle_ward](../../assets/art/approved/effect.battle_ward.json) |64×64|32,32|8×100ms cast/SE one-shot|Battle: Bound ward / shield drill|
| [effect.battle_rally](../../assets/art/approved/effect.battle_rally.json) |64×64|32,32|8×100ms attack/SE one-shot|Battle: actual Rally|
| [character.waykeeper](../../assets/art/approved/character.waykeeper.json) |64×64|32,56|8×100ms cast/SE one-shot|Battle: attached paid caster, first pose at rest|
| [effect.magic](../../assets/art/approved/effect.magic.json) | 64×64 | 32, 32 | 4 × 125 ms one-shot | Future |
| [effect.melee](../../assets/art/approved/effect.melee.json) | 64×64 | 32, 32 | 4 × 100 ms one-shot | Future |
| [effect.movement](../../assets/art/approved/effect.movement.json) | 64×64 | 32, 32 | Static | Future |
| [effect.projectile](../../assets/art/approved/effect.projectile.json) | 64×64 | 32, 32 | 4 × 100 ms one-shot | Future |
| [effect.selection](../../assets/art/approved/effect.selection.json) | 64×64 | 32, 32 | Static | Future |
| [map.resource](../../assets/art/approved/map.resource.json) | 64×64 | 32, 48 | Static | Future |
| [map.ruin](../../assets/art/approved/map.ruin.json) | 64×64 | 32, 48 | Static | Live |
| [map.watchtower](../../assets/art/approved/map.watchtower.json) | 64×64 | 32, 48 | Static | Future |
| [monster.quarry_ogre](../../assets/art/approved/monster.quarry_ogre.json) | 96×96 | 48, 80 | Static | Future |
| [monster.revenant](../../assets/art/approved/monster.revenant.json) | 64×64 | 32, 56 | Static | Future |
| [monster.slateback](../../assets/art/approved/monster.slateback.json) | 128×128 | 64, 112 | Static | Future |
| [settlement.city](../../assets/art/approved/settlement.city.json) | 128×128 | 64, 112 | Static | Live |
| [settlement.town](../../assets/art/approved/settlement.town.json) | 96×96 | 48, 80 | Static | Live |
| [settlement.village](../../assets/art/approved/settlement.village.json) | 96×96 | 48, 80 | Static | Live |
| [terrain.alpine](../../assets/art/approved/terrain.alpine.json) | 64×64 | 32, 32 | Static | Live |
| [terrain.coast](../../assets/art/approved/terrain.coast.json) | 64×64 | 32, 32 | Static | Future |
| [terrain.desert](../../assets/art/approved/terrain.desert.json) | 64×64 | 32, 32 | Static | Live |
| [terrain.grassland](../../assets/art/approved/terrain.grassland.json) | 64×64 | 32, 32 | Static | Live |
| [terrain.hills](../../assets/art/approved/terrain.hills.json) | 64×64 | 32, 32 | Static | Future |
| [terrain.marsh](../../assets/art/approved/terrain.marsh.json) | 64×64 | 32, 32 | Static | Live |
| [terrain.ocean](../../assets/art/approved/terrain.ocean.json) | 64×64 | 32, 32 | Static | Live |
| [terrain.rainforest](../../assets/art/approved/terrain.rainforest.json) | 64×64 | 32, 32 | Static | Live |
| [terrain.river](../../assets/art/approved/terrain.river.json) | 64×64 | 32, 32 | Static | Future |
| [terrain.road](../../assets/art/approved/terrain.road.json) | 64×64 | 32, 32 | Static | Future |
| [terrain.steppe](../../assets/art/approved/terrain.steppe.json) | 64×64 | 32, 32 | Static | Live |
| [terrain.taiga](../../assets/art/approved/terrain.taiga.json) | 64×64 | 32, 32 | Static | Live |
| [terrain.temperate_forest](../../assets/art/approved/terrain.temperate_forest.json) | 64×64 | 32, 32 | Static | Live |
| [terrain.transitions](../../assets/art/approved/terrain.transitions.json) | 64×64 | 32, 32 | Static | Future |
| [terrain.tundra](../../assets/art/approved/terrain.tundra.json) | 64×64 | 32, 32 | Static | Live |
| [unit.cavalry](../../assets/art/approved/unit.cavalry.json) | 96×96 | 48, 80 | Static | Live |
| [unit.colonist](../../assets/art/approved/unit.colonist.json) | 64×64 | 32, 56 | 4 × 250 ms loop | Live |
| [unit.commander](../../assets/art/approved/unit.commander.json) | 64×64 | 32, 56 | Static | Future |
| [unit.guard](../../assets/art/approved/unit.guard.json) | 64×64 | 32, 56 | 4 × 250 ms loop | Live |
| [unit.heavy_infantry](../../assets/art/approved/unit.heavy_infantry.json) | 64×64 | 32, 56 | Static | Live |
| [unit.mage](../../assets/art/approved/unit.mage.json) | 64×64 | 32, 56 | Static | Future |
| [unit.scout](../../assets/art/approved/unit.scout.json) | 64×64 | 32, 56 | 4 × 250 ms loop | Live |
| [unit.spearman](../../assets/art/approved/unit.spearman.json) | 64×64 | 32, 56 | Static | Live |

## Retained slice-12 land assets

These land-production assets have exact canonical bindings, not road/watchtower substitutes:

| Stable ID / retained approval | Native px | Pivot | Clip | Consumer |
| --- | --- | --- | --- | --- |
| [terrain.ash_scrub](../../assets/art/approved/terrain.ash_scrub.json) | 64×64 | 32, 32 | Static | Live biome |
| [terrain.chalkland](../../assets/art/approved/terrain.chalkland.json) | 64×64 | 32, 32 | Static | Live biome |
| [improvement.terraced_fields](../../assets/art/approved/improvement.terraced_fields.json) | 64×64 | 32, 48 | Static | Live improvement |
| [improvement.managed_woodlot](../../assets/art/approved/improvement.managed_woodlot.json) | 64×64 | 32, 48 | Static | Live improvement |
| [improvement.quarry](../../assets/art/approved/improvement.quarry.json) | 64×64 | 32, 48 | Static | Live improvement |
| [improvement.reedworks](../../assets/art/approved/improvement.reedworks.json) | 64×64 | 32, 48 | Static | Live improvement |
| [improvement.shore_fishery](../../assets/art/approved/improvement.shore_fishery.json) | 64×64 | 32, 48 | Static | Live improvement |

## Three approved designs per biome

The twelve original biome bases each retain two independently generated, individually approved variants: **24 additional static terrain assets**, all 64×64 with pivot `(32,32)`. Stable seed/cell/biome selection chooses among the fixed base/variant1/variant2 list in cached terrain; missing variants fall back to the original base. This is artwork selection, not simulation RNG, new terrain rules or camera-dependent changes. [Source index](../../assets/art/source/biome-variants/generation.json), [individual decisions](reviews/slice21-biome-decisions.json) and mixed-repeat native/enlarged evidence retain the preceding release's review.

| Biome base | Variant 1 approval | Variant 2 approval |
| --- | --- | --- |
| [terrain.ocean](../../assets/art/approved/terrain.ocean.json) | [variant_1](../../assets/art/approved/terrain.ocean.variant_1.json) | [variant_2](../../assets/art/approved/terrain.ocean.variant_2.json) |
| [terrain.grassland](../../assets/art/approved/terrain.grassland.json) | [variant_1](../../assets/art/approved/terrain.grassland.variant_1.json) | [variant_2](../../assets/art/approved/terrain.grassland.variant_2.json) |
| [terrain.temperate_forest](../../assets/art/approved/terrain.temperate_forest.json) | [variant_1](../../assets/art/approved/terrain.temperate_forest.variant_1.json) | [variant_2](../../assets/art/approved/terrain.temperate_forest.variant_2.json) |
| [terrain.taiga](../../assets/art/approved/terrain.taiga.json) | [variant_1](../../assets/art/approved/terrain.taiga.variant_1.json) | [variant_2](../../assets/art/approved/terrain.taiga.variant_2.json) |
| [terrain.tundra](../../assets/art/approved/terrain.tundra.json) | [variant_1](../../assets/art/approved/terrain.tundra.variant_1.json) | [variant_2](../../assets/art/approved/terrain.tundra.variant_2.json) |
| [terrain.desert](../../assets/art/approved/terrain.desert.json) | [variant_1](../../assets/art/approved/terrain.desert.variant_1.json) | [variant_2](../../assets/art/approved/terrain.desert.variant_2.json) |
| [terrain.steppe](../../assets/art/approved/terrain.steppe.json) | [variant_1](../../assets/art/approved/terrain.steppe.variant_1.json) | [variant_2](../../assets/art/approved/terrain.steppe.variant_2.json) |
| [terrain.marsh](../../assets/art/approved/terrain.marsh.json) | [variant_1](../../assets/art/approved/terrain.marsh.variant_1.json) | [variant_2](../../assets/art/approved/terrain.marsh.variant_2.json) |
| [terrain.rainforest](../../assets/art/approved/terrain.rainforest.json) | [variant_1](../../assets/art/approved/terrain.rainforest.variant_1.json) | [variant_2](../../assets/art/approved/terrain.rainforest.variant_2.json) |
| [terrain.alpine](../../assets/art/approved/terrain.alpine.json) | [variant_1](../../assets/art/approved/terrain.alpine.variant_1.json) | [variant_2](../../assets/art/approved/terrain.alpine.variant_2.json) |
| [terrain.ash_scrub](../../assets/art/approved/terrain.ash_scrub.json) | [variant_1](../../assets/art/approved/terrain.ash_scrub.variant_1.json) | [variant_2](../../assets/art/approved/terrain.ash_scrub.variant_2.json) |
| [terrain.chalkland](../../assets/art/approved/terrain.chalkland.json) | [variant_1](../../assets/art/approved/terrain.chalkland.variant_1.json) | [variant_2](../../assets/art/approved/terrain.chalkland.variant_2.json) |

These variants reduce identical-stamp repetition; they are not a full biome-edge/shore transition family. Old and new palette/value differences can remain conspicuous, particularly the orange desert and snowy alpine bases.

## Qualified faction idle pilot

[unit.scout.ashen_compact revision 5](../../assets/art/approved/unit.scout.ashen_compact.json) has four genuine southeast idle frames, each 250 ms, looping on the same 64×64 canvas and `(32,56)` pivot. Original poses, alpha-edit rejection/replacement and common-anchor processing are retained in [animation provenance](../../assets/art/source/animations/unit.scout.ashen_compact-idle-generation.json). Native/playback review was completed for this preceding pilot. **The other 431 qualified faction assets, including all 72 ships, remain static.** This does not claim locomotion, attack, death, sinking or every-culture animation.

## Review findings and limits

- The generic guard, scout and caravan have four distinct idle poses, one southeast registration, and shared 64-pixel canvases/ground anchors. The qualified Ashen scout also has four genuine idle frames; the other 431 faction assets are single static registrations. No walk/attack/death or additional facings are claimed. All 72 culture-qualified naval hulls remain static at 96×96/pivot (48,80). Completing 24 authored base kits does not complete the 1.0 faction mechanics or animation set. Humanoid painted height is about 50 px: an explicit strategic-readability exception to the proposed 28–40 px body target; full long spears and cart groups can require smaller bodies.
- The preceding six regional additions used 90 selected land/UI originals from 95 actual built-in calls, with five rejected originals retained and separately generated replacements. Their [regional identities](../lore/FACTION_COHORT_12.md) and [review decisions](../../assets/art/source/faction-expansion/root-review-decisions.json) remain historical evidence. The latest twelve families add 216 separately generated selected originals (18 each), not recolors; source routes and individual approvals are indexed in [faction coverage](FACTION_ASSET_CATALOG.md). Art does not itself create exclusive troops, casters or magical faction mechanics.
- Melee, projectile and magic each have a four-frame non-looping clip. For this foundation, its schema state remains `idle`; it is a preview clip, not a wired combat event. The unused selection/movement raster assets are not the current selection effect; selected visible entities use an asset-local code-native silhouette contour and slow sparse glints, with reduced-motion handling.
- The unused road/river raster assets are single east–west pieces with matching terminal pixels, not complete junction/shore families. Actual observed hydrology and completed-road edges use separate code-native connected rendering; the future raster rows do not imply those gameplay systems are absent. `terrain.transitions` is one east-edge grass fringe. All eight overlays are original integer-authored source; the other 29 assets derive from the original generated sheets/revised revenant.
- Terrain repeats on the native hex lattice without interior alpha cracks. Three approved choices now exist per biome, but repeated motifs, old/new value differences and limited forest/rainforest separation remain art-production issues. Full biome-edge and shore transition families are unfinished.
- The original ash/chalk stamps remain flat and gap-free; their new variants add alternative designs without changing terrain rules. The five retained paid-improvement props use exact half-native presentation where possible; their art does not imply unobserved improvements. Spring garden, polder, grove archive, oreworks and tide observatory still use distinct procedural glyphs rather than approved pixel props.
- The first revenant passed machine checks but was [rejected](../../assets/art/rejected/monster.revenant.json) for a detached tablet. Version 2 was regenerated with connected arms/tablet and independently inspected at native/enlarged size. Rejected pixels/evidence are retained, never atlased.
- City art has deliberate multi-hex overhang. In-game screenshots check town/army offsets and ownership/range visibility; the regular hex projection still uses fractional sprite fit, not pixel-perfect gameplay zoom.
- Earlier twelve-culture galleries retain historical examples of busy terrain and colliding labels; later contextual labels and same-hex army aggregation reduce clutter. The [current 24-culture galleries](FACTION_ASSET_CATALOG.md#current-in-game-review) have been visually inspected, including complete village/town/city silhouettes, all 72 ships, public crests and narrow cards. This is scoped acceptance of those views, not a claim that every possible composition is finished. The separate historical narrow-menu screenshot artifact remains open even though raw canvas captures are clean.

See [tool/source provenance](TOOLCHAIN_PROVENANCE.md), [initial decisions](reviews/foundation-initial.json), [revision/overlay decisions](reviews/foundation-revision-and-overlays.json), and [performance](../performance/0006-art-factory.md). These approvals accept this foundation's observed limits; they are not full game 1.0 or final art-direction signoff.
