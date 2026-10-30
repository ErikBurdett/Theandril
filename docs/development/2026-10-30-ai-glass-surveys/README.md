# AI surveys the glass, and two save repairs — 2026-10-30

AI only, plus two validation repairs in `packages/sim`. No rules, content or
save-format change. Design: [ADR 0067](../../architecture/0067-ai-glass-surveys.md).

## Diagnosis

[arcane-diagnosis.ts](arcane-diagnosis.ts) replays a campaign with the AI and
reports each realm's surveys (found, empty, on or off glass), the seam paths it
found and holds, its Arcane Theory discoveries and any Attunement it started.
Before the change, the Epic headline campaign (seed 20260905, twelve realms)
held eleven seams over the two paths; the AI made 312 surveys, found 12 seams,
and eight realms surveyed 200 times without a find because the first-seam
planner surveyed blind ground near hearths. Glass Tide started an organic
Attunement at turn 353 under the rules 43 AI (the prosperity winner at 385
ended it). That baseline output is reproduced in the prompt report; the
after-change outputs are [arcane-diagnosis-after.txt](arcane-diagnosis-after.txt)
(headline) and [arcane-diagnosis-proxy.txt](arcane-diagnosis-proxy.txt) (the
four-realm proxy). [arcane-diagnosis-proxy-intermediate.txt](arcane-diagnosis-proxy-intermediate.txt)
is the proxy under an intermediate version of the change, in which Reedbound
Council sealed an Attunement at turn 332: the first organic third-path seal
observed. It is kept as an observation, not as a property of the final code.

## What changed

- `packages/ai/src/arcane.ts`: `planArcaneSurvey` requires fresh glass within
  the survey's reach, ranks companies by the glass their survey would cover,
  surveys at once from glass underfoot and otherwise on the six-turn cadence,
  excludes caravans, routed companies and besiegers; `planGlassApproach` also
  marches realms with no seam; a realm that has found a seam of every path
  surveys no more.
- `packages/sim/src/rites.ts`: a ward is valid on load through its last round
  (`expiresTurn >= turn`), matching `advanceWards`, which dissolves it at the
  next resolution.
- `packages/sim/src/save.ts`: a format-10 battle snapshot is validated against
  the save's rules version rather than a frozen 16, so a Waykeeper's learned
  path deepening (rules 38) loads in a pending battle and in battle reports.
- Tests: `packages/ai/src/attunement.test.ts` (no-seam realm surveys only
  within reach of glass, on cadence or at once from glass underfoot, marches
  otherwise; a realm that found every path stops), six AI tests whose fixtures
  assumed the blind cadence, `packages/sim/src/rites.test.ts` (save in the last
  round) and `packages/sim/src/battle-abilities.test.ts` (deepened caster saved
  during and after a battle). Both sim tests failed before their repair.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,311 tests / 285 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)); the proxy Epic chronicle campaign had exposed both save defects |
| `pnpm measure:pacing headline standard long` | **354 / 316 / 224**, all Prosperity, 0 refusals; surveys 170/172/151 (were 312/271/146), seams found 19/21/14 (were 12/9/5), Arcane Theory discoveries 5/6/3 (were 9/9/6) ([log](pacing-after.log), [json](pacing-after.json)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: arcane-seams, attunement, seam-warding | 6 passed in 20 s ([log](browser-covering.log)) |

Earlier measurements during the work, not retained as files: without the
cadence the headline ran 347/303/216 with 266/300/236 surveys; with the
cadence but before surveys stopped at every path found, 385/333/240 with
339/407/280 surveys.

## Known limits

- The AI claims a found seam only inside its own borders; a seam of the missing
  path in another realm's borders is not pursued by conquest or cession, which
  is the measured gap to the third path in headline play.
- Pacing moved with the campaigns, not by pricing; Standard remains above its
  200-turn target as it has since rules 38.
