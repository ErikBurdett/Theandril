# Independent technical-record formatting review — 2026-09-21

**Verdict: approved for the two chronicle formatting paths. No blocking finding.**
This is source, test-design and retained benchmark review. I did not run tests,
lint, typecheck or benchmarks during the coordinated performance window. Full
campaign timing, browser integration and release acceptance remain parent-owned.

## Reviewed source

| File | SHA-256 |
| --- | --- |
| `packages/chronicle/src/json-equivalence.ts` | `af649f8a62779172d0bef6fd8bbda08193f545904180d849d91bac3ddaf0a602` |
| `packages/chronicle/src/json-equivalence.test.ts` | `16fc68b21786c43aef2f86f40af6661036432ed6f17420df07a846ddfe87f36e` |
| `packages/chronicle/src/index.ts` | `6e91755bdf3d248d6f64c52d2592c36182c5f4ce8d3fc951c61d867b8c1e1e3a` |

The current delta adds an optional indentation argument to the existing sorting
renderer and a `stablePrettyJson` wrapper. It replaces exactly the whole technical
record and per-order technical-page expressions previously using
`JSON.stringify(JSON.parse(stableJson(value)), null, 2)`. Replay comparisons still
use the previously reviewed `sameJson`; this formatting delta does not change its
body, command application, seal validation, archive parsing, history prose or
canonical save/hash generation.

## Byte-equivalence reasoning

For ordinary technical-record JSON, the first old rendering already establishes
every object's key order and normalizes JSON values. Parsing it and rendering
again only applied indentation. Giving the same sorting replacer a two-space
indent directly preserves that order and value representation while removing the
intermediate compact string, parsed object graph and second encoding traversal.

The replacer itself is unchanged: non-array objects are reconstructed from the
same sorted entries. JavaScript's numeric property-key ordering applies to both
that reconstruction and the old parsed object, so integer-like keys remain in the
same positions. Arrays retain their original order. The native renderer supplies
the same string escaping, finite-number output, negative-zero normalization,
nonfinite nulls, omitted object properties and null array holes/undefined entries.
The old parse step cannot add a new precision loss to numbers that were originally
encoded from the same JavaScript number representation.

Custom conversions and optional fields are still processed by the same first
renderer with the same original parent keys. The added root-undefined guard is
necessary: the old `JSON.parse` rejected an omitted root; returning raw
`undefined` would silently change the failure behavior. The wrapper now preserves
rejection as `SyntaxError`, including a root `toJSON` returning `undefined`.
Error text is not byte-identical and is not consumed by either call site. Both
production roots are ordinary record objects.

No shared object is mutated: sorting uses fresh `Object.entries` arrays and fresh
objects, as before. Calling compact `stableJson` without the optional indentation
still supplies `undefined` as native `space`, retaining its old compact output.

## Test and measurement assessment

- The fixed-seed property compares **complete pretty strings** against the
  retained old compact-render/parse/indent expression for 500 generated JSON
  pairs, including reordered object-key input. It does not merely parse outputs
  and compare semantic equality.
- Directed cases extend the same byte oracle across absent optionals, array holes,
  nonfinite numbers, negative zero, omitted functions/symbols, special/numeric keys,
  null prototypes, dates, boxed values and custom conversions/omissions. Root
  omission must throw rather than becoming a missing technical document.
- The new retained-version-15 fixture case recursively freezes real archive and
  battle/event records, checks the complete archive and every record's exact
  pretty output, and verifies the source JSON is unchanged afterward. Existing
  historical replay and forged-text rejection tests remain in the file.
- The paired benchmark retains the original algorithm, alternates execution order,
  checks exact bytes and frozen inputs outside timing, and covers both formatting
  calls. Its JSON reports **783.868 → 576.348 ms** median for a synthetic history of
  16,384 records built by repeating four real records 4,096 times. The whole
  technical JSON is 50,630,280 bytes. This is serialization-only evidence, not
  a naturally played campaign or overall replay-throughput result.

The optimization removes a concrete transient string/graph traversal, but the
output still contains the full technical record and full per-order pages. The
sorting replacer still allocates temporary objects. This is not streaming export,
an archive-capacity increase or a measured peak-memory guarantee. None of those
limits blocks the exact-output change at the reviewed call sites.

No corrective edit is requested. Recheck affected claims if the hashed source
changes; preserve the parent integration result independently of this approval.
