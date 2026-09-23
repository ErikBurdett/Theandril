# 0039 — Bounded group postings through the simulation worker

A player can prepare standing postings for a group of armies without requesting
one complete campaign observation for every member. The client sends one bounded
transport request. The worker executes each existing `setPosting` command through
the campaign journal, then publishes one final state and a result for each order.
`packages/sim` remains the authority for ownership, explored destinations,
posting limits, command blockers and cancellation. This changes no game rule,
canonical state, save format or replay version.

## Transport contract

The request is `{ id, type: 'groupPosting', commands }`, where `commands` contains
between one and 128 ordinary `setPosting` commands. The shared
`MAX_GROUP_POSTING_COMMANDS` constant describes this request limit. It does not
cap the realm's armies or canonical postings.

Before applying any command, the worker checks the complete envelope: request
shape, array size, every command against the simulation's strict `commandSchema`,
the posting command type, unique army IDs, and the current player seat. Sparse
arrays, unknown fields, malformed later items and mixed-seat orders fail before
the first item can mutate state or enter the archive. AI-watch and victorious
campaigns reject the request under the existing worker ownership guards.

Valid orders run in stable army-ID order, independently of checkbox or registry
sort order. Each order uses the worker's existing `applyCommand` wrapper and
`journal.record`; accepted and canonically refused orders both appear in the
normal archive. A refusal does not roll back earlier orders or prevent later
valid members from receiving their postings.

The one final existing `state` response adds
`groupPostingResults: Array<{ armyId, accepted, message? }>`. Refused entries carry
the canonical reason. The worker invalidates its query observation while applying
commands, rebuilds only the final player summary, calculates its actual hash,
and uses the existing packed cell delta and transferable buffers. No extra map
visibility or spectator knowledge enters the response. The encoded result payload
is counted in `metrics.groupPostingResultBytes`, `transferBytes` and
`totalTransferBytes`; ordinary state responses reset the result-byte count to zero.

## Interrupted recording

A recorder exception can occur after an order has already changed canonical
state. The worker stops at that order. It publishes the actual partial observation
and hash once, includes only results whose recording calls completed, and adds
`groupPostingError`. The message states the completed count and warns that some
orders may have applied and a saved campaign must be restored. The interrupted
order is not falsely reported as a canonical refusal.

The existing recording-failure guard prevents subsequent orders, saving or
exporting the interrupted campaign. Loading or importing a valid saved campaign
reestablishes the journal and clears that guard. The client must consume the
returned state before rejecting its pending group operation and require recovery
instead of silently retrying an uncertain order. This is a sequence of ordinary
commands with reported partial outcomes, not an atomic transaction.

## Worker evidence

`apps/web/src/worker-queries.test.ts` executes the production worker module through
a structured-clone transport shim and real simulation, journal and IndexedDB
storage. Its authored 100-company fixture compares one reversed batch with 100
serial single-command requests in canonical order. Archives are exactly equal;
the resulting hash is `e43b0ca7`. The test also replays the archive, checks unchanged
fog and empty cell deltas, saves and restores, and continues with another posting.

One local harness sample transferred 531,302 bytes for the batch, including 3,725
result bytes, versus 51,416,921 bytes for the serial requests: approximately
96.8 times less transfer and one state response instead of 100. The corresponding
observed request durations were 10.97 ms and 686.40 ms. These are illustrative
single-run worker-harness timings, including structured cloning; they are not a
browser frame-time distribution or a generated-campaign benchmark. The absolute
final summary still includes the existing army read models; this change removes
their repeated publication rather than reducing their individual shape.

Further regressions accept all 128 items without truncation, reject 129 and empty
batches without mutation, preserve individual refusals and their replay records,
reject forged and wrong-seat requests, and protect watch and finished campaigns.
A controlled recorder exception after the second real mutation proves that the
second posting remains visible, the third is never attempted, only the first
result is certified, and restore enables a clean retry.

Group registry interaction, mixed destinations and join/hold/clear affordances,
stale-selection handling, keyboard/narrow-screen behavior and their browser
journeys are client integration gates. This transport contract does not create
theater strategy, coordinated combat, a new bulk simulation command or full
empire automation.
