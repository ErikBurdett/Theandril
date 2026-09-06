# Theandril

A browser-native dark-fantasy 4X, under active development. This checkout now contains the first campaign implementation. It is **not Theandril 1.0**; see [implementation status](docs/IMPLEMENTATION_STATUS.md) for the actual release gaps.

## Run locally

Requires Node 22.12+ and pnpm 10.32.1.

If pnpm is not installed, use `npm exec --yes --package=pnpm@10.32.1 -- pnpm install --frozen-lockfile` to bootstrap dependencies, and `npm exec --yes --package=pnpm@10.32.1 -- pnpm dev` to start this checkout.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the local Vite address, choose a seed, world size and faction count, and begin a campaign. Size changes suggest 4/12/24/32/40 seats; four original cultures supply generated variants rather than that many authored nations. Select the hearth caravan to found a settlement. Select the settlement to build or recruit. Click an army, then a highlighted hex to move along its known route within the current movement budget; hover previews the path and cost. Clicking a reachable hostile army approaches and attacks, without declaring war automatically. Click stacked friendly armies to cycle selection; dragging pans, and Escape clears selection. End turn resolves the economy and AI orders. Manual saves and three rotating autosaves use IndexedDB. Exported campaigns use the compressed `.theandril` format.

Each army contains up to twelve formations. Recruit companies at a settlement, bring their detachments onto the same hex, select one and open **Army composition**. Merge entire armies, transfer checked formations to another army, or split checked formations into a named detachment. The slowest formation sets shared movement; sight takes the best scout and upkeep adds across the roster. Casualties stay with their formations, and reorganizing never restores movement.

Open **Appoint characters & officers** at an owned town to appoint a named Hearth marshal, Road witness or March engineer. **Characters & agents** opens a searchable, paginated roster with assignments, mission costs and blockers, recovery and earned specializations. An army supports one marshal and two agents; attachments require the same hex. Marshals add leadership and can **Rally** active formations once per battle. Surveyors chart remembered terrain without revealing hidden armies; engineers refit surviving formations or sabotage a besieged town. Missions cost coin and hold the carrier for two turns; cancellation or hostile interruption gives no refund. Sabotage can wound its engineer. Experience, specializations, wounds, deaths and battle testimony survive saves and appear in the campaign records. AI uses these same commands. Casters, covert agents, offices and full character politics remain unfinished.

For longer travel, click a known destination and choose **Queue route**. Shift-click or enable **Add waypoint mode** to extend the order. **Destination hex → Review route** provides a keyboard/touch alternative. Queues spend available movement immediately and continue after turn refresh; new hostile sightings, blocked passages, combat and displacement pause them for review. The army registry marks active/interrupted orders; **Resume route** replans safely, and **Cancel route** stops travel. Queues survive saves and never automatically attack. Routes are currently limited to 256 hexes/eight waypoints and explored land; a bounded search may require a closer destination.

New maps distinguish ten climate biomes from the five physical terrain classes. Biomes currently do not change movement costs or yields. All four implemented cultures now have distinct troop, character, settlement and heraldry kits:60 individually approved assets selected by actual faction definition, including generated realms. Native UI icons appear in recruitment, army composition, character controls and diplomacy; far-view armies use grouped faction badges. Public culture crests are reference information, not a player-seat selector. The full gritty pixel-art pack has 97 approved assets, including existing terrain and ruins. Development builds include **Art Lab** for native previews, animation, atlas rectangles and QA. The [art factory guide](docs/art/README.md) explains processing and review; [coverage](docs/art/ASSET_CATALOG.md) separates 80 current map/UI/fallback bindings from 17 future-only assets. New faction poses are static; full directional/action animation and biome-transition production remain unfinished.

When foreign forces come into sight, declare war from the encountered factions list and attack with an adjacent army. Choose tactical orders or autoresolve; both use the same battle rules. Besiege neighboring enemy settlements, maintain the blockade to reduce defenses, then assault and choose occupation, sack, raze or context-legal liberation. Ruins can be resettled by a caravan. Capture choices show their persistent economic consequences and can be saved before deciding.

Use **Negotiate peace** to review a coin payment and binding truce. Offers to AI are considered on End turn; incoming offers can be accepted or rejected. Coin is transferred only on acceptance, and unfundable terms display a blocker. Saves preserve sieges, tactical rounds, capture decisions and peace commitments; schema 7 adds named characters while retaining formations, biome identity and travel orders. Archive format 2 preserves old recorded orders/checksums with explicit rules/save versions, including genuine schema-6 travel and mixed-battle archives.

Open **Realm progression** to spend knowledge on technology and choose separate permanent institutions and military doctrine. The first victory path, Prosperity, requires three unoccupied towns with markets and archives, Civic accounts, an institution, and a funded Hearth Exchange. Its public host can be besieged to pause progress or conquered to cancel it. Other intended victory paths are not implemented yet.

Choose **Standard** campaign pace for hundreds of turns; Long and Epic raise late economic commitments and give opponents a longer project response window. Short is explicitly a test/skirmish profile. Pace does not yet change AI strength or provide the full planned difficulty system. The intended 1.0 game should remain strategically engaging for hundreds of turns, potentially around 1,000 at higher difficulties; duration alone does not satisfy that design goal.

Choose **AI watch** to let all factions play through the same rules. It begins paused; resume or step one round, and pause whenever needed. Victory automatically opens **Campaign chronicles**, with a chaptered History tome and a separate technical ledger. Both can be downloaded. The technical JSON preserves the initial snapshot, every submitted command/result, events, tactical reports and replay checkpoints; the tome chronicles recorded events without inventing earlier history. Full archives survive save/load and compressed export. Imported older raw saves explicitly label history as partial. All-faction logs are revealed only after victory, not as mid-game intelligence.

Local DB2 saves append new history chunks instead of re-encoding the full campaign on every turn. Retained generations share verified immutable history with three payload replicas and atomic recovery. Existing DB1 saves still load; portable exports keep the same complete format. The 64 MiB logical archive limit remains explicit, and large current snapshots/full exports still have measurable costs. See [storage measurements](docs/performance/0009-incremental-storage.md).

```sh
pnpm typecheck
pnpm lint
pnpm content:validate
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:gameplay
pnpm bench
pnpm bench:chronicles
pnpm bench:characters
pnpm bench:storage
pnpm art:validate
pnpm bench:art
```

To use a locally installed Chromium for gameplay tests, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to its executable path. Benchmarks print deterministic campaign hashes and actual measurements; [performance notes](docs/PERFORMANCE.md) identify fixture limitations.

For continued agent development, the repository-local [Unlazy skill](.agents/skills/unlazy/SKILL.md) defines `/unlazy` / `$unlazy`: implement a complete playable slice, verify it, record the evidence and continue within the authorized task. It does not launch background jobs or imply permission to publish or deploy.

## Original build handoff

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
