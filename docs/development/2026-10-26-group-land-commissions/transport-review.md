# Group land commission transport implementation verification

Agent: `group_land_transport`. This is implementation verification, not an
independent review of the transport code I authored.

The bounded `groupLandPolicy` request follows the existing policy path. Before
any canonical order, the worker validates the whole strict request/command shape,
1–128 distinct hearths, controlled faction, reviewed hash and uniform improvement,
allowance and reserve. Commands execute in stable hearth-ID order through the
ordinary campaign recorder. There is one final publication and no implicit save.
Each accepted/refused row identifies its hearth; the client correlation ledger
rejects incomplete, duplicate, reordered, foreign or malformed replies.

The canonical rules, AI, content and save schema remain unchanged. An accepted
commission is permission, not a promise that work started. Shared treasury and
reserve behavior come from ordinary `setLandPolicy` commands. The UI emits
zero allowance/reserve on removal; the worker accepts only a uniform group.
Recorder/publication failure after payment stops later orders and requires saved
restoration before commands, save or export; it never invents a rollback.

## Actual verification

`vitest run apps/web/src/worker-group-land-policy.test.ts apps/web/src/group-response-requests.test.ts apps/web/src/worker-queries.test.ts`
passes **73 tests across 3 files in 16.55 seconds**. [Raw log](transport-tests.log).
The new worker file contributes eight cases, correlation contributes five new
cases, and the existing worker boundary tests are retained unchanged.

- Thirty ordinary paid works, one response, exact spent coin/remaining permission,
  stable submission ordering, no implicit autosave, exact replay and manual save
  restoration after group removal. Removing permission keeps all paid work.
- Two purchases competing for one purse: first starts, second waits; both
  commissions install and the ordinary reserve is protected.
- Whole-request rejection before recording for malformed arrays/commands, sparse
  or decorated arrays, duplicate hearths, heterogeneous intent, unsafe coin values,
  wrong seat, stale or malformed hashes and 129 entries.
- Exactly 128 waiting commissions install without truncation. This zero-allowance
  boundary workload is separate from the thirty-hearth paid-work case.
- Real same-turn paid production invalidates prior assignment/removal hashes;
  fresh application succeeds without buying duplicate active work.
- Canonical foreign, missing and policy-free refusals coexist with an accepted
  removal and replay exactly.
- Authored recorder and publication interruptions happen after actual paid work;
  later orders/save/export are locked and saved restoration matches exactly.

## Limits

The workload authors settlement ownership, population, funding and small local
plains patches, clearing deposits only on rewritten cells. It uses canonical
worker assignments and ordinary commission payments after import. It is not an
organically developed realm, browser interaction, timing benchmark, pacing result,
network test or release-gate acceptance. Parent owns full integration/typecheck,
browser evidence and deployment. A test-only explicit map return annotation was
added after this passing run to resolve a TypeScript literal-widening error.

## Reviewed implementation hashes

- `apps/web/src/protocol.ts`: `7998df51eb61350a06a5c53178db050eed74a4d432e5cde9b6c17f19e0e5ab6a`
- `apps/web/src/simulation.worker.ts`: `6f31b410146615018b3949ca42bb5d6dcaf8b209b03393d1b969728e79152e37`
- `apps/web/src/group-posting-requests.ts`: `f4a76b79c4a4272dc691b011384444cfd34470664c9e19f7585641cd6949f557`
- `apps/web/src/group-response-requests.test.ts`: `1dad31a978943352c6d106899708924932b04616e2c07764342e71e52a2bc083`
- `apps/web/src/worker-group-land-policy.test.ts`: `1262d08852df73cb0910a584df0f1dc9da8c51fccea876521d1f66eff6ca4944`
