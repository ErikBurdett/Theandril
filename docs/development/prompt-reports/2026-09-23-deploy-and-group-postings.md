# Deploy the changes and continue development — 2026-09-23

## Prompt

“Deploy the changes, and continue development.” This follows the request to use the DHARMA Theandril tracker and continue toward 1.0.

## Delivered

- Published the previously verified fleet-provisions work as `b623c2c91d4d852cba710f2d996c28a6b1b5d624` (ACT-35): finite stores, hull/passenger shortages, harbor replenishment and observed AI returns/staging.
- Continued ACT-32 with playable group army postings, committed as `3ae1581089411a76ecfd08a8f5f811258c4f77f6`: select up to 128 land armies ashore across pages/search, Hold/Join where they stand or at one owned hearth, clear postings, inspect partial refusals and override one member independently.
- Published both features, illustrated dispatches 05/06 and the current roadmap as **`36fea99729452651c09cc7d5ddae81bb1dca4db2`**. The live game and articles are verified.
- Rebuilt the user’s DHARMA project page. ACT-35 is done; ACT-32 and ACT-33 remain doing with current prompts. M3/M4 and all 15 release gates remain open.

## Changed

The continuation changes the web registry, a bounded worker transport, main-thread request correlation and recovery, and focused tests. Each request records ordinary simulation commands in stable order and publishes one permitted final view. It introduces no new simulation rule, AI behavior, canonical state, save version, content seal or campaign price. Rules/save stay 31 and content stays `015468d1`.

Public journal content, exact screenshot provenance, the existing roadmap and canonical status now describe actual shipped behavior. Architecture 0039, the work packets and the [evidence directory](../2026-09-23-deploy-and-group-postings/README.md) retain implementation, review and publication boundaries.

## Verified

- **1,878/1,878 headless tests**, 234 files, 28.65s: [final integrated log](../2026-09-23-deploy-and-group-postings/publication-tests.log).
- **7/7 affected development browser journeys**, 42.5s: 100 owned armies/40 hearths, keyboard/search/paging, partial canonical refusal, individual override, clear/save/restore, 390px layout and two damaged-response recovery cases.
- **28/28 production Pages journeys locally**, 32.5s, and **28/28 against the live site**, 50.0s. These include actual group commands and manual save restoration without development hooks, approved assets, battles, map actions, watch fog and journal/roadmap reading at narrow widths and enlarged text. Counts describe separate, overlapping suites and are not summed.
- Typecheck, lint, content/art validation, production build and 23 focused publication checks pass. Code review found a pending-request error-path defect; it was fixed and proved with real-worker fault injection. Independent factual reviews and parent screenshot inspection passed.
- The authored 100-army worker comparison preserves exact archive/replay/hash while transferring 531,302 bytes instead of 51,416,921: one state response instead of 100. Timing is an illustrative harness sample, not a whole-campaign or browser speed guarantee.
- [Verify build](https://github.com/ErikBurdett/Theandril/actions/runs/35912055298) and [Pages deployment](https://github.com/ErikBurdett/Theandril/actions/runs/35912055300) passed for the release commit. [Live readback](../2026-09-23-deploy-and-group-postings/live-readback.json) verifies that exact ledger revision, both articles and unchanged image bytes. [Tracker readback](../2026-09-23-deploy-and-group-postings/tracker-readback.json) verifies the generated local page.
- Work occurred in the primary checkout `/home/telephoneheater/Work/Theandril`. `master` was pushed and matched `origin/master` at the live-verified release. This final documentation commit records those results without changing runtime code. All task-owned Vite/preview processes stopped.

## Not done / caveats

This is a development deployment, not 1.0 acceptance. ACT-32/M3 still lacks theater strategy, patrol/escort roles, durable named groups, broader templates and combined mature-campaign automation proof. Group selection covers land armies ashore; fleets and passengers retain individual controls. A group is a sequence of commands with reported partial outcomes, not an atomic transaction.

ACT-33/M4 still needs material supply costs, trade, taxation, treaty access and broader naval coordination/recovery. Fleet pacing remains Standard 234, Long 342 and Epic 379 on the retained headline seed: Standard/Long exceed approximate 200/300 targets. No new pacing run was needed for unchanged simulation/AI rules. All15 whole release gates remain open.

Retained failed attempts were test-authoring assumptions (empty packet header size, historical-save continuation, an existing button label and old dispatch count) or sandbox IPC restrictions, not suppressed product defects. No timeout, proxy bound or rules price was weakened.

The tracker’s preexisting delivered/remaining-bullet measure now reflects the current public catalogue: 53/102 bullets, six of 23 completed items. Editorial regrouping changed that count; it is explicitly not a stable-scope release percentage.

## Follow-ups

Continue the next dependency-ready M3 coordinated-role or policy slice, or M4 material/trade/treaty slice, from the updated tracker prompts. Preserve ordinary command authority, individual overrides, permitted knowledge and exact save/replay. Measure headline campaign pacing for any new rule or AI policy that can affect campaign resolution.
