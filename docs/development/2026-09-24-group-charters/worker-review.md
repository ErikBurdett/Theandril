# Group charters: worker evidence and independent client review

Reviewed on 2026-09-24 against the local group-charter changes above base
`f97009ddd776e91bf158f96893796a08afcc7c87`.

**Review boundary.** This reviewer authored the protocol, worker batch extension
and worker tests. Their checks below are implementation evidence and self-review,
not independent review of that code. The separate inspection of `main.tsx`,
`group-posting-requests.ts`, `group-charters.tsx`, `realm-navigation.tsx` and
`realm-windows.tsx` is independent: those changes were authored by other agents.
This follow-up wrote only this report and added or ran no further tests.

**Verdict:** no actionable defect found in the independently inspected client
integration. Browser execution, screenshots, full-suite results and release
acceptance remain separately recorded by the parent.

## Transport contract inspected

- `MAX_GROUP_ORDER_COMMANDS` is 128; the existing posting constant is an alias.
  `groupCharter` contains ordinary `setCharter` commands. Results identify each
  `settlementId`, acceptance and an optional canonical reason. New state fields
  are `groupCharterResults` and `groupCharterError`.
- Shared validation checks the entire strict envelope and every command through
  the simulation schema before applying any item. It rejects empty/oversized
  arrays, sparse elements, unknown fields, invalid focus/ceiling, mixed command
  families, duplicate subjects and a faction other than the current seat.
  Watch, victory and interrupted-recording guards remain in place.
- Commands execute through the existing `applyCommand`/`journal.record` wrapper
  in stable subject-ID order. Accepted and canonically refused commands are
  recorded. A refusal permits later valid commands; no rollback is promised.
- A recorder exception after mutation stops further commands and publishes the
  actual partial state. Only completed record calls receive certified results.
  The error states the completed count and possible additional application;
  subsequent commands/save/export remain blocked until restoration.
- Publication occurs once using the existing permitted observation, state hash,
  packed cell delta and transferred buffers. Charter result/error JSON bytes are
  counted in `groupCharterResultBytes` and total transfer metrics. Posting and
  charter counters remain separate and reset on ordinary state publication.

## Executed worker checks

The final local run passed **18/18 tests** in `worker-queries.test.ts`: all
**12 existing tests**, unchanged in purpose, and **six new charter tests**.
The last run took 7.39 seconds. The six new tests cover:

1. Forty ordinary charter commands versus forty serial requests, equal archives
   and replay, save/restore followed by revocation, unchanged queues/treasury/fog,
   one response and exact byte accounting.
2. Foreign/missing settlement and empty-revocation canonical refusals alongside
   valid siblings, with every accepted/refused result retained in replay.
3. All 128 commands accepted without truncation or extra state responses.
4. Malformed, sparse, wrong-seat, duplicate, mixed-type, out-of-range and oversized
   envelopes leaving the exact campaign/archive unchanged.
5. Watch and canonically victorious campaigns rejecting the batch unchanged.
6. A recorder exception after the second real mutation: two charters visible,
   only one completed result, the third command unattempted, saving/export blocked,
   then actual manual-save restoration and a successful replayable retry.

The authored forty-hearth worker fixture uses a Small map, generator 4, seed 17,
two factions, separated authored hearths and two real paid manual queues. It is
not the Legendary browser fixture or an organically grown realm. Subsequent
batch commands use unchanged canonical rules.

| Measure | One group | Forty serial requests |
| --- | ---: | ---: |
| Published states | 1 | 40 |
| Accounted transfer bytes | 193,929 | 7,409,845 |
| Result payload bytes | 1,981 | 0 |
| One illustrative request-time sample | 12.14 ms | 459.89 ms |

Both paths yield the exact archive and final hash **`e204a0e9`**, with exact replay
and saved continuation. The transfer difference is about 38.2 times in this
authored workload. Timings include structured cloning and are one local sample;
they are not a distribution, browser frame-time measurement or whole-campaign
speedup. The final army/town summary is still published once. No full-empire
performance or memory gate is claimed.

The retained posting comparison remains **531,302 versus 51,416,921 bytes**, one
versus 100 states and hash **`e43b0ca7`**. Its archive, fog and saved-continuation
assertions still pass, providing a direct regression check of the shared path.

Commands executed during implementation:

```sh
./node_modules/.bin/vitest run apps/web/src/worker-queries.test.ts --silent=false --reporter=verbose
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/eslint apps/web/src/protocol.ts apps/web/src/simulation.worker.ts apps/web/src/worker-queries.test.ts
git diff --check -- apps/web/src/protocol.ts apps/web/src/simulation.worker.ts apps/web/src/worker-queries.test.ts
```

All passed. The final fixture-size-only adjustment keeps small boundary cases on
Tiny maps; their assertions remain identical. The full 18-test run after that
adjustment passed. The typecheck/lint results precede that literal fixture-size
adjustment; the parent retains final integrated checks separately.

## Independent main-thread and UI inspection

The generic request ledger retains one pending request per instance and resolves
only a matching ID; the old posting class remains an aliasing subclass. Posting
and charter issuance check both ledgers before sending, so the same turn cannot
interleave separate group submissions or ordinary commands behind a pending
batch. The main thread also preserves current-worker identity checks and rejects
pending operations on reset, worker failure and unmount.

The state handler consumes the resulting hash, map delta and observation before
completing charter results. A `groupCharterError` rejects the operation and locks
actions for recovery. Missing or malformed result arrays, rejected map metadata
and renderer exceptions pass through the existing final pending-request check:
the promise ends with a possible-application warning, rather than remaining busy
or silently retrying. The parent-authored fault-injection browser sources cover
missing results and rejected map revision; this inspection does not claim those
browser runs as separately executed review evidence.

Army and town selections are separate local sets and each is filtered against
the current owned observation. Pages/search/registry switches retain selections;
campaign reset remounts the registry. Charter command construction sorts and
bounds current owned hearths, and revocation skips hearths without a charter.
Revocation uses the existing charter's valid ceiling, so an empty/unsubmitted
grant form cannot disable otherwise valid revocation. Only accepted results
remove selection; canonical refusal reasons remain visible for review.

Player copy matches the existing canonical contract: setting/revoking a charter
spends no coin immediately and preserves manual queues; future production is
chosen once per turn after upkeep, within each charter's ceiling and the shared
40-coin reserve. Works/Wealth/Learning prioritize buildings; Muster excludes
colonists and hulls and creates ordinary upkeep-bearing land companies. The
4–64 integer input limits, focus names and reserve are imported from simulation
exports. Registry rows display observed charter blockers/next work rather than
reimplementing production affordability in the UI.

## Rules, pacing and remaining scope

No files under `packages/sim`, `packages/ai`, `packages/content` or
`packages/persistence` are changed by this slice. There is no new canonical
command, game rule, save schema, content seal, price or AI policy. Rules/save
remain 31 and content remains `015468d1`. A pacing rerun is not required for this
client transport and control extension; exact serial-command/archive equivalence
is the relevant behavior check. This is not evidence that all future player
choices or mature campaigns have identical outcomes.

The slice advances bounded settlement policies. Named groups, governor strategy,
theaters, broader templates, combined mature-realm acceptance, sustained memory
and whole-release gates remain open. Keyboard, narrow-screen, visual and real
production-build behavior require the parent's separate browser evidence.
