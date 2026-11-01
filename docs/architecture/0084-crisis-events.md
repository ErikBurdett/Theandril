# ADR 0084 — Rules/save 54: the crises' own events

**Status:** accepted, 2026-10-31. Content only; no canonical field. Save 54
freezes the rules 53 pack. Evidence:
[`docs/development/2026-10-31-crisis-events/`](../development/2026-10-31-crisis-events/README.md).

## Context

Rules 53 made a crisis a toll and a shelter quote: a number every realm
reads the same way. A crisis that also comes to a hearth as a story with a
choice is what the hearth event system was built for, and each crisis has
an obvious one: the seed grain in the Grey Winter, a toll bar at the
hearth's own gate, the clerks sick with the Glass Fever, a cracked cistern,
a run on the market, ash on the standing crop.

## Decision

- **Six templates, one per crisis**, with the condition `crisis` and the
  crisis they belong to; the validation pairs them. Forty-five templates
  become fifty-one; the rules 53 catalogue is frozen.
- **The crisis brings its event.** A `crisis` event is never drawn: as the
  crisis begins, `offerCrisisEvents` offers it to every realm whose event
  slot is free, at its first eligible hearth, with the usual five-turn
  answer and the crisis named in the offer. A realm already answering an
  event is not offered it, and the offer does not reset the realm's
  ordinary cadence; the pending id carries a `.crisis` suffix so it never
  reuses a draw's id. Because the templates are never drawn, the larger
  catalogue re-rolls nothing.
- **The shelter is issued first in the AI's batch**, so no quoted order
  spends the coin it was planned on; a refused shelter on seed 20260907
  found the race.
- **Save 54** upgrades v53 envelopes unchanged, asserting the rules 53 pack
  and that no pending event names a rules 54 template.

## Consequences

- A first version let the crisis events be drawn during the crisis window
  with a high weight; measured over both headline courses not one was ever
  offered, because a window of four to six turns rarely holds a draw, while
  their presence in the eligible set re-rolled the draws inside the windows
  and moved the Epic headline to 423. It was replaced before shipping.
- Headline pacing under rules 54: Epic 408, Long 275 and Standard 215, all
  three by Attunement for the first time on this seed; the two other seeds
  344 / 313, 308 / 246, 211 / 176; proxies 353 / 448 / 323 / 204. The Epic
  headline course sits eight turns above its band with the other two below
  it, and the Long courses lie under their target: the crises' events reach
  every realm three times a campaign, and where they fall on a course moves
  it either way. Recorded as the spread of a world that now changes, judged
  on the three-seed matrix (Epic 355, Long 276, Standard 201 on average).
- The AI-watch chronicle journey's pin moves 53 → 56, attributed.
