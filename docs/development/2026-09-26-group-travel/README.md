# Coordinated group travel — implementation evidence

26–27 September 2026. **Implemented and locally verified; publication remains pending.**
Baseline: `c38f82c9c3aa2fedd6ea808d71aedaf6512ad72b`.

This ACT-32/M3 slice lets checked armies review and follow a shared destination,
append a waypoint, resume paused routes and cancel travel routes. It uses existing
canonical movement commands, saved selections and the 128-army registry bound.
Cancellation retains standing postings and explains that they can restart travel.
[ADR 0044](../../architecture/0044-group-travel.md) records the authority, query,
recovery and performance boundaries.

## Ownership and acceptance

- Worker/protocol agent: bounded explicit previews, command batches, serial
  comparison/replay checks and representative measurement harness.
- UI agent: registry controls, invalidation, selection/result handling and styles.
- Browser agent: actual-control mature and generated campaign journeys, recovery
  scenarios and native screenshots.
- Parent: submitted-request correlation, main-thread integration, independent
  review, full verification, canonical status and any separately verified publication.

Acceptance includes a saved authored realm with 100 owned armies, ordinary command
outcomes and partial refusals, individual override, route replacement/append,
cancel/resume, retained postings, exact saved replay, keyboard/narrow controls,
stale/malformed replies and measured query/publication costs. Benchmarks must
identify authored geography, sample counts and timing boundaries. Canonical
movement rules and their historical behavior are unchanged.

## Implemented boundaries

The existing army registry checks and saved groups feed one explicit review for
up to 128 owned land armies ashore. A destination can be the selected map hex, an
owned hearth or an entered hex number. Review fills a bounded, paged list of
worker-derived costs and blockers. Apply, append, resume and cancellation remain
explicit actions; recalling a saved selection and reviewing routes issue no
orders. Independent routes and standing postings remain canonical campaign data.

The worker validates the entire transport envelope before recording commands:
shape, dense bounded membership, duplicate IDs, faction seat, common action and
destination/append choice, and expected campaign hash. Ordinary commands then
execute in stable army-ID order. Canonical refusals leave those armies selected;
accepted armies leave the checks. Accepted result rows report the last factual
canonical event, including arrival, movement, pause or cancellation. A batch is
not atomic: accepted movement remains when another army refuses.

Previews use the permitted observation and are advisory because earlier armies
can change what later armies see. Hash, members, destination or mode changes
invalidate review. Queued movement retains the normal restrictions on fog,
foreign occupancy, missions, sieges and transport; it never declares war or
starts an automatic battle. Appending preserves a paused route until explicit
resume. Cancelling travel leaves postings intact, with an explanation that a
posting can begin another march next turn.

One successful accepted batch autosaves once before its single final state
response. All-refused batches and recorder exceptions do not autosave. Autosave
failure is visible without promising rollback. Recorder/publication failure or
an incomplete mutation response requires saved-campaign recovery; subsequent
orders remain locked. Superseded read-only preview replies are consumed without
faulting a newer restored campaign. No automatic retry reissues uncertain moves.

## Current scope

Rules/save 32 and content `015468d1` remain unchanged. No AI behavior or prices
change; no new pacing measurement is claimed. This advances coordinated
orders inside M3; it does not implement theater strategy, patrol/escorts, army
templates or broader governor decisions. All fifteen release gates remain open.

## Actual worker measurements

[Final raw output](worker-movement-benchmark-final.log) contains four completed
cases from the [actual-worker harness](../../../apps/web/src/worker-movement.benchmark.ts).
Every case performs one explicit preview and one travel batch, with real
structured-clone transfer, ordinary canonical commands, journaling and one
autosave. Each has **one elapsed sample**, not a median or percentile. Hardware:
Intel Core i9-13900K; Node v26.7.0. Rules/save 32 and content `015468d1` are unchanged.

The synthetic mature Huge/Legendary fixtures use generator 4 geography with
196,608/307,200 cells, 32/40 realms and 1,500/4,000 global armies. Their player owns
47/100 armies. The ceiling fixtures add co-located owned guards until the player
owns 128, increasing global totals to 1,581/4,028. Generated terrain and permitted
explored geography are retained; these are not organically earned empires or
the current generator 8 map dimensions. The destination is the farthest explored
hex with a legal preview for the first selected army. All measured previews have
at most four route steps, and all measured commands are accepted.

| Case | Selected | Review wall ms | Worker review ms | Review bytes | Target-search nodes |
| --- | ---: | ---: | ---: | ---: | ---: |
| Huge representative | 47 | 2.574 | 2.053 | 8,206 | 799 |
| Huge ceiling | 128 | 3.210 | 2.879 | 22,300 | 2,176 |
| Legendary representative | 100 | 2.533 | 2.270 | 17,537 | 1,900 |
| Legendary ceiling | 128 | 2.818 | 2.457 | 22,437 | 2,432 |

The preview response carries costs, step counts, eligibility, blockers and target
search counters; it carries no paths or reachable overlays. Review bytes measure
that compact review payload, excluding transport metadata/metrics. Each army's
preview still computes a reachable-range search before its target search using
one shared 4,096-node allowance. `targetSearchExpandedNodes` counts only the target
part; it must not be described as total routing work. The transport maximum is 128
armies, hence at most 524,288 combined range/target node expansions per review.
The measurements above do not exercise that maximum or 256-step routes.

| Case | Batch wall ms | Command ms | Final state bytes | Result bytes | Cell-delta bytes | Final hash |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Huge representative | 464.902 | 6.750 | 246,578 | 3,846 | 301 | `5533e108` |
| Huge ceiling | 459.158 | 16.092 | 649,643 | 11,732 | 301 | `2baa14b4` |
| Legendary representative | 750.738 | 8.901 | 504,166 | 8,300 | 520 | `6734c8ce` |
| Legendary ceiling | 831.073 | 11.793 | 635,137 | 11,072 | 520 | `d5ff4a22` |

Command time covers the ordered canonical command/journal loop. Batch wall time
also includes one autosave and the final observation/transfer. Setup, imports,
exports, independent serial execution, replay and restore checks are untimed.
State bytes include the permitted observation, packed changed cells and result
payload; result bytes include factual accepted-outcome messages. Each case emits
one review response and one final state response.

Every case asserts `exactRecordedOrder`, `exactSerialArchive`, `replayExact`,
`autosaveExact` and `permittedFogMatches`. A separately executed serial journal
matches the complete archive and final hash; replay and the restored autosave
match that hash. The packed initial cells merged with the movement delta and the
final summary equal the canonical player's permitted observation. This proves
the transferred view respects fog; it does not claim fog remains unchanged when
armies move. The final log's IndexedDB connection-close notice is cleanup output
after all four cases, not an extra sample.

The review payload remains bounded, while the complete observation still costs
roughly 246–650 KB and autosave/publication dominate these short-route batches.
These single samples establish neither a speedup nor percentile latency. They
also do not measure rendering, full turns, maximum-distance/search workloads,
sustained memory, AI, campaign pacing or release-gate completion.

Earlier attempts remain separate: the
[sandbox failure](worker-movement-benchmark-sandbox-failure.log) stopped before
the harness could run because the `tsx` CLI could not open its IPC socket. The
[interrupted initial run](worker-movement-benchmark-initial-interrupted.log)
contains only two Huge cases and was stopped before competing verification;
it predates accepted-outcome messages and the explicit permitted-view assertions.
Its timings and `fogPreserved` field are superseded by the four final cases above.
Another escalation request was aborted before execution and created no log or
sample. None of these initial attempts is combined with final timing evidence.

## Verification

These are separate suite scopes; focused checks are included in the full
headless suite and must not be added to its total. The local production test is
not a live deployment check.

| Check | Recorded outcome | Evidence and scope |
| --- | --- | --- |
| Full headless suite | 2,000 tests across 250 files pass; 63.19s | [Full log](tests-initial.log), including the ten final actual-worker travel tests |
| TypeScript and ESLint | Pass | [Typecheck](typecheck.log), [lint](lint.log); no diagnostics, and no additional test count |
| Content validation | Pass; content hash `015468d1` | [Content log](content-validation.log) |
| Existing art validation | Pass after an initial sandbox failure | [Final log](art-validation-final.log), [initial failure](art-validation.log); validation does not approve new art or screenshots |
| Production build | Pass | [Build log](build-initial.log); existing dependency-annotation and large-chunk warnings retained |
| Actual-worker travel | 10/10 pass | [Final focused log](worker-final.log): strict envelopes, fog, ceiling, exact archive/replay, saved continuation and failures |
| UI and request ledgers | 24 tests across four files pass | [Focused log](ui-tests.log); [initial parent ledger checks](response-tests.log) are an overlapping subset |
| Affected Chromium gameplay | 21/21 pass; 2.6m | [Corrected run](browser-final.log), including eight new travel/recovery journeys; focused follow-up below covers the omitted old recovery file |
| Generated production travel | 1/1 pass; 5.3s test, 6.3s run | [Production log](production-initial.log): ordinary generated campaign controls, saved/portable routes, no development hooks |
| Actual-worker performance | Four completed single samples | [Final benchmark](worker-movement-benchmark-final.log); scope and assertions detailed above |
| Focused Chromium follow-up | 6/6 pass; 53.6s | [Focused run](browser-focused.log): four repeated travel cases plus two omitted posting-recovery cases; 23 distinct affected journeys across both runs |
| Screenshot acceptance | Desktop, narrow and native result inspected | [Visual review](visual-review.md), [exact native provenance](screenshots/provenance.json) |
| Publication/live verification | Pending | No deployment, live Pages or final published-layout pass is claimed here |

The 21-case affected run includes existing movement, postings and saved-group
journeys, as well as the eight new travel/recovery scenarios. A misspelled test
path omitted `tests/gameplay/group-posting-recovery.spec.ts` from that invocation.
The count remains 21. The separate six-case focused run passes four repeated
travel cases and the two omitted recovery cases: 23 distinct affected journeys
across these overlapping runs. This does not claim the entire browser suite passed.

The new browser scenarios use actual controls to review and move one hundred
armies, retain partial refusals, preserve individual overrides, append paused
journeys, resume and cancel, retain postings, and restore exact manual/portable
saves. Recovery scenarios exercise malformed or missing results and a worker
crash after real movement, plus a delayed superseded preview error. The generated
production journey establishes a separate bounded path without development hooks.

## Reviews and retained failures

The [worker review](worker-review.md), [UI/integration review](ui-review.md) and
[main-thread review](main-review.md) identify their authorship and independent
scope. A main-thread review found that a superseded preview could carry a late
`recoveryRequired` error into a restored campaign. The parent restricted that
flag to the active preview/current worker; the delayed-error browser regression
passes in the 21-case run. No remaining blocking source finding is recorded in
those reviews. Source review does not replace browser or visual acceptance.

The [initial focused worker run](worker-initial.log) passed nine tests before the
accepted-outcome enhancement. Its subsequent
[outcome-test failure](worker-outcomes-initial-failure.log) was an authored
fixture attempting war before visible contact. The fixture now establishes
contact before declaration, then positions the threat outside sight; the same
arrival, interruption and cancellation assertions pass in the ten-test final run.

The [initial gameplay run](browser-initial.log) records six passes and one failed
aggregate journey under the unchanged 45-second test limit. Inspection showed both
hundred-army batches had completed; repeated large browser readbacks and
export/replay work exhausted the combined journey before the later individual
cancellation assertion. The journey was split into independent initial-travel
and continuation scenarios, preserving every assertion and the 45-second limit.
Browser readbacks now project only the fields asserted. These are verification
changes, not relaxed gameplay rules or removed checks. Original artifacts remain
under [browser-initial-artifacts](browser-initial-artifacts/).

The first art command failed before validation because the sandbox prevented the
`tsx` CLI's IPC socket. Its original log remains alongside the successful retry.
Benchmark failures and the interrupted initial timing run are documented above;
none is relabeled as a final passing sample.

## Visual review and remaining publication

Pixel review accepts the desktop capture and the native 318×19 result paragraph,
whose scope is only the actual hundred-order accepted result. The first retained
390px capture from the corrected run has a blank green review-list area; it is
**not approved** as narrow review evidence. The earlier initial-run capture
contains text, but neither that contrast nor the passing browser assertions
establishes the cause of the blank image. The focused follow-up performs a fresh review through ordinary controls at
390px, asserts the first row in view and waits two animation frames before
capture. Both the route-list and separate controls screenshots display their
text correctly, with unchanged runtime CSS and test timeout. The original blank PNG and its exact
hash are retained. See the [visual review](visual-review.md) for the bounded
candidate caption and separate generated-production image.

The missing posting-recovery cases and fresh narrow captures are complete.
Final journal publication/layout and live checks remain separate. Keep the
[developer dispatch](dispatch-draft.md) in draft until its reviewed media and
publication evidence are complete. This checkpoint does not close ACT-32/M3 or
any of the fifteen 1.0 release gates.
