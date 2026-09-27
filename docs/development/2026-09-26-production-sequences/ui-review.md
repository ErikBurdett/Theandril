# Production sequences: independent UI source review

Reviewed the frozen UI candidate on 26 September 2026. This reviewer authored the
personal production-template store and the two gameplay browser scenario files;
those implementations are not independently reviewed here. The independent scope
is the separately authored production editor, template-library UI, registry/window
integration and their styling. Main-thread integration was read to establish the
campaign lifetime boundary, not to replace the separate transport/main review.

## Verdict

No blocking finding in the reviewed UI source. It implements the explicit
selection → editable sequence → Apply flow in [ADR 0043](../../architecture/0043-production-sequences.md),
and its personal-library operations do not issue production orders. This is a
source-review verdict, not browser or release acceptance. The separate
[storage/main review](storage-main-review.md) records transport-recovery findings
and their resolution; those must be assessed independently before publication.

The UI author confirmed the reviewed source was frozen and reported sixteen
focused checks passing: nine new production/library checks and seven existing
registry checks. This reviewer inspected the new tests but did not rerun them,
launch browsers or run a full suite. Final execution evidence belongs in the
parent's retained logs.

## Editor, selection and partial results

- [`group-production.tsx`](../../../apps/web/src/group-production.tsx) starts with
  an empty list, limits it to five known items, forbids duplicate buildings and
  permits repeated recruitment. This validates the editor's shape; ownership,
  price, prerequisites, existing buildings and queue capacity still belong to
  canonical `queue` commands. Current blocker text comes from the observed
  production quotes rather than a second eligibility implementation.
- Reordering and removal change only the local draft. The request copies its item
  list and selects only observed owned hearths, in stable ID order, bounded at
  128. The UI shows treasury, nominal per-hearth/selection cost and existing queue
  counts, and explains that queued prerequisites do not finish while the list is
  appended. It makes no future-affordability promise.
- [`realm-navigation.tsx`](../../../apps/web/src/realm-navigation.tsx) reuses the
  existing hearth checkbox set and saved-group Recall. Army and hearth selections
  remain separate. Busy production locks membership changes and other group
  actions. Search, sort and pagination operate on the display without changing
  the submitted snapshot. No new selection register or campaign metadata is added.
- Completion requires an accepted result for every item in the submitted order.
  Only those complete hearths leave the selection. Partial/refused hearths remain
  checked; the visible summary distinguishes completed hearths, accepted orders
  and refusals. Expandable rows show the attempted prefix, canonical refusal and
  number of later items not attempted. Results retain the submitted item list and
  names, so editing the next draft cannot relabel the prior outcome.
- The pending ref prevents duplicate submission before React has rendered the
  pending state. The component does not retry a rejected promise or an ordinary
  refusal. Accepted prefixes are explicitly described as already paid and queued.
  A second manual Apply submits the current whole list: it is not a resume action
  and can append an accepted unit again if the player leaves that prefix in the
  draft. The review/correction warning accurately describes this remaining manual
  responsibility; the slice does not implement per-hearth retry plans or rollback.

## Personal-library and asynchronous lifetime

[`production-templates.tsx`](../../../apps/web/src/production-templates.tsx) has no
campaign-command dependency. Choosing a saved entry changes the library selection
and name only. Explicit Recall copies its ordered IDs into the editor. Save and
Update snapshot the current item array before awaiting storage; Delete changes
only the personal library. The separate Apply button is the only path from this
editor to the worker callback. The browser/origin and campaign-export boundary is
stated next to the library controls.

An initial malformed/denied read keeps the library unready, displays an alert and
retains the error instead of treating storage as an empty library. Library pending
and error state do not propagate into the direct editor's busy state: editing and
Apply remain usable while a preference load/write waits or fails. Active campaign
work still locks both sets of controls. A successful write followed by a failed
list refresh reports that the change **was saved**, then requires Retry; it does
not invite an immediate duplicate write under a false failure message.

Retry closes the idle old session and constructs a fresh store, avoiding Dexie's
cached failed-open connection. Every asynchronous state update checks both session
identity and active status. Cleanup retires a session immediately, allows an
already-started transaction to settle, then closes its connection. A late result
from a retired session cannot update a replacement panel. The effect cleanup/setup
and identity checks also cover React StrictMode's development effect cycle.

The production component ignores results after its own unmount. The parent rejects
pending group requests when a campaign resets, closes the management window and
increments the registry key; the new campaign therefore receives a fresh editor
and checkbox state even if IDs are reused. The main callback snapshots the request
and guards pending group work before posting. This review traced these boundaries
in [`main.tsx`](../../../apps/web/src/main.tsx) and
[`realm-windows.tsx`](../../../apps/web/src/realm-windows.tsx); detailed malformed
reply and worker-failure handling is covered by the separate main review.

Navigating away from the production panel discards its local draft/results.
Already-submitted canonical work and a started personal write may still finish.
That navigation neither cancels a paid command nor automatically repeats it; the
current queues and saved personal library are the durable results.

## Accessibility, scale and evidence limits

The source uses labelled native selects/inputs, native details/summary controls,
explicit one-based move/remove button names, status announcements and alert text.
Move buttons disable at list boundaries. Existing registry tabs retain keyboard
navigation. The [styles](../../../apps/web/src/realm-navigation.css) provide
44-pixel control targets, visible summary focus, wrapping names and a single-column
sequence row below 600 pixels. Result and queue lists have bounded scroll regions;
the editor is bounded at five rows and the personal library at twenty-four entries.

These source properties support keyboard and narrow-screen use but do not prove
visual layout, focus behavior or browser accessibility. The separately authored
[40-hearth/100-owned-army journey](../../../tests/gameplay/production-sequences.spec.ts)
and [storage-recovery journeys](../../../tests/gameplay/production-template-recovery.spec.ts)
are intended to verify actual controls, explicit Recall/Apply, paid ordered queues,
partial refusals, export/save restoration and unavailable or malformed storage.
Their mature world is an authored fixture, not an earned campaign or a generated
campaign-pacing sample. This reviewer authored those scenarios and claims no
independent browser result from them here.

Rules/save32, content prices, ordinary single-hearth queues and canonical charter
behavior are unchanged by this UI. This source review does not close ACT-32/M3 or
any of the fifteen release gates.
