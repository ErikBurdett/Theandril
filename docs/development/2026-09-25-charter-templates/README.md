# Reusable charter templates — 25 September 2026

Implemented local checkpoint. Publication and live verification are recorded separately; deployment does not close a release gate.

## Acceptance

A player can save, update, recall and delete a named charter focus/ceiling in a personal browser library. Reloading or changing campaigns retains the library. Recalling fills the group form without issuing orders; Apply charters uses the existing canonical batch. Template changes do not change active charters or existing queues. Failed reads and writes are visible and preserve stored data, while direct charter controls remain usable.

## Scope and authority

ACT-32/M3 remains partial. This is a reusable charter policy, not an army order template, production sequence or persistent named group. The library belongs to this browser and origin and is excluded from campaign exports. Applied charters remain part of canonical saves and replay. Rules/save 31 and content `015468d1` remain unchanged. No rules, AI or campaign-price change requires a pacing rerun.

Storage is bounded to 24 templates and does not add turn/frame work or worker messages. Names are at most 40 characters. See [architecture](../../architecture/0041-charter-templates.md) and [work packet](../../updates/charter-templates-work-packet.md).

## Evidence boundaries

The mature browser realm is authored, with 40 owned hearths and 100 owned armies. The separate production journey starts a generated tiny campaign and uses ordinary controls. Neither establishes organic large-realm growth or combined M3 acceptance. Screenshots illustrate specific controls; all fifteen release gates remain open.

## Local verification

- `TMPDIR=node_modules/.cache/theandril-verification-tmp vitest run --maxWorkers=4`: **1,902 tests across 237 files pass**, 55.46 seconds; [full log](tests.log).
- **16 affected Chromium gameplay journeys pass**, 1.8 minutes: four new template cases and twelve existing charter, posting, recovery and registry cases; [log](browser-final.log), [browser review](browser-review.md). This was the first browser run; no browser failure was suppressed.
- **One built-production template journey passes**, 8.2 seconds; [log](production-templates.log). Ordinary founding in two generated Tiny/two-realm campaigns, browser reload, template recall, explicit assignment, manual save, narrow revocation and restoration run without development hooks. This is separate from the 16 development journeys.
- Whole-project typecheck and lint, content validation, existing art validation and the production `/Theandril/` build pass; separate logs are retained here.
- Seven new persistence tests cover strict records, reopen, concurrent capacity/name races, rollback after real writes, denied writes and future data preservation. Four new UI/lifetime tests cover pending writes across navigation and rejected/overlapping work. These overlap the full count above.

The authored browser journey retains the exact hash and worker-transfer total during template create, update, recall and delete. Its actual compressed campaign export has no template name or preference history. Applying forty Learning/32 charters publishes one ordinary group response and preserves queues, treasury and explored knowledge. Individual override, exact saved restoration and persistent template deletion also pass. No new frame/turn hot path or worker protocol was introduced; this is boundary evidence, not a new simulation-speed benchmark.

## Review and correction

[Independent storage review](integration-review.md) and [independent UI review](storage-and-ui-review.md) state authorship boundaries and checks. Review reproduced a failed initial IndexedDB open that stayed cached in Dexie when Retry reused its connection. Retry now retires that session and opens a fresh connection. The browser's real denied-once → restored access → Retry → successful template save verifies the correction. Permanent denial and malformed rows remain visible and leave ordinary Apply controls usable; the malformed row is preserved.

[Original screenshots and provenance](screenshots/provenance.json) retain the authored setup, runtime hashes and exact Playwright PNGs. The 318×724 controls capture is 81,322 bytes and shows keyboard Recall before Apply. It has no crop, resize or re-encoding after capture. Desktop and 390px viewport images are retained separately.

## Remaining limits

There is no template sync, standalone import/export, or live refresh of another tab's edits. Competing writes serialize; editing the same template in two tabs uses the last committed write. These are personal preferences, not new automation rules. The previous measured headline campaign remains Standard 234, Long 342 and Epic 379; Standard/Long remain above their approximate targets. No new pacing result is claimed.
