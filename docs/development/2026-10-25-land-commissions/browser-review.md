# Land commission browser and image review — 25 October 2026

Reviewer: `land_policy_ui`, **the author of these controls and journeys**. This is
a disclosed self-review of actual rendered pixels, not independent UI approval.
An independent source review is retained separately; independent visual review
and any later journal layout review must identify their own scope.

## Actual gameplay checks

The new production cases pass in the running whole Pages suite:

- Generated paid-work completion/restoration: **5.0 seconds**.
- Narrow keyboard/manual takeover: **3.3 seconds**.

The whole suite subsequently finished with **all 74 cases passing in 5.3 minutes**.
[The run log](browser-full.log) owns that result; this visual review inspects only
the three new commission images below. These two cases are included in the whole
suite and their counts are not additive.

The generated seed 20260905 setup uses ordinary founding, a Food worker policy,
two food-funded growth turns and direct worker allocation before a from-save
browser journal starts. It authors no terrain, population, purse or deposit.
The browser first protects the full 70-coin treasury, then replaces a waiting
100-coin allowance with 50 and reserve zero. The initial paid order costs 22;
after its completion the next costs 25 under existing cultivation scaling.
Both sites are complete on turn 7 with 3 allowance remaining and 15 journal
records. Started and restored hash: `8ee96751`; completed hash: `075f0687`.
Exported campaigns are replay-checked by the helper before comparison.

The separate narrow case rejects empty, negative, fractional and unsafe inputs,
applies by keyboard, cancels paid work without refund, then starts a direct paid
construction order while a commission waits for its reserve. Both successful
manual orders end the commission. Its final treasury is 26, with four records
and hash `5add1cc4`; cancelled intermediate hash is `43ccfef6`.

## Inspected source images

Actual files inspected from the run's `/tmp/theandril-land-commissions-pages/`
output before retention under this packet's `browser-results/` directory:

| Image | Native size | Bytes | SHA256 |
| --- | --- | ---: | --- |
| `production-land-policy-a-g-f003a-ores-the-exact-saved-policy/land-commission-completed.png` | 806 × 573 | 220,589 | `f283a6b3e6739d3642fc3f8fd0ca709d14fbdef329ec7bff99416f1641edfa24` |
| `production-land-policy-a-g-f003a-ores-the-exact-saved-policy/land-commission-summary-native.png` | 806 × 45 | 14,026 | `d92f139925dd68ed1c80615221427d19367f461f9316926de6ca15e861b239e7` |
| `production-land-policy-lan-00366-row-width-with-exact-replay/land-commission-narrow-130.png` | 390 × 844 | 232,949 | `06545225f7f8cc27256911ac11a40ced3204c18a6a4f7cfb22e5973bdac81394` |

No image transform, crop, resize, re-encoding or generation was performed. These
are PNG captures from real production controls and retain their native pixels.

## Displayed findings

- The full desktop panel shows Terraced fields, 3 coin left, current no-suitable-
  tile waiting information, both coin inputs and explicit Apply / End controls.
  Text wraps inside its 806-pixel width with no overlap or obscured action.
- The narrow screenshot at 390px / 130% text is scrolled to the two amounts and
  actions. Both actions are readable and fully inside the dialog. The tested End
  bounds satisfy the 44px minimum and viewport containment; the document has no
  horizontal overflow. Policy explanations wrap within the scrollable body.
- The narrow image does not show the improvement dropdown or commission heading
  at this scroll position. Its final explanation continues below the body edge
  and remains scrollable; that viewport crop is not evidence that the complete
  panel fits without vertical scrolling.
- The native summary says only “Land commission” and “Terraced fields · 3 coin
  left.” It does not show the town, turn, paid history, candidate preview or form.
  It is suitable as a supporting illustration only when its caption and linked
  full-panel/journey evidence describe those limits.

No blocking layout defect found within these inspected captures. Cross-browser,
whole-realm usability, every scroll position and full accessibility acceptance
are not established by these cases.

## Candidate journal use

The exact native strip fits the existing journal asset cap: adding its 14,026
bytes to 3,641,840 gives **3,655,866 bytes**, leaving **14,150 bytes** under the
unchanged 3,670,016 cap. This arithmetic is not publication approval. The actual
public copy, provenance record, independent review and displayed journal layouts
still require verification. No historical image bytes should change.
