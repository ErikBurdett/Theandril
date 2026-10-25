# Independent land commission UI source review

Reviewed by the simulation implementer, who did not author these UI or browser changes. Read-only source inspection; no new test or visual pass is claimed by this review. Browser execution and screenshot inspection remain separate evidence.

Verdict: no blocking finding in the inspected implementation.

## Findings

- The component consumes owner-only compact policies and the selected authoritative land detail. It does not reconstruct construction prices or choose target tiles in React. The existing query session keys results by settlement, hash, epoch and page, hides stale results during render and rejects mismatched reply identity/hash.
- Controls lock while busy, disabled or awaiting the current detail query. A pending detail hides the previous next-order quote. The current-policy preview is explicitly labelled separately from the unapplied form.
- Safe nonnegative integer parsing rejects empty, fractional, exponential and unsafe values before command construction. Both visible buttons are explicit type=button; invalid budgets disable Apply while End still uses authoritative policy values.
- Applying clearly replaces the remaining allowance and can spend immediately. The editor remounts when authoritative improvement, remaining allowance or reserve changes; a spent allowance cannot silently remain an old form default. Settlement keys reset the form between subjects.
- Reserve disclosures state that ordinary realm orders can spend the reserve and that commissions share a treasury. The UI does not imply escrow, global bankruptcy prevention or guaranteed affordability.
- End preserves paid work. Adjacent construction/cancellation warnings explain successful manual takeover and no refund; worker and land-claim controls retain their separate semantics.
- Native labels, details/summary, text status, error aria-invalid, wrapping and minimum 44px controls support keyboard and narrow layouts. Actual visual fit is deferred to rendered browser evidence, not inferred from CSS.
- The production journeys use generated geography and ordinary growth/worker commands. Their starting browser archive is explicitly from-save. They exercise immediate payment, allowance replacement, protected reserve waiting, two paid completions, manual cancellation/construction, invalid numeric inputs, keyboard commands, narrow text scale and exact save/replay restoration. No production debug mutation hook is used.

## Scope limits

This review does not establish all browser engines, maximum empire performance, organic mature-realm acceptance or per-pixel visual quality. Candidate editing has no speculative preview; the displayed next quote belongs to the currently installed commission. Group commission controls are not part of this slice.

## Reviewed bytes

| Path | SHA256 |
| --- | --- |
| `apps/web/src/land-policy.tsx` | `e3eac745497cead4da4d91f10cabd06ce4a0cfc536a5d41e57bca0504ca4e975` |
| `apps/web/src/land-policy.css` | `2809cf347d237b9d69325e74534f2e5dd31979b1842ada64bb3f5f5646086da1` |
| `apps/web/src/land-policy.test.tsx` | `7156ff675015e41d2ad63dc2d39df9aa20131ddb712d52a821d3b30700b62523` |
| `apps/web/src/land.tsx` | `97f28e0e8cd940e31674b76dec73770c1ca0909d866bcf98be401dcef223db0f` |
| `apps/web/src/use-land-query.ts` | `7858833cae5a45c9d7996b5be57b4c167310eb63076cd33a47a859593c5dcf37` |
| `tests/production/land-policy.spec.ts` | `1c3aa79961f26615701242da59487c1373b590c7ed4eb233951c8b0423081127` |
