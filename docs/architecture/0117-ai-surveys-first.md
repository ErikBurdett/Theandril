# ADR 0117 — AI surveys before the march

**Status:** accepted, 2026-11-01. AI only; no rule, save field or content
seal moves. Evidence:
[`docs/development/2026-11-01-ai-surveys-first/`](../development/2026-11-01-ai-surveys-first/README.md).

## Context

The pacing tool counts refused orders, and every headline campaign is
expected to show none. Since rules 79 one Standard seed showed one, and the
AI offices slice brought the same refusal to the headline Epic and Long
courses: a surveyor's survey mission, quoted as startable when the turn was
planned, refused as *This survey area is already explored* when it was
issued. The AI plans its whole turn on one observation and issues the
batch in order; a march ordered earlier in the batch had charted the
ground the survey was quoted on.

## Decision

- **Surveys before the first march.** Each `startCharacterMission` for
  `mission.survey`, with the `assignCharacter` that puts its surveyor on
  the carrier, is issued just before the batch's first `moveTo` or
  `queueMovement`. The carrier's own orders that stood after that march —
  its training, its glass search, its depot — are issued before the survey
  too, since the survey spends the carrier's turn. Every other order keeps
  its place; a refit keeps its place after the training it follows.

## Consequences

- Headline pacing: 402 / 307 / 199; the two other seeds
  331 / 359, 288 / 284, 200 / 203; proxies 334 / 423 / 295 / 200; no course refuses an order any more. The AI-watch chronicle journey’s pin at 57 holds and the campaign is unchanged.
- The quote is still taken on the planning observation; an order refused
  for any other reason the batch itself creates would still be refused.
