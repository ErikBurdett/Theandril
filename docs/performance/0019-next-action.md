# Next-action navigation — observed large-empire registries

Measured 2026-09-06 in a reserved window, Node 26.7.0 on Intel i9-13900K,
Linux. Reproduce with `node --import tsx scripts/benchmark-next-action.ts`.
[Raw measurements](0019-next-action.json).

The same explicitly authored [large-empire fixture](0018-read-models.md) owns
32/40 towns but only 47/100 of the 1,500/4,000 armies. All of those armies are
currently visible around these owned towns; foreign forces must still be
excluded from navigation. This is not a 4,000-owned-army or earned-conquest case.

| Operation | Huge: 47 own armies, 32 towns | Legendary: 100 own armies, 40 towns |
|---|---:|---:|
| Candidate filtering and stable sorting, mean | 0.0242 ms | 0.0497 ms |
| Candidate filtering and stable sorting, p95 | 0.0289 ms | 0.0547 ms |
| Four next/previous lookups, mean | 0.0012 ms | 0.0015 ms |

Twenty warmups precede 200 samples. Timers cover only pure helpers, not fixture
setup, observation building, serialization, assertions, React, worker messages,
map focusing or browser input latency. Candidate lists are memoized per received
observation, not recomputed per frame. Starting seals remain `1f6c8980` and
`02d3b393`; all observation and saved-state bytes remain identical after reads.
Full wrap in both directions is checked outside the timers.

Human controls and storage-error handling are tested separately in unit and
real-browser scenarios. Final counts and inspected screenshots are recorded in
[implementation status](../IMPLEMENTATION_STATUS.md). These tiny helper timings
do not establish virtualized registries, a complete UX gate, turn throughput,
or thousand-turn retained-memory behavior.
