# ADR 0081 — Rules/save 51: landmarks

**Status:** accepted, 2026-10-31. Content and a derived reading of the world;
no canonical field. Save 51 freezes the rules 50 pack. Evidence:
[`docs/development/2026-10-31-landmarks/`](../development/2026-10-31-landmarks/README.md).

## Context

M8 names landmarks among the content targets, and the scope asks for
discoveries, ruins, lairs and landmarks with original events, rewards and
interactions. The world had seams and glass shards as the only authored
places; everything else a realm explored was biome and feature. A landmark
is the smallest such place that a player reads, claims and benefits from,
and it can be put into the world the way the seams were: derived from the
seed, the same for every reader, costing no save field.

## Decision

- **Twelve original kinds** in `packages/content/src/landmarks.ts`, each with
  a name, a story, the terrains it may stand on (plains, forest, hills), a
  coastal flag and a small yield of food, industry, coin or knowledge. They
  seal into the pack; packs sealed before rules 51 omit them.
- **Placement is derived.** `landmarks(world)` chooses from the seed
  (`seed ^ 0x4c414e44`, a separate stream from the seams') on passable ground
  that is not glass, at least four hexes from every start, two from every seam
  and eight from each other, one of the kinds that fits the ground and shore;
  about one per forty passable hexes, four at least and twenty-four at most.
  The result is cached beside the world and stable: a replay, a transfer and
  an older envelope under the current rules read the same landmarks.
- **Yield with the land.** A hearth that works the landmark's hex draws its
  yield among the hex's features, from rules 51 only; campaigns sealed earlier
  keep their yields.
- **Seen when explored.** The observation lists every landmark on ground the
  realm has explored, with its name, story and yield; the hex inspector names
  it and the settlement summary lists the landmarks a hearth holds.

## Consequences

- No save change beyond the version: save 51 upgrades v50 envelopes unchanged
  and asserts the rules 50 pack hash on them.
- Headline pacing under rules 51: Epic 413 by Attunement, Long 320, Standard
  216; the two other seeds 379 / 332, 260 / 284, 197 / 201; proxies
  314 / 424 / 309 / 189. The Epic headline course ends above its band for the
  third slice running (419, 413) while the other Epic seeds end inside it; the
  judgement stays a drift of one course, and the three-seed matrix is the
  reading to defend.
- Landmarks have no events, rewards beyond yield, intelligence or faction
  interactions yet; those remain M8 work, and the twelve kinds are a first
  catalogue against the scope's count.
