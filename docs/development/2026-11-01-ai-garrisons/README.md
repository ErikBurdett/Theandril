# AI garrisons: holding a conquered hearth whose lanes may rise — 2026-11-01

AI and observation only; no rule, save field or content seal changes.
Design: [ADR 0113](../../architecture/0113-ai-garrisons.md).

## What changed

- `packages/sim/src/unrest.ts`: `founderToRiseFor` (the founder a conquered
  hearth's lanes may rise for) and `garrisoned` split out of
  `restorationOf`; the holder's observation carries `rising` whether or not
  an army stands in the hearth and `garrisoned` beside it.
  `apps/web/src/siege.tsx` reads *may rise for X* or *garrisoned against X*.
- `packages/ai/src/garrisons.ts`: `planGarrisons` (from fifty unrest, hold a
  land company standing in a hearth that may rise; send the nearest free
  land company in by a queued road when none stands there; two orders a
  turn); `index.ts` merges its held companies and orders beside the
  warden's road.
- Tests: `packages/ai/src/garrisons.test.ts` (quiet lanes hold nothing;
  the vanguard standing in the restless hearth is held and the turn plan
  does not move it; marched out, it is ordered back and the turn plan
  carries the order; a company another planner holds is not taken; below
  the watch level nothing is ordered; the order is legal and brings the
  company home); the restoration test reads `garrisoned` beside `rising`.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,384 tests / 311 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **384 / 291 / 205**, identical to rules 80 before the planner on every headline course, 0 refused orders: no AI realm in these campaigns holds a conquered hearth whose lanes rise ([log](pacing-after.log), [json](pacing-after.json)) |
| seeds 20260906 and 20260907 | Epic 352 / 351, Long 289 / 282, Standard 197 / 200, identical to the restoration slice (the one refused survey order on the second Standard seed stands as recorded) ([log](pacing-seeds.log), [json](pacing-seeds.json)) |
| proxies | Epic 368, chronicle Epic 407, Long 382, Standard 209, identical to the restoration slice, within the proxy bounds ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: restoration, unrest | 2 passed in 5 s ([log](browser-covering.log); screenshots under `browser-results/`) |
| `@scale` chronicles journey, alone | 1 passed in 25 s, the pin at 57 unmoved; [the replay](chronicle-replay.txt) shows the watch campaign issuing the same 970 commands ([log](browser-chronicles.log)) |

## What the tests found first

The first planner test found that the restoration slice's `rising` was
hidden while a company stood in the hearth, since it was read from the
same check that decides the restoration; a planner cannot hold a garrison
it is not told about. The observation now names the founder regardless and
says whether the hearth is garrisoned; the panel's wording follows.

## Known limits

- The AI does not ease taxes on a rising hearth sooner than on any other,
  and sends no company it does not have.
- The headline campaigns measured here seat no restoration at all, so the
  planner's effect on pacing is unmeasured beyond their unchanged courses.
