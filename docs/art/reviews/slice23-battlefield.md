# Blender battlefield review — 2026-09-07

The main agent inspected original native 1× and enlarged 4× source contact sheets, processed Pixel Snapper/Aseprite outputs, and actual live gameplay. Source checks and individual input-bound approvals are retained under `assets/art/source/blender-battle/` and `assets/art/approved/`; neither importing a scene nor passing a numerical check grants approval. [Reproducible factory](../../../tools/art/blender-battle/README.md).

Five new effects use restrained, distinct shapes: a diagonal metal strike, a narrow projectile, rising amber flame, a cool angular ward and a warm rally signal. The neutral Waykeeper is an adult, patched-cloth staff-and-tablet caster with planted feet and eight actual cast poses. Native silhouettes remain modest in detail. Each clip has eight 100 ms frames, exact palette/binary alpha and fixed pivots. Native melee v1 and dark caster v1 were rejected; corrected sources and their predecessors remain retained. Melee v3 corrects the editable timeline to match 10 fps without changing the inspected v2 pixels.

The same approved faction sprites represent real formations in combat. Their preparation/lunge/recoil is bounded presentation motion, not newly authored action poses. No culture sprite is mirrored or recolored. The Waykeeper is one shared role pilot, not 24 unique caster kits. Full facing/action coverage remains unfinished.

Main gameplay inspection:

- [Twenty-versus-twenty](../../screenshots/slice23-battle-twenty-versus-twenty.png): all 40 formations and six officers remain distinct, with readable remaining strength and separated cavalry silhouettes.
- [Naval](../../screenshots/slice23-battle-naval.png) and [390 px naval](../../screenshots/slice23-battle-naval-narrow.png): actual transport/escort hulls, no duplicated passengers, clear strength labels and restrained blue ground.
- [Cinder thread](../../screenshots/slice23-battle-cinder-thread.png) and [Bound ward](../../screenshots/slice23-battle-bound-ward.png): inspected genuine midclip caster/effect poses on their real targets. Browser assertions observe multiple actual frame IDs, pause on middle frames and preserve the canonical hash.
- [Fortified assault](../../screenshots/slice23-battle-siege.png): schematic wall line and actual defending militia; this is not a complete authored siege map or free-moving tactical engine.
- [Narrow controls](../../screenshots/slice23-battle-magic-narrow.png): legal targets, spent strain, per-source automatic policies and readable disclosures remain available without horizontal scrolling. The campaign turn bar no longer obscures combat.
- [Actual production battlefield](../../screenshots/slice23-production-battlefield.png): built-bundle rendering of the approved assets, with ordinary manual shield orders and exact saved outcome restoration; no development hooks.

Review caught a real failure missed by center-only layout tests: native ship/cavalry sprites covered preceding strength labels. [Original naval defect](../../screenshots/slice23-naval-spacing-before.png) and [original crowded deployment](../../screenshots/slice23-battle-spacing-before.png) remain as evidence, not approved final examples. Layout now reserves complete native sprite, annotation and motion bounds; tests cross-check the published role contracts and actual rendered diagnostics. Portrait title clearance and automatic reveal of an offscreen manual-cast target are checked separately in the final UX follow-up.

The full 116-scenario Chromium run passed after spacing, temporal-cast and sticky-footer corrections. Final portrait title clearance and offscreen-target reveal then passed 17/17 focused scenarios; main inspection accepted the final narrow and built-bundle captures. Durable [ember](../../performance/slice0035-cast-ember.json) and [ward](../../performance/slice0035-cast-ward.json) traces retain actual observed caster/effect frame IDs and midclip pause evidence, not merely a timed screenshot.

This is scoped visual acceptance of six new clips, not full visual production or 1.0 signoff. Final isolated clear-field frame p95 remains 33.4 ms on the actual Chromium ANGLE/Vulkan SwiftShader software backend. Functional passing does not establish 60 fps or physical-GPU acceptance. [Exact runtime/performance limits](../../performance/0035-battlefield.md).
