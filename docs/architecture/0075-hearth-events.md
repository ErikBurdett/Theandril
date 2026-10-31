# ADR 0075 — Rules/save 46: hearth events

**Status:** accepted, 2026-10-31. New canonical register (`hearthEvents`),
one new command (`resolveHearthEvent`), eight content templates. Save 46.
Evidence: [`docs/development/2026-10-31-hearth-events/`](../development/2026-10-31-hearth-events/README.md).

## Context

The 1.0 scope asks for a living campaign: context-aware events with visible
requirements and consequences, escalation that creates choices. Nothing of M6
was built; the scope's target is one hundred and fifty event templates and the
pack held none. A campaign's fortunes turned only through war, research and
the land. The first slice had to put the whole loop in place — content,
canonical state, a command, an observation, the AI's answer, the player's
panel and the journal — small enough to measure and to keep deterministic.

## Decision

- **Content.** `HEARTH_EVENTS`: original templates with a name, a story naming
  its hearth, a condition (`any`, `populous`, `devastated`, `coastal`, `seam`,
  `wartime`), a weight and two or three answers. Every answer moves only
  fields that already exist: the hearth's stored food, people and devastation,
  and the realm's coin and knowledge. The pack validates ids, the `{hearth}`
  placeholder, distinct answers and that every event changes something.
- **Simulation.** At the end of a turn, after progression, a lapsed event (five
  turns unanswered) takes the first answer the realm can afford, and each realm
  with no pending event and no draw in the last ten turns, from turn forty, is
  drawn for one: a seeded random stream keyed by the campaign seed, the turn
  and the realm's seat decides whether an event comes (thirty-five in a
  hundred), at which of its unbesieged, unoccupied hearths, and which eligible
  template by weight. The event's id is the turn and seat, so it shifts no
  other id in the campaign. `resolveHearthEvent` applies exactly one quoted
  answer; an answer that costs coin or knowledge the realm lacks is refused,
  never paid short. Historical rules offer nothing and accept no answer.
- **Observation and journal.** A realm sees its own pending events with every
  answer quoted (effects, summary, blocker). Offers, answers and lapses are
  domain events in the journal.
- **AI.** Each pending event is answered on the turn it is offered with the
  open answer worth most by the quote: coin and knowledge at face value, food
  at a premium where the hearth is short of it, people dearly, devastation at
  its cost, more where the hearth is already scarred. The answer's cost comes
  off the planning purse before anything else is budgeted.
- **Save.** `hearthEvents` joins the state schema and the state hash under
  rules 46; older hashes and envelopes never see it. The rules 45 pack is
  frozen as `1f0c41ca`; every older envelope is upgraded through its own branch
  and then given an empty register. Sealing a campaign with events under an
  older rules version is refused.

## Consequences

- Headline pacing with events: **393 / 301 / 210**, all by Attunement, every
  campaign in its band; proxies 385 / 412 / 270 / 182, all Prosperity, within
  their bounds. Events are small enough not to move the campaign's shape.
- Eight templates against a scope target of one hundred and fifty: the loop is
  complete and the catalogue is the work that follows. Escalation, epochs,
  crises with prevention and recovery, migration and collapse are still not
  built; this is the first of M6, not its acceptance.
- Events start on turn forty so a realm's founding and first exploration are
  untouched; a Short campaign may end before one is offered.
- Continuing an older archive under modern rules now offers events, as it
  offers wards and supply; the chronicle continuation tests filter the offers
  from their pinned event lists the way they filter supply attrition.
