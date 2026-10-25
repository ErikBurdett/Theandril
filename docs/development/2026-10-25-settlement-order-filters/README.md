# Settlement order inventory

The settlement registry now exposes All hearths, No production, Without charters and Charters waiting. Search composes with the overlapping counts before stable 25-row paging. Checked hearths persist across filters; the existing group charter controls disclose checked actors outside the current filter and issue orders only on explicit application.

The projection uses already-observed owned settlement and charter facts. Empty queues remain in No production even when a charter has a candidate for the next turn. Without charters includes towns with current work. Charters waiting requires an empty queue and a canonical non-null blocker; completed building programs and deliberate limits are ordinary reasons, not automatically defects. Current queues take precedence, and candidates are not promised purchases from a shared treasury. A native expandable explanation and the Map guide describe these distinctions.

## Implementation and boundaries

`settlement-order-status.ts` builds detached own-only metadata in O(observed settlements + charters) time and space. Counts operate on the searched owned directory before paging. `realm-navigation.tsx` integrates the filter with existing sorting, selected rows, checks and busy locks. Visible registry rows remain capped at 25. This introduces no canonical eligibility rule, command, worker request, saved field or per-frame callback. Rules/save 35 and content 015468d1 remain unchanged. There is no new timing, transfer or pacing claim.

The independent [source review](source-review.md) checks parent integration, including search/page behavior, own-only facts, existing locks and wording. The projection author discloses their own work separately from the reviewed parent changes.

## Verification checkpoints

The first full suite passes **2,362 tests across 288 files in 64.77 seconds** ([log](full-tests.log)); the focused scope passes 24 tests across 4 files in 1.17 seconds ([log](focused.log)). Typecheck, lint and the Pages build pass. The initial browser run passes the new workflow plus normal charter/template journeys: **3 cases in 31.5 seconds**, new workflow 20.6 seconds ([log](browser.log)). A mistyped additional filename did not select the army-filter case; its correctly named separate run passes **1 case in 13.0 seconds** ([log](army-regression.log)). These are four distinct affected journeys, not four in the first invocation.

Narrow native inspection found the long explanation occupied too much room above controls. It now uses a default-closed native disclosure with a 44px summary. The original passing screenshots remain retained, and final source/browser checks are recorded below after this layout refinement. No test timeout or assertion was weakened.

The authored Huge fixture contains 30 owned hearths, 128 armies and two wars. Thirty ordinary setup records create counts 30/24/10/5 at hash 503329a2. Five waiting charters plus one queued unchartered hearth outside the filter receive six explicit changes. The expected 36-record result is bb648af6, counts 30/24/9/0, with queues, treasury, settlements, armies, routes, postings and patrols unchanged. [Fixture authoring and retained strict-loader correction](fixture-authoring-note.md). This is authored infrastructure, not an organically grown empire or proof of governor-program completeness.

## Remaining work

ACT-32/M3, DH-021, R06 and all 15 release gates remain open. Mobile escorts, broader governors/programs, organic mature-realm acceptance and wider performance/release coverage remain separate. This slice adds an existing-order management workflow without changing gameplay scope or deferring an accepted gate.

## Final implementation acceptance

After the disclosure refinement, the full suite passes **2,362 tests across 288 files in 63.88 seconds** ([final log](full-tests-final.log)); [typecheck](typecheck-disclosure.log), [lint](lint-disclosure.log) and [Pages build](build-disclosure.log) pass. The final new production journey passes in **21.3 seconds overall, 20.3 seconds for the case** ([log](browser-final.log)), including real keyboard opening and closing of the explanation. Its snapshots and exact saved results remain consistent with the initial run. The three earlier regression journeys are separate, overlapping acceptance; the new workflow was rerun after the layout change. [Final source hashes](source.json).

All three final portable exports pass independent strict decoding and exact canonical replay, matching the six ordinary charter commands and preserved state ([review](final-export-review.json)). All four final native captures were inspected; the exact 340×71, 7,683-byte selector capture is approved as a control detail, with authored-scenario and framing limits explicit ([image review](image-review.json)). The parent also inspected the final narrow layout and selector; the disclosure leaves the six-selected/one-outside-filter count visible without expanding the explanation.
