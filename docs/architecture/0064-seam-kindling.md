# 0064 — Seam kindling: the Flame hearth rite

Rules/save **42** gives the Flame path its own strategic rite, so the two
traditions differ at the hearth as they already do on the battlefield: Rune
binds, Flame burns.

## The rite

`rite.seam_kindling` is content: discovery `arcane.ember_projection`, Flame at
the first degree, six ashglass, ten turns, kind `kindling`, `sinceRules: 42`.
It is appended to `STRATEGIC_RITES` because sealed packs hash the array in
order; the rules 41 seal **78df970c** is named by `PRE_KINDLING_CONTENT_HASH`
and a v41 envelope migrates with its state unchanged. Content validation now
requires every non-breaking rite to last a term.

The requirements are the warding's with the path swapped: a living, unwounded,
unassigned Waykeeper lodged in one of the realm's hearths whose borders hold a
surveyed Flame seam, with no ward already standing there. A hearth holds **one**
ward of either kind, so a caster who can do both chooses; the AI takes the first
rite it can perform, and the content order puts the warding first.

## What it does

A kindling is a ward in the saved sense (same record, same dissolve reasons,
broken by the same Rune breaking), but its effect differs: the walls still wear
down under the works, while **every company besieging the hearth loses four
strength per formation at the end of each turn**, never below a fifth of the
formation's full ranks (the supply-attrition floor). The burn happens before the
siege works, both realms read a `siege_burned` event, and the besieger's siege
observation carries `kindled: true` rather than `warded`. Sabotage is not
affected: the walls are not warded.

## AI

A besieged realm with a Flame caster kindles from the same `planRites` pass. A
besieger reads kindled walls as it reads warded ones: unless it can storm them
(strength at least three times the defenders) it lifts the siege, because
standing there only burns. The rules 41 breaking applies to a kindling.

## Compatibility

Save version 42 changes no canonical field; `saveV41Schema` accepts a rules 41
envelope sealed **78df970c**. Projection to rules 41 or 40 is lossless because a
burned company is ordinary strength loss, but a standing kindling is refused by
`assertNoWards` below 40 like any ward, and rules 41 refuses the rite as unknown.

## Limits

Kindling burns companies, not fleets or carried troops, and does not touch
morale. No rite yet acts on the besieger's supply, and the AI does not position
a Flame caster to kindle in advance.
