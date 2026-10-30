# Reactive interception: a held counter answers a working as it is made — 2026-10-29

Rules/save 43. Local checkpoint; nothing in this packet is published.
Design: [ADR 0066](../../architecture/0066-reactive-interception.md).

## What was built

- `packages/sim/src/battle-abilities.ts`: `interceptor` (the first Unbinding
  source held automatic, on the other side, with a use, strain, round and an
  active escort within the counter's reach of the working caster's escort),
  the interception branch of `execute` (both casters pay strain, use and
  round; the target is untouched; a `battle_ability_used` event for the caster's
  realm says it was intercepted and a `battle_cast_intercepted` event for the
  watcher's; the recorded actions show the counter aimed at the caster's
  escort), `enemyWorkingPending` (a held counter waits in the automatic pass
  while an enemy caster could still work), and the observation's `intercepts`
  flag with the interception sentence composed onto Unbinding's description.
  Gated on the campaign rules (`rulesVersion(state) >= 43`) so chronicle replay
  of older archives resolves without it.
- Save version 43 with no field change and the same content pack; v42
  envelopes migrate unchanged. Rules 43 is registered in the chronicle, the
  persistence header, `createGame` and `measure-pacing`.
- `apps/web/src/battle.tsx`: a held counter's card says it is holding to
  intercept (`intercepting-<caster>`).
- Tests: two sim cases (a command-time working intercepted, its costs, the
  spent counter letting the next working land, save/load hash, archive replay,
  and the rules 42 projection letting the same working land; an automatic
  enemy working intercepted inside the round by a waiting counter, with archive
  replay) and a UI case; the browser journey
  `tests/gameplay/battle-interception.spec.ts`.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,309 tests / 285 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline headline-standard headline-long` | **385 / 343 / 229**, all Prosperity, 0 refused, 0 automatic refusals, command and event counts identical to the AI-wardens packet; only the state hash moves with the rules version ([log](pacing-after.log), [json](pacing-after.json)) |
| `pnpm measure:pacing … --rules=42` | reproduces the AI-wardens packet exactly, state hashes included ([log](pacing-rules42.log), [json](pacing-rules42.json)) |
| `pnpm build` | pass ([log](build.log)) |
| `playwright test tests/gameplay/battle-interception.spec.ts` | 1 passed ([log](browser-journey.log), [screenshot](browser-results/battle-interception-an-ene-7ceac-yer’s-working-as-it-is-made/intercepted-working.png)) |
| `playwright test tests/gameplay/city-growth.spec.ts` alone | 2 passed in 11 s ([log](browser-city-growth.log)); this spec had failed twice in the loaded runs below |

## The loaded full run, and why it is not repeated

Before the owner cut the methodology (see [`docs/TESTING.md`](../../TESTING.md)
and the [2026-10-30 packet](../2026-10-30-testing-methodology/README.md)), the
complete gameplay suite ran once at four workers while another checkout's
Playwright run and the desktop pushed the load average to about fifteen:
214 of 252 passed, 38 failed, 26 of them plain timeouts
([log](gameplay-full.log)). A `--last-failed` rerun at two workers passed 149
and left five ([log](browser-rerun.log)); a third rerun alone was stopped on
the owner's instruction ([partial log](browser-rerun-alone.log)). Of the five,
city-growth passes alone above, charter-templates and chronicles had passed
alone in earlier packets, and battle-performance and empire-delegation are
`@scale`-class measurement journeys that time out under load. None involves
battle magic. The result directories of those runs (about 290 MB of failure
screenshots and traces) are not kept; this is the last packet to record a
per-slice full run.

## Known limits

- The AI plays interception through the automatic policy alone; it neither
  baits a watcher nor withholds a working it knows will be answered.
- Only Unbinding answers; Flame has no reactive working.
- No headline realm fields two opposing casters with Unbinding, so organic
  interception is unobserved in measured AI play; the rule is proved by the
  authored battle fixtures and the browser journey.
