# ADR 0099 — Rules/save 68: companies hired from city-states

**Status:** accepted, 2026-11-01. New canonical register (`hires`), one
command, no content. Save 68. Evidence:
[`docs/development/2026-11-01-hires/`](../development/2026-11-01-hires/README.md).

## Context

The independent powers of the scope include mercenaries and trade
communities with distinct contracts. The city-states (rules 21 onward)
trade goods with their patrons (rules 60) and can be pressed for tribute at
the gate (rules 61); a company bought at the same gate is the first
contract a realm can make with a city-state for a company rather than coin
or goods, and needs no new power on the map.

## Decision

- **A company for a price.** `hireCompany` lets a realm's land company
  standing beside a city-state's hearth, the two at peace and the hearth
  not besieged, buy a company of Ash pike for a sum set by the city's size
  (thirty coin and four per population). The coin goes to the city, the
  company is raised at the gate beside the buyer by the campaign's own army
  raiser with no movement this turn, and is an ordinary company of the
  realm from then on. The city sells to the same realm once every ten
  turns and thinks a little better of a paying customer.
- **Quoted at the gate.** The observation lists, for every own land
  company beside a city-state hearth in sight, the price and the exact
  blocker; Realm affairs shows the quote beside the tribute demand with a
  Hire button. City-states hire from no one.
- **Planned.** An AI realm at war hires the cheapest open quote once a turn
  when it can keep sixty coin after the purchase; a realm at peace or
  short of coin does not.
- **Save 68** appends the hires in order; older envelopes load with none
  and a campaign holding one cannot be sealed under earlier rules. The
  content pack is unchanged, so v67 envelopes carry the same hash.

## Consequences

- Headline pacing under rules 68: 380 / 296 / 197; the two other seeds
  344 / 336, 276 / 266, 190 / 191; proxies 327 / 476 / 301 / 201: every course identical to rules 67, the headline in band and the two other Epic seeds just under it as before.
- The AI-watch chronicle journey’s pin at 56 holds and every measured course is identical to rules 67: no AI realm in the measured campaigns stood at a city-state gate at war with coin to spare, so the AI side of the rule is proven by its unit test only.
- One company kind at one price formula; no contracts that outlast the
  sale, no mercenary bands on the map, no hire at a hearth of another
  realm. The wider roster of clans, pirates, cults and nomads remains
  unbuilt.
