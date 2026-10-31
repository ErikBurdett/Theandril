# ADR 0077 — Rules/save 47: the second hearth event catalogue

**Status:** accepted, 2026-10-31. Content and two effect kinds; no new
canonical field. Save 47. Evidence:
[`docs/development/2026-10-31-hearth-events-ii/`](../development/2026-10-31-hearth-events-ii/README.md).

## Context

ADR 0075 put the whole event loop in place with eight templates against a
scope target of one hundred and fifty, and every answer moved one of five
fields. The next step was breadth that reads more of the hearth — its harbor
and archive, the companies quartered in it, the realm's peace, breadth and
youth — and answers that touch two more things the simulation already holds:
the realm's ashglass and the strength of the companies at the hearth.

## Decision

- Sixteen more original templates (`SECOND_BATCH`, `sinceRules: 47`) with six
  new conditions — `harbor`, `archive`, `garrisoned`, `peace`, `wide` (four
  hearths or more), `young` (population two or fewer) — all evaluated from
  canonical state.
- Two optional effect keys, `ashglass` (the realm's stockpile) and `garrison`
  (each land company quartered at the hearth, every formation clamped between
  one and its unit's full ranks). A rules 46 template carries neither, which the
  content validation enforces, so the rules 46 templates seal exactly as before.
- An answer that spends more ashglass than the realm holds is quoted as
  blocked and refused, like coin and knowledge. The AI values ashglass at three
  and garrison strength at one and a half per point.
- Rules 47 campaigns draw from the whole catalogue; a rules 46 campaign draws
  from the first eight. The rules 46 pack is frozen as `8a737501`
  (`PRE_EVENTS_II_CONTENT_HASH`); a v46 envelope loads unchanged under the new
  pack; a campaign with a pending second-catalogue event cannot be sealed as
  v46. The content pack hash seals the catalogue by rules version.

## Consequences

- Headline pacing **388 / 313 / 216**, every campaign in its band, now all by
  Prosperity (the events' draws moved each course); proxies 344 / 401 / 300 /
  194, all Prosperity, within their bounds. The AI-watch chronicle journey's
  pinned victory turn moves from 55 to 56, attributed to one turn-40 draw.
- One survey mission was refused on the Epic headline at turn 130 ("already
  explored"): a same-batch race between a scout's move and a surveyor's
  mission that the changed course exposed. It is recorded, not fixed here.
- Twenty-four templates against a target of one hundred and fifty; no epochs,
  escalation or crises.
