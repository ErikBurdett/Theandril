# ADR 0070 — AI seam objective: a war for the missing path

**Status:** accepted, 2026-10-31. AI only; no rules, content or save change.
Evidence: [`docs/development/2026-10-31-ai-seam-objective/`](../development/2026-10-31-ai-seam-objective/README.md).

## Context

After ADR 0068 every seam a realm finds is held by someone, and the seam of
the path a realm still lacks lies, in every measured case, inside another
realm's borders — mostly a realm it is at peace with. The AI's warfare is
adjacent-opportunistic: an army besieges an unprotected hearth it happens to
stand beside and declares war to do so, but no planner marches an army toward
a hearth for a reason. A realm one seam short of the third path therefore had
no way to close the gap except by chance.

## Decision

`seamObjective` names, for a realm on the arcane road (it holds a seam and a
sealed working is within the rules), the nearest found seam of a lacking path
whose ground the realm remembers as another realm's, within twenty-four hexes
of its hearths, when that realm is not protected by an oath, a treaty or a
supply agreement. The turn planner treats it as an objective of war: the
holder's hearths within three hexes of the seam rank with an enemy victory
host among the invasion objectives, and while no such hearth is in sight the
seam itself draws every free field army within range, so the hearth is found
and, by the existing adjacent siege rule, the war declared and the siege laid
the moment a company can stand beside it. City-states make no such objective.
The holder is read from the realm's own memory of the land, so a seam claimed
since the realm last saw it is pursued only once it is seen again. One
objective at a time; nothing else in warfare, peace or counterplay changes.

## Consequences

- The first version named the objective for any realm on the arcane road
  (holding a seam, lacking a path). Headline pacing under it: Epic 420 and
  Long 327, both by Prosperity, against 369 and 300 by Attunement without it;
  the wars it opened cost the Long campaign its sealed working. That version
  is kept only as an experiment in the evidence packet.
- The accepted version adds the peace and caster conditions. Headline pacing is
  368 / 300 / 203 with the Long and Standard command counts identical to the
  rules 44 baseline: the objective never fires there. On Epic it fires for one
  realm (Sepulchral Synod) on three turns from turn 261, declaring three wars
  and laying two sieges, and takes nothing. It is a correct, bounded, tested
  capability with no measured effect on the headline seed.
- Glass Tide holds a seam of both paths on Epic by turn 368 without sealing;
  the scaled Epic price (9,600) is unmeasured against that realm's knowledge.
  A one-off probe at 4,800 is recorded in the packet.
