# M1 client-state and unification reconnaissance — 2026-09-21

Read-only source/design inspection while M0 timing work continues. These are
implementation recommendations, not implemented rules, reviewed balance or M1
completion. No product source or canonical status was changed and no tests ran.

## Recommended first playable cut

Implement **M1a: negotiated client contracts** first: a player or AI can propose,
accept, pay and inspect a finite client relationship, keep independent control of
their realm, refuse terms, and leave or default with visible consequences. Include
the ordinary UI, AI, saves and replay in that cut. Then implement **M1b:
contestable unification** using those real relationships and conquest outcomes.
M1a alone must not be described as completed M1, client capture, lawful settlement
transfer, or a second victory. Those remain explicit M1 follow-ups.

## Actual contracts and integration traps

| Current source | Observed contract / consequence |
| --- | --- |
| `packages/sim/src/diplomacy.ts` | Only strict `PeaceTerms`, offers, treaties and pair memories exist. Payments occur atomically on acceptance; peace offers expire after three turns. `advanceDiplomacy` processes expiry after the global turn advances. |
| `packages/sim/src/simulation.ts` | Owns command schemas, dispatch, turn phases and observations. `commandSchemaForVersion` currently returns the current schema for every version >=16: freeze a v17 command schema before adding commands. |
| `packages/sim/src/warfare.ts` | `declareWarObjection` supplies treaty protection. Actual declarations also require current visible contact. Existing peace can remove war; command postprocessing reconciles sieges, missions and projects. New diplomatic changes must enter those same reconciliation hooks. |
| `packages/sim/src/save.ts` | Save 17; older state schemas inherit today's `diplomacyStateSchema` and Prosperity schemas. Do not expand those aliases in place without freezing old shapes. `serializeGameForVersion` currently sends the full payload for every version >=16. It needs an explicit pre-client projection. |
| `packages/sim/src/rules.ts` | Historical execution uses `withRules` and defaults to 17. A new canonical system needs a rules version, old-command rejection and a no-new-effects branch during historical execution. |
| `packages/sim/src/progression.ts` | Victory is the literal `prosperity`; one fixed project definition, settlement host and required infrastructure are assumed throughout validation. New victory is more than another UI label. |
| `packages/sim/src/growth-economy.ts` | AI's current economy read model has income/upkeep/net/queuedUpkeep; recurring tribute must be represented so optional spending and founding reserves do not ignore it. |
| `packages/ai/src/diplomacy.ts` | At most one diplomatic decision per planning pass; returning immediately prevents stale attack plans after peace. `protectedFactions` currently sees peace treaties only. Preserve that immediate-replan pattern. |
| `apps/web/src/protocol.ts` | Actual worker wire lives here; there is no `packages/protocol` directory yet. `previewPeace`/`peacePreview` are the useful pattern. Do not create a new protocol package merely for this slice. |
| `apps/web/src/main.tsx`, `diplomacy.tsx` | Existing request-ID promise routing and terms/state-hash-bound peace review. Extend that pattern, including stale review rejection, incoming/outgoing offers and blocked reasons. |
| `apps/web/src/simulation.worker.ts` | Preview runs in worker; commands use shared sim/chronicle. `respondPeace` is in the autosave list. Client acceptance/termination must receive the same durability treatment. |
| `packages/chronicle/src/index.ts`, `packages/persistence/src/campaign-storage.ts` | Hard-coded save/rules/hash version unions end at17. Chronicle record schemas select commands and battle schemas per version. Advance these without changing archive format2 unnecessarily. Chronicle closing prose currently always says Prosperity. |
| `apps/web/src/progression.tsx`, `main.tsx` | Project tab, public race and final banner are Prosperity-specific. M1b must render a discriminated victory and its actual cause. |
| `packages/sim/src/siege.ts`, `territory.ts` | Capture choices are persisted quotes, not just buttons. Existing eligible liberation already works. Any later client/transfer option must preserve quoted rule versions, population/queue consequences, sight, ownership, land/worker updates and immediate project reconciliation. |

## M1a proposed canonical interfaces

Keep peace records and their legacy shape intact. Add new arrays to the modern
diplomacy shape; do not introduce a generic all-purpose treaty engine yet.

```ts
interface ClientTerms {
  grantCoin: number;       // patron -> client, once on acceptance
  tributeCoin: number;     // client -> patron, each due turn
  durationTurns: number;
}
interface ClientOffer {
  id: string;              // clientOffer.N, from the shared nextId
  proposerId: string;
  recipientId: string;
  patronId: string;        // either proposer or recipient
  clientId: string;        // the other participant
  createdTurn: number;
  expiresTurn: number;
  terms: ClientTerms;
}
interface ClientContract {
  id: string;              // client.N
  patronId: string;
  clientId: string;
  startedTurn: number;
  expiresTurn: number;
  nextTributeTurn: number;
  consecutiveMissedPayments: number;
  terms: ClientTerms;
}
type ClientCommand =
  | { type: 'proposeClientage'; factionId: string;
      targetFactionId: string; clientFactionId: string; terms: ClientTerms }
  | { type: 'respondClientage'; factionId: string; offerId: string;
      accept: boolean }
  | { type: 'endClientage'; factionId: string; contractId: string };
```

`clientFactionId` must be one of the two proposal participants; the other becomes
patron. This supports both an offer of protection and a request for protection
without another command family. Use strict Zod shapes and safe integer arithmetic.
Start with data-defined bounds: grant 0–1,000,000 coin, tribute 1–100 coin/turn,
duration 10–50 turns, offer lifetime three turns. These are suggested bounded
initial tuning values, not a claim of balanced campaign pacing.

Concrete rules for the first implementation:

1. Both parties must exist, be distinct, have met, and control at least one
   settlement at acceptance. Meet/contact comes from the simulation's existing
   permitted knowledge, not arbitrary faction IDs supplied by a client. Both
   propose and accept must reject invalid parties before mutation.
2. One patron per client; a patron may have multiple clients. For the first cut,
   disallow nested client hierarchies: a patron cannot itself be a client and a
   proposed client cannot already have clients. Validate cycles separately on
   save input, including longer forged cycles. Bound contracts by faction count.
3. Permit one pending peace-or-client package per pair and one proposal per pair
   per turn, reusing pair memory. Reject superseding offers or changed obligations
   at acceptance; the UI may reject/repropose ordinary terms, without a new
   renegotiation command. Offer expiry/refusal transfers no money.
4. Acceptance rechecks the whole package and any new conflict, then transfers the
   exact grant once, creates the contract, ends a bilateral war and removes stale
   pair offers. Never clip overflowing payments, escrow fictitious funds or pay
   from the recipient's hidden treasury via a UI calculation. Preserve any
   existing bilateral peace term; no automatic third-party war is inherited.
5. The contract guarantees bilateral non-aggression and recurring tribute; it
   does not transfer armies, settlements, command authority or sight. Parties
   remain separate factions. Clients of the same patron cannot declare on one
   another; reject acceptance if it would place an already-warring pair into that
   protected group. Full allied access and defense/joint-war guarantees remain M4.
6. First tribute is due `startedTurn + 1`. Process due payments in stable contract
   ID order in the existing diplomacy phase, after all realms' economy/upkeep and
   before victory progress. At `expiresTurn`, collect the last scheduled tribute
   **before** expiry; thus duration D means exactly D scheduled payments. Remove
   the contract that turn, with no automatic renewal or resumed war.
7. An unaffordable payment transfers nothing, emits participant-only missed-payment
   events and increments the saved counter; a successful payment clears it.
   Two consecutive misses terminate the relationship with broken-promise memory,
   no invented debt and no automatic declaration. A treasury overflow is a
   separately explained blocked transfer, not a client default. No partial coin
   creation/destruction. Any such unresolved financial edge blocks victory credit.
8. Patron `endClientage` releases the client without payment. Client `endClientage`
   renounces it with an explicit trust/grievance consequence; do not lock a bankrupt
   player behind an unaffordable exit fee. Neither action declares war. Preserve
   an existing stronger peace; otherwise create a short, visible separation truce
   using the existing peace machinery and deterministic memory/event updates.
9. Reconcile loss of the last settlement after capture/raze: end contracts involving
   a landless participant and emit the factual cause. Do not delete surviving
   armies/fleets or claim that landless equals eliminated. Succession/legitimacy
   and rebellion do not exist yet and remain M5 integration work.

Keep all rejection checks above mutations, as the current peace implementation
does. Offer acceptance/ending/default must immediately update war protection,
sieges/missions and later unification progress before the accepted-command save.
One pass over bounded diplomatic records is enough; no world-cell scan is needed.

## Observation, AI and UI ownership

Add a modern optional `diplomacy.clientage` read model so historical observations
can remain byte-compatible where needed. Include detached participant offers and
contracts, role, next payment, exact own obligation, qualitative blocked reason,
and legal ending consequences. Counterpart private treasury/income and unobserved
armies must never be copied into it. `acceptanceBlocker` can disclose only whether
the package is currently fundable, as existing peace does.

Publish allegiance identity only for already-known parties; keep private terms
participant-only. Supply `protectedFactionIds` for known factions or derive it
from this filtered relationship view so UI and AI agree with war protection.
Update `knownFactions` only from actual participant contact, never from a hidden
client tree. A proposal preview should return `{ band, reasons, objections }` and
canonical quoted effects/costs, with no utility score or hidden force totals.

Suggested ownership:

- **Sim owner:** new `clientage.ts` for strict schemas/validation/rules; integrations
  in `diplomacy.ts`, `types.ts`, `simulation.ts`, `warfare.ts`, growth observation,
  `save.ts`, `rules.ts`, exports. Preserve the complete state authority here.
- **AI owner after interface agreement:** `packages/ai/src/diplomacy.ts` and
  financial consumers. Assess a whole package from the recipient's observation:
  known pressure, trust/grievances, grant, affordable recurring tribute and
  independence cost. Propose, accept/refuse, release or renounce through commands;
  respond first and return immediately so other planners obtain fresh observations.
  Reserve next due tribute before optional appointments and victory saving.
- **Web owner:** add typed client-preview request/response in `protocol.ts`, worker
  handling and autosave hooks, promise routing in `main.tsx`, builder and active
  agreement/ending controls in `diplomacy.tsx`. Use the existing modal, pending
  state and state-hash invalidation patterns. Show who pays, how much, when, how
  long and how independence can be regained before sending or accepting.
- **Persistence/chronicle owner:** version admission and historical compatibility,
  factual new domain events, command-boundary journal/save tests. No database schema
  migration is presumed merely because the serialized game version changes.

Reflect tribute in the canonical economy quote and AI budget explicitly. Do not
add it twice to both net income and upkeep: use named `tributeIncoming` /
`tributeOutgoing` aggregates and one net formula, retaining old fields/defaults
under older rules. An anticipated incoming tribute is not guaranteed available
cash for same-pass commands.

## Save and replay work that must land with M1a

Use the next available campaign/save version (18 if M0 does not consume it).
Before editing, retain an actual version17 save with pending peace, active treaty,
captured command records and hashes. Freeze the old diplomacy/state/victory shapes
and the version17 command union; update new-game defaults and `RulesVersion` only
after those frozen definitions exist.

Migration accepts only the recognized pre-client content hash and validated old
payload, then initializes empty client arrays. Do not generate new historical
events or alter old treasuries. Add a historical projection that removes only
empty new state; reject downgrading a campaign with active/new client state rather
than silently dropping it. Older commands must reject client commands, and older
end-turn execution must not process new treaty effects. Continue the established
mixed-version journal semantics: historical records keep their original rules and
hash versions, followed by modern records after the upgrade.

Audit all explicit version lists: sim schema dispatch, new-game options,
`serializeGameForVersion`/`stateHashForVersion`, archive `hashVersion` and
`recordSchema`, and persistence manifest/version schemas. Preserve archive format2
if only supported record versions change. A content-defined contract policy changes
the content hash; retain the pre-client hash constant rather than accepting any
current pack as historical content.

## M1b proposed unification contract

Use an explicit new victory variant and a bounded claim store, not a fake Prosperity
project. Suggested interface:

```ts
interface UnificationClaim {
  id: string; factionId: string; hostSettlementId: string;
  declaredTurn: number; consecutiveTurns: number; requiredTurns: number;
  status: 'active' | 'contested' | 'cancelled' | 'completed';
  blocker: string | null;
}
type UnificationCommand =
  | { type: 'claimUnification'; factionId: string; settlementId: string }
  | { type: 'cancelUnification'; factionId: string; claimId: string };
// Preserve the old Prosperity member unchanged in the new union.
type NewVictory = ExistingProsperityVictory |
  { path: 'unification'; factionId: string; claimId: string;
    settlementId: string; turn: number };
```

Recommended first rule to prototype: an independent patron and its currently
paying direct clients must represent at least two thirds of **active major realms**
and hold at least two thirds of all surviving settlements, for consecutive contest
turns, while the claimant's chosen host remains owned, free of occupation and siege.
An active major realm has at least one settlement or surviving army/fleet; an
embarked army does not count twice. A sole surviving independent realm can qualify
through conquest without inventing a client. A one-faction sandbox must not win
automatically on its first founding action. Require a deliberate public declaration
and a paid administrative commitment quoted by the canonical command.

This combines political submission and actual territorial control, preventing a
few wealthy settlements or mass founding alone from being a second Prosperity.
All settlements belong to one faction, so aggregation is O(factions + settlements
+ armies + contracts), not O(cells × realms). Compute shared aggregates once per
turn/reconciliation and profile them before making stronger scale claims.

Loss of either threshold, any counted client default, or host siege/occupation
resets the consecutive contest counter and explains the interruption. Host loss
cancels the claim. Renunciation must remove its credit immediately, not after one
more victory tick. Simultaneous victories need an explicit documented stable tie
order shared with Prosperity; do not let package call order decide accidentally.

Choose contest duration and administrative cost from data by campaign pace, then
test meaningful counterplay before freezing balance. The two-thirds thresholds
above are a concrete candidate, not yet approved balance. Display owned/client
contributions and a public declared-claim progress counter. A global claim can
deliberately publish aggregate eligibility, but never expose unseen settlement
locations, opposing treasury, private treaty terms or exact armies. Write that
disclosure contract into the architecture decision before implementing the view.

The new result must reach the UI banner, project/race surface, complete technical
record and history closing text. Old Prosperity fixture prose and seals remain
unchanged. A human win and an opponent preventing the win are required, alongside
AI pursuit/resistance. Two paths still leave Gate B's third-path requirement open.

Client capture and permitted settlement transfer remain another bounded M1 slice:
extend persisted capture quotes with their own version boundary and recipient
eligibility, then call the existing sight/land/character/road/project reconciliation.
Do not retrofit arbitrary capture eligibility into the client-proposal command.

## Minimum vertical-slice verification

1. **Canonical client lifecycle:** ordinary commands propose both role directions,
   accept/refuse, transfer exactly once, pay due tribute, save mid-offer/mid-term,
   expire after exactly D payments, voluntarily end and default. Property checks
   conserve total coin for transfers and reject malformed/overflow/self/cycle/
   duplicate/changed-budget inputs with no partial mutation.
2. **Boundary cases:** active war/siege ends correctly; existing third wars persist;
   siblings cannot be put at war; no subject hierarchy; lost last settlement
   releases relationships while surviving entities retain identity. Private terms,
   counters and detached observations do not leak to an unrelated faction.
3. **AI parity:** a pressure/grant case is accepted, unaffordable tribute rejected,
   recurring reserve survives optional purchases, one command triggers fresh
   planning, and a client chooses independence under a documented bad contract.
   Use actual observed commands, not direct treaty insertion as the passing path.
4. **Compatibility/durability:** pre-change version17 archive replay exact;
   migration plus new command continuation; modern acceptance/default/termination
   save roundtrips; resealed invalid cycles/timing rejected; old command versions
   reject new operations. Browser autosave/export/import retains the agreement.
5. **Browser:** extend `tests/gameplay/diplomacy.spec.ts` with actual proposal,
   review, receipt, payment, independence and reload controls, desktop plus
   390px/130% text and keyboard. Test stale review/hash handling and pending states.
6. **M1b when built:** counted client/conquest contributions; threshold lost then
   reset; default/renunciation immediately interrupts; host siege/loss; simultaneous
   path finish; human and AI unification; saved claim and full factual archive
   replay. Keep existing Prosperity tests and unchanged contact/pacing gates.

Run typecheck/lint, affected sim/AI/chronicle/persistence tests, content validation,
browser journeys and the full suite/build at the integration boundary. For treaty
work, measure a 48-faction contract graph before adding larger global loops. M0's
existing Epic timing acceptance remains separate and must not be hidden by these
new scenarios.
