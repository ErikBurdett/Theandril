# R06 — sparse first-contact operation

## Outcome and scope

**Completed: the unchanged first-contact gate and a bounded, paid maritime-contact operation. R06 as a whole remains partial**: durable war/theater plans, generalized movement-loop recovery and executed late victory-project counterplay are not claimed complete.

Source HEAD remains `b0a4cd86cdb30cd9e2d3a1f0c8a78da38f7987cd`, with the parent's concurrent campaign/save-rules17 changes already active. The audit under `docs/hermes-analysis/` and its inputs were not modified. Both retained initial envelopes are version17. This AI change adds no canonical fields, rule version or save format; its durable transit uses the existing saved movement-route command.

| Standard / 4 / Long, seed748291 | Before | After |
| --- | ---: | ---: |
| Ashen first observed foreign entity | 137 | **95** |
| Reedbound | 130 | **94** |
| Cinder | 57 | **52** |
| Glass Tide | 56 | **51** |
| Accepted recorded commands through all-seat contact | 5,275 | 3,082 |
| Refused commands | 0 | 0 |
| Save-mirrored commands from turn26 | 4,972 | 2,790 |
| Exact full command/result replay | yes | yes |
| Final state hash | `0b85bacc` | `6d0863a2` |

The before diagnostic was allowed140 rounds to record the actual failure's later contact. The exact original test was first run with its unchanged100-turn limit and failed; the final diagnostic uses100. The final unchanged test also passes **Standard24/60 and Huge32/60**, including their all-seat assertions. No thresholds were relaxed and no seats suppressed.

## Diagnosis and implemented operation

Ashen's original paid fleets launch into a genuinely enclosed2,677-water-cell basin. Its filtered observation correctly leaves the basin uncertain while the interior remains uncharted; giving a ship ocean capability does not create an exit. Its independent land scout also surveys the western interior. Weight-only trials, and a separate closed-boundary proof experiment, did not complete the operation; one global ocean-weight trial broke dense contact. Those implementations were discarded. Their failed test logs and the boundary experiment patch remain separate from successful evidence.

The retained policy uses the existing broadest-realm scale (`area per declared seat > 12,000`), not a seed, hidden starts or canonical map access:

- One isolated land scout values new sight plus a public inward bearing. Independent ocean reconnaissance in sparse realms does not duplicate a coastal hull's shoreline preference. Zero new sight still uses the historical bounded frontier search, not a permanent center objective.
- One eligible existing caravan can select a second charted maritime outlet when only one coastal town exists. Unproved water connectivity is treated as uncertainty, **not** proof of an ocean or foreign realm. Existing connected water is excluded. Site selection retains four candidates in one observed-cell pass and makes at most four public route queries per site search; naval/land planning may check that same selected caravan. Existing local founding, sea-knowledge and movement-query node caps are unchanged.
- The caravan issues ordinary `queueMovement` and retains the saved route instead of wandering or boarding an unrelated ferry. A blocked route needs a legal refreshed quote; it is not forced through its blocker. The isolated policy funds at most two harbors.
- The new outlet's genuinely legal scout quote is reserved before caravan and victory-project savings. An inland hull in another observed basin cannot satisfy that local need. Existing queued/operating hulls and blocked production quotes end the reserve. All research, founding, construction and recruitment remain paid commands.

The exact paid chain is retained in `contact-verified-evidence.json` and the command log. For Ashen's second outlet:

- Turn25: `army.43` queues the observed route to39710; its active remaining route is present in the turn26 save.
- Turn54: that caravan founds the third hearth, paying32 coin.
- Turn65: its harbor is queued, paying20 coin.
- Turn70: its ocean warship is queued, paying48 coin. Without the basin-scoped reserve the trial did not fund this ship until97.
- Turns94/95: Reedbound `army.101` and Ashen's new-outlet ocean scout `army.191` actually see each other. Ashen's witness is at46284 and the foreign ship at45129, within its observed sight. The original inland fleet is not teleported or granted an exit.

## Verification

Runtime: Node `v26.7.0`, pnpm `10.32.1`, Vitest `4.1.11`.

| Command | Actual result |
| --- | --- |
| `pnpm exec vitest run packages/ai/src/contact.test.ts -t 'standard / 4 seats' --reporter=verbose` before edits | exit1; player contact null through100 (`contact-red.log`) |
| `pnpm exec vitest run packages/ai/src/contact-reconnaissance.test.ts --reporter=verbose` during red/green | explicit sparse land/ocean and second-outlet red regressions retained in `contact-role-red.log`, `contact-outlet-red.log`; all three pass in final suite |
| `pnpm exec vitest run packages/ai --maxWorkers=2 --reporter=verbose` final | exit0; **29 files,251 tests**; all four unchanged contact tests pass (`contact-ai-final.log`) |
| `pnpm exec tsc --noEmit` final | exit0 (`contact-typecheck-final.log`) |
| `pnpm exec eslint packages/ai docs/development/contact-diagnose.ts docs/development/contact-probe.ts` | exit0 (`contact-lint-final.log`) |
| `git diff --check -- packages/ai .agents/skills/theandril-ai/SKILL.md` | exit0 |
| `git diff --exit-code -- packages/ai/src/contact.test.ts packages/ai/src/navigation.ts packages/ai/src/sea-knowledge.ts` | exit0; gate, default navigation oracle implementation and rejected basin-proof code unchanged |
| `pnpm exec tsx docs/development/contact-diagnose.ts after standard 4 100` | exit0; ordinary observations only,3,082 accepted commands, exact command results after resume and full replay, final95/hash`6d0863a2` |
| `python docs/development/contact-finalize-evidence.py` | verified command counts, compressed-byte round trips and20 retained before/after artifacts with SHA-256 manifest |

Final AI run duration92.18s under the scoped two-worker cap. Diagnostic planner samples: before mean7.333ms/p9516.661ms, after mean4.606ms/p9515.422ms. These are **different-duration, evolving campaigns on a concurrently active workstation**, not an isolated before/after speedup benchmark. The existing navigation bounds/oracle and other AI performance regressions pass. No full-project test run, build, browser verification, long benchmark, commit, push or deployment was performed by this subagent; the parent owns broad integration.

Reproduce into a new label rather than overwrite retained evidence:

```sh
pnpm exec tsx docs/development/contact-diagnose.ts verification standard 4 100
```

The runner compares every accepted command result with the midpoint mirror and independently replays the entire record from the saved initial state. `contact-before-*` and `contact-after-*` contain the actual initial/final saves, detached snapshots, plans, commands and observer reports. `contact-after-midpoint.json.gz` retains ongoing routes. `contact-verified-evidence.json` inventories and hashes the retained artifacts. Trial raw captures were removed after retaining their summaries and failed-test logs.

## Separate R03 consumer dependency — not claimed fixed

The later parent steering identified the AI's old >20 defender guards. Inspection also found an upstream interface contradiction: current observations expose `battleDefense`20 engaged +1 reserve and direct `attack` accepts it, but `getMovementQuery` still reports “This field battle supports at most twenty defending formations.”

`pnpm exec tsx docs/development/contact-r03-interface.ts` reproduces this with a genuine authored21-defender fixture, returning exit0 after asserting the direct attack and twenty tactical defenders. Exact observed output is `contact-r03-interface.json`; AI currently does not attack that stack. This diagnostic is not a sparse-campaign input and grants no gameplay resources to the retained contact runs.

The parent-owned `packages/sim/src/movement.ts` guards in `preview` and `getMovementQuery` need to honor the canonical contingent before query-gated AI naval/field integration can be completed without bypassing the shared API. AI guards remain in `packages/ai/src/index.ts` (adjacent target selection/attack) and `packages/ai/src/naval.ts` (naval target selection). `conquest.ts` already uses authoritative `siege.canAssault` and total defender strength. No speculative >20 bypass, truncated observation, reserve-strength discount or frozen-era behavior change was retained in this contact slice.
