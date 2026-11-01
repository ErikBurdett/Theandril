# Offices of the realm (rules/save 65) — 2026-10-31

Design: [ADR 0096](../../architecture/0096-offices.md).

## What changed

- `packages/content/src/offices.ts`: four offices, one for every character
  role, each with a description and a yield of two for the hearth its
  holder sits in; `officeDefinition`, `officesForRules`,
  `validateOfficeContent` (one office per role; every office yields
  something). The pack hash seals them from rules 65; frozen seals pass
  none; localization and the content count carry them.
- `packages/sim/src/offices.ts`: the register; `holdOffice` with its
  blockers (an office of the realm, vacant; a living, unwounded character
  of the role, sitting in a hearth, holding nothing else); `resignOffice`;
  `vacateOffices` on death; `officeYields` for a hearth; `heldOffice`;
  `observeOffices`; validation. `characters.ts`: the assignment blocker for
  a holder; death vacates. `simulation.ts`: the commands, the register, the
  observation, and the office yield in `settlementYields` beside land,
  development and progression. `save.ts`: save 65,
  `PRE_OFFICES_CONTENT_HASH`, the register appended last, stripped for
  older seals, refused under earlier rules, given to older envelopes empty;
  version plumbing in `rules.ts`, chronicle, persistence and
  `scripts/measure-pacing.ts`.
- `packages/ai/src/offices.ts`: a vacant office goes to a character of its
  role whom the turn's work leaves sitting in a hearth with no company to
  join, only while the realm keeps another of that role for the road; one a
  turn, after the specialists' orders in `index.ts`.
- `apps/web/src/characters.tsx`: the character sheet's Offices section —
  the office held with its yield and Resign, or the vacant offices of the
  character's role with Hold office at the hearth they sit in.
- Tests: the content tests (frozen seal, four offices, validation),
  `packages/sim/src/offices.test.ts` (seated, paid through the hearth's
  yield, observed, refused twice and across roles, kept from the road,
  resigned, vacated by death, validated; nothing under rules 64; sealing
  refused with an office; a v64 envelope loads with none),
  `packages/ai/src/offices.test.ts`, `tests/gameplay/offices.spec.ts` (hold
  from the sheet, read the office and the journal, resign); the forged v38
  envelope in `features-in-sight.test.ts` and the synthetic projection in
  `save.test.ts` strip the register. The office command's holder field is
  named `holderId` so the AI tests that narrow commands on `characterId`
  are untouched.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,363 tests / 301 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **380 / 305 / 207**, all Prosperity, 0 refused orders — every course identical to rules 64 ([log](pacing-after.log), [json](pacing-after.json)) |
| seeds 20260906 and 20260907 | Epic 306 / 349, Long 256 / 326, Standard 192 / 218, 0 refused orders — identical to rules 64; the two Epic courses remain under the band they held under rules 63, the drift recorded with the notables ([log](pacing-seeds.log), [json](pacing-seeds.json)) |
| proxies | Epic 307, chronicle Epic 467, Long 290, Standard 189, identical to rules 64, within the proxy bounds ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: offices (new), characters | 6 passed in 44.3 s ([log](browser-covering.log); screenshots under `browser-results/`) |
| `@scale` chronicles journey, alone | 1 passed in 24 s, the pin at 57 unmoved; [the replay](chronicle-replay.txt) shows rules 64 and 65 issuing the same 953 commands, with no office held by the AI in that campaign (its guard needs two idle characters of a role) ([log](browser-chronicles.log)) |

## What the measurements found

No measured campaign seated an office: the AI's guard needs a second
living character of the role before it will take one off the road, and
the watched campaigns never had two idle. The AI rule is covered by its
unit test and the player's side by the journey; its effect on AI play is
unmeasured so far.

## Known limits

- An office pays its hearth and keeps its holder, nothing more: no
  legitimacy, loyalty, succession or unrest, and no office beyond the four.
  The AI fills offices but never resigns one. Rulers and the wider
  political cast remain unbuilt.
