# Production sequences, personal templates and deployment — 26 September 2026

## Prompt

“okay continue,” following the requests to continue Theandril toward 1.0 and
“Deploy the changes, and continue development.” Continued the authorized work
through a playable ACT-32/M3 slice, reviewed publication and live verification.

## Delivered

- In the hearth registry, select hearths or recall a saved group, compose one to
  five existing projects and explicitly apply the ordered list to up to 128
  owned hearths. Existing queues come first; each accepted project pays its
  ordinary coin immediately. A refusal stops that hearth's list while other
  hearths continue. Complete hearths leave selection; partial/refused hearths
  retain paid prefixes and remain checked with detailed results.
- Save up to 24 named production templates in this browser and origin. Choosing,
  recalling and applying remain separate actions. Personal templates are
  excluded from campaign exports; applied queues preserve canonical save/replay.
  Storage failures leave direct controls usable, and uncertain paid-worker
  outcomes require saved-campaign recovery before gameplay resumes.
- Published [dispatch 10, “Queue a plan across your hearths”](https://erikburdett.github.io/Theandril/updates/dispatches/?dispatch=production-sequences)
  with exact reviewed imagery and source evidence, and updated the existing
  catalogue. Nine previous articles and fourteen earlier image records remain
  unchanged; [factual review](../2026-09-26-production-sequences/factual-review.md).

## Changed

- `apps/web/src`: production editor, template library, strict worker request and
  result handling, recovery locks, registry integration and player guide.
- `packages/persistence`: bounded, transactional personal template storage and
  retry handling. No new canonical game command, rule or state is introduced.
- Unit, actual-worker, gameplay and production browser checks; representative
  worker measurements; a test-only asset dependency sequencing correction.
- Existing journal/catalogue and exact public illustration; ADR 0043,
  implementation status, M3 record, performance evidence and this report.
  GitHub Actions remain build-only; deep testing ran locally.

Implementation and dispatch source pin:
**`420219d278ae17f42a04871c6319ecf62a4af216`**.
Initial publication: **`b5fc0997506e78a8e05fbdd0cf4deea8cf9019d7`**.
Final verified publication: **`24cd30e309ca191181482b7525d3eac6aebb4fbf`**.
The last change affects the asset test and evidence only; application, renderer,
content, public article and illustration are unchanged from initial publication.
Rules/save **32**, content **`015468d1`**, prices and AI remain unchanged.

## Verified

[Evidence packet and retained failures](../2026-09-26-production-sequences/README.md).
These scopes overlap and must not be added together:

- [Implementation suite](../2026-09-26-production-sequences/tests.log):
  **1,975 tests / 247 files**, 59.76 seconds. After two editorial boundary checks,
  [final journal suite](../2026-09-26-production-sequences/publication-tests.log):
  **1,977 tests / 247 files**, 58.02 seconds. Typecheck, lint, content/art validation
  and the production Pages build pass; logs are linked in the evidence packet.
- [Affected gameplay](../2026-09-26-production-sequences/browser-final.log):
  **30 Chromium journeys**, 3.9 minutes. A separate
  [generated production journey](../2026-09-26-production-sequences/production-initial.log)
  passes without development hooks. [Local Pages](../2026-09-26-production-sequences/publication-pages.log):
  **32/32**, 1.1 minutes. [Final live Pages](../2026-09-26-production-sequences/live-pages.log):
  **32/32**, 1.7 minutes, including template reuse, paid queue order and manual
  and portable campaign restoration through ordinary controls.
- [Four actual-worker samples](../2026-09-26-production-sequences/worker-benchmark.jsonl)
  cover authored generator-4 Huge/Legendary worlds, representative batches and
  the 128-by-5 ceiling. Each preserves recorded order, replay/hash and observed
  fog. These are single headless samples, distinct from the Small-map serial
  comparison and the authored forty-hearth browser journey; they do not establish
  full-turn, renderer, organic-growth or sustained-memory acceptance.
- Independent source, UI, factual, rendered-publication and live evidence reviews
  pass with authorship boundaries disclosed; links are in the evidence packet.
  Desktop, laptop, narrow and enlarged-text journal captures retain exact pixels.
- Both GitHub workflows succeed at the full final publication SHA;
  [deployment record](../2026-09-26-production-sequences/deployment.json).
  [Live readback](../2026-09-26-production-sequences/live-readback.json) verifies
  the full commit link, implementation source link, exact illustration bytes,
  historical article and current roadmap, with no captured page exceptions.

## Tracker and checkout

The [guarded DHARMA update](../2026-09-26-production-sequences/tracker-apply.log)
and [generated-page readback](../2026-09-26-production-sequences/tracker-readback.json)
advance **ACT-32** while preserving its doing status and **M3 in progress**.
**ACT-36 stays done and DH-020 stays resolved**; this slice claims no additional
tracked issue closure. The catalogue records 61 delivered and 49 remaining
editorial bullets, with 6 of 23 items complete. These are not a fixed-scope
completion percentage. All fifteen release gates remain open.

Publication ran from the primary checkout, `/home/telephoneheater/Work/Theandril`.
Before this report, local `master` and `origin/master` both point to the final
verified publication above, with zero commits ahead or behind. This report and
post-deployment artifacts form a documentation-only descendant commit; its exact
identity belongs to Git history and the public build ledger. The retained live
suite evidence stays pinned to the tested publication. No secondary checkout or
background development job was created.

## Not done / blocked / caveats

No remaining blocker for this bounded slice. M3 and all fifteen release gates
remain open. Theater strategy, patrol/escorts, reusable army-order templates,
broader governor decisions and combined mature-realm acceptance remain. Standing
repeat production, refunds, queue reordering, automatic partial-plan resume,
cross-device template sync and live cross-tab refresh are not delivered.

The evidence retains fixture/type errors, the initial worker-traffic assertion
that missed a normal selected-army movement refresh, and the real post-payment
worker-crash recovery gap corrected during review. Initial local Pages failures
came from stale catalogue expectations, which were updated explicitly.

The [initial live run](../2026-09-26-production-sequences/live-pages-initial.log)
had 27 passes and five failures; an
[unchanged focused rerun](../2026-09-26-production-sequences/live-rerun.log)
had four passes and one remaining crest-readiness failure. Trace records showed
slow successful responses, including an unfinished image body; HTTP headers did
not prove completed downloads. The asset check now registers the application's
actual atlas response before navigation and verifies its full bytes/hash before
the existing readiness assertion. Runtime, cache behavior, the 45-second test
limit and five-second assertion limit are unchanged. Focused local/live checks
and the separate final full live run pass. Earlier failures remain visible.

Multi-megabyte worker observations and the existing large-bundle build warning
remain. Chromium coverage does not certify Firefox/WebKit or sustained mature
campaign scale. No new pacing run is claimed because no rule, price or AI policy
changed. The prior headline Standard 234 / Long 342 / Epic 379 measurements remain
dated evidence, with **DH-021/ACT-38** still open.

## Follow-ups

Continue ACT-32/M3 with coordinated army orders or broader delegation, preserving
explicit application, individual overrides and paid-order recovery. Carry future
rules/AI changes through headline pacing measurement and the existing release
gates. Development deployment does not establish 1.0 acceptance.
