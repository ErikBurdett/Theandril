# Layered HUD, compact army orders and larger towns

2026-09-07; main reviewer `/root`. This is a presentation slice on the preserved `b17900d` worktree, not a new sprite publication or 1.0 signoff.

## Art direction and retained materials

The owner requested the adorned high-fantasy style of the local **Theandril: Hearth & Card** project. Its actual CSS, reviewed material manifests, runtime images and desktop reference were inspected read-only. The resulting interface uses dark walnut, leather-like reading surfaces, cream text, brass borders and restrained static corner decoration, with Georgia headings and system body text. It does not import another commercial game's icons or artwork.

Three reviewed WebPs are byte-identical copies, not newly generated or edited raster assets. Original approvals, optimized-entry hashes and the sibling's separate artwork license are retained. They add 68,784 download bytes and an estimated 2.0625 MiB of potential separate DOM RGBA decoding, not Pixi atlas residency. [Exact provenance and limitations](slice25-hearth-materials.json).

## Actual UI review

- [Desktop army popup](slice25/hud-compact-unit-desktop.png): 320-pixel shell, compact opening actions and separate route/composition/officer/battle panes. Text and 44-pixel controls are retained; condensation does not mean shrinking touch targets. The map occupies the full application width between the top treasury/navigation and bottom selection/next-action/turn tray.
- [Full army orders](slice25/hud-army-orders-desktop.png): actual command controls in a native modal, with an independently scrolling body and persistent close/header area. Floating labelled map buttons open registries and specialist windows.
- [Town land popup](slice25/hud-town-land-desktop.png): the existing 420-pixel city interface remains, with real selected-tile prices/actions rather than a redesigned replacement or duplicate query consumer.
- [Narrow compact popup](slice25/hud-compact-unit-390-130.png) and [full orders](slice25/hud-orders-390-130.png): actual 390×844 viewport at 130% text. Popup bounds use measured top/bottom HUD obstructions. The window reads as one column and does not extend the document horizontally.

The first narrow full-orders capture exposed a real float-induced skinny text column. [Rejected layout](slice25/rejected-narrow-orders-float.png) remains recoverable; the map-return control now occupies its own row. The corrected image above was inspected, not inferred from numerical checks. Wood-pattern repetition remains visible in the wide bars; muted washes keep it behind the text. The art-development strip is still present only in development.

## Settlement fitting contract

Native sprite canvases include transparent margins; fitting those whole canvases made towns look undersized. Runtime fitting now uses the exact union of the approved opaque pixel squares, maximized inside six inset-hex support planes. Village/town/city stages use 82%/92%/100% of the radius-27 inset. No approved texture is cropped or tinted; transparent canvas edges may extend beyond the hex while visible artwork does not. Selection contours share the fitted transform.

The Ashen visible widths increase from 21.667/23.438/28.422 to 36.979/40.529/42.427 world units for village/town/city. These are visible-body widths at identical world scale, not a camera zoom comparison. All 75 approved settlement variants are checked against their actual PNG pixels and published atlas frames. Exact atlas/approval/pivot/frame identity guards invalidate stale metadata. Improvements retain their preceding 30-unit fit and ruins 28; armies, fleets and far banners are unchanged.

Main inspected the actual equal-2.2× [camp](slice25/inset-camp-near.png), [town](slice25/inset-town-near.png) and [capital](slice25/inset-capital-near.png), plus [all ten paid works](slice25/all-ten-works-and-three-town-stages.png) and the [390-pixel capital view](slice25/capital-and-works-390.png). The body fills its central tile with clear tier progression, without an oversized neighboring-tile canvas; the crown/name are separate contextual annotations. The same test verifies remembered foreign construction remains hidden and camera changes leave the save hash unchanged.

The four six-culture city reviews cover all 24 current families: [first](slice25/culture-cohort-1-stage-3-near.png), [second](slice25/culture-cohort-2-stage-3-near.png), [third](slice25/culture-cohort-3-stage-3-near.png), [fourth](slice25/culture-cohort-4-stage-3-near.png). Each was inspected from its actual retained screenshot. The galleries preserve distinct silhouettes and complete visible bodies. Dark Mire woodwork still has weaker contrast against earthy terrain, and faction-native detail remains minified; increasing size is not new texture detail or terrain-palette unification. Automated alpha containment is necessary, but not itself visual acceptance.

[Final integration/performance evidence](../../performance/0037-layered-hud.md) records separate broad and corrected runs rather than treating source approval or screenshots as a complete test pass.

## Limits

This does not create new faction sprites, seamless terrain transitions or complete animation coverage. Five advanced improvements remain explicit procedural identifiers. Far heraldry is still deliberately small; tiny native detail is not readable at every zoom. Full orders expose a long list of existing systems, now within a scrollable window rather than permanently consuming the map. Large-map AI contact, long-campaign timing and software-rendered battlefield performance remain separate release gates.
