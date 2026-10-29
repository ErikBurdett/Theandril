# Cession between patron and client — 2026-10-29

Rules/save **39** (shared with subject rule). Local checkpoint; nothing in this
packet is published. Design: [ADR 0059](../../architecture/0059-cession.md).

## What was built

- `packages/sim/src/cession.ts`: `cedeSettlement`, `cessionObjection` and the
  per-hearth `cessionOptions` observation (each bound realm with the first
  failing reason). The hearth keeps its people, buildings, devastation and land;
  production orders are cancelled, its charter and muster end, and the ordinary
  capture reconciliation (land, sight, policies, capitals, groups, theaters,
  supply agreements, missions, roads, every realm's land memory) runs afterwards.
- `packages/sim/src/simulation.ts`: the rules-39 command, dispatch and the
  post-command hooks that captures already use.
- `packages/sim/src/characters.ts`: `charactersLodgedIn`.
- `apps/web/src/land.tsx`: the "Under the oath" section with one control per
  bound realm, its blocker, and a confirm/keep step before the order is issued.
- `packages/test-fixtures/src/victory-fixture.ts`: `patronageCampaign()` — the
  unification world with the player as patron of its three-hearth rival, the oath
  sworn by ordinary offer and acceptance.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([lint log](lint.log)) |
| `pnpm test:unit` | 2,285 tests / 279 files pass ([log](tests-unit.log)) |
| `tests/gameplay/cession.spec.ts` | first run failed before the panel opened because the journey did not open the hearth's orders ([log](browser.log)); the corrected journey passes ([log](browser-rerun.log), screenshots under [browser-results](browser-results/)) |
| `land.spec.ts`, `charters.spec.ts`, `hearth-development.spec.ts` | 6 passed ([log](browser.log)) |
| Pacing | not measured: the AI issues no cession, so no AI campaign can change |

New tests: `packages/sim/src/cession.test.ts` (both directions, kept population,
buildings and land, ended charter, unchanged treasuries, exact save round trips,
every refusal, absence from older rules) and the browser journey above.

## Limits

No AI realm cedes a hearth. The cession control lives in the hearth panel only;
no registry batch exists. A receiver cannot refuse a hearth.
