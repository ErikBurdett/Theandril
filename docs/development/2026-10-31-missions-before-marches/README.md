# Experiment, not shipped: character missions before the turn's marches — 2026-10-31

Under rules 47 the Epic headline campaign refused one order on turn 130: a
surveyor's mission, quoted as open from the turn's observation, was refused
as "already explored" because a glass-approach march issued earlier in the
same batch charted the survey's ground (reproduced in
[`../2026-10-31-hearth-events-ii/README.md`](../2026-10-31-hearth-events-ii/README.md)).

Two changes were tried together in `packages/ai/src/index.ts`: the turn's
character missions were placed before its bounded marches (glass approach,
seam expedition, depot), and companies that survey or build a depot this turn
were held out of missions (the first placement alone refused depot orders
behind a mission that had spent the company's movement).

Measured, the race was gone (0 refused orders on every pace) but every course
moved: seed 20260905 ended on **430 / 333 / 215** against 388 / 313 / 216
([log](pacing-after.log), [json](pacing-after.json)), and the two other seeds
on **338 / 352, 273 / 285, 206 / 203** against 371 / 373, 314 / 289, 206 / 192
without the change ([after](pacing-seeds-after.log), [before](pacing-seeds-before.log)).
The Epic headline left its band and the Epic spread across seeds widened, for
one refused order in one course. The change was reverted; the race stays
recorded as an open limit of the AI's same-batch planning, and a fix must come
from quoting missions against the batch's own marches, not from reordering.
