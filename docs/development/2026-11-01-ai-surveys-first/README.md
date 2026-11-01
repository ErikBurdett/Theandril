# AI surveys before the march — 2026-11-01

AI only; no rule, save field or content seal changes.
Design: [ADR 0117](../../architecture/0117-ai-surveys-first.md).

## What changed

- `packages/ai/src/index.ts`: `surveysBeforeMarches` issues each survey
  mission, with the assignment that carries its surveyor, just before the
  batch's first march, hoisting the carrier's own training, glass search
  and depot orders ahead of it; every other order keeps its place.
- Tests: `packages/ai/src/characters.test.ts` (a synthetic batch keeps its
  order with the survey moved before the first march and the carrier's
  orders hoisted; a surveyor riding the attunement fixture's company sees
  every survey issued before any march; the train-before-refit order of
  the existing test is kept).

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,389 tests / 314 files pass** on the rerun ([the first run](tests-unit-first.log) passed too, before the rule was narrowed) ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass on the rerun ([the first run](tests-campaigns-first.log) failed four with the refused training and depot orders) ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **402 / 307 / 199** (350 / 281 / 199 under the AI offices), **0 refused orders** on every course: the headline Epic course ends two turns over its nominal 350–400 band as a redraw of the campaign with its surveys now succeeding, Long and Standard in band; [the first run](pacing-after-first.log) of the front-loaded rule refused a glass search and a depot instead ([log](pacing-after.log), [json](pacing-after.json)) |
| seeds 20260906 and 20260907 | Epic 331 / 359, Long 288 / 284, Standard 200 / 203, 0 refused orders: identical to the AI offices measurement, the first Epic seed nineteen under its band ([log](pacing-seeds.log), [json](pacing-seeds.json)) |
| proxies | Epic 334, chronicle Epic 423, Long 295, Standard 200, 0 refused orders, within the proxy bounds (the campaigns project passed on them) ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: characters, characters-tree | 7 passed in 45 s, after the characters-tree journey was corrected (below) ([log](browser-covering.log); screenshots under `browser-results/`) |
| `@scale` chronicles journey, alone | 1 passed in 26 s, the pin at 57 unmoved; [the replay](chronicle-replay.txt) shows the watch campaign issuing the same 970 commands (no survey meets a march in it) ([log](browser-chronicles.log)) |

## What the tests found first

The first ordering moved every field mission to the front of the batch.
It broke the existing train-before-refit order, and its first full run
([unit](tests-unit-first.log), [campaigns](tests-campaigns-first.log),
[pacing](pacing-after-first.log)) refused the carrier's own later orders
instead — *Finish or cancel the army's active field mission before
training*, *This company has already spent its movement this turn* for a
glass search and a depot — failing four campaign tests and adding refused
orders to every headline course. The rule was narrowed to surveys placed
just before the first march with the carrier's own orders hoisted ahead,
and the runs below are the rerun. The first test drove the character
fixture, which plans no survey in thirty rounds; it now drives the
attunement fixture with a surveyor riding its company and a synthetic
batch.

## The characters-tree journey

`tests/gameplay/characters-tree.spec.ts` has failed since rules 64 (notable
characters, `da4b8ab`), unnoticed because it runs only in the complete
gameplay suite: its veteran was the realm's first marshal, who under rules
64 is the culture's notable figure and starts with a specialization that
excludes half the tree, so *Promote Decisive orders* read *excluded*. The
failure reproduces at `HEAD` without this slice's change. The journey now
appoints two marshals and takes the second, the ordinary veteran it was
written for; no assertion changed. The whole-suite checkpoint that would
have caught it earlier remains the owner's to call.

## Known limits

- The quote is still taken on the planning observation; refusals the
  batch creates for other reasons are not prevented.
