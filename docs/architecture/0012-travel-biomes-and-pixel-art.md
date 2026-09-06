# 0012 — Intent-based travel, biome identity, and pixel-art production contract

Date: 2026-09-05. Status: implemented travel/biome slice; pixel conversion specified, not implemented.

## Movement intent stays in simulation

The existing adjacent `move` command remains available with its historical semantics. New `moveTo` finds a deterministic route within the army's remaining budget and can finish with an explicit field attack against an observed hostile army. It does not declare war or enter a foreign settlement through its garrison. Current physical terrain still determines step cost; biome color does not introduce a second movement rule.

`queueMovement` stores a bounded travel order, optionally appending a waypoint. It uses available movement immediately, then continues in a named `travel` phase after the next turn's movement refresh. `cancelMovement` clears the order. `resumeMovement` deliberately replans paused travel against current permitted information. Travel never queues an automatic attack.

Canonical routes retain the army ID, current route origin, remaining waypoints/path, active/paused status, explanation, and locally known hostile IDs. Each step rechecks adjacency, current visibility, passability and foreign occupants/settlement control. Newly sighted local hostiles, combat, siege duty or displacement interrupt travel; destruction removes the order. Paused orders remain inspectable rather than silently retrying. Future event systems must use these same canonical interruption/invalidation boundaries; this slice does not invent a random-event system.

Queries use observation-only geography/occupancy and stable tie-breaking. Combined range/preview work is limited to 4,096 expanded nodes; orders support at most 256 path cells and eight waypoints. A limited search reports that the user needs a closer waypoint, not that a route is physically impossible. This is bounded A*, not completed hierarchical routing. Saved routes execute their validated remaining steps rather than running a new global path search every turn. Reconciliation targets affected armies instead of scanning all saved orders after each unrelated command.

## Input and rendering boundaries

React owns controls and compact movement read models. The worker reuses its full permitted observation for repeated preview queries until state changes. Hover queries do not transfer all explored cells, and renderer camera motion does not update empire registries. Range, preview and committed-route graphics use dirty overlay layers separate from cached terrain chunks. Native pointer drag thresholds distinguish panning from issuing a destination click; DOM controls provide a keyboard/touch alternative.

The unit-first interaction does not confer authority to attack neutral factions or bypass siege/capture blockers. Long-distance destinations require an explicit queue action; shift-click and the corresponding DOM control can append a waypoint. A paused route needs a visible explanation and deliberate resume/cancel controls.

## Biomes do not overwrite terrain

Generator 2 adds a separate typed biome array: ocean, temperate grassland/forest, taiga, tundra, desert, steppe, marsh, rainforest and alpine. Seeded latitude, temperature/moisture fields and coast/upland constraints produce coherent variation. Terrain, fertility and starts remain byte-identical to generator 1, preserving existing movement/economy and measured campaign pacing. No biome-specific yields, hydrology or resource economy are claimed.

Explicit generator 1 remains available for historical origins; legacy maps derive their biome fallback from their stored physical terrain, not a regenerated replacement. Save schema 5 persists generator identity, biomes and routes, with a strict v4 migration and the existing earlier chains. Migration verifies the old checksum/content before adding fields and rejects malformed route/reference data.

Archive format 2 identifies the initial save version, each order's rules version, and each checkpoint/final-hash version. An archive-1 migration retains its initial snapshot and every historical command/event/checkpoint. Old v4 records verify using an explicit v4 projection and generator-1 origin; newly appended records use v5 checkpoints. Versioned command validation preserves historical rejections even when a formerly unknown command becomes supported in v5. Checkpoints cannot downgrade from v5 to v4. This preserves recorded hashes rather than rebasing or discarding history. The outer checksummed campaign envelope remains format 1.

## Future art direction

The user-directed target is original gritty dark-fantasy pixel art. `.agents/skills/theandril-pixel-art` contains the production contract: material/silhouette direction, native asset-family sizes, ground anchors, directional sheets, timings, export/provenance, LOD, memory estimates and acceptance checks. It incorporates official Pixi/Aseprite API references and was independently exercised as an artist/integration handoff.

The proposed integer pixel-hex grid (56-pixel horizontal / 48-pixel row / 28-pixel odd-row offset) is a future presentation conversion, not silently substituted into the current radius-29 renderer. Projection, picking, chunk bounds and movement overlays must convert together without changing canonical cells. DOM UI remains crisp and responsive. The tactical camera, importer, atlas tooling and actual sprite families remain unbuilt; the current biome glyphs are procedural.

## Verification workloads

- Unit and generated-start tests exercise immediate travel, hostile attacks, queued interruption, strict saved routes, legacy archives and continuation.
- Five generated campaign seeds use actual commands to exhaust movement, queue a return journey, save the archive, continue for eight turns and replay the complete record.
- The normal four Huge/Legendary 100-turn AI fixtures retain their 50-turn save mirrors; archived real victories include Epic turn 1,006.
- The movement benchmark separately measures cold/full and cached observations, short previews, a 4,096-node limited query, and 512 stacked queued guards on each fully explored giant preset with 20-turn saved mirrors. It reports active travel turns separately from post-arrival idle turns.
- Browser scenarios operate actual click/drag/keyboard/queue controls and compare the established Huge camera workload before/after. Current results and limitations belong in implementation status and performance notes.
