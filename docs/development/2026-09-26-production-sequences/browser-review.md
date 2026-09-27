# Production sequences: browser and image review

Reviewed 26 September 2026. **Visual verdict: pass. The exact compact result PNG
is approved as a narrowly captioned journal illustration.** Final displayed
journal layout and publication verification remain separate parent checks.

## Independence and evidence scope

This reviewer authored the sequence editor, template-library UI and registry
wiring. This is not an independent review of that source. The reviewer did not
author the gameplay journeys, generated production journey, worker or store, and
did not run another browser. The parent ran the retained tests; this review
inspects their actual pixels, test source, logs and capture metadata independently
of the browser author. The separate [UI source review](ui-review.md) discloses its
own authorship boundaries.

[Final affected gameplay](browser-final.log) passes **30 journeys in 3.9 minutes**:
ten new sequence/storage/response scenarios and twenty existing journeys.
[Generated built production](production-initial.log) passes **one journey in
7.3 seconds**, **8.3 seconds for its complete invocation**. The
[full implementation suite](tests.log) passes **1,975 tests across 247 files in
59.76 seconds**. These are overlapping scopes, not an additive test total.

The authored Legendary/gen4/seed20260905 journey uses forty owned hearths, one
hundred owned armies and 4,000 armies overall. A real paid granary queue and two
Works policies make preservation meaningful. Ordinary controls exercise saved
hearth-group recall, list ordering/removal/repeated recruitment, template CRUD,
reload, explicit keyboard Recall, paid application, individual additions and
saved restoration. Preferences preserve campaign hash and worker traffic and are
absent from the actual portable export. Separate journeys cover budget,
duplicate/full-queue/prerequisite refusal, denied/transient/malformed storage and
five actual-worker damaged-reply/crash recovery paths.

The first run's **9/10** result remains in [browser-initial.log](browser-initial.log).
Its one failure expected one total request and observed two. The final observer
requires exactly one production request/state plus the selected army's existing
target-free movement query/reply, correlated by request ID and the final hash.
No arbitrary extra request or second state is accepted. The retained
[capture transcript](screenshots/capture.json) records a 4,400,231-byte state
payload, 39 packed-cell bytes and a separate 923-byte movement JSON reply. Browser
structured-clone framing is outside those measurements. The batch pays 1,440 coin
for 120 queue commands and matches serial hash `fd8bc27b`; its prior hash is
`fdfd0520`. This was a corrected measurement assertion, not a change to gameplay
or a relaxation of the one-batch/one-state requirement.

## Pixels inspected

All four original files were opened with the image viewer. Their byte counts,
dimensions and SHA256 values match [provenance](screenshots/provenance.json).
The captures are untransformed Playwright PNGs.

- [Desktop](screenshots/production-sequences-desktop.png), **1440 × 1000**:
  the registry is scrolled to the recalled Realm watch library and explicit
  Apply production (40) action. Nominal shared cost, existing queue, refusal and
  prerequisite explanations remain readable. Template selection/name and all
  four library actions fit without overlap. This viewport does not display the
  entire editor at once; the upper list is above its scroll position.
- [Narrow](screenshots/production-sequences-narrow.png), **390 × 844**:
  the production selector, Add project, blocker disclosure and ordered rows fit
  within the modal. Move/remove controls form readable rows with distinct disabled
  boundaries. The third project continues below the viewport in the scrolling
  pane; this is not a full-height editor capture. The real journey operates the
  remaining controls and asserts no horizontal page overflow.
- [Result](screenshots/production-sequence-results.png), **318 × 39**:
  both lines are readable and complete: forty hearths complete, zero partial or
  refused, 120 orders accepted and zero refused. It contains the status paragraph
  only, without surrounding controls or the itemized result disclosure.
- [Generated restored queue](screenshots/production-sequence-restored-narrow.png),
  **390 × 844**: Second Sequence Hearth displays Root cellar followed by Charter
  market after portable restoration. The queue, standing-charter/muster controls
  and canonical already-built-or-queued blocker remain readable. The real
  generated Tiny/two-realm journey uses seeds 20260926 and 77, crosses campaigns
  with a personal template and verifies paid queues, manual save/reload,
  compressed export/import and exact replay through public APIs. It has no
  development hook or authored campaign mutation.

These images and journeys support the specific desktop/narrow and keyboard flow.
They do not independently certify screen-reader behavior, enlarged text, every
browser, sustained render performance or organically grown mature campaigns.

## Journal image approval and claim reconciliation

The result PNG is **4,767 bytes**, SHA256
`44df6255d9dabde13d6a027269e57305290d57f145df0d73be12be48edc54e53`.
Its public copy at `apps/web/public/updates/production-sequence-results.png` is
byte-identical. It was captured directly with
`[data-testid="group-production-results"] > p:first-child` inside a 390 × 844
viewport at device scale 1. The CSS element bounds were x36, y504.625,
width318, height37.78125; the native locator raster is 318 × 39. No post-capture
crop, resize or re-encoding occurred.

Approved caption scope: **actual result summary from the authored forty-hearth
Legendary/gen4/seed20260905 regression after Guard → Workshop → Guard; 120 paid
queue orders, complete at all forty hearths.** Link the full captures for editor
context. This approval does not present the small image as the complete editor,
an organic realm, a performance chart or whole-gate acceptance. The current
caption has the right factual limits and now reads “Guard: 120” and
“Native 318 × 39 capture from a 390px viewport”, with the requested spacing
corrections applied. Final displayed journal layout is reviewed separately.

The inspected edition 10 draft, **Queue a plan across your hearths**, now uses
implementation pin `420219d278ae17f42a04871c6319ecf62a4af216`. All eight of its
evidence paths exist at that pin. Its 1,975/247, 30 gameplay and one separate
production claims match the logs above. The distinct Small-map worker probe
matches 210,762 versus 22,970,874 measured bytes, 6,864 result bytes and hash
`bbbaecff`; its scale is kept separate from the authored Legendary browser and
single-sample giant-worker benchmarks. Article bytes inspected have SHA256
`e85fe6890145269e29c7881939d263ef804616d919f91e6a8529cf29627f81c9`.

The parent reconciled the two stale README draft statements flagged during this
review: the retained serial-probe figures and the now-passing forty-hearth journey.
Historical logs and failures remain part of the evidence. This bounded gameplay
review does not substitute for the separate final article/catalogue/source-pin
and publication-layout reviews.

Rules/save 32 and content `015468d1` are unchanged. M3 and all fifteen release
gates remain open; no publication or deployment success is inferred here.
