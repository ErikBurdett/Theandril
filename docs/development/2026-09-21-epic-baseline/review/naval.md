# Independent lazy naval preparation review

Verdict: **no blocking finding in the reviewed incremental change**. The source and retained evidence support adopting this local preparation optimization. This is not acceptance of the Epic integration gate, hosted CI, or a release.

## Scope and source identity

The comparison is against this prompt's retained [naval source](../ai/naval-before.ts.txt), not Git HEAD, which predates earlier authorized work. The change delays shoreline sampling, the home-land flood, coastal-frontier construction, and navigation preparation until a branch needs them. It returns after funding/research decisions when no eligible fleet exists. It introduces no persistent cache, new rule, schema, AI policy, or search-budget change.

| Reviewed artifact | SHA-256 |
| --- | --- |
| Original `naval-before.ts.txt` | `797310db2da52d41d4c9f7996f2462da8dd2f3b0f3f7eff7c1ffcfc57eec3220` |
| `packages/ai/src/naval.ts` | `fbefc7cbf38f58e84c8711a55dd9becee9b68774ce2ac4fde6b3da5005310cb6` |
| `packages/ai/src/naval-publication-equivalence.test.ts` | `2071a488603f338fdd47c713b62c4cecf9f752065235dbec8b8bc0ed2a883414` |
| `ai/complete-proposals-before.json` | `771ffd41b4a3ee1a2784eba7fc3d4628722527b258942e63dfa7487c565ef1d4` |
| `ai/benchmark-final.json` | `1815ccfe327afe15242b35b4b4821d522c7d7c78d2e7042e7443538c895cfa5d` |

## Source reasoning

- The no-fleet return follows all research, port selection, production, expenditure, and queue reservation logic. Every subsequent operation that could emit a command or hold an army requires an eligible fleet. The harbor assembly branch also requires an actual local fleet, so the return preserves both proposals and reservations.
- Shoreline filtering retains the same observed-cell order, terrain/occupancy conditions, sampling stride, and 256-objective limit. Both landing and boarding consumers use the same lazily populated result. The final boarding comparator exactly matches the retained baseline.
- The home-land flood retains the original sorted town roots, neighbor order, and `MAX_NAVAL_LAND_NODES` condition. Every passenger branch that reads the result first initializes it. Empty home-land sets remain truthy, so an empty result is retained for the rest of the call too.
- Navigation is still shared by all exploration calls within one plan. Delaying its construction does not consume or reset frontier work: its counters and indexes were previously unused until the same first `destination` call. `createNavigation` has no random draw or canonical mutation. Claimed destinations, fleet order, route-query charging, and movement-preview calls remain unchanged.
- All delayed facts are local variables in one synchronous `planNaval` invocation. Planning writes commands and local reservation sets, not the observation. A later call reconstructs knowledge from the current detached observation, budget, and held IDs. Returned result mutation cannot poison these temporary facts.
- This proof concerns ordinary simulation observations, the planner's public data contract. It does not promise identical property-getter invocation counts for hostile executable objects masquerading as observations.

## Evidence assessed

[The complete captured plans](../ai/complete-proposals-before.json) cover nine genuine retained Epic seed-99 checkpoints (turns 1, 30, 60, 100, 200, 300, 500, 800, and 808), four faction seats each. Their compressed save hashes and exact observation hashes are checked. The new 36-case comparison retains the entire ordered output: commands, reasons, held IDs, queued settlement IDs, coin expenditure, and interruption flag. It also checks observation nonmutation. These calls use each observation's full treasury; they do not reproduce the overall planner's reservation calculation or the separate seed-20260905 Epic archive gate.

The 37th new case reuses one detached observation across zero/full budgets and held-fleet options, compares with a cloned observation, mutates an earlier returned plan, then checks the original full-budget result again. Existing naval tests separately assert legal expenditure at the exact ship quote, held caller-set nonmutation, cargo reservations, and paid assembly behavior. The [focused final log](../ai/focused-final.log) reports **60/60 tests in five files**.

The [91-publication verification](../ai/naval-proposals-verify.log) matches the earlier complete authored proposals and founder-site capture: 35 commands, 21 founder assessments, SHA-256 `ceebe5c9c62b0985c986a9ba4c7e7aad6d0ddd68f3591c3e3c92e5f85585a3d3`. The [paid voyage verification](../ai/naval-campaign-verify.log) matches all eight turns and 22 commands, results, routes, and state hashes, ending at `fa29672f`. Its ordinary commands still board, sail deep water, land, and found; its initial setup is explicitly authored. The producer and original captures remain under [movement-preview](../../2026-09-21-campaign-continuation/movement-preview/).

The first manual runtime transplant changed a boarding comparator and failed the exact checkpoint comparison. That [failed result](../ai/first-runtime-equivalence-failure.log) is retained. The reviewed source restores the original comparator; the final runtime comparison passes. Earlier prototype measurements are not substituted for the corrected runtime result.

[The final paired benchmark](../ai/benchmark-final.json) loads the exact archived baseline beside the current runtime, shares current dependencies, alternates order, and keeps correctness checks outside timing. Its sum of 36 case medians is **36.391 → 34.730 ms**, approximately **4.6% lower**. Late passenger-heavy cases are mixed, including a regression in one sampled case. This is a repeated detached-observation microbenchmark, not a whole-campaign speedup or evidence that the 60-second integration threshold passes.

No tests or benchmarks were independently rerun by this reviewer during the reserved CPU windows. The review inspected source, captures, verification scripts, logs, benchmark methodology, and hashes. Parent integration checks remain authoritative.
