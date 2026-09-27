# 0045 — Automatic defensive theaters

Status: implemented, published and live-verified, 27 September 2026. Extends M3/ACT-32; no release gate closes.

A defensive theater names protected owned hearths, explicit combat land armies,
a known reserve hex and a floor of one to four army containers per hearth. It
fills coverage gaps and gathers surplus on each campaign turn. This is garrison
distribution, not threat valuation, pursuit, patrol, escorts or invasion planning.

`packages/sim` owns configuration, reports and allocation. Rules/save 33 freezes
rules 32 command and payload projections; seven pre-change rules 32 save/archive
checkpoints include a real 64-seat origin and continued campaign. Older saves
migrate to an independent empty theater register and counter. Neither active
metadata nor consumed identifier history may be silently downgraded.

A realm may retain eight theaters, each with 16 hearths and 128 explicit members.
Membership is exclusive for armies and hearths within a realm. Missing members
are pruned at entity lifecycle boundaries. Captured hearth references remain
unavailable without refreshing enemy locations or names; existing unavailable
hearth references can be removed through an ordinary configuration edit. An
empty member register can be edited and refilled. No captured hearths remaining
under control means no automatic dispatch.

Allocation runs after ordinary travel and standing postings. Every active or
paused route and every posting takes priority. Embarked armies, sieges and
character missions are not commandeered. Earlier theater routes also finish or
wait for explicit intervention, avoiding a second route ownership system.
Pause, delete and detach stop future assignment; ordinary travel remains.
Cancelling travel alone returns a member to delegation next turn.

Coverage counts all eligible own combat land armies, including nonmembers.
Active routes departing elsewhere are not stationed guards; paused armies that
are physically at a hearth still defend it. Incoming means an active route's
final waypoint is the hearth. Incoming promises suppress duplicate dispatch but
never justify withdrawing a physical guard below its hearth's floor. Nonmembers
are never commanded.

One phase index covers physical guards, incoming routes, protected floors,
postings and sieges. Each theater scans its bounded references and attempts at
most 16 ordinary `queueMovement` orders, including failures. Army and destination
rotation gives inaccessible candidates a bounded share of future attempts.
Cheap distance/stable-ID ranking avoids Cartesian path previews. The ordinary
route search retains its 4096-node/256-step bounds and refuses automatic attacks.
Actual latest dispatch results (at most 16), including refusals, are saved and
observed. Read models do not perform path searches or invent route promises.

The AI adopts theaters through the same commands and permitted observations,
reserving delegated members from unrelated military planners. Modern observation
capability gates this policy; historical behavior remains frozen. Adoption considers at most four nearby hearth candidates and eight canonical movement previews, each with the ordinary shared 4,096-node range/target allowance. Existing guards at the reserve need no route. Unreachable candidates are skipped without inventing hidden connectivity. Existing theaters, including paused or empty ones, are never automatically rewritten or refilled. Local headline pacing and representative active allocator measurements are retained in the [implementation evidence](../development/2026-09-27-defense-theaters/README.md); their limits remain open acceptance work.

React sends explicit configuration commands and consumes bounded own theater
reports. Editing a draft or recalling selections issues no order. Full replacement
of membership is explicit, while individual detach is based on observed config.
Shared pending controls prevent overlapping edits. Accepted responses must match
the submitted configuration before acknowledgement; uncertain publication locks
orders for saved-campaign recovery. The worker autosaves accepted theater edits.
