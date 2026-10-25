import type { Dispatch } from './types';

export const groupPatrolDispatch: Dispatch = {
  "publication": "published",
  "sourceRevision": "8d880eb60cdca549d5ff1086ef95e095e81feea5",
  "sequence": 18,
  "id": "group-patrols",
  "edition": "18",
  "title": "Change patrol policies across the checked companies",
  "subtitle": "25 October 2026 · Group patrol controls",
  "summary": "Pause, resume or remove existing patrol policies across the companies you checked. Issued travel stays intact, unaffected armies remain selected, and every accepted order keeps its saved history.",
  "topic": "Engineering",
  "tags": [
    "Empire management",
    "Patrols",
    "Group orders",
    "Saved campaigns",
    "Accessibility"
  ],
  "status": "Reviewed checkpoint",
  "checkpoint": "Group patrol controls · rules 35",
  "image": "group-patrol-actions",
  "takeaways": [
    "Pause enabled patrols, resume paused patrols or remove selected policies across up to 128 checked land armies ashore.",
    "Actions include checked companies outside the filter and preserve issued travel. Accepted orders leave the checks; unaffected or refused armies stay.",
    "An authored 101-company production journey preserves exact 352-record history. Separate reply-failure recovery and bounded Node-host measurements do not close the release gates."
  ],
  "sections": [
    {
      "id": "checked-companies",
      "title": "One choice for the checked companies",
      "paragraphs": [
        "A frontier watch can have many saved patrols spread across registry pages. Pausing each policy through individual orders takes repeated navigation. Group patrols now offers three explicit actions over the same checked companies: Pause enabled patrols, Resume paused patrols and Remove selected patrols, each with its current count.",
        "Actions include checked armies outside the current filter. The panel says how many are outside, and changing search or pages keeps those checks. Armies without a patrol, or already in the requested state, receive no command and remain checked. Confirmed accepted armies leave the selection; refused armies remain with the actual reason. Up to 128 owned land armies ashore can be selected.",
        "The lead image shows the actual three-button detail after resuming 99 policies and before removing them: Pause 99, disabled Resume 0, Remove 99. It comes from an explicitly authored 101-company campaign at a 390-pixel viewport and 130% text. Its native 318-by-149 pixels exclude the selection explanation and results; the full linked capture supplies context."
      ]
    },
    {
      "id": "policy-and-travel",
      "title": "Change the policy, preserve issued travel",
      "paragraphs": [
        "Pause and Remove stop future patrol assignments. Resume allows future assignments; it does not resume a paused travel route. Existing issued travel continues unchanged. Group travel has a separate Cancel travel routes action when that is also the intended order.",
        "Removing a patrol discards its saved endpoints and war option. Resuming preserves the existing configuration. If a selected paused patrol has Pause when war begins enabled, the panel warns that resuming during war can pause that policy again next turn. These controls do not create new endpoints, rewrite the war option, or clear independent postings.",
        "While the batch is pending, selection, filters, paging, other group actions and parent navigation are locked. Results report accepted, refused and unaffected counts, with refusal details first and at most 25 rows per result page. The player can inspect the remaining checks before deciding what to do next."
      ]
    },
    {
      "id": "one-real-batch",
      "title": "Three actions and an exact saved history",
      "paragraphs": [
        "The production journey imports an authored open-land campaign with 101 own companies, two hearths, treasury and a foreign obstruction guard. Its 105 setup records use ordinary commands to establish 99 patrols, two postings, active travel and an actually interrupted route. The infrastructure and population are authored; this is not an organically developed large realm.",
        "Pause accepts 49 orders and retains 52 unaffected checks. Resume then accepts 99 and retains two; Remove accepts 99 and retains two. All army, route and posting bytes remain identical, including one paused blocked route and one active route whose company has spent its movement. The war option survives until removal. The browser exercises a real pending filter lock, outside-filter selection and keyboard removal at 390px and 130% text.",
        "The archive grows from 105 to 154, 253 and 352 records. Canonical hashes are c6f43460, acebff08, f89dea4d and a488bb10. Each phase replays exactly; export and manual save/reload preserve the exact 352-record final archive. No End turn is needed to change these policies."
      ]
    },
    {
      "id": "correlated-results",
      "title": "When a result cannot be trusted",
      "paragraphs": [
        "The UI sends one homogeneous action with the current campaign hash. The main thread and worker both check that hash before execution. The worker validates up to 128 distinct army IDs for the current seat, applies ordinary setPatrolEnabled or clearPatrol commands in stable ID order and returns one final state with per-army results. Simulation remains the sole rule authority.",
        "A canonical refusal is different from a response that cannot be matched to the request. Missing results, an unexpected army or a worker crash can arrive after some orders have applied. The client retains the checks, locks further play and requires saved restoration; it does not silently retry an uncertain batch. Exact response identity and order are checked before the state is displayed.",
        "Three production recovery cases deliberately damage the native worker reply or inject its error event after a real one-policy mutation. Each restores the actual eight-record manual save and retries to the correct nine-record archive. These are transport fault injections, not physical process-kill proof or naturally occurring campaign refusals. Separate worker tests cover genuine partial canonical refusals and interrupted recording."
      ]
    },
    {
      "id": "verified-scope",
      "title": "Verified locally, with the costs visible",
      "paragraphs": [
        "The 24 October implementation checkpoint passes 2,339 tests across 285 files in 62.78 seconds, with typecheck, lint and the production build passing. Seven affected production journeys pass on their first integrated run in 44.5 seconds: the new normal workflow, three new recovery cases and three existing registry/travel/posting journeys. The normal case takes 9.0 seconds. Focused and full test scopes overlap and are not additive; browser duration is functional execution metadata, not a performance result. Publication checks are recorded separately.",
        "Six single batch measurements execute the real worker module in a same-thread Node host with structuredClone and fake IndexedDB. Each action processes 128 policies on Huge or Legendary fixtures, with ordinary local fog and one existing route. Pause/Resume/Remove request-through-response samples are 330.824/382.883/389.917 milliseconds on Huge and 668.912/634.563/673.485 on Legendary. Each produces 128 records, one autosave and one final state, with no detail or path-query request and exact serial-state, replay and autosave matches.",
        "The measured fixtures have 196,608/307,200 cells and 1,581/4,028 total armies, with 128 authored owned guards and only 61 observed cells. Setup, import, export and replay are outside the timed batch. These are six single samples, not medians, browser Worker latency, physical-storage latency, frame-time results or whole-turn acceptance. Serialization and persistence still contribute substantial cost; the source-linked raw results retain the components.",
        "The exact native PNG adds 31,103 bytes, bringing the journal inventory to 3,512,941 bytes under the unchanged 3.5 MiB cap. No crop, resize or re-encoding was applied. Earlier focused authoring failures and their corrections remain in the packet, including the UI test that assumed a named company appeared on the first stable-ID page."
      ]
    },
    {
      "id": "next-delegation",
      "title": "The larger delegation workflow remains open",
      "paragraphs": [
        "Rules/save remain 35 and content remains 015468d1. This changes player controls and bounded worker transport, not canonical rules, AI, prices or automatic turn behavior. No new pacing run is claimed. Earlier unresolved Long and early-Epic outcomes remain separate evidence; DH-021 remains open.",
        "This advances existing empire-management work. No new gameplay obligation was added or removed. It does not add bulk endpoint creation, multi-step programs, escorts, governors or automatic player travel recovery. M3, organically developed mature-realm acceptance and all fifteen release gates remain open.",
        "Contributors can build on the shared registry selection and ordinary-command boundary while preserving exact results, pending locks and saved history. Broader delegation should be measured in sustained mature campaigns, with genuine player choices and recovery evidence. Deployment remains a development checkpoint, not 1.0 acceptance."
      ]
    }
  ],
  "evidence": [
    {
      "label": "Group patrol implementation and acceptance",
      "path": "docs/development/2026-10-24-group-patrols/README.md",
      "note": "Integrated source checks, seven real production journeys and bounded worker measurements."
    },
    {
      "label": "Independent source review",
      "path": "docs/development/2026-10-24-group-patrols/worker-client-review.md",
      "note": "Canonical command boundary, expected-hash guard and exact response correlation."
    },
    {
      "label": "Native image review",
      "path": "docs/development/2026-10-24-group-patrols/image-review.md",
      "note": "Six original captures inspected; control-only illustration and unchanged budget."
    },
    {
      "label": "Actual browser evidence",
      "path": "docs/development/2026-10-24-group-patrols/browser-evidence.json",
      "note": "Source/image identities, exact exported archives and the three fault-injection boundaries."
    },
    {
      "label": "Worker batch measurements",
      "path": "docs/development/2026-10-24-group-patrols/worker-benchmark-results.json",
      "note": "Six single Node-host samples with fake IndexedDB, scopes and exact state checks."
    },
    {
      "label": "Desktop selection context",
      "path": "docs/development/2026-10-24-group-patrols/browser-first-results/production-group-patrols-p-8d403-hout-changing-issued-travel/group-patrol-pause-desktop.png",
      "note": "Authored pre-Pause view:101 selected, 51 outside filter and 49/50/99 eligible policies."
    },
    {
      "label": "Enlarged-text controls before removal",
      "path": "docs/development/2026-10-24-group-patrols/browser-first-results/production-group-patrols-p-8d403-hout-changing-issued-travel/group-patrol-remove-narrow-130.png",
      "note": "Native 390px/130% view after Resume; all selected companies remain outside the empty paused cohort."
    },
    {
      "label": "Exact policy command evidence",
      "path": "docs/development/2026-10-24-group-patrols/browser-first-results/production-group-patrols-p-8d403-hout-changing-issued-travel/group-patrol-evidence.json",
      "note": "Actual 49/99/99 accepted orders and exact 352-record final history."
    },
    {
      "label": "Group patrol controls",
      "path": "apps/web/src/group-patrols.tsx",
      "note": "Explicit action counts, route distinction, pending guards and bounded results."
    },
    {
      "label": "Actual public-control journey",
      "path": "tests/production/group-patrols.spec.ts",
      "note": "Portable import, real worker, keyboard removal and exact save/replay."
    },
    {
      "label": "Recovery journeys",
      "path": "tests/production/group-patrol-recovery.spec.ts",
      "note": "Deliberately damaged replies after real mutation, manual restoration and explicit retry."
    }
  ]
};
