# Registry order filters: source and acceptance-boundary review

24 October 2026. Reviewed the promoted helper, registry component, two unit files,
actual canonical fixture and production journey, plus existing RealmRoster,
main-window lifetime and group-movement review wiring. This reviewer authored the
earlier pure projection draft; this is independent review of its subsequent UI
integration and regression/fixture design, not independent author separation for
that helper. The parent has separately reviewed the helper.

**No scoped source or retained-browser-evidence blocker found in the promoted
files below.** The helper and registry match the corrected reviewed draft bytes.
The final production result and independently replayed export are recorded below;
native screenshot review belongs to the separate UI reviewer. No runtime edit or
heavy test was performed by this reviewer.

## Authority and visibility

The index copies supplied canonical posting/patrol/route reports for own observed
actors. It does not inspect cells, canonical state, hidden geography, AI policy,
pathfinding or command eligibility. Foreign/missing actor IDs and mismatched
posting/patrol owner IDs are excluded. Routes enter only through an owned actor
ID; their nonempty waypoints are a canonical observation invariant. Copied values
preserve numeric hex 0 and current canonical reasons, without deriving blockers
from stale patrol lastError strings.

Postings and patrols includes disabled policies; Orders waiting unions posting
blockers, enabled patrol waiting status and paused travel; Paused patrols means a
disabled policy regardless of movement or current route. These are inventories
of observed order facts, not a second attention-priority system or a claim that
every wait is defective. Posting, patrol and travel facts render independently.
The previously flagged wording change was corrected before application:
**Route interrupted** remains unchanged and **Patrol policy: paused** distinguishes
the saved policy. Existing movement tests were not rewritten to hide that change.

No render/filter effect issues a command or movement query. Existing group plans
are still pure preparation; their public Review/Apply callbacks remain explicit
actions. Canonical rules, AI, save/schema and worker message contracts are unchanged.

## Actual registry interactions

The memoized observation index is O(armies + postings + patrols + routes). Existing
search/domain/sort produces the base cohort; counts use that cohort before the
order filter and 25-row pagination. Changing the order filter does not collapse
the other counts to one page. There is no per-row global scan or geography query.
This source cost estimate is not measured frame, worker-transfer or organic
mature-empire acceptance.

Checked IDs remain independent of the filter and are pruned only by existing
availability checks. Matching IDs derive from the final filtered cohort, while
Select matching remains additive and retains the outside-filter count. Group
caps and accepted-command removal stay intact. Changing the filter resets page,
not the actual army selection or checks. The page is clamped when observations
remove rows, and the existing selected-ID page-following behavior is retained.

The select uses the same lock as paging, sorting and row actions. Existing pending
callbacks cover selection groups, production, movement and theater work. RealmRoster
receives that aggregate and locks search, domain and realm tabs. GroupMovementOrders
sets pending before its asynchronous public query and clears it afterward; the
lock is transient, not a fictional persistent review/cancel mode. A completed
review is keyed to campaign hash, selected IDs, target and append mode. Pure
filter changes preserve those facts and therefore retain that review; no new
selection is silently substituted into Apply.

Main actually unmounts RealmRoster when a registry row is selected and returns to
the map/inspector, so local `useState('all')` resets on reopening. Campaign reset
also closes management and advances registryEpoch. This is the explicitly
documented local-filter behavior, not the superseded persistence proposal. Search
and force retain their existing parent state until normal campaign reset. The
settlement registry omits the order select and ignores army-order filtering.
An empty cohort prompts clearing search/filter instead of falsely suggesting
there are no forces in the realm.

## Meaningful fixture and tests

The fixture authors open terrain, treasury, infrastructure, 101 own companies,
names and one foreign obstruction guard before recording. Eight actual commands
then create the order states: enable/queue a patrol, move the foreign guard into
the verified next step, advance a real turn, post two actors, create a disabled
last-page patrol and queue its ordinary route. Actual movement spends the final
actor's movement to zero while leaving active travel. The interrupted route and
posting-to-hex 0 reports supply their own canonical reasons; no paused status,
blocker text or exhausted movement is assigned after recording begins.

The fixture strict-loads and exactly replays to `aa8eb3f5`. Its counts are
101 All forces / 4 Postings and patrols / 2 Orders waiting / 1 Paused patrols. The
waiting patrol plus interrupted route belongs to one actor and counts once.
The last stable-ID actor is on the fifth page of the full roster. This is an
authored workflow, not an organically recruited 101-company empire.

The promoted unit tests are the corrected reviewed static/pure contracts. The
source owner's `focused-first.log` records **36 tests across six files passing**,
including the 12 new helper/registry tests and existing realm/group checks. The
observation-only negative contracts are correctly distinguished from actual saved
histories; static markup does not prove React interaction.

Read the final TypeScript/scoped lint and browser-collection logs: checks pass and
the one production journey collects. Collection is not execution. The six files
remain byte-identical between `source-initial.json` and `source-focused.json`;
this reviewer independently checked their current hashes. No source fix was needed
after promotion. The source review is frozen at those identities.

The production journey uses the public import control and requires development
hooks absent. It exercises fifth-page lookup, native keyboard filters, composed
counts, checked-ID retention, empty search/domain cohorts and separate canonical
row reasons. A DOM MutationObserver records the actual transient pending lock
without delaying/intercepting the worker. An explicit route review is deliberately
separate from passive filtering. Exported hash/archive equality proves no command
was issued by browsing/navigation, but does not itself prove zero query traffic;
the test makes no such counter or performance claim.

The deliberate follow-up is exactly one existing `setPatrolEnabled(true)` command.
No End turn is pressed; the army and complete issued route must remain unchanged,
the disabled cohort becomes empty, and manual save/reload preserves the exact
extended archive. The test also captures the native selector detail, desktop
policy row and 390px/130% waiting/inspector controls for subsequent pixel review.
Before the real browser run, these remain test expectations, not delivered proof.

## Final production evidence, independently checked

The source owner's first real production run passes its single journey: 9.5s for
the case, 10.5s overall in `browser-first.log`. No browser failure or corrective
runtime change occurred. The integrated `full-tests.log` records 2,318 tests across
282 files in 75.04s. These are functional execution metadata, not a rendering or
filter-performance benchmark. All six promoted source hashes still match the
reviewed initial/focused identities.

This reviewer independently opened the actual retained
`browser-results/production-army-order-filt-8ec4b-plicitly-resumes-its-policy/registry-order-filter-restored.theandril`
through `importSave` and `deserializeCampaign`, rather than accepting the evidence
JSON's `exactReplay:true` field as proof. The 13,716-byte portable export has SHA-256
`d5cb9ab2cdb6c23d2f707df2296671c1c191e58a77aab1da721dafefcad0e91c`.

Its first eight records exactly equal the retained pre-browser fixture archive:

| Sequence | Actual command | Actor | Turn boundary |
| --- | --- | --- | --- |
| 1 | setPatrol | army.98 | 1→1 |
| 2 | queueMovement | army.98 | 1→1 |
| 3 | move | army.110, foreign obstruction | 1→1 |
| 4 | endTurn | current realm | 1→2 |
| 5 | setPosting | army.10 | 2→2 |
| 6 | setPosting | army.100 | 2→2 |
| 7 | setPatrol, disabled | army.99 | 2→2 |
| 8 | queueMovement | army.99 | 2→2 |
| 9 | setPatrolEnabled, enabled:true | army.99 | 2→2 |

All nine commands are accepted. Replaying the original eight gives initial hash
`aa8eb3f5`; the restored final export gives `099f7ee4`. The only added record is
the exact deliberate command
`{type:'setPatrolEnabled', factionId:'faction.ashen_compact', armyId:'army.99', enabled:true}`.
The matching `patrol_resumed` event explicitly says new assignments resume next
turn and existing travel continues. No post-import End turn, route application,
movement command or hidden setup mutation appears.

Independently compared **all armies and all routes**, not only the selected row:
they exactly match the eight-record state. Army.99 still has movement 0; its route
is active from 498 to waypoint 510 with the identical remaining path, pause reason
and known-hostile list. Its policy changes from disabled to enabled. Applying the
single ordinary resume command to an independently replayed baseline reproduces
the final canonical save bytes and recorded events exactly. Replaying the entire
nine-record archive and strict save/reload also produce identical final bytes.

The actual browser source and passed assertions establish the public-control
sequence: fifth-page actor lookup; native filter keyboard operation; 101/4/2/1
counts; search/domain composition; outside-filter checked IDs; real DOM-observed
transient review lock; unchanged completed review after a filter change; navigation
to the existing inspector; explicit policy Resume; empty paused cohort; and manual
save/reload. Intermediate exports require the original hash and exact eight-record
archive before Resume. The retained final export independently corroborates the
command boundary. Export equality is not a worker-query counter: the explicit
Review routes query is intentional, and no zero-query measurement is inferred.

The UI reviewer separately inspects desktop/narrow native captures; this reviewer
has not duplicated that image approval. The authored 101-company workflow advances
the registry slice without establishing organic mature-empire acceptance, broad
M3 completion, cross-browser certification or any complete 1.0 gate.

## Reviewed promoted identities

| File | SHA-256 |
| --- | --- |
| `apps/web/src/army-order-status.ts` | `185e20c505a11e93ead7f48aafb108e0a8e2cee6504a378f5c861c73c8be628d` |
| `apps/web/src/realm-navigation.tsx` | `814611d31790c4ac9eeddcc2219682398cab8174f5d50c812b0bf86e788f1fc0` |
| `apps/web/src/army-order-status.test.ts` | `55d12f99d9dfb5c0649de2b20b0ae380f220c0151773d28cf9bfcf0b4ac3ce1c` |
| `apps/web/src/realm-order-filter.test.tsx` | `9823c19d5e0ff62332eb2c58d0aa12023544064ae2471299e6b85ff883942d8c` |
| `tests/gameplay/army-order-filter-fixture.ts` | `ccd0e74296f2b083afcc46f5fff236e1f7b783e1aca556429098c3e9eca46af6` |
| `tests/production/army-order-filter.spec.ts` | `a4c7a2dc02dcce0b186458e19c68c40d905d78bdf153c33806889f66bab22dcc` |
