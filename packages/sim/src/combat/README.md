# Combat kernel

Campaign warfare calls this deterministic kernel for manual battle orders and
autoresolve. `createBattle` receives resolved unit stats, a seed, terrain and
formations; the campaign owns strategic movement, officers, resources, capture and
aftermath. The optional battle version must be passed consistently to creation,
round resolution and autoresolve.

Battle rules 10 (campaign rules 16) use five deployment columns and four ranks,
with up to 20 formations per side. Land formations contain one stable member slot
for each actual entering soldier. Casualties remove those identities; surviving
members, forward/lateral position and cohesion are canonical saved state. A naval
formation has one visible hull; its strength is durability, not a row of ships.
Embarked armies are excluded from the combat roster and handled by naval aftermath.

`resolveBattleRound` validates and clones its input. Formation activations use
fatigue-adjusted initiative with stable identity tie breaking. Advance closes the
gap; brace restores cohesion and protects a stationary line; flank trades cohesion
and fatigue for lateral pressure against an unsupported target. Missile troops can
engage before infantry. Mounted charges are checked by pike screens, neighboring
formations provide support, and an arbalester's attack reduces the armor it faces.
Terrain provides protection. Each individual hit attempt and victim selection uses
the battle's saved random stream. Wards absorb hits before any member is removed.

Orders can end in annihilation, a morale rout, ordered withdrawal or the twelve-round
limit. Pursuit removes additional survivors while respecting wards and available
pursuing strength. The campaign reconciles casualties, retreats, transports and
officers before awarding fighting-company experience. A winning survivor gains
three experience; another surviving participant gains one. Company training can
provide opening battle morale, but it does not heal casualties or increase Rally's
ordinary restoration ceiling.

`chooseBattleOrder` is the bounded battlefield policy used by `autoResolveBattle`.
Manual rounds using those choices produce the same combat state as autoresolve,
including member identities, position, cohesion, casualties and RNG. Campaign
reports, armies and earned development also agree. Manual commands retain their
intermediate campaign `battle_round` events, so the complete campaign journal and
state hash can differ from a single autoresolve command; each command path replays
exactly. Logs are bounded to 256 entries and presentation facts to 4,096 per command.

`presentation.ts` defines detached scene snapshots and authoritative facts.
`individual.ts` supplies actual participating and killed identities; spell and
pursuit losses reconcile that same membership. Animation does not choose targets,
change casualties or advance simulation. Both scene and observation projections
must clone members, positions and frozen development arrays. Saved member slots
are validated against the formation's entering strength; completed development
snapshots retain their deployment prerequisites, weapon compatibility and policy.

Frozen battle versions 5–9 keep their original formulas, serialized fields and RNG
behavior. Versions before 8 retain twelve formations and three ranks; 8 adds the
larger deployment grid; 9 adds finite abilities and wards. Individual member,
position, cohesion and development fields belong only to battle 10. Genuine older
campaign snapshots and archives test exact bytes, hashes and replay continuation.

`combat.test.ts` covers the historical kernel. `individual.test.ts` covers current
frontage, approach, range, support, identities, wards, pursuit and exact kernel
continuation. `../individual-campaign.test.ts` exercises paid caster abilities,
campaign save/load, detached observations, naval passengers and modern report
validation. `../development.test.ts` verifies paid training and actual experience.
