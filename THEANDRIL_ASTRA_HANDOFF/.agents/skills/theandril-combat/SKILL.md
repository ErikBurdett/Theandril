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

Default battlefield:
- compact formation grid;
- 5 columns × 3 ranks per side as starting prototype;
- 6–12 formations per typical army;
- terrain slot modifiers;
- commander;
- reserve;
- flanks.

Tune dimensions only if playtests show a clear benefit.

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
