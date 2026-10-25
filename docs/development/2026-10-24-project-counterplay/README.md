# Immediate project counterplay

Local R06 continuation, with rules/save **35** and unchanged content/prices. This is a bounded immediate-interruption and existing-siege maintenance policy; it does not complete R06, DH-021, or any release gate. Runtime and discovered unit tests are implemented; parent-owned full-suite, browser, benchmark and campaign measurements are recorded separately as they become available. No publication is claimed here.

## Failure and actual decision cadence

The [diagnosis](diagnosis.md) reproduces an authored ordinary-command failure: a paid enemy project at 4/5, one currently visible host, a capable adjacent free army, and an otherwise acceptable binding peace. Actual peace lets the enemy win next turn; actual siege pauses the project immediately. Separate real controls prove that no available force and a strictly faster own project warrant different decisions. Prepared infrastructure and deployment are labeled authored; project costs, progress, peace, siege and outcomes use ordinary commands.

**The original rejection-then-fresh-plan draft is superseded.** Its two manual planning calls proved that the existing tactical planner could siege, but Watch and rival processing plan once per realm per round. Rejection alone therefore loses to a one-turn project before another planning pass. The original draft and evidence remain intact; they do not establish playable acceptance.

The corrected runtime emits **`respondPeace(accept:false)` followed by one `besiege` in the same batch**. Actual rejection only removes the offer and emits events. After all canonical reconciliations, observed armies, towns, war, siege facts, routes, postings, characters, theaters, patrols, projects, supply, treasury and pending decisions remain identical; the same siege quote remains valid. The [batch proof](reject-siege-batch-evidence.json) executes both commands and the real end turn, preserving 4/5 rather than allowing victory, with exact mirror/save/journal replay. The reject-only branch in that artifact actually loses, retaining the cadence correction as evidence.

Every valid incoming offer receives the same bounded opportunity review, including an unaffordable demand the AI would already reject. Without an available interruption or a qualifying existing project siege to preserve, the existing peace assessment determines acceptance. A strictly faster active own project retains the ordinary peace decision. With no incoming offer, immediate counterplay precedes outgoing peace and optional work, including during offer cooldown. No worker-wide replan behavior changed.

## Canonical public quote and bounded policy

`getBesiegePreview` shares a pure establishment blocker with the ordinary command. It preserves existing refusal order and semantics without adding AI morale, fatigue, supply, mission or command-capacity restrictions to canonical legality. The state adapter reads later siege/visibility facts lazily, preserving short-circuit work on obvious refusals. The observation adapter caches primitive public facts for an immutable view; a fresh view is required after commands. Actual command validation remains authoritative for stale quotes.

Rules 35 observations expose `siegeEstablishment:true` and a generic `strategicCommandBlocker`. The latter quotes victory, pending capture or battle refusal in dispatcher order without exposing private participants, locations or choices. Uninvolved battle/capture objects stay masked. Older observation capabilities remain absent and retain their original AI decisions. No canonical save field, format or version changed. [Architecture](../../architecture/0050-immediate-project-counterplay.md) and [query boundary review](query-architecture.md).

AI considers up to eight active or qualifying paused enemy projects and four establishment quotes per diplomacy pass. Only currently observed hosts within the binding-peace horizon qualify. A new interruption requires an already adjacent owned combat land army that passes the canonical quote. Routes, postings, enabled theaters/patrols, attached agents, missions, naval/carried actors, scouts, command blockers, exhausted forces and clearly stronger observed host garrisons retain their existing restrictions. A generic global strategic blocker prevents all new AI work while preserving existing controlling-faction battle/capture handling. No path search, hidden-state probe or project-by-global-army scan is used.

The initial deferral of all paused projects/current sieges was superseded after the retained multi-round failure below. Maintenance now preserves an actual own siege matching a paused imminent project at its currently visible foreign host, provided the host is unoccupied. Canonical occupation precedes siege as a pause cause; the policy uses those public facts without parsing reason strings. It rejects incoming peace and skips outgoing peace for that enemy, making no new siege command or quote. Exhausting the four new-establishment quotes does not skip later maintenance candidates within the same eight-project cap. Outgoing suppression falls through to ordinary conquest/economy work. Unrelated paused projects, third-party sieges, occupied or hidden hosts, distant campaign operations and broad project-aware treaty valuation remain outside this slice. The unchanged peace valuation still handles offers without a qualifying opportunity. Other unrelated incoming offers and broader multi-front priorities remain ordinary diplomatic policy; this is not universal victory counterplay.

## Verification so far

The [first integrated focused run](implementation-focused-first.log) passes **41 tests across three files in 1.01 seconds**: the new query suite, the new AI suite and existing diplomacy tests. Query coverage includes **18 canonical command-parity cases inside one test**, four frozen historical-version replay tests, an artifact-integrity check and a short-circuit check. Each accepted/refused command boundary is save-valid; uninvolved battle/capture and private foreign siege facts retain their visibility boundary.

The AI tests execute exactly one planning pass before end turn for incoming white peace, an unaffordable demand, and outgoing counterplay. They prove actual paused progress, independent mirrors and exact journal replay; the real faster-own-project branch wins after peace. Real spent movement, historical capability absence, explicit observation-contract reservation/control cases, collection reordering, and four-query/eight-project caps are covered. Synthetic contracts are never presented as loadable campaign histories.

The [first query-only run](query-tests-first.log) retained three failed historical-capability assertions: it observed old replayed states outside their historical execution context, where modern continuation is expected. Exact command results and final bytes had already passed. The corrected test uses `withRules` for historical observations; the captured [command seals](historical-command-seals.json) were not regenerated after implementation. [Typecheck](typecheck-first.log) passes. [Final scoped lint](lint-final.log) passes after removing one unused test-only import; the initial lint failure remains retained.

[Initial source identity](source-implementation.json) pins the ten implementation/test files at that first checkpoint. Subsequent initial-candidate acceptance is recorded below and in the browser/benchmark packets; it does not cover the later maintenance extension. The [benchmark plan](benchmark-design.md) explicitly rejects an invalid attempt to force denied active-project quotes with existing sieges, since siege pauses the project. Budget contracts and representative canonical timing are separate evidence scopes.

## Initial-candidate integration and headline pacing

[Typecheck](typecheck.log), [lint](lint.log) and the [full suite](full-tests.log)
pass: **2,289 tests / 279 files, 64.74 seconds** with four workers and unchanged
limits. The unchanged nine-campaign [matrix](pacing-final.json) and
[comparison](pacing-comparison.json) retain Standard **219/194/201**, Long
**329/309/287**, Epic **374/332/327**. All nine final hashes and non-timing
report fields match retirement's retained result. Submitted-command and
automatic-theater refusals are zero; the same Standard seed retains one
automatic patrol-route refusal. No new organic counterplay activation is
established by identical outcomes. The original Long delay and two early
Epic seeds remain open; prices and proxy bounds are unchanged.


## Retained multi-round failure and maintenance extension

The [following-round diagnostic](following-rounds-findings.md) executed all ordinary AI proposals for both realms once per Watch round. First-round interruption worked, but on turn 30 Reedbound accepted a fresh peace offer, released its own siege and allowed the same paid project to win on turn 31. Both initial-offer variants reproduce it, with exact archives. The player/no-offer branch also offered peace on its very next AI pass. These are actual authored-fixture traces, not inferred headline-campaign causes. This failure required expanding the current feature before publication; the original active-only policy and its acceptance evidence remain retained.

The new [maintenance tests](../../../packages/ai/src/project-counterplay-maintenance.test.ts) first failed all three real-flow assertions against the old implementation ([fail-before log](maintenance-fail-before.log)). The extension preserves the actual siege through the turn-30 offer, then continues ordinary planning. In five complete Watch rounds, both variants reject the renewed peace and retain the paused 4/5 project through endTurn 31. The next actual assault has two legitimate outcomes: without an initial offer the host falls and its project is cancelled; with an initial offer, the battle ends in mutual withdrawal, the siege lifts through combat and Ashen wins on turn 32. The policy does not promise battle victory. All proposals, tactical decisions and capture choices execute normally, and both final archives replay exactly. See [maintained trace](maintained-rounds-evidence.json) and `maintained-*-archive.json` files.

The [first extension run](maintenance-focused-first.log) retained one overstrong assertion that the enemy could never win in the fifth round. It failed on the genuine mutual withdrawal, even though no peace was accepted. The corrected test asserts the precise maintained-siege milestone followed by each actual combat outcome, without suppressing combat or granting strength.

[Extension focused checks](maintenance-focused-second.log) pass **51 tests across three files in 1.12 seconds**, including 15 new maintenance tests, the existing immediate-policy suite and canonical query suite. Controls include unrelated/third-party/other-host sieges, occupation, current sight, changed host ownership, protected relationships, historical capability absence, a real faster-own-project peace/victory branch, and maintenance after four refused quotes within eight candidates. [Typecheck](maintenance-typecheck.log) and [scoped lint](maintenance-lint.log) pass. [Maintenance source identity](source-maintenance.json) pins the frozen candidate. Final full-suite, nine-campaign pacing, extended production browser and ten-case benchmark acceptance are pending parent-owned reruns; initial-candidate results above must not be attributed to the expanded source.

## Final integrated acceptance of the maintained-siege source

[Full suite](full-tests-final.log): **2,304 tests  / 280 files,65.18 seconds**;
[typecheck](typecheck-final.log), [lint](lint-integration-final.log), final
[browser typecheck](typecheck-browser-final.log) and [build](build-final.log) pass.
All four [production journeys](browser-final-fixed.log) pass in 17.0 seconds. The
[final review](browser-final-review.md) and [exact manifest](browser-final-evidence.json)
retain two five-round Watch histories, fresh-offer rejection through turn31 and
both genuine combat outcomes at 32. A victory chronicle modal caused one retained
harness failure; the rerun closes it through its actual control without changing
runtime or assertions. Durations during functional overlap are metadata only.

The final [nine-campaign matrix](pacing-maintained.json) has identical finish
turns, final hashes and non-timing fields to retirement ([comparison](pacing-maintained-comparison.json)).
Standard 219/194/201, Long 329/309/287, Epic 374/332/327. Existing adverse pacing and
one automatic patrol-route refusal remain visible; no organic activation is
claimed from identical outcomes. Prices/proxy bounds stay fixed.

[Ten final benchmark cases](counterplay-benchmark-final.json) pass in an exclusive
window after integration/pacing/browser completion. New-siege medians are
Huge 2.839/Legendary 3.396 ms; maintained-siege medians 2.416/2.540 ms.
[Method and all samples](benchmark-notes.md) retain the initial setup refusal,
source snapshots, original 30.600 ms outlier and timing exclusions. The parent
reviewed fixture construction, independent branches and command/save assertions;
the benchmark author's own report is not its independent review. No scoped
blocker remains for this bounded feature. Publication identity and live checks
will follow separately; all release gates remain open.
