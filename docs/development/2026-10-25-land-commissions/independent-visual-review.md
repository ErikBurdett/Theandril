# Independent displayed review — land commissions

Reviewer: `/root/land_governor_audit`, independent of the UI author and browser
scenario author. All three retained PNGs below were opened with the image viewer
and inspected at their actual displayed composition. No browser run, image edit,
resizing or runtime change was performed for this review.

## Verdict

No blocking clipping, overlap, contrast or control-legibility problem is visible
in these captures. This is a review of the three recorded surfaces and their
specific scroll positions, not complete game accessibility or browser acceptance.

## Displayed findings

- **Desktop commission panel, 806 × 573:** title, exact improvement, remaining
  allowance and reserve are visible. The completed state reads Terraced fields,
  3 coin remaining and 0 reserve. Its no-suitable-tile message is visible beneath
  that status. The selector and two labeled amount fields fit without collision;
  Apply and End commission are full-width controls. The text clearly distinguishes
  replacing an allowance from adding funds, permission from escrow, and commission
  reserve protection from other realm spending. Material/site protection, manual
  takeover and cancellation consequences remain readable. No geometry is hidden
  behind the panel's bottom edge.
- **Native summary, 806 × 45:** this exact narrow strip shows only Land commission
  and Terraced fields · 3 coin left. It contains no town name, turn, quote, fields,
  active work or before/after proof. It may serve as a supporting journal image
  only when a readable caption explains the outcome and links the full evidence.
  The small right-hand raster text will be difficult to read when scaled down to
  phone width; an inspection/original link and accessible text remain necessary.
- **Narrow capture, 390 × 844 at 130% text:** the selected-orders window fits the
  viewport. Amount fields stack, their labels and values remain legible, and the
  Apply and End commission buttons are fully visible with comfortable heights.
  Paragraphs wrap inside the panel. The capture is intentionally scrolled: the
  improvement selector above the amount fields and the final explanation below
  the viewport are not fully shown. The sticky window title occupies its header;
  the partial field at the top is a scroll-boundary crop rather than evidence of
  an overlapping field layout. No horizontal overflow is visible. This frame
  shows the earlier 28-coin allowance state, not the completed 3-coin desktop state.

## Behavior evidence and limits

The browser scenario source separately checks keyboard application/cancellation/
manual construction, invalid amount rejection, a fully visible End control at
least 44px tall, horizontal viewport bounds and no page errors. Its exports prove
reserve waiting, allowance replacement, actual payments 22 and 25, completion of two
sites, 3 coin left and exact saved restoration. Those behavior claims come from
the browser assertions and exported metadata, not from the static images alone.

The retained completion metadata identifies a generated seed 20260905 hearth grown
through ordinary commands before the from-save browser journey; no authored
population, purse, terrain or resource deposits are claimed as organic progress.
The narrow image captures the funded policy before its later cancellation and
manual takeover; it does not itself show the final construction event.

## Exact reviewed files

| Capture | Dimensions | Bytes | SHA256 |
| --- | --- | ---: | --- |
| [land-commission-completed.png](browser-results/production-land-policy-a-g-f003a-ores-the-exact-saved-policy/land-commission-completed.png) | 806 × 573 | 220,589 | `f283a6b3e6739d3642fc3f8fd0ca709d14fbdef329ec7bff99416f1641edfa24` |
| [land-commission-summary-native.png](browser-results/production-land-policy-a-g-f003a-ores-the-exact-saved-policy/land-commission-summary-native.png) | 806 × 45 | 14,026 | `d92f139925dd68ed1c80615221427d19367f461f9316926de6ca15e861b239e7` |
| [land-commission-narrow-130.png](browser-results/production-land-policy-lan-00366-row-width-with-exact-replay/land-commission-narrow-130.png) | 390 × 844 | 232,949 | `06545225f7f8cc27256911ac11a40ced3204c18a6a4f7cfb22e5973bdac81394` |
