# Worker-policy canonical and AI source review

Reviewed the uncommitted worker-stewardship source against primary-checkout
baseline `47174209f633a92930b8076b0b1ce7db13c3e38e` on 2026-10-25. The reviewer
implemented the individual React controls and read the independently authored
simulation, history and AI changes. This is independent review of those
canonical/AI paths, **not independent review of the reviewer’s own UI**, a
published-commit approval or browser acceptance.

No blocking defect found in the inspected paths:

- `packages/sim/src/worker-policy-state.ts` defines strict policy and command
  shapes, finite-world serialization bounds, declared yield scoring and numeric
  cell ties. It rejects duplicate, unsorted, orphaned or foreign-owned saved
  policies rather than silently repairing them.
- `worker-policies.ts` checks ownership before mutation. Revoking a policy
  retains assignments. Setting one performs immediate allocation where legal;
  ordinary battle/capture/victory guards remain ahead of command execution in
  `simulation.ts`. Owned observations copy the policy rows and expose compact
  assignment/capacity counts and canonical blocking reasons.
- `territory.ts` uses existing charting, claim ownership, center exclusion,
  deep-ocean legality, capacity and yield arithmetic. Allocation considers actual
  claims beyond the detail page. Its heap retains at most worker capacity and
  uses call-local owner contexts, avoiding per-tile full-registry reads and
  unused improvement/cultivation quotes. Complexity is proportional to claimed
  cells times log capacity; benchmark acceptance remains separate.
- Successful direct worker orders validate the entire requested tile set
  before revoking stewardship. Failed orders preserve the policy and state.
  The existing capture-resolution path invokes `handleLandCapture` immediately;
  the new cleanup removes policies before a later turn can resurrect them after
  capture or razing. Siege and occupation retain the policy while allocation
  waits. Rechecking follows settlement growth and completed land work, so new
  assignments affect the following harvest.
- `save.ts`, `rules.ts` and `packages/chronicle/src/index.ts` add36 explicitly.
  Historical35 schemas remain strict, migrate an empty policy registry, and
  project the exact prior envelope. Historical execution and serialization
  reject a nonempty modern registry. The genuine pre-change raw bytes and
  fourteen-record archive are retained; compatibility tests compare original
  hashes, frozen envelopes and mixed35→36 continuation.
- `packages/ai/src/land.ts` keeps strategic allocation in AI and mutation in
  the command API. The final guard requires complete claimed-cell coverage,
  no resource-bearing quoted cell, no fiscal allocation need, and enough
  capacity for every legally workable quoted claim. Unsafe existing policies
  are removed through an ordinary direct assignment even if the desired tile
  list is unchanged. Material-demand, project-funding, off-page retention and
  paid-land planning remain in the direct planner. Historical observations lack
  the capability and keep the old branch.

The initial review suggested two additional regression witnesses: material
output stopping when a priority removes a worker from a matching extraction
tile, and an existing policy returning to the fiscal planner. Those suggestions
are not claims of an observed runtime failure. Their eventual execution results
belong in the final test evidence rather than being inferred from source review.

The current pacing files were read separately: baseline rules35 and corrected
rules36 both end the seed20260905 twelve-realm Standard-map cases at219/329/374
for Standard/Long/Epic. The retained broad-adoption experiment ended233/346/385.
Corrected Epic records three policy installations and six automatic allocation
events; Standard and Long record none. Matching end turns does not assert
matching entire state hashes, broad adoption quality, engagement or a cleared
pacing gate. DH-021 remains open, including the existing late Long result and
unmeasured current-rules seed variation.

Limits: this review did not run the full suite or browser, measure sustained
land costs, inspect final imagery, test physical storage failures, approve
publication or verify live deployment. It is evidence of inspected source
boundaries, alongside the separate group-path review and pending integration
results. All release gates remain open.
