# ADR 0107 — Rules/save 75: army deployment

**Status:** accepted, 2026-11-01. One optional canonical field on an army
(`deployment`), one command, no content. Save 75. Evidence:
[`docs/development/2026-11-01-deployment/`](../development/2026-11-01-deployment/README.md).

## Context

The military roadmap asks for editable deployment. A battle draws an army's
formations up in their canonical order, five to a rank, so which company
stands in the front rank has followed the order the formations were raised
in; the player has had no say. The formation order itself must stay
canonical for the save, so a deployment cannot be a reordering.

## Decision

- **Four doctrines.** `setDeployment` sets a land army to draw up as the
  line (its canonical order), a shield wall (the best-armored formations
  first), pikes forward (the polearms first) or a skirmish (the ranged
  companies first), each stable by id within its rank. The line clears the
  field; fleets keep none; a standing battle blocks the change.
- **Read when the battle is drawn up.** A battle with any doctrined army
  draws the armies up in id order, each by its doctrine; a battle with none
  draws up exactly as before, so AI play and every earlier campaign are
  unchanged. The army view carries the doctrine and the unit names of its
  front rank; the composition panel sets it and quotes the rank; the journal
  records the choice.
- **Save 75** adds the optional field to the army; earlier envelopes carry
  none and refuse it, and a campaign with a doctrine cannot be sealed under
  earlier rules. The content pack is unchanged.

## Consequences

- Headline pacing under rules 75: 329 / 301 / 219; the two other seeds
  355 / 383, 286 / 315, 194 / 204; proxies 379 / 461 / 353 / 209: every course identical to rules 74 since the AI keeps the line; the headline Epic drift recorded with the sixth catalogue stands.
- With no AI doctrine, every measured course and the chronicle pin at 56 are identical to rules 74; the rule is exercised by its sim and journey tests, including a real battle.
- A doctrine orders the ranks only: no column choice, no per-formation
  placement, no reserve line, and the AI keeps the line. Coordinated
  attacking armies and broader operational reinforcement remain unbuilt.
