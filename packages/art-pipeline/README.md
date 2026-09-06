# Offline art core

This Node-only package transforms explicitly supplied images into reviewable candidates. The browser imports **only** `@theandril/art-pipeline/runtime`, which contains strict schemas and types and no image decoder, filesystem, provider or tool process code.

The CLI-facing functions are exported from the package root:

- `parseAssetManifest`, `paletteSchema`: strict unknown-input boundaries.
- `decodePng`, `encodePng`, `cropImage`, `normalizePalette`: bounded RGBA operations. PNG chunk CRC, exact inflated size and Adam7 limits are checked independently before decoding. Animated PNG requires explicit extraction; animation is never silently dropped.
- `validateAsset`: technical report, exact input/specification hashes and remaining manual-review questions. It does not mutate stage or approve art.
- `buildContactSheet`: deterministic native/2x/4x review-only checkerboard sheets, including unapproved candidates.
- `approveAsset`: an explicit reviewer attestation bound to a passing report and unchanged specification. The caller must obtain genuine review notes/evidence; this is not an authenticity signature.
- `buildAtlas`: revalidates pixels and the reviewed hash, then packs only approved assets into a deterministic 1024/2048 page. Output is PNG, Pixi JSON and the strict browser catalog. It never rotates or trims frames. Two extruded edge pixels and two transparent gutter pixels are mandatory. A full page fails explicitly, requiring the caller to split the pack.
- `assetInputHash`, `assetSpecificationHash`, `sha256`, `cacheKey`, `verifyCachedFiles`, `safeAssetPath`: reproducible provenance, byte-verified caches and traversal/symlink rejection. Hashes are accidental-change checks, not authorization. Callers choose a trusted art root and do not allow untrusted processes to replace directory components during writes.
- `createAssetCacheReceipt`, `verifyAssetCacheReceipt`: strict candidate cache receipts bind the expected cache key/asset ID, manifest checksum, every frame and local original-source reference, and all file hashes. Malformed/stale/missing receipts are cache misses. One receipt is bounded to 256 MiB aggregate files. Approved artifacts and visual evidence must be retained outside ignored cache directories by the CLI.
- Provider and external-tool adapters are separate `generators/` and `toolchain/` modules. They report actual capability/availability and never confer approval.

Every native frame supplies a stable ID, direction, animation state, contiguous index, duration, pivot and source path. The initial atlas requires an exact shared pivot across each asset. Animation counts, duplicate-only motion, timing, pivot/bounding-box drift and palette/alpha/grid constraints are tested. Anatomy, silhouette, equipment identity, temporal aesthetics and licensing still need visual/human review.

`seamless` terrain checks opposite image-edge pixels. `hex` checks a fully covered pointy source mask and transparent exterior. Neither proves biome transitions, roads, rivers or coastline semantics; randomized/repeated terrain and actual rendered scale remain review requirements. Asset classification never adds canonical gameplay features.

The runtime catalog rejects unapproved stages, duplicate content/frame bindings, overlaps, out-of-page rectangles and invalid clip references/timing. Texture metadata is capped at 128 MiB and 8,192 frames. The Art Lab may show candidates and missing/future briefs with their actual status, but a candidate cannot carry a runtime entry.
