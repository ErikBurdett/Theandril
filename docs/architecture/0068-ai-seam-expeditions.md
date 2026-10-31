# ADR 0068 — AI seam expeditions

**Status:** accepted, 2026-10-31. AI only; no rules, content or save change.
Evidence: [`docs/development/2026-10-31-ai-seam-expeditions/`](../development/2026-10-31-ai-seam-expeditions/README.md).

## Context

After ADR 0067 the headline campaigns find most of the world's seams, but a
replay of the Epic headline campaign (seed 20260905, twelve realms) showed
why that did not bring any realm nearer the third path: at the end of the
campaign only three of twelve realms held a seam of any path, and every seam a
realm had found but did not hold lay in nobody's borders, between eleven and
seventy-nine hexes from that realm's nearest hearth. The AI claimed a found
seam only when it already sat on a hearth's border, and its caravans chose
founding sites by local land value within a few hexes of home, so a seam found
by a company on a glass march was never settled. Two found seams lay inside
another realm's borders at peace; none lay within claim reach of a hearth.

## Decision

`claimArcaneSeam` claims toward a found seam within four hexes of a hearth,
one legal hex at a time, choosing each turn the claimable hex that leaves the
border nearest the seam; a seam in another realm's borders is never claimed
toward, since the border would stop at theirs.

`planSeamExpedition` settles beside a found seam farther away. The site is the
seam's own hex or a neighbour on passable dry ground in nobody's borders and
three hexes from every known settlement; seams on a hearth's border are left
to claims, and the nearest qualifying seam to the realm's hearths is chosen,
within forty-eight hexes. A free caravan is given a saved road to the site
through a movement quote and held on that road by every later pass until it
stands there, when it founds the hearth; a paused road is quoted afresh. With
no caravan, one is raised at the nearest hearth with an empty queue once the
purse covers the caravan, the founding fee and six turns of the new hearth's
running costs, and only when a company of the realm can quote a road to the
site, so an unreachable seam never raises caravans turn after turn. One
expedition at a time, one route quote a turn; city-states make none. The turn
planner counts the expedition's hearth name, ground and founding fee before any
other caravan settles.

## Consequences

- Epic headline replay: at the end every seam any realm found is held by some
  realm, and eight of twelve realms hold a seam of at least one path (three
  before). Glass Tide held a seam of both paths at turn 150 and lost its Rune
  hearth to Sable Steppe by turn 250, before Arcane Theory and a qualified
  caster were ready. No realm sealed an Attunement.
- The measured gap to the third path moves: every seam of a lacking path that
  a realm has found now lies inside another realm's borders, mostly at peace.
  Holding one is a matter of conquest or cession, which the AI does not pursue
  as an objective; that is the next slice.
- Headline pacing moved far out of band under the rules 43 prices: Epic 328
  by Prosperity, Long 177 and Standard 127 by Attunement, because the AI now
  reaches a path priced when nothing could. [ADR 0069](0069-attunement-repricing.md)
  re-prices the working and the Epic Hearth Exchange as rules 44; under those
  prices the headline campaigns end on 369 / 300 / 203.
