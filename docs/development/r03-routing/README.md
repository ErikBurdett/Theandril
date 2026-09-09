# R03 — movement-query and AI consumer integration

## Outcome

The current-rule movement query now agrees with canonical whole-container defense selection. A visible stack above twenty formations remains reachable/attackable when simulation supplies a legal contingent, and the queried `moveTo` starts the same battle as a direct attack on its stable target. Queued routes still never attack automatically. Rule-16 execution and observations without `battleDefense` retain the old rejection.

Field and naval AI execute legal attacks against twenty-one singleton defenders and mixed 12/9/8 containers. Both retain the complete observed stack strength in their decision, including reserves. Field attacks in an existing war use the shared quote (including actual road prices), rather than reimplementing attack cost/frontage. New contingent targets outside an existing war cause a declaration and a return for fresh observation before attack; the historical under-cap declaration policy is preserved. Target queries are bounded to one per adjacent stack. Naval selection continues to another legal target when a historical/no-preview oversized target is query-blocked.

Siege policy already consumed authoritative `siege.canAssault` and full `defenderStrength`; no conquest implementation change was needed. Added integration coverage proves a real AI siege/refresh/assault against twenty-one formations, exact replay, preserved reserves and no premature capture, plus conservative historical siege quotes and full-threat budgeting.

## Owned files

Modified:
- `packages/sim/src/movement.ts`
- `packages/ai/src/index.ts` — only adjacent field target/attack handling; the previously integrated R06 code is preserved.
- `packages/ai/src/naval.ts` — only adjacent fleet target/attack handling; reconnaissance, outlet and economic-reserve logic is preserved.

Added:
- `packages/sim/src/movement-frontage.test.ts` — four routing/compatibility regressions.
- `packages/ai/src/battle-defense.test.ts` — seventeen consumer scenarios, including real execution, saves/replay, mixed containers, no-preview/rule-16, full-threat, hidden reinforcement/foreign treasury and query-blocker contrasts.
- This directory's test logs and report.

No changes to warfare, siege, save, battle-frontage, morale implementation/tests, UI, R06 reconnaissance tests, contact gates, navigation or sea-knowledge. Campaign/save17 and tactical10 remain as supplied by the parent. The pre-fix `../contact-r03-interface.json` is intentionally retained as historical diagnostic evidence rather than overwritten.

## Strict TDD evidence

Each implementation slice followed its failing regression, then a passing rerun. Guards for already-correct historical, reserve, privacy and siege behavior were added as passing compatibility controls, not mislabeled as missing-feature red evidence.

All commands ran from `/home/telephoneheater/Work/Theandril`, Node `v26.7.0`, pnpm `10.32.1`, Vitest `4.1.11`. Test log capture used `set -o pipefail; <command> 2>&1 | tee docs/development/r03-routing/<log>` so Vitest failures remained nonzero.

| Slice | Command | RED / GREEN evidence |
| --- | --- | --- |
| Query before consumers | `pnpm exec vitest run packages/sim/src/movement-frontage.test.ts --reporter=verbose` | `movement-red.log`: exit1, preview blocked at twenty despite real 20+1 observation. |
| Query implementation | `pnpm exec vitest run packages/sim/src/movement-frontage.test.ts packages/sim/src/movement.test.ts --reporter=verbose` | `movement-green.log`: exit0,23 tests. Quoted command, direct counterpart and replay hashes agree. |
| Field AI | `pnpm exec vitest run packages/ai/src/battle-defense.test.ts --reporter=verbose` | `field-ai-red.log`: exit1, missing attack; `field-ai-green.log`: exit0. |
| Naval AI | Same targeted AI command | `naval-ai-red.log`: exit1, planner did not interrupt for legal naval battle; `naval-ai-green.log`: exit0. |
| Post-declaration re-query | Same targeted AI command | `declaration-ai-red.log`: exit1, attack issued without fresh war observation; `declaration-ai-green.log`: exit0. |
| Canonical road cost | Same targeted AI command | `road-ai-red.log`: exit1, duplicated forest cost discarded a legal one-movement attack. |
| Road GREEN + routing controls | `pnpm exec vitest run packages/sim/src/movement-frontage.test.ts packages/sim/src/movement.test.ts packages/ai/src/battle-defense.test.ts --reporter=verbose` | `road-ai-green.log`: exit0,40 tests at that checkpoint. |
| Naval fallback after blocked target | Same targeted AI command | `naval-fallback-red.log`: exit1, no legal alternative attack; `naval-fallback-green.log`: exit0,15 tests at that checkpoint. |

`movement-guards.log` is a passing four-test compatibility checkpoint. `consumer-guards.log` retains one **fixture-construction error**, not a game-rule red: a scout was assigned30 strength although its content maximum is20. The fixture was corrected to a legal20-strength reserve against a30-strength attacker; the full40-strength threat still exceeds the attacker while the20-strength contingent does not. No production rule or assertion was weakened to accept an invalid save.

## Final verification

| Exact command | Actual result |
| --- | --- |
| `pnpm exec vitest run packages/ai --maxWorkers=2 --reporter=verbose` | exit0; **30 files,268 tests**,106.28s (`ai-final.log`). Includes all17 new consumer scenarios, all R06 reconnaissance scenarios, all four unchanged contact tests and the existing navigation oracle/bounds. |
| `pnpm exec vitest run packages/sim/src/movement-frontage.test.ts packages/sim/src/movement.test.ts --reporter=verbose` | exit0; **2 files,26 tests** (`movement-final.log`). |
| `pnpm exec tsc --noEmit` | exit0 (`typecheck-final.log`, empty successful stdout). |
| `pnpm exec eslint packages/sim/src/movement.ts packages/sim/src/movement-frontage.test.ts packages/ai/src/index.ts packages/ai/src/naval.ts packages/ai/src/battle-defense.test.ts` | exit0 (`lint-final.log`, empty successful stdout). |
| `git diff --check -- packages/sim/src/movement.ts packages/sim/src/movement-frontage.test.ts packages/ai/src/index.ts packages/ai/src/naval.ts packages/ai/src/battle-defense.test.ts` | exit0. |
| `git diff --exit-code -- packages/ai/src/contact.test.ts packages/ai/src/navigation.ts packages/ai/src/sea-knowledge.ts` | exit0; those tracked gates/oracles remain unmodified. |

The Standard4/100, Standard24/60 and Huge32/60 contact gates all pass with unchanged thresholds and seat assertions. No contact weights, maritime-outlet decisions, recruitment reserves or money sources changed in this slice.

## Limits / parent handoff

This is a bounded R03 query/consumer completion, not a1.0 or complete R06 strategic-AI claim. The authored wounded-stack tests prove legality, whole-container preservation, full-threat estimates and exact command/save/replay boundaries; they are not balance or mature-campaign performance certification. No isolated benchmark, browser test, full simulation/project suite or build was run here. The parent owns those checks and the shared implementation-status update.

The separate morale regression was briefly consent-blocked; no indirect full-sim run bypassed that block. Authorization was subsequently lifted, but this child retained its movement/AI ownership and did not run or edit the separate morale regression. The parent is integrating its independent fix. No commits, pushes, stashes, resets, deployment or persistent jobs were performed.
