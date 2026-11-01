# A patron stands for its client (rules/save 58) — 2026-10-31

Design: [ADR 0088](../../architecture/0088-guarantee.md).

## What changed

- `packages/sim/src/alliances.ts`: `callPatron` — a war declared on a client
  calls its patron unless an oath, a binding peace, a supply agreement or an
  alliance with the attacker binds it (`patronage_answered` /
  `patronage_unanswered` to all three parties); the call is kept in the
  register so the client's peace ends the patron's war (rules 56) and the
  patron's own peace releases it. `warfare.ts`: the declaration calls the
  patron after the allies and records the war memory. `save.ts`: save 58,
  the v57 schema and branch under the same pack; version plumbing in
  `rules.ts`, `simulation.ts`, chronicle, persistence and
  `scripts/measure-pacing.ts`.
- `packages/ai/src/index.ts`: a realm declaring war counts the target's
  patron among its enemies for the batch.
- `apps/web/src/diplomacy.tsx`: the patron's and the client's lines say what
  the bond now means; the Allies section shows whenever the realm has a call,
  and the call line names the realm's client or ally.
- Tests: `packages/sim/src/clients.test.ts` (the patron answers; the client's
  peace ends the patron's war; a binding peace with the attacker leaves the
  patron out and says why; nothing under rules 57),
  `tests/gameplay/guarantee.spec.ts` (the guarantee in Realm affairs, the
  call line, the journal).

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,349 tests / 294 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **411 / 336 / 209**, Attunement / Prosperity / Attunement; one refused survey order on Standard at turn 71, the recorded same-batch race ([log](pacing-after.log), [json](pacing-after.json)) |
| seeds 20260906 and 20260907 | Epic 351 / 313, Long 285 / 246, Standard 218 / 175, 0 refused orders ([log](pacing-seeds.log), [json](pacing-seeds.json)) |
| proxies | Epic 358, chronicle Epic 451, Long 302, Standard 204, all Prosperity, within bounds ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| [guarantee-probe.ts](guarantee-probe.ts), Epic and Long headline | Epic: **18 guarantees answered**, 19 unanswered for a binding reason, 17 allied peaces; Long: 19 and 13, 13 allied peaces ([epic](guarantee-probe-epic.txt), [long](guarantee-probe-long.txt)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: guarantee (new), allied peace, alliances, diplomacy | 8 passed in 19 s ([log](browser-covering.log); screenshots under `browser-results/`) |
| `@scale` chronicles journey, alone | 1 passed in 23 s, the pin at 54 unmoved ([log](browser-chronicles.log)) |

## Known limits

- A patron is called whatever its strength or distance from the war; a
  client's peace ends the patron's war whatever the patron's own grievances.
  Passage rights and joint war aims remain unbuilt.
- The Epic headline course ends on 411, above its band, with the other Epic
  seeds below it; the spread of the measured world stands as recorded.
