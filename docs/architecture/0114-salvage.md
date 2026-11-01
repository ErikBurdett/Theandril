# ADR 0114 — Rules/save 81: salvage from the ruins

**Status:** accepted, 2026-11-01. One optional field on the ruin; no command
or content. Save 81. Evidence:
[`docs/development/2026-11-01-salvage/`](../development/2026-11-01-salvage/README.md).

## Context

The scope asks for discoveries, ruins and lairs with rewards, and the
authored-breadth roadmap for ruins built beside their real consumers. A
razed hearth leaves ruins that can be resettled (rules 15) and nothing
else; no company had a reason to stand on them. One salvage, taken once,
is the smallest reward the ruins can hold that a player reads, walks for
and loses to a rival.

## Decision

- **One salvage per ruin.** At the turn's end, after the sieges, the realm
  whose land company stands on untouched ruins takes twenty coin and ten
  knowledge, and the ruin records the realm that took it; two realms
  standing there together yield to the earlier faction id. Resettling the
  ruins removes them as before, salvaged or not.
- **Read in the hex inspector.** The ruin inspection says whether the
  salvage is untouched, and names the realm that took it once it is taken;
  the journal records the taking.
- **Walked for.** A free AI land company within six hexes of untouched
  ruins walks toward them, below an enemy depot or a visible enemy in its
  scoring; a company standing on them stays until the salvage is taken.
- **Save 81** adds the optional field; a v80 envelope loads with none and
  may not name one, and a campaign with salvaged ruins cannot be sealed
  under earlier rules. Under rules 80 the ruins give nothing.

## Consequences

- Headline pacing under rules 81: 384 / 291 / 205; the two other seeds
  352 / 351, 289 / 282, 197 / 200; proxies 368 / 407 / 382 / 209. The AI-watch chronicle journey’s pin at 57 holds and the campaign is identical to rules 80.
- The salvage is a fixed sum, not the razed hearth's worth; ruins hold no
  discovery, lair or event, and a resettled ruin's salvage is simply gone.
