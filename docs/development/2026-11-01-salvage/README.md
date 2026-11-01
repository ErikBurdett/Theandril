# Salvage from the ruins (rules/save 81) — 2026-11-01

Design: [ADR 0114](../../architecture/0114-salvage.md).

## What changed

- `packages/sim/src/salvage.ts`: `advanceSalvage` (the turn's salvage, by
  ruin id: the realm whose company stands on untouched ruins takes twenty
  coin and ten knowledge once, the ruin records it, a `ruin_salvaged`
  event), `hasSalvage`, `assertNoSalvage`, `validateSalvage`; `siege.ts`
  and `types.ts` carry the ruin's optional `salvagedByFactionId`;
  `simulation.ts` runs the salvage after the sieges; `save.ts`: save 81,
  the v80 branch refusing salvage, sealing under earlier rules refused
  with salvage, validation; version plumbing in `rules.ts`,
  `simulation.ts`, chronicle, persistence and `scripts/measure-pacing.ts`.
- `apps/web/src/siege.tsx`: the ruin inspection reads whether the salvage
  is untouched or who took it.
- `packages/ai/src/index.ts`: untouched ruins within six hexes draw a free
  land company, scored below an enemy depot or a visible enemy.
- Tests: `packages/sim/src/salvage.test.ts` (the exact salvage against the
  same round under rules 80, once only, the same from a save, the round
  trip, sealing refused, a v80 envelope loading and a forged one refused,
  validation), `packages/ai/src/salvage.test.ts` (the pull toward ruins in
  reach, none beyond reach or once taken), `tests/gameplay/salvage.spec.ts`
  (the inspector before and after, the journal); the sim version pins.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,386 tests / 313 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **384 / 291 / 205**, identical to rules 80 on every headline course, 0 refused orders: no hearth is razed in these campaigns, so no ruins stand to be salvaged ([log](pacing-after.log), [json](pacing-after.json)) |
| seeds 20260906 and 20260907 | Epic 352 / 351, Long 289 / 282, Standard 197 / 200, identical to rules 80 (the one refused survey order on the second Standard seed stands as recorded) ([log](pacing-seeds.log), [json](pacing-seeds.json)) |
| proxies | Epic 368, chronicle Epic 407, Long 382, Standard 209, identical to rules 80, within the proxy bounds ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: salvage (new), conquest | 4 passed in 19 s ([log](browser-covering.log); screenshots under `browser-results/`) |
| `@scale` chronicles journey, alone | 1 passed in 24 s, the pin at 57 unmoved; [the replay](chronicle-replay.txt) shows rules 80 and 81 issuing the same 970 commands ([log](browser-chronicles.log)) |

## What the tests found first

Nothing failed on the first run of the new tests; the first pass of the
save edits applied only half-way when a sealing assertion appeared at two
sites, and the second pass placed the salvage assertion before both.

## Known limits

- The salvage is a fixed sum; ruins hold no discovery, lair or event.
- Two realms standing on the same ruins yield to the earlier faction id,
  not to who arrived first.
