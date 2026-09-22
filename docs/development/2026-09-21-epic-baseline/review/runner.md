# Bounded review of runner diagnostics

Verdict: retain the existing Vitest configuration. The three completed diagnostics do not justify adopting a worker cap, claiming a simulation improvement, or closing M0. No further repetitions are justified by these results. Epic remains over its unchanged 60-second limit in every case.

This review checks the parent's retained executions, the measurement harness, source fingerprints and the interpretation in [the investigation](../runner/analysis.md). The reviewer authored the diagnostic harness and investigation but did not run the full suites; this is not a separate blind validation of the harness. No runtime/configuration edits or heavy tests were performed during this review.

## Verified results

| Case | Vitest wall | Whole-command wall | User + system CPU | Epic |
| --- | ---: | ---: | ---: | ---: |
| [Default](../runner/default-b.summary.json) | 87.84 s | 88.024 s | 731.052 s | 64.779 s, fails |
| [Eight workers](../runner/eight-a.summary.json) | 86.91 s | 87.098 s | 593.415 s | 64.474 s, fails |
| [Four workers](../runner/four-a.summary.json) | 100.67 s | 100.941 s | 545.104 s | 63.069 s, fails |

Each case has 1,857/1,858 tests and 220/221 files passing, zero pending/TODO tests, exit 1 and no interruption. Only `tests/headless/chronicle-victory.test.ts` fails. All nine retained raw-log/JSON/time hashes match their corresponding summaries. Counts from the three runs overlap and are not additive. JSON's 403 suite count includes nested suites and is not a file count.

The runtime/test/config manifest is identical across cases: `24e2d95ba095d7366a90283c9c924bd42352cb6c945d37a13e8b802f6f0687f4`. Each summary reports unchanged covered sources before/after. Direct readback additionally confirms:

| Unchanged input | SHA-256 |
| --- | --- |
| `vitest.config.ts` | `330a344ef1f56695cccc4f407d68ab04c25c1b8fe0b7f28b4b044e36552417fe` |
| `.github/workflows/verify.yml` | `63e7967958870676fe254460a8fee62bac72dabe8e819462039e3653248e5556` |
| `tests/headless/chronicle-victory.test.ts` | `71ffddc9f72d58c2c8caeb45f754747aa997fbe409f62b7071dec3963476f805` |

The diff for those three inputs is empty. The 20-second general default and explicit 60-second Epic timeout remain intact, as do Short/Epic selection, generated-start play, the 800–1,400-turn Epic bounds, paid canonical commands, the post-turn-500 mirror, complete retained archive records, save/load equality, both full replays and complete chronicle comparisons. No test was disabled, no campaign activity was reduced, and Epic received no separate scheduling group.

## Method and interpretation

The completed harness uses Node 22.23.2 for every invocation. It passes the same complete `vitest run` command and reporters, adding only `--maxWorkers=8` or `--maxWorkers=4` for the capped diagnostics. Its Bash script is fixed code; executable paths and command arguments are passed positionally. Child stdout/stderr are retained in the log, and Bash's elapsed/user/system accounting is retained separately. The final harness SHA-256 is `80b89b62e6431d94026bf3fdcbf64a4ce4f2804bd55c8042e3e269380f81219a`.

The failed `default-a` launch did not execute tests because `/usr/bin/time` was absent. Its retained artifact is a tool failure, not a baseline sample. The synchronous-pipe smoke's sandbox `EPERM` is likewise not counted as a passing check. The completed parent-run cases demonstrate the repaired timing path's actual operation.

Eight workers lowered CPU consumption substantially in its one sample, but improved whole-command wall time by only about 1.1% and Epic by about 0.5%. Four workers lowered CPU consumption further while making the complete suite about 14.7% slower than default; Epic still failed. Neither candidate resolves the acceptance failure, and the slower four-worker run is not an overall throughput win.

The retained default/eight interval analysis shows that Epic begins early and overlaps `pacing.test.ts` throughout. This rules out a late queue start as the explanation for those Epic results. It does not prove the cause of the remaining runtime: reported file intervals are not CPU scheduling traces, and inferred assertion start times are not independent timestamps.

These are single samples in default/eight/four order with normal cache behavior. They do not establish statistical repeatability, an optimal worker count, hosted-runner behavior or a game performance improvement. No RSS, process-tree memory or retained-memory measurement was collected. The source manifest covers runtime/test/config inputs described by the harness, not every art asset or imported documentation fixture. The interpretation correctly retains these limits.

The existing normal `pnpm test` policy and hosted workflow should remain unchanged. Continue investigating actual runtime cost under the existing gates; these diagnostics provide no release or publication approval.
