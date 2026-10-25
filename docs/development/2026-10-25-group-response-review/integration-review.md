# Independent legacy group-response integration review

Read-only source review on 25 October 2026, against working source after the root added the immediate `has(id)` guards following enqueue. Baseline HEAD is `5cb7dc84292bfddb876eb54e19046f7b97a77ad9`. **No blocking source finding remains in the reviewed change.** No tests, build or browser were run by this reviewer; executed acceptance belongs to the parent and browser owner.

## Exact reviewed source

| File | SHA-256 |
| --- | --- |
| `apps/web/src/group-posting-requests.ts` | `c549f5445416293f8a4212791eb7175f0a10b9f084cf51364facb8ea8405c4ce` |
| `apps/web/src/group-response-requests.test.ts` | `ebe5d390fe5e7b4d2a55600c738d4ec913bea788d9d0d151f2cf91ce90bef1ae` |
| `apps/web/src/main.tsx` | `34b343a883fc8479bf62bceac40fa4bb10cde5e1cbcdc7a9051c617e1b966fc8` |
| `apps/web/src/protocol.ts` | `0749c0b73d1bae5a4e93c5cd38f5f3785b6f215832d28627bf552e1ecf9641f0` |
| `apps/web/src/simulation.worker.ts` | `0e22e1d51cb25b26dc9e2e8afe9e18b0b9eec0f0e9f04d9ec531dd9799858a53` |

The complete generic `GroupOrderRequests<Result>` class, including its comment and method bodies, was compared to HEAD and is **byte-identical**. Its independent clients retain request-ID-only behavior. Both protocol and worker files are also byte-identical to HEAD. The diff adds transport correlation wrappers and main-thread integration; it does not alter canonical simulation rules or command legality.

## Identity and legacy compatibility

Each posting/charter wrapper stores a snapshot of the submitted faction and sorted actor IDs. Sorting uses ordinary string ordering, matching the unchanged worker's `<`/`>` actor ordering. Later mutation or reordering of the caller's command array cannot change the retained identity. One pending request remains exclusive; unrelated request IDs do not settle or replace it.

Enqueue bounds the batch at 1–128 distinct actors from one faction and rejects invalid IDs, sparse arrays and extra array properties before creating a pending request. The final main-thread integration checks `has(id)` immediately afterward, before setting busy or calling `postMessage`. Thus a rejected local intent is not still sent to the worker. This guard matters because enqueue returns a rejected promise rather than throwing synchronously.

For a normal final state, validation requires the exact dense result count, actor at each sorted position, boolean `accepted`, only the permitted row fields and a bounded nonblank message when a command was refused. Missing rows, missing lists, sparse lists, duplicates, reordered results, unrelated actors, foreign faction and malformed row/message values fail. Accepted legacy rows without a message remain valid; canonical partial refusals with reasons remain valid. The worker's existing posting and charter success/refusal shapes satisfy these constraints.

An explicit nonblank recording error is a separate recovery outcome. It may carry an absent or partial result list; the wrapper intentionally does not interpret those rows as success. Faction/request identity is still checked first. Invalid error types or blank/oversized errors are rejected. Ordinary typed top-level worker errors still reject the matching request directly, respecting the existing `recoveryRequired` flag.

## Adoption and recovery ordering

The two new `validate` calls occur at the start of state handling, before unpacked cells, hash, metrics, campaign, renderer and React observation adoption. A malformed matching reply throws into the existing recovery path; `finally` rejects the still-pending promise and requires saved restoration. No successful result is supplied to the selection-removal callback. Validation failure therefore preserves the prior displayed campaign instead of presenting a partial or unrelated row list as a completed batch.

Valid recording-error states follow the existing intentional path: their canonical snapshot can be displayed, but the error rejects the promise and leaves play recovery-locked. They are not reported as accepted partial selections. If rendering, fog handling or another later adoption step fails to complete, the still-pending matching request is likewise rejected in `finally`. This is distinct from proving a general transaction around every renderer mutation; the fix specifically moves reply identity validation before state adoption.

Campaign reset clears both request identity and promises, remounts registry selection context and prevents stale responses from completing a later request. Worker errors while a group request is pending set the recovery lock and reset all group ledgers. View unmount also resets them. Posting failures from `postMessage` reject the pending request and clear busy without pretending worker mutation occurred. Ordinary result completion clears both retained metadata and the underlying generic promise exactly once.

## Test-source assessment and remaining evidence

The new shared regression cases cover both actor fields, valid sorted successes and partial refusals, incomplete/sparse/duplicate/reordered/wrong-actor lists, foreign factions, strict message bounds, later command mutation, stale replies, reset/reuse, recording errors and the 128-actor boundary. A separate generic-helper assertion remains, supported more strongly by the byte comparison above. The adapted existing posting-ledger tests now validate the actual submitted identity before completion.

The prepared production source exercises missing-row, duplicate and wrong-actor replies for both postings and charters after two real canonical mutations, then requires restoration and explicit retry. These are presentation fault injections, not natural command refusals or physical process-kill evidence. This review inspected their boundary but does not claim their final browser outcomes. Parent-owned typecheck, lint, full tests and the final built journeys remain the acceptance evidence for the frozen hashes above. No new pacing claim or release-gate closure follows from this transport-only correction.

## Type-narrowing correction reviewed

The initial parent typecheck caught TS2345 in the enqueue guard: `object(command)` narrows the inspected value to an object record, which is insufficient for the generic `entityId(command)` callback's `Command` parameter. The retained `typecheck.log` records this failure; the earlier source review did not establish typecheck success.

The corrected guard uses `identifier(command[this.field])` after `object(command)`, without a cast. Reviewed source SHA-256 is now **`0cd31b974dcf847f8c472e0349b4274b07916183fb38bf92a5f9019f48d2590d`** for `apps/web/src/group-posting-requests.ts`, superseding that file's earlier hash above. The two fixed constructors pair `armyId` with posting commands and `settlementId` with charter commands, so the guard inspects the same runtime property as the callback. The later typed identity snapshot, validation and request lifecycle remain unchanged. No new blocking issue found.

The parent's retained `requests-focused-corrected.log` records **24 passing tests across five files in 592ms**. This addendum inspected source, its hash and existing logs only; no tests, typecheck, build or browser were executed by this reviewer. The parent's corrected broader verification is separate.
