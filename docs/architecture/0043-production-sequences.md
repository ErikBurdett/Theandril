# 0043 — Reusable production sequences over ordinary queues

Date: 26 September 2026. Status: locally verified through full headless, affected browser
and generated built-production checks; publication is recorded separately. ACT-32/M3 remains in progress.
[Evidence packet](../development/2026-09-26-production-sequences/README.md).

## Player outcome

Build an ordered list of one to five existing construction/recruitment items,
recall a saved hearth selection and explicitly apply the list to up to 128 owned
hearths. Existing queue entries come first. Each accepted item spends its normal
coin immediately; every hearth shares the current treasury. Processing follows
stable hearth ID order and preserves the authored item order. A refusal stops
that hearth's remaining sequence, then processing continues with the next hearth.
Accepted prefixes remain paid and queued. No automatic retry, rollback, queue
replacement, charter change or repeated cycle is implied. Complete hearths leave
the selection; partial/refused hearths remain for review and manual correction.

Keep up to 24 named sequence templates in a personal browser/origin-local library,
with 40-character unique names. Saving, selecting, recalling, updating or deleting
a template issues no game order. Recall fills the editable list; Apply is separate.
Templates are excluded from campaign exports. Applied production remains ordinary
canonical queued work, saved and replayed with the existing commands.

## Authority and transport

No canonical rule, schema, price or AI-policy change. Rules/save 32 and content
`015468d1` remain unchanged. `queue` in `packages/sim` remains the sole authority
for ownership, requirements, queue capacity, duplicates and affordability. The new
worker request is a bounded command convenience, not a competing production rule.
Validate its whole envelope before any mutation, then record each attempted queue
command in the campaign journal. Do not attempt later items for that hearth after
a canonical refusal. Publish one permitted observation/result response. At most
128 hearths times 5 items are attempted. Invalid envelopes mutate nothing.

Protocol: `{ id, type:'groupProduction', factionId, settlementIds, itemIds }`.
The strict envelope accepts 1..128 distinct bounded IDs and 1..5 bounded item IDs;
item IDs need not be legal content until ordinary command validation. The worker
sorts hearth IDs and retains item order. Result rows are
`{settlementId,orders:[{itemId,accepted,message?}]}` containing the attempted prefix.
Recording or publication failure ends the batch and requires saved-campaign
recovery. The main thread correlates results with the actual submitted IDs/list,
rejects malformed/incomplete success replies, settles pending work and locks
orders until restoration after uncertain state publication.
Current-worker crashes during an outstanding batch use the same recovery lock;
late errors from replaced workers cannot reset the active request. No success is
inferred from a reply with the wrong terminal type.

## Storage, presentation and bounds

Use a separate versioned preferences database to avoid making the existing
charter-template connection incompatible with a newer shared database version.
Validate a bounded library transactionally before read/write; reject unknown
versions/content, duplicate names/buildings, oversized arrays and malformed rows.
Repeated recruitable unit entries are allowed. Storage errors leave direct
sequence editing/application usable, with an explicit retry and no false success.
Retry retires a failed idle connection and opens a fresh one. A session that is
closed during an already-started write waits for that transaction to settle,
while its late callbacks cannot update a replacement panel.

Show current treasury, nominal per-hearth and total list cost, existing queue
counts, ordered items, canonical current-item blockers where useful, and exact
partial results. Nominal totals are not a promise that future prerequisites will
be satisfied. Production does not finish while appending the sequence; a queued
prerequisite building cannot unlock another item immediately. Reuse hearth
selection and saved groups; avoid another selection register or global React state.

## Acceptance and remaining scope

Prove paid ordered queues across 40 hearths in the existing 100-owned-army mature
fixture, stable shared-budget exhaustion, prerequisite/duplicate/full-queue
refusals, individual queue additions and saved continuation. Verify template CRUD,
reload/campaign reuse, storage failures, selection independence, keyboard/narrow
controls and a separate generated production journey without debug hooks. Compare
batched versus serial archive/state/hash/observation results and worker bytes;
measure representative Huge/Legendary batch costs and the 640-command ceiling.

The bounded editor, personal library, transport and recovery integration are now
verified. The full implementation suite, thirty affected browser journeys and
generated built-production journey pass; source reviews, native captures and four
actual-worker samples are retained. The final editorial suite passes 1,977 tests
and 32 local Pages journeys. Publication/live checks remain separate, and none
of these bounded results completes a whole release gate.

This advances the existing production-sequence/template scope only. It does not
add standing repeat production, refunds/reordering, smarter governors, theater
strategy, patrol/escorts or army composition templates. AI already uses ordinary
queues; this player convenience adds no AI policy or campaign-resolution rule.
All fifteen release gates and the broader M3 milestone remain open.
