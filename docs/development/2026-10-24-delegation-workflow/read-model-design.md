# Proposed army order registry read model

Design only, 24 October 2026. Runtime work waits for the parent's next-slice go.
This refines the existing [diagnosis](diagnosis.md) without changing simulation,
AI, protocol, attention priority or source discovery.

## Proposed ownership and interface

This reviewer can own `apps/web/src/army-order-status.ts` and its pure test file.
The UI agent owns registry display/filter controls and browser acceptance;
the parent owns main/realm-window state plumbing and integration. Confirm that
division before implementation. Suggested API:

```ts
type ArmyOrderFilter = 'all' | 'standing' | 'waiting' | 'paused-patrols';
buildArmyOrderIndex(view: Observation): ReadonlyMap<string, ArmyOrderStatus>;
matchesArmyOrderFilter(status: ArmyOrderStatus, filter: ArmyOrderFilter): boolean;
```

Create an entry for every already-observed owned army. Each entry contains small
copied presentation fields, not mutable canonical references: optional posting
mode/cell/arrived/blocker; optional patrol enabled/targetCell/status/blocker;
optional route status/finalWaypoint/pauseReason; and three cohort flags. No
geography, hostile IDs, full route paths, settlement ownership guesses or new
command eligibility belongs in this projection. The UI owns display wording and
can use the existing canonical posting-name mapping.

The helper makes one owned-army ID set/map, then passes over the existing
posting/patrol/route observations. Posting/patrol faction IDs must match the
observing realm as well as a currently owned army ID. Routes have no faction
field and are admitted only through owned army IDs. Missing/lost/foreign actors
never receive rows. Historical observations without patrols simply contribute
no patrol facts. Avoid scanning `view.cells` entirely.

Cost is O(observed armies + postings + patrols + routes), with O(owned armies)
result storage and no path query, worker message or canonical mutation. The
registry can memoize the result for its detached observation and perform O(1)
lookups per row/filter candidate. Do not sort or mutate source arrays.

## Exact cohort meaning

| Filter | Membership |
| --- | --- |
| All forces | Every owned army surviving existing search/domain filters. |
| Standing orders | Any own posting or saved patrol, enabled or disabled. A route alone is not a standing policy. |
| Orders waiting | A canonical posting blocker, an enabled patrol with canonical status `waiting`, or a route with status `paused`. This is a union, not attention cause precedence. |
| Paused patrol policies | A saved patrol with `enabled === false`, regardless of route, movement, supply, embarkation or other overrides. |

“Orders waiting” describes current facts, not a new failure diagnosis. A posting
blocker can describe a transport or waiting-to-join condition; preserve its actual
wording rather than parse strings to decide whether it is bad. An overridden
patrol alone is not waiting. Disabled patrols are deliberately in their separate
cohort; an independent paused route can still put that army in Orders waiting.
Do not derive eligibility from stale `lastError` when canonical status says
ready, traveling or overridden. No automatic resume/clear is introduced.

Show posting, patrol-policy and travel facts separately. This prevents “patrol
paused” from implying existing travel stopped. Keep actual reasons available
even when another cause wins the existing next-action priority. Avoid presenting
the new list as a replacement for the attention queue.

## Pure acceptance tests

Use actual canonical reports where practical, plus explicitly labelled authored
observation contracts for combinations that isolate presentation boundaries:

- Healthy standing posting/patrol belongs to Standing orders; an ordinary active
  route alone does not. Preserve exact canonical blocker and target fields.
- Disabled patrol remains discoverable with zero movement, active travel or an
  intentional override. Paused policy and paused route remain distinct.
- An enabled waiting patrol, posting blocker and paused route each produce
  waiting membership independently and together. Higher-priority supply or
  mission attention must not erase already-reported facts.
- Ready/traveling/overridden patrols with stale last-error data do not become
  waiting by inference. No patrol capability is invented for historical views.
- Exclude foreign/missing armies and mismatched order faction IDs; never inspect
  foreign occupancy, unobserved cells or routes for absent actors.
- Verify input arrays/objects remain unchanged, output presentation facts are
  detached, empty cases work, and cell zero is preserved.
- Exercise a roster beyond 100 owned armies with desired records at the end;
  no fixed top-N cap belongs in the helper. UI keeps existing 25-row pagination.

Parent/UI acceptance composes search and domain filters, retains checked IDs and
outside-filter notices, preserves filter intent across registry → inspector →
registry, resets it on campaign replacement and respects busy locks. A real
ordinary command resolves one case, followed by exact save/replay. Pure filter
changes issue no commands/queries and do not change the campaign hash. Keyboard,
390px/130% text and the honest empty cohort remain required. This is a bounded
player workflow, not complete organic mature-empire or M3 acceptance.
