---
name: theandril-art-integration
description: Use when packing atlases, building manifests, loading pixel art in PixiJS, setting nearest-neighbor filtering, asset LOD, strategic markers, or wiring approved art into runtime gameplay.
---

# Art Integration

Only approved assets enter runtime atlases.

PixiJS:
- nearest-neighbor sampling;
- atlas padding/extrusion;
- deterministic frame naming;
- correct pivots;
- lazy loading;
- LOD-aware representations;
- no React component per map sprite.

Strategic scale:
- markers/banners/aggregates at far zoom;
- representative units at closer zoom;
- full tactical animation only where appropriate.

Atlas compiler must preserve:
- animation states;
- directions;
- pivots;
- source asset ID;
- content hash.

When an approved page fills, use an explicit bounded batch or scene partition before increasing texture dimensions. `map-works` is a 512×512 extension page for researched/civic props, resource deposits and extraction works: 1 MiB RGBA, bringing map residency to 17 MiB alongside the unchanged 16 MiB foundation page. All `battle*` pages stay deferred: effects add 4 MiB; foot and mounted/naval clips add 16 MiB each. Current complete atlas residency is 53 MiB, separately from viewport caches and DOM decoding. Preserve unchanged foundation bytes because reviewed settlement framing is bound to its atlas hash. Update source bindings, catalog diagnostics and measured browser residency expectations together; never shrink native frames or silently discard approvals to fit a page. Explicit partitions are not automatic pagination.

Publication is insufficient if the live content allowlist or fallback registry
omits an asset. Resource works use the canonical resource definitions for their
IDs across renderer, CLI, UI and tests. Verify a real paid tile improvement and
visible deposit in the browser, not just catalog presence. Standalone art CLI
fixtures have no workspace alias resolution; use portable source imports or an
explicit declared package dependency.

Battle role sheets are separate from culture-qualified map poses. Bind exact
east/west action clips without reversing pixels or applying a one-frame bob to
pretend movement. Render authoritative soldier slots or one hull; recorded
participant and casualty IDs select action/hit/death clips. Pool actors and
share atlas textures. Frame clocks, interpolation, pause and reduced motion
must leave canonical state unchanged. Measure full-strength mixed deployments,
not merely the older one-actor-per-formation representation.

Small canvas-fitted props can lose readability because transparent margins count toward their size. For tile/civic assets, use the offline exact opaque-frame union and cached `RuntimeArt.improvementFit` at 85% inset-hex support, with safe canvas fallback on approval/page/frame/canvas/pivot mismatch. Refresh `scripts/art-improvement-geometry.ts` after atlas publication. Verify every opaque pixel corner in every animation frame remains in its hex, and inspect actual desktop/narrow game views. Do not read pixels back or solve geometric fits every render frame.

After integration:
- launch deterministic scenario;
- screenshot;
- inspect scale/contrast/bleeding.
