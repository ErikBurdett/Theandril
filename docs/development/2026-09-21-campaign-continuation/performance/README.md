# Archive technical-render performance — 2026-09-21

The unchanged Epic archive integration test remained above its 60-second budget
in the preceding default full-suite run. This is a bounded serialization
improvement, not evidence that the complete gate now passes. The parent workstream
owns the combined default-suite verification.

A later state-hash cache/encoded-fragment prototype was **rejected for production**
because of mutation penalties and unresolved serialization semantics. Its actual
corpus, timings and disposition are recorded in
[hash-investigation.md](hash-investigation.md); it did not change runtime code.

## Profile evidence and selected change

The retained real Epic profile is
[`epic-integration-comparison.cpuprofile`](../../2026-09-21-roadmap-start/performance/epic-integration-comparison.cpuprofile).
Its inclusive samples attribute approximately 14.576 seconds to archive replay,
10.277 seconds to recorded-command application, 7.691 seconds to observations,
and 1.262 seconds to chronicle generation. State hashing occurs across multiple
callers; its 15.183 seconds must not be added to those inclusive totals. The
structural replay comparison implemented in the preceding slice accounts for
only about 91 milliseconds in this profile. Archive parsing accounts for about
392 milliseconds. These figures make further large gains in transport validation
or replay comparison unlikely.

Within chronicle generation, canonical JSON rendering accounts for about
762 milliseconds. Both the complete technical document and each order page used
to render sorted compact JSON, parse the string into another object graph, and
encode that graph again with indentation. The same sorting replacer can emit
indented JSON directly. The new `stablePrettyJson` preserves the old bytes for
serializable records, retains omission/null/number behavior, and still rejects an
omitted root with `SyntaxError`. The compact renderer and existing replay
comparison remain unchanged. No save schema, checkpoint, rules, command, event,
archive validation, timeout, test scheduling, or assertion was changed.

## Paired measurement

Run with Node 22.23.2 in an exclusive CPU window:

```sh
/home/telephoneheater/.local/share/mise/installs/node/22.23.2/bin/node --import tsx docs/development/2026-09-21-campaign-continuation/performance/chronicle-pretty.ts > docs/development/2026-09-21-campaign-continuation/performance/chronicle-pretty.json
```

The script freezes the four real v15 `fieldCompleted` archive records and repeats
them 4,096 times. Each sample renders the complete archive and each record, as the
two technical-document paths do. This repeated 16,384-record corpus is a synthetic
serialization workload, not a simulated campaign. It contains a real completed
battle and events but does not reproduce the full campaign's command mix or UI
construction. The technical document contains 50,630,280 bytes. Correctness checks,
corpus construction, hashing, and file I/O are outside timing. There are two
warmups and eight measured pairs with alternating order.

| Renderer | Median | p95 |
| --- | ---: | ---: |
| Previous compact → parse → indent | 783.868 ms | 1,030.367 ms |
| Direct sorted indentation | 576.348 ms | 707.201 ms |

The measured median improves by 26.5%. Both renderers produce identical bytes,
and the frozen source remains unchanged. Raw samples, CPU/runtime, and corpus
hashes are retained in [`chronicle-pretty.json`](chronicle-pretty.json); the frozen
previous algorithm and reproducible harness are in
[`chronicle-pretty.ts`](chronicle-pretty.ts). This result supports a modest export
improvement, not a 26.5% campaign or replay improvement.

## Regression verification

```sh
/home/telephoneheater/.local/share/mise/installs/node/22.23.2/bin/node node_modules/vitest/vitest.mjs run packages/chronicle/src/json-equivalence.test.ts packages/chronicle/src/chronicle.test.ts packages/chronicle/src/compatibility.test.ts --maxWorkers=1
```

Result: **35 tests passed across three files**, 2.23 seconds total (1.40 seconds
tests). This targeted run is separate from the unchanged default integration
gate; its worker option is not a change to that gate. The comparison tests use a
frozen pre-change renderer, 500 seeded property cases, explicit optional fields,
array holes and order, nonfinite numbers, negative zero, special keys, and custom
JSON conversion/omission. The retained v15 battle archive is deeply frozen and
rendered whole and per record without input mutation. Existing old-rules replay,
corruption refusal, and generated chronicle checks also pass. `git diff --check`
passes for the owned paths. Broad typecheck/lint and final integration verification
are delegated to the parent workstream.

Source SHA-256 at the measured checkpoint:

| Path | SHA-256 |
| --- | --- |
| `packages/chronicle/src/index.ts` | `6e91755bdf3d248d6f64c52d2592c36182c5f4ce8d3fc951c61d867b8c1e1e3a` |
| `packages/chronicle/src/json-equivalence.ts` | `af649f8a62779172d0bef6fd8bbda08193f545904180d849d91bac3ddaf0a602` |
| `packages/chronicle/src/json-equivalence.test.ts` | `16fc68b21786c43aef2f86f40af6661036432ed6f17420df07a846ddfe87f36e` |
| `chronicle-pretty.ts` | `0eb290a76a0f56a9c3dc0e94649d11e04fc4213ee3df494ec7bbfd5fba0bab9b` |
