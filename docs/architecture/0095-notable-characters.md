# ADR 0095 — Rules/save 64: notable characters

**Status:** accepted, 2026-10-31. One optional canonical field on a
character (`notableId`), twenty-four figures of content, no new command.
Save 64. Evidence:
[`docs/development/2026-10-31-notables/`](../development/2026-10-31-notables/README.md).

## Context

The characters (rules 7 onward) are appointed by role and named from each
culture's roll; every marshal, surveyor or engineer begins the same, and
the roadmap for characters and politics still asks for a cast that belongs
to a culture rather than a roll. The scope counts authored figures among
its content targets. A figure of the age needs no new mechanic: the skill
tree already has an exclusive root for every role, and a name with a story
is content.

## Decision

- **One notable figure for every culture**, authored: Sella Kilnbound of
  the Ashen Compact, Talen Fordkeeper of the Reedbound Council, Kesta
  Slagwatch of the Cinder March and twenty-one more, each a marshal,
  surveyor or engineer with a story and one of their role's exclusive root
  specializations.
- **The first appointment answers.** Under rules 64, the first time a realm
  of the figure's culture appoints the figure's role — in the whole
  campaign, dead or alive — the character appointed is that figure: their
  name, their specialization already theirs at rank 2, and their story on
  the character sheet. The appointment costs what any appointment of the
  role costs; the journal records that the name was known beyond the realm.
  Every later appointment of the role is an ordinary one from the roll.
- **Read, not planned.** The observation carries the figure's id and story
  on the character view; the character sheet shows the story under the
  name. The AI appoints as before and gains the figure the same way; it
  plans nothing for them in particular.
- **Save 64** adds the optional field; a v63 envelope cannot carry it, a
  campaign that appointed a figure cannot be sealed under earlier rules,
  and the save validator refuses a figure of another culture or role, a
  renamed figure, or two of the same.

## Consequences

- Headline pacing under rules 64: 380 / 305 / 207; the two other seeds
  306 / 349, 256 / 326, 192 / 218; proxies 307 / 467 / 290 / 189: every headline course in band, the two other Epic seeds under it (they held 390 / 365 under rules 63) and recorded as drift to watch — the free root specialization of each realm’s first figure is the first suspect if a later slice moves the headline.
- The character scenarios that test promotion from a blank specialization
  appoint their first officer under rules 63 and say so; the figures have
  their own tests. A figure is a named, specialized appointment and nothing
  more: no political office, no loyalty, no succession, no special death.
  Rulers, offices, legitimacy and the wider political cast remain unbuilt.
