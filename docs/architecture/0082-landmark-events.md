# ADR 0082 — Rules/save 52: landmark events

**Status:** accepted, 2026-10-31. Content only; no canonical field. Save 52
freezes the rules 51 pack. Evidence:
[`docs/development/2026-10-31-landmark-events/`](../development/2026-10-31-landmark-events/README.md).

## Context

Rules 51 put twelve landmarks into the world that yield and are read, with
no event, reward or interaction beyond their yield. The hearth event system
(rules 46–49) already draws templates by a condition read from canonical
state, so the smallest interaction a landmark can have is a condition of its
own: an event that comes only to a hearth whose borders hold one.

## Decision

- **A `landmark` condition.** It holds at a hearth whose own claimed land
  includes a landmark's hex, read from the derived placement; no survey is
  needed to know a landmark, unlike a seam.
- **Six templates from rules 52**, one of them a chain: pilgrims at the old
  place, relic hunters (whose licensed dig brings *the find* four turns
  later), a keeper for the place, the stones moved, and a festival at the old
  place. They are original, name the hearth, and trade coin, food, knowledge
  and devastation as the earlier catalogues do. A landmark event belongs to
  rules 52 or later; the validation refuses the condition on an earlier
  template.
- **Save 52** upgrades v51 envelopes unchanged, asserting the rules 51 pack
  hash and that no pending event names a rules 52 template.

## What was tried and not shipped

An AI planner that claimed a landmark's hex outright ahead of improving
worked land, and otherwise carried a hearth's border one legal hex toward a
landmark within three hexes, was built, tested and measured. A probe over the
whole Long headline campaign recorded no paid claim of any hex by any AI
realm, and the Epic course three: AI realms grow their land through
commissions and ordinary growth, so the planner never ran in measured play
and the pacing was byte-identical with and without it. Those realms still
come to hold twelve of twenty-four landmarks on the Long course and fourteen
on Epic by ordinary growth. The planner was removed rather than shipped
inert; the probe is kept in the packet.

## Consequences

- Headline pacing under rules 52: Epic 394, Long 356, Standard 216, all by
  Prosperity; the two other seeds 381 / 332, 260 / 284, 197 / 201; proxies
  326 / 420 / 300 / 189. The Epic headline course is back inside its band
  (413 under rules 51). The Long headline course moves from 320 to 356 while
  the two other Long seeds are unchanged to the turn: a frozen-pack run of the
  same code under rules 51 ends on 320, so the move is the re-rolled event
  draws of a larger catalogue on one course, the same class as every earlier
  catalogue change.
- Landmark events are rare: two or three per headline campaign, because few
  hearths hold a landmark. The catalogue stands at forty-five of the scope's
  one hundred and fifty.
