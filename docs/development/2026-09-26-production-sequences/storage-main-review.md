# Production sequences: independent storage and main-thread review

Reviewed the local candidate on 26 September 2026. This reviewer authored the
production worker transport, its actual-worker tests and the explicit worker
benchmark. Those files are not independently reviewed by this document. The
independent scope is the separately authored personal template store and tests,
`main.tsx`, and the production response ledger/validator and tests. UI components
were read only to trace the preference/campaign boundary; their full interaction
and visual acceptance belongs to the separate UI/browser review.

## Verdict and finding

Storage and main-thread integration **pass source review after correction**.
Browser verification of the correction remains pending parent execution.

**P2, corrected: a current-worker error event rejected pending production but left
order controls unlocked.** In the original `startWorker().onerror`, the pending
ledger was reset and `busy` cleared, but `campaignFault` and `recoveryRequired`
were not set. A worker can stop after paying for queued work but before delivering
its observation. The stale view then remained with ordinary order controls
enabled. A group retry refused because no current worker remained; an ordinary
command could start an empty worker. Neither behavior fulfilled the promised
saved-campaign recovery lock.

Reproduction for the parent-owned browser regression: let the actual first
production request run, intercept its first final state, and dispatch an error
event on that same Worker instead of delivering the state. Assert that its pending
promise rejects, Applying ends, all gameplay orders stay disabled, then load the
actual manual save and retry. No simulated queue results are needed.

The parent corrected the error callback to ignore errors from a replaced or
noncurrent Worker before touching active request ledgers. For the current Worker,
it detects pending production and sets both recovery flags **before** resetting
the pending promise. The later `setBusy(false)` therefore ends Applying without
unlocking gameplay. The deliberate new-world-generation failure path retains its
prior-campaign fallback because no production request can start while that
replacement is pending. Load/import/new-campaign reset remains available and
clears the recovery lock only after an accepted campaign view.

The reviewer inspected that exact guard/flag/reset order after correction and
found no remaining source blocker. The parent added a `worker-crash` case to
[`production-sequence-response-recovery.spec.ts`](../../../tests/gameplay/production-sequence-response-recovery.spec.ts):
it intercepts a real paid batch response, dispatches the Worker error event,
asserts pending cleanup and disabled Apply/End turn, then loads the real earlier
manual save and retries through a new Worker. It does not fabricate simulation
state. Execution of this regression is pending; source inspection is not a browser
pass. The reviewer changed only this review document.

A preliminary defensive observation was already corrected by the parent: a
matching production ID with a terminal reply of the wrong type (for example,
`message` or `export`) now rejects the pending request and locks recovery before
generic message/download handling. The dedicated browser recovery file includes
that reply-only fault injection alongside missing results, a wrong item and a
rejected map revision. Browser execution remains separate evidence.

## Personal storage

- [`ProductionTemplateStore`](../../../packages/persistence/src/production-templates.ts)
  stores preferences in `theandril-production-preferences`, separate from campaign
  saves and the existing charter-template database. It imports content IDs for
  validation, not simulation commands or state. Its personal UUIDs cannot consume
  a deterministic campaign ID or random stream.
- The version-one row has strict keys, a UUID, trimmed name, checked case-folded
  name key and one to five known construction/recruitment IDs. Building IDs cannot
  repeat; unit IDs can repeat in their chosen order. Names are bounded at forty
  UTF-16 code units. The library is bounded at twenty-four templates.
- Every operation validates the whole bounded library. Reading at most twenty-five
  rows detects an oversized library without scanning arbitrarily many records.
  Unknown fields, versions or content and invalid name keys reject operations;
  incompatible records are retained rather than discarded or repaired silently.
- Creates, updates and deletes perform read/validate/write within one IndexedDB
  read-write transaction. Both duplicate-name and final-capacity races are covered
  across distinct database connections. A rejected write or transaction abort does
  not commit an intermediate library.
- Inputs are parsed and copied before the first asynchronous boundary. Public
  results copy item arrays; changing an input while a write is pending or changing
  a returned row cannot rewrite stored data. Listing sorts a detached array.
- The sticky ready callback checks the native database version on every open,
  including reopening after an external upgrade. A newer database with otherwise
  compatible version-one rows is refused. Storage rejection propagates; there is
  no empty-library fallback or destructive recovery.
- The library component calls only this preference API. Explicit Recall changes
  its editor list through a callback; only the separate Apply action reaches the
  campaign callback. Fresh-session Retry retires a cached failed database open.
  Session identity and active checks prevent late responses from a closed panel
  changing a replacement panel. Closing a session waits for an already-started
  transaction before closing its connection.

The ten tests in
[`production-templates.test.ts`](../../../packages/persistence/src/production-templates.test.ts)
exercise these boundaries, including actual transaction rollback, a rejected
quota write, compatible-looking future databases, external upgrades and coexistence
with an open charter library. This reviewer inspected those tests; their execution
is owned by the storage author/parent, not independently rerun here.

## Main-thread response and campaign boundary

[`GroupProductionRequests`](../../../apps/web/src/group-production-requests.ts)
copies the submitted faction, sorted hearth IDs and ordered item IDs before work
begins. One request can be pending. An unrelated or older ID cannot settle or
validate the current promise, and reset removes both the ledger and its submitted
snapshot. The completion validator requires exactly one row for every submitted
hearth in sorted order and each attempted item in the original list order. An
ordinary refusal may end a prefix; a short accepted prefix, missing/reordered row,
wrong item or malformed outcome cannot be announced as success. A refused outcome
requires a nonempty message and must be last for that hearth.

The current worker's onmessage wrapper ignores messages from replaced workers.
Main validates the returned production results and observing faction before
replacing the view. Success is resolved only after cell decoding, map-revision
acceptance and renderer update. An explicit recording error publishes its actual
view but rejects the pending request; uncertain partial rows are not interpreted
as completed hearths. The catch/finally path settles a still-pending matching state
even if decoding, map acceptance or presentation fails and locks further gameplay
until restoration. The new wrong-terminal-type check runs before all special
query/message/download branches.

The callback checks gameplay busy state, every group ledger, pending generation,
recovery, watch mode, victory and battle/capture decisions. It copies posted IDs
and items, rejects a synchronous postMessage failure without a false success, and
never retries a paid command automatically. Ordinary commands also refuse while
a group ledger is pending. Campaign reset and view unmount reject pending work;
real restore/reset remounts the registry and resets its selections. The corrected
worker-error path now joins the same saved-recovery requirement, as described
above.

## Worker integration self-review

This subsection is author self-review, not independent review. The worker
validates the whole bounded request before setting its started flag or journaling
any command. Dense bounded ID arrays, distinct hearth IDs and the controlling
faction are transport checks; content, ownership, prerequisites, queue capacity
and affordability remain ordinary canonical `queue` decisions. It sorts a copied
hearth list and preserves the copied item order. Each canonical refusal is
recorded, ends that hearth’s attempted prefix, and permits the next hearth. The
number of attempts cannot exceed640, and only one final observation is published.

A recorder exception omits the interrupted command’s uncertain result, stops all
later work, publishes only known completed prefixes plus the actual final state,
and preserves the worker recovery lock. Failure during final observation/transfer
returns an explicit recovery error instead of an ordinary refusal. The main
validator intentionally does not consume uncertain prefixes as success. Restore
resets the recorder/query/map state; queued requests remain serialized by the
existing worker promise chain. No new worker timer, AI policy, canonical command
or save schema is introduced. Result-byte metrics are additive to the existing
observation/packed-cell accounting and reset to zero on unrelated state replies.

No new latent integration hazard was found in this self-review. Existing posting
and charter branches were not changed or independently recertified by this slice.

## Evidence and limits

- [`response-tests.log`](response-tests.log) records **3/3** focused response-ledger
  tests passing. Their cases include input mutation after submission, wrong seats,
  concurrent requests, old IDs after reset and explicit recovery errors.
- [`worker-benchmark.jsonl`](worker-benchmark.jsonl) contains four real-worker
  samples run by the parent. The ceiling is **128 × 5 = 640** attempted canonical
  queue commands, with one final state response in each case. The benchmark uses
  authored generator-four mature worlds and verifies recorded order, replay and
  unchanged fog; these are single headless samples, not browser frame timings or
  campaign-pacing measurements. Its author is this reviewer, so it is supporting
  evidence rather than independent implementation review.
- No full suite or browser execution was launched during this read-only review.
  Final type/lint/browser results must be taken from the parent’s retained final
  logs, rather than inferred from source inspection or this document.
- There is no cross-device sync, export of personal templates, live library refresh
  across tabs or automatic retry of a refused sequence. These are disclosed scope
  limits. Rules/save32 and existing canonical production remain unchanged; this
  review does not close M3 or any release gate.
