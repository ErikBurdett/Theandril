# 0020 — Scoped land inspection and packed map transfers

Status: implemented and integrated; no rule, content or save version change.

The slice-12 measurements found 3.93/4.93 MB of detailed land options for a
32/40-town owner and a 16.55 MB fully explored Huge initial browser observation.
Ordinary publication builds every town's exact tile quotes even when the player
is inspecting an army. These costs block the giant-empire read-model goals.

Keep the default full simulation observation unchanged for AI, tests and existing
callers. Add explicit scoped land reads: all own town summaries remain available,
but detailed cell quotes are built only for requested own towns. The player worker
publishes summaries and exposes a separate selected-town query. Its result is
identical to that town in the full permitted observation, not a UI pricing engine.
Foreign or missing IDs return no detail; fog and observation purity remain intact.

The UI retains only the selected town's details. Requests are keyed by town,
published state hash and campaign/reset identity, and ordered by request token.
State changes immediately invalidate actionable quotes. Loading/error/retry are
explicit; old replies cannot re-enable stale work. Tile selection within the same
town reuses its current response. Selection queries never enter the game archive.

Explored-cell deltas are filtered before packing into fresh typed-array buffers,
with message-local string references and sparse optional metadata. Only permitted
observed cells enter the codec. Transfer detaches these new buffers, never canonical
world arrays or the cached movement observation. The main thread validates and
decodes once per publication before the existing renderer update; React still
does not retain world cells. No new Pixi or asset representation is required.

Telemetry counts typed-array byte lengths and UTF-8 metadata separately, not the
JSON expansion of typed arrays. This is a logical payload measure, not an estimate
of the browser's undocumented structured-clone framing or total retained memory.

Verify full/scoped equality, detached reads, hidden/missing targets, malformed
packets, sender-only detachment, empty/dense/sparse/fog cell round trips, stale
response handling, normal paid land controls and saved continuation. Compare
matched Huge/Legendary read models and actual browser payload/frame measurements.
Default AI proposals, content hash, save bytes and complete archived Epic results
must remain unchanged. This does not claim to finish army registry virtualization,
archive memory, hierarchical navigation or every giant-scale release gate.

The first integration passes 709 tests / 74 files and all 57 Chromium scenarios,
including production-worker transport/archive tests and a 32-town inspector.
Matched [selector measurements](../performance/0018-read-models.md) and
[codec measurements](../performance/0017-cell-transfer.md) retain exact saves,
fog, public movement and unchanged AI proposals. A complete Epic campaign,
portable restore and independent replay retain the prior `177160fb` seal.
