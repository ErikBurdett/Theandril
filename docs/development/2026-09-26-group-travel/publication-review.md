# Group travel publication factual review

27 September 2026. **Pass for the reviewed article, catalogue, media and test
changes; no blocking factual finding.** This is a source/evidence review, not a
publication, deployed-layout or live-game acceptance claim.

The reviewer authored the group-travel worker/protocol, worker tests and benchmark,
and contributed implementation evidence. The reviewer did **not** author dispatch
11, its catalogue/media changes or publication tests. Runtime UI, browser and
pixel reviews remain separately attributed in their own notes. This review made
no application changes and ran no browser suite, benchmark or network request.

## Reviewed source and evidence

The candidate adds `group-travel.ts` to the journal and updates the current
catalogue, media records, native-width CSS and existing discovery/roadmap tests.
Implementation evidence is pinned to
`3b0918999a166f36f6f3d51fbcb49413de549163` (P1), independently checked against the
candidate diff and retained logs. The article, current library and roadmap all
use that revision; the roadmap date is 2026-09-27 and its rules version is 32.
All **39 distinct** article/catalogue/library/scope evidence paths exist in P1.

The change to historical `content.ts` is exactly the new import and entry.
Existing dispatch bodies and their source pins, including the separate
production-sequences article, are unchanged. The fifteen historical media
records and shared-material records compare identically to P1. Tests still
inspect earlier articles and historical pins while adding the new featured
entry; no existing assertion, timeout or media budget was removed for this
publication. Before final verification, the parent removed the newly introduced
prose-copy test and two new verbatim-string checks because they mirrored this
low-impact content update. Existing historical/generic contracts and the new
evidence-reference check remain. This is test-inventory cleanup, not a failure.

## Factual reconciliation

- The P1 [full suite](tests-initial.log) passes **2,000 tests in 250 files,
  63.19 seconds**. This is the implementation checkpoint, not the later article
  verification count. Typecheck, lint, content/art validation and build are
  separately recorded; initial failures remain available.
- The [affected browser run](browser-final.log) passes **21** journeys and the
  [focused run](browser-focused.log) passes **six**. The latter repeats all four
  `group-movement` journeys and adds two `group-posting-recovery` journeys:
  **21 + 6 − 4 = 23 distinct affected journeys**. Eight of the affected journeys
  are the new travel/recovery scenarios. The generated-production journey is
  separately reported at 5.3 seconds for the test and 6.3 seconds for its run;
  it is not added to the headless total or called a live deployment check.
- The retained 45-second aggregate timeout and rejected blank narrow PNG are
  acknowledged accurately. The split journeys retained their assertions and
  timeout. Fresh narrow captures use ordinary review controls, a visible-row
  assertion and two animation frames; the cause of the rejected capture remains
  unestablished. [Visual review](visual-review.md) approves the fresh captures
  without claiming a runtime/CSS correction or browser certification.
- The four [worker samples](worker-movement-benchmark-final.log) match every
  numerical timing and payload value quoted in the article. They use the actual
  headless worker module, structured cloning and in-memory test IndexedDB, with
  one elapsed sample per case. Their previews have at most **four route steps**;
  the separately authored browser corridor shows **fourteen**. Batch wall time
  includes autosave/publication; setup and later verification are outside it.
  Browser-worker latency, physical-storage latency, percentiles, full turns,
  rendering, sustained memory and organic mature-empires are not established.
- All four samples assert exact serial archives, replay and autosave, with the
  final transferred view matching the canonical player's permitted observation.
  **Fog is not claimed unchanged:** movement can reveal cells. Compact replies
  omit paths/range arrays, but the underlying preview still computes reachable
  range before its target search under a shared 4,096-node allowance per army.
  Target-search node counters are not total routing work; the article makes no
  contrary claim or worst-case search claim.
- Immediate movement, advisory previews, partial refusals, independent arrivals,
  route append/resume/cancel and retained postings agree with the implementation.
  Autosave is attempted once only after an accepted, fully recorded batch;
  all-refused batches and recording interruptions do not autosave. A save error
  remains visible. An uncertain recording/publication requires saved recovery,
  without reissuing the batch automatically.

Directly importing the candidate catalogue confirms **11 dispatches**, with
group travel first; **23 roadmap items** comprising **6 completed, 13 in progress
and 4 pending**; and **63 delivered / 49 remaining** acceptance bullets. The two
new delivered bullets describe bounded travel. M3/ACT-32 remains partial, all
**15 release gates remain open**, and broader governors, theaters, patrol/escort,
army order templates and combined mature-campaign acceptance remain explicit.
Rules/save 32, content `015468d1`, unchanged AI/prices and no new pacing run are
accurately stated. There is no new scope cut, release date or completion percentage.

## Media identity and limits

The added public PNG exactly equals the P1 source screenshot: **2,337 bytes,
318 × 19 pixels**, SHA-256
`5a18a317736a6e99a2cf1dd18bef8c8175a4486e0e99a56b1f4d03fd01adfb67`.
Its manifest source revision is P1; source/public hashes and dimensions agree.
Both public and source manifests are byte-identical. Summing the actual sixteen
image files yields **3,141,226 bytes**, leaving **4,502 bytes** under the unchanged
3 MiB cap. No older image was replaced or re-encoded.

The caption correctly identifies a native 390px-viewport result-only capture
from the authored hundred-army fixture, without synchronized-arrival or organic
campaign claims. It illustrates the accepted-order summary rather than the full
editor. The only CSS addition applies the established 318px maximum-width rule
to this image; its final published layout still needs its separate browser review.

## Candidate identity and remaining verification

These SHA-256 values identify the reviewed candidate before its publication
commit:

| File | SHA-256 |
| --- | --- |
| `apps/web/src/updates/group-travel.ts` | `b3c7b7f3ce8f269548972f628af945c6cc6331aebc27953438f27daeb627f780` |
| `apps/web/src/updates/library.ts` | `503f32784cb83d9ee148096300a8d4bf423413a5aa66620e8644891c00499ba4` |
| `apps/web/src/updates/content.ts` | `d56522bd57a22a033bdfd11fc25c27a5172df481b15007a3ef1d23cf08069944` |
| `apps/web/src/updates/media.json` | `317efedfe8b177762561ac45ed06bd6b0c47e3e76920dd956793b808f7c29ccc` |
| `apps/web/src/updates/journal.css` | `bbc15079daa4d8ab0afa6af42e190ca2aab1ff6cfcdbc7e1d0f85cde8e1a080f` |

Read-only checks imported the candidate catalogue, summed and hashed actual media,
compared historical manifest records with P1 and resolved evidence paths against
the P1 tree. An initial nested Node-to-Git check encountered sandbox `EPERM`; its
read-only retry succeeded. These checks add no gameplay-test count. The parent's
initial publication suite records 2,001 tests in 250 files in 55.03 seconds in
`publication-tests-initial.log`; the parent is separately rerunning the suite
after that test-inventory cleanup. Neither later count rewrites the article's
correctly pinned P1 result. Publication browser/layout checks, authorization, exact deployed commit
and live readback remain separate from this factual verdict.
