# 0016 — incremental local archive commits

Date: 2026-09-05. Status: implemented and verified, including the final combined 458-test / 43-scenario faction-art regression.

## Evidence and scope

The recorded-seed 24-seat Long campaign retains 50.58 MB at turn 392. Before this change, each worker autosave serialized and checksummed the complete envelope, then persistence parsed/checksummed it again and validated all historical records, including regenerating the origin. Rotation also read old full save texts merely to find their IDs. This repeated growing historical work after every round.

Change local storage, not canonical rules or public formats. Save schema 7, archive format 2, export envelope 1 and the existing 64 MiB logical policy remain unchanged. This does not establish giant thousand-turn support, remove the in-memory history, stream downloads or solve the large initial world observation.

## Private journal and commit cursor

A journal owns append-only history privately and is bound to its canonical game object. Only recorded commands append; callers receive detached results, exported archives and commit suffixes. Import validates the complete existing history once. A suffix preparation validates cursor and current boundary/seals without reprocessing old records. The storage adapter advances its cursor only after a successful transaction; retries cannot lose records. A reconstructed or branched journal is a new identity, not an unsafe cached prefix of a mutable public archive.

## Local storage

Dexie database version 2 retains old version-1 text rows and supports small snapshot manifests referencing immutable, content-addressed origin/record chunks. Chunks carry predecessor and sequence provenance, with bounded record/byte targets. SHA-256 checksums are outside canonical simulation and outside the write transaction. Local three-generation rotation, new chunks and reference accounting commit atomically. Rotation obtains IDs instead of fetching full historical envelopes.

Shared history creates a corruption hazard: one damaged common prefix could invalidate all three manifests. Retain three independent payload replicas per immutable chunk and verify each on read; an intact replica recovers a damaged one, while an invalid newest manifest/tail falls back to an older generation. This trades storage redundancy for recovery safety; the primary claim is less repeated writing/encoding, not threefold disk savings. Garbage collection must preserve chunks referenced by any retained manual/auto branch.

The worker uses incremental commits for autosave and manual save. Full reconstruction/materialization is reserved for load, explicit compressed export and post-victory chronicle generation. Existing UI behavior and all-faction postgame privacy stay intact.

## Verification

Verify exact replay and resumed battle/mission/travel state; old DB1 recovery and external imports; append/no-op work counters; failed commits and retry; three-generation atomic rotation; older-save branching; missing/corrupt manifests, chunks and replicas; cross-origin splices/cycles; and logical size rejection without evicting valid saves. Browser tests must use real save/load/export controls and inspect actual IndexedDB storage. Measure incremental versus existing whole-envelope behavior on identical real archives, distinguishing fake-indexeddb algorithm checks from real browser storage timings. No performance claim may hide initial import/materialization costs.

The implemented tests cover these boundaries. [Measured workloads and remaining costs](../performance/0009-incremental-storage.md) retain exact history/hash replay and explicitly distinguish emulated storage from browser disk latency.
