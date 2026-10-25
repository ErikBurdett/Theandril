import type { Dispatch } from './types';

export const registryOrderRevision = 'da12978fb596a73a7fddcfb8e914efb7924efbc2';
export const registryOrderDispatch: Dispatch = {
  "publication": "published",
  "sourceRevision": "da12978fb596a73a7fddcfb8e914efb7924efbc2",
  "sequence": 17,
  "id": "registry-order-filters",
  "edition": "17",
  "title": "Find waiting orders in a crowded roster",
  "subtitle": "24 October 2026 · Army registry order filters",
  "summary": "Find a paused patrol or waiting order without paging through every company. The registry keeps policy, travel and selection facts distinct; changing an order still takes an explicit action.",
  "topic": "Engineering",
  "tags": [
    "Empire management",
    "Army registry",
    "Patrols",
    "Accessibility",
    "Saved campaigns"
  ],
  "status": "Reviewed checkpoint",
  "checkpoint": "Observed order filters · rules 35",
  "image": "registry-paused-selector",
  "takeaways": [
    "Filter owned forces by postings and patrols, waiting orders or paused patrol policies, alongside the existing search and land/fleet choices.",
    "A paused patrol can still have active travel. The registry shows both supplied facts and preserves checked armies outside the current filter.",
    "An authored 101-army production journey finds the last company, resumes its policy explicitly and restores the exact archive. Broader empire-management and all fifteen release gates remain open."
  ],
  "sections": [
    {
      "id": "a-policy-beyond-the-first-page",
      "title": "A policy beyond the first page",
      "paragraphs": [
        "A paused patrol can sit beyond the first page of a large roster. Its company may have spent every movement point while an ordinary route remains active. Looking only for idle companies can miss the saved policy, and treating a paused patrol as stopped travel gives the wrong answer.",
        "The army registry now offers All forces, Postings and patrols, Orders waiting and Paused patrols. Counts cover the current search and land/fleet cohort before the order filter and existing 25-row pagination. The filter makes the matching company reachable without visiting every page.",
        "The lead image is the exact native selector detail from the authored 101-army regression: Paused patrols (1). Its 806-by-66 pixels show only the control and matching count. The linked full view supplies the company row and context; the archive establishes the later action. It is not an organically recruited realm or a miniature full-screen image."
      ]
    },
    {
      "id": "separate-policy-from-travel",
      "title": "A paused policy is not stopped travel",
      "paragraphs": [
        "Postings and patrols includes saved policies whether enabled or disabled; an ordinary route alone does not qualify. Orders waiting includes a reported posting blocker, an enabled patrol whose canonical status is waiting, or a paused route. Paused patrols includes a disabled policy even when the company has zero movement or active travel. These are overlapping cohorts, not a new ranking of urgency.",
        "Each row keeps posting destination and reason, patrol policy target and status, and queued or interrupted travel target and reason separate. Hex zero remains a valid target. A stale previous error does not turn a healthy policy into a waiting order, and the existing next-action priority remains unchanged.",
        "The read model uses only owned army facts already supplied by the observation. Missing or foreign actors and mismatched order owners are excluded; old observations without patrol records still work. Defense theaters are not included in Postings and patrols. This filter does not decide movement eligibility, invent a route, or add automatic recovery."
      ]
    },
    {
      "id": "checks-survive-filtering",
      "title": "Keep the companies you checked",
      "paragraphs": [
        "Changing the order filter returns to its first page and preserves checked army IDs. The existing outside-filter notice explains retained checks, and Select matching adds the current cohort. Search, land/fleet filtering and sort still compose with the same bounded list.",
        "The selector is locked during the existing pending group request, like sorting and pagination. After an explicit route review completes, filtering preserves the checks and reviewed destination; it does not submit that review. There is no new bulk resume or hidden order behind browsing.",
        "The order filter lives only while that registry is open. Closing and reopening returns it to All forces; it is not a saved campaign preference. Existing search/domain behavior remains unchanged, and settlement lists do not gain an army-order control."
      ]
    },
    {
      "id": "one-real-resume",
      "title": "One deliberate Resume action",
      "paragraphs": [
        "The production journey imports an explicitly authored open-land campaign with 101 own companies, two hearths, treasury and one foreign obstruction guard. All eight setup orders use ordinary commands. Queued travel actually spends movement; a foreign move and turn advance produce the real interrupted-route reason. No route blocker, patrol status or movement exhaustion is fabricated.",
        "The registry finds the last stable-ID company, Registry company 101, beyond the first 25 rows. Its disabled patrol, zero movement and active route remain separate facts. Actual keyboard filters, search/domain counts, checked IDs, a pending review lock and 390-pixel views at 130% text are exercised with development hooks absent.",
        "Browsing and locating the company preserve hash aa8eb3f5 and the entire eight-record archive. Only the existing Resume patrol button adds an order: sequence 9 on turn 2, setPatrolEnabled(enabled:true) for army.99. The result is 099f7ee4; the complete active route and zero-movement army remain identical. No End turn or reviewed group travel is submitted. Export/replay and manual save/reload preserve the exact nine-record archive.",
        "Public exports prove state and recorded commands, not worker query counters. Source review establishes that filtering itself makes no path request; the separate deliberate route review does ask the worker for movement information. The original fixture attempt used an invalid authored entity ID and failed strict loading. Its numeric-ID correction and failure remain retained; no loader rule was weakened."
      ]
    },
    {
      "id": "verified-local-scope",
      "title": "Verified within its scope",
      "paragraphs": [
        "At the pinned implementation checkpoint, 2,318 tests across 282 files pass in 75.04 seconds, with typecheck, lint and the production build passing. The focused registry/group scope passes 36 tests across six files, including twelve new projection/filter tests. These overlapping scopes are not additive. One built-production journey passes on its first run in 10.5 seconds overall; that duration is functional execution metadata, not a performance result. Publication checks are recorded separately.",
        "The index makes one pass over observed armies and their supplied posting, patrol and route reports, storing only owned-army display facts. It is memoized per observation. Counts and filtering run over the existing search/domain cohort, and rendered rows remain capped at 25. These are source-level complexity bounds, not measured latency, whole-turn cost or worker-transfer acceptance. No new isolated timing is claimed.",
        "Rules/save remain 35 and content remains 015468d1. This is a UI read-model and registry change: simulation rules, AI, protocol, save schema, prices and campaign pacing behavior are unchanged. No new pacing run is claimed for this presentation slice. The earlier fixed nine-campaign matrix and its unresolved Long and early-Epic results remain separate evidence; DH-021 remains open.",
        "The selector PNG is copied byte for byte: 8,755 bytes added to a journal inventory of 3,473,083, yielding 3,481,838 bytes under the unchanged 3.5 MiB cap. No crop, resize or re-encoding was applied. The full desktop and narrow captures remain linked evidence; a control detail is not proof of the whole accessibility or scale gate."
      ]
    },
    {
      "id": "still-a-directory-workflow",
      "title": "The larger realm still needs work",
      "paragraphs": [
        "This advances existing empire-management and UX-at-scale work. No new gameplay obligation was added or removed. It does not add governors, mobile escorts, coordinated operations, multi-step army programs, new AI behavior or a replacement for next-action attention.",
        "The authored 101-army scenario establishes this bounded directory workflow, not organically developed mature-realm acceptance. Broader delegation, sustained large-roster profiling, critical canvas alternatives, M3 and all fifteen release gates remain open. Follow-up work should keep direct player choices inspectable and preserve exact saved history. Deployment remains a development checkpoint, not 1.0 acceptance."
      ]
    }
  ],
  "evidence": [
    {
      "label": "Registry implementation and acceptance",
      "path": "docs/development/2026-10-24-army-order-filters/README.md",
      "note": "Exact source scope, focused/full checks, real browser journey and remaining limits."
    },
    {
      "label": "Independent registry source review",
      "path": "docs/development/2026-10-24-army-order-filters/source-review.md",
      "note": "Owned observation boundary, preserved selections and supplied order facts."
    },
    {
      "label": "Native image review",
      "path": "docs/development/2026-10-24-army-order-filters/image-review.md",
      "note": "All four original captures inspected; control-only illustration and unchanged image budget."
    },
    {
      "label": "Production source and image evidence",
      "path": "docs/development/2026-10-24-army-order-filters/browser-evidence.json",
      "note": "Frozen source hashes, actual native image identities and browser result."
    },
    {
      "label": "Actual desktop registry context",
      "path": "docs/development/2026-10-24-army-order-filters/browser-results/production-army-order-filt-8ec4b-plicitly-resumes-its-policy/registry-paused-policy-desktop.png",
      "note": "Authored 101-army scrolled viewport: paused policy, continuing travel and outside-filter checks."
    },
    {
      "label": "Waiting reasons at enlarged text",
      "path": "docs/development/2026-10-24-army-order-filters/browser-results/production-army-order-filt-8ec4b-plicitly-resumes-its-policy/registry-waiting-narrow-130.png",
      "note": "Native 390px/130% view with independent canonical posting and route reasons."
    },
    {
      "label": "Exact registry command evidence",
      "path": "docs/development/2026-10-24-army-order-filters/browser-results/production-army-order-filt-8ec4b-plicitly-resumes-its-policy/registry-order-filter-evidence.json",
      "note": "Eight unchanged browsing records, one explicit policy resume and exact final replay."
    },
    {
      "label": "Owned order projection",
      "path": "apps/web/src/army-order-status.ts",
      "note": "A linear presentation index over supplied own facts; no geography or path query."
    },
    {
      "label": "Actual public-control journey",
      "path": "tests/production/army-order-filter.spec.ts",
      "note": "Production import, keyboard filters, pending lock, deliberate Resume and saved restoration."
    },
    {
      "label": "Fixture construction and retained failure",
      "path": "docs/development/2026-10-24-delegation-workflow/browser-draft-notes.md",
      "note": "Authored infrastructure and actual eight-command order construction; corrected strict numeric-ID setup."
    }
  ]
};
