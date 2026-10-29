# 0062 — Seam warding: the first strategic rite

Rules/save **40** adds the first strategic rite, the M7 "wards/counter-rituals"
remainder in its smallest playable form: a magical working performed from a
hearth rather than on a battlefield, with a cost the realm already draws, a
consequence the siege rules already state, and a counter that needs no new rule.

## The rite

`rite.seam_warding` is content (`STRATEGIC_RITES` in `packages/content`): it
needs the national discovery `arcane.rune_binding`, a Waykeeper of the Rune
path, six ashglass from the realm stockpile, and lasts ten turns. The content
seal grows a fifth component; `contentPackHash(…, rites = false)` reproduces the
rules 38–39 seal **03ac0328**, which `PRE_RITE_CONTENT_HASH` names so older
envelopes still validate.

`performRite { factionId, characterId, riteId }` is refused, in this order, when
the rules are older than 40, the character is not a living Waykeeper of the
realm, a battle or capture is pending, the discovery is unresearched, the caster
lacks the path, is wounded or on a mission, is not lodged in a hearth (a caster
riding with an army is not lodged), the hearth's borders hold no surveyed seam
of the rite's path, the hearth is already warded, or the stockpile cannot pay.
The observation quotes every option with its exact first blocker (`rites`) and
the realm's standing wards with turns remaining (`wards`).

## The ward

A ward is canonical state: `{ settlementId, factionId, casterId, riteId,
startedTurn, expiresTurn }`, at most one per hearth, ordered by hearth. While it
stands the hearth's siege works do not reduce its defenses and sabotage missions
against it do no damage; the besieger's siege observation carries `warded: true`,
and nothing else about the siege changes — supplies still run down, assaults are
still legal, and the realm still loses the hearth's yields. Wards are advanced
at the end of each turn before the siege works, and a ward ends when its term
ends, the hearth changes hands, the caster dies or no longer stands lodged
there, or the seam is no longer held; every party to the siege reads the
`ward_ended` event with the reason. A ward with no turns remaining lapses at the
end of that turn, before the works run.

## AI

The besieged realm performs the first quoted rite it can perform at a besieged
hearth, oldest siege first, after siege and capture decisions and before any
spending; it reads only its own observation. A besieger that reads warded walls
it cannot storm (strength below three times the defenders) lifts the siege and
looks for another front, since the works would only cost it upkeep. The existing
assault rule for an overwhelming force is unchanged, so a ward buys time rather
than immunity.

## Compatibility

Save version 40; `wards: []` on every migration; `stateV39Schema` is frozen.
Projection to ≤39, hashing at ≤39 and historical command execution refuse a
campaign with a standing ward (`assertNoWards`); a v39 envelope sealed
**03ac0328** migrates with no wards and an identical hash. Older command schemas
never accept `performRite`.

## Limits

One rite of one path exists; a Flame rite, counter-rituals that end an enemy
ward, and rites with effects beyond a siege are open. The AI never positions a
caster to ward a hearth in advance, and no headline campaign reaches a warded
siege. The map does not draw wards; the character sheet and the siege ledger are
where a ward is read.
