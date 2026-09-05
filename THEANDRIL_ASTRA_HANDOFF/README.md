# Theandril — GPT-6 Astra 1.0 Build Handoff

This package is intended to be copied into the root of the Theandril repository and handed to GPT-6 Astra as the standing build brief.

## Recommended stack

- **Language:** TypeScript, strict mode everywhere.
- **Workspace:** pnpm workspaces + Turborepo.
- **Web shell/UI:** React + Vite.
- **2D strategic renderer:** PixiJS v8.
  - Production default: WebGL.
  - WebGPU may be exposed behind an opt-in feature flag after benchmark and compatibility tests.
  - Do not make the strategic map React-rendered. React owns menus/panels/HUD; Pixi owns the canvas.
- **Simulation:** pure/headless TypeScript package, deterministic, no DOM access.
- **Single-player execution:** dedicated Web Worker.
- **AI planning:** worker pool using immutable/read-only snapshots and validated command proposals.
- **Local persistence:** IndexedDB via Dexie.
- **Online multiplayer:** Colyseus authoritative server, using the same shared simulation package.
- **Validation:** Zod for external/content boundaries.
- **State/UI:** Zustand or equivalent small UI-only store; never make it the canonical simulation.
- **Testing:** Vitest + Playwright + fast-check/property tests.
- **Server persistence if cloud features are enabled:** PostgreSQL + Drizzle ORM.
- **Observability:** structured logs, deterministic replay logs, browser performance counters.

## Install the official PixiJS Agent Skills

PixiJS maintains an official Agent Skills collection. Install it in the development environment alongside the Theandril-specific skills in this package:

```bash
npx skills add https://github.com/pixijs/pixijs-skills
```

If the installed skill set conflicts with repository-specific Theandril instructions, the repository instructions and current user request win.

## Handoff

1. Copy this package into the repository root.
2. Keep `.agents/skills/**` exactly where it is so agents can discover the repository-scoped skills.
3. Give Astra `BOOTSTRAP_PROMPT.md` as the first message.
4. Astra should read `MASTER_PROMPT.md`, `AGENTS.md`, `ARCHITECTURE.md`, `GAME_1_0_SCOPE.md`, and `DEFINITION_OF_DONE.md`.
5. Astra should also read `docs/RESEARCH_MAGIC_SYSTEMS.md` before implementing progression, factions, characters, combat magic, rituals, or research AI.
6. Astra should immediately inspect the repository, create/update `docs/IMPLEMENTATION_STATUS.md`, then begin implementation.
7. The project is not complete because a prototype exists. The release target is the `1.0` gate in `DEFINITION_OF_DONE.md`.

## Design philosophy

Theandril should feel enormous without simulating every grain of wheat or every soldier as an independent actor. It gets scale by using the right abstraction at each zoom level:

- the world is tile/chunk based;
- strategic administration is settlement/region based;
- military movement is army/fleet based;
- armies contain unit formations rather than thousands of individual soldier entities;
- battles expose a compact formation battlefield for tactical choices;
- distant map visuals collapse into cached/aggregated layers;
- AI plans hierarchically rather than brute-forcing every possible action.

The result should be a serious, deep browser 4X rather than a reduced mobile-style interpretation of one.

## Originality requirement

Theandril may draw high-level inspiration from tabletop dark fantasy and established 4X conventions, but all lore, setting names, characters, factions, visual designs, flavor text, exact mechanics, spell names, stat blocks, UI art, and narrative content must be original. Do not copy Dungeons & Dragons settings or Civilization VII proprietary content.

Classical fantasy concepts with broad folkloric roots—humans, elves, dwarves, goblins, orcs, dragons, undead, witches, giants, spirits, etc.—may be used in original ways.
