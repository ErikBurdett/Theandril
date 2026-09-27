# Production sequences and personal templates

26 September 2026. **Implementation locally verified; publication checks are recorded separately.** This extends ACT-32/M3 within
the existing accepted scope. Rules/save **32** and content **`015468d1`** remain
unchanged. No AI policy, campaign price or campaign-resolution rule changes.
All fifteen release gates and the broader M3 milestone remain open.

The working candidate follows baseline
`3a8767b3b881e620510f773695aa209af3ec988d`; that commit does **not** contain this
implementation. The implementation commit is pinned by dispatch 10 and the publication record. The initial build contains a draft journal; final journal checks are separate. See [ADR 0043](../../architecture/0043-production-sequences.md)
and the [dispatch work packet](work-packet.md).

## Player workflow and authority

Select owned hearths across the existing registry pages/search, or recall a saved
hearth group. In **Production sequences**, compose one to five existing projects,
reorder or remove them, then choose **Apply production**. Construction entries
are unique within the editor; recruitment entries may repeat. The editor shows
nominal per-hearth/total cost, current treasury, existing queue counts and current
canonical blockers. Nominal totals are not promises of eligibility: appending a
prerequisite building does not finish it or unlock a dependent project immediately.

One bounded worker request handles up to 128 hearths, sorted by stable ID, keeping
the chosen project order. Each attempt uses the ordinary canonical `queue`
command and is recorded in the campaign journal. Accepted projects spend coin
immediately and append after existing work. A refusal stops the remaining list
for that hearth, then processing continues with the next hearth. One final
permitted state/result response covers at most **128 × 5 = 640** attempts.

Complete hearths leave the selection. Partial/refused hearths remain selected;
the result identifies paid prefixes, the canonical refusal and later unattempted
items. No rollback, automatic retry, queue replacement or charter change occurs.
A second manual Apply submits the current whole list, not a resume operation;
players must review already-paid prefixes before retrying.

The personal library holds up to 24 named ordered templates, with 40-character
case-insensitive unique names. It lives in a separate browser/origin-local
`theandril-production-preferences` database. Template operations send no game
orders and are excluded from campaign exports. Recall fills the editor; Apply
remains explicit. Strict bounded transactional validation preserves incompatible
rows and rejects future/invalid records. Storage failure or pending work locks
only library controls. Direct sequence editing/application stays available, and
Retry creates a fresh connection after a failed open.

## Boundaries and independent review

The implementation spans the worker/protocol, main-thread response correlation,
the personal preference store and the registry UI. It does not add canonical
commands or state. The existing simulation owns prices, prerequisites, queue
capacity, ownership and affordability; current production quotes are informative.

- [Storage/main review](storage-main-review.md) independently reviews those
  boundaries and discloses the reviewer's worker authorship. A current-worker
  crash after paid work initially ended pending state without locking gameplay;
  the parent corrected the current-worker guard and recovery flags. Unexpected
  terminal response types also require saved recovery. Source review passes;
  the final broad verification remains separate.
- [UI review](ui-review.md) independently reviews the editor, session lifetime,
  preference/order separation, result handling and registry integration. It
  discloses storage/browser-test authorship. No blocking UI finding remains;
  displayed-pixel and actual interaction review are not inferred from source.

## Recorded checks and retained failures

These scopes overlap and must not be added together.

| Check | Current evidence |
| --- | --- |
| Production response ledger | [3 tests pass](response-tests.log), 125 ms; copied submission, correlation, stale IDs and recovery |
| UI/library plus existing registry | [16 tests pass across 3 files](ui-unit-final-tool-transcript.log), 790 ms; nine new checks and seven existing registry checks |
| Scoped UI lint/whitespace | [Successful tool transcript](ui-lint-tool-transcript.log), empty output and exit 0 |
| Integrated typecheck | [Successful log](typecheck.log); earlier incomplete-integration failure retained separately |
| Worker/storage suites | [31 worker checks](worker-final.log) and [17 storage checks](template-tests.log), including ten new production-template cases; also included in the full suite |
| Initial affected browser | [9 pass /1 fail](browser-initial.log), 1.1 minutes; corrected traffic assertion passes in the final run |
| Full implementation suite | [1,975 tests /247 files pass](tests.log), 59.76 seconds with four workers |
| Affected gameplay | [30 Chromium journeys pass](browser-final.log), 3.9 minutes; ten new plus twenty existing |
| Generated built production | [One journey passes](production-initial.log), 7.3 seconds test /8.3 seconds run; ordinary controls and manual/portable restoration without debug hooks |
| Build and validation | [Pages build](build-initial.log), [lint](lint.log), [content](content-validation.log), [art](art-validation.log) pass; existing large-chunk warning retained |
| Final journal/Pages/publication/live | Recorded separately after implementation pin; no deployment claim at this checkpoint |

The UI transcripts preserve the actual earlier tool output; they are explicitly
labelled transcripts, not new executions or redirected raw logs. The
[initial UI run](ui-unit-initial-tool-transcript.log) had 15 passes and one test
failure because its fixture named nonexistent `unit.warship`. Replacing that
test input with existing `unit.transport` preserved the intended availability
assertion. No production correction was needed for that failure.

The [initial integration typecheck](integration-typecheck-initial.log) ran before
the new UI module and callback props had landed. Its missing-module/prop errors
are retained; the later integrated typecheck passes.

The first browser run passed five actual-worker reply/crash recoveries, the
shared-budget/refusal case and three storage-failure cases. Its forty-hearth
journey failed because it expected one total worker request after application
but observed two. The selected army's existing movement hook refreshes on the
new hash after unlocking. The corrected passive transport observer requires
exactly one production request/state plus one same-hash, target-free movement
query/reply for that selected army; no other messages are allowed. Its exact
transcript and bytes are retained in [capture.json](screenshots/capture.json).
The final thirty-journey run passes without changing limits or disabling checks.
Two real Works charters now make the policy-preservation assertion non-vacuous;
derived quotes match serial canonical observation rather than stale blockers.

The browser batch pays 1,440 coin for 120 commands across forty hearths, emits
one 4,400,231-byte measured state payload and a separately measured 923-byte
movement JSON reply, with39 packed-cell bytes. Hash changes `fdfd0520` →
`fd8bc27b`, matching serial execution. This excludes browser structured-clone
framing and is distinct from the benchmark fixtures below. Individual additions,
manual restoration, preference CRUD/no command traffic/export exclusion,
keyboard and390px layouts pass. Original reviewed PNGs and settings are retained
in [screenshots/provenance.json](screenshots/provenance.json); raw local Playwright
output directories are ignored, with the failed snapshot and runner log retained
here. Native captures are copied without image transformation.

The integration typecheck later caught an `unknown` archive-command field in the
new production test; narrowing its asserted transport shape corrected test typing.
No runtime change was needed. Worker crash recovery was a real source defect
found and fixed during review; five real-worker recovery journeys now verify the
lock and restoration. No production failure is relabeled as a test-only issue.

## Actual-worker benchmark

[Raw JSONL](worker-benchmark.jsonl) and [stderr log](worker-benchmark.log) come from:

```sh
./node_modules/.bin/tsx apps/web/src/worker-production.benchmark.ts
```

The harness imports the real worker, uses structured-clone transfer and canonical
journaling, and validates the downloaded campaign afterward. Each of the four
cases is **one elapsed sample**, on an i9-13900K with Node 26.7.0. Setup, import,
export and replay are outside the timed batch. These are authored generator4
worlds, distinct from current generator8 map dimensions and organic campaign play.

| Authored workload | Hearths × items | Attempts | Batch ms | Command ms | Transfer bytes | Result bytes | Final hash |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Huge mature:196,608 cells,32 realms,1,500 armies |32 ×3|96|104.648|1.385|1,791,958|5,500|`0a5a53bf`|
| Huge expanded ceiling |128 ×5|640|120.915|6.499|2,271,820|31,452|`059cebe5`|
| Legendary mature:307,200 cells,40 realms,4,000 armies |40 ×3|120|199.278|0.784|4,399,407|6,889|`09633fa8`|
| Legendary expanded ceiling |128 ×5|640|245.647|3.854|4,842,958|31,457|`7a850cbb`|

Every case emits one final state response and 39 cell-transfer bytes; total bytes
include the permitted observation and result payload. The representative worlds
retain their authored paid 37-cell borders. Ceiling worlds explicitly expand to 128
owned hearths and rebase land to legal starting borders. Owned army counts are 47
for Huge and 100 for Legendary; the 32/40 representative hearths are all authored
under one realm. The three-project list is Guard → Workshop → Guard; the ceiling
list is five Guards. Treasury falls by 1,152 /7,680 /1,440 /7,680 coin respectively.

All four samples preserve exact recorded command order, match final replay/hash
and leave observed fog unchanged. The separate actual-worker unit comparison
checks batched versus serial campaign archives/state and saved continuation on an
authored 40-hearth Small map; it is a different fixture from these large-world
timings and from the browser's Legendary fixture. Final measured serial byte
figures await a retained parent test log.

The multi-megabyte observation payloads and gap between batch and command time
remain visible costs. These samples do not establish render/frame latency,
full-turn performance, AI behavior, sustained memory, earned empire growth or
headline pacing. No new pacing run is claimed for this command convenience;
prior Standard 234 / Long 342 / Epic 379 remains separately dated evidence.

## Remaining acceptance

Finish the failed 40-hearth journey, independent screenshot review, the final
affected browser run, full local checks and a generated built-production journey
without development hooks. Retain failures and exact final evidence before an
implementation commit is pinned. Publication requires its own factual/visual
review, source-linked dispatch, build, Pages and live readback.

This implements a bounded part of existing production-sequence/template scope;
it does not complete M3. Theater strategy, patrol/escorts, reusable army order
templates, broader governor decisions and combined mature-realm acceptance still
remain. There is no standing repeat production, refund/queue-reorder system,
cross-device template sync, live cross-tab refresh or per-hearth resume plan.
The current [implementation status](../../IMPLEMENTATION_STATUS.md),
[performance record](../../PERFORMANCE.md) and
[1.0 plan](../../1.0-DEVELOPMENT.md) remain canonical; the parent owns their later
reconciliation. No global status or published journal was changed by this draft.
