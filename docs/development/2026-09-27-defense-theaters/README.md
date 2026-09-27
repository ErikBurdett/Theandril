# Defensive theaters — implementation evidence

27 September 2026. **Published and live-verified.**
Baseline: `c5aa2615798bbc09efc9ca011dbb77f3d198980e`.

Acceptance: named defensive theaters fill missing hearth guards and gather
surplus at a reserve hex through ordinary deterministic movement, preserving
direct/paused routes, postings, fog, cargo and saved history. Includes human
controls, actual AI adoption, bounded reports, one-hundred-army browser controls,
independent overrides, local pacing and active Huge/Legendary measurements.

[ADR0045](../../architecture/0045-defense-theaters.md) records scope and authority.
M3/ACT-32 and all fifteen release gates remain open. Threat response, patrol,
escorts, invasion strategy and army templates remain outside this slice.

Ownership: parent canonical allocator/tests, main/worker integration, browser
integration and final evidence; save agent frozen32 capture/version33 migration,
chronicle/persistence; AI agent ordinary command adoption and measurement harness;
UI agent registry controls and focused presentation tests. Parent integrates.

Historical bytes were captured before canonical changes. See
[manifest](historical/manifest.json). The initial capture's unsupported generator 4
64-seat case was refused; its partial files are retained separately, and the
complete capture uses supported generator 8 for that case. No historical outcomes
were recreated after the rules change.

## Implemented behavior

The Armies registry opens a named defensive-theater editor. Checked eligible
combat land armies are copied into a draft; explicit Create/Save assigns them.
Each realm has at most eight theaters, each naming up to 16 distinct hearths and
128 distinct armies. Hearths and armies belong to only one theater per realm.
Guards are army containers, not formation counts, strength or threat adequacy.
Names, reserve hex, one-to-four guard floor and enabled state are saved.

After ordinary travel and postings, idle assigned members fill garrison deficits
or gather at the reserve. Coverage includes own nonmembers, but only assigned
members receive commands. Active final destinations suppress duplicate dispatch;
paused incoming does not count. Incoming promises never permit withdrawing the
last physical guard. Every existing active/paused route, posting, voyage, siege
or character mission takes priority. Ordinary queued travel preserves fog and
never automatically attacks or declares war. Failed attempts remain actual
bounded dispatch history, not invented route previews.

Lost members are pruned; captured hearth IDs remain unavailable without revealing
changed names or locations. Empty theaters can be refilled. With no owned
protected hearth remaining, allocation stops. Pause, delete and detach end future
assignments while keeping ordinary routes. Cancelling a route alone can resume
delegation next turn. Split children and recruited armies are not added implicitly.

The worker journals and autosaves accepted configuration commands, then publishes
one own-realm response. Main-thread checks require complete current theater data
and a matching submitted configuration before acknowledging success. Recording,
publication, malformed response or worker-crash uncertainty locks orders until
saved-campaign recovery. No automatic retry repeats an uncertain mutation.

## History and AI

Rules/save **33**, content **015468d1** unchanged. Seven genuine rules 32 saves
and archives, including real 40+24 seats, strictly reproduce their old bytes and
replay hashes. Three independent rules 32 continuation seals reproduce old commands.
New fields migrate to empty independent registers after historical checksum
verification. Frozen32 schemas reject resealed future fields; nonempty metadata
or consumed theater IDs cannot be silently downgraded. Mixed32→33 history,
portable campaign data and reopened IndexedDB restoration pass. The focused
compatibility/save run passes 100 tests in eight files; these overlap the full
suite. [Compatibility log](compatibility-final.log).

AI adoption uses permitted observations and ordinary `setTheater`. A realm with
two hearths may delegate at most two idle single-company spares and at most one
third of its combat containers, retaining scouts and its strongest two armies.
A maximum of four nearby hearth candidates and eight canonical route previews
requires a known permitted route before adoption, with already stationed guards
accepted without a pointless move. The preview calls share a 4,096-node range/target
allowance each; eight calls bound combined expansions at 32,768. Existing enabled
members are reserved from generic movement, merging, naval, character,
survey, depot and siege planners, including the proposal that creates a theater.
Existing configurations, including empty or paused theaters, are not rewritten
or refilled by AI. This is one-time home-watch adoption, not comprehensive
operational strategy. Ten new AI scenarios and all 270 AI tests pass; the AI count
is part of the full suite. [AI log](ai-fixed-final.log).

## Local verification

The [full local suite](tests-final.log) passes **2,075 tests / 258 files in 61.02s**
with four workers. Typecheck, lint, content and art validation pass. The final fixed-AI
Pages-subpath production build passes; it retains the existing large-chunk
warning. No limits or test assertions were loosened for performance.

The original nine canonical allocator scenarios, eight independently authored
lifecycle scenarios and worker/response tests cover guarded distribution,
nonmember coverage, route precedence, failed-destination fairness, real voyage,
refit, siege, merge pruning, detached saved continuation, deterministic property
samples, command refusal atomicity, accepted autosave and publication recovery.
Four actual-browser recovery scenarios independently pass in 15.3s, including
missing data after an ordinary turn and a worker error after accepted mutation.
The initial two authored browser scenarios pass in 16.9s. These checks overlap the
larger affected run recorded below and are not additive totals.

[Independent visual review](independent-ui-review.md) inspects native desktop and
390px controls, incoming coverage and saved restoration. The authored 100-army
fixture shows four incoming guards, not four arrived guards. No organic campaign,
rendering performance or release gate is established by those screenshots.

## Measured allocator costs

[Raw final measurements](benchmark-final.json) and [invocation output](benchmark-final.log)
use one warmup plus three independent identical-save samples on an Intel
Core i9-13900K, Node v26.7.0. These are headless allocation and observation
measurements. Loading, hashing, setup and replay are outside timed regions.
Complete own observations follow the isolated theater read and have warm caches.

| Case | Global armies | Theaters / assigned members / hearths | Attempts accepted / refused | Allocation median ms | Theater array bytes | Raw full observation bytes |
| --- | ---: | --- | --- | ---: | ---: | ---: |
| Huge representative |1554|1 /100 /2|16 /0|1.515|12,656|490,566|
| Huge ceiling |2477|8 /1024 /128|64 /64|8.814|141,317|6,738,124|
| Legendary representative |4001|1 /100 /2|16 /0|3.049|12,799|454,217|
| Legendary ceiling |4924|8 /1024 /128|64 /64|8.527|141,617|6,740,070|

Representative cases retain generated terrain with authored forces, a second
nearby hearth and charted corridor. They assign 100 guards; a scout remains
outside that membership. Ceiling cases author open terrain and isolated islands,
with eight theaters at all three per-realm reference bounds. Huge/Legendary use
generator 4's 196,608/307,200 cells and 32/40 factions, not generator 8 dimensions.
Only one realm actively delegates. Complete own observation medians are
5.230/43.558/7.736/36.533ms in the table's order. Raw full observations include map
cells and are not actual worker payloads or React state. Theater arrays measure
only this new bounded register/read model.

All cases prove exact repeated allocation, strict save roundtrip and ordinary
configuration/end-turn archive replay with matching own observations. There is
one global index per phase/read, bounded member/hearth scans and 16 routing
attempts per theater including failures. The single-realm ceiling's 128 attempts
include 64 refusals. It does not saturate 4096-node searches, 256-step routes,
all 64 realms, worker/autosave transfer, rendering or full-turn budgets. Across
all realms the schema can allow 512 theaters and 8192 attempts per phase; that
worst case remains unmeasured.

## Initial pacing diagnostic — rejected adoption policy

The initial [full pacing run](pacing-final.log) completes all seven headline/proxy
campaigns. [Frozen32→33 comparison](pacing-comparison.json) repeats the three
headline twelve-realm standard-map cases, seed 20260905, with exactly matched
initial32 projections, frozen observation/command behavior and unchanged source
fingerprints. Every case ends through Prosperity; all submitted AI commands
are accepted. Current cases each establish 12 real theaters.

| Headline pace | Rules 32 | Rules 33 | Delta | Automatic routes accepted / refused |
| --- | ---: | ---: | ---: | --- |
| Standard |234|242|+8|8 /210|
| Long |342|336|−6|9 /304|
| Epic |379|384|+5|9 /352|

Epic remains in its 350–400 target. Standard and Long were already beyond their
approximate 200/300 targets; Standard now takes eight more turns and Long six
fewer. **DH-021 remains open.** No price, policy or proxy bound was tuned to hide
the difference. One seed is not broad balance acceptance. Repeated automatic
routing refusals are separate from zero refused submitted AI commands and are a
material defect in the initial AI adoption policy. The [exact diagnostic](pacing-refusals.json) reproduces each campaign hash and full command/result trace: one land guard was assigned to an owned hearth surrounded by six visible water hexes. Canonical movement correctly refused it. This candidate is not accepted; bounded canonical adoption reachability checks correct it in the final candidate below. Comparison wall times
are instrumented and overlapped other checks, not performance benchmarks.

## Retained failures and corrections

- Initial frozen capture correctly refused 64 seats with generator 4. The complete
  capture uses the existing supported generator 8 setup; the original partial
  directory is retained.
- Initial save import exposed a module cycle. Pure theater schemas/validation now
  live in `theater-state.ts`, without importing movement/simulation.
- Legacy synthetic save tests needed the new empty fields stripped from their
  deliberately old payloads. Real captured historical bytes were untouched.
- An authored impassable-ring test initially changed terrain without water depth;
  its fixture now maintains both. No gameplay rule changed for that failure.
- Worker tests initially read the manual slot after an autosave. They now read
  the actual auto slot. A changed generic recovery message was corrected to keep
  group/theater identity and existing group behavior.
- Sandbox IPC/subprocess refusals are retained separately from successful
  escalated local runs. The second full run had a Git-history check exceed its
  unchanged 20s timeout under high concurrency. The complete four-worker run
  passed with the same assertions and timeout.
- The first full lint found one AI-test `prefer-const` error, corrected in that
  test. Initial main return typing and browser archive-command narrowing were
  corrected before final typecheck. All original logs are retained.


## Affected browser integration

[All 33 affected Chromium journeys](affected-browser-initial.log) pass in 4.2 minutes;
[the exact collected identities](affected-browser-list.txt) span eleven files.
They include six new theater/recovery scenarios and affected postings, charters,
saved groups, production and direct-travel workflows. These 33 already include
the earlier two normal and four recovery journeys; counts are not added together.
The first generated-production theater journey separately passes in 4.8 seconds
(5.8 seconds complete run), with real founding, canonical saved restoration and
portable import, and no development hooks. That run precedes the final AI
reachability correction; the final fixed-build run is recorded separately.

## Final pacing after reachability correction

The required [complete pacing run](pacing-fixed.log) and [paired frozen32/current33 comparison](pacing-fixed-comparison.json) both finish all headline campaigns. In the comparison, the frozen32 final hashes and complete command/result trace hashes exactly match the earlier baseline. Current runtime source fingerprints are recorded in the JSON. No price, victory policy or proxy bound changed.

| Headline pace | Frozen rules 32 | Final rules 33 | Delta | Automatic routes accepted / refused |
| --- | ---: | ---: | ---: | --- |
| Standard | 234 | 233 | −1 | 3 / 0 |
| Long | 342 | 311 | −31 | 3 / 0 |
| Epic | 379 | 349 | −30 | 3 / 0 |

All six finish through Prosperity with zero refused submitted AI commands. Each current campaign establishes twelve one-member, one-hearth theaters at turns 23–45. Ending membership is twelve, eleven and eleven respectively. These are real, deliberately narrow home watches; only three subsequent automatic journeys occur in each campaign. This proves adoption and removes the stranded-island refusal loop, not comprehensive defensive strategy.

Standard 233 and Long 311 remain above approximate 200/300 targets. Epic 349 is one turn below the nominal 350–400 band. **DH-021 remains open**, and this single-seed comparison does not establish balance acceptance. Proxy campaigns finish Standard 205, Long 280, Epic chronicle 360 and Epic seed-74 316. Comparison wall times include instrumentation and overlap other verification; they are not performance measurements.

## Bounded AI adoption cost

The [quiet planner measurements](ai-benchmark-final.json) use one warmup and three fresh-observation samples per authored Huge/Legendary case. Reachable, isolated-island fallback and all-blocked medians are respectively **0.348 / 1.966 / 2.082 ms** for Huge and **0.162 / 1.635 / 2.074 ms** for Legendary. Each sample uses 3 / 8 / 8 canonical route previews and reports 25 / 4,942 / 6,504 target-search expansions. Range search also runs within each preview's shared 4,096-node allowance; these counters are not total expansions. Eight previews bound combined range/target expansions at 32,768.

All six cases prove an unchanged canonical state and permitted observation, exact repeated proposals and valid ordinary commands. Reachable and fallback cases each issue one configuration and subsequently produce two accepted automatic routes; blocked cases issue none. One hundred combat companies plus one scout, four candidate hearths and 841 charted cells are authored inside Huge/Legendary populations of 1,554/4,001 armies. Flat geography, one adoption-capable realm and unsaturated searches do not establish natural-world, maximum-search or full-AI-turn performance. Setup, observations, hashes, saves and command proofs are outside timing. There is no before/after speedup claim.

The initial benchmark overlapped a browser capture when both tool approvals resumed. Its raw files remain as `ai-benchmark-overlapped.*`; accepted final measurements were repeated unchanged after explicit browser-idle confirmation. [Measurement review](ai-benchmark-review.md) records the distinction.

## Final production and publication checks

Implementation source is `0ecd2d1767f613942cf9f22315da624164cc4055`. The final fixed-AI production journey subsequently passes **1/1 in 5.0 seconds**, 6.0 seconds for the run, using real founding, theater configuration, saved restoration and portable import without development hooks. [Final production log](production-final.log). This post-P1 run belongs to publication evidence; the article accurately dates the earlier production run retained at its implementation pin.

The native 406 × 19 summary image is independently reviewed, 4,295 bytes, unchanged from the browser clip. The journal inventory totals 3,145,521 bytes, 207 bytes below its unchanged 3 MiB cap. The current catalogue records 23 items (6 completed / 13 in progress / 4 pending), with 68 delivered and 49 remaining editorial bullets. All fifteen release gates remain open; these changing editorial counts are not a completion percentage.

The first publication suite retained **2,072 passes and three failures** in two journal test files: the featured evidence link still expected the prior article path, the new article legitimately joined a search result, and its authored-scenario caption lacked the existing explicit fixture/regression label. The existing assertions and caption were corrected without new tests, skipped cases, timeout changes or a media-budget increase. [Initial publication log](publication-tests-initial.log).

The corrected publication suite passes **2,075 tests / 258 files in 57.79 seconds** ([log](publication-tests.log)). Typecheck and lint pass; the final Pages-subpath build completes in 3.979 seconds with the existing chunk warning. Runtime rules and AI are unchanged from P1.

The initial full Pages run passes 32 journeys and exposes two stale catalogue expectations: the home test still counted eleven articles and the roadmap test still expected the prior evidence revision. Both now expect dispatch twelve and the actual P1 snapshot. Application behavior, timeouts and assertions are otherwise unchanged; the initial log and traces remain retained.

The final [34-case Pages run](publication-pages.log) passes in **1.1 minutes**, covering seventeen files. The initial 32-pass/two-stale-expectation run is retained as [publication-pages-initial.log](publication-pages-initial.log), with its original traces and captures. The final run includes the new generated-production theater journey; it is not added to the earlier overlapping production or affected-gameplay counts. The article/catalogue have [independent factual review](publication-review.md), and native rendered views have [independent layout review](publication-visual-review.md).

## Published checkpoint and tracker

Published revision **`bce46a1442a0b2aa33487952b4d43e1d96cb8540`**, implementation **`0ecd2d1767f613942cf9f22315da624164cc4055`**. Both exact GitHub workflows succeed: [Verify build](https://github.com/ErikBurdett/Theandril/actions/runs/36344470706) and [Pages](https://github.com/ErikBurdett/Theandril/actions/runs/36344470740). The [same 34 live production journeys](live-pages.log) pass in **2.3 minutes**, without failures, retries or skips; [identity reconciliation](live-pages-identities.json) matches the local run. The new theater journey takes 5.4 seconds live.

[Exact public readback](live-readback.json) verifies the latest ledger revision, game HTML/JavaScript/CSS/worker bytes, absence of development hooks, dispatch 12, all nine evidence links, exact native illustration and enlargement, every roadmap record, and all fifteen open gates. [Deployment record](deployment.json). The primary checkout was synchronized to the published revision, master at zero ahead/behind, before recording these final documentation-only results.

DHARMA now records the reviewed progress in ACT-32, M3 and the still-open DH-021 pacing issue. [Concrete preview](tracker-preview.json), [guarded application](tracker-applied.json) and [exact source/generated-page readback](tracker-readback.json) preserve unrelated records, ACT-36 done and DH-020 resolved. The helper author separately reconstructed all three proposed output hashes and checked 139 evidence seals; this is disclosed self-audit, alongside the parent's review and an independent AI agent's earlier helper review. Proposal seal: `ba2c4a487dd67887af0f8730486717a971a22b7665683ac62a1c2d43c65a0d6a`. Only the three named tracker source records changed; the local tracker build completed successfully. No weekly writer or inventory was run.

Next useful work is threat-aware defensive reinforcement or a governor slice over these existing canonical commands, with blocked-route handling and direct overrides preserved. Patrol/escorts, invasion planning, army templates and combined mature-realm acceptance remain incomplete. DH-021 needs deliberate headline pacing work across more seeds; no target or price has been silently changed. This is a development deployment, not 1.0 acceptance.
