import type { Evidence, ScopeEntry } from './types';

/** A selected decision/gate ledger, not a substitute for the complete DoD. */
export const scopeLedger: ScopeEntry[] = [
  { id: 'accepted-scope', state: 'Accepted scope', title: 'The agreed game, not a moving finish line', description: 'The canonical scope still calls for long single-player campaigns, online human campaigns, deep progression, multiple victory paths and authored world content. No scope cuts or new gameplay obligations are adopted by these dispatches.', path: 'GAME_1_0_SCOPE.md' },
  { id: 'campaign-integrity', state: 'Current / partial', title: 'Gates E & F · Save integrity and combat', description: 'Rule 17 advances trained-battle saving, whole-army defending contingents and pending-assault validation. Storage durability has scoped approval. Whole-gate save, combat and release certification do not follow from these targeted fixes.', path: 'docs/development/post-fix-review/summary.json' },
  { id: 'playable-foundation', state: 'Current / partial', title: 'Gates B, F2 & J · A playable foundation', description: 'Twenty-four cultures, resource economies, development branches and individual soldier battles are playable. Waykeepers are a first paid caster role, not complete magic. Content depth, campaign counterplay and the full progression targets remain partial.', path: 'docs/IMPLEMENTATION_STATUS.md' },
  { id: 'ai-integration', state: 'Open gate', title: 'Gate C & integration · Unresolved review work', description: 'AI queued second-harbor funding and repeated founder geography/chart-scan findings remain open in the source record. Further checks and fixes were authorization-blocked. Overall integration is not approved.', path: 'docs/development/post-fix-review/summary.json' },
  { id: 'scale-browsers', state: 'Open gate', title: 'Gates D, K & L · Scale and browser confidence', description: 'Storage publication performs O(prefix bytes) reads; queued-GC proof scans the store. Large-store GC, sustained memory, real quota/process-kill durability and cross-browser certification still need separate evidence. A still image is not a frame-time result.', path: 'docs/development/review-fix-2/persistence-REPORT.md' },
  { id: 'proposed-followups', state: 'Proposal / deferred', title: 'Suggested follow-ups, not new release promises', description: 'Promoting the temporary storage probes to permanent regressions and separately profiling large-store GC are review suggestions. They require a bounded work packet and acceptance criteria. This journal does not authorize blocked probes or turn every suggestion into scope.', path: 'docs/development/post-fix-review/persistence.verdict.json' },
  { id: 'not-this-update', state: 'Not this update', title: 'Gate M, full magic and a 1.0 announcement', description: 'No online multiplayer service, complete magic system, new art production or overall 1.0 signoff is delivered here. Online play and full magical depth remain accepted release scope—not silently deferred out of 1.0. This journal adds a review surface, not those game systems.', path: 'DEFINITION_OF_DONE.md' },
];

export const library: Evidence[] = [
  { label: 'Start playing & run locally', path: 'README.md', note: 'Controls, setup, save transfer and the actual single-player development build.' },
  { label: 'Implementation status', path: 'docs/IMPLEMENTATION_STATUS.md', note: 'Implemented, partial, blocked and historical work. The source of truth behind the headlines.' },
  { label: 'Agreed 1.0 scope', path: 'GAME_1_0_SCOPE.md', note: 'The accepted game and content targets. A feature only counts when it is integrated.' },
  { label: 'Definition of done', path: 'DEFINITION_OF_DONE.md', note: 'Named release gates, required evidence and the final signoff contract.' },
  { label: 'Development workflow', path: 'docs/1.0-DEVELOPMENT.md', note: 'Carry a bounded playable slice through implementation, review and verification.' },
  { label: 'World & faction bible', path: 'docs/lore/FACTION_BIBLE.md', note: 'Twenty-four societies, disputed history and the boundary between lore and runtime.' },
  { label: 'Art status & provenance', path: 'docs/art/ART_IMPLEMENTATION_STATUS.md', note: 'Reviewed pixels, real bindings, animation scope and unresolved production limits.' },
  { label: 'Campaign-safety architecture', path: 'docs/architecture/0037-campaign-safety.md', note: 'Canonical ownership, morale correction, reserves and historical compatibility.' },
];
