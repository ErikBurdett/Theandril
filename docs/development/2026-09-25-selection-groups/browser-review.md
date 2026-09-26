# Saved selection groups: browser and screenshot review

Review date: 25 September 2026. Source: uncommitted rules32 candidate after
`6cb7692c800464d3c5ad66b42df6cf063ffeb0ca`; exact reviewed source hashes are in
[screenshot provenance](screenshots/provenance.json).

**Verdict: the affected development-browser journeys, separate built-production
journey and retained gameplay images pass.** This
reviewer authored the new browser tests and inspected the captures. The parent
executed the browser runs; this is author verification and visual inspection,
not an independent rerun or cross-browser certification.

## Final browser scope

[The final run](browser-final.log) passes **20 journeys in 2.6 minutes** with one
Chromium worker. It includes four new selection-group journeys and sixteen
existing charter, posting, preference-template, registry and damaged-response
journeys. This is an affected suite, not the complete gameplay suite.

The four new journeys verify:

- In an authored Legendary realm, save a hundred-army selection, replace it with
  three members selected across pages and search, rename it, and recall it over a
  different current selection. Choosing a dropdown row does not recall or issue
  orders. Recall preserves the canonical hash and worker-transfer total. Explicit
  Post selected armies then applies three ordinary postings. A saved forty-hearth
  group separately recalls and applies Wealth/24 charters while preserving paid
  queues, treasury and explored knowledge. Deleting the saved hearth group leaves
  those charters intact.
- Through ordinary controls after importing a generated tiny start, founding a
  hearth removes its consumed caravan from the saved army group. Both group kinds
  survive manual save/reload and actual compressed campaign export. The decoded
  export retains the exact hash, canonical groups and recorded group commands.
  Deletion persists through another save/load, a new seed-77 campaign starts with
  no groups, and importing the original downloaded file restores the exact prior
  groups and hash.
- In the existing authored naval scenario, a real embark action retains the
  carried army's saved membership. Recall skips that member and reports one
  embarked army without changing the campaign hash, worker-transfer total or
  saved group. Explicit Update can replace the group with an empty membership;
  it does not disembark the army or issue a posting.
- The real worker first applies a saved-group command; interception then replaces
  only its returned `observation.selectionGroups` with `null`. The resulting
  error ends pending work, reports uncertainty and disables saved-group edits,
  postings and End turn. Loading the actual manual save restores the exact
  original hash and unlocks controls, after which the saved-group command succeeds.
  The browser reports no unhandled page error.

All player operations above use ordinary controls. Development APIs provide
readback only; deterministic fixtures supply starting scenarios. No browser
script substitutes a successful gameplay response or directly mutates a player
action's canonical result.

## Retained unsuccessful attempts

[The first run](browser-initial.log) passed **13 of 14** journeys. Its isolation
test inspected the old turn-one campaign while a new campaign was still being
generated. The first correction waited for the button named Begin campaign to
disappear, but the implementation renames that same button to Shaping the world
during generation. [The second run](browser-second.log) therefore passed **19 of
20** with the same premature state read.

The final test waits for the worker's exact completed-generation feedback and an
enabled End turn control, then polls the requested seed 77 before asserting the
new group library is empty. The production helper uses the same visible feedback
and enabled-control boundary. The empty-group assertion and all canonical
checks remain intact. No UI or runtime behavior changed to repair this test
barrier, and no timeout was relaxed. The earlier logs and failures remain
retained; their pass counts are not added to the final result.

## Exact screenshot review

All three final PNGs were opened and inspected before copying. Their retained
copies and [capture metadata](screenshots/selection-group-capture.json) were
compared byte for byte with the final run's artifacts. No image was resized,
re-encoded or edited after capture.

| Image | Dimensions | Bytes | SHA256 |
| --- | --- | ---: | --- |
| [Desktop](screenshots/selection-groups-desktop.png) | 1440 × 1000 | 498,923 | `7f4f86a49eab77f7ab7b768d0e4ea3d78e4e8383275bcb0c96efeff4c720dc62` |
| [Narrow](screenshots/selection-groups-narrow.png) | 390 × 844 | 129,869 | `270ff5fd33bfcf4bff953fdb007f6f864285b7af4c7451a43933b8b41832232b` |
| [Compact selector and Recall](screenshots/selection-groups-recall.png) | 318 × 121 | 15,348 | `28236174d7b432ccf6ed1188b9529fe9a5f41d8b45ca61a7c59358a58f42e2ec` |

The fixture is Legendary, generator 4, seed 20260905: forty owned hearths, one
hundred owned armies and 4,000 total armies. Ownership, population and the mature
realm are authored; the fixture buys its territory through canonical commands
and this test queues one paid granary before import. The illustrated Watch
company has three members after replacement and recall, with no postings yet.
These images do not depict organic large-realm growth.

The desktop capture shows the full saved-group explanation, membership, name and
editing controls. The narrow capture shows a readable label and dropdown, a
44-pixel Recall button with visible keyboard focus, and the wrapped recall result
and replacement explanation. The registry scrolls vertically; its current scroll
position leaves earlier controls above the viewport and later controls below it.
There is no observed overlap in the saved-group controls, and the journey asserts
no page-wide horizontal overflow. Keyboard focus/Enter recalls the selection
before the separate posting action. This is scoped keyboard and narrow-screen
evidence, not full accessibility acceptance.

The compact PNG is a direct `page.screenshot({ clip })` with
**`{ x: 36, y: 373, width: 318, height: 121 }`** at a 390 × 844 viewport and device
scale factor 1. The clip is the outward-rounded union of the actual saved-group
label/select and Recall button bounds. It intentionally excludes the count,
status text and any outer focus-ring pixels beyond those bounds. The full narrow
image retains that context. Capture-time clipping is explicit; there was no
later image transformation.

The compact candidate fits the remaining **26,954-byte** public-media allowance.
Adding its exact 15,348 bytes would produce **3,134,122 bytes**, leaving **11,606
bytes** under the unchanged 3 MiB budget. This review does not publish the image
or assert that a later journal layout has been inspected.

## Separate production check

[The production log](production-groups.log) records **one passing journey in
7.8 seconds**, with an individual test duration of 7.0 seconds. The parent ran
[`tests/production/selection-groups.spec.ts`](../../../tests/production/selection-groups.spec.ts)
against the actual `/Theandril/` build. This result remains separate from the
twenty development journeys; their counts are not added together.

The test begins a generated Tiny/two-realm seed-20260905 campaign with zero
city-states. It saves a two-army group, founds Group Hearth using the ordinary
caravan controls, saves a hearth group, explicitly applies a Wealth/24 charter,
recalls the surviving army member and explicitly posts it. Manual save/reload
retains both group libraries. A genuinely new generated seed-77 campaign has
neither group. Importing the original downloaded campaign restores Home hearths;
keyboard Recall at 390 pixels selects its hearth without issuing a charter.
Deleting that saved group leaves the existing Wealth/24 charter intact, and
loading the actual manual save restores the group. The journey asserts that
development hooks are absent and reports no unhandled page error. No authored
scenario mutation or fake worker response is used by this production test.

The additional [production narrow capture](screenshots/production-selection-group-restored-narrow.png)
is **390 × 844**, **145,221 bytes**, SHA256
`3ce487b0393a8d5fe57e3a3b702e7d3b698258775cb9a142ac9e69ddfe950cfd`.
The reviewer opened these exact pixels: Home hearths is selected, the Recall
button has visible keyboard focus, and the result states one hearth selected,
zero skipped and existing orders unchanged. The campaign-save/export explanation
and controls wrap inside the panel without overlap. The lower name field
continues below the viewport through the registry's ordinary vertical scrolling.
This capture occurs after portable import and before the group's deletion;
it is not the later manual-load result. Its retained copy is byte-identical to
the original, without resizing or re-encoding.

## Raw artifact organization

After all runs finished, the complete `browser-output`, `browser-second-output`,
`browser-final-output` and `production-groups-output` directories were moved
without deletion into `node_modules/.cache/theandril-selection-groups/`, retaining
each original directory name. Earlier failure screenshots and `trace.zip` files
remain in the first two cached run directories under
`selection-groups-campaign--1292a--leak-into-another-campaign/`. The unsuccessful
run logs remain tracked in this evidence directory.

Only the four reviewed new images, original capture JSON and provenance are
retained under `screenshots/`; unrelated earlier-feature images were not copied.
Provenance preserves each original `capturedOutputPath` and records its current
`localRawArchivePath`. All five retained image/metadata files were re-compared
with their archived raw originals and recorded SHA256 values after the move.

ACT-32/M3 and all fifteen whole release gates remain open.
