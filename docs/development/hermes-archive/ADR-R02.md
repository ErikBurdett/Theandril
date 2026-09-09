# ADR R02 — bounded complete-campaign persistence

Status: implemented; retained Standard/24/Long passes Node and real Chromium persistence,
portable round trips and full historical replay. See [verification](README.md) for scope and gaps.
Owned scope: `packages/persistence/**` and this directory. No canonical rules/content or worker/UI changes.

## Evidence and decision

The read-only capture `docs/hermes-analysis/qa/captured-standard-long-748291.json.gz`
(SHA-256 `56a81b5fbc91c0bea89b8cc5f78ace519d7fa0d6109545f7444af5dcce159780`)
has 114,244 schema-16 records, 1,496 battles, a valid turn-446 victory snapshot,
and a 93,161,744-byte v1 envelope. Its largest record is only 28,151 bytes.
The real cold-save reproduction fails in `encodeSuffix`, not in snapshot validation,
IndexedDB, or chunk sizing. Existing 256-KiB/256-record immutable history chunks,
three payload replicas and transactional rotation are suitable; replacing them is unnecessary.
The defect is conflating a complete history's aggregate bytes with one snapshot/file's limit.
Compression alone does not satisfy the old 64-MiB logical policy.

Adopt a versioned, finite **complete-or-error** policy, never automatic truncation:

| Resource | New writer / reader policy |
| --- | --- |
| Canonical snapshot and stored origin/manifest | retain 64 MiB UTF-8 ceiling each |
| Archive JSON record payload total | 128 MiB |
| One JSON record | 4 MiB on new chunk writes/v2 envelopes; v1 read/export paths retain their prior ceiling |
| Complete logical envelope | 192 MiB, including snapshot, origin, history, escaping and delimiters |
| Records | 1,000,000 (unchanged chronicle bound) |
| Stored history | 192 MiB encoded; at most 16,384 blobs per history |
| One stored history blob | 256 KiB; at most 256 records (unchanged) |
| Portable file | 64 MiB compressed including format tag |

These are supported persistence bounds, not gameplay entity caps or a claim to support
arbitrarily long campaigns. Refusal is explicit and leaves previous generations intact.
A snapshot-only legacy import remains `from-save`; no path labels a truncated record
`complete`. Journals and historical hashes/rules/content remain unchanged.

## Formats and compatibility

- Preserve DB schema 2, existing stores, SHA-256 addresses, replicas and three-generation
  rotation. New manifests are version 2 with cumulative encoded-history bytes/blob count.
  Read manifest v1 under its original bounds; append migrates only the next manifest,
  sharing immutable history. No destructive migration or rewriting historical snapshots.
  A legacy prefix containing a record above 4 MiB stays readable/exportable as v1, but
  fails new chunk commits before publication: do not install an unreadable v2 manifest
  and eventually rotate away the only valid legacy generation. Normal v1 prefixes append
  unchanged under v2. Oversized legacy-prefix continuation in v2 is not implemented.
- Keep envelope v1 for campaigns fitting its 64-MiB bound. Larger envelopes explicitly use
  version 2 with the same fields/checksum but the sectioned limits above. Old readers
  fail closed instead of accidentally accepting unsupported sizes.
- Preserve legacy gzip exports/imports. Larger v2 exports use a `TAC2` binary prefix plus
  one gzip member; the prefix opts into the larger bounded expansion policy. Untagged
  gzip retains its 64-MiB expansion limit. V2 requires both matching prefix and envelope
  version; wrong tags, malformed JSON, checksums, CRC, trailer and length mismatches fail.
- Stream text into compression and decode bounded output incrementally, avoiding the
  previous whole expanded-byte concatenation alongside the decoded text. Count actual
  output, not only gzip ISIZE; validate canonical/chronicle semantics before returning.
  The existing string API and in-memory journal still retain O(history) data; this is
  not an out-of-core archive or a constant-RSS promise.

## Recovery and verification

Prepare bounds outside the write transaction. Inside publication, verify the origin
and every immutable prefix dependency before publishing chunks+manifest+generation
and rotating; advance the journal cursor only after commit. Missing interior replicas
must refuse both no-op and append publication atomically without removing the last
readable generation or advancing the cursor.

When garbage is queued, derive incoming ownership from digest-verified payload links
and retained manifests, including leases from orphan successors not yet reclaimed.
Self-checksummed reference metadata is not deletion authority or authentication.
The 64-blob cap bounds physical reclamation per commit, not verification reads:
prefix verification reads/hashes/parses O(prefix bytes) under publication, and queued
GC proof scans the entire stored blob inventory and manifests. Zero new history
payloads does not mean zero or constant-time work; profile large-store GC separately.

Fail closed if that proof is unverifiable, even for an unrelated branch: this can
refuse an otherwise valid save but must roll back all stores, stats and retry cursors.
Do not delete corrupt evidence to conceal that availability tradeoff. Overcounts
without queued garbage are not proactively scrubbed. The subsequent
[independent review](../post-fix-review/persistence.verdict.json) closes the two
original durability blockers while preserving these costs and certification limits;
its [temporary probes](../post-fix-review/retained-persistence-evidence.json) are
retained, not claimed as permanent tests or a newly run Chromium/large replay.

Quota/corruption rejection must retain the prior slot; load falls back without deleting
bad evidence. Record UTF-8 section sizes, append/no-op counters, wall timings and process
RSS for the retained case. Run separate retained save/load, portable export/import and
full historical replay processes, not simultaneous campaign matrices.

Required follow-up evidence: real browser quota exhaustion/crash recovery and mobile peak
RSS, Huge/Legendary complete campaigns, UI controls/feedback for exhaustion and cross-browser
codecs. Chromium's real IndexedDB and portable codec are exercised, not hardware fsync or
process-kill durability. Fake IndexedDB timings are separately labeled algorithm/emulated-
transaction evidence. The separate historical morale defect must never be repaired by
editing the capture or relaxing archive validation; storage now accepts parent's version 17
while preserving every original version-16 record/hash and snapshot origin.
