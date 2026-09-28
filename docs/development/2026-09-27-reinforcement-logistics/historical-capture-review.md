# Pre-change rules 33 capture and compatibility

The capture finished before any canonical changes, on source `8e371b3290aaabd9421ce679b76cc8a5ce28d770`, rules/save 33 and content `015468d1`. The script checked unchanged tracked simulation, content, chronicle, map-generation and fixture sources both before and after execution. Their original SHA256 values are in the immutable manifest.

- Script: `scripts/capture-reinforcement-logistics34.ts`; exact invocation is in the manifest.
- Evidence: [historical/manifest.json](historical/manifest.json), SHA256 `b5cc8c79df4bc59e453d7139901f5e895097524c510d9e30420ded18bd15c5bb`.
- Ten checkpoints retain exact original save and archive JSON in lossless gzip. Twenty raw and compressed file seals were independently rechecked after capture.
- Every checkpoint passed strict byte-identical save/load and full archive replay on the original implementation. All 27 accepted commands were independently repeated from a save reload under explicit rules 33; full result/event JSON and full save bytes matched. Seven continuation pairs retain per-command before/after state hashes and result hashes.

Generated complete histories cover a tiny two-realm campaign, saved army/hearth groups, founding and consumed-caravan pruning, wealth charter, hold posting, an enabled theater and three end turns. An explicitly authored `from-save` theater history covers eight guard armies, two hearths, active appended travel, a route paused by actual movement and merging, a hold override, enabled and disabled theaters, automatic dispatch, pause, resume, detach and later continuation. Its flat geography has no resource deposits and its funded treasury is setup, not earned campaign progress. The third history is a genuinely generated standard world with forty major realms and twenty-four city-states, including its exact first end turn; it makes no maturity or whole-campaign claim.

| Checkpoint | Rules 33 hash |
| --- | --- |
| generated-origin | `3adbefb8` |
| generated-delegated | `4ee83c68` |
| generated-continued | `f005f1c4` |
| theaters-origin | `2a4982fb` |
| theaters-ordered | `c03a7efa` |
| theaters-allocated | `aed72ccb` |
| theaters-paused | `51c98edf` |
| theaters-continued | `5c98f6ba` |
| sixty-four-origin | `2526e8f4` |
| sixty-four-continued | `79e7ee61` |

No captured bytes were regenerated after the rules change. The retained sandbox attempt failed at Node's Git subprocess before creating evidence. The first executable attempt stopped before writing save bytes because the harness compared parsed archive key order, which the schema normalizes. Replacing that check with strict structural equality retained the stronger full-save byte equality and untouched raw archive bytes. Both failed logs remain beside [historical-capture.log](historical-capture.log).

The version 34 integration uses strict frozen-33 schemas, validates original checksums before migration, adds independent empty supply registers and explicit zero/empty theater policy defaults, and rejects historical projections that would discard active policy, holds, supply records or consumed supply identifiers. Current imports reject missing policy fields, invalid holds and unknown fields. Historical command schemas reject all future commands/fields even when their proposed value is zero.

Final scoped verification: [compatibility-final.log](compatibility-final.log), **102 tests across seven files passed in 2.66 s**. This includes every captured load/replay/continuation, mixed 33/34 archives, database reopen and portable export, real offer acceptance with one exact payment, and existing historical migrations. Scoped lint and whole-tree typecheck passed, retained in `save-lint.log` and `save-typecheck-final.log`. The initial 95-pass/six-failure run exposed only the old synthetic v0–v3 test projection retaining the new empty supply register; the fixture now explicitly guards and omits that field. The intermediate 101-pass result and all failures remain retained. Broader feature, browser and release acceptance belong to the parent verification; these overlapping checks are not an additive release total.
