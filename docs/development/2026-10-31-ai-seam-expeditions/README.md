# AI seam expeditions, and rules 44 re-prices the third path — 2026-10-31

Two slices in one packet, because the second was forced by measuring the first.
Design: [ADR 0068](../../architecture/0068-ai-seam-expeditions.md) (AI only) and
[ADR 0069](../../architecture/0069-attunement-repricing.md) (rules/save 44,
content prices only, no canonical field).

## Diagnosis

[seam-holding-diagnosis.ts](seam-holding-diagnosis.ts) replays a headline
campaign with the AI and, at chosen turns and at the end, lists for every realm
the seams it has found but does not hold: who owns the ground, how far the
realm's nearest hearth lies, and whether a claim quote exists.
[seam-holding-epic-before.txt](seam-holding-epic-before.txt) is the Epic
headline campaign (seed 20260905, twelve realms) under the glass-surveys AI:
three of twelve realms hold a seam at the end; every found-but-unheld seam
lies in nobody's borders, 11 to 79 hexes from the realm's nearest hearth, and
two lie inside another realm's borders at peace. None lay within claim reach
of a hearth. The assumed gap (conquest of a foreign seam) was the minority
case; the majority was that nobody settled beside the seams they found.

## What changed

- `packages/ai/src/arcane.ts`: `claimArcaneSeam` claims toward a found seam
  within four hexes of a hearth, one legal hex at a time, never toward a seam
  in another realm's borders; `seamExpeditionSite` and `planSeamExpedition`
  settle beside a farther seam in nobody's borders (free caravan given a saved
  road and held on it until it founds; otherwise a caravan raised at the
  nearest hearth once the purse covers the whole hearth and a company can quote
  the road; one expedition at a time, one quote a turn).
- `packages/ai/src/index.ts`: the expedition travels with the turn's other
  bounded orders; its hearth name, ground and founding fee are counted before
  any other caravan settles; city-states make none.
- `packages/content/src/progression.ts`: `SCHEMA43_CAMPAIGN_PACES` and
  `SCHEMA43_ATTUNEMENT_VICTORY` freeze the rules 22–43 and 38–43 definitions;
  `CAMPAIGN_PACES.epic.projectCoinCost` 36,000 → 44,000;
  `ATTUNEMENT_VICTORY.knowledgeCost` 600 / 1,200 / 2,400 → 3,600 / 6,000 /
  9,600 (Short 60 unchanged). `contentPackHash` takes the working definition so
  the frozen pack hash `f738e917` is reproducible.
- `packages/sim/src/progression.ts`: the pace table and the working's price
  are read by rules version. `packages/sim/src/save.ts`: save 44,
  `PRE_SEAM_PRICING_CONTENT_HASH`, v42 and v43 envelopes load unchanged under
  the new pack. Version plumbing in `rules.ts`, `simulation.ts`, the chronicle
  and persistence schemas and `scripts/measure-pacing.ts`.
- Tests: `packages/ai/src/attunement.test.ts` (expedition with a caravan, road
  held, hearth founded on arrival and the seam held; caravan raised only when
  affordable and quotable; foreign-border seam left alone; chain claims reach a
  seam four hexes out), `packages/sim/src/attunement.test.ts` (price by rules
  version, v43 envelope round trip), `packages/content/src/content.test.ts`
  (frozen hash `f738e917`, new prices), `packages/sim/src/pacing.test.ts`
  (rules 43 and 44 Epic price rows), `packages/ai/src/pacing-epic.test.ts`
  (maximum 450 → 550, re-derived from the tool).

## Pricing

[price-probe.ts](price-probe.ts) replays a headline campaign with candidate
prices substituted; [price-probe.txt](price-probe.txt) is every probe run.
Under the rules 43 prices the expedition AI ended the headline campaigns on
328 (Epic, Prosperity), 177 (Long, Attunement) and 127 (Standard, Attunement)
([log](pacing-expeditions-rules43-prices.log)). Standard: 1,800 → 180, 2,400 →
173, 3,000 → 188, 3,600 → 203. Long: 3,600 → 239, 4,800 → 270, 6,000 → 300.
Epic: Hearth Exchange 40,000 → 350 and 44,000 → 369, with Attunement at 9,600
or 12,000 making no difference because no Epic realm reached the path.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,318 tests / 285 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass after the Epic proxy bound was re-derived ([log](tests-campaigns.log)); the first run failed that one bound at 450 |
| `pnpm measure:pacing headline standard long` (rules 44) | **369 / 300 / 203**: Prosperity, Attunement, Attunement; 0 refusals ([log](pacing-after.log), [json](pacing-after.json)) |
| proxies, rules 44 | Epic 473, chronicle Epic 452, Long 357, Standard 263, all Prosperity ([log](pacing-proxies-rules44.log), [json](pacing-proxies-rules44.json)) |
| proxies, rules 43 prices under the same AI | Epic 355, chronicle Epic 410, Long 357, Standard 263 ([log](pacing-proxies-rules43.log), [json](pacing-proxies-rules43.json)) |
| seam-holding replay, Epic headline, expedition AI | every found seam held at the end; 8 of 12 realms hold a path ([after](seam-holding-epic-after.txt), [before](seam-holding-epic-before.txt)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: attunement, arcane-seams, seam-warding | 6 passed in 15 s ([log](browser-covering.log)) |
| `@scale` chronicles journey, alone | 1 passed in 23 s, AI-watch victory turn unchanged ([log](browser-chronicles.log)) |

The seam-holding "after" replay was made under the rules 43 prices and ends on
turn 328; it is the measurement that forced the re-pricing, kept as such.

## Known limits

- One seed and one culture (Glass Tide) reach the third path in headline play;
  three seeds per pace, as earlier pacing checks used, are not measured here.
- A seam of the missing path inside another realm's borders is not pursued by
  conquest or cession; that is now the measured gap and the next slice.
- The Epic Attunement price is scaled, not measured: no Epic headline realm
  reached the path at 9,600 or 12,000.
- An expedition caravan whose seam is claimed by another realm before it
  arrives is released to ordinary expansion; it is not sent home.
