# Final patrol recovery evidence review

Date: 2026-10-24. This review compares the local README, draft dispatch, retained
logs and machine-readable evidence. The reviewer authored the separate nine-case
recovery test file, so this is an independent check of the parent's report and
runtime work, not independent authorship of those tests. Only this review file
was edited during this task. No new runtime tests or measurements were run.

## Verdict and requested documentation corrections

No blocking factual or runtime-boundary finding in the inspected recovery claims.
Two small README updates were requested while the parent was completing it:

1. The isolated observation exclusion matrix contains **18** variants, including
   the added caravan-bearing army case, rather than the stated seventeen.
2. Replace the pending full-suite/performance placeholder with the completed
   results below and their scope limitations. The evidence is already retained.

The recovery prompt report did not yet exist when inspected; this review does
not imply that it has been read or approved. The dispatch remains a local draft,
not publication authorization. Pacing and release acceptance are not granted.

## Results checked against retained evidence

- [Full tests](full-tests.log): 275 files and 2,217 tests pass in 61.66 seconds.
  Focused test results overlap this suite and must not be added to its count.
- [Production journeys](production.log): two pass in 11.2 seconds. The source
  test imports the genuine turn-58 snapshot into a new explicitly from-save
  Watch archive, steps a real round, checks the exported `resumeMovement` record
  for `army.198` and changed location, then checks exact saved archive/hash
  restoration. It asserts development hooks are absent. This is a new round
  from a mid-round snapshot, not the original campaign's missing earlier history.
- [Final pacing log](pacing-final.log) and [comparison](pacing-comparison.json):
  for seeds 20260905/06/07, Standard ends at **219/193/214**, Long at
  **336/304/286**, and Epic at **374/278/320**. All nine end in prosperity.
  The original Long seed remains one turn later than the previous patrol
  checkpoint and 25 later than retained rules 34. Two Epic seeds end below the
  stated 350–400 target. The README and dispatch keep these adverse results
  visible and do not claim recovery fixed campaign pacing.
- Submitted-command refusals and theater route refusals are zero in the final
  matrix. Patrol refusals are a separate field: Standard seed 20260905 has one.
  The [Standard diagnostic equivalence](diagnosis-standard-equivalence.json)
  identifies the turn-81 event for Mire Courts' `army.198`: no safe known route
  toward hex 10368. Its [observed patrol samples](diagnosis-standard/patrol-states.jsonl)
  show `lastError` and `waiting` at turn 81, then `lastAttemptTurn: 82`, null error,
  `ready`, and the opposite target at turn 82. This was a canonical patrol queue
  refusal that cleared, not a rejected submitted AI resume command. The existing
  pacing console's `automaticRefusals` label counts theaters and cannot support
  an all-automation zero-refusal claim.
- [Benchmark JSON](recovery-benchmark.json) and [successful log](recovery-benchmark-fixed.log):
  all four authored cases pass. Median isolated planner times are Huge safe
  **0.666 ms**, Huge blocked **0.255 ms**, Legendary safe **0.984 ms**, and
  Legendary blocked **0.667 ms**. Safe cases use four previews/four accepted
  resumes and preserve 124 other paused routes. Blocked cases use no previews or
  commands and preserve all 128 routes. There are three fresh-observation samples
  after one warmup. These are absolute scoped measurements, excluding observation
  construction, simulation execution, full AI rounds, campaigns and rendering;
  they are neither a measured speedup nor organic-scale acceptance.
- The [first benchmark failure](recovery-benchmark.log) is retained. Strict save
  validation rejected hostile factions sharing a cell in the authored fixture.
  The corrected setup separates faction cells; there is no weakened save rule.
  The resulting 31/39 distant hostile cells plus the optional nearby blocker are
  disclosed, avoiding a claim of geographically broad enemy fronts.

## Authority, source identity and image interpretation

Comparing current files with the 55-file baseline AI manifest identifies only
`packages/ai/src/patrols.ts` as changed among those archived files. The new
`packages/ai/src/patrol-recovery.ts` supplies the recovery policy. The benchmark's
eight recorded source hashes all match the files inspected in this review,
including canonical movement and patrol scheduling. The recovery runtime uses
ordinary observed planning and `resumeMovement`; it does not introduce a new
canonical command, schema, rule, player auto-resume path or UI control.

Inspected runtime identities:

| File | SHA-256 |
| --- | --- |
| `packages/ai/src/patrols.ts` | `2e54a0c8fc03160c891eb475095956099eb5c9e568e546cd3569de652179f82d` |
| `packages/ai/src/patrol-recovery.ts` | `45d993c8cd8be96acb6f46729e6c8f38b224383871b640eb5b1f268e34ff17ff` |
| `packages/sim/src/movement.ts` | `f772c208c8065079d7e1ede00e4f5b580532c81a885acfa966f14be4bcbbfce3` |
| `packages/sim/src/patrols.ts` | `ee76ecf7cb7d2a41a71beea5a1df8af9d46842fa355f48d1f71789f0cac0cc15` |

The source rejects disabled policies, overrides, absent supply, immobile or
embarked armies, lost endpoints, local observed wartime threats and mismatched
or multiple waypoints. It retains actor reservations and issues at most four
resumes after at most four previews. Arrived single legs use the ordinary resume
command's cancellation behavior. The docs correctly disclose indistinguishable
same-target manual routes during explicit AI takeover. Canonical player travel
still needs an explicit action; the production Watch flow is not evidence of
automatic player resume.

The actual [native production capture](production-results/patrol-recovery-production-1df3d-story-through-save-recovery/production-watch-patrol-recovered.png)
was opened during this review. It shows **Ashen Compact**, **Turn 59**, **AI watch
paused**, and the partial-archive notice. The dispatch's caption and alt text
match those pixels. It is not an image of the foreign Mire company's recovery
through hidden fog; its movement is demonstrated by the archive assertions.
No clipping or misleading image label was found in the inspected capture.

ACT-32/M3, DH-021, broader automation and all fifteen release gates remain open
in the inspected narrative. The packet supports a repaired stalled-order policy
with bounded evidence, not campaign balance acceptance or a complete 1.0 claim.

## Final disposition and prompt-report readback

The parent applied both requested README corrections: the exclusion count now
says eighteen, and the completed full-suite and benchmark results replace the
pending placeholder with the measured numbers and explicit timing exclusions.
Both corrections were read back and agree with the evidence above.

The subsequently created [prompt report](../prompt-reports/2026-10-24-patrol-recovery.md)
was read in full. Its delivered behavior, test counts, production coverage,
benchmark values, nine campaign lengths and remaining pacing limitations agree
with the retained evidence inspected here. It correctly distinguishes the one
automatic patrol refusal from submitted-command and theater refusals, includes
its turn-82 clearance, discloses same-target manual-route ambiguity, and preserves
the partial-history Watch and Ashen-observer image limitations. It does not claim
automatic player resume, canonical/schema changes, pacing acceptance, publication
or release-gate completion. No further factual correction was requested.

This closes the two documentation findings and the earlier prompt-report review
gap only. It does not expand the scope of tests, authorize publication or close
any of the stated 1.0 gates.
