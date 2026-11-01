# Legitimacy (rules/save 82) — 2026-11-01

Design: [ADR 0115](../../architecture/0115-legitimacy.md).

## What changed

- `packages/sim/src/legitimacy.ts`: `legitimacyOf` (the level and its
  reasons from the seat, the conquests, the offices and the oaths),
  `legitimacyStanding`, `legitimacyUnrest` (one more unrest a turn when
  weak, one less when strong, from rules 82), `observeLegitimacy`;
  `unrest.ts` adds the pressure to every hearth; the observation carries
  `legitimacy`. `save.ts`: save 82, the v81 branch; version plumbing in
  `rules.ts`, `simulation.ts`, chronicle, persistence and
  `scripts/measure-pacing.ts`.
- `apps/web/src/legitimacy.tsx`: the Realm affairs section with the level,
  the standing and the reasons, mounted beside the taxes.
- Tests: `packages/sim/src/legitimacy.test.ts` (the founded seat at two,
  an office to three and its easing, a patron's client and the patron, a
  conquered seat and more conquered than founded to zero and its pressure
  beside heavy taxes, the round applying it, nothing under rules 81, the
  same round from the save, a v81 envelope loading),
  `tests/gameplay/legitimacy.spec.ts` (the panel); the sim version pins.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,387 tests / 314 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **384 / 291 / 205**, identical to rules 81 on every headline course, 0 refused orders: no AI realm in these campaigns stands weak or strong long enough to move its course ([log](pacing-after.log), [json](pacing-after.json)) |
| seeds 20260906 and 20260907 | Epic 352 / 351, Long 289 / 282, Standard 197 / 200, identical to rules 81 (the one refused survey order on the second Standard seed stands as recorded) ([log](pacing-seeds.log), [json](pacing-seeds.json)) |
| proxies | Epic **388** (368 under rules 81), chronicle Epic 407, Long 382, Standard 209: the Epic proxy moves twenty turns as a client or conqueror realm on it reads weak legitimacy, within its 250–550 bound; the other three identical ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: legitimacy (new), taxes, unrest | 3 passed in 8 s ([log](browser-covering.log); screenshots under `browser-results/`) |
| `@scale` chronicles journey, alone | 1 passed in 24 s, the pin at 57 unmoved; [the replay](chronicle-replay.txt) shows rules 81 and 82 issuing the same 970 commands ([log](browser-chronicles.log)) |

## What the tests found first

Nothing failed on the first run of the new tests. The chain's first run was
stopped after its headline measurement because the next slice's AI edits
landed a second later and would have been measured with it; the seed,
proxy, build and journey steps were rerun with those edits set aside, and
the unit, campaigns and headline results from the first run stand
(their logs predate the edits).

## Known limits

- The AI holds no office and answers weak legitimacy only through lean
  taxes; succession, loyalty and rulers remain open.
- The reading has no cost or action of its own: nothing is spent to raise
  it beyond holding an office, keeping a client or keeping a founded seat.
