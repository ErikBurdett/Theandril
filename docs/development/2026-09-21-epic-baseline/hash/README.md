# Save-hash kernel investigation — 21 September 2026

Disposition: **no production change**. Unrolling the checksum loop regressed complete hashing. Guarded typed-array copying helped the larger world, but the Epic-sized corpus improved by only 48 microseconds per complete hash in this short sample. That does not justify adding another guarded path to address the current Epic integration failure.

This investigation followed the [fresh baseline](../baseline.json) and the retained [Epic CPU profile](../profile/epic-before.cpuprofile). The previous [encoded projection experiment](../../2026-09-21-campaign-continuation/performance/hash-investigation.md) remains rejected. Neither experiment changes rules, schemas, timeout budgets, scheduling, or production validation.

## Candidate and compatibility boundary

The [retained save source](save-before.ts.txt), SHA-256 `8fa091b1af59bb7f766d5b1095fe9fd082ada190b11da28f4fffb2a7ba471257`, is loaded into temporary modules by [load-candidate.ts](load-candidate.ts). Dependencies resolve to the same current workspace modules used by the production implementation. The temporary module changes only these kernels:

- `arrays`: use guarded `Array.from` in place of five typed world-layer spreads; keep the original spread for an own or overridden iterator.
- `fold4` and `fold8`: unroll four or eight iterations of the same ordered FNV-1a UTF-16 operations, with the original scalar remainder. Both the inner payload checksum and outer envelope fold use the candidate.
- `both4`: combine `arrays` and `fold4`.

All candidates still perform the complete canonical projection, strict schema parsing, and native whole-payload `JSON.stringify` on every call. There is no persistent state or projection cache, and no caller-supplied encoded JSON. The array candidate is experimental: its prototype guard has not received exhaustive adversarial review, so this evidence does not claim equivalence for arbitrary modified prototypes or proxies.

## Bounded paired measurement

[benchmark.ts](benchmark.ts) ran with Node 22.23.2 on the local i9-13900K, in an exclusive timing window. Each comparison used two warmups and six measured pairs, alternating before/after order. Results are medians in milliseconds, not integration gate acceptance. The benchmark completed in **7.98 seconds**; progressive records and every sample are retained in [benchmark.jsonl](benchmark.jsonl).

The real retained campaign saves are loaded by the unchanged production loader, then serialized with current rules 17 before comparison. The larger run's directory includes `300`, but its actual saved turn is **227**.

| Corpus | Current turn / cells / reports | Current save bytes | Current seal |
| --- | --- | ---: | --- |
| [Tiny 4, seed 99, Epic](../../../hermes-analysis/campaigns/runs/D-tiny4-seed99-epic/final.json.gz) | 808 / 1,536 / 20 | 549,902 | `cac6d284` |
| [Standard 24, seed 74](../../../hermes-analysis/campaigns/runs/D-standard24-seed74-300/final.json.gz) | 227 / 98,304 / 20 | 5,128,634 | `893ac79f` |

| Complete `stateHash` candidate | Tiny before → after (ms) | Standard before → after (ms) |
| --- | ---: | ---: |
| Guarded array copy | 6.441 → 6.393 | 60.829 → 58.204 |
| Four-step checksum fold | 6.157 → 6.369 | 60.029 → 61.130 |
| Eight-step checksum fold | 6.181 → 6.350 | 59.199 → 62.597 |
| Array copy + four-step fold | 5.981 → 6.140 | 58.938 → 58.142 |

The isolated five-layer copy improved 0.105 → 0.086 ms on Tiny and 10.449 → 9.468 ms on Standard. The isolated four-step fold improved on Standard (5.760 → 4.806 ms), yet the complete hash regressed. The complete operation is the adoption criterion; the leaf result alone would give the wrong conclusion.

Outside the timing samples, the harness verified:

- Exact full save bytes and state seals for every candidate, for both corpora, before and after a valid treasury mutation.
- 1,000 deterministic arbitrary UTF-16 strings at three initial hash values, including remainder lengths, against the original checksum fold.
- Array copying at lengths 0, 1, 3, 4, 7, 8, 9, 1,536, and 98,304; custom own iterators remain honored and an own undefined iterator retains the original rejection.
- Unchanged source-state serialization at the end of each corpus.

These are prototype checks, not new release tests or a substitute for historical archive coverage. Production `save.ts` remains unchanged. Reproduce from the repository root:

```sh
/home/telephoneheater/.local/share/mise/installs/node/22.23.2/bin/node --import tsx docs/development/2026-09-21-epic-baseline/hash/benchmark.ts
```

## Remaining opportunity

The larger costs remain canonical land validation, completed battle-report parsing, and serialization. The current-rules save projection parses each completed report once per hash; replacing that parse with a reference-only cache would weaken validation of mutable state. Reusing a cached parsed graph also requires proving that serialization hooks cannot mutate private cached data. The rejected experiment already demonstrated material cache-miss penalties and unresolved conversion semantics. No new general cache or validation bypass is proposed here. Movement and archive investigations proceed independently, with the unchanged full-suite Epic gate still required.

## Follow-up: successful primitive validation

A second evidence-only [candidate](primitive-candidate.ts) retained every land object parse and clone while remembering at most 1,024 successful identifier strings. It used public Zod `transform`, `safeParse`, and `addIssue` APIs; it did not cache object projections. This candidate was **rejected before timing** because it changed error formatting.

The [compatibility probe](primitive-compatibility.ts) passed ten ordinary valid/invalid cases. However, a path-sensitive global error map saw `cell.settlementId` with the original schema and an empty path with the candidate: nested `safeParse` formatted the issue before the enclosing path was known. A per-parse error override was also bypassed. Exact output is retained in [primitive-compatibility.json](primitive-compatibility.json). Forwarding only already formatted issue objects is therefore insufficient to preserve the original parsing API. No production schema or save path was changed, and no performance claim is made for this rejected wrapper.
