# Group patrol assignment — round 2, 2026-10-25

The second of four requested rounds assigns or replaces two-point patrols for
checked owned land armies ashore, up to 128. Numeric endpoints and owned-hearth
shortcuts use existing canonical `setPatrol`; the shared war option is explicit.
Existing enabled/paused states survive replacement, new policies start enabled,
and existing routes/postings retain priority. The form warns that replacement
resets the next patrol point. No new rules, prices, saved fields or AI behavior:
rules/save 35, content 015468d1. M3, DH-021, R06 and all fifteen gates remain open.

## Verification

[Focused final run](focused-final.log): 19 tests pass. The retained first run
failed five new assertions: three HTML button patterns missed the primary class,
and two authored caravan fixtures used invalid runtime IDs. Fixtures now allocate
valid IDs through `nextId` and maintain canonical formation ordering. The first
typecheck also caught a widened command literal; the final typecheck passes. Lint
initially caught one unused import; it was removed and final lint/build pass.
No game validation or test assertion was relaxed to admit invalid saves.

[Browser run](browser.log):seven production Pages cases pass in 40.0 seconds,
including the new 101-army assignment, generated out-and-back patrol, three actual
mutation/reply-recovery scenarios, existing bulk pause/resume/remove and individual
patrol controls. The authored scale case changes 105→206 records, policies 99→101,
preserves 50 paused policies and all armies/routes/postings, and restores the
exact 206-record archive. Initial hash c6f43460; assigned/restored eeb8aecd. A second
101-assignment replaces points at 390px/130% text before exact manual restoration.
The separate generated campaign travels to its adjacent destination and returns
on turns 2/3; its archive replays exactly. No development hooks or fake commands.

Native assignment and narrow 130% screenshots were inspected: readable labels,
replacement/war consequences, accessible submit and no horizontal clipping.
[Independent source review](source-review.md) finds no scoped blocker. The review
predates the separate generated out-and-back case, which closes its noted travel
coverage gap. Owned-hearth shortcut interaction is not separately exercised;
worker cases cover mixed refusal, current hash, malformed envelopes,128-policy
capacity, exact replay/autosave and interruption recovery.

The first full suite passed 2383/2384 tests: an existing registry assertion counted
the new war-option checkbox as an extra army row. It now counts the actual
`Select … for group orders` checkboxes; the disabled-row check remains exact.
Full rerun and deployment results are recorded below after completion.

No new performance percentile or campaign pacing measurement is claimed. This
extends a bounded existing batch path without changing turn execution or rules.
The public combined dispatch follows review of all four development rounds.

## Green integration checkpoint

[Full rerun](full-tests-final.log):**2,384 tests / 289 files pass**, 64.40 seconds,
four workers. No production change was required for the registry test correction.
