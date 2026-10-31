# ADR 0076 — A ferry ranks only landings on its own water

**Status:** accepted, 2026-10-31. AI only; no rules, content or save change.
Evidence: [`docs/development/2026-10-31-hearth-events/`](../development/2026-10-31-hearth-events/README.md).

## Context

The enclosed-sea journey (a Mire Courts ferry founding a colony across a
fully charted inland basin) failed as soon as hearth events shifted the
campaign's course by a few turns. The trace showed the loaded ferry in a
five-cell basin the sea-knowledge index had already proved enclosed, with a
viable shore beside it, holding its passengers for a hundred turns. The
landing planner ranked every viable shore of the known land by score; the
four best lay across the map, unreachable from that basin, and the bounded
route budget was spent on them every turn, so the one shore the basin touched
was never tried. The baseline course landed only because its shore count
happened to rank that shore in the top four.

## Decision

Before a landing is ranked, its water must be the ferry's: a shore whose
adjacent water the index knows to lie in a separate basin from the fleet's is
left out. Unknown relations are kept. The index is already bounded and
cached, so the check adds no new search.

## Consequences

- The enclosed-sea journey lands on turn 56 and founds on 65 of the events
  course, as the baseline did; the naval, overseas and navigation tests are
  unchanged.
- A ferry in a proved-enclosed basin now spends its route budget on that
  basin's shores. A ferry on open water with uncharted relations behaves as
  before.
