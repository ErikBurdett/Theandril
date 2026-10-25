# Explicit AI recovery of interrupted home patrols

## Prompt

“Continue”, following the saved two-point patrol checkpoint toward 1.0.

## Delivered

AI-controlled realms now review eligible home patrols after ordinary travel
pauses. They issue explicit Resume only for a matching single-leg route with
owned endpoints, current supply and mobility, no direct override, and no observed
wartime force or settlement within sight. Four path queries and four commands
bound each pass, with deterministic rotation. Saved patrol configuration and
held-army reservations remain intact. Player-controlled canonical movement does
not resume itself.

The defect is reproduced in an actual generated campaign: a company remained
paused for 284 sampled turns although a preserved turn-58 save already allowed
a safe three-step return. Its genuine snapshot now passes a complete AI-plan,
save/reload and recorded-replay regression. The production Watch flow also
records the resume and restores its exact archive through real controls.

## Changed

- AI: `packages/ai/src/patrol-recovery.ts`, existing-record integration in
  `patrols.ts`, authored safety/budget tests and a generated snapshot regression.
- Tools: deterministic campaign diagnosis with bounded permitted-state records,
  configurable pace/seed and exact blocked-event evidence; an isolated
  Huge/Legendary planner benchmark.
- Browser: `tests/production/patrol-recovery.spec.ts`, importing the genuine
  snapshot as an explicitly partial-history Watch archive without development
  hooks, stepping a whole round and checking actual exported history/recovery.
- Records: architecture 0049, current implementation/M3/performance status,
  sealed baseline source, native screenshot evidence, reviews and draft dispatch.

Rules/save remain **35** and content **`015468d1`**. Canonical rules, UI layout,
prices and test bounds are unchanged. Previous local work is preserved on
`master`, base `d06ba4bcbc7e64a0ba3aa26e2b7460d174bb4333`. No commit was made.
[Work packet](../2026-10-24-patrol-recovery/README.md).

## Verified

- [Full suite](../2026-10-24-patrol-recovery/full-tests.log): **2,217 tests across
  275 files**, 61.66 seconds, four workers, unchanged limits.
- [Generated fail-before](../2026-10-24-patrol-recovery/generated-before.log):
  one expected failure and one pass; [corrected generated/original patrol run](../2026-10-24-patrol-recovery/generated-after.log)
  passes eleven. [Authored fail-before](../2026-10-24-patrol-recovery/recovery-before.log)
  retains four expected failures/two passes; the [final authored suite](../2026-10-24-patrol-recovery/recovery-focused-final.log)
  passes nine with ordinary threats/peace, overrides, eighteen isolated exclusions,
  128-record rotation, fog invariance, actor ownership and saved arrived-leg cleanup.
- [Built production](../2026-10-24-patrol-recovery/production.log): **two journeys**,
  11.2 seconds. The new real Watch/recovery scenario and existing player patrol,
  narrow enlarged-text and keyboard scenario pass without development hooks.
- [Final typecheck](../2026-10-24-patrol-recovery/typecheck-final-tools.log),
  [lint](../2026-10-24-patrol-recovery/lint-final-tools.log) and
  [build](../2026-10-24-patrol-recovery/build.log) pass. Existing upstream annotation
  and bundle-size warnings remain.
- [Independent source review](../2026-10-24-patrol-recovery/policy-review.md):
  no blocking finding. Both suggested test-strength improvements were implemented
  and reviewed. The factual review is linked from the packet.
- [Four isolated benchmark cases](../2026-10-24-patrol-recovery/recovery-benchmark.json):
  128 own paused patrols; Huge/Legendary safe-review medians **0.666/0.984 ms**,
  four accepted resumes each; threat-blocked medians **0.255/0.667 ms**, no queries.
  One warmup and three samples verify exact proposals, unchanged observation/state
  and ordinary saved continuation outside timing.
- [Original diagnostic](../2026-10-24-patrol-recovery/diagnosis-equivalence.json)
  exactly matches the previous Long turn/hash/winner and command/event counts.
  [Corrected Long](../2026-10-24-patrol-recovery/diagnosis-recovered-equivalence.json)
  and [Standard](../2026-10-24-patrol-recovery/diagnosis-standard-equivalence.json)
  reproduce the new pacing results and complete command/event counts.

Focused and full-suite counts overlap. The first benchmark failed strict save
validation because its authored enemy factions shared a cell. The corrected
fixture separates them; validation was not relaxed, and both logs remain.

## Not done / blocked / caveats

**This fixes a stuck-order defect, not the original pacing regression.** With
fixed prices and seeds 20260905/20260906/20260907, Standard ends at
**219/193/214**, Long **336/304/286**, Epic **374/278/320**. The original Long seed
is one turn later than the preceding patrol checkpoint and 25 later than retained
rules 34. Two Epic seeds now finish below 350–400. No price, test bound or release
target was adjusted. [All nine comparisons](../2026-10-24-patrol-recovery/pacing-comparison.json).

No submitted command or theater route is refused across the nine campaigns.
One Standard automatic patrol route reports no safe path on turn 81; the same
army reaches its target and clears the error on turn 82. This distinct patrol
counter is not hidden by the measurement tool's theater-only `automaticRefusals`.

Identical manual single legs lack provenance and can be reviewed after explicit
AI takeover. Disabled patrols, lost endpoints, unsafe contexts and multi-waypoint
routes remain outside this recovery. Long-lived unsafe/obsolete circuits still
need a separate strategy. The production test starts a new whole Watch round
from a mid-round snapshot and discloses its partial history. Its screenshot shows
the Ashen observer map, not the foreign Mire company through fog.

Benchmark setup, observation construction, commands, cloning/hashing, other AI
phases, worker transfers and rendering are excluded. Dense visible-force fixtures
and short paths do not establish worst-case search, sustained memory, organic
scale or cross-browser acceptance. No content/art changes or new art validation
are claimed.

**DH-021, ACT-32/M3 and all fifteen release gates remain open.** No commit, push,
deployment, public journal publication or external tracker edit was performed.
Work remains in the primary checkout; no publication sync was needed. The
illustrated dispatch stays draft under docs and the shipped journal is unchanged.

## Follow-ups

Use the corrected AI's multi-seed winner-readiness and command evidence to isolate
funding waits and counterplay before deciding on any deliberate progression
repricing. Keep the Epic early finishes and original Long delay explicit. Then
continue obsolete-patrol handling, escorts, larger order programs, governors and
organic large-realm acceptance. The broader accepted content, politics, magic,
victory and multiplayer scope remains unchanged.
