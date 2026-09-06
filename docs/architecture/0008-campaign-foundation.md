# ADR 008: First campaign and command boundary

The first implementation follows the prescribed package layout and uses flat cell indices on an odd-row offset hex grid. Static world fields use typed arrays. Simulation owns dynamic entities, visibility, validation, turns and deterministic serialization; AI emits public commands from faction observations. Canonical mutation is synchronous and command validation precedes mutation. Rendering/UI receive filtered observations plus changed cells; campaign state stays in a worker. Content IDs remain stable strings.

Version 1 saves contain a canonical state, content hash, checksum and command history sufficient for replay. External input is validated before replacing a live campaign. Dexie transactions retain three autosave generations. This is a foundation for later rules, not a claim that the full world-generation pipeline or release gates are complete.
