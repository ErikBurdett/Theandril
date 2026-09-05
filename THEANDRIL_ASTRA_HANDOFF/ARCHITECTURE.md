# Theandril Architecture

## 1. System diagram

```text
┌──────────────────────────────── Browser ────────────────────────────────┐
│                                                                        │
│  React UI/HUD  <──── read models / deltas ────┐                       │
│       │ commands                                │                       │
│       v                                         │                       │
│  Game Client / Command Facade ────────────────┐ │                       │
│       │                                        │ │                       │
│       ├── single player ──> Simulation Worker ├─┘                       │
│       │                         │                                      │
│       │                         ├── packages/sim                        │
│       │                         ├── packages/ai worker pool             │
│       │                         └── packages/mapgen                      │
│       │                                                                │
│       ├── online ───────────> Colyseus Server                           │
│       │                         └── packages/sim                        │
│       │                                                                │
│       └── persistence ─────> Dexie / IndexedDB                          │
│                                                                        │
│  Pixi Renderer <──── compact render snapshot/deltas ── Game Client      │
└────────────────────────────────────────────────────────────────────────┘
```

## 2. Package responsibilities

### `packages/sim`
Canonical deterministic rules:
- turns/phases;
- factions;
- settlements;
- economy;
- resources;
- armies/fleets;
- movement;
- visibility;
- combat/siege;
- diplomacy;
- politics;
- characters/agents;
- research/institutions;
- victory;
- events;
- state hashing;
- command validation/application.

Zero browser/render/network dependencies.

### `packages/protocol`
Shared network/client protocol:
- command wire types;
- public/read-model types;
- room messages;
- protocol version;
- validation schemas.

Do not expose hidden simulation state through public protocol types.

### `packages/content`
Validated data:
- faction definitions;
- unit definitions;
- abilities;
- buildings;
- progression;
- events;
- character templates;
- localization.

No mutable campaign state.

### `packages/mapgen`
Seeded world generation and static derived geography:
- height;
- climate;
- hydrology;
- biome;
- regions;
- resource placement;
- start positions;
- strategic analysis.

### `packages/ai`
AI planning:
- faction strategy;
- theater manager;
- economy;
- diplomacy;
- research;
- character/agents;
- operations;
- tactical battle.

Consumes immutable observation/snapshot types and emits commands/proposals.

### `packages/render`
Pixi-specific world rendering:
- camera;
- chunk views;
- atlases;
- world layers;
- fog;
- labels;
- overlays;
- hit testing;
- LOD;
- render diagnostics.

No game-rule decisions.

### `packages/ui`
Reusable React UI:
- panels;
- dialogs;
- tooltips;
- registries;
- notifications;
- accessibility surfaces.

### `packages/persistence`
Adapters and migrations:
- local IndexedDB;
- save import/export;
- snapshots;
- replay logs;
- schema migration.

### `packages/test-fixtures`
Named scenarios and deterministic stress worlds.

## 3. Canonical state shape

Prefer normalized, data-oriented collections keyed by stable numeric runtime IDs plus stable string content IDs.

Illustrative only:

```ts
interface GameState {
  meta: GameMetaState;
  world: WorldState;
  factions: FactionStore;
  settlements: SettlementStore;
  armies: ArmyStore;
  fleets: FleetStore;
  characters: CharacterStore;
  diplomacy: DiplomacyState;
  progression: ProgressionState;
  events: EventState;
  visibility: VisibilityState;
  rng: RngState;
}
```

Avoid deeply nested object ownership where moving one entity requires cloning half the world.

## 4. World storage

Static cell properties should favor packed typed arrays:
- elevation;
- biome ID;
- movement class;
- region ID;
- base fertility;
- water flag.

Dynamic sparse overlays:
- owner;
- road;
- improvement;
- devastation;
- settlement reference;
- army occupancy;
- fog/visibility by faction.

Use a chunk index:
- chunk ID from cell coordinate;
- dirty flags per render/simulation concern;
- entity lists per chunk;
- cached aggregate summaries.

## 5. Spatial hierarchy

Maintain at least:
- Cell/hex;
- Chunk;
- Region;
- Continent/Sea;
- Theater (dynamic AI/military grouping).

Pathfinding:
- local hex-level route;
- hierarchical route for long distance;
- cache reusable cost fields;
- invalidate by changed roads, ownership, wars, movement blockers.

Do not ask A* to traverse 300k cells from scratch for every army every turn.

## 6. Command/event flow

```text
UI / AI / Network
      |
      v
 validateCommand(command, observation)
      |
      v
 applyCommand(canonicalState, command, rng)
      |
      +--> domain events
      |
      +--> dirty sets / deltas
      |
      v
 state + hash
```

Commands should express player intent, not implementation detail.

Domain events should be useful for:
- UI notifications;
- replay;
- analytics/debugging;
- AI memory;
- narrative triggers.

Do not blindly event-source every micro-change if it creates excessive overhead. Use periodic snapshots plus a meaningful command/event log.

## 7. Worker model

### Simulation worker
Owns single-player canonical state.

Main thread sends:
- commands;
- query requests;
- load/save instructions.

Worker returns:
- command result;
- event summaries;
- compact changed entity/cell deltas;
- read models;
- performance counters.

### AI workers
Receive:
- immutable/public observation snapshots;
- bounded planning task;
- deterministic RNG seed/substream ID;
- deadline/budget measured by work units where practical.

Return:
- ranked proposed commands/plans;
- explanation/debug metadata.

Canonical sim validates proposals.

## 8. Renderer model

Pixi world graph is not the game state.

Maintain render representations only for:
- visible chunks;
- nearby labels/icons;
- aggregate distant markers.

Use layer groups:
1. base terrain cached layer;
2. water/coast;
3. rivers;
4. roads/improvements;
5. political control;
6. settlements;
7. armies/fleets;
8. fog/intelligence;
9. effects;
10. selection/orders;
11. world labels.

Rebuild only dirty chunks/layers.

## 9. Read models

Do not transfer full canonical state to React.

Create task-focused selectors/read models:
- selected settlement;
- selected army;
- empire summary;
- war overview;
- diplomacy target;
- character roster page;
- notification feed;
- map entity summaries.

Version read models so UI can ignore stale worker responses.

## 10. Saves and replay

A save contains:
- save version;
- game version;
- content hash;
- world seed/settings;
- compressed canonical snapshot;
- deterministic RNG state;
- command/event tail;
- campaign metadata.

Store rolling autosaves atomically:
1. write new save object;
2. validate/checksum;
3. update pointer/index.

Replay validation tests:
- load known snapshot;
- apply command stream;
- compare turn-by-turn state hashes.

## 11. Multiplayer

Server room owns the same simulation engine.

Clients receive only permitted observations.

A command envelope contains:
- match ID;
- faction/player ID;
- sequence number;
- turn;
- command;
- protocol version.

The server validates:
- authentication/seat;
- expected turn/phase;
- ownership;
- visibility;
- cost;
- legality.

Multiplayer resolution remains deterministic regardless of message arrival order by applying a canonical order after the planning window.

## 12. Content dependency boundary

Simulation references definitions by IDs and precompiled/validated numeric structures.

At boot/build:
- load content pack;
- validate schemas;
- resolve references;
- detect cycles;
- build lookup tables;
- calculate content hash.

Content errors should fail loudly in development/CI.

## 13. Performance telemetry

Track at minimum:
- simulation phase times;
- AI planner times;
- commands per turn;
- battles resolved;
- pathfinding calls/nodes expanded;
- dirty chunks;
- visible sprites;
- draw calls if available;
- transferred worker bytes;
- frame time;
- memory estimates where available.

Keep telemetry lightweight and disable verbose traces in release mode.

## 14. Failure containment

If an AI planner fails:
- log;
- fall back to deterministic safe behavior;
- do not corrupt campaign.

If a local save fails:
- preserve previous valid autosave;
- surface actionable error.

If optional WebGPU initialization fails:
- fall back to WebGL.

If a content asset is missing:
- use an explicit development missing-asset marker and fail CI for release-critical packs.


## 15. WASM policy

Do not begin with a full Rust/WebAssembly rewrite.

The default implementation remains strict, data-oriented TypeScript because:
- the game is turn-based rather than a per-frame physics simulation;
- the same simulation can execute in browser workers and Node with minimal impedance;
- iteration, debugging, content integration, tests, and Astra-assisted development remain faster.

Design hot systems behind narrow interfaces so specific kernels may later gain a WebAssembly implementation.

Candidates only after profiling:
- hierarchical pathfinding kernels;
- flow-field/influence-map calculations;
- selected world-generation passes;
- large numeric AI scoring passes;
- compression/serialization.

A WASM implementation must:
- preserve deterministic behavior;
- have a TypeScript reference implementation or equivalent golden fixtures;
- outperform the existing implementation in representative Huge/Legendary benchmarks after crossing the JS/WASM boundary;
- not force canonical state to be duplicated every turn.

Never introduce WASM because it sounds faster; introduce it because measured end-to-end results prove it.
