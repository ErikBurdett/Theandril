# 0046 — Threat reinforcement and negotiated supply

Status: implementation under verification, 27 September 2026. Extends existing
M3/ACT-32 delegation and M4/ACT-33 logistics; no release gate closes.

## Threat-responsive defense

Rules 34 adds an optional zero-to-four extra-guard limit to an existing theater.
Zero is the default for migrated policies. Each currently visible wartime combat
land army within three hexes of an owned protected hearth requests one extra
whole army, capped by that limit. Embarked forces, caravans, naval forces,
neutral armies and hidden contacts do not contribute. This is a container count,
not a prediction of battle strength.

`packages/sim/src/theaters.ts` derives desired coverage from the same bounded
read model used by player controls. A saved hold retains the additional target
through one quiet allocation phase. A lower visible count does not renew the
older, higher hold indefinitely. A higher or equal count renews it. Pausing,
disabling reinforcement or removing a protected hearth clears the corresponding
hold; lowering the limit clamps it. Existing routes keep their ordinary lifetime.

The source floor includes active reinforcement demand as well as the standing
minimum. Incoming routes suppress duplicate dispatch but never permit withdrawing
physical guards below that floor. Only explicit idle members can respond. Direct
active/paused routes, postings, sieges, voyages and missions retain priority.
Sixteen attempted routes per theater remains the phase bound, including refusals.

One existing spatial/sight index and a war adjacency set answer radius-three
queries: at most 37 local hexes per protected hearth, plus local occupants and
bounded saved holds. There is no global terrain scan for each army. The existing
coverage phase still indexes the army/posting/siege collections once. Observation
does not mutate the holds or run path searches.

New AI home watches may opt into one extra guard and assign up to three spare
armies when the military can afford that share. The existing two strongest field
armies and scouts remain reserved. Eight route previews across four candidate
hearths remain the adoption bound. Existing watches are not rewritten or refilled.

The grouped attention workflow lists enabled watches with coverage deficits,
unavailable hearths, no assigned armies or latest dispatch refusals. It opens the
specific watch in the registry. Delegated idle members leave the generic movement
queue; their interrupted direct routes, supply shortages and stalled postings
remain actionable.

## Paid supply from one named source

The buyer proposes a specific currently observed foreign hearth, a fee of
1–1,000,000 coin and a term of 5–30 turns. The provider accepts or refuses. An offer
expires after three turns. Acceptance rechecks ownership, peace, source service,
funds and treasury capacity before transferring the fee once. Each buyer has at
most eight pending requests and eight active imported sources. Independent IDs
retain their consumed counter after requests or agreements leave the register.

The disclosed source name, location and harbor capability are immutable treaty
facts. A land contract cannot silently gain harbor service after a hidden upgrade.
Either party may end service without a refund. War, ownership loss and expiry
lapse the obligation with bilateral notices; expiry runs before supply resolution.
Every source query also rechecks current eligibility. These agreements grant no
alliance, attack, passage, shared visibility or automatic movement rights.

The existing canonical supply propagation supplies the imported source's normal
land reach and, for a contracted functioning harbor, water reach. Its usual road
costs, terrain, blocking armies, foreign hearths and siege rules continue. Land
forces draw on that line and fleets replenish their eight provision turns there.
There is no parallel trade or supply simulation in AI or the browser.

Actual own-army supply is observable because the realm knows whether its forces
are fed. The map separately shows contracted reach from explored geography,
remembered roads, visible blockers and frozen source facts. Hidden blockades do
not redraw that forecast or reveal their location. The UI explains this distinction.
Source loss may end the bilateral agreement without disclosing the new owner.
Offers and agreements are participant-private. A counterparty receives generic
settlement feasibility, never another treasury's numeric balance.

The public assessment quotes two coin per term-turn, chosen to match the existing
depot's upkeep; this is an explicit initial service price, not pacing calibration.
The same observation-only assessment serves human review and AI consent. AI buys
only for observed needy forces, considers at most two actors and four foreign
sources, and performs at most eight ordinary route previews. Existing nearer or
equally near known supply conservatively vetoes a purchase. One request per fixed
ten-turn faction cadence, no second outgoing request while one is pending, and
held fees bound optional spending. The requesting force is reserved from other
orders for that pass. Active counterparties and pending providers are excluded
from automatic attacks; canonical war and early termination remain available.

## History, transport and acceptance

Rules/save 34 retains content pack `015468d1`. Frozen rules 33 schemas reject new
command fields even when zero. Original checksums are verified before migration.
Older watches receive zero extra guards/empty holds and an empty supply register.
Historical projection cannot discard a nonzero policy, hold, obligation or used
supply identifier counter. Ten genuine pre-change checkpoints and seven exact
continuations are retained under the work packet's `historical/` directory.

Human changes use ordinary commands and filtered observations. Supply term
reviews are tied to the exact draft and campaign hash. Accepted supply mutations
attempt autosave, and uncertain publication requires restoration before further
orders; retry never silently charges the fee again. Strict response validation
rejects malformed or foreign participant records.

The integrated delegation scenario authors 128 owned armies, 30 owned hearths and
two wars on a Huge map. It is a regression workload, not an organically earned
realm. It joins grouped exceptions, policies, paid production prefixes, saved
selections, travel, theaters, direct overrides and saved continuation. The separate
naval fixture uses actual proposals, payments, replenishment and recovery. Neither
fixture establishes complete strategic AI or mature-empire release acceptance.

Evidence, failures, measured costs and remaining work belong in
[the implementation packet](../development/2026-09-27-reinforcement-logistics/README.md).
