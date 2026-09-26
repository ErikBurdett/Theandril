# Charter policy templates: independent storage review

Reviewed the local ACT-32 candidate after baseline
`5774393676361c264e4e6d38a154cefb84f7e188` on 2026-09-25. No blocking defect was
found in the reviewed storage implementation.

The reviewer authored the template panel and its group-charter integration.
Independent review therefore covers the separately authored
[`charter-templates.ts`](../../../packages/persistence/src/charter-templates.ts),
its tests and its export from the persistence package. The UI observations below
are author self-review, not independent UI or visual acceptance.

## Persistence boundary

- The default database is `theandril-preferences`, containing only the
  `charterTemplates` table. Templates contain a stable personal ID, name, focus
  and ceiling; no faction, settlement selection, canonical state, command or
  campaign archive enters this store. The existing campaign save formats and
  tables are unchanged. Random UUIDs identify preferences only.
- Input is strictly parsed. Names are trimmed and limited to forty characters;
  focus and integral ceilings use the existing canonical constants. Unknown
  input fields are refused. Stored rows additionally require the supported row
  version, valid ID, already-trimmed name and matching normalized name key.
- Each read inspects at most twenty-five rows, enough to reject an oversized
  library above the twenty-four-template cap. Unsupported, malformed and
  inconsistent rows cause an explicit error. The implementation does not drop,
  repair or overwrite them to make loading succeed.
- Create, update and remove validate the stored library inside a read/write
  transaction. Unique normalized names and capacity are checked inside that same
  transaction; the indexes also enforce unique IDs and name keys. Competing
  connections cannot both consume the final slot or save the same normalized
  name. Updates and removals reject missing IDs instead of silently creating or
  ignoring a row.
- Results are detached values, and list ordering uses stable string comparisons.
  Transaction and quota failures propagate to the UI; an unsuccessful operation
  is not reported as a completed save. The tests preserve prior rows after both
  a denied write and a surrounding transaction failure following real writes.

## UI integration self-review

The library loads when the player first opens the collapsed Charter templates
section for a nonempty hearth selection. Choosing an entry changes the selected
template and its editable name. Only Recall template copies focus and ceiling
into the existing charter form. Saving, updating, deleting and recalling have no
reference to the game-order callback; Apply charters remains explicit.

The storage session rejects overlapping work, closes its connection immediately
when idle, and defers close until an in-flight operation settles after navigation.
Completion handlers compare the current session identity and active state before
changing presentation. A remounted panel cannot receive an old panel's results.

Storage activity temporarily locks the group charter fields and actions. On a
read or write rejection, the final handler clears that activity flag, so the
ordinary Apply and Revoke controls are available according to their existing
gameplay and ceiling requirements. Only the template library remains unavailable
until Retry templates successfully reads storage. Its previous list and dirty
name are retained during the failure. A successful write followed by a failed
refresh is reported as a saved change with an unreadable library, not as an
assurance that nothing was saved.

The separate independent UI reviewer found a retry defect: Dexie retains an
initial failed-open state, so reusing that store could keep the library closed
after browser access returned. Retry now retires the idle session and creates a
fresh connection before loading. The pending guard prevents replacement during
active work, and old-session result checks remain in place. The assigned browser
journey will exercise transient denial followed by a real save after Retry.

The template panel receives gameplay busy state separately from its own pending
flag, avoiding a feedback loop that would leave it locked after a completed
operation. An invalid unsubmitted ceiling disables template save/update while
leaving recall/delete available. Revocation keeps its existing independent ceiling
behavior.

## Checks and limits

The reviewer independently ran the new persistence test file: **7 tests passed**.
It covers reopening and detached values, exact validation, duplicate names and
renames, concurrent connections and capacity, malformed and future-version rows,
rollback/denied-write recovery, and preservation of a newer database's contents.

The reviewer's separate UI and lifecycle checks passed **8 tests across two
files**, covering pending-write disposal, old/new session isolation, explicit
retry after storage rejection, collapsed presentation and existing charter
command/queue behavior. Whole-project typecheck, scoped UI lint and whitespace
checks also passed. These counts are separate checkpoint scopes, not a substitute
for final full-suite or browser evidence.

Browser keyboard/narrow-layout, refresh, canonical-hash independence and storage
failure journeys are assigned separately and were not run by this reviewer at
this checkpoint. The library is local to the current browser origin; it has no
cross-device sync, import/export or live refresh of another open tab's edits.
Changing a saved template does not update already-issued charters. No campaign
rule, save version, pacing result or 1.0 release gate is accepted by this review.
