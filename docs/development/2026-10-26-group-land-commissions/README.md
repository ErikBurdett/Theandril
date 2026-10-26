# Coordinated land commissions — 2026-10-26

Implementation candidate on top of `bc62e105a035e238aac8a4964cf4851c61f0fb45`.
[ADR0056](../../architecture/0056-group-land-commissions.md).

## Player outcome

Select checked hearths or recall a saved group and assign one improvement with a
remaining allowance per hearth and a common treasury reserve. An exact aggregate
shows total permission, not escrow or a purchase quote. Applying replaces each
allowance and may pay immediately in stable hearth order. Acceptance means the
commission was installed; suitable land, existing work and the reduced treasury
can leave it waiting. Ending commissions retains already paid work.

Up to 128 commands fit a batch. Larger selections are rejected without truncation;
this is not a canonical settlement cap. Selected hearths outside the current
filter remain explicit. Only confirmed accepted results clear selection; paged
receipts retain refusal reasons. Missing/mismatched results, interrupted recording
or publication, and worker crashes require saved-campaign recovery.

## Authority and cost

The worker records the existing `setLandPolicy` commands sequentially and publishes
one final permitted view. Strict whole-envelope and reviewed-hash validation happen
before the first mutation. There is no new canonical command, bulk price formula,
escrow, implicit batch autosave or speculative all-hearth tile-detail query.
Registry metadata is indexed once per observation; receipts paginate at 25.

Rules/save **37**, content **015468d1** and sim/AI/chronicle/persistence source are
unchanged ([zero diff](canonical-unchanged.log)). Existing AI still uses the same
ordinary one-job commissions. No campaign phase or AI plan changed, so this slice
does not rerun pacing or reinterpret earlier 219/329/374 headline measurements.
DH-021 remains open. No new recurring simulation hot path is introduced and the
browser captures below are functional checks, not isolated performance samples.

## Evidence and reviews

[Design review](design-review.md), [independent code review](code-review.md),
[transport tests](transport-tests.log), [transport review](transport-review.md),
[independent UI source review](ui-source-review.md).

The first [production-browser run](browser-initial.log) passes **four cases in
56.1 seconds**. All actions use the actual production controls and native worker;
production contains no development mutation hook.

The authored Huge scenario has thirty owned hearths, 128 armies and two wars. It
retains the existing fixture's disclosed terrain/ownership/infrastructure changes,
sets a finite 100-coin treasury and assigns workers through ordinary commands.
A zero-allowance initial commission enables selective removal, leaving 29 selected.
The saved group restores 30 checks; a Frontier filter explicitly hides 27 of them.
Safe-integer validation includes the exact 270215977642229730 total for thirty
maximum safe allowances, then the actual order uses 100 per hearth and reserve 10.
Four 22-coin works start (88 paid), treasury 12 remains and 26 commissions wait.
All 30 permissions are accepted. The second receipt page reaches the last five
hearths. Keyboard removal at 390px/130% text retains paid work and the exact
61-record archive replays. Loading the prior manual save restores commissions
and history exactly. [Captures and exported campaign](browser-results/).

Three further cases use a generated tiny seed 20260905 hearth, ordinary founding
and Food assignment, without authored funds, terrain or population. They damage
only the completed native worker reply after an actual paid commission: missing
results, a substituted hearth ID or a worker error event. Each leaves selection
intact, disables later orders, restores the pre-payment save exactly, then accepts
one paid retry with a single archive record. These are explicit injected failure
scenarios, not observed spontaneous gameplay defects.

The first [whole-suite run](tests.log) passed 2,485 tests and timed out in the existing
repository changelog determinism check after 33.7 seconds while the production
browser ran concurrently. The unchanged [isolated check](changelog-isolated.log)
passes all 6 cases in 15.79 seconds. No assertion or timeout was altered; the final
whole-suite run limits worker concurrency to avoid oversubscribing this machine.
The [final full suite](tests-final.log) passes **2,486 tests / 300 files in 127.49 seconds**
with `pnpm exec vitest run --maxWorkers=2`. [Typecheck](typecheck-final.log),
[lint](lint.log) and [Pages build](build-initial.log) pass. Source/visual reviews
and the complete Pages suite retain their own scopes below.

## Scope and remaining work

This completes a management surface for existing commissions within ACT-32/M3.
It adds no new gameplay scope. Whole-realm funding priorities, paid land/biome
strategy, organically developed mature-realm acceptance, DH-021, R06 and all
fifteen release gates remain open. A thirty-hearth authored exercise and a
128-command harness are distinct from a naturally played empire or scale signoff.


## Complete browser integration

The [whole Pages run](browser-full.log) covered 78 cases: 76 passed and two failed.
The home-route check still expected 21 dispatches after edition 22 had been published;
it now checks the exact current content catalogue length. The new narrow-form
assertion found the reserve input at the lower clipping edge after nearest scroll.
The harness now centers the existing form in its nested window before applying
the same 44px, horizontal and vertical visibility assertions. No application
layout, rule, assertion threshold or timeout changed. Both original traces and
screenshots remain in [browser-full-failures](browser-full-failures/).

[All seven affected cases](browser-final.log) pass in 32.8 seconds after those test
corrections: three home-route cases and all four commission journeys. Thus all
**78 distinct local Pages cases have passing results across the runs**, rather
than 78 passes in one uninterrupted run. [Final captures, exact exports and narrow
form bounds](browser-final-results/) include both 318×47.2px budget inputs wholly
within the 390px/130% window. [Visual review](visual-review.md) distinguishes the
form, receipt and explicit injected-failure states. [Final typecheck](typecheck-final.log)
and [lint](lint-final.log) pass; source gameplay remains unchanged from the
full 2,486-test verification.
