# Reviewed asset catalog

Published 2026-09-05: **97 approved assets, 115 frames, 80 current map/UI/fallback bindings**. This includes [60 distinct faction assets covering all four implemented cultures](FACTION_ASSET_CATALOG.md). All use `theandril-master-v1` (64 colors), exact hard alpha, and the `foundation` 1024×1024 atlas: 492,790 PNG bytes / 4 MiB decoded RGBA. SHA-256: `59bfd5e96f75f235bbe528b416a8bfb25e44f9965f7a002cb3440afd252e3b90`. DOM icons can separately decode the same 4 MiB page; this is not included in Pixi's residency estimate.

Every row is `ATLASED`; **live** means an existing observation-derived renderer consumes it, directly or as an explicit generic fallback. The table below retains the 37 generic foundation assets; the separate faction table links all 60 culture variants. Future rows can be inspected in development Art Lab but do not create units, resources, roads or magic rules. Production loads the shared approved page; unused frame presence is not proof of gameplay integration. The [runtime catalog](../../assets/art/runtime/catalog.json) carries exact rectangles, clips, pivots, source provenance, review and report paths. Each linked approval retains editable Aseprite/PNG/JSON and hash-bound review evidence outside the disposable cache.

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

## Review findings and limits

- The generic guard, scout and caravan have four distinct idle poses, one southeast registration, and shared 64-pixel canvases/ground anchors. The new faction kits are static first-facing poses; no walk/attack/death or additional facings are claimed. They cover every current troop/character role, not the entire intended1.0 roster. Humanoid painted height is about 50 px: an explicit strategic-readability exception to the proposed 28–40 px body target, inspected in the current map camera.
- Melee, projectile and magic each have a four-frame non-looping clip. For this foundation, its schema state remains `idle`; it is a preview clip, not a wired combat event. Selection/movement artwork does not replace the existing accessible Graphics interaction overlays yet.
- Road/river are single east–west pieces with matching terminal pixels, not complete junction/shore families. `terrain.transitions` is one east-edge grass fringe. All eight overlays are original integer-authored source; the other 29 assets derive from the original generated sheets/revised revenant.
- Terrain repeated on the native hex lattice has no interior alpha cracks, but conspicuous dark bevel/stamp repetition and limited forest/rainforest separation remain art-production issues. Full biome-edge transitions, variation and gameplay road/river semantics are unfinished.
- The first revenant passed machine checks but was [rejected](../../assets/art/rejected/monster.revenant.json) for a detached tablet. Version 2 was regenerated with connected arms/tablet and independently inspected at native/enlarged size. Rejected pixels/evidence are retained, never atlased.
- City art has deliberate multi-hex overhang. In-game screenshots check town/army offsets and ownership/range visibility; the regular hex projection still uses fractional sprite fit, not pixel-perfect gameplay zoom.

See [tool/source provenance](TOOLCHAIN_PROVENANCE.md), [initial decisions](reviews/foundation-initial.json), [revision/overlay decisions](reviews/foundation-revision-and-overlays.json), and [performance](../performance/0006-art-factory.md). These approvals accept this foundation's observed limits; they are not full game 1.0 or final art-direction signoff.
