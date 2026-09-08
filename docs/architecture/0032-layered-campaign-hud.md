# Layered campaign HUD and visible settlement footprints

2026-09-07; slice 25. Inspected history at `b17900d`, preserving the dirty worktree.

## Player-facing structure

The strategic map occupies the width between a compact top identity/resource bar and a bottom selection/next-action/turn tray. Permanent left and right panels are removed. Floating, text-labelled map buttons open the actual realm registry, characters, progression, diplomacy and journal. World overview remains a camera operation. The guide explains movement, queued journeys, tile management and shortcuts, and can collapse the selection tray.

`CampaignWindow` uses the browser's native modal dialog, a fixed heading/close area and one internally scrolling body. The map remains mounted beneath it. Closing restores a connected opener or the map, without issuing an order or clearing the selection. `body`/document placeholders do not count as meaningful openers after a popup disappears. Explicit map-return actions defer keyboard focus until native modal teardown; this includes registry selection, Show on map and character Locate from a nested orders window. Ordinary Close/Escape still restores a valid opener. The registry remains paginated and searchable; choosing an entry focuses the map and returns to the command tray. Selected orders reuses the former inspector's actual controls. Specialist character/research windows retain their existing input ownership.

The army map popup opts into a 320-pixel compact shell. Its initial pane contains movement, founding when available, and route/battle shortcuts. Composition, officers, routes, battle, transport and hex details mount only when selected. Town popups retain the 420-pixel production/land interface. A distant map click opens the route pane directly, before any queued order is accepted. Popups reserve the measured top HUD and bottom command tray at every width, not an assumed fixed footer height.

Campaign settings is a bounded, scrolling overlay beneath the top navigation. Outside pointer input dismisses it; Escape closes it and returns focus to its summary before global map shortcuts can act. Open settings, popups and native windows own keyboard input. Native battle/capture flows remain separately guarded.

## Shared authority and data boundaries

All paid actions still use ordinary worker commands. `managementPanes` remains the shared command surface; there is one current land-query consumer, not simultaneous hidden copies in a popup and full window. React receives the same compact observations and does not acquire a world-cell mirror. Registry and journal navigation are read-only. No canonical rules, save fields, content IDs or campaign hashes change in this slice.

The existing 24 faction sprite kits remain untinted. Card Shop's three reviewed UI materials are copied byte-identically with their source approvals, optimized-record hashes and separate artwork license retained. These DOM backgrounds are not added to the Pixi foundation atlas. The theme is scoped to the application; geometry lives in a separate stylesheet. The sibling Card Shop checkout is read-only. [Provenance](../art/reviews/slice25-hearth-materials.json).

## Town sizing

The preceding full-canvas caps made visible towns too small because their native canvases include transparent padding. The renderer now uses a compact, exact-identity table of the union of nontransparent pixels across each approved settlement's frames. Six support planes account for the real silhouette, including whole opaque pixel-square corners. A bounded uniform-scale/translation fit is cached once per loaded asset, rather than scanning pixels per town or animation frame.

Village/town/city fill 82%/92%/100% of the radius-27 inset's support planes. A silhouette need not fill its empty bounding-box corners. Diagnostics distinguish the opaque union from the untouched canvas. Selection contours use the same transform; canonical cells, picking, fog and ownership do not change. Improvements, ruins, army figures and far banners retain their preceding fit.

The table is guarded by atlas SHA, exact approval hash, native size, pivot and frame rectangles. Stale/missing identity falls back to conservative full-canvas fitting. Tests decode the actual approved and published PNGs for all 75 settlement variants, verify equality, containment and motion-union stability. The selection diagnostic includes its existing one-native-pixel external contour: its dimensions are opaque dimensions plus `2 × scale`, not the opaque-body bounds themselves. New settlement publication must update the geometry table and those exact-pixel checks; a metadata table is not a new art approval.

## Acceptance

Actual pointer/keyboard scenarios cover native window navigation, compact army controls, unchanged town production/land queries, paid/save continuation and 390-pixel enlarged text. Equal-zoom town review, original-material provenance and the before/after Huge renderer measurements accompany this checkpoint. These are scoped presentation checks, not 1.0 or all-device signoff. The full-width canvas changes visible workload geometry, so the resulting cache/frame comparison is not a matched-camera optimization claim.
