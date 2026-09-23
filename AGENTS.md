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

## Art factory

For asset/presentation work, read `MASTER_ART_FACTORY_PROMPT.md`, `docs/art/ART_IMPLEMENTATION_STATUS.md`, and the relevant repository pixel-art, animation, terrain, Aseprite, provenance, provider, QA and integration skills. Use `docs/art/README.md` for the actual commands and schema links; the supplied design sketches are not substitutes for inspecting the implementation.

Keep source/candidate/rejected/reviewed/runtime boundaries explicit. Passing pixel validation is not visual approval. Retain exact reviewed pixels, editable exports, provenance and evidence outside ignored caches, and publish only validated approvals. Future artwork must not fabricate canonical gameplay consumers. Art Lab is development-only; live rendering must preserve fog, input, deterministic state and measured viewport/texture budgets.

## Testing

A change is not complete until relevant tests pass.

Expected checks:
- typecheck;
- lint;
- unit tests;
- property/determinism tests when rules change;
- Playwright gameplay scenario when player-facing behavior changes;
- benchmark when a hot path changes;
- pacing measurement when a rules or AI change can affect how a campaign ends.

**Deep testing is local. CI only proves the project builds.** GitHub Actions runs
install, typecheck and the production build, and the Pages workflow publishes it.
Vitest (unit, campaigns, repository) and the Playwright journeys run on the
development machine before committing or deploying — hosted runners render WebGL
in software and are several times slower, so long AI campaigns and browser
journeys time out there and turn CI red while the game is correct. Do not add
test steps, shards or CI-only timeout workarounds to the workflows.

### Measuring campaign pacing

Run `pnpm measure:pacing` locally — never in CI — whenever a rules or AI change
could alter how a campaign resolves. It plays whole campaigns and takes minutes.

Judge the result against the **headline** campaign: a standard map with twelve
realms, targeting about 200 turns for Standard, 300 for Long and 350–400 for
Epic. The campaigns in `pacing.test.ts`, `pacing-epic.test.ts` and
`chronicle-victory.test.ts` play a four-realm tiny map for speed. They are
proxies: they end sooner, two epic seeds on them sit well over a hundred turns
apart, and their bounds are derived from this tool rather than defended on their
own. Correct work has been reverted twice for moving a proxy while the headline
campaign stayed exactly where it should be.

When a change does move the headline campaign out of its band, the choice is
between fixing the change — usually because the AI cannot yet play the new rule —
and re-pricing the pace deliberately with the current pack frozen, the way rules
18, 21 and 22 each did. Tuning a number until a proxy bound goes green is neither.

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

After all tasks from one user prompt finish, write a local prompt report under [`docs/development/prompt-reports/`](docs/development/prompt-reports/README.md) recording what was delivered, changed, verified and left open, and sync the user's primary checkout when the prompt published anything.

For substantial reviewed chunks of work, also prepare a public developer dispatch using [the authoring/review contract](docs/updates/CONTRIBUTING.md). Pair player-facing examples and real imagery with exact source/evidence links, known limitations, explicit scope additions/deferrals, and progress against the existing 1.0 gates. Keep unreviewed work in draft; do not invent completion percentages or treat deployment as release acceptance. Update the existing journal content and canonical status rather than creating a competing roadmap. Publication still requires explicit authorization.

For `/unlazy`, `$unlazy`, or a request to keep developing toward 1.0, use the repository-local [Unlazy skill](.agents/skills/unlazy/SKILL.md): carry a playable slice through implementation and verification, record its evidence, then continue within the current authorized task. It is not permission to create background jobs or publish/deploy, and is not a substitute for the release gates.

For general-led army capacity, officer skill trees, fleets, transport or ocean warfare, also use [Armies and fleets](.agents/skills/theandril-armies-fleets/SKILL.md) to preserve leader-loss, cargo, domain, fog and historical replay invariants.

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
