# Formation combat kernel

This module is ready for campaign integration. It does not register commands, modify
strategic armies, or expose a player interface by itself.

`createBattle` accepts the seed, terrain ID, and 1–12 formations on each side. Each
formation occupies a unique slot in a five-column, three-rank deployment grid.
Formation IDs are unique across the whole battle. Arrays are normalized by ID.
Malformed stats, unknown fields, duplicate slots/IDs, and dead starting formations
are rejected. Unit definitions must be resolved by the campaign before supplying
combat stats; this reusable kernel does not invent stats from unit IDs.

`resolveBattleRound(state, { attacker, defender })` accepts advance, brace, flank,
and withdraw orders. It returns a detached state and resolves in fatigue-adjusted
initiative order, breaking ties by stable formation ID. Deployment ranks and
columns affect engagement distance; ranged troops can attack over their front line.
Advance closes distance over successive rounds. Brace trades damage for protection
and lower fatigue cost. Flank adds damage and morale pressure while increasing
fatigue and exposure. Hills/mountains protect defenders, while woodland protects
both sides and reduces ranged damage.

Casualties reduce strength and morale. Routed formations retain survivors but stop
attacking; their rout damages nearby allied morale at the battlefield abstraction.
Ordered withdrawal and morale collapse apply pursuit losses, limited by the winning
force's strength, initiative, and terrain cover. Surviving retreaters remain in the
battle arrays for strategic aftermath processing. Retreat hexes, supply, experience,
commanders, capture, siege, magic, reinforcements, and naval treatment are not yet
implemented here.

`chooseBattleOrder` supplies a bounded tactical policy. `autoResolveBattle` repeatedly
uses those orders with the exact same round function. Battles resolve within twelve
rounds; a close stalemate draws, otherwise remaining strength and morale determine
which force gives ground. Logs retain at most 256 entries.

`battleStateSchema` validates and clones the complete saveable state. `seed` remains
the initial seed; `rngState` stores the current independent integer random stream.
Round zero is deployment. Save and replay integration must retain `rngState`, round,
all formation fields, result, and log. No wall clock or external state affects rules.

Tests cover terrain, engagement ranks/range, initiative, fatigue, orders, morale,
pursuit, finite rounds, validation, independent buffers, stable ordering, exact
autoresolve/manual-order parity, JSON continuation, and varied bounded formations.
