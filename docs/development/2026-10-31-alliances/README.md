# Alliances (rules/save 50) — 2026-10-31

Design: [ADR 0080](../../architecture/0080-alliances.md).

## What changed

- `packages/sim/src/alliances.ts`: the register (`pacts`, `offers`), the
  three commands, objections and acceptance blockers, `callAllies`,
  `advanceAlliances`, `observeAlliances`, `validateAlliances`,
  `assertNoAlliances`. `warfare.ts`: allies do not declare war on each other;
  a declaration calls the target's allies, each unless an oath, a binding
  peace, a supply agreement or an alliance with the attacker binds it.
  `clients.ts`: patronage is refused between allies. `diplomacy.ts`:
  `relation` exported for the breach memory. `save.ts`: save 50, the
  register sealed and hashed from rules 50, older envelopes upgraded with
  none; version plumbing in `rules.ts`, `simulation.ts`, chronicle,
  persistence and `scripts/measure-pacing.ts`.
- `packages/ai/src/diplomacy.ts`: allies protected; `answerAlliance`,
  `proposeAlliance` gated on `pressedByWar`; patronage never courts an ally;
  `index.ts` answers an offer before anything else, courts with the turn's
  orders, and counts a target's allies as enemies once it declares war.
- `apps/web/src/diplomacy.tsx`: the ally's standing in its encounter row,
  propose and renounce, an Allies section with incoming offers, and no war
  button against an ally.
- Tests: `packages/sim/src/alliances.test.ts` (offer, answer, term, allies
  kept from each other, patronage refused, expiry; the call answered, bound
  by a binding peace, bound by an alliance with both, never for an offensive
  war; refused across a war, re-checked on acceptance, breach remembered,
  saves and older envelopes), `packages/ai/src/alliances.test.ts`,
  `tests/gameplay/alliances.spec.ts` (accept from Realm affairs, the ally
  listed, war disabled, the journal). `save.test.ts` and
  `features-in-sight.test.ts` strip the register from synthetic legacy
  envelopes.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,339 tests / 291 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **359 / 314 / 222**, all Prosperity, 0 refused orders ([log](pacing-after.log), [json](pacing-after.json)); 10 / 6 / 8 pacts sworn |
| seeds 20260906 and 20260907 | Epic 341 / 339, Long 263 / 280, Standard 196 / 196, 0 refused orders ([log](pacing-seeds.log), [json](pacing-seeds.json)) |
| proxies | Epic 307, chronicle Epic 388, Long 333, Standard 189, all Prosperity, within bounds ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: alliances (new), diplomacy, attunement, epochs | 9 passed in 18 s ([log](browser-covering.log); screenshots under `browser-results/`) |
| `@scale` chronicles journey, alone | 1 passed in 23 s, the pin at 55 unmoved ([log](browser-chronicles.log)) |

The first AI appetite (any war, any stronger partner, three pacts each) swore
146 pacts on the Epic headline and ended the three paces of that seed on
441 / 338 / 237 with the chronicle Epic proxy at 504; it is recorded here and
was replaced by the pressed appetite before anything shipped.

## Known limits

- An ally called into a war makes its own peace; no shared peace, war aims,
  guarantees or passage rights.
- The AI's courtship reads only what is in sight: it cannot tell whether a
  prospective ally shares its enemy, since other realms' wars are not
  observed.
