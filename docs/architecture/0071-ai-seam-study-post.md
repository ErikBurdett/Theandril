# ADR 0071 — AI study post: a Waykeeper studies where a seam is held

**Status:** accepted, 2026-10-31. AI only; no rules, content or save change.
Evidence: [`docs/development/2026-10-31-ai-seam-study-post/`](../development/2026-10-31-ai-seam-study-post/README.md).

## Context

In the Epic headline campaign under ADR 0070, Glass Tide held a seam of both
paths from turn 80, finished two of three Arcane Theory discoveries by turn
90, and then sat for 270 turns with a first-degree Waykeeper lodged at its
capital and 12,725 unspent knowledge, starting a Hearth Exchange on turn 362
instead of a working. The caster's experience stayed at zero the whole time.
Rules 39 pays study experience only to a Waykeeper lodged in a hearth whose
borders hold a surveyed seam; the AI's study post (ADR 0057) lodged the
caster at a hearth that could host the working — an archive hearth — which
need not hold a seam. Without experience the caster never deepened, never
qualified, and the realm never bought the third discovery it buys only once a
qualified caster exists.

## Decision

The study post is a hearth whose borders hold a seam: one that could also host
the working if there is one, else the seam hearth holding the most paths. A
Waykeeper lodged at any seam hearth is left there; one lodged where nothing
can be studied is no longer held in place, and while no caster studies the
realm raises a second Waykeeper (at most two) for the seam hearth. The
existing promotion pass buys the deepening once twenty-four experience is
earned, and the existing completion rule then buys the last discovery.

## Consequences

- Epic headline: the Glass Tide Waykeeper, lodged at a seam hearth from its
  appointment, reaches the second degree of Flame by turn 120 and of Rune by
  160, the realm finishes Arcane Theory by turn 110, and from then on the
  working is ready but for its price. By turn 300 the realm has lost the hearth
  holding its Rune seam to war and the price is met on 330; it never seals.
  Headline pacing is unchanged at 369 / 300 / 203.
- The measured gap moves again: not reaching readiness, but keeping a seam
  hearth through the wars of a long campaign, or taking it back. The bounded
  seam objective (ADR 0070) only fires at peace, which Glass Tide reaches on
  turn 350 of 369.
