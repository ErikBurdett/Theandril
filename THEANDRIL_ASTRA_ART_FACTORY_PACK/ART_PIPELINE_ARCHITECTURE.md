# Theandril Art Pipeline Architecture

```text
Game content definition
        |
        v
Asset Brief Compiler
        |
        v
Generator Router
  |        |        |
  v        v        v
PerfectPixel PixelLab Local Provider
        |
        v
Candidate Store
        |
        v
Sprite Fusion Pixel Snapper
        |
        v
Palette / Pixel Validation
        |
        v
Aseprite CLI Adapter
        |
        v
Animation / Tile / Image QA
        |
        +---- fail ----> Reject / corrective regeneration
        |
        v
Approved Asset Store
        |
        v
Atlas + Manifest Compiler
        |
        v
PixiJS runtime assets
        |
        v
Art Lab + deterministic game screenshots
```

## Canonical asset status

- `MISSING`
- `BRIEF_READY`
- `GENERATING`
- `CANDIDATE`
- `REJECTED`
- `VALIDATED`
- `APPROVED`
- `ATLASED`
- `INTEGRATED`
- `NEEDS_REVISION`

## Source vs runtime

### Source
Generation outputs, Aseprite sources, references.

### Approved
Reviewed canonical visual assets.

### Runtime
Optimized Pixi atlases, metadata, manifests.

The game consumes runtime assets, not arbitrary generation outputs.

## Aseprite adapter

Create one adapter that:
- finds binary;
- captures version;
- invokes CLI;
- normalizes errors;
- logs commands without secrets;
- uses named export profiles.

Never scatter raw Aseprite command strings around the codebase.

## Pixel Snapper adapter

Capture:
- tool version;
- palette;
- pixel size;
- color count;
- input hash;
- output hash.

## Validation

Produce machine-readable reports.

## Atlas

Atlas generation should:
- add padding/extrusion;
- preserve pivots;
- preserve animation tags;
- avoid bleeding;
- produce deterministic ordering;
- include content hash;
- support incremental rebuilds.

## Caching

Cache expensive generation by:
- normalized brief hash;
- provider/model;
- seed;
- reference hashes;
- palette version;
- toolchain version.
