# ADR 0080 — Rules/save 50: alliances

**Status:** accepted, 2026-10-31. New canonical register (`alliances`), three
commands, no content change. Save 50. Evidence:
[`docs/development/2026-10-31-alliances/`](../development/2026-10-31-alliances/README.md).

## Context

Gate G had peace, binding truces, patronage and supply access, and nothing
that bound two realms to each other's defence. The scope names alliances,
guarantees and joint wars. A defensive pact is the smallest of those that
changes who fights whom, and it has to be read by the AI's war-making, which
is adjacent-opportunistic and declares war in the middle of a batch of
orders.

## Decision

- **A pact between equals.** `proposeAlliance` offers a realm a defensive
  pact of ten to sixty turns; `respondAlliance` swears or refuses it;
  `renounceAlliance` ends it, lawfully after its term and as a remembered
  breach before. Offers expire after three turns; pacts end with their term.
  A realm holds at most three pacts and offers; a city-state swears none;
  patron and client do not ally, and allies do not take each other as
  clients; realms at war do not ally. Pacts are public, offers are seen by
  their two parties with the acceptance blocker quoted.
- **Allies do not make war on each other**, in the declaration itself.
- **A war declared on an ally is answered.** When a realm declares war on
  another, every ally of the target enters the war against the attacker at
  once — unless an oath, a binding peace, a supply agreement or an alliance
  with the attacker binds it, in which case the call goes unanswered and the
  ally, the target and the attacker all read why. An alliance never calls an
  ally into a war its partner opens.
- **AI.** Allies are protected like oath-bound realms: never attacked,
  besieged or made an objective. A realm pressed by a war (exhausted
  companies, or more enemy strength in sight than its own) and holding no
  pact courts the strongest known free realm every ten turns; a realm at war
  with fewer than two pacts accepts an offer, a realm at peace or bound by
  oath refuses. When the AI declares war in a batch it counts the target's
  allies as enemies at once, so no later order in the batch is refused as
  already at war. The first appetite (any war, any stronger partner, up to
  three pacts each) swore 146 pacts on the Epic headline and moved every pace
  of that seed out of band; the pressed appetite swears ten.
- **Save.** The register joins the state under rules 50; older envelopes
  load with none; sealing a campaign that holds any under an older version
  is refused. No content changed, so the pack hash is unchanged.

## Consequences

- Headline pacing **359 / 314 / 222**; the two other seeds 341 / 339,
  263 / 280, 196 / 196; every campaign in its band, no refused order;
  proxies 307 / 388 / 333 / 189. Ten, six and eight pacts are sworn on the
  three headline paces, each pact answering a war somewhere.
- Guarantees, joint war aims, shared peace and the end of a war for an ally
  who entered it are not built: an ally called in makes its own peace.
