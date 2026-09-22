# Independent movement review

Reviewer: hash-cost subagent, separate from implementation author. Read-only
review of the installed `packages/sim/src/movement.ts`, matching the retained
`../movement/movement-index-candidate.ts.txt`, against the retained baseline.
No tests were rerun during the coordinated parent verification window.

**No blocking finding.** The following checks support integration:

- The search heap, neighbor order, node budget, predecessor handling and result
  assembly are unchanged. `canTraverse` combines the same explored-terrain and
  shared naval-domain predicates.
- A single map entry copies terrain and water depth rather than retaining the
  caller's mutable cell object. Duplicate cells preserve the original last-value
  behavior for terrain/depth and last-truthy-value behavior for road masks; a
  later absent/zero road mask does not remove an earlier truthy mask.
- Skipping road direction when the terrain cost is already one or the road mask
  is zero preserves the exact cost. Canonical rules before version 12 still
  ignore roads, and pre-version-8 terrain blockers use the original function and
  original rejection text.
- Canonical domain/ocean eligibility is held only during synchronous planning.
  Every new query recomputes it from current formations, technology and rules.
  Actual route execution still revalidates each step through the original
  blocker and movement-cost path. The observation path likewise refreshes army
  capability and dynamic blockers each call.
- The retained warm/cold evidence contains 44 full-result comparisons each,
  exact output hashes and source nonmutation checks. All 44 candidate medians
  improve in each run; this is bounded query evidence, not a campaign gate.
  The new canonical regression uses 17 independently captured original
  results/routes/full-state hashes and genuine serializer/loader round trips.
  The author's initial focused final run reported 108/108 passing tests.

The author addressed the review's coverage request by adding an explicit
duplicate-cell and copied-geography regression for the combined map: the last
terrain value and last truthy road mask agree with the original representation,
mutating source cell objects leaves the private snapshot unchanged, and a fresh
observation recomputes it. The focused rerun reports 109/109 passing tests.
Parent integration owns typecheck, lint, wider historical/AI verification and
unchanged full-suite timing acceptance.
