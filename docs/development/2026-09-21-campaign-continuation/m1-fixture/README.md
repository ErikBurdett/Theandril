# Genuine version 17 diplomacy fixture

Captured on 2026-09-21 at 17:51:07 UTC with Node 22.23.2, before any client-state
rule, schema or content changes. Save/rules version is **17**, content hash is
`b79c78ed`. The producer ran against working-tree changes on base commit
`f07024fe23ad3386874656d48fbbc33a5380d979`; exact relevant source hashes and the
producer hash are retained in [`metadata.json`](metadata.json).

This is explicitly an authored **from-save** scenario. A generated tiny world
(seed 20260905, three factions, short pace) keeps its terrain, resources, founders
and starting treasuries. Two opposing scouts are repositioned beside the first
founder's cell, then the existing `refreshAuthoredSight` test helper restores
consistent knowledge. The initial save records that disclosed contact setup.
No settlement, war, diplomatic relation, offer, treaty or payment is inserted by
the producer. This fixture does not establish generated-start exploration, AI
behavior, balance or campaign pacing.

Nine ordinary accepted, recorded commands then:

1. Found one settlement for each of the three factions.
2. Declare Ashen–Reedbound war, propose peace offering seven coin, and accept it.
3. Declare Ashen–Cinder war and propose Cinder's peace request for eleven coin.
4. Advance one turn, preserving an active treaty and a pending offer at turn 2.

The seven-coin transfer is checked exactly before any subsequent economy turn.
The pending request has not transferred money. The pending save contains three
settlements, one active treaty (expires turn 11), one pending offer (expires turn
4), and the continuing Ashen–Cinder war. Nine additional recorded end turns retain
the original rules-17 checkpoints, offer-expiry events and treaty-expiry events.
The second war remains active after turn 11.

| Retained artifact | Purpose | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| [initial-save.json](initial-save.json) | Exact authored initial save | 22,154 | `b758c621d531d59b29c2286578cce923f33a535e2c3e4b3d3ed0491739fe04f3` |
| [pending-save.json](pending-save.json) | Exact turn-2 save with treaty and offer | 29,396 | `210b47baaa9cd7ea42decf481f42e0a12ba469c66cb787fd696b4b96e5d702e8` |
| [archive.json](archive.json) | Original archive format 2, nine rules-17 records | 27,779 | `b9c7724460671bc52aba884b0dbfddb579835a423994fd871e471a20ea781861` |
| [continuation.json](continuation.json) | Nine further original records, final save and hash | 41,164 | `aa7a7d0c742a692822e7536d8d76434bf905b6f84bbdd689c2dd23544d463d58` |

State seals are `ff9222e9` initially, **`9d49a22c` at turn 2**, and `c63f8cd7` at
turn 11. These are ordinary state/checkpoint seals; there is no victory and no
fabricated archive victory seal.

The producer verified exact pending save load/save bytes, full pending archive
replay bytes and checkpoint equality. It also verified the complete archive with
the continuation records against the original turn-11 save bytes. All commands
were accepted; all recorded rules and checkpoint versions are 17. Retain the
original bytes and seals when future M1 tests are added, and verify both historical
continuation and migration followed by modern commands separately.

The one-time producer is [`capture.ts`](capture.ts), and its successful output is
[`capture.log`](capture.log). It refuses to run on any current save version other
than 17 and refuses to overwrite any captured output. Do not rerun it after a
schema upgrade to manufacture new historical expectations.

Original capture command:

```sh
/home/telephoneheater/.local/share/mise/installs/node/22.23.2/bin/node --import tsx docs/development/2026-09-21-campaign-continuation/m1-fixture/capture.ts > docs/development/2026-09-21-campaign-continuation/m1-fixture/capture.log
```

The first sandboxed attempt reached the read-only Git provenance query but the
child process was denied; no fixture files had been written. The successful rerun
used the same producer outside that sandbox and completed in approximately 0.19
seconds. This capture did not modify production source or package tests. It
prepares compatibility evidence; it does not implement or complete M1.
