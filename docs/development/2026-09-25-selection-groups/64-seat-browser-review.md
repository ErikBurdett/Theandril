# DH-020: review of the production 64-seat verifier

Reviewed 26 September 2026. Scope: `scripts/verify-sixty-four-seat-save.ts`, its ordinary UI navigation helpers, relevant worker/persistence/chronicle boundaries, and retained browser results. The verifier was authored by a different agent. This reviewer authored the canonical 64-seat schema repair and the guarded tracker helper; this is an independent review of the browser verifier, not an independent review of that underlying schema repair. The parent runs browsers; this reviewer has not run an additional browser suite.

## Evidence chain inspected

- A fresh Chromium context visits the production journal and game. The observed ledger revision is recorded; an optional expected deployment revision must match. Production hook absence is checked at start and after every export. The browser interaction uses no generated fixture, direct worker commands, IndexedDB reads/writes, or game-state inspection.
- Ordinary setup controls request internal size `legendary`/gen8 (the player-facing label is **Huge**, 77,440 hexes), seed `20260926`, continents, Standard pace, player mode, 40 major realms and 24 city-states. That is the supported 64-seat composition available through these controls; this journey does not claim browser coverage of 64 major realms.
- The player selects the caravan through the paginated registry and founds `Sixty Four Hearth`. Each actual browser download must contain that hearth, 64 factions, 24 city-states, and precisely matching faction/research IDs. The downloaded archive must have complete coverage, a rules-32 origin with content `015468d1`, rules-32 records and an accepted command. Checking the original archive version prevents a rules-31 download migrated by today's parser from falsely passing as a rules-32 campaign.
- The three downloads follow ordinary Export, manual Save followed by a full page reload and Load, then another page reload and portable Import. The worker's Load path reads the manual campaign; success feedback occurs after save/load work. Exports are retained as real `.theandril` files and parsed by public persistence APIs. Public chronicle replay must reproduce each exact canonical serialization/hash; the latter two results must also reproduce the first archive's exact parsed JSON.
- The complete archive parser independently verifies its generated initial campaign. Canonical, compressed and archive digests are recorded separately. Compressed byte equality is not required: the initial and restored envelopes can encode equivalent archive objects differently. Canonical state and parsed archive equality remain strict.
- Failures set a nonzero exit status and `passed: false`; evidence records the failing stage and error. The live-only success marker is emitted only after the checks complete. Local-origin results cannot satisfy the tracker helper's live-origin requirement. Browser close failure also fails the result.

## Retained failures and diagnostic finding

The initial and diagnostic local runs are **failed overall**, despite all three state/export/replay comparisons completing. They are not counted as passing browser journeys. Their logs and result JSON are retained in this work packet; full duplicate failure captures were moved intact to the local cache by the parent.

The diagnostic JSON identifies one console error at `http://127.0.0.1:4176/favicon.ico`: HTTP 404, CDP resource type `Other`, initiator `other`, request `2347841.31`. The CDP network log and console location identify the same browser-owned root-icon request. Playwright's HTTP-response error list and browser-exception list are empty. This is direct diagnostic evidence, not an inference based solely on a generic “404” message.

Those failed runs nevertheless retain the narrow state observations: canonical hash `838191d9`, 911,896 canonical bytes, canonical SHA-256 `62d994fc20d975effd06e152b23c1be78c422e11e7769af3f1fe17a1e76e433d`, 64 matching faction/research IDs and exact replay/archive comparisons across the three downloads. These facts do not override their failed browser verdict.

## Final classification and successful local result

The final runner SHA-256 is `6a53bb99ca14c74250e92c84f58417df7d11023b5bad8173be69b27b41fd94e0`; it matches `local-64-seat/result.json`. The final classifier permits only the exact same-origin root `/favicon.ico` URL when it is not a declared application icon, the console text/location identify a 404, and CDP records agree on status 404, `Other` resource type, `other` initiator and matching network-log request ID/text. It retains the raw console/network/log diagnostics and records an explicit `browserIconWarnings` entry. Declared icons, other paths, uncorrelated errors and non-404 responses remain failures. The review request to reject unclassified CDP network/log errors was implemented alongside the existing browser-exception, console and HTTP assertions.

The parent-run [final local log](local-64-seat.log) and [result JSON](local-64-seat/result.json) report success at stage `complete`, three verified exports and 10,256.439 ms elapsed. `errors`, `unclassifiedNetworkErrors` and `unclassifiedBrowserLogErrors` are empty. The one correlated implicit root-icon 404 remains disclosed as a warning. This elapsed time is a single browser-verification duration, not a repeatable performance benchmark.

The reviewer independently read and decompressed all three retained downloads, verified their compressed SHA-256/lengths and canonical SHA-256, compared their actual canonical snapshot strings and parsed archives, checked the rules/content and matching 64-member faction/research registers, and independently calculated canonical UTF-16 FNV hash `838191d9`.

| Retained download | Compressed bytes | Compressed SHA-256 |
| --- | ---: | --- |
| [Before manual save](local-64-seat/before-manual-save.theandril) | 89,544 | `c06a9a351a8ed6b4f1120d3f22d67e6b5f0768fce80d8bed5d04f5b1c4131c45` |
| [After reload and manual load](local-64-seat/after-manual-load.theandril) | 89,541 | `5d7f43104290ca71664e912b5c31dfdd41e3b29b9b851ed85f5adb252fa8f7d1` |
| [After portable import](local-64-seat/after-portable-import.theandril) | 89,541 | `5d7f43104290ca71664e912b5c31dfdd41e3b29b9b851ed85f5adb252fa8f7d1` |

All three contain the same 911,896-byte canonical snapshot and SHA-256 `62d994fc20d975effd06e152b23c1be78c422e11e7769af3f1fe17a1e76e433d`. The parent-run public API checks also confirm exact replay and parsed-archive equality. The reviewer inspected the actual [setup screenshot](local-64-seat/sixty-four-seat-setup.png), which shows Huge/77,440 hexes, 40 major realms and 24 city-states, and the [restored screenshot](local-64-seat/sixty-four-seat-restored.png), which shows 64 realms, one hearth, turn 1 and “Campaign restored.” Both agree with the downloaded campaign evidence. No broader layout or accessibility acceptance is inferred.

**Verdict:** no blocker found in the reviewed verifier or its final local evidence. The failure classification is supported by retained diagnostics and does not relax game-state, archive, replay, application-error or unknown-error checks. The two earlier failed runs remain historical failures. The local ledger revision is merely the observed build-generated ledger entry; the separate deployment records and required expected revision bind the eventual live run to its actual publication.

This scenario covers one new 64-seat Chromium campaign at turn 1, with one founded hearth and complete command history. It does not establish mature-campaign durability, AI-turn performance, pacing, sustained memory, other browsers or any complete 1.0 release gate. DH-020 still requires the separate successful run against the actual live deployment.
