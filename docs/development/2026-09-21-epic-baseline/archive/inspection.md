# Archive and command-validation investigation

Disposition: no production change. Keep complete record validation, replay, checkpoints, history and technical bytes. The command-reuse candidate is deferred; its exact public input semantics would require more machinery than the evidence justifies.

The unchanged isolated Epic profile is [the retained profile](../profile/epic-before.cpuprofile), SHA-256 `09db8db610910e77cf6ac49126cdc7abf0d0e29ad8459ec797f0f772b12476be`. Its test completed in 52.46 seconds; this is an isolated profiling run, not full-suite acceptance. The [profile summary](../profile/summary.json) attributes approximately 14.61 seconds inclusive to `replayArchive`, 11.54 to `applyRecordedCommand`, 3.72 to `applyCommandForVersion`, and 3.64 to `withRules`. Inclusive samples overlap and V8 can attribute inlined work to callers. These numbers do not measure the cost of a proposed validation change.

## Inspected work and boundaries

- `replayArchive` executes every accepted and refused order through canonical simulation, compares errors/events/turns/battle reports, checks every recorded checkpoint and final seal, then validates the archive's structure and provenance. None of these checks is redundant merely because the envelope passed its checksum.
- `parseArchive` validates command shapes and all record transitions, provenance, required checkpoints and historical versions. It does not run the full campaign on load. Its `z.unknown()` command field means a public caller's command can remain aliased; successful shape parsing is not permanent proof that an externally held command is unchanged.
- `readSave` already parses the envelope once. `serializeCampaign` already reuses its encoded payload body for the envelope checksum. Byte limits and checksums remain trust boundaries. The Epic case does not exercise IndexedDB campaign-generation storage, so changing that storage cannot explain an Epic improvement.
- `CampaignJournal.#assertSeals` already reuses hashes locally by version. `parseArchive` could similarly share a current-state hash between its latest-checkpoint and final-victory checks. This is bounded, but would save only a few hashes in this workload; it was not implemented or benchmarked.
- The `structuredClone` around a completed report returned by `battleReportForVersion` appears removable because the schema parser already detaches the report. This is a small allocation candidate, not a measured substantial improvement; it was not changed.

## Why command reuse is deferred

`applyCommandForVersion` first parses against the requested historical schema, runs historical state guards, and then calls `applyCommand` with the original input. `applyCommand` parses that original input again. Versions 16 and 17 currently use the same schema in both places.

Reusing the first parsed value would preserve ordinary JSON command normalization and detachment, but it changes the established behavior of effectful inputs. An accessor can return a valid faction ID on its first read and an invalid ID on its second; the current path executes or refuses the second parsed command. An accessor can also mutate another property between passes. Inspecting own data descriptors can exclude ordinary accessors, but cannot prove that an arbitrary `unknown` value is not a Proxy, and additional reflection introduces observable traps. A generic descriptor guard therefore does not establish exact compatibility.

A private `applyValidatedCommand` called only by ordinary `applyCommand` would be a neutral refactor. If the public historical/versioned path keeps its existing behavior, actual replay still performs both parses and receives no validation saving. Giving replay a new trusted-command bypass would add a cross-package trust/provenance contract; this investigation does not justify that expansion.

Any future revival needs a measured benefit before production edits and exact before/after results for current and historical versions, accepted and refused commands, normalization, unknown keys, malformed values, optional undefined fields, nested arrays/terms, own and inherited accessors, mutation between reads, and caller mutation after submission. Public inputs must retain their original behavior; detached data provenance must be established at an actual boundary rather than inferred from object identity or shape.

## Source scope and next review

Reviewed source hashes:

| File | SHA-256 |
| --- | --- |
| `packages/chronicle/src/index.ts` | `6e91755bdf3d248d6f64c52d2592c36182c5f4ce8d3fc951c61d867b8c1e1e3a` |
| `packages/chronicle/src/journal.ts` | `7d42b1b78e2994e3d986bacdabaf1533fa9fabf5e62166b35e19c307ca8670f2` |
| `packages/persistence/src/index.ts` | `100a9d1667da46c248c335fff1432b2ac1b5926b532a5b4acb3eab01a4b369de` |
| `packages/sim/src/simulation.ts` | `f964747ffba1541286bf19bc0db1583f385aed970961edf302e441bb88e0e39c` |

No tests or benchmarks were run for these deferred candidates, and no throughput claim is made. The next independent review targets the measured hot path's movement scratch-buffer candidate, while preserving route order and search budgets.
