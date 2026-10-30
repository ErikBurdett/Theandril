# ADR 0067 — AI surveys the glass

**Status:** accepted, 2026-10-30. AI only; no rules, content or save change.
Evidence: [`docs/development/2026-10-30-ai-glass-surveys/`](../development/2026-10-30-ai-glass-surveys/README.md).

## Context

A replay of the Epic headline campaign under rules 43 showed the AI paying for
312 arcane surveys and finding 12 seams: 300 surveys landed on empty ground,
and eight of twelve realms made between four and forty-one surveys without a
single find. The first-seam planner surveyed from any company near a hearth on
a six-turn cadence, with no regard for where Ashfall glass — the only ground a
seam can lie under, visible since rules 39 — actually was. Three realms had no
glass within fifteen hexes of any hearth and surveyed anyway. The world holds
eleven seams over the two existing paths; a sealed working needs one of each,
so finding seams is the gate to the third victory path in AI play.

## Decision

`planArcaneSurvey` pays for a survey only where it can find something: fresh
glass — in sight, passable, not within a survey's reach of ground the realm
already surveyed or a seam it found — must lie within the survey's own reach
(two hexes) of the company that pays, and the company whose survey covers the
most such glass goes first. A company standing on fresh glass was marched there
for this and surveys at once; otherwise the realm keeps its six-turn cadence,
so surveys stay occasional bets from surplus. Caravans never survey, and no
company on a road or in a siege is diverted. `planGlassApproach`, which marched
only realms that already held a seam, now also marches a realm with none to
glass within four hexes of a free company. A realm that has found a seam of
every path surveys no further: holding a found seam is a matter of claims or
conquest, not of more surveying. The first-seam and further-seam reserves are
unchanged.

## Consequences

- Headline campaigns (seed 20260905, twelve realms): surveys 170/172/151 for
  Epic/Long/Standard against 312/271/146, finds 19/21/14 against 12/9/5.
  Campaign length 354/316/224 against 385/343/229, each nearer its target.
  Empty surveys off glass fall from about two hundred to a few dozen.
- An intermediate version of this change, before surveys stopped once every
  path was found, ended the four-realm proxy Epic campaign with Reedbound
  Council sealing an Attunement at turn 332: the first organic third-path seal
  observed. The final version's headline and proxy campaigns still resolve by
  Prosperity; the measured gap to the third path is now holding a found seam
  of the missing path, which lies in another realm's borders.
- Two save defects surfaced by the changed campaigns are repaired in
  `packages/sim`: a ward in its last round (no turns remaining) was rejected on
  load, and a battle snapshot of a Waykeeper with a learned path deepening was
  validated against rules 16. Both now load; both have regression tests.
- Arcane research fell to 5/6/3 discoveries from 9/9/6 in the same campaigns,
  because the campaigns end sooner and different realms win. Not tuned.
