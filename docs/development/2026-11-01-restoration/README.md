# Restoration (rules/save 80) — 2026-11-01

Design: [ADR 0112](../../architecture/0112-restoration.md).

## What changed

- `packages/sim/src/unrest.ts`: `restorationOf` (the founder a hearth would
  return to, or null while it is the founder's, the founder is gone, it is
  the holder's capital or an army stands in it), the transfer at a hundred
  unrest in place of the riot (the cession's steps, the conquest's loss of
  lodged officers, lapsed pending events, ten devastation, occupation and
  unrest cleared, a `restoration` event to both realms), `rising` on the
  holder's own observation. `save.ts`: save 80, the v79 branch; version
  plumbing in `rules.ts`, `simulation.ts`, chronicle, persistence and
  `scripts/measure-pacing.ts`.
- `apps/web/src/siege.tsx`: the condition panel's unrest line names the
  founder a hearth may rise for.
- Tests: `packages/sim/src/unrest.test.ts` (a hearth captured by occupation
  from the subject fixture: the garrison holds it and it riots; the garrison
  marched out, it is read as rising; the capital, a fallen founder and
  rules 79 hold it; the round returns it with its people, buildings and
  land, the same from a save, a riot under rules 79; a v79 envelope loads),
  `tests/gameplay/restoration.spec.ts` (the panel's warning, the round, the
  journal, the summary's owner); the sim version pins.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,383 tests / 310 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **384 / 291 / 205**, identical to rules 79 on every headline course, 0 refused orders: no hearth in these campaigns reaches a hundred unrest without a garrison ([log](pacing-after.log), [json](pacing-after.json)) |
| seeds 20260906 and 20260907 | Epic 352 / 351, Long 289 / 282, Standard 197 / 200, identical to rules 79 (the one refused survey order on the second Standard seed stands as recorded under rules 79) ([log](pacing-seeds.log), [json](pacing-seeds.json)) |
| proxies | Epic 368, chronicle Epic 407, Long 382, Standard 209, identical to rules 79, within the proxy bounds ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: restoration (new), unrest, conquest | 5 passed in 20 s ([log](browser-covering.log); screenshots under `browser-results/`) |
| `@scale` chronicles journey, alone | 1 passed in 24 s, the pin at 57 unmoved; [the replay](chronicle-replay.txt) shows rules 79 and 80 issuing the same 970 commands ([log](browser-chronicles.log)) |

## What the tests found first

The first draft of the sim test transferred the hearth by calling the
unrest step directly and then failed the save round trip: the transfer
changes what each realm can see, and the turn loop refreshes every realm's
land memory after the settlement phase, which a direct call skips. The test
now drives the restoration through a real round, as the game does. The
observation lists every settlement in sight, so ownership is asserted on
the entry rather than its absence.

## Known limits

- The AI holds no garrison against a restoration and does not read the
  warning; lean taxes at sixty unrest are its only counterplay.
- No grievance is recorded for the realm that lost the hearth; a hearth
  whose founder is gone, or that is the holder's capital, riots as before.
