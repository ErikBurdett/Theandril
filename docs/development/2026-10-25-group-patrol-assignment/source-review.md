# Independent source review — grouped patrol assignment

Reviewed 2026-10-25 against the uncommitted Round 2 source following Round 1
commit `6c77de4`. This was a read-only code/test review; no tests or builds were
run by this reviewer. Passing runtime results must come from the integrating
round's evidence.

## Result

No blocking source defect found in the inspected assignment path.

- `group-patrols.tsx` composes ordinary `setPatrol` commands from current observed
  owned land armies ashore, with a maximum complete selection of 128. It does
  not silently truncate an oversized selection. Existing enabled/paused values
  come from each actor's observed policy; new policies default to enabled.
- Every assignment shares first point, second point and war option, while the
  enabled value may differ per army. `simulation.worker.ts` checks precisely
  those shared constraints and retains stable actor-ID ordering. The widened
  protocol union preserves the existing pause/resume/remove request path.
- The existing current-hash check remains before `applyPatrolCommands`.
  Envelope parsing is complete before mutation. Missing/stale hashes, sparse or
  oversized arrays, duplicate actors, mixed actions, mixed faction seats and
  inconsistent points/options cannot apply a valid prefix.
- Combat eligibility, caravans, explored terrain, policy capacity and ownership
  remain canonical simulation decisions. Legal-shaped orders can be refused
  individually; later valid actors still execute. The existing response ledger
  correlates all sorted actor rows, and only accepted actors leave selection.
- Pending/in-flight guards, shared roster locking and the current observation
  hash remain on the assignment path. Existing result uncertainty and recorder
  failure handling are reused. No new canonical rule or save format is present.

## Player-facing consequences

The assignment form starts with empty endpoints and cannot submit until they
are distinct in-world integers. Labels disclose outside-filter selection,
combat-army requirements, shared endpoints, replacement of the war option,
creation enabled versus preservation of existing pauses, resetting the next
point, and existing travel/posting priority. It also explains that enabled war
policies pause on the next turn during an existing war; they do not stop current
travel. The consequences match `packages/sim/src/patrols.ts`.

## Verification coverage inspected

`worker-group-patrol-assignment.test.ts` exercises mixed enabled values,
ordinary missing-army/caravan refusals, a real intervening command followed by a
stale hash, malformed/shared-field envelopes, unexplored/equal endpoint
refusals, policy capacity/replacement, recorder failure, autosave restoration
and exact replay. The UI helper tests also cover owned-land-ashore filtering,
oversized selections, immutable input views and preserved existing routes and
postings.

`tests/production/group-patrol-assignment.spec.ts` drives the real production
UI and worker for 101 selected actors, including 51 outside the visible filter.
It derives the expected state through ordinary recorded commands, compares
exact exported state/archive and replay, and checks 50 paused policies plus
unchanged armies/routes/postings. It exercises a second assignment through
keyboard activation at 390px and 130% text, then restores the earlier manual
save exactly. No production debug API or fabricated success response is used.

The production journey is authored scale evidence, not organic giant-campaign
or pacing evidence. Its assignment batches all succeed. Mixed-refusal behavior
is verified in worker/helper tests and uses the existing accepted-only selection
handler, but a new assignment-specific browser refusal journey would strengthen
coverage of refused checkbox retention. The current journey also does not
exercise the owned-hearth shortcut selectors or an actual future patrol turn;
it verifies policy assignment and preservation, not downstream pathfinding.
These are coverage limits rather than source blockers for this bounded reuse
of existing patrol rules.
