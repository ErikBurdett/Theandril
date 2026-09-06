# Technical Decisions

## ADR-001 — PixiJS strategic renderer

Use PixiJS v8 directly for the giant 2D world canvas. React remains the application/UI framework but does not render strategic entities.

Reason:
- direct control over batching, culling, render textures, world transforms, and LOD;
- keeps UI ergonomics without React reconciliation overhead on a huge map.

Production renderer target: WebGL.
WebGPU: opt-in experiment until browser compatibility is proven.

## ADR-002 — Headless deterministic TypeScript simulation

All game rules live in a pure TS package and are shared between browser worker and Node server.

Reason:
- single source of truth;
- deterministic testing/replay;
- single-player and multiplayer parity;
- worker performance.

## ADR-003 — Strategic army abstraction

An army is one strategic entity containing formations/regiments.

Reason:
- permits thousands of world armies and "hundreds per empire" without simulating individual soldiers;
- preserves unit composition and tactical depth.

## ADR-004 — Hierarchical world

Hex cells are grouped into chunks, regions, continents/seas, and dynamic military theaters.

Reason:
- pathfinding, AI, rendering, economy, and UI can reason at appropriate scales.

## ADR-005 — Same combat engine for tactical and autoresolve

Autoresolve executes tactical rules using AI orders at accelerated speed.

Reason:
- expected results stay aligned with player intervention;
- one balance model;
- replayable/deterministic.

## ADR-006 — Simultaneous planning for online mode

Multiplayer uses simultaneous planning and deterministic resolution.

Reason:
- reduces waiting in a world with many factions/armies;
- remains strictly turn-based;
- server can resolve conflicts canonically.

## ADR-007 — Data-driven content

Faction/unit/ability/building/research/event content is schema validated and stable-ID based.

Reason:
- content scale;
- mod readiness;
- AI/content-tool friendliness;
- save stability.

