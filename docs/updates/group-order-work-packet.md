# Dispatch 20 — group orders and receipts

Prepared 25 October 2026. Implementation reviewed and deployed in four bounded
rounds; the combined journal publication has passed independent factual,
layout and local release checks. It is not a 1.0 signoff.

## Identity

- Title: Give the order, then review each result
- Slug: `group-orders-and-receipts`
- Final implementation pin: `670a18af843f95c80198a255e1894a708c5f1391`
- Rules/save: 35; content: `015468d1`.
- Existing ACT-32/M3 delegation; Gates E/I and related A/N boundary verification.
- No gameplay scope additions/cuts, AI/rules/price changes, pacing measurement or
  sustained performance claim. M3, R06, DH-021 and all fifteen gates remain open.

## Delivered behavior and evidence

1. Group posting/charter requests carry their reviewed campaign hash. Stale intent
   rejects before commands, saves or records; checks and form values remain for
   review. The retained old-worker reproduction uses real commands and controlled
   delivery ordering, not an asserted healthy UI race. Round 1 pin
   `6c77de456f3555f869af7e5d0aa43ae834d83ba6` has 2,372 tests / 288 files and
   ten distinct affected browser cases across runs.
2. Checked land armies receive shared patrol points and a war option through
   ordinary commands. Existing pauses survive, new policies start enabled and
   routes/postings retain priority. The authored 101-army journey preserves 50
   pauses and restores exactly 206 records; the separate generated journey
   travels out/back on turns 2/3. Round 2 pin
   `64b5d9ef1583d672944b1a5c0a836dae8f845ed5` has 2,384 tests / 289 files,
   seven affected cases in 40.0 seconds and its separate capture/live checks.
3. A worker publication failure after group policy commands began locks further
   commands/save/export until restoration. The injection throws inside the actual
   worker's final publication after two real mutations. It establishes recovery,
   not transport-failure frequency, rollback or a new autosave. Round 3 pin
   `47e130fc7c07a37eb8f3a1f3c46d963dc4a76e9c` has 2,386 tests / 289 files
   in 62.68 seconds and ten affected browser cases in 51.1 seconds.
4. Posting/charter receipts expose actual named outcomes, filters and 25-row pages.
   Browsing never retries commands or changes checked actors. The capacity fixture
   has 96 accepted / 32 refused policies, exactly 32 remaining checks and all
   128 journal records. A separate thirty-hearth grant/revoke case replays 60
   records. Final pin has 2,394 tests / 290 files in 63.05 seconds; eight affected
   browser cases pass in 51.0 seconds plus two overlapping image-capture reruns
   in 29.4 seconds. Typecheck, lint and the Pages production build pass.

These are overlapping round-specific scopes, not additive test totals. Retained
failures include labels/locators, invalid authored caravan IDs, one unused import,
and an old army-row assertion that counted the new war checkbox. Canonical
validation and actual refusal expectations remain intact. Round-three live
checks retain a network-change navigation failure before charter page load and
then two passing cases; exact workflow/public readback is separate evidence.

All article evidence paths resolve at the final implementation pin, including
its source image review. The final article links each round's README, the source
review and actual capture/spec paths. Publication metadata created afterward is
not misrepresented as existing in the implementation commit.

## Illustrations

Source approval and measured metadata:
`docs/development/2026-10-25-group-policy-results/image-review.json`.

- `group-patrol-points`: exact native 784×323 PNG, 62,254 bytes, 1440×1000 at
  100% text. It shows only shared endpoints 497/495 and hearth shortcuts. It omits
  selection counts, war/replacement consequences, submission and outcomes.
- `group-policy-receipt-rows`: exact native 780×201 PNG, 45,105 bytes, 1440×1000
  at 130% text. Home guard 097–102 are the first six visible refusals within the
  scrollable 25-row first Refused page. The authored capacity fixture yields
  96 accepted and 32 refused; the image does not show all outcomes.

The parent approved both source images and this author independently viewed the
same pixels. No post-capture transform was applied. Combined new bytes: 107,359;
24 public images total 3,627,983 bytes. The unchanged 3.5 MiB cap leaves 42,033
bytes. All 22 historical image records/pixels remain unchanged. Public displayed
layout review is still required separately.

## Publication handoff

The shipped content is prepared with the reviewed source pin; publication is
pending the authorized push, workflows and live readback. Current
library/roadmap descriptions now reference the final 2,394-test checkpoint; one
bounded delivery bullet makes 92 delivered and 49 remaining editorial bullets,
with 23 stable items (6 completed, 13 in progress, 4 pending) and 15 open gates.
These bullet counts are not feature percentages. Earlier dispatches retain their
original pins, claims and image records.

Run normal local content/media/journal checks and the Pages reader journeys,
including both images, keyboard enlargement/back navigation, search, permanent
links, 390px/130% text and current roadmap evidence. Root owns the publication
commit, workflows and live readback. `group-order-release-expectations.json`
supplies the exact structure consumed by `scripts/verify-pages.mjs`; it pins
11 evidence links, the two new images and unchanged roadmap acceptance states.
No tests/builds/commits were run by this publication integrator.

## Integrated local acceptance

Independent source review, 20 rendered captures and two native image inspections
find no blocking defect. Full publication suite passes 2,395 tests / 290 files;
all 66 local Pages cases pass in one 4.2-minute run. Typecheck, lint, content/art validation
and final Pages build pass. See `docs/development/2026-10-25-four-round-publication/README.md`
for exact logs, scope, retained corrections and public-readback follow-through.

## Published result

The reviewed journal is live at 1edc07f0bd45ce3d0677ced871809789f2905c2f. Both
workflows and exact public readback pass; all ten live journal cases pass in
27.8 seconds. The publication packet records these actual results separately
from the 670a18a implementation pin. All 15 release gates remain open.
