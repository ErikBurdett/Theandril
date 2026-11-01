# Crises of the ages (rules/save 53) — 2026-10-31

Design: [ADR 0083](../../architecture/0083-crises.md).

## What changed

- `packages/content/src/crises.ts`: six original crises, two per age after
  the first, each with a term, a blight (food or devastation at the hearth,
  coin or knowledge off the realm per hearth), a shelter price per hearth
  and the shelter's story; `crisesForRules`, `crisisDefinition`,
  `validateCrisisContent` (every later age has one; the first brings none;
  each takes something). Sealed into the pack from rules 53; frozen seals
  pass none.
- `packages/sim/src/crises.ts`: the register (`active`, `past`),
  `beginCrises` (drawn from the seed and the age's index as the world enters
  an age; a standing crisis ends as the next begins), `advanceCrises` (the
  turn's toll of every unsheltered hearth; the end of a term),
  `shelterFromCrisis` with its blocker, `observeCrisis` (the realm's own
  quote), `validateCrises`, `assertNoCrises`. `simulation.ts`: the command
  schema, the new-game register, the toll after the hearth events, the
  crises begun after the ages are announced, the observation. `save.ts`:
  save 53, `PRE_CRISES_CONTENT_HASH`, the register appended last, stripped
  for older seals, refused under earlier rules, given to older envelopes
  empty; version plumbing in `rules.ts`, chronicle, persistence and
  `scripts/measure-pacing.ts`.
- `packages/ai/src/crises.ts`: `planCrisis` shelters when the toll still to
  come outweighs the price and the treasury can pay, off the same purse as
  the hearth-event answers. `arcane.ts`: a seam-expedition caravan on its
  site waits for the quoted founding fee.
- `apps/web/src/crises.tsx`: the Realm affairs card; `main.tsx`: the
  masthead names the standing crisis and its turns left.
- Tests: `packages/sim/src/crises.test.ts` (drawn with the age, the same
  from the same seed, announced to every realm, quoted per realm, sealed and
  refused under older rules, validated; the toll in isolation, sheltered
  hearths passed by, the end of the term; absent under older rules and
  envelopes), `packages/ai/src/crises.test.ts`, the content tests (frozen
  hash `d76aa9bb`, six crises, validation), the expedition fee in
  `attunement.test.ts`, `tests/gameplay/crises.spec.ts` (the masthead, the
  card, the shelter bought, the treasury and the journal). Synthetic legacy
  envelopes in `save.test.ts` and `features-in-sight.test.ts` strip the
  register; `rites.test.ts` clears it before a v41 reading; the chronicle
  test's event count carries eight crisis events.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,346 tests / 294 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **366 / 304 / 220**, all Prosperity; one refused survey order on Epic and on Long at turn 82, the recorded same-batch race ([log](pacing-after.log), [json](pacing-after.json)) |
| seeds 20260906 and 20260907 | Epic 367 / 385, Long 315 / 312, Standard 208 / 190, 0 refused orders ([log](pacing-seeds.log), [json](pacing-seeds.json)) |
| proxies | Epic 442, chronicle Epic 371, Long 298, Standard 213, all Prosperity, within bounds ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| crisis strength variants, measured before the shipped terms and prices | first design 429 / 305 / 223; halved terms 374 / 326 / 405 on the Epic seeds ([transcript](crisis-variants.txt), [probe](crisis-variant-probe.ts)) |
| [crisis-probe.ts](crisis-probe.ts), Epic and Long headline | Epic: Toll Wars 26–31, Tremors 47–51, Fever of the End 306–311, ten realms shelter 21 times, first bid 306 ([txt](crisis-probe-epic.txt)); Long: the same crises, eleven realms shelter 25 times, first bid 264 ([txt](crisis-probe-long.txt)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: crises (new), hearth events, epochs, attunement | 5 passed in 11 s ([log](browser-covering.log); screenshots under `browser-results/`) |
| `@scale` chronicles journey, alone | 1 passed in 22 s, the pin moved 55 → 53 and attributed ([log](browser-chronicles.log), [attribution](chronicle-expectation.md), [replay](chronicle-replay.txt)) |

## Known limits

- Crises are world-wide and identical for every realm; no regional crisis,
  migration, collapse, or crisis a realm brings on itself; no crisis event
  at a hearth. Two crises per age.
- Shelter is all or nothing for a realm; a hearth cannot be sheltered alone,
  and a hearth founded after the shelter is sheltered with the rest.
- The enclosed-basin ferry scenario (`enclosed-sea.test.ts`, seed 74) is
  sensitive to the crisis of the Age of Roads: it held its first passenger
  under the first design and lands it under the shipped one.
