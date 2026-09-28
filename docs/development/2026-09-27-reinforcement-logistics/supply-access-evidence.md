# Paid supply-access implementation evidence

Authored by the canonical supply/AI implementation agent. This note covers its owned simulation module, shared authored fixture, focused tests and AI policy. Parent integration, browser journeys, full-repository verification, final performance measurements and campaign pacing have separate evidence. This is not a release acceptance or publication claim.

## Delivered boundary

Rules/save34 add source-specific bilateral supply requests and agreements, with an independent identifier counter. A buyer requests a currently visible foreign hearth at peace. The source name, hex and harbor capability are disclosed once and retained. Requests expire after3turns; terms run5–30turns. A buyer can have8pending requests and8active imports. The integer fee is paid only on acceptance; either party can end service without a refund. War, source ownership loss and expiry lapse service. Acceptance rechecks both purses, source eligibility and caps before mutating anything.

The public AI valuation is2coin per contracted turn, matching the existing depot upkeep as a transparent pricing choice. It is not calibrated against campaign pacing. Human providers may accept a different legal fee. Service grants neither passage nor alliance and never orders movement. Existing supply range, roads, terrain, hostile occupancy and siege rules still apply. A disclosed harbor supplies fleets and their passengers; a later hidden harbor upgrade does not silently upgrade a land-only contract.

Actual own-army supply uses current canonical eligibility and blockers. Imported map coverage instead forecasts frozen contractual facts through charted terrain, remembered roads and visible blockers. An unseen disruption can therefore produce a legitimate own-army shortage without revealing its location as changed map geometry. Source-loss lapse is a generic participant diplomatic fact, not disclosure of its new captor/name. Only participants see the contract. A provider may see the generic fact that an offer cannot currently settle; it does not see the buyer's treasury amount. Increasing a solvent buyer's private balance leaves the provider's view identical.

The ordinary supply propagator is shared with the observation-only prospective query, `previewSupplyAccessCells`. Historical rules31/33 archive seals remain unchanged; older observations expose no supply-access capability and historical projections reject modern contracts or consumed identifier history rather than dropping them.

## AI policy and limits

The AI answers one incoming request using the shared public assessment before ordinary planning. It considers one outgoing request on a stable10turn faction cadence, only with no own pending request, no import-cap conflict and sufficient coin after existing commitments plus a24coin operating reserve. Its current proposal is20coin for10turns. It considers at most2needy unrouted actors and4visible foreign sources. Need means an actual own-land shortage or a fleet at half stores or lower outside replenishment.

The prospective supply graph must contain a domain-compatible destination. The current hex needs no movement query; another destination requires an ordinary permitted movement preview with action `move`. At most8previews are possible. Each preview shares4096nodes between range and target search; its `expandedNodes` field reports target-search work only. Each source propagation reaches at most217hexes within8road steps; harbor forecasts have separate land and water passes. Whole-observation indexing is additional work. These are structural bounds, not measured timings or a guarantee every candidate is reachable.

An equally near or nearer compatible cell in existing known supply conservatively vetoes a purchase. This cheap geometric comparison does not claim to compute an exact best route to every own source. The proposal returns the requesting actor in `heldArmyIds`, allowing the integrated planner to preserve it for that pass. Pending fees are withheld from optional planning, including victory purchases. AI respects its observed pending purchases and active obligations when selecting automatic attacks, including a supplier chosen in the same pass. Canonical war and termination remain available. Contracts do not escrow funds, guarantee future upkeep affordability, or create persistent actor assignments.

## Retained checks

Counts below overlap and must not be added. The latest complete AI run includes all10new AI tests; focused runs include earlier versions of those same cases. Empty typecheck/lint files are literal successful command output; their process exit status was0.

| Evidence | Result | Scope |
| --- | --- | --- |
| [supply-canonical-initial.log](supply-canonical-initial.log) |15passed,1failed /3files | Initial land-only fixture accidentally retained the naval fixture's existing harbor. The fixture now explicitly removes that harbor when requested. No assertion was weakened. |
| [supply-canonical-fog.log](supply-canonical-fog.log) |18passed /4files,2.45s | Corrected fixture;7new contract cases,2fog cases and9existing land/fleet supply cases. |
| [supply-canonical-final.log](supply-canonical-final.log) |19passed /4files,2.48s | Added prospective-query parity,8contract cases plus2fog and9existing cases. |
| [supply-ai-integration-initial.log](supply-ai-integration-initial.log) |20passed,4failed /5files | AI code was tested before the parent-owned public query export landed; four calls reported a missing function. |
| [supply-ai-integration-final.log](supply-ai-integration-final.log) |18passed /3files,1.17s |8AI cases plus8contract and2fog cases after integration. |
| [supply-ai-all-final.log](supply-ai-all-final.log) |279passed /35files,21.50s | All AI tests; includes9new supply cases after adding a real ready-project reservation regression. This was the first complete AI run, with no failures. |
| [supply-ai-peace-regression.log](supply-ai-peace-regression.log) |10passed /1file,1.62s | Added a three-realm paid-peace regression after independent review found that diplomacy preceded fee reservation. |
| [supply-ai-all-corrected.log](supply-ai-all-corrected.log) |280passed /35files,21.52s | All AI tests after reserving pending fees before diplomacy/patronage planning; supersedes the earlier279test stage. |
| [supply-history-final.log](supply-history-final.log) |44passed /2files,2.39s | Frozen fleet-provisions and reinforcement-logistics history after the shared supply refactor. |
| [supply-typecheck-initial.log](supply-typecheck-initial.log) |exit0 | Initial canonical integration. |
| [supply-typecheck-integration-initial.log](supply-typecheck-integration-initial.log) |failed | Missing public query export and test-harness journal/route API mismatches; corrected before final integration. |
| [supply-typecheck-final.log](supply-typecheck-final.log) |exit0 | Integrated whole-tree TypeScript check at the focused AI stage; parent final checks cover later harness/test additions. |
| [supply-lint-initial.log](supply-lint-initial.log) |failed | Unused `GameState` import in the new fog test. |
| [supply-lint-corrected.log](supply-lint-corrected.log), [supply-lint-final.log](supply-lint-final.log) |exit0 | Scoped simulation, fixture and AI files after the correction; final includes all9AI cases. |

Tests use ordinary proposal/acceptance/payment/termination commands, real end-turn fleet/cargo replenishment and land attrition/recovery, strict save round trips and complete journal replay. They cover stale funds, provider overflow, refusal, expiry, war lapse, immutable disclosures, hidden blockade/recovery, unknown cells, participant privacy, historical capability gating, route feasibility, full-plan hold/attack protection and budget preservation. The victory reservation case establishes readiness with ordinary research/institution commands on an explicitly prepared infrastructure fixture; no victory result is injected.

The added peace case founds three realms, declares war and advances eight ordinary rounds, then creates a20coin promise to one provider and a5coin reparation demand from a different enemy. Contact and exhausted morale are explicit fixture inputs. The original pure `planDiplomacy` ordering accepts the legal payment, leaving15coin and an unpayable supply request. The corrected full planner rejects that discretionary payment, retains20coin, and subsequently pays the provider exactly once through its ordinary AI acceptance. The saved journal replays exactly; no temporary rollback of the running planner was used.

The shared naval fixture authors geography, harbor infrastructure, an overseas force and depleted stores. Its approach uses real research, embarkation and travel. It injects no supply agreement, payment, replenishment or recovery. Ownership-loss focused checks start at an explicitly authored lifecycle boundary; they are not a complete capture journey. Fleet_ui's independent read-only runtime review found no blocker in ownership/war/expiry cleanup or actual-versus-forecast disclosure, with that capture-journey limitation called out.

## Outstanding integrated evidence

The benchmark extension now reuses the existing Huge/Legendary eight-source fixture. Its first Huge smoke passed the useful-source proposal/payment/replay and nearer-own-line veto assertions; [smoke JSON](supply-ai-benchmark-smoke-result.json) and [resumed log](supply-ai-benchmark-smoke-resumed.log) are retained. The [initial smoke log](supply-ai-benchmark-smoke.log) records sandbox IPC denial before execution. Smoke ran alongside integration activity and is not final timing. The smoke's original generic footer predates clarification of its single-sample/AI-only scope; use its `smoke`, `aiOnly`, `measuredSamples` and actual workload fields. Final source now labels these modes explicitly. The planner's internal route-query count is not instrumented; the benchmark reports a configured upper bound and a separately verified actual one-step own-return route, not a fabricated planner count.

Final timing awaits the parent's quiet CPU window. Browser/player workflow, worker persistence/recovery, integrated M3 acceptance, full repository checks and multiseed pacing are separate parent-owned evidence. No timing, pacing, gate completion or deployment result is inferred from these focused checks. The independent UI/worker review is recorded in [supply-ui-review.md](supply-ui-review.md).
