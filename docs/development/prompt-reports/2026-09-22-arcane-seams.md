# Arcane seams: the first half of the magical discovery loop — 2026-09-22

## Prompt

“okay continue development and get it deployed”, continuing the road to 1.0 at M2 — *a complete magical discovery loop: discover a magical site, qualify a caster, cast and counter a researched effect*.

## What was missing

A survey of the magic systems found the second half of M2 already built and the first half absent. Waykeepers, Flame and Rune aptitudes, two Arcane Theory discoveries and the ember/ward spell pair all work through ordinary commands with save, replay and browser evidence. But there was **no magical site of any kind**: nothing hidden on the map, no paid search, no control or extraction, and no geography behind Arcane Theory — research was gated only by an archive and accumulated knowledge. The one arcane-tagged resource, ashglass, had no magical consumer at all.

## Delivered — rules/save 23

- **Seams are geography, not state.** The Ashfall left arcane seams under Ashfall-glass ground. Where they lie is derived from the world's seed like any other natural feature, so a save records only which realms have paid to survey them. A standard map hides fourteen seams among a hundred and sixty-two visible glass hexes; a tiny map hides three among twenty-three.
- **A paid survey.** Any company may spend its movement and 24 coin to survey the ground it stands on, revealing seams within two hexes — to that realm alone. An empty survey says so and still costs. The glass tells a player where it is worth looking without telling them where the seams are.
- **Control and extraction.** A surveyed seam inside a realm's borders draws two ashglass a turn alongside the hearth's ordinary yield, and is taken with the hearth if the hearth falls.
- **Site-gated discovery.** Arcane Theory now needs a surveyed seam inside your own borders. Research alone no longer reaches magic: the realm must find the ground, take it and hold it.
- **The AI plays the loop.** A realm holding no seam surveys its own hinterland from surplus, at most once every six turns, and prefers a surveyed seam over ordinary hinterland when its borders grow. It never marches a surveying company away in the same turn.
- **The UI answers what is missing.** The selected company offers "Survey for an arcane seam · 24 coin" with the reason when it cannot; the Arcane Theory tab lists the seams the realm has surveyed, whether each is held, and says plainly that Ashfall glass marks ground worth surveying.

## Measured

A standard twelve-realm campaign with eight city-states ends on turn 231. Six realms surveyed and held a seam, and one completed Arcane Theory research through it — the loop closes in ordinary play rather than only in a test.

## Verified locally

- Typecheck, lint, `content:validate` and build pass.
- `pnpm test`: 1,810/1,810 across unit, campaign and repository projects.
- A genuine rules-22 save and its 1,993-order archive from deployed `6644f80` load, re-seal to identical v22 bytes, replay exactly, re-seal into a v23 envelope and continue ten rounds of AI play.
- A browser journey surveys from real controls, reads the panel's reasons, and keeps the find across a save and reload.

## Not done

- The second half of M2 remains: a counter to an opposing effect, interruption and a paid response, and two authored faction approaches with materially different access.
- Caster aptitudes still never grow, and seams have no artwork of their own.
