# Canonical hash prototype: independent design review — 2026-09-21

**Disposition: experimental only; production approval pending an actual encoded
candidate and adversarial evidence.** M0 remains open: the parent reports the
unchanged full suite at 1,791/1,792, with Epic taking 65.905 seconds against its
60-second budget. No M1 implementation is authorized by this review.

This bounded review inspected the current save/hash paths, existing canonical
land/envelope tests and the experimental battle projection helper. No production
file was changed and no test or benchmark was run. The prototype is not imported
by production. This note supplies implementation checks to the parent and
performance owner; it is not a new user approval requirement.

## Exact prototype reviewed

| File | SHA-256 |
| --- | --- |
| `performance/battle-projection-candidate.ts` | `828bf1c42e4ef377e0d455556d8f3d3732cc8460c5c201ce2862f79d5041ba99` |
| `performance/battle-projection.ts` | `55ee6bf6c957f31ebb7e3fc5e6d19704d36d4b1f95636109c2ac964e62ece760` |
| `performance/battle-projection.json` | `083e95b65234c700b6ef68139e8d3590fa884008b61733d161aef7c0c2c5865d` |

The helper parses on a miss and recursively compares current own properties,
values and prototypes against a private parsed shape before a hit. It does not
trust input identity alone. Its existing benchmark measures repeated unchanged
reports; the reported gains support investigating this narrow path, not safe
production integration or a successful Epic gate.

## Concrete issue to resolve before land reuse

**P2, prototype lines 9–16: descriptor enumerability is ignored.** After warming
the candidate, change a dictionary entry in `land.cultivation`, `land.capitals`,
`land.known` or `land.settlements` from enumerable to non-enumerable without
changing its value. Own-key count, descriptor existence and every compared value
can remain equal, so the candidate may reuse the old projection. The installed
Zod record parser explicitly skips non-enumerable entries; a fresh canonical
projection would omit the entry. A stale encoded land chunk would therefore alter
save bytes and the hash relative to the existing implementation.

The guard must compare relevant descriptor enumeration semantics, or require
ordinary enumerable data properties for cache eligibility. Arrays need their
standard non-enumerable `length` handled deliberately. Falling back to the exact
old parser is acceptable; rejecting previously accepted inputs merely to simplify
the optimization is not required.

The helper also checks own-key count/presence rather than sequence. Fixed schema
objects have schema-defined output order and canonical land ID dictionaries are
explicitly sorted, so an input-order change alone is not a demonstrated defect in
those particular outputs. Any unsorted record introduced into a cached projection
must preserve its parse order or trigger a miss. Do not generalize this helper
without identifying which order each projected dictionary uses.

## Production boundary and minimum adversarial evidence

| Boundary | Minimum check |
| --- | --- |
| Private cache | Cache only private parsed/encoded material. `battleReportForVersion`, observation, archive and other public projections must continue returning detached data. Mutating a returned report must not poison any later save/hash or another caller's projection. |
| Every current value | Warm the cache, then change a deep valid scalar, array element, order, length, optional presence, dictionary entry, work variant and report member list. Compare the complete envelope against the retained pre-change implementation after each mutation. Include restoring the old value and replacing an equal child object. |
| Strict rejection | After warmup, add an unknown enumerable key whose value is `undefined`, a function or a scalar at the root and nested strict objects; replace a key while keeping key count constant; inject NaN, infinity, invalid integers, malformed work and invalid battle refinements. Original and candidate must reject identically in acceptance, without reusing prior valid output. |
| Property mechanics | After warmup, toggle dictionary-entry enumerability, replace a data property with an accessor, alter a nested prototype, use null-prototype valid records, add array extra keys, and distinguish holes from explicit undefined. The accessor/prototype case must miss and take the existing validated path; it must not reuse a snapshot merely because identity or apparent value agrees. |
| No executable serialization shortcut | Unknown `toJSON` hooks must receive existing strict treatment, and malformed land hooks must not execute. Build encoded chunks only from private successfully validated projections using native stringification. A public wrapper, marker property or caller-supplied raw JSON string must never become trusted serialized bytes. |
| Complete byte oracle | Compare exact current and historical save strings, inner `stateChecksum` and outer `stateHashForVersion` against retained original code/fixtures. A new hash matching a new serializer is insufficient if both share the same serialization bug. Keep old sealed archives unchanged. |
| Text and punctuation | Cover quotes, backslashes, controls, CR/LF, U+2028/U+2029, astral characters, lone high/low surrogates and strings resembling any internal marker. Preserve property order, commas/brackets, omitted optionals and number formatting by reusing native JSON output. |
| UTF-16 hash | Preserve the exact FNV fold over JavaScript UTF-16 code units, including chunk boundaries between surrogate code units. Do not substitute UTF-8 bytes or hashes of individual chunks. The inner state checksum must be inserted into the unchanged header before folding the outer envelope. |
| Historical contexts | Exercise current state, v16 projection and retained older save/archive fixtures, including pending and completed battles and paid land work. A cache must not reuse a projection across differing schema/rules contexts or suppress historical downgrade rejection. |
| Untrusted imports | Keep deserialization/checksum/schema/cross-reference validation independent of memoized local state. Recomputed-checksum corruption must still fail. Parsed input cannot bring a cache token, prevalidated marker or raw encoded fragment through JSON. |
| Browser runtime | Use ordinary browser-supported JavaScript and private strings/chunk iteration. No `JSON.rawJSON`, Node-only buffer/crypto path or worker/main-thread shared cache requirement belongs in production. |

These checks should run cold and after a successful cache hit. The warm-then-
corrupt cases are essential: a passing cold parse proves little about a memoized
validation path. Full-output tests need not duplicate every domain-rule test, but
they must cover the structural distinctions the optimization proposes to skip.

Current `envelope-hash.test.ts` already covers arbitrary UTF-16, strict malformed
land and one explored-iterator traversal. `canonical-land.test.ts` covers numeric
cell order, lexical ID order, work shapes, null prototypes, unknown undefined
fields and detached frozen input. Preserve those behaviors. Its retained earlier
land projection is useful for ordering evidence; the immediate pre-candidate
strict implementation should remain the oracle for malformed-input acceptance.

## Performance and ownership limits

A full structural match remains O(number of own fields) and allocates key lists
in the current prototype. Its benefit must come from avoiding more expensive
parsing/cloning/stringification, not from claiming constant-time verification.
Measure cold misses, repeated hits and real mutations as well as unchanged
reports. Land often changes during turn resolution, so report-only repeated-read
results cannot establish its net value.

Private parsed clones, shape metadata and encoded strings can substantially
increase retained memory even with weak keys. Keep one replaceable entry per live
source/context, avoid retaining obsolete revisions or strong root registries, and
record the scope of retained-data costs. Report removal, state replacement and
save import should not require explicit public cache invalidation for correctness.

The existing benchmark checks deep equality for two reports and unchanged repeated
parses. It does not yet cover encoded bytes, mutable dictionaries, corruption after
warmup, public detachment or campaign throughput. Review the final source and its
actual call sites separately before changing this experimental disposition.

## Second prototype review: private encoded chunks

Reviewed evidence-only `encoded-projection-candidate.ts` at SHA-256
`37f401ae461200aec5ecb87a3508ca0dc6f43cd45cfb89675058390de02ed0b5`
and `load-hash-candidate.ts` at
`95b53fa296e54db46df39024779ff94722d187c531792ebcf50b635da26e4e9f`.
These files rewrite retained save source into a temporary experimental module;
they do not edit production. This review again ran no tests or benchmarks.

The new witness resolves the first prototype's enumeration gap: it captures raw
source key order, compares each data descriptor's enumerability, prototype and
leaf value, and requires a corresponding parsed property before seeding a hit.
Accessors, unknown extra array properties and incompatible prototypes cannot seed
that fast path. Null-prototype valid records fall back to the existing parser.
The candidate changes private canonical report/land projection only; the loader
does not replace the public `battleReportForVersion` implementation.

**P2: preinstalled conversion hooks are accepted as the baseline.**
`encoded-projection-candidate.ts:40–50` fingerprints whatever Object/Array prototype
descriptors exist at module initialization. A preinstalled non-enumerable
`toJSON` can therefore be considered unchanged. Line 66 encodes a cached object as
a JSON root, whose conversion key is the empty string; the original full payload
encodes it under `land` or a report-array index. A key-sensitive inherited hook can
produce different bytes even without changing any later descriptor. Non-enumerable
hooks are relevant because strict object parsing does not necessarily enumerate
them. Cache eligibility must establish the expected prototype chains and absence
of conversion hooks, rather than merely accepting the initial environment.

**P2: conversion side effects can invalidate chunk assembly mid-call.**
`encoded-projection-candidate.ts:77–97` checks prototypes before assembly, then
invokes ordinary JSON conversion during each flush. The current canonical payload
copies some scalar-typed values directly, including faction names and event
messages, rather than validating their runtime type at this point. An object
supplied there can have a `toJSON` hook that changes Object/Array prototypes during
the first flush. Later cached fragments then bypass conversions that the original
single native stringify would perform. A newly installed Object prototype hook
can also convert a later temporary ordinary chunk itself, making removal of its
first/last characters invalid as an object-body operation.

This concerns parity with the existing serializer's runtime behavior, not JSON
imports acquiring executable functions. A prototype recheck followed by a retry
is insufficient: hooks have already executed and may be stateful. Choose the
original stringify path before executing hooks when eligibility cannot prove a
plain data payload, or establish that proof before any private encoding and keep
the proof valid through composition. Minimum new cases are a non-enumerable hook
installed before module evaluation, key-sensitive conversion and a nested
conversion that installs a hook during serialization. Compare against separately
prepared original/candidate inputs so the first run's side effects do not mask a
difference in the second.

Retained-memory cost also needs evidence. Each cached source now holds a detached
parsed graph plus a Shape object and four arrays per object/array in the graph,
as well as the encoded string. Weak keys and replacement of entries avoid an
obvious unbounded revision registry, but all of that material stays live while
the source state/report stays live. Land has many small remembered-cell objects;
multiple simultaneous campaign/replay states multiply the retained cost. Reports
are capped at 20 per live state. The `encodedBytes` counter measures cumulative
encoding work, not live bytes, as the benchmark correctly notes. Obtain a
representative retained-memory comparison, including Standard24 and repeated
mutations, before making a giant-scale memory claim.

**Second-review disposition: keep evidence-only.** Resolve the two conversion
boundaries and supply the previously listed warm/cold exact-byte and rejection
tests before proposing production integration. The original enumeration finding
is resolved in this new candidate; it remains documented above against the older
historical prototype.
