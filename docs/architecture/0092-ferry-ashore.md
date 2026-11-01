# ADR 0092 — AI: a held ferry puts its passengers ashore

**Status:** accepted, 2026-10-31. AI only; no rules, content or save change.
Evidence: [`docs/development/2026-10-31-ferry-ashore/`](../development/2026-10-31-ferry-ashore/README.md).

## Context

The naval planner loads a caravan onto a ferry and sails it toward a viable
landing; where no landing is charted it holds the passengers, because an
unknown boundary or an exhausted search is no proof that none exists. In a
proved, fully charted basin whose every shore lies inside the realm's own
settlement spacing there is nothing left to chart, and the ferry held its
passenger for the rest of the campaign: on the tiny map of seed 74 the
enclosed-basin scenario's first caravan sat loaded from turn 20 to turn 101
while the realm raised others. Three slices this session moved that
scenario's seed to keep it green.

## Decision

A ferry carrying a founder in a basin the sea knowledge proves enclosed,
with no viable shore of its own and no landing, charting or route left to
try, puts its passengers ashore on the best beach of that basin they may
land on; the caravan then goes on by land under the ordinary planners.
Unknown boundaries never authorize this: only a proved basin does, and the
hold for an uncharted sea stands as it was.

## Consequences

- On seed 74 the loaded caravan is ashore within six turns of embarking.
  The enclosed-basin crossing scenario keeps every assertion and moves to
  seed 83, where a viable landing exists at embarkation and the ferry sails
  and lands as before.
- No headline campaign has a held ferry: every pacing figure is identical
  (395 / 302 / 203; 338 / 338, 268 / 287, 185 / 199; proxies
  307 / 431 / 302 / 181), the Epic headline makes thirty-three ordinary
  landings and never puts a passenger ashore this way.
- A basin whose shores open later, as the realm's spacing changes, is not
  waited for; the caravan founds by land instead.
