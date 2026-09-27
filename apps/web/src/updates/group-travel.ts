import type { Dispatch } from './types';

/** Reviewed implementation evidence; article publication has separate checks. */
export const groupTravelRevision = '3b0918999a166f36f6f3d51fbcb49413de549163';
export const groupTravelVerification = 'The pinned implementation passes 2,000 headless tests across 250 files in 63.19 seconds. Twenty-one affected Chromium journeys pass in 2.6 minutes; six focused journeys pass in 53.6 seconds, repeating four and adding two omitted posting-recovery cases: 23 distinct affected journeys. One separate generated-production journey passes in 5.3 seconds, with a 6.3-second complete run, without development hooks. These overlapping scopes are reported separately. Typecheck, lint, content/art validation and the Pages-subpath build pass; this eleventh article has separate publication checks.';

export const groupTravelDispatch: Dispatch = {
  publication: 'published', sourceRevision: groupTravelRevision, sequence: 11,
  id: 'group-travel', edition: '11', title: 'Give your armies a shared destination',
  subtitle: '27 September 2026 · Group travel',
  summary: 'Recall a saved army group, review their separate routes and send them toward one destination. Ordinary travel keeps its costs, interruptions and individual controls, with results for every army.',
  topic: 'Engineering', tags: ['Empire management', 'Army travel', 'Saved groups', 'Recovery', 'Performance'],
  status: 'Reviewed checkpoint', checkpoint: 'Group travel · ACT-32', image: 'group-travel-results',
  takeaways: [
    'Review routes for up to 128 owned land armies ashore, then explicitly apply ordinary travel. A shared destination does not synchronize arrival.',
    'Replace a route, append a waypoint, resume paused travel or cancel existing routes. Standing postings remain active and may move an army again next turn.',
    'Accepted orders leave the checked selection; refusals stay for correction. M3 remains in progress and all fifteen release gates remain open.',
  ],
  sections: [
    { id: 'choose-the-destination', title: 'Choose the destination together', paragraphs: [
      'A frontier company can be scattered across several registry pages when the next march begins. Recall its saved army group, or check the armies directly, then choose one destination in Group travel. The form accepts the selected map hex, an owned hearth or a hex number. Up to 128 owned land armies ashore can participate. Each keeps its own route and movement allowance; a shared destination does not synchronize arrival.',
      'Choose whether to replace existing routes or append a waypoint, then press Review routes. This reads permitted route summaries without moving anyone. Costs, steps, blockers and search limits appear per army, across pages of twenty-five. Changing the selection, destination, mode or campaign hash invalidates that review. There is no automatic query or order while the player edits.',
    ] },
    { id: 'travel-and-standing-duty', title: 'Travel and standing duty', paragraphs: [
      'Apply reviewed routes sends the selected armies through ordinary movement commands in stable army ID order. Movement begins immediately and can reach the destination or pause during that same command. Reviews are advisory: earlier armies can reveal information that changes later outcomes. A blocked preview never authorizes an attack. Actual accepted or refused results remain visible; accepted armies leave the checks, while refusals stay selected for correction.',
      'Appending to a paused route preserves its pause. Resume paused routes affects only selected paused routes; Cancel travel routes affects only selected armies with routes. Neither action clears standing postings. The form counts affected postings and warns that those armies may march again next turn. Clear postings remains a separate decision, and individual route controls remain available.',
      'The illustration shows the actual summary after one hundred accepted orders and zero refusals. It is an exact 318-by-19-pixel native browser clip, 2,337 bytes, captured at a 390-pixel viewport without later crop, resize or re-encoding. The authored Legendary, generator-4, seed-20260905 fixture has forty owned hearths, one hundred owned armies and 4,000 armies overall. This small image shows the summary alone; full captures and execution evidence retain the surrounding workflow.',
    ] },
    { id: 'keep-the-command-authority', title: 'Keep the command authority', paragraphs: [
      'The worker validates the bounded request and expected campaign hash before any mutation. The simulation still decides ownership, routes, fog and refusals. Preview replies carry compact summaries rather than full paths or reachable-cell arrays. Applying sends all selected commands, including advisory refusals when at least one route can proceed, so the final results come from canonical decisions.',
      'Each attempted command is recorded; accepted earlier orders survive a later refusal. A completed accepted batch publishes one final state and attempts one autosave; a save failure remains visible. All-refused batches do not autosave. A recording interruption requires saved restoration before more orders, with no automatic retry. Controls stay locked while a request is pending. Independent review caught a late preview error that could fault an already restored campaign; handling now requires both the current worker and a still-pending request.',
    ] },
    { id: 'measure-the-bounded-work', title: 'Measure the bounded work', paragraphs: [
      'Four actual-worker samples measure authored Huge and Legendary workloads. Huge with 47 and 128 owned armies reports worker review times of 2.053 and 2.879 milliseconds, carrying 8,206 and 22,300 summary bytes. Their batches take 464.902 and 459.158 milliseconds and publish 246,578 and 649,643 measured state bytes. Legendary with 100 and 128 owned armies reports 2.270 and 2.457 milliseconds, carrying 17,537 and 22,437 summary bytes; batches take 750.738 and 831.073 milliseconds and publish 504,166 and 635,137 state bytes.',
      'Each is one elapsed sample on an i9-13900K with Node 26.7.0, using the headless worker module, structured cloning and in-memory test IndexedDB. Routes are at most four steps. Batch time includes autosave and publication, excluding setup and later verification. Each case checks exact serial archives, replay, autosave and matching permitted fog observations. These generator-4 synthetic armies do not establish organic mature campaigns, current-generator dimensions, long-search ceilings, browser-worker or physical-storage latency, full-turn latency, rendering or sustained memory.',
    ] },
    { id: 'verify-and-continue', title: 'Verify the journey, keep the limits', paragraphs: [
      groupTravelVerification,
      'Eight new travel scenarios cover hundred-army application and continuation, partial refusal, paused routes, retained postings, individual overrides, saved restoration and damaged or late worker replies. The first combined journey exceeded its unchanged 45-second limit after two hundred-army batches succeeded. It was split into two meaningful journeys with all assertions retained; test readbacks now project only asserted fields. A later blank narrow screenshot was rejected. A fresh capture waited for the asserted row and two animation frames; the original blank capture and its unestablished cause remain recorded.',
      'Rules/save remain 32 and content remains 015468d1. No rule, AI policy, price or campaign pace changes, and no new pacing run is claimed. This advances existing ACT-32/M3 scope without adding or cutting obligations. M3 remains in progress: theater strategy, patrol and escort roles, reusable army order templates, broader governors and combined mature-realm acceptance remain open. All fifteen release gates remain open. Contributors can extend the shared registry and canonical commands while preserving explicit orders, visible interruptions and saved continuation.',
    ] },
  ],
  evidence: [
    { label: 'Group travel verification', path: 'docs/development/2026-09-26-group-travel/README.md', note: 'Exact overlapping execution scopes, eight new travel scenarios, retained timeout and capture corrections, and remaining acceptance.' },
    { label: 'Group travel architecture', path: 'docs/architecture/0044-group-travel.md', note: 'Explicit review, ordinary movement commands, retained postings, bounded transport and interrupted recording.' },
    { label: 'Independent main-thread review', path: 'docs/development/2026-09-26-group-travel/main-review.md', note: 'Pending request correlation, recovery locking and the corrected stale-preview error; reviewer UI authorship disclosed.' },
    { label: 'Independent worker review', path: 'docs/development/2026-09-26-group-travel/worker-review.md', note: 'Canonical authority, permitted fog, recording boundaries, autosave and measured workload limitations.' },
    { label: 'Authored group travel journeys', path: 'tests/gameplay/group-movement.spec.ts', note: 'Real controls for a controlled hundred-army realm, routes, overrides and saved continuation.' },
    { label: 'Generated production travel journey', path: 'tests/production/group-movement.spec.ts', note: 'Ordinary controls and saved travel without development hooks; distinct from authored scale evidence.' },
    { label: 'Huge and Legendary worker samples', path: 'docs/development/2026-09-26-group-travel/worker-movement-benchmark-final.log', note: 'Four single-sample cases, exact serial/replay/autosave checks, permitted observations and timing boundaries.' },
    { label: 'Reviewed captures and provenance', path: 'docs/development/2026-09-26-group-travel/screenshots/provenance.json', note: 'Exact native result clip and full reviewed captures; authored fixture and untransformed bytes.' },
  ],
};
