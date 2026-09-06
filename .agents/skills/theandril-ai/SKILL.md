---
name: theandril-ai
description: Use when implementing faction AI, economy AI, diplomacy AI, military theaters, operational planning, tactical battle AI, agent AI, difficulty, automation, or AI performance.
---

# Theandril AI

AI must play through the same public command rules as a human.

## Hierarchy

Plan at separate horizons:
- grand strategy;
- theaters/fronts;
- operations;
- settlement/economy;
- diplomacy;
- progression;
- characters/agents;
- tactical battle.

Do not let a low-level unit heuristic decide national strategy.

## Planning model

Prefer a hybrid:
- utility scoring;
- goal decomposition;
- cached influence maps;
- bounded candidate generation;
- limited lookahead for high-value decisions.

Avoid brute-force search over every possible command.

## Geography

Military AI should reason about:
- theaters;
- fronts;
- chokepoints;
- travel time;
- supply;
- force concentration;
- enemy threat estimates;
- objectives.

Do not assign every army independently from scratch.

## Parallelism

Workers receive immutable observations and deterministic substream seeds.

Workers return ranked plans/proposals.

Canonical sim validates/applies them in stable order.

Worker timing must not change outcomes.

## Debuggability

For major decisions, retain compact debug reasoning:
- chosen goal;
- top alternatives;
- important utility terms;
- rejected red-line constraint.

Show this in development AI inspection tools, not as omniscient player information.

## Testing

Include scenarios for:
- expansion;
- economic recovery;
- defense;
- invasion;
- peace;
- alliance;
- supply-aware retreat;
- naval transport if supported;
- victory pursuit;
- 32-faction stress.

