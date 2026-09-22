# M1a save and chronicle integration plan

Read-only preparation; no M1 runtime, schema, fixture, or test changes were made. Implementation waits for the baseline gate. This narrows the earlier [M1 inspection](../2026-09-21-campaign-continuation/m1-inspection.md) using the parent's later decisions: **required top-level `GameState.clientage: { offers, contracts }`**, unchanged historical `diplomacyStateSchema`, optional observation `diplomacy.clientage` only under rules 18, campaign/save version **18**, and unchanged content hash **`b79c78ed`**. Initial tuning belongs to simulation constants. The earlier suggestion to add canonical arrays inside diplomacy or change the content pack is superseded.

## Interfaces to freeze and extend

| Location | Concrete change when implementation begins |
| --- | --- |
| `packages/sim/src/clientage.ts` (new) | Strict `ClientTerms`, `ClientOffer`, `ClientContract`, and required `{ offers: [], contracts: [] }` state schemas; `createClientage` and separate shape/cross-reference validation. Use the three commands and role/terms fields below. |
| `types.ts`, `simulation.ts:createGame`, `save.ts:deserializeGame` | Add the required state member and initialize it for every in-memory game, including historical origins. Add the command union and detached optional observation type; no optional canonical state or shared default arrays. |
| `simulation.ts:commandSchemaForVersion` | Preserve today's command union as `version17CommandSchema`, used by **both 16 and 17**. The new current union extends it with client commands; all earlier branches stay unchanged. |
| `rules.ts`, `simulation.ts:createGame` | Add 18 to `RulesVersion` and the new-game option union; default to 18. Gate client lifecycle, war protection, economy effects, reconciliation, and observation fields on `rulesVersion(state) >= 18`. Reject explicit older-rule execution over nonempty clientage before mutation. |
| `save.ts` state/envelope definitions | Rename today's exact `stateSchema` to frozen `stateV17Schema`; define current state as its strict extension with `clientage`. Freeze `saveV17Schema` against that old state, and make `saveV16Schema` inherit that frozen envelope, **not** the new current schema. Define current envelope literal 18. Older aliases retain their existing state definitions. |
| `diplomacy.ts` | Keep the canonical peace schemas and `DiplomacyState` intact. Add only a modern read-model field and version-gated cross-system hooks; do not make historical aliases inherit client records. Prosperity and battle schemas remain unchanged for M1a. |

Command contracts from the inspection:

```ts
{ type: 'proposeClientage', factionId, targetFactionId, clientFactionId, terms }
{ type: 'respondClientage', factionId, offerId, accept }
{ type: 'endClientage', factionId, contractId }
// terms: { grantCoin, tributeCoin, durationTurns }
```

Offers retain proposer/recipient and explicit patron/client IDs, creation/expiry, and detached terms. Contracts retain patron/client, start/expiry, next due turn, consecutive misses, and terms. Do not conflate the proposal recipient with the client. Select stable entity prefixes before capturing new expectations: `client_offer.N` and `client.N` fit the save module's lowercase identifier convention; the earlier illustrative `clientOffer.N` would not. Validate unique IDs, sorted order, numeric suffixes below `nextId`, distinct existing parties, one patron per client, no nested/cyclic hierarchy, pair-offer conflicts, and schedule consistency. Schema acceptance alone does not prove any of those cross-references.

## Initial decisions resolving integration traps

These decisions were selected after challenging the plan against the current runtime. They are **not implemented behavior or verified balance** and supersede ambiguous wording in the earlier inspection.

- **Shared pending packages:** under rules 18, both `proposePeace` and `proposeClientage` check the same pending peace/client package conflicts. Updating only the new command would let the existing peace path create a conflicting package on a later turn and produce a state rejected by the new save validator. Preserve the historical peace path under older rules.
- **Blocked tribute and expiry:** an attempt blocked by recipient treasury overflow transfers zero coin, advances the due turn once, clears the consecutive missed-payment streak, and creates no arrears. The final scheduled attempt occurs before expiry. A second consecutive insufficient-funds miss terminates for default even when expiry falls on that same turn; emit one termination cause, not both default and expiry. Save validation, observations, and replay must agree on these transitions.
- **Separation truce:** preserve an existing stronger peace; otherwise create a valid five-turn treaty with zero payments. Remove a weaker treaty only after the replacement is fully validated, so termination cannot leave a partially changed diplomatic state. Existing `respondPeace` requires an active war and is not this helper. Do not merely edit `expiresTurn`: existing validation requires `expiresTurn === startedTurn + terms.truceTurns`, terms within the 5–30-turn range, valid relation/ID references, and one treaty per pair.
- **Actual contact:** proposal eligibility requires actual observed or remembered faction settlement/army contact, or prior pair diplomacy. A public project announcement or roster identity alone does not qualify. `Observation.factions` includes announced project owners, so testing membership in that array is insufficient. Use one canonical contact predicate for proposal/acceptance validation and preview; do not create contact from a hidden client tree.

Add boundary regressions for peace-after-client proposal, overflow followed by a payable turn, second-miss-on-expiry, valid weaker-truce replacement, and an otherwise unknown public project owner. These close concrete integration gaps; they do not extend M1a into new treaty families or victory rules.

## Migration and exact hash projection

1. Add a fixed pre-client hash constant (`b79c78ed`) even though it currently equals `CONTENT_HASH`. Parse version 17 with `saveV17Schema`, verify that recognized hash and **the original parsed-state checksum**, then append empty clientage, parse the current state, and compute the new checksum. Never recompute a checksum first and thereby bless corrupt input. Require clientage on actual version-18 input; do not use a schema default that silently repairs missing modern fields.
2. Retain the existing version-16 envelope-only transition to 17, then run the same 17→18 migration. The existing `migrateV15` currently calls today's `stateSchema` and directly returns version 17: change that intermediate parse to frozen `stateV17Schema`, then route its result through the new final migration. Every older chain must reach that same endpoint. Preserve `originalVersion` from the imported bytes for the existing rule-16 versus rule-17 defending-contingent validation and other historical checks.
3. Add the parsed clientage projection in a fixed position in current `canonicalPayload`, preferably appended after the existing fields. In `serializeGameForVersion`, return the full payload only for 18. For every older target, require empty clientage, remove exactly that field, then use the original 16/17 envelope or older projection chain. Preserve all old property order, inner checksum bytes, and outer hash. `stateHashForVersion` keeps the current streamed fast path for 18 and the exact historical serializer fallback for earlier versions.
4. Wire `data.clientage` into reconstructed `GameState` and run `validateClientage` after factions, settlements, wars, diplomacy, and IDs are available. Validation must reject resealed malformed contracts rather than expire, pay, sort, repair, or otherwise mutate them during load. The existing `withRules(... <16 ?15:16)` land/index compatibility calls are unrelated to clientage and must not accidentally gate its validator.
5. Migration changes only representation: no new events, ID allocation, payment, relationship memory, treasury, visibility, or ownership. Historical replay initializes empty clientage but omits it from old save/hash projections. Ordinary loading then permits current rules-18 continuation; `withRules` still selects explicit old record behavior.

## Chronicle, persistence, and command boundaries

| Location | Required admission/integration |
| --- | --- |
| `packages/chronicle/src/index.ts` | Add 18 to `ArchiveRulesVersion`, `hashVersion`, and `recordSchema` using the unchanged current battle-report schema. Keep archive format **2**. `snapshotVersion`, new origins, records/checkpoints, and technical headers then admit/use 18 through their existing paths. No tactical rules-version bump is needed. |
| `packages/chronicle/src/journal.ts` | Types follow the archive union; retain monotonic record-version checks and original prefix ownership. Test resuming a 17 archive, preparing a commit before any new command, then appending 18 commands/checkpoints without rewriting the origin or prior seals. |
| `packages/persistence/src/campaign-storage.ts` | Add 18 to the explicit header version union. Keep manifest formats, blob digests, chunk/fragment formats, and Dexie store version unchanged. Verify old-origin/new-suffix transactions and reload, including rejected commands and mid-offer snapshots. |
| `packages/persistence/src/index.ts` | Existing portable campaign formats 1/2 and snapshot/archive checksum boundaries remain. Import old snapshot-only saves into a current from-save origin as today; preserve an actual old archive's original origin when present. |
| `simulation.ts` command postprocessing | Acceptance and ending use the existing peace-style siege/mission/project reconciliation before the accepted-command snapshot. Due transfers run in the diplomacy phase after economy/upkeep and before progression, with stable ID order and a final due payment before expiry. Reconcile loss of the last settlement after capture/raze. Historical branches emit no client effects. |
| `apps/web/src/simulation.worker.ts` | Add the new durable diplomatic command boundaries to autosave, including proposal/refusal if offers are expected to survive immediate reload. Preview request/response remains in the actual `apps/web/src/protocol.ts`; it is not a new protocol package. |

`applyRecordedCommand` already detaches the submitted command/results and records arbitrary validated domain event types. New events should be factual participant notifications, with no invented history or private third-party terms. Chronicle victory/Prosperity prose remains unchanged in M1a. Mixed records must reject a later downgrade from 18 to 17, while genuine 17 records still reject the three new commands. Clientage does not introduce another victory path in this slice.

## Compatibility evidence and focused tests

Use the [already captured fixture](../2026-09-21-campaign-continuation/m1-fixture/README.md) unchanged. Its producer refuses save versions other than 17; do not rerun it after upgrade. It has three genuinely founded settlements, a paid seven-coin peace, another pending eleven-coin request, and an independent continuing war. Original seals are `ff9222e9` (initial), `9d49a22c` (turn 2), and `c63f8cd7` (turn 11). Pending save SHA-256 is `210b47baaa9cd7ea42decf481f42e0a12ba469c66cb787fd696b4b96e5d702e8`; original archive SHA-256 is `b9c7724460671bc52aba884b0dbfddb579835a423994fd871e471a20ea781861`.

Minimum additional verification:

- New sim/chronicle compatibility tests load that fixture, assert empty migrated clientage and unchanged old fields, compare `serializeGameForVersion(...,17)` byte-for-byte, and replay all original commands/expiry events to the exact old seals. Separately append real rules-18 client commands, save mid-offer/mid-contract, resume, pay, end/default/expire, and compare archive replay with the live result. Keep the old prefix exact.
- Reject wrong historical content hash, original checksum corruption, new fields injected into a resealed old save, missing required modern clientage, unknown nested fields, duplicate/unsorted IDs, forged references/cycles/hierarchies, conflicting peace/client offers, impossible dates/counters, and any nonempty-clientage downgrade. Payment tests conserve total coin and prove refusal/overflow/default causes no partial mutation.
- Extend `journal.test.ts`, `campaign-storage.test.ts`, `campaign-storage-durability.test.ts`, and `current-origin.test.ts` for version-18 headers, old-origin/new-suffix reload, and command-boundary durability. Keep persistence formats and corruption rejection intact.
- Run existing save/diplomacy, envelope-hash, pending-assault, historical chronicle compatibility, and persistence suites. The unchanged full campaign/contact/pacing gates remain required after the feature changes.

**Captured-test pitfall:** `observation-publication-equivalence.test.ts` already reads captured observations under explicit historical `withRules`, but some seal assertions still call current `stateHash`. Those assertions must target the captured save version after 18 exists, preserving the original expected seals. The new `naval-publication-equivalence.test.ts` also needs explicit rules-17 observation construction for its old observation hashes. Do not overwrite the captured JSON to accommodate the new optional field. Add separate modern observation/detachment cases. Similarly, authored legacy saves in `save.test.ts` must intentionally omit the new top-level field when constructing older formats; genuine fixture bytes stay untouched.

No runtime edits, fixture regeneration, benchmarks, or tests were performed for this plan.
