# Saved realm groups — 25 September 2026

Implemented and locally verified checkpoint. Publication and live verification
are separate; all fifteen release gates remain open.

## Player outcome

Each realm can keep up to 24 named army/hearth selections combined, with up to
128 members per group. Create, rename, replace membership or delete a group in
the registry. Choosing its name does not select members or give orders. Recall
replaces only that tab's checks with eligible members; applying postings or
charters remains explicit. Updating warns that unchecked members are removed.

Groups belong to the campaign and follow its saves, replay and exports. They are
separate from personal browser-local charter templates. Army groups contain land
armies; embarked members remain saved but are skipped when recalled for postings.
Permanent loss, ownership transfer, founding and merging away an army prune its
membership. Empty groups remain available for refill or deletion. Splits and
merge recipients are not enrolled automatically. Loss events name the affected
group and remaining member count.

## Authority, compatibility and boundedness

Rules/save 32 adds canonical groups and their own ID counter. Organizational
edits do not allocate gameplay entity IDs, spend resources or issue orders.
Only detached own groups enter a faction observation. Commands are atomic and
ordinary journal entries. Content remains `015468d1`; AI policies and prices
are unchanged. [Architecture](../../architecture/0042-selection-groups.md).

Four genuine rules-31 checkpoints were captured at
`6cb7692c800464d3c5ad66b42df6cf063ffeb0ca` before changing canonical code. Their
exact bytes and replay seals cover generated starts, founding, charters,
postings and finite-supply naval travel. Historical schemas remain frozen;
old saves gain fresh empty registers. Populated groups or a used group counter
cannot be silently exported or executed under older rules. Mixed history and
compressed campaign export/import retain the old prefix and modern groups.

Reconciliation scans bounded memberships only after commands that can remove or
transfer entities, including battle completion. It does not run on ordinary
movement, observations or refusals. The [benchmark](benchmark.json) saturates 48/64 realms with 147,456/196,608
membership references. Retained/loss reconciliation costs about 3.2/3.3 ms on
Huge and 4.2/4.2 ms on Legendary; own groups add about 36.5 KB to observation JSON.
Fifteen samples follow three warmups, with strict saved roundtrip. See
[performance scope and limits](../../PERFORMANCE.md); this is not a full-turn,
worker, renderer or organic mature-realm measurement.

## Review corrections and retained failures

- Migration review found new group arrays shared between older save loads by a
  static defaults object. The migration now allocates fresh arrays. Independent
  rules 23/25/26/27/31 loads remain isolated.
- Independent review found a malformed group response could be reported as
  successful before React failed rendering it. A bounded response check now runs
  before presentation or request completion. Worker recording/publication errors
  and main-thread presentation failures end pending work and require restoration.
- The first browser run passed 13/14 journeys. Its new-campaign isolation check
  read the previous Turn 1 while generation was still pending. An intermediate wait for the Begin button to disappear also ran too early:
  that button changes its name during generation. The test now waits for terminal
  new-campaign feedback and enabled End turn, then polls the new seed;
  the empty-group assertion remains unchanged. [Original run](browser-initial.log), [intermediate 19/20 run](browser-second.log).
- The first benchmark used generator 4, whose realm limit cannot represent the
  intended 64-realm fixture. It now uses current generator 8. The second attempt
  exposed a real existing defect: current campaigns could create 64 realms, but
  the arcane-research save register still allowed only 48. Rules 32 now accepts
  64; rules 31 and earlier retain their strict historical schema and cannot
  export an unrepresentable campaign. Both 64 major realms and 40 major realms
  plus 24 city-states roundtrip; [the original regression](64-seat-save-initial.log)
  and [35 focused passing tests](64-seat-save-final.log) retain the result. The 65-seat/row boundary is rejected. This repairs
  the existing supported campaign limit; it adds no new gameplay scope.
  [First attempt](benchmark-initial.log), [second attempt](benchmark-second.log).
- An initial interface typecheck caught a mismatched constant export during
  parallel integration; the consumer now uses its authoritative name. The later
  typecheck passes. [Original diagnostic](interface-typecheck-initial.log).

[Independent integration review](integration-review.md) distinguishes the
reviewer's UI authorship from independently reviewed canonical and worker code.

## Local verification

**20 affected Chromium journeys pass**, 2.6 minutes, including the four new group
journeys and sixteen existing charter, posting, template, registry and recovery
scenarios. [Final browser log](browser-final.log), [visual review](browser-review.md),
[exact screenshots and provenance](screenshots/provenance.json). Recall leaves the
canonical hash and worker-transfer total unchanged; explicit group orders preserve
queues, treasury and explored knowledge, and ordinary individual overrides remain
covered by their existing journeys. The authored large-realm fixture is distinct
from the generated-start save/export/import journey.

Whole-project typecheck and lint, content/art validation and the Pages-subpath
production build pass. The existing large JavaScript chunk warning remains visible
in [the build log](build.log); no new bundle-performance signoff is claimed.

**1,941 tests across 243 files pass**, 59.19 seconds, with four local workers.
This includes the 64-realm save repair and all historical compatibility, worker,
property and proxy campaign tests. [Final full log](tests.log). The earlier
1,938/242 pass precedes the save repair and remains in [its original log](tests-initial.log).

**One separate built-production journey passes**, 7.8 seconds, using ordinary
controls in generated Tiny/two-realm campaigns without development hooks. It
checks both group kinds, founding/pruning, explicit orders, manual save, reload,
compressed export/import, isolation and narrow keyboard recall. Deleting a group
leaves the active charter unchanged. [Production log](production-groups.log).

These scopes overlap and are not added into a single test total. No failed
assertion or timeout was weakened. Publication checks are recorded separately.

ACT-32/M3 remains partial. Theaters, patrol/escort roles, army-order templates,
production sequences, broader governors, combined mature-realm acceptance,
cross-browser proof and final release signoff remain open. No campaign-resolution rule or AI policy changes: the separate counter and
projected gameplay-state equivalence preserve organizational independence, and
AI reads neither these groups nor their events. No new pacing run is claimed.
The earlier headline remains Standard 234, Long 342 and Epic 379; Standard/Long
remain above approximate targets. Full-suite proxy campaigns are separate
regressions, not replacement headline pacing evidence.

## Publication candidate verification — 26 September

[Publication tests](publication-tests.log): **1,943 / 243 files**, 55.54s.
Final date-only correction: [24 focused checks](publication-final-date-tests.log),
208ms; the [first sandbox attempt](publication-final-date-sandbox.log) could not
spawn Git. Assertions were retained. [Final typecheck](publication-final-typecheck.log),
[lint](publication-lint.log) and [Pages build](publication-build.log) pass.
[Local production Pages](publication-pages.log): **31/31**, 54.5s. These overlapping
publication scopes do not replace or add to the pinned implementation results.

[Independent publication review](publication-review.md) passes factual, image
provenance and final displayed-layout checks. Exact relevant screenshots and
the actual capture invocation are retained in [publication-screenshots](publication-screenshots/provenance.json).
The full raw output remains in the ignored local verification cache; retained
pixels are unchanged. Existing large-chunk build warnings remain visible.

Publication and live verification are recorded after the authorized deployment.

## Separate DH-020 production save check

The retained `scripts/verify-sixty-four-seat-save.ts` creates a genuine
Legendary/gen8 campaign through the setup UI: seed 20260926, forty major realms
and twenty-four city-states. It founds one hearth, exports, manually saves,
reloads and loads, then reimports the actual portable download. Public persistence
and chronicle APIs compare exact canonical bytes, history and replay for all
three exports, including all 64 faction-owned arcane research rows. It does not
read browser storage or expose simulation hooks. This is first-turn storage
proof, not an organic mature-campaign, AI, memory, pacing or rendering benchmark.

The initial run and diagnostic rerun completed all three state comparisons but
failed their aggregate console assertion. Their retained
[initial result](local-64-seat-initial-result.json) and
[diagnostic result](local-64-seat-diagnostic-result.json) identify Chromium’s
automatic same-origin `/favicon.ico`404, with CDP resource type `Other` and
initiator `other`. No game request or browser exception failed. The final runner
records only this correlated browser icon request as an explicit warning;
other console, HTTP and CDP errors remain failures. The raw failed captures and
downloads remain intact under `node_modules/.cache/theandril-selection-groups/`
with their original run names. Both original logs are retained alongside this
report; neither failed run is counted as passing. The final [local run](local-64-seat.log) passes in 10.26 seconds with three
verified exports; [result](local-64-seat/local-64-seat.json), actual downloads and
screenshots are retained. Exact canonical state remains 911,896 bytes with hash
`838191d9`. This runtime was already built before the verifier was introduced;
only the test runner changed. Live verification follows publication.
