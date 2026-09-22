# Campaign cost and test-suite restructuring — 22 September 2026

Continues **M0 / ACT-18 / DH-015** on local branch `fix/campaign-verification-cost`.
The base is deployed `4ce95ae` plus the three uncommitted 2026-09-21 performance
files (`movement.ts`, `visibility.ts`, `navigation.ts`); together they are the
"baseline" below. Rules/save stay **17** and content stays **`b79c78ed`**. No gameplay rule,
schema, timeout, worker count or campaign threshold changed.

## What changed

### Engine (exact; identical commands, events, hashes and save bytes)

| Change | Where | Why it was slow |
| --- | --- | --- |
| Route previewer for planners | `sim/movement.ts` `createRoutePreviewer`; used by `ai/naval.ts` `toward` | 94% of the naval AI's 11,377 route previews per Epic run failed with "No safe route", and those failures expanded 99.7% of 10.4 M search nodes. A failed, unlimited search has already visited the army's whole reachable area, so later targets outside it (with no foreign army or town) cannot be reached and are answered without searching. The army's knowledge and range budget are built once per plan. |
| Remembered-land fast path in the state hash | `sim/save.ts` `exactKnownLand` | Remembered land is 54% of a mature save and was re-parsed by zod at every end of turn. Records already in exact schema key order with valid values serialize to the same bytes, so they are referenced. Any deviation takes the original full parse, which raises the original error. |
| Sealed battle reports | `sim/battle-record.ts`; `warfare.ts` (on record), `save.ts` (on load) | Finished reports were re-validated by the largest schema on every hash. They are now deep-frozen history; their validated canonical copy is parsed once. Unsealed copies (e.g. `structuredClone`) still parse every time. |
| Shared observed-cell index | `ai/observation-index.ts` | Nine planners rebuilt the same `Map` over every observed cell per plan. |
| Typed explored-cell sort in observations | `sim/simulation.ts` `getObservation` | Reuses `sortedExploredCells` (already used by saves) instead of a comparator sort per observation. |

### Tests

- **Epic archive:** the second full replay rebuilt exactly the input the first replay
  had already verified. It is replaced by an identity proof. The download's key-sorted
  snapshot must load to the archived starting seal, and its records must equal the
  replayed archive; replay zod-parses commands and compares results
  order-insensitively. All other assertions are unchanged. The original test file
  also passes; see results below.
- **Pacing:** five sequential campaigns in one file (79 s) became three files sharing
  `ai/src/testing/pacing-campaign.ts`, so the two Epic seeds run in parallel. Titles,
  bounds and assertions are unchanged.
- **Contact:** the two "has contact happened" probes per faction per round request
  observations without per-town land or development quotes. Armies and towns are
  unaffected. The planning observation is unchanged.
- **Changelog:** the determinism check still builds the git feed twice; the second test
  reuses that build instead of a third `git show` walk.
- **Vitest projects:** `unit`, `campaigns` (long generated-AI soaks) and `repository`
  (art provenance, extraction and git history). `pnpm test` still runs all of them.
  New scripts: `test:unit`, `test:campaigns`, `test:repository`. Measured locally,
  `test:unit` runs 1,691 tests in 13.9 s and `test:campaigns` runs 78 in 37.1 s.
- **New regressions (28 tests):**
  - `sim/src/route-previewer.test.ts`: every answer equals `getMovementPreview` or is a
    blocked preview. Covers the existing preview corpus, a split-basin fleet with an
    attack target, and real generated observations.
  - `sim/src/canonical-history.test.ts`:
    - fast and full parse produce identical bytes and seals;
    - invalid records raise the original schema errors;
    - inherited records are still rejected;
    - reports are frozen on record and load;
    - an unsealed copy seals identically;
    - an altered copy is still rejected.

## Equivalence

[`digest.mts`](equivalence/digest.mts) plays nine generated campaigns through the real
AI: the three archive/pacing Epic runs, the pacing standard seeds and the three contact
maps. It hashes every command and result plus every end-of-turn state hash. The
baseline ran from a detached worktree of `4ce95ae` with the three 2026-09-21 files; the
candidate is this working tree. **All nine are identical**: 125,026 commands, the same
per-turn hash streams, final seals and save bytes ([result](equivalence/result.txt),
[baseline](equivalence/baseline/), [candidate](equivalence/candidate/)).

## Timing

**Sequential, otherwise idle machine** ([raw](timing/sequential-ab.txt); i9-13900K, Node
26.7). The digest workload also hashes every round:

| Workload | Baseline | Candidate |
| --- | ---: | ---: |
| Archive Epic, seed 20260905 (910 turns) | 23.71 s | 17.35 s |
| Pacing Epic, seed 74 (1,036 turns) | 31.22 s | 25.22 s |
| Pacing Standard, seed 74 | 4.81 s | 3.89 s |
| Contact Standard/24 (61 turns) | 5.08 s | 4.68 s |
| Contact Huge/32 (61 turns) | 8.48 s | 8.03 s |

A single-state `stateHash` of the retained turn-910 Epic save took 5.39 ms before and
4.22 ms with the land fast path, measured in alternating pairs. Report sealing
further removes about 0.9 ms of report parsing per hash; that was measured by profile
only, not in a clean A/B.

**Full suite** ([summaries](suite/full-suite-summaries.json)):

| Run | Wall | Tests | Epic archive |
| --- | ---: | --- | ---: |
| Baseline (one run) | 80.6 s | 1,938/1,938 | 57.7 s |
| Candidate A | 46.6 s | 1,966/1,966 | 42.2 s |
| Candidate B (consecutive) | 47.3 s | 1,966/1,966 | 43.3 s |
| Candidate with the **original** Epic test file | 52.9 s | 1,966/1,966 | 48.5 s |

Earlier recorded baselines failed at 60.606 s and 66.513 s. Per-test times in full
runs vary with scheduling: this CPU mixes performance and efficiency cores, and the
split Epic pacing files now start alongside the other files.

**Browser** ([details](suite/browser-gameplay.txt)). The full Chromium gameplay suite
passed 180/182. Both failures reproduce identically on the baseline:
- **Lore:** an unkeyed React fragment in `Text`, now fixed.
- **Campaign menu:** a keyboard-order assertion made stale when `9243b09` added the
  Developer updates link, now updated.

After the fixes, the affected journeys pass 4/4, the public-site journeys 18/18 and the
Pages production smoke 27/27. Because hosted Verify has never reached its browser step,
these fixes also remove two failures it would have hit next.

## Limits and what remains open

- **Hosted CI was not run.** No commit or push was made. The last hosted run measured the
  long tests **2.4–3.3× slower** than local full runs. At that ratio, 42–48 s locally is
  still above the 60 s per-test budget on GitHub's shared runners. Huge/32 contact
  (8.5 s alone locally, 20 s budget) is also at risk. **DH-015, ACT-18, M0 and all
  fifteen release gates remain open.** The options are described in the prompt report.
- Operation-level timings are not campaign-scale claims beyond the listed workloads.
- The route previewer's saving applies to naval planning; land exploration still uses
  one movement query per army.
- Remaining Epic cost is spread across AI planning (~8 s), observation (~5 s) and hashing
  (~7 s, most of it native `JSON.stringify` plus the two FNV folds the seal format
  requires).

The [design audit](design-audit.md) records simplification, efficiency and gameplay-depth
findings for the next slices.
