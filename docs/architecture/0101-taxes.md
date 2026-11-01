# ADR 0101 — Rules/save 70: taxes

**Status:** accepted, 2026-11-01. New canonical register (`taxes`), one
command, no content. Save 70. Evidence:
[`docs/development/2026-11-01-taxes/`](../development/2026-11-01-taxes/README.md).

## Context

The supply-and-trade roadmap asks for taxation and economic policy. A realm
has had no lever on its coin but what it builds and conquers; a hearth's
devastation mends five points a turn whatever the realm does. A tax rate is
the smallest policy that trades one against the other, and the hearth's
yield sum and the turn's mending are both single places to apply it.

## Decision

- **Three rates.** `setTaxRate` sets a realm's taxes lean, steady or heavy.
  Lean taxes take three quarters of every hearth's coin, applied last in
  the hearth's yield sum, and mend its lanes two points faster each turn it
  is not besieged; heavy taxes take a quarter more and wear the lanes by
  two; steady taxes take what they always took. City-states keep steady
  taxes. The register holds one record for each realm that departs from
  steady; setting steady clears it.
- **Read and set.** The observation carries the realm's rate, its coin
  percentage, its drift and a sentence; Realm affairs shows the sentence and
  three buttons with the current rate pressed; the journal records a change.
- **Planned.** An AI realm sets heavy taxes when its turn runs short and its
  treasury is under sixty coin, lean ones when it holds four hundred coin,
  runs ahead and has a scarred hearth, and steady otherwise; one change a
  turn, only when the rate would change.
- **Save 70** appends the register; older envelopes load with steady taxes
  and a campaign with any other rate cannot be sealed under earlier rules.
  The content pack is unchanged.

## Consequences

- Headline pacing under rules 70: 388 / 296 / 198; the two other seeds
  345 / 344, 309 / 286, 191 / 196; proxies 370 / 478 / 293 / 207: every headline course in band and the two other Epic seeds just under it, risen from 344 / 336.
- The AI-watch chronicle journey’s pin at 56 holds: no realm of that short campaign changes its taxes. The headline campaigns do, and move within their bands.
- Taxes touch coin and devastation only: no unrest, no legitimacy, no
  per-hearth rate, no tariff on trade. Recurring trade routes, resource
  processing and the wider economic policy remain unbuilt.
