# ADR 0098 — Rules/save 67: the ember host, a summoning rite

**Status:** accepted, 2026-10-31. Content and one rite kind; no canonical
field. Save 67 freezes the rules 66 pack. Evidence:
[`docs/development/2026-10-31-ember-host/`](../development/2026-10-31-ember-host/README.md).

## Context

Three strategic rites exist: the seam warding and the ward breaking of the
Rune path, the seam kindling of the Flame path. The research roadmap names
summons among what magical progression still lacks, and the Flame path has
one working from a hearth where Rune has two. A summoning needs no new
register: a company is a company, raised the way a hearth raises one.

## Decision

- **The ember host**, a fourth rite and a fourth kind, `summoning`: a
  Flame-gifted Waykeeper lodged in a hearth that holds a Flame seam calls a
  company of Oath guard up out of the seam-fire at eight ashglass. The host
  stands at the hearth at once with no movement left this turn and is an
  ordinary company of the realm from then on, paid and led like any other.
  An occupied hearth raises nothing; a kindled or warded hearth still may,
  since the summoning binds nothing. The rite needs Contained ember
  projection, as the kindling does.
- **Raised by the campaign.** `performRite` takes the campaign's army raiser
  for a summoning, so the simulation's own recruitment path places the
  company, indexes it and extends the realm's sight; the rite module keeps
  no second way to make an army.
- **Read and planned.** The character sheet quotes the rite with its cost,
  "at once" and the hearth; the AI performs it at a besieged hearth as the
  rite left once the standing rites are up, and only where no company of
  the realm already stands, so a siege draws one host rather than the
  stockpile; the observation carries each rite's kind for that.
- **Save 67** upgrades v66 envelopes unchanged under the new pack; a host
  seals under older rules as the company it is.

## Consequences

- Headline pacing under rules 67: 380 / 296 / 197; the two other seeds
  344 / 336, 276 / 266, 190 / 191; proxies 327 / 476 / 301 / 201: every headline course in band and the other seeds identical to rules 66, the two other Epic seeds just under the band as before.
- The AI-watch chronicle journey’s pin at 56 holds; the headline Epic and Long courses are identical to rules 66.
- One summoning of one path; the host is always Oath guard; no rite raises
  more than a company, calls anything that is not a company, or summons
  anywhere but the caster's own hearth. Rituals beyond these four, a third
  magical path and further artifice remain unbuilt.
