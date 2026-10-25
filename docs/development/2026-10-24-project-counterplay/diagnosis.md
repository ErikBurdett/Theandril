# Immediate project interruption lost to peace

**Implementation follow-up:** The later multi-round probe also supersedes the initial exclusion of all paused projects: the implementation now preserves a qualifying existing own siege through peace decisions, as documented in the README.  the original fresh-pass integration proposal below is retained as diagnostic history and is superseded by the same-batch correction in [README.md](README.md). Watch/rival execution plans once per realm per round. Runtime now emits rejection plus one quoted siege together; a rejection alone permits the one-turn enemy project to win. The [actual batch comparison](reject-siege-batch-evidence.json) proves both branches and unchanged siege facts after rejection. The implemented policy reviews every valid incoming offer, including ones already rejected by ordinary valuation, and preserves ordinary valuation when no qualifying opportunity exists. See the README for focused production-source tests and remaining parent-owned acceptance.

Original diagnostic checkpoint, retained as history: 2026-10-24. A reproduced **authored regression**, not a new organic-campaign explanation. Runtime code, discovered tests, prices, historical execution and published catalogue are unchanged. All diagnostic scripts live outside test discovery in this directory; scoped ESLint passes. Core AI, diplomacy, simulation, combat and QA instructions were read.

## Demonstrated failure

Rules 35, Short pace, prepared infrastructure from the existing prosperity fixture, plus an explicitly authored adjacent guard. Infrastructure, initial budgets and guard position are authored; research, institution, project purchase, war declaration, war duration, project progress and all subsequent branch decisions use ordinary commands. Both initial and near-complete saves pass strict deserialization; journal replay reproduces setup exactly.

At turn 27, canonical hash `c705fc04`, Ashen Compact's Ledger Hearth project has progressed **4/5** through actual end turns. Reedbound's army `army.4` occupies neighboring hex 489, beside the host at 488, with movement 3, morale 75 and fatigue 0. The host is currently visible. The project owner spent 150 coin across the ordinary institution and project commands, reducing treasury 545→395; the project quote is 120 coin. Research also uses its ordinary knowledge cost. No progress or victory field is injected.

Current full AI plans:

- With no offer, Reedbound proposes a ten-turn white peace because the war has lasted twelve turns. Ashen's actual AI accepts. The next ordinary end turn completes Ashen's project and wins, hash `9d133f01`.
- With Ashen's ordinary ten-turn white-peace offer pending, Reedbound accepts, citing prolonged war and recovery time. A subsequent declaration is refused by the binding treaty until turn 37; siege is also refused. The next ordinary end turn completes Ashen's project and wins, hash `7507057e`.
- From the same saved input, ordinary `besiege` succeeds, immediately pauses the project at 4/5, and holds it there for two actual end turns with no victory, hash `3b043ea6`.
- Rejecting the incoming offer on a separate saved branch produces a fresh full AI plan containing ordinary development and the actual `besiege`; every command succeeds and the project pauses at 4/5, hash `77001de2`. This verifies that the existing tactical planner can execute the interruption in this fixture without suppressing its other orders.

Every branch records ordinary accepted/refused commands, matches a separately loaded mirror after each command, survives strict save/load boundaries and replays its journal exactly. See [probe-initial.json](probe-initial.json), [branch-evidence.json](branch-evidence.json), [setup commands](setup-commands.json), and [source/snapshot hashes](source-before.json).

The isolated [fail-before.ts](fail-before.ts) intentionally asserts rejection of this incoming offer and fails against the current source (`accept:true` versus `false`). Its [retained log](fail-before.log) is expected failing evidence outside discovered tests. It does not contaminate the prior publication suite.

## Meaningful negative controls

**Unavailable immediate force:** an actual legal `moveTo` spends the adjacent company's movement and changes its position. Canonical `besiege` then refuses. Current AI still accepts the ordinary incoming peace. The saved branch and exact blocker are retained in `branch-evidence.json`; a future guard must not reject peace by trusting the public project announcement alone.

**Faster own project:** a separately labeled authored six-town infrastructure fixture gives both realms genuinely eligible hosts. Both pay ordinary research, institution and project commands. Reedbound starts first; after actual turns its own project is 4/5 while Ashen's is 3/5. Reedbound still has a legal immediate siege of Ashen's host, proved on a saved copy. Accepting ordinary peace then wins for Reedbound on the next actual turn. Near-state hash `626f4259`, final hash `b57bbc69`; exact mirrors/save boundaries/journal replay pass. [Evidence](own-faster-evidence.json) and [script](verify-own-project.ts). This makes a strict sooner-own-project exemption a meaningful control, not a fabricated observation. Tied or paused own projects do not establish that exemption.

The earlier two-adjacent-enemy-towns hypothesis remains invalid under canonical settlement spacing and was not reused. Earlier organic readiness logs did not establish persistent funded-project starvation or a legally available project attack; this authored proof establishes a narrower actionable failure without reclassifying that earlier evidence.

## Public query gap and proposed contract

`getMovementPreview(view, armyId, host.cell)` correctly returns `action:'besiege'`, but `canMoveNow:false` and `canQueue:false`: travel cannot bypass the town. That is **not** a siege establishment legality quote. The observed actual command proves legality here, but runtime AI must not clone hidden state to probe commands or treat the movement action label as sufficient.

Proposed simulation-owned interface:

```ts
getBesiegePreview(view: Observation, armyId: string, settlementId: string): {
  armyId: string;
  settlementId: string;
  canBesiege: boolean;
  blocker: string | null;
}
```

Extract the existing establishment predicates into a shared pure helper, preserving command error order and canonical semantics. The observation adapter supplies only owned/observed army, currently visible town, war, land/embarkation, attack capability, adjacency, movement, observed town-siege and owned actor-siege facts. Global victory, pending capture and battle restrictions should match command-entry order. `view.sieges` and `visibleSiegeSettlementIds` cover siege occupancy without hidden information. Queries perform no path search. Do **not** add mission/exhaustion conditions to canonical siege legality just because the AI may conservatively exclude such actors; existing command semantics must remain unchanged. Parent owns the shared helper/query and parity tests.

## Proposed bounded AI slice

Use the canonical quote to protect an available interruption when an otherwise acceptable incoming peace or otherwise selected outgoing offer would cover an active enemy project's remaining completion interval. Conditions:

1. An active public enemy project has positive remaining turns no greater than the offered binding truce. Its host is currently observed; public host coordinates alone do not reveal terrain or armies.
2. An available owned land combat army is already adjacent. Preserve routes, postings, theater/patrol reservations, stationary missions, naval/carried actors and global pending decisions. Avoid taking an exhausted force or one plainly outmatched by the observed host garrison; retain existing tactical policy's observable strength criterion rather than inventing hidden defenders.
3. The canonical establishment preview accepts. No speculative movement, declaration or attack search is necessary.
4. No active own project finishes strictly sooner. The real faster-own-project control above proves why that exception matters; equal remaining turns remain contested.

Bound review to eight eligible project candidates and four establishment queries per diplomacy pass, with stable remaining-turn/ID order. Build observed actor/cell and host indexes once; inspect adjacent cells rather than multiplying projects by all armies. Share the query budget across the existing at-most-48 enemy peace candidates. Stop once the relevant legal opportunity is established. No pathfinding or full-world terrain scan is needed.

For incoming peace, submit one ordinary rejection and end that decision pass, preserving the existing fresh-observation rule. Before outgoing peace or optional ordinary work, prioritize one available immediate `besiege` against an active project within the ordinary ten-turn peace horizon. This review also runs while an offer cooldown suppresses new peace proposals, so rejecting an offer cannot leave the project unopposed through a repeated-rejection trap. The proved incoming branch already reaches actual siege on its next current full plan; the prepared integration gives that interruption explicit priority. Parent approved this bounded scope and the optional `siegeEstablishment:true` observation capability for rules 35 onward. Older observations retain original policy decisions, with no canonical version bump.

Initially restrict to **active** enemy projects and new immediate siege establishment. Existing paused projects/current sieges, distant operation planning, peace without a legally available interruption, and general project-aware treaty valuation remain explicitly outside this small slice. Do not change shared player-facing peace assessment or silently alter canonical peace semantics. Historical observations should retain unchanged decisions unless the new policy is explicitly gated by the agreed modern capability/rules boundary.

## Acceptance before claiming delivery

Promote the genuine-command regression only after prior publication completes. Test incoming rejection followed by fresh full-plan interruption; outgoing direct interruption; the unavailable-force and faster-own-project controls; paused/non-imminent/hidden hosts; orders and delegated/mission actors; current query refusal parity; shuffled observation stability and immutability; candidate/query bounds; and exact modern save/replay. Retain pre-change policy source and failure logs. Then run relevant diplomacy, conquest, progression, query and historical tests, production browser acceptance, representative planner measurement, and the unchanged headline campaign matrix. No price or proxy-bound tuning, no R06 or DH-021 completion claim from this fixture.

## Prepared source and harness, still outside production

[project-counterplay.draft.ts](project-counterplay.draft.ts) prepares the bounded observation-only policy with a typed query dependency. [verify-policy-draft.ts](verify-policy-draft.ts) prepares diplomatic integration and acceptance checks. Both remain in this packet; no application module imports them and no discovered tests were added.

Until the public query is implemented, the **test harness only** supplies a canonical command oracle on a separately deserialized fixed save. That is test verification of the prepared policy, not a proposed runtime implementation and not proof that the future public query matches canonical refusal semantics. The future production module must call the simulation-owned observation query; the parent owns its parity tests.

The [draft result](draft-policy-evidence.json) proves rejection followed by a fresh ordinary siege even though the existing diplomacy planner returns null during offer cooldown. The project remains paused after an actual end turn; all submitted commands match an independent mirror, save/load and journal replay. Outgoing review returns the ordinary siege. The real faster-own-project state retains acceptance without a siege query. Historical capability absence retains the old plan exactly. Thirteen labeled observation controls preserve spent/exhausted/agent/direct/posting/hidden/paused/non-imminent/binding/mission/theater/patrol boundaries. Synthetic 128-actor denial and 128-project cases establish four total quotes and eight considered projects, respectively; they are not loadable campaigns.

The [final draft harness log](draft-policy-final.log), [scoped typecheck](typecheck-draft.log) and [lint](lint-draft.log) pass. These are preparation evidence only. Canonical preview implementation, production integration, discovered regression coverage, browser acceptance, benchmark and headline pacing remain future work after publication clearance.
