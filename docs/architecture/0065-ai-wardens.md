# 0065 — AI wardens: reaching hearth rites in organic play

Rules 40–42 gave the game three strategic rites, and every headline campaign
measured since then shows none performed: no AI realm had researched a rite's
discovery, held its seam and lodged a caster of its path at the same hearth. The
rites were playable, not reached. This slice changes the AI only; no rule, save
field or content seal moves.

## What the AI now does

`packages/ai/src/wardens.ts` reads three things from the observation — the
seams the realm holds (`arcaneSites` with `controlled`), its living Waykeepers'
aptitudes and the rites quoted under rules 40+ (`rites`) — and acts on them:

1. **Research the rite's discovery.** When no castable or completing discovery
   is wanted, the progression planner buys the discovery of a hearth rite
   (warding or kindling) whose path seam the realm holds and whose path a living
   Waykeeper carries at the rite's degree. The breaking's discovery is not
   bought here; it needs the second Rune degree, which the deepening and seam
   study already pursue.
2. **Keep a warden lodged.** At war, with a held seam whose rite discovery is
   known or buyable, the character planner wants one Waykeeper, appoints it at a
   seam hearth and does not hand a Waykeeper lodged at a seam hearth to a
   co-located company. The attunement study rule and the battle-caster rule keep
   their precedence.
3. **Call the warden home while the gate is open.** The simulation refuses
   appointments and lodging at a blockaded hearth, so the call comes on threat:
   an enemy land company within four hexes of a seam hearth with a known rite
   and no lodged qualified caster sends the nearest riding qualified caster's
   company home (`queueMovement`, held for the turn) and lodges the caster
   (`unassignCharacter`) when it stands at the hearth. A blockaded hearth and a
   hearth already warded are skipped. The orders travel with the turn's
   ordinary work like the attunement caster's road.

The existing `planRites` pass then performs the rite the moment the siege
begins, and the besieger's reading of warded or kindled walls follows.

## Limits

Wardens are called only while the realm is at war and only for hearths that
hold a seam; nothing pre-positions a caster for a Rune breaking, and the AI
does not buy ashglass or keep a stock for rites, so a realm that drew none
still cannot perform them. Headline pacing is the measure of whether any realm
now reaches a rite organically.
