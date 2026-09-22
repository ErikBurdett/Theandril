# Primitive schema compilation investigation

Disposition: **rejected; no production change**. Compiling primitive validators
with the installed Zod 4.5.4 public API did not produce a convincing complete-hash
gain. Both candidates also change messages for public error maps that identify
the schema which raised an issue. No runtime dependency, rule, save schema,
validation budget or campaign acceptance threshold changed.

This follows the [previous rejected kernel and primitive-cache experiments](../../2026-09-21-epic-baseline/hash/README.md).
The new experiment does not cache mutable campaign objects or successful strings,
change the checksum loop, copy typed arrays differently, or substitute handwritten
validation. Every call retains the original full projection, object/record
traversal, strict checks, detached output and native JSON serialization.

## Candidates and compatibility

[The loader](load-candidate.ts) imports temporary copies of the exact
[pre-change save source](save-before.ts.txt), SHA-256
`8fa091b1af59bb7f766d5b1095fe9fd082ada190b11da28f4fffb2a7ba471257`.
All copies resolve the same production dependencies. The baseline remains
unmodified; `local-primitives` wraps the save module's `integer`, `id` and `cell`
schemas in `z.compile`. `known-primitives` derives the land containers with
compiled numeric and identifier leaves for known cells. Neither candidate
compiles an object, record or array traversal.

The [official API](https://zod.dev/compile) generates code using `new Function`
and falls back to the original parser when compilation is refused or validation
fails. The installed README estimates about 7 kB gzip additional compiler code.
The CSP fallback is documented, but no browser bundle or CSP experiment was run:
the complete-operation and compatibility results already reject adoption.

[Compatibility checks](compatibility.ts) passed **184** cases covering exact full
save bytes, invalid primitives, null prototypes, inherited/unknown land fields,
stateful report getters on both success and failure, and default, global and
per-parse error formatting. [Raw result](compatibility.json).

An additional [identity-sensitive error-map probe](error-identity.ts) found a
remaining public API difference. A per-parse error map comparing `issue.inst` to
the exported report identifier schema labels the original invalid identifier
`report identifier`, but labels the compiled candidate `other schema`. The
compiled clone falls back through its original source schema. Similarly, the
derived known-land object schema changes a global error map's `known-land object`
message to `other schema` for an unknown key. Exact output is retained in
[error-identity.json](error-identity.json). These failures are not corrected by
changing error expectations; the candidates remain evidence only.

## Paired complete-operation measurement

[The benchmark](benchmark.ts) ran in an exclusive CPU window on Node 22.23.2,
Intel i9-13900K. It uses two warmups and six alternating measured pairs. Each
Epic sample contains six complete `stateHash` calls; each Standard sample one.
The whole harness completed in 4.993 seconds. Every raw sample, input seal and
source hash is retained in [benchmark.jsonl](benchmark.jsonl).

| Corpus | Actual turn / cells / reports | Current save bytes | Current seal |
| --- | --- | ---: | --- |
| Retained Epic, Tiny 4, seed 99 | 808 / 1,536 / 20 | 549,902 | `cac6d284` |
| Retained Standard 24, seed 74 | 227 / 98,304 / 20 | 5,128,634 | `893ac79f` |

| Candidate | Epic before → after, ms/hash | Standard before → after, ms/hash |
| --- | ---: | ---: |
| Local save primitive schemas | 7.709 → 7.827 | 67.624 → 64.995 |
| Known-land primitive schemas | 6.666 → 6.437 | 67.805 → 66.106 |

The local primitive candidate regressed the Epic median. The known-land
candidate saved about 0.229 ms per complete Epic hash (3.4%) in this short sample,
with overlapping samples. This does not establish enough gain for a new compiler
dependency in the browser bundle, and neither candidate preserves the required
error-map behavior. Complete save bytes and seals matched for both real corpora
before and after a treasury mutation. These measurements are not campaign or
full-suite acceptance, and no candidate was installed in production.

## Whole-schema follow-up

The [follow-up probe](whole-schema-accessors.ts) compiled the complete land and
completed-report schemas at their canonical projection parse sites. Ordinary
full-save bytes still matched. However, actual `serializeGame` calls now accepted
states the original rejected: a known-land `biome` getter returning an invalid
string once and then `2`, and a completed-report `id` getter returning `BAD` once
and then its valid ID. The original reads each getter once and rejects the first
value. The compiled fast path fails, retries through the original parser, reads
the getter twice and accepts the second value. See exact results and issue paths
in [whole-schema-accessors.json](whole-schema-accessors.json).

This probe completed in under one second. Whole-schema compilation is rejected
before benchmarking because it changes observable save acceptance and accessor
behavior. No wrapper, object cache or alternate internal data boundary was added
to work around the mismatch.

Reproduce from the repository root with Node 22:

```sh
node --import tsx docs/development/2026-09-21-verification-cost/hash/compatibility.ts
node --import tsx docs/development/2026-09-21-verification-cost/hash/benchmark.ts
node --import tsx docs/development/2026-09-21-verification-cost/hash/error-identity.ts
node --import tsx docs/development/2026-09-21-verification-cost/hash/whole-schema-accessors.ts
```
