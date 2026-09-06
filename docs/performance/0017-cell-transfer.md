# Packed explored-cell transport

Final capture: **2026-09-06 06:30:32.013 UTC**, in a reserved CPU window without concurrent browser, native-art or test workloads. Node v26.7.0; Linux 7.1.9-arch1-2; Intel Core i9-13900K, 32 logical CPUs, 33,317,580,800 bytes RAM. Content `9418e598`, canonical schema 9 / generator 4; the independent cell packet format is version 1. No canonical rules, content or save format changed.

Reproduce with `node --import tsx scripts/benchmark-cell-transfer.ts --output`. See the [benchmark source](../../scripts/benchmark-cell-transfer.ts), [raw results](0017-cell-transfer.json), [codec](../../apps/web/src/cell-transfer.ts) and [53 focused tests](../../apps/web/src/cell-transfer.test.ts). Typecheck, scoped lint, smoke and full measurements pass. Review found a sparse-dictionary hole accepted by `Array.every`; the regression reproduced it, the validator was corrected, and these measurements were rerun afterward.

## Workload and accounting

Seed 20260905, Huge with 32 factions and Legendary with 40. Each faction establishes one town through a normal founding command. The player's entire map is then explicitly marked explored and strictly saved/loaded; current sight and remembered foreign ownership are not revealed artificially. A real move by `army.2` produces an 18-cell visibility delta. The fully explored snapshots still contain only 61 currently visible cells. This is authored full-map transport stress, not evidence of earned exploration or a mature military campaign.

The codec packs only supplied, already-filtered observations. Each row uses four bytes for its cell ID and five bytes for scalar values/flags. Present optional fields add a sparse 20-byte record; repeated strings use a stable message-local dictionary. Absent, null and explicitly undefined references remain distinct, as do absent/undefined/zero feature masks. Only three freshly allocated packet buffers are transferred; canonical geography and source observations are untouched. The decoder validates bounded lengths, ranges, flags, dictionary slots/references and sorted sparse records before creating cell objects.

The previous byte metric is UTF-8 JSON size of the cell-object array. The new metric sums actual typed-array `byteLength` plus UTF-8 JSON of `{version,count,dictionary}`. **Neither represents measured browser wire framing or decoded heap size.** Other observation fields, response metadata, land-detail replies and assets are outside these cell-only totals.

| Payload | Cells | Object JSON bytes | Packed logical bytes | Reduction |
|---|---:|---:|---:|---:|
| Huge full | 196,608 | 16,329,737 | 1,769,695 | 89.16% |
| Legendary full | 307,200 | 25,577,385 | 2,765,023 | 89.19% |
| Huge actual movement delta | 18 | 1,486 | 202 | 86.41% |
| Legendary actual movement delta | 18 | 1,504 | 202 | 86.57% |
| Empty, both cases | 0 | 2 | 39 | 37 bytes larger |

Each full packet has seven optional rows and two dictionary entries: binary storage is 1,769,612 / 2,764,940 bytes plus 83 metadata/dictionary bytes. Movement deltas have no optional rows: 162 binary bytes plus 40 metadata bytes. This is a sparse-ownership case; the format adds 20 bytes for every optional row in a metadata-dense payload, and that maximum-density throughput is not measured here. Empty packets retain fixed metadata overhead rather than fabricating a reduction.

## Transfer primitive timings

Three warmups precede twelve samples per payload. The baseline invokes actual Node `structuredClone` on the cell objects. The new path separately times packing, `structuredClone(packet, {transfer: buffers})`, and full validated unpacking. All sender buffers must detach. JSON encoding, SHA-256 comparisons, byte accounting, source generation, save mirrors and final strict load are outside these timers. The composite is the sum for each sample, not a sum of component p95 values.

| Full-payload component | Huge mean / reported p95 | Legendary mean / reported p95 |
|---|---:|---:|
| Object structured clone | 75.412 / 81.796 ms | 127.657 / 133.212 ms |
| Pack and validate input | 27.768 / 40.875 ms | 38.206 / 61.047 ms |
| Transfer structured clone | 0.037 / 0.050 ms | 0.035 / 0.044 ms |
| Validate and unpack | 5.772 / 30.350 ms | 6.595 / 30.191 ms |
| Pack + transfer + unpack | 33.577 / 54.936 ms | 44.835 / 65.171 ms |

The full-payload primitive chain improves on the matched object-clone baseline on this machine. It still allocates reconstructed cell objects and costs tens of milliseconds; it is not zero-cost or a measurement of end-to-end worker/UI responsiveness. Reported p95 selects sorted index `floor(0.95 × count)`; with twelve samples it is the maximum, retaining the roughly 30 ms decode outliers. These small samples and unforced GC do not establish sustained worst-case latency.

Tiny messages are shown in microseconds to avoid rounding their entire cost to zero:

| Small-payload operation | Huge mean / reported p95 | Legendary mean / reported p95 |
|---|---:|---:|
| 18-cell object clone | 7.716 / 8.190 μs | 8.049 / 9.584 μs |
| 18-cell pack + transfer + unpack | 7.691 / 8.021 μs | 7.825 / 13.103 μs |
| Empty object clone | 0.710 / 0.960 μs | 0.660 / 0.802 μs |
| Empty pack + transfer + unpack | 5.328 / 6.175 μs | 4.513 / 5.049 μs |

There is no meaningful tiny-delta speedup established here, and the empty packet is slower/larger. The main benefit is reducing full explored-map copying and payload representation, while preserving the existing changed-row filtering.

## Integrity and limits

The saved movement continuation exactly reproduces the observed update and canonical state. Every measured object clone and packed roundtrip matches the original cell-array SHA-256. Source arrays and canonical hashes remain unchanged throughout measurements; final saves strictly reload.

| Seal | Huge | Legendary |
|---|---|---|
| Before the public move | `638cd4a9` | `a0bf21f7` |
| After move, mirror and all transfers | `4f2cfe0f` | `8e9f7359` |
| Move target for `army.2` | 50498 | 134019 |
| Full observed-cell SHA-256 | `9d361b1127d370ef7bbbe783782226c87f991bd31741654c05a4b1fdc6083dfd` | `4c4afb6d1416706ec4995804ba421ddda9a26ebd2e23da32d132b26e1d9b7b93` |

Unit/property coverage includes shuffled order, all optional states, uint32 feature extremes, UTF-8 dictionary accounting, immutable inputs, real canonical-buffer isolation, actual transfer detachment, invalid arrays/scalars/flags/references, sparse dictionaries, and shared/aliased/offset buffer rejection. Feature-mask null is rejected because the current observed-cell type permits only number or undefined; nullable ownership/improvement references are retained exactly. Sixty fixed-seed generated payload cases exercise the lossless roundtrip.

Process heap/RSS snapshots after Huge are approximately 380/777 MiB and after Legendary 815/1,333 MiB. These include full object-clone baselines, parsed saves, decoded arrays, mirrors, JSON and hash temporaries, with no forced GC. They are not retained transport memory, peak memory or a leak proof.

This report does not measure browser `postMessage` scheduling, main-thread frame stalls, rendering/GPU residency, many-town detail-query cost, actual disk latency, or a long campaign. Worker/main integration and its browser evidence are separate release checks. Dense optional metadata, cold-load latency and representative mainstream hardware remain unmeasured limits; sparse encoding does not remove the need for scoped read models.
