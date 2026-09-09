---
name: theandril-armies-fleets
description: Build or refactor Theandril general-led armies, branching officer skills, fleets, transport, ocean movement and naval combat. Use with the repository simulation/combat skills for integrated military campaign work.
---

# Armies, generals and fleets

Treat Total War and Civilization as genre references for clear army organization and sea travel, not copied rules, names or interfaces. Read the current army/naval implementation and `docs/IMPLEMENTATION_STATUS.md`; capacity numbers and schemas in older design documents may predate user-directed changes.

## One authoritative military model

Keep formations as persistent members of strategic army containers. A general is a real character attachment, not an extra soldier or a UI-only capacity switch. Derive capacity, bonuses, skill prerequisites and blockers in simulation observations. UI and AI consume those decisions. Preserve formation identity, losses, spent movement, upkeep and attached characters through every merge, split, transfer and transport operation.

Before changing schema or tactical rules, retain independently captured old saves/commands/results. Version old hash projections and command execution; new defaults must not silently rewrite historical records or let newly added skills affect old battles. Tree nodes need validated prerequisites, cycle checks, role compatibility, explicit exclusivity and actual effects. Learning a node spends earned experience once; changing commanders cannot refill movement or grant formation health.

Validate old snapshots against their frozen content IDs before migration, not only the expanded current catalog. A correctly recomputed checksum does not authorize a ship, skill or building that did not exist in that format. Keep current pacing changes versioned too: replayed project costs and historical affordability must remain exact.

## Loss and transport boundaries

Define what happens when a leader dies, is wounded or leaves an oversized army. Never delete excess formations or trap the player without a legal repair path. Permit a bounded, explained penalty and a way to appoint a replacement or detach troops.

Transport is a canonical relationship between an existing land army and a real fleet. Validate ownership, shore adjacency, capacity, domain, movement commitments and active missions before mutation. No nested carriers or duplicate cargo. Carried troops must not move, fight, found settlements, cast field missions, expose independent sight or reorganize around capacity checks. Moving a fleet moves its cargo and characters atomically. Define cargo losses when capacity is lost and when the carrier sinks; save the factual aftermath and tell the player before embarkation.

Land, shallow water and deep ocean are distinct travel constraints. Keep depth in compact static geography; use the same domain/capability query for previews, direct movement, queued routes, attack approach, retreat and AI. Deep-water unlocks do not create land access for ships. Cargo unloading does not bypass enemy occupancy, diplomacy, movement costs or settlement capture rules. A blocked route must explain why and remain recoverable.

Verify large-stack legality through the movement quote as well as direct attack;
a fixed command can remain unusable through map clicks and AI if the query retains
an obsolete whole-stack cap. Compare the quoted command's actual participants with
the same targeted direct attack. Consume canonical road costs, refresh after a new
war declaration, and keep full reserve strength in threat estimates. Queued routes
must still pause rather than starting battles automatically.

A paused route may describe geography that was legal before a hull/capability change. Preserve that interrupted plan in a valid save, then replan on explicit resume; never accept a reorganization that makes its own save unloadable. Active routes must still satisfy current capability. Cargo casualty evidence must reconcile with actual surviving transport formations, with private passenger details removed from opposing observations.

## Verify the player outcome

Exercise real general recruitment/assignment, prerequisite purchases, large-army battle, leader loss, shore embarkation, a saved voyage, deep-water gating, naval battle/retreat, carrier loss and disembarkation. Compare manual/autoresolve using the same kernel. Assert transport conservation, nonnegative capacity and no hidden cargo/character disclosure. Add observation-only AI scenarios that actually load, sail and unload rather than merely buy ships.

Measure larger tactical rosters and loaded fleets separately from idle entities. Use indexed carrier/cargo and co-located army queries; avoid repeated global scans per army/turn. Check actual narrow UI, map selection, far markers and missing-art fallbacks. Ships must never borrow infantry artwork as if it were naval art. Publish any new art only through the repository's reviewed asset pipeline.

Never silently truncate appointment destinations to meet a performance target. Preserve access to every legal destination, or provide an explicit paginated/searchable query and a visible truncation notice. Exercise a hundred-army town, not only the small feature fixture.

Dialog keyboard ownership must not depend only on the currently focused element. Assignment can disable a focused button and move native focus to the document while its dialog remains open. Escape should close that dialog, retain the selected army/fleet and restore opener focus; test those outcomes without reselecting as a workaround.

Carry each coherent slice through the `/unlazy` verification loop and record concrete remaining limits; this skill does not expand permission to publish, deploy or run external services.
