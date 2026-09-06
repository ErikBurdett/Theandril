# Generator and processing bake-off

Date: 2026-09-05. Hardware: i9-13900K, 31 GiB RAM, RTX 4080 (16 GiB); local model backend not configured. Built-in image-generation latency roughly 49–57 seconds per original source sheet; tool does not expose itemized cost/model/seed. Cost is unmeasured, not zero.

## Actual candidates

Comparable roles authored in four original source sheets: armored infantry and four idle frames, mage, undead/non-human infantry, large creature,12-tile terrain family, and village/town/fortified city. Exact prompts and original files are retained in assets/art/source. These are source candidates, not evidence of completed directional combat animation or new game rules.

Visual review rejected the first revenant's detached tablet despite passing machine checks. A fifth generation produced its version-2 replacement with joined arms/tablet; native/enlarged review accepted it. A separate attempted transparency correction had visible checkerboard pixels and was rejected; the original object sheet's real alpha was verified directly. These failures are retained as provenance, not concealed by selecting only passing outputs. Eight original integer-authored overlay assets supplement the generated family; their road/river/fringe variants are deliberately partial.

| Provider/process | Observed result | Automation and limits |
|---|---|---|
| Codex built-in image generation | Original silhouettes/materials and usable RGBA sources produced. Needs deterministic native extraction, palette/alpha cleanup and visual review. | Session tool used successfully; no independently callable Node API/model/seed exposed. |
| Pixel Snapper1.0.0 on native1px inputs | Rejected: changed adaptive grid dimensions and visibly erased guard detail. | Deterministic but not a quality-preserving setting for already native images. |
| Pixel Snapper1.0.0 on nearest4x inputs, fixed4px clusters | Retains readable scarf, blade, armor and figure proportions in native comparison. | Selected processing configuration; output dimensions still explicitly normalized/validated. |
| Aseprite1.3.18.3 | Editable source, real idle tag, four distinct250ms frames and lossless PNG/JSON export verified. | Repeated outputs identical; installed Steam binary reused. |
| PerfectPixel Studio | Not visually scored: credentials/headless installation absent. | Real upstream ppvalidate adapter; base-image mode only. |
| PixelLab | Not visually scored: API credential absent. | Implemented official Pixflux-v2 still-image contract; other APIs remain future work. |
| ComfyUI | Not visually scored: no configured backend/workflow/models. | Local-only workflow adapter with bounded polling, explicit bindings/provenance. |

There is no fair winner among untested providers. Current category choice is the available built-in generator plus reviewed native processing for source sheets, and deterministic code-native authoring for simple semantic overlays. Professional-quality mass production and provider-specific animation/identity bake-offs remain open until actual capabilities and rights can be exercised.
