# Exact explored-cell ordering

The retained Epic archive profile spends substantial time constructing canonical
payloads. Unordered explored sets previously invoked a JavaScript numeric
comparator for every sorting comparison. The new internal helper uses native
unsigned integer sorting for unordered lists of at least 256 eligible values.
Already ordered lists keep the linear copy/check path; negative zero, signed,
fractional, nonfinite, out-of-range and coercible inputs retain the original sort.
Every iterable is traversed once. There is no persistent cache or change to
exploration, canonical field order, save format, checksum or old-rule behavior.

The [regression suite](../../../../packages/sim/src/canonical-cells.test.ts)
retains the original helper as an independent oracle. It checks 100 seeded
generated sequences and their reverse, duplicates, unusual values and coercion,
single traversal, detachment, same-size mutations, complete save bytes and hashes.
The initial scoped run passed 15 tests across canonical-cells, envelope-hash and
canonical-land files; final integrated counts belong to the parent verification.

The [paired benchmark](benchmark.ts) uses labelled synthetic shuffled and sorted
sets, five warmups and thirty alternating samples. Equality checks and hashing
are outside timing. [Raw results](benchmark.json), Node 22.23.2:

| Shuffled cells | Original median | New median |
| --- | ---: | ---: |
| 256 | 0.013639 ms | 0.012606 ms |
| 1,536 | 0.144305 ms | 0.068465 ms |
| 10,000 | 1.137669 ms | 0.532428 ms |
| 100,000 | 14.910663 ms | 7.199270 ms |
| 307,200 | 48.901200 ms | 22.928285 ms |

Sorted-input medians remain on the same linear path, with ordinary sample noise;
the largest sorted case is 1.277 versus 1.348 ms. This is ordering work, not whole
save, campaign, renderer or hosted CI performance. Run from the repository root:

```sh
node --import tsx docs/development/2026-09-21-campaign-continuation/serialization/benchmark.ts
```

The fast path adds a temporary Uint32 buffer (4 bytes/cell) and a returned number
array alongside the original copy. At 307,200 cells that is about 3.52 MiB of
additional numeric storage assuming 8 bytes per array slot, excluding runtime
overhead. These are transient per-call allocations; no extra per-faction cache
is retained. The benchmark does not measure peak process memory.
