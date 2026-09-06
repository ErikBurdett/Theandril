# Naval/general Epic pacing diagnostics

Measured 2026-09-05 against the in-progress schema-8 rules and content hash `ab8269f3`. This is a campaign-behavior diagnostic, **not a performance benchmark** or a published balance change.

## Reproduction and scope

Run from the repository root:

```sh
node --import tsx scripts/diagnose-naval-pacing.ts --case=current --seed=20260905
node --import tsx scripts/diagnose-naval-pacing.ts --seed=20260905
node --import tsx scripts/diagnose-naval-pacing.ts --case=current --seed=74 --project-coin=75000
```

The [retained runner](../../scripts/diagnose-naval-pacing.ts) uses Tiny, four factions, Epic pace. Its command order matches [the independent archived-victory test](../../tests/headless/chronicle-victory.test.ts): one plan per faction, execute that plan, resolve each pending battle/capture through public commands, then end the turn. Every rejected command immediately fails. A case stops at real victory or the existing 1,400-turn bound; it also has a 45-second execution bound. Successful and exhausted cases check final save/load identity. This runner does **not** create or replay a full archive; that remains the independent test's responsibility. Wall times are not reported as isolated throughput measurements.

`--case` selects the current planner or inspected source variants compiled entirely in memory. The genuine old index and character planner come from commit `cb068f8198c97d91ead7d0600b34090ea64569b6`; other helper modules and canonical rules remain current. The prechange-index case supplies its original four-building/six-unit prefix, avoiding an artificial unresearched-harbor queue. It is not an old-rules replay.

`--project-coin` changes only the process-local shared Epic profile used by the rules and planner. It writes no content file. The output labels these seals as **hypothetical**, not compatibility proof for published content. No turn gate, free resources, hidden observation input or suppressed military orders is introduced. Only three selected seeds were examined; these are not a distributional guarantee.

Frozen source SHA-256 values for the measurements below:

| Source | SHA-256 |
| --- | --- |
| Current AI index | `cb9600993ea333f2eb07b65cb8fdd839fea210f056a5d62fb359c2a11dffa2ae` |
| Current naval planner | `65c98911042f8427f1e2bca37fef0c3d02fc8bf04e8fc3ef193250030a21cca1` |
| Current character planner | `460c58feccf59fcf46dfe6a836342fed3365e0c8db4825d5f51aa957a029f74d` |
| Old AI index | `cb692a6d1680a22c203eb2c3c1110a8289640992b5248299ed33b5681866c85c` |
| Old character planner | `ad9dec96ada2fe70195642f327359996f583393005dd0e092fb0c07780a02068` |

## Before host-selection improvement: unchanged 60,000-coin cost

Seed 20260905; every row completed with zero rejected commands and final save/load identity. Battles and captures count commands with the corresponding event once, not the duplicated per-faction event delivery. Towns and net coin describe the winner at completion. Net coin is recurring settlement coin minus formation and living-character upkeep, not one-time capture receipts or queue spending.

| Planner variant | Victory turn | Winner | Battles / captures | Naval battles | Embarks / landings | Largest army | Winner towns / net coin | Final seal |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | --- |
| Current | 714 | Cinder | 756 / 206 | 8 | 106 / 104 | 14 | 20 / 212 | `14185676` |
| No naval proposals | 698 | Ashen | 751 / 143 | 0 | 0 / 0 | 14 | 29 / 292 | `3831008c` |
| Old six-formation concentration | 649 | Reedbound | 955 / 181 | 93 | 107 / 105 | 6 | 21 / 206 | `9c34b832` |
| Old concentration, no naval proposals | 659 | Reedbound | 702 / 120 | 0 | 0 / 0 | 6 | 22 / 205 | `db0da881` |
| Old character planner | 680 | Ashen | 779 / 150 | 126 | 124 / 121 | 14 | 26 / 256 | `f3a5df37` |
| Old concentration and characters, no naval proposals | 702 | Reedbound | 883 / 119 | 0 | 0 / 0 | 6 | 19 / 173 | `e78b02b7` |
| Actual prechange index and characters, current rules | 702 | Reedbound | 883 / 119 | 0 | 0 / 0 | 6 | 19 / 173 | `e78b02b7` |

The modern planner is not uniquely responsible for the short finish: turning off naval proposals or restoring the old concentration policy finishes earlier, and the genuine old index still finishes at 702 under current canonical rules. This comparison does not identify one isolated canonical-rule cause. The earlier concurrent full-suite observation of turn 592 predates the frozen planner hashes above and is not the reproducible baseline for these measurements.

Current seed 20260905's winning Cinder economy grows from four towns, 593 coin and net seven at turn 100 to 17 towns, 51,033 coin and net 159 at turn 600. The project starts at 654 and completes after its real 60 active turns at 714. Current seed 74 at 60,000 wins at 769: project starts 709; Cinder finishes with 11 towns, net 80, 834 battles and 212 captures; seal `ce62f4fe`.

## Before host-selection improvement: process-local price hypotheses

All rows have zero rejected commands and final save/load identity. `>1400` is a failed bound, not a claimed eventual victory. Price changes affect optional-spending thresholds and the time rivals can attack, so finish turns are not monotonic in price.

| Epic price | Seed | Outcome turn | Winner | Battles / captures | Final or exhausted hypothetical seal |
| ---: | ---: | ---: | --- | ---: | --- |
| 75,000 | 20260905 | 809 | Cinder | 831 / 252 | `50fd9edd` |
| 75,000 | 74 | >1400 | None | 1,442 / 399 | `829f2163` |
| 75,000 | 99 | 982 | Ashen | 881 / 232 | `4ab5c4f0` |
| 80,000 | 74 | >1400 | None | 1,531 / 460 | `db794a22` |
| 90,000 | 20260905 | 887 | Cinder | 922 / 278 | `6e485cb5` |
| 90,000 | 74 | >1400 | None | 1,491 / 431 | `d81d800d` |
| 90,000 | 99 | 768 | Ashen | 706 / 191 | `cb44aa4d` |

At 75,000, seed 20260905 starts at 749 and finishes at 809 with 22 towns and net 220. Seed 99's final successful project starts at 922 and finishes at 982 with 39 towns and net 394. At 90,000, seed 20260905 starts at 827 and finishes at 887; seed 99 starts at 708 and finishes at 768 after substantial earned conquest.

Seed 74 is a substantive counterplay case, not an affordability rejection:

- At 75,000, Cinder starts at 837 but loses the host at 31/60 progress. Reedbound starts at 1345 and is active at 56/60 when the runner ends at turn 1401.
- At 80,000, Cinder starts at 919 and loses the host at 35/60. Reedbound starts at 1100 and loses its host at 5/60. No project remains active at turn 1401.
- At 90,000, Reedbound's project begins at 1253 and is cancelled at 18/60; Glass starts at 1346 and is active at 55/60 at turn 1401. Earlier Cinder wealth reaches 78,489 at turn 900, but its economy subsequently contracts: eight towns/net 12 at turn 1000, six towns/net -20 at 1100. Cinder ends at 86,760 coin, not enough for the hypothetical price.

No flat price tested in this first stage satisfies every requested bound. The retained failures must accompany any later balance decision. The first-stage AI chose the first lexicographically sorted eligible project host without comparing observed garrisons or nearby enemy pressure. The next bounded change addresses that real policy gap rather than continuing to search prices that happen to fit selected seeds.

## Observation-only host selection

The updated [progression planner](../../packages/ai/src/progression.ts) compares at most 64 real eligible hosts and 64 observed hostile army/town references. Larger host sets are sampled evenly in geographic order; threat selection prioritizes known strong land armies while retaining geographic frontier references. Own combat strength is indexed once by cell and discounted over at most two neighboring rings. Embarked troops and naval hulls do not become land garrisons or field threats. Rank order is uncovered nearby enemy pressure, distance from known hostile references, nearby friendly settlement depth, support, then stable ID. This is a bounded heuristic, not an assurance that paths are safe or unseen enemies are absent. It never refuses to start solely because every eligible site is risky.

The runner retains observed candidate assessments at each actual project start, plus status changes before cancelled projects can be replaced. Three focused tests cover deterministic ordering and safety preference, exclusion of ships/cargo, bounded comparison and a real command/save roundtrip. Together with naval and composition scenarios, 28 tests pass; full typecheck and scoped lint pass. Ranking is gated on an actionable project, so saving for centuries does not repeatedly compare candidate hosts. The final progression source SHA-256 is `078c24bac85d99ba0076a5eb0f09b545b7b15d773b1eb0d8fe06cd2082fc65cf`; the first four reruns below used `0eb5add0520d5d5a19232bda25eddc579213df79090c1cd4e4fb794b1beba672`, before that behavior-preserving early gate. All 28 focused tests passed again after the gate.

Only the unchanged 60,000 cost and the smaller 75,000 hypothesis were rerun after this policy improvement, not another price search:

| Epic price | Seed | Victory turn | Winner | Battles / captures | Naval battles | Embarks / landings | Largest army | Winner towns / net coin | Final seal |
| ---: | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | --- |
| 60,000 | 20260905 | 714 | Cinder | 756 / 206 | 8 | 106 / 104 | 14 | 20 / 212 | `65a4c08b` |
| 60,000 | 74 | 769 | Cinder | 834 / 212 | 7 | 111 / 107 | 17 | 11 / 80 | `3da78587` |
| 60,000 | 99 | 848 | Ashen | 746 / 204 | 11 | 111 / 107 | 18 | 38 / 386 | `b6bfbb7d` |
| 75,000 hypothetical | 20260905 | 1,111 | Cinder | 1,116 / 315 | 28 | 150 / 149 | 19 | 27 / 278 | `e6c9aba6` |
| 75,000 hypothetical | 74 | 897 | Cinder | 933 / 260 | 8 | 129 / 125 | 17 | 11 / 69 | `954d6420` |
| 75,000 hypothetical | 99 | 700 | Ashen | 688 / 163 | 10 | 93 / 91 | 20 | 20 / 182 | `c4241e37` |

All six have zero rejected commands and final save/load identity. The hypothetical 75,000 rows meet the independent seed-20260905 800–1,400 gate and the unchanged seed74/99 bounds. Seed 99's 700-turn result meets the existing earned-conquest exception, with 20 winning towns, 688 battles and 163 captures. No command was delayed to meet a turn target.

The three 75,000 runs execute respectively 21,176 / 18,643 / 14,133 real commands, including end-turn and tactical/capture decisions. They queue 11 / 13 / 13 ships and purchase 69 / 77 / 67 character promotions. These are actual command counts, not numbers of UI frames, planner calls or duplicated event deliveries.

Specific observed candidate evidence explains the changed decisions:

- Seed 74 at turn 837: old first-ID host `settlement.12`, cell 296, has nearest known hostile reference at distance 10. Chosen `settlement.205`, cell 769, has distance 20. Both have zero local uncovered pressure, so the latter wins the distance comparison and actually completes at 897. The old host's first-stage cancellation is retained above.
- Seed 99 at turn 640: chosen `settlement.47`, cell 1065, has zero uncovered pressure, known-hostile distance 12 and friendly depth 25. First-ID `settlement.12` has uncovered pressure one and distance five; nearby `settlement.24` has uncovered pressure 38 despite friendly support 466. The chosen site completes at 700.
- Seed 20260905 at turn 749: chosen `settlement.44` has zero uncovered pressure, capped known-hostile distance 24 and friendly depth 40, versus first-ID `settlement.10`'s zero/24/26. Future attacks still interrupt it: siege at 771, relief at 774, another siege at 784, then capture at 785 after 32 active turns. A newly funded project at `settlement.387` starts at 1051 and completes at 1111. This policy intentionally cannot foresee those future threats or guarantee every project survives.

Recommendation from this bounded evidence: the plain 75,000-coin Epic cost is sufficient with the observed host policy; a dynamic realm-size tax is not justified by these tests. If adopted, the cost must be version-8-only with exact pre-8 affordability preserved, and the separate full archived campaign mirror/replay test must still pass. The process-local hypothetical seals above do not substitute for that final published-rules validation.

## Final canonical follow-through

The recommendation was subsequently implemented for schema 8 only: Epic commitment is 75,000, with the pre-8 60,000 cost frozen for historical command execution. Final content is `257e1e91`. The independent turn-1,111 campaign passes turn-500 continuation plus complete archive and technical-record replays; its published-rules seal is **`4e68cc88`**, not the earlier hypothetical `e6c9aba6`. The complete unit suite passes 560 tests across 59 files, and the sealed-content Chromium suite passes all 49 scenarios. [Final isolated workloads, counts, timings, byte sizes and limits](0014-integrated-military-campaigns.md) supersede hypothetical results for current performance claims; the failed first-stage trials above remain unchanged historical diagnostic evidence.
