# A voyage needs stores for the way home

## Identity

- Stable entry slug: `fleet-provisions`.
- Publication state: **draft; not published**.
- Local base: `303434733f09dee86a4f46c65c34f5aa2af35152`; implementation is an
  uncommitted working-tree candidate, identified by the evidence source manifest.
- Campaign/save version: **31**. Content: **`015468d1`**, unchanged pace prices.
- Existing work: DHARMA **ACT-35**, within **M4 / ACT-33**.

## The player's problem

A harbour could feed nearby water, but a fleet never needed that food. It could
stay across an ocean forever with its passengers. The first attempt to give
fleets provisions also exposed a planning failure: AI ships sailed away without
allowing for their return, and the headline Epic campaign slipped beyond its
target duration.

## The playable change

A fleet now carries eight turns of stores outside its realm's supply. The last
ration still feeds everyone aboard. After that, hulls and passengers lose
strength and recover slowly until the fleet returns to friendly harbour supply.
The selected-force panel shows the remaining turns and whether the current
position can replenish them. Splitting or merging hulls cannot refill stores.

The AI plans a return using charted, permitted water and the actual movement
quotes. It waits for stores on returning, can finish an immediately safe landing,
and pays for a harbour at an owned coastal foothold near a depleted expedition.
The same commands and costs govern both sides. Review caught and corrected a
coastal galley choosing nearby deep-water supply instead of reachable shallows.

![A saved expedition's remaining stores](../development/2026-09-23-fleet-provisions/screenshots/fleet-provisions-saved-voyage.png)

**Authored browser scenario:** an imported expedition moves through the normal
controls and saves offshore with two turns of stores. This is a regression
fixture with funded ships and an explicit starting store count, not an earned
AI invasion.

![Passengers share an exhausted fleet's stores](../development/2026-09-23-fleet-provisions/screenshots/fleet-provisions-exhausted-narrow.png)

**Same scenario at 390 pixels:** after the last ration, a further end turn costs
four strength to each hull and passenger formation. The journey then sails into
harbour reach, replenishes stores and saves again. These are original inspected
Playwright captures, with no generated pixels or image transformations.

## Engineering and evidence

The simulation owns endurance, attrition, recovery and reorganization. The UI
receives only its realm's supply read model; foreign stores remain private. A
separate carrier pass prevents passenger ID ordering from changing when the
last ration runs out. The existing supply phase precedes queued movement, so a
queued arrival refills on the following supply phase.

Six genuine rules30 saves and archives were captured before changing defaults.
Their original bytes, hashes and command replay remain exact. A modern
continuation acquires stores without rewriting old records, and the mixed
history survives local storage and compressed export/import. Frozen envelopes
reject the new state instead of silently dropping it.

See the [verification and performance record](../development/2026-09-23-fleet-provisions/README.md),
[independent review](../development/2026-09-23-fleet-provisions/code-review.md),
and [architecture decision](../architecture/0038-fleet-provisions.md).
Pacing evidence distinguishes the twelve-realm headline campaigns from tiny
proxies; benchmark evidence separates authored throughput from generated play.

## Scope ledger and road to 1.0

This implements part of the already accepted supply and sustained naval
operations scope. It adds no new release obligation and makes no scope cut.
It advances Gates B, C, E, F, I and K without completing any whole release gate.

Material supply costs, paid trade routes, taxation, treaty access, escorts,
coordinated reinforcement and broad disrupted-port recovery remain M4 work.
Return planning is bounded and depends on known reachable supply; this change
does not prove every invasion, basin or lost-port recovery case. All fifteen
release gates remain open.

## Publication handoff

The published journal and roadmap retain their historical source pins. Its
`supply-and-trade` item needs the following reviewed update when this candidate
is committed and publication is authorized: mark the item **In progress**, record
land/depot/harbour supply and finite fleet stores with AI staging, and retain
material costs, trade, taxation, treaty access and sustained-operation proof as
remaining work. Add the bounded naval behavior to `military-depth`; do not mark
that system complete. Pin this packet and its actual verification artifacts to
the eventual implementation revision before adding a published catalog entry.

No commit, public dispatch, push, deployment or release signoff is claimed.
