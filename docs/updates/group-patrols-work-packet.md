# Change patrol policies across the checked companies

**Dispatch 18** · ID `group-patrols` · publication date 25 October 2026.
Implementation revision: `8d880eb60cdca549d5ff1086ef95e095e81feea5`.
Implementation evidence remains in `docs/development/2026-10-24-group-patrols/`;
publication checks and live readback belong to
`docs/development/2026-10-24-group-patrol-publication/`.
The implementation crossed local midnight before publication preparation; stable
evidence paths retain their original date. All seventeen historical dispatches
and twenty approved image records/bytes remain unchanged.

## Player story and delivered boundary

The registry can find paused policies across a large roster. Group patrols now
uses the same checked companies to offer three explicit counted actions:
**Pause enabled patrols**, **Resume paused patrols**, and **Remove selected
patrols**. Checks outside the current filter remain included and disclosed.
Armies without policies or already in the requested state receive no command
and stay checked. Confirmed accepted armies leave the selection; refused armies
remain with actual reasons. The existing limit is 128 owned land armies ashore;
an oversized external selection produces no batch, not a silent prefix.

Pause and Remove stop future assignments. Resume allows future assignments but
does not resume a paused route. Existing issued travel remains unchanged;
Group travel cancellation is separate. Removal discards endpoints and the war
option. Resume preserves configuration and warns when Pause when war begins
could pause the policy again next turn. No endpoint-creation action or automatic
player recovery is introduced.

One homogeneous batch carries the current campaign hash. Main and worker validate
that hash before ordinary canonical `setPatrolEnabled`/`clearPatrol` execution.
Exact response identities and order must match before state display. Missing or
damaged replies and worker failure can happen after mutation: they retain checks,
lock further play and require saved restoration rather than automatic retry.
Pending controls lock selection, filters, pages, other group actions and parent
navigation. Refused results appear first with 25 rows per result page.

## Executed evidence

The pinned implementation passes **2,339 tests across 285 files in 62.78s**, plus
typecheck, lint and the production build. **Seven affected production journeys
pass on their first run in 44.5s**: one normal group-patrol workflow, three new
response-failure cases and existing registry, travel and posting journeys.
The normal case takes 9.0s; that is functional metadata, not a speed claim.
Focused UI/worker counts overlap the full suite and are not additive. Retained
initial authoring failures include a UI assertion that assumed a named company
was on the first stable-ID page; the correction checks all rendered locks.

The authored 101-company campaign has 99 policies, two hearths, treasury and a
foreign obstruction guard. Its orders, movement exhaustion and route interruption
use ordinary canonical commands. It is not an organically developed large realm.
Pause/Resume/Remove accept **49/99/99** commands, with **52/2/2** unaffected checks.
The archive grows **105 → 154 → 253 → 352**, with canonical hashes
`c6f43460 → acebff08 → f89dea4d → a488bb10`. Armies, active and paused routes,
and postings remain identical. The war option survives until removal. Public
controls exercise actual pending locks, outside-filter selection, enlarged-text
keyboard removal and exact per-phase replay/export/manual restoration.

Three separate recovery cases damage the completed native worker response or
inject its error after a real mutation. They restore the actual eight-record
manual save before one deliberate retry to nine records. These are presentation
fault injections, not organic refusals or physical process-kill proof. Worker
regressions separately cover genuine canonical partial refusal and interrupted
recording.

Six single samples process 128 policies per action on Huge and Legendary fixtures
using the actual worker module in a same-thread Node host with structuredClone
and fake IndexedDB. Huge Pause/Resume/Remove: **330.824/382.883/389.917ms**;
Legendary: **668.912/634.563/673.485ms**. Each produces 128 ordinary records, one
autosave and one final state, with no detail/path-query request and exact serial
state, replay and autosave. Ordinary fog remains: only 61 cells are observed.
These are not medians, browser Worker latency, physical storage, frame times,
whole-turn acceptance or organic large-realm proof. Setup/import/export/replay
are outside timing; raw component costs remain linked.

## Exact imagery and review

The approved source is
`docs/development/2026-10-24-group-patrols/browser-first-results/production-group-patrols-p-8d403-hout-changing-issued-travel/group-patrol-actions-native.png`.
Public copy: `apps/web/public/updates/group-patrol-actions.png`.
**318 × 149, 31,103 bytes**, SHA-256
`5a1a6eb8f4cfaf0b2c66fb9832887cd16faf009d70dc36185565b8c76cd921fc`.
It is a native locator capture at 390 × 844 and 130% text, after Resume and before
Remove: Pause 99 / disabled Resume 0 / Remove 99. The caption names the authored
fixture and excludes selection context and outcome proof. No transformation,
resize, re-encoding or generation applies. The original six full/detail/recovery
images were inspected; final journal layout inspection remains separate.

Inventory is **3,512,941 bytes**, leaving **157,075** under the unchanged
**3,670,016-byte (3.5 MiB)** cap. Source/public provenance match, historical
metadata and image bytes remain unchanged, and larger context captures remain
source-pinned evidence rather than extra journal inventory.

## Scope, handoff and publication status

One bounded delivered bullet extends the existing empire-management item:
**90 delivered / 49 remaining**, with 23 items still 6 completed, 13 in progress
and 4 pending. No new gameplay obligation is added or removed. Rules/save remain
35 and content015468d1; canonical rules, AI, prices and automatic turns are
unchanged. No new pacing run is claimed. M3, organic mature-realm acceptance,
DH-021 and all fifteen release gates remain open.

Publication source lives in `apps/web/src/updates/group-patrol-dispatch.ts` and
the existing catalogue/media manifests. The focused publication scope passes
34 tests across four files; scoped lint passes and 20 journal/home/roadmap
journeys collect. Parent integration owns the complete checks/build/Pages run,
independent final rendered review, commit/deploy and exact public readback.
The runtime publication files are frozen; source hashes, expected public facts,
commands and remaining review boundaries are in the publication packet.
Deployment remains a development checkpoint, not 1.0 acceptance.
