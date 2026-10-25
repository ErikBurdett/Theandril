# Interrupted patrol recovery — local implementation packet

Prompt: “Continue”, following saved two-point patrols. Base revision `d06ba4b`;
prior local posting-template and patrol work is preserved. Nothing is published.

[Prompt report](../prompt-reports/2026-10-24-patrol-recovery.md),
[draft dispatch](dispatch-draft.md), [final factual review](final-review.md),
[source manifest](source-manifest.json), [evidence seals](evidence-manifest.json)
and [native imagery provenance](image-manifest.json).

## Concrete defect and correction

An enabled home patrol retained its army reservation after hostile sightings
paused the ordinary route. Neither canonical movement nor the AI resumed it.
The pre-change generated Long campaign contains a company held this way for
284 sampled turns. At turn 58, peace had removed the threat and an ordinary
three-step move could already finish its leg. The snapshot, original source,
full campaign trace and failing regression are retained.

The AI now explicitly reviews a paused home-patrol leg using ordinary
`resumeMovement`. Both endpoints must remain owned hearths; the army must be
supplied, ashore and mobile, with no direct posting, siege or character mission.
Any observed wartime force or settlement within its sight blocks recovery. A
single saved waypoint must match the patrol's target and pass the public move
preview. An arrived single leg can be cleared by ordinary resume. Review has
four path queries and four commands per pass, with stable rotation. Patrol
configuration and actor reservations remain intact.

Canonical/player movement still requires explicit action. Watch mode gives AI
control of all realms; ordinary player End turn plans only other realms. Routes
have no provenance marker, so an identical manually queued leg can be reviewed
after AI takeover. Disabled patrol policies, different destinations and larger
waypoint programs are not resumed by this policy. Unsafe or obsolete circuits
remain separate unresolved cases.

[Architecture 0049](../../architecture/0049-ai-patrol-recovery.md) and independent
[policy/source review](policy-review.md). No schema or canonical rule change:
rules/save remain **35**, content **`015468d1`**. Old command archives replay
their recorded actions; future AI planning intentionally uses the corrected policy.

## Ownership and retained evidence

- Parent: baseline capture, additional seed measurements, genuine generated
  regression, runtime planner/integration, production journey, final checks and
  canonical status records.
- Diagnostic/benchmark delegate: bounded campaign diagnostic and isolated
  planner benchmark; no runtime mutation. Parent launches heavy runs sequentially.
- Test delegate: authored ordinary-command recovery, overrides, safety, fairness,
  fog and replay regressions. No runtime or UI edits.
- Independent reviewer: permission, simulation/AI boundaries, guard conditions,
  bounds and strengthened regression review; no implementation edits.

[Baseline AI source archive](baseline-ai-source.json.gz) and
[its manifest](baseline-source-manifest.json) preserve all 55 pre-change AI source
files. [Diagnostic protocol](diagnosis-runner.md), [findings](diagnosis-findings.md),
[machine comparison](diagnosis-equivalence.json) and
[isolated ordinary resume](diagnosis-resume-witness.json) distinguish the unchanged
full campaign from a counterfactual resume branch.

The diagnostic reproduces Long turn 335, hash `c6b55ec6`, winner/path and complete
command/event counts exactly. Original pacing has no ordered trace seal, so only
the diagnostic's own trace is sealed; matching ordered traces is not claimed.
Its first two snapshot files intentionally contain identical turn-58 bytes for
two triggers, not two independent witnesses. The third snapshot is an unsafe
counterexample with a lost endpoint and visible nearby enemies.

## Verification

[Generated fail-before](generated-before.log): one expected failure and one pass.
[Generated regression plus original patrol tests](generated-after.log): eleven
passes. The original snapshot reaches its actual target through the complete
new AI plan, keeps its patrol policy, reloads exactly and replays its real journal.
A canonical End turn without the AI order preserves the paused player route.

[Authored fail-before](recovery-before.log): four expected failures and two passes.
[Final authored suite](recovery-focused-final.log): nine passes, including actual
hostile movement, peace, ongoing-war threat departure, eighteen observation
exclusions, 128-record rotation, failed previews, unknown enemy changes, retained
actor ownership and a saveable displaced arrived-leg cleanup. The displacement
setup is explicitly authored, not a claim of a played battle.

[Built production](production.log): two journeys pass in 11.2 seconds, without
development hooks. Import the genuine snapshot in an explicitly from-save Watch
archive, step a real round, observe a recorded resume and movement, then restore
the exact archive/hash through manual save. This starts a new whole planning
round from a mid-round capture, not a replay of the original campaign's earlier
history. The existing player patrol/recovery and narrow enlarged-text controls
also pass. [Build](build.log) succeeds with existing annotation/bundle warnings.

[Full suite](full-tests.log): **2,217 tests across 275 files pass in 61.66 seconds**,
with four workers and unchanged limits. [Final typecheck](typecheck-final-tools.log)
and [lint](lint-final-tools.log) cover the completed diagnostic/benchmark tools.
Overlapping focused and full-suite counts are not additive.

[Four isolated planner cases](recovery-benchmark.json) use 128 own paused patrols
in authored Huge/Legendary worlds, with 1,453/3,900 visible foreign armies. One
warmup precedes three samples. Safe-review medians are **0.666/0.984 ms**, with
four legal resumes and 124 untouched routes. A nearby observed threat blocks all
128 records at **0.255/0.667 ms**, without a path query. Commands, observations,
canonical state and actual saved continuation are verified separately from timing.
Setup, observation construction, execution, cloning, hashing, other AI phases,
worker transfer and rendering are excluded. These short-route samples are not
worst-case search or tail-latency acceptance. [Protocol](recovery-benchmark-notes.md).

The [first benchmark](recovery-benchmark.log) correctly rejected an authored
fixture placing foreign factions on one cell. The tool now gives them distinct
visible cells; strict save validation was unchanged. The
[corrected run](recovery-benchmark-fixed.log) passes all four cases.

## Pacing and remaining scope

The additional baseline uses seeds 20260906/20260907 before runtime edits;
seed 20260905 comes from the preceding sealed checkpoint. All compare the same
Standard map, twelve realms and unchanged pack. The final nine-campaign matrix
is retained separately. [Machine comparison](pacing-comparison.json):

| Pace | Seed | Retained rules 34 | Patrols before recovery | Recovery | Resume commands |
| --- | ---: | ---: | ---: | ---: | ---: |
| Standard | 20260905 | 233 | 236 | 219 | 22 |
| Standard | 20260906 | 211 | 203 | 193 | 52 |
| Standard | 20260907 | 225 | 231 | 214 | 31 |
| Long | 20260905 | 311 | 335 | 336 | 62 |
| Long | 20260906 | 312 | 278 | 304 | 39 |
| Long | 20260907 | 309 | 327 | 286 | 28 |
| Epic | 20260905 | 349 | 374 | 374 | 62 |
| Epic | 20260906 | 367 | 343 | 278 | 51 |
| Epic | 20260907 | 373 | 374 | 320 | 31 |

All nine finish in prosperity. There are zero refused submitted commands and
zero theater route refusals. Standard seed 20260905 has one automatic patrol
route refusal; other final cases have none. The `automaticRefusals` field in the
existing measurement tool counts theater failures only, while
`patrolRouteRefusals` separately counts patrol failures. Do not collapse those
two fields into an all-automation zero-refusal claim.

The [Standard diagnostic readback](diagnosis-standard-equivalence.json) reproduces
turn 219, hash `f570049e` and the complete command/event counts. Its one refusal
is Mire Courts on turn 81: “No safe route is known through explored terrain.”
The next turn's ordinary allocation succeeds, reaches the target and clears the
error; see army.198 at turns 81/82 in
[the permitted patrol trace](diagnosis-standard/patrol-states.jsonl). This is a
reported transient automatic route blocker, not a refused submitted AI command.

The corrected Long diagnostic matches final turn 336, hash `bb2a4ca1`, winner
Glass Tide and all command/event counts, with 62 ordinary resume commands:
[readback](diagnosis-recovered-equivalence.json). New snapshot triggers and
winner readiness remain in its [summary](diagnosis-recovered/summary.json).

Prices, proxy bounds and stated release targets remain
unchanged. Recovery fixes a proven blocked order; it does not establish a causal
explanation or fix for the original Long +24 drift. The new Epic results below
target must remain visible as well. The original Long seed is now 25 turns later
than retained rules 34 and one later than the preceding patrol checkpoint.

ACT-32/M3, DH-021 and all fifteen release gates remain open. Next work is
multi-seed victory readiness and counterplay diagnosis with the corrected AI,
before deliberately deciding whether progression pacing needs repricing.
Endpoint loss/obsolete patrols, escorts, longer programs, broader governors and
organic mature-realm acceptance remain unfinished. No scope target was cut.
