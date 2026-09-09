# Parent UI and pixel verification

This is a follow-up checkpoint, not a replacement for the historical audit and not an independent code-review verdict. No new art or studio approval is recorded.

## Executed checks

- The parent launched its own development server only after confirming port 5193 was free. The worker's claimed retained server had been terminated with that worker. HTTP readiness returned 200.
- The parent reran the same development UI regression selection: **28 expected passes, zero failures/skips/flakes**. Structured Playwright observations are retained under `../ui-followup/parent-check-1/parent-observations/`; the aggregate is `../ui-followup/parent-check-1/parent-summary.json`.
- Both narrow occupation journeys use a **390×844** viewport. At normal and 130% text, `elementFromPoint` resolves to the actual Occupy button, `.capture-panel` has z-index 7 and `.hud-tools` has z-index 4. Both final observations have `pendingCapture: null`, Reedwatch owned by `faction.ashen_compact`, state hash `7048fc8a`, and no collected page exceptions. No forced clicks or runtime resource grants were added.
- Parent root typecheck, lint, content validation and build all return exit 0. Existing Zod annotation and chunk-size warnings are preserved in the build log, not suppressed.
- The real built-bundle production suite passes **4/4**, without development hooks. See `parent-production.json` for exact tests and `parent-verification.json` for the consolidated scope.
- All **17** captured UI/test postimage hashes still matched after the parent tests. This does not mean unrelated backend/AI/persistence review findings are approved.

## Native pixel inspection

The parent loaded the following actual PNGs through working native image inspection, rather than inferring their appearance from renderer counters:

1. Retained 130%-text Occupy-ready frame: bounded, scrollable capture panel; Occupy and the other decision controls are visible. The separate pointer evidence, not its appearance alone, establishes click reception.
2. Retained 130%-text completed-capture frame: textured hex terrain, mountain/forest regions, settlement and army imagery are rendered.
3. Retained desktop lifecycle-after-battle frame: a rendered map with settlements, army imagery and terrain is present.
4. The **exact original desktop lifecycle PNG** previously described as blank: it already contains visible rendered terrain and entities. That earlier description was incorrect for this image; no renderer code fix is claimed.
5. The parent's fresh 130%-text completed-capture PNG: terrain and entities are present, End turn is available, Labor reports four unassigned households across two settlements, and the footer records Reedwatch occupation and autosave. Some rightmost toolbar labels are partially outside the visible horizontal viewport; this tested occupation path is not a blanket accessibility or responsive-layout approval.

Exact paths, dimensions and hashes for these inspected pixels are in `parent-visual-evidence.json`. Earlier failed harness pilots and traces remain retained in `../ui-followup/REPORT.md`; no failed pilot is relabeled as valid application evidence.

## Cleanup and remaining gates

After verification the parent stopped only its own dev-server handle. Ports 5193 and 4174 were rechecked and had no listeners; user port 5173 was not stopped. Intentional server termination is not a test/build failure.

The independent UI-only review is separate and its result remains to be reconciled. Assault-validation and storage-durability fixes/re-reviews remain pending; direct AI/contact checks and the blocked AI probes were not run. No mobile hardware, browser matrix, memory/GPU benchmark, sustained performance, factory publication, commit or deployment is certified here.
