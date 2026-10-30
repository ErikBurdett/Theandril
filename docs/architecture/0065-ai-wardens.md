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

## Why the post is gated on war, and why it needs a fallback

A diagnostic run of the Epic headline before the fallback counted the readiness
funnel per realm-turn: seams held 508, at war 309, a rite discovery known 60
(one realm, from turn 302), seam hearths besieged 10, never with the rite
known. The discovery came late because no seam-holding realm at war had a
Waykeeper at all: the ordinary appointment rule only appoints a caster where a
battle stack stands to receive it, and at war that rule outranked the warden
post, which then found no stack at any hearth and appointed nothing. With a
fallback — when the realm wants a battle caster but no hearth has a stack to
take one, the seam hearth still gets its warden — the same run shows a caster
lodged at a seam hearth for 520 realm-turns and a rite performable for 512.

Gating the post on a visible threat instead of on war was tried at eight and
fourteen hexes and appointed nobody: fog hides a besieger until it stands at
the gate, and the blockade then refuses the appointment. The post must already
be filled when the war begins, so war is the trigger.

Seam hearths are besieged on only a handful of realm-turns per headline
campaign, so even a ready realm rarely performs a rite in measured play; the
readiness is what this slice delivers, and the pacing cost of the appointed
casters is recorded in the packet.

## Limits

Wardens are called only while the realm is at war and only for hearths that
hold a seam; nothing pre-positions a caster for a Rune breaking, and the AI
does not buy ashglass or keep a stock for rites, so a realm that drew none
still cannot perform them. Headline pacing is the measure of whether any realm
now reaches a rite organically.
