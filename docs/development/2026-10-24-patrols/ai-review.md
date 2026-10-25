# Independent patrol AI source review

Date: 2026-10-24. Base revision `d06ba4b`, with local rules-35 implementation.
The reviewer authored the separate patrol UI slice, not the AI implementation
reviewed here. This final follow-up edited review documents only.

## Verdict

No blocking AI or public war-pause source finding after re-review of the restored
persistent AI default, optional `pauseOnWar` implementation and all nine AI
patrol test cases. Campaign integration and pacing acceptance remain
the parent's separate verification task; this review does not clear an AI or
release gate.

Reviewed `packages/ai/src/patrols.ts`, its tests, the delegation helpers and home
watch adoption in `theaters.ts`, complete `planTurnWithReasons` ordering, and held
army consumers in conquest, arcane surveys, depot planning, character planning
and naval planning. Also read canonical patrol scheduling/observation to compare
AI proposals with the consumer actually executing them.

The final pass additionally read the canonical command/state schemas, war pause
and owner observation paths, the ordinary-command war/peace and route-preservation
tests, and canonical save/hash projection. UI checkbox/update wiring was checked
for integration consistency; because this reviewer authored that UI, this is not
an independent UI acceptance claim. No test suite was run during this source
review while the parent's browser and pacing work was active.

The final frozen-candidate pass rechecked default-false adoption, the full-plan
held-army propagation and all five independently callable consumers, canonical
war policy, current save projection, and the corrected synthetic historical
projection in `save.test.ts`. That helper now rejects a nonempty patrol register
before omitting the empty future field; production historical serialization and
hashing likewise call `assertNoPatrols` before projection. No blocking source
finding was identified. This remains source review, not a report that the
parent's full suite, final pacing or production checks have completed.

## Frozen source identity

SHA-256 of the inspected local files on 2026-10-24. These identify the reviewed
bytes independently of the uncommitted working-tree status; later edits require
checking the affected finding again.

| Source | SHA-256 |
| --- | --- |
| `packages/ai/src/patrols.ts` | `8af6bebc811ca7f63c9009c60aab658aa1fc7ce0d059e0ea8cba06faca4f4fde` |
| `packages/ai/src/patrols.test.ts` | `a4a9c9124b5c4589d12030a6dbb97a55432164f5e0a90571bb7f83923720bd13` |
| `packages/ai/src/index.ts` | `024d7b09390089f6d91818aa1e15e2fa5c882c6b48f8fc94fd18837879ac051d` |
| `packages/ai/src/theaters.ts` | `3e3716f381728402330d3bdb26b9dedb16f1cd38a6773c39df65178f1988dd1d` |
| `packages/ai/src/arcane.ts` | `9b622e9a996fa504b69959a1bf7a1d266132d3c395b7a51abe659f6501a0a8d1` |
| `packages/ai/src/characters.ts` | `58955d1cee1c2d894805d4ea38dba61f81c570901ce7353301cb12cbbc40b5aa` |
| `packages/ai/src/conquest.ts` | `d2a92afdf8063bb564edc26a94c3928507eebfc5657eb8092198bfc264ed042b` |
| `packages/ai/src/naval.ts` | `c9258223e224ec4f264778250ab33b81ddeafc14298ee0c4f859cad6a6cb5aed` |
| `packages/ai/src/supply.ts` | `85a3ea776267afc80a7749d4b4f27c6889e65a0272e6dfa5f93388ad0a52f835` |
| `packages/sim/src/patrols.ts` | `ee76ecf7cb7d2a41a71beea5a1df8af9d46842fa355f48d1f71789f0cac0cc15` |
| `packages/sim/src/patrol-state.ts` | `07e645f011f88bdeda89284bfffdf65365faa2de07124454c5010cab21192f89` |
| `packages/sim/src/simulation.ts` | `f629193471e393fdffb9e73c9ec8e2d5d5fae08ef6431ca5dee815cf05dd0e6b` |
| `packages/sim/src/save.ts` | `ef55189fc491bae58539b1a107100c55fa370a6f84640e455754ac1c443728c4` |
| `packages/sim/src/save.test.ts` | `038f5092ae796b561ab82d5d04ea5592b75b9c1d6fe84fd9968c9917cf0f531d` |

## Findings and disposition

One nonblocking source comment described hearth ranking as linear even though
the candidate list is sorted. The parent corrected it to “one hearth scan and
sort.” The bounded route count is not a claim of constant total planning cost:
military sorting is O(A log A), hearth sorting is O(T log T) in the worst case,
and up to two army candidates/four hearths lead to at most four route previews.
No production behavior change was requested by this finding.

## Ownership and order priority

- Patrol adoption consumes only filtered `Observation`, proposes an ordinary
  `setPatrol` command and leaves subsequent travel to canonical scheduling.
  Candidate military containers are owned combat land armies ashore, without
  founding capability or scouts. The strongest two remain field armies; selected
  spares have one formation and no attached officers/agents, route, posting,
  mission, siege, movement blocker or reorganization blocker.
- Existing enabled delegation is collected before other actor planners.
  `planTurnWithReasons` allocates a home watch first, merges the proposed watch's
  held IDs and supply-request reservations into patrol planning, then merges the
  proposed patrol's held ID before survey, depot, specialists, naval work,
  concentration/merges and ordinary army actions. New watch and patrol commands
  therefore cannot claim the same company within that plan.
- The default held helper is also used by independently invoked planners.
  Conquest excludes delegated besiegers; character planning avoids assignments,
  promotions and missions on reserved carriers; naval planning carries the held
  set into its result, which the final movement and concentration loops inspect.
  Depot and survey helpers preserve the same reservation.
- Theater adoption excludes all existing patrol members, including paused
  policies. Patrol adoption excludes all existing theater members, including
  paused watches. An existing patrol record suppresses further automatic patrol
  creation, regardless of whether that policy is enabled. The AI does not edit,
  resume or replace the saved policy.
- Pausing releases an army from *enabled patrol* reservation for ordinary AI
  activity. It does not promise immunity from future direct AI actions, merging
  or combat loss. That matches returning to direct orders; paused policy identity
  can subsequently be pruned if its army permanently disappears. Publication
  should not describe pause as freezing the army.

## Public war policy and saved configuration

The final AI source explicitly proposes `pauseOnWar: false` through the ordinary
`setPatrol` command. It adopts a nearby defensive circuit during peace and keeps
that army assigned through war. New adoption during war remains prohibited.
The reason text describes this persistence explicitly. The experimental AI
default of `true` was removed after the candidate measurements below; the public
player option remains available. There is no special mutation, AI-only scheduling
branch or automatic resume command. A manually configured policy, including a
paused one, still suppresses adoption; the AI neither changes its option nor
resumes it.

The command boolean is optional and omission resolves to `false`. Canonical
patrol records and observed patrol records require a real boolean. The save
projection parses the complete patrol record, and it participates in the normal
current-version payload/hash. Historical saves acquire an empty patrol roster;
they do not acquire a newly enabled policy. Rejecting a missing boolean inside
a current-version patrol record is intentional strict validation, distinct from
the command's convenient default.

During canonical patrol advancement, one set built from the current war pairs
identifies affected realms. Before any new route attempts, enabled policies with
this option are disabled, their stale error is cleared and an owner-only notice
is emitted. The pass does not change their endpoints, target, attempt timestamp
or issued route. Existing movement runs earlier in the turn, so war does not
retroactively stop travel. The extra scan is O(wars + patrols); it does not add
route queries or bypass the eight-attempt realm budget. Disabled policies emit no
repeated war notice and remain paused after peace. Explicit resume while still
at war pauses again on the next allocation phase.

The canonical tests use ordinary declarations of war and peace responses after
authored contact. They compare an opted-in patrol with an ordinary default-false
patrol, check that the latter continues, verify owner-only events, pause again
after a wartime resume, and verify explicit resume after peace plus exact replay.
A separate direct-phase case compares every active and paused route field before
and after war pausing and rejects missing/nonboolean saved policy values.

The ninth AI case does more than inspect a reservation set: it first asserts
default-false adoption, then explicitly replaces that configuration with a public
player command selecting `pauseOnWar: true`. After declaration and End turn, it
asserts the former patrol army receives an ordinary actor command from the
complete wartime planner. Every proposed command is then
accepted in both original and reloaded games, with matching results/state hashes
and recorded replay. This supports release back to ordinary planning; it is not
proof of the strategic quality of those choices or campaign pacing.

For the UI consistency check, a new checkbox initializes false and an existing
one reads the observed value. `Update patrol` submits the current checkbox and
preserves the existing `enabled` state, so changing this option on a paused
patrol does not itself resume it. Like all `setPatrol` updates, it resets the
next-target/attempt bookkeeping while leaving existing travel alone. The browser
case authors a true option and checks its saved/exported value and reopened
checkbox; the default case checks an initially unchecked control. The lifecycle
case was then extended to check the option on an already paused patrol, submit
`Update patrol`, and wait for observed `pauseOnWar: true` and `enabled: false`
before continuing its stationary-turn/resume/recovery checks. The retained
[browser policy log](browser-policy.log) records the revised lifecycle passing
in 13.3 seconds (14.0-second run). This specific result does not claim all browser
or release coverage passed.

## Reachability and bounds

The planner adopts one nearby circuit during peace and stops new adoption during
war, battle, capture resolution or victory. It selects at most two spare armies
and four nearby owned hearths, limits hearth pairs to six hexes apart, and asks
the ordinary permitted movement preview about both destinations. Only queued
movement is accepted, never an attack/besieging action. Per-plan preview caching
and the four-query limit are explicit; failed searches do not raise the budget.

Both previews start from the company's current observed position. On unchanged
land connectivity, they establish two observed safe approaches. They are not a
literal endpoint-to-endpoint search or a guarantee that a later search fits its
node budget after geography or military occupancy changes. Canonical patrol
refusals and paused routes remain the later authority. The source reason says
“two observed safe approaches,” which accurately describes this evidence.

The inspected AI tests cover actual repeated visits to both endpoints across
ten turns, deterministic proposals after reload, complete recorded replay,
disjoint watch/patrol adoption, reserved specialist behavior, route/posting/paused
watch exclusions, a four-query island failure and identical proposals after
unseen terrain/foreign-force changes. These are authored cases, not organic
campaign competency or sustained scale proof. They were read during this review;
the parent's test logs own execution results.

## Historical behavior and remaining proof

Historical rules-34 observations omit `patrols`. Adoption then returns no command
or preview; the new delegation helper reduces to the previous enabled-theater
set. The additional committed arrays are empty, and merging held sets adds no
actor or output ordering. Source inspection found no historical policy branch
changed by the new optional field. Exact history and paired campaign evidence
are still required; source equivalence is not a replacement for those results.

The retained [initial pacing packet](pacing-initial.json) completed Standard,
Long and Epic at 236/335/374 turns under the first rules-35 candidate versus
233/311/349 under genuine rules 34. There were no submitted or automatic patrol
refusals, but the adverse Long result (311 to 335) remains material. That candidate
kept patrol armies reserved during later wars.

The [war-pause AI experiment](pacing-war-pause.json), also retained with its
[execution log](pacing-war-pause.log), measured Standard/Long/Epic at 243/375/427
for the same headline seed. It also had no submitted or automatic refusals, but
its campaign lengths were worse than the initial persistent candidate and Epic
exceeded the stated 350–400 target. These are candidate measurements, not a
controlled proof of which individual wartime decisions caused the difference.

The final source therefore restores persistent AI adoption while retaining the
optional public player policy. Prices and proxy bounds remain unchanged. The
final persistent-source remeasurement was still pending at this review; the
initial 236/335/374 result must not be presented as execution of that final
source. Neither the source findings nor either candidate packet grants blanket
pacing acceptance, multi-seed acceptance, organic adoption proof or closure of
DH-021. The original Long regression remains visible pending the final evidence.
