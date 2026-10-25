# Registry order filters: browser acceptance design

Prepared 24 October 2026 while dispatch16 is reviewed. This is a design, not a
discovered test or a claimed passing journey. No runtime or fixture source changed.
Use the final labels and local filter lifetime in `registry-integration-notes.md`:
All forces, Postings and patrols, Orders waiting, Paused patrols. Closing and
reopening the registry resets the order filter to All forces; search and force
retain their existing parent behavior. Do not assert the superseded persistent
order-filter proposal from the original diagnosis.

## Fixture and authority

Start from the existing explicitly authored `theaterCampaign(101)`, preserving
its honest open-land, infrastructure and treasury setup. Sort the owned actors by
the registry's stable ID order, then choose the last actor as the paused-policy
case. It must begin beyond the first 25 rows. Give distinct test actors memorable
names for selectors, without relying on list indices after filtering.

Use actual `setPatrol`, `setPosting` and `queueMovement` commands to establish
orders. The key last actor has a disabled saved patrol, zero movement and an active
ordinary route: declare its exhausted movement as authored initial state before
issuing the valid queue command. Strict-save and reload the resulting campaign,
then assert the actual observation reports all three facts. This is deliberately
prepared state, not a claim that 101 armies were recruited through normal play.

Add a separate actual posting away from its current location and derive its waiting
membership from the canonical report. If an interrupted-travel row is needed,
use an explicitly authored displacement followed by canonical `reconcileMovement`
as in the retained patrol-recovery fixture, or an ordinary legal obstruction
sequence. Strict-save that result and record the exact canonical reason. Do not
inject a hand-written route reason into the production browser observation.
Keep authored observation-only privacy/foreign-record contracts in unit tests.

Before browser use, verify each fixture's exact expected counts after search/domain
filtering. Import through the public campaign file control. Development journeys
may inspect existing test hooks for read-only hash/query/transfer counters;
production must prove those hooks absent and use exported saves/archives instead.
No new hook, hidden state transfer or browser-only gameplay command is required.

## Three bounded journeys

1. **Find and resolve the paused policy.** Open the army registry, verify 25 rendered
   entity rows and the last actor's absence. Choose Paused patrols using the real
   labelled select; inspect the one matching actor's separate paused-policy and
   active-travel facts despite zero movement. Locate it and open its existing
   Selected orders inspector. Resume the patrol through the actual existing
   button. Compare exported state before/after: only the ordinary policy command
   changes the relevant policy; the current route is unchanged. Reopen the registry,
   confirm the documented All forces reset, then choose Paused patrols again and
   see its honest empty cohort. Export/replay and manual save/reload must preserve
   exact canonical state and archive. Do not advance a turn merely to make the
   resumed policy issue a new route.
2. **Browse and compose selections without ordering.** Begin with All forces;
   check one ordinary actor, choose Postings and patrols and verify the existing
   outside-filter notice. Select matching, return to All forces and verify the
   original checked ID remains. Exercise search and land/fleet domain filters so
   counts describe the search/domain cohort before order filtering, including an
   empty result. Sort and page while retaining the 25-row bound. If a pending
   group preview is established, confirm order filtering is locked until the
   existing public cancel resolves that review. Filtering must add no command or
   path query; compare the pre/post campaign hash and exported command records.
   Navigation may legitimately issue its existing inspection requests, so isolate
   the filter-only counter assertion from inspector opening.
3. **Read waiting reasons at 390px and 130% text.** Use Orders waiting to show the
   actual posting and interrupted-route reasons independently, with one row per
   actor even if multiple facts qualify. Use keyboard focus and select operation;
   verify all four labels, counts, row action and empty-state recovery are visible
   without horizontal overflow. Capture native viewport pixels after scrolling
   relevant controls into view. Open Settlements and verify the army-order control
   is absent. Import the same campaign into the mounted app and confirm an honest
   initial registry state. Include one production run with real worker/saves and
   development hooks absent; do not treat a static render as this journey.

## Evidence and limits

Retain any fail-before/failing browser output and exact source hashes. Capture a
desktop filtered inventory and narrow enlarged-text waiting/paused controls,
with the fixture and visible state identified in captions. Review actual pixels.
Do not infer an organic empire-management gate from a 101-actor authored campaign.
Filter behavior must preserve existing attention priority, canonical reason text,
disabled policy intent, route ownership and checked-ID limits. No new bulk resume,
automatic recovery, AI policy or canonical blocker is part of this slice.

Functional browser elapsed time is execution metadata. If the indexed read model
becomes a hot-path acceptance claim, measure it separately with source hashes and
an exclusive CPU window; browser timings or the 25-row DOM bound alone do not
establish whole-world rendering or worker-transfer performance.
