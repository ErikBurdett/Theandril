# ADR 0108 — Rules/save 76: cavalry wings

**Status:** accepted, 2026-11-01. One more value of an army's deployment;
no new field, command or content. Save 76. Evidence:
[`docs/development/2026-11-01-wings/`](../development/2026-11-01-wings/README.md).

## Context

The four doctrines of rules 75 order the ranks but leave every column to
the formation order: a battle's five columns a rank come from the index
alone, so a mounted company could not be put on a flank. The combat
kernel's flank order rewards an unsupported edge; a doctrine that chooses
the columns is the smallest way to let the player use it.

## Decision

- **Cavalry wings.** A fifth doctrine fills each rank with the mounted
  companies (movement four or more, no reach) in the outer columns and the
  foot in the centre, stable by id; whichever runs out, the other fills the
  rest. The front rank reads with the first wing first.
- **Rules 75 reads the line.** A campaign under rules 75 cannot set the wings
  and reads an army that carries them as the line; a v75 envelope may not
  name them, and a campaign with wings cannot be sealed under rules 75.
- **Save 76** adds the value; the state and the content pack are otherwise
  unchanged.

## Consequences

- Headline pacing 329 / 301 / 219 and every other course identical to rules 75, since the AI keeps the line; the chronicle pin at 56 holds.
- A doctrine still chooses columns for one kind of company only; no
  per-formation placement or reserve line, and the AI keeps the line.
