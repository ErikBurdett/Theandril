# ADR 0100 — Rules/save 69: the second city-state roster

**Status:** accepted, 2026-11-01. Content only; no canonical field. Save 69
freezes the rules 67–68 pack. Evidence:
[`docs/development/2026-11-01-city-states-ii/`](../development/2026-11-01-city-states-ii/README.md).

## Context

The scope asks for at least forty-eight minor powers or templates; twenty-four
city-states were authored under rules 21, one for each culture, and every
campaign since has drawn its independent neighbours from the same two dozen.
A campaign's seats are drawn from the roster by the campaign seed, so the
roster cannot simply grow without changing which city-states every older
seed seats.

## Decision

- **Twenty-four more city-states**, one more for every culture, each with its
  own name, banner colour, motto, history and trade good: Kilnwater,
  Beaconfall, Threewells, Lampmoor, Longgrass, Ashcandle, Crossmoot,
  Sporeholt, Fenlock, Reedgate, Shanty Deep, Glassmere, Saltreach, Rimefast,
  Anvilgate, Wardstone, Halfmeasure, Undershelf, Ossary, Marginhold,
  Vesperlight, Cragperch, Sluicehead and Paymast. Forty-eight in all; the
  setup seats up to forty-eight within the sixty-four-seat limit.
- **Drawn by rules.** A campaign draws its city-states from the roster its
  rules know: the first twenty-four under rules 21 through 68, so every
  older seed seats exactly what it seated before, and all forty-eight from
  rules 69. A request for more city-states than the rules know is refused.
- **Sealed by rules.** The second roster carries `sinceRules: 69`; the
  first twenty-four carry no field and hash as they always did, so every
  frozen pack keeps its seal. A trade good is sealed no earlier than its
  city-state. A campaign seating a second-roster city-state cannot be sealed
  under earlier rules.
- **Save 69** upgrades v68 envelopes unchanged under the new pack.
- **Created under the current rules.** `createGame` creates a campaign under
  `CURRENT_RULES` when no rules are asked for, where it took 40 before; the
  roster gate is the first creation-time choice to branch above 40, and
  nothing else at creation does.

## Consequences

- Headline pacing under rules 69: 380 / 296 / 197; the two other seeds
  344 / 336, 276 / 266, 190 / 191; proxies 327 / 476 / 301 / 201: every course identical to rules 68 because the measured campaigns seat no city-states.
- The AI-watch chronicle journey’s pin at 56 holds and every measured course is identical to rules 68, since none of the measured campaigns seats a city-state; the roster is exercised by its content, sim and journey tests.
- The city-states remain one kind of independent power: single hearths
  with a culture's art and roster, a trade good, tribute and hire at the
  gate. Clans, pirates, cults and nomads with their own relations remain
  unbuilt.
