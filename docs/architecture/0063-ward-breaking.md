# 0063 — Ward breaking: the counter-rite

Rules/save **41** makes the rules 40 seam warding contestable. A warding that no
besieger could answer except by walking away would have been a new kind of
immunity; the counter-rite makes it a resource and a positioning contest between
two casters, the way Unbinding already answers a battle working.

## The rite

`rite.ward_breaking` is content: it needs the national discovery
`arcane.unbinding`, a Waykeeper of the **second** Rune degree (the same bar as
the Unbinding battle working), four ashglass and no term (`durationTurns: 0`;
content validation now requires a warding to last and a breaking to be instant).
`magicPackForRules(40)` omits it, so the rules 40 seal **ac80514d** is named by
`PRE_BREAKING_CONTENT_HASH` and a v40 envelope migrates with its state unchanged.

The caster must **ride with a company that besieges a warded hearth**: a lodged
caster, a company without a siege, or a besieged hearth without a ward are each
refused with their own reason, after the shared refusals (unknown rite,
unresearched discovery, missing path, wounds, missions). The option is quoted on
the siege side with the besieged hearth as its `settlementId`, and on the
defending side with no target, so a Waykeeper lodged behind the walls reads why
it cannot break anything.

## What it does

The ward is removed at once, the besieger spends four ashglass, and the caster
who held the ward is **jarred**: its `woundedTurns` becomes at least two, so the
walls cannot be re-warded until it recovers. No new state is added. Both realms
read the outcome: the breaker a `rite_performed`, the holder a `ward_ended`
whose reason names the breaking caster and its realm. The siege works resume at
the end of the same turn.

## AI

`planRites` now acts on either side of a siege: a realm wards a besieged hearth
of its own, or breaks the ward on a hearth it besieges, from the first quoted
rite it can perform. It runs **before** the siege judgement, so a besieger with
a qualified riding caster breaks the ward instead of lifting a siege it cannot
storm; without one it still lifts. The AI does not yet seek out a second-degree
Rune caster for a siege.

## Compatibility

Save version 41 changes no canonical field. `stateSchema` is unchanged;
`saveV40Schema` accepts a version 40 envelope sealed **ac80514d**. Projection to
rules 40 is lossless because a broken ward leaves nothing behind but a wound,
which rules 40 already records; the rite itself is refused as unknown under
rules 40, so a rules 41 archive with a breaking cannot replay as 40.

## Limits

One warding and one breaking exist, both on the Rune path. Nothing yet lets a
Flame caster act from a hearth, lets a breaker be countered in turn, or draws a
ward on the map.
