---
name: theandril-simulation
description: Use when modifying deterministic game rules, turns, commands, canonical state, economy, settlement rules, diplomacy effects, progression, visibility, saves, replay, or simulation performance.
---

# Deterministic Simulation

## Invariants

- No DOM, React, Pixi, browser storage, or network dependency in core simulation.
- No `Math.random()` in gameplay.
- No wall-clock time in gameplay outcomes.
- Stable iteration order.
- Stable command ordering.
- Explicit RNG substreams.
- Save schema versioned.
- State hash reproducible.

## Workflow

1. Identify the authoritative state and command involved.
2. Add/modify validation.
3. Add deterministic rule implementation.
4. Emit meaningful domain events.
5. Update dirty sets/read-model invalidation.
6. Add unit tests.
7. Add property tests for invariants when useful.
8. Add replay/hash fixture for high-impact rules.
9. Benchmark if the change touches a collection that scales with tiles/factions/armies.

## Scale rules

Do not perform repeated full-world scans if a dirty set, index, aggregate, or chunk can answer the question.

Prefer normalized stores and typed arrays for large regular world data.

Keep calculations incremental:
- settlement yields update when dependencies change;
- region aggregates update from local deltas;
- diplomatic relation summaries update from events;
- visibility updates from moved/changed sources.

## Save changes

When canonical state changes:
- bump/migrate schema if needed;
- test old-to-new migration;
- test save/load equality;
- test state hash after replay.

Never silently discard an unknown state field.

