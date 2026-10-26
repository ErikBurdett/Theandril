# Group land commissions — independent source review

Verdict: **no blocking source finding in the reviewed implementation**.
Reviewer: independent `group_land_review` agent, 2026-10-26. This review covers
source and focused test evidence; it is not a displayed screenshot approval,
whole-suite verification, deployment proof, or 1.0 acceptance.

## Reviewed behavior

The batch carries existing `setLandPolicy` commands and leaves simulation, AI,
content, prices and save/rules versions unchanged. Worker envelope validation
precedes mutation and rejects malformed, heterogeneous, sparse, duplicate,
wrong-seat, over-limit and stale batches. Stable settlement-ID order matches
individual commands, so immediate purchases share the actual reduced purse.
Normal canonical refusals retain a per-hearth result. One final observation is
published; the group path does not add implicit autosaves.

The new ledger uses the existing strict correlation contract. It snapshots faction
and submitted IDs, requires the full ordered result list and valid row shape,
handles explicit recording uncertainty without treating partial rows as success,
and isolates stale request IDs. Main-thread integration includes the new ledger
in unexpected response, ordinary error, state-validation, map-decode, recovery,
restore, worker-error, unmount and competing-order paths. It validates results
before installing the successful state. Paid recorder/publication interruption
keeps gameplay/save/export locked in the worker until valid restoration.

UI mapping uses only permitted owned checked hearths, does not truncate an
oversized request, and does not predict purchase eligibility or quote every town.
Removal selects only existing own commissions and uses normalized zero amounts,
independent of invalid unsubmitted grant fields. Amounts require safe whole
nonnegative integers. Aggregate allowance uses BigInt multiplication, so the
maximum safe per-hearth permission remains exactly displayed across 128 hearths.
The prose distinguishes per-hearth remaining permission, shared treasury reserve,
possible immediate payment, replacement, waiting permission and actual work.
Registry status consumes compact permitted metadata; its map is memoized.

The panel preserves unaffected/refused checked IDs and clears only confirmed
accepted IDs. It tracks pending work with an in-flight guard and participates in
registry/sibling locks. A failed request shows an error without claiming receipts
or acknowledging selection. Existing paginated results retain stable order and
support the new land-commission label.

## Focused evidence read

- `/tmp/theandril-group-land-transport-final.log`: **73 tests across three files
  pass**, 16.55 seconds. The new actual-worker tests include thirty real paid
  works, shared-reserve exhaustion, exact replay/save/restoration, no implicit
  save, malformed requests before recording, stale assignment/removal after real
  same-turn spending, canonical partial refusals, 128 waiting commissions at the
  transport boundary, and recorder/publication interruptions after actual payment.
- `/tmp/group-land-ui-tests-final.log`: **25 tests across three files pass**,
  1.06 seconds. Tests cover mapping, safe aggregate arithmetic, rendering without
  commands, ownership, invalid inputs, capability absence, review/hash locks,
  disclosure text and escaped registry metadata.

These are focused overlapping scopes, not a full-suite total. Authored worker
fixtures explicitly set ownership/population/purses and local plains and clear
resources only on rewritten cells. They prove boundary semantics, not organic
empire development. Browser paid-work, narrow-layout and actual-worker corrupted
reply scenarios still need their separate retained evidence. The parent owns
integration/typecheck/lint/build and final verification.

## Reviewed file hashes (SHA-256)

- `apps/web/src/protocol.ts`: `7998df51eb61350a06a5c53178db050eed74a4d432e5cde9b6c17f19e0e5ab6a`
- `apps/web/src/simulation.worker.ts`: `6f31b410146615018b3949ca42bb5d6dcaf8b209b03393d1b969728e79152e37`
- `apps/web/src/group-posting-requests.ts`: `f4a76b79c4a4272dc691b011384444cfd34470664c9e19f7585641cd6949f557`
- `apps/web/src/group-response-requests.test.ts`: `1dad31a978943352c6d106899708924932b04616e2c07764342e71e52a2bc083`
- `apps/web/src/worker-group-land-policy.test.ts`: `1262d08852df73cb0910a584df0f1dc9da8c51fccea876521d1f66eff6ca4944`
- `apps/web/src/main.tsx`: `dfb6bbd73b96419a27fb32ec231dcac872e2c9b2f9e028a9c388a63bcf593854`
- `apps/web/src/group-land-policies.tsx`: `fa9f6c8d555b047e009077c0aa134d920f88346a17267115261d9b737ff816e2`
- `apps/web/src/group-land-policies.css`: `804be628c5b358852df0b7608a2d480b59a41f0f763787f4782cbf1f54478da0`
- `apps/web/src/group-land-policies.test.tsx`: `33c3c0a48a832eb3ffcc9c7c3f24549ae076deb057baee6fce7c8992ef58e9c4`
- `apps/web/src/realm-navigation.tsx`: `cc572efc119e8bb309fd7588a268c47d54dd51ce5c5366bc1e67861d64d6ca3b`
- `apps/web/src/realm-windows.tsx`: `00a37d303a447b8d2823c31ee4041c486356a644ead8614c6961541ee58468f2`
- `apps/web/src/group-policy-results.tsx`: `500342b5cc2a86c25f3f1bee4e01596bae4a0480915fca0ee2e0777ef55b4cd6`
- `apps/web/src/group-policy-results.test.tsx`: `f3ce558028ccf1574b8b5231d1170a083a8bebdce4534160f0cca504200417da`


## Browser test follow-up review

The thirteen reviewed implementation/test hashes above remain unchanged.
Reviewed the new production browser source and the narrow-form setup correction:
it centers the actual `.group-land-amounts` element in its nested scroll region,
records both real DOM bounds, and retains exactly the same minimum-height and
four-edge visibility assertions. No runtime CSS or layout was changed to obtain
the screenshot. Payment, finite-purse, selection, record, save and replay
assertions remain intact; injected reply faults still occur after actual paid
worker execution.

The existing home route test now derives expected published dispatch count from
`dispatches.length`, replacing the stale literal21 while the current catalogue
contains22. This retains the requirement that all source catalogue entries render
and that the first entry remains refresh-safe; it is not a reduction in required
content or a feature completion count. No timeout or assertion was removed.
Full integration results belong to the parent's retained verification logs.

Additional reviewed source hashes:
- `tests/production/group-land-policies.spec.ts`: `02a5f80696f678734b6ac31fec45a4caa91abe5d328595a05d408df850b01bdd`
- `tests/gameplay/home.spec.ts`: `cdbaaab023a8c6d0f62d0f925315225c29dd59aaae6978c7c61fe36e8ffb5840`
