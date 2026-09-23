# Fleet provisions: code review

Reviewed the integrated rules31 supply resolution, army composition, command/version boundary, naval AI, and their regression tests on 2026-09-23. This was a read-only production-code review; the reviewer also authored the save/chronicle/storage compatibility implementation, so the persistence assessment is a self-review. One independently reproduced AI defect was reported to the implementation agent and fixed. No unresolved defect was identified in this review after checking that fix. This does not establish overall 1.0 acceptance or replace the campaign, browser, build, and performance gates.

The reviewed paths are [supply.ts](../../../packages/sim/src/supply.ts), [army-composition.ts](../../../packages/sim/src/army-composition.ts), [simulation.ts](../../../packages/sim/src/simulation.ts), [naval.ts](../../../packages/ai/src/naval.ts), and the fleet supply, naval supply, save, chronicle, and persistence tests.

## Finding and resolution

**P2: a coastal fleet could ignore reachable harbour supply.** The return planner selected the two closest supplied water cells before checking whether the hull could enter their depth. In a U-shaped bay, both selected cells could be deep water. Both authoritative route quotes then failed, and the exhausted galley emitted no movement order even though supplied shallows were reachable around the head of the bay.

The reproduction used the existing authored naval fixture with a land bridge across columns 13–20 in row 8. A coastal galley at hex 691 with one provision turn selected deep-water hexes 687 and 735; supplied shallow hex 638 had a legal route. The original planner returned no commands. This was an ordinary canonical observation and route-query reproduction.

The fix excludes supplied cells that a shallow-only fleet cannot enter **before** choosing the nearest two targets. It uses the observation's `waterDepth` and the fleet's `canEnterDeepWater`; the canonical route preview still decides whether an actual route is legal. The [retained regression](../../../packages/ai/src/naval-supply.test.ts) strict-loads the authored state, establishes both rejected depths and the reachable alternative, applies the proposed commands, and verifies that the galley remains in shallow water. The reviewer reran the original scan after the fix and independently ran:

```text
pnpm exec vitest run --project unit packages/ai/src/naval-supply.test.ts -t 'coastal galley skips'
1 selected test passed; 7 other tests were excluded by the name filter.
```

## Boundaries checked

- Supply is resolved before movement refresh and queued travel. A final ration feeds the whole current turn; starvation starts at the following supply resolution. All carriers are resolved before any passengers, so army ID ordering cannot charge passengers early. A fleet must be in supply at the supply boundary to replenish; merely sailing through it does not refill stores.
- Splitting copies the source endurance. Transfers and merges retain the lower endurance, preventing a newly added hull from refreshing a depleted fleet. Existing loaded-fleet reorganization restrictions still apply. Attrition remains bounded by the established strength floor and does not heal an already weaker formation.
- `getArmyView` removes the canonical `provisions` field. Fleet endurance is supplied through the owner's supply observation; owner-filtered event feeds carry depletion and replenishment notices. The AI consumes that observation and public route queries.
- The independently captured rules30 saves and archives retain their exact historical bytes and hashes. Optional absent stores remain absent on load; current rules materialize their use at the supply boundary. Historical serialization, hashing, and command execution reject populated provisions rather than silently dropping them. Modern round trips, mixed historical/current replay, IndexedDB persistence, compressed export/import, resealed invalid ranges, and stores on embarked land troops have regression coverage.
- The literal `max(8)` in the rules31 army save schema and `FLEET_PROVISION_TURNS = 8` are intentionally separate. The schema freezes the accepted rules31 format. Replacing its bound with a future mutable gameplay capacity could silently broaden historical input. A future capacity change must deliberately version the rule/schema and retain the rules31 bound. No discrepancy exists in the reviewed implementation.

## Remaining limits

The naval planner remains a bounded heuristic: at most eight fleets are considered per plan, at most eight shared route queries are available, and each resupply attempt retains two nearby candidate cells. The depth fix removes the demonstrated invalid candidates; it does not prove that the two candidates cover every reachable port in obstructed or incompletely charted geography. Fleets beyond the per-plan cap rotate through later plans. This review does not establish loss-free logistics for arbitrarily large AI fleets or every map layout.

The immediate return step stays within current sight, while remaining travel time is estimated using movement and sight. Changes in occupancy, supply access, wages, or future route knowledge can invalidate that estimate. The planner may fund one legal nearby coastal staging harbour and gives an immediately legal expedition landing priority over returning; it does not compute an optimal long-distance chain of ports. Those limits belong in the continued campaign and scale evidence, rather than being counted as a complete naval logistics planner.
