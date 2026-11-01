# ADR 0083 — Rules/save 53: crises of the ages

**Status:** accepted, 2026-10-31. New canonical register (`crises`), one
command, six original crises. Save 53. Evidence:
[`docs/development/2026-10-31-crises/`](../development/2026-10-31-crises/README.md).

## Context

M6 asks for epochs, crises and a living campaign. Rules 49 gave the campaign
its ages and rules 46–52 gave hearths their fortunes; nothing yet happened to
the whole world at once. The roadmap item carried "world crises, migration
and collapse remain accepted scope without a playable system." The ages are
the natural moment for a world-wide shock: they are read from facts of the
world that only grow, so a crisis bound to an age begins once, for everyone,
on a turn every replay agrees on.

## Decision

- **One crisis per age after the first.** When the world enters an age, one
  of that age's crises is drawn from the campaign seed and the age's index
  (`seed ^ 0x43524953 ^ index × golden ratio`), announced to every realm, and
  stands for its term. Two crises belong to each of the Age of Roads, Seams
  and Bids: the Grey Winter and the Toll Wars; the Glass Fever and the
  Tremors; the Fever of the End and the Long Dark. A crisis still standing
  when the next age begins ends with it.
- **A toll of every unsheltered hearth, each turn.** The blight is stored
  food or devastation at the hearth, or coin or knowledge off the realm per
  hearth. Every effect moves a field that already exists.
- **Shelter, once, for a price per hearth.** `shelterFromCrisis` pays the
  quoted coin and the toll passes the realm's hearths by for the rest of the
  term; the quote and its blocker are in the observation. The AI shelters
  when the toll still to come, valued as hearth events are valued, outweighs
  the price and the treasury can pay it.
- **Canonical and sealed.** `crises.active` (id, crisis, term, who
  sheltered) and `crises.past` (the last sixteen) are appended last in the
  canonical payload from save 53; older envelopes load with none, and a
  campaign that has had a crisis cannot be sealed under earlier rules.
- **Read everywhere.** The masthead names the standing crisis and its turns
  left under the age; Realm affairs carries the card with the toll, the
  term, the shelter quote and the blocker; the journal records the crisis
  begun, the shelter bought and the crisis passed.

## Pricing from measurement

As first built (terms of ten to twelve turns, shelter 20–35 coin a hearth)
the Epic headline campaign ended on 429, above its band, with the other
Epic seeds on 337 and 432, while Long (305) and Standard (223) held. Three
variants were measured on the Epic headline: Tremors without devastation
(407), halved tolls (409) and halved terms (374, with the other Epic seeds
326 and 405 and Long and Standard on 301 and 205). The halved terms were
adopted. At those terms no shelter price lay below the toll the AI values,
so the prices were set at about two-thirds of the term's toll (10, 10, 18,
6, 14 and 15 coin a hearth), and the shipped matrix reads Epic 366 / 367 /
385, Long 304 / 315 / 312, Standard 220 / 208 / 190: every course of every
seed inside its band for the first time this session. On the Epic headline
ten of twelve realms shelter, twenty-one times in all.

## Consequences

- The AI-watch chronicle journey's pinned victory turn moves 55 → 53: on
  turn 12 the Toll Wars come with the Age of Roads and two realms shelter,
  attributed headlessly in the packet. A scenario test of an enclosed-basin
  ferry colony (seed 74) held its first passenger under the first design
  and lands it again under the shipped one; the crisis of the Age of Roads
  reshapes a single realm's purse enough to change which colonist founds
  where.
- A seam-expedition caravan standing on its site now waits for the quoted
  founding fee instead of asking for a hearth the purse cannot pay; the
  crises exposed the refused order on one campaign.
- Crises are world-wide and the same for every realm; there is no regional
  crisis, no migration, no collapse, no crisis a realm's own actions bring
  on, and no crisis event at a hearth. Two per age is a first catalogue.
