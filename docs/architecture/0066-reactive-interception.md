# 0066 — Reactive interception: a held counter answers a working as it is made

Rules 24 gave Unbinding a real interruption: it strips a ward and costs the
Waykeeper holding it the coming round. It could only be used on the player's
own action, so a working already made had landed before any answer came. The
M2 remainder asked that a cast be answered as it happens. Rules 43 does that
with the counter that already exists, no new content, no new saved field.

## The rule

- A Waykeeper whose Unbinding is held **automatic** is a watcher. When an enemy
  caster works any battle spell — ember, ward or counter — and the watcher's
  escort lies within Unbinding's reach of the working caster's escort, the
  watcher answers it as it is made: the working has no effect, both casters pay
  their spell's strain and use, and both have acted for that round.
- The ordinary limits decide whether the watcher can answer: a use remaining,
  strain within the limit, not wounded, not already acted for the round, an
  active escort. The first eligible watcher in source order answers; the second
  does not spend itself on a working already undone.
- Reach is measured as any enemy-targeted working is: the sum of the two escort
  rows, plus one, plus half the column difference, against the counter's range.
- A held counter **waits** during the automatic pass while an enemy caster could
  still work this round, instead of spending itself on a standing ward. Once no
  enemy working can come, it goes where the strongest binding stands as before.
- A counter set to manual never intercepts; it is the player's to spend on a
  ward or a caster's escort, as rules 24 defined it.
- Both sides read the answer: the caster's realm reads its working "intercepted
  … as it was made" on its own ability event, the watcher's realm a
  `battle_cast_intercepted` event, and the recorded battle actions show the
  counter aimed at the working caster's escort.

The intercepted caster is not jarred beyond the round it spent. Jarring a
command-time cast would have to record a round beyond the saved bound every
battle checks on load, and the working's own strain and use are already lost.

## Why this shape

- **No parallel engine.** The interception lives inside `execute` of
  `battle-abilities.ts`, in the same saved caster strain, uses and acted-round
  fields that every other cast uses. `validateBattleAbilities` proves both
  casters' strain against their spent uses unchanged.
- **The player's control is the control that exists.** The Automatic checkbox
  already chose between the AI's policy and the player's hand; for the counter
  it now also chooses between watching and holding. The battle panel says when a
  counter is holding to intercept, through the observation's `intercepts` flag.
- **Determinism.** Source order, the saved acted round and the saved strain
  decide everything; chronicle replay under rules 42 knows no interception
  because the rule is gated on the campaign rules through the state, not on the
  battle's own report version.
- **Content seals.** The spell text is unchanged, so every sealed pack keeps its
  hash; the observation composes the interception sentence onto Unbinding's
  description for the panel.

## Versions

Rules and save 43. A v42 envelope migrates with no field change and the same
content hash; its state continues under rules 43. Chronicle archives record
rules 43; replay of a rules 42 archive resolves its battles without the rule.

## What remains

The AI plays interception through the automatic policy alone; it does not
yet lower a ward's priority or choose a target to bait a watcher. Only Unbinding
answers, so a Flame tradition has no reactive working of its own. The hearth
rites of rules 40–42 are not battle casts and cannot be intercepted.
