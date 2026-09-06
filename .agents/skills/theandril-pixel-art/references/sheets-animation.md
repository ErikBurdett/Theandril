# Sprite sheets and animation contract

## Source and export

Keep editable layered native-pixel sources (for example `.aseprite`) and deterministic exports. Use RGBA PNG plus JSON; do not use JPEG, animated GIF, or video as unit animation delivery. Preserve source layers for body, equipment, faction cloth and optional effects when these are genuinely reusable; do not require runtime paper-doll composition for every figure.

Use stable frame keys such as `unit.guard/strategic/walk/se/000` (the Oathguard's actual content ID is `unit.guard`). Keep content IDs distinct from presentation variants. Six strategic facings follow the existing neighbor order **e, se, sw, w, nw, ne**. A family may begin with three authored facings plus mirrored counterparts only after reviewing handedness, shields, heraldry and lighting; do not mirror asymmetric identifiers or important equipment incorrectly. Tactical facings follow the actual battlefield camera, not an assumed isometric view.

The current tactical UI is DOM formation tables, not a sprite battlefield. Until that camera is implemented, the tactical dimensions are a proposal. Prototype opposing east/west shallow three-quarter profiles at constant pixel density as the economical starting composition; establish and review camera, ground projection and which actions need extra facings before commissioning a full tactical roster. Do not transplant six strategic directions into unused tactical sheets automatically.

Pack by scene/use and load lifetime: terrain/overlays, strategic figures, settlements, tactical faction kits, effects, UI, portraits. Prefer 1024² or 2048² atlas pages; allow 4096² only with supported-device and residency evidence. Pack at 1× (`meta.scale: "1"`), no rotated frames for the baseline pipeline, with a 2-pixel edge extrusion and at least 2 additional transparent pixels between extruded bounds. Frame rectangles exclude gutters. Keep source transparency and inspect padded edges over both light and dark backgrounds.

The baseline runtime atlas uses Pixi-compatible `frames` keyed objects with integer `frame`, `sourceSize`, `spriteSourceSize`, `trimmed`, `rotated: false`, plus `meta.image`, `meta.size`, `meta.scale`. Define named `animations` arrays in playback order. Preserve source-canvas ground anchors across trimming; anchor = native ground coordinate divided by native source dimensions, not packed rectangle dimensions. Aseprite's export tags/frame durations need explicit translation into this runtime contract—do not assume its raw JSON tags become Pixi playback timing automatically. [Aseprite export documentation](https://www.aseprite.org/docs/sprite-sheet/), [Pixi spritesheet documentation](https://pixijs.download/release/docs/assets.Spritesheet.html).

Maintain a small presentation sidecar for each animated family: schema version, asset/content IDs, scene, native size, ground anchor, allowed facings/mirroring, palette group, atlas references, and clips. Each clip declares ordered frame IDs, positive integer `durationMs` per frame, loop behavior, optional visual markers and completion/fallback pose. This is a proposed asset contract until an importer/schema is implemented; don't claim arbitrary custom sidecar fields are supported by Pixi.

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

These are suggested ranges, not a requirement to draw unused actions for the three current units. Reuse poses deliberately. Smear frames and recoil should read as hand-drawn shapes, not filtered texture stretching. Weapon arcs/effects can be separately pooled when that saves artwork and keeps silhouettes coherent.

Animation consumes simulation outcomes/events. Visual impact markers can schedule a sound/flash, but never apply damage or advance a queued order. Skipping animation, changing speed, pausing, reduced motion, background-tab throttling and save/load must produce exactly the same campaign hash. Serialize game orders, not Pixi frame numbers or clock timestamps. After loading, reconstruct a safe pose from current observation instead of replaying every past effect.

Pixi `AnimatedSprite` accepts `{ texture, time }` frame objects for uneven durations. Use explicit timing and avoid a separate uncontrolled ticker for every entity; the renderer owns visible animation updates and completion cleanup. [AnimatedSprite API](https://pixijs.download/release/docs/scene.AnimatedSprite.html).

## Acceptance checks

- All frames exist exactly once under stable keys; every referenced animation frame resolves; no frame rectangle exceeds its page; trimmed bounds fit the declared source canvas.
- Ground anchor, body scale, weapon hand, insignia and palette stay registered across frames/directions. Inspect contact-sheet and playback, not only the first frame.
- Every duration is positive, clip order is explicit, one-shots terminate, loops close cleanly, and interruption has a safe next pose.
- Atlas gutters do not bleed at actual camera scales; no padding enters the logical frame; alpha fringes and unwanted matte colors are absent.
- Missing art has a recognizable fallback for the correct content role without breaking play. Reject mismatched metadata at build/load boundaries; don't silently show another unit's frames.
