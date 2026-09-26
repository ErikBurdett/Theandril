# Charter templates publication review

Review date: 2026-09-25. Implementation source: **`3ed4a6c456c3e4130fddf35b44dfdf51034cc269`**.

**Status: factual/editorial, image-provenance and local production-layout review passed.** Edition 08 and the current roadmap match the committed implementation and its evidence. No blocking factual or layout correction is required. This is a bounded publication review, not 1.0 acceptance; deployment and live readback remain parent responsibilities.

## Independence and scope

This reviewer did not author edition 08, its current-roadmap changes, template UI or preference storage. The reviewer did author the new gameplay and production browser journeys and capture the original gameplay images. Checking their committed results and presentation here is evidence reconciliation, not independent re-execution of those journeys. The parent separately executed the production test. Runtime/storage independent reviews remain the separately linked reports; this task edits only this publication report.

## Verified implementation facts

- The committed full-suite log records **1,902 tests across 237 files**, **55.46 seconds**, with four local workers.
- The affected development-browser log records **16 passing journeys in 1.8 minutes**: four new template journeys and twelve existing charter/posting/recovery/registry journeys. These are not complete gameplay or cross-browser acceptance.
- The production log records **one passing built-production journey in 8.2 seconds** overall; the individual test duration is 7.4 seconds. It uses two generated Tiny/two-realm campaigns, ordinary founding, browser reload, Recall, explicit Apply, manual save, narrow revocation and restoration without development hooks.
- These scopes are separate and must not be summed. Publication Pages checks, publication-specific headless totals and live readback are later evidence, outside this implementation claim.

The primary README and these three logs match their bytes at the source pin. All **seven runtime/test/fixture hashes** in the retained screenshot provenance match the pinned files. All **three original screenshot hashes, dimensions and byte counts** match their pinned files.

The implementation keeps a separate browser-origin IndexedDB preference library. It holds at most **24 templates** with names up to **40 characters**, a focus and a per-work ceiling. Names are trimmed and compared without case for uniqueness. Choosing a saved row selects that row and its editable name; only Recall fills the policy fields, and only the existing Apply charters action issues canonical commands. Saved template edits/deletion do not change active charters, queues or campaign state. Applied charters remain ordinary saved/replayed campaign state.

Reads and mutations validate bounded stored records; malformed and unsupported data are preserved and visibly refused. Failed-open Retry creates a fresh connection. The browser verifies transient denial followed by successful retry/save, permanent denial, and malformed-row preservation while direct Apply remains available. The library has no cross-device sync, standalone import/export or live refresh of another tab's changes. Concurrent writes serialize; competing edits to one template use the last committed write.

Rules/save remain **31**, content remains **`015468d1`**, and no AI policy, price, canonical command or worker protocol changed. No new pacing measurement is claimed. Prior headline results remain Standard **234**, Long **342**, Epic **379**, with Standard/Long above their approximate targets.

## Original image inspected

The proposed controls image is the direct Playwright locator capture of `[data-testid="charter-templates"]` at a **390 × 844** viewport. It measures **318 × 724**, **81,322 bytes**, SHA256 **`c13d1faf13474cd790dee991d426c51e82c0a9d2ea7970470585a144529cccea`**. It was not cropped, resized or re-encoded after capture.

The inspected pixels show Study charter, saved Learning/32, keyboard focus on Recall and the explicit instruction to review the policy before Apply. The browser-local/non-exported preference disclosure is visible. The scene is an authored Legendary/gen4/seed20260905 fixture with forty owned hearths, one hundred owned armies and 4,000 total armies. Capture occurs after browser reload and keyboard recall, before canonical assignment; it must not be described as an already-applied charter or organic mature-campaign growth.

The public copy equals the original PNG at the implementation pin, byte for byte. Its manifest dimensions, size and hash match the actual file. The caption accurately labels the authored scene, reload/restoration, keyboard Recall and separate Apply action. The reviewer also opened and inspected the public-copy pixels. The frontend and public provenance manifests are identical.

The thirteen published images total **3,118,774 bytes**, leaving **26,954 bytes** under the unchanged **3 MiB** budget. All twelve historical media records are unchanged. No image was generated or transformed for this publication.

## Candidate factual review

The entry `charter-templates`, sequence **8**, titled **Keep a charter worth repeating**, pins the complete implementation revision above. Its player example, explicit Recall/Apply boundary, preference/campaign distinction, storage limits, corrected Retry behavior and known limitations agree with source and evidence. The article reports separate implementation test scopes without summing them, preserves the distinction between the authored Legendary scenario and generated production campaigns, and leaves this article's publication checks to later evidence. Independent runtime-review labels accurately identify the independently reviewed portion of each report and retain the authorship disclosures in those reports.

All **31 distinct evidence paths** in the new article and current library exist at the immutable implementation revision. The entire historical content beginning with edition 07 remains byte-identical, preserving all **seven prior dispatches** and their source pins. The current roadmap advances to 25 September and the implementation pin while keeping rules 31. Delivered charter-policy templates replace the stale missing-charter-template claim; broader army templates, production sequences, named groups, governor decisions, theaters and mature-realm acceptance remain open.

Roadmap counts remain **6 completed checkpoints, 13 in progress and 4 pending**. Release-gate counts remain **0 completed, 13 in progress and 2 pending**: all fifteen whole gates are open. M3 and empire management remain in progress. No new gameplay obligation, scope cut, completion percentage or release acceptance was introduced.

Read-only checks compared Git blobs, source-path existence, PNG headers, byte equality, SHA256 and JSON records. The changed content/media/roadmap tests preserve old assertions and add the new bounded claims; browser expectations now consistently use eight dispatches and the new title/slug. The one CSS rule limits the exact controls illustration to its native 318-pixel width. This review has run no browser or publication command.

Candidate SHA256 values:

| File | SHA256 |
| --- | --- |
| `apps/web/src/updates/content.ts` | `ecf15a31631e5b3560692f4471ee72c3c4735417fbfead78073d59597ad67325` |
| `apps/web/src/updates/library.ts` | `f291978bbd9d18aebefd3840fd28f995c5a9feb5dd6224588050807b5eddcacc` |
| `apps/web/src/updates/media.json` | `8174a6a378cf8545d5bb1c5ffcdd026b7ed384fa258c979a9278551024fed1af` |
| `apps/web/public/updates/provenance.json` | `8174a6a378cf8545d5bb1c5ffcdd026b7ed384fa258c979a9278551024fed1af` |
| `apps/web/src/updates/journal.css` | `6b21fdb76f098700cabbb59cdb65fac059c53a117d060e4adff538d1ae4e99d2` |

## Production layout review

The reviewer opened all twelve original `reader-top.png`, `reader-chapter.png` and `charter-templates-controls-illustration.png` captures from the parent's production Pages run. The exact reviewed pixels and four corresponding `layout-evidence.json` records are retained under [publication-layout](publication-layout/), with their source paths and SHA256 values in [provenance.json](publication-layout/provenance.json). All sixteen retained files were compared byte for byte with the reviewed original artifacts and against those hashes; no image transformation occurred.

| Viewport / text scale | Retained evidence directory |
| --- | --- |
| 1440 × 1000 / 100% | [Desktop](publication-layout/gameplay-updates-readable-journal-at-1440px-and-100-text/) |
| 1366 × 768 / 100% | [Laptop](publication-layout/gameplay-updates-readable-journal-at-1366px-and-100-text/) |
| 390 × 844 / 100% | [Narrow](publication-layout/gameplay-updates-readable-journal-at-390px-and-100-text/) |
| 390 × 844 / 130% | [Narrow, enlarged text](publication-layout/gameplay-updates-readable-journal-at-390px-and-130-text/) |

The title, summary, chapter text and caption reflow within their reading columns. The enlarged narrow title wraps onto three lines without overlapping navigation or the subtitle. Chapter text and the long provenance caption remain readable and scroll normally. The controls image, Recall focus ring, final instruction and inspection/original-image links are present. The raster preview shrinks within the narrow column, especially with enlarged page text, so its smallest embedded text loses clarity; the scaling caption and original-image link preserve the explanation and access to the original pixels. This is a preview limitation, not missing source pixels or a blocked reading path.

The four retained JSON records identify the actual `/Theandril/updates/charter-templates-controls.png` production-subpath URL, decoded natural width 318, no page/resource errors and no game workers. The passing journeys assert horizontal overflow of at most one pixel, image loading, empty-search recovery and navigation. These are local Chromium results; no additional browser was launched by this reviewer.

## Separate publication checks

The parent-run [Pages log](publication-pages.log) records **30 passing journeys in 44.5 seconds**, including the production template journey again. The [publication headless log](publication-tests.log) records **1,904 passing tests across 237 files in 55.37 seconds**. These later scopes are not summed with each other or substituted for the article's immutable implementation counts.

The [initial publication typecheck failure](publication-typecheck-initial.log) is retained: TS2367 rejected a new test's comparison of a narrowed open-gate union with `completed`. The parent corrected that test-only assertion to require an open status. The subsequent [roadmap recheck](publication-roadmap-recheck.log) passes **9 tests**, and final [typecheck](publication-typecheck.log), [lint](publication-lint.log) and [production build](publication-build.log) pass. The catalogue, runtime, source pins and images did not change for this correction. The reviewed candidate hashes above still match the final public sources.

No unresolved publication-review blocker remains. All fifteen whole release gates remain open; live deployment verification is a separate final parent check.
