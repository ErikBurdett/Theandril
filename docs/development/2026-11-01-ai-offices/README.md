# AI offices: a surveyor who sits as Keeper of the Roll — 2026-11-01

AI only; no rule, save field or content seal changes.
Design: [ADR 0116](../../architecture/0116-ai-offices.md).

## What changed

- `packages/ai/src/characters.ts`: `OFFICE_HOLDER_TREASURY` and the desire
  for a second surveyor when the Keeper of the Roll is vacant, one surveyor
  already serves and the treasury holds two hundred coin; the appointment
  is made to sit, without a waiting company.
- `packages/ai/src/offices.ts`: a sitting character with a company to join
  takes the office when another of the role already rides or is away on a
  mission; the realm's only character of a role is never seated.
- Tests: `packages/ai/src/offices.test.ts` (the second surveyor wanted,
  not when the purse is short nor once the office is held; both sitting
  with companies to join seats nothing; one riding seats the other; the
  seated office reads strong legitimacy), the existing office and
  character tests unchanged.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,388 tests / 314 files pass** on the rerun ([the first run](tests-unit-first.log) overlapped the roadmap edit and failed its two count checks) ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **350 / 281 / 199** (384 / 291 / 205 before the planner), 1 refused order on the Epic and Long courses: all three courses in band, the Epic course at the bottom of its 350–400 band; the refused order is one survey mission the AI sent to ground already explored (turn 86), the same quirk recorded on a Standard seed since rules 79 ([log](pacing-after.log), [json](pacing-after.json)) |
| seeds 20260906 and 20260907 | Epic 331 / 359, Long 288 / 284, Standard 200 / 203 (352 / 351, 289 / 282, 197 / 200 before the planner): every seed in band but the first Epic seed at 331, nineteen under ([log](pacing-seeds.log), [json](pacing-seeds.json)) |
| proxies | Epic 334, chronicle Epic 412, Long 295, Standard 200 (388 / 407 / 382 / 209 before the planner), within the proxy bounds (the campaigns project passed on them) ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: legitimacy, offices | 2 passed in 5 s ([log](browser-covering.log); screenshots under `browser-results/`) |
| `@scale` chronicles journey, alone | 1 passed in 26 s, the pin at 57 unmoved: [the replay](chronicle-replay.txt) shows the short watch campaign never reaching the two-hundred-coin seat, so no office is held in it; [the office probe](office-probe.txt) plays the same tiny map at Long pace and records ten `holdOffice` orders across three AI realms, re-seated as holders die ([log](browser-chronicles.log)) |

## What the measurements found

The headline Epic course moves from 384 to 350 with the planner: AI realms
that seat the office read strong legitimacy and their lanes ease, and the
office's own yield adds to the hearth, so three of the twelve realms run
faster campaigns. All three headline courses stay in band, the Epic course
at the bottom of its, and the first Epic seed sits nineteen under; no price
or proxy bound changed. The planner's first unit run overlapped the roadmap
edit and failed the two count checks; the rerun passes.

## Known limits

- Only the surveyor's office is sought; the other three are taken only
  when a second of their role happens to sit idle.
