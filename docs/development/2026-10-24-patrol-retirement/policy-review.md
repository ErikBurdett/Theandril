# Captured-endpoint retirement: pre-implementation policy review

2026-10-24. Documentation-only preparation while the preceding publication is
being verified. No runtime code, discovered tests or measurements changed in
this review. Canonical patrol code was previously authored by this reviewer;
the next AI policy and its integration belong to the parent.

## Evidence and narrow defect

Read the [focused diagnosis](../2026-10-24-pacing-readiness/endpoint-retirement-diagnosis.md),
[fail-before artifact](../2026-10-24-pacing-readiness/endpoint-retirement-fail-before.json)
and its standalone script. The genuine corrected Long turn150 snapshot has hash
`4f60f2e3` and raw SHA256
`e8b68f936e8f7042f04465f879e669ef038cc27a9c927781fe368075a9e92b25`.
Wardhall's army408 has an enabled persistent patrol, one still-owned hearth at8431,
and selected endpoint9108 now visibly owned by Ashen Compact after an ordinary
recorded capture. Its existing single-leg route is paused. Ordinary preview
requires siege and refuses queued travel; the full AI plan retains the army's
delegation reservation and gives it no actor command.

The isolated existing `clearPatrol` command succeeds, preserves every route
field, removes the patrol reservation on a fresh observation and saves/replays
at hash`567fe8e9`. This identifies a future-order cleanup gap, without proving
what military action the released army should take or any campaign-duration
effect. The standalone script's negative controls use actual disable,
war-pause-policy and different-direct-route commands. Their retained results
are evidence read here, not independently re-executed checks.

## Recommended minimal policy

Accept the parent's narrow proposal, subject to implementation review:

- Only an enabled, own, persistent (`pauseOnWar:false`) patrol with a living
  owned combat land army ashore is eligible. Keep the adopted home geometry:
  endpoint separation at most six hexes, both distinct.
- Require an existing paused route with exactly one waypoint, equal to the
  patrol's selected target. That target must be a currently visible foreign
  settlement, while the other endpoint is an owned settlement. Require positive
  observed ownership and current cell visibility; do not infer capture from a
  missing own-settlement row or remembered border ownership.
- Preserve postings, sieges, active character missions and global pending
  battle/capture/victory decisions. Preserve active routes, different targets,
  multiple waypoints, no-route records, disabled patrols and explicit war-pause
  policies in this first slice.
- Issue only ordinary `clearPatrol`. Do not cancel or resume travel, attack,
  rewrite points, enable another policy or immediately adopt a replacement.
  Retain the actor in this planning batch's held-army set; release it only from a
  fresh post-command observation. A later movement decision is a separate order.
- Retirement and existing safe recovery share at most four commands per pass
  and deterministic rotation. Retirement itself requires no route preview or
  hidden-state query. Reuse one observed army/route/settlement/visibility index
  rather than scanning the world for each of up to128 patrols.

The new cleanup predicate should be evaluated separately from safe recovery's
positive movement and supply requirements. Clearing a future circuit spends no
movement and does not move an unsupplied army; inheriting those recovery guards
could leave precisely the exhausted or depleted army reserved indefinitely.
Canonical `clearPatrol` only requires ownership of the record. This proposal's
extra combat/domain/override restrictions are deliberately narrower AI policy,
not new canonical command legality.

Requiring current foreign ownership does not require war: ordinary travel cannot
enter a peaceful foreign settlement either. Nearby observed enemies are a reason
not to resume a route, but do not make deletion of the obsolete future circuit
unsafe. Retirement must not turn those observations into an automatic attack.

## Ownership, fog and compatibility

There is still no provenance distinguishing an AI-adopted home circuit from an
identical manually configured circuit. `pauseOnWar:false` narrows the policy but
does not establish origin. The authority is explicit AI control of the faction;
state this limitation in the source, tests and publication. Ordinary player
canonical turns must retain the same configuration absent an explicit clear.

`getObservation` includes own settlements and currently visible foreign
settlements. Checking its foreign target row already uses permitted knowledge;
checking the target cell's `visible` flag additionally makes the policy's intent
explicit and guards synthetic/stale client observations. Never consult canonical
foreign ownership from the planner. Missing, razed, hidden, distant or both-lost
endpoints remain outside this initial policy rather than becoming speculative
cleanup cases.

No canonical rule/schema/version change is needed: `clearPatrol`, observations,
saved configuration and journal recording already exist. Historical observations
without patrol capability must keep their old plans; recorded old commands must
replay unchanged. Endpoint retirement does not resolve DH-021, justify revised
prices, or close any release gate. The preceding early Epic results and original
Long delay remain part of the comparison, even if a later candidate improves one
seed.

## Implementation and regression checks still required

The generated positive witness must fail before the planner change and pass
afterward with full-plan reservation, unchanged current route, ordinary command
acceptance, exact independent results, save/load and journal replay. Preserve its
genuine source hash. An authored real capture journey can supplement it without
claiming authored geometry is an earned campaign.

Negative tests should isolate disabled and explicit-war-pause policies,
no/active/different/multiple-waypoint routes, owned/hidden/missing target hearths,
foreign or missing armies, founding composition, hulls, embarkation, postings,
sieges and missions. Include local observed threats to prove cleanup never
becomes resume or attack. Hidden-owner mutations must leave permitted plans
identical. Test four total commands for mixed recovery/retirement candidates,
stable reordered inputs and fairness across128records. The full-plan actor
assertion must cover merge source/target and attached characters as well as
`armyId`. Current-route preservation must be asserted at the clear boundary,
not only after a later turn which may legitimately issue new orders.

## Initial runtime source review

The parent subsequently implemented retirement in the existing
`packages/ai/src/patrol-recovery.ts` and shared the unchanged six-hex adoption
constant with `patrols.ts`. Inspected SHA256 values:

- recovery module after the comment clarification below:
  `e4adc2d2f0323db4a38eb62a4cf6b77e40462bdc5386b4efc2eabf8d1bd97dc2`
- patrol integration:`7119881ed29d16c6f1c60d45a980cbb3ba2a7871590329fedb10ff2e1fd965f0`

No blocking guard, fog, ownership or route-preservation defect found in this
source review. The common eligibility retains own enabled/waiting patrols,
combat land identity ashore, explicit overrides and the exact paused sole leg.
Retirement requires persistent policy, a positive foreign-settlement row at the
target, an owned other endpoint, six-hex geometry and explicit current sight.
It occurs before movement/supply/nearby-threat recovery checks, correctly treating
cleanup as an administrative command. Existing safe resumption keeps its prior
additional guards. Both actions share the four-command bound and stable rotation;
the existing four-query limit can end a pass before a later cleanup candidate,
but rotating the first record preserves eventual review without expanding work.

The visible-cell set is built lazily, once per planner call, only after finding
a foreign-target candidate. This adds an O(observed cells) scan to those calls,
not a per-patrol world scan. Ordinary safe recovery does not build the set.
The source does not mutate observations or clear records itself; it proposes
ordinary commands and retains the `heldArmyIds` constructed before this branch.
No canonical, schema or worker-seat permission change was introduced.

The parent corrected the inherited opening comment to distinguish safe resume
(which preserves policy) from retirement (which can clear it). Readback confirms
this is a comment-only correction; the updated source hash above records its
exact bytes without implying a gameplay change.

An initial Huge verification-only tool run passes strict setup/save boundaries,
four ordinary clears, zero queries, exact preservation of all128routes,128held
actors in the batch and124in a fresh view, independent command results, journal
replay and exact saved bytes. [Initial verification](fixture-positive-initial.json)
records no timing samples. Its507observed cells are an explicit limitation:
this does not stress the new visibility scan over a mature fully charted world.
The parent explicitly chose fully charted Huge/Legendary worlds for all six
final cases, preserving restricted current sight and the initial preflight.
Remaining
fixture cases, final test evidence, benchmark acceptance and campaign effects
are not inferred from this single source/verification checkpoint.

## Focused acceptance readback

The implementation team's [final focused log](tests-final.log) passes42tests in
three files, including24retirement tests. Read the completed test source and
[test review](tests-review.md). The genuine witness is executed through whole
ordinary AI batches, with exact command mirrors, route preservation at cleanup,
post-clear reservation release, save/load and replay. A separate real theater
assignment demonstrates that removing a patrol does not release another
enabled delegation's reservation. Actor assertions include merges and attached
character references.

The initial integrated assertion demanding immediate movement was too narrow:
the next genuine full plan legally spends coins surveying with the released
company. The corrected test retains that paid action, ends the turn, then checks
the later complete plan's actual movement. It does not suppress survey proposals
or change runtime behavior to satisfy a travel-only expectation. The failed
initial log remains retained.

Four-command retirement fairness and mixed retirement/resume budgeting are
separately exercised by synthetic observation rosters. Their assertions are not
represented as canonical saved campaigns. Positive current visibility, hidden
stale knowledge, direct-order mismatch, explicit policies, geography and
mission/siege controls cover the new policy boundary. Optional retirement-branch
duplicates of every generic actor eligibility negative were suggested but not
added: the common actor predicates remain unchanged and existing recovery tests
cover those eligibility checks. This is a stated coverage limit, not a source
defect or a claim that such duplicate tests passed.

No new blocking implementation finding arises from this test readback. The
reviewer did not independently rerun those tests. Final fully charted benchmark
results and whole-campaign acceptance remain separate evidence.

## Final benchmark and scoped verdict

The reviewer authored and ran the six-case benchmark after the parent released
an exclusive CPU window. All cases pass on fully charted Huge/Legendary worlds,
with actual restricted current visibility. This is direct verification by the
tool author, not an independent review of that same benchmark implementation.
The [measurement notes](benchmark-notes.md) record full scope and exclusions.

Visible foreign-target planner medians are1.832/2.794ms for196,608/307,200charted
cells. Hidden and owned controls are0.248/0.264ms on Huge and0.446/0.455ms on
Legendary. Every case makes zero route queries. Positive cases issue four ordinary
clears and keep all128routes exact, retain128batch reservations and release only
the four cleared patrol reservations in a fresh observation. Negative cases
retain all128records without commands. Command mirrors, saved bytes, hashes and
journal replay pass in all cases. Final source fingerprints match the runtime
hashes above; all ten recorded benchmark source hashes are unchanged.

**Final scoped source/policy verdict:** no blocking correctness, fog, provenance,
route-ownership, bounded-work or saved-command finding in the inspected change.
Administrative cleanup and safe recovery remain distinct ordinary AI decisions;
canonical player behavior is unchanged. This fixes the demonstrated obsolete
reservation condition, not every obsolete patrol or a guarantee of better
strategic choices after release. Campaign pacing and the open DH-021/release
gates require the parent's separate retained evidence and remain outside this
verdict.
