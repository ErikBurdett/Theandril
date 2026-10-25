# Pre-recovery Long patrol findings

The ordinary campaign contains a reproducible AI recovery gap: an enabled home
patrol can remain reserved after its ordinary travel pauses, even after peace
removes the threat and an ordinary resume safely completes the selected leg.
This is a concrete local defect, not proof that it caused the entire Long
campaign's 24-turn change from rules34.

## Instrumentation equivalence

The parent ran the diagnostic sequentially after its additional baseline matrix.
The diagnostic's [summary](diagnosis-long/summary.json) matches the original
rules35 Long entry in [pacing-final.json](../2026-10-24-patrols/pacing-final.json):

| Field | Original and diagnostic |
| --- | --- |
| Final turn/hash | 335 / `c6b55ec6` |
| Winner/path | Saltwind Remnant / prosperity |
| Submitted/automatic refusals | 0 / 0 |
| Patrol route attempts/refusals | 521 / 0 |
| Complete command-count dictionaries | Exact equality |
| Complete event-count dictionaries | Exact equality |

[Machine-readable comparison](diagnosis-equivalence.json) retains both input
SHA256 values and every field comparison. The diagnostic executed 32,817 commands
and retained 4,048 plans, 1,832 patrol rows and 1,562 readiness rows. Its ordered
command/result SHA256 is
`919bb5219f117a6335e7d0ccecb06f9519a1b79e7ce5fbb14b589c618d0dc20f`.
The original pacing artifact lacks an ordered trace seal, so exact trace-order
equality cannot independently be asserted from that artifact. Final-state and
complete count equivalence are established, rather than assumed.

## Safe recovery witness

Mire Courts adopted `army.198` at turn32, between owned hearth cells10368 and10149.
Its route first appears paused at the turn50 owner observation, at cell10146,
after sighting Morrow Spore `army.24` within its sight. At turn58:

- The patrol remains enabled, with `pauseOnWar:false`, target10368 and last
  allocation attempt50. Both endpoint hearths remain owned.
- Its route is paused for the original hostile-sighting reason; its only
  waypoint is exactly10368. The army is not already at its target.
- The realm is at peace, no hostile combat armies are observed near the army or
  endpoints, and its movement blocker is null. It has six movement points and
  is supplied from Hearth1 (`settlement.31`).
- The public movement preview is a normal move, queueable and immediately
  movable, with no blocker: path10145→10144→10368, cost3, six expanded nodes.
- The ordinary delegation helper still holds the army. Actual plan691 contains
  nineteen proposals but no actor command for it. The full retained proposal
  stream has no actor command for this army from turn50 onward.

[Snapshot1](diagnosis-long/snapshot-1-turn-58.json) has canonical hash `17c538ce`
and raw SHA256
`c1c28ea92aca0919f084da92e4627984ec710924b27d98d7a4775dcd7eb55ca8`.
Snapshot2 is deliberately retained as the same bytes: the first eight-turn pause
and first eight-turn pause during peace trigger at the same observation. These
are two trigger records, not two independent campaign witnesses.

An isolated ordinary-command branch of snapshot1 applies
`resumeMovement(faction.mire_courts, army.198)`. It succeeds, emits three ordinary
movement events and completion, reaches10368, spends three movement points and
removes the completed route. The patrol configuration remains exactly unchanged.
Independent reloads produce equal command results; the resulting state reloads
at hash `2b810730`. [Branch evidence](diagnosis-resume-witness.json) is explicitly
separate from the measured campaign: no command was injected into its retained
run and no runtime source was edited for this witness.

The same pre-recovery company remains paused at sampled turn334: **284 elapsed
turns** from the first paused observation, with both endpoints still owned.
The last changed/heartbeat row is turn332; the summary's turn334 sample updates
the duration without emitting a redundant row. All eleven adopted companies
reach at least105 elapsed sampled paused-route turns during this campaign.
Several are later lost or change context; this does not make every such pause
safe to resume. Repeated sampled cells alone are not used as proof of no travel.

## A counterexample that must remain protected

[Snapshot3, turn180](diagnosis-long/snapshot-3-turn-180.json), hash `138d1320`,
contains Reedbound Council `army.278`. Its single waypoint matches its target
and the target preview is a permitted move, but its other endpoint18758 has
fallen to Ashen Compact. Three observed hostile combat armies are within the
patrol army's sight. This is **not** the conservative recovery witness. A
queueable preview alone cannot establish that resuming this home circuit is
appropriate. Endpoint ownership and immediate observed threats matter.

## Winner readiness and limits on causal conclusions

Saltwind Remnant's own patrol `army.208` was adopted at turn33. Its route first
appears paused at turn120, with a visible Sable Steppe scout one hex away. At
turn129 its sampled context is at peace, both endpoints are owned, and no nearby
hostile combat armies are observed. It remains held with no actor command from
turn120 onward and reaches214 elapsed sampled paused-route turns by turn334.
There is no saved turn129 state for an independent resume branch; snapshot1 is
the fully reproduced safe witness.

The winner's observed readiness timeline is distinct from that patrol history:

| Turn | Observed milestone |
| --- | --- |
| 51 | Required developed-hearth blocker clears; Civic accounts and coin remain |
| 77 | Civic accounts is present; only the32,000-coin requirement remains |
| 293 | Treasury32,023; all project blockers clear and eight hosts are eligible |
| 294 | Treasury32,209; all blockers clear and seven hosts are eligible |
| 295 | Treasury32,375; ordinary AI starts Hearth Exchange at settlement55 |
| 335 | Project completes40/40; prosperity victory |

The ordinary plans at293 and294 each return only a peace proposal, to Sepulchral
Synod and Wardhall Remnant respectively, with an offered40coin. The planner then
starts the project at295. This explains those two observed planning passes;
it is not attributed to the patrol gap. The final project record shows no
remaining pause and exactly40 progress after its40-turn interval. The large
pre-start interval is predominantly a funding wait after the other prerequisites
clear, but this diagnostic does not isolate which prior military/economic choices
caused that funding trajectory.

The next change can therefore target the proved stale-route recovery case using
ordinary resume commands, retaining configured patrols and their held-army
reservation. Its campaign effects still require the parent's unchanged baseline
comparison, additional seeds, exact historical readback and normal acceptance
checks. No prices, route-search budgets or proxy bounds should be adjusted to
manufacture a favorable timing result.
