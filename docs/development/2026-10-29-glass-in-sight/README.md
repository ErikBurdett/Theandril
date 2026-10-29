# Ground in sight: natural features, remembered surveys and the AI's glass — 2026-10-29

Rules/save **39** (shared with subject rule and cession). Local checkpoint;
nothing in this packet is published. Design: [ADR 0060](../../architecture/0060-ground-in-sight.md).

## What was built

- `packages/sim/src/simulation.ts`: `featureMask` on explored cells in sight
  (rules 39, nonzero only, remembered ground omitted); the attunement standing
  travels only once a realm has begun the arcane road (`attunementAvailable`
  marks the path's existence).
- `packages/sim/src/arcane-sites.ts`: the `arcaneSearches` register (bounded 256,
  oldest first, repeat moves to newest), its observation and validation;
  `save.ts` schema, migration, projection stripping and historical refusal.
- `apps/web/src/cell-transfer.ts`: packet versions 4–6 fold a seven-bit feature
  mask into spare terrain/depth bits; masks beyond that fall back to metadata.
- `apps/web/src/map-management.tsx`: the survey panel states surveyed / glass / bet.
- `packages/ai/src/arcane.ts`: remembered ground, no-cadence further surveys on
  fresh glass, `planGlassApproach` with movement previews; `index.ts` holds the
  marching company for the pass.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([lint log](lint.log)) |
| `pnpm test:unit` | 2,290 tests / 281 files pass ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline headline-standard headline-long` | **362 / 327 / 227**, 0 refused ([log](pacing-after.log), [json](pacing-after.json)); surveys 347/303/231 → 253/222/159, seams found 4/3/3 → 9/6/3, glass marches 29/23/14, no arcane research or working |
| Observation cost | Huge starting summary 19,156 (rules 37) → 19,183 (38) → 19,203 bytes (39); headline map after 50 AI rounds +0.1–0.3% JSON bytes ([measure-observation.ts](measure-observation.ts), [log](measure-observation.log)) |
| `campaign.spec.ts` (Huge budget), `arcane-seams`, `attunement`, `chronicles`, `progression-tree` | 10 passed ([log](browser.log)); the Huge starting packet is back under 20,000 bytes |
| `pnpm build` | pass ([log](build.log)) |

Retained corrections: the first glass march ignored movement previews (176
refused orders on the Epic headline, the earlier [pacing log](pacing-after.log)
was overwritten by the corrected run and the refusal is recorded in the status
entry); a per-world feature cache broke the historical feature seals and was
removed; metadata-row features pushed the Huge starting packet to 21,216 bytes
against its 20,000-byte budget, which led to the folded packet and the gated
attunement standing.

New tests: `packages/mapgen/src/feature-cache.test.ts` (features deterministic
and bounds-checked), `packages/sim/src/features-in-sight.test.ts` (visible-only
masks; the register's order, bound, save round trip, projection refusal and v38
migration), and the glass-march and remembered-ground cases in
`packages/ai/src/attunement.test.ts`.

## Limits

The map draws no natural features. A realm with no seam keeps the six-turn
survey cadence near its hearths. No AI realm researched Arcane Theory or sealed
a working in the headline campaigns.
