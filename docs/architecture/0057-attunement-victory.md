# 0057 — Attunement: the third victory path and personal path growth

Rules/save **38** adds a third, mechanically distinct way to end a campaign and
lets a Waykeeper's personal magical paths grow. Both rest on existing systems:
rules 23 arcane seams, rules 14/24 Arcane Theory and tradition aptitudes, the
public victory-project ledger shared by Prosperity and Unification, and the
character promotion tree. No new economy, map data or rule engine is introduced.

## The sealed working

A realm may **seal an Attunement** at an owned, unoccupied, unbesieged hearth with
a Witness archive when:

- every Arcane Theory discovery available under the rules is researched;
- a surveyed seam of **every** magical path (Flame and Rune) lies inside its
  borders, through `controllingSettlement`;
- a living, unwounded Waykeeper of the **second degree** in at least one path,
  not on a mission and not carried at sea, stands at the host — lodged in it or
  riding with a land army on its hex;
- the realm holds the pace's knowledge price (`ATTUNEMENT_VICTORY.knowledgeCost`:
  60 / 600 / 1,200 / 2,400 by pace). The price is spent on starting and never
  refunded, like the Prosperity coin commitment.

`startAttunement { settlementId, characterId }` is an ordinary command validated
from the same observation the UI and AI read. One ongoing working per realm. The
project uses the existing `VictoryProject` record with
`projectId: 'victory.attunement'` and the pace's `projectActiveTurns` window, so
rivals see it on the public ledger exactly as they see the other two paths.

Each turn, after Prosperity projects and before Unification bids, an active
working gains one turn; completing the window sets `victory.path = 'attunement'`.
The working **pauses** while the host is occupied or besieged, while any path's
seam is no longer held, or while no qualified caster stands at the host (wounded,
on a mission, carried, dead or elsewhere). It is **cancelled** when the host is
conquered or razed. Discoveries cannot be lost, so research never pauses it.
Pause/resume/cancel are reconciled immediately after capture and blockade
commands through the existing `reconcileProjects`, so a save between a siege
and the next turn validates. `validateProgression` recomputes the pause reason
on load and rejects a ledger that disagrees.

### Counterplay

Everything the working rests on can be taken by ordinary play: besiege or take
the host; take the hearth whose borders hold a seam; wound or kill the sealing
Waykeeper in battle (it must leave the host to fight); or make peace impossible
to keep. The bounded immediate counterplay review (ADR 0050) already targets any
rival project within its horizon, so the AI besieges an imminent working the way
it besieges an imminent Hearth Exchange.

## Personal path growth

Two Waykeeper skills, `skill.flame_deepening` and `skill.rune_deepening`
(branch `attunement`, 24 experience, no prerequisites, learnable once each),
raise that path's personal aptitude by one degree, to at most the third. A
tradition-born second degree needs no deepening; cultures without a tradition
reach it through earned practice. Deepening is the only way a caster's paths
change; national research still grants none. A save whose character learned a
deepening but rests below the second degree in that path is rejected.

## AI

Observation-only, through the same command boundary:

- `planProgression` starts a ready working at the safest eligible host where a
  qualified caster already stands (reusing the project-host assessment), after
  the Prosperity check and never for city-states.
- When the only missing requirement is the caster, a qualified Waykeeper riding
  a land army is sent home with an ordinary `queueMovement` and that company is
  held for the turn.
- A realm holding a seam of every path with a caster of the second degree
  finishes Arcane Theory it cannot cast, instead of leaving Unbinding unresearched.
- Surveys continue after the first held seam only while a path is missing, every
  twelve turns from a 160-coin surplus, and only from unsurveyed Ashfall glass.
  Seam claims extend to seams of paths the realm lacks.
- The character planner already learns available promotions, so deepening is
  bought from earned battle experience without a magic-specific rule.

## Compatibility

- Content pack: `ATTUNEMENT_VICTORY` and the two skills enter the sealed pack.
  Rules 24–37 envelopes keep their seal `015468d1`
  (`PRE_ATTUNEMENT_CONTENT_HASH`), are accepted on load and re-sealed under the
  current hash; `contentPackHash(…, attunement=false)` reproduces the old seal.
- Save: `victory.path` gains `'attunement'`; the project ledger allows three
  records per realm. A v37 envelope migrates with an unchanged state. Projecting
  a campaign to version ≤37 refuses an attunement victory, an attunement project
  or a learned deepening; historical command execution refuses the same, and the
  `startAttunement` command is absent from every older command schema.
- Chronicle archives accept `rulesVersion: 38`; the epilogue names the path.

## Limits

The AI does not yet plan seam conquest or caster protection as a strategy; it
pursues the path opportunistically. Personal growth has one rung per path. Only
two paths exist, so "every path" is two seams; the rule is written against
`MAGIC_PATHS` and will demand more as paths are authored. Gate B's three-path
minimum now has three implemented fixtures; it is not acceptance of the gate.
