# Independent simulation and AI review — land commissions

Reviewer: `/root/land_governor_audit`. Reviewed source produced by the simulation
agent and parent AI implementation. The reviewer authored the independent
prechange fixture and performance benchmark; neither is represented here as
independently reviewed by its author. No runtime source was edited in this review.

## Verdict

No blocking implementation defect found in the reviewed sources below. Full
integration, browser and publication verification remain the parent's separate
responsibility. This is scoped review, not M3 or 1.0 acceptance.

## Verified by source inspection

- Canonical policy records are strict, ownership-bound, sorted and unique, with
  finite world capacity and nonnegative safe-integer allowance/reserve. Unknown
  improvement IDs reject before policy mutation. Policy removal retains paid work.
- Selection scans every actual worked tile; completed improvements and mismatched
  resource deposits are excluded. Ordinary cell/charting/ownership/terrain/
  research/treasury rules still determine eligibility. Cheapest valid funded quote
  and numeric-cell tie ordering are deterministic, independently of UI pages.
- Immediate and subsequent orders use ordinary `applyLandCommand` construction,
  charge once, decrement the remaining allowance once and emit actual paid work.
  Shared owner contexts refresh treasury between policies; no earlier commission
  can make later spending rely on a stale balance. Selection keeps constant
  candidate memory and does not cache every visited cell's geography.
- Turn processing answers commissions after settlements, worker reassignment,
  upkeep and existing charters. Newly started work cannot progress during that
  same resolution. Siege/occupation use the existing land blockers.
- Successful manual improvement, cultivation and cancellation revoke only after
  validation. Failed orders retain state. Worker and claim orders remain separate.
  Capture/liberation/raze share immediate ownership cleanup, so permissions cannot
  return on recapture. Existing work cancellation still refunds nothing.
- Compact policy observations are detached and owner-only. Candidate scans occur
  only for detailed land requests, while those requests inspect all worked cells
  even if only one tile page is being quoted. Reads do not mutate canonical state.
- Save/rules37 has explicit migration with fresh empty arrays. Frozen36 schemas
  reject future fields; hash/serialization/history guards reject nonempty policy
  downgrades. Chronicle and persistence accept37 without rewriting old seals.
  The compatibility test pins the genuinely captured36 save/archive bytes and
  exercises mixed continuation, original records and unchanged original seals.
- AI adoption is capability-gated. It proves complete worked-cell coverage,
  unchanged worker proposals and identical cheapest/cell candidate before using
  an exact one-job allowance. The normal budget already incorporates earlier
  planned purchases, so reserve0 avoids counting those purchases twice. That
  allowance is consumed immediately; replacement, partial-page and changed-worker
  cases retain direct strategic orders. Existing funded commissions are respected.

## Tests inspected and evidence limits

Simulation tests exercise real paid starts/completions, finite allowances,
property-based reserve bounds, shared treasury, existing charter priority,
explicit/manual revocation, occupation, actual siege/capture, detached reads,
page-independent choice, generated resource extraction and exact replay. AI tests
pair the new command with the prior direct order after an earlier paid proposal,
check identical work/balances and exhaustion, and retain direct fallback cases.

A synthetic AI observation initially named nonexistent `improvement.terrace`;
the reviewer requested the real `improvement.terraced_fields` identifier. This
was fixture hygiene, not an observed runtime failure. Check the final test source
against the hashes below when integrating later edits.

Performance results are separately retained in `benchmark.json`/`benchmark.log`.
They include real payments in every isolated paid-phase sample and actual repeated
starts/completions over fifteen mirrored turns. Full observation sizes exceed
megabytes in authored large registries: these CPU/JSON observations are not a
claim that browser transfer or giant-empire acceptance budgets have passed.

## Source hashes at review

| File | SHA256 |
| --- | --- |
| `packages/sim/src/land-policy-state.ts` | `84c6659165236e90621d2eee876352b9d19eb93c3b6ccf9a99fa945e7a86cd2f` |
| `packages/sim/src/land-policies.ts` | `0cb3c74262b49cacaa6386c7d252afae2090cef0d9f7f35dba59420a2fc1bdd2` |
| `packages/sim/src/territory.ts` | `021ec958e5c11bd5b5c09c3723187230adb7f182c98940fed7c57072a1c00e25` |
| `packages/sim/src/simulation.ts` | `c9c1a8c86e7644fd169ae8b82a73a1c2be022670a76a6fd03eb3f1992b819f33` |
| `packages/sim/src/save.ts` | `8cac14d61aee8440a91729dcc581ca3b496dca291c3c09c5b378fdde2f49b527` |
| `packages/sim/src/rules.ts` | `7eaa27961043be146261312ea228384cf0228271f9143178a09d0e8be4758c88` |
| `packages/sim/src/types.ts` | `df8b16321945d8d0e948283418dc40d1b17c4f3030b3753009588db0f8f71472` |
| `packages/sim/src/land-policies.test.ts` | `d55080c7c27c4e55c00382875ae2d15ccfbc027ebffd4f5b602c9ad5c8bea4d1` |
| `packages/chronicle/src/index.ts` | `e98f5ad191dc8c154c6d9de7765834744da3d7fbe5d379c8921193653d8c1c06` |
| `packages/chronicle/src/land-policies-compatibility.test.ts` | `f99db8143d44a3378ac4cba4a4f6322ce37f06d02d26ea5c99ba8e57283d83eb` |
| `packages/persistence/src/campaign-storage.ts` | `2fc3a982eb9690d3ebe22bb58890426e3fe5f26f4060c1db6373a3d48e7fb2b0` |
| `packages/ai/src/land.ts` | `15bca2a5870757cdfb17b063da73ef61097caa6e8332e15282c71fb4e71e6114` |
| `packages/ai/src/land-policies.test.ts` | `342399c201ddce3b65bb63c3503d4b1752c4416ce60f44ba88fbe4ce5f524eae` |
