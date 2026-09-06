# Using the art factory

From the repository root, use `pnpm art:doctor`, then `pnpm art:status`. Aseprite is discovered from the existing Steam installation; `ASEPRITE_BIN` overrides it. Pixel Snapper can be built with `bash tools/art/install-pixel-snapper.sh`; its binaries/build caches remain project-local and ignored.

## Source to runtime

1. A brief under assets/art/briefs names stable content bindings, native frame sources, palette, pivots/timing, constraints and original provenance. The four original sheets and revised revenant can be re-extracted with `pnpm art:prepare`; `pnpm art:overlays` prepares the eight original code-native overlays. Run overlays before prepare when rebuilding their combined index from nothing. Extraction never approves anything.
2. `pnpm art:generate unit.guard` runs source-backed processing through real Pixel Snapper and Aseprite. This default reuses commissioned sources; it does **not** claim to create a new AI image. `--provider pixellab|perfectpixel|comfyui` makes a new request only when explicitly selected and configured. The current CLI accepts one facing/idle clip; unsupported multi-state or invented animation is rejected.
3. `pnpm art:validate unit.guard` checks exact pixels/metadata and prints the candidate input hash. `pnpm art:review unit.guard` creates native/enlarged sheets. `--source` compares the pre-Snapper native image without granting approval.
4. Inspect actual pixels, role/identity, frame motion and palette. Approve one inspected candidate with `pnpm art:review unit.guard --approve --hash HASH --reviewer NAME --notes 'Observed findings and limitations' --evidence assets/art/review-previews/unit.guard-4x.png`. Approval is tied to that exact candidate; byte-identical frames, editable source, export metadata and evidence are retained outside the cache. Changed pixels/brief/tool/palette invalidate approval.
5. `pnpm art:atlas` rebuilds only reviewed approvals, checking reversed-input determinism. `pnpm art:integrate` publishes the approved atlas and catalogs to the web application. Publication does not claim the in-game visual review has passed.
6. Run `pnpm dev`, start a seeded game and open **Art Lab** in development. Inspect native sizes,1/2/4/8x, frame playback, exact atlas rectangles, backgrounds and repeated terrain. Playwright gameplay screenshots and performance/save checks are the final integration evidence.

`assets/art/source` and `assets/art/approved` are durable. Candidate pointers, temporary comparisons and tool/runtime processing caches are disposable and ignored; approved manifests must never require those caches. The production build retains approved runtime PNG/JSON only, omitting the Lab catalog and reserved candidate preview files.

## Faction kit production

The four implemented cultures each have15 qualified roles; [visual bible](THEANDRIL_ART_BIBLE.md) and [faction coverage](FACTION_ASSET_CATALOG.md) define the actual consumers. Exact source/revision prompts live in `assets/art/source/faction-generation-prompts.json` and `faction-revisions.json`. The dedicated `faction-index.json` never replaces the generic `foundation-index.json`.

Use `pnpm art:factions --propose-crops --family=ashen_compact` only when proposing a new source mapping. It writes unreviewed full-source/native/enlarged evidence; it does not grant approval. Inspect every role and add a review naming both the exact `sourceHash` and `cropsHash`. Keep any necessary component masks explicit. Do not repropose over an existing reviewed mapping merely to reprocess unchanged pixels. Opaque backgrounds, missing roles, omitted/duplicated source pixels and stale mappings fail.

`pnpm art:factions --family=ashen_compact` prepares native sources and briefs from that reviewed mapping; omit the family to prepare all four. Then `pnpm art:generate --family ashen_compact`, `pnpm art:validate --family ashen_compact` and `pnpm art:review --family ashen_compact` process and inspect the family. Final approval still names one asset and its exact validation hash, for example `unit.guard.ashen_compact`; there is no blanket family approval. `pnpm art:integrate` publishes only individually retained approvals. Keep static first-facing coverage separate from genuine animation production.

## Provider configuration

- PerfectPixel: `PERFECTPIXEL_BIN` must be upstream `ppvalidate`, not the GUI. A supported upstream provider key must be present. Current adapter deliberately exposes base-image mode only; it does not silently mirror asymmetric equipment or promise a seed it cannot set.
- PixelLab: `PIXELLAB_API_KEY`; the fixed official Pixflux-v2 endpoint supports still images and one optional init image in this adapter. Character/animation/hex APIs are not yet integrated.
- ComfyUI: local loopback `COMFYUI_URL`, and `COMFYUI_WORKFLOW` pointing to an API-format workflow with explicit prompt/seed/width/height bindings and model-license notes. No model download is hidden in generation.
- Built-in Codex generation: operated by the agent tool, with the original prompt/output copied into source provenance. A source-file bridge is available; the Node CLI cannot invoke that session-only tool itself.

Never commit provider secrets or infer commercial rights from an API response. Record unavailable model/seed information honestly. See GENERATOR_BAKEOFF.md and ART_IMPLEMENTATION_STATUS.md for verified versus untested capabilities.

## Checks and revision

Run `pnpm art:verify-tools` for real native import/export timing, tags and repeated byte equality; this requires the locally installed Aseprite and Pixel Snapper tools. Ordinary CI needs neither tool nor credentials: retained approved frames, editable sources, exact review evidence and catalogs are self-contained. `pnpm art:validate`, `pnpm test`, `pnpm bench:art` and gameplay tests validate those published artifacts. `pnpm art:doctor` also runs on a new checkout with missing art inputs and reports what needs configuration.

Reject a visually defective candidate with the same exact-hash/reviewer/notes/evidence arguments but `--reject` instead of `--approve`. Machine-valid is not visually approved: the first revenant passed pixel checks but was rejected for a detached tablet, then regenerated and individually reviewed as version 2. Rejected evidence remains under assets/art/rejected and never enters the runtime atlas. Changing a brief does not silently replace its last reviewed published version; process and inspect the revision before promoting it.

The current atlas compiler uses one bounded 1024/2048 page per explicit build. It fails on overflow rather than silently dropping assets; automatic multi-page grouping is future scale work. Pixel-perfect native previews use integer zoom, while gameplay currently fits these assets to its unchanged regular-hex geometry with explicitly reported fractional scaling. See [architecture](../architecture/0013-art-factory.md) and [measured performance](../performance/0006-art-factory.md).
