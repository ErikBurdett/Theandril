---
name: theandril-combat
description: Use when changing strategic warfare, armies, unit stats, tactical formation battles, autoresolve, sieges, morale, supply, retreat, pursuit, commanders, or battle UI.
---

# Theandril Combat

Combat should be fast to resolve at strategic scale and still reward preparation, composition, terrain, deployment, and timing.

## One rules engine

Tactical intervention and autoresolve use the same deterministic combat rules.

Autoresolve uses AI tactical decisions at accelerated speed; it is not an unrelated estimate formula.

## Battle model

Current campaigns use battle rules 10 with up to 20 formations per side in five
deployment columns and four ranks. Each surviving land soldier has a canonical
member identity; a naval formation represents one hull with strength as durability.
Passengers are not fighting participants. Forward/lateral position and cohesion
are canonical too, and orders change them through the shared round kernel.

Campaign and battle versions differ. Campaign 17 still selects battle 10; preserve
explicit campaign-16 execution and frozen tactical versions 5–9, including the
earlier three-rank/twelve-formation limit before battle 8. Do not regenerate old
battles or insert individual state into them. Read `docs/architecture/0037-campaign-safety.md`
for current morale and whole-army frontage boundaries.

`combat/individual.ts` emits actual source, target and killed soldier identities.
Spell and pursuit losses must reconcile the same members, including a destroyed
hull's single identity. Rendering must consume these facts; animation speed and
skipped playback cannot choose attacks or casualties. A braced stationary line must
remain reachable by an advancing line; test the maximum approach distance.

Keep company training and faction doctrine snapshots at deployment. Completed
reports validate their prerequisite graphs and stats without looking up a later
transferred, promoted or removed company. Validate member slots against actual
entering strength, not the unit's maximum possible strength. Clone member arrays,
positions and development snapshot arrays in both scene and observation selectors.

## Important variables

- formation strength;
- attack profile;
- armor/resistance;
- morale;
- discipline/cohesion;
- initiative;
- fatigue;
- terrain;
- commander;
- abilities;
- support;
- ranged pressure;
- flank/exposure;
- retreat route.

## Campaign boundary invariants

Remove the training bonus actually granted at deployment from persistent survivor
morale, accounting for the tactical cap and using the battle snapshot rather than
a later company build. Subtracting the uncapped nominal bonus invents morale loss
when a trained company entered at the tactical maximum. Test immediate aftermath and repeated
same-turn fights: an end-turn refresh can hide an unloadable intermediate state.
Retain old-rule hashes separately from current safe continuation.

Do not equate a tactical participant limit with strategic stack immunity. Current
whole-army contingents leave reserves untouched on the map; do not award their
experience, change their officers/cargo, advance through them or offer a settlement
capture until they are defeated. UI and AI consume the canonical frontage preview.
Test 20/21/larger field, garrison and naval cases, including a saved pending battle.

## Strategic consequences

After battle update:
- casualties;
- experience;
- morale;
- fatigue;
- supply;
- commander wounds/traits where relevant;
- prisoners;
- retreat position;
- pursuit losses;
- war score/support/grievances;
- settlement siege state if involved.

## UX

Routine battle:
- clear preview;
- one-click autoresolve.

Important battle:
- deployment;
- limited meaningful orders;
- fast rounds;
- readable report.

Do not make tactical battles mandatory for every skirmish.

## Tests

Use deterministic fixtures for:
- melee line;
- ranged advantage;
- cavalry flank;
- terrain;
- morale collapse;
- retreat;
- pursuit;
- reinforcement;
- siege assault;
- autoresolve parity.

`combat/individual.test.ts` and `individual-campaign.test.ts` cover battle-10
identity/death conservation, ward/fire/pursuit, pike versus charge, flank support,
range, paid caster actions, embarked passengers, detached observations and saved
continuation. Compare exact kernel hashes and campaign combat/aftermath/progress.
Manual round commands retain their intermediate campaign journal events, so their
whole campaign hash need not equal a single autoresolve command's hash. Replay
each command path exactly and retain genuine pre-change archive fixtures.
