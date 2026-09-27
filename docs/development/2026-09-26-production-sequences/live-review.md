# Production sequences: live deployment evidence review

Reviewed 26 September 2026. Publication revision:
`b5fc0997506e78a8e05fbdd0cf4deea8cf9019d7`; implementation evidence pin:
`420219d278ae17f42a04871c6319ecf62a4af216`.

**Verdict: exact deployment/readback checks pass; complete live-suite acceptance
remains open.** The first live run finishes with 27 passing and five failing
journeys. Four of those five pass in an unchanged focused rerun. The remaining
crest-readiness case has a reviewed dependency correction that passes locally
and live on parent execution; the final complete live run is separate. Both failing runs remain part of this record.

This reviewer authored the personal production-template store, the two development
browser scenario files and dispatch 10's article/catalogue copy. This is therefore
not independent review of those authored implementations or editorial claims. The
independent scope here is the parent's deployment record, readback driver/results,
captured live pixels and live Pages execution log. The parent ran the browsers and
queried GitHub; this reviewer inspected the retained evidence and readback source,
compared committed image bytes independently and launched no browser or new suite.

## Deployment and exact readback

[deployment.json](deployment.json) records both **Verify build** and **Publish
development demo to Pages** as completed successfully, with both `headSha` values
equal to the full publication revision above. The retained run IDs are
**36286356265** and **36286356241**. This review checks the recorded identities and
conclusions; it does not claim a second independent GitHub API query.

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
the later publication revision.

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
that narrow test correction; its execution is parent-owned and still pending.
Scoped test-file lint and whitespace checks pass. It is dependency sequencing
with a verified input, not evidence that live loading is fast or universally reliable.

The configured live suite uses the same Pages journeys with the live origin and
does not start a local preview server. Its new generated production journey uses
ordinary UI controls and explicitly checks that development hooks are absent.
It is designed to create a personal template, reuse it in another generated campaign, separate
selection/Recall/Apply, verify paid queue order and treasury through actual
downloads, replay each export, and check manual and portable restoration. Those
assertions were inspected in the parent-authored test; they are not claimed as a
separate execution by this reviewer. The first live run times out; the unchanged
focused rerun completes the journey successfully.

No deployment evidence changes the implementation test totals or closes ACT-32/M3.
Authored large-realm checks, a generated production journey and live public-site
coverage remain different execution scopes. This review does not certify Firefox
or WebKit, mature-campaign durability, sustained scale, pacing or 1.0 acceptance.
All fifteen release gates remain open.

Parent verification addendum: asset-local.log records1/1pass in1.6seconds;
asset-live.log records1/1pass in8.9seconds (9.3seconds invocation). The reviewer
implemented the test change; parent independently reviewed and executed it.
Typecheck and scoped lint pass. No whole live-suite pass is inferred from this
focused result.
