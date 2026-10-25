# Delegation workflow diagnosis

2026-10-24. Read-only source review while patrol retirement publication is being
prepared. Reviewed the repository core and UI-scale skills, implementation
status, actual registry/attention wiring, individual posting controls, canonical
posting/patrol reports and existing focused tests. No runtime edit, discovered
test, browser run or heavy measurement was performed for this diagnosis.

## Priority one: an individual posting form can display a different destination from the command it sends

[`ArmyPosting`](../../../apps/web/src/postings.tsx) stores a numeric `cell` with
`useState(posting?.cell ?? points[0]?.cell ?? army.cell)`. Its dropdown options are
the army's **current** position and **currently owned** hearths. Its Update/Post
button is disabled only when busy, and dispatches the stored numeric cell.
The component is keyed by army ID, so refreshing the same army's observation
does not reset that state.

If a chosen hearth disappears from the owned list, or an option representing the
army's former current position disappears after travel, the retained numeric
value no longer matches an option. The installed React DOM `updateOptions`
implementation selects the first non-disabled option when a controlled value
has no match. The rendered select can therefore show “Where it stands” while
the button still sends the stale earlier hex. Canonical `setPosting` accepts an
explored target without requiring it to remain an owned town, so simulation
validation is not a reliable backstop for this presentation mismatch.

The same family of mismatch is possible in `SettlementMuster`: its numeric
selection can outlive a removed owned hearth while the select displays another
option. Both components live in the same source file. Existing canonical orders
may legitimately retain arbitrary hex targets; an unavailable dropdown choice
must not silently turn a displayed choice into a different command.

The group posting form already avoids this through
[`groupPostingDestination`](../../../apps/web/src/group-postings.tsx), which
renders an unresolved choice, disables new posting application and leaves Clear
available. The individual forms do not use an equivalent guard.

This is a source-supported defect hypothesis, including the installed React
fallback behavior; it has **not yet been reproduced with a browser interaction
or failing discovered test**. Capture that reproduction after retirement is
published before changing the form. This should precede a new registry feature
because it affects whether a visible order says what the player is issuing.

### Bounded fix acceptance

1. Mount/open a real individual posting form with a selected owned hearth, then
   update the same army observation after that choice disappears. The displayed
   value must be explicitly unresolved, with an accessible explanation and a
   disabled Update/Post button until a fresh choice is made. It must issue no
   stale or fallback destination command. Retain fail-before evidence.
2. Exercise an army moving away from an initially selected current-position
   option. Choose a clear presentation policy: either “where it stands” is an
   explicit current-position intent resolved on submission, or the old fixed
   position remains explicitly named. Do not silently display one and send the
   other.
3. A saved posting at a hex not represented by current owned-hearth options must
   remain visible in its canonical summary and clearable. Clearing is independent
   of destination-form validity; it must preserve existing travel.
4. Apply the same explicit-choice principle to muster controls, with fresh owned
   target selection and clearing still available. Preserve numeric hex0 handling.
5. A valid explicit posting/muster still uses the existing command path, retains
   exact saves/replay, and works with keyboard,390px layout and enlarged text.

Likely owned files: `apps/web/src/postings.tsx`, a focused new
`apps/web/src/postings.test.tsx`, and a scoped gameplay/production journey.
Parent owns integration/status/dispatch. No sim/AI/schema changes, re-priced
campaigns or new protocol are indicated. If the implementation instead needs a
new canonical behavior, return to scope review rather than hiding it in UI code.

## Next useful M3 feature: list delegation state, including deliberately paused policies

### Exact existing behavior

[`realm-navigation.tsx`](../../../apps/web/src/realm-navigation.tsx) presents25
owned rows per page. Search matches name and stable ID only; force filtering
offers all, land ashore, fleet or embarked. Sorting is ID or name. The row shows
patrol target/paused text and blocker, plus active/interrupted route text. It
does **not** show the individual standing posting destination, arrival mode or
blocker. There is no order/delegation filter.

The current [next-action system](../../../apps/web/src/next-action.ts) already
groups and cycles causes. “What wants a decision” buttons jump specifically to
stalled postings, interrupted routes, stalled patrols or supply problems; adding
another button that cycles those same candidates would duplicate working UX.
An army receives one priority cause: supply precedes posting, paused route then
precedes patrol. Disabled patrols are deliberately omitted from the patrol map.
Healthy delegated armies leave generic idle navigation; disabled policies may
appear merely as ordinary available movement, and zero-movement/active-route
cases may not appear at all. Mission, siege and embarked actors are excluded from
generic attention even though their saved policies still exist.

Consequently a player cannot ask the registry “show every paused patrol policy
so I can decide which to resume after peace”, or compare all waiting patrols
and posting reasons, without knowing names/IDs or paging the full army roster.
Attention cause precedence also means “stalled patrols” is not a complete list
of patrols waiting behind higher-priority supply/route issues. That precedence
is useful for urgency; it should not be repurposed as a complete order inventory.

### Small playable outcome

Add an **Orders** filter to the existing army registry, with a pure owned-only
presentation projection of the already canonical patrol/posting/route reports.
Suggested first choices are All forces, Standing orders, Orders awaiting review,
and Paused patrol policies. Labels must distinguish a paused future patrol policy
from an interrupted current travel route.

- Standing orders: any own patrol or posting record, including explicitly
  disabled patrols and intentional overrides. Do not imply every delegation is
  failing.
- Orders awaiting review: own enabled patrol whose canonical status is`waiting`,
  own posting with a canonical blocker, or a paused ordinary route. Union these
  facts without discarding one because supply has higher attention priority.
  Show each actual reason in the row; do not invent retirement eligibility or
  path safety in the UI. An intentional mission/transport override may be shown
  in Standing orders rather than labelled a defect.
- Paused patrol policies: own saved patrol with`enabled:false`, regardless of
  current movement, active/paused route, supply or direct assignment. Keep the
  wording explicit that already issued travel is a separate order.

Expose counts for the chosen cohort and preserve25-row pagination. Search/domain
filters compose with the new order filter; group checked IDs retain their
existing cross-filter behavior and the “outside this filter” explanation. The
filter itself must not select armies, issue worker requests, change campaign
state or silently fill a command target. A row selection can use the existing
map location and Show selected orders flow; a separately labelled Review orders
shortcut is optional if it genuinely opens the existing inspector directly.

This is a presentation read model, not a new simulation rule or protocol
payload. One indexed pass over already received own army/order observations is
sufficient; do not add pathfinding, global state access or worker world copies.
Canonical report text remains authoritative. Historical observations without
patrol capability can still show postings/routes and must not invent patrols.

### Complete acceptance, without duplicating the idle queue

1. In a clearly authored100+army fixture, create real enabled and disabled
   patrols, an ordinary interrupted route, a stalled posting and healthy orders.
   Put the desired case beyond page1. From the registry, filter directly to its
   cohort, read the cause and locate its existing orders without cycling unrelated
   armies. Include a paused policy with an active route or no movement: this is
   the outcome the existing patrol attention group cannot provide.
2. Preserve visibility/privacy and existing attention priority. The registry
   can list the same army in the relevant cohort while the urgent attention
   cause remains supply or route interruption. Do not change those causes simply
   to make the new list match.
3. Review and explicitly resolve one case through its actual existing Resume,
   Cancel, Update or Clear command. Verify the distinction between pausing/removing
   future patrol assignments and stopping a current route, then exact save/load
   and exported command replay. No bulk-resume or new AI policy is needed.
4. Filtering/search/sorting/pagination changes neither canonical hash nor worker
   command/query/transfer counters. No hidden foreign order enters the list.
   Query counts do not grow with roster size. Only25entity rows render at once.
5. Filter intent survives closing the registry to inspect an army and returning,
   but resets appropriately on campaign replacement. The current registry modal
   unmounts on selection; keep this filter alongside existing parent-owned search
   and force state if persistence across that round trip is required.
6. Checked IDs survive filter changes and remain bounded; explicit group Apply
   still advertises outside-filter selections. Removing the last matching case
   produces an honest empty state and allows clearing the filter. Keyboard focus,
   busy-command locks,390px and130%text controls remain usable.

### Proposed ownership and exclusions

- UI/read-model delegate: a small `army-order-status.ts` presentation helper,
  `realm-navigation.tsx` row/filter integration and corresponding unit tests.
  The helper derives display/filter fields only from canonical observations.
- Parent integration: `realm-windows.tsx`, `main.tsx` filter lifetime/reset and
  optional inspector navigation; preserve existing group and attention contracts.
- Browser delegate: a scoped authored mature workflow and one production journey
  for normal controls/save recovery, with actual screenshots and transfer/hash
  invariants. Coordinate a quiet server/source window for those checks.

Do not modify sim/AI/save/protocol merely to add this inventory. Do not introduce
automatic patrol resumption, deletion, endpoint capture inference, a new idle
priority rule or an all-order bulk command. No broad M3/GateI completion follows
from this slice; organic mature-realm acceptance, escorts, longer programs,
governors, DH-021 and all fifteen release gates remain open.
