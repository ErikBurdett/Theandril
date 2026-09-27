# Group travel visual review

Reviewed 26–27 September 2026. **Pass: desktop, narrow review/controls,
generated production and the native result are approved.** This reviewer authored the
new browser journeys, but did not author the group-travel runtime UI or execute
the retained browser run. Pixel inspection is separate from the automated
assertions and the other agents' source reviews.

The retained [affected run](browser-final.log) passes **21 gameplay journeys in
2.6 minutes**. The [focused follow-up](browser-focused.log) passes **six in
53.6 seconds**: four repeated movement journeys and two earlier posting-recovery
journeys. Their union is **23 unique affected journeys**, not 27. The initial
run retains six passes and one aggregate 45-second timeout. Trace inspection
showed both hundred-army batches completing; repeated large readbacks and
export/replay work consumed the combined test budget before individual
cancellation completed. The journey was split into independent initial-travel
and continuation scenarios, preserving the 45-second limit and all movement,
archive, cancellation and save assertions. Browser readbacks now project only
asserted fields. These are test changes, not gameplay rule changes.

## Inspected exact pixels

All files below are in [screenshots](screenshots/). Their actual PNG bytes,
dimensions and SHA-256 match the retained provenance.

| Image | Native dimensions | Bytes | Verdict |
| --- | --- | --- | --- |
| `group-travel-desktop.png` | 1440 × 1000 | 531,780 | Pass |
| `group-travel-narrow.png` | 390 × 844 | 132,627 | Pass |
| `group-travel-controls-narrow.png` | 390 × 844 | 167,206 | Pass |
| `group-travel-results.png` | 318 × 19 | 2,337 | Pass, bounded journal use |
| `production-group-travel-restored-narrow.png` | 390 × 844 | 119,429 | Pass |

The desktop image clearly shows the group-travel disclosure, hundred checked
armies, destination 7718, replace mode, review action, canonical costs and
per-army route rows. Immediate movement, advisory previews and no automatic war
are explained. Its scroll position shows the review rather than the entire
editor and Apply action together; no overlap or horizontal clipping is visible.

An earlier narrow image showed a blank green review-list area above its
page-one-of-four navigation. That capture was explicitly not approved as proof
of review readability. The
[initial narrow capture](browser-initial-artifacts/group-travel-narrow.png)
from the first run had shown companies 001–003 correctly at that scroll position.

Source inspection found a normal `ul` with `max-height:280px; overflow-y:auto`,
inside the separately scrolling campaign window. No group-travel CSS rule hides
its text at this width. The follow-up reissues Review routes through ordinary
controls after resizing, asserts the first row visible and in the viewport, and
waits two browser animation frames before the native capture. It then separately
captures Apply and the posting explanation after ordinary scrolling. **No runtime
or CSS change was made for this capture correction.** The original blank capture,
141,111 bytes with SHA-256
`79b1078ac30d94b3326dc421c2e692d72af53a1c2266e7fc6a40d9e718a6fc7b`,
is preserved unchanged at
[`browser-final-initial-artifacts/group-travel-narrow.png`](browser-final-initial-artifacts/group-travel-narrow.png).

The fresh review image clearly shows the destination, mode, immediate-movement
and advisory warnings, summary and company rows with fourteen steps/movement.
The separate controls image shows populated rows, pagination, enabled Apply,
the three-posting preservation warning and disabled resume/cancel controls.
Text and controls fit without overlap or horizontal clipping. These are two
honest scroll positions, not a claim that the full editor fits simultaneously.
The retained geometry places company001 at y577.203125–666.765625 within the
390 × 844 viewport, with the 280px list at scrollTop0. The evidence supports a
capture-timing/paint correction, not a reproduced persistent missing-content rule;
it does not identify an underlying Chromium compositor defect.

Final screenshot SHA-256 values:

| Image | SHA-256 |
| --- | --- |
| Desktop | `223b07ee0c0e73aa8ac892053b1c9c12cce12dccf1644787c72d14dc1c2ea793` |
| Narrow review | `11e52e1441bbc1d87174cc64d052112468c76a9359572890c9aaf59f93c5cbd6` |
| Narrow controls | `d41fce0a37a5c4df1e047e070f54dda8dda54e9c5fb40b69ccb36db1db48443f` |
| Native result | `5a18a317736a6e99a2cf1dd18bef8c8175a4486e0e99a56b1f4d03fd01adfb67` |
| Generated production | `f1939f8c26acc7b6d0497545bb2fe0c744b284ef98e08c2507c9505c025e31b0` |

## Generated production follow-up

The [separate built-production run](production-initial.log) passes one journey:
**5.3 seconds for the test, 6.3 seconds for the complete invocation**. It uses
ordinary generated Tiny/two-faction campaign controls at seed 20260927, actual
downloads and public replay, with no development hook. Route review changes no
archive or campaign state; explicit movement matches serial canonical commands.
The journey verifies preserved postings, cancellation and exact manual and
portable restoration. This scope is separate from the authored mature fixture.

The retained restored narrow PNG has SHA-256
`f1939f8c26acc7b6d0497545bb2fe0c744b284ef98e08c2507c9505c025e31b0`.
Its focused disclosure, two selected armies, destination/mode controls, movement
warning, Review action and preserved-postings explanation fit at 390px. Apply is
correctly disabled because reopening restored controls requires a fresh review.
Resume is disabled because no paused route is selected. Remaining controls
continue below the viewport in the scrollable window. No overlap or horizontal
clipping is visible; this image does not claim to show every control at once.

## Native journal candidate

The result paragraph actually reads **100 orders accepted · 0 refused.** Its
SHA-256 is
`5a18a317736a6e99a2cf1dd18bef8c8175a4486e0e99a56b1f4d03fd01adfb67`.
It is a direct Playwright locator screenshot, with no subsequent crop, resize or
re-encoding. CSS bounds in the capture record are x36, y727.046875, width318,
height18.890625; the native raster is 318 × 19. Its 2,337 bytes fit the existing
6,839-byte public-media allowance without changing any older image or budget.

Approved caption scope: the actual successful result after explicitly queuing
one destination for a hundred armies in the authored Legendary/gen4/seed20260905
fixture. The fixture has forty owned hearths and 4,000 total armies; its local
rewritten corridor clears only the rewritten cells' deposits. Three canonical
postings and a saved army group are present. This is a result-only illustration,
not the complete editor, an organically earned realm or whole-scale acceptance.

The capture record retains hash `f7316f9b` before orders and `ee0bea78` afterward,
an 18,086-byte compact review reply in the final capture, and one group-movement state plus the
selected army's separate target-free movement query at the same final hash.
The state payload is 4,431,710 bytes. These are scenario measurements, not a
frame-time or full-turn performance claim.

Any later publication layout remains a separate check. M3 and all fifteen
release gates remain open.
