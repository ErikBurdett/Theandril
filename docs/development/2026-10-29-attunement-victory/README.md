# Attunement victory and personal path growth — 2026-10-29

Rules/save **38**. Local checkpoint; nothing in this packet is published.
Design: [ADR 0057](../../architecture/0057-attunement-victory.md).

## What was built

- `packages/content`: `ATTUNEMENT_VICTORY` (knowledge price 60/600/1,200/2,400 by
  pace, archive host, second-degree caster) and two Waykeeper skills,
  `skill.flame_deepening` / `skill.rune_deepening` (branch `attunement`, 24
  experience, no prerequisites, once each). The sealed pack is **03ac0328**;
  `contentPackHash(…, attunement = false)` reproduces the rules 24–37 seal
  **015468d1**, which `PRE_ATTUNEMENT_CONTENT_HASH` now names.
- `packages/sim`: `startAttunement { settlementId, characterId }`; requirements,
  pause reasons, cancellation, victory `path: 'attunement'`, ledger validation
  and the `progression.attunement` observation (paths held, discoveries, hosts,
  casters with exact blockers, eligible hosts, blockers). Promotion through a
  path skill raises `aptitudes[pathId]` by one to at most three; a learned
  deepening below the second degree is rejected on load. Save version 38, v37
  migration, historical refusal (`assertNoAttunement`) for projection, hashing
  and command execution at ≤37; older command schemas never accept the command.
- `packages/ai`: ready-working start at the safest eligible host; caster brought
  home by `queueMovement` with the company held; uncastable discovery research
  once every seam path is held; further surveys only from unsurveyed Ashfall
  glass, every twelve turns above a 160-coin surplus, while a path is missing;
  seam claims for missing paths.
- `apps/web`: Victory tab section with every requirement, host and caster
  selects and a disabled-with-reasons seal button; public ledger labels; victory
  banner; chronicle epilogue; *Attunement* skill branch label.
- `scripts/measure-pacing.ts` accepts `--rules=38`; `holdSurveyedSeam` takes a
  path and claims along the shortest passable ground.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint`, `pnpm content:validate` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | 2,275 tests / 276 files pass after the compendium regeneration and two assertion updates (19 skills; Waykeeper deepening tree) |
| `pnpm test` (unit, campaigns, repository) | 2,528 of 2,529 tests / 306 of 307 files pass ([log](tests-full.log)); the one failure is the existing 20-second Git-history changelog test timing out under full concurrency, which passes unchanged in isolation in 10.75 seconds ([log](changelog-isolated.log)). All 2,529 distinct tests have passing results; no timeout or assertion changed. |
| `pnpm test:campaigns` | 57 tests / 10 files pass, unchanged pacing proxies ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline headline-standard headline-long` | **219 / 329 / 374**, all Prosperity, 0 refused, 0 automatic refusals ([log](pacing-after.log), [json](pacing-after.json)) |
| same with `--rules=37` | **219 / 329 / 374**; seals `cfb8ef59` / `61983fb7` / `fc0228a5` equal the 2026-10-25 land-commission evidence; identical command and event counts to the rules 38 runs ([log](pacing-rules37.log), [json](pacing-rules37.json)) |
| `tests/gameplay/attunement.spec.ts` | 2 passed ([log](browser-attunement.log), screenshots under [browser-results](browser-results/)) |
| affected existing journeys (arcane seams, chronicles, character trees, characters, specialist roster, progression tree, diplomacy, next action) | 23 of 24 pass ([log](browser-affected.log)); the AI-watch chronicle journey's turn-59 expectation was stale on the unchanged code ([note](chronicle-expectation.md)) and now reads 60; the corrected chronicles and attunement journeys pass on rerun ([log](browser-rerun.log)) |
| `pnpm build` | pass ([log](build.log)) |

New tests: `packages/sim/src/attunement.test.ts` (seal, sustain, win, replay;
caster/seam/occupation pauses and host-loss cancellation; refusals and
historical rules; path deepening and its save validation),
`packages/ai/src/attunement.test.ts` (ready start, uncastable research,
caster routing, further surveys and claims), the Victory-tab render test in
`apps/web/src/progression.test.tsx`, and the fixture `attunementCampaign()` in
`packages/test-fixtures/src/victory-fixture.ts` (seed 20260906, tiny, two
realms, short pace; research, appointment and deepening are ordinary commands).

## Limits and caveats

- No AI realm reaches Attunement in the measured headline campaigns: none holds a
  seam of both paths, and `researchArcane` is never bought there. The third path
  is proven by its authored brink fixture and real controls, not by organic AI
  play. AI pursuit is opportunistic; planned seam conquest and caster protection
  are open.
- The fixture's seams lie beyond a hearth's ordinary claim reach; the helper
  claims connected ground to them. The AI seam-claim test therefore moves a real
  frontier quote onto the seam rather than pretending the far seam is claimable.
- Surveys per campaign are unchanged from rules 37 (347/303/231 on the three
  headline paces, almost all empty): the pre-existing first-seam survey cadence
  dominates and is not altered by this checkpoint.
- Two magical paths exist, so "every path" is two seams; the rule reads
  `MAGIC_PATHS` and will demand more as paths are authored.
- The public roadmap catalogue describes the delivery but links no evidence from
  this packet, because the catalogue pins evidence to a committed revision and
  this checkpoint is uncommitted.
- Observation cost grows by one pass over the world's seams (≤64) against the
  realm's settlements and one pass over its Waykeepers per observation; this is
  bounded and was not separately measured.
