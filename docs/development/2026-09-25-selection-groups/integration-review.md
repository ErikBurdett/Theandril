# Saved selection groups: independent integration review

Reviewed the local rules/save32 candidate on 2026-09-25. The reviewer authored
`selection-groups.tsx` and the registry integration, so independent review covers
the separately authored canonical implementation, save/history boundary and
main-thread/worker response handling. UI observations below are author
self-review. Browser, benchmark and final full-suite results remain separate.

## Finding and resolution

**P2, corrected: malformed saved-group state could report success before a React
render failure.** The main state handler originally accepted a matching saved-group
response after updating the renderer, without validating
`observation.selectionGroups`. Deleting that field or replacing it with `null`
in the first real `setSelectionGroup` worker state would pass the handler and
resolve the pending edit; the subsequent registry render called `.filter` outside
that handler's try/catch and could fail instead of presenting recovery.

The parent added
[`assertSelectionGroupResponse`](../../../apps/web/src/selection-group-response.ts)
before state presentation or request completion. It requires a bounded array of
owned groups with valid display fields and bounded distinct string memberships.
Missing, malformed, foreign and oversized records now enter the existing recovery
catch/finally path. A matching edit is rejected, pending work ends, and additional
orders require restoring a saved campaign. The validator does not decide whether
a member can receive an order; canonical membership validation remains in the
simulation.

The reviewer inspected the corrected call placement and independently reran its
regression test. The original reproduction remains suitable for a real-worker
browser fault injection: alter only the first saved-group response's metadata,
verify that no success is announced and gameplay is locked, restore a manual
save, then retry normally. That browser execution is assigned separately.

## Canonical state, ownership and lifecycle

- The two new ordinary commands validate through `packages/sim`. Creates need at
  least one member; updates may retain an empty group. The combined per-realm cap
  is twenty-four groups, each with at most 128 members and a trimmed name of at
  most forty characters. Duplicate names are rejected case-insensitively within
  a realm and kind. Updating cannot change kind or commandeer another realm's
  group, and refusal precedes mutation.
- Canonical memberships are sorted, distinct and owned. Army groups contain land
  armies, including embarked land armies; fleets are rejected. Hearth groups
  contain owned settlements. Group IDs use their own monotonically increasing
  counter, preserving subsequent army/formation/settlement identifiers.
- Own-group observations copy both records and member arrays. Foreign groups are
  absent, and group event messages retain the existing faction event filter.
  Editing a returned observation cannot rewrite campaign groups.
- Lifecycle pruning removes missing or no-longer-owned members after founding,
  merging/transferring away a source army, capture, end-turn processing and battle
  completion. Empty groups survive for later editing. Embarkation retains land
  members; split children and merge receivers are not silently enrolled.
- Pruning traverses the bounded group register, not the world or army collection.
  Ordinary movement, reads and refused commands do not trigger that membership
  scan. End-turn and battle workloads still need their separate retained
  performance evidence; this review does not infer a frame-time result.

## Save, migration and replay

Rules/save32 seals group records and the dedicated counter. Strict schema and
semantic validation reject unknown row fields, invalid owners, unsorted or
duplicate groups/members, unsupported names, oversized registers and a counter
that does not exceed all allocated IDs. A resealed checksum cannot make those
semantic errors valid.

Rules29–31 retain their prior command schema. Their envelope projection can omit
the new register only when it is empty and the counter is still one. Deleting
every group does not erase identifier history or permit silent downgrade.
Historical execution also refuses a state carrying that history.

Older saves verify their original bytes and checksum before receiving an empty
register and counter. The changed `emptyOrders()` migration factory returns fresh
arrays per load; independent rules23/25/26/27/31 migrations do not share writable
group storage. Four genuinely captured rules31 fixtures retain their exact saved
bytes, original hashes and complete replay. New rules32 commands can extend that
history without changing its prefix, and mixed-history local storage plus
compressed export/import preserve the groups and replay result.

## Main-thread and worker boundary

Saved-group edits reuse the ordinary command transport and recorder. Watch mode,
wrong-seat requests and blocked campaign decisions retain the existing
authorization boundary. A canonical refusal is shown as an error rather than a
successful edit. Successful completion waits for a matching state to pass the
response validator, map revision acceptance and renderer update.

The request ledger participates in all group-operation busy checks and resets
on campaign reset, worker failure and view cleanup. Replies from replaced workers
remain ignored. A recorder failure after mutation or a failed publication sets
`recoveryRequired`; the worker refuses later mutations until restore, and the
main thread locks gameplay. A rejected map revision, unreadable transfer or
presentation exception also settles the matching pending edit in the final
handler. No uncertain edit is automatically retried.

## UI self-review and checks

The saved-group selector does not recall membership implicitly. Recall replaces
only the active registry tab's checks with eligible current members and announces
embarked/unavailable counts. It issues no command. Both groups and empty groups
remain reachable with zero checked members. Updates explicitly replace all
members with current checks, including removal of omitted embarked members;
ordinary posting/charter assignment remains separate. Opposite-kind checks are
retained. Busy state locks edits and recall, and canonical refusal or asynchronous
failure is visible without announcing success.

The reviewer independently ran **26 tests across four files**: canonical groups,
rules31 compatibility, mixed-history persistence and the new response validator.
All passed. The reviewer's separately authored UI/registry scope passed **11 tests
across two files**, whole-project typecheck and scoped lint. The scopes overlap
later full verification and must not be added into an overall release count.

No other actionable canonical, save or response-boundary defect was found.
Player browser journeys, final publication, sustained scale and combined M3
acceptance remain separate work; this review closes no 1.0 release gate.

## Additional review: supported 64-seat save repair

The maximum-size benchmark exposed a pre-existing inconsistency: current world
creation accepted sixty-four total seats, but the arcane-research save register
still capped its per-realm rows at forty-eight. The first benchmark attempt used
generator4, whose smaller historical seat bound was an invalid workload setup.
The corrected generator8 workload then exposed the real save defect. This is a
bounded repair within existing Gate D/E acceptance, not new gameplay scope.

The reviewer read [`magic.ts`](../../../packages/sim/src/magic.ts), the affected
schema/projection paths in [`save.ts`](../../../packages/sim/src/save.ts),
[`sixty-four-seat-save.test.ts`](../../../packages/sim/src/sixty-four-seat-save.test.ts)
and the retained [initial](64-seat-save-initial.log) and
[final](64-seat-save-final.log) logs. No tests were rerun by this reviewer while
the parent held the browser verification window.

- `arcaneResearchV31Schema` freezes the old forty-eight-row bound. The separately
  derived current `arcaneResearchSchema` permits sixty-four rows. Rules32
  overrides the inherited field with the current schema; older save schemas
  continue to inherit the frozen one.
- Current canonical serialization uses the sixty-four-row schema. Historical
  payload projection validates the frozen research register before emitting an
  older envelope. A sixty-four-seat state cannot therefore be exported as an
  unreadable rules31 save, even when it contains no selection groups. A resealed
  rules31 envelope with those rows is likewise rejected during parsing.
- The remaining `.max(48)` save-field occurrences belong to historical schemas.
  The current inherited schema replaces starts, factions, explored records,
  progression and project capacity at rules21, and now replaces arcane research
  at rules32. The forty-eight-seat creation/export guards apply only to older
  rules. No additional forty-eight-row limit remains on these current save
  registers in the inspected source.
- The regression generates both sixty-four major realms and forty major realms
  plus twenty-four city-states under generator8. It verifies exact current save
  round trips and hashes, complete per-realm research/survey/progression/explored
  registers, historical export refusal and continued rejection of sixty-five
  seats or research records.

The retained initial run has two failing round-trip cases and one passing bounds
case, with the old maximum of forty-eight reported from `canonicalPayload`.
The final author-run scope records **35 passing tests across three files in
3.04 seconds**, including the new regression and retained historical checks.
This is inspected evidence, not an independently rerun result or a whole release
total. No actionable issue was found in this schema repair. It does not change
discovery prices, research effects, AI decisions or the supported total of
sixty-four seats.
