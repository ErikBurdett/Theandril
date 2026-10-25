# Dispatch 21 layout review

Reviewed 2026-10-25 by `next_governor_audit`. This is an independent review of the journal presentation: the reviewer authored the game's group worker-policy controls, but did not author this dispatch, its journal layout or its media integration. The review inspected retained PNG pixels, four layout metadata files, the dispatch/media definitions and the shared illustration component. No browser session, tests or runtime edits were performed for this review.

**Verdict: accept the reviewed journal layout and exact supporting illustration.** No blocking overflow, overlap, obscured article content or illegible prose was found in the sixteen inspected captures. The native screenshot's text is too small to rely on when reduced for narrow screens; the readable caption and image inspection/source controls correctly carry that limitation.

## Exact reviewed coverage

Four captures were inspected at each of these four configurations: `reader-top.png`, `reader-chapter.png`, `worker-policy-growth-illustration.png` and `explore-top.png`. This is **16 actual PNG captures across four viewport/text-scale configurations**, not sixteen independent gameplay scenarios.

| Evidence directory under `browser-results/` | Viewport | Text scale | Illustration/caption capture |
| --- | --- | --- | --- |
| `gameplay-updates-readable-journal-at-1440px-and-100-text/` | 1440×1000 | 100% | 660×192 |
| `gameplay-updates-readable-journal-at-1366px-and-100-text/` | 1366×768 | 100% | 660×192 |
| `gameplay-updates-readable-journal-at-390px-and-100-text/` | 390×844 | 100% | 310×262 |
| `gameplay-updates-readable-journal-at-390px-and-130-text/` | 390×844 | 130% | 292×417 |

Each directory's `layout-evidence.json` records the requested dimensions, the worker-policy image fully loaded with natural width 806, no captured page errors and no game workers. These are local production Pages captures using the `/Theandril/` base path; they are not a live-host readback. This review does not claim the parent’s still-running full Pages acceptance suite has completed.

## Typography, wrapping and navigation

At both desktop sizes, “Keep growing hearths at work” fits the article headline area, the subtitle and lead have clear separation, and the chapter body uses a consistent readable column. The journal index presents the new dispatch and its supporting image in separate columns without collision. The chapter screenshot begins at its intended section heading; content continuing below the viewport is normal page scrolling.

At 390px, the article title, metadata, index title and navigation wrap within their containers. At 130%, the three-line article title, two-line subtitle and larger body type remain readable with clear paragraph separation. The navigation's development-build link occupies a separate row rather than overlapping the other links. The reviewed chapter headings and paragraphs remain within the parchment reading area at both mobile scales. Texture stays outside or behind a quiet reading surface and does not obscure text.

No fixed element overlaps the reviewed chapter content. These static captures do **not** establish all keyboard focus states or every scroll position. The shared keyboard enlargement case in `tests/gameplay/updates.spec.ts` opens the historical `twenty-four-cultures` image; it is not a per-asset keyboard test for this new worker-policy image. This review does not claim new-image keyboard enlargement, focus return or dialog inspection was exercised.

## Illustration accuracy and legibility limits

The public asset is the exact reviewed native summary from source checkpoint `97b248ed596c931f01d0df66d60fcf25f819eaef`:

- `apps/web/public/updates/worker-policy-growth.png`: **806×45**, **13,857 bytes**.
- SHA-256: `b2187886f1ea66aa11e085ffb403833d6a776e4680a08a1e318f0cb61d098666`.
- The retained [image review](image-review.json) records exact source/public byte equality, 24 unchanged historical assets, 25 total images, 3,641,840 total bytes and 28,176 bytes remaining below the unchanged 3,670,016-byte cap.

The desktop embedded image is already reduced, and at mobile width its raster labels are visibly tiny. Increasing page text to 130% increases the caption/control text; it cannot increase the information in this shallow source strip. Accept it as a supporting illustration only, with no claim that the miniature itself is a readable game control or complete growth proof.

The caption remains readable at all four configurations and accurately says that only Food and `2 / 2 assigned` appear; the turn counter, hearth identity, prior state and policy controls are absent. Generated seed, turn 3 and nine-record restoration are explicitly attributed to the linked journey rather than invented visible pixels. The dispatch's prose repeats that distinction. “Inspect image” and the underlined “Original image” link are visible and remain clear of the caption. Shared `Illustration.tsx` provides the actual image-dialog button and source-revision link; source review establishes the wiring, not successful interaction with the new asset.

The public strip is unchanged, uncropped by the journal and accompanied by honest context. No broader release, mature-empire, cross-browser or accessibility gate is closed by this layout review.
