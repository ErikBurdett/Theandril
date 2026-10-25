# Group posting and charter intent boundary — 2026-10-25

## Baseline reproduction

Source commit: `e43b60cbe82823a658c0270d821386d22f31b1f4`.
The unchanged `apps/web/src/simulation.worker.ts` SHA-256 was
`0e22e1d51cb25b26dc9e2e8afe9e18b0b9eec0f0e9f04d9ec531dd9799858a53`.

Before editing that worker, the retained test excerpt was appended to
`apps/web/src/worker-queries.test.ts` and run using:

```sh
./node_modules/.bin/vitest run apps/web/src/worker-queries.test.ts -t 'legacy group intent reproduction'
```

`old-worker-runtime.log` records one passing selected test; the 31 other tests
were excluded by the explicit name filter, not disabled in source.
`old-posting-runtime.json` and `old-charter-runtime.json` contain actual runtime
hashes, journal lengths and legacy request bodies. The harness assigned each
request an ID and called the production worker module with structured cloning;
it replaced message transport, not rules, journal or storage.

The authored fixtures establish a reviewed state A, then issue a real ordinary
command producing B. A legacy group request formed from the A intention replaces
the newer policy at B and appends one accepted command. Both resulting archives
replay exactly. This is a controlled request-ordering reproduction of a missing
transport precondition; it does not establish a naturally occurring healthy UI
race. The old worker rejects unknown envelope fields, so sending it a forged
`expectedHash` would only test its existing strict envelope rejection.

## Contract after the fix

Posting and charter requests both require the hash of the observation used to
form the commands. The UI passes it through the existing roster hash, the main
thread checks it against its current published hash before enqueueing, and the
worker validates its format and compares canonical state before the first
command. Stale or malformed requests do not record, save, mutate, clear checked
entities, or require restoration. A fresh retry still uses ordinary commands and
existing result correlation. Grant/change and clear/revoke share this contract.

The six new worker regressions cover real intervening policy changes followed
by stale assignment/removal attempts, fresh retries and exact replay, plus
missing/malformed hashes for both request types. Two component tests cover the
missing-hash submission lock while preserving selection controls.

No canonical rules, save schema, journal command format, group autosave policy,
publication-failure flags or response-recovery contract changed. Broad release
checks and browser verification belong to the integrating development round.

## Focused verification

`focused-tests.log` covers six files and 70 tests. It records 69 passing tests
and one new charter-control assertion failure: the test expected the posting
control label instead of the existing “Clear hearth selection” label. Correcting
that assertion and rerunning the charter file produced five passes in
`charter-control-check.log`; no production change was needed.
`typecheck.log` records a successful typecheck. Full-suite and browser evidence
will be recorded by the integrating round.

## Integrated round 1 verification

[Full local suite](full-tests.log): **2,372 tests / 288 files**, 65.41 seconds,
four workers. Typecheck, lint and Pages production build pass. The first affected
browser run ([log](browser.log)) passed nine of ten cases; the new charter test
used a label locator that did not resolve the select. Using its actual combobox
role fixes the test without changing the product. The two strengthened intent
checks then pass in 9.3 seconds ([final log](browser-final.log)), including the
actual outgoing hash and exact retry replay. Ten distinct affected cases pass
across these runs, including all six damaged-response restoration scenarios.

The native final charter screenshot was inspected: both checks, Wealth/24 form,
review message and enabled retry are readable without overlap at 1440×1000.
[Independent source review](source-review.md) finds no scoped blocker. No new
performance or pacing claim: this is bounded request validation, not a rules change.

This is the first of four requested rounds. Publication readback is recorded
after the immutable commit exists; this packet is not a completed prompt report.

## Deployment

Published **6c77de456f3555f869af7e5d0aa43ae834d83ba6**. Both exact-commit
[GitHub workflows](actions.json) succeeded. [Public readback](public-readback/readback.json)
compares the published HTML, chunks, worker, styles, journal catalogue and change
feed with a preserved build of that exact commit. Both stale-intent cases pass
on the public site in 11.0 seconds ([log](live.log)).
