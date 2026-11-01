# ADR 0103 — Rules/save 72: allies share their maps

**Status:** accepted, 2026-11-01. New canonical register (`mapShares`), one
command, no content. Save 72. Evidence:
[`docs/development/2026-11-01-map-sharing/`](../development/2026-11-01-map-sharing/README.md).

## Context

The diplomacy roadmap names map sharing among the negotiated terms still
missing. Alliances (rules 50) bind two realms to each other's wars but
give them nothing of each other's knowledge; each realm's explored ground
is a set already kept per realm, so an exchange needs no new geography.

## Decision

- **An exchange of remembered ground.** `shareMaps` gives each of two allies
  every hex the other has explored: remembered terrain, not present sight,
  not the other's land records. The pair may share again twenty turns on;
  the register keeps one record for each pair that shared, by pair, with
  the turn.
- **Read and set.** The observation lists, for each ally, whether maps can
  be shared now, when they last were and the exact blocker; Realm affairs
  shows a Share maps button under the alliance with the quote; the journal
  records what each ally learned.
- **Not yet planned.** The AI does not share maps. A planner that shared
  with the first ally it could, at peace or only at war, moved the headline
  Epic course from 388 to 406, past its band of 350–400, and a probe of that
  campaign found no misplay to fix: hearths, armies and orders ran alike and
  the course simply diverged. The observation does not yet show an ally's
  wars, so a doctrine of sharing only against a common enemy cannot be
  written; until it can, AI realms keep their own ground and accept a
  player's sharing.
- **Save 72** appends the register; older envelopes load with none and a
  campaign holding a share cannot be sealed under earlier rules. The content
  pack is unchanged.

## Consequences

- Headline pacing under rules 72: 388 / 296 / 198; the two other seeds
  339 / 344, 283 / 286, 191 / 196; proxies 370 / 478 / 305 / 207: every course identical to rules 71 since the AI does not share maps.
- With no AI sharing, every measured course and the chronicle pin at 56 are identical to rules 71; the rule is exercised by its sim and journey tests.
- An exchange is the whole explored set, both ways, allies only: no partial
  maps, no sale of maps to a stranger, no shared sight; the AI does not
  share. Joint war aims and the wider negotiated terms remain unbuilt.
