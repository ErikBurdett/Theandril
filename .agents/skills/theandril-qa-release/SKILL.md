---
name: theandril-qa-release
description: Use when adding tests, Playwright scenarios, deterministic fixtures, benchmarks, profiling, save/replay verification, browser compatibility, release hardening, or deciding whether Theandril is feature complete.
---

# QA & Release

Use `DEFINITION_OF_DONE.md` as an objective release gate.

## Test pyramid

### Unit
Pure formulas, command validation, content compilation.

### Property
Invariants such as:
- resources never become NaN;
- ownership references valid entities;
- command replay deterministic;
- generated starts reachable;
- treaties have valid parties;
- path routes are contiguous.

### Scenario
Named deterministic simulations covering complete systems.

Capture genuine old-rule saves and replay seals before changing canonical behavior. Keep their original bytes and use explicit versioned commands to verify historical continuation; do not regenerate an old seal from the new implementation. Modern fixtures must exercise current prices, upkeep and eligibility through ordinary commands.

### Browser
Playwright drives the actual UI and uses `window.__THEANDRIL__` only for observation/scenario setup, not to fake player actions.

Authored terrain fixtures must keep resource deposits consistent with the geography they replace. Clear only rewritten cells for a local patch; a wholly authored gallery may explicitly use an empty resource layer. Resource-economy scenarios must retain generated deposits and demonstrate paid extraction, worker assignment, production and persistence. Collect the browser suite before a long run to catch invalid fixture construction.

Keep the shared local test server alive independently of disposable browser runs. Coordinate source changes with running browser scenarios, and give frame-time measurements an exclusive browser/CPU window. An interrupted sample is discarded evidence, never a performance failure or a passing measurement. Read current UI/query hashes together when polling asynchronous worker convergence.

### Soak
Hundreds of automated turns with multiple factions.

### Performance
Huge and Legendary fixtures.

## Never hide failures

Do not:
- skip flaky tests without root cause;
- widen timeouts indefinitely;
- weaken assertions to make a feature "green";
- disable deterministic checks.

## Screenshot review

For map/UI work:
- capture known scenario at fixed viewport/seed;
- inspect layout, clipping, overlap, hover/selection states;
- test multiple zoom levels.

## Release report

Before 1.0 create `docs/RELEASE_1_0_REPORT.md` with objective results for every gate.
