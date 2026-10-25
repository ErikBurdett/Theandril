# Counterplay benchmark construction and measurement boundary

24 October 2026. All eight initial measured cases pass after the parent finished full
tests, nine pacing campaigns and live checks and supplied an exclusive CPU
window. One warmup and three fresh-observation samples per case are retained in
[counterplay-benchmark.json](counterplay-benchmark.json) and its complete log.

The parent approved simplifying the original nine-project fixture to one legal
active rival project. The separate synthetic regression still proves the hard
eight-project cap; this benchmark does not claim to exercise that cap in a
loadable giant world. The four-query workload is separately labelled direct
query cost, not ordinary AI proposal count.

The initial `benchmark-counterplay.ts` prepared eight cases, four for each Huge/Legendary
size. Worlds come from `matureCampaign` (32/40 realms and approximately
1,500/4,000 strategic armies), with authored flat terrain, cleared resource
deposits, legally separated hearth positions and 128 owned guard companies.
Every world cell is charted while actual sight remains restricted. One real
scout observes foreign armies grouped on distinct cells for each foreign realm;
another scout observes the project host without being adjacent or eligible as
a siege actor.

The fixture uses Short pace as an explicit initial configuration. Three rival
hearths receive authored infrastructure; research, institution, project purchase
and four end turns use ordinary commands. The project reaches 4/5 through
those turns, with no authored progress/status/victory fields. Institution and
project spend 150 coin; research spends its actual knowledge cost. A separately
loaded mirror and journal replay verify this setup. This is prepared stress
infrastructure, not an organically earned realm or a headline pacing run.

Final army/observer placement is explicitly authored after progression, then
strict-saved. After actual contact exists, ordinary war declaration succeeds.
Three unrelated companies receive ordinary hold posting, disabled
patrol and zero-movement queued travel commands, verified by another mirror and
from-save journal. These remain unchanged when a counterplay siege is issued;
preservation is not asserted only over empty order arrays.

| Workload | Expected result |
| --- | --- |
| Accepted | Visible active host, eligible adjacent guard, one considered project/one quote/one accepted siege; project pauses at4/5. |
| Hidden | Public project remains, host is outside current sight despite chart coverage; zero considered projects/quotes/commands. |
| No adjacent force | Host visible through nonadjacent scout, all guards elsewhere; one considered project/zero quotes/commands. |
| Four direct quotes | Four distinct adjacent owned actors quote the same visible host using one fresh observation. Each accepted siege is executed on a separate saved branch. This never establishes four simultaneous sieges or emits four AI orders. |

One warmup and three samples each create a fresh permitted observation before
the clock starts, keeping the query's observation-keyed cache cold. Timing
includes the isolated policy plus its public query, or four direct query calls
with their shared index. Observation construction, protected-faction set setup,
assertions, serialization/hash, commands/replay, whole AI turns, campaign pacing,
worker transfer and rendering remain outside the clock. Actual sample counts,
observed army/cell counts, current visibility, commands, source hashes, mirror/
save/replay outcomes and runtime identity are retained in JSON.

The script refuses output overwrite and checks runtime/tool hashes before and
after all cases. `--verify-only` executes one sample per selected case without
calling a timing boundary or reporting durations. Run a selected preflight first
and retain any failure rather than relaxing legal visibility or expected counts:

```sh
node --import tsx docs/development/2026-10-24-project-counterplay/benchmark-counterplay.ts --verify-only --case=huge-accepted --out=docs/development/2026-10-24-project-counterplay/benchmark-preflight.json
```

The final measured invocation omitted `--verify-only` and `--case` for all eight
cases. This is absolute isolated cost; no speedup, network, tail-latency,
full-turn or organic giant-scale acceptance is implied by a three-sample median.

## Retained setup failure

The initial [preflight log](benchmark-preflight.log) records an ordinary command
refusal: “Scout a faction before declaring war.” War was incorrectly scheduled
before the authored deployment established contact. No timing ran. The fix moved
only that setup command after the authored sight/army placement, inside the
separately mirrored and replayed post-deployment sequence. No contact flag,
project progress or permissive rule was injected. The corrected Huge accepted
[preflight](benchmark-preflight-second.json) passes all checks with zero timed
samples; its original failure remains untouched.

## Results and limitations

Machine: Intel Core i9-13900K, Node v26.7.0. All twelve source hashes match at the
beginning and end of the measured run. All cases use one real active project,
128 owned guard companies and 32/40 realms. Huge/Legendary observations contain
1,584/4,031 armies (1,453/3,900 foreign) and 196,608/307,200 explored cells.
Current visibility is only 183 cells in visible-host cases and 122 in hidden-host
cases. Approximate observation JSON sizes are 18.4/30.0 MB, recorded outside the
clock; they are not worker-transfer or memory acceptance results.

| Size/workload | Median ms | Min–max ms | Quotes | Considered projects | Actual command branches |
| --- | ---: | ---: | ---: | ---: | ---: |
| Huge accepted | 2.036 | 1.919–2.080 | 1 | 1 | 1 |
| Huge hidden | 0.028 | 0.028–0.032 | 0 | 0 | 0 |
| Huge no-adjacent | 0.254 | 0.219–0.341 | 0 | 1 | 0 |
| Huge four direct quotes | 1.666 | 1.637–1.678 | 4 | Not an AI review | 4 independent |
| Legendary accepted | 2.964 | 2.637–3.584 | 1 | 1 | 1 |
| Legendary hidden | 0.019 | 0.015–0.019 | 0 | 0 | 0 |
| Legendary no-adjacent | 0.359 | 0.212–30.600 | 0 | 1 | 0 |
| Legendary four direct quotes | 2.814 | 2.542–2.907 | 4 | Not an AI review | 4 independent |

The **30.600 ms Legendary no-adjacent sample is retained** beside its 0.212/0.359 ms
samples. No sample was discarded, rerun or attributed to unmeasured GC/scheduling
behavior. Three samples do not establish a tail budget; the median alone must
not be presented as a worst-case result. The direct four-quote case and the
single-quote planner perform different work, so their timings are not a scaling
ratio or comparative speedup claim.

Every positive command succeeds on its own saved branch and pauses the actual
project at 4/5. The unrelated hold posting, disabled patrol and active travel
route remain exactly unchanged. Negative cases issue no commands and retain
the initial hash. Each branch matches a separately loaded mirror, strict
save/reload bytes and exact journal replay. Source observations and source
canonical states remain unchanged; all four fresh observations produce identical
plans/quotes and counters within each case. No runtime behavior was edited during
the benchmark or in response to a measured value.

Packet TypeScript checking and scoped ESLint pass after the initial measurement. Initial tool
SHA-256: `cf2a42b22e438b9641493b0ae902a4310559308194b88c6860afb9e3744725e4`.
Result JSON SHA-256: `cce8adc5a65531258547005173dd9e5eb934b2e20b7cbb67b6e7b20820240278`.

## Maintenance extension and final ten-case measurement

Actual Watch continuation exposed a later accepted peace releasing our existing
project-pausing siege. The runtime now preserves that interruption in diplomacy;
the initial measurements above predate this extension. All twelve initial measured
source files, including the original benchmark tool, are preserved byte-for-byte
under `initial-benchmark-source/`. Their hashes were checked against the original
result JSON before copying. The original results, log and outlier remain untouched.

The current tool prepares ten cases: the same eight workloads plus one maintained
own siege per map size. Ordinary `besiege` and incoming `proposePeace` commands
prepare the additional branches, with an independent loaded mirror, strict save
and exact replay. The timed review considers one paused project, issues zero
queries or commands and reports only the affected rival in its blocked-peace list.
Outside the timing boundary, actual diplomacy produces one rejection; that ordinary
command preserves the siege and unrelated standing orders exactly. One real end
turn then proves the project remains paused at4/5 without victory. Existing travel
may progress during that turn, so exact order preservation is asserted at rejection,
not falsely across normal turn progression.

Final output defaults use `counterplay-benchmark-final.json` and
`counterplay-verification-final.json` to protect the original artifacts. The parent
supplied a new exclusive CPU window after the final full suite, nine pacing
campaigns and four production browser journeys completed. No competing builds,
tests or browsers ran during this measurement. The maintained Huge
[preflight](benchmark-maintenance-preflight.json) passed with no timed samples;
its complete log is `benchmark-maintenance-preflight.log`. All ten subsequent
cases passed on their first measured run, with no fixture or runtime change.

The [final results](counterplay-benchmark-final.json) and complete
`counterplay-benchmark-final.log` retain one warmup and three samples per case on
the same Node v26.7.0 / Intel Core i9-13900K machine. All twelve recorded tool/runtime
hashes match before and after the run. The original eight workloads retain exactly
their original initial and final state hashes. The two additional maintained
branches begin at Huge `9672da3a` / Legendary `f233dc24` and finish after rejection
plus end turn at `a38c2b86` / `2b1ccf31` respectively.

| Size/workload | Median ms | Min–max ms | Quotes | Considered projects | Actual command branches |
| --- | ---: | ---: | ---: | ---: | ---: |
| Huge accepted | 2.839 | 2.728–3.168 | 1 | 1 | 1 |
| Huge hidden | 0.039 | 0.030–0.040 | 0 | 0 | 0 |
| Huge no-adjacent | 0.240 | 0.239–0.272 | 0 | 1 | 0 |
| Huge four direct quotes | 1.813 | 1.706–2.063 | 4 | Not an AI review | 4 independent |
| Huge maintained own siege | 2.416 | 1.957–2.422 | 0 | 1 | 1 untimed rejection + end turn |
| Legendary accepted | 3.396 | 3.357–3.544 | 1 | 1 | 1 |
| Legendary hidden | 0.019 | 0.018–0.022 | 0 | 0 | 0 |
| Legendary no-adjacent | 0.193 | 0.188–0.261 | 0 | 1 | 0 |
| Legendary four direct quotes | 2.528 | 2.460–2.954 | 4 | Not an AI review | 4 independent |
| Legendary maintained own siege | 2.540 | 2.506–2.712 | 0 | 1 | 1 untimed rejection + end turn |

The maintained timed review emits **no command**. The command column describes
separate correctness verification, not commands included in the timer. These
branches have zero active and one paused project; the original eight have one
active project. Observed army, charted cell and current visibility counts remain
the same as the initial run. Real unrelated posting, disabled patrol and travel
orders remain exact at the command boundary; all branches pass loaded-mirror,
strict save/reload and exact journal replay checks. Maintained branches also keep
the project paused after a real end turn. The nonempty order checks do not claim
coverage of an enabled theater: the authored theater array is empty.

All previous exclusions and three-sample limitations apply. In particular, these
two runs are not a controlled comparative speedup/regression claim, and the old
30.600 ms outlier remains retained rather than replaced by the new results. The
final run adds evidence for the changed policy; it does not erase the earlier run.
Current packet TypeScript and scoped ESLint checks pass.

Final tool SHA-256: `928021af2c60fe2a19d618569ebc6400f71ce2a816d18b323bde8d7e93df04e0`.
Final result SHA-256: `a43f41a97a4b465833d75d43785563e26a82e1ce5062f97191c0d8c661724cba`.
The initial result still hashes to
`cce8adc5a65531258547005173dd9e5eb934b2e20b7cbb67b6e7b20820240278`.
