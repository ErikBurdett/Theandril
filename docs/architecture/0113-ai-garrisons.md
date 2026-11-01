# ADR 0113 — AI garrisons: holding a conquered hearth whose lanes may rise

**Status:** accepted, 2026-11-01. AI and observation only; no rule, save
field or content seal moves. Evidence:
[`docs/development/2026-11-01-ai-garrisons/`](../development/2026-11-01-ai-garrisons/README.md).

## Context

Restoration (rules 80, [ADR 0112](0112-restoration.md)) returns a conquered
hearth to its founder when its unrest reaches a hundred with no army
standing in it, and recorded that the AI held no garrison against it and
did not read the warning. The living-campaign roadmap asks for rebellion
with AI response; the counterplay the rule offers is a garrison, and the
AI's only answer was lean taxes at sixty unrest.

## Decision

- **The observation names the founder whether or not the hearth is
  garrisoned.** `rising` on the holder's own unrest record is the founder a
  hearth's lanes may rise for (the hearth is conquered, the founder still
  holds a hearth and it is not the holder's capital), and `garrisoned` says
  whether an army stands in it; the restoration itself still needs both.
  The condition panel reads *may rise for X* or *garrisoned against X*.
- **A garrison is kept or sent.** `packages/ai/src/garrisons.ts` reads the
  holder's own unrest records: from fifty unrest, a land company standing
  in a hearth that may rise is held there for the turn, and when none
  stands there the nearest free land company (not held by another planner,
  not besieging, not carried, not already routed, with a road the rules say
  can be queued) is ordered in by `queueMovement` and held; at most two such
  orders a turn, city-states excepted. The orders travel with the turn
  beside the warden's road.

## Consequences

- Headline pacing: 384 / 291 / 205; the two other seeds
  352 / 351, 289 / 282, 197 / 200; proxies 368 / 407 / 382 / 209. The AI-watch chronicle journey’s pin at 57 holds and the campaign is unchanged.
- The AI still does not ease taxes on a rising hearth sooner than on any
  other, and sends no company it does not have; a realm whose every
  company is besieging or held loses the hearth as before.
