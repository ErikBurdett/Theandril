import type { Dispatch } from './types';

export const defenseTheatersRevision = '0ecd2d1767f613942cf9f22315da624164cc4055';
export const defenseTheatersVerification = 'The pinned implementation passes 2,075 headless tests across 258 files in 61.02 seconds and 33 affected Chromium journeys in 4.2 minutes. The 100 compatibility checks and 270 AI checks overlap the headless total. An initial generated-production journey passes in 4.8 seconds before the final AI reachability correction; final-build and journal publication checks follow separately. Typecheck, lint, content/art validation and the final Pages-subpath build pass. These scopes are not added together or presented as release acceptance.';

export const defenseTheatersDispatch: Dispatch = {
  publication: 'published', sourceRevision: defenseTheatersRevision, sequence: 12,
  id: 'defense-theaters', edition: '12', title: 'Give your hearths a standing watch',
  subtitle: '27 September 2026 · Defensive theaters',
  summary: 'Choose the hearths to protect, assign their watch companies and name a reserve. Idle members fill guard gaps on later turns while your direct routes and standing postings keep priority.',
  topic: 'Engineering', tags: ['Empire management', 'Army orders', 'AI', 'Saved campaigns', 'Performance'],
  status: 'Reviewed checkpoint', checkpoint: 'Defensive theaters · ACT-32', image: 'defense-theater-summary',
  takeaways: [
    'Save a named watch with explicit armies, protected hearths and a reserve hex. Each turn it fills guard floors through ordinary travel.',
    'Direct orders take priority. Pause, delete and detach stop future assignments while existing routes continue.',
    'Rules/save 33 preserves captured rules 32 history. M3, pacing issue DH-021 and all fifteen release gates remain open.',
  ],
  sections: [
    { id: 'name-the-watch', title: 'Name the watch', paragraphs: [
      'Keeping several hearths staffed can mean repeatedly finding an idle company and sending it to the next empty garrison. A defensive theater gives that recurring task a saved brief. In the Armies registry, copy checked armies into a draft, name the watch, select the hearths to protect and choose an explored reserve hex. Create or Save commits the configuration; editing a draft gives no orders.',
      'Each realm can keep eight theaters, each with up to sixteen hearths and 128 explicit combat land armies. Set a floor of one to four whole armies per hearth. A large field army and a single-company detachment each count as one guard, so this is a coverage setting, not a promise of equal strength. New members must be ashore and cannot found settlements; armies and hearths belong to only one theater in their realm. Replacing membership is explicit and shows what will change.',
    ] },
    { id: 'watch-the-gaps', title: 'Watch the gaps close', paragraphs: [
      'After ordinary travel and postings each turn, the theater sends idle assigned members toward missing garrisons and gathers eligible surplus at its reserve. Own nonmembers can satisfy coverage but never receive theater orders. Active routes ending at a protected hearth count as incoming and suppress duplicate dispatch. An incoming promise never permits taking the last required physical guard away from a hearth.',
      'The illustration comes from an authored tiny-map exercise: one hundred combat armies, two hearths and one retained standing-posting override. After one End turn, four armies are incoming, ninety-five remain in reserve and one retains its direct override. Zero missing guards includes incoming coverage; none of those four has arrived. The exact native 406-by-19 desktop text clip shows only this summary. Full controls and captures are linked below; this is not an organically grown empire.',
      'Every theater makes at most sixteen ordinary route attempts per turn, including refusals. Stable rotation shares future attempts among members and destinations. The report keeps actual latest dispatch results. Ordinary fog, movement costs and interruptions still apply; automatic assignment cannot attack or declare war.',
    ] },
    { id: 'direct-orders', title: 'Keep direct orders in charge', paragraphs: [
      'Active and paused travel, postings, voyages, sieges and character missions take priority. Pause a theater, delete it or detach an army to stop future assignments; existing routes continue. Cancel travel separately when it should stop. An idle army still belonging to an enabled theater can receive another assignment next turn.',
      'Captured hearths remain unavailable without revealing changed enemy names or locations. Lost members are pruned, while an empty theater can be edited and staffed again. Accepted configuration commands are journaled and autosaved. If recording or publication becomes uncertain, controls lock for saved-campaign recovery without automatically repeating the mutation. Browser tests cover missing and malformed replies, worker interruption, manual restoration and portable import.',
    ] },
    { id: 'ai-watch', title: 'A small watch for the AI', paragraphs: [
      'The AI uses permitted observations and the same configuration command. Once it has two hearths, it can assign at most two idle single-company spares and no more than one third of its combat containers, retaining scouts and its two strongest field armies. It checks up to four nearby hearth candidates with at most eight canonical route previews. Existing theaters, including paused or empty ones, are never automatically rewritten or refilled.',
      'Full campaigns exposed an initial mistake: a guard was assigned to an owned hearth surrounded by six visible water hexes. Ordinary movement correctly refused it repeatedly. The final policy checks known reachability before adoption; four regressions failed before the correction and pass afterward. The rejected campaign results and exact diagnostic traces remain in the evidence.',
      'At seed 20260905 on the headline standard map with twelve realms, final rules 33 campaigns finish at Standard 233, Long 311 and Epic 349. Paired frozen rules 32 campaigns reproduce 234, 342 and 379 with unchanged historical hashes and traces. Each current campaign establishes twelve one-army, one-hearth watches and makes three successful automatic journeys, with no automatic or submitted-command refusals. That proves small home watches, not a complete defensive strategy. Standard and Long remain above approximate 200/300 targets; Epic is one turn below the nominal 350–400 band. DH-021 remains open. No price or proxy bound was tuned to hide the result.',
    ] },
    { id: 'measure-and-preserve', title: 'Measure the work and preserve the campaign', paragraphs: [
      'Four headless Huge/Legendary cases use one warmup and three identical-save samples. Allocating one hundred assigned guards takes median 1.515/3.049 milliseconds; the one-realm ceiling of eight theaters, 1,024 members and 128 hearths takes 8.814/8.527 milliseconds with 64 accepted and 64 refused attempts. Theater arrays are 12,656–141,617 bytes. Generated-geography representative cases and authored open-land/island ceilings are separately labelled.',
      'The separate quiet AI planner measurement uses authored reachable, island-fallback and all-blocked cases: median 0.348/1.966/2.082 milliseconds on Huge and 0.162/1.635/2.074 on Legendary. Each uses three/eight/eight previews. Range and target search share a 4,096-node allowance per preview; target-only counters are not total search work. These one-realm samples exclude setup, observation creation, save proofs, whole turns, worker transfer and rendering. All-realms saturation and organic mature-empire acceptance remain unmeasured.',
      'Rules/save 33 adds an independent theater register and counter. Seven genuine pre-change rules 32 saves and archives retain exact bytes and replay, three historical continuations reproduce, and mixed history and reopened storage pass. Content remains 015468d1. Nonempty theater metadata or consumed identifiers cannot be silently downgraded.',
      defenseTheatersVerification,
      'This advances existing ACT-32/M3 scope without adding or cutting gameplay obligations. Threat response, reinforcement, patrol and escort roles, reusable army orders, broader governors and integrated mature-realm acceptance remain open. All fifteen release gates remain open. Contributors can build the next military or governor slice on ordinary commands, visible refusals, clear overrides and preserved history.',
    ] },
  ],
  evidence: [
    { label: 'Defensive theater verification', path: 'docs/development/2026-09-27-defense-theaters/README.md', note: 'Implementation checks, retained failures, exact pacing, measurements and acceptance limits.' },
    { label: 'Defensive theater architecture', path: 'docs/architecture/0045-defense-theaters.md', note: 'Canonical allocation, direct overrides, bounded state and historical rules.' },
    { label: 'Independent implementation review', path: 'docs/development/2026-09-27-defense-theaters/independent-final-review.md', note: 'AI reachability, canonical invariants, pacing and source seals; reviewer contributions are disclosed.' },
    { label: 'Native controls and image review', path: 'docs/development/2026-09-27-defense-theaters/independent-ui-review.md', note: 'Desktop/narrow controls, recovery and the exact 406-by-19 summary clip with caption limits.' },
    { label: 'Fixed headline comparison', path: 'docs/development/2026-09-27-defense-theaters/pacing-fixed-comparison.json', note: 'Frozen 32/current 33 outcomes, exact traces, real adoption and separate automatic refusals.' },
    { label: 'Allocator measurements', path: 'docs/development/2026-09-27-defense-theaters/benchmark-final.json', note: 'Four cases, warmup plus three samples, canonical replay checks and explicit timing boundaries.' },
    { label: 'Quiet AI planner measurements', path: 'docs/development/2026-09-27-defense-theaters/ai-benchmark-final.json', note: 'Six authored cases, real route queries, immutable proposals and ordinary command proofs.' },
    { label: 'Human theater journeys', path: 'tests/gameplay/defense-theaters.spec.ts', note: 'Authored hundred-army controls, overrides and exact saved restoration.' },
    { label: 'Production theater journey', path: 'tests/production/defense-theaters.spec.ts', note: 'Generated campaign, real controls and portable restoration without development hooks.' },
  ],
};
