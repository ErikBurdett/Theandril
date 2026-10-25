# Settlement order fixture authoring

The new acceptance reuses the existing `empireDelegationCampaign()` authored Huge fixture: thirty owned hearths, 128 own companies, two living rival hearths and two wars. Its ownership, infrastructure, placement and disclosed terrain patches are synthetic. The new fixture authors a finite 4,000-coin treasury before its from-save journal, retains all existing hearth names, then uses thirty ordinary recorded commands: revoke ten charters, raise fifteen Muster ceilings and purchase five guard queues. No turn advances in this new setup or the production journey.

## Retained initial probe failure

The first local fixture probe additionally renamed every hearth to `Registry hearth NN`. Its strict save/load immediately rejected the renamed snapshot:

```text
Error: Invalid save: project host ownership or location disagrees
    at assert (.../packages/sim/src/progression.ts:237:74)
    at validateProgression (.../packages/sim/src/progression.ts:255:41)
    at deserializeGame (.../packages/sim/src/save.ts:1288:3)
    at settlementOrderScene (.../tests/gameplay/settlement-order-fixture.ts:20:10)
```

The mature fixture contains saved project-host metadata, including the host's name. Renaming the settlement alone broke that identity. The correction preserves existing settlement names rather than rewriting project history or weakening the strict loader. The base delegation fixture already loads successfully. This was a fixture-authoring failure before any browser run, not a product/filter failure. The original tool output is retained in the conversation; the excerpt above preserves its exact error and source stack while shortening absolute prefixes.

## Corrected probe

Executed from the repository root:

```sh
./node_modules/.bin/tsx -e "import { settlementOrderScene } from './tests/gameplay/settlement-order-fixture.ts'; const f=settlementOrderScene(); console.log(JSON.stringify({hash:f.hash,baseHash:f.baseHash,counts:f.counts,records:f.archive.records.length,waiting:f.waiting,direct:f.direct,queued:f.queuedCharters,ready:f.ready,candidate:f.candidate,treasury:f.game.factions.find(x=>x.id===f.factionId)?.treasury}));"
```

The corrected probe exits successfully and its embedded strict-load/replay assertions pass:

- Before-journal hash: `342e4759`.
- After thirty setup records: `503329a2`.
- Counts: All hearths **30**, No production **24**, Without charters **10**, Charters waiting **5**. These overlapping cohorts are not additive.
- Finite treasury after the five paid guard queues: **3,940** coin.
- The five waiting hearths are `settlement.90`–`settlement.94`, named `Delegated hearth 26`–`Delegated hearth 30`, the last stable-ID registry page. Their canonical explanation asks the player to raise the four-coin ceiling.
- One original and five newly purchased queues remain present. Four queued hearths have charters; they expose neither a blocker nor a next candidate because their queue takes precedence.
- Eleven empty chartered hearths expose the current candidate `Cinder plate cohort`. This is a canonical observation at the current budget, not a guarantee of next-turn purchase under a shared treasury.

The prepared production journey checks filtering/search/paging and selection retention without command effects, then deliberately changes the five waiting charters plus one checked queued/unchartered hearth outside the active filter. The expected six changes produce thirty-six records and cohorts 30 / 24 / 9 / 0, preserving treasury, queues, armies and routes. Those browser outcomes are acceptance assertions, not claimed results at this authoring checkpoint. Parent-coordinated browser evidence remains separate.

Scoped ESLint passes for both new fixture and production spec. No browser, application build, full test suite or timing benchmark was run by the fixture author during preparation.
