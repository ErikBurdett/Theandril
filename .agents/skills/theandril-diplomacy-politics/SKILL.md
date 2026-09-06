---
name: theandril-diplomacy-politics
description: Use when building diplomacy, negotiations, treaties, war/peace, grievances, vassalage, influence, internal politics, succession, loyalty, rebellions, or diplomatic AI.
---

# Diplomacy & Politics

Diplomacy must alter actual game rules rather than only relation numbers.

## Relationship model

Keep distinct dimensions internally:
- trust;
- fear;
- respect;
- affinity;
- grievances;
- border tension;
- strategic dependence;
- promises kept/broken.

Expose understandable summaries to players.

## Treaty system

Represent treaties as data-driven clauses with:
- parties;
- duration;
- activation;
- obligations;
- rule hooks;
- breach conditions;
- termination;
- AI valuation.

Examples:
- access;
- trade;
- non-aggression;
- alliance;
- guarantee;
- vassalage;
- tribute;
- resource transfer;
- joint war;
- intelligence sharing.

## Negotiation

AI evaluates complete packages, not each clause in isolation.

Player UI should provide:
- likely outcome band;
- top acceptance reasons;
- top objections;
- red lines.

Do not expose exact hidden utility weights.

## War

Support:
- formal war state;
- war goals/claims;
- war exhaustion/support;
- occupation;
- reparations;
- settlement changes;
- peace package.

## Internal politics

Keep scope strategic:
- legitimacy;
- office-holders;
- loyalty;
- unrest;
- succession;
- rebellion/secession.

Do not grow an unbounded life-sim unless directly requested.

## Tests

Treaties must survive save/load and affect simulation rules in tests.

