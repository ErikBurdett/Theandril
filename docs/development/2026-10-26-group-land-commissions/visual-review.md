# Group land commissions — independent displayed review

Reviewer: `group_land_review`, 2026-10-26. All six images below were opened with
`view_image`, not inferred from metadata. They are actual Playwright production
captures from `/tmp/theandril-group-land-browser-initial/`.

**Verdict for shown states: no blocking clipping, overlap or unreadable feedback.**
The additional narrow form capture below closes the original missing-form
coverage; combined with the lower result capture, the shown mobile flow is
visually approved.
This is a visual review, not independent proof of the state hashes or test pass.

- Desktop 1440×1000, 130%: receipt page 2 shows hearths 26–30 and all thirty
  accepted orders. Text, result filter, page controls and disabled zero-selection
  actions fit inside the ledger window. The panel is intentionally scrolled below
  its input controls. Displayed zero permission refers to the now-empty selection,
  not the already installed commissions; the receipt identifies last submitted
  orders. No ownership/resource rules can be inferred from this screenshot.
- Narrow 390×844, 130%: the completed removal receipt and both disabled actions
  stack within the window. Text wraps without horizontal clipping; current
  settlement rows remain below. The first visible line is a trailing sentence
  because the panel is intentionally scrolled. Inputs and total lie above frame.
- Native 780×28 strip: clearly reads “100 coin per hearth × 30 = 3000 coin total
  permission.” This is a supporting desktop illustration only; it does not show
  reserve, selected hearth names, payment, receipt or completion.
- Three 1440×1000 normal-text fault captures: the complete form remains visible,
  exactly one hearth stays selected, Apply/End are disabled, no success receipt
  appears, and the in-panel error explicitly requires saved-campaign restoration.
  Missing-results and wrong-hearth screenshots share the same honest generic
  uncertainty message. Worker failure has a distinct stopped-worker message.
  The persistent footer repeats feedback but is partially behind the modal; the
  full in-panel message remains readable. Screenshot appearance alone cannot
  establish actual prior payment or subsequent restoration.

Read `group-land-policies-evidence.json` alongside the images: it discloses the
synthetic thirty-hearth/128-army/two-war fixture, authored initial100 coin purse,
four immediate starts and26 waiting commissions, reserve10 and final12 coin.
The browser source/exported replay evidence establishes those outcomes separately.
No organic empire, general network-resilience or complete accessibility claim is
made by these images.

## Exact inspected images

Paths are relative to `/tmp/theandril-group-land-browser-initial/`.

| Capture | Native pixels | SHA-256 |
| --- | --- | --- |
| `production-group-land-poli-a2d26-val-and-restoration-at-130-/group-land-budget-native.png` | 780×28 | `a26079a6ffbba7cba1f75fb945f99305d009f7b57122d13aef558313958c5876` |
| `production-group-land-poli-a2d26-val-and-restoration-at-130-/group-land-policies-desktop-130.png` | 1440×1000 | `488e61e79359c9f101d905441ff8773d78468bbe93f9565453654c52c9818914` |
| `production-group-land-poli-a2d26-val-and-restoration-at-130-/group-land-policies-narrow-130.png` | 390×844 | `b049c6e3818711dfcfd319c4445fc86675956ae9945282743937eaaa12e92d2d` |
| `production-group-land-poli-a5336-on-and-requires-restoration/land-policy-missing-results-recovery.png` | 1440×1000 | `363500491036e615268349eda3aaeea8cf07fd2f3f4c6cc4caa84a5c344cde95` |
| `production-group-land-poli-a71ee-on-and-requires-restoration/land-policy-worker-crash-recovery.png` | 1440×1000 | `a6d41644944f114c6562d83de1ef1c432cb9f1048969ee18dbd5ebcf8629a94d` |
| `production-group-land-poli-ee4fa-on-and-requires-restoration/land-policy-wrong-hearth-recovery.png` | 1440×1000 | `363500491036e615268349eda3aaeea8cf07fd2f3f4c6cc4caa84a5c344cde95` |


## Additional narrow form review

Opened with `view_image`:
`/tmp/theandril-group-land-browser-final/production-group-land-poli-a2d26-val-and-restoration-at-130-/group-land-form-narrow-130.png`.
Retained evidence destination:
`browser-final-results/production-group-land-poli-a2d26-val-and-restoration-at-130-/group-land-form-narrow-130.png`.
Native pixels **390×844**, SHA-256 **`8b797ca597516fec8c8887c802796b2c6c2cafe7a2015af07a2c16b2abef95d5`**.

**Verdict: approved for this shown 390px / 130% form state.** The improvement
selector and both amount labels/inputs are readable and fit within the window.
The focused reserve input has a visible focus outline. The exact 3,000 coin
permission total wraps to two lines without collision or horizontal truncation.
The thirty selected / twenty-seven outside-filter count remains clear. Lower
prose continues through the scrollable panel; the separate narrow removal capture
covers the lower actions/receipt. No single-image claim is made that all prose
and controls fit simultaneously in one mobile screen.

The companion `narrow-form-bounds.json` reports both inputs as318×47.203125px,
inside the window's368×705.109375px scroll region. This is consistent with the
viewed image and the unchanged test requirement of at least44px height and all
four edges inside the region. The test centers the amount group before measuring;
its prior nearest-scroll attempt left the bottom input at a clipped edge.
Centering changes the camera/scroll setup, not the assertion or application.
