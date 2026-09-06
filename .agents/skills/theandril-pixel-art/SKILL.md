---
name: theandril-pixel-art
description: Design, produce, integrate, or review Theandril's gritty dark-fantasy pixel graphics, including terrain tiles, unit sprites, portraits, sprite sheets, animation, asset resolution, and pixel-rendering LOD. Use for the future visual conversion and subsequent asset work, not ordinary simulation or UI logic without an art change.
---

# Theandril pixel art

Use the user's pixel-art direction as the current art target. It supersedes the earlier hand-painted/engraved *asset technique* in MASTER_PROMPT.md; retain that document's readability, original heraldry, muted materials, and far-zoom clarity. Inspect docs/art/ART_IMPLEMENTATION_STATUS.md before claiming an asset family is sprite-based.

## Art factory

For production assets, use MASTER_ART_FACTORY_PROMPT.md, ART_STYLE_STANDARD.md and ART_DEFINITION_OF_DONE.md. Follow the installed theandril-art-provider-bakeoff, theandril-aseprite, theandril-art-qa, theandril-art-provenance and theandril-art-integration skills for their stages; use theandril-sprite-animation and theandril-terrain-tiles for those families. Preserve the detailed resolution and animation references below where compatible. User-authorized art-factory implementation includes routine open-source tooling; invocation alone never grants external spending or uploads.

Keep briefs, original sources, candidates, reviewed approvals and runtime atlases distinct. Palette normalization and Pixel Snapper/Aseprite exports must retain input/output hashes and settings. Automation can validate, but visual approval requires inspected native-size, enlarged, and in-game evidence. Missing providers are reported, not substituted with mislabeled output. Future content shown in Art Lab is not implemented gameplay.

## Establish the contract

Read AGENTS.md, docs/lore/FOUNDATIONS.md, and the actual renderer/content being changed. Current physical hexes, gameplay rules, and saved cells must not be changed just to fit artwork. Visual state is derived; animations never decide damage, movement completion, or turn timing.

Read the relevant references completely before the corresponding work:

- [Art direction](references/art-direction.md): every asset or visual review.
- [Resolution and asset families](references/resolution.md): selecting dimensions, framing, pixel density, map geometry, or commissioning batches.
- [Sheets and animation](references/sheets-animation.md): any animated unit, effect, atlas, export, or import pipeline.
- [Rendering and acceptance](references/rendering.md): integration, zoom, memory, performance, or release review. Also use the installed repository rendering-performance and relevant PixiJS skills when editing Pixi code.

Treat dimensions and budgets as Theandril's recommended baseline, not a universal optimum. Demonstrate exceptions at actual display size before propagating them to an asset family. Establish one terrain/figure/town scene across required zoom levels before commissioning a large roster.

## Working method

1. Identify the asset's gameplay role, native dimensions, visible silhouette bounds, ground anchor, facings, animation states, and closest existing family. Distinguish source canvas from atlas-packed bounds and screen size.
2. Produce original art consistent with the Witness Roads/hearthlands setting. The user's Elden Ring, Blasphemous, and darker Dead Cells references describe mood, silhouette, material wear, and animation weight—not characters, costumes, symbols, screenshots, or assets to reproduce.
3. Inspect native pixels, nearest-neighbor enlargement, an actual gameplay composite, fogged state, and grayscale/ownership readability. Return to silhouette and value grouping if detail obscures the unit's role.
4. Export reproducibly, retain editable sources, and record provenance and native-pixel metadata. Validate dimensions, anchors, frame names/timing, atlas rectangles, and content references before integration.
5. Integrate only the requested slice. Run the appropriate checks, screenshots, deterministic save/replay comparison, and rendering measurements; update implementation status with what is actually shipped versus specified.

For requested raster generation/editing, use the available image-generation workflow/skill and original descriptions. Generated concept sheets are not automatically production pixel art: verify exact dimensions, palette/alpha edges, consistent anatomy, frame registration, and animation. Do not upscale/downsample a painterly image and call the conversion complete. For code-native overlays or existing vectors, retain the appropriate code/vector workflow unless their conversion is requested.

Do not install art tools, buy packs, upload private sources, or replace the renderer solely because this skill is invoked. Missing asset tooling is a reported constraint; prepare a concrete specification or use existing permitted tooling within the user's scope.
