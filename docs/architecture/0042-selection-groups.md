# 0042 — Saved realm selections

Date: 2026-09-25. Status: implemented; [verification](../development/2026-09-25-selection-groups/README.md).

Large-realm registry selections currently disappear when a campaign reloads.
Store named selections in canonical campaign state so a player can recall the
same army or hearth group after saving, exporting or importing a campaign.

`packages/sim` owns a bounded register: at most 24 groups per faction, each with
an immutable army/hearth kind, a plain-text name of at most 40 characters and at
most 128 unique owned entity IDs. Names are unique ignoring case within a kind.
Use ordinary `setSelectionGroup` and `deleteSelectionGroup` commands; validate
the entire edit before changing state. A separate deterministic group counter
preserves gameplay entity IDs and their tie-breaking order. Group edits spend
no resources and issue no movement, recruitment, posting or charter orders.

Groups contain land armies or hearths. Permanently lost, merged-away, founded
or transferred members are pruned at relevant successful command boundaries.
Retain empty named groups and temporarily embarked armies; do not substitute
new split armies or merger targets. Avoid scanning groups for ordinary movement
or observation. Observations expose detached copies of only the viewer's groups.

Recall replaces only the current registry tab's selection with its eligible
members and reports unavailable members. The existing posting controls require
land armies ashore. Choosing a saved group merely chooses a record; Recall is
explicit and issues no command. Updating a group replaces its name/membership;
applying postings or charters remains a separate action. A pending edit resolves
only after its matching worker update is accepted by the displayed campaign;
recording or display interruption requires saved-campaign recovery.

Rules/save 32 adds this metadata; content remains unchanged. Capture authentic
rules-31 snapshots and archives before implementation, freeze the historical
command schema, migrate old snapshots to an empty register, and reject exports
or execution that would silently discard modern metadata. Historical replay
retains its exact bytes and seals. AI has no reason to author a human selection;
its command planning and campaign prices remain unchanged.

Verify atomic refusals, bounds, fog, loss paths, deterministic continuation,
save/replay/export/import and the independent historical baseline. Browser
journeys must use actual controls, including keyboard and narrow layouts.
Measure bounded observation overhead and reconciliation at representative scale.
This advances ACT-32/M3; theaters, patrol/escort orders, production sequences,
army templates and integrated mature-realm acceptance remain open.

Scale verification also exposed a pre-existing 48-row arcane-research save limit
in campaigns that already support 64 total realms. Rules 32 explicitly widens
that register to 64, with strict generated 64-major and 40-major/24-city-state
roundtrips. Schemas through 31 retain the original 48-row limit and old-version
export refuses an unrepresentable state. This is a save-integrity repair within
the existing campaign limit, not an expansion of campaign gameplay.
