# Edition 10 publication visual review

Reviewed 26 September 2026. **Pass: no blocking visual or publication-claim
finding.** The reviewed article is **Queue a plan across your hearths**, pinned
to implementation `420219d278ae17f42a04871c6319ecf62a4af216`.

The reviewer authored the production editor and template UI, but did not author
this article or execute the final publication browser run. This is an independent
inspection of the retained production journal pixels, their layout records and
the reported publication evidence; it is not an independent review of the
reviewer's own implementation. The separate [factual review](factual-review.md)
covers source links, historical preservation, current catalogue and provenance.
The [gameplay review](browser-review.md) covers the actual editor and saved play.

## Final production layout

Inspected all sixteen PNGs under [publication-captures](publication-captures/):
`reader-top.png`, `reader-chapter.png`,
`production-sequence-results-illustration.png` and `explore-top.png` in each of:

| Capture directory suffix | Viewport | Text scale | Verdict |
| --- | --- | --- | --- |
| `1440px-and-100-text` | 1440 × 1000 | 100% | Pass |
| `1366px-and-100-text` | 1366 × 768 | 100% | Pass |
| `390px-and-100-text` | 390 × 844 | 100% | Pass |
| `390px-and-130-text` | 390 × 844 | 130% | Pass |

The complete directory names begin `gameplay-updates-readable-journal-at-`.
The desktop title, date, navigation, chapter text and illustration remain readable.
The narrow layouts wrap the navigation and headings without overlap or visible
horizontal clipping. At 130% text, the chapter and caption use more vertical
space as expected; their content remains readable and the Inspect and Original
image links remain distinct. The small raster itself does not gain enlarged HTML
text, so its factual result is also expressed in the readable article and caption.
Desktop featured-card scaling visibly enlarges its pixels without obscuring the
result. The reader retains the compact illustration.

All four `layout-evidence.json` records identify the loaded image at the actual
`/Theandril/updates/production-sequence-results.png` production subpath, intrinsic
width 318, `complete: true`, and empty error and worker arrays. These records
support the observed journal layout; they do not claim a simulation ran inside
the journal.

## Exact image and caption

The published asset is the exact approved native **318 × 39**, **4,767-byte** PNG:

`44df6255d9dabde13d6a027269e57305290d57f145df0d73be12be48edc54e53`

It matches the retained gameplay result image, captured directly from the result
paragraph in a 390 × 844 viewport, with no later crop, resize or re-encoding. The
larger publication illustration captures include its mat, links and caption;
their dimensions are not the dimensions of the source asset.

The final caption correctly describes the authored forty-hearth regression,
Guard → Workshop → Guard and 120 paid queue orders. Its corrected wording reads
“Guard: 120” and “Native 318 × 39 capture from a 390px viewport”. It explicitly
limits the image to the result summary and does not represent it as the complete
editor, an organically earned realm or whole-scale acceptance. The image remains
approved for this use. Total journal imagery remains **3,138,889 bytes**, below
the unchanged 3 MiB limit by **6,839 bytes**.

## Verification and scope

[Final Pages execution](publication-pages.log) records **32/32 passing journeys
in 1.1 minutes**, including all four journal layouts and the built production
sequence journey. The [initial publication run](publication-pages-initial.log)
retains 28 passes and four stale test-expectation failures; the parent corrected
the edition count, roadmap pin/wording and ledger expectations before the final
passing run. The source illustration pixels did not change.

[Publication headless checks](publication-tests.log) record **1,977 tests across
247 files in 58.02 seconds**. These later publication checks are separate from
the article's immutable implementation evidence: 1,975/247, thirty affected
gameplay journeys and one separate generated production journey. Their counts
are not added together. The article and current caption preserve the authored
fixture, generated-play and single-sample worker measurement distinctions.

Reviewed candidate SHA-256 values:

| File | SHA-256 |
| --- | --- |
| `production-sequences.ts` | `e85fe6890145269e29c7881939d263ef804616d919f91e6a8529cf29627f81c9` |
| `content.ts` | `4869eb31818ab643b6caa05024b702f1b3fa22070ccb7072f84c1508734be093` |
| `library.ts` | `668317018954a9701bef45ea57aa132a7f684957384862d5755e66518fab79b7` |
| `media.json` and public `provenance.json` | `7d9a224480b3cb36706906eb87b8c0006d0dca746f34c094fb599120c668a331` |
| `journal.css` | `3342c4b1d3884022407848d6d130ad02b826632385fe5130fce67b8920a66cce` |

Rules/save 32 and content `015468d1` remain unchanged. M3 and all fifteen release
gates remain open. This approval covers the retained local production journal
and the bounded claims above; it does not establish live deployment identity,
screen-reader acceptance, other browser engines or whole-game scale acceptance.
