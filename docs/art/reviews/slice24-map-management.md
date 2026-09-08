# Slice 24 — map management visual review

Reviewed 2026-09-07 from the final original-size PNGs in `test-results/slice24-map-targeted`, subsequently retained unchanged in `docs/art/reviews/slice24/`. The parent also inspected the desktop and narrow images. The parent integration run reported **6/6 targeted scenarios passing in 17.3 seconds**. This review is independent image inspection, not a separate browser execution or a performance measurement. The larger 122-scenario run was still in progress when this note was written; this is not full-release or 1.0 acceptance.

## Observed result

- The desktop floating panel is now capped at 680 pixels, rather than spanning almost the whole 1000-pixel viewport. Its title, close button and side-panel switch remain distinct. Construction and army-route content use the internal scrolling area.
- Desktop map controls have readable, fitting text. The new text controls no longer inherit the old narrow zoom-button width. The targeted scenario also checks text fit and the zoom controls' minimum 44-pixel dimensions.
- The 390×844, 130%-text Quarry image shows a readable enabled action, its 36-coin price, three-turn duration and actual yield tradeoff. The floating panel ends above the complete campaign feedback row; the turn counter and End turn control remain clear.
- The hundred-army scene identifies the selected Witness column and its actual formation, strength and movement summary. It does not render a hundred separate management cards. The scenario, not the collapsed-select screenshot alone, proves access to all 100 co-located army options and the town/tile choices.
- The accompanying narrow capital image shows the city within its hex and readable wrapped map controls. The terrain/improvement fixture visibly includes procedural glyphs and a `partial pixel pack` status; these images do not establish new raster artwork for every improvement.

## Remaining polish, not a newly identified critical blocker

- The already-queued Root cellar remains the first construction card. In the compact land list, unavailable Managed woodlot and Reedworks cards surround the legal Measured quarry. These disabled cards and their useful explanations still consume substantial attention and scroll space; showing legal choices first or grouping unavailable choices would improve the compact view without discarding blockers.
- The location selector and management tabs scroll with the content. During deep improvement inspection they are above the visible scroll position, although the selected-hex heading, close button and side-panel switch remain available. Persistent compact local navigation is a possible later refinement.
- The narrow map controls wrap into two rows and cover some canvas area. Their text and targets now fit; the tradeoff is less unobstructed terrain, not inaccessible controls.
- A floating panel necessarily covers part of the world and, in the captured desktop placement, part of the upper selection/navigation area. The close and side-panel alternatives remain clear. No additional placement redesign was undertaken during the frozen full-suite checkpoint.

No runtime, gameplay-test, canonical-state, renderer, or approved-art changes were made for this review.

## Exact reviewed evidence

These durable copies were retained by the parent from the actual targeted-run outputs; the PNG hashes are unchanged.

- [Founded settlement and production, desktop](./slice24/map-founded-production-desktop.png)
  - SHA-256: `f39da1e65a897e2e4c4a630a6b402488961b03d1b6893a0b59f5fdd5805d84be`
- [Hundred-army location menu](./slice24/hundred-army-location-menu.png)
  - SHA-256: `4c8850d85ad532ae489cdcc794b841f1e685e22d8a2d81590bb6bf1116cb6dd7`
- [Paid Quarry quote at 390px and 130% text](./slice24/map-land-quarry-390-text130.png)
  - SHA-256: `660c3ecc128a93148a379f17bad96c6294a58f7e1c2eeff05d2fda506250a8b0`
- [Capital and improvements at 390px](./slice24/capital-and-works-390.png)
- [Inset capital, near view](./slice24/inset-capital-near.png)
