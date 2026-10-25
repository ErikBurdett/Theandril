# Independent patrol integration review

Date: 2026-10-24. Base revision: `d06ba4b`; local uncommitted rules/save 35.
This reviewer authored the AI planner, but did not author the reviewed simulation,
save/schema, chronicle or persistence changes. The AI implementation is excluded
from this independent verdict and needs a different reviewer.

## Verdict

No blocking source, history-projection or hidden-information defect found in the
reviewed integration. This is a scoped source review, not release acceptance.
Full integration, browser, pacing and representative performance evidence remain
the parent's responsibility. The final public `pauseOnWar` policy introduces no
new blocker, and the ordinary-command siege coverage suggestion is now satisfied.

## Reviewed boundaries

- `packages/sim/src/patrol-state.ts`, `patrols.ts`, their simulation tests, and
  the patrol changes in `types.ts`, `rules.ts`, `simulation.ts`, `save.ts`,
  `index.ts` and `theaters.ts`.
- `packages/chronicle/src/index.ts`, the genuine rules34 fixture reader and
  compatibility tests.
- `packages/persistence/src/campaign-storage.ts` and the patrol storage journey.
- Original capture script, manifest and checkpoint provenance, plus the retained
  initial/final compatibility logs. These checks were read; this reviewer did
  not rerun heavy tests alongside parent integration work.

## Canonical state and history

The pure patrol schema lives outside the movement/simulation import graph,
avoiding a save-schema initialization cycle. Rules/save 35 requires its explicit
array. Rules34 keeps a separate strict state schema and command schema;
resealed old envelopes cannot smuggle even an empty future patrol field, and
old command parsing refuses the new verbs.

Migration validates the original rules34 content seal and checksum before
adding an empty patrol register. The existing earlier migration helpers also
initialize the register. Modern canonical serialization appends the field;
pre35 projection removes it while retaining the earlier property order. Active
patrol state is rejected before historical serialization, hashing or execution,
so old replay cannot silently lose modern orders.

The six independently captured checkpoints include generated origin/continuation
and authored ordinary postings plus theater configuration/allocation/continuation.
Their source was checked unchanged at capture. Tests bind the manifest digest,
raw and compressed bytes, original save hashes, all retained command results and
full replay. Mixed 34→35 history keeps the old prefix intact. The storage test
closes/reopens its database, then exports/imports and replays the actual current
patrol target and paused policy.

The compatibility run records **25 passing tests across four files**. Its
initial log retains two failures in existing tests that asserted the current
envelope was always version34. Using `SAVE_VERSION` for those modern-envelope
assertions is appropriate; fixed historical schemas and sealed fixtures remain
version34. This does not weaken historical compatibility assertions.

The final source review also includes the public war policy. `setPatrol` accepts
an optional boolean `pauseOnWar` and resolves omission to `false`; the canonical
patrol and observed patrol schemas require an explicit boolean. Serialization
parses that strict schema and loading runs `validatePatrols`, so missing or
non-boolean saved policies are rejected. The new property remains wholly inside
the rules35 patrol array; rules34 schemas, command projection and historical
property order are unchanged. Earlier migrations still create an empty array,
with no existing patrol policy to infer.

## Authority, overrides and permitted observations

Only validated commands edit patrol configuration. Assignment checks ownership,
land/combat eligibility, transport state, distinct explored in-world endpoints
and bounds before mutation. Pause/remove preserve already-issued travel, which
is consistent with the advertised future-assignment semantics. Updating an order
does not grant movement or bypass a retained route.

Allocation follows ordinary travel and postings and precedes theater routing.
Active/paused routes, postings, transport, missions and sieges prevent a patrol
attempt. Enabled patrols likewise block theater assignment. Completing a short
leg switches the next endpoint but does not issue a second route in that phase.
No direct attack or separate pathfinder is introduced: `queueMovement` uses its
existing explored/visible knowledge, movement costs and hostile-sighting pause.

Observations filter by the owning faction and return detached scalar records.
A lost or transferred army exposes only the stale order's known endpoints and
an unavailable reason, without refreshing its new position or name. Patrol
events are faction-owned and normal event observation filters keep them private.
Movement refusal text comes from the ordinary permitted movement query.

When a realm is at war, canonical allocation disables each enabled patrol that
selected `pauseOnWar`, clears its stale error, and emits an owner-only notice.
This happens across the roster before route-attempt limits and before theater
allocation, so an exhausted route budget cannot defer the policy transition.
Already issued active or paused travel retains its fields and continues under
the ordinary travel rules. Ordinary patrols with the default `false` keep their
existing behavior. Peace does not silently enable a paused policy; an explicit
resume after peace is required. Resuming during war is accepted as a command,
then the still-selected policy pauses again at allocation. These semantics use
the public war relation and do not add hidden-information queries.

Save validation deliberately permits an army lost, transferred or changed in
composition since its last allocation. Those accepted command boundaries remain
loadable; later allocation prunes lost ownership or reports an eligibility
override. Schema checks still reject duplicate/unordered records, nonexistent
factions, unknown endpoints, malformed reports and future attempt turns.

## Work bounds

State is bounded at 128 patrols per realm and 8,192 globally. Allocation indexes
postings/sieges and the current wars once and groups patrols by realm; character-mission checks use the
existing attachment index. Each realm gets at most eight new ordinary route
attempts per turn, with a deterministic rotating start and saved attempt turns.
The existing pathfinder still has its node limit. This supports the stated
asymptotic bound; it is not a substitute for measured Huge/Legendary evidence.

## Follow-up evidence

The reviewed simulation tests cover direct active/paused travel, standing
postings, stationary character missions, transport eligibility, hidden enemy
observation, hostile-sighting pauses, realm limits, rotation, lost ownership,
theater precedence, saves/replay and insertion-order determinism. The final war
policy tests use ordinary declarations, peace proposals/responses and explicit
resumes, check owner-only notices and exact replay, compare all active/paused
route fields across a policy pause, and reject missing/non-boolean saved policy
fields. The retained `patrol-war-policy-final.log` records **29 passing tests
across two files**; that terse log does not identify their filenames. This independent verdict
reviews the simulation tests and does not independently endorse the AI source.

The previous siege-specific acceptance suggestion is closed: the test now
records actual `setPatrol`, `declareWar` and `besiege` commands, runs patrol
allocation, and proves the siege remains unchanged with no route attempt. It
checks the observed siege blocker, exact save/reload and journal replay. This
substantiates the maintained-siege boundary without relaxing a test threshold.

No claim is made here about AI campaign pacing, browser ergonomics, whole-gate
completion or publication. Browser, full-suite and final pacing verification were
pending when this source verdict was written. The parent subsequently recorded
the completed results in [the packet](README.md), including the unresolved Long
regression; those results do not change this scoped source verdict.
