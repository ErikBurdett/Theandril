# Independent displayed journal review — dispatch 22

Reviewer: `/root/land_governor_audit`, independent of the journal/UI author.
All sixteen actual PNGs listed below were opened with the image viewer and
inspected; this verdict is not inferred from CSS, metadata or passing tests.
No browser run or image transformation was performed by this reviewer.

**Verdict: no blocking displayed-layout finding in the reviewed surfaces.**
The native summary is supporting illustration; its tiny raster text is not
readable at narrow display sizes. Readable captions and inspection/original links
carry the meaning and remain essential. This is not whole-browser or accessibility
certification, nor release acceptance.

## Viewports and inspected states

| Viewport | Text scale | Inspected images |
| --- | --- | --- |
| 1440 × 1000 | 100% | Reader top, paid-work chapter, illustration/caption, archive top |
| 1366 × 768 | 100% | Reader top, paid-work chapter, illustration/caption, archive top |
| 390 × 844 | 100% | Reader top, paid-work chapter, illustration/caption, archive top |
| 390 × 844 | 130% | Reader top, paid-work chapter, illustration/caption, archive top |

Desktop headings and article text are clearly separated on the plain parchment
reading surface. Navigation, source status, chapter heading and prose do not
collide. The shorter desktop frame ends naturally during lower page content;
that viewport edge does not imply a missing or clipped page section. The desktop
illustration region shows the full caption and both inspection links.

At 390px, navigation wraps into readable rows and the article becomes a single
column. The title and long date/subtitle wrap within the parchment panel at both
scales. The paid-work chapter's numbers and hashes wrap as ordinary text without
horizontal clipping. The 130% reader-top/archive-top frames show less content
above the fold, as expected; no fixed element overlays the body. Later content
requires vertical scrolling.

All four illustration/caption captures retain the complete explanation and the
Inspect image / Original image controls. On mobile the 806-by-45 raster is reduced
to a thin strip, and its embedded text is too small to read. The surrounding
caption stays readable and explicitly states what the strip omits. It does not
serve as standalone proof of the town, turn, payment history or control state.

## Evidence boundaries

All four retained `layout-evidence.json` files report the correct local production
subpath, an 806px-wide source image loaded completely, no page errors and no worker
requests on these journal views. Their JSON supplements the actual displayed
inspection; it is not a substitute for it.

These are the first affected publication run's four passing layout cases. The
parent reports 18 passes and one stale source-count assertion failure elsewhere in
that run, then corrects only that test expectation for the current pinned source.
No journal source or styling changed for the rerun. The retained failure and
rerun result belong to the publication packet; this visual review does not count
the runs together or claim the failed first run wholly passed.

The existing keyboard enlargement scenario exercises a historical culture image,
not this newly added native strip. This review establishes visible inspection
controls here, not a separate keyboard-enlargement execution for the new asset.
The original game-panel/mobile images have their own independent review in the
source packet and are distinct from these journal layouts.

## Exact viewed files

| Capture | Dimensions | SHA256 |
| --- | --- | --- |
| [1366px-and-100-text / reader-top.png](browser-results/gameplay-updates-readable-journal-at-1366px-and-100-text/reader-top.png) | 1366 × 768 | `6c956a67efd80341f8a2b2f5e6ed6d240a94ca06f0ed68f14a99d18f919966c8` |
| [1366px-and-100-text / reader-chapter.png](browser-results/gameplay-updates-readable-journal-at-1366px-and-100-text/reader-chapter.png) | 1366 × 768 | `50957ecb468492a602a5e8418b1b5dee94ca54a38c24f607e01f4626d0c308dc` |
| [1366px-and-100-text / land-commission-summary-illustration.png](browser-results/gameplay-updates-readable-journal-at-1366px-and-100-text/land-commission-summary-illustration.png) | 660 × 214 | `08a62ae6bae20b524735f9f27afcf3cf44b88bb569e3b9b8be263dff1318138e` |
| [1366px-and-100-text / explore-top.png](browser-results/gameplay-updates-readable-journal-at-1366px-and-100-text/explore-top.png) | 1366 × 768 | `e46623204b5d50aeada396c4ce31a0b802ebce2f53df2c3b0ccae00fd501849a` |
| [1440px-and-100-text / reader-top.png](browser-results/gameplay-updates-readable-journal-at-1440px-and-100-text/reader-top.png) | 1440 × 1000 | `7517085a4b387cc86dc18ebd7cfc3a1316853fd20f40c22f499662716d7761dd` |
| [1440px-and-100-text / reader-chapter.png](browser-results/gameplay-updates-readable-journal-at-1440px-and-100-text/reader-chapter.png) | 1440 × 1000 | `21d7245479b84254a43f27093d5022096264f6daba1778e1445317840872a79c` |
| [1440px-and-100-text / land-commission-summary-illustration.png](browser-results/gameplay-updates-readable-journal-at-1440px-and-100-text/land-commission-summary-illustration.png) | 660 × 214 | `18b1b31ac5e8c14e14d9d1abce626c370e785b4a466160b7fc9696b7851062ec` |
| [1440px-and-100-text / explore-top.png](browser-results/gameplay-updates-readable-journal-at-1440px-and-100-text/explore-top.png) | 1440 × 1000 | `a5d80175cc974e2fc618d816edbcc17c08d781584c92aa1ff4318c68a60287e2` |
| [390px-and-100-text / reader-top.png](browser-results/gameplay-updates-readable-journal-at-390px-and-100-text/reader-top.png) | 390 × 844 | `56b6da24dcee76f315d11cd75ec2a69370a781e93edc28a165d7434976771602` |
| [390px-and-100-text / reader-chapter.png](browser-results/gameplay-updates-readable-journal-at-390px-and-100-text/reader-chapter.png) | 390 × 844 | `ebee83bdcd7d9fbb84345b2b0689552b39055cead7961abfc10df0a71fdf7b04` |
| [390px-and-100-text / land-commission-summary-illustration.png](browser-results/gameplay-updates-readable-journal-at-390px-and-100-text/land-commission-summary-illustration.png) | 310 × 307 | `91982aaa281075d5b0ea71dcea9dce2d4b5c05bc172b0fcced65dc9b45c16028` |
| [390px-and-100-text / explore-top.png](browser-results/gameplay-updates-readable-journal-at-390px-and-100-text/explore-top.png) | 390 × 844 | `e623f3b0d9719b2db09efd26e2b2186bb2e49253701bfb06022d2d398e6ae40f` |
| [390px-and-130-text / reader-top.png](browser-results/gameplay-updates-readable-journal-at-390px-and-130-text/reader-top.png) | 390 × 844 | `2e5f5cc7b7bc9baaf30348923d65e497de26acf3b4dd494288fcb4b58732ef84` |
| [390px-and-130-text / reader-chapter.png](browser-results/gameplay-updates-readable-journal-at-390px-and-130-text/reader-chapter.png) | 390 × 844 | `526f24a07102d185084a73a1cdeb9a41fd1c6caa4de219d52d968180b4b4bcc3` |
| [390px-and-130-text / land-commission-summary-illustration.png](browser-results/gameplay-updates-readable-journal-at-390px-and-130-text/land-commission-summary-illustration.png) | 292 × 504 | `99fa86e2483e904dbe7a019321fa07da8211de1143b44fb12f482d921aa7be89` |
| [390px-and-130-text / explore-top.png](browser-results/gameplay-updates-readable-journal-at-390px-and-130-text/explore-top.png) | 390 × 844 | `dcbc61405ad1a9e03ae5e019380035db5162b0e1747e013461bba098625cfb55` |
