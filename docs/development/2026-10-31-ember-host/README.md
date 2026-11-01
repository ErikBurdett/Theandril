# The ember host, a summoning rite (rules/save 67) — 2026-10-31

Design: [ADR 0098](../../architecture/0098-ember-host.md).

## What changed

- `packages/content/src/magic.ts`: the fourth rite kind, `summoning`, and
  `rite.ember_host` (Flame, first degree, Contained ember projection, eight
  ashglass, instant); the validator lets a breaking or a summoning be
  instant and keeps the standing rites to a term. The rite is sealed from
  rules 67; `magicPackForRules` keeps it out of frozen seals.
- `packages/sim/src/rites.ts`: `SUMMONED_UNIT_ID`, `ArmyRaiser`; the
  objection for a summoning (lodged, a Flame seam held, not occupied, paid;
  a warded hearth may still raise), and `performRite` raising the host
  through the campaign's army raiser with no movement this turn, telling the
  besieger a host has risen; `RiteOption` carries the rite's `kind`.
  `simulation.ts` passes `addArmy`. `packages/ai/src/rites.ts`: a summoning
  is taken only at a besieged hearth where no company of the realm stands,
  after the standing rites in the catalogue's order. `save.ts`:
  save 67, `PRE_SUMMONING_CONTENT_HASH`, the v66 schema and branch; version
  plumbing in `rules.ts`, `simulation.ts`, chronicle, persistence and
  `scripts/measure-pacing.ts`.
- `apps/web/src/magic.tsx`: an instant rite reads "at once" instead of "0
  turns".
- Tests: `packages/sim/src/rites.test.ts` (raised at a lodged Flame caster's
  hearth beside a standing kindling, instant, paid, movement zero then
  restored at the turn; refused unpaid, occupied and unheld; unknown under
  rules 66; the host seals under rules 66 as a company), the AI rites test
  (kindling first; no host beside a company of the realm; the host once the
  company marches out; nothing when the ashglass is short), the
  web rites test (the quote), `tests/gameplay/ember-host.spec.ts` (perform
  from the sheet, read the company in the army registry and the journal).

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,365 tests / 301 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **380 / 296 / 197**, Prosperity, Attunement and Prosperity, 0 refused orders (Epic and Long identical to rules 66; Standard 199 → 197) ([log](pacing-after.log), [json](pacing-after.json)) |
| seeds 20260906 and 20260907 | Epic 344 / 336, Long 276 / 266, Standard 190 / 191, 0 refused orders — identical to rules 66; the two Epic courses sit just under the 350–400 band as recorded with the fourth catalogue ([log](pacing-seeds.log), [json](pacing-seeds.json)) |
| proxies | Epic 327, chronicle Epic 476, Long 301, Standard 201, within the proxy bounds (the campaigns project passed on them); the chronicle Epic proxy moved 440 → 476 ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: ember host (new), seam warding | 4 passed in 12.5 s ([log](browser-covering.log); screenshots under `browser-results/`) |
| `@scale` chronicles journey, alone | 1 passed in 24 s, the pin at 56 unmoved ([replay](chronicle-replay.txt)) ([log](browser-chronicles.log)) |

## What the tests found first

The rite was first listed before the kindling, so the AI raised a host
before kindling the walls and the two older AI rite tests broke; it now
follows the standing rites, and the planner takes a summoning only where
no company of the realm stands, which the rules 40 test's garrisoned hearth
exercises. The rite's description also overran the content schema's limit
of 320 characters until shortened. The journey first gave the realm twenty
ashglass and expected the second quote to read an empty stockpile; it gives
eight, one host’s worth.

## Known limits

- One summoning of one path; the host is always Oath guard and always
  rises at the caster's own hearth. Rituals beyond these four, a third
  magical path and further artifice remain unbuilt.
