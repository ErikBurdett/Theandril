# Independent roadmap review

**Verdict: scoped approval for the local roadmap changes. No blocking findings.**

Reviewed the working-tree versions of `docs/1.0-DEVELOPMENT.md` and `apps/web/src/updates/library.ts` against `GAME_1_0_SCOPE.md` and `DEFINITION_OF_DONE.md`. This review covers sequencing, scope, status and publication boundaries. It does not approve gameplay implementation, integrated test results, deployment or any release gate.

Review base: `f07024fe23ad3386874656d48fbbc33a5380d979`. Reviewed SHA-256 values:

| Source | SHA-256 |
| --- | --- |
| `docs/1.0-DEVELOPMENT.md` | `39f07d6cad23c4dbdf24ab74cff5d9d930a6938a17eb37215cac70733cfab915` |
| `apps/web/src/updates/library.ts` | `9c6bbd4cace35e25de87c794423627d81dc1bc509dfc3e124af54db263d8c7ce` |
| `GAME_1_0_SCOPE.md` | `0d952354975350a05cb79ea134443433b610439648eac0325e41fdf4144210f1` |
| `DEFINITION_OF_DONE.md` | `9302b8ab8fe6f462aad96048433f348bd41bffd21ec6828460edde93a43560a2` |

## Dependency review

- M0 retains both AI findings, all four observed timeout cases, existing assertions/budgets, deterministic continuation and independent review. It does not declare the ongoing integration baseline green.
- M1 follows the command/save foundation and makes client obligations, conquest eligibility, resistance and contestable unification one playable slice. Succession and legitimacy integration is explicitly assigned to M5, avoiding an unresolved forward dependency in M1 acceptance.
- M2 extends existing caster support independently after command ownership is agreed. It separates research, individual capability, site control and counterplay; full magical breadth remains M7.
- M3 can deliver policies and coordinated orders using the existing command architecture, then consume relationships and alerts as they arrive. Its named governor policies do not require completion of the later character/politics system.
- M4–M6 proceed from political relationships and delegated orders into logistics, independent actors, internal politics, then epochs/crises. Existing foundations can support the initial slices without declaring those later systems complete.
- M7 builds on magical discovery and the intervening campaign consequences. M8 content batches run alongside stable consumers instead of waiting for all systems to finish.
- M9 may begin once command/observation contracts are versioned, with complete coverage following the integrated systems. M10 consolidates certification; the document explicitly requires testing and measurement throughout earlier work.

## Scope and status review

The first four priorities match the requested plan: AI stabilization, client-state unification, a complete magical discovery loop, and empire delegation. The later packages cover supply/trade and military depth, independent powers, politics/agents, epochs/crises, broader progression and victories, authored content/art/exploration, multiplayer, durable archives, sustained giant scale, accessibility, browser coverage and release hygiene.

Detailed feature and numeric obligations remain in the authoritative scope rather than being replaced by these milestone summaries. In particular, the plan retains the full progression/content targets, 24 major factions, 48 independent/template actors, 2–8 humans, 100+ army management, Huge 100+ turn proof, Legendary stress, all intended human-playable victories, and the fifteen existing DoD gates. Arcane mastery selects an implementation direction for an already-required distinct victory path; it does not introduce another release gate or exempt the other intended paths.

A read-only comparison against `HEAD` confirmed:

- All **23** catalogue item IDs, stages and statuses are unchanged.
- The same **six** bounded foundation items remain completed.
- All **15** release gate IDs/statuses are unchanged and every gate remains open.
- All **28** literal evidence paths referenced by the catalogue exist locally.

The catalogue distinguishes the historical source snapshot from the proposed remaining plan. No new implementation claim is pointed at uncommitted evidence. The local document and catalogue consistently reserve actual delivery/verification for implementation status and future acceptance; there are no invented completion percentages, completion dates, reduced thresholds or silently excluded systems.

## Publication and review limits

The changes are local documentation and catalogue source. They add no publication operation, public service deployment or background job. The document expressly retains separate authorization for publication and for operating an online service. Its future dispatches remain drafts until the existing review/publication contract is met.

As already required by the roadmap, eventual authorized publication must reconcile source/evidence snapshots at the reviewed committed revision. This local approval does not certify that future published state.

Only source reads, a small static comparison and hashes were used for this review. No expensive tests or benchmarks ran during the parent's full-suite window. The reviewer did not author or change the roadmap/catalogue; the only new review artifact is this file.
