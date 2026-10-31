# ADR 0079 — Rules/save 49: campaign epochs

**Status:** accepted, 2026-10-31. Content and a derived reading of the world;
no canonical field. Save 49 freezes the rules 48 pack. Evidence:
[`docs/development/2026-10-31-epochs/`](../development/2026-10-31-epochs/README.md).

## Context

M6 asks for visible epoch progression with requirements and consequences.
Hearth events and their chains gave the campaign local fortunes; nothing yet
named where the whole world stood. The masthead has read "The age of
fracture" since the first build, a fixed phrase.

## Decision

- **Content.** `EPOCHS`: four ages in order — Fracture (the start), Roads
  (two hearths ever founded per realm, or the pace's turn), Seams (a seam
  found, or the pace's turn), Bids (a public bid opened). Each has a name and
  a description. Validation requires the first and only the first to be the
  start.
- **Derived, not kept.** Every condition reads a fact that only grows: the
  turn; hearths plus ruins (a razed hearth leaves a ruin, a resettled ruin a
  hearth, so the count never falls); whether any seam has ever been surveyed;
  whether any project has ever started. The world's age is therefore the
  last age in order whose condition holds, computed from the state whenever
  it is asked for: no save records it, no migration invents it, a replay or
  an envelope sealed under older rules reads the same age from the same
  world, and an age never ends. The first design kept the age as a canonical
  field advanced one age per turn; it broke the invariant that an older
  envelope round-trips to the same modern hash whenever the kept age lagged
  the facts, and was replaced.
- **Announcement.** Every applied command compares the age before and after
  itself and announces each age the world entered, to every realm, in order
  (`epoch_begun`), so a bid that opens the last age is announced by the
  command that opened it, and the turn's close announces the ages its turn
  number brings. The chronicle titles such a turn's chapter after the age.
- **Consequences in play.** Six hearth events belong to the later ages
  (`epoch` on a template: a dispute at the toll and wardens for the road in
  the Age of Roads, rumours of glass and pilgrims to the seam in the Age of
  Seams, the fever of the bid and wagers on the future in the Age of Bids)
  and are drawn only once the world has reached them. The masthead names the
  age; the observation carries it with its index.
- **Save.** The rules 48 pack is frozen as `4847de40`; a v48 envelope loads
  unchanged under the new pack.

## Consequences

- Headline pacing **419 / 293 / 211** on the headline seed, with the two
  other seeds at Epic 352 / 340, Long 270 / 274 and Standard 193 / 193, no
  refused order; proxies 333 / 365 / 294 / 189. The Epic headline course sits
  nineteen turns above its band while the other two Epic seeds sit inside it
  and the three-seed mean (370) sits in the middle; every catalogue change
  since rules 46 has re-drawn each course by twenty to forty turns. This is
  recorded as a drift of one course, not re-priced; the next re-pricing, if
  one comes, should be judged on the three seeds together.
- Ages change no price and no rule of their own; their consequences are the
  events they admit and the chapters they title. Crises, migration and
  collapse remain unbuilt.
