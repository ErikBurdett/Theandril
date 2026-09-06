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

### Browser
Playwright drives the actual UI and uses `window.__THEANDRIL__` only for observation/scenario setup, not to fake player actions.

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

