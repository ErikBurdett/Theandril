# Ward breaking: the counter-rite — 2026-10-29

Rules/save **41**. Local checkpoint; nothing in this packet is published.
Design: [ADR 0063](../../architecture/0063-ward-breaking.md).

## What was built

- `packages/content`: `rite.ward_breaking` (discovery `arcane.unbinding`, Rune
  path at the second degree, four ashglass, instant, `sinceRules: 41`), the
  `breaking` kind, a validation that a warding lasts and a breaking is instant,
  and the rules 40 seal **ac80514d** named by `PRE_BREAKING_CONTENT_HASH`.
- `packages/sim`: a breaking is performed by a caster riding with a company that
  besieges a warded hearth; it removes the ward, jars its holder (`woundedTurns`
  at least two) and tells both realms who broke it. Rite options quote the
  besieged hearth as their target on the siege side and no target on the
  defending side. Save version 41 with no state change; `saveV40Schema`
  migrates a rules 40 envelope unchanged; rules 40 refuses the rite as unknown.
- `packages/ai`: `planRites` acts on both sides of a siege and runs before the
  siege judgement, so a besieger with a qualified riding caster breaks the ward
  instead of lifting the siege.
- No UI change: the character sheet's strategic-rites panel and the siege cards
  already quote every rite with its target and blocker.
- `scripts/measure-pacing.ts` accepts `--rules=41`.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint`, `pnpm content:validate` | pass ([log](typecheck-lint.log)) |
| `pnpm vitest run --project unit` | **2,300 tests / 284 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline headline-standard headline-long` | **362 / 327 / 227**, all Prosperity, 0 refused, 0 automatic refusals, command and event counts identical to the seam-warding packet, no rite in organic play ([log](pacing-after.log), [json](pacing-after.json)) |
| same with `--rules=40` | **362 / 327 / 227**; seals `1344e0a8` / `2e573161` / `1b476bf5` equal the seam-warding packet ([log](pacing-rules40.log), [json](pacing-rules40.json)) |
| `pnpm build` | pass ([log](build.log)) |
| `tests/gameplay/seam-warding.spec.ts` (warding journey) | passes ([log](browser-affected.log)) |
| `tests/gameplay/seam-warding.spec.ts:63` (breaking journey) | **reached its final assertions once** ([log](browser-affected.log)): the import, the warding through the sheet, the end of turn, the AI's breaking (`wards` empty, siege `[20, false]`) and the reopened sheet all passed, and the only failure was the test's own wound count, which ignored the turn's recovery tick (`wounded · 2 turns` → `wounded · 1 turns`). After that one-line fix every attempt failed before the campaign loaded, at worker start or by renderer crash ([rerun](browser-rerun.log), [rerun 2](browser-rerun2.log), [rerun 3](browser-rerun3.log), [rerun 4](browser-rerun4.log)); the fixed journey's last three assertions are therefore **unverified in the browser** |
| affected journeys (attunement, characters, conquest, subject rule) | attunement's two cases pass across the runs; the sabotage, conquest (three) and subject-rule cases failed at worker start or by renderer crash on every attempt in this checkpoint, after all of them passed on the seam-warding checkpoint earlier today with the same siege code paths; they are unverified here, not known defects |

New tests: the rules 41 case in `packages/sim/src/rites.test.ts` (offer on the
siege side only, every refusal, rules 40 refusal, breaking, jarring, resumed
works, v40 migration), the breaking case in `packages/ai/src/rites.test.ts`,
the rules 40 seal in `packages/content/src/content.test.ts`, and the breaking
journey in `tests/gameplay/seam-warding.spec.ts`.

## Limits and caveats

- **The headless browser on this desktop** crashed with `SIGTRAP` or refused
  the simulation worker's module requests throughout this checkpoint, with or
  without another session's browser suite running; the dev server stayed warm
  between runs. Trace archives and raw trace material were removed from the
  retained results; logs, error contexts and screenshots are kept.
- One warding and one breaking exist, both on the Rune path; the AI does not
  seek a second-degree Rune caster for a siege, and no headline realm performs
  either rite.
- The roadmap catalogue describes the delivery but links no evidence from this
  packet, because the catalogue pins evidence to a committed revision.
