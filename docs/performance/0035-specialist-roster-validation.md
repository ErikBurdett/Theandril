# Specialist roster validation

The final source restores the unchanged Standard / 24 and Huge / 32 generated
contact gates: every faction meets another realm within the original 60-round
scenario, using legal public proposals and a saved command mirror. The final
focused AI run passed 51/52 tests in nine files; only the pre-existing Standard /
4 contact assertion remains in that run. Naval recruitment, ID invariance,
transport assembly, navigation oracle/bounds and overseas/basin tests pass.
[Full focused output](0035-transport-source-gates.txt).

The four added formations use rules/save/journal version 15. The earlier focused
simulation, content, migration, replay, persistence and presentation run passed
760 tests in 61 files. Historical roster-pack hash assertions are unchanged.
The browser `specialist-roster.spec.ts` scenario passed all four real paid
research/recruitment flows, reload of a pending order, completion, map selection,
shared culture art and narrow-screen cards.

Two budget interactions initially delayed independent ocean scouting. Optional
appointments could spend the first scout's legal quote. After reserving that
quote, the generic caravan reserve could still underfund its handoff to naval
planning, leaving ordinary production free to consume the money afterward. The
planner now preserves that one current legal quote through both stages, without
spending the separate progression reserve. A ready ocean-facing harbor can buy
Ocean navigation from knowledge left after normal progression; an actual
passenger charter retains its existing strategic research reservation. Paid
79/80-knowledge and exact-48-coin tests cover these boundaries and save parity.

Dedicated naval scouts use observed culture, hulls and current cell for tied
discovery choices. A metamorphic test changes unrelated global army-ID allocation,
checks the same destination, then proves two scouts reserve distinct legal
destinations. Passenger-capable fleets retain their established expedition tie
order. Default land exploration, node caps, discovery weights and landing safety
are unchanged. Geometric bearings, shoreline bonuses and frontier-ranking
experiments were not retained.

An intermediate implementation also changed passenger-transport ties. That
introduced a real Huge-map encounter regression, which the final scope correction
resolves. The evidence must distinguish the different runs:

| Evidence | Huge contacts after 60 rounds | Missing factions |
| --- | --- | --- |
| Historical HEAD report `0037-headless-final.txt` | 31/32 | Margin Observance |
| Initial expanded-roster run `/tmp/theandril-slice26-unit.txt` | 31/32 | Repeated Cinder March (27) |
| Intermediate full run `/tmp/theandril-slice26-unit-final.txt` | 30/32 | Margin Observance; repeated Iron Covenant (29) |
| Final scoped transport correction, source tests | 32/32 | None |

There was no untouched before-roster full-suite rerun in this session. A read-only
original-AI comparison with the expanded roster reproduced the initial 31/32
outcome. Iron (29) and the intermediate policy both paid for a harbor on turn 23, a coastal
hull on 26, a transport on 29, Ocean research on 34 and an ocean warship on 35;
the scout deployed on turn 40 at the same cell 10592. Treasury, knowledge and sampled scout positions
matched through turn 50. There was one harbor, with no evidence that a global
quote funded a ship in the wrong theater or delayed the purchase.

The initial encounter was between Iron's scout and Margin's passenger transport
on turns 55/56. The intermediate transport changed course from turn 42 and later
oscillated between pickup cells 14646 and 15160. Retaining the established transport
tie restores that encounter; the funded scouts also improve Cinder (27) contact
from turn 65 to 58. The corrected diagnostic has all 32 contacts, and both unchanged
Standard / 24 and Huge / 32 tests pass on the actual final source with save/replay.
[Compact trajectory and purchase audit](0035-huge-contact-audit.json).

The archived all-AI run before the final transport correction passed 228/230,
including all pacing/victory cases; its then-failing contact results are retained
as intermediate evidence, not the final outcome.
[Intermediate output](0035-specialist-ai-tests.txt).
The intermediate full suite passed 1494/1497 in 93.02 seconds, with Standard / 4,
Huge / 32 and an epic pacing timeout under full-suite load. The final transport
correction resolves Huge / 32. Final full-suite and browser results are recorded
by the parent delivery report.

Session-only alternate AI copies, copied tests and probes were moved out of the
repository to `/tmp/theandril-slice26-ai-diagnostics`; they are not product code
or normal test inputs.
