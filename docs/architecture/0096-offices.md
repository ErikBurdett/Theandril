# ADR 0096 — Rules/save 65: offices of the realm

**Status:** accepted, 2026-10-31. New canonical register (`offices`), two
commands, four offices of content. Save 65. Evidence:
[`docs/development/2026-10-31-offices/`](../development/2026-10-31-offices/README.md).

## Context

The characters ride with companies, survey, refit and sabotage; between
assignments they sit in a hearth and do nothing. The roadmap for characters
and politics asks for offices and the internal consequences of a cast, and
the notable figures (rules 64) gave every culture someone worth seating.
An office that pays the hearth its holder sits in needs no new economy:
the hearth's yield already sums land, buildings, development and
progression, and a character already has a seat.

## Decision

- **One office for every character role**, authored: the Warden of the
  Walls (a marshal, +2 food), the Keeper of the Roll (a surveyor, +2 coin),
  the Master of Works (an engineer, +2 industry) and the Reader of the
  Seams (a Waykeeper, +2 knowledge), each with a description.
- **Held from a hearth.** `holdOffice` seats a living, unwounded character
  of the office's role who sits in a hearth of the realm; a realm fills each
  office once and a character holds one office. The hearth the holder sits
  in gains the office's yield while they do, through the ordinary yield
  sum, so sieges, occupation and devastation scale it as they scale the
  rest. A holder cannot be assigned to a company: the assignment blocker
  says to resign first. `resignOffice` vacates the office; death vacates it
  with a journal notice.
- **Read and planned.** The observation lists the realm's offices with
  their holders and seats; the character sheet shows the office a character
  holds and the vacant offices of their role they could take where they
  sit, with hold and resign. An AI realm seats a vacant office with a
  character of the role whom the turn's work leaves sitting in a hearth with
  no company to join, only when the realm keeps another living character of
  that role for the road; one office a turn; the AI never resigns.
- **Save 65** appends the register, ordered by office and realm; older
  envelopes load with none and a campaign holding an office cannot be
  sealed under earlier rules. The validator refuses a holder who is dead,
  of another realm or role, riding, or holding two offices.

## Consequences

- Headline pacing under rules 65: 380 / 305 / 207; the two other seeds
  306 / 349, 256 / 326, 192 / 218; proxies 307 / 467 / 290 / 189: every course identical to rules 64, the headline in band and the two other Epic seeds still under it as recorded with the notables; the AI’s office rule seated nobody who changed these campaigns.
- An office pays its hearth and keeps its holder, nothing more: no
  legitimacy, loyalty, succession or unrest; no office of state beyond the
  four; the AI fills but never resigns. Rulers and the wider political cast
  remain unbuilt.
