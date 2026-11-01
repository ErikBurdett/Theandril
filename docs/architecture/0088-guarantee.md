# ADR 0088 — Rules/save 58: a patron stands for its client

**Status:** accepted, 2026-10-31. A rule only; no new register, no content
change. Save 58. Evidence:
[`docs/development/2026-10-31-guarantee/`](../development/2026-10-31-guarantee/README.md).

## Context

Patronage (rules 22) bound a client to tribute and a patron to a subsidy,
and kept the two from each other's throats; it promised the client nothing
against a third realm. Gate G names guarantees. The alliance call (rules 50)
and the kept call that a partner's peace settles (rules 56) are exactly the
machinery a guarantee needs.

## Decision

- **A war declared on a client calls its patron.** The patron enters the war
  at once, unless an oath, a binding peace, a supply agreement or an alliance
  with the attacker binds it, in which case the call goes unanswered and the
  patron, the client and the attacker all read why. A patron already at war
  with the attacker, or itself the attacker, is not called; the oath already
  keeps a patron from its own client.
- **The call is kept.** It is recorded in the alliance register like an
  ally's, so the client's peace with the attacker ends the patron's war under
  the same truce, and the patron's own peace releases it.
- **The AI counts it.** A realm declaring war counts the target's patron
  among its enemies for the rest of the batch, as it counts the target's
  allies.
- **Realm affairs says so** in the patron's and the client's lines.
- **Save 58** carries no new field; a v57 envelope loads unchanged.

## Consequences

- On the Epic headline course eighteen guarantees are answered and nineteen
  go unanswered for a binding reason; on Long nineteen and thirteen. Headline
  pacing 411 / 336 / 209, the other seeds 351 / 313, 285 / 246, 218 / 175,
  proxies 358 / 451 / 302 / 204.
- A patron is called whatever its strength or distance; it may be far from
  the war it enters. A client's peace ends the patron's war whatever the
  patron's own grievances. Passage rights and joint war aims remain unbuilt.
