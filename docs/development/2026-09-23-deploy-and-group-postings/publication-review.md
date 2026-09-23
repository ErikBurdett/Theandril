# Fleet provisions publication: factual review

**Verdict: no material factual correction required at the reviewed candidate.**
Reviewed on 2026-09-23 against implementation revision
`b623c2c91d4d852cba710f2d996c28a6b1b5d624`. This reviewer did not author the public
dispatch, roadmap edits, image selection or media records. The reviewer contributed
the earlier naval planner/benchmark and the separate group-posting worker slice;
this is an independent review of the publication's factual presentation, not a
new independent review of those algorithms. Only this document was written.

## Publication and source boundary

The fleet dispatch and current library/roadmap pin the actual implementation
checkpoint. Their 26 distinct source/evidence paths all exist at that revision.
The existing historical dispatch suffix remains byte-for-byte identical to the
previous publication content: older source pins and historical test failures are
not relabelled as current verification.

Seven directly checked retained evidence files match their pinned Git bytes:
the fleet evidence README, final headless and browser logs, final and rules30
pacing logs, benchmark JSON and persistence review. The evidence README's earlier
"no commit, push or deployment" statement describes its retained local-verification
checkpoint; the new dispatch correctly identifies the later committed source pin
and calls those files evidence retained before publication.

## Resolved factual checks

- The pinned final logs report **1,861 passing tests across 232 files** and **nine
  affected Chromium journeys**: three army, four naval, one postings and one
  supply. The dispatch calls these scoped checkpoint results, not a whole-browser
  certification or a count containing the later group-posting work.
- All seven final pacing cases reach Prosperity with zero refused orders. The
  Standard-map, twelve-realm, seed-20260905 results are **234 / 342 / 379** for
  Standard / Long / Epic, versus **223 / 367 / 388** under the documented rules30
  comparison. Epic satisfies its measured 350–400 band; the approximate 200/300
  Standard/Long targets remain open. Tiny proxies, prices and thresholds are not
  substituted for that headline.
- The generated Small/islands evidence reports **2,819 accepted commands**, zero
  refusals, **289 return steps**, **86 refills**, **six landings**, **two transported
  foundings**, and **2,477 mirrored commands**, ending at hash `afc149a5`. One fleet
  and one passenger army each incur one attrition turn and lose four strength.
  These costs remain visible in the article rather than being presented as
  perfect logistics.
- The reported Huge/Legendary medians round correctly from the retained JSON:
  supply **5.81 / 10.42 ms**, provision-aware naval planning **41.89 / 79.53 ms**,
  versus **33.77 / 63.04 ms** without that policy. The inputs are expressly authored
  complete-chart, single-realm workloads with 64/128 loaded fleets. The article
  does not turn these timings into sustained-memory, browser-frame or whole-scale
  acceptance.
- The public behavior description matches the pinned supply and turn-order
  contract: capacity eight, the final ration feeds both carrier and passengers,
  subsequent losses are bounded by the existing floor, supply resolves before
  queued travel, and regrouping conserves the shorter endurance. The source-linked
  independent code review supports the stated coastal-depth correction and its
  bounded-candidate limitation; this review did not re-review the author's AI code.
- **Old saves and current continuation are correctly distinguished.** The six
  original rules30 cases were independently decoded during this review. All retain
  their original SHA256 seals, version30 envelopes and no provisions field; their
  archive lengths are 0/4/0/4/16/17. The compatibility test preserves historical
  bytes through explicit version30 serialization and per-record replay. Its modern
  continuation deliberately serializes version31, leaves the old origin and record
  prefix unchanged, and materializes seven stores after the first current offshore
  end turn. The dispatch does not promise that ordinary current serialization keeps
  an old envelope version or that an old voyage remains infinitely supplied.
- The roadmap has the canonical **15 gates**, including F2, and **zero completed
  gates**. Foundational checkpoint completion is kept separate from whole-gate
  acceptance. Existing client/standing-order/supply portions are acknowledged while
  broader diplomacy, logistics, pacing, magic, multiplayer, browser certification
  and release proof remain open. No new percentage, scope cut or release acceptance
  is asserted.

## Images and provenance

I inspected all three public PNGs. The desktop image visibly shows a fleet with
2/8 stores. The 390px passenger image shows shared empty stores and the attrition
warning. The 390px replenished fleet image shows Charter Quay supply and 8/8 stores.
The supplied alt text and captions describe those visible states accurately and
explicitly identify their authored browser setup.

Each public file is byte-identical to its source image in the pinned Git tree.
PNG dimensions, byte sizes and both declared SHA256 values match:

| Image | Dimensions | Bytes | SHA256 |
| --- | --- | ---: | --- |
| Saved voyage | 1440×1000 | 887,581 | `a32c0745c070cad932f56cf7571cad5bd73691e0013f99eca8799ae68bc4138f` |
| Exhausted passengers | 390×844 | 204,391 | `2fc765abcdb8a6a507d7e3834722b2a0fe93e0a32db630bf9ae6608ad1606fbf` |
| Refilled fleet | 390×844 | 193,720 | `0f76fdf207fa30ba20f4b1397ad8ef7fff7c752e1ac175f8d46f779b831e6be4` |

All seven selected screenshot source hashes also match the pinned source files.
The bundled `media.json` and public `updates/provenance.json` are identical. This
verifies the exact source images, metadata and captions; responsive publication
layout and deployed readback remain separate browser/publication checks.

## Separate group-posting test question: empty cell deltas

The observed **39 cell-transfer bytes** are the exact empty-packet header, not
changed geography. `packCells([])` produces version1/count0, three zero-length
typed arrays and an empty dictionary. `cellTransferBytes` counts the UTF-8 JSON
header `{"version":1,"count":0,"dictionary":[]}`, which is 39 bytes even with no
cell rows. Its documented accounting excludes structured-clone framing.

The precise assertion is equality with `cellTransferBytes(packCells([]))`, plus
the existing invariant that the decoded cell delta is empty and the known
observation cells/fog remain unchanged. A zero-byte expectation is incorrect;
a loose upper bound would be weaker than the codec's actual invariant. This
finding requires no runtime or codec change. For any historical-rules fixture,
use its explicit historical serializer/archive mode rather than ordinary
`serializeGame`, which intentionally emits the current envelope.

## Reviewed publication hashes

| File | SHA256 |
| --- | --- |
| `apps/web/src/updates/content.ts` | `a5c6a20a74348c9cf41d2ecddf4a06fe037501e243ba3596a7de337a924fec3f` |
| `apps/web/src/updates/library.ts` | `7d3060903b2a6f8fa25eb7c3163ff867aebbd77519ce872a4fda22f225498033` |
| `apps/web/src/updates/media.json` | `b101e9b7565c195fbf4098611028d68beebd61b9d72389c2f2268b5c4ae5e84b` |
| `apps/web/public/updates/provenance.json` | `b101e9b7565c195fbf4098611028d68beebd61b9d72389c2f2268b5c4ae5e84b` |

The complete campaigns, test suite and publication browser journeys were not
rerun for this document review. This verdict is factual publication review at the
listed hashes, not deployment authorization or overall 1.0 acceptance.
