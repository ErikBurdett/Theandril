---
name: theandril-core
description: Use for any Theandril implementation, refactor, architecture review, or cross-system change. Enforces the giant-scale deterministic 4X architecture, original dark-fantasy IP boundary, working-software bias, and 1.0 completion rules.
---

# Theandril Core

1. Read repository-root `MASTER_PROMPT.md`, `AGENTS.md`, `ARCHITECTURE.md`, `GAME_1_0_SCOPE.md`, and `DEFINITION_OF_DONE.md` when present.
2. Inspect existing code before proposing a replacement.
3. Keep canonical rules in `packages/sim`.
4. Keep React, Pixi, persistence, and networking out of the canonical simulation.
5. Express game actions as validated commands and observable domain events.
6. Preserve deterministic state hashes and save/replay compatibility.
7. Prefer data-driven content and stable IDs.
8. Design for 24–48 major factions, giant maps, and thousands of strategic entities.
9. Add UI, AI support, persistence, tests, and instrumentation for every substantive game system.
10. Do not count placeholders or design prose as completion.
11. Run relevant verification before marking work done.
12. Update `docs/IMPLEMENTATION_STATUS.md` after meaningful slices.
13. For audit-driven 1.0 work, use `docs/1.0-DEVELOPMENT.md` and `/unlazy`; reproduce ranked findings before fixing them and retain the audit as historical evidence.
14. Translate the named 4X inspirations into original Theandril choices, counterplay and useful realm management, not copied content or extra unsupported release promises.

When changing a cross-cutting boundary, write a short architecture decision in `docs/architecture/` before or alongside implementation.

