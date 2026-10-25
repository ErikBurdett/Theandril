# Captured home endpoint: focused fail-before evidence

The next demonstrated defect is an obsolete AI home circuit retaining its army
reservation after a currently visible endpoint is captured. This uses a genuine
corrected Long campaign snapshot; no invented town spacing, completed project or
hidden ownership fact is needed.

## Rejected adjacent-siege hypothesis

The earlier adjacent-target suggestion in `diagnosis.md` is ruled out for ordinary
valid campaigns. `packages/sim/src/siege.ts:56` requires an army to be adjacent to
the town. Two towns adjacent to that same army are at most two hexes apart.
`packages/sim/src/save.ts:1327` rejects town pairs within two hexes, and ordinary
founding enforces that spacing. A two-adjacent-town fail-before fixture would
therefore be invalid. No such fixture or failing discovered test was created.

The distant-project-versus-nearby-town strategic choice is a separate potential
policy question. It is not a substitute for the impossible adjacent case and is
not needed for the concrete patrol defect below.

## Genuine ownership-loss boundary

Input: [corrected Long snapshot3 at turn150](../2026-10-24-patrol-recovery/diagnosis-recovered/snapshot-3-turn-150.json).
Canonical hash `4f60f2e3`; raw SHA256
`e8b68f936e8f7042f04465f879e669ef038cc27a9c927781fe368075a9e92b25`.
The retained ordinary proposal stream records `resolveCapture` sequence1794:
Ashen Compact occupies `settlement.517` on turn150. The corrected diagnostic has
no submitted refusals; the subsequent snapshot confirms actual new ownership.
Wardhall's ordinary plan is sequence1802 in that campaign.

Observed facts for Wardhall `army.408`:

- Its enabled persistent patrol has endpoints8431 and9108, `pauseOnWar:false`,
  and selected target9108. Endpoint8431 remains its own hearth.
- Endpoint9108 is settlement517, now Ashen Compact's. The town is present in
  Wardhall's permitted settlement observation and its cell is currently visible.
  This is not stale border memory or an inference from a missing own-town row.
- The existing route is paused, with one waypoint exactly matching target9108.
  Its retained hostile-sighting reason is explicit.
- The current canonical movement preview reports `action:'besiege'`,
  `canQueue:false`: ordinary travel cannot bypass that hostile settlement.
- `planPatrol` returns no commands and keeps the army held. The full ordinary
  AI plan also issues no actor command for it.

The source interaction is specific: `patrol-recovery.ts` requires both endpoints
to remain owned hearths, so recovery appropriately refuses this leg. Meanwhile
`theaters.ts:14` reserves every enabled patrol army, regardless of endpoint
ownership. `patrols.ts` delegates existing records to recovery instead of
adopting another circuit. None of those branches retires the obsolete circuit.

## Standalone regression and ordinary cleanup proof

The draft [endpoint-retirement-fail-before.ts](endpoint-retirement-fail-before.ts)
is outside test discovery. Run after preserving any existing output:

```sh
node --import tsx docs/development/2026-10-24-pacing-readiness/endpoint-retirement-fail-before.ts
```

Its retained [log](endpoint-retirement-fail-before.log) and
[JSON evidence](endpoint-retirement-fail-before.json) show a single intentional
final assertion failure: actual `[]`, expected one ordinary
`clearPatrol(faction.wardhall_remnant, army.408)`.

Before that assertion, the draft proves an isolated `clearPatrol` branch:
the command succeeds, every route field remains exact, the enabled-patrol hold
disappears, independent command results match, and save/reload plus journal replay
produce hash `567fe8e9`. The measured campaign snapshot remains unchanged.

Three real-command negative controls pass before the intentional failure:

1. `setPatrolEnabled(false)` preserves the configured disabled policy and emits
   no cleanup proposal.
2. An explicit `setPatrol(...pauseOnWar:true)` retains the selected route target
   and emits no cleanup proposal; it is not the persistent home-circuit default.
3. A real `queueMovement` to a different permitted destination replaces the
   route. That distinct direct order remains exact and emits no cleanup proposal.

The draft checks immutable permitted observations and original canonical hash.
No application source, discovered test, existing test, commit or publication was
modified for this reproduction. A `clearPatrol` branch is diagnostic command
evidence, not a rerun of the pacing campaign.

A subsequent isolated check also proves that releasing the reservation is useful:
after the ordinary clear, a fresh full AI plan proposes `moveTo` for army408 to
cell8879. Every command in that full plan is accepted, the company actually moves
8659→8879, and the resulting hash is`2df643b1`. The earlier paused route is replaced
by that explicit ordinary movement decision, not by a side effect of clearing.
This is a separate branch from the source snapshot, not the measured campaign.

[endpoint-retirement-tests.draft.ts](endpoint-retirement-tests.draft.ts) prepares
the future acceptance cases outside discovered tests. It covers positive
cleanup with batch reservation, a full cleanup batch followed by actual fresh
AI movement and exact mirror/replay, explicit disabled/war-pause/standing-posting
controls, canonical player turns, historical capability absence and observation
contracts for active/different/multi-waypoint travel and stale target knowledge.
The observation-only variants are labeled as such rather than presented as
generated campaign histories. The draft was linted but deliberately not promoted
or executed as an acceptance suite before the parent's live publication check.
Additional explicit observation contracts cover zero movement, exhaustion and
absent supply: these must not prevent an administrative clear, spend route
queries or mutate the retained travel. A real `setTheater` control checks that
an overlapping enabled theater continues reserving the army both within the
cleanup batch and after the patrol record is gone.

## Proposed minimal implementation and acceptance

Add a bounded AI review that issues `clearPatrol` for a recognizable obsolete
home circuit after observed ownership loss. Keep configuration cleanup in the
ordinary command API; do not add a simulation auto-clear rule. Suggested initial
eligibility is deliberately conservative:

- Only enabled persistent (`pauseOnWar:false`) home-circuit-shaped records for
  the AI-controlled faction, with its living owned combat land company ashore.
- One endpoint still an owned hearth, the other a currently visible foreign
  hearth; require positive public ownership evidence, not just absence from the
  own-town list. Keep the bounded nearby-home geometry from adoption.
- No competing direct order, or a single paused leg matching this patrol's
  selected endpoint; preserve distinct targets and multi-waypoint routes.
- Preserve explicit disabled/war-pause policies, postings, sieges and character
  missions. Do not revive routes, issue attacks, alter endpoints or cancel travel
  as a side effect of retiring the future circuit.

There is no saved source/provenance tag distinguishing AI-created patrols from
an identical human-authored circuit. Do not claim the policy can recognize who
created it. Its authorization comes from giving the faction to AI control, with
the same explicit caveat as matching-leg recovery. Canonical player-controlled
turns must leave the configuration untouched without an AI cleanup command.

Keep at most four cleanup/recovery commands in the existing bounded review and
use one observed-town/route/army index, not a patrol-by-world scan. Preserve a
deterministic rotating review order. Avoid clearing and reassigning the same
company from stale facts within one command batch: execute cleanup, then let a
fresh observation release its hold. The immediate `clearPatrol` boundary must
preserve the route exactly; any later route decision is a separate normal order.
Administrative retirement belongs before recovery's movement, supply and
immediate-threat checks. Those conditions govern travel, not removal of an
obsolete future circuit. Clearing must also preserve any independent theater
hold on the fresh observation; absence of the patrol alone is not proof the
company is free of all other delegated assignments.

Promote the genuine snapshot regression into discovered tests only after the
previous publication checkpoint is complete. Add authored ordinary-capture
coverage if needed, current-visibility/hidden-owner equivalence, historical
capability absence, disabled and explicit-policy controls, alternate and
multi-waypoint route controls, override controls, bounded-review fairness and
save/replay. Recheck all current headline seeds and historical readback with
unchanged prices and proxy limits. Retirement must not be sold as resolving
DH-021 or the full project-counterplay obligation.
