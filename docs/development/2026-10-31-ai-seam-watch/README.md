# AI seam hearth watch, and rules 45 re-prices the third path — 2026-10-31

Two slices in one packet, because the second was forced by measuring the first.
Design: [ADR 0073](../../architecture/0073-ai-seam-watch.md) (AI only) and
[ADR 0074](../../architecture/0074-attunement-repricing-45.md) (rules/save 45,
content prices only, no canonical field).

## Diagnosis

[seam-siege-defense-probe.ts](seam-siege-defense-probe.ts) replays a headline
campaign and reports, for every siege of a hearth whose borders hold a seam,
what its holder could do about it: garrison, ward, casters and where they are
lodged, rites with their blockers, ashglass, discoveries and whether the home
watch covers the hearth. [Before](seam-siege-defense-epic-before.txt), Epic
headline under the seam column AI: fourteen such sieges, one turn under a
ward. Glass Tide's Rune seam hearth is besieged seven times by companies of
eight to forty strength against an empty hearth its home watch omits; its one
Waykeeper is lodged at the Flame seam hearth, so no rite can be worked from
the Rune one.

## What changed

- `packages/ai/src/theaters.ts`: `planSeamWatch` — once the realm holds a
  seam hearth, its own home watch (`HOME_WATCH_NAME`) adopts it and one spare
  company per hearth the watch is short, with a bounded route review; up to
  four hearths; other hearths, reserve and policy kept; nothing rewritten when
  every held seam hearth is watched; a theater under another name is left
  alone. `packages/ai/src/index.ts` issues it when no watch is being created.
- `packages/content/src/progression.ts`: `SCHEMA44_ATTUNEMENT_VICTORY` freezes
  the rules 44 working; `ATTUNEMENT_VICTORY.knowledgeCost` 3,600 / 6,000 /
  9,600 → 7,200 / 12,000 / 18,000 (Short 60 unchanged). The pace table is
  unchanged.
- `packages/sim/src/progression.ts`: the working's price by rules version
  (38–43, 44, 45). `packages/sim/src/save.ts`: save 45,
  `PRE_SEAM_WATCH_PRICING_CONTENT_HASH` = `88b0823d`, v44 envelopes load
  unchanged under the new pack. Version plumbing in `rules.ts`,
  `simulation.ts`, the chronicle and persistence schemas and
  `scripts/measure-pacing.ts`.
- Tests: `packages/ai/src/attunement.test.ts` (the watch adopts the seam
  hearth and a spare, the whole turn carries the order, the simulation accepts
  it, nothing is rewritten afterwards, a player's theater is left alone),
  `packages/sim/src/attunement.test.ts` (price by rules version 43 / 44 / 45;
  v43 and v44 envelope round trips), `packages/content/src/content.test.ts`
  (frozen hash `88b0823d`, new prices), `packages/sim/src/pacing.test.ts`
  (rules 45 Epic price row).

## Pricing

[price-probe.txt](price-probe.txt) is the sweep under the watch AI
(`price-probe.ts` from the rules 44 packet, run from the scratchpad). At the
rules 44 prices the headline campaigns ended on **283 / 226 / 148**, all by
Attunement, Sepulchral Synod ([log](pacing-after.log), [json](pacing-after.json)).
Standard: 4,800 → 167, 6,000 → 183, 7,200 → 201. Long: 8,400 → 255, 9,600 →
272, 12,000 → 306. Epic: 12,000 → 304, 14,400 → 324, 18,000 → 352, 21,600 → 378; 18,000
keeps the ladder's shape (1 : 1.67 : 2.5) and the band's lower half. Every sealed working raced a Prosperity
bid already started.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,323 tests / 285 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` (rules 45) | **352 / 306 / 201**, all Attunement, 0 refusals ([log](pacing-rules45.log), [json](pacing-rules45.json)) |
| proxies, rules 45 | Epic 372, chronicle Epic 393, Long 307, Standard 199, all Prosperity, within their bounds ([log](pacing-proxies-rules45.log), [json](pacing-proxies-rules45.json)) |
| seam-hearth sieges, Epic, under the watch at rules 44 prices | five sieges against four before the end on 283 ([after](seam-siege-defense-epic-after.txt)); seam hearth losses ([after](seam-hearth-loss-epic-after.txt)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: attunement, arcane-seams, seam-warding | 6 passed in 16 s ([log](browser-covering.log)) |
| covering journeys: defense theaters, theater recovery | 5 passed in 20 s ([log](browser-theaters.log)) |
| `@scale` chronicles journey, alone | 1 passed in 24 s ([log](browser-chronicles.log)) |

## Known limits

- The watch does not garrison every seam hearth at once; a hearth whose guard
  has not arrived can still fall (Glass Tide, Epic, turn 191 under the watch).
- The Epic replays under the watch were made at the rules 44 prices and end on
  283; they are the measurements that forced the re-pricing, kept as such.
- One seed; Sepulchral Synod is the realm that reaches the path on every pace.
  Three-seed coverage per pace is not measured here.
- A warden for every seam hearth (rites 40–42) is not built.
