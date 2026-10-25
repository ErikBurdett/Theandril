# Independent factual and source review — dispatch 20

Reviewed the prepared journal article, current library/roadmap updates, media manifest, public provenance, authoring work packet and release expectations on 2026-10-25. The reviewed implementation pin is `670a18af843f95c80198a255e1894a708c5f1391`. This review used source inspection, pinned Git objects, existing logs, byte/hash comparisons and direct inspection of the two PNG files. No test suite, build or browser journey was run by this reviewer.

## Verdict and corrections

No remaining blocking factual or source-attribution issue identified in the reviewed publication changes.

Two current scope-card links initially lagged their revised claims: campaign integrity still linked the earlier patrol packet, while empire delegation linked the earlier settlement-filter packet. The parent corrected both links to pinned `docs/IMPLEMENTATION_STATUS.md`, which records all four rounds. The parent also removed “Independent” from the native-image-review evidence label: the pinned `image-review.json` records the parent's own inspection. This review independently viewed the same public pixels, but does not retroactively change that source's reviewer.

## Pinned claims

- All eleven article evidence paths exist as Git objects at the exact implementation pin, including both source captures, their image-review JSON, production scenarios and the canonical implementation status.
- Retained pinned suite logs support 2,372 tests / 288 files for intent validation; 2,384 / 289 for patrol assignment; 2,386 / 289 for publication recovery; and 2,394 / 290 in 63.05 seconds for the final implementation. The article's 2,394 count describes that implementation pin. A subsequent publication regression may produce 2,395 tests; this review does not claim that pending result or substitute it into historical implementation evidence.
- Pinned browser logs support seven patrol cases in 40.0 seconds, ten publication-recovery cases in 51.1 seconds, eight receipt-round cases in 51.0 seconds, and two overlapping capture reruns in 29.4 seconds. Intent evidence explicitly distinguishes its initial nine passes/one locator failure from the two-case corrected rerun, supporting ten distinct affected cases. Counts are correctly described as overlapping, not additive; durations are not presented as performance benchmarks.
- The patrol packet supports the authored 101-army workflow, 51 checks outside its filter, 50 preserved paused policies and exact 206-record restoration; the separate generated out-and-back journey is distinguished from authored scale evidence.
- Receipt evidence supports the disclosed 8,192-policy capacity fixture, 96 actual accepted updates, 32 canonical refusals, exactly 32 remaining checks, 128 recorded commands and separate thirty-hearth grant/revoke history of 60 records. Browsing is not counted as gameplay mutation or organic mature-empire acceptance.
- Stale-intent rejection and post-command publication uncertainty remain distinct. The article accurately describes preflight rejection without restoration versus recovery after publication failure, and explicitly avoids claims of rollback, new autosaves or naturally occurring transport-failure frequency.
- Retained corrections and the round-three `ERR_NETWORK_CHANGED` retry are disclosed without counting a failed page navigation as game acceptance. Rules/save 35 and content `015468d1` agree with the pinned status. No new rule, AI policy, pacing measurement or sustained performance claim is asserted.

## Images and history

The public manifest and copied provenance are byte-identical. All 22 historical asset records compare equal with the pinned original records; every historical public image's bytes are unchanged. The content catalogue changes only add the new import and entry; removing those additions yields the exact original `content.ts`, and no historical dispatch source files are changed.

Both new public PNGs exactly match their pinned source bytes and recorded SHA-256 hashes:

| Image | Dimensions | Bytes |
| --- | --- | ---: |
| `group-patrol-points` | 784 × 323 | 62,254 |
| `group-policy-receipt-rows` | 780 × 201 | 45,105 |

Direct image inspection agrees with the bounded captions: the first shows endpoint values 497/495 and closed owned-hearth shortcut selectors, not assignment completion; the second shows six visible refusal rows, Home guard 097–102, not the whole 25-row page or all 128 outcomes. No pixel transformation or larger visible scope is implied.

The two images add 107,359 bytes. Measured public inventory is 24 images and 3,627,983 bytes, leaving 42,033 bytes under the unchanged 3,670,016-byte cap. Historical asset bytes, source pins and captions are preserved.

## Release status and review limits

Source inventory agrees with the work packet and expectations: 23 stable roadmap items (6 completed, 13 in progress, 4 pending), 92 delivered editorial bullets and 49 remaining bullets. These are not feature percentages. All 15 release gates remain open (13 in progress and 2 pending); M3, R06 and DH-021 remain unresolved. No accepted gameplay scope is added or cut.

This review establishes source consistency and measured asset provenance. The parent's publication checks, rendered journal/image-dialog review, exact deployed readback and live journeys remain separate acceptance evidence. Publication is not a 1.0 signoff.
