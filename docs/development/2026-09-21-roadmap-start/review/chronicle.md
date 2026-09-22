# Independent chronicle replay comparison review — 2026-09-21

**Verdict: approved for comparing ordinary event/battle replay data.** No remaining
correctness or corruption-acceptance defect was found in the reviewed scope.
Performance adoption and final integration remain dependent on the parent run;
this review does not claim that the campaign timeout is resolved.

Final reviewed SHA-256 values:

| File | SHA-256 |
| --- | --- |
| `packages/chronicle/src/index.ts` | `8b3972dd0313d379cb7fff07a6869e59216e5abb287de6ae5061a7a249d68809` |
| `packages/chronicle/src/json-equivalence.ts` | `ae0bfd997ec0602a5c9b0303ec75debaadee6566ab1b74e85cec5dab62914c0c` |
| `packages/chronicle/src/json-equivalence.test.ts` | `f2923788623f13e36b47486644a93c69d00943c658a6dcc93c00a9ebd28c61f4` |

## Reviewed behavior

The production diff replaces only the two replay result comparisons, for event
arrays and completed-battle arrays. Command application, result/error checks,
turn checks, per-order checkpoint checks, final victory seal and final strict
archive parsing remain unchanged. The comparator traverses every ordinary data
field; it does not replace complete-event/report comparison with a subset, digest,
object identity or trusted archive claim.

For ordinary schema data, structural comparison is equivalent to the previous
canonical string comparison:

- Own string-keyed object properties compare independent of insertion order;
  missing keys and extra non-omitted values still reject.
- Array lengths and positions remain significant; holes/undefined slots use the
  same JSON null representation. Non-index array properties remain irrelevant.
- Undefined/function/symbol object values are omitted, explicit null is retained,
  nonfinite numbers normalize to null, and negative zero equals zero.
- `Object.hasOwn` preserves own-property distinctions, including special names
  and null-prototype data, without prototype-dependent key lookup acceptance.

The old `stableJson` renderer body was moved without changing its implementation.
Technical-record and technical-page generation still call that renderer and use
the same surrounding formatting. The production helper imports no Node module
or environment-specific dependency; Node imports occur only in tests/benchmarks.

## Finding corrected during review

The first candidate returned false for
`{ wrapper: { toJSON: () => undefined } }` versus `{}` before reaching its custom
JSON fallback. The old renderer considers both `{}`. Parent and this reviewer
identified the same key-count issue independently.

The final `dataKeys` pass detects direct custom/boxed conversions before comparing
key counts, which repairs that case and nested equivalents. The two added
regressions retain the original renderer as their oracle. Fallback compares the
complete original inputs, preserving the original property key passed to
`toJSON`, rather than serializing a detached nested object with the wrong key.

Approval is for normal event/battle records and the documented pure conversion
cases, not arbitrary effectful JavaScript objects. Stateful getters/proxies or
custom conversions that mutate sibling data are not archive schema data. Early
mismatch on an invalid arbitrary tree may also reject before discovering a later
unsupported BigInt/cycle that the old full renderer would throw on; it does not
turn that input into a successful replay. No valid persisted archive depends on
such exception ordering.

## Evidence and limits

I inspected the fixed helper and regression tests: 500 seeded arbitrary-JSON
pairs, reordered object keys, JSON optional/null/number/array edge cases, custom
conversion/omission cases and retained version-15 historical replay. The forgery
cases change event text and completed-battle log text and require rejection;
reordered historical records must retain their original state hash. The author
reports all 25 tests passing on this candidate; this reviewer did not rerun tests
or timed work during the coordinated integration window.

The retained paired microbenchmark uses eight event/report pairs from an existing
version-15 fixture, 400 comparisons per sample, four warmups and twenty alternating
samples. Its reported medians are **4.127 ms** for original string comparison and
**0.692 ms** for the candidate. I checked the benchmark source and JSON: correctness
checks/setup are outside timing, the original renderer remains the oracle, and
technical serialization equality is separately asserted. This demonstrates the
comparison operation on that corpus; full campaign, archive parsing, replay
simulation and browser performance remain separate measurements.
