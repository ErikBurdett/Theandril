# Morrow Spore candidate review — 2026-09-06

Status: **15 unapproved candidates**, not atlas or runtime publication. Sixteen actual built-in image-generation calls produced fifteen selected sources and one retained rejected badge. No previously approved pixels were changed.

The planned first-pass prompts are preserved verbatim in `prompts.json`; exact successful-call prompts, timestamps, SHA-256 hashes, provider, unexposed model, and null seeds are in `generation.json`. Native extraction records and versioned briefs retain source bounds and processing hashes. The initial badge was a multi-subject montage and is explicitly rejected in `ui.badge.morrow_spore-v1.rejected.json`; v2 is a newly generated single badge, not a crop from the rejected sheet.

Actual source-backed Pixel Snapper 1.0.0 (`fixed-palette-pixel4`) and Aseprite 1.3.18.3-x64 processing completed. `art.ts validate --family morrow_spore` passed all 15 candidates with structural scores of 100; those scores do not establish visual approval. One southeast idle frame exists per asset, with no fabricated animation/directions.

## Review evidence

[Native-size family sheet](review/morrow_spore-1x.png), [nearest 4x family sheet](review/morrow_spore-4x.png), [stable sheet order](review/morrow_spore-order.json). Individual native/4x images with each exact asset ID are retained in the same `review/` directory. The agent inspected the family at native size and every individual enlarged image; final approval belongs to the parent reviewer.

| Asset | Concrete native/enlarged observations |
| --- | --- |
| `unit.colonist.morrow_spore` | Shelf-canopy handcart, visible wheels, connected shafts and adult puller facing right; wide silhouette makes the person smaller than a standalone fighter. |
| `unit.scout.morrow_spore` | Lean adult archer with open bow arc, clear feet and angled torso; no floating haze remains. |
| `unit.guard.morrow_spore` | Medium-width armored adult, blade on left and distinct broad shield on right; pale trim groups define shell armor. |
| `unit.spearman.morrow_spore` | Upright spear projects above the adult figure; spearhead and shield remain separate readable forms. |
| `unit.heavy_infantry.morrow_spore` | Broadest standing infantry silhouette, oversized overlapping shoulder plates and heavy shield; not a recolored guard source. |
| `unit.cavalry.morrow_spore` | Right-facing complete horse/rider, visible tail, legs and diagonal lance; no hoof or weapon clipping. |
| `character.marshal.morrow_spore` | Pale-haired adult, left-hand command staff and split long coat; identity comes from silhouette, not tiny insignia. |
| `character.surveyor.morrow_spore` | Raised pale map is readable against dark torso; free hand and separate legs remain visible. |
| `character.engineer.morrow_spore` | Rolled plans form a pale shoulder-side cluster, hammer and apron visible; smallest tools necessarily lose fine detail at 64 pixels. |
| `settlement.village.morrow_spore` | Three broad shelf-roof volumes, pale doorway frames and linked platforms; compact open frontage. |
| `settlement.town.morrow_spore` | Denser connected roof cluster, perimeter palisade and central raised hall; same 96px canvas as village with more developed built mass. |
| `settlement.city.morrow_spore` | Larger 128px civic complex, tall central crescent finial, side towers and clear front gate. Source alpha bounds have real margins (x7/y7/w1382/h1090 in 1402×1122), with no manual padding/crop repair. |
| `ui.crest.morrow_spore` | Pale hollow crescent and three seed forms framed by wide fungal shelves; complex decoration is subordinate to the center. |
| `ui.banner.morrow_spore` | Narrow hanging cloth with crescent finial; pole/point and cloth are contained on the fixed anchor. |
| `ui.badge.morrow_spore` | v2 is one compact round umber medallion with pale crescent and mauve seed cluster, not a concept sheet; simplified 32px strategic mark. |

## Limits and pending checks

The fixed master palette makes the requested mauve cloth subdued and largely brown; broad shelf silhouettes, pale edging, and the crescent/seed seal carry most of the distinction. Source detail is deliberately reduced to current 32/64/96/128 native contracts. Source preview haze was removed only by the existing reviewed alpha128 threshold, never by an RGB background eraser. Transparent margins, pivots, palette membership and frame dimensions pass, but these candidates still require the parent's individual visual decision and later real-game near/far/narrow review. No unique unit mechanics or unsupported game objects are implied by the artwork.
