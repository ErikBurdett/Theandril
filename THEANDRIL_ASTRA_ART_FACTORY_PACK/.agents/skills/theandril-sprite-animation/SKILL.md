---
name: theandril-sprite-animation
description: Use for animated units, characters, monsters, directional sets, frame tags, pivots, attack/cast/walk cycles, PerfectPixel integration, and animation QA.
---

# Sprite Animation

Preferred candidate:
- PerfectPixel for initial character/animation generation.

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
