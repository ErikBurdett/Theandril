# The second city-state roster (rules/save 69) — 2026-11-01

Design: [ADR 0100](../../architecture/0100-city-states-ii.md).

## What changed

- `packages/content/src/city-states.ts`: twenty-four more city-states, one
  for every culture, with `sinceRules: 69`; `cityStatesForRules`; the first
  roster is untouched and hashes as before. `city-state-trade.ts`: a trade
  good for each, sealed from rules 69; a trade is sealed no earlier than its
  city-state. `index.ts`: the pack hash takes the roster of the rules being
  sealed; the first-roster seals pass theirs.
- `packages/sim/src/simulation.ts`: the seat pool is the roster the
  campaign's rules know; more city-states than the rules know are refused;
  a campaign asked for without rules is created under `CURRENT_RULES`
  (`rules.ts`), not 40.
  `save.ts`: save 69, `PRE_CITY_STATES_II_CONTENT_HASH`, the v68 schema and
  branch, a campaign seating the second roster refused under earlier rules;
  version plumbing in `rules.ts`, chronicle, persistence and
  `scripts/measure-pacing.ts`.
- `apps/web/src/main.tsx`: the setup seats up to forty-eight city-states.
- Tests: the content tests (forty-eight, twenty-four under rules 68, the
  frozen seals passing their rosters, a mis-sealed trade refused),
  `packages/sim/src/city-states-ii.test.ts` (both rosters under rules 69,
  the first alone and the same draws under rules 68, the refusals, the seals
  and round trips), `tests/gameplay/city-states-ii.spec.ts` (the setup limit
  and a standard campaign seating the second roster under its own names).

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,370 tests / 304 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **380 / 296 / 197**, identical to rules 68 (the measured campaigns seat no city-states, so the roster cannot move them; the creation default moved from 40 to the current rules and changed nothing at creation), 0 refused orders ([log](pacing-after.log), [json](pacing-after.json)) |
| seeds 20260906 and 20260907 | Epic 344 / 336, Long 276 / 266, Standard 190 / 191, identical to rules 68 ([log](pacing-seeds.log), [json](pacing-seeds.json)) |
| proxies | Epic 327, chronicle Epic 476, Long 301, Standard 201, identical to rules 68, within the proxy bounds ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: city-states II (new), hires, tribute | 3 passed in 7.4 s ([log](browser-covering.log); screenshots under `browser-results/`) |
| `@scale` chronicles journey, alone | 1 passed in 23 s, the pin at 56 unmoved; [the replay](chronicle-replay.txt) shows rules 68 and 69 issuing the same 916 commands (the watched campaign seats no city-states) ([log](browser-chronicles.log)) |

## What the tests found first

`createGame` took its creation-time rules option as 40 when none was asked
for, a default from the era when nothing at creation branched above it; the
roster gate read every current campaign as rules 40 and drew the first
roster only, which the new sim test caught. New campaigns are now created
under `CURRENT_RULES` (nothing else at creation branches between 40 and
69, checked). Five fixtures that seat city-states and seal the campaign
under older rules — in the alliance, client, demand, hire and sixty-four-seat
tests — now ask for `rulesVersion: 68` and say why: a current campaign may
seat the second roster, which cannot seal under the rules those files read.
The hire test's rules 67 seal reads the frozen rules 67–68 pack hash. The
journey first read the seated city-states from the page's observation, which
lists only the realms a player has met; it now imports a campaign in which
the realm has met a second-roster city-state and reads it in Realm affairs.

## Known limits

- The city-states remain one kind of independent power. Clans, pirates,
  cults and nomads with their own relations remain unbuilt.
