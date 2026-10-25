# Siege establishment quote boundary

Implementation follow-up: the helper/query and modern observation capabilities are now integrated in `packages/sim`; the original draft and unapplied patch below remain preparation history. The promoted query suite passes the 18-case canonical parity matrix and exact pre-refactor historical command seals. [README.md](README.md) and [source-implementation.json](source-implementation.json) identify the current implementation checkpoint. Incoming AI now uses a coherent reject-plus-siege batch, replacing the superseded two-pass draft; worker decision cadence is unchanged.

The design below was prepared after parent scope approval, before production files changed. [siege-establishment.draft.ts](siege-establishment.draft.ts) and the retained [simulation integration patch](sim-integration.patch) record that proposed interface; [query-parity-evidence.json](query-parity-evidence.json) records its pre-integration human-command comparison.

## One legality helper

The pure `siegeEstablishmentBlocker` accepts detached state/observation facts. It preserves the existing `besiegeSettlement` refusal order: own army; land/ashore; visible target; war; attack-capable composition; adjacency; remaining movement; no existing siege at the town; actor not already maintaining another siege. It introduces no fatigue, morale, mission, supply or commander restrictions. Those remain AI utility/reservation guards where already appropriate, rather than new canonical command requirements.

The command adapter computes the same facts from canonical state and invokes the helper before the unchanged siege mutation/events. The query adapter invokes it from permitted observations only. The query returns army ID, settlement ID, `canBesiege`, and the existing blocker string. A WeakMap per detached observation shares primitive army/town/war/siege/visibility indexes among bounded queries. No route search or hidden state access occurs. Fresh observations are required after commands; a legal old quote cannot authorize a later stale command.

The last actor-already-sieging guard remains defensive. Two legally spaced towns cannot both be adjacent to one army, and a repeat against the same town hits the earlier town-already-sieged guard. Its precedence test therefore uses pure helper facts rather than an invalid canonical two-town fixture.

## Generic global blockers without private battle objects

Current observations intentionally hide unrelated battle and pending-capture objects. Command execution nevertheless blocks all strategic commands during either. Exact query parity therefore requires a generic neutral blocker alongside `siegeEstablishment:true`, both present only for rules 35 onward:

- `strategicCommandBlocker: 'This campaign has ended in victory.'`
- otherwise `'Resolve the settlement capture before issuing strategic commands.'`
- otherwise `'Resolve the pending battle before issuing strategic commands.'`
- otherwise `null`.

That order matches the existing command dispatcher for siege. The new field reveals no faction, actor, location, combat outcome or capture choice. Private `battle`, `battleScene` and `pendingCapture` objects remain masked for uninvolved observers. The parent approved this narrow observation capability, without a broader UI phase redesign or canonical save field.

Older observations omit both fields and keep old AI decisions. The query can still describe their permitted local facts, but cannot promise knowledge of unrelated hidden global activity without the capability. The modern AI policy requires `siegeEstablishment:true`. No campaign/save version bump, canonical schema change or historical command change is proposed.

## Prepared parity and historical evidence

[verify-query-draft.ts](verify-query-draft.ts) compares the draft quote with current actual ordinary commands across **18 cases**. Each canonical source passes strict save validation; accepted and refused command boundaries also round-trip. Cases cover legal project interruption, identity/error precedence, missing and hidden towns, peace, founder composition, distance, spent movement, high fatigue without a new command restriction, duplicate siege with movement-order precedence, naval and embarked actors, victory, private third-party siege presence, and uninvolved battle/capture masking with generic refusal. The draft capability/global-blocker adapter is explicit test preparation, not a claimed shipped observation change.

The initial 17-case run is retained separately; the final 18-case log is [query-parity-final.log](query-parity-final.log). Four [historical command seals](historical-command-seals.json) capture actual pre-refactor execution under rules 16, 19, 34 and 35, including exact initial/final save bytes and results. These are authored ordinary-command seals captured now, not claimed ancient organic archives. After promotion, rerun those exact inputs through their original versions and compare bytes/results, alongside existing siege, diplomacy, pending-assault and genuine historical archive tests. Do not regenerate the seals from changed runtime code.

The policy harness currently uses a fixed-save canonical command oracle as a test dependency. Promotion must replace it with the actual public observation query and exercise both query and ordinary command acceptance. Current draft typecheck/lint pass; production integration and full acceptance remain pending publication clearance.
