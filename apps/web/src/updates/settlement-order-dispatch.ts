import type { Dispatch } from './types';

export const settlementOrderDispatch: Dispatch = {
  "publication": "published",
  "sourceRevision": "5da6b62e9d9522d973f87b0c7022ada370636dcc",
  "sequence": 19,
  "id": "settlement-order-filters",
  "edition": "19",
  "title": "Find empty queues and waiting charters",
  "subtitle": "25 October 2026 · Settlement order filters",
  "summary": "Find empty production queues, hearths without charters and policies waiting on a reported limit. Keep checked hearths across filters, then apply a policy through the existing group controls.",
  "topic": "Engineering",
  "tags": [
    "Empire management",
    "Settlements",
    "Charters",
    "Group orders",
    "Accessibility"
  ],
  "status": "Reviewed checkpoint",
  "checkpoint": "Settlement order inventory · rules 35",
  "image": "settlement-order-selector",
  "takeaways": [
    "Filter the owned settlement registry by All hearths, No production, Without charters or Charters waiting, with counts that follow search before paging.",
    "Checks remain when filters hide a hearth. Waiting reasons and next-work candidates stay distinct from guaranteed spending; existing queues come first.",
    "An authored thirty-hearth production journey applies six ordinary charters and restores the exact 36-record archive. M3 and all fifteen release gates remain open."
  ],
  "sections": [
    {
      "id": "find-the-work",
      "title": "Find the work before choosing the hearths",
      "paragraphs": [
        "A large realm can have empty queues, deliberate production, unchartered hearths and several reasons a charter is waiting. Searching by name and reading every row makes it difficult to find the relevant settlements before giving a group order. Settlement orders now offers All hearths, No production, Without charters and Charters waiting.",
        "These are overlapping cohorts, not parts of a total. Their counts follow the current search before stable 25-row pagination. Sorting still orders the matching directory, and a new filter returns the list to its first page. Closing and reopening the registry returns the local filter to All hearths.",
        "Changing the view issues no order. Checked hearths stay selected when a search or filter hides them; the existing group panel reports how many are outside the current filter. Select matching hearths adds the matching cohort across pages. Apply charters remains the explicit decision, and existing pending locks protect filters, paging and selection."
      ]
    },
    {
      "id": "what-waiting-means",
      "title": "A waiting charter is not always a problem",
      "paragraphs": [
        "No production means an empty queue, including a hearth whose charter has a candidate for the next turn. Without charters means no matching owned charter; that hearth may already have queued work. Charters waiting requires an empty queue and a canonical reported blocker. Completed building programs, deliberate coin ceilings and the treasury reserve can all be ordinary reasons to wait.",
        "Rows show direct orders when there is no charter, or the saved focus and coin ceiling when one exists. Current queues come first. Otherwise the row repeats the actual reason or names the Next candidate. A candidate is not a guaranteed purchase: charters share the treasury when ordinary turn processing answers them.",
        "How these filters work is a native, default-closed explanation with a 44-pixel summary target. It keeps the distinctions available by keyboard while leaving room for selected-hearth counts on a narrow screen. The Map guide repeats the same meanings."
      ]
    },
    {
      "id": "six-charters",
      "title": "Six charters, one exact saved result",
      "paragraphs": [
        "The production journey imports an explicitly authored Huge campaign with thirty owned hearths, 128 companies and two wars. Ownership, mature infrastructure and starting funds are synthetic; this is not an organically developed large realm. Thirty ordinary setup records revoke ten charters, raise fifteen ceilings and pay for five guard queues after the disclosed from-save baseline.",
        "Initial All/No production/Without charters/Charters waiting counts are 30/24/10/5. The browser searches, sorts, changes filters, reaches the second page, opens an inspector and retains checked hearths outside the filter. Its browsed export still has exactly thirty records and hash 503329a2. None of that navigation issues a command.",
        "Five waiting charters and one queued unchartered hearth outside the filter then receive six explicit Muster charters with a 24-coin ceiling. The resulting counts are 30/24/9/0. The archive contains exactly thirty-six records at bb648af6, with six accepted ordinary setCharter commands in stable actor order. Every settlement, faction, army, route, posting and patrol stays unchanged; all six existing queues remain, treasury stays 3,940 and the turn stays 2.",
        "All three final public exports pass strict decoding and canonical replay. Applying those six commands through a fresh resumed journal reproduces the entire changed state and archive. Manual save, page reload and restoration preserve the exact 36-record archive. No End turn or automatic purchase is needed to change the policies."
      ]
    },
    {
      "id": "reviewed-control",
      "title": "A small control with its context preserved",
      "paragraphs": [
        "The lead image is the exact 340-by-71-pixel native selector capture, 7,683 bytes, from a 390-pixel viewport with 130% text. It shows the closed Settlement orders control set to Charters waiting (5), before the explicit six-charter application in the authored thirty-hearth fixture. Other options, help, checked-hearth context and command results are outside this detail; the linked full captures and saved-history checks establish those separately.",
        "All four final native captures were inspected. The first narrow review found the always-visible explanation taking too much room above the controls; moving it into the native disclosure leaves the six-selected, one-outside-filter count visible. The final production journey opens and closes that explanation through focused Enter keys. Earlier passing captures and their review remain retained.",
        "No crop, resize, re-encoding or image generation was applied. The exact PNG brings journal inventory to 3,520,624 bytes, leaving 149,392 bytes below the unchanged 3.5 MiB cap. All eighteen earlier dispatches and twenty-one historical image records and bytes remain unchanged. Final displayed journal review is separate from approval of the source capture."
      ]
    },
    {
      "id": "verified-boundary",
      "title": "Existing facts, existing commands",
      "paragraphs": [
        "The new presentation index copies only already-observed owned settlement and matching charter facts. It ignores foreign and orphaned policy rows, preserves queue precedence, and does not infer production eligibility or parse waiting text into severity. Construction is O(observed settlements + charters); counts and filtering are linear directory passes, with at most 25 rows rendered. No geography scan, path search, new worker request or per-frame callback is added.",
        "The final implementation passes 2,362 tests across 288 files in 63.88 seconds, plus typecheck, lint and the Pages-subpath build. The final new production journey passes in 20.3 seconds, 21.3 seconds overall, after the disclosure refinement. Three earlier regression journeys remain separate evidence: the initial invocation covered the new journey plus normal charter and template cases in 31.5 seconds, and the army-registry case passed separately in 13.0 seconds overall. That is four distinct affected scenarios, with the new one run twice; overlapping scopes are not additive.",
        "The earlier plural army-test filename did not select that regression, so the correctly named case was run separately rather than counted in the first invocation. A fixture-authoring attempt to rename a mature hearth also met the strict saved project-host identity guard; retaining the existing names corrected the fixture without weakening the loader. Both corrections remain in the evidence.",
        "Browser duration is functional execution metadata, not a performance benchmark. Source-level complexity is not a new timing, transfer or memory measurement. Rules/save remain 35 and content remains 015468d1. No canonical rule, AI policy, price or automatic-turn behavior changes, and no new pacing run is claimed."
      ]
    },
    {
      "id": "delegation-remains",
      "title": "Continue the larger delegation workflow",
      "paragraphs": [
        "This advances existing ACT-32/M3 empire management and Gate I. No new gameplay obligation was added or removed. It does not add governor programs, mobile escorts, new production choices or automatic charter purchases. M3, R06, DH-021 and all fifteen release gates remain open.",
        "The catalogue records one bounded settlement-management improvement while preserving the existing partial item and its remaining acceptance. Editorial delivered bullets are not a release-completion percentage. Organic mature-realm use, wider governor decisions, multi-step programs and broader browser and scale coverage still need their own evidence.",
        "Contributors can build on the explicit selection and ordinary-command boundary while preserving observed facts, outside-filter checks, pending locks and exact saved history. Publication and live checks are recorded separately from the pinned implementation. Deployment remains a development checkpoint, not 1.0 acceptance."
      ]
    }
  ],
  "evidence": [
    {
      "label": "Settlement order implementation and acceptance",
      "path": "docs/development/2026-10-25-settlement-order-filters/README.md",
      "note": "Final source checks, distinct browser scopes and the authored workflow boundary."
    },
    {
      "label": "Independent integration review",
      "path": "docs/development/2026-10-25-settlement-order-filters/source-review.md",
      "note": "Own-only facts, search and paging, existing locks, wording and disclosure refinement."
    },
    {
      "label": "Browser and saved-history review",
      "path": "docs/development/2026-10-25-settlement-order-filters/browser-review.md",
      "note": "Actual public controls, three exact exports and native image limitations."
    },
    {
      "label": "Exact final export checks",
      "path": "docs/development/2026-10-25-settlement-order-filters/final-export-review.json",
      "note": "Strict decoding, canonical replay and reconstruction of the six ordinary commands."
    },
    {
      "label": "Native image review and provenance",
      "path": "docs/development/2026-10-25-settlement-order-filters/image-review.json",
      "note": "All four final captures inspected; approved control detail and exact pixels."
    },
    {
      "label": "Desktop checked-hearth context",
      "path": "docs/development/2026-10-25-settlement-order-filters/browser-final-results/production-settlement-orde-82614-anges-and-saved-restoration/settlement-waiting-desktop.png",
      "note": "Five waiting policies plus one queued unchartered hearth selected outside the filter."
    },
    {
      "label": "Enlarged-text selection context",
      "path": "docs/development/2026-10-25-settlement-order-filters/browser-final-results/production-settlement-orde-82614-anges-and-saved-restoration/settlement-waiting-narrow-130.png",
      "note": "390px and 130% text; collapsed explanation and six selected, one outside the filter."
    },
    {
      "label": "Actual changed charter candidates",
      "path": "docs/development/2026-10-25-settlement-order-filters/browser-final-results/production-settlement-orde-82614-anges-and-saved-restoration/settlement-charters-ready-narrow-130.png",
      "note": "Cleared checks and a candidate under the explicit 24-coin Muster policy."
    },
    {
      "label": "Observed settlement order projection",
      "path": "apps/web/src/settlement-order-status.ts",
      "note": "Detached owned facts without production eligibility or spending prediction."
    },
    {
      "label": "Real production workflow",
      "path": "tests/production/settlement-order-filters.spec.ts",
      "note": "Import, filtering, keyboard help, explicit group application and exact save restoration."
    }
  ]
};
