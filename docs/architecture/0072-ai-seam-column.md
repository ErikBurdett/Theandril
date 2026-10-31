# ADR 0072 — AI seam column: a standing war carried to the seam

**Status:** accepted, 2026-10-31. AI only; no rules, content or save change.
Evidence: [`docs/development/2026-10-31-ai-seam-column/`](../development/2026-10-31-ai-seam-column/README.md).

## Context

After ADR 0071 the Glass Tide of the Epic headline campaign is ready to seal
the working but for its price by turn 110, and loses the hearth holding its
Rune seam to Sable Steppe on turn 160. A replay of every change of hands of
a seam hearth showed what followed: for two hundred turns the hearth stood
ungarrisoned, Glass Tide was at war with its holder on and off, its nearest
company stood one or two hexes from the walls, and it laid siege on turns 259,
262, 278, 280, 282, 284, 298, 303, 317, 319, 322 and 324 without ever
assaulting. Three things stopped it. The bounded seam objective (ADR 0070)
fired only at peace, so the realm never marched on the hearth as a war aim
once the war existed. Sable Steppe kept the hearth under a seam warding recast
every ten turns, and a single company of thirty to sixty strength before
warded walls was lifted the next turn as hopeless by the rule of ADR 0040,
then laid again by the next company to arrive. And the ordinary peace policy
proposed peace to the holder after eight turns of war, or accepted its offer,
which lifted whatever siege stood. Each company reached the walls alone
because every army claims its own destination hex, so none ever stood
together to be concentrated into a column that could storm them.

## Decision

Three bounded changes to the AI, all read from the realm's own observation.

- **The objective is carried, not only opened.** `seamObjective` still names
  the seam of the missing path as the last gap before the working (a seam
  held, a caster of the required degree). At peace any unprotected holder may
  be pursued, as before. At war the realm pursues only a holder it already
  fights: the objective never opens a second front, and a war that cost the
  realm a seam hearth is carried back to that hearth.
- **A column gathers on one hex.** The rally is the siege lines when the realm
  besieges the hearth holding the seam, else the hex of the strongest own
  field company within three hexes of the seam, else the seam itself. Every
  field company within range marches on the rally and shares its hex instead
  of claiming one of its own, so the existing concentration pass merges them
  into one column the next turn. The company at the rally leads: it closes on
  the hearth once that is in sight and otherwise holds. The hearth holding the
  seam is besieged only by the strongest company beside it, so a weaker one
  does not take the siege from the column. The siege of that hearth is the
  realm's quote of its walls: it is kept under a warding rather than lifted as
  hopeless, and handed to a company beside the hearth that can storm the walls
  (three times the quoted defender strength under growth rules) when the
  besieger cannot. The existing assault rule then storms them.
- **The war is held while the seam is pursued.** While a field company stands
  within three hexes of the seam or the hearth is under the realm's siege, no
  peace is offered to the holder and none of its offers is accepted. The hold
  ends with the pursuit, so a column driven off makes peace as before.

## Consequences

- Epic headline: Glass Tide retakes its Rune seam hearth on turn 246 and holds
  both paths from 250, meets the 9,600 price and seals the working on about
  turn 353; Saltwind's Prosperity bid completes first on 379. Headline pacing
  is **379 / 300 / 203**, every campaign in its band; the Long and Standard
  campaigns are unchanged. The gap is no longer readiness or the seam but the
  race between a late working and a rival's project.
- Rally and siege conduct apply only to the seam objective; ordinary invasion,
  raids and counterplay sieges are untouched. A kindled seam hearth is still
  lifted by the existing rule, since kindling burns the besieger and the walls
  still wear.
- The seam hearth retaken on 246 is lost again on 373 to Iron Covenant while
  the working runs: defending a seam hearth is still not an AI concern.
