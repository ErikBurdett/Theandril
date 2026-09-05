# AGENTS.md — Theandril Repository Rules

These instructions apply to all coding agents and subagents in this repository.

## Priority

1. Current user instructions.
2. This repository's explicit project instructions.
3. Relevant repository Agent Skills.
4. Framework/library skills.
5. General defaults.

If a skill conflicts with a direct user or repository instruction, follow the higher-priority instruction and note the conflict in the implementation log if material.

## Action policy

For routine development:
- inspect first;
- decide;
- implement;
- verify.

Do not stop merely because multiple reasonable reversible implementations exist. Choose one, document the reason briefly, and continue.

Do not ask for approval for ordinary local code edits, tests, refactors, generated fixtures, or non-destructive build tooling.

Never perform destructive or externally consequential operations without appropriate authorization.

## Ownership of canonical state

`packages/sim` is the sole authority for game rules and canonical campaign state.

UI, renderer, server room, AI, persistence adapters, and tools may:
- issue commands;
- consume snapshots/read models/deltas;
- observe domain events.

They may not implement competing rules.

## Determinism

Every simulation change must preserve:
- seeded randomness;
- stable order;
- state-hash reproducibility;
- save/replay compatibility or an explicit migration.

Never call `Math.random()` inside deterministic gameplay.

## Performance

Before introducing an operation that iterates over a large global collection each turn/frame, estimate its asymptotic cost and look for:
- chunking;
- dirty sets;
- spatial indexes;
- cached aggregate data;
- incremental updates.

Rendering and simulation performance are separate budgets.

## Browser architecture

- React: UI shell.
- PixiJS: world canvas.
- Worker: headless simulation.
- Do not mirror the entire simulation into React state.
- Send compact deltas/read models to the UI.
- Avoid transferring giant object graphs between worker/main thread every frame.

## AI

AI is a client of the command API.

Parallel AI returns proposals; it does not mutate canonical state.

No hidden omniscience unless an explicitly disclosed difficulty/scenario grants it.

## Content

All content is original and data-driven.

Every stable referenced entity uses a stable string ID.

Validate cross-references at build/test time.

## Testing

A change is not complete until relevant tests pass.

Expected checks:
- typecheck;
- lint;
- unit tests;
- property/determinism tests when rules change;
- Playwright gameplay scenario when player-facing behavior changes;
- benchmark when a hot path changes.

## Subagents

Use subagents for independent packages or content batches.

Give subagents:
- goal;
- owned paths;
- prohibited paths/interfaces;
- expected tests;
- expected return summary.

The parent agent owns integration.

## Status documentation

Keep `docs/IMPLEMENTATION_STATUS.md` current.

Record:
- completed systems;
- partial systems;
- known defects;
- performance regressions;
- save/schema changes;
- next highest-leverage work.

Do not inflate completion status.

## Release quality

Never count:
- mock UI;
- static fixtures pretending to be simulation;
- TODO buttons;
- disabled tests;
- skipped edge cases;
- fake multiplayer state;
- non-deterministic saves

as complete 1.0 features.
