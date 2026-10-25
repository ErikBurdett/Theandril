# Patrol recovery policy review

2026-10-24. Independent source review for the continuing 1.0 task. This document
changes no runtime code, prices, campaign bounds or saved schema. Parent-owned
campaign diagnostics must establish whether the mechanism below contributes to
the measured Long slowdown before accepting a pacing explanation.

## Finding and evidence boundary

An enabled patrol can retain an army indefinitely after ordinary travel pauses,
even after the original interruption disappears:

1. [`planPatrol`](../../../packages/ai/src/patrols.ts) returns immediately if any
   own patrol record exists, including a disabled record. It only adopts a new
   circuit; it never reviews an existing circuit or route.
2. [`heldDelegatedArmyIds`](../../../packages/ai/src/theaters.ts) reserves every
   enabled patrol army regardless of its reported status. Those reservations
   flow through the full AI plan into military, merge, naval and specialist
   planners. An interrupted patrol therefore has no alternate actor planner
   that can recover it.
3. [`advancePatrols`](../../../packages/sim/src/patrols.ts) skips every existing
   movement route, including paused routes. [`advanceMovement`](../../../packages/sim/src/movement.ts)
   only follows active routes. Neither age nor disappearance of the original
   threat changes this state.

The existing simulation test “pauses ordinary travel after a newly sighted enemy
and does not automatically resume it” already proves the canonical stopping
behavior. That is correct player-order behavior. The missing AI review is a
competency gap, rather than a reason to change canonical travel priority.

The retained [headline measurements](../2026-10-24-patrols/pacing-final.json)
report Standard236, Long335 and Epic374, with zero patrol route refusals in all
three runs. Their aggregate counts do not identify how long particular armies
remained paused, whether their threat disappeared, or whether those armies could
have affected the winner. The 24-turn Long difference is not yet attributed to
this defect. A route that queues successfully and subsequently pauses does not
count as a patrol queue refusal.

## Other stale conditions

| Condition | Current behavior | Recovery implication |
| --- | --- | --- |
| Newly sighted hostile later leaves or peace ends the threat | Existing paused route survives; enabled patrol army remains reserved | Candidate for bounded ordinary `resumeMovement` review |
| One endpoint settlement changes owner | Patrol stores cells, not settlement ownership or a home-defense purpose; new queue may refuse, or an existing route may pause | Do not resume a home circuit unless both endpoint settlements are currently owned; endpoint-loss retirement is separate policy work |
| Endpoint settlement is razed | An explored empty endpoint remains a legal patrol point and may still receive travel | Legality alone does not prove usefulness; no saved purpose says this patrol must serve two surviving hearths |
| Posting, mission, siege, transport, or incompatible army composition supersedes patrol | Canonical allocation waits; enabled record remains reserved | Preserve the override; recovery must not cancel or displace it |
| Explicitly disabled patrol, including public war-pause policy | No new allocation; already issued travel persists; AI reservation excludes disabled patrol | Do not re-enable, rewrite, or infer permission from the reason it became disabled |
| Army dies or changes owner | Allocation prunes the record | Already handled; not an indefinitely retained live-army case |

Permanent endpoint failure can cause repeated bounded queue attempts and private
refusal events. It is a real source-level possibility, but the zero-refusal
headline evidence does not establish it as the cause in these campaigns. A
configured patrol also prevents replacement adoption indefinitely, even when
disabled; this deliberately preserves saved player configuration and must not be
silently treated as an unused AI slot.

## Minimal candidate policy

Add an observation-only review branch before the existing adoption early return.
Keep adoption and canonical allocation unchanged. Review only a bounded,
deterministically ordered set of existing patrols; cap route previews and count
their expanded nodes in the existing diagnostic interface. A turn-rotating
bounded selection avoids starving larger player-authored rosters without raising
the search budget. Build route, army and owned-settlement indexes once.

An eligible review requires all of the following:

- Own patrol is enabled and reports `waiting`, with a currently paused ordinary
  route. Do not interpret the human-readable blocker string as a machine code.
- Route has exactly one remaining waypoint, equal to the patrol's current
  `targetCell`. Differently targeted or multi-waypoint orders remain untouched.
- Army is owned, combat-capable land, ashore, without a founding formation, and
  has no movement/command blocker. No posting, siege or active character mission
  applies. Global battle/capture/victory decisions retain their existing priority.
- Both endpoint cells contain currently owned settlements. This narrowly reviews
  the AI's home-defense use case; it does not redefine arbitrary player patrols.
- No currently observed at-war army or settlement lies within `army.sight` of
  the army. Use the permitted observation and hex distance, including hostile
  settlements as well as armies. Do not query hidden occupancy or infer safety
  from a remembered hostile ID disappearing.
- An ordinary `getMovementPreview` to the sole waypoint allows queueing and has
  action `move`. A legal route alone is insufficient: `resumeMovement` refreshes
  remembered hostile IDs and would otherwise acknowledge an ongoing threat.

Emit only ordinary `resumeMovement`, retain the army reservation for the rest of
that planning batch, and include a compact reason naming the safe review. Do not
emit enable, disable, clear, cancel, replacement queue, endpoint change, or attack.
Canonical command validation remains authoritative if earlier commands in the
same batch change conditions. New threats encountered later still pause travel
normally. A safe preview is not a guarantee about unseen or future conditions.

For the unusual displaced paused route whose sole waypoint already equals the
army's cell, canonical `resumeMovement` cancels its exhausted route. A normal
preview instead reports “already at destination.” The smallest policy can defer
this corner. If included, handle it as a separately tested explicit resume
command after the same permission/threat/override checks; do not pretend its
preview permits movement or call cancellation directly.

This policy deliberately leaves endpoint loss, a permanently unsafe circuit, and
broader strategic obsolescence unresolved. Retiring or retargeting those orders
needs a distinct policy decision and campaign evidence. Resuming a viable paused
leg is a narrower intervention than reallocating its army or rewriting its saved
configuration.

## Ownership and compatibility

Neither [`Patrol`](../../../packages/sim/src/patrol-state.ts) nor
[`MovementRoute`](../../../packages/sim/src/movement.ts) records whether a human,
patrol allocator, or other AI planner issued it. `pauseOnWar` is a public player
option and is not an AI-ownership flag. A single matching waypoint proves intent
compatibility, not origin. A manually issued route identical to the patrol leg
can satisfy the proposed review conditions.

That ambiguity is acceptable for an explicitly AI-controlled realm if disclosed
as AI review of a matching route, without claiming the route is proven to have
come from the patrol. The [worker](../../../apps/web/src/simulation.worker.ts)
plans every faction only in AI-watch mode, which rejects manual orders; normal
player end-turn planning excludes the player's faction. Thus this proposal does
not cause automatic recovery of a human player's route. Any future assist mode
that invokes the full AI planner on a human seat must define this authority.

No schema change or canonical rules bump is needed for the narrow AI policy:
all observations and the resume command already exist, and replay records actual
commands rather than regenerating AI choices. Preserve historical observations
without `patrols` and verify frozen old command/replay fixtures. The current
canonical player behavior remains exactly as before.

If the product instead promises that even an identical manually issued route
must survive untouched after AI takeover, current state cannot enforce that
promise. It requires explicit public recovery permission or saved route-source
metadata, plus schema/version and UI work. Do not invent provenance from endpoint
matching, blocker text, target state, or `lastAttemptTurn`.

## Reports and required regression evidence

The observed `waiting` status has two distinct sources: an existing paused route,
or the latest actual queue refusal. `lastError` records only that queue result;
a successfully queued route later interrupted by sight correctly leaves it null.
`blocker` then comes from the paused route. Explicit patrol enable clears the
last error but does not resume its route. Disabled patrol status is `paused`
even while its existing travel remains active. Recovery must join the actual
route and observation fields, rather than relying on one status or an error's
age. No report schema change is needed for the candidate policy.

Before implementation acceptance, prove:

1. Actual command-driven patrol travel encounters a new hostile and pauses;
   after ordinary movement or peace removes the local threat, AI proposes one
   legal resume, accepted travel progresses, and its patrol configuration stays
   byte-for-byte unchanged. Retain the failing pre-change planning assertion.
2. Still-observed hostile armies **and settlements** within sight suppress
   review. Off-sight hidden changes produce identical observation and proposal.
   New later sightings still interrupt resumed travel without automatic attack.
3. Disabled/war-paused patrols, active routes, no route, different targets,
   multi-waypoint routes, lost endpoints, posts, missions, sieges, transport and
   incompatible composition receive no recovery command. An ordinary refusal
   without an existing route remains canonical allocator work.
4. A matching manually issued route has the explicitly documented AI-control
   behavior; a human player's canonical end turn leaves the same route paused.
5. Full AI planning emits no competing movement, merge, specialist, or naval
   order for a recovered army in the same batch. Query caps, stable ordering and
   bounded selection hold for multiple saved patrols.
6. Accepted resume-command boundaries survive save/reload and recorded replay
   with exact events/hash. Test the arrived-waypoint corner separately if chosen.
7. Retained campaign diagnostics distinguish active/paused route residence,
   visible threat, owned endpoints and eligible recovery counts. Re-run the
   unchanged headline pacing seed/profile and report outcomes without altering
   costs or proxy bounds. A successful authored recovery is not itself proof of
   a resolved Long pacing regression or completed DH-021.

Review used the repository core, simulation and AI skills. No tests were run for
this documentation-only assessment; the implementation owner retains regression,
full integration and pacing responsibility.

## Independent implementation review

Reviewed the parent's `patrol-recovery.ts` and its integration in `patrols.ts`.
No blocking source defect found. Reviewed SHA256 values:

- `packages/ai/src/patrol-recovery.ts`:
  `45d993c8cd8be96acb6f46729e6c8f38b224383871b640eb5b1f268e34ff17ff`
- `packages/ai/src/patrols.ts`:
  `2e54a0c8fc03160c891eb475095956099eb5c9e568e546cd3569de652179f82d`

The implementation checks enabled/waiting state, own combat land identity,
transport, movement capability, actual route status and sole target, owned
endpoint hearths, postings, sieges and character missions. It additionally
requires positive movement and a currently supplied army, conservatively leaving
exhausted/unsupplied cases for later review. It does not check `commandBlocker`:
inspection of `armyCommandStatus` shows that field reports reduced movement for
over-capacity armies, rather than a prohibition on ordinary travel. Respecting
the canonical movement preview here is appropriate; the earlier candidate's
blanket command-blocker veto is unnecessary.

Hostile observed armies and settlements are indexed by cell. The local rectangle
covers the hex sight disk, and exact hex distance rejects points outside it.
Foreign armies/settlements in the canonical observation are currently visible;
the index introduces no remembered-ownership or hidden-state shortcut. Work is
one pass over observed collections, plus a patrol scan with local sight-area
checks; route previews remain capped at four. The separate four-command cap also
applies to already-arrived legs that need no preview. Stable sorted records and
the turn-based four-record rotation preserve deterministic selection and cover
the full roster over time.

The recovery function sorts a filtered copy and writes only newly allocated
maps, sets, result arrays and commands. It does not mutate the observation or
saved policy. `planPatrol` retains its original held-army set when merging the
recovery result. The full planner passes those held IDs through the character,
naval, survey and depot planners, and excludes them from generic movement and
merging. Pending supply-access planning already excludes armies with routes, so
it does not compete for these paused-route actors before patrol review.

The arrived-leg branch emits only public `resumeMovement`; canonical resume
owns exhausted-waypoint cleanup. No cancellation or replacement route command
is invented. Current worker seat boundaries remain unchanged: human-seat end
turns do not invoke this branch, while explicit AI-watch control may review an
identical manually issued leg. Source comments accurately disclose the missing
route provenance.

The parent's [generated regression before implementation](generated-before.log)
records one failed recovery assertion and one passing player-route assertion.
The [post-change run](generated-after.log) passes eleven tests across its two
selected files; the later [focused run](recovery-focused.log) passes eight tests
in the recovery file. These are parent-run logs read during this review, not
independently re-executed tests. Authored tests cover real interruption/peace,
save and replay parity, overrides, refusal budgets, roster rotation, immutable
views, and hidden-force independence. The generated test checks the sealed
turn58 witness, executes its complete ordinary AI plan, and verifies replay and
unchanged patrol configuration.

Two initial test-strength limitations were reported and are now closed by the
reviewed test changes. The complete-plan actor assertion now includes merge
source/target IDs and commands addressing characters attached to the held army,
as well as ordinary `armyId` commands. This improves its assertion coverage; it
does not claim every possible competing operation is present in that fixture.

The new arrived-leg case uses canonical `relocateArmy` and `reconcileMovement`
helpers to author displacement to the saved endpoint, validates exact save/load,
then starts a fresh from-save journal. The planner emits one ordinary resume with
zero route previews. That accepted command emits canonical movement cancellation,
removes only the exhausted route, leaves the army and patrol records unchanged,
and reproduces the resulting hash through exact recorded replay and final
save/load. This proves the cleanup boundary on an explicitly authored displaced
state, not a played tactical battle. The separate synthetic roster case still
proves the independent four-command cap. The reviewed
[final focused run](recovery-focused-final.log) passes all nine tests in this file;
it was run by the implementation team, not independently re-executed here.

The newer [diagnostic findings](diagnosis-findings.md) now establish a real
generated safe-recovery witness and a protected endpoint-loss/threat
counterexample. They do not establish that the entire Long pacing difference
comes from patrol stalls. This source verdict accepts the narrow recovery policy;
campaign performance, additional seed comparisons and broader release acceptance
remain the parent's separate evidence gates.
