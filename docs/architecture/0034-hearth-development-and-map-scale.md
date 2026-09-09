# Hearth development and map scale

The map used different sizing rules for terrain, towns and armies. Upgrades
could change yields without changing the occupied ground, and new campaigns
inherited the same filled-in seed.

Campaign creation samples browser entropy for an empty seed field. Explicit
seeds and loaded campaigns remain deterministic. The simulation receives a
concrete uint32 seed and never draws browser randomness.

The renderer indexes observed claims and derives a bounded district layout per
town publication. Population adds housing; completed buildings add civic
districts; owned production and tile-work orders supply scaffolding. Existing
improvements, active work, water, peaks and unseen cells are reserved. Prefer
unworked plots; scarce unimproved worked plots may carry a district while
retaining their worked-ground cue. Cosmetic
district lanes form a sparse hierarchy; they do not create canonical roads,
movement discounts, buildings or yields. Their counters remain separate from
actual roads. Changed layouts invalidate only their affected terrain chunks.

The normal observation already supplies visible completed buildings and only
the player's private queues. The explicit spectator map now copies completed
building IDs, while retaining its omission of queues, economy and tile work.
Layouts are never inferred from hidden current state or last-seen claims alone.
The projection change does not alter saves or replay. The separate specialist
roster uses a deliberate rules-15 migration with frozen historical content.

Detailed settlements and improvements fit exact opaque geometry inside their
own hex, including the union of animation frames. Units use uniform scale with
bounded screen dimensions; far town/army heraldry is screen sized and separated
when co-located. The world-overview raster hides all these layers. Canonical
hex projection stays unchanged; strategic markers also expose their actual
rendered hit bounds, so inspecting a displaced badge selects its entity without
issuing an unintended move to the underlying hex.

Neighborhood housing reuses the approved culture village family. Civic
buildings and advanced tile improvements have shared original raster assets;
construction scaffolds, ground treatment and street segments are authored
code-native geometry, not approvals or claims of generated sprite animation.
The first visual review rejected flat civic symbols, grey paving and dense
street lines despite passing gameplay tests. Native and actual-game review is
required alongside paid construction/save/fog and camera tests.

New assets use a separate small map-works page because the foundation atlas is
full. This preserves the exact foundation pixels and its registered settlement
geometry. Atlas memory is measured separately from static chunk backing.
