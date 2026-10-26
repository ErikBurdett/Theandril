# Group land commissions — independent design review

Reviewed against baseline `bc62e105a035e238aac8a4964cf4851c61f0fb45` on
2026-10-26. This records design expectations before final implementation review;
it does not approve code or demonstrate a passing browser journey.

## Scope and canonical authority

The new group operation should transport existing `setLandPolicy` commands.
Rules/save 37, canonical land policy behavior, AI planning and content can remain
unchanged. No new aggregate budget belongs in simulation. Each chosen hearth
receives the same **remaining allowance per hearth** and the same floor against
the **one shared realm treasury**. The aggregate allowance is permission, not an
upfront price, escrow, or reserved purse. Reapplication replaces each allowance.

`setLandPolicy` can accept permission while no order starts: active work, siege,
occupation, insufficient allowance/reserve or unsuitable land may wait. A receipt
must therefore say the commission order was accepted, not that construction
started. Existing legal resource/terrain/research checks remain simulation-owned.

## Paid batch hazards and acceptance requirements

- Validate the entire envelope before any mutation: strict commands, bounded
  1–128 entries, dense arrays, distinct hearths, same acting faction, supported
  request fields and hash. Assignments must share improvement/allowance/reserve.
  Never silently apply a prefix or turn an unsafe number into a rounded budget.
- Sort by stable settlement ID. Ordinary commands pay immediately; later commands
  must see the reduced treasury. A batch is not simultaneous and is not an atomic
  purchase. Same reserve for every command protects one shared floor, not a
  separate multiplied reserve per hearth.
- Check reviewed hash and current player/decision restrictions before starting.
  Legally shaped missing/foreign/ungoverned-removal commands remain ordinary
  canonical refusals with one honest per-hearth result. Refusal text must not
  expose hidden foreign land details.
- End only selected owned commissions. Removal retains paid work and refunds
  nothing. UI should retain selected hearths that were unaffected or refused;
  confirmed accepted IDs alone may be unchecked.
- Preserve saved selection-group recall and explicit selected-outside-filter
  counts. Check the aggregate permission arithmetic at maximum safe allowance;
  the display must use exact arithmetic or disclose that the sum exceeds safe
  numeric range. It must not create an artificial campaign or selection cap.
- Reuse the recorder for every command, publish one final permitted observation,
  and avoid implicit batch autosave. Compare exact exported replay and saved
  restoration against sorted ordinary commands, including immediate payments.
- A recorder can throw after payment. Stop immediately, retain truthful partial
  results, mark recovery required and block further commands/save/export until
  restoring a valid campaign. Never retry automatically or label mutation as a
  refusal. A publication error has the same uncertainty.
- Correlate reply identity, faction, complete ordered entity list and strict row
  shapes before accepting state/results. Missing/duplicate/mismatched rows,
  unexpected response types and worker failure must resolve the pending promise
  as an error, preserve selections, clear busy state and require recovery.
- Include the new request owner in every main-thread busy, reset, error,
  unmount, restore, map-decode and worker-failure path. A correct helper alone does
  not prove the live worker boundary is wired safely.
- Registry summaries should consume already-permitted policy metadata. Do not
  request every hearth's candidate quotes or duplicate canonical quote rules.

## Recommended browser evidence

`tests/production/group-worker-policies.spec.ts` contains the reusable group
acceptance pattern: `empireDelegationCampaign()` has thirty authored owned
hearths, 128 armies, two wars, saved `Realm works` and `Frontier works` groups,
real filtered selection, paginated receipts and restoration. It is explicitly
synthetic ownership/population/infrastructure and must remain labelled so.
`tests/production/worker-policy.spec.ts` instead covers generated individual
worker growth. The existing `land-policy.spec.ts` generated seed 20260905 setup
provides two ordinary worked cells, population 2 and a finite earned purse.

Recommended coverage:

1. Generated small-realm group controls: apply a reserve that waits, replace the
   per-hearth budget, demonstrate a real immediate paid work, save, remove via
   the group control, then restore the exact policy/work/purse/archive. Follow
   ordinary turns through completion with real AI enabled when end turns occur.
2. Authored thirty-hearth scale: recall the saved group, filter so some remain
   outside the filter, apply a finite shared-purse commission, compare all sorted
   ordinary commands and receipts, and inspect both receipt pages. At least
   several hearths must actually pay while later hearths wait at the reserve;
   thirty accepted waiting policies alone is not paid-batch evidence.
3. Narrow 390px / 130% text: invalid and maximum-safe amounts, exact aggregate
   permission, keyboard Apply/End, visible 44px controls, no horizontal overflow,
   unchanged unrelated selections and exact saved restore.
4. Real worker reply faults after a paid command: missing results, mismatched
   actor and worker error. Assert the worker actually reached the expected paid
   state, the UI refuses to claim success or deselect, controls/save/export lock,
   and restoring the saved campaign allows one deliberate successful application
   with no duplicated payment.

Local production scenarios, UI/correlation/worker regressions and full integration
checks remain necessary. Existing pacing evidence can be referenced as unchanged
only if no rules or AI code changes; new group UI use is not a new autonomous AI
campaign strategy. Scale timing must identify whether recording/hash/publication
is included and must not be called organic empire or full release acceptance.
