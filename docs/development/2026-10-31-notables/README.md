# Notable characters (rules/save 64) — 2026-10-31

Design: [ADR 0095](../../architecture/0095-notable-characters.md).

## What changed

- `packages/content/src/notable-characters.ts`: twenty-four figures, one
  for every culture, each a marshal, surveyor or engineer with a story and
  one of the role's exclusive root specializations; `notableCharacter`,
  `notableCharactersForRules`, `validateNotableCharacterContent` (every
  culture has one; the specialization belongs to the role and is a root).
  The pack hash seals them from rules 64; frozen seals pass none;
  localization and the content count carry them.
- `packages/sim/src/characters.ts`: `recruitCharacter` under rules 64 makes
  the first appointment of a culture's notable role, in the whole campaign,
  that figure — name, `notableId`, the specialization set — and the journal
  notice says the name was known; the character view carries `notable`
  (id, story); the save validator checks a figure's culture, role, name and
  uniqueness; `assertNoNotables` for older seals. `save.ts`: save 64,
  `PRE_NOTABLES_CONTENT_HASH`, the v63 envelope parsed strictly without the
  field, the field refused under earlier rules; version plumbing in
  `rules.ts`, chronicle, persistence and `scripts/measure-pacing.ts`.
- `apps/web/src/characters.tsx`: the story under the name on the character
  sheet.
- Tests: the content tests (frozen seal, twenty-four figures, validation),
  `packages/sim/src/notables.test.ts` (the first appointment is the figure
  at rank 2 with the story observed; the second and other roles are
  ordinary; a dead figure does not answer again; nothing under rules 63;
  a v63 seal without figures round-trips; a v63 envelope cannot name one;
  sealing refused with a figure; a stranger's or a second figure is an
  invalid save), `tests/gameplay/notables.spec.ts` (appoint the role from
  the hearth's orders, read the name, rank and story on the sheet and the
  appointment in the journal).
- The character scenarios that test promotion from a blank specialization
  (`character-fixture.ts`, `characters.test.ts`, `battle-abilities.test.ts`,
  the AI `characters` and `composition` tests, the web skill-tree test)
  appoint their first officer under rules 63 and say so; the roster test
  expects the Vesper Court's figure first and the roll's name second.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,360 tests / 299 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **380 / 305 / 207**, all Prosperity, 0 refused orders (the rules 63 turn-68 refused survey order is gone with the shifted character serials) ([log](pacing-after.log), [json](pacing-after.json)) |
| seeds 20260906 and 20260907 | Epic **306 / 349**, Long 256 / 326, Standard 192 / 218, 0 refused orders; both Epic courses sit under the 350–400 band they held under rules 63 (390 / 365), Long seed 20260906 at 256 against 304 — recorded as drift on the other seeds while the headline campaign, the judging course, holds ([log](pacing-seeds.log), [json](pacing-seeds.json)) |
| proxies | Epic 307, chronicle Epic 467, Long 290, Standard 189, all Prosperity, within the proxy bounds (the campaigns project passed on them) ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: notables (new), characters | 6 passed in 45.5 s ([log](browser-covering.log); screenshots under `browser-results/`) |
| `@scale` chronicles journey, alone | 1 passed in 24 s after the pin moved **53 → 57**, attributed in [chronicle-expectation.md](chronicle-expectation.md): the Reedbound Council’s turn-17 surveyor is Talen Fordkeeper, whose fieldcraft widens the turn-19 survey, and an army takes another objective on turn 22 ([log](browser-chronicles.log)) |

## What the tests found first

The chronicle journey’s pinned victory turn moved from 53 to 57; the
replay above attributes it to the Council’s figure and the pin was moved
with the note, not loosened.


Nine character scenarios appoint a marshal and then choose its
specialization; under rules 64 that marshal arrived as the culture's
figure with the choice already made, and the scenarios refused the second
root. They now appoint under rules 63 with a comment, which is the same
blank officer every later appointment of the role still is.

## Known limits

- A figure is a named, specialized appointment and nothing more: no office,
  no loyalty, no succession, no special death. The AI plans nothing for
  them. Rulers, offices, legitimacy and the wider political cast remain
  unbuilt.
