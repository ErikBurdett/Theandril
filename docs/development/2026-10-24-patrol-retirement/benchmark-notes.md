# Fully charted patrol retirement measurements

2026-10-24. Six authored cases ran sequentially once in the parent's exclusive
CPU window after the nine-campaign pacing run and full local suite completed.
No browser, campaign or competing heavy test run overlapped this measurement.

```sh
node --import tsx scripts/benchmark-patrol-retirement.ts
```

[Retained JSON](retirement-benchmark.json), [complete log](retirement-benchmark.log),
[fixture/protocol design](benchmark-design.md), and
[source](../../../scripts/benchmark-patrol-retirement.ts).
The command exits0. No final-run fixture or assertion failure occurred. The
initial507-cell Huge [verification-only preflight](fixture-positive-initial.json)
is separately retained and contains no timing samples. All final cases use the
explicitly revised fully charted workload.

## Results

Each case has128 owned enabled persistent patrols and paused six-hex single-leg
routes. All companies have zero available movement. This isolates administrative
retirement and prevents ordinary recovery from querying routes in the owned-town
control. Current visibility comes from actual sources despite every cell being
charted.

| World and target observation | Charted cells | Observed armies | Median ms | Min–max ms | Ordinary clears | Route queries |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Huge, visible foreign hearth | 196,608 | 1,584 | 1.832 | 1.667–1.934 | 4 | 0 |
| Huge, hidden foreign hearth | 196,608 | 1,584 | 0.248 | 0.242–0.319 | 0 | 0 |
| Huge, still-owned hearth | 196,608 | 1,584 | 0.264 | 0.258–0.337 | 0 | 0 |
| Legendary, visible foreign hearth | 307,200 | 4,031 | 2.794 | 2.734–3.529 | 4 | 0 |
| Legendary, hidden foreign hearth | 307,200 | 4,031 | 0.446 | 0.378–0.466 | 0 | 0 |
| Legendary, still-owned hearth | 307,200 | 4,031 | 0.455 | 0.406–0.469 | 0 | 0 |

One warmup precedes three measured fresh-observation samples per case. Results
are absolute isolated `planPatrol` times, not a before/after speedup. The visible
foreign cases exercise the new one-pass index over the complete charted-cell
observation. Hidden foreign towns are absent from the permitted settlement list;
their explored target cells have `visible:false`. Owned endpoints remain owned.
Neither negative case builds a candidate foreign-target visibility index.

Huge has32realms and1,453 observed foreign armies on31distinct distant cells;
Legendary has40realms and3,900foreign armies on39distinct distant cells. Foreign
factions occupy separate cells. This stresses observed entity indexing, not
geographically dispersed fronts. Setup begins from1,500/4,000army fixtures and
adds enough owned guards for128patrols plus two actual scout observers; final
global and observed totals are1,584/4,031. Exact observation JSON is approximately
18.5/30.1MB. That byte count is measured outside timing and is not worker transfer
or memory-budget acceptance.

## Ordinary-command and save checks

The setup uses actual `setPatrol` and `queueMovement` commands while both hearths
are owned, followed by an explicitly authored canonical route pause. Foreign
ownership and observer position are authored stress-state changes, then territory,
sight and strict save validity are reconciled. This is not a claim to have played
128conquests. The genuine generated capture is covered by separate regression
and browser evidence.

Every case asserts unchanged input observation and canonical state after
planning, deterministic ordered proposals across samples, and zero expanded
route-search nodes. Every plan retains all128army reservations for its batch.
Visible foreign cases apply four ordinary clears on independent loaded copies,
compare complete command results, and assert every field of all128routes and
every army remains exact after each clear. Only the four selected patrol records
disappear. A fresh observation holds124actors; the other124policies remain exact.
Negative cases preserve all128records and reservations and emit no commands.

All six outcomes pass exact save serialization after reload, independent state
hash equality, and from-save journal replay. Canonical baseline→continuation
hashes are:

- Huge visible:`46a68530`→`65fd28f6`; hidden:`6c832ba4` unchanged;
  owned:`b40be962` unchanged.
- Legendary visible:`4e384356`→`ff4daea4`; hidden:`d2836355` unchanged;
  owned:`7c0fa230` unchanged.

The benchmark checks these boundaries outside the timer. Fair128-record rotation
and shared mixed resume/retirement caps are separate focused tests, not inferred
from repeated measurements of one turn.

## Identity and exclusions

Environment: Node26.7.0, Linux, Intel Core i9-13900K; content`015468d1`.
The JSON records ten source SHA256 values and verifies they remain unchanged at
the end. Independent post-run readback also matches all ten current source files.
The final benchmark JSON SHA256 is
`9ecc4862e170013c8bafc9e503338d48135a88245341d92adbe72e435d1c3d17`.

Runtime identities:

- `patrol-recovery.ts`:
  `e4adc2d2f0323db4a38eb62a4cf6b77e40462bdc5386b4efc2eabf8d1bd97dc2`
- `patrols.ts`:
  `7119881ed29d16c6f1c60d45a980cbb3ba2a7871590329fedb10ff2e1fd965f0`
- benchmark script:
  `f08c85379aba3c2e9779ee9820d7c41c11e66d42daf0f594312b219a93dd1288`

Timings exclude fixture generation, observation construction, cloning,
serialization/hashing, assertions, command execution/replay, complete AI passes,
turn resolution, campaign pacing, worker transfer and rendering. Three samples
do not certify tail latency. The six-hex zero-query workload makes no worst-case
pathfinding claim. Fully charted authored worlds are not organically developed
empires. No gameplay, rendering, campaign-length or release-gate acceptance is
inferred from these isolated planner results.
