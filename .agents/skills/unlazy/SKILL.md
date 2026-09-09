---
name: unlazy
description: Continue authorized Theandril development through implemented, tested vertical slices toward the repository's 1.0 gates. Use for /unlazy, $unlazy, or requests to keep coding toward 1.0; not for read-only reviews or unrelated projects.
---

# Unlazy — finish the playable slice

Use this repository-local skill to turn continued development into verified game behavior. It is a work discipline, not a background service or a claim that 1.0 can be finished in one response. Keep the current user's scope and execution permissions intact.

## Choose work from evidence

Read `AGENTS.md`, the current implementation status, release scope/done gates and the relevant repository skills. For audit-driven work, read `docs/1.0-DEVELOPMENT.md`: keep `hermes-analysis` as the historical baseline and record fixes in new implementation evidence. Inspect actual code and Git history; preserve unrelated working-tree changes. Use the recorded next priority as a starting point, not proof it is still absent or correct.

Pick the highest-leverage unfinished player outcome whose dependencies exist. State a compact acceptance target and explicit file ownership, then implement. Documentation, extra plans, scaffolds and unused abstractions do not substitute for that outcome. If inspection reveals a concrete blocking defect, fix it within scope before building on it.

## Carry one feature across its boundaries

For a game-rule slice, finish canonical commands/state, meaningful content, observation filtering, human controls, AI use, saves/replay and tests together. Delegate independent packages with agreed interfaces; the parent integrates. Preserve a pre-change fixture when historical behavior or save seals need evidence before changing the implementation.

Keep working through reproducible failures: diagnose, make a scoped fix, rerun the failed check, then rerun affected integration checks. Do not weaken assertions, fabricate outcomes, suppress real AI activity or raise limits solely to obtain a passing result. Distinguish a justified rules change from a regression, and retain an independent old-rules fixture when compatibility is required.

## Verify, record, continue

Before calling a meaningful slice complete:

- Run typecheck, lint and relevant unit/property tests; run the full suite and build at integration boundaries.
- Exercise player-facing behavior through real Playwright controls and inspect screenshots, including narrow layouts where affected.
- Verify deterministic command results, saved continuation and replay after rules changes.
- Measure affected hot paths on representative workloads; label synthetic state, activity, timing scope and unmeasured limits honestly.
- Update `docs/IMPLEMENTATION_STATUS.md` with completed behavior, actual evidence, regressions, schema changes and the next useful slice.

After a green checkpoint, continue to the next dependency-ready slice when it remains within the active request and available execution window. Avoid ending with only a proposal when a scoped implementation is still underway. If interrupted or approaching an execution/context boundary, leave a truthful checkpoint identifying unfinished files, running checks and the next concrete action; do not label unfinished work complete.

Stop and report when the user redirects/stops, an agreed outcome is reached, required authority or information is missing after safe in-scope alternatives are exhausted, or the execution window requires a handoff. Repeatedly retrying the same unchanged failure is not progress. Never create automatic jobs, spend on external services, publish, commit or deploy merely because this skill says to continue. Only declare 1.0 when every repository release gate has evidence.
