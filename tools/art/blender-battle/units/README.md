# Articulated battle companies

This extension is a battle-only production family. It preserves the existing
24 culture kits and the published foundation image. Shared role animation is
identified honestly; faction banners and the existing strategic artwork carry
culture identity. No shared clip is labeled as a newly authored culture variant.

The first accepted review gate was one Oathguard. Its mesh is original project-authored
geometry, bound with vertex groups and armature modifiers to an editable bone
rig. Independently posed limbs, knees, wrists, shield and weapon provide motion;
translation of a still sprite is not an attack or walk animation.

| Canonical consumer | Published battle asset | Distinguishing equipment |
| --- | --- | --- |
| `unit.colonist` | `battle.unit.colonist` | burden frame, walking staff, soft traveling layers |
| `unit.scout` | `battle.unit.scout` | short bow, quiver, open traveling coat |
| `unit.guard` | `battle.unit.guard` | repaired plate, broad shield, short sword |
| `unit.spearman` | `battle.unit.spearman` | long ash pike, mail shoulder, padded jack |
| `unit.heavy_infantry` | `battle.unit.heavy_infantry` | layered heavy plate, enclosed helm, heavy hammer |
| `unit.cavalry` | `battle.unit.cavalry` | lean horse, light saddle, curved riding blade |
| `unit.skirmisher` | `battle.unit.skirmisher` | throwing javelin, spare shafts, small buckler |
| `unit.arbalester` | `battle.unit.arbalester` | windlass crossbow, bolts, braced reload |
| `unit.halberdier` | `battle.unit.halberdier` | long axe-hook polearm, arm protection |
| `unit.lancer` | `battle.unit.lancer` | armored rider, couched lance, saddle cloth |
| `unit.transport` | `battle.unit.transport` | broad cargo hull, square sail, deck stores |
| `unit.coastal_warship` | `battle.unit.coastal_warship` | low galley, oars, light fighting platform |
| `unit.ocean_warship` | `battle.unit.ocean_warship` | deep armored hull, broad sail, raised fighting deck |

All 13 roles have original editable rigs, actual rendered frames, real native
processing and exact-input visual approvals. The guard pilot was independently
reviewed before expanding the batch; cavalry and transport also received a
second art-direction review. This is 13 shared roles, not 312 culture/role
combinations. See [source and native evidence](../../../../docs/art/reviews/battle-units/source-native-manifest.json)
and the separate [runtime review](../../../../docs/art/reviews/BATTLE_UNIT_ANIMATION.md).

Foot figures use 64×64 with feet at (32,56); mounted figures and hulls use
96×96 with ground at (48,80). The dense individual-soldier scene motivates this
smaller canvas than the older 96/128 tactical proposal. Inspect approximately
40–46 native pixels of adult standing body and the complete motion union before
propagating that choice. One fixed shallow orthographic camera, origin and
upper-left light serves both independently rendered east/west views. No per-frame
cropping, scaling, texture mirroring, motion blur or painted alpha is permitted.

Every role has 4 idle frames at 200ms, 8 walk at 100ms, 8 attack at 100ms, 4 hit at 100ms and
8 death at 100ms in each facing. Idle/walk loop; attack/hit/death terminate with an
explicit resting or fallen pose. Naval roles use equivalent idle/sail/fire/hit/
sink clips with articulated rigging, oars and fighting equipment. Existing five
approved battlefield effects remain available where actual events warrant them.

The renderer consumes authoritative identities, positions, casualties and
events. Animation frames never apply damage, invent casualties, grant resources
or advance simulation time. One naval formation represents one hull; embarked
land formations are not drawn as extra combatants.

The measured batch is 832 frames / 130 directional clips. `battle-foot` and
`battle-mounted` are each 2048² (16 MiB decoded). Together with the existing
4 MiB effects page, these are deferred until a battle opens. World residency
stays 17 MiB; all five pages total 53 MiB and 4,150,190 PNG download bytes.
The foundation SHA-256 remains
`e32c73be1b8789f8c554eea7c6b7204d40fae20e3347be36ccbd76de8a9740de`.
Native approval and actual gameplay inspection remain separate gates.

Production is explicit and versioned. Use a new source version for a changed
recipe; do not overwrite a sealed source or an existing approval:

```sh
python3 tools/art/blender-battle/units/build.py --factory-root /path/to/BlenderArtFactory --role guard --version 5
# Add --build only after reviewing the dry-run plan.
node --import tsx scripts/art-blender-battle.ts battle.unit.guard 5
# Add --prepare --activate for an approved import plan; replacing an active
# brief additionally requires --replace-brief-sha=<exact-old-brief-sha256>.
node --import tsx scripts/art.ts generate battle.unit.guard --provider source
python3 tools/art/blender-battle/units/review.py guard --factory-root /path/to/BlenderArtFactory
node --import tsx scripts/art.ts validate battle.unit.guard
```

The builder retains `.blend`, all five Actions, weighted original meshes,
materials, camera/light settings, dependencies, raw renders, native frames and
every file hash. Source import verifies these and relative articulation.
`art.ts generate` invokes the actual Pixel Snapper and Aseprite tools. Full
processing steps for 64-frame assets are preserved in a hash-bound receipt;
promoted approvals retain the receipt, `.aseprite`, sheet PNG and JSON. The
96px Aseprite export uses a bounded row grid instead of an oversized strip.
Inspect all native frames and nearest 4× sheets before individual exact-hash
review. `art:integrate` then repacks without shrinking frames; the browser review
must check the actual consumer, movement, casualties and memory budget.
