# Sprite sheets and animation contract

## Source and export

Keep editable layered native-pixel sources (for example `.aseprite`) and deterministic exports. Use RGBA PNG plus JSON; do not use JPEG, animated GIF, or video as unit animation delivery. Preserve source layers for body, equipment, faction cloth and optional effects when these are genuinely reusable; do not require runtime paper-doll composition for every figure.

Use stable frame keys such as `unit.guard/strategic/walk/se/000` (the Oathguard's actual content ID is `unit.guard`). Keep content IDs distinct from presentation variants. Six strategic facings follow the existing neighbor order **e, se, sw, w, nw, ne**. A family may begin with three authored facings plus mirrored counterparts only after reviewing handedness, shields, heraldry and lighting; do not mirror asymmetric identifiers or important equipment incorrectly. Tactical facings follow the actual battlefield camera, not an assumed isometric view.

The current tactical scene is a shared Pixi battlefield. Modern battles render exact canonical soldier slots and one actor per naval hull. Its reviewed shared-role family uses independently rendered east/west shallow three-quarter profiles: foot sprites are 64×64 at pivot (32,56), mounted/hulls 96×96 at (48,80). Read `tools/art/blender-battle/units/README.md` for the actual rig, camera and clip contract. Culture identity uses existing banners and strategic art. Do not transplant six strategic directions into unused tactical sheets or label these shared roles as new culture variants.

Pack by scene/use and load lifetime: terrain/overlays, strategic figures, settlements, tactical faction kits, effects, UI, portraits. Prefer 1024² or 2048² atlas pages; allow 4096² only with supported-device and residency evidence. Pack at 1× (`meta.scale: "1"`), no rotated frames for the baseline pipeline, with a 2-pixel edge extrusion and at least 2 additional transparent pixels between extruded bounds. Frame rectangles exclude gutters. Keep source transparency and inspect padded edges over both light and dark backgrounds.

The baseline runtime atlas uses Pixi-compatible `frames` keyed objects with integer `frame`, `sourceSize`, `spriteSourceSize`, `trimmed`, `rotated: false`, plus `meta.image`, `meta.size`, `meta.scale`. Define named `animations` arrays in playback order. Preserve source-canvas ground anchors across trimming; anchor = native ground coordinate divided by native source dimensions, not packed rectangle dimensions. Aseprite's export tags/frame durations need explicit translation into this runtime contract—do not assume its raw JSON tags become Pixi playback timing automatically. [Aseprite export documentation](https://www.aseprite.org/docs/sprite-sheet/), [Pixi spritesheet documentation](https://pixijs.download/release/docs/assets.Spritesheet.html).

The asset manifest and runtime catalog now carry the implemented presentation contract: schema version, asset/content IDs, native size, ground anchor, palette, atlas and explicit clips. Each clip declares ordered frame IDs, positive integer `durationMs` per frame and loop behavior. Source manifests additionally retain the complete weighted rig, Actions, camera, every raw/native frame and a hash inventory. `sourceClips` validates the full state/direction matrix; multiple Aseprite tags are named `state.direction`. Do not claim arbitrary custom sidecar fields are supported by Pixi.

## Weight without latency

| Clip | Starting frame budget | Timing / behavior |
| --- | --- | --- |
| Idle | 4–6 | 150–250 ms per frame; small breathing/cloth shifts |
| Walk / march | 6–8 | 80–125 ms; planted feet, no anchor drift |
| Attack | 6–10 | 60–140 ms with clear preparation, impact, recovery; one-shot |
| Brace / guard | 3–4 | 100–180 ms entry then held pose |
| Hit reaction | 2–4 | 60–100 ms; short and readable |
| Rout / withdraw | 6–8 | 70–110 ms; distinct silhouette from orderly march |
| Death | 6–10 | 90–150 ms; one-shot, stable final pose, optional reduced-violence alternative |
| Cast / channel | 6–10 | 90–160 ms; separate loop and release, tied to actual capability |
| Embers / water / banner | 4–8 | 120–250 ms, stagger presentation phase, distant LOD static |

These are suggested ranges, not a requirement to draw unused actions. The 13 current shared battle roles use idle/walk/attack/hit/death, with sail/fire/sink for hulls; new states require a real consumer. Reuse poses deliberately. Smear frames and recoil should read as authored shapes, not filtered texture stretching. Weapon arcs/effects can be separately pooled when that saves artwork and keeps silhouettes coherent.

Animation consumes simulation outcomes/events. Visual impact markers can schedule a sound/flash, but never apply damage or advance a queued order. Skipping animation, changing speed, pausing, reduced motion, background-tab throttling and save/load must produce exactly the same campaign hash. Serialize game orders, not Pixi frame numbers or clock timestamps. After loading, reconstruct a safe pose from current observation instead of replaying every past effect.

Pixi `AnimatedSprite` accepts `{ texture, time }` frame objects for uneven durations. Use explicit timing and avoid a separate uncontrolled ticker for every entity; the renderer owns visible animation updates and completion cleanup. [AnimatedSprite API](https://pixijs.download/release/docs/scene.AnimatedSprite.html).

## Acceptance checks

- All frames exist exactly once under stable keys; every referenced animation frame resolves; no frame rectangle exceeds its page; trimmed bounds fit the declared source canvas.
- Ground anchor, body scale, weapon hand, insignia and palette stay registered across frames/directions. Inspect contact-sheet and playback, not only the first frame.
- Every duration is positive, clip order is explicit, one-shots terminate, loops close cleanly, and interruption has a safe next pose.
- Atlas gutters do not bleed at actual camera scales; no padding enters the logical frame; alpha fringes and unwanted matte colors are absent.
- Missing art has a recognizable fallback for the correct content role without breaking play. Reject mismatched metadata at build/load boundaries; don't silently show another unit's frames.
