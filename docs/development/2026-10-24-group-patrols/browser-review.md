# Group patrol browser evidence review

Scoped verdict: no blocker found in the retained production journey or three recovery cases. This review authored the normal fixture/journey and is not an independent review of those tests. It separately inspected the parent's recovery source and retained artifacts. No tests, builds or campaigns were rerun for this review.

The [first run](browser-first.log) passed seven cases in 44.5 seconds: registry filters, group movement, group postings, three new recovery cases and the new normal group-patrol journey (9.0 seconds). The normal journey used the built application and real simulation worker through public import/export/save/load controls; `window.__THEANDRIL__` was absent. Source identities, image dimensions/hashes and artifact checks are recorded in [browser-evidence.json](browser-evidence.json).

## Ordinary command history

The authored infrastructure is openly described in [the fixture](../../../tests/gameplay/group-patrol-fixture.ts): 101 owned companies, two hearths, treasury, open terrain and a foreign obstruction guard. Orders, blockers, route state and spent movement are produced by ordinary commands. This is not a claim of earned recruitment or an organically played 101-company campaign.

| Phase | Added accepted ordinary commands | Archive records | Canonical state hash | Unaffected checked actors |
| --- | ---: | ---: | --- | ---: |
| Imported fixture | 105 setup records | 105 | `c6f43460` | — |
| Pause | 49 `setPatrolEnabled(false)` | 154 | `acebff08` | 52 |
| Resume | 99 `setPatrolEnabled(true)` | 253 | `f89dea4d` | 2 |
| Remove | 99 `clearPatrol` | 352 | `a488bb10` | 2 |
| Manual save/load | 0 | 352 | `a488bb10` | — |

Every phase export was compared in the browser test with a separate journal built from the expected ordinary commands, including the entire archive and serialized game. Each export was replayed exactly by the shared export helper and again by the normal journey's assertions. The later read-only inspection of all four retained compressed exports confirmed accepted rules-35 records, unchanged earlier record prefixes, exact restored snapshot/archive equality, unique intended actor IDs per batch, and unchanged army/route/posting values across the exports. Compressed download bytes can differ; exactness here describes the canonical snapshot and archive, not gzip byte identity. Save-envelope `stateChecksum` values in the evidence JSON are also distinct from canonical `stateHash` values above.

All armies, both routes and both postings were compared against the original fixture after each batch. The genuinely interrupted route remains paused with the foreign-blocker reason after Resume; the other route remains active with its previously spent movement and same path. The war-pause option remains true through Pause/Resume and disappears only when its saved patrol is explicitly removed. No End turn or movement command is submitted during these batches.

## Selection and interaction evidence

The journey checks selection across order filters, including 51 checked actors outside the first paused filter and all 101 outside the empty paused filter before Remove. Accepted actors leave selection; unaffected actors remain checked. It traverses all result pages for 49 and 99 accepted commands with a 25-row page size. An observer of actual DOM disabled attributes confirms the pending worker batch locks the registry filter; it does not delay or intercept the worker.

Native keyboard selection and Enter activation work at 390×844 with 130% text. The checked no-policy actors remain selected after all patrols are removed. The desktop and narrow screenshots show readable controls, visible unchanged-travel explanation, and no horizontal document overflow. The narrow capture is deliberately scrolled within the registry and does not purport to show the entire panel at once. The native action-control capture is 318×149 and 31,103 bytes, without resizing or transformation. The UI owner handles publication-image approval separately.

## Recovery cases and boundaries

The [three recovery cases](../../../tests/production/group-patrol-recovery.spec.ts) deliberately damage a completed native worker presentation reply: missing results, an unexpected actor ID, or a dispatched worker error after the real command. They do **not** fabricate canonical game state, acceptance or a simulation refusal. Before damage, the captured real reply must equal the independently applied ordinary `setPatrolEnabled(true)` result and canonical hash.

All three assert no misleading success results, retained checked selection, clear recovery instructions, disabled retry/End turn/filter controls, and released pending UI state. Public Load restores the explicit pre-action manual save and its eight-record archive. One subsequent ordinary retry produces the expected nine-record state with all armies/routes unchanged and exact replay through the shared export helper. The retained evidence for these cases is their passing source assertions, console log and screenshots; the recovery exports were checked during the run but not separately written to packet files. The synthetic worker-error event demonstrates the application's error-handling boundary, not an actual operating-system worker crash.

These results do not claim strategic pacing changes, automatic route resumption, escort operations, or completion of the remaining 1.0 gates. Genuine canonical refusals and stale-hash/damaged reply validation are additionally covered by the worker/client tests; this normal production journey intentionally submits legal owned-policy commands.
