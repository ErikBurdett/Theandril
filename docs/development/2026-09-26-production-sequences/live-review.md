# Production sequences: live deployment evidence review

Reviewed 26 September 2026. Publication revision:
`24cd30e309ca191181482b7525d3eac6aebb4fbf`; implementation evidence pin:
`420219d278ae17f42a04871c6319ecf62a4af216`.

**Verdict: the exact deployment/readback checks and final 32/32 live Pages
journeys pass. No blocker remains in this bounded deployment evidence.** The
initial 27-pass/five-failure run, unchanged four-pass/one-failure rerun and
subsequent asset-test dependency correction remain recorded below. This is not
a release-gate signoff.

This reviewer authored the personal production-template store, the two development
browser scenario files, dispatch 10's article/catalogue copy and the later narrow
asset-test correction. This is therefore
not independent review of those authored implementations or editorial claims. The
independent scope here is the parent's deployment record, readback driver/results,
captured live pixels and live Pages execution log. The parent ran the browsers and
queried GitHub; this reviewer inspected the retained evidence and readback source,
compared committed image bytes independently and launched no browser or new suite.

## Deployment and exact readback

[deployment.json](deployment.json) records both **Verify build** and **Publish
development demo to Pages** as completed successfully, with both `headSha` values
equal to the full publication revision above. The retained run IDs are
**36290255014** and **36290255040**. This review checks the recorded identities and
conclusions; it does not claim a second independent GitHub API query.

The [initial deployment record](deployment-initial.json) retains publication
`b5fc0997506e78a8e05fbdd0cf4deea8cf9019d7` and its successful workflow runs
**36286356265** and **36286356241**. Independent inspection of the Git diff between
the two publication revisions found only the asset test and development evidence:
the application, renderer, content, article and public image sources are unchanged.

[live-readback.json](live-readback.json) and its [log](live-readback.log) contain
the same parsed result for `https://erikburdett.github.io/Theandril/`. Inspection
of the parent's readback driver, `/tmp/theandril-production-sequences-live-readback.mjs`,
confirmed that its success output follows assertions for:

- The live change-ledger entry linking to the **full** publication SHA, rather
  than accepting a matching short hash or a supplied command-line value alone.
- The production article's exact heading and its verification link to the P1
  implementation SHA above.
- A successful fetch of the production illustration with bytes exactly equal to
  the local published asset.
- The earlier group-charters article's heading, plus the current empire-management
  roadmap item opening and containing production-template text.
- No captured page exceptions. The readback's empty `errors` array has this scope;
  it is not a blanket assertion that every console or network event was checked.

The readback identifies the **4,767-byte**, **318 × 39** production-result PNG,
SHA256 `44df6255d9dabde13d6a027269e57305290d57f145df0d73be12be48edc54e53`.
Independent file checks matched that size/hash to the publication manifest,
the local public asset, the retained original capture at the implementation pin
and the asset's Git blob at the publication pin. The readback log and JSON agree.
This preserves the distinction between the implementation evidence revision and
the later publication revision. The [initial readback](live-readback-initial.json)
retains the earlier publication identity; the current readback verifies the full
new publication SHA and the same implementation pin and image bytes.

## Inspected pixels

The reviewer opened [live-production-journal.png](live-production-journal.png),
**1440 × 1000**. It shows edition 10, “Queue a plan across your hearths,” the
26 September date, the production-sequence introduction and the start of the
contents/takeaway panel. Navigation, headings and body text are readable without
overlap or horizontal clipping. The visible takeaway retains the explicit M3 and
all-fifteen-gates-open limitation. The screenshot ends partway down the article;
it does not show the result illustration or establish the whole article's layout.

The reviewer also opened the exact [compact result capture](screenshots/production-sequence-results.png).
Its two lines report forty hearths complete, zero partial/refused, 120 orders
accepted and zero refused. The native image is legible and contains only that
summary. It is not an image of the surrounding editor or queues, nor independent
proof of organic empire growth. Its correspondence to the fetched live file is
the byte/hash check above. Wider and narrow rendered-publication coverage belongs
to the retained browser suite and the earlier visual review.

## Live-suite outcome and limits

The parent-owned [initial live Pages log](live-pages-initial.log) finishes with **27 passing and
five failing journeys in 8.2 minutes**, under the existing timeouts:

- Keyboard image enlargement opens the dialog but `cultures.webp` still has
  natural width zero at the five-second image-load assertion.
- Battlefield import still shows “Resolving…” at the five-second terminal-import
  feedback assertion.
- The deployment-assets journey still sees the selected culture crest in
  `loading` state at its five-second readiness assertion.
- Map-actions import also remains at “Resolving…” at its five-second feedback
  assertion.
- The new production-sequence journey exceeds the overall 45-second timeout.
  Its terminal stack does not identify a particular failed assertion.

The [unchanged focused rerun](live-rerun.log) finishes with **four passing and one
failing journey in 1.2 minutes**. Image enlargement, battlefield import, map actions
and the new production-sequence journey pass; the latter takes 13.5 seconds.
The crest again remains `loading` at its five-second readiness assertion. These
are separate runs, not a clean 32/32 result. The first run's failures are not
erased by its successful counterparts. Original logs retain screenshot,
error-context and trace paths.

This reviewer inspected the crest's second failed trace. The catalog records a
successful 1,539.399 ms request. The foundation image records HTTP 200 and
2,629.125 ms waiting, but receive time, content size and body size remain `-1`,
with no retained image body. That record does **not** prove a completed foundation
download at the failed readiness boundary. The crest loader must first read and
parse the catalog, fetch and validate the foundation image, decode it and then
publish its ready state.

The reviewed correction in
[`deployment-assets.spec.ts`](../../../tests/production/deployment-assets.spec.ts)
registers an exact foundation-URL response waiter **before navigation**, then
requires a successful response, the actual complete response body, nonzero bytes
and the approved SHA before starting the existing five-second DOM-ready assertion.
It observes the application's download; it adds no prefetch, mock, cache change or
production modification. The 45-second whole-test limit and five-second assertion
limit are unchanged. Later catalogue/image/UI-byte, CSS, worker, base-path and
no-development-hook checks remain intact. This reviewer assessed and implemented
that narrow test correction. The parent's independent focused execution passes
locally in **1.6 seconds** ([log](asset-local.log), 2.5-second invocation) and
live in **8.9 seconds** ([log](asset-live.log), 9.3-second invocation).
Typecheck, scoped test-file lint and whitespace checks pass. It is dependency
sequencing with a verified input, not evidence that live loading is fast or
universally reliable.

The separate [final full live run](live-pages.log) at
`24cd30e309ca191181482b7525d3eac6aebb4fbf` passes **all 32 journeys in 1.7 minutes**.
The corrected deployment-assets journey takes **3.3 seconds** and the generated
production-sequence journey takes **10.9 seconds**. This terminal result verifies
the full configured live set; it is not inferred by adding the earlier focused
passes to the first run. All original failures remain retained.

The configured live suite uses the same Pages journeys with the live origin and
does not start a local preview server. Its new generated production journey uses
ordinary UI controls and explicitly checks that development hooks are absent.
It is designed to create a personal template, reuse it in another generated campaign, separate
selection/Recall/Apply, verify paid queue order and treasury through actual
downloads, replay each export, and check manual and portable restoration. Those
assertions were inspected in the parent-authored test; they are not claimed as a
separate execution by this reviewer. The first live run times out; both the
unchanged focused rerun and the final complete live run finish this journey
successfully.

No deployment evidence changes the implementation test totals or closes ACT-32/M3.
Authored large-realm checks, a generated production journey and live public-site
coverage remain different execution scopes. This review does not certify Firefox
or WebKit, mature-campaign durability, sustained scale, pacing or 1.0 acceptance.
All fifteen release gates remain open.
