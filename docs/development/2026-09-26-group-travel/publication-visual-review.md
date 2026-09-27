# Dispatch 11 rendered publication review

Reviewed 27 September 2026. **Pass for the retained Chromium publication layouts:**
1440 × 1000 and 1366 × 768 at 100% text, and 390 × 844 at both 100% and 130% text.
No blocking clipping, overlap, missing illustration or unreadable caption was
found in the inspected pixels.

Authorship disclosure: this reviewer authored dispatch 11, its catalogue/media
integration and the small article-image width rule. The reviewer did not author
the existing journal renderer or execute these publication browser runs. This
is a rendered layout inspection, independent of browser execution but **not** an
independent review of the article author's own factual claims. The separate
[publication review](publication-review.md) covers those claims and provenance.

## Exact inspected captures

All sixteen images were opened at their original pixel resolution, without
resizing, compositing or regenerating them. They are retained under
[publication-captures](publication-captures/), in the four
`gameplay-updates-readable-journal-at-…` directories. Each directory contributes
`explore-top.png`, `reader-top.png`, `reader-chapter.png` and
`group-travel-results-illustration.png`. Full-page and no-results captures are
also retained there, but are not counted among these sixteen inspected images.

| Viewport and text scale | Archive and reader | Chapter and illustration |
| --- | --- | --- |
| 1440 × 1000, 100% | Navigation stays on one row; the two-column feature and article title, date, summary, back link and chapter navigation have clear separation. | The reading column has comfortable line lengths. The full result, inspection control and caption are visible without collision. |
| 1366 × 768, 100% | The shorter viewport retains the complete heading and summary; lower controls continue below the fold normally. No horizontal cropping is visible. | Paragraphs and section headings fit the reading column. The illustration and its full caption match the wider rendering. |
| 390 × 844, 100% | Site links wrap, with the play link on its own row. The feature title wraps over four lines; the article title uses two. The All dispatches link remains distinct and readable. | Paragraphs reflow to one column. The complete caption and Original image link fit the 310-pixel figure capture; the result strip is visible. |
| 390 × 844, 130% | Branding, navigation, edition, title and date grow and wrap without overlap. The title occupies more of the viewport; summary and chapter links continue below it. | The chapter heading and body text scale visibly, retaining normal vertical scrolling. The 292-pixel figure capture shows the full caption, enlarged Inspect image control and Original image link. |

The archive's desktop preview expands the tiny result raster to the feature
column, making its bitmap text visibly coarser than the surrounding live text.
The result remains legible. The article's figure is bounded to 318 CSS pixels
and shrinks with the narrow reading column. This display scaling does not change
the original file: the supplied PNG remains the exact **318 × 19**, **2,337-byte**
capture, SHA-256
`5a18a317736a6e99a2cf1dd18bef8c8175a4486e0e99a56b1f4d03fd01adfb67`.
The live caption scales with text settings; raster lettering itself is an image.

## Caption and navigation boundaries

The visible result is **100 orders accepted · 0 refused.** The caption accurately
calls it an authored hundred-army regression, identifies its native dimensions
and 390px capture viewport, and limits it to accepted orders rather than every
route, synchronized arrival or an organically grown realm. The full caption is
readable in all four isolated figure captures. Inspect image and Original image
remain visibly separate controls. The article headline, 27 September date,
edition 11, reviewed-checkpoint label and source checkpoint are consistent with
the intended dispatch. Screenshot inspection establishes their appearance, not
an independent manual click-through.

All four corresponding [initial Pages journeys](publication-pages-initial.log)
passed. Their [test source](../../../tests/gameplay/updates.spec.ts) checks
loaded images, a caption font of at least 14px, no more than one pixel of
horizontal overflow, and successful archive-to-feature navigation. Each retained
`layout-evidence.json` reports the actual `/Theandril/updates/group-travel-results.png`
URL, natural width 318, a complete image, no page/HTTP errors and no simulation
workers. These checks support the pixel inspection; they do not replace it.

That initial invocation is retained as **32 passed, one failed**. Its sole
failure expected the previous 1,975-test scope-ledger text after the catalogue
correctly advanced to 2,000. The parent updated that stale test expectation;
there was no runtime or layout correction. Final repeated Pages and full-suite
results belong to their separate logs and are not inferred here.

This approval covers the four retained local Chromium publication layouts only.
It does not certify live deployment, Firefox/WebKit, the entire game's
accessibility, campaign performance or any release gate. M3 and all fifteen
release gates remain open.
