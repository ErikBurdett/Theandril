# 0013 — Reviewed art is compiled presentation data

Date: 2026-09-05. Status: implemented foundation; full directional/faction/terrain-transition production remains open.

## Boundary

`packages/art-pipeline` owns offline Node PNG processing, provider/tool adapters, manifests, provenance, validation, reviews and atlas compilation. Its `/runtime` export contains only browser-safe schemas/types; render and web never import Node tooling or pngjs. The simulation/content/map generator are untouched: save 5, archive 2, generator 2 and content hash `3139d4e7` remain unchanged. Art cannot reveal unseen entities or change costs, combat, map topology or random streams.

The root art CLI resolves its own repository root, not the caller's working directory. Stable IDs, bounded paths and strict JSON govern source, candidate, reviewed and runtime directories. Hash-verified cache receipts cover frames, editable/export files and local provenance references; corruption is a cache miss, never approval. Retained reviewed inputs do not depend on ignored caches or an installed commercial editor. Source-to-runtime checks run on a clean checkout without live generation or native-tool installation.

## Reproducible processing, explicit judgment

Available session image generation authored four original sheets and a revised revenant, with exact prompts/source files; model and seed were unavailable and are not invented. Nearest extraction registers frame groups before exact palette/binary-alpha normalization. Passing native 1-pixel art through Pixel Snapper erased deliberate detail, so the selected path expands pixels 4× with nearest sampling before the real fixed-4-pixel tool pass, then explicitly restores the native canvas/terrain footprint. The original/source comparison and process hashes make this choice auditable.

Real Aseprite batch import creates editable sources, tags and timed frames; exports use no trim/rotation and preserve anchors. Strict PNG validation checks CRC, chunk order, bounded inflation and dimensions before allocation, plus palette, alpha, pixel grid, frame indices/timing, pivot/motion and hex masks. Identity, anatomy, meaningful motion and convincing terrain continuity still require visual review. The first revenant demonstrates that machine PASS can lead to visual REJECTED.

Individual acceptance requires current candidate hash, named reviewer, observed notes and image evidence. Promotion copies identical frame pixels, editable source/export metadata and evidence out of the cache, recomputes the retained-path manifest hash and ties review to it. Published approvals remain stable while a newer brief is being worked on. Atlas compilation revalidates exact approved inputs, sorts stable frame IDs and checks a reversed-input rebuild. It packs non-rotated/untrimmed rectangles with two-pixel extrusion plus two-pixel clear gutters. One bounded page is supported per build; overflow fails explicitly.

## Runtime and inspection

The approved catalog contains 37 assets/55 frames in one 1024² page; 17 content bindings currently have actual map consumers. A load verifies catalog/atlas agreement, PNG hash, PNG header/dimensions before browser decode, decoded dimensions and memory limits. Nearest sampling/no mipmaps, pooled visible figures and existing 16×16 terrain chunks preserve the renderer boundary. Cached terrain is bounded to 64 chunks; far zoom uses strategic glyphs, intermediate zoom static sprites and near zoom visible idle animation. Reduced motion freezes animation. Ownership and interaction overlays stay separate from sprite color. Missing or invalid art reports a procedural fallback while keeping gameplay usable.

Native terrain has a 56×64 occupied hex footprint, but the established regular world hex is approximately 50.23×58 with 43.5 row pitch. Fitting art therefore uses explicitly diagnosed fractional X/Y scales. The map was not distorted to obtain integer pixels. Native Art Lab previews are exact 1/2/4/8× integer nearest views; a later camera redesign must be separately specified and measured before claiming pixel-perfect map rendering.

Art Lab is lazy/development-only. It validates manifests and actual image bytes before reporting pixel metrics, preserves selection on explicit reload, invalidates same-URL image state, and aborts/revokes image resources on replacement. It exposes asset lookup, preview/background, alpha bounds/pivot, clip stepping/playback, atlas rectangles, report/provenance and native terrain repetition. Publication never serves candidates; production build also strips the Lab catalog/preview namespace from its output and contains no debug mutation/observation hook.

## Evidence and remaining scope

[Asset inventory](../art/ASSET_CATALOG.md), [operator commands](../art/README.md), [licenses/provenance](../art/TOOLCHAIN_PROVENANCE.md), [measurements](../performance/0006-art-factory.md) and [implementation gates](../art/ART_IMPLEMENTATION_STATUS.md) distinguish reviewed results from future content. Optional provider adapters have tested contracts, not a fabricated live-provider bake-off. Directional/identity animation, automatic atlas page grouping, terrain variants/seams and complete faction art remain separate work; unimplemented game systems are not added just to display an asset.
