# Budgeted land commissions, deployed — 2026-10-25

## Prompt

“Continue.” Standing instruction: develop toward 1.0, commit and deploy each
feature or fix to the GitHub Pages development site.

## Delivered

An owned hearth can commission one exact improvement with a remaining coin
allowance and treasury reserve. It pays ordinary prices for suitable worked,
unimproved cells immediately when possible, then after upkeep and charters.
Existing sites and mismatched resource deposits remain protected. The panel shows
the next quote or reason for waiting. Successful direct work takes control back;
ending a commission retains already paid work. Ownership loss ends permission.

The allowance is remaining total permission, not escrow or a recurring budget.
Applying again replaces it; other spending can reduce the treasury below the
reserve. Siege and occupation wait. AI adopts conservatively funded single jobs
when the existing strategic planner chooses exactly the same work.

Feature `24a710a` and reviewed dispatch 22 `3ae2ba6` are separately deployed and
publicly verified. [Play](https://erikburdett.github.io/Theandril/) ·
[Give land work a budget](https://erikburdett.github.io/Theandril/updates/dispatches/?dispatch=land-commissions).
ACT-32/M3 advances; no tracked issue or release gate is declared closed.

## Changed

- `packages/sim`: canonical permission registry, command, paid turn phase,
  ownership/manual cleanup, compact observations and selected next-work quote.
  Rules/save 37; content 015468d1 unchanged.
- `packages/ai`: conservative one-job adoption, full worked-cell coverage and
  worker-change gates, continued respect for player-funded commissions.
- `packages/chronicle` and `packages/persistence`: version 37 compatibility,
  genuine version-36 fixtures and exact historical/mixed replay tests.
- `apps/web`: individual commission controls, safe integer validation, locked
  stale requests, clear remaining allowance/reserve and manual override behavior.
- Production browser scenarios, paid-phase benchmark, pacing evidence, ADR0055,
  canonical status and reviewed dispatch with exact native screenshot provenance.

## Verified

[Implementation packet](../2026-10-25-land-commissions/README.md) and
[publication packet](../2026-10-25-land-commissions-publication/README.md):

- [Final full suite](../2026-10-25-land-commissions-publication/tests.log):
  **2,463 tests / 298 files pass in 70.85 seconds**. Typecheck, lint, content/art
  validation and the production Pages build pass.
- [Whole local Pages suite](../2026-10-25-land-commissions/browser-full.log):
  **all 74 cases pass in 5.3 minutes**. After journal integration,
  [all nineteen affected local cases](../2026-10-25-land-commissions-publication/browser-final.log)
  pass in 28.0 seconds. Scopes overlap and are not additive.
- Both exact-commit GitHub workflows and exact public build/feed/source/image
  readback pass for both feature and journal publication.
- [Public journal run](../2026-10-25-land-commissions-publication/live.log) passes
  sixteen cases; three fail during navigation or asset/worker startup. Retained
  traces show network-change errors and an aborted worker request. An
  [unchanged rerun](../2026-10-25-land-commissions-publication/live-retry.log)
  passes those three in 14.0 seconds: **nineteen distinct affected live cases**
  have passing results across the two runs, not one uninterrupted pass.
- Generated-hearth journeys pay for two real works through turn 7 and preserve
  exact save restoration/replay. Narrow 130% text and keyboard controls validate
  budgets, cancellation without refund and successful direct-work takeover.
- [Prechange metadata](../2026-10-25-land-commissions/prechange-metadata.json)
  records genuinely captured version-36 save/archive bytes and original seals.
  Strict historical schemas and mixed version-36/37 replay pass.
- [Headline pacing](../2026-10-25-land-commissions/pacing-after.json) remains
  Standard/Long/Epic **219/329/374** turns, with 18/22/29 commissions and no refused
  orders. Matching finish turns do not prove identical full states or other seeds.
- [Authored paid-phase benchmark](../2026-10-25-land-commissions/benchmark.json)
  exercises 32/40 commissions and a 10,000-claim estate with real purchases and
  fifteen-turn saved mirrors. Paid-phase p95 is 0.463/1.591/3.488 ms. Timings
  exclude hashing, cloning, serialization, validation, AI and browser/disk costs.
- Independent simulation/AI, UI, imagery, editorial and sixteen-capture reader
  reviews pass. Historical journal/image bytes are preserved. The new exact
  native strip adds 14,026 bytes within the existing image budget.

Initial fixture, test-import, stale journal expectation and browser startup
failures are retained and explained. No historical seal, runtime eligibility,
assertion or timeout was weakened to obtain passing verification.

## Not done / blocked / caveats

Individual commissions are complete for this slice; coordinated group management,
broader land/cultivation strategy and organically developed mature-realm acceptance
remain open. The benchmark authors ownership, population, purses and local terrain;
it is not a naturally played empire or browser transfer-budget proof. Mobile
imagery requires its readable caption and inspection links.

DH-021 remains open: headline Long 329 is late against the roughly 300-turn target;
prior adverse seeds were not rerun. ACT-32/M3, R06 and all fifteen release gates
remain open. Deployment is development availability, not 1.0 acceptance. The
successful live rerun does not establish recovery from every network/worker-load
failure.

The user's primary checkout `/home/telephoneheater/Work/Theandril` is on `master`,
already synchronized with published `3ae2ba6` before this final evidence/report
commit. The final commit contains documentation and retained verification only;
its workflow and exact public-byte readback are checked after publication.

## Follow-ups

Coordinate commissions across checked hearths with explicit budgets and per-hearth
receipts; preserve material consequences and manual override. Then broaden paid
land/cultivation decisions and measure combined delegation in organically developed
mature realms. Keep pacing and all existing release gates open until evidenced.
