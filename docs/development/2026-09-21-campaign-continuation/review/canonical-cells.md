# Independent canonical explored-cell sort review — 2026-09-21

**Verdict: approved for the bounded exact-output optimization. No blocking finding.**
This is source and test-design review. I did not rerun tests, lint, typecheck or
timed work during the coordinated CPU window. The parent's reported 15 passing
tests across three files are not independently rerun results, and this review
does not establish Epic timing recovery or release-scale memory acceptance.

## Reviewed source

| File | SHA-256 |
| --- | --- |
| `packages/sim/src/canonical-cells.ts` | `4c3175175ee06d4a2742bc75ae6e0d1d793520da93798377fefe17341d804be9` |
| `packages/sim/src/canonical-cells.test.ts` | `5319912650f3e518f5ef91b84d945b8d6a873a780931cf9fe4dc12efb30ed01b` |
| `packages/sim/src/save.ts` | `8fa091b1af59bb7f766d5b1095fe9fd082ada190b11da28f4fffb2a7ba471257` |

The save-file diff removes the local helper and imports its extracted replacement;
its explored projection still calls the helper on each faction's same iterable.
No envelope ordering, checksum, hash fold, schema, version or other save field is
changed by this diff. The test retains the exact pre-change helper separately.

## Output-equivalence reasoning

- Both implementations first spread the supplied iterable into a fresh normal
  array. They traverse that iterable once and preserve yielded values, duplicates
  and insertion order before checking monotonic order. No cache or identity-based
  reuse is introduced.
- The original ascending fast path is unchanged, including empty/singleton input,
  already sorted signed/fractional values, and its treatment of unusual singleton
  values. Conversion is considered only at the same first out-of-order or
  nonnumeric pair that previously triggered the comparator sort.
- The new branch additionally requires at least 256 values and verifies that every
  value is a primitive integral number in `[0, 2^32 - 1]`, excluding negative zero.
  Every admitted number is represented exactly in `Uint32Array`; conversion cannot
  wrap, truncate, stringify, invoke an object's coercion or lose a zero's sign.
- Native typed-array sorting is ascending numeric order. For this admitted domain
  it has the same value sequence as `(a, b) => a - b`; duplicate values are
  indistinguishable primitive numbers, so internal tie ordering cannot change the
  returned value array. `Array.from` returns a normal array as before.
- Values outside the domain use the original comparator on the original copied
  values. The eligibility scan uses `Number.isInteger` first and short-circuits,
  so objects, symbols and other coercible inputs are not coerced by the new guard.
  Original comparator coercions and errors therefore remain on the old path.
  Spread converts source-array holes into ordinary `undefined` values in both
  versions; they fail the new guard rather than becoming typed-array zeroes.

This argument covers actual cell IDs, which saves bound to at most 349,999, and the
wider unsigned domain accepted by the optimization guard. It makes no new promise
about monkey-patched language intrinsics or deliberately effectful global runtime
modification.

## Test assessment

The fixed-seed property compares the candidate against the retained helper for
100 unsigned sequences of 256–4,000 entries and their reversed order. It checks
complete arrays, preserving duplicate multiplicity. Directed cases include
negative zero, negative/fractional/out-of-range numbers, infinities, NaN, strings,
undefined/null, coercible objects and throwing symbols.

The iteration/mutation test observes one traversal, frozen input preservation and
a fresh result after the caller mutates a prior return. The full-envelope test
replaces only explored cells with the old helper's answer, recomputes the inner
checksum and requires exact serialized bytes and the outer state hash. Same-size
membership replacement and subsequent shrinking exercise the absence of stale
set-size/identity caching. Those checks address the actual compatibility risk,
not only an implementation detail of the chosen native sort.

The directed object-coercion test is small, but source inspection establishes that
the large-input guard cannot call its conversion methods before falling back.
No missing test is considered blocking for the current straightforward guard.

## Memory and scale limits

The optimization keeps linear temporary storage and does not retain a growing
cache across saves. The unordered large-input branch does allocate a typed-array
buffer plus a new normal result while the initial copied array may still be live.
The Uint32 buffer is exactly `4 × N` bytes, at most 1,400,000 bytes for one fully
explored 350,000-cell faction. The additional normal result's storage depends on
the engine; a rough 8-byte-per-entry estimate is another 2.8 MB before headers and
sort implementation scratch space. These are logical allocation estimates, not a
measured heap/RSS delta; the old comparator sort also has engine-dependent scratch
costs.

Factions are serialized sequentially, but completed result arrays remain in the
canonical payload and unreachable scratch reclamation depends on GC. Accordingly,
this change should be described as avoiding JavaScript comparator work, not as a
proven reduction in allocation, peak memory or all-save latency. The 256 threshold
is a tuning choice, not a correctness boundary. Parent measurements should assess
the actual Epic workload and, for broader performance claims, mature multi-faction
save/GC behavior. None of those limits changes the exact-output approval above.
