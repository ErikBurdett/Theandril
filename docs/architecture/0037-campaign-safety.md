# 0037 — Campaign save safety and contestable defending stacks

## Scope and status

Local development after audit baseline `b0a4cd86cdb30cd9e2d3a1f0c8a78da38f7987cd`.
R01 and R03 backend behavior is implemented and has targeted regression evidence.
Integrated browser, archive-capacity and release verification are separate gates;
this document is not a 1.0 certificate.

## Strategic morale versus temporary battle training (R01)

A genuine turn-236 checkpoint loads at rule-16 hash `602413fe`. Accepted `attack`
and `autoResolveBattle` commands previously produced hashes `289c01b6` and
`58a2012d`; the defender's strategic morale rose from 55 to 59 and failed the
existing strict save validator. The 31,908-byte compressed checkpoint and full
command/results are retained under `packages/sim/src/fixtures/v16-trained-battle*`.
They were captured before changing the command implementation.

Campaign rules/save version **17** removes only the training morale actually
applied at deployment when battle morale returns to a surviving strategic
formation. Use the battle's frozen development snapshot and the unchanged entering
canonical morale to account for the tactical cap: a nominal bonus of 18 on morale
85 grants only 15 at the cap of 100, so subtracting 18 would invent a loss. The
result stays between one and the unit's strategic maximum. This carries genuine
fatigue, casualties and morale loss without turning training into healing or
allowing the bonus to compound in same-turn combat.

The tactical round kernel remains battle version **10**. Canonical payload fields,
content, generator and roster versions are unchanged. Valid version-16 snapshots
upgrade only their envelope version; commands recorded explicitly with rule 16
keep the original behavior and byte-exact historical hashes. Current checkpoint
hashes change because the envelope version changes, not because loading repairs
or edits the campaign payload. Already-invalid historical snapshots are still
rejected; recover from a prior valid save rather than silently clamping historical
battle facts or claiming those old archives were repaired.

## Whole-army battle frontage (R03)

The twenty-formation battle budget is unchanged. Campaign 17 no longer refuses
an otherwise legal field attack or settlement assault merely because the tile
contains more formations. The named field target is included first; remaining
whole army containers are selected in stable ID order while they fit. Assaults
use stable ID order. Final participant lists retain canonical ID ordering.

A whole army is never split implicitly: officers, formations and carried troops
keep their existing container/transport invariants. Containers that do not fit
remain **strategic reserves**, not hidden extra actors or discarded formations.
They do not take losses, lose movement, interrupt missions or earn experience
from a battle they did not enter. They can be defeated in subsequent ordinary
engagements. This is successive bounded fighting, not mid-round reinforcement.

The existing occupancy rule prevents a victorious attacker from advancing into a
tile still held by reserves. A victorious assault also checks the actual remaining
garrison before offering capture. If reserves remain, the blockade continues and
a factual `siege_contested` event explains why. Capturing the settlement requires
actually clearing its defenders in later combat.

Pending saves validate the exact selected contingent against the complete live
stack; reserves are not an excuse to accept arbitrary omitted participants.
Version-16 command execution and save validation keep the original whole-stack
requirements. Completed reports still record only actual participating armies,
formations, characters and cargo with exact aftermath. No new tactical schema or
silently rewritten historical report is introduced.

## Human and AI observations

`ArmyView` and `SiegeObservation` can expose optional `battleDefense` values:
`engagedFormations`, `engagedStrength`, `reserveFormations`, `reserveStrength`.
They come from the same canonical selector as deployment and are absent when all
formations fit. The strength values are not predicted battle outcomes. UI/AI must
not assume defeating the engaged contingent also defeats its reserves. Current
visibility and private cargo/character filters remain in force.

The current movement quote and its executable `moveTo` use the same selector;
a direct attack alone is insufficient if a map-click quote still rejects the
stack. Queued routes continue to stop before combat. Field and naval AI consume
the actual movement quote, retain complete reserve strength in threat estimates,
and refresh observation after a new declaration before attacking a contingent.
Historical rule-16/no-preview behavior remains covered. The public UI labels
committed/reserve strength instead of predicting an outcome; narrow capture and
post-battle rendering have separate integration follow-up, not inferred acceptance.

Selection visits the indexed co-located stack, not the whole world. Keep practical
stack/observation costs measured separately from tactical rendering; the unchanged
actor cap alone is not evidence of a global performance improvement.

## Verification anchors and known limits

- `packages/sim/src/battle-morale.test.ts`: the real red reproduction, manual
  rounds/withdrawal, same-turn trained defense and independent old-rule hashes.
- `packages/sim/src/battle-frontage.test.ts`: 20/21/200 formation boundaries,
  exact saved/replayed pending battles, intact reserves, naval hull/cargo separation,
  shared observation counts and actual capture only after a second assault.
- `packages/sim/src/army-combat.test.ts`: historical over-cap rejection retained
  explicitly under rule 16, plus existing composition/forgery checks.
- `docs/development/morale-integration-tests.{json,log}`: pre-frontage integration
  checkpoint, 691 passing tests in 59 files; not a final whole-project result.

The combat fixtures are authored scenarios, not earned combat victories or balance
proof. The separate `docs/development/verify-paid-stack.ts` probe reaches 21
co-located formations on turn 52 through 76 real founding/paid production/end-turn
commands in a freshly generated world. All command results mirror exactly and
round-trip immediately; the current preview exposes 20 engaged and one reserve
formation. Both seats are deliberately controlled and no AI or combat runs in
that probe; evidence is retained under `docs/development/paid-stack/`.

This slice does not add siege starvation, supply logistics, diplomacy goals,
additional victory paths or strategic reinforcement AI. Further generation/play,
real browser verification and integrated QA belong in the development evidence,
not the immutable historical audit.
