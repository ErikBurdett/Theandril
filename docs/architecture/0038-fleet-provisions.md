# Fleet provisions and observed naval staging

Rules/save 31 closes the fleet supply exemption in DHARMA ACT-35. Canonical
authority stays in `packages/sim`; the UI and AI consume `Observation.supply` and
issue existing movement, transport and production commands.

## Stores and turn boundaries

An optional `Army.provisions` integer records zero through eight turns aboard a
fleet. An absent value means eight: new hulls begin provisioned, and old campaigns
upgrade without altering their historical bytes. Land armies cannot carry this
field. All fleets consume stores, including single ships and landless realms.

Supply resolves before queued travel. A fleet standing in its realm's existing
harbour supply refills to eight. Outside supply, a positive store loses one turn;
that last ration feeds the fleet for this resolution. A fleet already at zero
loses four strength per formation, down to the existing one-fifth floor, and gets
the existing reduced morale/fatigue recovery. Damage below that floor is never
healed by attrition. Crossing a supplied cell does not refill stores: the fleet
must stand in supply when the supply phase resolves.

Passengers draw on their carrier's outcome without consuming a second ration.
Carriers resolve first, so sorting a passenger before its carrier cannot make it
starve one turn early. Passenger formations share attrition when stores are
empty, including caravans that otherwise forage on land. Attrition does not
destroy formations, so it cannot silently remove transport capacity or cargo.

Splitting copies endurance to the detached fleet. A merge or partial transfer
uses the shorter endurance for the receiver; reorganization cannot refresh an
exhausted fleet. This is a conservative endurance abstraction, not a count of
food units: merging a fresh ship into a depleted fleet does not extend its range.
Material supply prices remain separate unfinished M4 work.

## Observation and planning

`Army.provisions` is omitted from every public army roster. Only the observing
realm's supply entries expose `fleetProvisions` with remaining turns, capacity
and whether the current position can refill. Passengers receive their own entry
describing the carrier. Existing empty-supply attention includes exhausted
fleets; the selected-force panel shows the current stores and return guidance.

Naval planning uses observed supplied water, hull capability and the same public
movement quotes as human travel. Return planning shares the existing eight-query
budget with expeditions. Visibility-limited steps inform the return estimate;
the planner holds on return to refill, completes an immediately legal landing,
and can pay for a harbour at a real coastal foothold near a depleted fleet.
No speculative undiscovered port or AI-only replenishment exists.

## Persistence and cost

The save schema accepts stores only on naval armies. Frozen schemas through30
remain strict; historical export, hashes and command execution reject populated
stores. Six independent version30 checkpoints and their command archives were
captured before changing defaults. Old replay retains unlimited fleet supply;
modern continuation acquires finite stores at the first contemporary supply
phase. The content seal and pace prices are unchanged.

The supply query still searches outward from bounded hearth/depot reach, not the
whole world per fleet. Fleet processing adds a linear pass over each realm's
armies and no additional supply search per passenger. Naval return candidates
are selected from observed supplied water with bounded route previews. The
retained benchmark distinguishes supply resolution, observation construction
and naval planning; none of those measures certifies renderer performance or
an entire release gate.
