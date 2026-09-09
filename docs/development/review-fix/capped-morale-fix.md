# Capped training morale — minimal correction

## Scope and result

FIX-context follow-up to the independently reported campaign-17 aftermath defect.
The only production edit made by this context is in `packages/sim/src/warfare.ts`:
cap the removed frozen training bonus at `100 - item.morale`. The adjacent comment
explains that canonical morale still contains the entering value. No test
expectation, historical fixture, tactical kernel, campaign version, movement,
AI, UI, persistence or status document was changed by this context. The working
tree already contained the parent/other agents' changes; this is not a clean
checkout or an independent-review verdict.

The retained authorized RED is `capped-morale-red-authorized.{json,log}`: four
passing tests and one genuine failure at `battle-morale.test.ts:110`, expected
morale 85 but received 82, with strength 85 and fatigue 0 unchanged. The earlier
`capped-morale-red.*` setup failures are not the RED evidence for this fix.

## Boundary checks

- Deployment in `warfare.ts` creates separate tactical formations with
  `Math.min(100, item.morale + training.morale)`; `createBattle` validates/clones
  them. Starting combat does not assign tactical morale back to the army.
- Pending combat permits only battle commands; end-turn recovery cannot run.
  The paid capped-training regression asserts canonical morale 85 alongside
  tactical morale 100 after pending save/load, and checks that rejected end turn
  leaves the state hash unchanged. Its frozen training/tradition snapshot grants
  a nominal 18 morale. Only 15 is actually deployed and removed; immediate
  no-loss aftermath now retains 85, strength 85 and fatigue 0.
- The correction still reads `battle.developmentSnapshots`, not current company
  development. The strategic one-to-unit-base clamp and direct strength/fatigue
  assignments are unchanged. Existing integration tests cover actual casualties,
  morale loss, fatigue, rout, pursuit, manual/autoresolve parity and saves.
- The targeted suite also passes immediate command-boundary round-trips, saved
  manual rounds/withdrawal and two same-turn trained defenses without compounding.
- The explicit rule-16 branch is unchanged. Its original recorded command results
  and hashes still match (`602413fe`, `289c01b6`, `58a2012d`). The original compressed
  fixture is still 31,908 bytes with SHA-256
  `9820123d2753b5fe9d345a0e04dd21c2865d92b19c4850a9635944ba1c7677fb`, matching its
  retained trace. No historical hashes were rewritten. Campaign 17 still selects
  tactical battle 10.

## Executed verification

Workdir: `/home/telephoneheater/Work/Theandril`.
HEAD: `b0a4cd86cdb30cd9e2d3a1f0c8a78da38f7987cd` (dirty shared working tree).
Runtime: Node `v26.7.0`, pnpm `10.32.1`, Vitest `4.1.11`.

| Check | Actual result | Retained evidence in this directory |
| --- | --- | --- |
| Authorized RED, before this fix | exit 1; 4 passed, 1 failed in 1 file | `capped-morale-red-authorized.json`, `capped-morale-red-authorized.log` (pre-existing; preserved) |
| Targeted GREEN, maxWorkers 2 | exit 0; 5/5 tests, 1/1 file, no pending/todo | `capped-morale-green.json`, `capped-morale-green.log` |
| Simulation + chronicle, maxWorkers 4 | exit 0; 705/705 tests, 61/61 files, no pending/todo | `capped-morale-integration.json`, `capped-morale-integration.log` |
| Whole-project typecheck | exit 0 | `capped-morale-typecheck.log` |
| Scoped ESLint | exit 0 | `capped-morale-eslint.log` (empty: no diagnostics) |
| Working-tree whitespace check | exit 0 | `capped-morale-diff-check.log` (empty: no diagnostics) |

JSON totals were cross-checked against enumerated assertion statuses and test-file
results, not inferred from the number of suites.

Exact commands (all run from the workdir above):

```sh
pnpm exec vitest run packages/sim/src/battle-morale.test.ts --maxWorkers=2 --reporter=verbose --reporter=json --outputFile=docs/development/review-fix/capped-morale-green.json > docs/development/review-fix/capped-morale-green.log 2>&1
pnpm exec vitest run packages/sim/src packages/chronicle/src --maxWorkers=4 --reporter=verbose --reporter=json --outputFile=docs/development/review-fix/capped-morale-integration.json > docs/development/review-fix/capped-morale-integration.log 2>&1
pnpm typecheck > docs/development/review-fix/capped-morale-typecheck.log 2>&1
pnpm exec eslint packages/sim/src/warfare.ts packages/sim/src/battle-morale.test.ts > docs/development/review-fix/capped-morale-eslint.log 2>&1
git diff --check > docs/development/review-fix/capped-morale-diff-check.log 2>&1
```

## Limits and handoff

This is scoped backend verification, not whole-project test/build, browser,
performance, balance, release or deployment acceptance. The paid regression uses
explicitly authored prior experience, funding and forces; its development and
combat actions are real commands. The concurrent working tree may change after
this checkpoint. The parent owns integration and independent re-review. No
install, provider, commit, push, stash, reset or publication was performed.
