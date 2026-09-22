# Independent navigation selection review

Reviewer: hash-cost subagent, separate from the movement/navigation author.
Read-only review of `packages/ai/src/navigation.ts` candidate SHA-256
`853b83434be741254140743e64cb20b08ee792dc3838329178c48ae3e04b9fbc`
against the retained baseline SHA-256
`51b5e54c26caa6f7ae3fcb3fa24abcfe015f07d8bf0a599a0c747f68d3c799fa`,
plus the navigation corpus, independent baseline captures and benchmark harness.
No tests or measurements were run during the parent's full-suite window.

## Comparator and ordering

For ordinary valid observations the fast path preserves the winner. Candidate
strategic/exploration values are materialized once in the unchanged mapping step.
Finite components and a finite sum exclude NaN/infinity ambiguity; subtraction
of opposite large finite sums may overflow to signed infinity, but still has the
correct ordering sign. The remaining comparison keys are bounded movement cost,
unsigned deterministic salt and unique cell ID. Thus the comparator establishes
a total order, and a minimum scan returns the same first candidate as sorting.

The secondary frontier sort compares distance, cost and unique cell ID. Its
winner is independent of the prior array order, so leaving the original candidate
array unsorted on the fast path cannot change that fallback's destination.
Frontier expansion, topology, reservations, information gain, work budgets and
candidate enumeration remain unchanged.

Strategic and utility callbacks retain their original count and enumeration
order because their mapping step is unchanged. A provided tie-break callback
must retain the original native sort; it may be stateful, so its invocation order
is observable. Nonfinite scores likewise retain that sort. The finite probe does
not coerce object values: `Number.isFinite` rejects boxed/custom-coercion values
before addition, leaving their original comparison behavior to the fallback.

## Evidence and limits

The corpus compares 18 complete destination batches, including generated starts,
authored frontier/large-range observations, custom identities, pure/stateful tie
callbacks, NaN/infinity/overflow scores, secondary frontier approach and the 8,192
node limit. Exact destinations, gain, expansion counts and callback traces are
captured from the independent original implementation. The initial focused run
passed 88/88 tests; after the nullish-guard correction, the final focused run
passes **91/91**, including the three malformed-callback regressions and existing
historical navigation/naval publication equivalence. Benchmarks use a fresh navigation object for each full
batch and preserve callback counts while excluding trace-string collection from
timing. This is stronger than a comparator microbenchmark, but is not complete
AI-turn or campaign acceptance evidence.

## Compatibility correction resolved

The initial candidate's `!explorationTieBreak` guard also treated falsy non-nullish runtime
arguments such as `0`, `false` and `''` as absent. The original optional callback
invocation would throw when the native sort compares multiple candidates. The
author replaced this with explicit undefined/null checks and added three
regressions asserting the original TypeError for those malformed callbacks with
equal-scoring candidates. The reviewed source and retained candidate now both
have the updated hash above. This correction has no effect on the ordinary typed
callback cases or their comparator proof. The final guarded-source benchmark and
focused checks finished before parent full-suite run C began; the navigation
README retains the precise evidence timestamps and final source hashes.

Final source-review disposition: **no blocking finding after correction**.
Parent owns broader checks and unchanged full-suite performance acceptance.
