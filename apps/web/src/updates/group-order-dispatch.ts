import type { Dispatch } from './types';

export const groupOrderDispatch: Dispatch = {
  "publication": "published",
  "sourceRevision": "670a18af843f95c80198a255e1894a708c5f1391",
  "sequence": 20,
  "id": "group-orders-and-receipts",
  "edition": "20",
  "title": "Give the order, then review each result",
  "subtitle": "25 October 2026 \u00b7 Group patrols and order receipts",
  "summary": "Assign a shared patrol circuit while keeping paused armies paused. Review accepted and refused posting and charter orders by name, with clearer boundaries when the campaign or its response changes.",
  "topic": "Engineering",
  "tags": [
    "Empire management",
    "Patrols",
    "Group orders",
    "Recovery",
    "Accessibility"
  ],
  "status": "Reviewed checkpoint",
  "checkpoint": "Group order workflows \u00b7 rules 35",
  "image": "group-patrol-points",
  "takeaways": [
    "Assign two shared patrol points to up to 128 checked land armies ashore. Existing paused policies stay paused; direct travel and postings keep priority.",
    "Browse posting and charter results in pages of 25, showing all, accepted or refused orders without changing checks or retrying commands.",
    "An outdated group request asks for review before changing policies. A result that fails after commands began requires saved restoration. M3 and all fifteen release gates remain open."
  ],
  "sections": [
    {
      "id": "a-shared-circuit",
      "title": "Give the watch its two points",
      "paragraphs": [
        "Choose the armies guarding a stretch of your realm, open Group patrols and choose two explored hexes. Owned hearths provide shortcuts. Assign patrols gives every checked land army ashore the same circuit, including checks outside the current filter. Each army still faces the ordinary combat, ownership and patrol-capacity rules; a caravan can be refused while other armies accept the order.",
        "New patrols start enabled. Replacing a patrol keeps its enabled or paused state, resets its next point and replaces its war option. Existing travel and standing postings remain in place and take priority. The form explains those consequences before submission. This extends the existing two-point policy; it does not add automatic attacks, escorts or a new movement rule.",
        "An authored 101-army browser journey assigns the same points to every checked company, including 51 outside its visible filter. It preserves all 50 paused policies and existing armies, routes and postings, then restores the exact 206-record archive. A separate generated campaign travels out and back on turns 2 and 3. The large realm is authored workflow evidence; the generated journey verifies the ordinary patrol loop."
      ]
    },
    {
      "id": "read-the-receipt",
      "title": "See which orders took effect",
      "paragraphs": [
        "A large batch needs more than a total. Posting and charter receipts list the submitted army or hearth names, accepted outcomes and refusal reasons. When any order is refused, the receipt opens on Refused; an all-success receipt starts closed. All, Accepted and Refused filters keep every result reachable through pages of at most 25.",
        "Changing the receipt filter or page issues no order and changes no checked selection. Accepted actors leave the selection when their result arrives; refused actors remain checked. The receipt describes the last submission, not a live policy inventory or an automatic retry.",
        "The illustrated posting journey deliberately reaches the existing policy-capacity boundary: 96 updates succeed and 32 new policies are refused. Its 128 actual results remain reachable across six All pages, four Accepted pages and two Refused pages; exactly the 32 refused armies stay checked. A separate thirty-hearth journey grants then revokes thirty charters and replays all sixty records. Neither receipt browsing workflow adds a command."
      ],
      "image": "group-policy-receipt-rows"
    },
    {
      "id": "two-different-interruptions",
      "title": "Review stale orders; restore uncertain results",
      "paragraphs": [
        "Posting and charter batches now carry the campaign hash used to prepare them. If the campaign changed, the worker rejects the entire stale request before any command is recorded. Checks and form values remain available for review and a fresh submission; this refusal does not require loading a save.",
        "A different problem occurs if ordinary commands apply but the worker cannot publish their result. The client cannot safely call that a refusal. Posting and charter batches now share the recovery lock used by newer group controls: further commands, saving and exporting stop until a saved campaign is restored. This protects an uncertain boundary; it does not roll back accepted commands or create a new autosave.",
        "The retained old-worker reproduction uses controlled request ordering and real commands. Separate publication-failure tests inject a transport interruption after ordinary commands. Neither is evidence of a naturally occurring healthy-worker fault."
      ]
    },
    {
      "id": "evidence-and-scope",
      "title": "A bounded step toward larger realms",
      "paragraphs": [
        "The final implementation passes 2,394 tests across 290 files in 63.05 seconds, plus typecheck, lint and the Pages production build. Eight affected browser cases pass in 51.0 seconds; two image-capture reruns pass in 29.4 seconds and overlap those cases. Earlier rounds retain their own full suites and browser scopes: intent validation has 2,372 tests and ten distinct affected cases; patrol assignment has 2,384 tests and seven affected cases; publication recovery has 2,386 tests and ten affected cases. These counts overlap and are not additive. Browser durations describe functional runs, not performance benchmarks.",
        "The two illustrations are exact native browser captures: a 784-by-323 patrol endpoint detail and the first six visible refusal rows, Home guard 097\u2013102, inside a scrollable 25-row receipt page. The receipt comes from the explicitly authored capacity fixture: 96 owned policies and 8,096 expired foreign policies reach the existing 8,192 limit before the from-save archive. It shows real canonical refusals, not fabricated response rows. Neither image shows an entire workflow. Their combined 107,359 bytes bring journal imagery to 3,627,983 bytes, leaving 42,033 under the unchanged 3.5 MiB cap. No historical image bytes or records change.",
        "Retained verification corrections include control labels and a combobox locator, invalid authored caravan IDs, an unused import, and a registry assertion that initially counted the new war-option checkbox as an army row. The fixture now uses valid canonical identifiers and the row assertion targets army-selection checkboxes. No gameplay validation or refusal assertion was weakened. Round-three live checks also retain an initial network-change navigation failure before the charter page loaded, followed by both passing cases. Publication and live readback are recorded separately from this implementation pin.",
        "Rules/save remain 35 and content remains 015468d1. The UI and worker compose existing canonical commands; no new rule, AI policy, price or turn processing is introduced. No new campaign-pacing or sustained performance result is claimed. Authored browser fixtures establish their stated workflow, not an organically developed mature realm.",
        "This advances existing ACT-32/M3 delegation and Gates E and I, with boundary verification relevant to A and N. No new gameplay obligation is added or cut. M3, R06, DH-021 and all fifteen release gates remain open. Broader governors, multi-step programs, escorts, organic mature-realm use and wider browser/scale acceptance still need evidence. Contributors should preserve explicit orders, outside-filter checks, ordinary refusals and exact saved history as those workflows expand."
      ]
    }
  ],
  "evidence": [
    {
      "label": "Posting and charter intent checks",
      "path": "docs/development/2026-10-25-group-intent/README.md",
      "note": "Old-worker ordering reproduction, no-mutation refusal, fresh retry and independent review."
    },
    {
      "label": "Group patrol assignment",
      "path": "docs/development/2026-10-25-group-patrol-assignment/README.md",
      "note": "Shared endpoints, preserved pauses, ordinary refusals and exact exported history."
    },
    {
      "label": "Independent patrol assignment source review",
      "path": "docs/development/2026-10-25-group-patrol-assignment/source-review.md",
      "note": "Transport and UI boundary review, authored browser scope and limits."
    },
    {
      "label": "Publication interruption recovery",
      "path": "docs/development/2026-10-25-group-publication-recovery/README.md",
      "note": "Retained pre-fix witness, post-mutation lock and exact saved restoration."
    },
    {
      "label": "Posting and charter receipt review",
      "path": "docs/development/2026-10-25-group-policy-results/README.md",
      "note": "Actual result rows, filters, paging, unchanged history while browsing and narrow keyboard controls."
    },
    {
      "label": "Canonical implementation status",
      "path": "docs/IMPLEMENTATION_STATUS.md",
      "note": "Current partial systems, known limits and open release gates at the pinned source revision."
    },
    {
      "label": "Native patrol endpoint capture",
      "path": "docs/development/2026-10-25-group-patrol-assignment/browser-final-results/production-group-patrol-as-24fbe-olicies-and-existing-travel/group-patrol-points-native.png",
      "note": "Exact 784-by-323 detail at 1440-by-1000 and default text; endpoints and shortcuts only."
    },
    {
      "label": "Native posting refusal rows",
      "path": "docs/development/2026-10-25-group-policy-results/browser-final-results/production-group-policy-re-9598d--never-retry-while-browsing/posting-receipt-rows-native.png",
      "note": "Exact six-visible-row detail from a 25-row scrollable list at 1440-by-1000 and 130% text; authored capacity boundary."
    },
    {
      "label": "Patrol production capture and saved journey",
      "path": "tests/production/group-patrol-assignment.spec.ts",
      "note": "Explicit native clip bounds, real commands, paused-state preservation and manual restoration."
    },
    {
      "label": "Receipt production capture and history checks",
      "path": "tests/production/group-policy-results.spec.ts",
      "note": "Disclosed starting capacity, real accepted/refused orders, receipt browsing, narrow controls and replay."
    },
    {
      "label": "Native image review and exact provenance",
      "path": "docs/development/2026-10-25-group-policy-results/image-review.json",
      "note": "Both approved native captures, exact dimensions/hashes/bytes, displayed scope and unchanged aggregate budget."
    }
  ]
};
