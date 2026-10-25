# Production fail-before evidence

Both representative production cases reproduced the defect against the parent's frozen group-patrol publication build, commit `5cb7dc84292bfddb876eb54e19046f7b97a77ad9`. Neither test failed during fixture creation, artifact writes, worker setup or actor selection. Both failed at the intended restore-before-retry assertion, line 108, after retaining real worker-result and visible UI evidence. [Run log](fail-before.log), [artifact/source hashes and captured replies](fail-before-evidence.json).

The production test was promoted only after that publication was committed and its build frozen. Explicit creation of the output directory precedes evidence writes. No runtime application changes or builds were made for this experiment.

| Case | Genuine ordinary mutation | Real reply hash | Damaged typed result | Observed client behavior |
| --- | --- | --- | --- | --- |
| Posting duplicate | Two accepted `setPosting` commands, `army.10` and `army.9`, hold at hex 495 | `782d91b7` | Repeats `army.10`, omits `army.9` | Reports “2 orders accepted · 0 refused.”; one army remains checked; End turn enabled |
| Charter wrong actor | Two accepted `setCharter` commands, `settlement.6` and `settlement.8`, Wealth/24 | `caafaa3d` | Replaces the second actor with `not-submitted` | Reports “2 orders accepted · 0 refused.”; one hearth remains checked; End turn enabled |

Both start at `1a71b4f1`. Before the failing assertion, the test proves the original native worker hash and complete result rows equal the independently applied ordinary commands. Only the presentation result array is altered. The canonical state, actual worker commands, observation, hash and archive are not replaced. The inaccurate UI accepts the damaged reply without preserving uncertainty; this is not evidence that healthy worker code spontaneously emits it.

Each case took 8.1 seconds, including the expected five-second assertion wait. Both retained their JSON, pre-assertion native screenshot, automatic failure screenshot, accessibility/error context and Playwright trace. The six-case discovered test is frozen pending the corrected production build; the four other permutations have not yet run in a browser. Successful restoration and exact retry archives are still acceptance requirements, not completed evidence in these fail-before runs.
