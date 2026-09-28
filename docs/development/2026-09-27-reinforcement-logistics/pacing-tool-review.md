# Independent pacing-tool execution-context review

27 September 2026. Reviewer: supply simulation/AI author, independently inspecting the parent's execution-context changes to `scripts/measure-pacing.ts`. After review, the parent explicitly assigned this reviewer the one validation/error edit restricting the new `--rules` option to 33/34; the reviewer did not author the context/hash correction. Source and retained-result inspection only; no campaign, browser, test, build or benchmark was run for this review. The parent owns final verification and the campaign rerun.

## Defect and retained evidence

Passing `rulesVersion: 33` to `createGame` selects and initializes a historical origin. It does not permanently attach an execution version to that state. `packages/sim/src/rules.ts` stores execution context in a `WeakMap`, defaults an unscoped state to current rules 34, and restores the previous context when `withRules` exits. `createGame` uses that context for its initial index rebuild, then returns the state outside it.

The initial comparison supplied the desired version only at creation. Subsequent observations, AI capability discovery and ordinary commands therefore ran under rules 34 for both requested rows. Their returned `rulesVersion` values expose this: the retained `pacing-matrix-initial.json` and `pacing-matrix-context-defect.json` contain only version 34 results. Those files and their matching logs are preserved diagnostics, **not a rules 33-versus-34 comparison**. Matching outcomes between their intended pairs cannot establish historical behavior. Repeating or relabelling those rows would not repair the measurement.

The separate nine-row [rules 33 baseline](pacing-rules33.json) was captured before the rules change, when 33 was the actual current default. Its pre-change provenance is unaffected by this later comparison-tool defect. Preserve it independently and compare the new historical rows against it.

## Correction inspected

`play` now creates the requested origin, then returns:

```ts
withRules(state, rules ?? rulesVersion(state), () => playCampaign(state))
```

`playCampaign` is synchronous. The same state object remains inside that scope for every observation, `planTurn` call, submitted command, tactical autoresolve, capture choice, End turn, counter read and final result. No asynchronous callback outlives the scope and no replacement state loses its context. `withRules` restores context in `finally`, so one campaign's selection cannot contaminate the next.

Under 33, `getObservation` omits both `theaterReinforcement` and `supplyAccess`. The theater planner therefore retains its earlier two-spare limit and omits the reinforcement field; supply planning and pending-fee reservation see no modern capability. The simulation's rule checks govern reinforcement, supply lifecycle and ordinary turn work throughout the run. Under 34, those capabilities are available. These gates provide the intended comparison without mutating the AI policy or content prices for the measurement.

The returned version is read while the selected context is still active. The final seal now uses `stateHashForVersion(state, rulesVersion(state))` in that same scope, rather than the current-save-only `stateHash`. The historical payload projection also refuses incompatible modern state. Compare hashes within the same version and configuration; different versioned envelopes do not promise the same hash even if gameplay outcomes coincide.

Verdict: **the wrapper and versioned seal correct the identified execution-context defect for the intended rules 33/34 behavioral pacing comparison.** No further source blocker was found in this bounded review. Source inspection is not a substitute for the pending full rerun.

## Rerun acceptance and limits

The final headline matrix must contain eighteen distinct `(pace, seed, rulesVersion)` identities: Standard, Long and Epic; seeds 20260905, 20260906 and 20260907; versions 33 and 34. It contains nine paired configurations, not eighteen independent seeds. The JSON is written incrementally after each campaign, so an existing file or passing first row is not a completed matrix. Use the three headline selections, not `all`, when claiming this eighteen-row scope.

Require each historical row to identify version 33 and match the genuine baseline's outcome and historical hash; investigate a mismatch rather than assuming the wrapper proves compatibility. Review victory/path, submitted refusals, automatic refusals and actual reinforcement/supply activity for both versions. `commands` counts submissions; only when refusals are zero can those counts directly represent accepted orders. `reinforcementPhases` counts theater phases with retained holds, not enemies or actual reinforcement journeys. `dispatchesToThreatenedHearths` counts accepted routes to held targets, not arrived guards. Zero supply proposals must remain explicit: selected planner/worker fixtures provide separate evidence of the new service, while such a pacing row does not exercise it.

The new CLI option is explicitly restricted to versions 33 and 34 after this review. Its campaign loop uses ordinary `applyCommand` inside the context, not the stricter `applyCommandForVersion` historical command-schema adapter and legacy conversion boundary. The wider 4–34 validation originally suggested unsupported historical scope; the reviewer narrowed that validation and its error text at the parent's request. Do not present this tool as arbitrary-version archive/replay compatibility verification. The genuine historical fixtures and dedicated compatibility checks remain that evidence. The parent will validate the small CLI change with the integrated checks and final rerun.

Elapsed campaign times can overlap other local checks and are not isolated performance measurements. No target, price or proxy bound changed here, and no pacing or release gate closes from repairing this diagnostic tool.
