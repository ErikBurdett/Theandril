# ADR 0078 — Rules/save 48: hearth event chains

**Status:** accepted, 2026-10-31. Content, one optional key on a pending
event, no new register. Save 48. Evidence:
[`docs/development/2026-10-31-hearth-event-chains/`](../development/2026-10-31-hearth-event-chains/README.md).

## Context

M6 asks that escalation create choices, not only costs. The twenty-four
templates of ADR 0075 and ADR 0077 each resolve in one answer; nothing a
realm chose came back to it. A chain — an answer that schedules what follows
at the same hearth — gives an event a second and third act whose shape
depends on the first answer: prevention paid now, or consequences later,
and sometimes recovery.

## Decision

- **Content.** An answer may carry `followUp: { templateId, afterTurns }`.
  A `chained` condition marks templates no draw can reach; they are offered
  only as follow-ups. Validation requires every follow-up to name a chained
  event of the catalogue (never itself), every chained event to be reached by
  some follow-up, and no template before rules 48 to schedule one. Three
  chains of three: sickness in the lanes (close the lanes, or let it run into
  the spread and the dying season), riders on the ridge (pay, muster, or bar
  the gates and meet the strike, a sally and the riders driven off) and the
  river rising (levees that hold and give silt or measure, or a flood).
- **Simulation.** Settling an answer applies its effects and, when it names a
  follow-up, adds a pending event at the same hearth with `turn` set ahead
  and `chainedFrom` naming the event it follows. A pending event that lies
  ahead is not observed, not answerable and does not lapse; it holds the
  realm's one slot, so no random draw interrupts a chain. On its turn it is
  offered with the event it follows named; it then lapses, chains and seals
  like any other. Validation bounds the lead to ten turns and requires an
  event it follows. Its id is the offer turn and the realm's seat, as a drawn
  event's would be.
- **Observation and AI.** A quoted answer names its follow-up and how many
  turns away it comes; the panel says so. The AI values an answer by its own
  effects plus the best the follow-up can then be answered for, discounted
  by a fifth, two steps deep, reading the public catalogue.
- **Save.** The rules 47 pack is frozen as `c1e05b8e`; a v47 envelope loads
  unchanged; a scheduled rules 48 event cannot be sealed under an older
  version.

## Consequences

- Headline pacing **385 / 306 / 211**, all Prosperity, every campaign in its
  band, no refused order; proxies 345 / 469 / 311 / 193, within their bounds.
  The AI-watch chronicle journey's pin moves 56 → 55, attributed to the same
  turn-40 draw.
- Thirty-three templates; the lead is bounded, the catalogue is public, and a
  chain never outlives the hearth it belongs to. Epochs and world crises are
  still not built.
