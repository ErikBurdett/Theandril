# March a hundred armies together

**DRAFT — 26 September 2026.** Immutable source pin, publication, image, final browser counts and live readback: **PENDING**. Rules/save: **32**. Content: **015468d1**. Replace draft repository references with the reviewed immutable revision before publication.

Gathering a large force should not require opening a hundred separate travel panels. Saved groups already remember your chosen forces. Group travel gives those checked armies a shared destination for review before issuing orders. Each army follows its own route and movement allowance; arrivals can differ.

## From a saved group to marching orders

Open the army registry, recall a saved group or check land armies ashore, then expand **Group travel**. Choose the selected map hex, one of your hearths, or an explicit hex number. **Review routes** asks for the selected armies’ known routes without moving anything. Each row shows movement cost, steps and any reason the journey is unavailable. Up to 128 armies can be reviewed, with longer result lists divided into pages.

**Apply reviewed routes** is the separate decision that starts travel. Armies act in stable ID order, and their ordinary movement begins immediately. An accepted order might leave an active journey, reach the destination at once, or pause after discovering danger. Results include the final canonical event, so “accepted” does not promise uninterrupted marching. Refused armies remain checked for inspection; accepted armies leave the checked selection. Earlier movement can reveal terrain that changes later outcomes, so the review is advisory. [Implemented controls](../../../apps/web/src/group-movement.tsx)

Replace route redirects a journey; append waypoint extends its existing waypoints. Appending to a paused route leaves it paused. Resume affects selected paused routes, while cancel affects selected armies that currently have travel orders. Individual army controls remain available for a different decision.

Standing postings survive these actions. Canceling a journey does not dismiss an army’s posting: it may march again next turn. The panel counts affected postings and points to **Clear selected postings** when the army should stop following its standing duty.

**IMAGE PENDING:** select and inspect the hundred-army results and 390-pixel capture. Retain dimensions, source, hash and transformations; identify the authored fixture and the image’s limited scope.

## Ordinary travel, with one bounded request

The worker validates the complete request before issuing its first ordinary movement command. Ownership, terrain, fog, paused routes and encounters still belong to the simulation. Travel cannot automatically attack or declare war. Reviews contain compact summaries derived from the permitted player observation; they do not send complete paths or reachable-area overlays for every army. Completed batches with accepted orders attempt one autosave and publish one final observation. [Architecture](../../architecture/0044-group-travel.md)

Changing the checked armies, destination, route mode or campaign invalidates the review. The campaign hash is checked again before application. Independent review also caught an obsolete preview error that could incorrectly demand recovery after its request had been superseded. The corrected handler honors that recovery flag only for the current worker’s active preview. Recording interruption or an unreadable mutation result still requires restoring a saved campaign, because some armies may already have moved. [Main-thread review](main-review.md) · [Worker review](worker-review.md)

## Evidence so far

The headless suite passes **2,000 tests across 250 files in 63.19 seconds**. The worker run passes ten tests; the UI and request-ledger run passes 24. These overlapping counts are not added together. Worker coverage includes exact serial archive/replay equivalence, the 128-army bound, hidden occupants, hostile destinations, retained postings and recorder, publication and autosave failures. [Full run](tests-initial.log) · [Worker run](worker-final.log) · [UI run](ui-tests.log)

The first seven-scenario browser run passed six. Its combined hundred-army journey exceeded the unchanged 45-second limit after two hundred-army batches had succeeded. The correction splits that long sequence into two meaningful journeys, retains its assertions and time limit, and returns only the fields asserted instead of transferring giant test summaries. Eight travel scenarios plus affected regressions are running; final browser and generated-production results remain **PENDING**. [Retained failure](browser-initial.log) · [Gameplay](../../../tests/gameplay/group-movement.spec.ts) · [Recovery](../../../tests/gameplay/group-movement-recovery.spec.ts) · [Production](../../../tests/production/group-movement.spec.ts)

Four completed headless samples use generated geography with authored mature armies and 128-army expansions. Every case matches serial archives, replay, autosave and permitted fog. [Retained measurements](worker-movement-benchmark-final.log)

| Workload | Armies | Worker query ms | Query bytes | Batch ms | State payload bytes |
| --- | ---: | ---: | ---: | ---: | ---: |
| Huge | 47 | 2.053 | 8,206 | 464.902 | 246,578 |
| Huge ceiling | 128 | 2.879 | 22,300 | 459.158 | 649,643 |
| Legendary | 100 | 2.270 | 17,537 | 750.738 | 504,166 |
| Legendary ceiling | 128 | 2.457 | 22,437 | 831.073 | 635,137 |

Batch time includes autosave/publication, excluding setup and replay. These are single samples with four-step previews and logical payload bytes, not maximum-search, renderer, percentile or sustained-memory acceptance.

This advances existing **ACT-32/M3** coordinated-orders scope and evidence for Gates I, E, D and K. No gameplay obligation is added or cut. Campaign rules, save schema, AI and prices are unchanged; no new pacing result is claimed. Theater strategy, patrol/escort roles, army templates and broader governor decisions remain unfinished. All fifteen release gates remain open. Next: prove combined delegation and saved individual overrides. [Canonical status](../../IMPLEMENTATION_STATUS.md) · [Release gates](../../../DEFINITION_OF_DONE.md)
