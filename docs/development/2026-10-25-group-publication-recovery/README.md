# Recover after group policy publication fails — round 3, 2026-10-25

Baseline: 64b5d9ef1583d672944b1a5c0a836dae8f845ed5. This is distinct from stale
intent rejection (round 1) and malformed reply correlation. Here the real worker
successfully applies two orders, then its own final `self.postMessage` throws.

## Reproduction before the fix

[Actual worker regressions](old-worker-tests.log) fail for both posting and
charter because `recoveryRequired` is missing after two recorded mutations.
[Production browser regressions](old-browser.log) also both fail. A module-worker
wrapper imports the real built worker, buffering unchanged requests during
bootstrap, and throws once inside final publication. It captures actual mutated
hash/results in that exception; it neither replaces command outcomes nor creates
simulation state. Both old-browser evidence JSON files show End turn enabled and
no restoration flag after both commands succeeded:

- Initial hash 1a71b4f1 → posting 782d91b7.
- Initial hash 1a71b4f1 → charter caafaa3d.

This controlled failure injection establishes recovery behavior, not a measured
frequency of browser transport failures. Native screenshots and failure traces
are retained in `old-browser-results/`.

## Correction

A request-scoped posting/charter started marker follows the existing travel,
production and patrol convention. It is set only after complete envelope/hash
preflight, immediately before the first canonical order. An exception thereafter
locks further commands/save/export and publishes the same restoration-required
error contract already handled by the client. Load/import/new campaign clears
the lock. No retry occurs automatically. Stale intent still rejects normally
without requiring restoration; partial recording failures retain their existing
recovery behavior. The conservative marker also locks after an uncertain failed
publication of all refusals, because the response cannot establish completion.

No autosave policy, canonical rules, saved fields, AI behavior or pacing changed.
Rules/save 35 and content 015468d1 remain. M3, DH-021, R06 and all 15 gates stay open.

## Verification

The two focused worker regressions pass ([log](fixed-worker-tests.log)): mutated
hash, two records, no autosave, locked retry/save/export, exact manual restoration,
fresh retry and exact replay. The other 37 worker tests are excluded only by this
focused name filter; full-suite verification follows. Typecheck/lint/Pages build
pass. Integrated browser, full-suite and deployment evidence are recorded below.

All ten affected Pages cases pass in 51.1 seconds ([browser log](browser.log)),
including both real-worker publication faults, both stale-intent cases and all
six damaged-reply cases. Both new faults require restoration, preserve checks,
restore the exact zero-record manual archive and then retry to the exact
two-record archive with full replay. Native recovery screenshots were inspected;
controls are visibly locked. [Independent review](source-review.md) passes.

[Full local suite](full-tests.log): **2,386 tests / 289 files pass**, 62.68 seconds
with four workers. No disabled source tests, timeout increases or rule changes.

## Deployment

Published **47e130fc7c07a37eb8f3a1f3c46d963dc4a76e9c**. Both exact-commit
[workflows](actions.json) pass and [public readback](public-readback/readback.json)
matches the preserved build. The first live run passed posting then encountered
Chromium ERR_NETWORK_CHANGED before the charter page loaded ([log](live.log));
this is retained, not counted as a game result. The unchanged two cases both
pass on rerun in12.9 seconds ([final log](live-final.log)).
