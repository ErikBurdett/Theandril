# Seam kindling: the Flame hearth rite — 2026-10-29

Rules/save **42**. Local checkpoint; nothing in this packet is published.
Design: [ADR 0064](../../architecture/0064-seam-kindling.md).

## What was built

- `packages/content`: `rite.seam_kindling` (discovery `arcane.ember_projection`,
  Flame at the first degree, six ashglass, ten turns, kind `kindling`,
  `sinceRules: 42`), appended so sealed packs keep their order; validation that
  every non-breaking rite lasts a term; the rules 41 seal **78df970c** named by
  `PRE_KINDLING_CONTENT_HASH`.
- `packages/sim`: `isWarded` now means a warding and `isKindled` a kindling;
  `burnBesiegers` wears every besieging company by four strength per formation
  each turn, never below a fifth of its ranks, before the siege works, and tells
  both realms (`siege_burned`); the besieger's siege observation carries
  `kindled`. Save version 42 with no state change; `saveV41Schema` migrates a
  rules 41 envelope unchanged; rules 41 refuses the rite as unknown.
- `packages/ai`: a besieger lifts a siege before kindled walls it cannot storm,
  as it does before warded ones; `planRites` already kindles when besieged.
- `apps/web`: the ledger and siege cards read `· kindled` and the besieger's
  card explains the burn.
- `scripts/measure-pacing.ts` accepts `--rules=42`.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint`, `pnpm content:validate` | pass ([log](typecheck-lint.log)) |
| `pnpm vitest run --project unit` | **2,302 tests / 284 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass on the rerun ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline headline-standard headline-long` | **362 / 327 / 227**, all Prosperity, 0 refused, 0 automatic refusals, command and event counts identical to the ward-breaking packet, no rite in organic play ([log](pacing-after.log), [json](pacing-after.json)) |
| same with `--rules=41` | **362 / 327 / 227**; seals `246a5b75` / `ad366a9c` / `0d9b89ec` equal the ward-breaking packet ([log](pacing-rules41.log), [json](pacing-rules41.json)) |
| `pnpm build` | pass ([log](build.log)) |
| complete gameplay suite | **251 of 251 pass** in 25.6 minutes ([log](gameplay-full.log)); the all-pass results directory was not retained |
| production suite on the fresh bundle | **59 of 59 pass** ([log](production.log)) |
| `tests/gameplay/seam-warding.spec.ts` (three rite journeys) | warding and breaking pass on the first run ([log](browser-affected.log)); the kindling journey first failed on its own fixture, because the fixture's single 16-strength column rightly lifted the kindled siege, and then on a formation id that was not a runtime entity id; with two full guard companies at morale 28 (held, not assaulted, when the AI acts) it **passes** ([log](browser-rerun.log), screenshots `kindling-performed.png` and `kindled-ledger.png` under [browser-rerun-results](browser-rerun-results/)) |
| affected journeys (attunement, characters, conquest, subject rule) | all seven pass on the first run ([log](browser-affected.log)) |

New tests: the rules 42 case in `packages/sim/src/rites.test.ts` (offer, rules 41
refusal, unresearched discovery, burn and floor, walls still wearing, term
lapse, breaking a kindling, v41 migration), the kindling case in
`packages/ai/src/rites.test.ts`, the kindled ledger in
`apps/web/src/magic.test.tsx`, the rules 41 seal in
`packages/content/src/content.test.ts`, and the kindling journey in
`tests/gameplay/seam-warding.spec.ts`.

## Limits and caveats

- The first campaign-suite run of this checkpoint failed every file with
  `Unknown system error -122` (EDQUOT): the machine's `/tmp` is a tmpfs with a
  per-user quota, mostly held by other sessions' checkouts; the suites were
  rerun with `TMPDIR` on the main disk; the failed first log was overwritten by
  the rerun and is not retained.
- Kindling burns companies, not fleets or carried troops, and leaves morale
  alone; the AI does not position a Flame caster to kindle in advance, and no
  headline realm performs any rite.
- The roadmap catalogue describes the delivery but links no evidence from this
  packet, because the catalogue pins evidence to a committed revision.
