# Resource deposits and extraction works

Sixteen independent original images cover eight natural resources and eight matching buildings: Hearthgrain/Grange, Ironstone/Iron mine, Redcopper/Copper mine, Whitesalt/Salt house, Heartwood/Timber yard, Steppehorses/Remount yard, Witnesssilver/Silver mine and Ashglass/Glass refinery. Each uses its actual canonical content ID.

## Provenance and processing

[Generation records and exact prompts](../../../assets/art/source/resource-works/generation.json) retain original paths, source SHA-256, provider and generation timestamps. These are sixteen separate built-in image-generation calls, not montage crops or recolored duplicates. Model and seed were not exposed by the tool and are recorded as unavailable.

`scripts/art-resource-works.ts` fits the entire original alpha silhouette into a 64×64 native canvas, with a `(32,48)` ground pivot and at most 56×44 opaque bounds. It selects actual source pixels with nearest sampling, normalizes alpha and applies the master palette. This step does not grant approval. Each candidate then passed real Sprite Fusion Pixel Snapper and Aseprite processing. Retained approval directories contain exact frame bytes, editable Aseprite files, export metadata, processing receipts and hash-bound visual review.

The main reviewer inspected every processed [native sprite](resource-works-approved/all-1x.png) and [nearest 4× sprite](resource-works-approved/all-4x.png) before publication. [Review order and hashes](resource-works-approved/order.json) identify the exact sixteen approvals. Natural silhouettes remain distinct from buildings: grain heads, mineral outcrops, pale salt, timber and horses become farm structures, framed mine mouths, evaporation basins, stacked working timber, fenced remount grounds and furnace structures. Iron extraction is deliberately dark; the timber bracing, roof and ore highlights carry its shape. Fine animal and mineral detail simplifies at native scale.

## Runtime contract

All sixteen sprites share the existing 512² `map-works` page with the preceding ten civic/researched props. Foundation pixels remain byte-identical. `scripts/art-improvement-geometry.ts` verifies the exact approved/runtime pixels and records all-frame opaque fits for 31 resource, improvement and civic assets. Live tile art uses an 85% inset-hex fit; runtime code does no per-frame pixel readback.

A charted deposit is visible until a completed improvement replaces it. The resource inspector and Resources panel use the same actual approved assets, with no fabricated extraction before work completion and household assignment. The first browser check caught a real omission in the runtime live-ID allowlist, which has been fixed for all sixteen bindings. Final desktop/narrow screenshots and exact paid-work, production, contract and save checks are linked from [slice 27 verification](../../performance/0039-growth-resources-and-battles.md).

This batch is shared economic artwork. It does not claim sixteen new faction-specific cultural kits or additional hidden gameplay systems.
