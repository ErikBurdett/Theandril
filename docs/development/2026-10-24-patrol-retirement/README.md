# Retire a stranded home patrol after an observed capture

Local continuation after publication `04d1776`; this policy is not in that
deployed build. Advances the existing ACT-32/M3 delegation work. It does not
complete DH-021, R06 counterplay, or any 1.0 release gate.

## Actual failure and policy

The corrected generated Long campaign already retained an independent witness:
turn 150, hash `4f60f2e3`, Wardhall army `army.408`. An ordinary Ashen capture
transferred its destination hearth at cell 9108. Wardhall can currently see the
new owner. The other patrol hearth at 8431 remains owned. A single saved travel
leg is paused, ordinary preview requires a siege, and the enabled patrol keeps
the company reserved. The prior AI never retires the circuit.

The [diagnosis](../2026-10-24-pacing-readiness/endpoint-retirement-diagnosis.md),
original snapshot and raw proposal stream establish the failure without an
authored battle or hidden ownership inference. The standalone
[fail-before result](../2026-10-24-pacing-readiness/endpoint-retirement-fail-before.json)
proves ordinary cleanup, exact route preservation and released reservation on
a separate saved branch. The original campaign is not rewritten.

AI now proposes ordinary `clearPatrol` for this narrow case: an enabled
persistent home circuit, two hearths within six hexes, an owned combat land
army ashore, and a matching paused single leg toward a currently visible foreign
hearth while the other hearth remains owned. Postings, sieges, missions,
disabled policies and explicit wartime-pause settings retain priority. Hidden,
missing, more distant or both-lost endpoints remain outside this policy.

Cleanup preserves every field of existing travel and reserves the army for the
rest of the current proposal batch. Only a fresh observation releases the
patrol reservation; independent theater reservations remain. There is no
automatic attack or cancellation of travel. Cleanup spends no movement and needs
no supply or route search. Retirement and safe recovery share four commands per
pass and stable rotation. One lazy observed-cell index is built only when a
candidate has a foreign target; ordinary recovery avoids that additional scan.

There is no policy-origin marker. An identical manually configured home circuit
may also be reviewed when the user explicitly hands that realm to AI. Ordinary
player turns do not clear it. Rules/save stay **35**, content **`015468d1`**;
canonical command semantics and schemas are unchanged.

## Verification

The initial discovered regression suite recorded six expected missing-cleanup
failures and ten passing controls before the implementation. Afterward, the
first three-file run passed 33 checks and exposed a too-specific test assumption:
the next complete AI plan assigns a real paid arcane survey before movement.
The isolated clear-only branch moves immediately; executing the whole preceding
batch changes its next legitimate priority. Full-sequence acceptance must retain
these ordinary actions instead of suppressing them to force movement.

The final [focused tests](tests-final.log) pass **42 checks across three files**
in 4.29 seconds, including 24 new retirement checks. The complete same-turn AI
batch performs its paid survey, then ordinary end turn permits actual movement;
all commands execute and replay exactly. Explicit observation-contract tests
cover 128-policy rotation and mixed retirement/recovery within the shared cap.
They are not represented as loadable campaign fixtures. See [tests-review.md](tests-review.md).

All **three built-production journeys pass in 19.6 seconds**, including existing
recovery and player-patrol flows. The new genuine-snapshot Watch journey clears
the policy at sequence 47 on turn 150, then issues ordinary movement to 8879 at
sequence 156 on turn 151. The final turn-152 archive has 179 records, hash
`968ad111`, exact replay and exact manual save/reload. The imported mid-round
snapshot begins a new Watch round with explicitly partial, from-save history.
The screenshot shows the Ashen observer, not omniscient Wardhall orders; the
recorded commands establish those orders. [Browser review and native artifacts](browser-review.md).

The [full suite](full-tests.log) passes **2,242 tests across 276 files in
60.78 seconds**, four workers with unchanged limits. [Typecheck](typecheck.log),
[lint](lint.log) and the [final production build](build-final.log) pass.
After browser acceptance, a source comment was corrected to distinguish safe
resume from policy retirement; all **32 built HTML/JS/CSS files remain
byte-identical** to the tested artifact ([comparison](build-byte-comparison.json)).
Independent [policy review](policy-review.md) and [factual review](final-review.md)
record their scopes and limits. No canonical rule or save migration is introduced.

## Fully charted workload

All [six benchmark cases](retirement-benchmark.json) pass strict saved-state,
command/mirror, exact route preservation and journal replay checks. Authored
Huge/Legendary worlds expose **196,608/307,200 explored cells**, with real current
sight kept separate. Each realm has 128 paused policies among 1,584/4,031
observed armies. These are constructed stress states, not organic mature realms.

| World | Visible foreign target | Hidden foreign target | Owned target |
| --- | ---: | ---: | ---: |
| Huge | 1.832 ms | 0.248 ms | 0.264 ms |
| Legendary | 2.794 ms | 0.446 ms | 0.455 ms |

Values are isolated planner medians after one warmup and three samples. Visible
cases issue four accepted clears with zero path queries, preserve all 128 routes,
and retain all 128 batch reservations; fresh observations release four. Both
negative cases issue no commands or queries. Zero available movement explicitly
prevents ordinary safe recovery in the owned-target control. Setup, observations,
serialization, commands/replay, full AI turns, worker traffic and rendering are
excluded. This measures the new observed-cell scan without claiming a speedup
or full-turn/renderer acceptance. The earlier 507-observed-cell preflight is
retained separately; final timings use the fully charted worlds.

## Pacing, with unchanged prices and bounds

The [nine-campaign run](pacing-final.json) uses Standard maps, twelve realms and
seeds 20260905/06/07, exactly as the published recovery checkpoint. All nine
finish through prosperity and issue one to five accepted `clearPatrol` commands.
The [comparison](pacing-comparison.json) keeps historical rules34 separately.

| Pace | Published recovery | Local retirement |
| --- | --- | --- |
| Standard | 219 / 193 / 214 | **219 / 194 / 201** |
| Long | 336 / 304 / 286 | **329 / 309 / 287** |
| Epic | 374 / 278 / 320 | **374 / 332 / 327** |

The original Long seed improves seven turns but remains eighteen later than
retained rules34's 311. Two Epic seeds still finish below 350–400; improved
individual results are not balance acceptance. All runs have zero refused
submitted commands and zero automatic theater-route refusals. Standard seed05
records one automatic patrol-route refusal, a separate category; this run does
not retain its detailed turn-level trace. No price, proxy bound or release target
was adjusted. **DH-021, ACT-32/M3 and all fifteen release gates remain open.**
