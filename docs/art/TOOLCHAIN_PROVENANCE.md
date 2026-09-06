# Toolchain and art-source provenance

Verified 2026-09-05 against installed files, retained source records, actual native-tool runs, and the primary sources linked below. This is an installation/provenance inventory, not a complete distribution-license audit or a guarantee of rights in generated output. Approval remains asset-specific.

## Exercised tools and installed dependencies

| Component | Verified installation and use | License / distribution boundary |
| --- | --- | --- |
| Aseprite `1.3.18.3-x64` | Reused `/home/telephoneheater/.local/share/Steam/steamapps/common/Aseprite/aseprite`. Real headless PNG/JSON exports and editable `.aseprite` creation preserve supplied tags and frame durations. | Existing Steam installation; not downloaded, copied into the repository, or redistributed by this work. Installed `data/EULA.txt` was inspected. The [Aseprite EULA](https://github.com/aseprite/aseprite/blob/main/EULA.txt) governs the program; the [official commercial-art FAQ](https://www.aseprite.org/faq/#can-i-sell-graphics-created-with-aseprite) distinguishes created assets from distribution of the editor. No rights to third-party input art are granted by using the tool. |
| Sprite Fusion Pixel Snapper `1.0.0` | Compiled and exercised at `tools/art/.local/bin/spritefusion-pixel-snapper`. Cargo's local `.crates.toml` confirms the pinned crates.io version. | MIT, copyright 2025 Hugo Duprez; verified in the installed crate's `LICENSE` and `Cargo.toml`, matching the [upstream license](https://github.com/Hugo-Dz/spritefusion-pixel-snapper/blob/main/LICENSE). The binary/build cache is ignored, not part of the runtime art pack. Preserve upstream notices if distributing the software or substantial portions; transitive dependencies retain their own licenses. |
| Rust / Cargo `1.88.0` | Installed locally only to build Pixel Snapper, under `tools/art/.local/{cargo,rustup}`. No global shell configuration or system package changes. | Toolchain license/third-party notices remain in the local installation, including `share/doc/cargo/LICENSE-MIT`, `LICENSE-APACHE`, and `LICENSE-THIRD-PARTY`. This is not a transitive-license inventory. Toolchain binaries are not distributed in the game. |
| `pngjs` `7.0.0` | Installed package at `packages/art-pipeline/node_modules/pngjs`; used for real PNG encoding/decoding behind the pipeline's bounded integrity checks. | MIT; installed `package.json` and `LICENSE` inspected. Notices name Luke Page and original contributors, and derived work by Kuba Niegowski. [Primary license](https://github.com/pngjs/pngjs/blob/main/LICENSE). |
| `@types/pngjs` `6.0.5` and `zod` `4.5.4` | Actual installed versions: PNG TypeScript definitions and schema validation. Manifest ranges are not the installed-version authority. | Both installed package manifests declare MIT; their license files accompany the packages. See [DefinitelyTyped PNG definitions](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/pngjs) and [Zod](https://github.com/colinhacks/zod). Preserve applicable notices when packaging dependencies. |

Existing Node `26.7.0` and pnpm `10.32.1` execute the workspace tools; they were not installed by this art slice. `pnpm-lock.yaml` records resolved JavaScript dependencies. This document does not replace notices for the rest of the game stack.

### Reproducible local installation and processing

`bash tools/art/install-pixel-snapper.sh` installs Pixel Snapper with `--version 1.0.0 --locked --jobs 2` into `tools/art/.local`. It uses an existing Cargo when available; otherwise its Linux x86-64 bootstrap uses the [official Rust installer](https://static.rust-lang.org/rustup/dist/x86_64-unknown-linux-gnu/rustup-init), a minimal `1.88.0` toolchain, isolated Cargo/Rustup homes, and `--no-modify-path`. It does not use sudo. Aseprite discovery uses the existing Steam libraries or an explicit valid `ASEPRITE_BIN`; it does not install Aseprite.

The locally built Snapper binary SHA-256 is `e620e4f0e490c50df602a922ec888cd52aa606089b1d0cb38183f8f53e19c832`. This identifies this build, not a promise that another platform/compiler produces identical executable bytes.

Real export/cleanup repeatability was exercised by `tools/art/verify-toolchain.ts`. The rejected native `--pixel-size 1` pass changed adaptive dimensions and damaged detail. Production processing instead enlarges prepared native pixels 4× with nearest sampling, invokes real Snapper with fixed 4-pixel clusters and the master palette, then explicitly normalizes and validates output dimensions. Per-asset processing records retain input/output hashes, actual tool versions and settings hashes; Aseprite invocation alone is not visual approval.

## Provider adapters versus generation actually exercised

| Provider | Actual status | Rights and capability limits |
| --- | --- | --- |
| Codex session built-in image generation | Exercised for the retained source sheets and revenant revision below. The source-file bridge imports actual output bytes; the standalone CLI does not pretend to invoke an unavailable generation API. | Model identifier, seed and itemized generation cost were not exposed. They are not guessed; unmeasured cost is not zero. Source records say provider service terms apply and do not guarantee ownership, exclusivity or third-party clearance. |
| PerfectPixel Studio / `ppvalidate` | Adapter only; headless executable and provider credentials absent. No live output or comparative quality result. Upstream CLI/source inspected; adapter uses bounded base-image generation only. | [Upstream MIT license](https://github.com/gykim80/perfectpixel-studio/blob/main/LICENSE) applies to the software, not blanket rights in its backend models, input references or generated outputs. [Primary repository](https://github.com/gykim80/perfectpixel-studio). No animation/facing completeness is inferred. |
| PixelLab | Adapter/transport tests only; API credential absent. Official `POST /v2/create-image-pixflux` contract implemented, not a live paid request. | [Official API documentation](https://api.pixellab.ai/v2/docs) describes the service contract, not an open-source model or blanket output license. Subscription, billing, applicable service terms and input/output rights require operator verification before use. |
| ComfyUI | Adapter/transport tests only; no configured local backend, workflow or model weights. No inference performed. | [Upstream ComfyUI license](https://github.com/Comfy-Org/ComfyUI/blob/master/LICENSE) is GNU GPL version 3. Workflow/custom-node and model-weight licenses are separate; no model rights follow from that software license. Adapter requires an explicitly authored workflow with model/license notes and accepts only loopback HTTP. |

Credential diagnostics record presence only, never secret values. A working RTX 4080 probe establishes hardware availability, not an installed model, a provider subscription, sufficient capacity for an arbitrary workflow, or commercial rights. Mock HTTP transport tests establish request/error handling, not generation quality. No fair quality winner is claimed among unexercised providers; see [the bake-off record](GENERATOR_BAKEOFF.md).

## Retained generated artwork

Exact original prompts are in `assets/art/source/generation-prompts.json`; the replacement prompt is in `assets/art/source/revisions.json`. The four original sheets were commissioned with original Theandril descriptions, with no third-party game artwork supplied as references. Their actual dimensions differ from requested logical canvases; deterministic extraction/registration is recorded separately rather than describing originals as already native production sprites.

| Retained source, relative to `assets/art/source/` | Actual dimensions | Role |
| --- | --- | --- |
| `units-original.png` | 1448×1086 | Three current unit families, four supplied idle poses each. |
| `objects-original.png` | 1536×1024 | Village/town/city and ruin/watchtower/resource sheet. |
| `terrain-original.png` | 1448×1086 | Twelve terrain/biome source cells. |
| `roster-original.png` | 1536×1024 | Future unit/creature roster source sheet. |
| `revenant-v2.png` | 1254×1254 | Separately generated replacement addressing the revenant's tablet/hand connection; source for `monster.revenant` version 2. |
| `objects-alpha.png` | 1536×1024 | Rejected attempted background correction: painted checkerboard instead of usable transparent alpha. Retained as evidence, not substituted for the original object source or counted as an accepted sheet. Prompt key: `rejectedObjectsCorrection`. |

These are five retained production-source generation outputs plus one rejected correction attempt, not six accepted art sheets. The initial revenant candidate is separately retained under `assets/art/rejected/monster.revenant`; a replacement does not erase its rejection history. Exact source hashes, prompt hashes, revision references and review evidence are recorded in each asset's manifest. Future roster art does not add canonical units or gameplay.

## Faction source additions

The faction slice adds four accepted source sheets, each 1254×1254: `factions/ashen_compact-v4.png`, `factions/reedbound_council-v1.png`, `factions/cinder_march-v1.png` and `factions/glass_tide-v1.png`. These are actual built-in generation outputs, not recolors of one runtime body. The original faction prompts are retained in `faction-generation-prompts.json`; `faction-revisions.json` preserves exact Ashen revision prompts and three rejected predecessors. Revision 1 omitted the engineer and had an opaque background; revisions 2/3 restored roles but painted a checkerboard with alpha 255 everywhere. Revision 4 has 931,322 fully transparent pixels and all 15 roles. Rejected files are retained, never atlased.

The dedicated [faction index](../../assets/art/faction-index.json) records source hashes and exact extraction rectangles/settings. Reviewed irregular rectangles avoid neighboring sprites; Glass surveyor/city additionally use source-bound disconnected-component IDs, retaining every alpha≥128 source pixel once. Source/crop review seals and recomputed component definitions reject stale metadata. Exact final sources pass real Pixel Snapper and Aseprite processing; all 60 individual approvals retain byte-identical PNG/export/editable evidence. The [review decisions](reviews/faction-base-kits.json) identify every final input seal and immutable review image. Prepared brief `createdAt` values are a fixed production-batch day stamp for deterministic preparation, not a provider-reported generation timestamp; actual approval timestamps are recorded separately. Model identifier, seed and itemized cost remain unavailable, not invented. Generated-output rights remain subject to provider terms and review; this adds no blanket clearance claim.

## Slice 12 individual raster sources

The two new cultures, two biome stamps and five paid land improvements use **39 actual built-in generation calls for 37 accepted target assets**. Each requested asset had a distinct call and exact prompt. Synod cart revision 1 faced left and was individually rejected; heavy-infantry revision 1 clipped its helmet ornament at the source edge and was rejected before native preparation. Both original PNGs/reasons remain retained and neither entered the atlas. Revision 2 supplies each accepted replacement.

The complete [current source index](../../assets/art/source/slice12/generation.json) and immutable `assets/art/source/slice12/<id>-vN.json` records retain prompt, provider, source SHA-256, actual source dimensions, reviewed full-silhouette alpha bounds, native dimensions/pivot and native hash. Original files total approximately 57 MiB in the durable repository; these source images are not served to the browser. No third-party reference art, culture-sheet copying or skin/steel tint pass was used. Model identifier, seed and itemized provider cost were not exposed; service terms and rights uncertainty remain explicit.

`scripts/art-slice12.ts` refuses clipped or nontransparent source margins, then performs recorded nearest fitting and exact palette preparation. Existing native-tool processing uses actual Pixel Snapper 1.0.0 and Aseprite 1.3.18.3-x64; every asset has its own byte-bound approval, retained editable source/export and native/enlarged review evidence. The main reviewer additionally inspected the [complete pack](reviews/slice12-all-1x.png), both enlarged family sheets, land props and both biome repeat previews before authorizing atlas publication. Exact input hashes are retained in [review order](reviews/slice12-all-order.json).

The published 134-asset/152-frame atlas needed one 2048² page after an explicit 1024² overflow; old 97 approved source/frame pixels remain unchanged. Reversed-input packing is deterministic. This is 16 MiB per decoded RGBA page, with separate potential map and DOM decodes. No animation, naval hull art, biome-transition family, complete provider bake-off or final gameplay acceptance is implied by source approval.

## Original code-native overlays (retained foundation)

`tools/art/create-overlay-briefs.ts` is the retained original integer-coordinate authoring source, recorded as provider `theandril-integer-overlay`, model `integer-overlay-v1`. No external bitmaps, model weights or provider-generated pixels are used by this authoring step. Its eight 64×64 assets contain 17 distinct supplied frames with fixed `(32,32)` pivots, exact master-palette colors and hard alpha:

- `effect.selection`, `effect.movement`: one static frame each.
- `effect.melee`, `effect.projectile`: four genuine one-shot frames each, 100 ms/frame; projectile includes approach, impact, wood splinters and opaque-cluster fade.
- `effect.magic`: four genuine one-shot frames, 125 ms/frame.
- `terrain.road`, `terrain.river`, `terrain.transitions`: one static frame each; road/river are matching east–west straight pieces only, transition is east-edge only. No complete junction/adjacency set is claimed.

The current CLI packages these under `idle/se`; that label does not invent six facings or turn effects into looping idle animations. Roads, rivers, transition coverage and magic remain future presentation foundations until canonical observations and actual consumers support them. Generated source briefs do not grant approval. Project licensing policy governs the original code/art; no new external rights or license are invented here.
