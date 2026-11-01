# The fourth hearth-event catalogue (rules/save 66) — 2026-10-31

Design: [ADR 0097](../../architecture/0097-hearth-events-iv.md).

## What changed

- `packages/content/src/events.ts`: fifteen templates from rules 66 across
  the conditions and the ages, one a chain whose default lets the quay be;
  ninety templates; the rules 65 pack (`cf5b6321`) is frozen.
- `packages/sim/src/save.ts`: save 66, `PRE_EVENTS_IV_CONTENT_HASH`, the
  v65 schema and branch (a v65 envelope may not name a rules 66 template),
  older envelopes re-sealed through the existing branches; version plumbing
  in `rules.ts`, `simulation.ts`, chronicle, persistence and
  `scripts/measure-pacing.ts`.
- Tests: the content tests (frozen seal, counts, one chain, every rules 66
  default free of a follow-up), the sim version pins, a third journey in
  `tests/gameplay/hearth-events.spec.ts` rendering the whale ashore.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,363 tests / 301 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **380 / 296 / 199**, all courses Prosperity or Attunement, 0 refused orders ([log](pacing-after.log), [json](pacing-after.json)) |
| seeds 20260906 and 20260907 | Epic 344 / 336, Long 276 / 266, Standard 190 / 191, 0 refused orders; the two Epic courses sit just under the 350–400 band (they were 306 / 349 under rules 64 and 65), the drift first recorded with the notables and narrowing here ([log](pacing-seeds.log), [json](pacing-seeds.json)) |
| proxies | Epic 327, chronicle Epic 440, Long 301, Standard 201, within the proxy bounds (the campaigns project passed on them) ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: hearth events (three, one new) | 3 passed in 8.9 s ([log](browser-covering.log); screenshots under `browser-results/`) |
| `@scale` chronicles journey, alone | 1 passed in 24 s after the pin moved **57 → 56**, attributed in [chronicle-expectation.md](chronicle-expectation.md): the Reedbound Council’s turn-40 draw lands on another template under the larger catalogue ([replay](chronicle-replay.txt)) ([log](browser-chronicles.log)) |

## What the tests found first

The first run named one template `event.first_winter`, an id the first
catalogue already uses; the content validator refused the duplicate and the
template is `event.early_winter`. The epochs test’s list of age-gated
events gained the four new ones. The roadmap bullet first landed in the
world-epochs item’s `remaining` list, which shares a line with its
`delivered` list; the roadmap test caught it locally and it was moved before
the commit. The pacing above was measured after the rename.

## Known limits

- Ninety templates against the scope's one hundred and fifty.
