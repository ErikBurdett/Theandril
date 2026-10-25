# Change patrol policies across the checked companies

**Dispatch 18 preparation — outside runtime.** Proposed ID `group-patrols`. Implementation revision, integrated acceptance, publication identity and illustration remain pending. Preserve all seventeen existing dispatches, their source pins and approved image bytes. This packet is an editorial draft, not permission to report pending browser or release results as passed.

## Player story

The registry can now find a paused patrol, but changing a policy across many companies still requires opening each company's orders. The implemented local continuation adds a **Group patrols** disclosure using the same checked armies as existing group orders. Three explicit actions change only matching saved policies: **Pause enabled patrols**, **Resume paused patrols**, and **Remove selected patrols**, each with its current count.

Checked armies outside the current filter are included, and the panel says so. An army without a patrol, or already in the requested enabled/paused state, receives no command and stays checked. Confirmed accepted armies leave the selection; refused armies remain with their actual reasons. Existing selection limits remain at 128 owned land armies ashore. An oversized external selection produces no batch rather than silently applying its first 128 entries.

These actions change patrol policy, not current travel. Pause and Remove stop future assignments. Resume allows future assignments and does not resume a paused route. Existing issued travel continues unchanged; Group travel cancellation is a separate action. Removal discards the saved endpoints and war option. A selected paused policy with **Pause when war begins** receives an explicit warning: resuming during war can pause it again next turn. Group controls do not rewrite that option.

## One bounded request, ordinary decisions

The UI snapshots the selected action with the current campaign hash. The main thread and worker check that hash before applying anything. The worker accepts one homogeneous action for up to 128 distinct army IDs from the current seat, executes ordinary `setPatrolEnabled` or `clearPatrol` commands in stable ID order, and returns one final state with per-army results. No endpoint-creation command, new canonical rule, path search or per-turn policy is added.

Canonical refusals are different from a damaged or missing result. Results must match the exact submitted IDs, order and faction. An interrupted recording, malformed response or worker crash may happen after commands have applied; those cases use the existing saved-restoration recovery lock. They do not silently retry or treat an uncertain outcome as a harmless refusal. The UI retains selection on rejected promises.

While a request is pending, the panel's immediate guard prevents repeat submission and the registry locks checks, filters, pagination, other group actions and parent navigation. The result summary states accepted, refused and unaffected counts. Refused rows come first with their details open; results remain paged at 25 rows. Filtering and paging do not discard still-checked companies.

## Actual evidence available at this draft checkpoint

The UI owner's focused run passes **34 tests across five files** in `docs/development/2026-10-24-group-patrols/ui-focused-bounded.log`; scoped lint passes. These cover the canonical hundred-policy helper, actual pause/resume/removal preserving issued routes and spent movement, strict saves, observed ownership/domain boundaries, historical absence, oversized whole-selection refusal, action counts and bounded refusal-first results. Static rendering is not asynchronous browser acceptance.

The first focused UI run retains one test-only failure: it assumed a specific named company appeared on the first stable-ID page. The corrected assertion checks that all 25 rendered checkboxes share the registry lock. Independent main/worker source review records its exact inspected bytes and no blocking source finding; source review is not proof that recovery scenarios have already executed.

The simulation owner reports focused worker/request checks, while the parent is running integrated checks. Record their final file lists, counts and retained logs after completion, keeping overlapping scopes non-additive. **Do not invent full-suite counts, browser passes, source revision, final hashes, timing improvements or campaign outcomes here.** No new benchmark or pacing result is claimed by this draft. UI/transport changes do not by themselves prove whole-scale or release acceptance.

## Planned real browser story

The prepared normal journey uses an explicitly authored 101-company campaign with 99 saved policies, ordinary active and interrupted travel, a war-pause option and two selected companies without patrols. Infrastructure and population are authored; setup orders and movement/blockers must be real recorded commands. It is not an organically grown empire.

The test intends to pause 49 enabled policies, resume the resulting 99 paused policies and remove those 99 policies, while selected unaffected armies remain checked. Expected counts are fixture/test design, **not executed outcomes at this checkpoint**. Each phase must retain all army and route bytes, exact exported replay and saved restoration; 390px/130%-text keyboard interaction and result-page access must be exercised. The parent also owns separate missing-results, wrong-army and worker-crash journeys after a real batch. Report those as transport fault injections, not naturally occurring campaign refusals.

Final prose should distinguish real canonical mixed-refusal worker checks from a normal player batch in which all selected current policies are valid. Never manufacture a player-facing refusal merely to make the screenshot look comprehensive. Public journey controls, actual records and final state hashes must determine the narrative.

## Image plan and existing budget

The normal browser journey is prepared to capture the actual three-button action row at native dimensions, plus full desktop and 390px/130%-text context. Inspect the original pixels after the coordinated run. If the control capture is readable and truthfully depicts its particular action state, prefer it as one exact copied PNG. Its caption must name the authored fixture, real viewport/text setting and locator bounds, and distinguish a pre-action view from an accepted result.

Current journal inventory after dispatch 17 is **3,481,838 bytes** under the unchanged **3,670,016-byte (3.5 MiB)** cap, leaving **188,178 bytes**. Measure the actual native PNG before selection. Do not resize, re-encode, composite, crop after capture or inflate the cap routinely. If no useful new capture fits, reuse the approved `registry-paused-selector` with an explicit historical-context caption: it illustrates dispatch 17's filter, not the new three group actions. Link the actual full new captures as source-pinned evidence outside journal inventory.

Required provenance: immutable implementation revision, original test/capture path, observer/fixture, viewport/device/text scale, exact locator and dimensions, source/output hash and byte identity, transform None, factual caption/alt text and visual-review record. No generator applies to real browser pixels. Passing a budget assertion does not replace native visual review or inspection of the final article at desktop/narrow sizes.

## Scope and contributor handoff

This extends the existing empire-management workflow without changing the agreed gameplay scope or adding a new release obligation. It does not create patrol endpoints in bulk, resume routes, remove independent postings or theaters, broaden embarked selection, or add an automatic governor. M3, organically developed mature-realm acceptance and all fifteen release gates remain open. Prior unresolved campaign pacing remains separate; this action convenience does not establish a fix for DH-021.

Likely final evidence links: feature README and exact acceptance logs; `ui-implementation.md`; independent source reviews; `group-patrols.tsx`; request validation and worker batching; normal public-control journey and exported record evidence; separate recovery-test outcomes; actual native image review. Prepare publication source only after the implementation commit pin and independent factual review are available. Deployment remains a development checkpoint, not 1.0 acceptance.
