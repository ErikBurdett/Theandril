# ADR 0085 — Rules/save 55: the migration a crisis leaves behind

**Status:** accepted, 2026-10-31. A rule only; no canonical field and no
content change. Save 55. Evidence:
[`docs/development/2026-10-31-crisis-migration/`](../development/2026-10-31-crisis-migration/README.md).

## Context

M6 names migration beside epochs and crises. Rules 53 made shelter a realm's
answer to a crisis and rules 54 brought the crisis to the hearth; what the
crisis left behind was only what the toll had taken. People who have borne
a winter unsheltered and can see a sheltered hearth over the hill have an
obvious thing to do.

## Decision

- **When a crisis passes** — its term up, or the next age's crisis replacing
  it — every hearth of at least three people whose realm did not shelter
  loses one household to the nearest hearth of a realm that did, within
  twelve hexes (ties by id). A hearth with no such neighbour keeps its
  people; a hearth of two is never emptied further. The hearth that loses
  a household works one hex fewer. Both realms read the crossing in their
  journals.
- **Shelter is public.** The observation names the realms that have
  sheltered, as the crisis and the pacts are public, and the Realm affairs
  card says what the crisis's passing will take.
- **The AI counts the risk it can see.** A hearth of three or more with a
  known sheltered hearth of another realm within range adds a household's
  worth to the toll still to come; nothing is guessed about shelter the
  realm cannot see.
- **Save 55** carries no new field; a v54 envelope loads unchanged under
  the same pack.

## Consequences

- On the Epic headline course eight households cross and on the Long
  course seven, from realms that did not shelter to neighbours that did,
  and no end turn moves: headline 408 / 275 / 215, the other seeds and the
  proxies identical to rules 54 to the turn.
- A first version of the AI's valuation counted every large hearth at risk
  as soon as any realm had sheltered. Every realm then sheltered every
  crisis, no household ever crossed, and the Epic headline ended on 451:
  the rule was inert in measured play. The valuation was narrowed to
  hearths with a known haven in range before anything shipped.
- The migration's first implementation left a hearth working more land
  than it had people until the next land resolution; a campaign save in
  between was refused as invalid. The worked land is trimmed with the
  household now.
- No household moves between hearths of the same realm, no hearth is
  abandoned, and nothing moves for any reason but a crisis.
