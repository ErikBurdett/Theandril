# ADR 0073 — AI seam hearth watch

**Status:** accepted, 2026-10-31. AI only; no rules, content or save change.
Evidence: [`docs/development/2026-10-31-ai-seam-watch/`](../development/2026-10-31-ai-seam-watch/README.md).

## Context

Under ADR 0072 the Glass Tide of the Epic headline campaign retakes the hearth
holding its Rune seam and loses it again while its working runs. A replay of
every siege of a hearth whose borders hold a seam showed how such hearths are
lost: of fourteen sieges, Glass Tide's Rune seam hearth was besieged seven
times by companies of eight to forty strength against an empty hearth, the
walls wore down in three turns and the hearth fell to a storm the militia
alone could not refuse. The realm's home watch (ADR 0033) covered one or two
hearths chosen by their distance to the spare companies on the turn the watch
was made, long before any seam was held, and was never changed afterwards.
The theater is the canonical mechanism for keeping a guard somewhere; the AI
simply never told it which hearths mattered.

## Decision

`planSeamWatch`: once the realm holds a hearth whose borders hold a surveyed
seam, its own home watch, by the name the AI gave it, adopts that hearth, and
one spare company (the same single-formation spares the watch was made from,
with a bounded route review) for each hearth the watch is short, so the
canonical theater keeps a guard there. Hearths holding more paths come first;
the watch grows to at most the adoption bound of four hearths; its other
hearths, reserve hex and policy are kept; nothing is rewritten when every held
seam hearth is already watched; a theater under any other name is a player's
and is left alone.

## Consequences

- A guarded seam hearth is no longer besieged by a company weaker than its
  guard, so the opportunistic one-company sieges that took every seam hearth
  in the measured campaigns stop. Headline pacing under the rules 44 prices
  moved to 283 / 226 / 148, all by Attunement and all under their bands: the
  knowledge-rich Sepulchral Synod, which previously lost its Rune seam hearth
  on every pace, now keeps both paths and seals the working as soon as the
  price is met. That is the AI playing the rule, so the pace is re-priced
  deliberately in ADR 0074 rather than the watch weakened.
- The watch does not garrison every seam hearth at once: the theater dispatches
  by its own bounded rules, and a hearth whose guard has not arrived can still
  be taken, as the Epic replay under the watch shows for Glass Tide on turn 191.
- The rites of rules 40–42 are still worked only by a caster who happens to be
  lodged at the besieged hearth; a warden for every seam hearth is not built.
