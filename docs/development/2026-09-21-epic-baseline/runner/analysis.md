# Read-only test-runner resource investigation

Final disposition: retain the existing default configuration. All three diagnostic cases still fail Epic's unchanged 60-second budget. Eight workers reduce aggregate CPU cost but barely change whole-suite or Epic elapsed time; four workers make the full suite slower. These single cases do not establish that runner contention is the main cause, justify policy adoption, or close M0. No further repeats are warranted by these results. No production configuration, test, timeout, command count or campaign activity was changed for this investigation; the parent executed the full-suite runs.

## What the current runner actually does

[`vitest.config.ts`](../../../../vitest.config.ts) specifies the file include patterns and a 20-second default test timeout. It sets no pool, worker count, file parallelism or isolation override. [`package.json`](../../../../package.json) runs `vitest run` for `pnpm test`. The Epic case explicitly retains its 60,000 ms timeout in [`chronicle-victory.test.ts`](../../../../tests/headless/chronicle-victory.test.ts), together with every long-campaign, mirror, history and replay assertion.

The installed and locked Vitest version is **4.1.11**. Inspection of that installed implementation found:

- `dist/chunks/coverage.DM_a_rWm.js:180` defaults the pool to `forks`. Line 223 leaves file parallelism enabled in ordinary test mode; disabling it forces one worker. Line 380 accepts `VITEST_MAX_WORKERS` as an override.
- `dist/chunks/cli-api.CnMVyzaz.js:3832` resolves an explicit project/global worker count first; otherwise a non-watch run uses `Math.max(os.availableParallelism() - 1, 1)`, with `os.cpus().length` as the compatibility fallback.
- `dist/chunks/defaults.9aQKnqFk.js:47` defaults isolation to true.

The current inspection process has no `VITEST_MAX_WORKERS`, `VITEST_POOL`, `NODE_OPTIONS` or `CI` override. This is a present observation, not proof of every environment variable in earlier runs. Given these defaults and this host's reported parallelism, an ordinary full run can admit **up to 31 fork workers**. That is an upper bound, not a claim that 31 workers remain busy throughout the suite.

The [verification workflow](../../../../.github/workflows/verify.yml) uses `ubuntu-latest`, Node 22, a frozen dependency install and unqualified `pnpm test`. It does not declare a worker budget or fixed CPU/memory allocation. It runs headless tests, build, browser tests and separate campaign/rendering benchmarks as distinct sequential steps. Local resource measurements must not be presented as hosted runner specifications.

## Host observations

Both the shell's Node **26.7.0** and the verification runtime at `/home/telephoneheater/.local/share/mise/installs/node/22.23.2/bin/node` report `availableParallelism() === 32` and 32 logical CPUs. Comparisons should explicitly use Node 22.23.2; inheriting the shell's different runtime would introduce another variable.

The local CPU identifies as an Intel Core i9-13900K. `lscpu -e=CPU,CORE,SOCKET,MAXMHZ,MINMHZ` exposes 24 physical core IDs: the first eight each have two logical CPUs, while the other sixteen have one each. Reported maximum frequencies differ between those groups (5.5–5.8 GHz and 4.3 GHz). The process affinity allows CPUs 0–31. Logical CPU count therefore does not describe 32 identical independent execution resources. Fork workers also share memory bandwidth, caches and the transform coordinator; their runtimes can have additional helper threads.

The readable cgroup ancestors of `herdr.service` report `cpu.max = max 100000`, zero cumulative CPU throttle counters, `memory.max = max`, and zero memory OOM events. The service's own `cpu.max` is not exposed. There is no visible ancestor CPU quota or OOM evidence supporting a quota-specific explanation. The host exposes approximately 31.0 GiB total RAM and approximately 14.4 GiB free at this inspection. Shared user/service memory readings include other activity and are **not** test-process peak or retained-memory measurements. Neither current counters nor the absence of OOM events exclude temporary cache, bandwidth, frequency or scheduler contention during a previous run.

## What the retained timing evidence can support

| Retained run | Epic elapsed | Complete suite elapsed | Scope |
| --- | ---: | ---: | --- |
| [Previous default full run](../../2026-09-21-campaign-continuation/full-headless-final.log) | 64.312 s, fails 60 s | 90.01 s | 1,818/1,819 tests, 218/219 files pass |
| [Unchanged isolated profile](../profile/epic-before.log) | 52.46 s, passes | 53.05 s for selected file | Epic selected; Short unselected, not disabled |

The difference is 11.852 seconds, approximately **22.6%** above the isolated case. Contention is a plausible contributor. This is not a paired experiment: the runs differ in test overlap, profiling, prior work in the worker, cache state and time. No process-level CPU, scheduling or peak-memory sample accompanies the prior full run. The full log's aggregate 637.29 seconds of test duration and 90.61 seconds of import duration are sums across workers, not CPU time or additional wall time. They show overlapping execution but do not identify the source of Epic's extra elapsed time.

Repository history already distinguishes these questions. The [0038 report](../../../performance/0038-hearth-map-and-roster.md) records a full four-worker run in 79.83 seconds whose Epic case still exceeded 60 seconds, followed by an isolated Short/Epic pass. The [0039 report](../../../performance/0039-growth-resources-and-battles.md) records a later four-worker full run in 99.79 seconds with Epic passing and a separate contact failure. These are different source/test sets, not evidence that four workers are now optimal. They establish that explicit worker counts have previously been reported transparently without treating isolated correctness as full-suite acceptance.

The current [M0 checklist](../../../1.0-DEVELOPMENT.md) still requires the **complete default** headless run within the existing budgets. Gate K in [the definition of done](../../../../DEFINITION_OF_DONE.md) separately requires measured simulation, AI, pathfinding, transfer and giant-map performance. Neither document imposes a literal 31-worker concurrency requirement, but a new test-runner policy must be an explicit, justified change rather than a one-off flag described as the existing default gate.

## Same-source results: default, eight and four workers

The parent completed all three cases on the same frozen source manifest, SHA-256 `24e2d95ba095d7366a90283c9c924bd42352cb6c945d37a13e8b802f6f0687f4`, using Node 22.23.2. Each reports unchanged source before/after, exit 1, no interruption, 1,857/1,858 tests and 220/221 files passing, with zero pending or TODO tests. Epic's unchanged 60-second timeout is the sole failure. These counts overlap and must not be added together. JSON reporter suite counts include nested suites; the 221 file count comes from its `testResults` entries. The retained log/report/time artifact hashes match all three summaries.

| Case | Vitest suite elapsed | Whole-command wall | User + system CPU | Epic elapsed |
| --- | ---: | ---: | ---: | ---: |
| [Default, up to 31 workers](default-b.summary.json) | 87.84 s | 88.024 s | 731.052 s | 64.779 s, fails |
| [Eight workers](eight-a.summary.json) | 86.91 s | 87.098 s | 593.415 s | 64.474 s, fails |
| [Four workers](four-a.summary.json) | 100.67 s | 100.941 s | 545.104 s | 63.069 s, fails |

Eight workers reduce measured aggregate CPU time by about 18.8% relative to default, while whole-command wall time improves only about 1.1% and Epic about 0.5%. Four workers reduce CPU time by about 25.4% but increase whole-command wall time by about 14.7%; Epic improves about 2.6% and remains over budget. There is no memory measurement. These are single cases in default/eight/four order with normal cache behavior, not statistical proof, repeatability results, or a basis for claiming a runtime/game speedup.

The [derived interval data](default-eight-overlap.json) records the source JSON hashes and method. Chronicle file execution begins at 1.416 seconds in the default run and 0.743 seconds with eight workers. Epic is the file's last sequential assertion; inferring its start from file end minus assertion duration gives 4.292 and 1.901 seconds respectively. Individual assertion starts are not independently timestamped by this report. The earlier start improves its finish time relative to suite start, but does not reduce its approximately 64-second execution interval meaningfully.

`packages/ai/src/pacing.test.ts` overlaps the complete Epic interval in both cases and ends last: at 87.849 seconds in the default report and 86.917 seconds in the eight-worker report. Mean other active **file intervals** during Epic drop from 7.13 to 4.70. During Epic's final 26.78 seconds under default and final 18.62 seconds under eight workers, pacing is the only other reported test-file interval still active. Other CPU-heavy files improve substantially, such as contact (40.93 to 33.46 seconds) and recruitment (32.10 to 22.44 seconds), but these two long-running tails barely change. File intervals include test lifecycle/wait time; they are not measurements of runnable CPU concurrency, core affinity, cache contention or per-phase CPU usage.

This narrows the explanation: the Epic result is not caused by its file waiting late in the queue, and reducing the initial worker burst to eight has not solved either long-running tail. Simultaneous pacing and Epic work, worker history, runtime behavior or remaining game cost need separate evidence before assigning causation. The subsequent four-worker case was an explicit second diagnostic, retaining every test; its slower complete-suite result and continued Epic failure do not support adoption. It was not a retry of unchanged settings and did not change the default gate.

## Method and final decision

The initial experiment selected eight workers between the previous four-worker evidence and this host's 31-worker default. Four workers were added as a second diagnostic after the first pair failed to resolve Epic. These values were experiment points, not asserted optima or proposed universal CI settings. File parallelism, isolation, all files, assertions, seeds, turn limits, checkpoints and timeouts remained unchanged. Epic was not split out or given a special scheduling group, and no successful retry was selected.

The retained artifacts record Node/package versions, source hashes, invocations, exit statuses, total test/file counts, Epic elapsed time, suite wall time and CPU time. Runs used exclusive CPU windows and ordinary cache behavior in the stated order. No memory sampler was installed. These results do not warrant additional repetitions to seek a passing Epic sample. A future different hypothesis would require new evidence and an explicit experiment; this investigation does not authorize further scheduling changes.

A cap would need repeatable whole-suite throughput or resource benefits and a reviewed tradeoff before adoption. The lower observed CPU cost is useful diagnostic evidence, but it does not compensate for four workers' slower suite or resolve either capped run's remaining failure. Keep the normal `pnpm test` path and hosted workflow unchanged. Local caps cannot be treated as hosted CI measurements.

Regardless of the outcome, a scheduling improvement is **not** a game simulation optimization. Retain isolated campaign/profile evidence and the separate game performance gates. Until a deliberate policy change is reviewed and the new complete default run passes, the existing full-suite failure remains open.

The [bounded measurement harness](measure.mjs) preserves default scheduling except for the requested worker count and adds result reporters plus Bash built-in elapsed/user/system accounting. Node 22 syntax validation and a dry run passed. A tiny smoke using synchronous captured child-process pipes encountered sandbox `EPERM`; it is not counted as a passing wrapper test. The three full cases were executed by the parent. The initial `default-a` attempt failed before running tests because `/usr/bin/time` was absent; its [summary](default-a.summary.json) and empty raw log are retained as a tool failure, not a timing or test result. The completed initial pair used:

```sh
/home/telephoneheater/.local/share/mise/installs/node/22.23.2/bin/node docs/development/2026-09-21-epic-baseline/runner/measure.mjs default-b default
/home/telephoneheater/.local/share/mise/installs/node/22.23.2/bin/node docs/development/2026-09-21-epic-baseline/runner/measure.mjs eight-a 8
```

After retaining the two completed cases above, the explicit second diagnostic used:

```sh
/home/telephoneheater/.local/share/mise/installs/node/22.23.2/bin/node docs/development/2026-09-21-epic-baseline/runner/measure.mjs four-a 4
```

The four-worker result is recorded in the table above. No production runner configuration has changed.

The harness refuses an inherited worker override or overwritten evidence, retains full logs/JSON results/time accounting, and compares runtime/test/config hashes before, after and across cases. The manifest scope and ordinary cache behavior are explicit in each summary. It collects no RSS or other process-tree memory measurement and does not inventory every imported documentation fixture/art asset. The commands above identify completed evidence; they are not a request for additional runs. The [bounded review](../review/runner.md) confirms the unchanged configuration and Epic test hashes.

## Reproducibility identifiers

| Input | SHA-256 |
| --- | --- |
| `vitest.config.ts` | `330a344ef1f56695cccc4f407d68ab04c25c1b8fe0b7f28b4b044e36552417fe` |
| `.github/workflows/verify.yml` | `63e7967958870676fe254460a8fee62bac72dabe8e819462039e3653248e5556` |
| `pnpm-lock.yaml` | `e4c266165d8ef6b5b60c86864cd154a42a8070bdc9f6995f146feeeff3bf82df` |
| `tests/headless/chronicle-victory.test.ts` | `71ffddc9f72d58c2c8caeb45f754747aa997fbe409f62b7071dec3963476f805` |
| Previous full log | `2f45c44f5cc87f430585f14eface525d00e42a9be9b55af888c30da26fd32dfe` |
| Isolated profile log | `c4eb385fd6bd8086873f1cb69f289320757db7eede02d89675fb10adb91b6506` |
| Installed Vitest `cli-api.CnMVyzaz.js` | `a236001d048380e2c67d05423fc9ea3f26b07ee019ba8d6e622082f29d49102e` |
| Installed Vitest `coverage.DM_a_rWm.js` | `e509f3cc1bd81ae6426265253fa926cbde02be5cebfe35b1df422017bffdca31` |
