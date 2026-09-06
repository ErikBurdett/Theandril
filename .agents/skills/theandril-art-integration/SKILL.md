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

After integration:
- launch deterministic scenario;
- screenshot;
- inspect scale/contrast/bleeding.

