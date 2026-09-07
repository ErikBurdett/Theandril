# Reviewed asset catalog

Published 2026-09-06: **260 approved assets, 278 frames, 243 current map/UI/fallback bindings**. This includes [216 distinct faction assets covering all twelve authored cultures](FACTION_ASSET_CATALOG.md), including 36 independent naval hulls. All use `theandril-master-v1` (64 colors), exact hard alpha, and the `foundation` 2048×2048 atlas: 1,333,608 PNG bytes / 16,777,216 decoded RGBA bytes (16 MiB). SHA-256: `05a92bd0da46c4321138a075105cc941b278364d8ef0e6ca72584ad365b111fa`. Reversed-input publication is exact. DOM icons can separately decode another 16 MiB page; this is not included in Pixi's residency estimate. [Art status](ART_IMPLEMENTATION_STATUS.md) separates source/native approval, current runtime review and historical gallery evidence. The separate narrow-menu ghost artifact remains unresolved, so this is not all-UI visual or 1.0 signoff.

Every row is `ATLASED`; **live** means an existing observation-derived renderer consumes it, directly or as an explicit generic fallback. The tables below retain the 37 generic foundation assets and seven land assets; the separate faction table links all 216 culture variants. Seventeen foundation assets remain future-only. Future rows can be inspected in development Art Lab but do not create units, resources, roads or magic rules. Production loads the shared approved page; unused frame presence is not proof of gameplay integration. The [runtime catalog](../../assets/art/runtime/catalog.json) carries exact rectangles, clips, pivots, source provenance, review and report paths. Each linked approval retains editable Aseprite/PNG/JSON and hash-bound review evidence outside the disposable cache.

The preceding six-culture release remains documented in [art implementation status](ART_IMPLEMENTATION_STATUS.md): 134 assets / 152 frames, 692,034 PNG bytes, hash `7a22a84c0c4623cea16327af27313e6796560024f38fbafde1491a0afe27ceb7`. Its browser and texture measurements are historical, not automatically transferred to the twelve-culture publication.

| Stable ID / retained approval | Native px | Pivot | Clip | Consumer |
|---|---:|---:|---|---|
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

## New land assets

The new land-production assets have exact canonical bindings, not road/watchtower substitutes:

| Stable ID / retained approval | Native px | Pivot | Clip | Consumer |
| --- | --- | --- | --- | --- |
| [terrain.ash_scrub](../../assets/art/approved/terrain.ash_scrub.json) | 64×64 | 32, 32 | Static | Live biome |
| [terrain.chalkland](../../assets/art/approved/terrain.chalkland.json) | 64×64 | 32, 32 | Static | Live biome |
| [improvement.terraced_fields](../../assets/art/approved/improvement.terraced_fields.json) | 64×64 | 32, 48 | Static | Live improvement |
| [improvement.managed_woodlot](../../assets/art/approved/improvement.managed_woodlot.json) | 64×64 | 32, 48 | Static | Live improvement |
| [improvement.quarry](../../assets/art/approved/improvement.quarry.json) | 64×64 | 32, 48 | Static | Live improvement |
| [improvement.reedworks](../../assets/art/approved/improvement.reedworks.json) | 64×64 | 32, 48 | Static | Live improvement |
| [improvement.shore_fishery](../../assets/art/approved/improvement.shore_fishery.json) | 64×64 | 32, 48 | Static | Live improvement |

## Review findings and limits

- The generic guard, scout and caravan have four distinct idle poses, one southeast registration, and shared 64-pixel canvases/ground anchors. All 216 faction assets are single static southeast poses; no walk/attack/death or additional facings are claimed. These include all 36 current culture-qualified naval hulls at 96×96/pivot (48,80), not the entire intended 1.0 roster. Twelve cultures is progress toward twenty-four, not completion. Humanoid painted height is about 50 px: an explicit strategic-readability exception to the proposed 28–40 px body target; full long spears and cart groups can require smaller bodies.
- The six additions use 90 selected per-role originals from 95 actual built-in calls, with five rejected originals retained and separately generated replacements. Their [regional identities](../lore/FACTION_COHORT_12.md) and [individual review decisions](../../assets/art/source/faction-expansion/root-review-decisions.json) do not create exclusive troops, casters or magical faction mechanics.
- Melee, projectile and magic each have a four-frame non-looping clip. For this foundation, its schema state remains `idle`; it is a preview clip, not a wired combat event. Selection/movement artwork does not replace the existing accessible Graphics interaction overlays yet.
- Road/river are single east–west pieces with matching terminal pixels, not complete junction/shore families. `terrain.transitions` is one east-edge grass fringe. All eight overlays are original integer-authored source; the other 29 assets derive from the original generated sheets/revised revenant.
- Terrain repeated on the native hex lattice has no interior alpha cracks, but conspicuous dark bevel/stamp repetition and limited forest/rainforest separation remain art-production issues. Full biome-edge transitions, variation and gameplay road/river semantics are unfinished.
- The new ash/chalk stamps are flat and gap-free on the native repeat lattice, but their single-source patches visibly repeat. The five new paid-improvement props use exact half-native presentation where possible; their art does not imply unobserved improvements or ships.
- The first revenant passed machine checks but was [rejected](../../assets/art/rejected/monster.revenant.json) for a detached tablet. Version 2 was regenerated with connected arms/tablet and independently inspected at native/enlarged size. Rejected pixels/evidence are retained, never atlased.
- City art has deliberate multi-hex overhang. In-game screenshots check town/army offsets and ownership/range visibility; the regular hex projection still uses fractional sprite fit, not pixel-perfect gameplay zoom.
- The accepted twelve-culture galleries retain busy terrain and colliding long army labels in dense placements. Correct art bindings and complete silhouettes do not establish final composition quality. The separate narrow-menu screenshot artifact remains open even though raw canvas captures are clean.

See [tool/source provenance](TOOLCHAIN_PROVENANCE.md), [initial decisions](reviews/foundation-initial.json), [revision/overlay decisions](reviews/foundation-revision-and-overlays.json), and [performance](../performance/0006-art-factory.md). These approvals accept this foundation's observed limits; they are not full game 1.0 or final art-direction signoff.
