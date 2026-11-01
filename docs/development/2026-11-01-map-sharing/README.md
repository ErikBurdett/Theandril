# Allies share their maps (rules/save 72) — 2026-11-01

Design: [ADR 0103](../../architecture/0103-map-sharing.md).

## What changed

- `packages/sim/src/map-sharing.ts`: the register, `mapShareBlocker`
  (rules, an ally, the twenty-turn cooldown), `shareMaps` adding each
  ally's explored hexes to the other and recording the pair,
  `observeMapShares` per ally, validation. `simulation.ts`: the command,
  the register, the observation. `save.ts`: save 72, the register appended
  last, stripped for older seals, refused under earlier rules, given to
  older envelopes empty; version plumbing in `rules.ts`, chronicle,
  persistence and `scripts/measure-pacing.ts`; the sim index exports the
  module.
- The AI does not share maps (see below); AI allies accept a player's
  sharing through the same command.
- `apps/web/src/diplomacy.tsx`: the Share maps button and quote under the
  alliance line of every ally.
- Tests: `packages/sim/src/map-sharing.test.ts` (the exchange both ways,
  the counts in the journal, the record, the cooldown and its quote, the
  refusals, the replaced record, validation, nothing to share once the
  alliance ends; nothing under rules 71; sealing refused with a share; a
  v71 envelope loads with none), `tests/gameplay/map-sharing.spec.ts` (share from Realm affairs, the
  waiting quote, the journal); the forged v38 envelope in
  `features-in-sight.test.ts` and the synthetic projection in
  `save.test.ts` strip the register.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,377 tests / 308 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **388 / 296 / 198**, identical to rules 71 (the AI does not share maps), 0 refused orders ([log](pacing-after.log), [json](pacing-after.json)) |
| seeds 20260906 and 20260907 | Epic 339 / 344, Long 283 / 286, Standard 191 / 196, identical to rules 71 ([log](pacing-seeds.log), [json](pacing-seeds.json)) |
| proxies | Epic 370, chronicle Epic 478, Long 305, Standard 207, identical to rules 71, within the proxy bounds ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: map sharing (new), alliances | 2 passed in 4.4 s ([log](browser-covering.log); screenshots under `browser-results/`) |
| `@scale` chronicles journey, alone | 1 passed in 23 s, the pin at 56 unmoved; [the replay](chronicle-replay.txt) shows rules 71 and 72 issuing the same 916 commands ([log](browser-chronicles.log)) |

## What the measurements found

An AI planner that shared maps with the first ally it could moved the
headline Epic course from 388 to 406, past its 350–400 band; sharing only
at war left it at 406; with the planner off the headline returned to
388 / 296 / 198 ([log](pacing-no-share.log)). A probe playing that campaign
both ways found no misplay: hearths, armies and orders ran alike and the
course diverged ([probe](share-probe.ts), [output](share-probe.txt)). The
observation does not yet show an ally's wars, so a common-enemy doctrine
cannot be written; the planner was removed and the AI keeps its own ground
until a planner that uses shared ground well can be shown in band.

## Known limits

- An exchange is the whole explored set, both ways, allies only: no partial
  maps, no sale of maps, no shared sight; the AI does not share. Joint war
  aims and the wider negotiated terms remain unbuilt.
