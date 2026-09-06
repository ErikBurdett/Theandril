# 0017 — faction art families

Date: 2026-09-05. Status: implemented, published and verified; final combined 458-test / 43-scenario regression and native/in-game screenshot inspection pass.

## Identity and coverage

There are four implemented faction definitions, not 24/32/40 authored cultures. Generated seats reuse the actual faction definition. Observations now expose `definitionId` for already-known factions; this adds presentation metadata without changing canonical state, save 7, archive 2, envelope 1, content `9442246b` or simulation hashes.

Each family has fifteen exclusive qualified IDs: six current troops, three current character roles, three presentation settlement stages and crest/banner/badge. Bindings such as `unit.guard.reedbound_council` are unique; assigning a generic content alias to every variant would violate the catalog and select art ambiguously. The browser-safe shared registry maps stable definitions and roles. Names and numeric seat suffixes are not identity, and owner colors do not tint body textures.

## Production boundary

Built-in image generation produced independent original kits. Ashen revisions 1–3 were rejected before processing: missing role/opaque background, then twice painted checkerboards. Version 4 has genuine alpha and all roles. Other families use version 1. Exact prompts, source PNGs, rejection reasons and unavailable model/seed fields are retained. No external provider configuration, payment or rights guarantee was invented.

Requested four-by-four grids had irregular gutters. Explicit reviewed rectangles preserve each silhouette; only Glass surveyor/city need exact disconnected-component masks within overlapping rectangles. Every source alpha≥128 pixel is assigned once, with no clipped component, dropped neighbor, invented pixel or color-key background repair. Source/crop hashes seal reviews; recorded component definitions must match the recomputed graph. Preparation validates all requested sources/manifests/index before output writes. It is not an approval.

Native whole-silhouette fitting, master-palette/binary-alpha normalization, actual Pixel Snapper 4× processing and actual Aseprite tagged/timed export produce candidates. Each processed asset was inspected at native/enlarged size and individually approved against an exact input seal. Strengthening crop provenance changed metadata but the existing 45 processed PNGs were verified byte-identical before their seals were refreshed. Original approvals and editable artifacts remain retained.

## Runtime consumers

Pixi resolves an observed entity's exact culture/role, then its generic role, then explicit procedural fallback. Near/standard views display untinted troops and culture buildings; far view groups actually observed armies per cell/faction into 32 px badges displayed at 16 px, with 64 px town banners displayed at 32 px. Grouping does not scan hidden armies, change canonical hit targets or create new game rules. Selection/ranges/ownership cues remain separate. New faction poses are static; the generic existing idle animations remain real tested fallback/Lab clips.

React uses a separately verified shared DOM atlas cache for public culture crests, own realm, encountered factions, peace negotiation, army banner, actual formation/recruitment icons and own character appointments/details/roster. Native or exact half-size nearest sampling uses stable slots and accessible labels. Missing variants are visibly generic, not broken images. Public reference cards are not a fake player-seat selector and reveal no campaign intelligence.

The 97-asset / 115-frame pack fits one 1024² page, 492,790 PNG bytes. Pixi map residency remains 4 MiB; DOM image decoding can additionally retain 4 MiB, independently of Pixi diagnostics. Two-order offline builds have identical pixels/catalogs. The generic 37 assets remain, including 17 still honestly marked future-only. All 60 faction variants have real consumers. More facings, action animations, less repetitive terrain, integer world-camera fitting and broader authored cultures remain future work.

## Verification

Unit gates bind coverage to actual faction/unit/character definitions, inspect all 60 approved frames/provenance/editable files, compare exact approved-to-atlas pixels and public/retained catalogs, and reject duplicated or pure palette-swapped families. Extraction tests cover irregular layout, real alpha, masks, stale-source reviews, corrupt component records and failure-before-write. Browser scenarios exercise four observed cultures, renamed realms, hidden characters/enemies, actual role consumers, generic fallback and narrow presentation; canonical hash and selection remain unchanged by art interaction. Final screenshot review found and fixed narrow recruitment CSS specificity; stronger computed-layout and unobstructed-card checks pass with the actual sticky footer. [Final browser/performance evidence](../performance/0010-faction-art.md) includes retained screenshots and raw renderer measurements.
