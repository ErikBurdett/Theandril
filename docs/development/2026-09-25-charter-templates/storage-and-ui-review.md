# Charter templates: storage checks and independent UI review

Reviewed the local candidate after baseline
`5774393676361c264e4e6d38a154cefb84f7e188` on 25 September 2026. The reviewer
authored the persistence implementation and its tests. Those checks are author
verification; the review of the separately authored template panel and
group-charter integration is independent. No unresolved blocker was found in
these reviewed paths after the retry correction below.

## Storage implementation and author verification

[`CharterTemplateStore`](../../../packages/persistence/src/charter-templates.ts)
uses the separate `theandril-preferences` IndexedDB database and `charterTemplates`
table. Its version-one rows contain a personal UUID, name, normalized name key,
existing charter focus and integral coin ceiling. Campaign saves, archives,
simulation state, rule versions and worker messages do not contain this library.
The UUID is personal preference identity and does not enter deterministic play.

The library permits at most 24 templates. Names are trimmed, bounded to forty
characters and unique after lowercase normalization. Canonical focus and ceiling
constants validate preferences without creating a second charter rule. A bounded
read of at most 25 rows detects an oversized library. Strict stored-row parsing
rejects malformed, unsupported-version, untrimmed or inconsistent data without
repairing, deleting or silently overwriting it.

Create, update and remove validate existing rows and constraints within the same
read/write transaction as their mutation. The normalized-name index provides an
additional uniqueness constraint. Competing connections serialize the final-slot
and duplicate-name decisions. Missing IDs are refused; results contain detached
public values. Quota, transaction and open failures propagate to callers.

The seven new fake-IndexedDB tests cover CRUD and reopening, validation and
missing IDs, case-insensitive uniqueness and renaming, actual concurrent
connections at the capacity boundary, malformed/future rows and oversized
libraries, rollback after real writes followed by a transaction error, denied
update recovery, and preservation of future rows in a newer database. The latter
test does not claim that Dexie refuses every higher database schema version; it
proves that unsupported template rows remain intact and unreadable.

Author checks passed:

```sh
./node_modules/.bin/vitest run packages/persistence/src/charter-templates.test.ts
./node_modules/.bin/vitest run packages/persistence/src --maxWorkers=4
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/eslint packages/persistence/src/charter-templates.ts packages/persistence/src/charter-templates.test.ts packages/persistence/src/index.ts
git diff --check
```

The persistence suite passed **47 tests across six files**, including the seven
new tests. These are focused checks, not a claim about the final repository suite.

## Independent UI findings and correction

Reviewed [`charter-templates.tsx`](../../../apps/web/src/charter-templates.tsx),
its lifecycle tests and the integration in
[`group-charters.tsx`](../../../apps/web/src/group-charters.tsx).

**Resolved: Retry retained Dexie's failed initial open.** The initial panel reused
its store when Retry templates was pressed. A probe with the actual store and
fake IndexedDB temporarily denied the preferences database open, then restored
access. The first read returned `OpenFailedError`; a second read on that same
store returned `DatabaseClosedError`; a fresh store returned an empty library.
This reproduced a real recovery defect rather than an inferred race.

The corrected `open()` refuses replacement while work is pending, closes the
idle previous session and constructs a fresh store/session before loading.
Inspection confirms that old-session identity and active-state checks remain in
place. Real denied-open/recovered-access browser verification is assigned to the
browser reviewer; this document does not substitute its unit checks for that
journey.

Other reviewed behavior:

- StrictMode setup/cleanup and later remounts create independent sessions. Cleanup
  marks an old session inactive; its late results cannot update the new panel.
  Closing a session defers the database close until an active operation settles,
  so navigation does not deliberately abort a started write.
- A write followed by a failed list refresh reports that the change was saved but
  could not be loaded. It does not falsely promise rollback. Read/write failures
  clear the parent activity flag in `finally`, retaining explicit library errors
  while allowing ordinary Apply/Revoke controls under their existing constraints.
- Selecting a saved row changes template selection and name only. Recall copies
  focus and ceiling to the form. Save, update, delete and recall have no game-order
  callback; the player must still choose Apply charters. Already-issued charters
  have no reference to personal templates.
- Loading is lazy behind the collapsed library. Its pending flag is separate from
  gameplay busy state, avoiding a self-locking parent/child feedback loop. Invalid
  draft ceilings block save/update while recall/delete remain available.

After the correction the reviewer independently ran:

```sh
./node_modules/.bin/vitest run apps/web/src/charter-templates.test.tsx apps/web/src/group-charters.test.tsx --maxWorkers=4
```

All **eight tests across two files** passed. The session tests cover deferred
close, overlapping work, stale session isolation and preserved failures; static
markup and existing command tests do not themselves mount React StrictMode or
prove browser layout. Final browser, production and repository evidence is
recorded separately by the parent and browser reviewer.

## Remaining scope

This is a bounded browser/origin-local library, with no import/export, cloud sync
or automatic live refresh of another tab's edits. Same-ID concurrent updates use
the last committed edit; capacity and name uniqueness remain transactional. No
turn/frame hot path changes, rule change or campaign pacing rerun is required for
this preferences slice. Named groups, theaters, army-order templates, production
sequences, broader governors and combined mature-realm acceptance remain open.
