# Relics of the old places (rules/save 63) — 2026-10-31

Design: [ADR 0094](../../architecture/0094-relics.md).

## What changed

- `packages/content/src/relics.ts`: twenty-four relics, one for every
  landmark kind, each with a story and a leadership bonus of up to three
  attack or armor; `relicOfLandmarkKind`, `relicsForRules`,
  `validateRelicContent` (every kind keeps one; every relic leads
  somewhere). The pack hash seals them from rules 63; frozen seals pass
  none; localization and the content count carry them.
- `packages/sim/src/relics.ts`: the register; `advanceRelics` (the first
  hearth to work a landmark's hex brings up its relic, once, at the turn's
  end); `bestowRelic` with its blockers (the realm's own relic and living
  character; a null bearer takes it back); `relicLeadership`;
  `observeRelics`; validation. `characters.ts`: a company's leadership
  counts the relics its riders bear, and the battle snapshot freezes that
  bonus (`relicLeadership`) so the save validator checks the sealed record
  without the living relics. `simulation.ts`: the command, the register, the
  turn's end, the observation. `save.ts`: save 63,
  `PRE_RELICS_CONTENT_HASH`, the register appended last, stripped for older
  seals, refused under earlier rules, given to older envelopes empty;
  version plumbing in `rules.ts`, chronicle, persistence and
  `scripts/measure-pacing.ts`.
- `packages/ai/src/relics.ts`: a waiting relic goes to the character riding
  with the realm's strongest company, one a turn; `index.ts` issues it with
  the turn.
- `apps/web/src/characters.tsx`: the character sheet's Relics section —
  what the character bears, what waits in the hearth, bestow and take back.
- Tests: the content tests (frozen seal, twenty-four relics, validation),
  `packages/sim/src/relics.test.ts` (brought up once by the hearth that
  works the hex through legal claims; bestowed, borne as leadership, taken
  back; the dead bear nothing; validated; nothing under rules 62; sealing
  refused with a relic; a v62 envelope loads with none),
  `packages/ai/src/relics.test.ts`, `tests/gameplay/relics.spec.ts` (the
  waiting relic on the sheet, the bestowal, the journal); synthetic legacy
  envelopes strip the register. The relic command's bearer field is named
  `bearerId` so the AI tests that narrow commands on `characterId` are
  untouched.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,358 tests / 298 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **376 / 316 / 213**, all Prosperity; one refused survey order on each pace at turn 68, the recorded same-batch race ([log](pacing-after.log), [json](pacing-after.json)) |
| seeds 20260906 and 20260907 | Epic 390 / 365, Long 304 / 282, Standard 189 / 202, 0 refused orders ([log](pacing-seeds.log), [json](pacing-seeds.json)) |
| proxies | Epic 336, chronicle Epic 440, Long 290, Standard 197, all Prosperity, within bounds ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: relics (new), characters | 6 passed in 45 s ([log](browser-covering.log); screenshots under `browser-results/`) |
| `@scale` chronicles journey, alone | 1 passed in 24 s, the pin at 53 unmoved ([log](browser-chronicles.log)) |

## What the campaigns found first

The first battle snapshots carried no relic bonus, so the save validator,
which recomputes a battle's formations from unit content and the riders'
leadership, refused a campaign whose bearer rode into battle. The bonus is
frozen in the snapshot now and the validator counts it.

## Known limits

- A relic leads and nothing more: no sight, no yield, no rite, no trade;
  none is lost, stolen or traded, and a dead bearer keeps it in the
  register until it is taken back. Rituals, summons and a third magical
  path remain unbuilt.
