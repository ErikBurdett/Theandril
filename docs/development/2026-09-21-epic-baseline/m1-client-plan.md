# M1a web and AI integration notes

Read-only reconnaissance during the frozen baseline experiment; no runtime changes or tests. This is an implementation handoff, not a second roadmap or completion claim. It supplements [the canonical M1 inspection](../2026-09-21-campaign-continuation/m1-inspection.md). Parent decisions supersede that document's older storage suggestion: **`GameState.clientage` is top-level; `Observation.diplomacy.clientage` is optional and appears under rules 18.** The command family remains `proposeClientage`, `respondClientage`, `endClientage` with the inspected payloads.

## Sim-to-client interface to freeze before parallel edits

Keep `ClientTerms` (`grantCoin`, `tributeCoin`, `durationTurns`), offer/contract IDs and party fields from the canonical inspection. Web/AI consume detached participant offers/contracts only. The modern observation must also provide:

- An incoming offer's canonical `acceptanceBlocker`; displayed terms identify patron, client, payer, recipient, grant, tribute and term.
- Known `protectedFactionIds`, including applicable patron/client/sibling protection, without exposing unknown factions or private third-party terms. This is the common war-protection input for AI and UI.
- Own recurring incoming/outgoing tribute and next due payment. Use the canonical aggregate, not a UI/AI calculation over hidden contracts. Recommended economy additions are `tributeIncoming` / `tributeOutgoing`, absent on historical observations; `economy.net` includes each flow once.
- Each own contract's next payment, expiry, missed-payment state and canonical ending consequences/blocker. UI labels release versus renunciation from the participant role; it does not determine penalties or create a separation truce.
- A bounded qualitative `ClientAssessment` (`band`, `reasons`, `objections`) and canonical proposal quote with `canPropose` / `blocker` and own payment/effect summaries. The preview must not publish hidden treasury, force totals or utility scores. Recommended sim exports: `previewClientage(state, proposerId, targetId, clientFactionId, terms)` and `evaluateClientOffer(recipientView, offer)`.

These additional exported/read-model names are proposed wiring names, not implemented interfaces. Terms bounds must come from the agreed canonical policy rather than separate browser constants.

The initial canonical decisions in [the save/integration plan](m1-save-plan.md#initial-decisions-resolving-integration-traps) are also **unimplemented design decisions**. Both peace and client proposals must honor the same pending-package conflict. Contact requires actual observed/remembered settlement or army contact, or prior pair diplomacy; an encountered faction listed only because of a public project is not automatically an eligible client-proposal target. The browser and AI must use the canonical proposal blocker rather than infer eligibility from `view.factions`.

For payment presentation and assessment, recipient overflow means zero transfer, one schedule advance, a cleared missed-payment streak, and no arrears. Show it separately from an insufficient-funds miss. The final scheduled attempt precedes expiry; a second insufficient-funds miss on that turn produces one default termination cause. Canonical separation preserves stronger peace or creates a valid five-turn zero-payment treaty. UI ending consequences and AI decisions consume these outcomes rather than calculating a different grace period, debt, default counter, or truce.

## Worker and UI wiring

The actual wire is [`apps/web/src/protocol.ts`](../../../apps/web/src/protocol.ts); no protocol package exists. Add discriminated messages alongside peace:

```ts
// Request: proposer is the worker's controlled faction, never a browser-supplied seat.
{ id: number; type: 'previewClientage'; targetFactionId: string;
  clientFactionId: string; terms: ClientTerms }
// Response: assessment/quote are canonical; hash identifies the evaluated state.
{ id: number; type: 'clientagePreview'; assessment: ClientAssessment;
  quote: ClientProposalQuote; hash: string }
```

[`simulation.worker.ts`](../../../apps/web/src/simulation.worker.ts#L172) already handles pure peace previews before command dispatch. Add the client preview there using `state.turnOwnerId`, publish `stateHash(state)`, and do not journal/autosave a review. Worker requests already run through the serialized Promise chain at the file's end. All three actual commands travel through the existing `{ type: 'command', command: GameCommand }` path, seat check and journal wrapper; no separate mutating worker RPC is needed.

Add **all three client commands** to the accepted-command autosave trigger at [`simulation.worker.ts:250`](../../../apps/web/src/simulation.worker.ts#L250), so pending offers, accepted grants/contracts and voluntary endings survive immediate reload. Tribute/default/expiry during ordinary end turn use the existing end-turn autosave. A preview changes neither journal nor autosave. Refused commands retain the existing journal's refusal-recording behavior and do not reach the accepted-command autosave trigger. Preserve the current error/message publication and save-failure reporting.

[`main.tsx`](../../../apps/web/src/main.tsx#L494) has request-ID promise routing for peace, but its `peacePreview` response carries no hash: the builder records only the hash present when it requested review. For client review use the stronger land/development pattern: pending `{id, target, clientFactionId, signature, hash, worker}`; require response hash = requested hash = current hash, matching request/worker/terms, and consume superseded errors before generic command handling. Reject pending reviews on reset, import/load/new/cancel-generation and worker failure. Reuse the existing reset epoch (`landEpoch` currently increments in `invalidateDetailQueries`) or expose a neutral campaign epoch; do not rely on a turn number because spending can change affordability within a turn. The `DevelopmentQuerySession` and its tests show render-time hiding, reversed replies and same-hash reload invalidation.

Extend [`FactionEncounters`](../../../apps/web/src/diplomacy.tsx#L63), used both by the diplomacy popup and Realm affairs (`main.tsx:672`, `:735`), rather than adding another registry. Recommended props: a typed `reviewClientage(...)` callback and campaign epoch alongside existing `stateHash` / `busy` / `issue`. When `diplomacy.clientage` is absent, retain historical peace-only behavior.

The client builder selects which participant becomes client, reviews the package, then sends the exact reviewed terms. Its signature includes target, role and all terms. Display the one-time grant, recurring payer/payee, first due turn, duration, bilateral protection, retained independent control, and ending consequences before sending. Review focus/scroll/error behavior can follow `PeaceBuilder`; sending stays disabled for busy/stale/unfundable reviews. Add incoming accept/reject and outgoing expiry cards, active agreement/payment cards, and a consequence review before Release/Renounce. Incoming blocked acceptance remains rejectable. Extend encountered-faction war-button blockers and diplomacy notification counts using the filtered canonical data. Keep keyboard labels and 390px layout in the existing affairs surface.

## AI decisions and recurring coin

[`planDiplomacy`](../../../packages/ai/src/diplomacy.ts#L11) runs before all economic/military planning; returning one decision prevents stale attacks after a treaty change. Preserve that structure. Handle incoming peace/client packages in deterministic age/ID order, then documented release/renunciation decisions, then bounded proposals to known eligible parties. Use the canonical recipient-view assessment, not hidden state. A successful client response/end must return immediately; the next planning pass gets fresh protection and finances. Existing peace fixtures with no client read model must retain their command order.

Extend [`protectedFactions`](../../../packages/ai/src/diplomacy.ts#L5) by unioning canonical known client protections with existing unexpired peace protections. Both land military planning (`index.ts`) and naval planning already use this helper, avoiding competing protection rules. Pending client packages must also prevent redundant peace/client proposals to the same pair.

For spending, obtain one mandatory `tributeReserve = min(treasury, own next-due outgoing obligation)` before the ordinary reserves. At [`index.ts:34–45`](../../../packages/ai/src/index.ts#L34), use treasury remaining after that reserve for expansion affordability, founding/expedition savings and scout reservation; pass tribute through progression protection. Subtract it **once** in the shared discretionary budget (`index.ts:96`). The same budget then reaches characters, naval orders, production, development, roads and land; `foundingBudget = budget + foundingReserve` must not add tribute back. `planDiplomacy` also precedes this budget and must retain the obligation when choosing peace payments or client grants. Do not count anticipated incoming tribute as currently spendable treasury.

**Fast-path trap:** [`planProgression:94`](../../../packages/ai/src/progression.ts#L94) starts a ready victory project against full `view.treasury` **before** `protectedCoin` is deducted at line 118. Adding tribute only to `protectedCoin` would fail. Introduce a distinct mandatory-coin guard on that ready-project check (e.g. an optional third argument defaulting to zero); retain the historical treatment of ordinary founding/naval reserves. Include mandatory coin once in the later protected budget. Test project cost exactly affordable before tribute but unaffordable after it, and cost-plus-tribute fully funded.

[`recurringBudget`](../../../packages/ai/src/index.ts#L105) already uses canonical `growth.economy.net - queuedUpkeep - 2`. Once net includes outgoing tribute, do not subtract outgoing tribute again here. Existing ongoing-upkeep filters then naturally reflect the obligation. Canonical economy fields are an observation/forecast, not permission to spend future receipts.

## Focused verification surfaces

| Surface | Concrete checks |
| --- | --- |
| `packages/ai/src/diplomacy.test.ts` plus client cases | Both role directions; accept useful funded package, reject unaffordable tribute, counterparty spending between offer and response; deterministic one-command replan; protected patron/client/sibling targets; documented independence decision. Drive accepted relationships through commands. |
| `progression.test.ts`, `naval-funding.test.ts`, `uncapped-expansion.test.ts`, `resource-economy.test.ts` | Next tribute remains after combined optional purchases, founding and ready-project attempt; fully funded purchases still occur; outgoing obligation affects upkeep once; no spending promised incoming coin; accepted end/default clears reserve from a fresh observation. Preserve old observations/fixtures. |
| `apps/web/src/worker-queries.test.ts` | Production worker preview is pure and hash-bound; queued spending → review returns current quote; forged seat/unknown target rejected; propose/accept/end journal and immediate autosave/export/load preserve full state and record order. Existing harness uses actual worker/SaveStore with structured-clone transport. |
| New small review-session tests, patterned on `use-development-query.test.ts` | Reversed replies, changed terms/role/target, same-turn spend, same-hash campaign reset, worker stop, stale error consumption and render-time removal of the old send action. |
| `tests/gameplay/diplomacy.spec.ts` | Real proposal/review/AI or human response; exact grant and first tribute; visible protected war blocker; release/renounce and independent control; autosave reload and export/import; stale review; keyboard and 390px/130% text. Use imported authored setup only for preparation, ordinary UI commands for the lifecycle. |

Rules-18 admission, top-level state migration, historical v17 replay, conservation/default/expiry and strict save validation remain the canonical/persistence owners' responsibilities. This handoff does not expand M1a into settlement transfer, client capture, inherited third-party wars or unification victory.
