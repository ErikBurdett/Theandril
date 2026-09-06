# Deterministic campaign simulation

This package owns canonical game state. UI, AI and storage clients issue commands
or consume detached observations; they must not mutate `GameState`.

`createGame({seed,size,factionCount})` creates a seeded world and one caravan plus
one scout per faction. Counts above the four authored introductory factions use
stable suffixed runtime IDs referencing those definitions; these are stress
actors, not additional authored content.

`applyCommand(state, unknown)` validates strict input and ownership before changing
state. Commands include `found`, `move`, `queue`, `endTurn`, `declareWar`, `attack`,
`battleOrder`, `autoResolveBattle`, `besiege`, `liftSiege`, `assault`,
`resolveCapture`, `proposePeace`, and `respondPeace`, each with a faction ID.
All factions may submit planning commands for their own entities. Only the
campaign's `turnOwnerId` can resolve the turn. Authenticating which faction a
client controls belongs to the worker/server command adapter.

The current end-turn phases are:

1. Siege reconciliation and defense/supply attrition over active siege records.
2. Settlement yields, production, growth and occupation recovery, sorted by stable ID.
3. Faction upkeep; shortages reduce next-turn army movement by one.
4. Movement refresh and morale/fatigue recovery.
5. Advance the turn, expire diplomatic offers/treaties, and emit next-turn events.

An optional `PhaseObserver` receives phase start/end markers. Its host can measure
elapsed time; timing never enters game rules. Observer failures are returned in
`CommandResult.diagnostics` and cannot interrupt turn resolution.

World terrain and fertility use typed arrays. Army occupancy and settlement
positions have derived indexes; current sight uses reference counts per cell.
Moving/founding/recruiting updates bounded local sight disks. Explored cells
remain canonical after sight is lost. Turns visit entities rather than global
world cells. Observations currently enumerate the requesting faction's explored
cells; future late-campaign AI should consume narrower local tasks.

`serializeGame` emits canonical v3 JSON with content and snapshot checksums.
`deserializeGame` first parses unknown input with strict Zod schemas, verifies
checksums, and validates references, resource ranges, position/queue invariants,
entity counters and fog consistency before constructing state. Unknown fields
fail rather than disappear. The v1 migration accepts only the known foundation
content hash `7baddaff`, verifies its original snapshot checksum, and adds empty
warfare state plus initial army morale/fatigue. A synthetic pre-release v0 fixture
tests the earlier `nextEntityId` to `nextId` step before v1-to-v2 migration; no
historical released format is claimed. Checked v2 snapshots using content hash
`4dec81ae` migrate settlement founders/recovery, empty siege/capture/ruin state,
and diplomatic memory for their existing wars. Pending field battles continue
with unchanged combat streams. Current schemas never silently fill missing fields.

`stateHash` and `replayGame` use the same serialization and command boundary.
Checksums detect accidental corruption and deterministic divergence; they are
not cryptographic authentication for multiplayer clients.

Field combat requires declared war and a visible adjacent target. One attacking
army engages every army on the defending cell, up to twelve. A pending battle
pauses strategic commands. The human controls their side even when defending an
AI attack; battles between AI factions are controlled by the attacker. Tactical
orders and autoresolve call the same formation engine. Casualties, morale and
fatigue persist; losing or routed armies retreat deterministically to legal land,
or are destroyed if trapped. A winning attacker advances when the target cell has
no hostile army or settlement. Mutual withdrawal retreats both sides. Reports
retain entering strengths and actual strategic aftermath, including trapped
survivor losses, with a bounded twenty-report history.

Sieges require a visible adjacent hostile town and consume the army's movement.
An army must lift its siege before moving. A blockade sets food yield to zero and
halves industry, coin and knowledge. Starting defenses 30 and supplies 3 fall by
10 and 1 per turn. Exhausted supplies reduce militia morale. Assaults use the same
formation engine: every stationed defender participates (up to twelve), or local
militia defend an empty town. Fortification adds 0–3 armor to the defenders.
Militia state persists during the active siege; permanent demobilized garrison
history is not modeled. Defeated/retreating besiegers and accepted peace lift the
blockade. No alternative siege outcome formula bypasses tactical combat.

Victorious assaults pause for an authorized capture choice. Occupation preserves
population/buildings with 20 devastation and 3 occupation turns. Sacking transfers
bounded treasury loot, removes population/buildings, clears food, adds 60
devastation and 5 occupation turns. Razing leaves an original-provenance ruin that
normal caravan founding can resettle. Liberation requires a distinct original
founder and returns the town with 10 devastation and 1 recovery turn. Existing
production orders are cancelled. Devastation reduces yields and recovers by five
points per unbesieged turn; occupation halves the remaining yields. Capture
choices expose exact authoritative consequences and remain saved pending decisions.

Peace offers last three turns, support one-direction coin transfers, and establish
binding 5–30 turn treaties when accepted. Payments revalidate at acceptance and
settlement ownership stays unchanged. Diplomatic trust, respect and grievances
persist, including conquest effects. Only participating factions receive private
offers, battle records and capture options; ruins appear only in current sight.

Pending battles, sieges, capture decisions, ruins, diplomacy and reports survive saves and replay.
Observations expose tactical details and histories only to the participants.
Current gameplay still has adjacent land movement, radial visibility, founding,
four building definitions, three unit definitions, and food/industry/coin/knowledge.
Client/vassal capture outcomes, permanent garrison units, advanced siege equipment,
naval blockade, attacking formations assembled from multiple strategic armies,
progression and the broader military systems remain release work, tracked in
`docs/IMPLEMENTATION_STATUS.md`.
