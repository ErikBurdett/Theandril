# 0060 — Ground in sight: natural features, remembered surveys and the AI's glass

Rules/save **39** (shared with subject rule and cession) closes a gap the third
victory path exposed: the game told players that "Ashfall glass marks ground
worth surveying", yet neither the map nor the AI could see glass outside owned
land, and nobody remembered where a survey had already been paid for.

## Natural features in sight

`getObservation` now carries `featureMask` on every explored cell that is
**currently in sight** and has any natural feature. Remembered ground beyond
sight shows none, zero masks are omitted, and historical readings (rules ≤38)
are unchanged. Features are immutable geography derived from the seed, like the
terrain and biome already exposed for explored cells; computing them for the few
hundred visible cells per observation is cheap, and no cache is kept because
authored test worlds mutate terrain in place. Cells whose terrain and depth
disagree (authored fixtures) show no features rather than failing the reading.

## The attunement standing

The Huge starting-map journey budgets the first worker packet at 20,000 bytes
and had 72 bytes of headroom under rules 37; the rules-38 attunement standing
(about 1.2 KB of blockers and descriptions) had silently taken it over, which
this slice's full journey run exposed. The progression observation now carries
`attunementAvailable: true` under rules 38+ and the full `attunement` standing
only once the realm has begun the arcane road — a researched discovery, a
surveyed seam, a living Waykeeper or a working of its own. Until then every
requirement is the static one the content states, which the Victory tab shows
from content. The Huge starting summary measures 19,156 bytes under rules 37,
19,183 under 38 and 19,203 under 39.

## The worker packet

The cell packet gained versions **4–6**: the layouts of 1–3 with a natural-feature
mask of at most seven bits folded into spare bits of the terrain byte (bits 3–7)
and the water-depth byte (bits 2–3, plus present and undefined flags), so a
featured row costs no metadata row. A packet whose masks exceed seven bits falls
back to the metadata layout. The Huge starting-map transfer stays under its
20,000-byte budget; the first attempt, which used metadata rows, measured 21,216
bytes and was rejected by that journey.

## Remembered surveys

`arcaneSearches` records, per realm, every hex it has paid to survey, found or
empty, oldest first, bounded at 256 with the oldest giving way and a repeated hex
moving to the newest place. It is canonical state (save 39), observed only by its
owner, validated on load, stripped from projections to ≤38 and refused by
historical execution when non-empty; a v38 envelope migrates with an empty
register. The survey panel says whether the hex underfoot was already surveyed,
shows glass, or is a bet.

## AI

- A realm that holds a seam but lacks a path surveys only when a free company
  already stands on fresh glass (no cadence; the 160-coin surplus and the rarity
  of fresh glass are its limits), and never on ground it remembers surveying.
- `planGlassApproach` marches at most one free, small, unrouted land company a
  turn up to four hexes to fresh glass on passable land that it can see, only
  when the movement preview says the order can be queued, and holds it for the
  pass. The first attempt, which did not consult the preview, produced 176
  refused orders on the Epic headline and was corrected before measurement.
- Seam claims and the first-seam survey cadence are unchanged apart from the
  shared "already surveyed" set.

## Limits

The map still draws no natural features; the survey panel is the only place a
player reads glass underfoot. A realm with no seam at all keeps the old
six-turn survey cadence near its hearths rather than walking to glass.
