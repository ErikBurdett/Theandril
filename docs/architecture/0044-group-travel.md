# ADR 0044 — Coordinated travel through ordinary army commands

Date: 26 September 2026. Updated: 27 September 2026. Status: implemented locally;
publication and final visual acceptance pending.

## Player outcome

Reuse the army registry's checked armies and saved campaign groups to review a
shared destination, replace journeys or append a waypoint, resume paused routes,
and cancel selected routes. Keep the existing bound of 128 owned land armies
ashore. Each army remains independently controllable.

## Authority and ordering

This is a client convenience over `queueMovement`, `resumeMovement` and
`cancelMovement`; canonical movement, visibility, prices and AI do not change.
The worker validates the entire bounded transport envelope before execution,
rejects duplicates and wrong faction seats, then journals ordinary commands in
stable army-ID order. It returns one final permitted observation with individual
accepted/refused results. Accepted orders may move immediately, reach their
destination or pause; acceptance is not a promise of an active route.

Canceling a route leaves its standing posting intact. A posting may start another
journey next turn or after an overriding route finishes. The UI explains the
affected postings and keeps clearing postings a separate explicit action.

## Explicit review

One requested worker query reuses a detached permitted observation and the
canonical movement preview. Internally, that preview computes reachable range
before planning the target, sharing one bounded node budget between both
searches. Only the compact target result is transferred: per-army cost, step
count, eligibility, blocker and search-limit diagnostics, without full paths,
reachable overlays or geography. No query runs during rendering or every
keystroke. Reported row node counts cover the target search, not the preceding
range search or their combined work.

Reviews are correlated with army IDs, target, append mode and campaign hash.
Changing any input invalidates the review. Application carries the expected
campaign hash; a stale batch is rejected before mutation. Previews remain
advisory: earlier armies may reveal information that affects later commands.
`canQueue` governs reviewed travel; immediate attack eligibility is not permission
to queue an attack. The existing route rules pause for danger and never declare
war or initiate a battle automatically.

## Persistence and recovery

Applied routes are existing canonical saved state. The batch adds no simulation
command type or save field, and personal preferences are not introduced. Rules/save
32 and content `015468d1` remain unchanged.

A batch uses the existing autosave mechanism once, before final publication,
only when at least one order was accepted and recording completed without an
exception. An all-refused batch or interrupted recorder does not autosave.
Persistence failure is reported without rolling back accepted movement; atomic
save rotation retains prior valid recovery generations. Recording or publication
failure after execution begins is uncertain, so later commands stop and the UI
requires saved campaign recovery. A publication failure may follow a successful
autosave; no claim is made that the latest autosave still predates that batch.
Main-thread validation requires one result for every submitted army before
presenting success. A malformed read-only preview can be discarded without
treating it as an applied order. A superseded preview's late error cannot impose
recovery on a subsequently restored campaign.

## Cost and acceptance

At most 128 path previews run per explicit review, each bounded by the canonical
4,096-node combined range/target search budget. This can still be expensive; measure preview and command
time separately on Huge/Legendary fixtures. Measure compact review bytes and the
final state transfer, and distinguish authored stress states from earned campaigns.

Tests must cover exact serial command/history equivalence, fog, partial refusal,
replacement and append, cancel/resume, retained postings, individual overrides,
manual/portable saves and replay, malformed/stale replies, worker failure,
keyboard and narrow layouts. No pacing claim follows from a command convenience
that changes no rule or AI policy. Theater strategy, patrol/escorts, army templates
and broader M3 acceptance remain open.

The [implementation evidence](../development/2026-09-26-group-travel/README.md)
records local checks, independent source reviews, failed attempts and outstanding
visual/publication work. Its single-sample short-route benchmarks do not establish
worst-case pathfinding, whole-turn or renderer performance.
