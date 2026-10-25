# Worker stewardship browser and individual-control review

Reviewed 2026-10-25 by the `next_governor_audit` subagent, after the parent reported twelve targeted production browser cases passing in approximately 1.4 minutes. This review read the retained evidence and inspected the actual PNG pixels; it did not run tests, modify runtime code or repeat the browser run.

## Independence and scope

The reviewer authored the group worker-policy controls, transport integration and group browser scenarios. Those observations are an author self-review, **not an independent group implementation review**. The individual `WorkerPolicy` component, its CSS, `SettlementLand` integration and individual browser journeys were authored by another agent and received independent source/visual review here. No claim is made that these screenshots complete accessibility, browser compatibility, organic mature-realm or release acceptance.

## Individual controls: source and visible behavior

Read `apps/web/src/worker-policy.tsx`, `worker-policy.css`, the worker-policy integration in `land.tsx`, and the individual component test coverage. The component consumes owned policy observations and issues only `setWorkerPolicy`; it does not rank cells or implement competing rules. Undefined capability, a missing hearth or a foreign hearth hides it. Its editor initializes from the current canonical focus and remounts when that focus changes. Busy/query-disabled states disable policy commands. Policy controls rely on the compact current observation, while manual tile assignments continue to use the existing scoped land-query path.

The copy correctly distinguishes immediate allocation from reassignment after growth/work for the following harvest, free worker allocation from paid land actions, explicit manual takeover, temporary siege/occupation pauses, and ownership loss. It warns that focused allocation may leave a resource deposit unworked. The manual Assign/Remove worker action has an adjacent warning that it ends the policy.

The generated-growth panel is readable at native resolution: Food, `2 / 2 assigned`, Apply and Return to manual control are distinct and neither button overlaps its explanatory text. The narrow 390×844 image at 130% text shows a full-width priority control, wrapped explanations and both actions inside the selected-orders window. Its scroll position intentionally omits the top of the disclosure; this is not a screenshot of the entire panel at once. No blocking visual or individual-source defect was found in the reviewed scope.

Evidence read:

- [Generated growth](browser-results/production-worker-policy-a-a2ff7--its-standing-worker-policy/growth.json): generated tiny/short/two-realm seed 20260905, no authored population; one player policy command; population/assignment reaches two by turn 3; nine archived records; grown and restored hash `a046b260`.
- [Manual takeover](browser-results/production-worker-policy-w-28fcc-dth-with-exact-saved-replay/manual.json): ordinary founding on seed 17 before a from-save journal, no authored geography/resources/population; Industry selects cell 704 and Food selects cell 753; manual takeover is recorded in a three-record archive; focused hash `5627091c`, manual hash `386fb0d5`; width 390 at 130%.

## Group and recovery imagery: author self-review

The desktop 130% image shows 30 accepted orders, the second receipt page with the final five named hearths, and disabled zero-selection action buttons. The narrow image shows readable wrapped consequences, a 30-success receipt and unchecked registry entries; stacked action buttons fit the window. These are authored scale workflows, not naturally earned territory.

[Group evidence](browser-results/production-group-worker-po-97b9b-val-and-restoration-at-130-/group-worker-policies-evidence.json) records 30 owned hearths, 128 armies, two wars, one ordinary pre-archive Industry policy, 29 retained checks after selective removal, 61 final records, and no implicit autosave. Recorded hashes are `47ca26c4` before, `604b12cd` after grants and `9932f7c3` after removal.

All three inspected recovery screenshots—missing results, wrong hearth and worker crash—show the selected hearth retained and commands/End turn disabled. The screenshots stop near the bottom of the policy section: the inline recovery explanation lies below that captured scroll position, and the footer message is partly obscured by the open registry. Therefore these PNGs establish the lock/selection presentation, **not the complete visibility of the recovery instructions**. The actual recovery/retry assertions belong to the production scenarios. These images are useful retained diagnostics but are not proposed as public illustrations.

## Native public candidate

**Accept for a small supporting journal illustration, with a factual caption and links to the generated-growth evidence.** Use the exact retained file, without resizing, repainting or recompression:

`browser-results/production-worker-policy-a-a2ff7--its-standing-worker-policy/worker-policy-growth-summary-native.png`

- PNG dimensions: **806×45**.
- Exact file size: **13,857 bytes**.
- SHA-256: `b2187886f1ea66aa11e085ffb403833d6a776e4680a08a1e318f0cb61d098666`.
- Visible content: the actual Worker policy summary, `Food · 2 / 2 assigned`.
- Suggested caption: “At turn 3, this generated hearth’s Food policy has assigned both available workers after population growth.”

The strip is sharp and legible at native size, but contains no before-state, turn counter or town identity. Its caption must obtain those facts from `growth.json` and the journey; the image alone does not demonstrate the passage of time, all five priorities, manual takeover or mature-realm automation. It is a supporting illustration, not a standalone proof panel.

Against the stated remaining public image allowance of **42,033 bytes**, this exact candidate leaves **28,176 bytes**. Starting from the previously recorded 3,627,983-byte image total, it would bring the total to **3,641,840 bytes**, below the unchanged 3,670,016-byte cap. This calculation approves one candidate only; publication must still validate the actual updated manifest and preserve the exact reviewed bytes.

## Inspected image inventory

All paths below are within this packet's `browser-results/` directory. Dimensions and byte counts were read from the exact PNG files, not inferred from rendered previews.

| File | Pixels | Bytes |
| --- | --- | ---: |
| `production-worker-policy-a-a2ff7--its-standing-worker-policy/worker-policy-generated-growth.png` | 806×401 | 150,633 |
| `production-worker-policy-a-a2ff7--its-standing-worker-policy/worker-policy-growth-summary-native.png` | 806×45 | 13,857 |
| `production-worker-policy-w-28fcc-dth-with-exact-saved-replay/worker-policy-narrow-130.png` | 390×844 | 231,961 |
| `production-group-worker-po-97b9b-val-and-restoration-at-130-/group-worker-policies-desktop-130.png` | 1440×1000 | 628,291 |
| `production-group-worker-po-97b9b-val-and-restoration-at-130-/group-worker-policies-narrow-130.png` | 390×844 | 176,526 |
| `production-group-worker-po-a00f2-on-and-requires-restoration/worker-policy-missing-results-recovery.png` | 1440×1000 | 420,021 |
| `production-group-worker-po-99e45-on-and-requires-restoration/worker-policy-wrong-hearth-recovery.png` | 1440×1000 | 420,036 |
| `production-group-worker-po-0890a-on-and-requires-restoration/worker-policy-worker-crash-recovery.png` | 1440×1000 | 419,757 |

M3, organic mature-realm acceptance, wider land governors/paid automation, cross-browser accessibility and all existing release gates remain open. This review adds evidence for the implemented worker-allocation slice only.
