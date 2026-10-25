# Independent AI source review — 25 October 2026

Reviewer: `land_policy_ui`, author of the individual controls and production
journeys, independent of the AI implementation. This is a read-only source
review; no pacing, benchmark or browser process was started during it.

## Scope and verdict

No blocking defect found in the commission adoption path at the reviewed bytes:

| File | SHA256 |
| --- | --- |
| `packages/ai/src/land.ts` | `15bca2a5870757cdfb17b063da73ef61097caa6e8332e15282c71fb4e71e6114` |
| `packages/ai/src/land-policies.test.ts` | `342399c201ddce3b65bb63c3503d4b1752c4416ce60f44ba88fbe4ce5f524eae` |

Also inspected the caller's budget construction in `packages/ai/src/index.ts`,
canonical `commissionChoice` / `executeLandPolicies` in `territory.ts`, and the
new policy installation path for agreement with the proposal. This is not a
complete independent simulation, save or UI review.

## Findings

- Historical observations without `landPolicies` retain direct improvements.
  The existing worker priorities, cultivation branch, resource utility, replacement
  protection, paid-order limit and claim fallback remain in place.
- Adoption requires no preceding worker assignment/policy command for that
  hearth, and quotes for every currently worked cell. An incomplete page cannot
  prove the candidate. The strategic winner must equal the canonical cheapest
  suitable empty worked site, including numeric-cell tie breaking and deposit
  extraction protection. Existing improvements remain direct strategic work.
- The commission allowance equals exactly the chosen ordinary quote. Immediate
  execution spends it entirely, leaving zero for future automatic purchases.
  This avoids granting permission to spend a later turn's strategic reserves.
- `planLand` receives the already reduced discretionary budget, after prior
  commitments and reserved needs. Creating another reserve from the stale
  original treasury would count earlier purchases twice. The explicit zero
  reserve is safe for this one-job adoption because its allowance already limits
  the purchase to the funded quote; the caller still accounts for `coinSpent`.
- A pre-existing commission with positive allowance suppresses new direct paid
  land plans for that hearth. Worker management can still run. The AI does not
  silently cancel a player's funded standing instruction; wider policy strategy
  remains future work.
- Proposals depend only on owned observations, quoted costs and public content.
  They issue ordinary `setLandPolicy` commands without canonical-state mutation.

## Evidence boundaries

The paired test uses generated seed 74 with an explicitly authored 500-coin
budget. It compares the former direct choice to commission execution after an
earlier paid granary proposal, then checks land/treasury mirrors through eight
turns and exact saved replay. Two other tests cover changing workers, missing
worked-cell detail and preservation of an existing funded commission. Their
source was reviewed here; execution belongs to the parent's integration logs.

The parent separately reports paired headline pacing at 219/329/374; that claim
must cite the final pacing packet rather than this source verdict. Unchanged
headline turns do not establish all-seed equivalence, broad strategic adoption,
organic mature-empire acceptance or closure of DH-021 / R06.
