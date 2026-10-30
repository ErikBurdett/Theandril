# Testing second pass, AI glass surveys and two save repairs — 2026-10-30

## Prompt

"okay go ahead and continue development and fix anything that needs to be
fixed in the testing"

## Delivered

- Testing: the faction roster spec's eighteen founding journeys became one
  witness journey plus content checks inside the all-cultures sweep (15 s
  instead of 621 s); the 52 committed trace archives (405 MB) left the tree.
  Projects list 203 ordinary and 32 scale journeys. Commit `4a06420`.
- AI realms survey for seams only where fresh Ashfall glass lies within reach,
  march to glass in sight and stop once a seam of every path is found. The
  headline campaigns find 19/21/14 seams for 170/172/151 surveys against
  12/9/5 for 312/271/146, and run 354/316/224 turns.
- Two save defects repaired: a campaign could not be loaded during the last
  round of a seam rite, nor during or after a battle fought by a Waykeeper
  with a learned path deepening. Both now load, with regression tests that
  failed before the repair.
- Observed, not claimed: under the rules 43 AI Glass Tide started an organic
  Attunement at turn 353 of the Epic headline campaign, and an intermediate
  version of this change saw Reedbound Council seal one at turn 332 of the
  proxy campaign. The final version's campaigns resolve by Prosperity.

## Changed

- AI: `packages/ai/src/arcane.ts`; tests `attunement.test.ts`, `ai.test.ts`
  (unchanged after caravans were excluded), `naval-funding.test.ts`,
  `naval-outlets.test.ts`, `patrol-retirement.test.ts`, `roads.test.ts`,
  `theaters.test.ts`.
- Sim: `packages/sim/src/rites.ts`, `packages/sim/src/save.ts`; tests
  `rites.test.ts`, `battle-abilities.test.ts`.
- Tests: `tests/gameplay/faction-roster.spec.ts`.
- Docs: `docs/architecture/0067-ai-glass-surveys.md`,
  `docs/IMPLEMENTATION_STATUS.md`, `docs/1.0-DEVELOPMENT.md` (M7 and the
  verification section), `docs/TESTING.md`, `CHANGELOG.md`,
  `apps/web/src/updates/library.ts` (delivered 107), `roadmap.test.ts`,
  `docs/updates/ai-glass-surveys-release-expectations.json`.
- Evidence: `docs/development/2026-10-30-ai-glass-surveys/`, the second-pass
  section of `docs/development/2026-10-30-testing-methodology/README.md`.

## Verified

- Per `docs/TESTING.md`: typecheck, lint, unit 2,311 tests / 285 files,
  campaigns 57, build, six covering journeys (arcane seams, attunement, seam
  warding) and three headline pacing runs; logs in the evidence packet. No
  complete browser suite ran.
- The diagnosis replays are retained as a script and its outputs.

## Left open

- AI pursuit of a found seam in another realm's borders (conquest or cession):
  the measured gap to the third path.
- Standard pacing above its 200-turn target, as since rules 38; not tuned.
- Purging the e103a72 history; the other session's uncommitted edits to the
  pages and production Playwright configs and its reliability packet.
- Publication: recorded below once the deploy is verified.
